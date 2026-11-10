/**
 * markdownRenderService.ts — Mixed Markdown & LaTeX/KaTeX Vector Rendering Service
 * 
 * Provides unified, high-fidelity rendering of combined Markdown text and LaTeX math formulas
 * directly onto the SmartNoteAI Whiteboard canvas using SVG foreignObject data URLs.
 * 
 * Accurately renders:
 * - Mixed LaTeX formulas ($...$ inline and $$...$$ display) using KaTeX
 * - Bold (**text**), Italic (*text*), Strikethrough (~~text~~)
 * - Markdown Headings (# H1, ## H2, ### H3, #### H4)
 * - Numbered lists (1. , 2. ) and bullet points (* , - , • )
 * - Horizontal dividers (---, ***, ___)
 * - Code spans (`code`) and syntax blocks (```code```)
 * - Markdown tables (| col1 | col2 |)
 */

import katex from 'katex';
import { KATEX_SVG_CSS } from './katexStyles';

const markdownImageCache = new Map<string, HTMLImageElement>();
const markdownSizeCache = new Map<string, { width: number; height: number }>();

let measureDiv: HTMLDivElement | null = null;

export function isMarkdownSyntax(text: string): boolean {
  if (!text) return false;
  // Markdown headings: #, ##, ###, ####
  if (/^#{1,6}\s+/m.test(text)) return true;
  // LaTeX inline math or display math or commands
  if (/\$[^\$\n]+?\$/.test(text) || /\$\$[\s\S]*?\$\$/.test(text)) return true;
  if (/\\\(|\\\[|\\frac|\\sum|\\sqrt|\\int|\\cdot|\\left|\\right|\\pm/.test(text)) return true;
  // Bold, italic, strikethrough
  if (/\*\*[^*]+\*\*/.test(text) || /(^|[^\*])\*[^\*]+?\*([^\*]|$)/.test(text) || /~~[^~]+~~/.test(text)) return true;
  // Markdown lists
  if (/^\s*[-*+]\s+/m.test(text) || /^\s*\d+\.\s+/m.test(text)) return true;
  // Markdown tables
  if (/\|.+\|/.test(text)) return true;
  // Code block or span
  if (/```|`[^`]+`/.test(text)) return true;
  // Blockquotes
  if (/^\s*>\s+/m.test(text)) return true;
  // Horizontal divider
  if (/^(\s*[-*_]\s*){3,}$/m.test(text)) return true;
  return false;
}

/**
 * Escapes HTML characters in plain text segments
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders inline text containing bold, italic, code, and inline LaTeX ($...$ or \(...\))
 */
export function renderInlineMarkdownAndLatex(line: string): string {
  if (!line) return '';

  // 1. Tokenize inline LaTeX math first ($...$ and \(...\))
  const mathTokens: string[] = [];
  const placeholderPrefix = '___MATH_TOKEN_';

  // Replace display math if inline: $$...$$ or \[...\]
  let processed = line.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, (_match, expr) => {
    const raw = expr.startsWith('$$') ? expr.slice(2, -2) : expr.slice(2, -2);
    try {
      const rendered = katex.renderToString(raw.trim(), {
        displayMode: true,
        output: 'html',
        throwOnError: false,
      });
      const idx = mathTokens.length;
      mathTokens.push(`<div class="md-katex-display">${rendered}</div>`);
      return `${placeholderPrefix}${idx}___`;
    } catch {
      const idx = mathTokens.length;
      mathTokens.push(`<span class="md-math-err">${escapeHtml(raw)}</span>`);
      return `${placeholderPrefix}${idx}___`;
    }
  });

  // Replace inline math: $...$ or \(...\)
  processed = processed.replace(/(\$[^\$\n]+?\$|\\\([^\n]+?\\\))/g, (_match, expr) => {
    const raw = expr.startsWith('$') ? expr.slice(1, -1) : expr.slice(2, -2);
    try {
      let rendered = katex.renderToString(raw.trim(), {
        displayMode: false,
        output: 'html',
        throwOnError: false,
      });
      // Neutralize any red error styling produced by KaTeX
      rendered = rendered.replace(/style="color:\s*#cc0000;?"/gi, 'style="color: inherit;"');
      const idx = mathTokens.length;
      mathTokens.push(`<span class="md-katex-inline" style="display: inline !important; white-space: nowrap !important;">${rendered}</span>`);
      return `${placeholderPrefix}${idx}___`;
    } catch {
      const idx = mathTokens.length;
      mathTokens.push(`<span class="md-katex-inline">${escapeHtml(raw)}</span>`);
      return `${placeholderPrefix}${idx}___`;
    }
  });

  // 2. Inline code spans: `...`
  processed = processed.replace(/`([^`]+)`/g, (_m, code) => {
    return `<code style="background: rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #34d399; font-size: 0.9em;">${escapeHtml(code)}</code>`;
  });

  // 3. Bold + Italic: ***text***
  processed = processed.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');

  // 4. Bold: **text**
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. Italic: *text* or _text_
  processed = processed.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');

  // 6. Restore math tokens
  for (let i = 0; i < mathTokens.length; i++) {
    const tokenPlaceholder = `${placeholderPrefix}${i}___`;
    processed = processed.split(tokenPlaceholder).join(mathTokens[i]);
  }

  return processed;
}

/**
 * Converts a Markdown document (with mixed LaTeX) into standard styled HTML
 */
export function markdownToHtml(rawMarkdown: string): string {
  if (!rawMarkdown || !rawMarkdown.trim()) return '';

  const lines = rawMarkdown.split('\n');
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let inDisplayMath = false;
  let displayMathBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (inList) {
      htmlParts.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableBuffer.length > 0) {
      let tHtml = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1.5px solid rgba(255,255,255,0.18); border-radius: 6px; overflow: hidden;">';
      tableBuffer.forEach((tRow, rIdx) => {
        const cells = tRow.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length === 0) return;
        // Skip separator row (e.g. |---|---|)
        if (cells.every((c) => /^[-:]+$/.test(c))) return;

        const isHeader = rIdx === 0;
        const tag = isHeader ? 'th' : 'td';
        const isTotals = !isHeader && cells.some((c) => /\b(totals?|sum|average)\b/i.test(c));
        const bg = isHeader
          ? 'background: rgba(19, 78, 74, 0.75); color: #f8fafc; font-weight: 700;'
          : isTotals
          ? 'background: rgba(255, 255, 255, 0.08); font-weight: 700; border-top: 2px solid rgba(255, 255, 255, 0.3);'
          : (rIdx % 2 === 0 ? 'background: rgba(255, 255, 255, 0.03);' : 'background: transparent;');
        tHtml += `<tr style="${bg}">`;
        for (const cell of cells) {
          tHtml += `<${tag} style="padding: 9px 16px; border: 1px solid rgba(255,255,255,0.14); text-align: left; font-size: 0.96em;">${renderInlineMarkdownAndLatex(cell)}</${tag}>`;
        }
        tHtml += '</tr>';
      });
      tHtml += '</table>';
      htmlParts.push(tHtml);
      tableBuffer = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code blocks (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushList();
        htmlParts.push(
          `<pre style="background: #0f172a; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); font-family: 'JetBrains Mono', Consolas, monospace; font-size: 0.9em; overflow-x: auto; color: #38bdf8; margin: 6px 0;"><code>${escapeHtml(codeBlockBuffer.join('\n'))}</code></pre>`
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine);
      continue;
    }

    // 2. Table row (| col | col |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      inTable = true;
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 3. Horizontal Rule (---, ***, ___)
    if (/^(\s*[-*_]\s*){3,}$/.test(trimmed)) {
      flushList();
      htmlParts.push('<hr style="border: none; border-top: 1.5px solid rgba(255, 255, 255, 0.25); margin: 12px 0;" />');
      continue;
    }

    // 4. Headings (#, ##, ###, ####)
    const headingMatch = rawLine.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const hText = headingMatch[2];
      const fontSizes = ['1.2em', '1.12em', '1.05em', '1.0em'];
      const margins = ['8px 0 6px 0', '6px 0 4px 0', '4px 0 3px 0', '4px 0 2px 0'];
      const border = level === 1 ? 'border-bottom: 2px solid rgba(250, 204, 21, 0.45); padding-bottom: 3px;' : '';
      htmlParts.push(
        `<div class="md-heading" style="font-size: ${fontSizes[level - 1]}; font-weight: 700; margin: ${margins[level - 1]}; ${border}">${renderInlineMarkdownAndLatex(hText)}</div>`
      );
      continue;
    }

    // 5. Block Display Math: $$...$$ (both single-line and multi-line)
    if (trimmed === '$$') {
      if (inDisplayMath) {
        flushList();
        const mathExpr = displayMathBuffer.join('\n').trim();
        try {
          const rendered = katex.renderToString(mathExpr, {
            displayMode: true,
            output: 'html',
            throwOnError: false,
          });
          htmlParts.push(`<div class="md-katex-display" style="text-align: center; margin: 10px 0;">${rendered}</div>`);
        } catch {
          htmlParts.push(`<div class="md-math-fallback" style="text-align: center; margin: 10px 0;">$$${escapeHtml(mathExpr)}$$</div>`);
        }
        displayMathBuffer = [];
        inDisplayMath = false;
      } else {
        flushList();
        flushTable();
        inDisplayMath = true;
      }
      continue;
    }

    if (inDisplayMath) {
      displayMathBuffer.push(rawLine);
      continue;
    }

    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
      flushList();
      const mathExpr = trimmed.slice(2, -2).trim();
      try {
        const rendered = katex.renderToString(mathExpr, {
          displayMode: true,
          output: 'html',
          throwOnError: false,
        });
        htmlParts.push(`<div class="md-katex-display" style="text-align: center; margin: 10px 0;">${rendered}</div>`);
      } catch {
        htmlParts.push(`<div class="md-math-fallback" style="text-align: center; margin: 10px 0;">$$${escapeHtml(mathExpr)}$$</div>`);
      }
      continue;
    }

    // 6. Bullet Lists (* , - , • )
    const bulletMatch = rawLine.match(/^(\s*)([\*\-•])\s+(.+)$/);
    if (bulletMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        htmlParts.push('<ul style="margin: 6px 0 6px 20px; padding: 0; list-style-type: disc;">');
      }
      htmlParts.push(`<li style="margin: 4px 0; line-height: 1.45;">${renderInlineMarkdownAndLatex(bulletMatch[3])}</li>`);
      continue;
    }

    // 7. Numbered Lists (1. , 2. )
    const numMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        htmlParts.push('<ol style="margin: 6px 0 6px 22px; padding: 0;">');
      }
      htmlParts.push(`<li style="margin: 4px 0; line-height: 1.45;">${renderInlineMarkdownAndLatex(numMatch[3])}</li>`);
      continue;
    }

    // 8. Blockquote (> ...)
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      htmlParts.push(
        `<blockquote style="margin: 6px 0; padding: 6px 14px; border-left: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.08); border-radius: 0 6px 6px 0;">${renderInlineMarkdownAndLatex(quoteText)}</blockquote>`
      );
      continue;
    }

    // 9. Blank line
    if (!trimmed) {
      flushList();
      htmlParts.push('<div style="height: 8px;"></div>');
      continue;
    }

    // 10. Direct HTML / Presentation components (e.g. <div style="...">, <span style="...">)
    if (/^\s*<(div|span|section|article|header|table|hr|blockquote)\b/i.test(trimmed)) {
      flushList();
      htmlParts.push(renderInlineMarkdownAndLatex(rawLine));
      continue;
    }

    // 11. Standard Paragraph
    flushList();
    htmlParts.push(`<p style="margin: 5px 0; line-height: 1.45;">${renderInlineMarkdownAndLatex(rawLine)}</p>`);
  }

  flushList();
  flushTable();

  return htmlParts.join('\n');
}

/**
 * Measure natural rendered dimensions of custom Markdown content
 */
export function measureMarkdownSize(
  markdownContent: string,
  fontSize: number = 36,
  fontFamily: string = 'Inter, -apple-system, sans-serif',
  maxWidth: number = 840,
  lineHeight: number = 1.45,
  textAlign: 'left' | 'center' | 'right' = 'left'
): { width: number; height: number } {
  if (!markdownContent || !markdownContent.trim()) {
    return { width: 320, height: 80 };
  }

  const cacheKey = `${markdownContent}_${Math.round(fontSize)}_${maxWidth}_${lineHeight}_${textAlign}`;
  const cached = markdownSizeCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === 'undefined') {
    const lines = markdownContent.split('\n');
    return {
      width: Math.min(maxWidth, 720),
      height: Math.max(80, lines.length * (fontSize * (lineHeight || 1.45)) + 30),
    };
  }

  try {
    if (!measureDiv || !measureDiv.isConnected) {
      measureDiv = document.createElement('div');
      measureDiv.id = 'markdown-measure-container';
      measureDiv.style.position = 'fixed';
      measureDiv.style.top = '-9999px';
      measureDiv.style.left = '-9999px';
      measureDiv.style.visibility = 'hidden';
      measureDiv.style.pointerEvents = 'none';
      measureDiv.style.zIndex = '-1000';
      document.body.appendChild(measureDiv);
    }

    const testEl = document.createElement('div');
    testEl.style.display = 'inline-block';
    testEl.style.maxWidth = `${maxWidth}px`;
    testEl.style.fontSize = `${Math.max(14, Math.round(fontSize))}px`;
    testEl.style.fontFamily = fontFamily || 'Inter, -apple-system, sans-serif';
    testEl.style.lineHeight = `${lineHeight || 1.45}`;
    testEl.style.textAlign = textAlign || 'left';
    testEl.style.padding = '12px 16px';
    testEl.style.boxSizing = 'border-box';
    testEl.innerHTML = markdownToHtml(markdownContent);

    measureDiv.appendChild(testEl);
    const rect = testEl.getBoundingClientRect();
    measureDiv.removeChild(testEl);

    const measured = {
      width: Math.max(200, Math.min(maxWidth, Math.ceil(rect.width) + 28)),
      height: Math.max(60, Math.ceil(rect.height) + 24),
    };

    markdownSizeCache.set(cacheKey, measured);
    return measured;
  } catch {
    return { width: Math.min(maxWidth, 720), height: 160 };
  }
}

/**
 * Sanitizes HTML to be strictly valid XML for SVG foreignObject
 */
export function sanitizeHtmlForSvg(html: string): string {
  if (!html) return '';
  return html
    .replace(/&nbsp;/g, '&#160;')
    .replace(/&thinsp;/g, '&#8201;')
    .replace(/&ensp;/g, '&#8194;')
    .replace(/&emsp;/g, '&#8195;')
    .replace(/&times;/g, '&#215;')
    .replace(/&minus;/g, '&#8722;')
    .replace(/&sdot;/g, '&#8901;')
    .replace(/&le;/g, '&#8804;')
    .replace(/&ge;/g, '&#8805;')
    .replace(/&ne;/g, '&#8800;')
    .replace(/&approx;/g, '&#8776;')
    .replace(/&infin;/g, '&#8734;')
    // Escape bare ampersands that are not already part of an existing valid XML entity
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/<br(?:\s*\/)?>/gi, '<br />')
    .replace(/<hr(?:\s*\/)?>/gi, '<hr />')
    .replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1 />')
    .replace(/<svg(?![^>]*xmlns=)/gi, '<svg xmlns="http://www.w3.org/2000/svg"');
}

/**
 * Generate an SVG Data URL containing rendered Markdown & KaTeX formulas for Canvas drawing
 */
export function markdownToSvgDataUrl(
  markdownContent: string,
  color: string = '#ffffff',
  fontSize: number = 36,
  fontFamily: string = 'Inter, -apple-system, sans-serif',
  width: number = 800,
  height: number = 400,
  textAlign: 'left' | 'center' | 'right' = 'left',
  lineHeight: number = 1.45
): string {
  const w = Math.max(120, Math.round(width));
  const h = Math.max(50, Math.round(height));
  const rawHtml = markdownToHtml(markdownContent);
  const innerHtml = sanitizeHtmlForSvg(rawHtml);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      /* <![CDATA[ */
      ${KATEX_SVG_CSS}
      .katex-mathml { display: none !important; }
      .katex {
        font-family: KaTeX_Main, 'Cambria Math', 'Times New Roman', serif !important;
      }
      .katex-display { margin: 6px 0 !important; }
      .md-katex-inline { display: inline !important; white-space: nowrap !important; margin: 0 2px; }
      .md-katex-display { display: block; text-align: center; margin: 8px 0; }
      .md-container {
        color: ${color};
        font-family: ${fontFamily || 'Inter, -apple-system, sans-serif'};
        font-size: ${Math.round(fontSize)}px;
        line-height: ${lineHeight || 1.45};
        text-align: ${textAlign || 'left'};
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;
        padding: 8px 12px;
        word-wrap: break-word;
      }
      .md-container p {
        text-align: ${textAlign || 'left'};
        line-height: ${lineHeight || 1.45};
      }
      .md-container .md-heading {
        text-align: ${textAlign || 'left'};
      }
      /* ]]> */
    </style>
    <foreignObject x="0" y="0" width="${w}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="md-container">
        ${innerHtml}
      </div>
    </foreignObject>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Get or load cached HTMLImageElement for canvas drawing of Markdown
 */
export function getCachedMarkdownImage(
  id: string,
  markdownContent: string,
  color: string,
  fontSize: number,
  fontFamily: string,
  width: number,
  height: number,
  onLoadCallback?: () => void,
  textAlign: 'left' | 'center' | 'right' = 'left',
  lineHeight: number = 1.45
): HTMLImageElement | null {
  const cacheKey = `${id}_${markdownContent}_${color}_${Math.round(fontSize)}_${Math.round(width)}_${Math.round(height)}_${textAlign}_${lineHeight}`;
  const cached = markdownImageCache.get(cacheKey);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  const dataUrl = markdownToSvgDataUrl(markdownContent, color, fontSize, fontFamily, width, height, textAlign, lineHeight);
  const img = new Image();
  img.onload = () => {
    onLoadCallback?.();
  };
  img.onerror = (e) => {
    console.error('Failed to load markdown SVG dataUrl for', id, e);
  };
  img.src = dataUrl;
  markdownImageCache.set(cacheKey, img);
  return img;
}

export function clearMarkdownImageCache(): void {
  markdownImageCache.clear();
  markdownSizeCache.clear();
}
