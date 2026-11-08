/**
 * htmlRenderService.ts — HTML & CSS SmartBoard Rendering Service
 * Renders user-provided HTML & CSS directly onto the 2D Whiteboard canvas
 * using SVG ForeignObject data URLs with high-DPR image caching.
 */

const htmlImageCache = new Map<string, HTMLImageElement>();
const htmlSizeCache = new Map<string, { width: number; height: number }>();

let measureDiv: HTMLDivElement | null = null;

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
    testEl.innerHTML = htmlContent;

    measureDiv.appendChild(testEl);
    const rect = testEl.getBoundingClientRect();
    measureDiv.removeChild(testEl);

    const measured = {
      width: Math.max(120, Math.ceil(rect.width) + 24),
      height: Math.max(40, Math.ceil(rect.height) + 16),
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <foreignObject x="0" y="0" width="${w}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${color}; font-family: ${fontFamily || 'Segoe UI, sans-serif'}; font-size: ${Math.round(fontSize)}px; line-height: ${lineHeight}; text-align: ${textAlign}; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden; padding: 4px;">
        ${htmlContent}
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
 * Clear cached HTML images
 */
export function clearHtmlImageCache(): void {
  htmlImageCache.clear();
  htmlSizeCache.clear();
}

