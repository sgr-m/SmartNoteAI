/**
 * 3D Earth and Globe Laboratory Service
 * Stage 6: Spherical Trigonometry, Orthographic 3D Projection,
 * Solar Terminator Engine, Earth Science Demonstrations, Timezones, and Cartographic Layers.
 *
 * Compliance:
 * - Survey of India official boundary delineation and attribution for Indian territory.
 * - Standard WGS84 ellipsoidal / spherical parameters and IAU astronomical models.
 * - Zero external satellite imagery downloads; 100% offline mathematical vectors.
 */

// ─── 1. Astronomical & Planetary Constants ──────────────────────────────────

export const EARTH_CONSTANTS = {
  /** Earth's mean axial tilt (obliquity of the ecliptic) in degrees */
  AXIAL_TILT_DEGREES: 23.439281, // ≈ 23.44°
  /** Tropic of Cancer latitude (North) */
  TROPIC_OF_CANCER: 23.439281,
  /** Tropic of Capricorn latitude (South) */
  TROPIC_OF_CAPRICORN: -23.439281,
  /** Arctic Circle latitude (North) */
  ARCTIC_CIRCLE: 66.560719,
  /** Antarctic Circle latitude (South) */
  ANTARCTIC_CIRCLE: -66.560719,
  /** Mean Earth Radius in kilometres */
  RADIUS_KM: 6371.0,
  /** Equatorial Circumference in kilometres */
  EQUATORIAL_CIRCUMFERENCE_KM: 40075.0,
  /** Sidereal day length in solar hours */
  SIDEREAL_DAY_HOURS: 23.9344696,
  /** Mean tropical year length in days */
  TROPICAL_YEAR_DAYS: 365.2422,
  /** Indian Standard Meridian (82°30' E) */
  IST_MERIDIAN_LON: 82.5,
  /** IST UTC offset in hours (+05:30) */
  IST_UTC_OFFSET_HOURS: 5.5,
};

// ─── 2. Orthographic 3D Spherical Projection ────────────────────────────────

export interface OrthographicPoint {
  x: number;       // Pixel X offset from globe center
  y: number;       // Pixel Y offset from globe center
  visible: boolean;// True if point is on the visible front hemisphere (cos(c) >= 0)
  depth: number;   // Normal depth in [-1..1] (1 = center facing camera, 0 = horizon, -1 = back)
}

/**
 * Project spherical coordinate (lon, lat) to 2D screen coordinate using Orthographic 3D Projection.
 * Camera is centered at (centerLon, centerLat) with sphere radius R.
 */
export function projectOrthographic(
  lon: number,
  lat: number,
  centerLon: number,
  centerLat: number,
  radius: number
): OrthographicPoint {
  const rad = Math.PI / 180;
  const phi = lat * rad;
  const phi0 = centerLat * rad;
  const dLam = (lon - centerLon) * rad;

  // Angular distance from projection center (cos c)
  const cosC = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLam);

  // Point is visible if it is on the forward hemisphere
  const visible = cosC >= -0.02; // Small epsilon for horizon border clipping

  // Orthographic projection formulas
  const x = radius * Math.cos(phi) * Math.sin(dLam);
  const y = -radius * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dLam));

  return { x, y, visible, depth: cosC };
}

/**
 * Inverse Orthographic Projection: Convert 2D screen coordinate (x, y) relative to globe center
 * back to geographic coordinates [longitude, latitude].
 * Returns null if clicked point is outside the sphere circle (x² + y² > R²).
 */
export function unprojectOrthographic(
  screenX: number,
  screenY: number,
  centerLon: number,
  centerLat: number,
  radius: number
): [number, number] | null {
  const rho = Math.hypot(screenX, screenY);
  if (rho > radius) return null; // Outside the globe horizon circle

  const rad = Math.PI / 180;
  const phi0 = centerLat * rad;
  const lam0 = centerLon * rad;

  const c = Math.asin(Math.min(1, rho / radius));
  const sinC = Math.sin(c);
  const cosC = Math.cos(c);

  let latRad = 0;
  let lonRad = 0;

  if (rho === 0) {
    latRad = phi0;
    lonRad = lam0;
  } else {
    latRad = Math.asin(cosC * Math.sin(phi0) + (-screenY * sinC * Math.cos(phi0)) / rho);
    lonRad =
      lam0 +
      Math.atan2(
        screenX * sinC,
        rho * Math.cos(phi0) * cosC - (-screenY) * Math.sin(phi0) * sinC
      );
  }

  const deg = 180 / Math.PI;
  let lon = lonRad * deg;
  let lat = latRad * deg;

  // Normalize lon to [-180..180]
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  lat = Math.max(-90, Math.min(90, lat));

  return [Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000];
}

// ─── 3. Solar Terminator & Astronomical Declination Engine ──────────────────

