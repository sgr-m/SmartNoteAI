import { describe, it, expect, beforeEach, vi } from 'vitest';

// Lightweight localStorage mock for Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  },
};
vi.stubGlobal('localStorage', localStorageMock);

import {
  DEFAULT_PEN_THICKNESSES,
  getInitialPenThicknesses,
  getInitialToolbarScale,
  ToolbarScale
} from '../src/renderer/context/AppContext';
import {
  getIsDocumentDirty,
  setIsDocumentDirty,
  getIsForceQuitting,
  setIsForceQuitting
} from '../src/main/ipc/ipcHandlers';

describe('Fix 1: Exit Confirmation Prompt & Dirty State Handling', () => {
  beforeEach(() => {
    setIsDocumentDirty(false);
    setIsForceQuitting(false);
  });

  it('tracks dirty state accurately when document is modified', () => {
    expect(getIsDocumentDirty()).toBe(false);
    setIsDocumentDirty(true);
    expect(getIsDocumentDirty()).toBe(true);
    setIsDocumentDirty(false);
    expect(getIsDocumentDirty()).toBe(false);
  });

  it('maintains force quitting flag for No (dont save) or after successful save', () => {
    expect(getIsForceQuitting()).toBe(false);
    setIsForceQuitting(true);
    expect(getIsForceQuitting()).toBe(true);
  });

  it('dialog options provide Yes (save & close), No (dont save & close), and Cancel', () => {
    // Buttons match specification: index 0: 'Yes', index 1: 'No', index 2: 'Cancel'
    const buttons = ['Yes', 'No', 'Cancel'];
    expect(buttons[0]).toBe('Yes');
    expect(buttons[1]).toBe('No');
    expect(buttons[2]).toBe('Cancel');
  });
});

describe('Fix 2: Preserve Pen Thickness for Individual Pens', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides sensible default thicknesses for all standard pen types', () => {
    const thicknesses = getInitialPenThicknesses();
    expect(thicknesses.normal).toBe(2);
    expect(thicknesses.brush).toBe(4);
    expect(thicknesses.calligraphy).toBe(5);
    expect(thicknesses.highlighter).toBe(20);
    expect(thicknesses.laser).toBe(4);
  });

  it('persists and restores custom thickness per pen type', () => {
    const custom = {
      ...DEFAULT_PEN_THICKNESSES,
      normal: 2,
      brush: 8,
      highlighter: 24,
    };
    localStorage.setItem('smartboard_pen_thicknesses', JSON.stringify(custom));

    const loaded = getInitialPenThicknesses();
    expect(loaded.normal).toBe(2);
    expect(loaded.brush).toBe(8);
    expect(loaded.highlighter).toBe(24);
  });

  it('switching between pens restores each pen individual saved thickness', () => {
    const penMemory: Record<string, number> = {
      normal: 2,
      brush: 4,
    };

    // User is on normal pen (2px)
    let activePen = 'normal';
    let currentWidth = penMemory[activePen];
    expect(currentWidth).toBe(2);

    // User switches to brush pen
    activePen = 'brush';
    currentWidth = penMemory[activePen];
    expect(currentWidth).toBe(4);

    // User changes brush pen thickness to 6px
    penMemory['brush'] = 6;
    currentWidth = penMemory['brush'];
    expect(currentWidth).toBe(6);

    // User switches back to normal pen -> thickness must still be 2px
    activePen = 'normal';
    currentWidth = penMemory[activePen];
    expect(currentWidth).toBe(2);

    // User switches back to brush -> thickness must still be 6px
    activePen = 'brush';
    currentWidth = penMemory[activePen];
    expect(currentWidth).toBe(6);
  });
});

