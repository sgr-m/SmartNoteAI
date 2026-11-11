/**
 * vectorDiagramService.ts — Code-to-Vector Diagram Rendering Engine
 * 
 * Supports auto-detection and SVG generation for:
 * 1. Flowcharts, DFD, UML: Mermaid.js
 * 2. Mathematical Graphs: Function Plot (Cartesian 2D curves, parabolas, polynomials, trig, exponential)
 * 3. 2D Geometry: JSXGraph-style geometric vector figures (triangles, angles, circles, polygons)
 * 4. Digital Logic Circuits: CircuitikZ-style vector schematic diagrams (AND, OR, NOT, XOR, inputs/outputs)
 * 5. Timing Diagrams: WaveDrom-style digital clock & waveform timing pulses
 * 6. Mathematical Illustrations: TikZ-style coordinate path drawings
 */

import mermaid from 'mermaid';

export type DiagramType = 'mermaid' | 'graph' | 'geometry' | 'circuit' | 'timing' | 'tikz' | 'chart';

export interface ChartSpec {
  type: 'chart' | 'bar' | 'line' | 'pie';
  chartType?: 'bar' | 'line' | 'pie';
  title?: string;
  labels: string[];
  values: number[];
  xLabel?: string;
  yLabel?: string;
  width?: number;
  height?: number;
}

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface GraphSpec {
  type: 'graph';
  title?: string;
  expressions: string[];
  xRange?: [number, number];
  yRange?: [number, number];
  axes?: boolean;
  grid?: boolean;
  width?: number;
  height?: number;
}

export interface GeometrySpec {
  type: 'geometry';
  title?: string;
  shapes: Array<{
    kind: 'triangle' | 'circle' | 'polygon' | 'angle' | 'line' | 'vector';
    points?: number[][];
    center?: number[];
    radius?: number;
    label?: string;
    color?: string;
    fill?: string;
    rightAngle?: boolean;
  }>;
  width?: number;
  height?: number;
}

export interface CircuitSpec {
  type: 'circuit';
  title?: string;
  gates?: Array<{
    type: 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'BUFFER';
    x: number;
    y: number;
    label?: string;
    inputs?: string[];
    output?: string;
  }>;
  width?: number;
  height?: number;
}

export interface TimingSpec {
  type?: 'timing';
  signal: Array<{
    name: string;
    wave: string;
    data?: string[];
  }>;
  head?: { text?: string };
}

let mermaidInitialized = false;
let mermaidRenderQueue: Promise<void> = Promise.resolve();

function enqueueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
  const next = mermaidRenderQueue.then(task, task);
  mermaidRenderQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function ensureMermaidInit(): void {
  if (!mermaidInitialized) {
    try {
      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        parseError: () => {
          // Suppress Mermaid's internal DOM error element injection!
          // This completely prevents Mermaid from appending bomb icon SVG to document.body
        },
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, -apple-system, sans-serif',
        htmlLabels: false,
        flowchart: {
          htmlLabels: false,
          useMaxWidth: false,
          curve: 'basis',
          padding: 14,
          nodeSpacing: 45,
          rankSpacing: 55,
        },
        sequence: { useMaxWidth: false },
        class: { useMaxWidth: false },
        state: { useMaxWidth: false },
        er: { useMaxWidth: false },
        pie: { useMaxWidth: false },
        mindmap: { useMaxWidth: false },
        themeVariables: {
          darkMode: true,
          background: 'transparent',
          primaryColor: '#3b82f6',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#60a5fa',
          lineColor: '#93c5fd',
          secondaryColor: '#1e293b',
          tertiaryColor: '#1e1b4b',
        },
      } as any);
      (mermaid as any).parseError = () => {};
      mermaidInitialized = true;
    } catch {
      // ignore
    }
  }
}

/**
 * Normalizes a rendered Mermaid SVG string:
 * - Strips injected opaque backgrounds while preserving layout styles
 * - Ensures explicit numeric width/height derived from viewBox (prevents flex 0px/100% collapse)
 * - Optionally re-tints accent colors
 */
export function normalizeMermaidSvg(
  rawSvg: string,
  customColor?: string
): { svg: string; width: number; height: number } {
  let svg = (rawSvg || '')
    .replace(/<rect[^>]*class="[^"]*background[^"]*"[^>]*\/?>/gi, '')
    .replace(/fill="#(0b1120|0f172a|000000|163626)"/gi, 'fill="none"')
    .replace(/background-color:\s*#[0-9a-fA-F]+/gi, 'background-color: transparent')
    .replace(/style="([^"]*)"/gi, (_m, styleContent: string) => {
      const cleaned = styleContent
        .replace(/background(?:-color)?\s*:[^;"]*;?/gi, '')
        .replace(/max-width\s*:\s*[^;"]*;?/gi, '')
        .trim();
      return cleaned ? `style="${cleaned}"` : '';
    });

  let width = 650;
  let height = 420;

  const openTagMatch = svg.match(/<svg\b[^>]*>/i);
  if (openTagMatch) {
    let openTag = openTagMatch[0];
    const vbMatch = openTag.match(/\bviewBox="([^"]+)"/i);
    const wAttrMatch = openTag.match(/\bwidth="([\d.]+)(?:px)?"/i);
    const hAttrMatch = openTag.match(/\bheight="([\d.]+)(?:px)?"/i);

    let parsedW = 0;
    let parsedH = 0;
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && Number.isFinite(parts[2]) && parts[2] > 0 && Number.isFinite(parts[3]) && parts[3] > 0) {
        parsedW = Math.ceil(parts[2]);
        parsedH = Math.ceil(parts[3]);
      }
    }
    if (!parsedW && wAttrMatch) parsedW = Math.ceil(parseFloat(wAttrMatch[1]));
    if (!parsedH && hAttrMatch) parsedH = Math.ceil(parseFloat(hAttrMatch[1]));

    if (parsedW > 0 && parsedH > 0) {
      width = parsedW;
      height = parsedH;
      if (/\bwidth="[^"]*"/i.test(openTag)) {
        openTag = openTag.replace(/\bwidth="[^"]*"/i, `width="${width}"`);
      } else {
        openTag = openTag.replace(/<svg\b/i, `<svg width="${width}"`);
      }
      if (/\bheight="[^"]*"/i.test(openTag)) {
        openTag = openTag.replace(/\bheight="[^"]*"/i, `height="${height}"`);
      } else {
        openTag = openTag.replace(/<svg\b/i, `<svg height="${height}"`);
      }
      svg = openTag + svg.slice(openTagMatch[0].length);
    }
  }

  if (customColor) {
    svg = svg.replace(/#3b82f6/gi, customColor).replace(/#60a5fa/gi, customColor);
  }

  return { svg, width, height };
}

/**
 * Clean up any stray DOM error elements or bomb icons that Mermaid's default handler
 * might inject into document.body during syntax errors.
 */
