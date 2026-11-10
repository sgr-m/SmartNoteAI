/**
 * latexService.ts — LaTeX Mathematical Formula Rendering Service
 * Provides syntax detection, KaTeX HTML generation, and SVG Data URL caching for high-DPR canvas drawing.
 */

import katex from 'katex';
export { KATEX_SVG_CSS } from './katexStyles';
import { KATEX_SVG_CSS } from './katexStyles';
import { markdownToHtml, isMarkdownSyntax, markdownToSvgDataUrl } from './markdownRenderService';

const latexImageCache = new Map<string, HTMLImageElement>();


/**
 * Checks whether text contains LaTeX mathematical syntax
 */
export function isLatexSyntax(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('$') && trimmed.endsWith('$')) return true;
  if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) return true;
  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) return true;

  // Common LaTeX math keywords
  const mathKeywords = [
    '\\frac',
    '\\sqrt',
    '\\sum',
    '\\int',
    '\\prod',
    '\\alpha',
    '\\beta',
    '\\gamma',
    '\\theta',
    '\\lambda',
    '\\pi',
    '\\sigma',
    '\\omega',
    '\\pm',
    '\\times',
    '\\div',
    '\\cdot',
    '\\approx',
    '\\neq',
    '\\leq',
    '\\geq',
    '\\infty',
    '\\partial',
    '\\nabla',
    '\\lim',
    '\\vec',
    '\\bar',
    '\\hat',
    '\\begin{matrix}',
    '\\begin{pmatrix}',
    '\\begin{bmatrix}',
    '\\begin{cases}',
    '\\to',
    '\\in',
    '\\subset',
    '\\cup',
    '\\cap',
    '\\forall',
    '\\exists',
    '\\Delta',
    '\\quad',
    '\\longrightarrow',
    '\\text',
    '\\mathrm',
    '\\left',
    '\\right',
  ];

  if (mathKeywords.some((kw) => text.includes(kw))) {
    return true;
  }

  // Any LaTeX backslash command (e.g. \command)
  if (/\\[a-zA-Z]{2,}/.test(text) && !/^[a-zA-Z]:\\/.test(trimmed)) {
    return true;
  }

  // Superscript or subscript notation (e.g. x^2, y_1, E=mc^2, \text{H}_2)
  if (/[a-zA-Z0-9}]\^[0-9a-zA-Z{]/.test(text) || /[a-zA-Z0-9}]_[0-9a-zA-Z{]/.test(text)) {
    return true;
  }

  // Fractions like 1/2, 3/4, a/b, (\pi \theta / 360)
  if (/\b\d+\s*\/\s*\d+\b/.test(text) || /\b[a-zA-Z]\s*\/\s*[a-zA-Z]\b/.test(text) || /\([^()]+\/[^()]+\)/.test(text)) {
    return true;
  }

  return false;
}

/**
 * Checks whether text is strictly a pure mathematical formula (e.g. "x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}", "$$a^2+b^2=c^2$$", "E = mc^2")
 * rather than an English prose sentence or Markdown notes containing inline math.
 * English sentences like "The sum of interior angles in any triangle is always $180^\circ$:" are NOT pure formulas.
 */
export function isPureLatexFormula(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Multiple paragraphs or markdown thematic break -> definitely NOT a single formula
  if (trimmed.includes('\n\n') || trimmed.includes('---')) return false;

  // Markdown block formatting -> definitely markdown, not pure formula
  if (/^#{1,6}\s/.test(trimmed) || /^[\*\-•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || trimmed.includes('|') || trimmed.includes('```')) {
    return false;
  }

  // Standalone display formula delimiters: $$...$$ or \[...\]
  if ((trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) ||
      (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 2)) {
    // If the content inside contains multiple plain English words, it is prose with math!
    const inner = (trimmed.startsWith('$$') ? trimmed.slice(2, -2) : trimmed.slice(2, -2)).trim();
    const innerWords = inner.replace(/\\[a-zA-Z]+/g, ' ').replace(/\$[^\$]+\$/g, ' ').match(/\b[a-zA-Z]{3,}\b/g) || [];
    if (innerWords.length >= 2) return false;
    return true;
  }

  // Count standard English words (words with 2+ letters without backslashes)
  const plainWords = trimmed
    .replace(/\\[a-zA-Z]+/g, ' ') // strip LaTeX commands
    .replace(/\$[^\$]+\$/g, ' ') // strip inline math
    .match(/\b[a-zA-Z]{2,}\b/g) || [];

  // If there are 2 or more regular English words, it is natural prose, NOT a pure formula!
  if (plainWords.length >= 2) {
    return false;
  }

  // If it ends with sentence colon or question mark with an English word, it's prose
  if (/[:?]$/.test(trimmed) && plainWords.length >= 1) {
    return false;
  }

  // Check if it's pure mathematical expression (starts with backslash or has math keywords/operators)
  if (trimmed.startsWith('\\') && (trimmed.includes('\\frac') || trimmed.includes('\\sqrt') || trimmed.includes('\\int') || trimmed.includes('\\sum') || trimmed.includes('\\begin'))) {
    return true;
  }

  // Standalone inline math: $...$ without outside text
  if (trimmed.startsWith('$') && trimmed.endsWith('$') && !trimmed.slice(1, -1).includes('$')) {
    return true;
  }

  // Classic math equations: e.g. "a^2 + b^2 = c^2", "E = mc^2", "f(x) = 2x + 1"
  if (/^[a-zA-Z0-9\s()^_+*\/=\-–—.,\\{}]+$/.test(trimmed) && trimmed.includes('=') && (trimmed.includes('^') || trimmed.includes('/') || trimmed.includes('\\'))) {
    return true;
  }

  return false;
}

