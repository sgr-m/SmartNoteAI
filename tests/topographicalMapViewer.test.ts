/**
 * Stage 4: Interactive Topographical Map Viewer Test Suite
 *
 * Verifies:
 * 1. Survey of India (SoI) educational topographical sheet catalog (45 D/7, 45 D/10, 53 E/4)
 * 2. Conventional Signs & Symbols catalog (>30 symbols across all official categories)
 * 3. National Topographical Grid mathematics:
 *    - Eastings vs Northings
 *    - 4-figure and 6-figure Grid References (GR)
 *    - Projected Grid <-> Geographic Lat/Long DMS coordinate transformations
 * 4. Scale and Measurement calculations:
 *    - Representative Fraction (RF 1:50,000)
 *    - Statement of scale (2 cm = 1 km)
 *    - Ground distance in km & metres, map distance in cm
 *    - Whole-circle bearings (0..360°) and compass directions
 *    - Area calculation in km² and hectares (100 ha = 1 km²)
 * 5. Canvas2D vector topographical rendering (contours, grid lines, drainage, settlements, scale bar)
 * 6. Topographical feature hit-testing on landmarks (Guru Shikhar, Nakki Lake, Dilwara)
 * 7. Whiteboard integration and .sbl JSON document serialization roundtrip
 */

import { describe, it, expect } from 'vitest';
import {
  SOI_TOPO_SHEETS,
  SHEET_45D7_LANDMARKS,
  TopoSheetDefinition,
  TopoFeatureLandmark,
  computeGridReference,
  parseGridReference,
  gridToGeoCoordinates,
  geoToGridCoordinates,
  calculateMapAndGroundDistance,
  calculateAreaFromGridUnits,
  getScaleExplanation,
} from '../src/renderer/services/geography/topoService';
import {
  SO_TOPOGRAPHICAL_SYMBOLS,
  TopoSymbolRecord,
} from '../src/renderer/services/geography/topoSymbols';
import {
  GeoResourceState,
  createDefaultGeoResourceState,
  isGeoShapeType,
} from '../src/renderer/services/geography/types';
import {
  renderGeographyShape,
  hitTestGeoFeature,
} from '../src/renderer/engine/geographyShapeRenderer';
import { createShape } from '../src/renderer/services/subjectModules/commonHelpers';
import { ShapeObject } from '../src/shared/types';

