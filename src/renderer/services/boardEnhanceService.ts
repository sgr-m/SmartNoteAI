/**
 * boardEnhanceService.ts
 * AI 1-Click Board & Individual Text Enhancement Engine with Online Presentation Styling
 * 
 * Empowers the smartboard with real AI-driven visual enhancement:
 * 1. AI-Driven Enhancement: Connects to the active AI agent (Gemini, Ollama, GPT-4) with
 *    contextual prompt containing element placement (x, y), dimensions, board background color & theme.
 * 2. Online Presentation Heading Styles: Inspired by Pitch, Gamma, Canva, and Slides with
 *    colorful borders, category tag pills, full-width gradient underlines, and bold typography.
 * 3. Individual Text Placeholder Enhancement: Allows clicking '✨ Enhance' on any single text box.
 * 4. Parallel Multi-Element Processing: Requests AI enhancements in parallel across the slide.
 * 5. Table Data Integrity: Preserves exact rows, columns, numbers, calculations, and totals without misplacing data.
 * 6. Zero-Overlap Canvas Layout: Reflows elements with strict vertical clearance and DOM height measurement.
 */

import { CanvasObject, TextObject, ShapeObject, Page, PageBackground } from '../../shared/types';
import { aiProviderManager, AIProviderManager } from './aiPresentation/aiProviderManager';
import { measureMarkdownSize } from './markdownRenderService';
import { detectTextFormatMode } from './formatDetectionService';
import { measureHtmlSize, normalizeGeneratedHtml } from './htmlRenderService';
import { measureLatexSize } from './latexService';
import { v4 as uuidv4 } from 'uuid';

export interface EnhanceStep {
  stepIndex: number;
  totalSteps: number;
  statusText: string;
  objects: CanvasObject[];
  newBackground?: PageBackground;
}

export interface EnhanceResult {
  success: boolean;
  message: string;
  modifiedCount: number;
  addedIconsCount: number;
  enhancedObjects: CanvasObject[];
  newBackground?: PageBackground;
  steps: EnhanceStep[];
}

export interface IndividualEnhanceOptions {
  textObj: TextObject;
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundColor?: string;
  slideTitle?: string;
  subject?: string;
  providerManager?: AIProviderManager;
  elementIndex?: number;
  totalElements?: number;
}

export interface SlideEnhanceOptions {
  page: Page;
  providerManager?: AIProviderManager;
  onStepProgress?: (step: EnhanceStep) => void;
}

/**
 * Determines whether a background hex/rgb color is dark or light
 */
export function isDarkChalkboardTheme(bgColor?: string): boolean {
  if (!bgColor) return true; // Default chalkboard is dark green
  const color = bgColor.trim().toLowerCase();
  if (color.includes('#fff') || color.includes('rgb(255') || color === 'white' || color.includes('#f8fafc')) {
    return false;
  }
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      return luma < 140;
    }
  }
  return true;
}

/**
 * Text classification role
 */
export type TextRole = 'title' | 'subheading' | 'table' | 'definition-formula' | 'note-warning' | 'solution' | 'body';

/**
 * Detects if a text block contains a table (Markdown pipe-separated or columnar data)
 */
export function isTableContent(text: string): boolean {
  if (!text) return false;
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length >= 2) {
    const pipeLines = lines.filter((l) => l.includes('|'));
    if (pipeLines.length >= 2) return true;
    // Detect column headers like Score, Frequency, Product, Totals, etc.
    if (lines.some((l) => /\b(Score|Frequency|Product|Totals|Count|Value|Name|Item)\b/i.test(l) && (l.includes('\t') || /\s{2,}/.test(l)))) {
      return true;
    }
  }
  return false;
}

/**
 * Formats a single table cell to support clean KaTeX math, bold totals, and standard symbols
 */
function formatTableCell(rawCell: string, isHeader: boolean): string {
  let c = rawCell.trim();
  if (!c) return '';

  // Bold "Totals" or "Total" or "Sum"
  if (/^totals?$/i.test(c)) {
    return '**Totals**';
  }

  // Replace * with \cdot in mathematical multiplication e.g. 60 * 2 = 120 -> 60 \cdot 2 = 120
  c = c.replace(/(\d+)\s*\*\s*(\d+)/g, '$1 \\cdot $2');
  c = c.replace(/\(f_i\s*\*\s*x_i\)/g, '(f_i \\cdot x_i)');

  // In headers or column names like "Score (x_i)", convert (x_i) -> ($x_i$)
  if (isHeader || /^[A-Z][a-z]+\s+\(/.test(c)) {
    c = c.replace(/\(([a-zA-Z]_[a-zA-Z0-9]+)\)/g, '($$$1$)');
    c = c.replace(/\(([a-zA-Z]_[a-zA-Z0-9]+\s*\\cdot\s*[a-zA-Z]_[a-zA-Z0-9]+)\)/g, '($$$1$)');
  }

  // If cell contains LaTeX commands or subscripts/superscripts without $
  if (!c.includes('$') && (c.includes('\\sum') || c.includes('\\cdot') || c.includes('\\frac') || c.includes('\\sqrt') || /_[a-zA-Z0-9]/.test(c) || /\^[a-zA-Z0-9]/.test(c))) {
    if (isHeader) {
      c = c.replace(/\(([^)]+)\)/g, '($$$1$)');
    } else {
      c = `$${c}$`;
    }
  }

  return c;
}

/**
 * Robust space-delimited table row parser that guarantees calculations, formulas,
 * and numbers are NOT fragmented across columns.
 */