/**
 * Automatically converts natural fraction inputs (e.g. "1/2", "3/4", "a/b", "(\pi \theta / 360)")
 * into standard vertical LaTeX fractions: \frac{numerator}{denominator} ("a upon b").
 */
export function autoFormatLatexFractions(text: string): string {
  if (!text || !text.includes('/')) return text;

  let result = text;

  // 1. Parenthesized fraction: e.g. (\pi \theta / 360) -> \left(\frac{\pi \theta}{360}\right)
  result = result.replace(/\(\s*([^()\/]+?)\s*\/\s*([^()\/]+?)\s*\)/g, (_match, num, den) => {
    return `\\left(\\frac{${num.trim()}}{${den.trim()}}\\right)`;
  });

  // 2. Parenthesized numerator and denominator: e.g. (a + b) / (c + d) -> \frac{a + b}{c + d}
  result = result.replace(/\(\s*([^()]+?)\s*\)\s*\/\s*\(\s*([^()]+?)\s*\)/g, (_match, num, den) => {
    return `\\frac{${num.trim()}}{${den.trim()}}`;
  });

  // 3. Parenthesized numerator: e.g. (a + b) / 2 -> \frac{a + b}{2}
  result = result.replace(/\(\s*([^()]+?)\s*\)\s*\/\s*([a-zA-Z0-9\\_^{}]+)/g, (_match, num, den) => {
    return `\\frac{${num.trim()}}{${den.trim()}}`;
  });

  // 4. Parenthesized denominator: e.g. 1 / (x + 1) -> \frac{1}{x + 1}
  result = result.replace(/([a-zA-Z0-9\\_^{}]+)\s*\/\s*\(\s*([^()]+?)\s*\)/g, (_match, num, den) => {
    return `\\frac{${num.trim()}}{${den.trim()}}`;
  });

  // 5. Standard term fractions: e.g. 1/2, 3/4, a/b, x/y, 1/12, \theta/2
  result = result.replace(
    /(^|[\s+\-=*(\[,])([a-zA-Z0-9\\^_{}]+)\s*\/\s*([a-zA-Z0-9\\^_{}]+)(?=[\s+\-=*)\],]|$)/g,
    (_match, prefix, num, den) => {
      if (num.startsWith('\\frac') || den.startsWith('\\frac')) return _match;
      return `${prefix}\\frac{${num.trim()}}{${den.trim()}}`;
    }
  );

  return result;
}

/**
 * Auto-formats common math functions (sin, cos, tan, log, etc.) into upright LaTeX operators
 */
export function autoFormatMathOperators(text: string): string {
  if (!text) return text;
  return text.replace(
    /(^|[\s+\-=*(/])(?<!\\)(sin|cos|tan|cot|sec|csc|log|ln|lim|arcsin|arccos|arctan)(?=[ \^_(\\]|$)/g,
    '$1\\$2'
  );
}

/**
 * Clean surrounding delimiters ($...$, $$...$$, etc.) for KaTeX input and normalize fractions
 */
export function cleanLatexExpression(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$') && cleaned.endsWith('$')) {
    cleaned = cleaned.slice(1, -1).trim();
  } else if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('\\(') && cleaned.endsWith('\\)')) {
    cleaned = cleaned.slice(2, -2).trim();
  }

  // Pre-process slash fractions and operators into proper vertical LaTeX fractions
  cleaned = autoFormatLatexFractions(cleaned);
  cleaned = autoFormatMathOperators(cleaned);

  // Auto-heal chemical formula subscripts accidentally nested inside \text{...}
  cleaned = cleaned.replace(/\\text\{([A-Za-z()]+)_\{?([0-9]+)\}?\}/g, '\\mathrm{$1}_{$2}');

  return cleaned;
}