/**
 * Compute solar declination (delta) in degrees for a given day of the year (1..365).
 * Based on the astronomical Fourier / Cooper model:
 *   delta = -23.44° * cos( (360° / 365.25) * (N + 10) )
 */
export function calculateSolarDeclination(dayOfYear: number): number {
  const n = Math.max(1, Math.min(366, dayOfYear));
  const angleRad = ((360 / 365.2422) * (n + 10) * Math.PI) / 180;
  const declination = -EARTH_CONSTANTS.AXIAL_TILT_DEGREES * Math.cos(angleRad);
  return Math.round(declination * 100) / 100;
}

export interface SubsolarPoint {
  lon: number;
  lat: number;
  dayOfYear: number;
  utcHours: number;
  declinationDegrees: number;
}

/**
 * Compute the instantaneous subsolar point (where the Sun is directly at zenith / 90° overhead).
 */
export function calculateSubsolarPoint(dayOfYear: number, utcHours: number): SubsolarPoint {
  const dec = calculateSolarDeclination(dayOfYear);
  // Greenwich noon occurs at 12:00 UTC (lon = 0°)
  // Earth rotates West to East at 15° per hour
  const subsolarLon = (12 - utcHours) * 15;
  const normLon = ((((subsolarLon + 180) % 360) + 360) % 360) - 180;

  return {
    lon: Math.round(normLon * 100) / 100,
    lat: dec,
    dayOfYear,
    utcHours,
    declinationDegrees: dec,
  };
}

/**
 * Test whether a geographic coordinate is in daytime sunlight or nocturnal darkness.
 * Uses the spherical solar zenith angle condition: cos(zenith) >= 0
 */
export function isPointInDaylight(
  lon: number,
  lat: number,
  subsolarPoint: SubsolarPoint
): boolean {
  const rad = Math.PI / 180;
  const phi = lat * rad;
  const phiS = subsolarPoint.lat * rad;
  const dLam = (lon - subsolarPoint.lon) * rad;

  // cos(zenith angle)
  const cosZenith = Math.sin(phi) * Math.sin(phiS) + Math.cos(phi) * Math.cos(phiS) * Math.cos(dLam);
  return cosZenith >= 0;
}

/**
 * Generate great-circle path points for the Solar Terminator (day/night boundary).
 * The terminator is the great circle 90° away from the subsolar point.
 */
export function generateSolarTerminatorPoints(
  subsolarPoint: SubsolarPoint,
  numPoints: number = 72
): [number, number][] {
  const points: [number, number][] = [];
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const sLat = subsolarPoint.lat * rad;
  const sLon = subsolarPoint.lon * rad;

  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * 2 * Math.PI;

    // Normal vector perpendicular to subsolar axis
    const x0 = Math.cos(theta);
    const y0 = Math.sin(theta);
    const z0 = 0;

    // Rotate to match subsolar latitude and longitude
    const x1 = x0;
    const y1 = y0 * Math.sin(sLat) + z0 * Math.cos(sLat);
    const z1 = -y0 * Math.cos(sLat) + z0 * Math.sin(sLat);

    const x2 = x1 * Math.cos(sLon) - y1 * Math.sin(sLon);
    const y2 = x1 * Math.sin(sLon) + y1 * Math.cos(sLon);
    const z2 = z1;

    const lat = Math.asin(Math.max(-1, Math.min(1, z2))) * deg;
    const lon = Math.atan2(y2, x2) * deg;

    points.push([Math.round(lon * 10) / 10, Math.round(lat * 10) / 10]);
  }

  return points;
}

// ─── 4. Earth Science Demonstrations & Explanations ─────────────────────────

export interface EarthScienceDemoPreset {
  id: string;
  name: string;
  category: 'rotation' | 'revolution' | 'seasons' | 'timezones';
  dayOfYear: number;
  utcHours: number;
  dateString: string;
  solarDeclinationText: string;
  sunOverheadLocation: string;
  pedagogicalExplanation: string;
  cbseIcseFocus: string;
}