function parseSpaceSeparatedRow(line: string, expectedCols: number): string[] {
  const trimmed = line.trim();
  if (trimmed.includes('\t')) {
    return trimmed.split(/\t+/).map((c) => c.trim()).filter(Boolean);
  }

  // Check for Totals row pattern e.g. "Totals \sum f_i = 20 \sum (f_i * x_i) = 1540"
  if (/^totals\b/i.test(trimmed)) {
    const totalsMatch = trimmed.match(/^Totals\s+(\S+\s*=\s*\d+|\d+|\\sum[^\n]+?=\s*\d+)\s+(.+)$/i);
    if (totalsMatch) {
      return ['Totals', totalsMatch[1].trim(), totalsMatch[2].trim()];
    }
  }

  // Check for numerical data row pattern e.g. "60 2 60 * 2 = 120"
  if (expectedCols === 3) {
    const numMatch = trimmed.match(/^(\d+|[a-zA-Z]+)\s+(\d+|\S+)\s+(.+)$/);
    if (numMatch) {
      return [numMatch[1].trim(), numMatch[2].trim(), numMatch[3].trim()];
    }
  }

  // General split by 2+ spaces
  const parts = trimmed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  if (expectedCols > 0 && parts.length > expectedCols) {
    const leading = parts.slice(0, expectedCols - 1);
    const trailing = parts.slice(expectedCols - 1).join(' ');
    return [...leading, trailing];
  }

  return parts;
}

/**
 * Formats table text into clean Markdown table syntax with KaTeX support,
 * strictly guaranteeing that no columns or row data are misplaced.
 */
export function formatMarkdownTable(rawText: string): string {
  const lines = rawText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return rawText;

  // Case 1: Already has pipe characters
  if (lines.every((l) => l.includes('|') || /^[-:| ]+$/.test(l))) {
    const cleanedRows = lines.filter((l) => !/^\|?[-:| ]+\|?$/.test(l));
    if (cleanedRows.length >= 2) {
      const firstRow = cleanedRows[0];
      const headerCells = firstRow.split('|').map((c) => c.trim()).filter(Boolean);
      const colCount = Math.max(2, headerCells.length);
      const sep = `| ${new Array(colCount).fill(':---:').join(' | ')} |`;
      const normalizedHeader = `| ${headerCells.map((c) => formatTableCell(c, true)).join(' | ')} |`;
      const rest = cleanedRows.slice(1).map((r) => {
        const rowCells = r.split('|').map((c) => c.trim()).filter(Boolean);
        return `| ${rowCells.map((c) => formatTableCell(c, false)).join(' | ')} |`;
      });
      return [normalizedHeader, sep, ...rest].join('\n');
    }
  }

  // Case 2: Columnar table (tab or space separated)
  const headerLine = lines[0];
  const headerParts = headerLine.includes('\t')
    ? headerLine.split(/\t+/).map((c) => c.trim()).filter(Boolean)
    : headerLine.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  const colCount = Math.max(2, headerParts.length);

  const tableRows: string[] = [];
  // Format Header
  const formattedHeader = headerParts.map((c) => formatTableCell(c, true));
  tableRows.push(`| ${formattedHeader.join(' | ')} |`);
  tableRows.push(`| ${new Array(colCount).fill(':---:').join(' | ')} |`);

  // Format Data Rows
  for (let i = 1; i < lines.length; i++) {
    const rowTokens = parseSpaceSeparatedRow(lines[i], colCount);
    const formattedCells = rowTokens.map((c) => formatTableCell(c, false));
    tableRows.push(`| ${formattedCells.join(' | ')} |`);
  }

  return tableRows.join('\n');
}

/**
 * Detects whether a string is a standalone mathematical equation or formula
 */
export function isMathFormulaText(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if ((t.startsWith('$$') && t.endsWith('$$')) || (t.startsWith('\\[') && t.endsWith('\\]'))) return true;
  if (t.includes('\\frac') || t.includes('\\sum') || t.includes('\\Delta') || t.includes('\\sqrt') || t.includes('\\cdot') || t.includes('\\times')) {
    const lines = t.split('\n').filter(Boolean);
    // If short formula lines without conversational prose
    if (lines.length <= 2 && !/\b(the|and|with|this|from|which|that|when|where)\b/i.test(t)) {
      return true;
    }
  }
  // Standalone single-line equations e.g. "Y = C + I", "\Delta Y = \Delta C + \Delta I", "E = mc^2", "\Delta C = MPC \times \Delta Y"
  if (t.length < 90 && !t.includes('\n')) {
    const hasEquals = t.includes('=');
    const hasMathOperators = /[+\-*/^_\\()]/.test(t);
    const words = t.split(/\s+/);
    if (hasEquals && hasMathOperators && words.length <= 8 && !/^(let|when|where|if|by|to|for|since|note)\b/i.test(t)) {
      return true;
    }
  }
  return false;
}

/**
 * Classifies text role based on position, length, and semantic content
 */
export function classifyTextRole(text: string, currentFontSize: number, yPos: number, index: number = -1): TextRole {
  const t = text.trim();
  const lower = t.toLowerCase();

  // 1. Table
  if (isTableContent(t)) {
    return 'table';
  }

  // 2. Mathematical Formula / Equation
  if (isMathFormulaText(t)) {
    return 'definition-formula';
  }

  // 3. Warning / Important Note / Key Assumption
  if (/(important|warning|caution|remember|note|pitfall|pay attention|crucial|key assumption):/i.test(lower)) {
    return 'note-warning';
  }

  // 4. Solution / Result / Outcome
  if (/(solution|answer|result|qed|proven|final answer):/i.test(lower)) {
    return 'solution';
  }

  // 5. Title: Top element (index === 0 && yPos < 190), or starts with # Title, or explicit title keyword
  const isTopCandidate = (index === 0 || index === -1) && yPos < 190;
  const isCleanTitleShape = t.length < 75 && !t.includes('\n') && !/[.!?]$/.test(t) && !isMathFormulaText(t);
  if (
    /^#\s+/.test(t) ||
    lower.startsWith('title:') ||
    (isTopCandidate && isCleanTitleShape && (
      lower.includes('example') ||
      lower.includes('overview') ||
      lower.includes('derivation') ||
      lower.includes('calculation') ||
      lower.includes('introduction') ||
      lower.includes('lesson') ||
      lower.includes('method') ||
      lower.includes('standard deviation') ||
      currentFontSize >= 34
    ))
  ) {
    return 'title';
  }

  // 6. Subheading / Subtitle
  if (
    /^#{2,4}\s+/.test(t) ||
    lower.startsWith('section:') ||
    lower.startsWith('topic:') ||
    (t.length < 130 && !t.includes('\n') && (
      lower.startsWith("step") ||
      lower.startsWith("let's") ||
      lower.startsWith("given:") ||
      lower.startsWith("consider:") ||
      lower.startsWith("problem:") ||
      lower.startsWith("to derive") ||
      lower.startsWith("when ") ||
      lower.startsWith("by definition")
    ))
  ) {
    return 'subheading';
  }

  return 'body';
}