export const cleanLatexDelimiters = cleanLatexExpression;

/**
 * Renders LaTeX expression to HTML using KaTeX
 */
export function renderLatexHtml(
  rawText: string,
  displayMode = true
): { html: string; success: boolean; error?: string } {
  if (!rawText || !rawText.trim()) {
    return { html: '', success: true };
  }

  try {
    const expr = cleanLatexExpression(rawText);
    const html = katex.renderToString(expr, {
      displayMode,
      output: 'html', // Render strictly HTML to eliminate duplicate unstyled MathML text!
      throwOnError: true,
      strict: false,
    });
    return { html, success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // If KaTeX threw an error and text is mixed prose/markdown with inline $...$,
    // gracefully render via markdownToHtml so words and inline $math$ render seamlessly!
    if (!isPureLatexFormula(rawText) && (rawText.includes('$') || isMarkdownSyntax(rawText))) {
      try {
        const mdHtml = markdownToHtml(rawText);
        if (mdHtml) {
          return { html: mdHtml, success: true };
        }
      } catch {}
    }
    // Fallback without throwing, but neutralize error styling so it never displays in bright red!
    try {
      let fallbackHtml = katex.renderToString(cleanLatexExpression(rawText), {
        displayMode,
        output: 'html',
        throwOnError: false,
      });
      // Replace red error color (#cc0000) with clean neutral white
      fallbackHtml = fallbackHtml.replace(/style="color:\s*#cc0000;?"/gi, 'style="color: inherit;"');
      return { html: fallbackHtml, success: false, error: errorMsg };
    } catch {
      return { html: '', success: false, error: errorMsg };
    }
  }
}

let measureContainer: HTMLElement | null = null;

const latexSizeCache = new Map<string, { width: number; height: number }>();

export function estimateLatexVisualCharCount(expr: string): number {
  if (!expr) return 1;
  // Replace LaTeX commands with single representative char, ignore braces and spaces
  const stripped = expr
    .replace(/\\(frac|sqrt|left|right|begin|end)\b/g, '')
    .replace(/\\[a-zA-Z]+/g, 'M')
    .replace(/[{}\^_\s]/g, '');
  return Math.max(2, stripped.length);
}

/**
 * Accurately measures the rendered KaTeX dimensions (width, height)
 * Returns a tight, snug bounding box so the selection box fits the formula without empty space.
 */
export function measureLatexSize(
  rawText: string,
  fontSize: number
): { width: number; height: number } {
  if (!rawText || !rawText.trim()) {
    return { width: 120, height: 40 };
  }
  const cleanExpr = cleanLatexExpression(rawText);
  const cacheKey = `${cleanExpr}_${Math.round(fontSize)}`;
  const cached = latexSizeCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === 'undefined') {
    const chars = estimateLatexVisualCharCount(cleanExpr);
    return {
      width: Math.max(60, Math.ceil(chars * fontSize * 0.65) + 16),
      height: Math.max(36, Math.ceil(fontSize * 1.5) + 12),
    };
  }

  try {
    if (!measureContainer || !measureContainer.isConnected) {
      measureContainer = document.createElement('div');
      measureContainer.id = 'katex-measure-container';
      measureContainer.style.position = 'fixed';
      measureContainer.style.top = '-9999px';
      measureContainer.style.left = '-9999px';
      measureContainer.style.visibility = 'hidden';
      measureContainer.style.pointerEvents = 'none';
      measureContainer.style.zIndex = '-1000';
      document.body.appendChild(measureContainer);
    }

    const span = document.createElement('span');
    span.style.fontSize = `${Math.max(12, Math.round(fontSize))}px`;
    span.style.display = 'inline-block';
    span.style.whiteSpace = 'nowrap';
    span.style.lineHeight = '1.2';
    span.style.fontFamily = "KaTeX_Main, 'Cambria Math', 'Times New Roman', serif";

    const { html, success } = renderLatexHtml(cleanExpr, true);
    span.innerHTML = success ? html : cleanExpr;
    measureContainer.appendChild(span);

    const rect = span.getBoundingClientRect();
    measureContainer.removeChild(span);

    if (rect.width > 0) {
      const measured = {
        width: Math.max(80, Math.ceil(rect.width) + 36),
        height: Math.max(40, Math.ceil(rect.height) + 20),
      };
      latexSizeCache.set(cacheKey, measured);
      return measured;
    }

    // JSDOM / headless layout fallback
    const visualChars = estimateLatexVisualCharCount(cleanExpr);
    const measured = {
      width: Math.max(80, Math.ceil(visualChars * fontSize * 0.75) + 36),
      height: Math.max(44, Math.ceil(fontSize * 1.8) + 20),
    };
    latexSizeCache.set(cacheKey, measured);
    return measured;
  } catch {
    const visualChars = estimateLatexVisualCharCount(cleanExpr);
    return {
      width: Math.max(80, Math.ceil(visualChars * fontSize * 0.75) + 36),
      height: Math.max(44, Math.ceil(fontSize * 1.8) + 20),
    };
  }
}

