/**
 * htmlRenderService.ts — HTML & CSS SmartBoard Rendering Service
 * Renders user-provided HTML & CSS directly onto the 2D Whiteboard canvas
 * using SVG ForeignObject data URLs with high-DPR image caching.
 */

import { renderLatexHtml, KATEX_SVG_CSS } from './latexService';

const htmlImageCache = new Map<string, HTMLImageElement>();
const htmlSizeCache = new Map<string, { width: number; height: number }>();

let measureDiv: HTMLDivElement | null = null;

/**
 * Sanitizes HTML content for SVG ForeignObject XML compatibility:
 * - Converts HTML named entities (&bull;, &nbsp;, &times;) to numeric XML entities
 * - Ensures self-closing tags (<br />, <hr />, <img />)
 * - Renders inline KaTeX math ($...$) if present
 * - Escapes bare ampersands
 */
export function sanitizeHtmlForSvg(html: string): string {
  if (!html) return '';
  return html
    // 1. Common named HTML entities to numeric XML entities
    .replace(/&bull;/g, '&#8226;')
    .replace(/&nbsp;/g, '&#160;')
    .replace(/&thinsp;/g, '&#8201;')
    .replace(/&ensp;/g, '&#8194;')
    .replace(/&emsp;/g, '&#8195;')
    .replace(/&times;/g, '&#215;')
    .replace(/&minus;/g, '&#8722;')
    .replace(/&sdot;/g, '&#8901;')
    .replace(/&middot;/g, '&#183;')
    .replace(/&deg;/g, '&#176;')
    .replace(/&plusmn;/g, '&#177;')
    .replace(/&le;/g, '&#8804;')
    .replace(/&ge;/g, '&#8805;')
    .replace(/&ne;/g, '&#8800;')
    .replace(/&approx;/g, '&#8776;')
    .replace(/&infin;/g, '&#8734;')
    .replace(/&check;/g, '&#10003;')
    .replace(/&rarr;/g, '&#8594;')
    .replace(/&larr;/g, '&#8592;')
    .replace(/&uarr;/g, '&#8593;')
    .replace(/&darr;/g, '&#8595;')
    .replace(/&hellip;/g, '&#8230;')
    .replace(/&mdash;/g, '&#8212;')
    .replace(/&ndash;/g, '&#8211;')
    .replace(/&ldquo;/g, '&#8220;')
    .replace(/&rdquo;/g, '&#8221;')
    .replace(/&lsquo;/g, '&#8216;')
    .replace(/&rsquo;/g, '&#8217;')
    // 2. Self-closing tags required by XML / SVG foreignObject
    .replace(/<br(?:\s*\/)?>/gi, '<br />')
    .replace(/<hr(?:\s*\/)?>/gi, '<hr />')
    .replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1 />')
    .replace(/<input([^>]*?)(?<!\/)>/gi, '<input$1 />')
    // 3. Convert inline LaTeX math like ($x$) or ($\bar{x}$) if present
    .replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        const { html: mathHtml } = renderLatexHtml(math, false);
        return mathHtml;
      } catch {
        return math;
      }
    })
    // 4. Escape remaining bare ampersands not part of valid XML entities
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

/**
 * Measure natural rendered dimensions of custom HTML content
 */
export function measureHtmlSize(
  htmlContent: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number = 800
): { width: number; height: number } {
  if (!htmlContent || !htmlContent.trim()) {
    return { width: 240, height: 60 };
  }

  const cacheKey = `${htmlContent}_${Math.round(fontSize)}_${maxWidth}`;
  const cached = htmlSizeCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === 'undefined') {
    return { width: Math.min(maxWidth, 600), height: 120 };
  }

  try {
    if (!measureDiv || !measureDiv.isConnected) {
      measureDiv = document.createElement('div');
      measureDiv.id = 'html-measure-container';
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
    testEl.style.fontSize = `${Math.max(12, Math.round(fontSize))}px`;
    testEl.style.fontFamily = fontFamily || 'Segoe UI, sans-serif';
    testEl.style.lineHeight = '1.4';
    testEl.style.padding = '8px';
    testEl.style.boxSizing = 'border-box';
    testEl.innerHTML = sanitizeHtmlForSvg(htmlContent);

    measureDiv.appendChild(testEl);
    const rect = testEl.getBoundingClientRect();
    measureDiv.removeChild(testEl);

    const measured = {
      width: Math.max(120, Math.ceil(rect.width) + 32),
      height: Math.max(40, Math.ceil(rect.height) + 20),
    };

    htmlSizeCache.set(cacheKey, measured);
    return measured;
  } catch {
    return { width: Math.min(maxWidth, 600), height: 120 };
  }
}