export const EARTH_SCIENCE_PRESETS: EarthScienceDemoPreset[] = [
  {
    id: 'summer-solstice',
    name: 'Summer Solstice (Northern Hemisphere)',
    category: 'seasons',
    dayOfYear: 172, // June 21
    utcHours: 6.0,
    dateString: '21 June (Solstice)',
    solarDeclinationText: '+23.44° North',
    sunOverheadLocation: 'Tropic of Cancer (passes through 8 Indian States)',
    pedagogicalExplanation: 'The Northern Hemisphere is tilted at its maximum angle (23.44°) towards the Sun. The Sun is directly overhead at noon at the Tropic of Cancer. This marks the longest day and shortest night in the Northern Hemisphere. The entire region north of the Arctic Circle (66.5° N) experiences 24-hour continuous daylight (Midnight Sun), while the Antarctic Circle experiences 24-hour Polar Night.',
    cbseIcseFocus: 'CBSE Class 6 Motions of the Earth & ICSE Class 9 Rotation & Revolution.',
  },
  {
    id: 'winter-solstice',
    name: 'Winter Solstice (Northern Hemisphere)',
    category: 'seasons',
    dayOfYear: 356, // December 22
    utcHours: 6.0,
    dateString: '22 December (Solstice)',
    solarDeclinationText: '-23.44° South',
    sunOverheadLocation: 'Tropic of Capricorn',
    pedagogicalExplanation: 'The Southern Hemisphere is tilted at its maximum angle towards the Sun, while the Northern Hemisphere is tilted furthest away. The Sun is directly overhead at noon along the Tropic of Capricorn. This marks the shortest day and longest night in India and the Northern Hemisphere. The Arctic Circle experiences 24-hour continuous darkness (Polar Night), while Antarctica experiences Midnight Sun.',
    cbseIcseFocus: 'Contrast of seasons between Australia (Summer) and India (Winter).',
  },
  {
    id: 'vernal-equinox',
    name: 'Vernal / Spring Equinox',
    category: 'seasons',
    dayOfYear: 80, // March 21
    utcHours: 6.0,
    dateString: '21 March (Equinox)',
    solarDeclinationText: '0.00° (Equator)',
    sunOverheadLocation: 'Equator',
    pedagogicalExplanation: 'Neither pole is tilted towards or away from the Sun. The subsolar point lies precisely on the Equator. Day and night are of equal duration (12 hours day, 12 hours night) across the entire globe from pole to pole. The solar terminator coincides perfectly with the meridians of longitude.',
    cbseIcseFocus: 'Origin of the word Equinox (Aequus = Equal, Nox = Night).',
  },
  {
    id: 'autumnal-equinox',
    name: 'Autumnal / Fall Equinox',
    category: 'seasons',
    dayOfYear: 266, // September 23
    utcHours: 6.0,
    dateString: '23 September (Equinox)',
    solarDeclinationText: '0.00° (Equator)',
    sunOverheadLocation: 'Equator',
    pedagogicalExplanation: 'The Sun crosses the celestial equator moving southward. Once again, equal day and night (12 hours each) prevail globally. Marks the onset of autumn in the Northern Hemisphere and spring in the Southern Hemisphere.',
    cbseIcseFocus: 'Equinox geometry and migration of the ITCZ.',
  },
  {
    id: 'earth-rotation-demo',
    name: 'Diurnal Rotation & Day/Night Cycle',
    category: 'rotation',
    dayOfYear: 80,
    utcHours: 12.0,
    dateString: 'Live 24-Hour Cycle',
    solarDeclinationText: 'Varies with Date',
    sunOverheadLocation: 'Migrates 15° Westward every Hour',
    pedagogicalExplanation: 'Earth rotates from West to East (counter-clockwise when viewed from above the North Pole) on its axis once every 24 hours (approx. 1670 km/h at the Equator). This West-to-East rotation causes the apparent East-to-West movement of the Sun, Moon, and stars. It also produces the Coriolis effect, which deflects winds to the right in the Northern Hemisphere and to the left in the Southern Hemisphere (Ferrel\'s Law).',
    cbseIcseFocus: 'Explanation of sunrise earlier in Arunachal Pradesh (Dong) than in Gujarat (Ghuar Mota) by 2 hours.',
  },
  {
    id: 'time-zones-demo',
    name: 'Standard Time & Longitude (IST & Greenwich)',
    category: 'timezones',
    dayOfYear: 80,
    utcHours: 6.5,
    dateString: 'Longitude & Time Lab',
    solarDeclinationText: 'Global Longitudinal Zones',
    sunOverheadLocation: '15° of Longitude = 1 Hour Difference',
    pedagogicalExplanation: 'Because the Earth rotates 360° in 24 hours, it covers 15° of longitude in 1 hour (or 1° in 4 minutes). Places to the east of Greenwich are ahead of UTC, while places to the west are behind. India selected 82°30\' E meridian (passing through Mirzapur, UP) as its Standard Meridian, producing Indian Standard Time (IST = UTC + 05:30). The International Date Line (180° meridian) marks the change of calendar dates.',
    cbseIcseFocus: 'Standard Meridian calculations: 82.5° * 4 min = 330 min = 5 hours 30 minutes ahead of GMT.',
  },
];

// ─── 5. Local Solar Time & Timezone Engine ──────────────────────────────────

export interface LocalTimeResult {
  longitude: number;
  latitude: number;
  utcHours: number;
  localMeanHours: number;
  localTimeFormatted: string;
  utcOffsetFormatted: string;
  timezoneBand: string;
  timeDifferenceISTHours: number;
}

/**
 * Compute local mean solar time and standard timezone band for any longitude.
 */
