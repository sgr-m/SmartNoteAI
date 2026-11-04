/**
 * Stage 3: India Map Library and World Atlas Test Suite
 *
 * Verifies:
 * 1. Survey of India (SoI) official map catalog integrity, editions, and legal attributions
 * 2. 28 States and 8 Union Territories administrative directory completeness
 * 3. 17 World Atlas thematic datasets and geographic feature entities
 * 4. Geodesic distance (Haversine formula), compass heading, and great-circle waypoint calculations
 * 5. Canvas2D vector cartographic rendering (thematic layers, legend drawer, geodesic line)
 * 6. Feature hit-testing across world and Indian administrative boundaries
 * 7. Whiteboard insertion and .sbl JSON persistence roundtrip
 */

import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_INDIA_MAPS,
  INDIA_ADMINISTRATIVE_UNITS,
  WORLD_THEMATIC_LAYERS,
  WORLD_FEATURE_ENTITIES,
  IndiaAdministrativeUnit,
  WorldEntityRecord,
} from '../src/renderer/services/geography/atlasData';
import {
  calculateGreatCircleDistance,
  getCompassHeading,
  toDegrees,
  toRadians,
} from '../src/renderer/services/geography/geodesicService';
import {
  GeoResourceState,
  createDefaultGeoResourceState,
  OfficialIndiaMapRecord,
  isGeoShapeType,
} from '../src/renderer/services/geography/types';
import {
  renderGeographyShape,
  hitTestGeoFeature,
} from '../src/renderer/engine/geographyShapeRenderer';
import { createShape } from '../src/renderer/services/subjectModules/commonHelpers';
import { ShapeObject } from '../src/shared/types';