export function cleanupMermaidDomArtifacts(): void {
  if (typeof document === 'undefined') return;
  try {
    const strayErrors = document.querySelectorAll(
      '[id^="dmermaid"], [id^="mermaid-render-"], .error-icon, [aria-roledescription="error"], svg[id^="dmermaid"], body > svg[id^="d"]'
    );
    strayErrors.forEach((el) => {
      if (el.parentNode === document.body || el.id?.startsWith('dmermaid') || el.classList.contains('error-icon')) {
        el.remove();
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Sanitizes Mermaid code before parsing:
 * 1. Strips markdown fences (```mermaid ... ```)
 * 2. Ensures direction statement is followed by newline
 * 3. Auto-quotes unquoted node labels with parentheses e.g. A[Sea Level (1013.25 mb)] => A["Sea Level (1013.25 mb)"]
 * 4. Auto-quotes node labels containing colons, semicolons, brackets, or math
 */
const MERMAID_HEADER_REGEX =
  /^\s*(graph\s+(?:TD|TB|BT|RL|LR)\b|flowchart\s+(?:TD|TB|BT|RL|LR)\b|sequenceDiagram\b|classDiagram\b|stateDiagram(?:-v2)?\b|erDiagram\b|gantt\b|pie\b|gitGraph\b|mindmap\b|timeline\b|journey\b|xychart-beta\b|quadrantChart\b|C4Context\b)/i;

/**
 * Shared detector used across AI Chat and Whiteboard Canvas drop/insert flows
 * to determine if a string represents any supported diagram specification.
 */
export function isSupportedDiagramCode(rawCode: string): boolean {
  const trimmed = (rawCode || '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('```mermaid') || trimmed.startsWith('```graph') || trimmed.startsWith('```geometry') || trimmed.startsWith('```circuit') || trimmed.startsWith('```timing') || trimmed.startsWith('```tikz') || trimmed.startsWith('```chart')) {
    return true;
  }
  if (MERMAID_HEADER_REGEX.test(trimmed)) return true;
  if (trimmed.includes('\\begin{tikzpicture}') || trimmed.includes('\\begin{circuitikz}')) return true;
  if (trimmed.startsWith('{') && (
    /"type"\s*:\s*"(?:graph|geometry|circuit|timing|chart|bar|line|pie)"/i.test(trimmed) ||
    /"signal"\s*:\s*\[/i.test(trimmed) ||
    /"expressions"\s*:\s*\[/i.test(trimmed) ||
    /"shapes"\s*:\s*\[/i.test(trimmed) ||
    /"gates"\s*:\s*\[/i.test(trimmed)
  )) {
    return true;
  }
  return false;
}

/**
 * Finds the matching closing bracket index on a single line, skipping balanced nested delimiters.
 */
function findClosingBracket(line: string, openIdx: number, openChar: string, closeChar: string): number {
  let depth = 0;
  let inQuotes = false;
  for (let i = openIdx; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Safely wraps unquoted node & edge labels containing special characters inside quotes
 * on a single Mermaid flowchart/graph line without spanning across multiple nodes.
 */
function sanitizeFlowchartLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('classDef') || trimmed.startsWith('style ') || trimmed.startsWith('linkStyle')) {
    return line;
  }

  // Handle unquoted subgraph titles with punctuation: subgraph Name (Detail) -> subgraph sg["Name (Detail)"]
  if (/^\s*subgraph\s+/i.test(line)) {
    return line.replace(/^(\s*subgraph\s+)(.+)$/i, (_m, prefix, rest) => {
      const r = rest.trim();
      if (r.startsWith('"') || r.includes('[')) return line;
      if (/[()[\]{}:;=/%&,.<>~#$*^]/.test(r)) {
        const sgId = 'sg_' + r.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 20);
        return `${prefix}${sgId}["${r.replace(/"/g, "'")}"]`;
      }
      return line;
    });
  }

  // Convert single flowchart arrows -> and <- safely without touching -->, -.->, ==>, ->>, -->>
  let outLine = line
    .replace(/([^-=.>\s])\s*->\s*([^-=>\s])/g, '$1 --> $2')
    .replace(/(\s)->(\s)/g, '$1-->$2')
    .replace(/([^-=.<\s])\s*<-\s*([^-=<\s])/g, '$1 <-- $2');

  // Quote edge labels like -->|Yes (100%)| -> -->|"Yes (100%)"|
  outLine = outLine.replace(/\|([^|\r\n]+)\|/g, (m, inner) => {
    const t = inner.trim();
    if (t.startsWith('"') && t.endsWith('"')) return m;
    if (/[()[\]{}:;=/%&,.<>?~#$*^+\-]/.test(t)) {
      return `|"${t.replace(/"/g, "'")}"|`;
    }
    return m;
  });

  // Character-by-character scan for ID[...], ID(...), ID{...}, etc.
  const specialRe = /[()[\]{}:;=/%&,.<>?~#$*^+\-]/;
  let result = '';
  let i = 0;

  while (i < outLine.length) {
    // Check if an identifier starts here (preceded by non-identifier char or start)
    const prev = i > 0 ? outLine[i - 1] : ' ';
    if (/[A-Za-z0-9_]/.test(outLine[i]) && !/[A-Za-z0-9_-]/.test(prev)) {
      let idEnd = i;
      while (idEnd < outLine.length && /[A-Za-z0-9_-]/.test(outLine[idEnd])) {
        idEnd++;
      }
      const id = outLine.slice(i, idEnd);
      const nextCh = outLine[idEnd];
      const next2 = outLine.slice(idEnd, idEnd + 2);

      // Multi-char shape prefixes
      let openLen = 0;
      let openDelim = '';
      let closeDelim = '';
      let openBrace = '';
      let closeBrace = '';

      if (next2 === '[[' || next2 === '((' || next2 === '{{' || next2 === '([') {
        openLen = 2;
        openDelim = next2;
        closeDelim = next2 === '[[' ? ']]' : next2 === '((' ? '))' : next2 === '{{' ? '}}' : '])';
        openBrace = next2[0];
        closeBrace = closeDelim[1];
      } else if (nextCh === '[' || nextCh === '(' || nextCh === '{') {
        openLen = 1;
        openDelim = nextCh;
        closeDelim = nextCh === '[' ? ']' : nextCh === '(' ? ')' : '}';
        openBrace = nextCh;
        closeBrace = closeDelim;
      }

      if (openLen > 0) {
        const closePos = findClosingBracket(outLine, idEnd, openBrace, closeBrace);
        if (closePos !== -1) {
          const innerStart = idEnd + openLen;
          const innerEnd = openLen === 2 && outLine.slice(closePos - 1, closePos + 1) === closeDelim ? closePos - 1 : closePos;
          const actualCloseEnd = openLen === 2 ? closePos + 1 : closePos + 1;
          // Ensure double closing matches
          const rawInner = outLine.slice(innerStart, innerEnd).trim();
          const alreadyQuoted = rawInner.startsWith('"') && rawInner.endsWith('"');
          if (!alreadyQuoted && specialRe.test(rawInner)) {
            const cleanInner = rawInner.replace(/<br\s*\/?>/gi, ' / ').replace(/"/g, "'");
            result += `${id}${openDelim}"${cleanInner}"${closeDelim}`;
          } else {
            result += outLine.slice(i, actualCloseEnd);
          }
          i = actualCloseEnd;
          continue;
        }
      }
    }

    result += outLine[i];
    i++;
  }

  return result;
}

/**
 * Sanitizes Mermaid code before parsing:
 * 1. Strips markdown fences (```mermaid ... ```) and normalizes Unicode arrows/quotes
 * 2. Ensures direction statement is followed by newline
 * 3. Safely quotes node & edge labels containing parentheses, colons, math, or special chars
 */
export function sanitizeMermaidCode(rawCode: string): string {
  let cleaned = (rawCode || '').trim();

  // Strip code fences if present
  cleaned = cleaned.replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Normalize smart quotes and Unicode arrows/dashes
  cleaned = cleaned
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[→➜➔⟶]/g, '-->')
    .replace(/—>|–>/g, '-->')
    .replace(/↔/g, '<-->')
    .replace(/<br\s*\/?>/gi, ' ');

  // Ensure diagram direction has newline before first node:
  // e.g. "flowchart LR A[...]" => "flowchart LR\nA[...]"
  cleaned = cleaned.replace(/^((?:graph|flowchart)\s+(?:TD|TB|BT|RL|LR))\s+([A-Za-z0-9])/im, '$1\n$2');

  const lines = cleaned.split(/\r?\n/);
  const firstNonEmpty = (lines.find((l) => l.trim().length > 0) || '').trim();
  const isFlowchart = /^(?:graph|flowchart)\b/i.test(firstNonEmpty);

  if (isFlowchart) {
    return lines
      .map((line, idx) => (idx === 0 && /^(?:graph|flowchart)\s+(?:TD|TB|BT|RL|LR)\s*$/i.test(line.trim()) ? line : sanitizeFlowchartLine(line)))
      .join('\n');
  }

  return cleaned;
}

/**
 * Auto-detects the diagram language/specification from input code
 */
export function detectDiagramType(code: string): DiagramType {
  const trimmed = (code || '').trim();

  // 1. Mermaid keywords
  if (MERMAID_HEADER_REGEX.test(trimmed)) {
    return 'mermaid';
  }

  // 2. TikZ keywords
  if (trimmed.includes('\\begin{tikzpicture}') || trimmed.includes('\\draw') || trimmed.includes('\\begin{circuitikz}')) {
    if (trimmed.includes('circuitikz')) return 'circuit';
    return 'tikz';
  }

  // 3. JSON specification detection
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'graph' || parsed.expressions) return 'graph';
      if (parsed.type === 'geometry' || parsed.shapes) return 'geometry';
      if (parsed.type === 'circuit' || parsed.gates) return 'circuit';
      if (parsed.signal || parsed.type === 'timing') return 'timing';
      if (parsed.type === 'chart' || parsed.type === 'bar' || parsed.type === 'line' || parsed.type === 'pie') return 'chart';
    } catch {
      // not strict JSON, continue below
    }
  }

  // 4. Mathematical Graph keywords
  if (
    /^(y\s*=|f\(x\)\s*=|plot\(|expressions|xRange|yRange)/i.test(trimmed) ||
    trimmed.includes('x^2') ||
    trimmed.includes('sin(x)') ||
    trimmed.includes('cos(x)') ||
    trimmed.includes('type: "graph"') ||
    trimmed.includes("type: 'graph'")
  ) {
    return 'graph';
  }

  // 5. Digital Logic Circuit keywords
  if (
    /\b(AND|OR|NAND|NOR|XOR|XNOR|NOT)\s*\(/i.test(trimmed) ||
    trimmed.includes('gateType') ||
    trimmed.includes('type: "circuit"') ||
    trimmed.includes("type: 'circuit'")
  ) {
    return 'circuit';
  }

  // 6. Timing Diagram keywords (WaveDrom format)
  if (trimmed.includes('signal:') || trimmed.includes('"signal":') || trimmed.includes('wave:')) {
    return 'timing';
  }

  // 7. 2D Geometry keywords
  if (
    trimmed.includes('triangle') ||
    trimmed.includes('polygon') ||
    trimmed.includes('type: "geometry"') ||
    trimmed.includes("type: 'geometry'")
  ) {
    return 'geometry';
  }

  // 8. Data Chart keywords
  if (/type:\s*['"](?:chart|bar|line|pie)['"]/i.test(trimmed)) {
    return 'chart';
  }

  // Default fallback to mermaid
  return 'mermaid';
}

/**
 * Evaluates a mathematical function expression y = f(x) safely
 */
function evaluateMathExpression(exprStr: string, x: number): number | null {
  try {
    let clean = exprStr
      .replace(/^y\s*=\s*/i, '')
      .replace(/^f\(x\)\s*=\s*/i, '')
      .replace(/[−–—]/g, '-')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .trim();

    // Protect math functions before implicit multiplication
    clean = clean
      .replace(/\b(sin|cos|tan|sqrt|abs|exp|ln|log)\b/g, ' __FN_$1__ ')
      .replace(/\bpi\b/gi, '(Math.PI)')
      .replace(/\be\b/g, '(Math.E)');

    // Normalize whitespace around tokens
    clean = clean.replace(/\s+/g, ' ').trim();

    // Implicit multiplication: 2x -> 2*x, 2(x+1) -> 2*(x+1), 2 __FN_sin__ -> 2*__FN_sin__
    clean = clean
      .replace(/(\d)\s*([xX(]|__FN_)/g, '$1*$2')
      .replace(/(\))\s*([0-9xX(]|__FN_)/g, '$1*$2')
      .replace(/([xX])\s*(\()/g, '$1*$2');

    // Convert power operator a^b cleanly into Math.pow(a, b) (right to left for simple terms & parenthesized groups)
    let safety = 0;
    while (clean.includes('^') && safety++ < 12) {
      const next = clean.replace(
        /(\([^()]+\)|Math\.[A-Za-z]+|[a-zA-Z0-9_.]+)\s*\^\s*(\([^()]+\)|-?[a-zA-Z0-9_.]+)/,
        'Math.pow($1, $2)'
      );
      if (next === clean) break;
      clean = next;
    }

    // Restore math functions
    clean = clean
      .replace(/__FN_sin__/g, 'Math.sin')
      .replace(/__FN_cos__/g, 'Math.cos')
      .replace(/__FN_tan__/g, 'Math.tan')
      .replace(/__FN_sqrt__/g, 'Math.sqrt')
      .replace(/__FN_abs__/g, 'Math.abs')
      .replace(/__FN_exp__/g, 'Math.exp')
      .replace(/__FN_ln__/g, 'Math.log')
      .replace(/__FN_log__/g, 'Math.log10');

    const fn = new Function('x', `return ${clean};`);
    const val = fn(x);
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Renders a Mathematical Graph specification (Example A: Quadratic equations, sine waves, polynomials) to clean SVG
 */
export function renderMathGraphSvg(spec: GraphSpec, customColor?: string): string {
  const w = spec.width || 700;
  const h = spec.height || 460;
  const margin = { top: 40, right: 40, bottom: 40, left: 50 };
  const plotW = w - margin.left - margin.right;
  const plotH = h - margin.top - margin.bottom;

  const [xMin, xMax] = spec.xRange || [-5, 5];
  const [yMin, yMax] = spec.yRange || [-5, 10];

  const scaleX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const scaleY = (y: number) => margin.top + ((yMax - y) / (yMax - yMin)) * plotH;

  const primaryColor = customColor || '#38bdf8';
  const colors = [primaryColor, '#f43f5e', '#10b981', '#fbbf24', '#a855f7'];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      .bg { fill: none; }
      .grid { stroke: rgba(255, 255, 255, 0.1); stroke-width: 1; }
      .axis { stroke: ${primaryColor}; stroke-width: 2; }
      .tick { font-family: Inter, sans-serif; font-size: 11px; fill: #94a3b8; }
      .title { font-family: Inter, sans-serif; font-size: 15px; font-weight: 700; fill: #ffffff; text-anchor: middle; }
      .legend { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 12px; font-weight: 600; }
    </style>`;

  // Title
  if (spec.title) {
    svg += `<text x="${w / 2}" y="24" class="title">${escapeXml(spec.title)}</text>`;
  }

  // Grid lines
  if (spec.grid !== false) {
    const xStep = Math.max(1, Math.round((xMax - xMin) / 10));
    for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
      const px = scaleX(x);
      svg += `<line x1="${px}" y1="${margin.top}" x2="${px}" y2="${margin.top + plotH}" class="grid" />`;
      svg += `<text x="${px}" y="${margin.top + plotH + 18}" class="tick" text-anchor="middle">${x}</text>`;
    }

    const yStep = Math.max(1, Math.round((yMax - yMin) / 8));
    for (let y = Math.ceil(yMin); y <= yMax; y += yStep) {
      const py = scaleY(y);
      svg += `<line x1="${margin.left}" y1="${py}" x2="${margin.left + plotW}" y2="${py}" class="grid" />`;
      svg += `<text x="${margin.left - 10}" y="${py + 4}" class="tick" text-anchor="end">${y}</text>`;
    }
  }

  // Major Axes (X = 0 and Y = 0)
  if (spec.axes !== false) {
    const originX = scaleX(0);
    const originY = scaleY(0);

    // X Axis
    if (originY >= margin.top && originY <= margin.top + plotH) {
      svg += `<line x1="${margin.left - 10}" y1="${originY}" x2="${margin.left + plotW + 15}" y2="${originY}" class="axis" />`;
      svg += `<polygon points="${margin.left + plotW + 20},${originY} ${margin.left + plotW + 12},${originY - 4} ${margin.left + plotW + 12},${originY + 4}" fill="#94a3b8" />`;
      svg += `<text x="${margin.left + plotW + 15}" y="${originY - 8}" class="tick" style="fill: #94a3b8; font-weight: bold;">X</text>`;
    }

    // Y Axis
    if (originX >= margin.left && originX <= margin.left + plotW) {
      svg += `<line x1="${originX}" y1="${margin.top + plotH + 10}" x2="${originX}" y2="${margin.top - 15}" class="axis" />`;
      svg += `<polygon points="${originX},${margin.top - 20} ${originX - 4},${margin.top - 12} ${originX + 4},${margin.top - 12}" fill="#94a3b8" />`;
      svg += `<text x="${originX + 8}" y="${margin.top - 12}" class="tick" style="fill: #94a3b8; font-weight: bold;">Y</text>`;
    }
  }

  // Plot Curves
  spec.expressions.forEach((expr, eIdx) => {
    const color = colors[eIdx % colors.length];
    const steps = 300;
    const dx = (xMax - xMin) / steps;
    const points: Array<[number, number]> = [];

    for (let i = 0; i <= steps; i++) {
      const curX = xMin + i * dx;
      const curY = evaluateMathExpression(expr, curX);
      if (curY !== null) {
        // Clamp to prevent infinite SVG offscreen spikes
        if (curY >= yMin - (yMax - yMin) && curY <= yMax + (yMax - yMin)) {
          points.push([scaleX(curX), scaleY(curY)]);
        }
      }
    }

    if (points.length > 1) {
      let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
      for (let p = 1; p < points.length; p++) {
        d += ` L ${points[p][0].toFixed(1)} ${points[p][1].toFixed(1)}`;
      }
      svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;

      // Legend entry
      const legX = margin.left + 16 + eIdx * 160;
      const legY = margin.top + 20;
      svg += `<line x1="${legX}" y1="${legY}" x2="${legX + 24}" y2="${legY}" stroke="${color}" stroke-width="3" />`;
      svg += `<text x="${legX + 30}" y="${legY + 4}" class="legend" fill="${color}">${escapeXml(expr)}</text>`;
    }
  });

  svg += `</svg>`;
  return svg;
}

function safeParseJsonSpec<T>(code: string, fallback: T): T {
  const trimmed = code.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return fallback;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    try {
      const sanitized = trimmed
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"')
        .replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(sanitized) as T;
    } catch {
      return fallback;
    }
  }
}

/**
 * Renders 2D Geometry shapes to vector SVG (triangles, angles, circles, polygons)
 * Dynamically computes bounding box and auto-scales so shapes NEVER render offscreen or blank!
 */
export function renderGeometrySvg(spec: GeometrySpec, customColor?: string): string {
  const w = spec.width || 600;
  const h = spec.height || 420;
  const primaryColor = customColor || '#38bdf8';

  let shapes = spec.shapes || [];
  if (shapes.length === 0) {
    if ((spec as any).points && Array.isArray((spec as any).points)) {
      shapes = [{ kind: 'triangle', points: (spec as any).points, label: spec.title || 'Triangle ABC' }];
    } else {
      shapes = [
        { kind: 'triangle', points: [[-3, -2], [3, -2], [3, 2.5]], label: spec.title || 'Triangle ABC', rightAngle: true }
      ];
    }
  }

  // 1. Gather all points to compute robust auto-fit bounding box
  const allX: number[] = [];
  const allY: number[] = [];
  shapes.forEach((s) => {
    if (s.points) {
      s.points.forEach(([px, py]) => {
        allX.push(px);
        allY.push(py);
      });
    }
    if (s.center) {
      const r = s.radius || 3;
      allX.push(s.center[0] - r, s.center[0] + r);
      allY.push(s.center[1] - r, s.center[1] + r);
    }
  });

  if (allX.length === 0) {
    allX.push(-3, 3);
    allY.push(-2, 3);
  }

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const spanX = Math.max(0.1, maxX - minX);
  const spanY = Math.max(0.1, maxY - minY);

  const padX = 50;
  const padY = 50;
  const availW = w - padX * 2;
  const availH = h - padY * 2;

  const autoScale = Math.min(availW / spanX, availH / spanY);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const cx = w / 2;
  const cy = h / 2 + 10;

  const toScreenX = (px: number) => cx + (px - midX) * autoScale;
  const toScreenY = (py: number) => cy - (py - midY) * autoScale;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      .geo-label { font-family: Inter, sans-serif; font-size: 13px; font-weight: 600; fill: #f8fafc; }
      .geo-title { font-family: Inter, sans-serif; font-size: 16px; font-weight: 700; fill: ${primaryColor}; text-anchor: middle; }
    </style>`;

  if (spec.title) {
    svg += `<text x="${w / 2}" y="32" class="geo-title">${escapeXml(spec.title)}</text>`;
  }

  shapes.forEach((shape) => {
    const strokeColor = customColor || shape.color || '#38bdf8';
    const fillColor = shape.fill && shape.fill !== 'rgba(56, 189, 248, 0.15)' ? shape.fill : (customColor ? `${customColor}26` : 'rgba(56, 189, 248, 0.15)');

    if ((shape.kind === 'triangle' || shape.kind === 'polygon') && shape.points && shape.points.length >= 3) {
      const screenPts = shape.points.map(([px, py]) => [toScreenX(px), toScreenY(py)] as [number, number]);
      const ptsAttr = screenPts.map(([sx, sy]) => `${sx.toFixed(1)},${sy.toFixed(1)}`).join(' ');
      svg += `<polygon points="${ptsAttr}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round" />`;

      // Right angle marker if requested (on vertex with index 0 or right-most vertex)
      if (shape.rightAngle && screenPts.length >= 3) {
        const [vx, vy] = screenPts[0];
        const [ax, ay] = screenPts[1];
        const [bx, by] = screenPts[2];
        const dA = Math.hypot(ax - vx, ay - vy) || 1;
        const dB = Math.hypot(bx - vx, by - vy) || 1;
        const sq = 14;
        const ux = ((ax - vx) / dA) * sq;
        const uy = ((ay - vy) / dA) * sq;
        const wx = ((bx - vx) / dB) * sq;
        const wy = ((by - vy) / dB) * sq;
        svg += `<path d="M ${(vx + ux).toFixed(1)} ${(vy + uy).toFixed(1)} L ${(vx + ux + wx).toFixed(1)} ${(vy + uy + wy).toFixed(1)} L ${(vx + wx).toFixed(1)} ${(vy + wy).toFixed(1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`;
      }

      if (shape.label) {
        const avgX = screenPts.reduce((acc, p) => acc + p[0], 0) / screenPts.length;
        const avgY = screenPts.reduce((acc, p) => acc + p[1], 0) / screenPts.length;
        svg += `<text x="${avgX.toFixed(1)}" y="${(avgY + 4).toFixed(1)}" class="geo-label" text-anchor="middle">${escapeXml(shape.label)}</text>`;
      }
    } else if ((shape.kind === 'line' || shape.kind === 'vector') && shape.points && shape.points.length >= 2) {
      const [p1, p2] = shape.points;
      const sx1 = toScreenX(p1[0]), sy1 = toScreenY(p1[1]);
      const sx2 = toScreenX(p2[0]), sy2 = toScreenY(p2[1]);
      svg += `<line x1="${sx1.toFixed(1)}" y1="${sy1.toFixed(1)}" x2="${sx2.toFixed(1)}" y2="${sy2.toFixed(1)}" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" />`;

      if (shape.kind === 'vector') {
        const ang = Math.atan2(sy2 - sy1, sx2 - sx1);
        const headLen = 12;
        const h1x = sx2 - headLen * Math.cos(ang - Math.PI / 7);
        const h1y = sy2 - headLen * Math.sin(ang - Math.PI / 7);
        const h2x = sx2 - headLen * Math.cos(ang + Math.PI / 7);
        const h2y = sy2 - headLen * Math.sin(ang + Math.PI / 7);
        svg += `<polygon points="${sx2.toFixed(1)},${sy2.toFixed(1)} ${h1x.toFixed(1)},${h1y.toFixed(1)} ${h2x.toFixed(1)},${h2y.toFixed(1)}" fill="${strokeColor}" />`;
      }
      if (shape.label) {
        svg += `<text x="${((sx1 + sx2) / 2).toFixed(1)}" y="${((sy1 + sy2) / 2 - 10).toFixed(1)}" class="geo-label" text-anchor="middle">${escapeXml(shape.label)}</text>`;
      }
    } else if (shape.kind === 'angle' && shape.points && shape.points.length >= 3) {
      const [pA, pV, pC] = shape.points;
      const ax = toScreenX(pA[0]), ay = toScreenY(pA[1]);
      const vx = toScreenX(pV[0]), vy = toScreenY(pV[1]);
      const cxp = toScreenX(pC[0]), cyp = toScreenY(pC[1]);
      svg += `<line x1="${vx.toFixed(1)}" y1="${vy.toFixed(1)}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${strokeColor}" stroke-width="2.5" />`;
      svg += `<line x1="${vx.toFixed(1)}" y1="${vy.toFixed(1)}" x2="${cxp.toFixed(1)}" y2="${cyp.toFixed(1)}" stroke="${strokeColor}" stroke-width="2.5" />`;
      const rArc = 28;
      const a1 = Math.atan2(ay - vy, ax - vx);
      const a2 = Math.atan2(cyp - vy, cxp - vx);
      const arcStartX = vx + rArc * Math.cos(a1);
      const arcStartY = vy + rArc * Math.sin(a1);
      const arcEndX = vx + rArc * Math.cos(a2);
      const arcEndY = vy + rArc * Math.sin(a2);
      svg += `<path d="M ${arcStartX.toFixed(1)} ${arcStartY.toFixed(1)} A ${rArc} ${rArc} 0 0 1 ${arcEndX.toFixed(1)} ${arcEndY.toFixed(1)}" fill="none" stroke="${strokeColor}" stroke-width="2" />`;
      if (shape.label) {
        const midAng = (a1 + a2) / 2;
        svg += `<text x="${(vx + (rArc + 18) * Math.cos(midAng)).toFixed(1)}" y="${(vy + (rArc + 18) * Math.sin(midAng)).toFixed(1)}" class="geo-label" text-anchor="middle">${escapeXml(shape.label)}</text>`;
      }
    } else if (shape.kind === 'circle') {
      const ccx = toScreenX(shape.center?.[0] || 0);
      const ccy = toScreenY(shape.center?.[1] || 0);
      const r = (shape.radius || 3) * autoScale;

      svg += `<circle cx="${ccx.toFixed(1)}" cy="${ccy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" />`;
      if (shape.label) {
        svg += `<text x="${ccx.toFixed(1)}" y="${(ccy + 4).toFixed(1)}" class="geo-label" text-anchor="middle">${escapeXml(shape.label)}</text>`;
      }
    }
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Renders Digital Logic Circuits (AND, OR, NOT, XOR gates with pins) to vector SVG
 */
export function renderCircuitSvg(spec: CircuitSpec, customColor?: string): string {
  const w = spec.width || 680;
  const h = spec.height || 380;
  const primaryColor = customColor || '#38bdf8';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      .gate-body { fill: rgba(255, 255, 255, 0.08); stroke: ${primaryColor}; stroke-width: 2.5; }
      .wire { stroke: ${primaryColor}; stroke-width: 2; stroke-linecap: round; }
      .pin-label { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13px; font-weight: 700; fill: #f8fafc; }
      .gate-title { font-family: Inter, sans-serif; font-size: 16px; font-weight: 700; fill: ${primaryColor}; text-anchor: middle; }
    </style>`;

  if (spec.title) {
    svg += `<text x="${w / 2}" y="32" class="gate-title">${escapeXml(spec.title)}</text>`;
  }

  const gates = spec.gates && spec.gates.length > 0
    ? spec.gates
    : [
        { type: 'AND' as const, x: 220, y: 140, inputs: ['A', 'B'], output: 'Y = A·B' }
      ];

  gates.forEach((gate) => {
    const gx = gate.x;
    const gy = gate.y;
    const gw = 80;
    const gh = 60;
    const gType = String(gate.type || 'AND').toUpperCase();
    const hasBubble = gType === 'NOT' || gType === 'NAND' || gType === 'NOR' || gType === 'XNOR';

    // Gate symbols
    if (gType === 'AND' || gType === 'NAND') {
      svg += `<path d="M ${gx} ${gy} L ${gx + 40} ${gy} A 30 30 0 0 1 ${gx + 40} ${gy + gh} L ${gx} ${gy + gh} Z" class="gate-body" />`;
    } else if (gType === 'OR' || gType === 'NOR') {
      svg += `<path d="M ${gx} ${gy} Q ${gx + 20} ${gy + 30} ${gx} ${gy + gh} Q ${gx + 50} ${gy + gh} ${gx + 75} ${gy + 30} Q ${gx + 50} ${gy} ${gx} ${gy} Z" class="gate-body" />`;
    } else if (gType === 'XOR' || gType === 'XNOR') {
      svg += `<path d="M ${gx - 8} ${gy} Q ${gx + 12} ${gy + 30} ${gx - 8} ${gy + gh}" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round" />`;
      svg += `<path d="M ${gx + 2} ${gy} Q ${gx + 22} ${gy + 30} ${gx + 2} ${gy + gh} Q ${gx + 50} ${gy + gh} ${gx + 75} ${gy + 30} Q ${gx + 50} ${gy} ${gx + 2} ${gy} Z" class="gate-body" />`;
    } else if (gType === 'NOT' || gType === 'BUFFER') {
      svg += `<polygon points="${gx},${gy + 6} ${gx + 64},${gy + gh / 2} ${gx},${gy + gh - 6}" class="gate-body" />`;
    } else {
      svg += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="8" class="gate-body" />`;
      svg += `<text x="${gx + gw / 2}" y="${gy + gh / 2 + 5}" class="pin-label" text-anchor="middle">${escapeXml(gate.label || gate.type)}</text>`;
    }

    if (gate.label && (gType === 'AND' || gType === 'NAND' || gType === 'OR' || gType === 'NOR' || gType === 'XOR' || gType === 'XNOR' || gType === 'NOT' || gType === 'BUFFER')) {
      svg += `<text x="${gx + (gType === 'NOT' || gType === 'BUFFER' ? 32 : 40)}" y="${gy + gh + 16}" class="pin-label" text-anchor="middle">${escapeXml(gate.label)}</text>`;
    }

    if (hasBubble) {
      const bx = gType === 'NOT' ? gx + 70 : gx + gw + 2;
      svg += `<circle cx="${bx}" cy="${gy + gh / 2}" r="5" class="gate-body" />`;
    }

    // Input wires
    const in1 = gate.inputs?.[0] || 'A';
    const in2 = gate.inputs?.[1] || 'B';
    if (gType === 'NOT' || gType === 'BUFFER') {
      svg += `<line x1="${gx - 50}" y1="${gy + gh / 2}" x2="${gx}" y2="${gy + gh / 2}" class="wire" />`;
      svg += `<text x="${gx - 60}" y="${gy + gh / 2 + 4}" class="pin-label" text-anchor="end">${escapeXml(in1)}</text>`;
    } else {
      svg += `<line x1="${gx - 50}" y1="${gy + 16}" x2="${gx + 4}" y2="${gy + 16}" class="wire" />`;
      svg += `<text x="${gx - 60}" y="${gy + 20}" class="pin-label" text-anchor="end">${escapeXml(in1)}</text>`;
      svg += `<line x1="${gx - 50}" y1="${gy + gh - 16}" x2="${gx + 4}" y2="${gy + gh - 16}" class="wire" />`;
      svg += `<text x="${gx - 60}" y="${gy + gh - 12}" class="pin-label" text-anchor="end">${escapeXml(in2)}</text>`;
    }

    // Output wire
    const outLabel = gate.output || 'Y';
    const outX = gType === 'NOT' ? (hasBubble ? gx + 75 : gx + 64) : (hasBubble ? gx + gw + 7 : gx + gw - (gType === 'OR' ? 5 : 0));
    svg += `<line x1="${outX}" y1="${gy + gh / 2}" x2="${outX + 55}" y2="${gy + gh / 2}" class="wire" />`;
    svg += `<text x="${outX + 64}" y="${gy + gh / 2 + 5}" class="pin-label">${escapeXml(outLabel)}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Renders WaveDrom-style Timing Diagrams to vector SVG
 */
export function renderTimingSvg(spec: TimingSpec, customColor?: string): string {
  const w = 680;
  const rowHeight = 44;
  const numSignals = spec.signal?.length || 1;
  const h = Math.max(160, numSignals * rowHeight + 80);
  const stepW = 34;
  const startX = 100;
  const primaryColor = customColor || '#10b981';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      .sig-name { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; fill: ${customColor || '#38bdf8'}; text-anchor: end; }
      .wave-line { stroke: ${primaryColor}; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .wave-clk { stroke: ${primaryColor}; stroke-width: 2.5; fill: none; }
      .grid-v { stroke: rgba(255,255,255,0.08); stroke-width: 1; stroke-dasharray: 4; }
      .wave-title { font-family: Inter, sans-serif; font-size: 15px; font-weight: 700; fill: #f8fafc; }
    </style>`;

  if (spec.head?.text) {
    svg += `<text x="${w / 2}" y="28" class="wave-title" text-anchor="middle">${escapeXml(spec.head.text)}</text>`;
  }

  (spec.signal || []).forEach((sig, sIdx) => {
    const sy = 60 + sIdx * rowHeight;
    const wave = sig.wave || 'p........';

    svg += `<text x="${startX - 16}" y="${sy + 18}" class="sig-name">${escapeXml(sig.name)}</text>`;

    let pathD = '';
    let curState: '0' | '1' | 'x' = '0';

    for (let c = 0; c < wave.length; c++) {
      const ch = wave[c];
      const x1 = startX + c * stepW;
      const x2 = x1 + stepW;
      const yHigh = sy + 4;
      const yLow = sy + 28;

      // Vertical guide lines
      if (sIdx === 0) {
        svg += `<line x1="${x1}" y1="40" x2="${x1}" y2="${h - 20}" class="grid-v" />`;
      }

      if (ch === 'p' || ch === 'P') {
        // Clock pulse (high, low)
        const midX = (x1 + x2) / 2;
        pathD += ` M ${x1} ${yLow} L ${x1} ${yHigh} L ${midX} ${yHigh} L ${midX} ${yLow} L ${x2} ${yLow}`;
      } else if (ch === '1' || ch === 'h' || ch === 'H') {
        if (!pathD) pathD = `M ${x1} ${yHigh}`;
        else if (curState !== '1') pathD += ` L ${x1} ${yHigh}`;
        pathD += ` L ${x2} ${yHigh}`;
        curState = '1';
      } else if (ch === '0' || ch === 'l' || ch === 'L') {
        if (!pathD) pathD = `M ${x1} ${yLow}`;
        else if (curState !== '0') pathD += ` L ${x1} ${yLow}`;
        pathD += ` L ${x2} ${yLow}`;
        curState = '0';
      } else if (ch === '.') {
        const yPos = curState === '1' ? yHigh : yLow;
        pathD += ` L ${x2} ${yPos}`;
      }
    }

    const cls = sig.name.toLowerCase().includes('clk') ? 'wave-clk' : 'wave-line';
    svg += `<path d="${pathD}" class="${cls}" />`;
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Renders educational Bar, Line, or Pie charts from structured JSON specs into crisp transparent SVG.
 */
export function renderChartSvg(spec: ChartSpec, customColor?: string): string {
  const w = spec.width || 680;
  const h = spec.height || 400;
  const kind = spec.chartType || (spec.type === 'line' || spec.type === 'pie' ? spec.type : 'bar');
  const labels = Array.isArray(spec.labels) && spec.labels.length > 0 ? spec.labels : ['A', 'B', 'C', 'D'];
  const values = Array.isArray(spec.values) && spec.values.length > 0 ? spec.values : [25, 45, 30, 60];
  const palette = customColor ? [customColor, '#10b981', '#f59e0b', '#f43f5e', '#a855f7'] : ['#38bdf8', '#10b981', '#fbbf24', '#f43f5e', '#a855f7'];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      .chart-title { font-family: Inter, sans-serif; font-size: 16px; font-weight: 700; fill: #f8fafc; text-anchor: middle; }
      .chart-label { font-family: Inter, sans-serif; font-size: 12px; fill: #cbd5e1; }
      .chart-val { font-family: Inter, sans-serif; font-size: 11px; font-weight: 700; fill: #f8fafc; }
      .chart-axis { stroke: #94a3b8; stroke-width: 1.5; }
      .chart-grid { stroke: rgba(255,255,255,0.1); stroke-width: 1; }
    </style>`;

  if (spec.title) {
    svg += `<text x="${w / 2}" y="28" class="chart-title">${escapeXml(spec.title)}</text>`;
  }

  if (kind === 'pie') {
    const cx = w * 0.36;
    const cy = h * 0.54;
    const r = Math.min(w, h) * 0.32;
    const total = values.reduce((a, b) => a + Math.max(0, Number(b) || 0), 0) || 1;
    let angle = -Math.PI / 2;
    values.forEach((rawV, idx) => {
      const val = Math.max(0, Number(rawV) || 0);
      const sliceAngle = (val / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(angle + sliceAngle);
      const y2 = cy + r * Math.sin(angle + sliceAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const col = palette[idx % palette.length];
      svg += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${col}" fill-opacity="0.88" stroke="rgba(15,23,42,0.5)" stroke-width="1.5" />`;
      const ly = 85 + idx * 26;
      const lx = w * 0.72;
      svg += `<rect x="${lx}" y="${ly - 11}" width="14" height="14" rx="3" fill="${col}" />`;
      svg += `<text x="${lx + 22}" y="${ly}" class="chart-label">${escapeXml(labels[idx] || `Item ${idx + 1}`)} (${val})</text>`;
      angle += sliceAngle;
    });
    svg += `</svg>`;
    return svg;
  }

  const m = { top: 52, right: 32, bottom: 54, left: 60 };
  const pw = w - m.left - m.right;
  const ph = h - m.top - m.bottom;
  const maxVal = Math.max(1, ...values.map((v) => Number(v) || 0));

  for (let t = 0; t <= 4; t++) {
    const gy = m.top + ph - (t / 4) * ph;
    const tickVal = Math.round((t / 4) * maxVal);
    svg += `<line x1="${m.left}" y1="${gy.toFixed(1)}" x2="${m.left + pw}" y2="${gy.toFixed(1)}" class="chart-grid" />`;
    svg += `<text x="${m.left - 8}" y="${(gy + 4).toFixed(1)}" class="chart-label" text-anchor="end">${tickVal}</text>`;
  }
  svg += `<line x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top + ph}" class="chart-axis" />`;
  svg += `<line x1="${m.left}" y1="${m.top + ph}" x2="${m.left + pw}" y2="${m.top + ph}" class="chart-axis" />`;

  const n = Math.max(labels.length, values.length);
  const slotW = pw / n;

  if (kind === 'line') {
    const pts: Array<[number, number, number, string]> = [];
    for (let i = 0; i < n; i++) {
      const val = Number(values[i] ?? 0);
      const px = m.left + slotW * (i + 0.5);
      const py = m.top + ph - (val / maxVal) * ph;
      pts.push([px, py, val, labels[i] || `Item ${i + 1}`]);
    }
    if (pts.length > 1) {
      const d = pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
      svg += `<path d="${d}" fill="none" stroke="${palette[0]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    }
    pts.forEach(([px, py, val, lbl]) => {
      svg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="${palette[0]}" stroke="#ffffff" stroke-width="1.5" />`;
      svg += `<text x="${px.toFixed(1)}" y="${(py - 10).toFixed(1)}" class="chart-val" text-anchor="middle">${val}</text>`;
      svg += `<text x="${px.toFixed(1)}" y="${m.top + ph + 20}" class="chart-label" text-anchor="middle">${escapeXml(lbl)}</text>`;
    });
  } else {
    const barW = Math.min(56, slotW * 0.62);
    for (let i = 0; i < n; i++) {
      const val = Math.max(0, Number(values[i] ?? 0));
      const bh = (val / maxVal) * ph;
      const bx = m.left + slotW * (i + 0.5) - barW / 2;
      const by = m.top + ph - bh;
      const col = palette[i % palette.length];
      svg += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${col}" fill-opacity="0.88" />`;
      svg += `<text x="${(bx + barW / 2).toFixed(1)}" y="${(by - 6).toFixed(1)}" class="chart-val" text-anchor="middle">${val}</text>`;
      svg += `<text x="${(bx + barW / 2).toFixed(1)}" y="${m.top + ph + 20}" class="chart-label" text-anchor="middle">${escapeXml(labels[i] || `Item ${i + 1}`)}</text>`;
    }
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Renders basic LaTeX TikZ coordinate diagrams (\draw, \fill, \node) into crisp transparent SVG.
 */
export function renderTikzSvg(code: string, customColor?: string): string {
  const w = 640;
  const h = 400;
  const strokeColor = customColor || '#38bdf8';

  const coords: Array<[number, number]> = [];
  const lines = code.split('\n');
  const coordRegex = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = coordRegex.exec(code)) !== null) {
    coords.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  if (coords.length === 0) {
    coords.push([0, 0], [4, 0], [4, 3]);
  }

  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((w - 120) / spanX, (h - 100) / spanY);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const tx = (x: number) => w / 2 + (x - midX) * scale;
  const ty = (y: number) => h / 2 - (y - midY) * scale;

  let body = '';
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%') || line.startsWith('\\begin') || line.startsWith('\\end')) continue;

    // \draw ... (x,y) circle (r);
    const circleMatch = line.match(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*circle\s*(?:\(\s*([\d.]+)\s*\)|\[radius=([\d.]+)\])/i);
    if (circleMatch) {
      const cx = tx(parseFloat(circleMatch[1]));
      const cy = ty(parseFloat(circleMatch[2]));
      const rad = parseFloat(circleMatch[3] || circleMatch[4] || '1') * scale;
      body += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="${strokeColor}20" stroke="${strokeColor}" stroke-width="2.5" />`;
    }

    // \draw (x1,y1) rectangle (x2,y2);
    const rectMatch = line.match(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*rectangle\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i);
    if (rectMatch) {
      const x1 = tx(parseFloat(rectMatch[1]));
      const y1 = ty(parseFloat(rectMatch[2]));
      const x2 = tx(parseFloat(rectMatch[3]));
      const y2 = ty(parseFloat(rectMatch[4]));
      body += `<rect x="${Math.min(x1, x2).toFixed(1)}" y="${Math.min(y1, y2).toFixed(1)}" width="${Math.abs(x2 - x1).toFixed(1)}" height="${Math.abs(y2 - y1).toFixed(1)}" fill="${strokeColor}1a" stroke="${strokeColor}" stroke-width="2.5" />`;
    }

    // \node at (x,y) {Text};
    const nodeMatch = line.match(/\\node(?:\s*\[[^\]]*\])?\s*(?:\([^)]*\))?\s*at\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*\{([^}]*)\}/i);
    if (nodeMatch) {
      const nx = tx(parseFloat(nodeMatch[1]));
      const ny = ty(parseFloat(nodeMatch[2]));
      body += `<text x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" fill="#f8fafc" font-family="Inter, sans-serif" font-size="13" font-weight="600" text-anchor="middle">${escapeXml(nodeMatch[3])}</text>`;
    }

    // Polyline segments separated by --
    if (line.includes('--') && !rectMatch && !circleMatch) {
      const lineCoords: Array<[number, number]> = [];
      const cRe = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
      let cm: RegExpExecArray | null;
      while ((cm = cRe.exec(line)) !== null) {
        lineCoords.push([parseFloat(cm[1]), parseFloat(cm[2])]);
      }
      if (lineCoords.length >= 2) {
        const pts = lineCoords.map(([px, py]) => `${tx(px).toFixed(1)},${ty(py).toFixed(1)}`).join(' ');
        const closed = line.includes('cycle');
        if (closed) {
          body += `<polygon points="${pts}" fill="${strokeColor}22" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round" />`;
        } else {
          body += `<polyline points="${pts}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
          if (line.includes('->')) {
            const pA = lineCoords[lineCoords.length - 2];
            const pB = lineCoords[lineCoords.length - 1];
            const sx1 = tx(pA[0]), sy1 = ty(pA[1]);
            const sx2 = tx(pB[0]), sy2 = ty(pB[1]);
            const ang = Math.atan2(sy2 - sy1, sx2 - sx1);
            body += `<polygon points="${sx2.toFixed(1)},${sy2.toFixed(1)} ${(sx2 - 11 * Math.cos(ang - 0.45)).toFixed(1)},${(sy2 - 11 * Math.sin(ang - 0.45)).toFixed(1)} ${(sx2 - 11 * Math.cos(ang + 0.45)).toFixed(1)},${(sy2 - 11 * Math.sin(ang + 0.45)).toFixed(1)}" fill="${strokeColor}" />`;
          }
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

/**
 * Clean fallback SVG flowchart rendered directly from node/arrow edges if Mermaid parser
 * fails on malformed LLM output — never displays Mermaid's bomb syntax error!
 */
function renderFallbackFlowchartSvg(rawCode: string, customColor?: string): string | null {
  const accent = customColor || '#38bdf8';
  const cleaned = (rawCode || '').replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const labelMap = new Map<string, string>();
  const edges: Array<[string, string, string?]> = [];

  const extractNode = (token: string): { id: string; label: string } | null => {
    const t = token.trim();
    if (!t) return null;
    const m = t.match(/^([A-Za-z0-9_-]+)\s*(?:\[\s*"?([^"\]]*)"?\s*\]|\(\s*"?([^")]*)"?\s*\)|\{\s*"?([^"}]*)?"?\s*\})?/);
    if (!m) return null;
    const id = m[1];
    const lbl = (m[2] || m[3] || m[4] || id).trim();
    if (!labelMap.has(id) || lbl !== id) {
      labelMap.set(id, lbl);
    }
    return { id, label: lbl };
  };

  for (const rawLine of cleaned.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || MERMAID_HEADER_REGEX.test(line) || line.startsWith('%%') || line.startsWith('subgraph') || line === 'end') continue;
    const parts = line.split(/\s*(?:-->|==>|-.->|->)\s*/);
    if (parts.length >= 2) {
      for (let i = 0; i < parts.length - 1; i++) {
        let edgeLbl: string | undefined;
        let right = parts[i + 1].trim();
        const pipeMatch = right.match(/^\|([^|]+)\|\s*(.+)$/);
        if (pipeMatch) {
          edgeLbl = pipeMatch[1].replace(/^"|"$/g, '').trim();
          right = pipeMatch[2].trim();
        }
        const a = extractNode(parts[i]);
        const b = extractNode(right);
        if (a && b) edges.push([a.id, b.id, edgeLbl]);
      }
    }
  }

  const nodeIds = Array.from(labelMap.keys());
  if (nodeIds.length === 0) return null;

  const isHorizontal = /\b(LR|RL)\b/i.test(cleaned.split(/\r?\n/)[0] || '');
  const boxW = 190;
  const boxH = 54;
  const gap = 56;
  const pad = 32;
  const w = isHorizontal ? Math.max(520, pad * 2 + nodeIds.length * boxW + (nodeIds.length - 1) * gap) : 520;
  const h = isHorizontal ? 240 : Math.max(220, pad * 2 + nodeIds.length * boxH + (nodeIds.length - 1) * gap);

  const pos = new Map<string, { x: number; y: number }>();
  nodeIds.forEach((id, idx) => {
    const x = isHorizontal ? pad + idx * (boxW + gap) : (w - boxW) / 2;
    const y = isHorizontal ? (h - boxH) / 2 : pad + idx * (boxH + gap);
    pos.set(id, { x, y });
  });

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      .fb-box { fill: rgba(30, 41, 59, 0.85); stroke: ${accent}; stroke-width: 2; }
      .fb-txt { font-family: Inter, sans-serif; font-size: 13px; font-weight: 600; fill: #f8fafc; text-anchor: middle; }
      .fb-edge { stroke: #93c5fd; stroke-width: 2; fill: none; }
      .fb-elbl { font-family: Inter, sans-serif; font-size: 11px; fill: #bae6fd; text-anchor: middle; }
    </style>`;

  edges.forEach(([aId, bId, eLbl]) => {
    const pA = pos.get(aId);
    const pB = pos.get(bId);
    if (!pA || !pB) return;
    const x1 = isHorizontal ? pA.x + boxW : pA.x + boxW / 2;
    const y1 = isHorizontal ? pA.y + boxH / 2 : pA.y + boxH;
    const x2 = isHorizontal ? pB.x : pB.x + boxW / 2;
    const y2 = isHorizontal ? pB.y + boxH / 2 : pB.y;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="fb-edge" />`;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    svg += `<polygon points="${x2},${y2} ${(x2 - 10 * Math.cos(ang - 0.45)).toFixed(1)},${(y2 - 10 * Math.sin(ang - 0.45)).toFixed(1)} ${(x2 - 10 * Math.cos(ang + 0.45)).toFixed(1)},${(y2 - 10 * Math.sin(ang + 0.45)).toFixed(1)}" fill="#93c5fd" />`;
    if (eLbl) {
      svg += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" class="fb-elbl">${escapeXml(eLbl.slice(0, 22))}</text>`;
    }
  });

  nodeIds.forEach((id) => {
    const p = pos.get(id)!;
    const lbl = (labelMap.get(id) || id).slice(0, 26);
    svg += `<rect x="${p.x}" y="${p.y}" width="${boxW}" height="${boxH}" rx="10" class="fb-box" />`;
    svg += `<text x="${p.x + boxW / 2}" y="${p.y + boxH / 2 + 5}" class="fb-txt">${escapeXml(lbl)}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Main dispatcher: Renders any supported code string into crisp Scalable Vector Graphics (SVG)
 */
export async function renderDiagramToSvg(
  code: string,
  forcedType?: DiagramType,
  customColor?: string
): Promise<{ svg: string; width: number; height: number; type: DiagramType }> {
  const type = forcedType || detectDiagramType(code);

  try {
    if (type === 'graph') {
      let spec: GraphSpec;
      const trimmed = code.trim();
      if (trimmed.startsWith('{')) {
        spec = safeParseJsonSpec<GraphSpec>(trimmed, {
          type: 'graph',
          expressions: ['y = x^2 - 4'],
          xRange: [-5, 5],
          yRange: [-5, 10],
          axes: true,
          grid: true,
        });
      } else {
        const exprs = trimmed
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && (l.startsWith('y =') || l.startsWith('f(x)') || l.includes('x')));
        spec = {
          type: 'graph',
          expressions: exprs.length > 0 ? exprs : ['y = x^2 - 4'],
          xRange: [-5, 5],
          yRange: [-5, 10],
          axes: true,
          grid: true,
        };
      }
      const svg = renderMathGraphSvg(spec, customColor);
      return { svg, width: spec.width || 700, height: spec.height || 460, type: 'graph' };
    }

    if (type === 'chart') {
      const defaultChart: ChartSpec = {
        type: 'chart',
        chartType: 'bar',
        title: 'Data Comparison Chart',
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [25, 48, 38, 64],
      };
      const spec = safeParseJsonSpec<ChartSpec>(code.trim(), defaultChart);
      const svg = renderChartSvg(spec, customColor);
      return { svg, width: spec.width || 680, height: spec.height || 400, type: 'chart' };
    }

    if (type === 'tikz') {
      const svg = renderTikzSvg(code, customColor);
      return { svg, width: 640, height: 400, type: 'tikz' };
    }

    if (type === 'geometry') {
      const trimmed = code.trim();
      const defaultGeom: GeometrySpec = {
        type: 'geometry',
        title: 'Geometric Figure',
        shapes: [
          { kind: 'triangle', points: [[-3, -2], [3, -2], [3, 2.5]], label: 'Triangle ABC', rightAngle: true },
        ],
      };
      const spec = safeParseJsonSpec<GeometrySpec>(trimmed, defaultGeom);
      const svg = renderGeometrySvg(spec, customColor);
      return { svg, width: spec.width || 600, height: spec.height || 420, type: 'geometry' };
    }

    if (type === 'circuit') {
      const trimmed = code.trim();
      const defaultCircuit: CircuitSpec = {
        type: 'circuit',
        title: 'Digital Logic Circuit',
        gates: [{ type: 'AND', x: 220, y: 140, inputs: ['A', 'B'], output: 'Y = A·B' }],
      };
      const spec = safeParseJsonSpec<CircuitSpec>(trimmed, defaultCircuit);
      const svg = renderCircuitSvg(spec, customColor);
      return { svg, width: spec.width || 680, height: spec.height || 380, type: 'circuit' };
    }

    if (type === 'timing') {
      const trimmed = code.trim();
      const defaultTiming: TimingSpec = {
        signal: [
          { name: 'clk', wave: 'p........' },
          { name: 'data', wave: '0.1.01.0.' },
        ],
      };
      const spec = safeParseJsonSpec<TimingSpec>(trimmed, defaultTiming);
      const svg = renderTimingSvg(spec, customColor);
      return { svg, width: 680, height: 260, type: 'timing' };
    }

    // Default to Mermaid.js for Flowcharts, DFD, UML
    const cleanCode = sanitizeMermaidCode(code);
    const tryRenderMermaid = async (source: string): Promise<string> => {
      return enqueueMermaidRender(async () => {
        ensureMermaidInit();
        cleanupMermaidDomArtifacts();
        const id = `mermaid-render-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mermaid.render(id, source);
        cleanupMermaidDomArtifacts();
        if (
          !svg ||
          /class="error-icon"|id="dmermaid"|syntax error in text|mermaid version/i.test(svg)
        ) {
          throw new Error('Mermaid syntax parsing error');
        }
        return svg;
      });
    };

    try {
      let svg: string;
      try {
        svg = await tryRenderMermaid(cleanCode);
      } catch {
        // Second-pass recovery: simplify labels inside quotes so nested symbols don't break Mermaid lexer
        const simplified = cleanCode
          .replace(/"([^"]*)"/g, (_m, inner) => `"${String(inner).replace(/[()[\]{}<>:;]/g, ' ').replace(/\s+/g, ' ').trim()}"`);
        svg = await tryRenderMermaid(simplified);
      }

      const normalized = normalizeMermaidSvg(svg, customColor);
      return {
        svg: normalized.svg,
        width: normalized.width,
        height: normalized.height,
        type: 'mermaid',
      };
    } catch (err: any) {
      cleanupMermaidDomArtifacts();
      // Third-pass native SVG flowchart renderer if Mermaid parser still rejects malformed syntax
      const nativeFlowSvg = renderFallbackFlowchartSvg(cleanCode, customColor);
      if (nativeFlowSvg) {
        return { svg: nativeFlowSvg, width: 650, height: 340, type: 'mermaid' };
      }
      throw err;
    }
  } catch (err: any) {
    cleanupMermaidDomArtifacts();
    // 100% Transparent, clean fallback SVG container without Mermaid bomb error
    const errSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" viewBox="0 0 600 180">
      <rect width="600" height="180" rx="10" fill="transparent" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4" />
      <text x="24" y="44" fill="#38bdf8" font-family="Inter, sans-serif" font-size="16" font-weight="bold">📐 Vector Diagram Ready</text>
      <text x="24" y="78" fill="#f8fafc" font-family="monospace" font-size="12">${escapeXml((err?.message || String(err)).slice(0, 70))}</text>
      <text x="24" y="110" fill="#94a3b8" font-family="Inter, sans-serif" font-size="12">Click '✏️ Edit Code' to customize or generate diagram shapes.</text>
    </svg>`;
    return { svg: errSvg, width: 600, height: 180, type };
  }
}

/**
 * Converts raw SVG code into an encoded data URL for <img> or Whiteboard ImageObject insertion
 */
export function diagramSvgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