/**
 * Generate an SVG Data URL containing custom HTML/CSS for 2D Canvas rendering
 */
export function htmlToSvgDataUrl(
  htmlContent: string,
  color: string,
  fontSize: number,
  fontFamily: string,
  width: number,
  height: number,
  textAlign: 'left' | 'center' | 'right' = 'left',
  lineHeight: number = 1.4
): string {
  const w = Math.max(80, Math.round(width));
  const h = Math.max(30, Math.round(height));
  const innerHtml = sanitizeHtmlForSvg(htmlContent);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <style>
      /* <![CDATA[ */
      ${KATEX_SVG_CSS}
      .katex-mathml { display: none !important; }
      .katex {
        font-family: KaTeX_Main, 'Cambria Math', 'Times New Roman', serif !important;
      }
      /* ]]> */
    </style>
    <foreignObject x="0" y="0" width="${w}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${color}; font-family: ${fontFamily || 'Inter, system-ui, -apple-system, sans-serif'}; font-size: ${Math.round(fontSize)}px; line-height: ${lineHeight}; text-align: ${textAlign}; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden; padding: 4px;">
        ${innerHtml}
      </div>
    </foreignObject>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Get or load cached HTMLImageElement for canvas drawing.
 */
export function getCachedHtmlImage(
  id: string,
  htmlContent: string,
  color: string,
  fontSize: number,
  fontFamily: string,
  width: number,
  height: number,
  onLoadCallback?: () => void,
  textAlign: 'left' | 'center' | 'right' = 'left',
  lineHeight: number = 1.4
): HTMLImageElement | null {
  const roundedFont = Math.max(12, Math.round(fontSize));
  const cacheKey = `${id}_${color}_${roundedFont}_${Math.round(width)}_${Math.round(height)}_${textAlign}_${lineHeight}_${htmlContent}`;

  const existing = htmlImageCache.get(cacheKey);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }

  if (typeof Image === 'undefined') {
    return null;
  }

  if (!existing) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const scale = 2; // Crisp DPR 2 rendering
    const targetW = Math.max(120, Math.round(width * scale));
    const targetH = Math.max(60, Math.round(height * scale));
    const targetFont = Math.round(roundedFont * scale);

    img.src = htmlToSvgDataUrl(htmlContent, color, targetFont, fontFamily, targetW, targetH, textAlign, lineHeight);
    img.onload = () => {
      onLoadCallback?.();
    };
    img.onerror = (e) => {
      console.warn('Failed to load HTML SVG image', e);
      htmlImageCache.delete(cacheKey);
    };

    htmlImageCache.set(cacheKey, img);

    if (img.complete && img.naturalWidth > 0) {
      return img;
    }
  }

  return null;
}

/**
 * Strips fixed CSS font-size declarations from generated HTML so SmartNoteAI's
 * TextObject.fontSize (A- / A+ controls) always remains in full control of text size.
 */
export function stripFixedFontSizesFromHtml(html: string): string {
  if (!html) return '';

  // Protect embedded <svg>...</svg> blocks so vector text attributes aren't altered
  const svgTokens: string[] = [];
  let protectedHtml = html.replace(/<svg\b[\s\S]*?<\/svg>/gi, (m) => {
    const idx = svgTokens.length;
    svgTokens.push(m);
    return `__SVG_BLOCK_TOKEN_${idx}__`;
  });

  // 1. Strip font-size properties inside inline style="..." attributes
  protectedHtml = protectedHtml.replace(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi, (_m, quote, styleBody) => {
    const cleanedDecls = String(styleBody)
      .split(';')
      .map((decl) => decl.trim())
      .filter((decl) => decl.length > 0 && !/^font-size\s*:/i.test(decl));
    if (cleanedDecls.length === 0) {
      return '';
    }
    return `style=${quote}${cleanedDecls.join('; ')};${quote}`;
  });

  // 2. Strip font-size rules inside <style>...</style> blocks
  protectedHtml = protectedHtml.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (full, cssBody) => {
    const cleanedCss = String(cssBody).replace(/(^|[;{\s])font-size\s*:\s*[^;{}]+;?/gi, '$1');
    return full.replace(cssBody, cleanedCss);
  });

  // 3. Remove legacy <font size="..."> attributes
  protectedHtml = protectedHtml.replace(/(<font\b[^>]*?)\s+\bsize\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '$1');

  // Tidy spaces before tag close created by empty style removal
  protectedHtml = protectedHtml.replace(/\s+>/g, '>');

  return protectedHtml.replace(/__SVG_BLOCK_TOKEN_(\d+)__/g, (_m, idx) => svgTokens[Number(idx)] ?? '');
}

