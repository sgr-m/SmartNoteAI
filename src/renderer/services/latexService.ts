/**
 * latexService.ts — LaTeX Mathematical Formula Rendering Service
 * Provides syntax detection, KaTeX HTML generation, and SVG Data URL caching for high-DPR canvas drawing.
 */

import katex from 'katex';
import { KATEX_SVG_CSS } from './katexStyles';

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
    // Fallback without throwing
    try {
      const fallbackHtml = katex.renderToString(cleanLatexExpression(rawText), {
        displayMode,
        output: 'html',
        throwOnError: false,
      });
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
      width: Math.max(60, Math.ceil(chars * fontSize * 0.62) + 24),
      height: Math.max(36, Math.ceil(fontSize * 1.8) + 16),
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

    const { html, success } = renderLatexHtml(cleanExpr, false);
    span.innerHTML = success ? html : cleanExpr;
    measureContainer.appendChild(span);

    const rect = span.getBoundingClientRect();
    measureContainer.removeChild(span);

    if (rect.width > 0) {
      const measured = {
        width: Math.max(60, Math.ceil(rect.width) + 24),
        height: Math.max(36, Math.ceil(rect.height) + 16),
      };
      latexSizeCache.set(cacheKey, measured);
      return measured;
    }

    // JSDOM / headless layout fallback
    const visualChars = estimateLatexVisualCharCount(cleanExpr);
    const measured = {
      width: Math.max(60, Math.ceil(visualChars * fontSize * 0.62) + 24),
      height: Math.max(36, Math.ceil(fontSize * 1.8) + 16),
    };
    latexSizeCache.set(cacheKey, measured);
    return measured;
  } catch {
    const visualChars = estimateLatexVisualCharCount(cleanExpr);
    return {
      width: Math.max(60, Math.ceil(visualChars * fontSize * 0.62) + 24),
      height: Math.max(36, Math.ceil(fontSize * 1.8) + 16),
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
  const { html } = renderLatexHtml(rawText, true);
  // Ensure generous dimensions and padding so fractions, roots, and exponents NEVER get cropped
  const w = Math.max(340, Math.round(width));
  const h = Math.max(140, Math.round(height));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      ${KATEX_SVG_CSS}
      .katex-mathml { display: none !important; }
      .katex {
        font-family: KaTeX_Main, 'Cambria Math', 'Times New Roman', serif !important;
      }
      .katex-display { margin: 0 !important; }
    </style>
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${color}; font-size: ${Math.round(fontSize)}px; font-family: KaTeX_Main, 'Cambria Math', 'Times New Roman', serif; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; box-sizing: border-box; overflow: visible; padding: 24px 20px;">
        ${html}
      </div>
    </foreignObject>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Get or load cached HTMLImageElement for canvas rendering
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
  // Stable cache key by ID, formula text, and color
  const cacheKey = `${id}_${rawText}_${color}`;
  const existing = latexImageCache.get(cacheKey);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }

  if (!existing) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Render at crisp high resolution with plenty of headroom
    const baseW = Math.max(450, Math.round(width * 2));
    const baseH = Math.max(160, Math.round(height * 2));
    const baseFont = Math.max(36, Math.round(fontSize * 1.5));
    img.src = latexToSvgDataUrl(rawText, color, baseFont, baseW, baseH);
    img.onload = () => {
      onLoadCallback?.();
    };
    latexImageCache.set(cacheKey, img);
  }

  return null;
}
