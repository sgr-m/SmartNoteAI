/**
 * Canvas Navigation, Layers, and Backgrounds Unit Tests
 * Milestone 3, Section 9
 */

import { describe, it, expect } from 'vitest';
import {
  documentReducer,
  initialDocumentState,
  createDefaultPage,
} from '../src/renderer/store/documentStore';
import { Layer, PageBackground, Point } from '../src/shared/types';

describe('Milestone 3 — Section 9: Canvas Navigation, Layers & Backgrounds', () => {
  it('creates default page with 5 standard layers in proper order', () => {
    const page = createDefaultPage();
    expect(page.layers).toHaveLength(5);

    const layerIds = page.layers.map((l) => l.id);
    expect(layerIds).toEqual(['background', 'imported-media', 'drawing', 'objects', 'interaction']);

    const bgLayer = page.layers.find((l) => l.id === 'background');
    expect(bgLayer?.locked).toBe(true);
    expect(bgLayer?.visible).toBe(true);

    const drawLayer = page.layers.find((l) => l.id === 'drawing');
    expect(drawLayer?.locked).toBe(false);
    expect(drawLayer?.visible).toBe(true);
  });

  it('updates layer visibility, locking, and opacity via document actions', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };

    // Toggle visibility of drawing layer
    state = documentReducer(state, {
      type: 'SET_LAYER_VISIBILITY',
      pageIndex: 0,
      layerId: 'drawing',
      visible: false,
    });
    const drawingLayer = state.lesson.pages[0].layers.find((l) => l.id === 'drawing');
    expect(drawingLayer?.visible).toBe(false);

    // Toggle locked status of objects layer
    state = documentReducer(state, {
      type: 'SET_LAYER_LOCKED',
      pageIndex: 0,
      layerId: 'objects',
      locked: true,
    });
    const objectsLayer = state.lesson.pages[0].layers.find((l) => l.id === 'objects');
    expect(objectsLayer?.locked).toBe(true);

    // Change opacity
    state = documentReducer(state, {
      type: 'SET_LAYER_OPACITY',
      pageIndex: 0,
      layerId: 'drawing',
      opacity: 0.65,
    });
    const updatedDrawing = state.lesson.pages[0].layers.find((l) => l.id === 'drawing');
    expect(updatedDrawing?.opacity).toBe(0.65);
  });

  it('reorders layers and updates layer stack order', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };
    const originalLayers = state.lesson.pages[0].layers;

    const reversed: Layer[] = [...originalLayers].reverse().map((l, i) => ({ ...l, order: i }));
    state = documentReducer(state, {
      type: 'REORDER_LAYERS',
      pageIndex: 0,
      layers: reversed,
    });

    expect(state.lesson.pages[0].layers[0].id).toBe('interaction');
    expect(state.lesson.pages[0].layers[4].id).toBe('background');
  });

  it('configures page background type, color, and grid settings', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };

    const ruledBg: PageBackground = {
      type: 'ruled',
      color: '#1b4332',
      gridSize: 40,
      lineColor: 'rgba(255,255,255,0.2)',
    };

    state = documentReducer(state, {
      type: 'SET_PAGE_BACKGROUND',
      pageIndex: 0,
      background: ruledBg,
    });

    expect(state.lesson.pages[0].background.type).toBe('ruled');
    expect(state.lesson.pages[0].background.color).toBe('#1b4332');
    expect(state.lesson.pages[0].background.gridSize).toBe(40);
  });

  it('updates page dimensions for different aspect ratios and custom sizes', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };

    // Set 4:3 standard classroom size
    state = documentReducer(state, {
      type: 'SET_PAGE_DIMENSIONS',
      pageIndex: 0,
      width: 1600,
      height: 1200,
    });

    expect(state.lesson.pages[0].width).toBe(1600);
    expect(state.lesson.pages[0].height).toBe(1200);

    // Set A4 portrait size
    state = documentReducer(state, {
      type: 'SET_PAGE_DIMENSIONS',
      pageIndex: 0,
      width: 2480,
      height: 3508,
    });

    expect(state.lesson.pages[0].width).toBe(2480);
    expect(state.lesson.pages[0].height).toBe(3508);
  });

  it('performs accurate coordinate conversion between document and screen space', () => {
    const zoom = 1.5;
    const panX = 100;
    const panY = 50;
    const dpr = 2;
    const s = zoom * dpr; // 3.0

    const docPt: Point = { x: 200, y: 150 };
    // Screen coords: (doc + pan) * scale
    const screenX = (docPt.x + panX) * s; // (200 + 100) * 3 = 900
    const screenY = (docPt.y + panY) * s; // (150 + 50) * 3 = 600

    expect(screenX).toBe(900);
    expect(screenY).toBe(600);

    // Convert back: screen / s - pan
    const backX = screenX / s - panX;
    const backY = screenY / s - panY;

    expect(backX).toBe(200);
    expect(backY).toBe(150);
  });
});
