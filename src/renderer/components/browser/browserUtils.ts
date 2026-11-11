/**
 * browserUtils.ts — Pure tab management, URL resolution, and region screenshot crop helpers
 */

export interface SearchEngine {
  id: string;
  name: string;
  icon: string;
  homeUrl: string;
  searchUrl: (query: string) => string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  initialUrl: string;
  urlInput: string;
  engineId: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

export interface RegionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    homeUrl: 'https://www.google.com',
    searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'google-images',
    name: 'Google Images',
    icon: '🖼️',
    homeUrl: 'https://www.google.com/imghp?hl=en',
    searchUrl: (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    icon: '🦆',
    homeUrl: 'https://duckduckgo.com',
    searchUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'bing',
    name: 'Bing',
    icon: '🅱️',
    homeUrl: 'https://www.bing.com',
    searchUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    icon: '📖',
    homeUrl: 'https://www.wikipedia.org',
    searchUrl: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  },
  {
    id: 'phet',
    name: 'PhET Sims',
    icon: '🔬',
    homeUrl: 'https://phet.colorado.edu/en/simulations/filter?type=html',
    searchUrl: (q) => `https://phet.colorado.edu/en/search?q=${encodeURIComponent(q)}`,
  },
];

export function resolveBrowserNavigationUrl(input: string, activeEngine: SearchEngine): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return activeEngine.homeUrl;

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  if (hasProtocol) return trimmed;

  const looksLikeDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([:/].*)?$/i.test(trimmed) && !/\s/.test(trimmed);
  if (looksLikeDomain) {
    return `https://${trimmed}`;
  }

  return activeEngine.searchUrl(trimmed);
}

export function deriveTabTitleFromUrl(url: string, explicitTitle?: string): string {
  const cleanTitle = (explicitTitle || '').trim();
  if (cleanTitle && cleanTitle !== 'about:blank' && !/^https?:\/\//i.test(cleanTitle)) {
    return cleanTitle;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, '');
    return host || cleanTitle || 'New Tab';
  } catch {
    return cleanTitle || 'New Tab';
  }
}

export function createBrowserTab(
  id: string,
  url?: string,
  engine: SearchEngine = SEARCH_ENGINES[0],
  title?: string
): BrowserTab {
  const targetUrl = url ? resolveBrowserNavigationUrl(url, engine) : engine.homeUrl;
  return {
    id,
    title: deriveTabTitleFromUrl(targetUrl, title || (url ? undefined : engine.name)),
    url: targetUrl,
    initialUrl: targetUrl,
    urlInput: targetUrl,
    engineId: engine.id,
    canGoBack: false,
    canGoForward: false,
    isLoading: false,
  };
}

/**
 * Clamp and normalize drag start/end coordinates within viewport bounds.
 */
export function normalizeSelectionRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
  bounds: { width: number; height: number }
): RegionRect {
  const maxW = Math.max(1, bounds.width);
  const maxH = Math.max(1, bounds.height);
  const x1 = Math.max(0, Math.min(maxW, start.x));
  const y1 = Math.max(0, Math.min(maxH, start.y));
  const x2 = Math.max(0, Math.min(maxW, end.x));
  const y2 = Math.max(0, Math.min(maxH, end.y));

  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(Math.abs(x2 - x1)),
    height: Math.round(Math.abs(y2 - y1)),
  };
}

/**
 * Map a CSS-pixel viewport selection rectangle onto captured native image pixel coordinates
 * (accounting seamlessly for High-DPI / Windows scale factors).
 */
export function computeCropSourceRect(
  region: RegionRect,
  viewportSize: { width: number; height: number },
  imageSize: { width: number; height: number }
): RegionRect {
  const vpW = Math.max(1, viewportSize.width);
  const vpH = Math.max(1, viewportSize.height);
  const imgW = Math.max(1, imageSize.width);
  const imgH = Math.max(1, imageSize.height);

  const scaleX = imgW / vpW;
  const scaleY = imgH / vpH;

  const sx = Math.max(0, Math.min(imgW - 1, Math.round(region.x * scaleX)));
  const sy = Math.max(0, Math.min(imgH - 1, Math.round(region.y * scaleY)));
  const sw = Math.max(1, Math.min(imgW - sx, Math.round(region.width * scaleX)));
  const sh = Math.max(1, Math.min(imgH - sy, Math.round(region.height * scaleY)));

  return { x: sx, y: sy, width: sw, height: sh };
}

/**
 * Crop a captured PNG/DataURL to the user-selected viewport region using an offscreen canvas.
 */
export async function cropCapturedImageByViewportRegion(
  fullDataUrl: string,
  region: RegionRect,
  viewportSize: { width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;
      const crop = computeCropSourceRect(region, viewportSize, { width: imgW, height: imgH });

      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('2D context unavailable for region screenshot crop'));
        return;
      }

      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load captured browser screenshot for cropping'));
    img.src = fullDataUrl;
  });
}

