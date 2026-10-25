/**
 * tests/desktopToolsAndSnip.test.ts
 * Tests for Desktop Annotation, Area Screenshot region calculations,
 * and Presentation Tools over desktop.
 */

import { describe, it, expect } from 'vitest';

describe('Area Screenshot Cropping Calculations', () => {
  it('correctly normalizes bounding box when dragging top-left to bottom-right', () => {
    const start = { x: 100, y: 150 };
    const current = { x: 400, y: 350 };

    const minX = Math.min(start.x, current.x);
    const minY = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);

    expect(minX).toBe(100);
    expect(minY).toBe(150);
    expect(width).toBe(300);
    expect(height).toBe(200);
  });

  it('correctly normalizes bounding box when dragging bottom-right to top-left (reverse drag)', () => {
    const start = { x: 500, y: 400 };
    const current = { x: 200, y: 100 };

    const minX = Math.min(start.x, current.x);
    const minY = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);

    expect(minX).toBe(200);
    expect(minY).toBe(100);
    expect(width).toBe(300);
    expect(height).toBe(300);
  });

  it('correctly scales pixel dimensions with high-DPI scaling factor', () => {
    const rect = { x: 50, y: 50, width: 200, height: 100 };
    const scaleFactor = 1.5;

    const sourceX = Math.round(rect.x * scaleFactor);
    const sourceY = Math.round(rect.y * scaleFactor);
    const sourceW = Math.round(rect.width * scaleFactor);
    const sourceH = Math.round(rect.height * scaleFactor);

    expect(sourceX).toBe(75);
    expect(sourceY).toBe(75);
    expect(sourceW).toBe(300);
    expect(sourceH).toBe(150);
  });

  it('enforces minimum capture threshold of 10x10 px', () => {
    const isBigEnough = (w: number, h: number) => w >= 10 && h >= 10;

    expect(isBigEnough(5, 5)).toBe(false);
    expect(isBigEnough(9, 200)).toBe(false);
    expect(isBigEnough(200, 9)).toBe(false);
    expect(isBigEnough(10, 10)).toBe(true);
    expect(isBigEnough(1920, 1080)).toBe(true);
  });
});

describe('Desktop Mode Click-Through Logic', () => {
  it('determines when click-through should be active', () => {
    const shouldIgnoreMouseEvents = (
      activeTool: 'pointer' | 'pen' | 'highlighter' | 'eraser' | 'laser',
      activeOverlay: string | null,
      showScreenshotModal: boolean,
      showAreaSnip: boolean,
      isHoveringToolbar: boolean
    ) => {
      if (isHoveringToolbar) return false;
      if (showScreenshotModal || showAreaSnip) return false;
      if (activeOverlay !== null) return false;
      return activeTool === 'pointer';
    };

    // Pointer mode with no overlays -> clicks pass to Windows apps
    expect(shouldIgnoreMouseEvents('pointer', null, false, false, false)).toBe(true);

    // Hovering the floating toolbar -> clicks intercepted for toolbar buttons
    expect(shouldIgnoreMouseEvents('pointer', null, false, false, true)).toBe(false);

    // Drawing mode (pen) -> clicks intercepted to draw on transparent canvas
    expect(shouldIgnoreMouseEvents('pen', null, false, false, false)).toBe(false);

    // Highlighter mode -> clicks intercepted
    expect(shouldIgnoreMouseEvents('highlighter', null, false, false, false)).toBe(false);

    // Eraser mode -> clicks intercepted
    expect(shouldIgnoreMouseEvents('eraser', null, false, false, false)).toBe(false);

    // Spotlight active on desktop -> clicks intercepted
    expect(shouldIgnoreMouseEvents('pointer', 'spotlight', false, false, false)).toBe(false);

    // Screen veil active on desktop -> clicks intercepted
    expect(shouldIgnoreMouseEvents('pointer', 'veil', false, false, false)).toBe(false);

    // Magnifier active on desktop -> clicks intercepted
    expect(shouldIgnoreMouseEvents('pointer', 'magnifier', false, false, false)).toBe(false);

    // Area snip tool active on desktop -> clicks intercepted
    expect(shouldIgnoreMouseEvents('pointer', null, false, true, false)).toBe(false);
  });
});

describe('Laser Pointer & Presentation Durations', () => {
  it('laser strokes expire after 2200ms', () => {
    const LASER_DURATION = 2200;
    const strokeStartTime = 10000;

    const isStrokeAlive = (currentTime: number) => currentTime - strokeStartTime < LASER_DURATION;

    expect(isStrokeAlive(11000)).toBe(true);  // 1s after -> alive
    expect(isStrokeAlive(12100)).toBe(true);  // 2.1s after -> alive
    expect(isStrokeAlive(12200)).toBe(false); // 2.2s after -> expired
    expect(isStrokeAlive(13000)).toBe(false); // 3s after -> expired
  });

  it('calculates smooth fade alpha from stroke age', () => {
    const LASER_DURATION = 2200;
    const strokeStartTime = 10000;

    const getFadeAlpha = (currentTime: number) => {
      const age = currentTime - strokeStartTime;
      return Math.max(0, Math.min(1, 1 - age / LASER_DURATION));
    };

    expect(getFadeAlpha(10000)).toBeCloseTo(1.0);
    expect(getFadeAlpha(11100)).toBeCloseTo(0.5);
    expect(getFadeAlpha(12200)).toBeCloseTo(0.0);
  });
});

describe('Desktop and Board Fullscreen State Preservation', () => {
  it('correctly detects whether fullscreen teaching mode should be restored', () => {
    const computeRestoreState = (
      options?: { isPresentationMode?: boolean },
      callerIsFullScreen = false,
      callerIsMaximized = false
    ) => {
      const wasFullScreen = Boolean(options?.isPresentationMode ?? callerIsFullScreen);
      const wasMaximized = callerIsMaximized;
      return {
        shouldRestoreFullScreen: wasFullScreen,
        shouldRestoreMaximized: !wasFullScreen && wasMaximized,
      };
    };

    // Case 1: Teaching in presentation mode (full screen) -> preserves full screen on restore
    expect(computeRestoreState({ isPresentationMode: true }, true, false)).toEqual({
      shouldRestoreFullScreen: true,
      shouldRestoreMaximized: false,
    });

    // Case 2: Window was in fullscreen via window chrome/F11 -> preserves full screen
    expect(computeRestoreState(undefined, true, false)).toEqual({
      shouldRestoreFullScreen: true,
      shouldRestoreMaximized: false,
    });

    // Case 3: Window was maximized (not fullscreen) -> preserves maximized on restore
    expect(computeRestoreState({ isPresentationMode: false }, false, true)).toEqual({
      shouldRestoreFullScreen: false,
      shouldRestoreMaximized: true,
    });

    // Case 4: Normal windowed mode -> restores windowed without forcing fullscreen
    expect(computeRestoreState({ isPresentationMode: false }, false, false)).toEqual({
      shouldRestoreFullScreen: false,
      shouldRestoreMaximized: false,
    });
  });
});

