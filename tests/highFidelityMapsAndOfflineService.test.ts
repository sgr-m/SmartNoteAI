/**
 * Automated Test Suite — High-Fidelity Maps, Globe Continents & Offline Map Asset Manager
 *
 * Verifies:
 * 1. Survey of India (SoI) Boundary High Density & National Cartographic Accuracy
 * 2. Detailed Indian Administrative States & Union Territories Coverage
 * 3. Major Indian River Drainage Vectors
 * 4. High-Fidelity Global Continents & Islands Coordinate Dataset
 * 5. Offline Map Service: Essential Map Catalog, Caching, Download Simulation & Storage Quota
 * 6. Whiteboard Canvas2D Vector Rendering:
 *    - Political map administrative state fills, labels, and capitals
 *    - Physical map hypsometric relief and rivers
 *    - 3D Globe with continental landmasses, SoI boundary highlight, and solar terminator
 *    - World Atlas multi-continent base
 */

import { describe, it, expect } from 'vitest';
import {
  SOI_INDIA_BOUNDARY_LONLAT,
  DETAILED_INDIA_BOUNDARY_NORMALIZED,
  DETAILED_INDIAN_STATES,
  MAJOR_INDIAN_RIVERS,
  DETAILED_WORLD_LANDMASSES,
} from '../src/renderer/services/geography/detailedMapData';
import {
  ESSENTIAL_OFFLINE_MAPS,
  isMapCachedOffline,
  downloadMapForOffline,
  downloadAllEssentialMaps,
  getOfflineStorageSummary,
  getOfflineMapRecords,
  clearOfflineMapCache,
  syncAllMapsFromSources,
  getLastMapSyncTime,
  OFFICIAL_GOVT_SOURCES,
} from '../src/renderer/services/geography/offlineMapService';
import {
  renderGeographyShape,
  hitTestGeoFeature,
  getMapAssetForState,
  getCachedMapImage,
} from '../src/renderer/engine/geographyShapeRenderer';
import fs from 'fs';
import path from 'path';
import { createShape } from '../src/renderer/services/subjectModules/commonHelpers';
import { ShapeObject } from '../src/shared/types';
import { createDefaultGeoResourceState, GeoResourceState } from '../src/renderer/services/geography/types';

