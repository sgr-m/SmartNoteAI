/**
 * Geodesic Great-Circle Service
 * Stage 3: High-precision spherical distance, bearing, and waypoint calculation
 *
 * Implements the standard Haversine formula on the IUGG mean Earth sphere (R = 6371.0088 km).
 * Used for classroom geodesic measurements across India and the World Atlas.
 */

const EARTH_RADIUS_KM = 6371.0088;
const KM_TO_MILES = 0.621371192;
const KM_TO_NAUTICAL_MILES = 0.539956803;

export type GeoPointInput =
  | [number, number] // [lon, lat]
  | { lat: number; lon: number; label?: string };

export interface GeodesicWaypoint extends Array<number> {
  0: number; // lon
  1: number; // lat
  lon: number;
  lat: number;
}

export interface GeodesicResult {
  distanceKm: number;
  distanceMiles: number;
  distanceNauticalMiles: number;
  initialBearingDegrees: number;
  bearingDegrees: number;
  compassHeading: string;
  waypoints: GeodesicWaypoint[];
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function parsePoint(pt: GeoPointInput): [number, number] {
  if (Array.isArray(pt)) {
    return [pt[0], pt[1]];
  }
  return [pt.lon, pt.lat];
}

function makeWaypoint(lon: number, lat: number): GeodesicWaypoint {
  const wp: any = [lon, lat];
  wp.lon = lon;
  wp.lat = lat;
  return wp as GeodesicWaypoint;
}

/**
 * Converts a bearing in degrees (0..360) into standard 16-wind compass directions
 */
export function getCompassHeading(bearing: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const normalized = (bearing % 360 + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Calculates Great-Circle distance using Haversine formula
 * @param start [lon, lat] or { lat, lon } in decimal degrees
 * @param end [lon, lat] or { lat, lon } in decimal degrees
 * @param waypointCount Number of intermediate points for drawing geodesic arc (default 24)
 */
export function calculateGreatCircleDistance(
  start: GeoPointInput,
  end: GeoPointInput,
  waypointCount = 24
): GeodesicResult {
  const [lon1, lat1] = parsePoint(start);
  const [lon2, lat2] = parsePoint(end);

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  const distanceKm = Math.round(EARTH_RADIUS_KM * c * 100) / 100;
  const distanceMiles = Math.round(distanceKm * KM_TO_MILES * 100) / 100;
  const distanceNauticalMiles = Math.round(distanceKm * KM_TO_NAUTICAL_MILES * 100) / 100;

  // Initial Bearing (forward azimuth)
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const rawBearing = toDegrees(Math.atan2(y, x));
  const initialBearingDegrees = Math.round(((rawBearing + 360) % 360) * 10) / 10;
  const compassHeading = getCompassHeading(initialBearingDegrees);

  // Generate intermediate waypoints using spherical slerp along great circle
  const waypoints: GeodesicWaypoint[] = [];
  if (c > 0.0001 && waypointCount > 1) {
    for (let i = 0; i <= waypointCount; i++) {
      const f = i / waypointCount;
      const A = Math.sin((1 - f) * c) / Math.sin(c);
      const B = Math.sin(f * c) / Math.sin(c);
      const px = A * Math.cos(phi1) * Math.cos(toRadians(lon1)) + B * Math.cos(phi2) * Math.cos(toRadians(lon2));
      const py = A * Math.cos(phi1) * Math.sin(toRadians(lon1)) + B * Math.cos(phi2) * Math.sin(toRadians(lon2));
      const pz = A * Math.sin(phi1) + B * Math.sin(phi2);
      const latW = toDegrees(Math.atan2(pz, Math.sqrt(px * px + py * py)));
      const lonW = lon1 + f * (lon2 - lon1); // Direct intermediate lon interpolation for 2D maps
      waypoints.push(makeWaypoint(Math.round(lonW * 1000) / 1000, Math.round(latW * 1000) / 1000));
    }
  } else {
    waypoints.push(makeWaypoint(lon1, lat1), makeWaypoint(lon2, lat2));
  }

  return {
    distanceKm,
    distanceMiles,
    distanceNauticalMiles,
    initialBearingDegrees,
    bearingDegrees: initialBearingDegrees,
    compassHeading,
    waypoints,
  };
}
