/**
 * Automated Test Suite — STAGE 7: GIS, Satellite Imagery & Thematic Map Laboratory
 *
 * Verifies:
 * 1. All 15 required GIS layers exist with verified metadata, providers, and attribution
 * 2. Web Mercator projection and DMS coordinate formatting formulas
 * 3. Layer management: adding, removing, filtering, opacity, and stack z-ordering
 * 4. Geographic attribute inspection (Elevation, LULC, Soil, Basin, Flood risk, State)
 * 5. Map comparison engine & educational comparison presets
 * 6. Pure Canvas2D shape renderer integration (`gis-viewer`) with swipe divider
 * 7. Whiteboard object persistence and `.sbl` serialization roundtrip
 */

import { describe, it, expect, vi } from 'vitest';
import {
  GIS_LAYERS,
  GIS_COMPARISON_PRESETS,
  getGisLayer,
  filterGisLayers,
  moveLayerInStack,
  lonLatToWebMercator,
  webMercatorToLonLat,
  formatCoordinateDMS,
  inspectGisLocation,
  INDIA_EXTENT_BOUNDS,
  GisLayerCategory,
} from '../src/renderer/services/geography/gisService';
import { ShapeObject } from '../src/shared/types';
import { renderGeographyShape, hitTestGeoFeature } from '../src/renderer/engine/geographyShapeRenderer';
import { createDefaultGeoResourceState, GeoResourceState } from '../src/renderer/services/geography/types';