describe('Stage 4 — Interactive Topographical Map Viewer Subsystem', () => {
  // ─── 1. Survey of India Topographical Sheets Catalog ───────────────────────

  describe('Survey of India Educational Toposheets Catalog', () => {
    it('catalogs the standard prescribed CBSE/ICSE educational toposheet series', () => {
      expect(SOI_TOPO_SHEETS.length).toBeGreaterThanOrEqual(3);

      const sheet45d7 = SOI_TOPO_SHEETS.find((s) => s.sheetNumber.includes('45 D/7') || s.sheetNumber.includes('G45D7'));
      expect(sheet45d7).toBeDefined();
      expect(sheet45d7?.title).toContain('Mount Abu');
      expect(sheet45d7?.state).toContain('Rajasthan');
      expect(sheet45d7?.scaleRF).toBe(50000);
      expect(sheet45d7?.statementScale).toBe('2 cm represents 1 km');
      expect(sheet45d7?.contourIntervalMeters).toBe(20);
      expect(sheet45d7?.indexContourIntervalMeters).toBe(100);
      expect(sheet45d7?.datum).toContain('UTM');

      const sheet45d10 = SOI_TOPO_SHEETS.find((s) => s.sheetNumber.includes('45 D/10') || s.sheetNumber.includes('G45D10'));
      expect(sheet45d10).toBeDefined();
      expect(sheet45d10?.title).toContain('Palanpur');

      const sheet53e4 = SOI_TOPO_SHEETS.find((s) => s.sheetNumber.includes('53 E/4') || s.sheetNumber.includes('H43E4'));
      expect(sheet53e4).toBeDefined();
      expect(sheet53e4?.title).toContain('Shiwalik');
    });

    it('enforces mandatory Survey of India legal attribution across all toposheets', () => {
      SOI_TOPO_SHEETS.forEach((sheet) => {
        expect(sheet.publisher).toContain('Surveyor General of India');
        expect(sheet.attribution).toContain('Survey of India');
      });
    });

    it('provides verified landmarks for Sheet 45 D/7 (Mount Abu)', () => {
      expect(SHEET_45D7_LANDMARKS.length).toBeGreaterThanOrEqual(8);

      const guruShikhar = SHEET_45D7_LANDMARKS.find((lm) => lm.id === 'lm-guru-shikhar');
      expect(guruShikhar).toBeDefined();
      expect(guruShikhar?.elevationMeters).toBe(1722);
      expect(guruShikhar?.fourFigureGR).toBe('8795');
      expect(guruShikhar?.sixFigureGR).toBe('874958');

      const nakkiLake = SHEET_45D7_LANDMARKS.find((lm) => lm.id === 'lm-nakki-lake');
      expect(nakkiLake).toBeDefined();
      expect(nakkiLake?.fourFigureGR).toBe('8491');
      expect(nakkiLake?.sixFigureGR).toBe('842915');

      const dilwara = SHEET_45D7_LANDMARKS.find((lm) => lm.id === 'lm-dilwara-temples');
      expect(dilwara).toBeDefined();
      expect(dilwara?.sixFigureGR).toBe('851924');
    });
  });

  // ─── 2. Conventional Signs & Symbols Catalog ────────────────────────────────

  describe('Conventional Signs & Symbols Catalog', () => {
    it('contains comprehensive conventional symbols across all 10 standard categories', () => {
      expect(SO_TOPOGRAPHICAL_SYMBOLS.length).toBeGreaterThanOrEqual(30);

      const categories = new Set(SO_TOPOGRAPHICAL_SYMBOLS.map((s) => s.category));
      expect(categories).toContain('roads');
      expect(categories).toContain('railways');
      expect(categories).toContain('bridges');
      expect(categories).toContain('settlements');
      expect(categories).toContain('buildings');
      expect(categories).toContain('religious');
      expect(categories).toContain('water');
      expect(categories).toContain('relief');
      expect(categories).toContain('vegetation');
      expect(categories).toContain('boundaries');

      SO_TOPOGRAPHICAL_SYMBOLS.forEach((sym) => {
        expect(sym.name.length).toBeGreaterThan(2);
        expect(sym.color.length).toBeGreaterThan(3);
        expect(sym.meaning.length).toBeGreaterThan(10);
        expect(sym.topographicalContext.length).toBeGreaterThan(10);
        expect(sym.curriculumSignificance.length).toBeGreaterThan(10);
      });
    });

    it('contains key educational exam symbols (PO, PS, Temple, Lined Well, RF, BM)', () => {
      const po = SO_TOPOGRAPHICAL_SYMBOLS.find((s) => s.id === 'sym-post-office');
      expect(po).toBeDefined();
      expect(po?.symbolGlyph).toBe('PO');

      const temple = SO_TOPOGRAPHICAL_SYMBOLS.find((s) => s.id === 'sym-temple');
      expect(temple).toBeDefined();

      const well = SO_TOPOGRAPHICAL_SYMBOLS.find((s) => s.id === 'sym-open-lined-well');
      expect(well).toBeDefined();
      expect(well?.color).toBe('#0284c7');

      const rf = SO_TOPOGRAPHICAL_SYMBOLS.find((s) => s.id === 'sym-reserved-forest');
      expect(rf).toBeDefined();
      expect(rf?.meaning).toContain('Reserved Forest');

      const bm = SO_TOPOGRAPHICAL_SYMBOLS.find((s) => s.id === 'sym-bench-mark');
      expect(bm).toBeDefined();
      expect(bm?.symbolGlyph).toContain('BM');
    });
  });

  // ─── 3. Grid References Mathematics (4-Fig & 6-Fig GR) ──────────────────────

  describe('National Grid References Mathematics', () => {
    it('calculates 4-figure and 6-figure grid references correctly', () => {
      // Guru Shikhar: Easting 87.4, Northing 95.8
      const gr1 = computeGridReference(87.4, 95.8);
      expect(gr1.fourFigure).toBe('8795');
      expect(gr1.sixFigure).toBe('874958');
      expect(gr1.eastingInt).toBe(87);
      expect(gr1.northingInt).toBe(95);
      expect(gr1.eastingTenth).toBe(4);
      expect(gr1.northingTenth).toBe(8);

      // Nakki Lake: Easting 84.2, Northing 91.5
      const gr2 = computeGridReference(84.2, 91.5);
      expect(gr2.fourFigure).toBe('8491');
      expect(gr2.sixFigure).toBe('842915');

      // Boundary: exact grid line intersection (Easting 80.0, Northing 90.0)
      const gr3 = computeGridReference(80.0, 90.0);
      expect(gr3.fourFigure).toBe('8090');
      expect(gr3.sixFigure).toBe('800900');
    });

    it('parses 4-figure and 6-figure grid references back into coordinates', () => {
      const parsed4 = parseGridReference('8491');
      expect(parsed4).toBeDefined();
      expect(parsed4?.precision).toBe(4);
      expect(parsed4?.easting).toBeCloseTo(84.5, 1);
      expect(parsed4?.northing).toBeCloseTo(91.5, 1);

      const parsed6 = parseGridReference('874958');
      expect(parsed6).toBeDefined();
      expect(parsed6?.precision).toBe(6);
      expect(parsed6?.easting).toBeCloseTo(87.45, 1);
      expect(parsed6?.northing).toBeCloseTo(95.85, 1);

      expect(parseGridReference('invalid')).toBeNull();
      expect(parseGridReference('123')).toBeNull();
    });

    it('transforms projected grid to geographic coordinates (DMS) and back', () => {
      const sheet = SOI_TOPO_SHEETS[0]; // Sheet 45 D/7: Easting 80..95, Northing 85..102
      const geo = gridToGeoCoordinates(87.4, 95.8, sheet);

      expect(geo.lat).toBeGreaterThanOrEqual(sheet.geoBounds.minLat);
      expect(geo.lat).toBeLessThanOrEqual(sheet.geoBounds.maxLat);
      expect(geo.lon).toBeGreaterThanOrEqual(sheet.geoBounds.minLon);
      expect(geo.lon).toBeLessThanOrEqual(sheet.geoBounds.maxLon);

      expect(geo.dmsLat).toContain('N');
      expect(geo.dmsLon).toContain('E');

      // Roundtrip back to grid
      const grid = geoToGridCoordinates(geo.lat, geo.lon, sheet);
      expect(grid.easting).toBeCloseTo(87.4, 1);
      expect(grid.northing).toBeCloseTo(95.8, 1);
    });
  });

  // ─── 4. Scale and Measurement Laboratory Calculations ───────────────────────

  describe('Scale and Measurement Laboratory Calculations', () => {
    it('calculates ground distance, map distance, and bearing for RF 1:50,000', () => {
      // Point A: Mount Abu town (Easting 84.0, Northing 91.0)
      // Point B: Guru Shikhar (Easting 87.4, Northing 95.8)
      // deltaE = 3.4 km, deltaN = 4.8 km
      // ground distance = sqrt(3.4^2 + 4.8^2) = sqrt(11.56 + 23.04) = sqrt(34.6) ≈ 5.88 km
      const ptA = { easting: 84.0, northing: 91.0 };
      const ptB = { easting: 87.4, northing: 95.8 };

      const res = calculateMapAndGroundDistance(ptA, ptB, 50000);

      expect(res.groundDistanceKm).toBeCloseTo(5.88, 1);
      expect(res.groundDistanceMeters).toBeGreaterThan(5800);
      expect(res.groundDistanceMeters).toBeLessThan(5950);

      // At 1:50,000, 1 km = 2.0 cm on map, so 5.88 km = 11.76 cm
      expect(res.mapDistanceCm).toBeCloseTo(11.76, 1);

      // Forward bearing from SW to NE is around 35° (compass heading NE)
      expect(res.forwardBearingDegrees).toBeGreaterThan(30);
      expect(res.forwardBearingDegrees).toBeLessThan(40);
      expect(res.compassDirection).toBe('NE');
    });

    it('calculates identical points as zero distance and zero bearing', () => {
      const pt = { easting: 85.0, northing: 92.0 };
      const res = calculateMapAndGroundDistance(pt, pt);

      expect(res.groundDistanceKm).toBe(0);
      expect(res.groundDistanceMeters).toBe(0);
      expect(res.mapDistanceCm).toBe(0);
      expect(res.forwardBearingDegrees).toBe(0);
    });

    it('calculates area in km² and hectares correctly', () => {
      // 2 km x 3 km = 6 km² = 600 hectares
      const area = calculateAreaFromGridUnits(2, 3, 50000);

      expect(area.areaSqKm).toBe(6);
      expect(area.areaHectares).toBe(600);
      expect(area.gridSquaresCount).toBe(6);
      expect(area.areaAcres).toBeCloseTo(1482.6, 0);
    });

    it('provides pedagogical scale explanations for 1:50,000', () => {
      const exp = getScaleExplanation(50000);
      expect(exp.rf).toBe('1:50,000');
      expect(exp.statementScale).toContain('2 cm represents 1 km');
      expect(exp.groundPerCm).toContain('500 metres');
    });
  });

  // ─── 5. Canvas2D Topographical Rendering ────────────────────────────────────

  describe('Canvas2D Topographical Vector Rendering', () => {
    function createMockCanvasContext(): CanvasRenderingContext2D {
      const calls: string[] = [];
      const ctx: any = {
        save: () => calls.push('save'),
        restore: () => calls.push('restore'),
        beginPath: () => calls.push('beginPath'),
        closePath: () => calls.push('closePath'),
        moveTo: () => calls.push('moveTo'),
        lineTo: () => calls.push('lineTo'),
        arc: () => calls.push('arc'),
        ellipse: () => calls.push('ellipse'),
        stroke: () => calls.push('stroke'),
        fill: () => calls.push('fill'),
        strokeRect: () => calls.push('strokeRect'),
        fillRect: () => calls.push('fillRect'),
        fillText: () => calls.push('fillText'),
        measureText: (text: string) => ({ width: text.length * 7 }),
        rect: () => calls.push('rect'),
        clip: () => calls.push('clip'),
        setLineDash: () => calls.push('setLineDash'),
        roundRect: () => calls.push('roundRect'),
        canvas: { width: 1920, height: 1080 },
      };
      return ctx as CanvasRenderingContext2D;
    }

    it('renders Sheet 45 D/7 topographical sheet without errors', () => {
      const ctx = createMockCanvasContext();
      const defaultState = createDefaultGeoResourceState('soi-topo-45d7', 'Mount Abu Toposheet');

      const shape: ShapeObject = {
        id: 'topo-sheet-render-1',
        type: 'shape',
        shapeType: 'geoTopoProfile',
        x: 100,
        y: 100,
        width: 840,
        height: 520,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#f59e0b',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'Sheet 45 D/7 (Mount Abu)',
        params: {
          ...defaultState,
          resourceType: 'topographic-sheet',
          sheetNumber: '45 D/7',
          contourInterval: 20,
          scaleRF: 50000,
          layers: {
            ...defaultState.layers,
            contours: true,
            gridLines: true,
            drainage: true,
            transport: true,
            settlements: true,
            spotHeights: true,
          },
        },
      };

      expect(() => {
        renderGeographyShape(ctx, shape);
      }).not.toThrow();
    });

    it('hit-tests topographical landmarks on Sheet 45 D/7 correctly', () => {
      const shape: ShapeObject = {
        id: 'hit-test-topo',
        type: 'shape',
        shapeType: 'geoTopoProfile',
        x: 100,
        y: 100,
        width: 800,
        height: 480,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#f59e0b',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'Sheet 45 D/7',
        params: {
          ...createDefaultGeoResourceState('soi-topo-45d7', 'Sheet 45 D/7'),
          resourceType: 'topographic-sheet',
        },
      };

      // Guru Shikhar: Easting 87.4, Northing 95.8
      // nx = ((87.4 - 80) / 15) * 1000 = 493.33
      // ny = ((102 - 95.8) / 17) * 1000 = 364.70
      const mapMargin = 16;
      const mapWidth = 800 - mapMargin * 2;
      const mapHeight = 480 - mapMargin * 2;
      const baseScale = Math.min(mapWidth / 1000, mapHeight / 1000);
      const originX = 100 + mapMargin + (mapWidth - 1000 * baseScale) / 2;
      const originY = 100 + mapMargin + (mapHeight - 1000 * baseScale) / 2;
      const clickX = originX + (((87.4 - 80) / 15) * 1000) * baseScale;
      const clickY = originY + (((102 - 95.8) / 17) * 1000) * baseScale;

      const hit = hitTestGeoFeature(shape, { x: clickX, y: clickY });
      expect(hit).toBe('lm-guru-shikhar');
    });
  });

  // ─── 6. Document Persistence & Serialization ────────────────────────────────

  describe('Document Persistence and Serialization', () => {
    it('serializes and deserializes geoTopoProfile with full topographical state', () => {
      const defaultState = createDefaultGeoResourceState('soi-topo-45d7', 'Mount Abu Toposheet');

      const shape: ShapeObject = {
        id: 'topo-persistence-test',
        type: 'shape',
        shapeType: 'geoTopoProfile',
        x: 180,
        y: 120,
        width: 820,
        height: 520,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#f59e0b',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'Sheet 45 D/7 Mount Abu',
        params: {
          ...defaultState,
          resourceType: 'topographic-sheet',
          sheetNumber: '45 D/7',
          contourInterval: 20,
          scaleRF: 50000,
          zoomLevel: 1.5,
          panOffset: { x: 20, y: -15 },
          layers: {
            ...defaultState.layers,
            contours: true,
            gridLines: true,
            drainage: true,
            transport: true,
            settlements: true,
            spotHeights: true,
          },
        },
      };

      const serialized = JSON.stringify(shape);
      const parsed: ShapeObject = JSON.parse(serialized);

      expect(parsed.id).toBe(shape.id);
      expect(parsed.shapeType).toBe('geoTopoProfile');
      expect(isGeoShapeType(parsed.shapeType)).toBe(true);

      const params = parsed.params as GeoResourceState;
      expect(params.resourceType).toBe('topographic-sheet');
      expect(params.sheetNumber).toBe('45 D/7');
      expect(params.contourInterval).toBe(20);
      expect(params.scaleRF).toBe(50000);
      expect(params.zoomLevel).toBe(1.5);
      expect(params.panOffset).toEqual({ x: 20, y: -15 });
      expect(params.layers.contours).toBe(true);
      expect(params.layers.gridLines).toBe(true);
    });
  });
});

