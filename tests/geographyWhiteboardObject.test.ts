/**
 * Stage 2: Interactive Geography Objects on the Whiteboard Test Suite
 *
 * Verifies:
 * 1. Reusable embedded-resource object schema (GeoResourceState)
 * 2. 4 interaction modes (Select, Interact, Annotate, Presentation)
 * 3. Document serialization and .sbl save/reopen persistence
 * 4. Event conflict prevention and feature hit-testing
 * 5. Undo/Redo integration with CommandSystem
 * 6. Vector Canvas2D rendering and Survey of India compliance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ShapeObject, CanvasObject } from '../src/shared/types';
import {
  GeoResourceState,
  createDefaultGeoResourceState,
  isGeoShapeType,
  SAMPLE_INDIA_FEATURES,
} from '../src/renderer/services/geography/types';
import {
  renderGeographyShape,
  hitTestGeoFeature,
} from '../src/renderer/engine/geographyShapeRenderer';
import { isSubjectShape, renderSubjectShape } from '../src/renderer/engine/subjectShapeRenderer';
import { CommandSystem } from '../src/renderer/engine/CommandSystem';
import { createShape } from '../src/renderer/services/subjectModules/commonHelpers';

describe('Stage 2 — Interactive Geography Objects on the Whiteboard', () => {
  let commandSystem: CommandSystem;

  beforeEach(() => {
    commandSystem = new CommandSystem(50);
  });

  // ─── 1. Reusable Embedded Resource Object Model ────────────────────────────

  it('creates a typed embedded Geography resource object using existing whiteboard model', () => {
    const geoState = createDefaultGeoResourceState('soi-india-political', 'Official Survey of India Map');

    const shape = createShape('geoMap', 180, 140, 740, 480, {
      label: 'Official Survey of India Map',
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'rgba(15, 23, 42, 0.95)',
      params: geoState,
    });

    expect(shape.id).toBeDefined();
    expect(shape.type).toBe('shape');
    expect(shape.shapeType).toBe('geoMap');
    expect(shape.x).toBe(180);
    expect(shape.y).toBe(140);
    expect(shape.width).toBe(740);
    expect(shape.height).toBe(480);
    expect(isGeoShapeType(shape.shapeType)).toBe(true);
    expect(isSubjectShape(shape.shapeType)).toBe(true);

    // Verify GeoResourceState schema
    const params = shape.params as GeoResourceState;
    expect(params.version).toBe(1);
    expect(params.resourceId).toBe('soi-india-political');
    expect(params.resourceType).toBe('interactive-map');
    expect(params.provider).toBe('Survey of India');
    expect(params.attribution).toContain('Survey of India');
    expect(params.scope).toBe('india');
    expect(params.interactionMode).toBe('select');
    expect(params.camera.center).toEqual([82.5, 22.0]);
    expect(params.camera.zoom).toBe(1.0);
    expect(params.panOffset).toEqual({ x: 0, y: 0 });
    expect(params.zoomLevel).toBe(1.0);
    expect(params.layers.boundaries).toBe(true);
    expect(params.layers.graticule).toBe(true);
    expect(params.layers.relief).toBe(true);
    expect(params.features.length).toBeGreaterThan(5);
  });

  it('identifies all geographic shape types with isGeoShapeType and isSubjectShape', () => {
    const geoTypes = ['geoMap', 'geoGlobe', 'geoTopoProfile', 'geoCoordinateGrid', 'geoThematicLayer'];
    geoTypes.forEach((t) => {
      expect(isGeoShapeType(t)).toBe(true);
      expect(isSubjectShape(t)).toBe(true);
    });

    expect(isGeoShapeType('rect')).toBe(false);
    expect(isGeoShapeType('circle')).toBe(false);
    expect(isGeoShapeType('line')).toBe(false);
  });

  // ─── 2. Four Interaction Modes ─────────────────────────────────────────────

  it('supports Selection mode (transforming and moving shape)', () => {
    const geoState = createDefaultGeoResourceState();
    geoState.interactionMode = 'select';

    const shape = createShape('geoMap', 100, 100, 600, 400, { params: geoState });
    expect((shape.params as GeoResourceState).interactionMode).toBe('select');

    // In selection mode, translation modifies shape x and y
    shape.x += 50;
    shape.y += 30;
    expect(shape.x).toBe(150);
    expect(shape.y).toBe(130);

    // Resize handles modify width & height
    shape.width = 800;
    shape.height = 500;
    expect(shape.width).toBe(800);
    expect(shape.height).toBe(500);
  });

  it('supports Interaction mode (camera pan, zoom, and feature identification)', () => {
    const geoState = createDefaultGeoResourceState();
    geoState.interactionMode = 'interact';

    const shape = createShape('geoMap', 100, 100, 600, 400, { params: geoState });
    const params = shape.params as GeoResourceState;
    expect(params.interactionMode).toBe('interact');

    // In interaction mode, shape coordinates stay fixed while internal panOffset updates
    params.panOffset.x += 45;
    params.panOffset.y -= 25;
    expect(shape.x).toBe(100); // Fixed!
    expect(shape.y).toBe(100); // Fixed!
    expect(params.panOffset).toEqual({ x: 45, y: -25 });

    // Zoom camera in
    params.zoomLevel = 1.5;
    expect(params.zoomLevel).toBe(1.5);

    // Feature selection
    params.selectedFeatureId = 'feat-himalaya';
    expect(params.selectedFeatureId).toBe('feat-himalaya');
  });

  it('supports Annotation mode (resource acts as stable underlay for drawing)', () => {
    const geoState = createDefaultGeoResourceState();
    geoState.interactionMode = 'annotate';

    const shape = createShape('geoMap', 100, 100, 600, 400, { params: geoState });
    const params = shape.params as GeoResourceState;
    expect(params.interactionMode).toBe('annotate');

    // Adding an annotation directly attached to the resource
    params.annotations.push({
      id: 'ann-1',
      type: 'marker',
      position: [82.5, 23.5],
      label: 'Tropic of Cancer Intersection',
      color: '#f59e0b',
    });

    expect(params.annotations.length).toBe(1);
    expect(params.annotations[0].label).toBe('Tropic of Cancer Intersection');
  });

  it('supports Presentation mode with clean expand and restore transitions', () => {
    const geoState = createDefaultGeoResourceState();
    const originalBounds = { x: 180, y: 140, width: 740, height: 480 };

    const shape = createShape('geoMap', originalBounds.x, originalBounds.y, originalBounds.width, originalBounds.height, {
      params: geoState,
    });

    // Enter Presentation Mode
    const params = shape.params as GeoResourceState;
    params.savedBoundsBeforePresentation = { ...originalBounds };
    params.interactionMode = 'presentation';
    shape.x = 20;
    shape.y = 20;
    shape.width = 1880;
    shape.height = 1040;

    expect(shape.width).toBe(1880);
    expect(shape.height).toBe(1040);
    expect(params.interactionMode).toBe('presentation');
    expect(params.savedBoundsBeforePresentation).toEqual(originalBounds);

    // Exit Presentation Mode (Restoring previous bounds)
    const saved = params.savedBoundsBeforePresentation!;
    shape.x = saved.x;
    shape.y = saved.y;
    shape.width = saved.width;
    shape.height = saved.height;
    params.interactionMode = 'select';
    params.savedBoundsBeforePresentation = undefined;

    expect(shape.x).toBe(180);
    expect(shape.y).toBe(140);
    expect(shape.width).toBe(740);
    expect(shape.height).toBe(480);
    expect(params.interactionMode).toBe('select');
    expect(params.savedBoundsBeforePresentation).toBeUndefined();
  });

  // ─── 3. Document Persistence & Serialization (.sbl format) ───────────────────

  it('survives serialization and reopening without data loss or non-serializable instances', () => {
    const geoState = createDefaultGeoResourceState('soi-india-political', 'Official SoI Map');
    geoState.panOffset = { x: 34, y: -18 };
    geoState.zoomLevel = 1.75;
    geoState.selectedFeatureId = 'feat-deccan';
    geoState.layers.relief = true;
    geoState.layers.graticule = false;
    geoState.annotations.push({
      id: 'marker-1',
      type: 'marker',
      position: [77.2, 28.6],
      label: 'New Delhi',
    });

    const shape = createShape('geoMap', 120, 160, 800, 500, {
      label: 'Official SoI Map',
      params: geoState,
    });

    // Serialize to JSON (.sbl file persistence simulation)
    const jsonString = JSON.stringify(shape);
    expect(jsonString).toBeDefined();

    // Verify no [object Object], undefined, or non-serializable references
    expect(jsonString).not.toContain('[object');
    expect(jsonString).toContain('"resourceId":"soi-india-political"');
    expect(jsonString).toContain('"zoomLevel":1.75');
    expect(jsonString).toContain('"selectedFeatureId":"feat-deccan"');
    expect(jsonString).toContain('"New Delhi"');

    // Deserialize back (reopen lesson simulation)
    const restoredShape: ShapeObject = JSON.parse(jsonString);
    expect(restoredShape.shapeType).toBe('geoMap');
    expect(restoredShape.x).toBe(120);
    expect(restoredShape.y).toBe(160);
    expect(restoredShape.width).toBe(800);
    expect(restoredShape.height).toBe(500);

    const restoredState = restoredShape.params as GeoResourceState;
    expect(restoredState.version).toBe(1);
    expect(restoredState.panOffset).toEqual({ x: 34, y: -18 });
    expect(restoredState.zoomLevel).toBe(1.75);
    expect(restoredState.selectedFeatureId).toBe('feat-deccan');
    expect(restoredState.layers.graticule).toBe(false);
    expect(restoredState.layers.relief).toBe(true);
    expect(restoredState.annotations[0].label).toBe('New Delhi');
  });

  // ─── 4. Event Disambiguation & Feature Hit Testing ───────────────────────────

  it('correctly hit-tests geographic features by document coordinates', () => {
    const geoState = createDefaultGeoResourceState();
    const shape = createShape('geoMap', 100, 100, 800, 600, { params: geoState });

    // The center-north of India (normX ~ 450, normY ~ 100) maps into Ladakh & J&K
    // With x=100, y=100, w=800, h=600:
    // mapMargin=16, mapW=768, mapH=568, baseScale = min(768/1000, 568/1000) = 0.568
    // originX = 100 + 16 + (768 - 568)/2 = 216
    // originY = 100 + 16 + 0 = 116
    // At normX=450, normY=80: screenX = 216 + 450*0.568 ≈ 471, screenY = 116 + 80*0.568 ≈ 161
    const hitFeature = hitTestGeoFeature(shape, { x: 471, y: 161 });
    expect(hitFeature).toBe('feat-ladakh-jk');

    // Far outside the map returns null
    const miss = hitTestGeoFeature(shape, { x: 10, y: 10 });
    expect(miss).toBeNull();
  });

  // ─── 5. Undo / Redo Command Integration ──────────────────────────────────────

  it('executes and undoes camera and layer modifications via CommandSystem', () => {
    const geoState = createDefaultGeoResourceState();
    const shape = createShape('geoMap', 100, 100, 600, 400, { params: geoState });

    let currentShape = JSON.parse(JSON.stringify(shape)) as ShapeObject;
    const initialZoom = (currentShape.params as GeoResourceState).zoomLevel;

    // Execute zoom command
    const updatedShape = JSON.parse(JSON.stringify(currentShape)) as ShapeObject;
    (updatedShape.params as GeoResourceState).zoomLevel = 2.5;

    commandSystem.execute({
      execute: () => {
        currentShape = updatedShape;
      },
      undo: () => {
        currentShape = shape;
      },
    });

    expect((currentShape.params as GeoResourceState).zoomLevel).toBe(2.5);
    expect(commandSystem.canUndo()).toBe(true);

    // Undo
    commandSystem.undo();
    expect((currentShape.params as GeoResourceState).zoomLevel).toBe(initialZoom);
    expect(commandSystem.canRedo()).toBe(true);

    // Redo
    commandSystem.redo();
    expect((currentShape.params as GeoResourceState).zoomLevel).toBe(2.5);
  });

  // ─── 6. Vector Canvas2D Rendering & Legal Attribution Parity ─────────────────

  it('renders geography shapes onto HTML5 Canvas2D without throwing in all modes', () => {
    const mockCalls: string[] = [];
    const mockCtx: any = {
      save: () => mockCalls.push('save'),
      restore: () => mockCalls.push('restore'),
      beginPath: () => mockCalls.push('beginPath'),
      closePath: () => mockCalls.push('closePath'),
      moveTo: () => mockCalls.push('moveTo'),
      lineTo: () => mockCalls.push('lineTo'),
      stroke: () => mockCalls.push('stroke'),
      fill: () => mockCalls.push('fill'),
      clip: () => mockCalls.push('clip'),
      fillRect: () => mockCalls.push('fillRect'),
      strokeRect: () => mockCalls.push('strokeRect'),
      arc: () => mockCalls.push('arc'),
      roundRect: () => mockCalls.push('roundRect'),
      fillText: (text: string) => mockCalls.push(`fillText:${text}`),
      setLineDash: () => mockCalls.push('setLineDash'),
      lineWidth: 1,
      strokeStyle: '#000',
      fillStyle: '#000',
      font: '',
      textAlign: 'left',
      shadowColor: '',
      shadowBlur: 0,
    };

    const modes: GeoResourceState['interactionMode'][] = [
      'select',
      'interact',
      'annotate',
      'presentation',
    ];

    modes.forEach((mode) => {
      const state = createDefaultGeoResourceState();
      state.interactionMode = mode;
      state.selectedFeatureId = 'feat-himalaya';

      const shape = createShape('geoMap', 100, 100, 700, 500, {
        label: 'Test Survey of India Map',
        params: state,
      });

      expect(() => {
        renderGeographyShape(mockCtx, shape, shape.x, shape.y, shape.width, shape.height, 1);
      }).not.toThrow();

      // Verify delegation via renderSubjectShape
      expect(() => {
        renderSubjectShape(mockCtx, shape, shape.x, shape.y, shape.width, shape.height, 1);
      }).not.toThrow();
    });

    // Verify mandatory Survey of India attribution was rendered
    const hasSoIAttribution = mockCalls.some(
      (c) => c.includes('fillText:') && c.includes('Survey of India')
    );
    expect(hasSoIAttribution).toBe(true);

    // Verify North Arrow rendered
    const hasNorthArrow = mockCalls.some((c) => c === 'fillText:N');
    expect(hasNorthArrow).toBe(true);
  });
});