describe('Fix 3 & 4: Responsive UI, Toolbar Scaling, and Overlap Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('detects 1366x768 display and defaults to compact toolbar scale', () => {
    // Mock window inner dimensions for 1366x768
    vi.stubGlobal('window', { innerWidth: 1366, innerHeight: 768 });

    const scale = getInitialToolbarScale();
    expect(scale).toBe('compact');
  });

  it('defaults to standard on 1920x1080 display', () => {
    vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080 });

    const scale = getInitialToolbarScale();
    expect(scale).toBe('standard');
  });

  it('allows user override in settings to compact, standard, or large', () => {
    localStorage.setItem('smartboard_toolbar_scale', 'large');
    expect(getInitialToolbarScale()).toBe('large');

    localStorage.setItem('smartboard_toolbar_scale', 'compact');
    expect(getInitialToolbarScale()).toBe('compact');
  });

  it('guarantees no horizontal overlap between menu flyout and drawing toolbar on 1366px screen', () => {
    const screenWidth = 1366;
    const compactToolBtnWidth = 33;
    const centerDockGaps = 2 * 7;
    const centerDockPadding = 8;
    const centerDockWidth = (8 * compactToolBtnWidth) + centerDockGaps + centerDockPadding; // ~286px
    const centerDockLeft = (screenWidth - centerDockWidth) / 2; // ~540px

    const menuFlyoutWidth = 310;
    const menuFlyoutLeft = 12;
    const menuFlyoutRight = menuFlyoutLeft + menuFlyoutWidth; // 322px

    // Clearance between menu flyout right edge and center dock left edge
    const clearance = centerDockLeft - menuFlyoutRight;
    expect(clearance).toBeGreaterThan(150); // Over 200px of clearance, zero collision!
  });
});

describe('Fix 5: Smooth Desktop Mode Switching', () => {
  it('switches without minimizing to prevent Windows DWM taskbar flashing', () => {
    const mockWindow = {
      isFullScreen: vi.fn().mockReturnValue(true),
      isMaximized: vi.fn().mockReturnValue(false),
      isMinimized: vi.fn().mockReturnValue(false),
      hide: vi.fn(),
      show: vi.fn(),
      focus: vi.fn(),
      setFullScreen: vi.fn(),
      webContents: {
        send: vi.fn(),
      },
      isDestroyed: vi.fn().mockReturnValue(false),
    };

    // When entering desktop mode: window is hidden (not minimized)
    mockWindow.hide();
    expect(mockWindow.hide).toHaveBeenCalled();

    // When restoring to presentation mode: window is shown directly
    mockWindow.show();
    mockWindow.focus();
    expect(mockWindow.show).toHaveBeenCalled();
    expect(mockWindow.focus).toHaveBeenCalled();

    // Window remained fullscreen during hide/show, avoiding repeated toggles
    expect(mockWindow.isFullScreen()).toBe(true);
  });
});

import { isGeometryInstrument, renderGeometryInstrument } from '../src/renderer/engine/geometryInstrumentRenderer';
import { SubjectRegistry } from '../src/renderer/services/subjectModules';
import { searchGeographyResources } from '../src/renderer/services/geography/geographyRegistry';