export function calculateLocalSolarTime(
  lon: number,
  utcHours: number,
  lat: number = 0
): LocalTimeResult {
  // Longitude to hours: 15° = 1 hour, so 1° = 4 minutes (1/15 hour)
  const offsetHours = lon / 15;
  let localHours = (utcHours + offsetHours + 48) % 24;

  const h = Math.floor(localHours);
  const m = Math.floor((localHours - h) * 60);
  const s = Math.floor(((localHours - h) * 60 - m) * 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(h)}:${pad(m)}:${pad(s)}`;

  // UTC offset string
  const absOffset = Math.abs(offsetHours);
  const offH = Math.floor(absOffset);
  const offM = Math.round((absOffset - offH) * 60);
  const sign = offsetHours >= 0 ? '+' : '-';
  const utcOffsetStr = `UTC${sign}${pad(offH)}:${pad(offM)}`;

  // Standard 15° timezone zone (e.g. UTC+5, UTC+6)
  const roundedZone = Math.round(offsetHours);
  const zoneSign = roundedZone >= 0 ? '+' : '';
  const zoneBand = `UTC${zoneSign}${roundedZone}`;

  // Difference from IST (+05:30)
  const diffFromIST = offsetHours - EARTH_CONSTANTS.IST_UTC_OFFSET_HOURS;

  return {
    longitude: lon,
    latitude: lat,
    utcHours,
    localMeanHours: Math.round(localHours * 100) / 100,
    localTimeFormatted: timeStr,
    utcOffsetFormatted: utcOffsetStr,
    timezoneBand: zoneBand,
    timeDifferenceISTHours: Math.round(diffFromIST * 10) / 10,
  };
}

/**
 * Determine polar day / night status for any latitude and day of year.
 */
export function getPolarIlluminationStatus(
  lat: number,
  dayOfYear: number
): 'normal' | 'midnight-sun' | 'polar-night' {
  const dec = calculateSolarDeclination(dayOfYear);
  const absLat = Math.abs(lat);

  // Region must be within polar circle (absLat >= 66.56°)
  if (absLat < EARTH_CONSTANTS.ARCTIC_CIRCLE) {
    return 'normal';
  }

  // Northern Polar region
  if (lat > 0) {
    if (lat + dec >= 90) return 'midnight-sun';
    if (lat - dec >= 90) return 'polar-night';
  } else {
    // Southern Polar region
    if (absLat - dec >= 90) return 'midnight-sun';
    if (absLat + dec >= 90) return 'polar-night';
  }

  return 'normal';
}

// ─── 6. Geographic Features & Locations Catalog ─────────────────────────────

export interface GlobeLocation {
  id: string;
  name: string;
  category: 'capital' | 'mountain' | 'river' | 'ocean' | 'island' | 'landmark';
  country?: string;
  lon: number;
  lat: number;
  elevationM?: number;
  description: string;
  curriculumSignificance: string;
}

export const GLOBE_LOCATIONS: GlobeLocation[] = [
  // India Core Administrative & Geographic Landmarks
  {
    id: 'loc-new-delhi',
    name: 'New Delhi',
    category: 'capital',
    country: 'India',
    lon: 77.2090,
    lat: 28.6139,
    description: 'National Capital of the Republic of India; located on the banks of the Yamuna River.',
    curriculumSignificance: 'Seat of government and central cartographic benchmark for Indian administration.',
  },
  {
    id: 'loc-mirzapur-ist',
    name: 'Mirzapur (IST Standard Meridian)',
    category: 'landmark',
    country: 'India',
    lon: 82.5000,
    lat: 25.1337,
    description: 'Reference location through which the 82°30\' E Standard Meridian of India passes.',
    curriculumSignificance: 'Determines Indian Standard Time (IST = UTC + 05:30) for the entire nation.',
  },
  {
    id: 'loc-guru-shikhar',
    name: 'Guru Shikhar (Aravalli Range)',
    category: 'mountain',
    country: 'India',
    lon: 72.7816,
    lat: 24.6508,
    elevationM: 1722,
    description: 'Highest peak of the ancient Aravalli Range; featured on Survey of India Sheet 45 D/7.',
    curriculumSignificance: 'Oldest fold mountain system in India; water divide between Indus and Ganga.',
  },
  {
    id: 'loc-k2-godwin-austen',
    name: 'K2 (Mount Godwin-Austen)',
    category: 'mountain',
    country: 'India',
    lon: 76.5133,
    lat: 35.8814,
    elevationM: 8611,
    description: 'Second-highest mountain on Earth; situated in the Karakoram Range, Ladakh, India.',
    curriculumSignificance: 'Highest peak in the Indian union territory of Ladakh.',
  },
  {
    id: 'loc-kanchenjunga',
    name: 'Kanchenjunga',
    category: 'mountain',
    country: 'India',
    lon: 88.1475,
    lat: 27.7025,
    elevationM: 8586,
    description: 'Third-highest peak on Earth; located on the border between Sikkim, India and Nepal.',
    curriculumSignificance: 'Highest Himalayan summit in the undisputed territory of Sikkim.',
  },
  {
    id: 'loc-ganga-source',
    name: 'Gangotri Glacier (Source of Ganga)',
    category: 'river',
    country: 'India',
    lon: 79.0669,
    lat: 30.9947,
    elevationM: 3892,
    description: 'Source of the Bhagirathi River in Uttarkashi District, Uttarakhand.',
    curriculumSignificance: 'Headstream of the holy Ganga river system draining northern India.',
  },
  {
    id: 'loc-indira-point',
    name: 'Indira Point (Great Nicobar)',
    category: 'landmark',
    country: 'India',
    lon: 93.8417,
    lat: 6.7533,
    description: 'Southernmost point of the Indian Union, situated on Great Nicobar Island.',
    curriculumSignificance: 'Latitude 6°45\' N marks the southernmost territorial extent of India.',
  },
  {
    id: 'loc-kanyakumari',
    name: 'Kanyakumari (Cape Comorin)',
    category: 'landmark',
    country: 'India',
    lon: 77.5385,
    lat: 8.0883,
    description: 'Southernmost tip of the Indian mainland at the confluence of the Arabian Sea, Bay of Bengal, and Indian Ocean.',
    curriculumSignificance: 'Tri-sea confluence and southern terminus of the Indian mainland.',
  },

  // World Key Landmarks & Geographic Standards
  {
    id: 'loc-greenwich',
    name: 'Greenwich Royal Observatory',
    category: 'landmark',
    country: 'United Kingdom',
    lon: 0.0000,
    lat: 51.4769,
    description: 'Historic home of the Prime Meridian of the World (0° Longitude) and Greenwich Mean Time (GMT).',
    curriculumSignificance: 'International zero reference for longitude and world time zones.',
  },
  {
    id: 'loc-mount-everest',
    name: 'Mount Everest (Sagarmatha / Chomolungma)',
    category: 'mountain',
    country: 'Nepal / China',
    lon: 86.9250,
    lat: 27.9881,
    elevationM: 8848.86,
    description: 'Highest mountain peak above sea level on Earth; situated in the Mahalangur Himal sub-range.',
    curriculumSignificance: 'Apex of the Alpine-Himalayan collision belt between Indian and Eurasian plates.',
  },
  {
    id: 'loc-mariana-trench',
    name: 'Challenger Deep (Mariana Trench)',
    category: 'ocean',
    lon: 142.5917,
    lat: 11.3733,
    elevationM: -10994,
    description: 'Deepest surveyed point in the world oceans, located in the western Pacific Ocean subduction zone.',
    curriculumSignificance: 'Pacific Ring of Fire oceanic trench formed by subduction of Pacific plate.',
  },
  {
    id: 'loc-nile-river',
    name: 'River Nile (Delta at Cairo)',
    category: 'river',
    country: 'Egypt',
    lon: 31.2357,
    lat: 30.0444,
    description: 'Longest river system in the world (approx. 6650 km), flowing northward through northeastern Africa.',
    curriculumSignificance: 'Classic perennial drainage basin supporting alluvial agriculture in arid regions.',
  },
  {
    id: 'loc-amazon-mouth',
    name: 'River Amazon (Mouth at Macapá)',
    category: 'river',
    country: 'Brazil',
    lon: -51.0664,
    lat: 0.0389,
    description: 'Largest river by discharge volume in the world; crosses the Equator in northern Brazil.',
    curriculumSignificance: 'Drains the extensive tropical rainforest biome of the Amazon basin.',
  },
  {
    id: 'loc-quito-equator',
    name: 'Mitad del Mundo (Quito Equator)',
    category: 'landmark',
    country: 'Ecuador',
    lon: -78.4558,
    lat: 0.0000,
    description: 'Monument marking the 0°0\'0" Equator in the Andes Mountains of Ecuador.',
    curriculumSignificance: 'Geographic divide between Northern and Southern Hemispheres.',
  },
  {
    id: 'loc-suva-dateline',
    name: 'Fiji (Near International Date Line)',
    category: 'island',
    country: 'Fiji',
    lon: 178.0650,
    lat: -17.7134,
    description: 'Island nation in the South Pacific located adjacent to the 180° meridian (International Date Line).',
    curriculumSignificance: 'Demonstrates why the Date Line zigzags to keep national territories on a single date.',
  },
  {
    id: 'loc-tokyo',
    name: 'Tokyo',
    category: 'capital',
    country: 'Japan',
    lon: 139.6917,
    lat: 35.6895,
    description: 'Capital of Japan; premier megacity situated in the earthquake-prone Pacific Rim.',
    curriculumSignificance: 'Located in the East Asian time zone (UTC+09:00), 3.5 hours ahead of IST.',
  },
  {
    id: 'loc-washington',
    name: 'Washington, D.C.',
    category: 'capital',
    country: 'United States',
    lon: -77.0369,
    lat: 38.9072,
    description: 'Capital of the United States of America; located in Eastern Standard Time (UTC-05:00).',
    curriculumSignificance: 'Demonstrates a 10.5 hour time difference behind Indian Standard Time.',
  },

  // Additional Indian Physiographic, Cultural & Regional Benchmarks
  {
    id: 'loc-mumbai',
    name: 'Mumbai (Konkan Coast)',
    category: 'capital',
    country: 'India',
    lon: 72.8777,
    lat: 19.0760,
    description: 'Financial capital of India situated on the western seaboard (Salsette Island) facing the Arabian Sea.',
    curriculumSignificance: 'Natural deep-water harbour; western gateway for maritime commerce and monsoon onset.',
  },
  {
    id: 'loc-kolkata',
    name: 'Kolkata (Hooghly River Delta)',
    category: 'capital',
    country: 'India',
    lon: 88.3639,
    lat: 22.5726,
    description: 'Major eastern metropolis situated along the tidal Hooghly distributary in lower West Bengal.',
    curriculumSignificance: 'Commercial nexus of eastern India and historic gateway to the Bay of Bengal.',
  },
  {
    id: 'loc-chennai',
    name: 'Chennai (Coromandel Coast)',
    category: 'capital',
    country: 'India',
    lon: 80.2707,
    lat: 13.0827,
    description: 'Capital of Tamil Nadu located on the Coromandel Coast of the southern peninsula.',
    curriculumSignificance: 'Receives the bulk of its annual rainfall from the retreating Northeast Monsoon (Oct–Dec).',
  },
  {
    id: 'loc-bengaluru',
    name: 'Bengaluru (Deccan Plateau)',
    category: 'capital',
    country: 'India',
    lon: 77.5946,
    lat: 12.9716,
    elevationM: 920,
    description: 'Major technology and industrial center situated on the elevated Mysore Plateau in south-central India.',
    curriculumSignificance: 'Elevated peninsular location producing a temperate semi-arid tropical savanna climate.',
  },
  {
    id: 'loc-srinagar',
    name: 'Srinagar (Kashmir Valley)',
    category: 'capital',
    country: 'India',
    lon: 74.7973,
    lat: 34.0837,
    elevationM: 1585,
    description: 'Summer capital of Jammu and Kashmir located along the meandering course of the Jhelum River.',
    curriculumSignificance: 'Inter-montane tectonic valley between the Greater Himalayas and the Pir Panjal Range.',
  },
  {
    id: 'loc-leh',
    name: 'Leh (Ladakh Cold Desert)',
    category: 'capital',
    country: 'India',
    lon: 77.5771,
    lat: 34.1526,
    elevationM: 3524,
    description: 'Joint capital of the Union Territory of Ladakh situated in the rain-shadow of the Trans-Himalayas.',
    curriculumSignificance: 'Exemplifies a high-altitude cold desert biome with extreme diurnal temperature ranges.',
  },
  {
    id: 'loc-thar-desert',
    name: 'Thar Desert (Great Indian Desert)',
    category: 'landmark',
    country: 'India',
    lon: 70.9083,
    lat: 26.9157,
    description: 'Subtropical arid desert region encompassing western Rajasthan characterized by shifting barchan dunes.',
    curriculumSignificance: 'Major Indian physiographic division; rainfall < 150mm annually due to Aravalli alignment.',
  },
  {
    id: 'loc-sundarbans',
    name: 'Sundarbans Delta (UNESCO Heritage)',
    category: 'river',
    country: 'India',
    lon: 88.8535,
    lat: 21.9497,
    description: 'Largest contiguous mangrove forest and deltaic formation on Earth, formed by Ganga and Brahmaputra.',
    curriculumSignificance: 'Critical coastal mangrove biome; habitat of the Royal Bengal Tiger and Sundari trees.',
  },
  {
    id: 'loc-nanda-devi',
    name: 'Nanda Devi (Garhwal Himalaya)',
    category: 'mountain',
    country: 'India',
    lon: 79.9700,
    lat: 30.3756,
    elevationM: 7816,
    description: 'Second-highest mountain in India and highest peak located entirely within sovereign Indian territory.',
    curriculumSignificance: 'Core of the Nanda Devi Biosphere Reserve and sacred Himalayan watershed.',
  },
  {
    id: 'loc-anamudi',
    name: 'Anamudi Peak (Western Ghats)',
    category: 'mountain',
    country: 'India',
    lon: 77.0640,
    lat: 10.1698,
    elevationM: 2695,
    description: 'Highest mountain peak in peninsular India and the Western Ghats, located in Kerala.',
    curriculumSignificance: 'Highest summit in India south of the Himalayas; climatic barrier for monsoon rains.',
  },
  {
    id: 'loc-siachen-glacier',
    name: 'Siachen Glacier (Karakoram)',
    category: 'mountain',
    country: 'India',
    lon: 77.1700,
    lat: 35.4200,
    elevationM: 5400,
    description: 'Longest glacier in the Karakoram (76 km) and second-longest non-polar glacier in the world.',
    curriculumSignificance: 'Crucial freshwater source for the Nubra and Shyok tributaries of the Indus system.',
  },
  {
    id: 'loc-majuli',
    name: 'Majuli Island (Brahmaputra)',
    category: 'island',
    country: 'India',
    lon: 94.2167,
    lat: 26.9500,
    description: 'Largest inhabited freshwater river island in the world, formed by the shifting courses of Brahmaputra.',
    curriculumSignificance: 'Demonstrates riverine braided deposition and intense fluvial bank erosion.',
  },
  {
    id: 'loc-port-blair',
    name: 'Port Blair (South Andaman)',
    category: 'island',
    country: 'India',
    lon: 92.7465,
    lat: 11.6234,
    description: 'Capital of the Union Territory of Andaman and Nicobar Islands in the southeastern Bay of Bengal.',
    curriculumSignificance: 'Submerged volcanic mountain chain extending from Myanmar (Arakan Yoma) to Sumatra.',
  },
  {
    id: 'loc-kavaratti',
    name: 'Kavaratti (Lakshadweep Atoll)',
    category: 'island',
    country: 'India',
    lon: 72.6420,
    lat: 10.5667,
    description: 'Administrative headquarters of Lakshadweep; coral atoll island in the Arabian Sea.',
    curriculumSignificance: 'Classic coral reef atoll formation surrounding shallow calm lagoons.',
  },
  {
    id: 'loc-chilika-lake',
    name: 'Chilika Lake (Odisha Coast)',
    category: 'ocean',
    country: 'India',
    lon: 85.3500,
    lat: 19.7167,
    description: 'Largest coastal brackish water lagoon in India and second-largest lagoon in the world.',
    curriculumSignificance: 'Ramsar wetland site; demonstrates barrier spit formation and marine-freshwater mixing.',
  },
  {
    id: 'loc-rann-of-kutch',
    name: 'Great Rann of Kutch',
    category: 'landmark',
    country: 'India',
    lon: 70.0000,
    lat: 23.8000,
    description: 'Vast salt marsh desert situated in the Thar Desert biogeographic zone of Gujarat.',
    curriculumSignificance: 'Seasonal wetland flooded by seawater during monsoons and crystallizing into pure salt in winter.',
  },
  {
    id: 'loc-mawsynram',
    name: 'Mawsynram (Khasi Hills)',
    category: 'landmark',
    country: 'India',
    lon: 91.5833,
    lat: 25.2970,
    elevationM: 1400,
    description: 'Village in the East Khasi Hills district of Meghalaya; recognized as the wettest place on Earth.',
    curriculumSignificance: 'Receives ~11,872 mm annual precipitation due to the funneling effect of Meghalaya hills.',
  },

  // Additional World Geographic Icons & Canals
  {
    id: 'loc-london',
    name: 'London',
    category: 'capital',
    country: 'United Kingdom',
    lon: -0.1278,
    lat: 51.5074,
    description: 'Capital of the United Kingdom located on the River Thames in Western Europe.',
    curriculumSignificance: 'Located on the Prime Meridian (0° Longitude) defining Western European Time.',
  },
  {
    id: 'loc-paris',
    name: 'Paris',
    category: 'capital',
    country: 'France',
    lon: 2.3522,
    lat: 48.8566,
    description: 'Capital of France situated on the Seine River in the heart of the Paris Basin.',
    curriculumSignificance: 'Central European Time (UTC+01:00); 4.5 hours behind Indian Standard Time.',
  },
  {
    id: 'loc-cairo-pyramids',
    name: 'Cairo (Great Pyramids of Giza)',
    category: 'landmark',
    country: 'Egypt',
    lon: 31.1342,
    lat: 29.9792,
    description: 'Historic landmark along the Nile River Delta in northern Africa.',
    curriculumSignificance: 'Represents the transition from Mediterranean scrub to hyper-arid Saharan climate.',
  },
  {
    id: 'loc-sydney',
    name: 'Sydney (Port Jackson)',
    category: 'capital',
    country: 'Australia',
    lon: 151.2093,
    lat: -33.8688,
    description: 'Largest city in Australia situated on the southeastern Pacific coastline.',
    curriculumSignificance: 'Southern Hemisphere seasons inverted compared to India; UTC+10:00 (4.5 hrs ahead of IST).',
  },
  {
    id: 'loc-rio-de-janeiro',
    name: 'Rio de Janeiro',
    category: 'landmark',
    country: 'Brazil',
    lon: -43.1729,
    lat: -22.9068,
    description: 'Coastal Brazilian metropolis framed by Sugarloaf Mountain and Guanabara Bay.',
    curriculumSignificance: 'Located near the Tropic of Capricorn in the Southern Hemisphere (UTC-03:00).',
  },
  {
    id: 'loc-cape-town',
    name: 'Cape Town (Cape of Good Hope)',
    category: 'capital',
    country: 'South Africa',
    lon: 18.4241,
    lat: -33.9249,
    description: 'Historic maritime landmark at the southwestern tip of the African continent.',
    curriculumSignificance: 'Classic Mediterranean climate zone (winter rain, dry summer) in the Southern Hemisphere.',
  },
  {
    id: 'loc-panama-canal',
    name: 'Panama Canal (Isthmus of Panama)',
    category: 'landmark',
    country: 'Panama',
    lon: -79.9167,
    lat: 9.0800,
    description: 'Artificial 82-km waterway connecting the Atlantic Ocean with the Pacific Ocean.',
    curriculumSignificance: 'Eliminates the treacherous 13,000-km transit around Cape Horn (South America).',
  },
  {
    id: 'loc-suez-canal',
    name: 'Suez Canal (Isthmus of Suez)',
    category: 'landmark',
    country: 'Egypt',
    lon: 32.3400,
    lat: 30.7000,
    description: 'Artificial 193-km sea-level waterway connecting the Mediterranean Sea to the Red Sea.',
    curriculumSignificance: 'Premier maritime trade artery cutting navigation distance between Europe and India by 7,000 km.',
  },
  {
    id: 'loc-mount-fuji',
    name: 'Mount Fuji (Stratovolcano)',
    category: 'mountain',
    country: 'Japan',
    lon: 138.7278,
    lat: 35.3606,
    elevationM: 3776,
    description: 'Active composite stratovolcano southwest of Tokyo in the Pacific Ring of Fire.',
    curriculumSignificance: 'Formed by triple plate subduction (Pacific, Philippine Sea, and Amurian plates).',
  },
  {
    id: 'loc-kilimanjaro',
    name: 'Mount Kilimanjaro (East African Rift)',
    category: 'mountain',
    country: 'Tanzania',
    lon: 37.3556,
    lat: -3.0674,
    elevationM: 5895,
    description: 'Highest mountain in Africa and highest single free-standing mountain summit in the world.',
    curriculumSignificance: 'Volcanic mountain located 3° south of the Equator retaining an equatorial ice cap.',
  },
  {
    id: 'loc-hawaii',
    name: 'Honolulu (Hawaii Hotspot)',
    category: 'island',
    country: 'United States',
    lon: -157.8583,
    lat: 21.3069,
    description: 'Volcanic archipelago in the central Pacific Ocean formed over a stationary mantle plume.',
    curriculumSignificance: 'Intra-plate hotspot volcanism demonstrating Pacific tectonic plate motion over time.',
  },
  {
    id: 'loc-galapagos',
    name: 'Galápagos Islands (Equatorial Pacific)',
    category: 'island',
    country: 'Ecuador',
    lon: -90.5000,
    lat: -0.6000,
    description: 'Volcanic archipelago straddling the Equator in the eastern Pacific Ocean.',
    curriculumSignificance: 'Cold Humboldt Current creates an atypical cool equatorial marine biome.',
  },
  {
    id: 'loc-singapore',
    name: 'Singapore (Strait of Malacca)',
    category: 'capital',
    country: 'Singapore',
    lon: 103.8198,
    lat: 1.3521,
    description: 'Island city-state located 1° north of the Equator at the entrance to the Malacca Strait.',
    curriculumSignificance: 'Controls the busiest maritime chokepoint on Earth linking the Indian and Pacific Oceans.',
  },
  {
    id: 'loc-gibraltar',
    name: 'Strait of Gibraltar',
    category: 'landmark',
    country: 'United Kingdom / Spain',
    lon: -5.3536,
    lat: 36.1408,
    description: 'Narrow maritime strait connecting the Atlantic Ocean to the Mediterranean Sea.',
    curriculumSignificance: 'Separates Europe from Africa by only 13 km; strategic global navigation gateway.',
  },
];

/**
 * Filter and search geographic locations across names, categories, and countries.
 */
export function searchGlobeLocations(query: string): GlobeLocation[] {
  if (!query || query.trim().length === 0) return GLOBE_LOCATIONS;
  const q = query.toLowerCase().trim();
  return GLOBE_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      (loc.country && loc.country.toLowerCase().includes(q)) ||
      loc.category.toLowerCase().includes(q) ||
      loc.description.toLowerCase().includes(q)
  );
}