/**
 * Generate an SVG Data URL containing KaTeX rendered HTML for 2D Canvas drawing
 */
export function latexToSvgDataUrl(
  rawText: string,
  color: string,
  fontSize: number,
  width: number,
  height: number
): string {
  // If the text has prose or mixed markdown, use markdownToSvgDataUrl to avoid KaTeX error SVGs
  if (!isPureLatexFormula(rawText) && (rawText.includes('$') || isMarkdownSyntax(rawText) || /\b[a-zA-Z]{3,}\b/.test(rawText))) {
    return markdownToSvgDataUrl(rawText, color, fontSize, 'Inter, -apple-system, sans-serif', width, height);
  }

  const { html, success } = renderLatexHtml(rawText, true);
  if (!success && !html) {
    return markdownToSvgDataUrl(rawText, color, fontSize, 'Inter, -apple-system, sans-serif', width, height);
  }
  // Ensure crisp dimensions that match the formula's true aspect ratio with snug, clean padding
  const w = Math.max(60, Math.round(width));
  const h = Math.max(36, Math.round(height));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      /* <![CDATA[ */
      ${KATEX_SVG_CSS}
      .katex-mathml { display: none !important; }
      .katex {
        font-family: KaTeX_Main, 'Cambria Math', 'Times New Roman', serif !important;
      }
      .katex-display { margin: 0 !important; }
      /* ]]> */
    </style>
    <foreignObject x="0" y="0" width="${w}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${color}; font-size: ${Math.round(fontSize)}px; font-family: KaTeX_Main, 'Cambria Math', 'Times New Roman', serif; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; box-sizing: border-box; overflow: visible; padding: 4px 6px;">
        ${html}
      </div>
    </foreignObject>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Clear cached LaTeX images and measured sizes
 */
export function clearLatexImageCache(): void {
  latexImageCache.clear();
  latexSizeCache.clear();
}

/**
 * Get or load cached HTMLImageElement for canvas rendering.
 * Caches by formula expression, color, and font size so font size changes update crisply.
 */
export function getCachedLatexImage(
  id: string,
  rawText: string,
  color: string,
  fontSize: number,
  width: number,
  height: number,
  onLoadCallback?: () => void
): HTMLImageElement | null {
  const cleanExpr = cleanLatexExpression(rawText);
  const roundedFont = Math.max(12, Math.round(fontSize));
  // Stable cache key by formula text, color, and font size
  const cacheKey = `${cleanExpr}_${color}_${roundedFont}`;
  const existing = latexImageCache.get(cacheKey);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }

  if (typeof Image === 'undefined') {
    return null;
  }

  if (!existing) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Render at crisp 2x resolution preserving the exact natural aspect ratio of the measured formula!
    const scale = 2;
    const baseW = Math.max(220, Math.round(width * scale) + 80);
    const baseH = Math.max(100, Math.round(height * scale) + 40);
    const baseFont = Math.round(roundedFont * scale);
    img.src = latexToSvgDataUrl(rawText, color, baseFont, baseW, baseH);
    img.onload = () => {
      onLoadCallback?.();
    };
    img.onerror = (e) => {
      console.warn('Failed to load LaTeX SVG image', e);
      latexImageCache.delete(cacheKey);
    };
    latexImageCache.set(cacheKey, img);

    if (img.complete && img.naturalWidth > 0) {
      return img;
    }
  }

  // Fallback while current font-size image is loading to prevent any visual flicker during drag
  for (const [key, cachedImg] of latexImageCache.entries()) {
    if (key.startsWith(`${cleanExpr}_${color}_`) && cachedImg.complete && cachedImg.naturalWidth > 0) {
      return cachedImg;
    }
  }

  return null;
}