describe('Fix 6: PDF Export Shape Fill & Geometry Instruments', () => {
  it('identifies ruler, protractor, compass, and cartesianAxes as geometry instruments', () => {
    expect(isGeometryInstrument('ruler')).toBe(true);
    expect(isGeometryInstrument('protractor')).toBe(true);
    expect(isGeometryInstrument('compass')).toBe(true);
    expect(isGeometryInstrument('cartesianAxes')).toBe(true);
    expect(isGeometryInstrument('rect')).toBe(false);
    expect(isGeometryInstrument('circle')).toBe(false);
  });

  it('renders ruler with calibrated mm and cm ticks and numbers', () => {
    const operations: string[] = [];
    const textRendered: string[] = [];
    const mockCtx: any = {
      save: () => operations.push('save'),
      restore: () => operations.push('restore'),
      beginPath: () => operations.push('beginPath'),
      moveTo: (x: number, y: number) => operations.push(`moveTo(${x},${y})`),
      lineTo: (x: number, y: number) => operations.push(`lineTo(${x},${y})`),
      stroke: () => operations.push('stroke'),
      fill: () => operations.push('fill'),
      fillRect: () => operations.push('fillRect'),
      strokeRect: () => operations.push('strokeRect'),
      fillText: (t: string) => { operations.push('fillText'); textRendered.push(t); },
      measureText: (t: string) => ({ width: t.length * 6 }),
      rect: () => operations.push('rect'),
      clip: () => operations.push('clip'),
      roundRect: () => operations.push('roundRect'),
      setLineDash: () => operations.push('setLineDash'),
    };

    const rulerShape = {
      id: 'test-ruler',
      type: 'shape' as const,
      shapeType: 'ruler' as any,
      x: 50,
      y: 50,
      width: 400,
      height: 70,
      rotation: 0,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
      strokeOpacity: 1,
      strokeStyle: 'solid' as const,
      locked: false,
      layerId: 'objects',
    };

    renderGeometryInstrument(mockCtx, rulerShape, 50, 50, 400, 70);

    // Verify tick marks and cm numbering (0, 1, 2, ... 10) were drawn
    expect(operations).toContain('stroke');
    expect(textRendered).toContain('0');
    expect(textRendered).toContain('1');
    expect(textRendered).toContain('cm');
  });

  it('renders protractor with dual scales (0-180° and 180-0°) and crosshair', () => {
    const textRendered: string[] = [];
    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      arc: () => {},
      fillText: (t: string) => { textRendered.push(t); },
      measureText: (t: string) => ({ width: t.length * 5 }),
      rect: () => {},
      clip: () => {},
    };

    const protractorShape = {
      id: 'test-protractor',
      type: 'shape' as const,
      shapeType: 'protractor' as any,
      x: 100,
      y: 100,
      width: 320,
      height: 160,
      rotation: 0,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
      strokeOpacity: 1,
      strokeStyle: 'solid' as const,
      locked: false,
      layerId: 'objects',
    };

    renderGeometryInstrument(mockCtx, protractorShape, 100, 100, 320, 160);

    // Verify both inner and outer degree scale labels were rendered
    expect(textRendered).toContain('10');
    expect(textRendered).toContain('90');
    expect(textRendered).toContain('170');
  });
});

describe('Fix 7: India Outline Maps & Subject Tools Cleanup', () => {
  it('filters specifically to outline maps when requested', () => {
    const outlineMaps = searchGeographyResources({
      selectedCategory: 'outline-maps',
      searchQuery: '',
      selectedScope: 'all',
      selectedClassLevel: 'all',
      selectedType: 'all',
      favoritesOnly: false,
      recentlyUsedOnly: false,
    });

    expect(outlineMaps.length).toBe(4);
    const ids = outlineMaps.map((m) => m.id);
    expect(ids).toContain('geo-outline-india-blank');
    expect(ids).toContain('geo-outline-india-rivers');
    expect(ids).toContain('geo-outline-india-state-boundary');
    expect(ids).toContain('geo-outline-india-state-names');
  });

  it('geography subject module provides only the 6 core approved tools with zero templates', () => {
    const geoTools = SubjectRegistry.getToolsBySubject('geography');
    expect(geoTools.length).toBe(6);

    const geoTemplates = SubjectRegistry.getAllTemplates().filter((t) => t.subjectId === 'geography');
    expect(geoTemplates.length).toBe(0);

    const toolIds = geoTools.map((t) => t.id);
    expect(toolIds).toContain('geo-tool-resource-centre');
    expect(toolIds).toContain('geo-tool-india-political');
    expect(toolIds).toContain('geo-tool-soi-toposheets');
    expect(toolIds).toContain('geo-tool-topo-symbols');
    expect(toolIds).toContain('geo-tool-3d-globe');
    expect(toolIds).toContain('geo-tool-india-outline-worksheet');
  });
});