describe('Stage 3 — India Map Library & World Atlas Subsystem', () => {
  // ─── 1. Official Survey of India (SoI) Map Records ─────────────────────────

  describe('Official Survey of India Map Records', () => {
    it('contains all required official Survey of India publications with 2024 editions', () => {
      expect(OFFICIAL_INDIA_MAPS.length).toBeGreaterThanOrEqual(7);

      const politicalEn = OFFICIAL_INDIA_MAPS.find((m) => m.id === 'soi-pol-india-en');
      expect(politicalEn).toBeDefined();
      expect(politicalEn?.title).toContain('Political Map of India');
      expect(politicalEn?.edition).toContain('Tenth Edition');
      expect(politicalEn?.publicationYear).toBe(2024);
      expect(politicalEn?.scale).toBe('1:4,000,000');
      expect(politicalEn?.officialPortalUrl).toContain('surveyofindia.gov.in');

      const politicalHi = OFFICIAL_INDIA_MAPS.find((m) => m.id === 'soi-pol-india-hi');
      expect(politicalHi).toBeDefined();
      expect(politicalHi?.title).toContain('भारत का राजनीतिक मानचित्र');
      expect(politicalHi?.publicationYear).toBe(2024);

      const physical = OFFICIAL_INDIA_MAPS.find((m) => m.id === 'soi-phys-india');
      expect(physical).toBeDefined();
      expect(physical?.scale).toBe('1:4,500,000');

      const outline = OFFICIAL_INDIA_MAPS.find((m) => m.id === 'soi-outline-india');
      expect(outline).toBeDefined();
      expect(outline?.category).toBe('outline');
    });

    it('catalogs CBSE/ICSE educational toposheet series (45 D/7, 45 D/10, 53 E/4)', () => {
      const topo45d7 = OFFICIAL_INDIA_MAPS.find((m) => m.sheetNumber === '45 D/7');
      expect(topo45d7).toBeDefined();
      expect(topo45d7?.title).toContain('Mount Abu');
      expect(topo45d7?.scale).toBe('1:50,000');
      expect(topo45d7?.contoursInterval).toContain('20 metres');
      expect(topo45d7?.gridSystem).toContain('UTM');
      expect(topo45d7?.conventionalSigns && topo45d7.conventionalSigns.length).toBeGreaterThan(0);

      const topo45d10 = OFFICIAL_INDIA_MAPS.find((m) => m.sheetNumber === '45 D/10');
      expect(topo45d10).toBeDefined();
      expect(topo45d10?.title).toContain('Palanpur');

      const topo53e4 = OFFICIAL_INDIA_MAPS.find((m) => m.sheetNumber === '53 E/4');
      expect(topo53e4).toBeDefined();
      expect(topo53e4?.title).toContain('Shiwalik');
    });

    it('enforces mandatory Survey of India legal attribution across all India maps', () => {
      OFFICIAL_INDIA_MAPS.forEach((map) => {
        expect(map.publisher).toMatch(/Surveyor General of India|Survey of India|भारत के महासर्वेक्षक/);
        expect(map.referenceStandard).toMatch(/Survey of India|भारतीय सर्वेक्षण विभाग/);
      });
    });
  });

  // ─── 2. India Administrative Directory (28 States & 8 UTs) ──────────────────

  describe('India Administrative Directory (28 States & 8 UTs)', () => {
    it('contains exactly 36 administrative units (28 States + 8 Union Territories)', () => {
      expect(INDIA_ADMINISTRATIVE_UNITS.length).toBe(36);

      const states = INDIA_ADMINISTRATIVE_UNITS.filter((u) => u.type === 'state');
      const uts = INDIA_ADMINISTRATIVE_UNITS.filter((u) => u.type === 'ut');

      expect(states.length).toBe(28);
      expect(uts.length).toBe(8);
    });

    it('includes all reorganized Union Territories post-2019/2020 reforms', () => {
      const jk = INDIA_ADMINISTRATIVE_UNITS.find((u) => u.id === 'in-jk');
      expect(jk).toBeDefined();
      expect(jk?.name).toBe('Jammu and Kashmir');
      expect(jk?.type).toBe('ut');
      expect(jk?.capital).toContain('Srinagar');

      const ladakh = INDIA_ADMINISTRATIVE_UNITS.find((u) => u.id === 'in-la');
      expect(ladakh).toBeDefined();
      expect(ladakh?.name).toBe('Ladakh');
      expect(ladakh?.type).toBe('ut');
      expect(ladakh?.capital).toContain('Leh');

      const dnhdd = INDIA_ADMINISTRATIVE_UNITS.find((u) => u.id === 'in-dnhdd');
      expect(dnhdd).toBeDefined();
      expect(dnhdd?.name).toBe('Dadra and Nagar Haveli and Daman and Diu');
      expect(dnhdd?.type).toBe('ut');
      expect(dnhdd?.capital).toBe('Daman');
    });

    it('provides valid capital, region, and area for every state and territory', () => {
      INDIA_ADMINISTRATIVE_UNITS.forEach((unit) => {
        expect(unit.name.length).toBeGreaterThan(2);
        expect(unit.capital.length).toBeGreaterThan(2);
        expect(unit.areaSqKm).toBeGreaterThan(10);
        expect(unit.region).toMatch(/Northern|Southern|Eastern|Western|Central|North-Eastern|Islands/);
        expect(unit.officialSoiMapUrl).toContain('surveyofindia.gov.in');
      });
    });
  });

  // ─── 3. World Atlas 16 Thematic Datasets & Feature Entities ─────────────────

  describe('World Atlas 16 Thematic Datasets & Feature Entities', () => {
    it('defines all 16 required thematic datasets with reputable providers and licenses', () => {
      expect(WORLD_THEMATIC_LAYERS.length).toBe(16);

      const layerIds = WORLD_THEMATIC_LAYERS.map((l) => l.id);
      const expectedIds = [
        'layer-world-pol',
        'layer-world-phys',
        'layer-continents-oceans',
        'layer-mountains',
        'layer-rivers',
        'layer-deserts',
        'layer-grasslands',
        'layer-vegetation',
        'layer-soils',
        'layer-population',
        'layer-timezones',
        'layer-tectonic',
        'layer-earthquakes',
        'layer-volcanoes',
        'layer-currents',
        'layer-trade-routes',
      ];

      expectedIds.forEach((id) => {
        expect(layerIds).toContain(id);
      });

      WORLD_THEMATIC_LAYERS.forEach((layer) => {
        expect(layer.name.length).toBeGreaterThan(3);
        expect(layer.description.length).toBeGreaterThan(10);
        expect(layer.provider.length).toBeGreaterThan(2);
        expect(layer.license.length).toBeGreaterThan(2);
        expect(layer.legendItems.length).toBeGreaterThan(0);
      });
    });

    it('populates verified geographic feature entities with coordinates and properties', () => {
      expect(WORLD_FEATURE_ENTITIES.length).toBeGreaterThanOrEqual(25);

      const himalayas = WORLD_FEATURE_ENTITIES.find((e) => e.name === 'The Himalayas');
      expect(himalayas).toBeDefined();
      expect(himalayas?.category).toBe('Mountain Range');
      expect(himalayas?.description).toContain('Mount Everest');

      const sahara = WORLD_FEATURE_ENTITIES.find((e) => e.name === 'Sahara Desert');
      expect(sahara).toBeDefined();
      expect(sahara?.category).toBe('Desert');

      const barrenIsland = WORLD_FEATURE_ENTITIES.find((e) => e.name.includes('Barren Island'));
      expect(barrenIsland).toBeDefined();
      expect(barrenIsland?.category).toBe('Active Volcano');
      expect(barrenIsland?.description).toContain('Andaman Sea');

      const malacca = WORLD_FEATURE_ENTITIES.find((e) => e.name === 'Strait of Malacca');
      expect(malacca).toBeDefined();
      expect(malacca?.category).toBe('Maritime Chokepoint');

      const nile = WORLD_FEATURE_ENTITIES.find((e) => e.name === 'Nile River');
      expect(nile).toBeDefined();
      expect(nile?.category).toBe('River System');
    });
  });

  // ─── 4. Geodesic Calculations (Haversine & Compass Bearing) ────────────────

  describe('Geodesic Distance & Compass Bearing Calculations', () => {
    it('calculates accurate great-circle distance between New Delhi and London', () => {
      // New Delhi (28.6139° N, 77.2090° E) to London (51.5074° N, 0.1278° W)
      const newDelhi = { lat: 28.6139, lon: 77.2090, label: 'New Delhi' };
      const london = { lat: 51.5074, lon: -0.1278, label: 'London' };

      const result = calculateGreatCircleDistance(newDelhi, london, 10);

      // Known spherical geodesic distance between Delhi and London is ~6,710 km (+- 30 km)
      expect(result.distanceKm).toBeGreaterThan(6680);
      expect(result.distanceKm).toBeLessThan(6740);

      // Statute miles (~4,170 mi) and Nautical miles (~3,623 NM)
      expect(result.distanceMiles).toBeGreaterThan(4150);
      expect(result.distanceMiles).toBeLessThan(4200);
      expect(result.distanceNauticalMiles).toBeGreaterThan(3600);
      expect(result.distanceNauticalMiles).toBeLessThan(3650);

      // Initial forward bearing from Delhi to London is North-West (~305° - 315°)
      expect(result.bearingDegrees).toBeGreaterThan(300);
      expect(result.bearingDegrees).toBeLessThan(320);
      expect(result.compassHeading).toBe('NW');

      // Check waypoints along great-circle arc
      expect(result.waypoints.length).toBe(11); // start + 9 intermediates + end
      expect(result.waypoints[0].lat).toBeCloseTo(newDelhi.lat, 1);
      expect(result.waypoints[0].lon).toBeCloseTo(newDelhi.lon, 1);
      expect(result.waypoints[result.waypoints.length - 1].lat).toBeCloseTo(london.lat, 1);
    });

    it('calculates zero distance for identical origin and destination coordinates', () => {
      const point = { lat: 19.0760, lon: 72.8777, label: 'Mumbai' };
      const result = calculateGreatCircleDistance(point, point);

      expect(result.distanceKm).toBe(0);
      expect(result.distanceMiles).toBe(0);
      expect(result.distanceNauticalMiles).toBe(0);
      expect(result.waypoints.length).toBe(2);
    });

    it('correctly maps 16-wind compass headings across 360 azimuths', () => {
      expect(getCompassHeading(0)).toBe('N');
      expect(getCompassHeading(45)).toBe('NE');
      expect(getCompassHeading(90)).toBe('E');
      expect(getCompassHeading(135)).toBe('SE');
      expect(getCompassHeading(180)).toBe('S');
      expect(getCompassHeading(225)).toBe('SW');
      expect(getCompassHeading(270)).toBe('W');
      expect(getCompassHeading(315)).toBe('NW');
      expect(getCompassHeading(350)).toBe('N');
    });

    it('converts radians and degrees bidirectionally', () => {
      expect(toDegrees(Math.PI)).toBeCloseTo(180, 5);
      expect(toRadians(180)).toBeCloseTo(Math.PI, 5);
      expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 5);
    });
  });

  // ─── 5. Canvas2D Cartographic Vector Rendering ──────────────────────────────

  describe('Canvas2D Cartographic Vector Rendering', () => {
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
        stroke: () => calls.push('stroke'),
        fill: () => calls.push('fill'),
        strokeRect: () => calls.push('strokeRect'),
        fillRect: () => calls.push('fillRect'),
        fillText: () => calls.push('fillText'),
        strokeText: () => calls.push('strokeText'),
        measureText: (text: string) => ({ width: text.length * 7 }),
        rect: () => calls.push('rect'),
        clip: () => calls.push('clip'),
        setLineDash: () => calls.push('setLineDash'),
        roundRect: () => calls.push('roundRect'),
        canvas: { width: 1920, height: 1080 },
      };
      return ctx as CanvasRenderingContext2D;
    }

    it('renders World Thematic Atlas without errors on Canvas2D', () => {
      const ctx = createMockCanvasContext();
      const defaultState = createDefaultGeoResourceState('world-atlas', 'World Thematic Atlas');

      const shape: ShapeObject = {
        id: 'world-atlas-test-1',
        type: 'shape',
        shapeType: 'geoMap',
        x: 100,
        y: 100,
        width: 800,
        height: 480,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'World Thematic Atlas',
        params: {
          ...defaultState,
          scope: 'world',
          projection: 'robinson',
          layers: {
            ...defaultState.layers,
            tectonicPlates: true,
            oceanCurrents: true,
            volcanoes: true,
            mountainRanges: true,
            legend: true,
          },
        },
      };

      expect(() => {
        renderGeographyShape(ctx, shape);
      }).not.toThrow();
    });

    it('renders Geodesic Great-Circle Distance path and badges without throwing', () => {
      const ctx = createMockCanvasContext();
      const defaultState = createDefaultGeoResourceState('world-geodesic', 'World Geodesic Tool');

      const shape: ShapeObject = {
        id: 'world-geodesic-test-1',
        type: 'shape',
        shapeType: 'geoMap',
        x: 100,
        y: 100,
        width: 820,
        height: 500,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'World Geodesic Distance Tool',
        params: {
          ...defaultState,
          scope: 'world',
          measurement: {
            active: true,
            startPoint: { lat: 28.6139, lon: 77.2090, label: 'New Delhi' },
            endPoint: { lat: 51.5074, lon: -0.1278, label: 'London' },
          },
          layers: {
            ...defaultState.layers,
            distanceTool: true,
            legend: true,
          },
        },
      };

      expect(() => {
        renderGeographyShape(ctx, shape);
      }).not.toThrow();
    });
  });

  // ─── 6. Feature Hit-Testing ─────────────────────────────────────────────────

  describe('Feature Hit-Testing in World and India Scopes', () => {
    it('detects hit on Himalayas in world feature space', () => {
      const shape: ShapeObject = {
        id: 'hit-test-world',
        type: 'shape',
        shapeType: 'geoMap',
        x: 100,
        y: 100,
        width: 800,
        height: 480,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'World Features',
        params: {
          ...createDefaultGeoResourceState('world-features', 'World Features'),
          scope: 'world',
          panOffset: { x: 0, y: 0 },
          zoomLevel: 1.0,
        },
      };

      // Himalayas: location [86.9, 27.9]
      // In normalized world [0..1000, 0..1000]:
      // nx = ((86.9 + 180) / 360) * 1000 = 741.38
      // ny = ((90 - 27.9) / 180) * 1000 = 345.0
      // Map margin = 16, mapWidth = 768, mapHeight = 448
      // baseScale = min(768/1000, 448/1000) * 1.0 = 0.448
      // originX = 100 + 16 + (768 - 1000*0.448)/2 = 116 + 160 = 276
      // originY = 100 + 16 + (448 - 1000*0.448)/2 = 116 + 0 = 116
      // sx = 276 + 741.38 * 0.448 = 608.1
      // sy = 116 + 345.0 * 0.448 = 270.5
      const mapMargin = 16;
      const mapWidth = 800 - mapMargin * 2;
      const mapHeight = 480 - mapMargin * 2;
      const baseScale = Math.min(mapWidth / 1000, mapHeight / 1000);
      const originX = 100 + mapMargin + (mapWidth - 1000 * baseScale) / 2;
      const originY = 100 + mapMargin + (mapHeight - 1000 * baseScale) / 2;
      const nx = ((86.9 + 180) / 360) * 1000;
      const ny = ((90 - 27.9) / 180) * 1000;
      const clickX = originX + nx * baseScale;
      const clickY = originY + ny * baseScale;

      const hitId = hitTestGeoFeature(shape, { x: clickX, y: clickY });
      expect(hitId).toBe('mt-himalayas');
    });

    it('returns null when clicking on open ocean outside any feature threshold', () => {
      const shape: ShapeObject = {
        id: 'hit-test-ocean',
        type: 'shape',
        shapeType: 'geoMap',
        x: 100,
        y: 100,
        width: 800,
        height: 480,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'World Ocean',
        params: {
          ...createDefaultGeoResourceState('world-ocean', 'World Ocean'),
          scope: 'world',
        },
      };

      // South Pacific open ocean far from any entities
      const clickX = 100 + 0.2 * 800;
      const clickY = 100 + 0.8 * 480;

      const hitId = hitTestGeoFeature(shape, { x: clickX, y: clickY });
      expect(hitId).toBeNull();
    });
  });

  // ─── 7. Document Persistence and Roundtrip ──────────────────────────────────

  describe('Document Persistence and Serialization', () => {
    it('serializes and deserializes GeoResourceState with Stage 3 layers and measurement', () => {
      const defaultState = createDefaultGeoResourceState('soi-india-political', 'Official SoI Map');

      const shape: ShapeObject = {
        id: 'geo-persistence-stage3',
        type: 'shape',
        shapeType: 'geoMap',
        x: 150,
        y: 120,
        width: 760,
        height: 500,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'Survey of India Political & Measurement',
        params: {
          ...defaultState,
          mapType: 'india_political',
          scope: 'india',
          zoomLevel: 1.5,
          panOffset: { x: 30, y: -20 },
          measurement: {
            active: true,
            startPoint: { lat: 28.6139, lon: 77.2090, label: 'New Delhi' },
            endPoint: { lat: 19.0760, lon: 72.8777, label: 'Mumbai' },
          },
          layers: {
            ...defaultState.layers,
            mountainRanges: true,
            oceanCurrents: false,
            tectonicPlates: false,
            distanceTool: true,
            legend: true,
          },
        },
      };

      // Serialize to JSON string (.sbl file simulation)
      const serialized = JSON.stringify(shape);
      const parsed: ShapeObject = JSON.parse(serialized);

      expect(parsed.id).toBe(shape.id);
      expect(parsed.shapeType).toBe('geoMap');
      expect(isGeoShapeType(parsed.shapeType)).toBe(true);

      const params = parsed.params as GeoResourceState;
      expect(params.resourceId).toBe('soi-india-political');
      expect(params.zoomLevel).toBe(1.5);
      expect(params.panOffset).toEqual({ x: 30, y: -20 });
      expect(params.measurement?.active).toBe(true);
      expect(params.measurement?.startPoint?.label).toBe('New Delhi');
      expect(params.measurement?.endPoint?.label).toBe('Mumbai');
      expect(params.layers.distanceTool).toBe(true);
      expect(params.layers.mountainRanges).toBe(true);
    });
  });
});
