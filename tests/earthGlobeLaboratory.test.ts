/**
 * Automated Test Suite — STAGE 6: Interactive 3D Earth & Globe Laboratory
 *
 * Verifies:
 * 1. Planetary constants & geodesy calculations (axial tilt, radius, IST meridian)
 * 2. Spherical orthographic projection & inverse unprojection mathematics
 * 3. Solar declination & subsolar point calculations (Solstices & Equinoxes)
 * 4. Great-circle solar terminator generator & daylight zenith angle engine
 * 5. Polar day (Midnight Sun) & polar night geometry
 * 6. Local solar time & time zone calculation (IST 82.5°E = UTC+5:30)
 * 7. Earth science curriculum presets & pedagogical explanations
 * 8. 45+ world & Indian geographic landmarks catalog & search
 * 9. Pure Canvas2D shape renderer integration (`geoGlobe` & `3d-globe`)
 * 10. Whiteboard object persistence & serialization roundtrip
 */

import { describe, it, expect, vi } from 'vitest';
import {
  EARTH_CONSTANTS,
  EARTH_SCIENCE_PRESETS,
  GLOBE_LOCATIONS,
  projectOrthographic,
  unprojectOrthographic,
  calculateSolarDeclination,
  calculateSubsolarPoint,
  generateSolarTerminatorPoints,
  isPointInDaylight,
  getPolarIlluminationStatus,
  calculateLocalSolarTime,
  searchGlobeLocations,
} from '../src/renderer/services/geography/globeService';
import { ShapeObject } from '../src/shared/types';
import { renderGeographyShape, hitTestGeoFeature } from '../src/renderer/engine/geographyShapeRenderer';
import { createDefaultGeoResourceState, GeoResourceState } from '../src/renderer/services/geography/types';

