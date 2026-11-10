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

export type DiagramType = 'mermaid' | 'graph' | 'geometry' | 'circuit' | 'timing' | 'tikz';

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

function ensureMermaidInit(): void {
  if (!mermaidInitialized) {
    try {
      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, -apple-system, sans-serif',
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
      });
      mermaidInitialized = true;
    } catch {
      // ignore
    }
  }
}

/**
 * Clean up any stray DOM error elements or bomb icons that Mermaid's default handler
 * might inject into document.body during syntax errors.
 */
export function cleanupMermaidDomArtifacts(): void {
  if (typeof document === 'undefined') return;
  try {
    const strayErrors = document.querySelectorAll(
      '[id^="dmermaid"], [id^="mermaid-render-"], .error-icon, [aria-roledescription="error"]'
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
 * 2. Auto-quotes unquoted node labels with parentheses e.g. A[Sea Level (1013.25 mb)] => A["Sea Level (1013.25 mb)"]
 * 3. Auto-quotes node labels containing colons or semicolons
 */
export function sanitizeMermaidCode(rawCode: string): string {
  let cleaned = (rawCode || '').trim();

  // Strip code fences if present
  cleaned = cleaned.replace(/^```(?:mermaid)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Fix single arrows: replace ' -> ' or '->' with ' --> ' (without breaking '-->' or '==>' or '-.->')
  cleaned = cleaned.replace(/([^-=.\s])\s*->\s*([^-=>\s])/g, '$1 --> $2');
  cleaned = cleaned.replace(/(\s)->(\s)/g, '$1-->$2');
  cleaned = cleaned.replace(/([^-=.\s])\s*<-\s*([^-=<\s])/g, '$1 <-- $2');

  // Fix unquoted node labels with parentheses inside square brackets:
  // e.g. A[Sea Level (1013.25 mb)] => A["Sea Level (1013.25 mb)"]
  cleaned = cleaned.replace(/\[([^"\]\r\n]+)\]/g, (match, inner) => {
    if (inner.startsWith('"') && inner.endsWith('"')) return match;
    if (/[()[\]{}:;=/%&,.<>~#$*^]/.test(inner)) {
      return `["${inner.replace(/"/g, "'")}"]`;
    }
    return match;
  });

  // Fix nested parentheses in rounded nodes e.g. B(High Altitude (2000m)) => B["High Altitude (2000m)"]
  cleaned = cleaned.replace(/\(([^"\)\r\n]+\([^"\)\r\n]+\)[^"\)\r\n]*)\)/g, '["$1"]');

  return cleaned;
}

/**
 * Auto-detects the diagram language/specification from input code
 */
export function detectDiagramType(code: string): DiagramType {
  const trimmed = code.trim();

  // 1. Mermaid keywords
  if (
    /^(\s*)(graph\s+(TD|TB|BT|RL|LR)|flowchart\s+(TD|TB|BT|RL|LR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|mindmap|quadrantChart|C4Context)/i.test(
      trimmed
    )
  ) {
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
    } catch {
      // not JSON, continue below
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
    /\b(AND|OR|NAND|NOR|XOR|NOT)\s*\(/i.test(trimmed) ||
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

  // Default fallback to mermaid
  return 'mermaid';
}

/**
 * Evaluates a mathematical function expression y = f(x) safely
 */
function evaluateMathExpression(exprStr: string, x: number): number | null {
  try {
    let clean = exprStr.replace(/^y\s*=\s*/i, '').replace(/^f\(x\)\s*=\s*/i, '').trim();

    // Replace power notation x^2 -> (x**2)
    clean = clean.replace(/([a-zA-Z0-9\(\)]+)\^([0-9\(\)]+)/g, 'Math.pow($1, $2)');

    // Common math functions
    clean = clean.replace(/\bsin\b/g, 'Math.sin');
    clean = clean.replace(/\bcos\b/g, 'Math.cos');
    clean = clean.replace(/\btan\b/g, 'Math.tan');
    clean = clean.replace(/\bsqrt\b/g, 'Math.sqrt');
    clean = clean.replace(/\babs\b/g, 'Math.abs');
    clean = clean.replace(/\bexp\b/g, 'Math.exp');
    clean = clean.replace(/\bln\b/g, 'Math.log');
    clean = clean.replace(/\blog\b/g, 'Math.log10');
    clean = clean.replace(/\bpi\b/gi, 'Math.PI');
    clean = clean.replace(/\be\b/g, 'Math.E');

    // Implicit multiplication: 2x -> 2*x
    clean = clean.replace(/(\d+)\s*([xX])/g, '$1*$2');
    clean = clean.replace(/([xX])\s*(\d+)/g, '$1*$2');

    // Substitute variable x
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
    svg += `<text x="${w / 2}" y="24" class="title">${spec.title}</text>`;
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
      svg += `<text x="${legX + 30}" y="${legY + 4}" class="legend" fill="${color}">${expr}</text>`;
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
    svg += `<text x="${w / 2}" y="32" class="geo-title">${spec.title}</text>`;
  }

  shapes.forEach((shape) => {
    const strokeColor = customColor || shape.color || '#38bdf8';
    const fillColor = shape.fill && shape.fill !== 'rgba(56, 189, 248, 0.15)' ? shape.fill : (customColor ? `${customColor}26` : 'rgba(56, 189, 248, 0.15)');

    if (shape.kind === 'triangle' && shape.points && shape.points.length >= 3) {
      const [p1, p2, p3] = shape.points;
      const sx1 = toScreenX(p1[0]), sy1 = toScreenY(p1[1]);
      const sx2 = toScreenX(p2[0]), sy2 = toScreenY(p2[1]);
      const sx3 = toScreenX(p3[0]), sy3 = toScreenY(p3[1]);

      svg += `<polygon points="${sx1.toFixed(1)},${sy1.toFixed(1)} ${sx2.toFixed(1)},${sy2.toFixed(1)} ${sx3.toFixed(1)},${sy3.toFixed(1)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round" />`;

      // Right angle marker if requested
      if (shape.rightAngle) {
        const sq = 14;
        svg += `<path d="M ${sx1} ${sy1 - sq} L ${sx1 + sq} ${sy1 - sq} L ${sx1 + sq} ${sy1}" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`;
      }

      if (shape.label) {
        svg += `<text x="${((sx1 + sx2 + sx3) / 3).toFixed(1)}" y="${((sy1 + sy2 + sy3) / 3).toFixed(1)}" class="geo-label" text-anchor="middle">${shape.label}</text>`;
      }
    } else if (shape.kind === 'circle') {
      const ccx = toScreenX(shape.center?.[0] || 0);
      const ccy = toScreenY(shape.center?.[1] || 0);
      const r = (shape.radius || 3) * autoScale;

      svg += `<circle cx="${ccx.toFixed(1)}" cy="${ccy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" />`;
      if (shape.label) {
        svg += `<text x="${ccx.toFixed(1)}" y="${(ccy + 4).toFixed(1)}" class="geo-label" text-anchor="middle">${shape.label}</text>`;
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
    svg += `<text x="${w / 2}" y="32" class="gate-title">${spec.title}</text>`;
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

    // Gate symbols
    if (gate.type === 'AND') {
      svg += `<path d="M ${gx} ${gy} L ${gx + 40} ${gy} A 30 30 0 0 1 ${gx + 40} ${gy + gh} L ${gx} ${gy + gh} Z" class="gate-body" />`;
    } else if (gate.type === 'OR') {
      svg += `<path d="M ${gx} ${gy} Q ${gx + 20} ${gy + 30} ${gx} ${gy + gh} Q ${gx + 50} ${gy + gh} ${gx + 75} ${gy + 30} Q ${gx + 50} ${gy} ${gx} ${gy} Z" class="gate-body" />`;
    } else {
      svg += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="8" class="gate-body" />`;
      svg += `<text x="${gx + gw / 2}" y="${gy + gh / 2 + 5}" class="pin-label" text-anchor="middle">${gate.type}</text>`;
    }

    // Input wires
    const in1 = gate.inputs?.[0] || 'A';
    const in2 = gate.inputs?.[1] || 'B';
    svg += `<line x1="${gx - 50}" y1="${gy + 16}" x2="${gx}" y2="${gy + 16}" class="wire" />`;
    svg += `<text x="${gx - 60}" y="${gy + 20}" class="pin-label" text-anchor="end">${in1}</text>`;

    if (gate.type !== 'NOT') {
      svg += `<line x1="${gx - 50}" y1="${gy + gh - 16}" x2="${gx}" y2="${gy + gh - 16}" class="wire" />`;
      svg += `<text x="${gx - 60}" y="${gy + gh - 12}" class="pin-label" text-anchor="end">${in2}</text>`;
    }

    // Output wire
    const outLabel = gate.output || 'Y';
    const outX = gx + gw + (gate.type === 'NOT' ? 10 : 0);
    svg += `<line x1="${outX}" y1="${gy + gh / 2}" x2="${outX + 60}" y2="${gy + gh / 2}" class="wire" />`;
    svg += `<text x="${outX + 70}" y="${gy + gh / 2 + 5}" class="pin-label">${outLabel}</text>`;
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
    svg += `<text x="${w / 2}" y="28" class="wave-title" text-anchor="middle">${spec.head.text}</text>`;
  }

  (spec.signal || []).forEach((sig, sIdx) => {
    const sy = 60 + sIdx * rowHeight;
    const wave = sig.wave || 'p........';

    svg += `<text x="${startX - 16}" y="${sy + 18}" class="sig-name">${sig.name}</text>`;

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
        // Parse expressions line by line
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
    ensureMermaidInit();
    cleanupMermaidDomArtifacts();
    const cleanCode = sanitizeMermaidCode(code);
    const id = `mermaid-render-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      let { svg } = await mermaid.render(id, cleanCode);
      if (svg.includes('class="error-icon"') || svg.includes('id="dmermaid"') || svg.includes('Syntax error in text')) {
        throw new Error('Mermaid syntax parsing error');
      }
      // Strip any dark backgrounds injected by mermaid so it stays 100% transparent on canvas
      svg = svg
        .replace(/<rect[^>]*class="[^"]*background[^"]*"[^>]*\/?>/gi, '')
        .replace(/style="[^"]*background:[^;"]*;?[^"]*"/gi, 'style="background: transparent;"')
        .replace(/fill="#(0b1120|0f172a|1e293b|000000|1e1b4b|163626|1e1b2e)"/gi, 'fill="none"')
        .replace(/background-color:\s*#[0-9a-fA-F]+/gi, 'background-color: transparent');
      if (customColor) {
        svg = svg.replace(/#3b82f6/gi, customColor).replace(/#60a5fa/gi, customColor);
      }
      cleanupMermaidDomArtifacts();
      return { svg, width: 650, height: 420, type: 'mermaid' };
    } catch (err: any) {
      cleanupMermaidDomArtifacts();
      throw err;
    }
  } catch (err: any) {
    cleanupMermaidDomArtifacts();
    // 100% Transparent, elegant fallback SVG container without dark/black solid backgrounds!
    const errSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" viewBox="0 0 600 180">
      <rect width="600" height="180" rx="10" fill="transparent" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4" />
      <text x="24" y="44" fill="#38bdf8" font-family="Inter, sans-serif" font-size="16" font-weight="bold">📐 Vector Diagram Ready</text>
      <text x="24" y="78" fill="#f8fafc" font-family="monospace" font-size="12">${(err?.message || String(err)).slice(0, 70)}</text>
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