/**
 * Converts lingering Markdown syntax (**, *, headings #, `code`, -- / ---, - bullets)
 * inside HTML-mode strings into clean semantic HTML while protecting HTML tags & LaTeX ($...$).
 */
export function cleanMarkdownInHtml(html: string): string {
  if (!html) return '';

  const protectedTokens: string[] = [];
  const protect = (raw: string): string => {
    const idx = protectedTokens.length;
    protectedTokens.push(raw);
    return `\u0001MDHTML${idx}\u0002`;
  };

  // 1. Protect LaTeX display/inline blocks and HTML tags/comments first
  let work = html
    .replace(/\$\$[\s\S]*?\$\$/g, (m) => protect(m))
    .replace(/\\\[[\s\S]*?\\\]/g, (m) => protect(m))
    .replace(/\$(?!\d)([^\n$]{1,220}?)\$/g, (m) => protect(m))
    .replace(/<style\b[\s\S]*?<\/style>/gi, (m) => protect(m))
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, (m) => protect(m))
    .replace(/<[^>]+>/g, (m) => {
      // If it's a tag, check if it's opening block so headings/bullets directly inside tags are still recognized cleanly
      return protect(m);
    });

  // 2. Clean/convert Markdown tokens line by line across unprotected visible text segments
  const cleanTextSegment = (seg: string): string => {
    if (!seg.trim()) return seg;
    let out = seg;

    // Replace standalone markdown horizontal rules (---, ***, ___, --)
    out = out.replace(/^[ \t]*(?:-{2,}|\*{3,}|_{3,})[ \t]*$/gm, '<hr style="border: none; border-top: 1px solid rgba(148, 163, 184, 0.35); margin: 8px 0;" />');

    // Strip leading markdown heading hashes (# Title, ### Subtitle)
    out = out.replace(/(^|\n)[ \t]*#{1,6}[ \t]+/g, '$1');

    // Bold **...** and __...__
    out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

    // Italic *...* (avoid breaking arithmetic spacing like 2 * 3)
    out = out.replace(/(^|[^\w*])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?=[^\w*]|$)/g, '$1<em>$2</em>');

    // Inline code `...`
    out = out.replace(/`([^`\n]+?)`/g, '<code style="background: rgba(148, 163, 184, 0.16); padding: 1px 5px; border-radius: 4px; font-family: monospace;">$1</code>');

    // Bullet prefixes (- item or * item) at start of lines inside HTML blocks
    out = out.replace(/(^|\n)[ \t]*[-*][ \t]+(?=\S)/g, '$1• ');

    // Stray double dashes used as separators (` -- `) or trailing/leading `--`
    out = out.replace(/([ \t])--([ \t]|$)/g, '$1—$2');
    out = out.replace(/(^|\n)[ \t]*--[ \t]*/g, '$1');

    // Remove leftover unmatched ** artifacts if an AI truncated bold tags
    out = out.replace(/\*\*/g, '');

    return out;
  };

  // Split by placeholders so line-start checks apply inside each visible text chunk
  const parts = work.split(/(\u0001MDHTML\d+\u0002)/g);
  work = parts
    .map((part) => {
      if (part.startsWith('\u0001MDHTML') && part.endsWith('\u0002')) {
        return part;
      }
      return cleanTextSegment(part);
    })
    .join('');

  // Restore protected tokens
  return work.replace(/\u0001MDHTML(\d+)\u0002/g, (_m, idx) => protectedTokens[Number(idx)] ?? '');
}

/**
 * Full sanitizer for AI/Enhance-generated HTML:
 * 1) Converts any Markdown artifacts (**, --, #, `code`, -) into clean HTML
 * 2) Strips fixed CSS font-size declarations so board fontSize controls scale proportionally
 */
export function normalizeGeneratedHtml(html: string): string {
  return stripFixedFontSizesFromHtml(cleanMarkdownInHtml(html));
}

/**
 * Clear cached HTML images
 */
export function clearHtmlImageCache(): void {
  htmlImageCache.clear();
  htmlSizeCache.clear();
}