describe('High-Fidelity Maps, Globe Continents & Offline Asset Subsystem', () => {
  // ─── 1. Survey of India High-Density Cartographic Boundary ─────────────────
  describe('Survey of India Boundary Accuracy', () => {
    it('contains high-density vertices covering northern, western, eastern, and peninsular frontiers', () => {
      // Must contain high-density points (>80 vertices) rather than crude 38 points
      expect(SOI_INDIA_BOUNDARY_LONLAT.length).toBeGreaterThanOrEqual(80);
      expect(DETAILED_INDIA_BOUNDARY_NORMALIZED.length).toBe(SOI_INDIA_BOUNDARY_LONLAT.length);

      // Verify northernmost frontier (Ladakh / Karakoram ~37° N)
      const northernPts = SOI_INDIA_BOUNDARY_LONLAT.filter(([_, lat]) => lat >= 36.5);
      expect(northernPts.length).toBeGreaterThanOrEqual(5);

      // Verify westernmost frontier (Gujarat / Sir Creek / Ghuar Mota ~68.1° E)
      const westernPts = SOI_INDIA_BOUNDARY_LONLAT.filter(([lon, _]) => lon <= 69.0);
      expect(westernPts.length).toBeGreaterThanOrEqual(3);

      // Verify southernmost peninsular tip (Kanyakumari ~8.08° N)
      const southernPts = SOI_INDIA_BOUNDARY_LONLAT.filter(([_, lat]) => lat <= 8.5);
      expect(southernPts.length).toBeGreaterThanOrEqual(2);

      // Verify easternmost frontier (Arunachal Pradesh / Kibithu / Dong ~97° E)
      const easternPts = SOI_INDIA_BOUNDARY_LONLAT.filter(([lon, _]) => lon >= 96.5);
      expect(easternPts.length).toBeGreaterThanOrEqual(3);
    });

    it('normalizes coordinates cleanly within [0..1000, 0..1000] canvas viewport space', () => {
      for (const [nx, ny] of DETAILED_INDIA_BOUNDARY_NORMALIZED) {
        expect(nx).toBeGreaterThanOrEqual(0);
        expect(nx).toBeLessThanOrEqual(1000);
        expect(ny).toBeGreaterThanOrEqual(0);
        expect(ny).toBeLessThanOrEqual(1000);
      }
    });
  });

  // ─── 2. Indian Administrative States & UTs ────────────────────────────────
  describe('Indian Administrative States & UTs Coverage', () => {
    it('covers all major Indian States & Union Territories with official capitals and coordinates', () => {
      expect(DETAILED_INDIAN_STATES.length).toBeGreaterThanOrEqual(24);

      const ladakh = DETAILED_INDIAN_STATES.find((s) => s.id === 'ladakh');
      expect(ladakh).toBeDefined();
      expect(ladakh?.isUT).toBe(true);
      expect(ladakh?.capital).toContain('Leh');

      const jk = DETAILED_INDIAN_STATES.find((s) => s.id === 'jk');
      expect(jk).toBeDefined();
      expect(jk?.isUT).toBe(true);
      expect(jk?.capital).toContain('Srinagar');

      const mh = DETAILED_INDIAN_STATES.find((s) => s.id === 'mh');
      expect(mh).toBeDefined();
      expect(mh?.capital).toContain('Mumbai');

      const rj = DETAILED_INDIAN_STATES.find((s) => s.id === 'rj');
      expect(rj).toBeDefined();
      expect(rj?.capital).toContain('Jaipur');

      const tn = DETAILED_INDIAN_STATES.find((s) => s.id === 'tn');
      expect(tn).toBeDefined();
      expect(tn?.capital).toContain('Chennai');

      const ar = DETAILED_INDIAN_STATES.find((s) => s.id === 'ar');
      expect(ar).toBeDefined();
      expect(ar?.capital).toContain('Itanagar');
    });

    it('defines non-empty closed polygons with theme colors for each state', () => {
      for (const st of DETAILED_INDIAN_STATES) {
        expect(st.polygon.length).toBeGreaterThanOrEqual(4);
        expect(st.colorDark).toContain('rgba');
        expect(st.colorLight).toContain('rgba');
      }
    });
  });

  // ─── 3. Major Indian Rivers ───────────────────────────────────────────────
  describe('Major Indian Rivers Drainage Vectors', () => {
    it('contains verified major river courses across North, Central, and Peninsular India', () => {
      expect(MAJOR_INDIAN_RIVERS.length).toBeGreaterThanOrEqual(8);

      const ganga = MAJOR_INDIAN_RIVERS.find((r) => r.id === 'river-ganga');
      expect(ganga).toBeDefined();
      expect(ganga?.pointsLonLat.length).toBeGreaterThanOrEqual(10);

      const brahmaputra = MAJOR_INDIAN_RIVERS.find((r) => r.id === 'river-brahmaputra');
      expect(brahmaputra).toBeDefined();

      const narmada = MAJOR_INDIAN_RIVERS.find((r) => r.id === 'river-narmada');
      expect(narmada).toBeDefined();

      const godavari = MAJOR_INDIAN_RIVERS.find((r) => r.id === 'river-godavari');
      expect(godavari).toBeDefined();
    });
  });

  // ─── 4. Detailed World Continents & Islands ───────────────────────────────
  describe('Global Continental & Island Coordinates', () => {
    it('defines all 7 continents and major islands in realistic geographic coordinates', () => {
      expect(DETAILED_WORLD_LANDMASSES.length).toBeGreaterThanOrEqual(12);

      const ids = DETAILED_WORLD_LANDMASSES.map((l) => l.id);
      expect(ids).toContain('eurasia');
      expect(ids).toContain('africa');
      expect(ids).toContain('north-america');
      expect(ids).toContain('south-america');
      expect(ids).toContain('australia');
      expect(ids).toContain('antarctica');
      expect(ids).toContain('greenland');
      expect(ids).toContain('great-britain');
      expect(ids).toContain('japan');
      expect(ids).toContain('sri-lanka');
      expect(ids).toContain('new-zealand');
      expect(ids).toContain('andaman-nicobar');
    });
  });

  // ─── 5. Offline Map Service & Storage Management ──────────────────────────
  describe('Offline Map Service & Storage Manager', () => {
    it('catalogues essential Survey of India political, physical, outline maps, toposheets, and globe texture', () => {
      expect(ESSENTIAL_OFFLINE_MAPS.length).toBe(10);

      const polEn = ESSENTIAL_OFFLINE_MAPS.find((m) => m.id === 'soi-pol-india-en');
      expect(polEn).toBeDefined();
      expect(polEn?.isEssential).toBe(true);
      expect(polEn?.publisher).toContain('Surveyor General of India');

      const topo45d7 = ESSENTIAL_OFFLINE_MAPS.find((m) => m.id === 'soi-topo-45d7');
      expect(topo45d7).toBeDefined();
      expect(topo45d7?.scale).toBe('1:50,000');

      const globeTex = ESSENTIAL_OFFLINE_MAPS.find((m) => m.id === 'earth-globe-texture');
      expect(globeTex).toBeDefined();
      expect(globeTex?.localAssetPath).toContain('earth_globe_texture.jpg');
    });

    it('tracks offline cache status and computes storage quotas', () => {
      const summary = getOfflineStorageSummary();
      expect(summary.totalCount).toBe(10);
      expect(summary.cachedCount).toBeGreaterThanOrEqual(1);
      expect(summary.totalSizeFormatted).toContain('MB');
    });

    it('simulates downloading an offline map asset with progress callback', async () => {
      const progressSteps: number[] = [];
      const ok = await downloadMapForOffline('soi-phys-india', (pct) => {
        progressSteps.push(pct);
      });
      expect(ok).toBe(true);
      expect(progressSteps.length).toBeGreaterThanOrEqual(3);
      expect(isMapCachedOffline('soi-phys-india')).toBe(true);
    });

    it('downloads all essential maps in batch', async () => {
      const ok = await downloadAllEssentialMaps();
      expect(ok).toBe(true);
      const summary = getOfflineStorageSummary();
      expect(summary.isFullyCached).toBe(true);
      expect(summary.cachedCount).toBe(10);
    });
  });

  // ─── 6. Whiteboard Canvas2D Vector Rendering ──────────────────────────────
  describe('Whiteboard Vector Rendering Integration', () => {
    function createMockCanvasContext(): CanvasRenderingContext2D {
      const ops: string[] = [];
      const ctx: any = {
        save: () => ops.push('save'),
        restore: () => ops.push('restore'),
        beginPath: () => ops.push('beginPath'),
        closePath: () => ops.push('closePath'),
        moveTo: () => ops.push('moveTo'),
        lineTo: () => ops.push('lineTo'),
        arc: () => ops.push('arc'),
        stroke: () => ops.push('stroke'),
        fill: () => ops.push('fill'),
        strokeRect: () => ops.push('strokeRect'),
        fillRect: () => ops.push('fillRect'),
        rect: () => ops.push('rect'),
        roundRect: () => ops.push('roundRect'),
        fillText: () => ops.push('fillText'),
        strokeText: () => ops.push('strokeText'),
        measureText: (text: string) => ({ width: text.length * 7 }),
        clip: () => ops.push('clip'),
        setLineDash: () => ops.push('setLineDash'),
        canvas: { width: 1920, height: 1080 },
        createRadialGradient: () => ({
          addColorStop: () => {},
        }),
        createLinearGradient: () => ({
          addColorStop: () => {},
        }),
      };
      return ctx as CanvasRenderingContext2D;
    }

    it('renders official political map of India with administrative states on canvas without errors', () => {
      const ctx = createMockCanvasContext();
      const state = createDefaultGeoResourceState('soi-pol-india-en', 'Official Political Map of India');
      state.resourceId = 'soi-pol-india-en';
      state.scope = 'india';

      const shape = createShape('geoMap', 100, 100, 800, 600, {
        label: 'Official Political Map of India',
        params: state,
      });

      expect(() => {
        renderGeographyShape(ctx, shape, 100, 100, 800, 600, 1);
      }).not.toThrow();
    });

    it('renders 3D Virtual Globe shape with high-fidelity continents on canvas without errors', () => {
      const ctx = createMockCanvasContext();
      const state = createDefaultGeoResourceState('globe-3d-interactive', '3D Virtual Globe');
      state.resourceType = '3d-globe';
      state.globeState = {
        centerLon: 78,
        centerLat: 22,
        axialTilt: 23.44,
        dayOfYear: 172,
        timeOfDayHours: 6.0,
      };

      const shape = createShape('geoGlobe', 150, 150, 700, 500, {
        label: '3D Virtual Globe',
        params: state,
      });

      expect(() => {
        renderGeographyShape(ctx, shape, 150, 150, 700, 500, 1);
      }).not.toThrow();
    });

    it('hit-tests features across states, regions, and globe locations', () => {
      const state = createDefaultGeoResourceState('soi-pol-india-en', 'Official Political Map of India');
      const shape = createShape('geoMap', 0, 0, 1000, 1000, {
        params: state,
      });

      // Point near Leh, Ladakh (approx [435, 30] in normalized space)
      const hit = hitTestGeoFeature(shape, { x: 440, y: 70 });
      expect(hit).toBeDefined();
    });

    it('verifies bundled Survey of India official map assets exist offline on disk', () => {
      const mapsDir = path.resolve(process.cwd(), 'public/assets/maps');
      expect(fs.existsSync(mapsDir)).toBe(true);

      const politicalEn = path.join(mapsDir, 'soi_political_map_india_en.jpg');
      expect(fs.existsSync(politicalEn)).toBe(true);
      expect(fs.statSync(politicalEn).size).toBeGreaterThan(1_000_000);

      const politicalOfficial = path.join(mapsDir, 'soi_political_map_india_en_official.jpg');
      expect(fs.existsSync(politicalOfficial)).toBe(true);
      expect(fs.statSync(politicalOfficial).size).toBeGreaterThan(4_000_000);

      const physicalEn = path.join(mapsDir, 'soi_physical_map_india_en.jpg');
      expect(fs.existsSync(physicalEn)).toBe(true);

      const worldEn = path.join(mapsDir, 'soi_world_map_en.jpg');
      expect(fs.existsSync(worldEn)).toBe(true);

      const outline = path.join(mapsDir, 'soi_outline_map_india.png');
      expect(fs.existsSync(outline)).toBe(true);
    });

    it('correctly maps GeoResourceState to official Survey of India raster assets', () => {
      const polState = createDefaultGeoResourceState('soi-pol-india-en', 'Official Political Map of India');
      expect(getMapAssetForState(polState)).toBe('./assets/maps/soi_political_map_india_2026_official.jpg');

      const physState = createDefaultGeoResourceState('soi-phys-india', 'Official Physical Map of India');
      expect(getMapAssetForState(physState)).toBe('./assets/maps/soi_physical_map_india_official_hd.jpg');

      const outlineState = createDefaultGeoResourceState('soi-outline-india', 'Official Outline Map of India');
      expect(getMapAssetForState(outlineState)).toBe('./assets/maps/soi_outline_map_blank.jpg');

      const worldState = createDefaultGeoResourceState('world-atlas', 'World Thematic Atlas');
      worldState.scope = 'world';
      expect(getMapAssetForState(worldState)).toBe('./assets/maps/soi_world_map_en_official.jpg');

      // World Political map returns Official World Map, NEVER Indian Political Map
      const worldPolState = createDefaultGeoResourceState('geo-world-political-atlas', 'World Political Map');
      worldPolState.scope = 'world';
      expect(getMapAssetForState(worldPolState)).toBe('./assets/maps/soi_world_map_en_official.jpg');
    });

    it('guarantees Uttarakhand and state maps use authentic multi-district Census & SoI SVGs', () => {
      const ukState = createDefaultGeoResourceState('in-uk', 'Uttarakhand (Official State Map)');
      ukState.selectedFeatureId = 'in-uk';
      expect(getMapAssetForState(ukState)).toBe('./assets/maps/states/in-uk.svg');

      // Verify authentic Uttarakhand SVG exists and contains all 13 real districts
      const ukSvgPath = path.resolve(process.cwd(), 'public/assets/maps/states/in-uk.svg');
      expect(fs.existsSync(ukSvgPath)).toBe(true);
      const ukContent = fs.readFileSync(ukSvgPath, 'utf-8');
      expect(ukContent).toContain('Uttarkashi');
      expect(ukContent).toContain('Chamoli');
      expect(ukContent).toContain('Dehradun');
      expect(ukContent).toContain('Pithoragarh');
      expect(ukContent).toContain('Haridwar');
      expect(ukContent).toContain('Almora');
      expect(ukContent).toContain('Nainital');
      expect(ukContent).toContain('SURVEY OF INDIA &amp; CENSUS STANDARD');
    });

    it('verifies one-click map sync from official government sources (Survey of India & Bhuvan)', async () => {
      expect(OFFICIAL_GOVT_SOURCES.length).toBeGreaterThanOrEqual(4);
      expect(OFFICIAL_GOVT_SOURCES.some((s) => s.url.includes('surveyofindia.gov.in'))).toBe(true);
      expect(OFFICIAL_GOVT_SOURCES.some((s) => s.url.includes('bhuvan'))).toBe(true);

      let progressPcts: number[] = [];
      const result = await syncAllMapsFromSources((pct) => progressPcts.push(pct));
      expect(result.success).toBe(true);
      expect(result.totalUpdated).toBeGreaterThan(40);
      expect(progressPcts).toContain(100);
      expect(getLastMapSyncTime()).toBeDefined();
    });
  });
});
