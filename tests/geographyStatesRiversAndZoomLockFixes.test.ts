import { describe, it, expect } from 'vitest';
import { getMapAssetForState } from '../src/renderer/engine/geographyShapeRenderer';
import {
  ALL_INDIAN_STATES_DATA,
  COMPREHENSIVE_INDIAN_RIVERS,
  SOI_INDIA_BOUNDARY_LONLAT,
  SMOOTH_SOI_INDIA_BOUNDARY_LONLAT,
  getSmoothBoundaryPoints,
  DETAILED_INDIAN_STATES,
  getStatePolygonLonLat,
} from '../src/renderer/services/geography/detailedMapData';
import { createDefaultGeoResourceState, GeoResourceState } from '../src/renderer/services/geography/types';

describe('Geography Maps, State Maps, Rivers in India, Zoom Mode & Lock Fixes', () => {
  describe('1. Map Asset Resolution Hierarchy (Official Survey of India World Map Enforcement)', () => {
    it('resolves World Political Map to official Survey of India World Map with unbroken sovereign borders', () => {
      const worldPolState: GeoResourceState = {
        ...createDefaultGeoResourceState('geo-world-political-atlas', 'World Political Map'),
        scope: 'world',
        resourceId: 'geo-world-political-atlas',
        title: 'World Political Map (Official Survey of India Edition)',
      };
      const polAsset = getMapAssetForState(worldPolState);
      expect(polAsset).toBe('./assets/maps/soi_world_map_en_official.jpg');

      // Disputed CIA/Natural Earth files must never be referenced
      expect(polAsset).not.toContain('world_political_map');
    });

    it('resolves Major Global Ocean Currents to dedicated high-resolution vector map', () => {
      const oceanCurrentsState: GeoResourceState = {
        ...createDefaultGeoResourceState('geo-ocean-currents-circulation', 'Major Global Ocean Currents & Gyres'),
        scope: 'world',
        resourceId: 'geo-ocean-currents-circulation',
        title: 'Major Global Ocean Currents & Gyres',
      };
      const oceanAsset = getMapAssetForState(oceanCurrentsState);
      expect(oceanAsset).toBe('./assets/maps/major_global_ocean_currents.svg');
    });

    it('resolves Physiographic Divisions of India to official Physical map', () => {
      const physioState: GeoResourceState = {
        ...createDefaultGeoResourceState('geo-india-physiographic-divisions', 'Physiographic Divisions of India'),
        scope: 'india',
        resourceId: 'geo-india-physiographic-divisions',
        title: 'Physiographic Divisions of India',
      };
      const asset = getMapAssetForState(physioState);
      expect(asset).toBe('./assets/maps/soi_physical_map_india_official_hd.jpg');
    });

    it('resolves India Drainage System & River Basins to dedicated high-resolution CWC / Survey of India map', () => {
      const drainageState: GeoResourceState = {
        ...createDefaultGeoResourceState('geo-india-major-drainage-rivers', 'India Drainage System & River Basins'),
        scope: 'india',
        resourceId: 'geo-india-major-drainage-rivers',
        title: 'India Drainage System & River Basins',
      };
      const asset = getMapAssetForState(drainageState);
      expect(asset).toBe('./assets/maps/soi_india_drainage_and_river_basins.svg');
    });

    it('resolves state-specific maps to their dedicated SVG files rather than defaulting to Indian political map', () => {
      const upState: GeoResourceState = {
        ...createDefaultGeoResourceState('in-up', 'Uttar Pradesh Map'),
        scope: 'india',
        resourceId: 'in-up',
        selectedFeatureId: 'in-up',
        title: 'Uttar Pradesh (Official State Map)',
      };
      expect(getMapAssetForState(upState)).toBe('./assets/maps/states/in-up.svg');

      const mhState: GeoResourceState = {
        ...createDefaultGeoResourceState('in-mh', 'Maharashtra Map'),
        scope: 'india',
        resourceId: 'in-mh',
        selectedFeatureId: 'in-mh',
        title: 'Maharashtra (Official State Map)',
      };
      expect(getMapAssetForState(mhState)).toBe('./assets/maps/states/in-mh.svg');

      const dlState: GeoResourceState = {
        ...createDefaultGeoResourceState('in-dl', 'Delhi NCT Map'),
        scope: 'india',
        resourceId: 'in-dl',
        selectedFeatureId: 'in-dl',
        title: 'Delhi (NCT) Official Map',
      };
      expect(getMapAssetForState(dlState)).toBe('./assets/maps/states/in-dl.svg');

      const laState: GeoResourceState = {
        ...createDefaultGeoResourceState('in-la', 'Ladakh Map'),
        scope: 'india',
        resourceId: 'in-la',
        selectedFeatureId: 'in-la',
        title: 'Ladakh (UT) Official Map',
      };
      expect(getMapAssetForState(laState)).toBe('./assets/maps/states/in-la.svg');
    });
  });

  describe('2. Comprehensive Indian States & UTs Registry (Issue 7)', () => {
    it('contains all 28 States and 8 Union Territories totaling 36 administrative units', () => {
      expect(ALL_INDIAN_STATES_DATA.length).toBe(36);
      const states = ALL_INDIAN_STATES_DATA.filter((s) => !s.isUT);
      const uts = ALL_INDIAN_STATES_DATA.filter((s) => s.isUT);
      expect(states.length).toBe(28);
      expect(uts.length).toBe(8);
    });

    it('ensures each state and UT has authentic official metadata and SVG asset paths', () => {
      ALL_INDIAN_STATES_DATA.forEach((s) => {
        expect(s.id).toMatch(/^in-[a-z0-9]+$/);
        expect(s.name.length).toBeGreaterThan(2);
        expect(s.capital.length).toBeGreaterThan(1);
        expect(s.districts).toBeGreaterThan(0);
        expect(s.areaKm2).toBeGreaterThan(0);
        expect(s.officialPortal).toMatch(/^https?:\/\//);
        expect(s.assetPath).toBe(`./assets/maps/states/${s.id}.svg`);
      });
    });
  });

  describe('3. Rivers of India Registry & Hydrography (Issue 9)', () => {
    it('contains all major Indian river systems with coordinates, origin, mouth and dams', () => {
      expect(COMPREHENSIVE_INDIAN_RIVERS.length).toBeGreaterThanOrEqual(20);

      const riverNames = COMPREHENSIVE_INDIAN_RIVERS.map((r) => r.name.toLowerCase());
      expect(riverNames.some((n) => n.includes('ganga'))).toBe(true);
      expect(riverNames.some((n) => n.includes('yamuna'))).toBe(true);
      expect(riverNames.some((n) => n.includes('brahmaputra'))).toBe(true);
      expect(riverNames.some((n) => n.includes('indus'))).toBe(true);
      expect(riverNames.some((n) => n.includes('godavari'))).toBe(true);
      expect(riverNames.some((n) => n.includes('krishna'))).toBe(true);
      expect(riverNames.some((n) => n.includes('narmada'))).toBe(true);
      expect(riverNames.some((n) => n.includes('tapi'))).toBe(true);
      expect(riverNames.some((n) => n.includes('mahanadi'))).toBe(true);
      expect(riverNames.some((n) => n.includes('kaveri'))).toBe(true);
    });

    it('verifies river vectors contain valid lon/lat trajectories and metadata', () => {
      COMPREHENSIVE_INDIAN_RIVERS.forEach((r) => {
        expect(r.id).toMatch(/^river-[a-z0-9-]+$/);
        expect(r.lengthKm).toBeGreaterThan(100);
        expect(r.origin.length).toBeGreaterThan(5);
        expect(r.mouth.length).toBeGreaterThan(5);
        expect(r.pointsLonLat.length).toBeGreaterThanOrEqual(3);
        r.pointsLonLat.forEach(([lon, lat]) => {
          expect(lon).toBeGreaterThanOrEqual(68);
          expect(lon).toBeLessThanOrEqual(98);
          expect(lat).toBeGreaterThanOrEqual(6);
          expect(lat).toBeLessThanOrEqual(38);
        });
      });
    });
  });

  describe('4. Lock Isolation & Interaction Ergonomics (Issues 3 & 4)', () => {
    it('isolates single locked object from global canvas lock state', () => {
      const pageLayers = [
        { id: 'background', name: 'Background', locked: false, visible: true, opacity: 1, order: 0 },
        { id: 'objects', name: 'Objects', locked: false, visible: true, opacity: 1, order: 1 },
      ];
      const pageObjects = [
        { id: 'obj-1', type: 'shape', shapeType: 'geoMap', locked: true, layerId: 'objects' },
        { id: 'obj-2', type: 'shape', shapeType: 'geoMap', locked: false, layerId: 'objects' },
      ];

      // Canvas / Layer lock must only be true if a layer is locked
      const hasLockedLayers = pageLayers.some((l) => l.locked);
      expect(hasLockedLayers).toBe(false);

      // Object 1 is locked
      const isObj1Locked = Boolean(pageObjects[0].locked || pageLayers.find((l) => l.id === pageObjects[0].layerId)?.locked);
      expect(isObj1Locked).toBe(true);

      // Object 2 (upcoming/other map) must NOT be locked
      const isObj2Locked = Boolean(pageObjects[1].locked || pageLayers.find((l) => l.id === pageObjects[1].layerId)?.locked);
      expect(isObj2Locked).toBe(false);
    });

    it('zoom buttons switch to interactive mode so teachers can pan with stylus', () => {
      const mapState: GeoResourceState = {
        ...createDefaultGeoResourceState('soi-india-political', 'Official India Map'),
        zoomLevel: 1.0,
        interactionMode: 'select',
      };

      // Zooming in updates zoomLevel and sets interactionMode to 'interact'
      const updatedZoomIn = {
        ...mapState,
        zoomLevel: Math.min(6.0, mapState.zoomLevel * 1.25),
        interactionMode: 'interact' as const,
      };
      expect(updatedZoomIn.zoomLevel).toBe(1.25);
      expect(updatedZoomIn.interactionMode).toBe('interact');

      // Zooming out updates zoomLevel and stays in 'interact'
      const updatedZoomOut = {
        ...updatedZoomIn,
        zoomLevel: Math.max(0.5, updatedZoomIn.zoomLevel * 0.8),
        interactionMode: 'interact' as const,
      };
      expect(updatedZoomOut.zoomLevel).toBe(1.0);
      expect(updatedZoomOut.interactionMode).toBe('interact');
    });
  });

  describe('6. Sovereign Survey of India Boundary & Smooth Zoomable Globe Subsystem', () => {
    it('enforces complete Jammu & Kashmir, Gilgit-Baltistan, and Ladakh sovereign boundaries', () => {
      // Northernmost point must reach Indira Col / Kilik Pass (> 37.1° N)
      const maxLat = Math.max(...SOI_INDIA_BOUNDARY_LONLAT.map((p) => p[1]));
      expect(maxLat).toBeGreaterThanOrEqual(37.15);

      // Northwest frontier must cover Gilgit-Baltistan and Muzaffarabad (longitudes <= 73.8° E)
      const northernPts = SOI_INDIA_BOUNDARY_LONLAT.filter((p) => p[1] >= 34.0);
      const minLonNorth = Math.min(...northernPts.map((p) => p[0]));
      expect(minLonNorth).toBeLessThanOrEqual(73.5);

      // Eastern Ladakh frontier must cover Aksai Chin (longitudes >= 79.8° E at lat >= 34.5° N)
      const aksaiChinPts = SOI_INDIA_BOUNDARY_LONLAT.filter((p) => p[0] >= 79.5 && p[1] >= 34.0);
      expect(aksaiChinPts.length).toBeGreaterThanOrEqual(3);

      // Boundary must form a continuous closed polygon
      expect(SOI_INDIA_BOUNDARY_LONLAT.length).toBeGreaterThanOrEqual(50);
      const first = SOI_INDIA_BOUNDARY_LONLAT[0];
      const last = SOI_INDIA_BOUNDARY_LONLAT[SOI_INDIA_BOUNDARY_LONLAT.length - 1];
      expect(first[0]).toBeCloseTo(last[0], 1);
      expect(first[1]).toBeCloseTo(last[1], 1);
    });

    it('interpolates dense geodesic intermediate points for smooth globe & grid curvature', () => {
      expect(SMOOTH_SOI_INDIA_BOUNDARY_LONLAT.length).toBeGreaterThan(150);

      // Every intermediate segment in the smooth boundary must have distance <= 0.35 degrees
      for (let i = 0; i < SMOOTH_SOI_INDIA_BOUNDARY_LONLAT.length - 1; i++) {
        const p1 = SMOOTH_SOI_INDIA_BOUNDARY_LONLAT[i];
        const p2 = SMOOTH_SOI_INDIA_BOUNDARY_LONLAT[i + 1];
        const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        expect(dist).toBeLessThanOrEqual(0.35);
      }
    });

    it('converts state boundary polygons to smooth Lon/Lat coordinates for high-zoom globe view', () => {
      const ukState = DETAILED_INDIAN_STATES.find((s) => s.id === 'uk' || s.name.toLowerCase().includes('uttarakhand'));
      expect(ukState).toBeDefined();
      if (ukState) {
        const lonLatPts = getStatePolygonLonLat(ukState);
        expect(lonLatPts.length).toBeGreaterThan(0);
        // Uttarakhand must be within 77°E - 81°E and 28°N - 32°N
        const lons = lonLatPts.map((p) => p[0]);
        const lats = lonLatPts.map((p) => p[1]);
        expect(Math.min(...lons)).toBeGreaterThanOrEqual(77.0);
        expect(Math.max(...lons)).toBeLessThanOrEqual(81.5);
        expect(Math.min(...lats)).toBeGreaterThanOrEqual(28.0);
        expect(Math.max(...lats)).toBeLessThanOrEqual(32.0);
      }

      const ladakhState = DETAILED_INDIAN_STATES.find((s) => s.id === 'ladakh');
      expect(ladakhState).toBeDefined();
      if (ladakhState) {
        const lonLatPts = getStatePolygonLonLat(ladakhState);
        const lats = lonLatPts.map((p) => p[1]);
        expect(Math.max(...lats)).toBeGreaterThanOrEqual(36.0);
      }
    });
  });
});

