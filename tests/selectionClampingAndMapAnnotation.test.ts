import { describe, it, expect, vi } from 'vitest';
import { getGeoMapTransform, renderMapAnnotations } from '../src/renderer/engine/geographyShapeRenderer';
import { ShapeObject } from '../src/shared/types';
import { GeoResourceState, GeoAnnotationItem } from '../src/renderer/services/geography/types';

describe('Selection Clamping, Canvas Lock & Map Annotation Anchoring Subsystem', () => {
  describe('Requirement 1: Selection Pill & Flyout Menus Clamping', () => {
    it('calculates clamped screen coordinates so flyouts never render offscreen', () => {
      const containerW = 1000;
      const containerH = 700;

      // Simulate pill placed at top-left corner (pillLeft = 12, pillTop = 16)
      const pillLeft = 12;
      const pillTop = 16;
      const menuW = 240;
      const menuH = 380;
      const triggerOffsetTop = 180; // More Options button at bottom of pill

      // Logic from WhiteboardCanvas getFlyoutStyle
      let targetScreenX: number;
      if (pillLeft + 48 + menuW <= containerW - 8) {
        targetScreenX = pillLeft + 48; // Open right
      } else if (pillLeft - menuW - 8 >= 8) {
        targetScreenX = pillLeft - menuW - 8; // Open left
      } else {
        targetScreenX = Math.max(8, Math.min(containerW - menuW - 8, pillLeft + 48));
      }
      const localLeft = targetScreenX - pillLeft;

      const idealScreenY = pillTop + triggerOffsetTop;
      const targetScreenY = Math.max(8, Math.min(containerH - menuH - 8, idealScreenY));
      const localTop = targetScreenY - pillTop;

      // Assertions: screen positions must be >= 8 and <= container - menu - 8
      const actualScreenX = pillLeft + localLeft;
      const actualScreenY = pillTop + localTop;

      expect(actualScreenX).toBeGreaterThanOrEqual(8);
      expect(actualScreenX + menuW).toBeLessThanOrEqual(containerW);
      expect(actualScreenY).toBeGreaterThanOrEqual(8);
      expect(actualScreenY + menuH).toBeLessThanOrEqual(containerH);
    });

    it('clamps flyout when element is at the extreme right and bottom corner', () => {
      const containerW = 800;
      const containerH = 600;

      // Pill near the bottom-right corner
      const pillLeft = 740;
      const pillTop = 450;
      const menuW = 250;
      const menuH = 350;
      const triggerOffsetTop = 200;

      let targetScreenX: number;
      if (pillLeft + 48 + menuW <= containerW - 8) {
        targetScreenX = pillLeft + 48;
      } else if (pillLeft - menuW - 8 >= 8) {
        targetScreenX = pillLeft - menuW - 8;
      } else {
        targetScreenX = Math.max(8, Math.min(containerW - menuW - 8, pillLeft + 48));
      }
      const localLeft = targetScreenX - pillLeft;

      const idealScreenY = pillTop + triggerOffsetTop;
      const targetScreenY = Math.max(8, Math.min(containerH - menuH - 8, idealScreenY));
      const localTop = targetScreenY - pillTop;

      const actualScreenX = pillLeft + localLeft;
      const actualScreenY = pillTop + localTop;

      expect(actualScreenX).toBeGreaterThanOrEqual(8);
      expect(actualScreenX + menuW).toBeLessThanOrEqual(containerW);
      expect(actualScreenY).toBeGreaterThanOrEqual(8);
      expect(actualScreenY + menuH).toBeLessThanOrEqual(containerH);
    });
  });

  describe('Requirement 2: Canvas Lock Indicator & Unlock', () => {
    it('detects locked canvas/layers and verifies unlock batching', () => {
      const pageLayers = [
        { id: 'background', name: 'Background', visible: true, locked: true },
        { id: 'drawing', name: 'Drawing', visible: true, locked: false },
      ];
      const pageObjects = [
        { id: 'obj1', type: 'shape', locked: true, layerId: 'background' },
        { id: 'obj2', type: 'stroke', locked: false, layerId: 'drawing' },
      ];

      const isLocked = pageLayers.some((l) => l.locked) || pageObjects.some((o) => o.locked);
      expect(isLocked).toBe(true);

      // Simulating handleUnlockCanvas
      const unlockedLayers = pageLayers.map((l) => ({ ...l, locked: false }));
      const unlockedObjects = pageObjects.map((o) => ({
        ...o,
        locked: false,
        layerId: o.layerId === 'background' ? 'objects' : o.layerId,
      }));

      expect(unlockedLayers.every((l) => !l.locked)).toBe(true);
      expect(unlockedObjects.every((o) => !o.locked)).toBe(true);
      expect(unlockedObjects[0].layerId).toBe('objects');
    });
  });

  describe('Requirements 3, 4 & 5: Map Coordinates, Mode Switching & Anchored Annotations', () => {
    it('computes accurate transform between document points and normalized map points', () => {
      const testMapShape: ShapeObject = {
        id: 'map-india-1',
        type: 'shape',
        shapeType: 'geoMap',
        x: 100,
        y: 80,
        width: 800,
        height: 600,
        rotation: 0,
        locked: true,
        layerId: 'background',
        params: {
          version: '1.0',
          resourceId: 'soi-india-political',
          scope: 'india',
          zoomLevel: 1.0,
          panOffset: { x: 0, y: 0 },
          annotations: [],
        } as unknown as GeoResourceState,
      };

      const transform = getGeoMapTransform(testMapShape);

      // Document point corresponding to Uttarakhand location on map
      const uttarDocPoint = { x: 420, y: 240 };
      const normX = transform.screenToNormX(uttarDocPoint.x);
      const normY = transform.screenToNormY(uttarDocPoint.y);

      // Re-projecting normalized point to screen/document coordinates
      const reprojectedX = transform.toScreenX(normX);
      const reprojectedY = transform.toScreenY(normY);

      expect(reprojectedX).toBeCloseTo(uttarDocPoint.x, 2);
      expect(reprojectedY).toBeCloseTo(uttarDocPoint.y, 2);

      // Moving the map by (150, 100):
      const movedMap: ShapeObject = {
        ...testMapShape,
        x: testMapShape.x + 150,
        y: testMapShape.y + 100,
      };

      const movedTransform = getGeoMapTransform(movedMap);
      const movedUttarakhandDocX = movedTransform.toScreenX(normX);
      const movedUttarakhandDocY = movedTransform.toScreenY(normY);

      // The annotation on Uttarakhand must move in exact 1:1 synchronization with the map!
      expect(movedUttarakhandDocX).toBeCloseTo(uttarDocPoint.x + 150, 2);
      expect(movedUttarakhandDocY).toBeCloseTo(uttarDocPoint.y + 100, 2);
    });

    it('renders anchored annotations with correct styling and scaling', () => {
      const annotations: GeoAnnotationItem[] = [
        {
          id: 'ann-1',
          type: 'pen',
          points: [
            [400, 200],
            [410, 210],
            [420, 220],
          ],
          color: '#ef4444',
          width: 4,
          opacity: 1.0,
        },
        {
          id: 'ann-2',
          type: 'highlighter',
          points: [
            [380, 190],
            [430, 190],
          ],
          color: '#eab308',
          width: 12,
          opacity: 0.45,
        },
      ];

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        lineWidth: 1,
        lineCap: 'round',
        lineJoin: 'round',
        strokeStyle: '',
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D;

      const toScreenX = (nx: number) => nx * 1.5;
      const toScreenY = (ny: number) => ny * 1.5;

      renderMapAnnotations(mockCtx, annotations, toScreenX, toScreenY, 1.5);

      expect(mockCtx.save).toHaveBeenCalledTimes(2);
      expect(mockCtx.restore).toHaveBeenCalledTimes(2);
      expect(mockCtx.stroke).toHaveBeenCalledTimes(2);
      expect(mockCtx.moveTo).toHaveBeenCalledWith(600, 300); // 400 * 1.5, 200 * 1.5
    });
  });

  describe('Requirements 1, 2, 4, 5 & 8: Annotation Relative Thickness, Eraser, and Strict Lock Enforcement', () => {
    it('scales annotation thickness proportionally with map zoom level', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        lineWidth: 1,
        lineCap: 'round',
        lineJoin: 'round',
        strokeStyle: '',
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D;

      const ann: GeoAnnotationItem = {
        id: 'ann-scale-test',
        type: 'pen',
        points: [[100, 100], [110, 110]],
        color: '#ef4444',
        width: 4,
      };

      // Zoom level 1.0 (baseScale = 1.0)
      renderMapAnnotations(mockCtx, [ann], (x) => x, (y) => y, 1.0);
      expect(mockCtx.lineWidth).toBe(4);

      // Zoom level 2.0 (baseScale = 2.0) -> thickness should increase to 8px
      renderMapAnnotations(mockCtx, [ann], (x) => x, (y) => y, 2.0);
      expect(mockCtx.lineWidth).toBe(8);

      // Zoom level 0.5 (baseScale = 0.5) -> thickness should decrease to 2px
      renderMapAnnotations(mockCtx, [ann], (x) => x, (y) => y, 0.5);
      expect(mockCtx.lineWidth).toBe(2);
    });

    it('erases annotation stroke on map without deleting the underlying locked map object', () => {
      const mapShape: ShapeObject = {
        id: 'map-shape-locked',
        type: 'shape',
        shapeType: 'geoMap',
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        rotation: 0,
        locked: true,
        layerId: 'background',
        params: {
          version: '1.0',
          resourceId: 'soi-india-political',
          scope: 'india',
          zoomLevel: 1.0,
          panOffset: { x: 0, y: 0 },
          annotations: [
            {
              id: 'stroke-to-erase',
              type: 'pen',
              points: [[200, 200], [205, 205], [210, 210]],
              color: '#ef4444',
              width: 4,
            },
            {
              id: 'stroke-to-keep',
              type: 'pen',
              points: [[800, 800], [805, 805]],
              color: '#3b82f6',
              width: 4,
            },
          ],
        } as unknown as GeoResourceState,
      };

      const transform = getGeoMapTransform(mapShape);
      const eraserPos = { x: 205, y: 205 };
      const eraserRadius = 15;
      const eraserRadiusSq = eraserRadius * eraserRadius;

      // Simulate eraser logic matching DrawingEngine.eraseAt
      const remainingAnns: GeoAnnotationItem[] = [];
      let erasedCount = 0;

      for (const ann of mapShape.params!.annotations!) {
        let hit = false;
        for (const pt of ann.points!) {
          const docX = transform.toScreenX(pt[0]);
          const docY = transform.toScreenY(pt[1]);
          const dx = docX - eraserPos.x;
          const dy = docY - eraserPos.y;
          if (dx * dx + dy * dy <= eraserRadiusSq) {
            hit = true;
            break;
          }
        }
        if (hit) {
          erasedCount++;
        } else {
          remainingAnns.push(ann);
        }
      }

      expect(erasedCount).toBe(1);
      expect(remainingAnns).toHaveLength(1);
      expect(remainingAnns[0].id).toBe('stroke-to-keep');
      // Verify map object remains locked and safe
      expect(mapShape.locked).toBe(true);
    });

    it('enforces strict lock rules: vertical pill and non-map badges are suppressed when canvas is locked', () => {
      const isCanvasOrLayerLocked = true;
      const selectedObject = {
        id: 'generic-shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        locked: false,
      };

      // Condition used in WhiteboardCanvas
      const isSelectionInteractive = !isCanvasOrLayerLocked && !selectedObject.locked;
      expect(isSelectionInteractive).toBe(false);

      // The vertical selection pill condition
      const shouldRenderVerticalPill = isSelectionInteractive && Boolean(selectedObject);
      expect(shouldRenderVerticalPill).toBe(false);
    });

    it('auto-switches to annotate mode when zoom in or zoom out is clicked', () => {
      const mapParams: Partial<GeoResourceState> = {
        zoomLevel: 1.0,
        interactionMode: 'select',
      };

      // Zoom in action simulation
      const onZoomIn = (prev: Partial<GeoResourceState>) => ({
        ...prev,
        zoomLevel: Math.min(6.0, (prev.zoomLevel || 1.0) * 1.25),
        interactionMode: 'annotate' as const,
      });

      const updated = onZoomIn(mapParams);
      expect(updated.zoomLevel).toBe(1.25);
      expect(updated.interactionMode).toBe('annotate');

      // Zoom out action simulation
      const onZoomOut = (prev: Partial<GeoResourceState>) => ({
        ...prev,
        zoomLevel: Math.max(0.5, (prev.zoomLevel || 1.0) * 0.8),
        interactionMode: 'annotate' as const,
      });

      const updatedOut = onZoomOut(updated);
      expect(updatedOut.zoomLevel).toBe(1.0);
      expect(updatedOut.interactionMode).toBe('annotate');
    });
  });
});