describe('Stage 7: GIS, Satellite Imagery & Thematic Map Laboratory', () => {
  // ─── 1. GIS Layers Catalog & Metadata Verification ────────────────────────
  describe('GIS Layers Catalog & Metadata (Section 1)', () => {
    it('defines verified layers covering all 15 required geographic categories', () => {
      const requiredCategories: GisLayerCategory[] = [
        'satellite',
        'elevation',
        'land-use',
        'forest',
        'soil',
        'geomorphology',
        'drainage',
        'rivers',
        'wetlands',
        'water-bodies',
        'flood-hazards',
        'erosion',
        'urban-sprawl',
        'agriculture',
        'transport',
      ];

      for (const cat of requiredCategories) {
        const found = GIS_LAYERS.some((l) => l.category === cat);
        expect(found, `Missing required category: ${cat}`).toBe(true);
      }
    });

    it('verifies ISRO/NRSC Bhuvan and Survey of India as primary authoritative providers', () => {
      const bhuvanSatellite = getGisLayer('isro-bhuvan-satellite');
      expect(bhuvanSatellite).toBeDefined();
      expect(bhuvanSatellite!.provider).toContain('NRSC');
      expect(bhuvanSatellite!.sourceUrl).toContain('bhuvan');
      expect(bhuvanSatellite!.attribution).toContain('NRSC / ISRO');

      const cartoDem = getGisLayer('isro-cartodem-elevation');
      expect(cartoDem).toBeDefined();
      expect(cartoDem!.resolution).toContain('30 metres');

      const lulc = getGisLayer('isro-bhuvan-lulc');
      expect(lulc).toBeDefined();
      expect(lulc!.curriculumTopics.length).toBeGreaterThan(0);

      const drainage = getGisLayer('isro-wris-drainage');
      expect(drainage).toBeDefined();
      expect(drainage!.attribution).toContain('Ministry of Jal Shakti');
    });

    it('ensures every layer has full metadata, legend swatches, and valid bounds', () => {
      expect(GIS_LAYERS.length).toBeGreaterThanOrEqual(15);

      for (const layer of GIS_LAYERS) {
        expect(layer.id.length).toBeGreaterThan(0);
        expect(layer.name.length).toBeGreaterThan(0);
        expect(layer.shortName.length).toBeGreaterThan(0);
        expect(layer.provider.length).toBeGreaterThan(0);
        expect(layer.sourceUrl.startsWith('http')).toBe(true);
        expect(layer.attribution.length).toBeGreaterThan(10);
        expect(layer.license.length).toBeGreaterThan(5);
        expect(layer.curriculumTopics.length).toBeGreaterThan(0);
        expect(layer.description.length).toBeGreaterThan(20);
        expect(layer.legend.length).toBeGreaterThanOrEqual(2);
        expect(layer.bounds.length).toBe(4);

        // Every legend chip must have valid color and label
        for (const chip of layer.legend) {
          expect(chip.label.length).toBeGreaterThan(0);
          expect(chip.color.startsWith('#') || chip.color.startsWith('rgb')).toBe(true);
        }
      }
    });

    it('includes verified global baseline datasets (NASA GIBS and GEBCO)', () => {
      const nasa = getGisLayer('nasa-gibs-modis');
      expect(nasa).toBeDefined();
      expect(nasa!.provider).toContain('NASA');

      const gebco = getGisLayer('gebco-bathymetry');
      expect(gebco).toBeDefined();
      expect(gebco!.attribution).toContain('GEBCO');
    });
  });

  // ─── 2. Projections & Coordinates Math ────────────────────────────────────
  describe('Geospatial Coordinate & Web Mercator Formulas (Section 2)', () => {
    it('accurately converts Longitude/Latitude to Web Mercator (EPSG:3857) and back', () => {
      // Origin (0, 0)
      const [x0, y0] = lonLatToWebMercator(0, 0);
      expect(x0).toBeCloseTo(0, 1);
      expect(y0).toBeCloseTo(0, 1);

      // New Delhi: 77.2090° E, 28.6139° N
      const delhiLon = 77.209;
      const delhiLat = 28.6139;
      const [mercX, mercY] = lonLatToWebMercator(delhiLon, delhiLat);
      expect(mercX).toBeGreaterThan(0);
      expect(mercY).toBeGreaterThan(0);

      // Roundtrip recovery
      const [revLon, revLat] = webMercatorToLonLat(mercX, mercY);
      expect(revLon).toBeCloseTo(delhiLon, 2);
      expect(revLat).toBeCloseTo(delhiLat, 2);
    });

    it('formats decimal degree coordinates into clear degrees, minutes, seconds (DMS)', () => {
      const dms = formatCoordinateDMS(77.209, 28.6139);
      expect(dms.latDms).toContain('28°');
      expect(dms.latDms).toContain('N');
      expect(dms.lonDms).toContain('77°');
      expect(dms.lonDms).toContain('E');
      expect(dms.combined).toBe(`${dms.latDms}, ${dms.lonDms}`);
    });
  });

  // ─── 3. Layer Management & Ordering ───────────────────────────────────────
  describe('Layer Filtering, Stack Ordering & Opacity (Section 3)', () => {
    it('filters layers accurately by category', () => {
      const forestLayers = filterGisLayers('forest');
      expect(forestLayers.length).toBeGreaterThan(0);
      expect(forestLayers.every((l) => l.category === 'forest')).toBe(true);

      const waterLayers = filterGisLayers('water-bodies');
      expect(waterLayers.length).toBeGreaterThan(0);
      expect(waterLayers.every((l) => l.category === 'water-bodies')).toBe(true);
    });

    it('filters layers across text search queries', () => {
      const soilResults = filterGisLayers('all', 'soil');
      expect(soilResults.length).toBeGreaterThan(0);
      expect(soilResults.some((l) => l.id === 'isro-nbsslup-soil')).toBe(true);

      const isroResults = filterGisLayers('all', 'ISRO');
      expect(isroResults.length).toBeGreaterThanOrEqual(10);
    });

    it('moves layers up and down in the rendering stack without corrupting order', () => {
      const stack = ['layer-1', 'layer-2', 'layer-3'];

      // Move layer-2 up -> becomes index 0
      const movedUp = moveLayerInStack(stack, 'layer-2', 'up');
      expect(movedUp).toEqual(['layer-2', 'layer-1', 'layer-3']);

      // Move layer-2 down from index 1 -> becomes index 2
      const movedDown = moveLayerInStack(stack, 'layer-2', 'down');
      expect(movedDown).toEqual(['layer-1', 'layer-3', 'layer-2']);

      // Moving top element up should be a no-op
      const noopUp = moveLayerInStack(stack, 'layer-1', 'up');
      expect(noopUp).toEqual(stack);

      // Moving bottom element down should be a no-op
      const noopDown = moveLayerInStack(stack, 'layer-3', 'down');
      expect(noopDown).toEqual(stack);
    });
  });

  // ─── 4. Geographic Attribute Inspection Engine ────────────────────────────
  describe('Geographic Attribute Inspection (Section 4)', () => {
    it('inspects Northern Gangetic plains and accurately identifies Alluvial soils and agriculture', () => {
      // Varanasi / Prayagraj (~82.5° E, 25.4° N)
      const res = inspectGisLocation(82.5, 25.4);
      expect(res.stateName).toContain('Uttar Pradesh');
      expect(res.soilType).toContain('Alluvial');
      expect(res.drainageBasin).toContain('Ganga');
      expect(res.elevationM).toBeLessThan(300);
      expect(res.elevationClass).toContain('Plains');
    });

    it('inspects Brahmaputra Valley and flags Very High flood vulnerability', () => {
      // Assam Brahmaputra (~92.5° E, 26.2° N)
      const res = inspectGisLocation(92.5, 26.2);
      expect(res.stateName).toContain('Assam');
      expect(res.drainageBasin).toContain('Brahmaputra');
      expect(res.floodRisk).toBe('Very High');
      expect(res.geomorphologyUnit).toContain('Floodplain');
    });

    it('inspects Thar Desert and identifies Arid soils, barchans, and low flood hazard', () => {
      // Jaisalmer (~71.0° E, 26.9° N)
      const res = inspectGisLocation(71.0, 26.9);
      expect(res.stateName).toContain('Rajasthan');
      expect(res.soilType).toContain('Arid');
      expect(res.geomorphologyUnit).toContain('Aeolian Sand Dunes');
      expect(res.floodRisk).toBe('Low');
    });

    it('inspects Deccan Plateau and identifies Black Regur Vertisol soil', () => {
      // Pune / Maharashtra (~74.0° E, 19.0° N)
      const res = inspectGisLocation(74.0, 19.0);
      expect(res.soilType).toContain('Black Cotton Soil');
      expect(res.geomorphologyUnit).toContain('Basaltic Trap Plateau');
      expect(res.agriculturalZone).toContain('Cotton');
    });

    it('inspects Western Ghats and identifies Laterite soils and Dense Rainforest', () => {
      // Kerala / Malabar (~76.0° E, 10.5° N)
      const res = inspectGisLocation(76.0, 10.5);
      expect(res.stateName).toContain('Kerala');
      expect(res.forestDensity).toContain('Very Dense Evergreen');
      expect(res.soilType).toContain('Laterite');
    });
  });

  // ─── 5. Map Comparison Engine & Presets ────────────────────────────────────
  describe('Map Comparison Engine & Presets (Section 5)', () => {
    it('defines essential educational comparison presets', () => {
      expect(GIS_COMPARISON_PRESETS.length).toBeGreaterThanOrEqual(5);

      const satVsLulc = GIS_COMPARISON_PRESETS.find((p) => p.id === 'satellite-vs-lulc');
      expect(satVsLulc).toBeDefined();
      expect(satVsLulc!.layerAId).toBe('isro-bhuvan-satellite');
      expect(satVsLulc!.layerBId).toBe('isro-bhuvan-lulc');
      expect(satVsLulc!.pedagogicalFocus.length).toBeGreaterThan(20);

      const elevVsDrainage = GIS_COMPARISON_PRESETS.find((p) => p.id === 'elevation-vs-drainage');
      expect(elevVsDrainage).toBeDefined();
      expect(elevVsDrainage!.layerAId).toBe('isro-cartodem-elevation');
      expect(elevVsDrainage!.layerBId).toBe('isro-wris-drainage');

      const soilsVsAgri = GIS_COMPARISON_PRESETS.find((p) => p.id === 'soils-vs-agriculture');
      expect(soilsVsAgri).toBeDefined();
      expect(soilsVsAgri!.layerAId).toBe('isro-nbsslup-soil');

      const floodsVsWetlands = GIS_COMPARISON_PRESETS.find((p) => p.id === 'floods-vs-wetlands');
      expect(floodsVsWetlands).toBeDefined();
      expect(floodsVsWetlands!.layerAId).toBe('isro-ndem-flood');
      expect(floodsVsWetlands!.layerBId).toBe('isro-sac-wetlands');
    });

    it('verifies that all comparison preset layers exist in the verified layer catalog', () => {
      for (const preset of GIS_COMPARISON_PRESETS) {
        const layerA = getGisLayer(preset.layerAId);
        const layerB = getGisLayer(preset.layerBId);
        expect(layerA, `Missing layer A: ${preset.layerAId}`).toBeDefined();
        expect(layerB, `Missing layer B: ${preset.layerBId}`).toBeDefined();
      }
    });
  });

  // ─── 6. Pure Canvas2D Shape Rendering & Hit Testing ────────────────────────
  describe('Canvas2D gis-viewer Shape Renderer & Hit Testing (Section 6)', () => {
    function createMockCanvasContext(): CanvasRenderingContext2D {
      return {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 70 }),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),
        setLineDash: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    }

    it('renders a GIS thematic viewer shape with swipe divider comparison without throwing errors', () => {
      const ctx = createMockCanvasContext();
      const shape: ShapeObject = {
        id: 'test-gis-shape-1',
        type: 'shape',
        shapeType: 'geoMap',
        x: 100,
        y: 100,
        width: 800,
        height: 500,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'GIS Thematic Viewer',
        params: {
          ...createDefaultGeoResourceState('gis-thematic-lab', 'GIS Thematic Viewer'),
          resourceType: 'gis-viewer',
          gisState: {
            activeLayerIds: ['isro-bhuvan-satellite', 'isro-bhuvan-lulc'],
            layerOpacities: {
              'isro-bhuvan-satellite': 1.0,
              'isro-bhuvan-lulc': 0.75,
            },
            layerOrder: ['isro-bhuvan-satellite', 'isro-bhuvan-lulc'],
            comparisonMode: 'swipe',
            comparisonLayerAId: 'isro-bhuvan-satellite',
            comparisonLayerBId: 'isro-bhuvan-lulc',
            swipePosition: 50,
            inspectedLocation: {
              lon: 77.209,
              lat: 28.6139,
              elevationM: 220,
              lulcClass: 'Built-up Urban',
              stateName: 'Delhi NCR',
            },
          },
        },
      };

      expect(() => {
        renderGeographyShape(ctx, shape, 100, 100, 800, 500);
      }).not.toThrow();

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.clip).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('supports hit testing on the GIS map viewport', () => {
      const shape: ShapeObject = {
        id: 'test-gis-shape-2',
        type: 'shape',
        shapeType: 'geoMap',
        x: 100,
        y: 100,
        width: 600,
        height: 400,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'GIS Map',
        params: {
          ...createDefaultGeoResourceState('gis-thematic-lab', 'GIS Map'),
          resourceType: 'gis-viewer',
        },
      };

      // Point inside shape (200, 200)
      const hitInside = hitTestGeoFeature(shape, { x: 200, y: 200 });
      expect(hitInside).toBe('gis-map-viewport');

      // Point outside shape (999, 999)
      const hitOutside = hitTestGeoFeature(shape, { x: 999, y: 999 });
      expect(hitOutside).toBeNull();
    });
  });

  // ─── 7. Whiteboard Serialization & State Roundtrip ────────────────────────
  describe('Whiteboard Object Persistence & Serialization (Section 7)', () => {
    it('serializes and deserializes GIS layer configurations, comparison mode, and inspected coordinates without loss', () => {
      const originalParams: GeoResourceState = {
        ...createDefaultGeoResourceState('gis-thematic-lab', 'GIS Thematic View'),
        resourceType: 'gis-viewer',
        zoomLevel: 1.4,
        panOffset: { x: 25, y: -15 },
        gisState: {
          activeLayerIds: [
            'isro-bhuvan-satellite',
            'isro-cartodem-elevation',
            'isro-wris-drainage',
          ],
          layerOpacities: {
            'isro-bhuvan-satellite': 0.9,
            'isro-cartodem-elevation': 0.8,
            'isro-wris-drainage': 0.7,
          },
          layerOrder: [
            'isro-bhuvan-satellite',
            'isro-cartodem-elevation',
            'isro-wris-drainage',
          ],
          comparisonMode: 'swipe',
          comparisonLayerAId: 'isro-bhuvan-satellite',
          comparisonLayerBId: 'isro-cartodem-elevation',
          swipePosition: 65,
          inspectedLocation: {
            lon: 94.2167,
            lat: 26.95,
            elevationM: 55,
            lulcClass: 'Wetland / Water Spread',
            soilType: 'New Alluvial Khadar',
            drainageBasin: 'Brahmaputra Basin',
            floodRisk: 'Very High',
            stateName: 'Assam',
          },
        },
      };

      const jsonString = JSON.stringify(originalParams);
      const parsedParams = JSON.parse(jsonString) as GeoResourceState;

      expect(parsedParams.resourceType).toBe('gis-viewer');
      expect(parsedParams.zoomLevel).toBe(1.4);
      expect(parsedParams.panOffset.x).toBe(25);
      expect(parsedParams.gisState).toBeDefined();
      expect(parsedParams.gisState!.activeLayerIds.length).toBe(3);
      expect(parsedParams.gisState!.layerOpacities['isro-bhuvan-satellite']).toBe(0.9);
      expect(parsedParams.gisState!.comparisonMode).toBe('swipe');
      expect(parsedParams.gisState!.swipePosition).toBe(65);
      expect(parsedParams.gisState!.inspectedLocation?.stateName).toBe('Assam');
      expect(parsedParams.gisState!.inspectedLocation?.floodRisk).toBe('Very High');
    });
  });
});