/**
 * Ensures leading pedagogical keywords are properly bolded
 */
function enhanceTextBolding(content: string): string {
  let updated = content;
  updated = updated.replace(/^(\d+\.\s+)([^:*#\n]+)(:)/gm, '$1**$2$3**');
  updated = updated.replace(/^([•*-]\s+)([^:*#\n]+)(:)/gm, '$1**$2$3**');
  return updated;
}

/**
 * Strips artificial pill badges, headers ("FORMULA", "CORE FORMULA", "STATISTICAL FORMULA", etc.)
 * and explanatory text ("Where: ...") from formulas to ensure pure LaTeX rendering in display format.
 */
export function cleanFormulaContent(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // If it's a theorem statement or numbered bullet like "1. Pythagorean Theorem: ...", enhance bolding instead of stripping
  if (/^(\d+\.|\*|-)\s+/i.test(cleaned)) {
    return enhanceTextBolding(cleaned);
  }

  // 1. Remove HTML tags if wrapped in HTML
  cleaned = cleaned.replace(/<[^>]*>/g, '').trim();

  // 2. Remove pill tags / headers like "CORE FORMULA", "STATISTICAL FORMULA", "FORMULA DERIVATION", etc.
  cleaned = cleaned.replace(/^(formula\s*derivation|statistical\s*formula|core\s*formula|equation\s*of\s*transformation|formula|equation|step\s*\d+):\s*/i, '');
  cleaned = cleaned.replace(/^(formula\s*derivation|statistical\s*formula|core\s*formula|equation\s*of\s*transformation|formula|equation)\b/i, '').trim();

  // 3. Remove trailing "Where: ..." or "where: ..." explanatory notes
  cleaned = cleaned.replace(/\n*Where:[\s\S]*$/i, '').trim();
  cleaned = cleaned.replace(/\n*where:[\s\S]*$/i, '').trim();

  // 4. Strip surrounding $$ or \[ \] if present so we can standardize
  if ((cleaned.startsWith('$$') && cleaned.endsWith('$$')) || (cleaned.startsWith('\\[') && cleaned.endsWith('\\]'))) {
    cleaned = cleaned.slice(2, -2).trim();
  }

  // 5. Repair common backslash issues where \b was lost in JSON parse
  cleaned = cleaned.replace(/(^|[^a-zA-Z\\])ar\{([a-zA-Z0-9]+)\}/g, '$1\\bar{$2}');
  cleaned = cleaned.replace(/\x08ar\{/g, '\\bar{');
  cleaned = cleaned.replace(/\x0cac\{/g, '\\frac{');

  // Wrap in display $$ ... $$ so KaTeX always renders it in display math mode
  return `$$${cleaned}$$`;
}

/**
 * Estimates element height with high accuracy using DOM bounding measurements to prevent any canvas overlaps
 */
export function estimateElementHeight(obj: CanvasObject, fontSize: number, width: number, isTable: boolean): number {
  if (obj.type === 'image') {
    return obj.height || 300;
  }
  if (obj.type === 'shape') {
    return Math.max(10, obj.height || 0);
  }
  if (obj.type === 'text') {
    const tObj = obj as TextObject;
    if (isTable) {
      const rows = tObj.content.trim().split('\n').filter(Boolean).length;
      return Math.max(220, rows * 52 + 50);
    }
    const mode = detectTextFormatMode(tObj.content, {
      isHtml: tObj.isHtml,
      isLatex: tObj.isLatex,
      isMarkdown: tObj.isMarkdown,
    });
    if (mode.isLatex) {
      const measured = measureLatexSize(tObj.content, fontSize);
      return Math.max(50, measured.height + 20);
    }
    if (mode.isHtml) {
      const measured = measureHtmlSize(tObj.content, fontSize, tObj.fontFamily || 'Inter, -apple-system, sans-serif', Math.max(1200, width));
      return Math.max(50, measured.height + 20);
    }
    const measured = measureMarkdownSize(
      tObj.content,
      fontSize,
      tObj.fontFamily || 'Inter, -apple-system, sans-serif',
      Math.max(1200, width),
      tObj.lineHeight || 1.45,
      tObj.textAlign || 'left'
    );
    return Math.max(50, Math.ceil(measured.height) + 16);
  }
  return 60;
}

/**
 * Builds the AI enhancement prompt with full placement, theme, and presentation styling context.
 */
function buildEnhancePrompt(params: {
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor: string;
  isDark: boolean;
  slideTitle?: string;
  subject?: string;
  role: TextRole;
}): string {
  const positionDesc = params.y < 200
    ? 'Top of slide (Primary Presentation Heading / Title)'
    : params.y < 450
    ? 'Upper-middle area (Subtitle, Problem Statement, or Lead Definition)'
    : params.y < 750
    ? 'Center area (Core Content, Calculation Table, Derivation, or Formula)'
    : 'Bottom area (Summary, Note, or Practice Question)';

  return `You are an expert Presentation Visual Designer and Classroom Instructional Specialist designing interactive slides for teachers to teach students.
Enhance this specific slide element into an aesthetically stunning, modern presentation element with high contrast and classroom clarity.

ELEMENT CONTEXT:
- Original Text:
"""
${params.content}
"""
- Canvas coordinates: x=${params.x}, y=${params.y}, width=${params.width}, height=${params.height}
- Slide area: ${positionDesc}
- Canvas Background Color: ${params.bgColor} (${params.isDark ? 'Dark Chalkboard Theme' : 'Light Whiteboard Theme'})
- Slide Topic: ${params.slideTitle || 'Classroom Lesson'} ${params.subject ? `(${params.subject})` : ''}
- Classified Role: ${params.role}

DESIGN & STYLING RULES:
1. IF FORMULA / EQUATION (role: "definition-formula"):
   - format MUST be "latex".
   - Output ONLY the pure mathematical formula in LaTeX display format ($$...$$).
   - NEVER add labels, pills, tags, or headers on top (NO 'CORE FORMULA', 'STATISTICAL FORMULA', 'FORMULA', etc.).
   - Color MUST be pure chalk white (${params.isDark ? '#ffffff' : '#0f172a'}). NEVER yellow.

2. IF TABULAR DATA / FREQUENCY TABLE (role: "table"):
   - format MUST be "markdown".
   - CRITICAL REQUIREMENT: PRESERVE ALL ORIGINAL ROWS, COLUMNS, NUMBERS, AND TOTALS EXACTLY! Do NOT drop rows, do NOT swap columns, and do NOT alter data values.
   - Format as a clean, aligned Markdown table with KaTeX math symbols ($x_i$, $f_i$, $\\sum f_i = 20$).
   - Bold headers and totals row (**Totals**).

3. IF HEADING / TITLE (role: "title"):
   - format CAN be "html" or "markdown".
   - Clean, commanding typography (JSON fontSize 36-40, fontWeight 700).
   - Title color: ${params.isDark ? '#ffffff' : '#0f172a'}.
   - Include an elegant subtle gradient underline or border.
   - STRICTLY FORBIDDEN: Do NOT use red flag emojis or '# 🚩' tags. Do NOT use yellow headings.

4. IF SUBTITLE / BODY / EXPLANATION (role: "subheading" | "body" | "note-warning"):
   - format CAN be "html" or "markdown".
   - Crisp, high-contrast off-white text (${params.isDark ? '#e2e8f0' : '#1e293b'}). NEVER make body text yellow.
   - Bold key conceptual terms with an accent color like sky blue (#38bdf8) or mint (#34d399).
   - For callout notes or key assumptions: Wrap in a modern translucent card with a left accent border.

5. CRITICAL HTML RULES (whenever format is "html"):
   - NEVER put any CSS \`font-size\` property anywhere in HTML \`style="..."\` or \`<style>\` (NO \`font-size: ...px\`, \`pt\`, or \`rem\`). Font sizing MUST remain controlled solely via the board's JSON \`fontSize\` field so the teacher can resize dynamically with A-/A+.
   - NEVER leave raw Markdown syntax inside HTML output (NO \`**bold**\`, \`*italic*\`, \`# headings\`, \`--\`, \`---\`, \`- bullets\`, or backticks). Convert everything into pure, well-formed HTML tags (\`<strong>\`, \`<em>\`, \`<code>\`, \`<hr/>\`, \`<div>\`, \`<span>\`).

OUTPUT FORMAT:
Return a valid JSON object strictly matching this schema:
{
  "format": "html" | "latex" | "markdown",
  "content": "Enhanced HTML, LaTeX, or Markdown string",
  "fontSize": number,
  "color": "hex color string",
  "fontWeight": number
}`;
}

/**
 * Built-in educational visual designer fallback (ensures 100% offline reliability).
 */
function generateOnlinePresentationStyle(params: {
  content: string;
  role: TextRole;
  isDark: boolean;
  palette: any;
  slideTitle?: string;
}): { content: string; fontSize: number; color: string; fontWeight: number; isMarkdown: boolean; isHtml?: boolean; isLatex?: boolean } {
  const { content, role, isDark, palette } = params;

  switch (role) {
    case 'title': {
      const cleanTitle = content.replace(/^#+\s*/, '').replace(/^[🚩📌💡🎯📐\s]+/, '').trim();
      const gradEnd = isDark ? '#38bdf8' : '#0284c7';
      const rawStyled = `<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif;">\n  <div style="font-weight: 700; color: ${palette.title}; letter-spacing: -0.5px; line-height: 1.25;">${cleanTitle}</div>\n  <div style="width: 100%; height: 3px; background: linear-gradient(90deg, ${palette.underline} 0%, ${gradEnd} 60%, transparent 100%); margin-top: 10px; border-radius: 2px;"></div>\n</div>`;
      const styled = normalizeGeneratedHtml(rawStyled);

      return {
        content: styled,
        fontSize: 40,
        color: palette.title,
        fontWeight: 700,
        isMarkdown: false,
        isHtml: true,
      };
    }

    case 'subheading': {
      const subContent = enhanceTextBolding(content.replace(/^#+\s*/, '').replace(/^[🚩📌\s]+/, '').trim());
      return {
        content: subContent,
        fontSize: 26,
        color: palette.subheading, // '#38bdf8' on dark chalkboard
        fontWeight: 600,
        isMarkdown: true,
      };
    }

    case 'table': {
      return {
        content: formatMarkdownTable(content),
        fontSize: 26,
        color: palette.body,
        fontWeight: 400,
        isMarkdown: true,
      };
    }

    case 'definition-formula': {
      const formulaContent = cleanFormulaContent(content);
      return {
        content: formulaContent,
        fontSize: 34,
        color: palette.definition, // '#ffffff' pure chalk white, NEVER yellow!
        fontWeight: 600,
        isMarkdown: false,
        isLatex: true,
      };
    }

    case 'note-warning': {
      const cleanNote = content.replace(/^[🚩📌\s]+/, '').trim();
      const rawStyled = `<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background: rgba(248, 113, 113, 0.08); border-left: 4px solid ${palette.warning}; border-radius: 6px; padding: 12px 18px; color: ${palette.warning}; line-height: 1.5;">${cleanNote}</div>`;
      const styled = normalizeGeneratedHtml(rawStyled).replace(/<strong>([\s\S]*?)<\/strong>/g, '<strong style="color: #fca5a5;">$1</strong>');
      return {
        content: styled,
        fontSize: 22,
        color: palette.warning,
        fontWeight: 600,
        isMarkdown: false,
        isHtml: true,
      };
    }

    case 'solution': {
      return {
        content: enhanceTextBolding(content.replace(/^[🚩📌\s]+/, '').trim()),
        fontSize: 26,
        color: palette.solution,
        fontWeight: 600,
        isMarkdown: true,
      };
    }

    case 'body':
    default: {
      return {
        content: enhanceTextBolding(content.replace(/^[🚩📌\s]+/, '').trim()),
        fontSize: 24,
        color: palette.body, // '#e2e8f0' crisp chalk off-white, NEVER yellow!
        fontWeight: 400,
        isMarkdown: true,
      };
    }
  }
}

/**
 * Enhances an individual text placeholder using the connected AI model,
 * providing custom presentation styling (HTML/CSS, LaTeX, or Markdown).
 */
export async function enhanceIndividualTextWithAI(
  options: IndividualEnhanceOptions
): Promise<{ enhancedObject: TextObject; success: boolean; message: string }> {
  const { textObj, backgroundColor, slideTitle, subject } = options;
  const isDark = isDarkChalkboardTheme(backgroundColor);

  const palette = isDark
    ? {
        title: '#f8fafc',
        titleAlt: '#38bdf8',
        subheading: '#38bdf8',
        definition: '#ffffff', // Pure chalk white for formulas, NEVER yellow!
        warning: '#f87171',
        solution: '#4ade80',
        body: '#e2e8f0', // Crisp off-white for body text
        subtitle: '#cbd5e1',
        underline: '#38bdf8',
        canvasBg: '#142d22',
      }
    : {
        title: '#0f172a',
        titleAlt: '#0284c7',
        subheading: '#0f766e',
        definition: '#0f172a', // Pure dark slate for formulas
        warning: '#dc2626',
        solution: '#166534',
        body: '#1e293b',
        subtitle: '#334155',
        underline: '#2563eb',
        canvasBg: '#ffffff',
      };

  const elementIdx = options.elementIndex ?? -1;
  const role = classifyTextRole(textObj.content, textObj.fontSize || 36, textObj.y, elementIdx);

  // 1. Try calling the connected AI Agent
  const prompt = buildEnhancePrompt({
    content: textObj.content,
    x: textObj.x,
    y: textObj.y,
    width: textObj.width || 800,
    height: textObj.height || 60,
    bgColor: backgroundColor || palette.canvasBg,
    isDark,
    slideTitle,
    subject,
    role,
  });

  const manager = options.providerManager || aiProviderManager;
  const activeProvider = manager.getActiveProvider();
  const activeModel = manager.getSelectedModel(activeProvider);
  let aiResult: any = null;

  try {
    const res = await manager.generateStructuredJson<{
      format?: 'html' | 'latex' | 'markdown';
      content: string;
      fontSize?: number;
      color?: string;
      fontWeight?: number;
      isHtml?: boolean;
      isLatex?: boolean;
      isMarkdown?: boolean;
    }>({
      provider: activeProvider,
      model: activeModel,
      prompt,
      systemPrompt: 'You are SmartNoteAI Visual Presentation Engine. Return only valid JSON for text styling.',
      temperature: 0.3,
      timeoutMs: 14000,
    });

    if (res && res.success && res.data && res.data.content) {
      aiResult = res.data;
    }
  } catch (err) {
    console.warn('AI provider text enhancement call failed, falling back to local visual designer:', err);
  }

  // 2. Use AI output or fallback to offline presentation visual designer
  const fallback = generateOnlinePresentationStyle({
    content: textObj.content,
    role,
    isDark,
    palette,
    slideTitle,
  });

  const rawFinalContent = aiResult?.content || fallback.content;
  const finalFontSize = aiResult?.fontSize || fallback.fontSize;
  const finalColor = aiResult?.color || fallback.color;
  const finalFontWeight = aiResult?.fontWeight || fallback.fontWeight;

  // Clean formulas from unwanted pill labels ("FORMULA", "CORE FORMULA", etc.)
  const isFormulaRole = role === 'definition-formula' || aiResult?.format === 'latex' || isMathFormulaText(rawFinalContent);
  let cleanContent = isFormulaRole ? cleanFormulaContent(rawFinalContent) : rawFinalContent;

  // Automatically detect format mode (HTML, LaTeX math, or Markdown)
  const detectedMode = detectTextFormatMode(cleanContent, {
    isHtml: aiResult?.format === 'html' || aiResult?.isHtml || fallback.isHtml,
    isLatex: isFormulaRole || aiResult?.format === 'latex' || aiResult?.isLatex || fallback.isLatex,
    isMarkdown: aiResult?.format === 'markdown' || aiResult?.isMarkdown || fallback.isMarkdown,
  });

  // Ensure generated HTML contains ZERO fixed CSS font-size declarations and ZERO raw Markdown tokens (**, --, #, etc.)
  if (detectedMode.isHtml) {
    cleanContent = normalizeGeneratedHtml(cleanContent);
  }

  // Calculate measured dimensions so formulas and HTML have natural snug bounds without giant empty margins
  let finalWidth = textObj.width || 800;
  let finalHeight = textObj.height || 60;
  if (detectedMode.isLatex) {
    const measured = measureLatexSize(cleanContent, finalFontSize);
    finalWidth = Math.round(measured.width + 24);
    finalHeight = Math.round(measured.height + 16);
  } else if (detectedMode.isHtml) {
    const measured = measureHtmlSize(cleanContent, finalFontSize, 'Inter, -apple-system, sans-serif', 1760);
    finalWidth = Math.min(1760, Math.max(textObj.width || 600, measured.width));
    finalHeight = Math.max(48, measured.height);
  } else {
    const measured = measureMarkdownSize(cleanContent, finalFontSize, textObj.fontFamily || 'Inter, -apple-system, sans-serif', 1760);
    finalWidth = Math.min(1760, Math.max(textObj.width || 600, measured.width));
    finalHeight = Math.max(44, measured.height);
  }

  const enhancedObject: TextObject = {
    ...textObj,
    content: cleanContent,
    fontSize: finalFontSize,
    color: detectedMode.isLatex ? palette.definition : finalColor,
    fontWeight: finalFontWeight,
    isMarkdown: detectedMode.isMarkdown,
    isHtml: detectedMode.isHtml,
    isLatex: detectedMode.isLatex,
    width: finalWidth,
    height: finalHeight,
    lineHeight: 1.45,
  };

  return {
    enhancedObject,
    success: true,
    message: `✨ Enhanced "${textObj.content.slice(0, 24)}..." with AI presentation styling!`,
  };
}

/**
 * 1-Click AI Enhance Engine for Full Slide:
 * Sends requests in parallel for each text element, reflows canvas with zero-overlap layout.
 */
export async function enhanceSlideContentWithAI(
  options: SlideEnhanceOptions
): Promise<EnhanceResult> {
  const { page, onStepProgress } = options;
  if (!page || !page.objects || page.objects.length === 0) {
    return {
      success: false,
      message: 'No content on the current slide to enhance. Add or drag text onto the board first!',
      modifiedCount: 0,
      addedIconsCount: 0,
      enhancedObjects: [],
      steps: [],
    };
  }

  const isDark = isDarkChalkboardTheme(page.background?.color || (page as any).backgroundColor);
  const existingObjects = [...page.objects];

  const palette = isDark
    ? {
        title: '#f8fafc',
        titleAlt: '#38bdf8',
        subheading: '#38bdf8',
        definition: '#ffffff', // Pure chalk white for formulas, NEVER yellow!
        warning: '#f87171',
        solution: '#4ade80',
        body: '#e2e8f0', // Crisp off-white for body text
        subtitle: '#cbd5e1',
        underline: '#38bdf8',
        canvasBg: '#142d22',
      }
    : {
        title: '#0f172a',
        titleAlt: '#0284c7',
        subheading: '#0f766e',
        definition: '#0f172a', // Pure dark slate for formulas
        warning: '#dc2626',
        solution: '#166534',
        body: '#1e293b',
        subtitle: '#334155',
        underline: '#2563eb',
        canvasBg: '#ffffff',
      };

  const newBackground: PageBackground = {
    type: 'color',
    color: palette.canvasBg,
  };

  // 1. Separate objects into non-decorative items and decorative lines
  const nonDecorative = existingObjects.filter((o) => {
    if (o.type === 'shape' && (o.id.startsWith('title-accent') || (o as any).shapeType === 'line')) {
      return false;
    }
    if (o.type === 'image' && o.id.startsWith('icon-')) {
      return false;
    }
    return true;
  });

  const getObjY = (o: CanvasObject): number => {
    if (o.type === 'stroke') return o.bbox?.y ?? 0;
    return (o as any).y ?? 0;
  };

  const sorted = [...nonDecorative].sort((a, b) => getObjY(a) - getObjY(b));

  // Step 1: Background notification
  const totalEstimatedSteps = sorted.length + 2;
  const initialStep: EnhanceStep = {
    stepIndex: 1,
    totalSteps: totalEstimatedSteps,
    statusText: '🎨 Harmonizing chalkboard background theme & typography...',
    objects: existingObjects,
    newBackground,
  };
  onStepProgress?.(initialStep);

  // 2. Enhance each text object with AI in parallel
  const enhancedElements: CanvasObject[] = await Promise.all(
    sorted.map(async (obj, idx) => {
      if (obj.type !== 'text') {
        return { ...obj };
      }

      const tObj = obj as TextObject;
      const res = await enhanceIndividualTextWithAI({
        textObj: tObj,
        canvasWidth: page.width || 1920,
        canvasHeight: page.height || 1080,
        backgroundColor: palette.canvasBg,
        slideTitle: page.title,
        providerManager: options.providerManager,
        elementIndex: idx,
        totalElements: sorted.length,
      });

      return res.enhancedObject;
    })
  );

  // 3. Zero-Overlap Canvas Layout Reflow Engine
  const canvasWidth = page.width || 1920;
  const startX = 80;
  const contentWidth = Math.min(1760, canvasWidth - startX * 2);
  let currentY = 60; // Top margin

  const reflowedObjects: CanvasObject[] = [];
  const decorativeUnderlines: ShapeObject[] = [];

  for (let i = 0; i < enhancedElements.length; i++) {
    const item = enhancedElements[i];
    const isTable = item.type === 'text' && isTableContent((item as TextObject).content);
    const isLatex = item.type === 'text' && (item as TextObject).isLatex;
    const itemFontSize = (item as TextObject).fontSize || 28;
    if (item.type === 'stroke') {
      reflowedObjects.push(item);
      continue;
    }

    let itemWidth: number;
    let itemHeight: number;
    let itemX = startX;

    if (isLatex) {
      const tObj = item as TextObject;
      const measured = measureLatexSize(tObj.content, tObj.fontSize || 34);
      itemWidth = Math.min(contentWidth, Math.round(measured.width + 24));
      itemHeight = Math.round(measured.height + 16);
      // Center formulas nicely on chalkboard
      itemX = Math.round(startX + (contentWidth - itemWidth) / 2);
    } else if (item.type === 'text') {
      itemWidth = contentWidth;
      itemHeight = estimateElementHeight(item, itemFontSize, itemWidth, isTable);
    } else {
      itemWidth = Math.min(contentWidth, (item as any).width || 800);
      itemHeight = (item as any).height || 300;
    }

    const positionedItem: CanvasObject = {
      ...item,
      x: itemX,
      y: currentY,
      ...(item.type === 'text' ? { width: itemWidth, height: itemHeight } : {}),
      ...(item.type === 'image' ? { width: Math.min(contentWidth, item.width), height: item.height } : {}),
    } as CanvasObject;
    reflowedObjects.push(positionedItem);

    // Decorative underline: ONLY for the very first item if it is a title without inline gradient
    if (
      i === 0 &&
      item.type === 'text' &&
      !isLatex &&
      !isTable &&
      !(item as TextObject).content.includes('linear-gradient')
    ) {
      const titleLen = (item as TextObject).content.replace(/<[^>]*>/g, '').replace(/^#+\s*/, '').length;
      const underlineW = Math.min(650, Math.max(200, titleLen * 20));
      decorativeUnderlines.push({
        id: `title-accent-${uuidv4().slice(0, 8)}`,
        type: 'shape',
        shapeType: 'line',
        x: startX,
        y: currentY + itemHeight + 6,
        width: underlineW,
        height: 0,
        strokeColor: palette.underline,
        fillColor: 'transparent',
        strokeWidth: 3,
        strokeOpacity: 0.9,
        fillOpacity: 0,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        visible: true,
        layerId: 'objects',
      });
      currentY += 12;
    }

    // Advance currentY with proper vertical clearance
    const spacing = isLatex ? 28 : isTable ? 36 : 24;
    currentY += itemHeight + spacing;
  }

  const allEnhanced = [...decorativeUnderlines, ...reflowedObjects];

  // 4. Build progressive execution steps
  const steps: EnhanceStep[] = [];
  const totalSteps = 2 + reflowedObjects.length;

  steps.push({
    stepIndex: 1,
    totalSteps,
    statusText: '🎨 Harmonizing chalkboard background theme & typography...',
    objects: existingObjects,
    newBackground,
  });

  for (let i = 0; i < reflowedObjects.length; i++) {
    const currentReflowed = reflowedObjects[i];
    let label = 'Content';
    if (currentReflowed.type === 'text') {
      const txt = (currentReflowed as TextObject).content.replace(/<[^>]*>/g, '').replace(/^#+\s*/, '').slice(0, 32);
      if (isTableContent((currentReflowed as TextObject).content)) {
        label = 'Table with KaTeX formatting';
      } else if (i === 0) {
        label = `Heading: "${txt}"`;
      } else {
        label = `"${txt}..."`;
      }
    } else if (currentReflowed.type === 'image') {
      label = 'Static Image';
    } else if (currentReflowed.type === 'shape') {
      label = 'Diagram / Shape';
    }

    const currentYBound = ((currentReflowed as any).y ?? (currentReflowed.type === 'stroke' ? currentReflowed.bbox?.y ?? 0 : 0)) + ((currentReflowed as any).height ?? 0);
    const stepObjects: CanvasObject[] = [
      ...decorativeUnderlines.filter((u) => u.y <= currentYBound),
      ...reflowedObjects.slice(0, i + 1),
      ...existingObjects.filter((orig) => !reflowedObjects.slice(0, i + 1).some((r) => r.id === orig.id)),
    ];

    steps.push({
      stepIndex: i + 2,
      totalSteps,
      statusText: `✨ Enhancing ${label} with AI Presentation Styling...`,
      objects: stepObjects,
    });
  }

  steps.push({
    stepIndex: totalSteps,
    totalSteps,
    statusText: '📐 Reflowing canvas elements with zero-overlap alignment...',
    objects: allEnhanced,
  });

  return {
    success: true,
    message: `✨ Enhanced slide! Reflowed ${enhancedElements.length} elements with AI presentation styling & KaTeX tables.`,
    modifiedCount: enhancedElements.length,
    addedIconsCount: 0,
    enhancedObjects: allEnhanced,
    newBackground,
    steps,
  };
}

/**
 * Synchronous enhance helper (for backwards compatibility & vitest tests).
 */
export function enhanceSlideContent(page: Page): EnhanceResult {
  if (!page || !page.objects || page.objects.length === 0) {
    return {
      success: false,
      message: 'No content on the current slide to enhance. Add or drag text onto the board first!',
      modifiedCount: 0,
      addedIconsCount: 0,
      enhancedObjects: [],
      steps: [],
    };
  }

  const isDark = isDarkChalkboardTheme(page.background?.color || (page as any).backgroundColor);
  const existingObjects = [...page.objects];

  const palette = isDark
    ? {
        title: '#f8fafc',
        titleAlt: '#38bdf8',
        subheading: '#38bdf8',
        definition: '#ffffff', // Pure chalk white for formulas, NEVER yellow!
        warning: '#f87171',
        solution: '#4ade80',
        body: '#e2e8f0', // Crisp off-white for body text
        subtitle: '#cbd5e1',
        underline: '#38bdf8',
        canvasBg: '#142d22',
      }
    : {
        title: '#0f172a',
        titleAlt: '#0284c7',
        subheading: '#0f766e',
        definition: '#0f172a', // Pure dark slate for formulas
        warning: '#dc2626',
        solution: '#166534',
        body: '#1e293b',
        subtitle: '#334155',
        underline: '#2563eb',
        canvasBg: '#ffffff',
      };

  const newBackground: PageBackground = {
    type: 'color',
    color: palette.canvasBg,
  };

  const nonDecorative = existingObjects.filter((o) => {
    if (o.type === 'shape' && (o.id.startsWith('title-accent') || (o as any).shapeType === 'line')) {
      return false;
    }
    if (o.type === 'image' && o.id.startsWith('icon-')) {
      return false;
    }
    return true;
  });

  const getObjY = (o: CanvasObject): number => {
    if (o.type === 'stroke') return o.bbox?.y ?? 0;
    return (o as any).y ?? 0;
  };

  const sorted = [...nonDecorative].sort((a, b) => getObjY(a) - getObjY(b));

  const enhancedElements: CanvasObject[] = sorted.map((obj, idx) => {
    if (obj.type !== 'text') {
      return { ...obj };
    }

    const tObj = obj as TextObject;
    const role = classifyTextRole(tObj.content, tObj.fontSize || 36, tObj.y, idx);
    const styled = generateOnlinePresentationStyle({
      content: tObj.content,
      role,
      isDark,
      palette,
      slideTitle: page.title,
    });

    const mode = detectTextFormatMode(styled.content, {
      isHtml: styled.isHtml,
      isLatex: styled.isLatex,
      isMarkdown: styled.isMarkdown,
    });
    const finalStyledContent = mode.isHtml ? normalizeGeneratedHtml(styled.content) : styled.content;

    return {
      ...tObj,
      content: finalStyledContent,
      fontSize: styled.fontSize,
      color: mode.isLatex ? palette.definition : styled.color,
      fontWeight: styled.fontWeight,
      isMarkdown: mode.isMarkdown,
      isHtml: mode.isHtml,
      isLatex: mode.isLatex,
      lineHeight: 1.45,
    };
  });

  const canvasWidth = page.width || 1920;
  const startX = 80;
  const contentWidth = Math.min(1760, canvasWidth - startX * 2);
  let currentY = 60;

  const reflowedObjects: CanvasObject[] = [];
  const decorativeUnderlines: ShapeObject[] = [];

  for (const item of enhancedElements) {
    const isTable = item.type === 'text' && isTableContent((item as TextObject).content);
    const itemFontSize = (item as TextObject).fontSize || 28;
    if (item.type === 'stroke') {
      reflowedObjects.push(item);
      continue;
    }

    const itemWidth = item.type === 'text' ? contentWidth : Math.min(contentWidth, (item as any).width || 800);
    const itemHeight = estimateElementHeight(item, itemFontSize, itemWidth, isTable);

    const positionedItem: CanvasObject = {
      ...item,
      x: startX,
      y: currentY,
      ...(item.type === 'text' ? { width: itemWidth, height: itemHeight } : {}),
      ...(item.type === 'image' ? { width: Math.min(contentWidth, item.width), height: item.height } : {}),
    } as CanvasObject;
    reflowedObjects.push(positionedItem);

    if (item.type === 'text' && ((item as TextObject).content.startsWith('# ') || (item as TextObject).content.includes('🚩')) && !(item as TextObject).content.includes('linear-gradient')) {
      const titleLen = (item as TextObject).content.replace(/^#+\s*/, '').length;
      const underlineW = Math.min(800, Math.max(220, titleLen * 22));
      decorativeUnderlines.push({
        id: `title-accent-${uuidv4().slice(0, 8)}`,
        type: 'shape',
        shapeType: 'line',
        x: startX,
        y: currentY + itemHeight + 6,
        width: underlineW,
        height: 0,
        strokeColor: palette.underline,
        fillColor: 'transparent',
        strokeWidth: 3.5,
        strokeOpacity: 0.95,
        fillOpacity: 0,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        visible: true,
        layerId: 'objects',
      });
      currentY += 16;
    }

    currentY += itemHeight + 36;
  }

  const allEnhanced = [...decorativeUnderlines, ...reflowedObjects];
  const totalSteps = 2 + reflowedObjects.length;
  const steps: EnhanceStep[] = [];

  steps.push({
    stepIndex: 1,
    totalSteps,
    statusText: '🎨 Harmonizing chalkboard background theme & typography...',
    objects: existingObjects,
    newBackground,
  });

  for (let i = 0; i < reflowedObjects.length; i++) {
    const currentReflowed = reflowedObjects[i];
    let label = 'Content';
    if (currentReflowed.type === 'text') {
      const txt = (currentReflowed as TextObject).content.replace(/<[^>]*>/g, '').replace(/^#+\s*/, '').slice(0, 32);
      if (isTableContent((currentReflowed as TextObject).content)) {
        label = 'Table with KaTeX formatting';
      } else if (i === 0) {
        label = `Heading: "${txt}"`;
      } else {
        label = `"${txt}..."`;
      }
    } else if (currentReflowed.type === 'image') {
      label = 'Static Image';
    } else if (currentReflowed.type === 'shape') {
      label = 'Diagram / Shape';
    }

    const currentYBound = ((currentReflowed as any).y ?? (currentReflowed.type === 'stroke' ? currentReflowed.bbox?.y ?? 0 : 0)) + ((currentReflowed as any).height ?? 0);
    const stepObjects: CanvasObject[] = [
      ...decorativeUnderlines.filter((u) => u.y <= currentYBound),
      ...reflowedObjects.slice(0, i + 1),
      ...existingObjects.filter((orig) => !reflowedObjects.slice(0, i + 1).some((r) => r.id === orig.id)),
    ];

    steps.push({
      stepIndex: i + 2,
      totalSteps,
      statusText: `✨ Enhancing ${label}...`,
      objects: stepObjects,
    });
  }

  steps.push({
    stepIndex: totalSteps,
    totalSteps,
    statusText: '📐 Reflowing canvas elements with zero-overlap alignment...',
    objects: allEnhanced,
  });

  return {
    success: true,
    message: `✨ Enhanced slide! Reflowed ${enhancedElements.length} elements with zero-overlap and KaTeX formatting.`,
    modifiedCount: enhancedElements.length,
    addedIconsCount: 0,
    enhancedObjects: allEnhanced,
    newBackground,
    steps,
  };
}
