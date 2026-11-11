import { describe, it, expect } from 'vitest';
import {
  SEARCH_ENGINES,
  resolveBrowserNavigationUrl,
  deriveTabTitleFromUrl,
  createBrowserTab,
  normalizeSelectionRect,
  computeCropSourceRect,
} from '../src/renderer/components/browser/browserUtils';

describe('browserUtils — multi-tab navigation & region capture helpers', () => {
  it('resolves explicit URLs, bare domains, and search queries cleanly', () => {
    const google = SEARCH_ENGINES[0];
    expect(resolveBrowserNavigationUrl('https://wikipedia.org/wiki/Cell', google)).toBe(
      'https://wikipedia.org/wiki/Cell'
    );
    expect(resolveBrowserNavigationUrl('phet.colorado.edu', google)).toBe('https://phet.colorado.edu');
    expect(resolveBrowserNavigationUrl('quadratic formula derivation', google)).toBe(
      'https://www.google.com/search?q=quadratic%20formula%20derivation'
    );
  });

  it('derives clean tab titles and initializes BrowserTab records properly', () => {
    expect(deriveTabTitleFromUrl('https://en.wikipedia.org/wiki/Photosynthesis', 'Photosynthesis - Wikipedia')).toBe(
      'Photosynthesis - Wikipedia'
    );
    expect(deriveTabTitleFromUrl('https://www.google.com/search?q=atom')).toBe('google.com');

    const tab = createBrowserTab('tab-1', 'https://phet.colorado.edu/sims', SEARCH_ENGINES[5]);
    expect(tab.id).toBe('tab-1');
    expect(tab.initialUrl).toBe('https://phet.colorado.edu/sims');
    expect(tab.url).toBe('https://phet.colorado.edu/sims');
    expect(tab.title).toBe('phet.colorado.edu');
  });

  it('normalizes drag selection rectangles in any drag direction and clamps to viewport bounds', () => {
    // Drag from bottom-right up to top-left beyond viewport bounds
    const rect = normalizeSelectionRect(
      { x: 400, y: 300 },
      { x: -20, y: 120 },
      { width: 800, height: 600 }
    );
    expect(rect).toEqual({ x: 0, y: 120, width: 400, height: 180 });
  });

  it('scales CSS selection rectangle accurately into physical captured image dimensions (e.g. 150% DPI)', () => {
    const crop = computeCropSourceRect(
      { x: 100, y: 50, width: 200, height: 150 },
      { width: 1000, height: 600 },
      { width: 1500, height: 900 }
    );
    expect(crop).toEqual({ x: 150, y: 75, width: 300, height: 225 });
  });
});