describe('Stage 6: Interactive 3D Earth & Globe Laboratory', () => {
  // ─── 1. Planetary Constants & Geodesy ──────────────────────────────────────
  describe('Planetary Constants & Geodesy (Section 1)', () => {
    it('defines authoritative astronomical and geodetic constants', () => {
      expect(EARTH_CONSTANTS.AXIAL_TILT_DEGREES).toBeCloseTo(23.44, 2);
      expect(EARTH_CONSTANTS.RADIUS_KM).toBe(6371);
      expect(EARTH_CONSTANTS.EQUATORIAL_CIRCUMFERENCE_KM).toBe(40075);
      expect(EARTH_CONSTANTS.TROPICAL_YEAR_DAYS).toBeCloseTo(365.2422, 3);
      expect(EARTH_CONSTANTS.SIDEREAL_DAY_HOURS).toBeCloseTo(23.9344, 3);
      expect(EARTH_CONSTANTS.IST_MERIDIAN_LON).toBe(82.5);
      expect(EARTH_CONSTANTS.IST_UTC_OFFSET_HOURS).toBe(5.5);
    });
  });

  // ─── 2. Spherical Orthographic Projection Math ────────────────────────────
  describe('Spherical Orthographic Projection & Inverse (Section 2)', () => {
    const centerLon = 78.96; // Center India
    const centerLat = 20.59;
    const radius = 200;

    it('projects the center coordinates exactly to the origin (0, 0)', () => {
      const proj = projectOrthographic(centerLon, centerLat, centerLon, centerLat, radius);
      expect(proj.visible).toBe(true);
      expect(proj.x).toBeCloseTo(0, 1);
      expect(proj.y).toBeCloseTo(0, 1);
    });

    it('culls points on the opposite hemisphere (backface clipping)', () => {
      // Antipode of India (centerLon - 180, -centerLat)
      const antiLon = centerLon - 180;
      const antiLat = -centerLat;
      const proj = projectOrthographic(antiLon, antiLat, centerLon, centerLat, radius);
      expect(proj.visible).toBe(false);
    });

    it('projects points near the horizon onto the circle rim with distance ~= radius', () => {
      // 90 degrees longitude east of center along equator
      const horizLon = centerLon + 89.9;
      const proj = projectOrthographic(horizLon, centerLat, centerLon, centerLat, radius);
      expect(proj.visible).toBe(true);
      const dist = Math.hypot(proj.x, proj.y);
      expect(dist).toBeLessThanOrEqual(radius + 1);
      expect(dist).toBeGreaterThan(radius * 0.98);
    });

    it('accurately unprojects screen coordinates back into geographic latitude and longitude', () => {
      // Screen origin should unproject back to [centerLon, centerLat]
      const unproj = unprojectOrthographic(0, 0, centerLon, centerLat, radius);
      expect(unproj).not.toBeNull();
      expect(unproj![0]).toBeCloseTo(centerLon, 2);
      expect(unproj![1]).toBeCloseTo(centerLat, 2);
    });

    it('returns null when unprojecting points outside the globe disk boundary', () => {
      const outside = unprojectOrthographic(radius + 20, radius + 20, centerLon, centerLat, radius);
      expect(outside).toBeNull();
    });

    it('performs accurate round-trip project-then-unproject mapping for visible points', () => {
      const testLocations = [
        { lon: 77.2090, lat: 28.6139 }, // New Delhi
        { lon: 88.3639, lat: 22.5726 }, // Kolkata
        { lon: 72.8777, lat: 19.0760 }, // Mumbai
      ];

      for (const loc of testLocations) {
        const proj = projectOrthographic(loc.lon, loc.lat, centerLon, centerLat, radius);
        expect(proj.visible).toBe(true);
        const unproj = unprojectOrthographic(proj.x, proj.y, centerLon, centerLat, radius);
        expect(unproj).not.toBeNull();
        expect(unproj![0]).toBeCloseTo(loc.lon, 1);
        expect(unproj![1]).toBeCloseTo(loc.lat, 1);
      }
    });
  });

  // ─── 3. Solar Declination & Subsolar Point ─────────────────────────────────
  describe('Solar Declination & Subsolar Point (Section 3)', () => {
    it('accurately computes solar declination across solstices and equinoxes', () => {
      // Day 80: Vernal Equinox (~March 21) -> ~0 deg
      const decEquinox1 = calculateSolarDeclination(80);
      expect(Math.abs(decEquinox1)).toBeLessThan(1.5);

      // Day 172: Summer Solstice (~June 21) -> ~+23.44 deg (Tropic of Cancer)
      const decSummer = calculateSolarDeclination(172);
      expect(decSummer).toBeGreaterThan(23.0);
      expect(decSummer).toBeLessThanOrEqual(23.5);

      // Day 266: Autumnal Equinox (~Sept 23) -> ~0 deg
      const decEquinox2 = calculateSolarDeclination(266);
      expect(Math.abs(decEquinox2)).toBeLessThan(1.5);

      // Day 355: Winter Solstice (~Dec 21) -> ~-23.44 deg (Tropic of Capricorn)
      const decWinter = calculateSolarDeclination(355);
      expect(decWinter).toBeLessThan(-23.0);
      expect(decWinter).toBeGreaterThanOrEqual(-23.5);
    });

    it('calculates the subsolar longitude from UTC hours', () => {
      // At UTC 12:00, subsolar point is at lon ~0 deg (Greenwich)
      const pt12 = calculateSubsolarPoint(172, 12);
      expect(pt12.lon).toBeCloseTo(0, 1);
      expect(pt12.lat).toBeCloseTo(23.44, 1);

      // At UTC 06:00, subsolar point is at lon +90 deg East (Indian Ocean)
      const pt06 = calculateSubsolarPoint(172, 6);
      expect(pt06.lon).toBeCloseTo(90, 1);

      // At UTC 18:00, subsolar point is at lon -90 deg West (Americas)
      const pt18 = calculateSubsolarPoint(172, 18);
      expect(pt18.lon).toBeCloseTo(-90, 1);
    });
  });

  // ─── 4. Great-Circle Solar Terminator & Daylight Testing ─────────────────
  describe('Solar Terminator & Daylight Detection (Section 4)', () => {
    it('correctly determines that the subsolar point is in daylight and its antipode is in night', () => {
      const subsolar = {
        lon: 77.2,
        lat: 23.44,
        dayOfYear: 172,
        utcHours: 6.8,
        declinationDegrees: 23.44,
      };
      expect(isPointInDaylight(subsolar.lon, subsolar.lat, subsolar)).toBe(true);

      // Antipode
      const antiLon = subsolar.lon > 0 ? subsolar.lon - 180 : subsolar.lon + 180;
      const antiLat = -subsolar.lat;
      expect(isPointInDaylight(antiLon, antiLat, subsolar)).toBe(false);
    });

    it('generates a closed 64-segment Great Circle for the solar terminator', () => {
      const subsolar = {
        lon: 0,
        lat: 0,
        dayOfYear: 80,
        utcHours: 12,
        declinationDegrees: 0,
      };
      const terminator = generateSolarTerminatorPoints(subsolar, 64);
      expect(terminator.length).toBe(65); // Closed loop (n + 1)

      // First and last coordinates match: [lon, lat]
      expect(terminator[0][0]).toBeCloseTo(terminator[terminator.length - 1][0], 2);
      expect(terminator[0][1]).toBeCloseTo(terminator[terminator.length - 1][1], 2);

      // For an equatorial subsolar point (0, 0), the terminator passes through the poles
      const hasPolarPass = terminator.some((pt) => Math.abs(pt[1]) > 80);
      expect(hasPolarPass).toBe(true);
    });
  });

  // ─── 5. Polar Day and Polar Night Geometry ────────────────────────────────
  describe('Polar Day and Polar Night Status (Section 5)', () => {
    it('identifies 24-hour Midnight Sun (Polar Day) at high Arctic latitudes during northern summer', () => {
      // June 21 (Day 172)
      const northPoleStatus = getPolarIlluminationStatus(85, 172);
      expect(northPoleStatus).toBe('midnight-sun');

      const southPoleStatus = getPolarIlluminationStatus(-85, 172);
      expect(southPoleStatus).toBe('polar-night');
    });

    it('identifies 24-hour Polar Night at Arctic latitudes during northern winter', () => {
      // Dec 21 (Day 355)
      const northPoleStatus = getPolarIlluminationStatus(85, 355);
      expect(northPoleStatus).toBe('polar-night');

      const southPoleStatus = getPolarIlluminationStatus(-85, 355);
      expect(southPoleStatus).toBe('midnight-sun');
    });

    it('identifies normal diurnal day/night cycles in temperate and tropical zones', () => {
      // New Delhi (~28.6° N) has daily sunrise and sunset throughout the year
      expect(getPolarIlluminationStatus(28.6, 172)).toBe('normal');
      expect(getPolarIlluminationStatus(28.6, 355)).toBe('normal');
      expect(getPolarIlluminationStatus(0, 172)).toBe('normal');
    });
  });

  // ─── 6. Local Solar Time & Time Zones ─────────────────────────────────────
  describe('Local Solar Time & Time Zones (Section 6)', () => {
    it('calculates exact local solar time and confirms 15 degrees equals 1 hour', () => {
      // Greenwich at UTC 12:00
      const greenwich = calculateLocalSolarTime(0, 12, 51.48);
      expect(greenwich.localMeanHours).toBe(12);
      expect(greenwich.localTimeFormatted.startsWith('12:00')).toBe(true);
      expect(greenwich.utcOffsetFormatted).toBe('UTC+00:00');

      // 15 degrees East at UTC 12:00 should be 13:00 (+1 hour)
      const east15 = calculateLocalSolarTime(15, 12, 0);
      expect(east15.localMeanHours).toBe(13);
      expect(east15.utcOffsetFormatted).toBe('UTC+01:00');

      // 15 degrees West at UTC 12:00 should be 11:00 (-1 hour)
      const west15 = calculateLocalSolarTime(-15, 12, 0);
      expect(west15.localMeanHours).toBe(11);
      expect(west15.utcOffsetFormatted).toBe('UTC-01:00');
    });

    it('accurately verifies Indian Standard Time (IST) at 82.5° E meridian as UTC +05:30', () => {
      // When UTC is 00:00, Mirzapur/IST meridian (82.5° E) is 05:30
      const ist00 = calculateLocalSolarTime(82.5, 0, 25.15);
      expect(ist00.localMeanHours).toBeCloseTo(5.5, 2);
      expect(ist00.localTimeFormatted.startsWith('05:30')).toBe(true);
      expect(ist00.utcOffsetFormatted).toBe('UTC+05:30');
      expect(ist00.timeDifferenceISTHours).toBe(0);

      // When UTC is 06:30, IST is 12:00 (Local Solar Noon)
      const istNoon = calculateLocalSolarTime(82.5, 6.5, 25.15);
      expect(istNoon.localMeanHours).toBeCloseTo(12.0, 2);
      expect(istNoon.localTimeFormatted.startsWith('12:00')).toBe(true);
    });
  });

  // ─── 7. Educational Science Presets ───────────────────────────────────────
  describe('Earth Science Presets & Curriculum Modules (Section 7)', () => {
    it('defines essential NCERT/CBSE curriculum presets', () => {
      expect(EARTH_SCIENCE_PRESETS.length).toBeGreaterThanOrEqual(6);

      const summer = EARTH_SCIENCE_PRESETS.find((p) => p.id === 'summer-solstice');
      expect(summer).toBeDefined();
      expect(summer!.name).toContain('Summer Solstice');
      expect(summer!.dayOfYear).toBe(172);
      expect(summer!.pedagogicalExplanation.length).toBeGreaterThan(50);
      expect(summer!.cbseIcseFocus.length).toBeGreaterThan(10);

      const winter = EARTH_SCIENCE_PRESETS.find((p) => p.id === 'winter-solstice');
      expect(winter).toBeDefined();
      expect(winter!.dayOfYear).toBe(356);

      const vernal = EARTH_SCIENCE_PRESETS.find((p) => p.id === 'vernal-equinox');
      expect(vernal).toBeDefined();
      expect(vernal!.dayOfYear).toBe(80);

      const diurnal = EARTH_SCIENCE_PRESETS.find((p) => p.id === 'earth-rotation-demo');
      expect(diurnal).toBeDefined();
      expect(diurnal!.pedagogicalExplanation).toContain('Coriolis');

      const timezones = EARTH_SCIENCE_PRESETS.find((p) => p.id === 'time-zones-demo');
      expect(timezones).toBeDefined();
      expect(timezones!.pedagogicalExplanation).toContain('82°30\' E');
    });
  });

  // ─── 8. World & Indian Landmark Catalog & Search ──────────────────────────
  describe('Landmarks Catalog & Search (Section 8)', () => {
    it('contains over 45 geographical landmarks with key Indian references', () => {
      expect(GLOBE_LOCATIONS.length).toBeGreaterThanOrEqual(45);

      // Verify Indian landmarks
      const delhi = GLOBE_LOCATIONS.find((l) => l.id === 'loc-new-delhi');
      expect(delhi).toBeDefined();
      expect(delhi!.country).toBe('India');
      expect(delhi!.lat).toBeCloseTo(28.6139, 3);
      expect(delhi!.lon).toBeCloseTo(77.2090, 3);

      const mirzapur = GLOBE_LOCATIONS.find((l) => l.id === 'loc-mirzapur-ist');
      expect(mirzapur).toBeDefined();
      expect(mirzapur!.lon).toBeCloseTo(82.5, 1);
      expect(mirzapur!.description).toContain('Standard Meridian');

      const k2 = GLOBE_LOCATIONS.find((l) => l.id === 'loc-k2-godwin-austen');
      expect(k2).toBeDefined();
      expect(k2!.elevationM).toBe(8611);

      const indiraPoint = GLOBE_LOCATIONS.find((l) => l.id === 'loc-indira-point');
      expect(indiraPoint).toBeDefined();
      expect(indiraPoint!.lat).toBeCloseTo(6.75, 1);

      const everest = GLOBE_LOCATIONS.find((l) => l.id === 'loc-mount-everest');
      expect(everest).toBeDefined();
      expect(everest!.elevationM).toBe(8848.86);
    });

    it('performs fuzzy search across names, countries, categories and descriptions', () => {
      const indiaResults = searchGlobeLocations('India');
      expect(indiaResults.length).toBeGreaterThanOrEqual(15);
      expect(indiaResults.some((l) => l.name.includes('Delhi'))).toBe(true);
      expect(indiaResults.some((l) => l.name.includes('Mirzapur'))).toBe(true);

      const mountainResults = searchGlobeLocations('mountain');
      expect(mountainResults.length).toBeGreaterThan(0);

      const meridianResults = searchGlobeLocations('Greenwich');
      expect(meridianResults.length).toBeGreaterThan(0);
      expect(meridianResults[0].id).toBe('loc-greenwich');
    });
  });

  // ─── 9. Pure Canvas2D Shape Rendering & Hit Testing ────────────────────────
  describe('Pure Canvas2D geoGlobe Shape Renderer (Section 9)', () => {
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
        quadraticCurveTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 60 }),
        createRadialGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
        setLineDash: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    }

    it('renders a 3D Earth globe shape without throwing any exceptions', () => {
      const ctx = createMockCanvasContext();
      const shape: ShapeObject = {
        id: 'test-globe-shape-1',
        type: 'shape',
        shapeType: 'geoGlobe',
        x: 100,
        y: 100,
        width: 600,
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
        label: '3D Virtual Globe',
        params: {
          ...createDefaultGeoResourceState('earth-3d-globe', '3D Virtual Globe'),
          resourceType: '3d-globe',
          globeState: {
            centerLon: 78.96,
            centerLat: 20.59,
            zoom: 1.0,
            axialTilt: 23.44,
            dayOfYear: 172,
            timeOfDayHours: 6.5,
            projectionMode: 'orthographic',
            demoMode: 'summer-solstice',
            animating: false,
            animSpeed: 1,
            layers: {
              graticule: true,
              terminator: true,
              equator: true,
              tropics: true,
              polarCircles: true,
              atmosphere: true,
              cityLights: true,
              countries: true,
              rivers: true,
              mountains: true,
              landmarks: true,
              labels: true,
            },
          },
        },
      };

      expect(() => {
        renderGeographyShape(ctx, shape);
      }).not.toThrow();

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('supports hit testing on the globe spherical disk and landmark features', () => {
      // Shape centered on New Delhi (77.2090, 28.6139)
      const shape: ShapeObject = {
        id: 'test-globe-shape-2',
        type: 'shape',
        shapeType: 'geoGlobe',
        x: 100,
        y: 100,
        width: 600,
        height: 600,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.95)',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        label: 'Interactive 3D Globe',
        params: {
          ...createDefaultGeoResourceState('earth-3d-globe', '3D Globe'),
          resourceType: '3d-globe',
          globeState: {
            centerLon: 77.2090,
            centerLat: 28.6139,
            zoom: 1.0,
            axialTilt: 23.44,
            dayOfYear: 172,
            timeOfDayHours: 12.0,
            projectionMode: 'orthographic',
            demoMode: 'summer-solstice',
            animating: false,
            animSpeed: 1,
            layers: {
              graticule: true,
              terminator: true,
              equator: true,
              tropics: true,
              polarCircles: true,
              atmosphere: true,
              cityLights: true,
              countries: true,
              rivers: true,
              mountains: true,
              landmarks: true,
              labels: true,
            },
          },
        },
      };

      // Center of globe is at (100 + 300, 100 + 300) = (400, 400).
      // Since centerLon/Lat is New Delhi, New Delhi is projected right at the center (400, 400).
      const hitCenter = hitTestGeoFeature(shape, { x: 400, y: 400 });
      expect(hitCenter).toBe('loc-new-delhi');

      // Point far outside should return null
      const hitOutside = hitTestGeoFeature(shape, { x: 9999, y: 9999 });
      expect(hitOutside).toBeNull();
    });
  });

  // ─── 10. Whiteboard Serialization & State Roundtrip ───────────────────────
  describe('Whiteboard Object Serialization & State Persistence (Section 10)', () => {
    it('serializes and deserializes globe camera and earth science state without data loss', () => {
      const delhi = GLOBE_LOCATIONS.find((l) => l.id === 'loc-new-delhi');

      const originalParams: GeoResourceState = {
        ...createDefaultGeoResourceState('earth-3d-globe', '3D Earth Lab'),
        resourceType: '3d-globe',
        globeState: {
          centerLon: 82.5,
          centerLat: 25.15,
          zoom: 1.5,
          axialTilt: 23.44,
          dayOfYear: 355, // Winter Solstice
          timeOfDayHours: 12.0,
          projectionMode: 'orthographic',
          demoMode: 'winter-solstice',
          animating: false,
          animSpeed: 5,
          layers: {
            graticule: true,
            terminator: true,
            equator: true,
            tropics: true,
            polarCircles: true,
            atmosphere: true,
            cityLights: true,
            countries: true,
            rivers: true,
            mountains: true,
            landmarks: true,
            labels: true,
          },
          selectedLocation: delhi,
        },
      };

      const jsonString = JSON.stringify(originalParams);
      const parsedParams = JSON.parse(jsonString) as GeoResourceState;

      expect(parsedParams.resourceType).toBe('3d-globe');
      expect(parsedParams.globeState).toBeDefined();
      expect(parsedParams.globeState!.centerLon).toBe(82.5);
      expect(parsedParams.globeState!.centerLat).toBe(25.15);
      expect(parsedParams.globeState!.zoom).toBe(1.5);
      expect(parsedParams.globeState!.dayOfYear).toBe(355);
      expect(parsedParams.globeState!.demoMode).toBe('winter-solstice');
      expect(parsedParams.globeState!.layers.terminator).toBe(true);
      expect(parsedParams.globeState!.selectedLocation?.name).toBe('New Delhi');
    });
  });
});
