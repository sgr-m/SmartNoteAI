/**
 * Weather and Climate Teaching Laboratory Service
 * Stage 8: India Meteorological Department (IMD) Mausam Integration,
 * Climatological Normals, Synoptic Charts, 8 Weather Instruments & 10 Atmospheric Physics Models.
 *
 * Compliance:
 * - India Meteorological Department (IMD / MoES, Govt of India) as primary authoritative source.
 * - Stale data enforcement: Explicit observation times, issue times, validity periods,
 *   and clear distinction between real-time weather and 30-year climatological normals.
 * - Offline capability: Bundles authentic IMD 30-year normals (1981–2010 / 1991–2020),
 *   station directory for 35+ major Indian cities, and physical instrument equations.
 */

// ─── 1. Core Interfaces & Enums ─────────────────────────────────────────────

export type WeatherProductCategory =
  | 'rainfall'
  | 'temperature'
  | 'radar-satellite'
  | 'cyclone-monsoon'
  | 'warnings';

export type WeatherWarningLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface WeatherProductInfo {
  id: string;
  name: string;
  shortName: string;
  category: WeatherProductCategory;
  provider: string;
  sourceUrl: string;
  observationTime: string; // ISO 8601
  issueTime: string;       // ISO 8601
  validityPeriodHours: number;
  lastUpdated: string;     // ISO 8601
  isArchivedSimulation: boolean;
  warningLevel?: WeatherWarningLevel;
  description: string;
  unit: string;
  colorScale: Array<{ value: number; label: string; color: string }>;
}

export type ClimateNormalsCategory =
  | 'annual-rainfall'
  | 'seasonal-rainfall'
  | 'temperature-zones'
  | 'humidity-zones'
  | 'wind-jetstreams'
  | 'pressure-belts'
  | 'koppen-classification'
  | 'drought-prone-dpap';

export interface ClimateProductInfo {
  id: string;
  name: string;
  category: ClimateNormalsCategory;
  period: string; // e.g. "1981–2010 / 1991–2020 Normals"
  provider: string;
  description: string;
  keyFeatures: string[];
  legend: Array<{ label: string; color: string; description?: string }>;
}

export type WeatherInstrumentType =
  | 'sixs-thermometer'
  | 'fortin-barometer'
  | 'aneroid-barometer'
  | 'symons-rain-gauge'
  | 'hygrometer-psychrometer'
  | 'robinson-anemometer'
  | 'wind-vane'
  | 'campbell-stokes-sunshine'
  | 'stevenson-screen';

export interface WeatherInstrumentModel {
  id: WeatherInstrumentType;
  name: string;
  category: 'temperature' | 'pressure' | 'precipitation' | 'humidity' | 'wind' | 'sunshine' | 'shelter';
  physicalPrinciple: string;
  primaryUnits: string;
  secondaryUnits?: string;
  measurementRange: [number, number];
  accuracy: string;
  cbseCurriculumNotes: string;
  installationHeightMeters: number;
  specifications: Record<string, string>;
}

export type WeatherConceptType =
  | 'water-cycle'
  | 'evaporation-latent-heat'
  | 'condensation-dew-point'
  | 'precipitation-processes'
  | 'air-pressure-gradient'
  | 'wind-dynamics'
  | 'humidity-types'
  | 'cloud-genera'
  | 'indian-monsoon-mechanism'
  | 'tropical-cyclone';

export interface WeatherConceptStep {
  stepNumber: number;
  title: string;
  description: string;
  physicsFormula?: string;
  keyParameterName?: string;
  keyParameterValue?: string;
}

export interface WeatherConceptModel {
  id: WeatherConceptType;
  title: string;
  subTitle: string;
  targetClassLevels: string; // e.g. "Class 9–12, Undergraduate"
  summary: string;
  steps: WeatherConceptStep[];
  governingLaws: string[];
}

export interface ClimateStationData {
  id: string;
  name: string;
  state: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast' | 'Islands';
  lat: number;
  lon: number;
  elevationM: number;
  koppenCode: 'Amw' | 'As' | 'Aw' | 'BShw' | 'BWhw' | 'Cwg' | 'Dfc' | 'E';
  annualRainfallMm: number;
  monsoonRainfallMm: number;
  meanMaxTempC: number;
  meanMinTempC: number;
  meanRelativeHumidityPct: number;
  annualSunshineHours: number;
  droughtProne: boolean;
  cycloneVulnerable: boolean;
  notes: string;
}

// ─── 2. IMD Mausam Weather Products ──────────────────────────────────────────

export const IMD_WEATHER_PRODUCTS: WeatherProductInfo[] = [
  {
    id: 'imd-rainfall-daily',
    name: 'Daily Rainfall Distribution & Departs',
    shortName: 'Daily Rainfall',
    category: 'rainfall',
    provider: 'India Meteorological Department (Mausam / MoES)',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/rainfallinformation.php',
    observationTime: '2026-07-15T08:30:00+05:30',
    issueTime: '2026-07-15T10:00:00+05:30',
    validityPeriodHours: 24,
    lastUpdated: '2026-07-15T10:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'yellow',
    description: '24-hour recorded rainfall across all IMD observatories, showing spatial distribution and departure from long-period average.',
    unit: 'mm / 24 hr',
    colorScale: [
      { value: 0, label: 'No Rain (0.0 mm)', color: '#ffffff' },
      { value: 2.5, label: 'Very Light (0.1–2.4 mm)', color: '#bbf7d0' },
      { value: 15.5, label: 'Light (2.5–15.5 mm)', color: '#6ee7b7' },
      { value: 64.4, label: 'Moderate (15.6–64.4 mm)', color: '#38bdf8' },
      { value: 115.5, label: 'Heavy (64.5–115.5 mm)', color: '#0284c7' },
      { value: 204.4, label: 'Very Heavy (115.6–204.4 mm)', color: '#f59e0b' },
      { value: 300, label: 'Extremely Heavy (≥204.5 mm)', color: '#ef4444' },
    ],
  },
  {
    id: 'imd-rainfall-weekly',
    name: 'Weekly Cumulative Rainfall & Anomaly',
    shortName: 'Weekly Rainfall',
    category: 'rainfall',
    provider: 'India Meteorological Department (Mausam / MoES)',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/cumulativeRainfall.php',
    observationTime: '2026-07-14T08:30:00+05:30',
    issueTime: '2026-07-14T12:00:00+05:30',
    validityPeriodHours: 168,
    lastUpdated: '2026-07-14T12:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'green',
    description: 'Weekly aggregate precipitation compared to 30-year normal, categorised into departure classes for agricultural planning.',
    unit: '% Departure',
    colorScale: [
      { value: -60, label: 'Large Deficient (≤ -60%)', color: '#dc2626' },
      { value: -20, label: 'Deficient (-59% to -20%)', color: '#f97316' },
      { value: 0, label: 'Normal (-19% to +19%)', color: '#22c55e' },
      { value: 20, label: 'Excess (+20% to +59%)', color: '#0284c7' },
      { value: 60, label: 'Large Excess (≥ +60%)', color: '#2563eb' },
    ],
  },
  {
    id: 'imd-rainfall-monthly',
    name: 'Monthly Monsoon Isohyet Distribution',
    shortName: 'Monthly Rainfall',
    category: 'rainfall',
    provider: 'India Meteorological Department (Mausam / MoES)',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/rainfallinformation.php',
    observationTime: '2026-07-01T00:00:00+05:30',
    issueTime: '2026-07-01T06:00:00+05:30',
    validityPeriodHours: 720,
    lastUpdated: '2026-07-01T06:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'green',
    description: 'Monthly monsoon totals across meteorology sub-divisions with contoured isohyets.',
    unit: 'mm / month',
    colorScale: [
      { value: 50, label: '< 50 mm', color: '#fed7aa' },
      { value: 100, label: '50–100 mm', color: '#fef08a' },
      { value: 200, label: '100–200 mm', color: '#bbf7d0' },
      { value: 400, label: '200–400 mm', color: '#38bdf8' },
      { value: 800, label: '400–800 mm', color: '#0284c7' },
      { value: 1200, label: '> 800 mm (Western Ghats / NE)', color: '#4338ca' },
    ],
  },
  {
    id: 'imd-temp-max',
    name: 'Maximum Temperature & Heatwave Warning',
    shortName: 'Max Temperature',
    category: 'temperature',
    provider: 'India Meteorological Department (Mausam / MoES)',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/maxTemp.php',
    observationTime: '2026-05-25T17:30:00+05:30',
    issueTime: '2026-05-25T18:00:00+05:30',
    validityPeriodHours: 24,
    lastUpdated: '2026-05-25T18:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'orange',
    description: 'Highest afternoon temperature recorded across surface observatories, identifying heatwave and severe heatwave pockets.',
    unit: '°C',
    colorScale: [
      { value: 20, label: '< 20°C (Himalayan)', color: '#38bdf8' },
      { value: 30, label: '20–30°C (Comfortable)', color: '#4ade80' },
      { value: 38, label: '30–38°C (Warm)', color: '#facc15' },
      { value: 42, label: '38–42°C (Very Warm)', color: '#fb923c' },
      { value: 45, label: '42–45°C (Heatwave)', color: '#ef4444' },
      { value: 48, label: '≥ 45°C (Severe Heatwave)', color: '#7f1d1d' },
    ],
  },
  {
    id: 'imd-temp-min',
    name: 'Minimum Temperature & Coldwave Warning',
    shortName: 'Min Temperature',
    category: 'temperature',
    provider: 'India Meteorological Department (Mausam / MoES)',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/minTemp.php',
    observationTime: '2026-01-15T08:30:00+05:30',
    issueTime: '2026-01-15T09:00:00+05:30',
    validityPeriodHours: 24,
    lastUpdated: '2026-01-15T09:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'yellow',
    description: 'Lowest nocturnal temperature before sunrise, tracking Western Disturbance chill and coldwave conditions across North India.',
    unit: '°C',
    colorScale: [
      { value: -10, label: '< -5°C (Severe Frost / Ice)', color: '#818cf8' },
      { value: 0, label: '-5 to 0°C (Sub-zero)', color: '#67e8f9' },
      { value: 5, label: '0 to 5°C (Coldwave Plains)', color: '#38bdf8' },
      { value: 10, label: '5 to 10°C (Cold)', color: '#93c5fd' },
      { value: 18, label: '10 to 18°C (Pleasant)', color: '#86efac' },
      { value: 24, label: '> 18°C (Mild / Tropical)', color: '#fde047' },
    ],
  },
  {
    id: 'imd-radar-composite',
    name: 'Doppler Weather Radar (DWR) Network Composite',
    shortName: 'DWR Radar Network',
    category: 'radar-satellite',
    provider: 'IMD National Radar Network (37 DWR Stations)',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/radar_composite.php',
    observationTime: '2026-07-15T14:45:00+05:30',
    issueTime: '2026-07-15T15:00:00+05:30',
    validityPeriodHours: 3,
    lastUpdated: '2026-07-15T15:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'orange',
    description: 'S-band and C-band Doppler Weather Radar composite measuring radar reflectivity factor (Z) in dBZ, detecting convective cloud top heights and precipitation cores.',
    unit: 'dBZ (Reflectivity)',
    colorScale: [
      { value: 10, label: '10–20 dBZ (Light Drizzle)', color: '#60a5fa' },
      { value: 25, label: '20–30 dBZ (Moderate Rain)', color: '#34d399' },
      { value: 40, label: '30–45 dBZ (Heavy Rain)', color: '#facc15' },
      { value: 50, label: '45–55 dBZ (Thunderstorm / Gusts)', color: '#f97316' },
      { value: 65, label: '≥ 55 dBZ (Severe Hailstorm / Squall)', color: '#dc2626' },
    ],
  },
  {
    id: 'imd-satellite-insat',
    name: 'INSAT-3D / 3DR Geostationary Satellite Imagery',
    shortName: 'INSAT-3D Satellite',
    category: 'radar-satellite',
    provider: 'IMD Satellite Meteorology Division / ISRO',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/satellite.php',
    observationTime: '2026-07-15T15:00:00+05:30',
    issueTime: '2026-07-15T15:15:00+05:30',
    validityPeriodHours: 3,
    lastUpdated: '2026-07-15T15:15:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'green',
    description: 'Multi-spectral satellite images (Visible 0.65µm, Thermal IR 10.8µm, and Water Vapor 6.7µm) positioned at 82°E and 74°E geostationary orbital slots over the Indian Ocean.',
    unit: 'Cloud Top Temp (°C) / IR Brightness',
    colorScale: [
      { value: 20, label: 'Warm Low Clouds / Land (> 10°C)', color: '#94a3b8' },
      { value: 0, label: 'Middle Clouds (0 to -20°C)', color: '#38bdf8' },
      { value: -40, label: 'High Clouds (-20 to -50°C)', color: '#0284c7' },
      { value: -70, label: 'Deep Convective Towers (≤ -70°C)', color: '#ef4444' },
    ],
  },
  {
    id: 'imd-cyclone-track',
    name: 'Regional Specialised Meteorological Centre (RSMC) Cyclone Tracking',
    shortName: 'Cyclone Tracker',
    category: 'cyclone-monsoon',
    provider: 'RSMC New Delhi / IMD Tropical Cyclone Warning Centre',
    sourceUrl: 'https://rsmcnewdelhi.imd.gov.in/',
    observationTime: '2026-10-24T12:00:00+05:30',
    issueTime: '2026-10-24T13:30:00+05:30',
    validityPeriodHours: 12,
    lastUpdated: '2026-10-24T13:30:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'red',
    description: 'Authoritative tropical cyclone cone of uncertainty, estimated central pressure, maximum sustained wind speeds (3-minute average), and projected landfall point.',
    unit: 'knots / km/h',
    colorScale: [
      { value: 25, label: 'Depression (17–27 kts, 31–49 km/h)', color: '#38bdf8' },
      { value: 30, label: 'Deep Depression (28–33 kts, 50–61 km/h)', color: '#facc15' },
      { value: 45, label: 'Cyclonic Storm (34–47 kts, 62–88 km/h)', color: '#fb923c' },
      { value: 60, label: 'Severe Cyclonic Storm (48–63 kts, 89–117 km/h)', color: '#f97316' },
      { value: 85, label: 'Very Severe Cyclonic Storm (64–89 kts, 118–166 km/h)', color: '#ef4444' },
      { value: 110, label: 'Extremely Severe CS (90–119 kts, 167–221 km/h)', color: '#b91c1c' },
      { value: 125, label: 'Super Cyclonic Storm (≥ 120 kts, ≥ 222 km/h)', color: '#581c87' },
    ],
  },
  {
    id: 'imd-monsoon-nlm',
    name: 'Northern Limit of Monsoon (NLM) Progress Isochrones',
    shortName: 'Monsoon Progress (NLM)',
    category: 'cyclone-monsoon',
    provider: 'IMD National Weather Forecasting Centre',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/monsoon.php',
    observationTime: '2026-06-25T08:30:00+05:30',
    issueTime: '2026-06-25T11:00:00+05:30',
    validityPeriodHours: 24,
    lastUpdated: '2026-06-25T11:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'green',
    description: 'Northern Limit of Monsoon (NLM) line tracking the daily northern boundary of the Southwest Monsoon from Kerala (Normal: 1 June) to Jaisalmer (Normal: 8 July).',
    unit: 'Isochrone Date',
    colorScale: [
      { value: 1, label: '1 June (Kerala Coast & South Bay)', color: '#15803d' },
      { value: 5, label: '5 June (Karnataka, Rayalaseema, Tripura)', color: '#16a34a' },
      { value: 10, label: '10 June (Mumbai, Maharashtra, Kolkata)', color: '#22c55e' },
      { value: 15, label: '15 June (Gujarat, MP, Bihar, Odisha)', color: '#84cc16' },
      { value: 25, label: '25 June (Delhi, UP, Rajasthan, Punjab)', color: '#eab308' },
      { value: 38, label: '8 July (Entire Country Covered)', color: '#3b82f6' },
    ],
  },
  {
    id: 'imd-warnings-color',
    name: 'All India Weather Warning Bulletin (Color Coded)',
    shortName: 'Weather Warning Map',
    category: 'warnings',
    provider: 'IMD Weather Warning Division',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/all_india_warning.php',
    observationTime: '2026-07-15T08:30:00+05:30',
    issueTime: '2026-07-15T12:00:00+05:30',
    validityPeriodHours: 120, // 5-day warning bulletin
    lastUpdated: '2026-07-15T12:00:00+05:30',
    isArchivedSimulation: true,
    warningLevel: 'orange',
    description: 'Official 5-day district-wise meteorological warning map using IMD 4-color coded alerting convention for extreme weather events.',
    unit: 'Impact Tier',
    colorScale: [
      { value: 0, label: 'Green: No Warning (No Action Required)', color: '#22c55e' },
      { value: 1, label: 'Yellow: Watch (Be Updated)', color: '#eab308' },
      { value: 2, label: 'Orange: Alert (Be Prepared)', color: '#f97316' },
      { value: 3, label: 'Red: Warning (Take Action)', color: '#ef4444' },
    ],
  },
];

/**
 * Checks whether a weather product's data has exceeded its validity window.
 * Strictly adheres to rule: "Never display stale data as current weather."
 */
export function isWeatherProductStale(product: WeatherProductInfo, currentTime?: Date): boolean {
  if (product.isArchivedSimulation) {
    return false; // Archived educational datasets are permanently labeled as historical simulations
  }
  const now = currentTime ? currentTime.getTime() : Date.now();
  const obsTime = new Date(product.observationTime).getTime();
  const maxValidMs = product.validityPeriodHours * 3600 * 1000;
  return now - obsTime > maxValidMs;
}

// ─── 3. Climatological Normals & 30-Year Historical Climate Maps ─────────────

export const CLIMATE_PRODUCTS: ClimateProductInfo[] = [
  {
    id: 'clim-annual-rainfall',
    name: 'Annual Rainfall Isohyets (30-Year Normals 1981–2010)',
    category: 'annual-rainfall',
    period: 'IMD 1981–2010 Climatological Reference Normals',
    provider: 'India Meteorological Department (MoES)',
    description: 'Mean annual precipitation across India, highlighting the heavy rainfall zones (>2000mm) of the Western Ghats and Northeast, down to arid Western Rajasthan (<300mm).',
    keyFeatures: [
      'Highest: Mawsynram & Cherrapunji (>11,000 mm / yr)',
      'Lowest: Jaisalmer (<150 mm / yr) & Leh (<100 mm / yr)',
      'National Average: ~1,180 mm annually',
    ],
    legend: [
      { label: '< 300 mm (Arid Desert)', color: '#fed7aa', description: 'Thar Desert, Western Rajasthan, Ladakh Cold Desert' },
      { label: '300–600 mm (Semi-Arid)', color: '#fde047', description: 'Rain shadow of Western Ghats, Interior Deccan, Saurashtra' },
      { label: '600–1000 mm (Sub-Humid)', color: '#86efac', description: 'Central India, Punjab, Haryana, Eastern Rajasthan' },
      { label: '1000–2000 mm (Humid)', color: '#38bdf8', description: 'Ganga Basin, Coastal Odisha, Coastal AP, West Bengal' },
      { label: '> 2000 mm (Per-Humid)', color: '#1d4ed8', description: 'Western Ghats windward scarp, Assam, Meghalaya, Arunachal' },
    ],
  },
  {
    id: 'clim-seasonal-monsoon',
    name: 'Southwest Monsoon Rainfall (June – September)',
    category: 'seasonal-rainfall',
    period: 'IMD 1981–2010 Climatological Reference Normals',
    provider: 'India Meteorological Department (MoES)',
    description: 'Contributes approximately 75% of India total annual rainfall via two distinct currents: the Arabian Sea branch and the Bay of Bengal branch.',
    keyFeatures: [
      'Arabian Sea Branch strikes Western Ghats and moves across Gujarat/MP',
      'Bay of Bengal Branch deflects westward along the Himalayan foothills',
      'Breaks in monsoon occur when monsoon trough shifts to foothills',
    ],
    legend: [
      { label: 'Arabian Sea Current', color: '#0284c7' },
      { label: 'Bay of Bengal Current', color: '#059669' },
      { label: 'Monsoon Trough Axis', color: '#dc2626' },
      { label: 'Orographic Ascent Zone', color: '#7c3aed' },
    ],
  },
  {
    id: 'clim-koppen-india',
    name: 'Köppen-Geiger Climatic Classification for India',
    category: 'koppen-classification',
    period: 'Standard Academic Reference (Trewartha / Köppen Scheme for India)',
    provider: 'IMD / NCERT / Survey of India Standard Geography Series',
    description: 'Official 8-region Köppen classification tailored to the Indian subcontinent based on annual/monthly temperatures and precipitation seasonality.',
    keyFeatures: [
      'Amw: Tropical monsoon with short dry winter (Malabar, Goa, Konkan)',
      'As: Tropical monsoon with dry summer (Coromandel Coast / Coastal Tamil Nadu)',
      'Aw: Tropical savanna (Interior Peninsular India south of Tropic of Cancer)',
      'BShw: Semi-arid steppe (Rain shadow Deccan, parts of Gujarat & Haryana)',
      'BWhw: Arid desert (Western Rajasthan, Thar)',
      'Cwg: Monsoon with dry winter and hot summer (Ganga Plain, Eastern UP, Bihar)',
      'Dfc: Cold humid winter with short summer (Arunachal Pradesh, Sikkim)',
      'E: Polar / Tundra climate (High Himalayas, Ladakh, Jammu & Kashmir)',
    ],
    legend: [
      { label: 'Amw (Tropical Monsoon, Dry Winter)', color: '#0284c7' },
      { label: 'As (Tropical Monsoon, Dry Summer)', color: '#0d9488' },
      { label: 'Aw (Tropical Savanna)', color: '#16a34a' },
      { label: 'BShw (Semi-Arid Steppe)', color: '#eab308' },
      { label: 'BWhw (Hot Arid Desert)', color: '#ea580c' },
      { label: 'Cwg (Monsoon Warm Temperate)', color: '#84cc16' },
      { label: 'Dfc (Cold Humid / Short Summer)', color: '#6366f1' },
      { label: 'E (Polar / Alpine Tundra)', color: '#93c5fd' },
    ],
  },
  {
    id: 'clim-wind-jetstream',
    name: 'Upper Tropospheric Jet Streams & Surface Pressure Belts',
    category: 'wind-jetstreams',
    period: 'IMD Climatological Atlas of Upper Air Flows',
    provider: 'India Meteorological Department (MoES)',
    description: 'Subtropical Westerly Jet Stream (STWJ) at 200 hPa and Tropical Easterly Jet Stream (TEJ) at 150 hPa, governing the onset and withdrawal of the monsoon.',
    keyFeatures: [
      'Winter STWJ steers Western Disturbances into Northwest India',
      'Summer migration of STWJ north of Tibetan Plateau triggers monsoon onset',
      'Tropical Easterly Jet Stream (TEJ) establishes over Peninsular India at 13°N–15°N',
      'Somali Jet (Findlater Jet) carries immense oceanic moisture into the Arabian Sea',
    ],
    legend: [
      { label: 'Subtropical Westerly Jet (STWJ)', color: '#3b82f6' },
      { label: 'Tropical Easterly Jet (TEJ)', color: '#ef4444' },
      { label: 'Low-Level Somali Jet (LLJ)', color: '#10b981' },
      { label: 'ITCZ Thermal Equator Position', color: '#f59e0b' },
    ],
  },
  {
    id: 'clim-drought-dpap',
    name: 'Drought-Prone Areas Programme (DPAP) & Water Scarcity Zones',
    category: 'drought-prone-dpap',
    period: 'Central Water Commission (CWC) & Ministry of Jal Shakti',
    provider: 'IMD Drought Research Unit, Pune / CWC',
    description: 'Delineates the 74 recognized drought-prone districts of India facing rainfall variability >30% and severe soil moisture deficits.',
    keyFeatures: [
      'Bundelkhand (UP & MP) semi-arid rocky plateau',
      'Marathwada & Vidarbha (Maharashtra) rain shadow belt',
      'Rayalaseema & Telangana arid tract',
      'Kalahandi-Balangir-Koraput (KBK) belt in Odisha',
    ],
    legend: [
      { label: 'Chronically Drought-Prone (Rainfall < 750mm, CV > 30%)', color: '#dc2626' },
      { label: 'Moderately Drought-Prone', color: '#f97316' },
      { label: 'Irrigation-Protected Canal Command', color: '#22c55e' },
    ],
  },
];

// ─── 4. Weather Instruments (8 CBSE/ICSE Physics & Operational Models) ──────

export const WEATHER_INSTRUMENTS: WeatherInstrumentModel[] = [
  {
    id: 'sixs-thermometer',
    name: "Six's Maximum & Minimum Thermometer",
    category: 'temperature',
    physicalPrinciple:
      "A U-shaped glass tube containing mercury and alcohol. When temperature rises, alcohol in the left bulb expands, pushing the mercury column down in the left limb and up in the right limb, advancing a steel index to record maximum temperature. When temperature drops, the alcohol contracts, pulling the mercury up the left limb to push the minimum index. Steel indices stay in place by surface tension/friction until reset with a magnet.",
    primaryUnits: '°C (Celsius)',
    secondaryUnits: '°F (Fahrenheit)',
    measurementRange: [-30, 60],
    accuracy: '± 0.2 °C',
    cbseCurriculumNotes:
      "Recorded daily at 08:30 IST to obtain previous 24 hours' maximum and minimum temperatures. Diurnal Range = Max Temp - Min Temp.",
    installationHeightMeters: 1.25,
    specifications: {
      'Mounting': 'Inside Stevenson Screen, mounted horizontally or slightly inclined',
      'Indicator Material': 'Dumbbell-shaped steel pins with tiny glass friction spring',
      'Reset Mechanism': 'Horseshoe magnet applied externally along glass tube',
      'Bulb Liquid': 'High-expansion creosote alcohol',
    },
  },
  {
    id: 'fortin-barometer',
    name: "Fortin's Mercury Barometer",
    category: 'pressure',
    physicalPrinciple:
      "Torricellian vacuum tube balanced against atmospheric pressure. Before taking a reading, an adjusting thumbscrew raises or lowers a flexible leather cistern bag until the mercury level just touches an ivory zero pointer. A vernier scale on the graduated brass casing allows readings to 0.1 mm Hg or 0.1 hPa.",
    primaryUnits: 'hPa / mbar',
    secondaryUnits: 'mm Hg (torr)',
    measurementRange: [870, 1070],
    accuracy: '± 0.1 hPa',
    cbseCurriculumNotes:
      "Standard sea level pressure = 1013.25 hPa (760 mm Hg). Pressure decreases by approximately 1 hPa for every 8.5 m of elevation rise near sea level.",
    installationHeightMeters: 1.5,
    specifications: {
      'Cistern Base': 'Soft leather bag adjusted via knurled brass thumbscrew',
      'Zero Datum': 'Ivory peg pointer marking scale zero level',
      'Temperature Correction': 'Attached mercury thermometer compensates for tube expansion',
      'Standard Gravity': 'Adjusted to standard latitude 45° and 0°C',
    },
  },
  {
    id: 'aneroid-barometer',
    name: 'Aneroid Barometer (Vidie Capsule)',
    category: 'pressure',
    physicalPrinciple:
      "A metallic capsule (Vidie can) made of beryllium copper or phosphor bronze is hermetically sealed with a partial vacuum inside. A corrugated diaphragm flexes inward under high atmospheric pressure and outward under low pressure. Delicate bimetallic levers and a chain (fusee) magnify this tiny deflection (~0.05 mm) onto a dial pointer.",
    primaryUnits: 'hPa (Hectopascal)',
    secondaryUnits: 'in Hg (Inches of Mercury)',
    measurementRange: [920, 1060],
    accuracy: '± 0.5 hPa',
    cbseCurriculumNotes:
      "Non-liquid design makes it rugged and portable for field surveys and altimetry. Used extensively in barographs with a rotating clockwork drum.",
    installationHeightMeters: 1.2,
    specifications: {
      'Capsule': 'Corrugated evacuated chamber with internal tension spring',
      'Magnification': 'Compound lever and chain mechanism',
      'Altitude Ring': 'Adjustable bezel for direct elevation height compensation',
      'Temperature Compensation': 'Bimetallic lever arm compensates for metal expansion',
    },
  },
  {
    id: 'symons-rain-gauge',
    name: "Symons' Standard Rain Gauge",
    category: 'precipitation',
    physicalPrinciple:
      "Non-recording standard rain gauge. Features a circular brass rim of exactly 127 mm (5 inches) internal diameter, bevelled outward to ensure sharp raindrops catchment. Rain enters through a deep funnel that minimizes evaporation and splashing, collecting into a glass bottle inside a zinc outer casing. Water is measured daily using a graduated glass cylinder calibrated directly in millimetres.",
    primaryUnits: 'mm (millimetres)',
    secondaryUnits: 'cm',
    measurementRange: [0, 250],
    accuracy: '± 0.1 mm',
    cbseCurriculumNotes:
      "Reading taken daily at 08:30 IST. 1 mm of measured rainfall corresponds to 1 litre of water per square metre of horizontal surface.",
    installationHeightMeters: 0.3, // 30 cm above ground level to avoid splash
    specifications: {
      'Rim Diameter': '127 mm (5 inches) turned true brass ring',
      'Rim Height': '300 mm above level grass ground to prevent splash',
      'Collector Volume': 'Graduated measuring glass bottle reading to 0.1 mm',
      'Foundation': 'Embedded firmly in a masonry block 600 x 600 x 600 mm',
    },
  },
  {
    id: 'hygrometer-psychrometer',
    name: 'Wet-and-Dry Bulb Psychrometer (Mason & Assmann)',
    category: 'humidity',
    physicalPrinciple:
      "Two identical mercury thermometers mounted side-by-side. The dry bulb measures ambient air temperature. The wet bulb has its bulb wrapped in a thin muslin wick continuously wetted with distilled water from a reservoir. Evaporation of water draws latent heat (2.5 x 10^6 J/kg) from the bulb, lowering its temperature. The drier the surrounding air, the faster the evaporation and the greater the psychrometric depression (Dry Bulb - Wet Bulb). When air is saturated (RH = 100%), both bulbs read the exact same temperature.",
    primaryUnits: '% RH (Relative Humidity)',
    secondaryUnits: 'Dew Point (°C)',
    measurementRange: [0, 100],
    accuracy: '± 2% RH',
    cbseCurriculumNotes:
      "Depression = Dry Bulb Temp - Wet Bulb Temp. Relative Humidity and Dew Point are calculated using standard hygrometric tables or psychrometric formulas.",
    installationHeightMeters: 1.25,
    specifications: {
      'Wick': 'Clean, unstarched muslin dipped in pure distilled water',
      'Ventilation': 'Assmann psychrometer provides constant 2.5 m/s airflow via fan',
      'Depression Formula': 'e = e_s(Tw) - A * P * (Td - Tw)',
      'Water Reservoir': 'Glass reservoir with siphon wick or Assmann aspiration tube',
    },
  },
  {
    id: 'robinson-anemometer',
    name: "Robinson's 4-Cup / 3-Cup Anemometer",
    category: 'wind',
    physicalPrinciple:
      "Three or four hemispherical or conical cups mounted horizontally at equal angles on spokes radiating from a vertical spindle. Wind pushes against the hollow concave interior of the cup with a drag coefficient much greater than the rounded convex side, causing continuous rotation in one direction regardless of wind direction. Spindle revolutions are geared to a mechanical counter or optoelectronic tachometer to calculate run of wind in km or speed in knots/km/h.",
    primaryUnits: 'km/h (Kilometres per hour)',
    secondaryUnits: 'knots & m/s',
    measurementRange: [0, 200],
    accuracy: '± 0.5 km/h',
    cbseCurriculumNotes:
      "Standard IMD exposure height is 10 metres above level, unobstructed ground. Wind speeds are converted into the 12-point Beaufort Scale.",
    installationHeightMeters: 10.0,
    specifications: {
      'Cup Diameter': '76.2 mm or 127 mm hemispherical spun copper or aluminium',
      'Spindle Rotor': 'Hardened steel pivot running on agate or ball bearings',
      'Cup Factor (K)': 'Rotational factor ~ 2.5 to 3.0 relating tip speed to wind speed',
      'Counter': '5-figure cyclometer register reading wind run in kilometres',
    },
  },
  {
    id: 'wind-vane',
    name: 'Wind Vane (Anemoscope)',
    category: 'wind',
    physicalPrinciple:
      "An aerodynamically balanced horizontal fin and pointer mounted freely on a vertical axis. Wind exerts greater drag pressure on the broad tail fin than on the tapered arrowhead, aligning the arrow to point directly INTO the direction from which the wind is blowing. A fixed cross with cardinal direction arms (N-E-S-W) aligned precisely with True Geographic North allows direct observation of 16 compass directions.",
    primaryUnits: '16 Compass Points (N, NNE, NE, etc.)',
    secondaryUnits: 'Degrees Azimuth (0°–360°)',
    measurementRange: [0, 360],
    accuracy: '± 5°',
    cbseCurriculumNotes:
      "Always names the wind by the direction it comes FROM. E.g., 'Southwest Monsoon' blows FROM the southwest TOWARDS the northeast.",
    installationHeightMeters: 10.0,
    specifications: {
      'Fin Design': 'Streamlined split tail fin for aerodynamic stability without oscillation',
      'True North Alignment': 'Calibrated with Polaris or Solar Meridian transit (not magnetic needle)',
      'Damping': 'Viscous oil damping prevents violent flutter in gusty gale winds',
      'Bearing': 'Hardened stainless steel pivot with sapphire jewel cap',
    },
  },
  {
    id: 'campbell-stokes-sunshine',
    name: 'Campbell-Stokes Sunshine Recorder',
    category: 'sunshine',
    physicalPrinciple:
      "A solid sphere of high-purity optical crown glass (100 mm diameter) acts as a spherical lens, concentrating parallel solar rays into an intense focal point on a specially treated blue recording card fitted in a semi-circular grooved bowl. When direct solar irradiance exceeds 120 W/m² (bright sunshine), the focused beam burns a continuous trace along the graduated card. Daily duration of bright sunshine is determined by measuring the total length of the burnt track.",
    primaryUnits: 'Hours of Bright Sunshine',
    secondaryUnits: 'Daily Sunshine %',
    measurementRange: [0, 16],
    accuracy: '± 0.1 hr',
    cbseCurriculumNotes:
      "Three distinct card types used according to season: curved long cards for summer, straight cards for equinoxes, and curved short cards for winter.",
    installationHeightMeters: 1.5,
    specifications: {
      'Glass Sphere': '100 mm diameter annealed optical crown glass (refractive index ~1.52)',
      'Focal Length': 'Approx 75 mm from center of sphere to card surface',
      'Card Bowl': 'Adjustable latitude arc (0° to 65°) oriented precisely in meridian',
      'Card Material': 'Uniform chemical composition blue pasteboard resistant to dampness',
    },
  },
  {
    id: 'stevenson-screen',
    name: 'Stevenson Screen (Meteorological Shelter)',
    category: 'shelter',
    physicalPrinciple:
      "A standardized wooden enclosure designed by Thomas Stevenson to protect sensitive thermometers and hygrometers from direct solar insolation, ground thermal re-radiation, and precipitation, while allowing free circulation of ambient air. Features double-louvred wooden walls, a double-layer roof with air gap, and an open batten floor. Painted brilliant gloss white to reflect solar radiation, with the access door hinged on the North side in the Northern Hemisphere so the sun never strikes the instruments during observation.",
    primaryUnits: 'Environmental Shielding',
    secondaryUnits: 'Air Flow Rate ~ 1–2 m/s',
    measurementRange: [0, 1],
    accuracy: 'ISO / WMO Certified Standard',
    cbseCurriculumNotes:
      "Standard shelter for Six's thermometer, dry bulb, wet bulb, and hygrograph. Height of thermometer bulbs is strictly maintained at 1.25 m above natural ground.",
    installationHeightMeters: 1.25,
    specifications: {
      'Construction': 'Seasoned teak, pine, or cedar with double-louvred sides',
      'Finish': '3 coats of non-metallic high-reflectance titanium dioxide white enamel',
      'Door Orientation': 'Opens North in Northern Hemisphere (Opens South in Southern)',
      'Site Requirements': 'Set over level, short-mowed grass at least 20 m from buildings or trees',
    },
  },
];

// ─── 5. Mathematical Models & Atmospheric Physics Calculations ──────────────

/**
 * Calculates Saturation Vapor Pressure (e_s) in hPa for temperature in °C
 * using the authoritative Magnus-Tetens formula (valid from -40°C to +50°C).
 */
export function calculateSaturationVaporPressure(tempC: number): number {
  return 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
}

/**
 * Calculates Actual Vapor Pressure, Relative Humidity %, and Dew Point Temperature (°C)
 * from dry bulb and wet bulb readings using the standard Psychrometric Formula.
 *
 * @param dryBulbC Ambient air dry bulb temperature (°C)
 * @param wetBulbC Muslin-wick wet bulb temperature (°C, must be <= dryBulbC)
 * @param pressureHpa Ambient atmospheric pressure (default: standard sea-level 1013.25 hPa)
 */
export function calculateRelativeHumidityAndDewPoint(
  dryBulbC: number,
  wetBulbC: number,
  pressureHpa: number = 1013.25
): {
  psychrometricDepression: number;
  actualVaporPressureHpa: number;
  saturationVaporPressureHpa: number;
  relativeHumidityPct: number;
  dewPointC: number;
} {
  // Ensure wet bulb does not exceed dry bulb in normal atmosphere
  const validWetBulb = Math.min(dryBulbC, wetBulbC);
  const depression = dryBulbC - validWetBulb;

  const es_Tw = calculateSaturationVaporPressure(validWetBulb);
  const es_Td = calculateSaturationVaporPressure(dryBulbC);

  // Psychrometric constant A for ventilated / screen conditions
  const psychrometricA = 0.00066 * (1 + 0.00115 * validWetBulb);
  const e = Math.max(0.01, es_Tw - psychrometricA * pressureHpa * depression);

  const rh = Math.min(100, Math.max(1, (e / es_Td) * 100));

  // Inverted Magnus formula for Dew Point temperature
  const alpha = Math.log(e / 6.112);
  const dewPoint = (243.5 * alpha) / (17.67 - alpha);

  return {
    psychrometricDepression: Math.round(depression * 10) / 10,
    actualVaporPressureHpa: Math.round(e * 100) / 100,
    saturationVaporPressureHpa: Math.round(es_Td * 100) / 100,
    relativeHumidityPct: Math.round(rh * 10) / 10,
    dewPointC: Math.round(dewPoint * 10) / 10,
  };
}

/**
 * Calculates barometric pressure decay with altitude using the Hypsometric Equation.
 * Standard lapse rate ~ 1 hPa per 8.5 m at low altitudes.
 */
export function calculatePressureAtAltitude(seaLevelPressureHpa: number, altitudeMeters: number): {
  pressureHpa: number;
  pressureMmHg: number;
  pressureDeltaHpa: number;
} {
  // Standard atmosphere: T0 = 288.15 K, lapse = 0.0065 K/m, M = 0.0289644, g = 9.80665, R = 8.3144598
  const p = seaLevelPressureHpa * Math.pow(1 - (0.0065 * altitudeMeters) / 288.15, 5.25588);
  const mmHg = p * 0.750062;
  return {
    pressureHpa: Math.round(p * 10) / 10,
    pressureMmHg: Math.round(mmHg * 10) / 10,
    pressureDeltaHpa: Math.round((seaLevelPressureHpa - p) * 10) / 10,
  };
}

/**
 * Maps wind speed in km/h to Beaufort Wind Scale number (0 to 12) with official description.
 */
export function mapWindSpeedToBeaufort(speedKmH: number): {
  beaufortNumber: number;
  description: string;
  seamanTerm: string;
  landEffects: string;
} {
  if (speedKmH < 1) {
    return { beaufortNumber: 0, description: 'Calm', seamanTerm: 'Calm', landEffects: 'Smoke rises vertically; water mirror smooth' };
  } else if (speedKmH <= 5) {
    return { beaufortNumber: 1, description: 'Light Air', seamanTerm: 'Light Air', landEffects: 'Smoke drift indicates wind direction; vanes calm' };
  } else if (speedKmH <= 11) {
    return { beaufortNumber: 2, description: 'Light Breeze', seamanTerm: 'Light Breeze', landEffects: 'Wind felt on face; leaves rustle; vanes move' };
  } else if (speedKmH <= 19) {
    return { beaufortNumber: 3, description: 'Gentle Breeze', seamanTerm: 'Gentle Breeze', landEffects: 'Leaves and small twigs in constant motion' };
  } else if (speedKmH <= 28) {
    return { beaufortNumber: 4, description: 'Moderate Breeze', seamanTerm: 'Moderate Breeze', landEffects: 'Raises dust and loose paper; small branches moved' };
  } else if (speedKmH <= 38) {
    return { beaufortNumber: 5, description: 'Fresh Breeze', seamanTerm: 'Fresh Breeze', landEffects: 'Small trees in leaf begin to sway' };
  } else if (speedKmH <= 49) {
    return { beaufortNumber: 6, description: 'Strong Breeze', seamanTerm: 'Strong Breeze', landEffects: 'Large branches in motion; umbrellas used with difficulty' };
  } else if (speedKmH <= 61) {
    return { beaufortNumber: 7, description: 'Near Gale', seamanTerm: 'Moderate Gale', landEffects: 'Whole trees in motion; resistance walking against wind' };
  } else if (speedKmH <= 74) {
    return { beaufortNumber: 8, description: 'Gale', seamanTerm: 'Fresh Gale', landEffects: 'Breaks twigs off trees; generally impedes progress' };
  } else if (speedKmH <= 88) {
    return { beaufortNumber: 9, description: 'Strong Gale', seamanTerm: 'Strong Gale', landEffects: 'Slight structural damage occurs; chimney pots removed' };
  } else if (speedKmH <= 102) {
    return { beaufortNumber: 10, description: 'Storm', seamanTerm: 'Whole Gale', landEffects: 'Trees uprooted; considerable structural damage' };
  } else if (speedKmH <= 117) {
    return { beaufortNumber: 11, description: 'Violent Storm', seamanTerm: 'Storm', landEffects: 'Widespread extensive damage to structures' };
  } else {
    return { beaufortNumber: 12, description: 'Hurricane Force', seamanTerm: 'Hurricane', landEffects: 'Devastating destruction; roofs blown away' };
  }
}

/**
 * Converts azimuth angle (0°–360°) to 16-point cardinal compass string.
 */
export function degreesToCompass16(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[index];
}

// ─── 6. 10 Interactive Atmospheric Physics Concepts ─────────────────────────

export const WEATHER_CONCEPTS: WeatherConceptModel[] = [
  {
    id: 'water-cycle',
    title: 'The Hydrological (Water) Cycle',
    subTitle: 'Global Circulation of Moisture Between Hydrosphere, Atmosphere, and Lithosphere',
    targetClassLevels: 'Classes 6–10 (General Science / Geography)',
    summary:
      'Continuous closed-loop journey of water molecules driven by solar insolation and gravity through six primary phases.',
    governingLaws: [
      'Conservation of Mass: Global water inventory remains constant (~1.386 billion km³)',
      'Solar Radiant Flux driving evaporation and thermal convection',
      'Gravitational Potential Energy driving runoff and percolation',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Oceanic & Terrestrial Evaporation',
        description: 'Solar energy heats water surfaces, converting liquid water into invisible atmospheric water vapor.',
        physicsFormula: 'Latent Heat of Vaporization: L_v ≈ 2.501 × 10⁶ J/kg',
      },
      {
        stepNumber: 2,
        title: 'Vegetative Transpiration & Evapotranspiration',
        description: 'Plants draw groundwater through roots and release vapor through stomata on leaves.',
        keyParameterName: 'Global Share',
        keyParameterValue: '~10% of total atmospheric moisture',
      },
      {
        stepNumber: 3,
        title: 'Adiabatic Ascent & Condensation',
        description: 'Warm moist air parcels rise, expand, cool adiabatically to their dew point, forming cloud droplets around microscopic CCN.',
        physicsFormula: 'Dry Adiabatic Lapse Rate (DALR) = 9.8 °C / km',
      },
      {
        stepNumber: 4,
        title: 'Advective Atmospheric Transport',
        description: 'Zonal and meridional winds (monsoon winds, trade winds) transport condensed clouds over long continental distances.',
      },
      {
        stepNumber: 5,
        title: 'Precipitation Delivery',
        description: 'Droplets coalesce or ice crystals grow heavy enough to overcome updrafts, falling as rain, snow, or hail.',
      },
      {
        stepNumber: 6,
        title: 'Percolation, Aquifer Recharge & Stream Runoff',
        description: 'Precipitation infiltrates into groundwater aquifers or flows through river drainage basins back to oceans.',
      },
    ],
  },
  {
    id: 'evaporation-latent-heat',
    title: 'Evaporation and Latent Heat Transfer',
    subTitle: 'Thermodynamics of Molecular Phase Changes in the Atmosphere',
    targetClassLevels: 'Classes 9–12 & Undergraduate Meteorology',
    summary:
      'Phase transition from liquid water to water vapor absorbs immense latent heat from the source surface, cooling the surface and storing thermal potential in the air parcel.',
    governingLaws: [
      "First Law of Thermodynamics: dQ = dU + dW",
      "Clausius-Clapeyron Equation: d(e_s)/dT = (L_v * e_s) / (R_v * T²)",
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Molecular Escape Velocity',
        description: 'Higher-energy water molecules at the water-air interface break free of hydrogen bonds into the gas phase.',
      },
      {
        stepNumber: 2,
        title: 'Surface Evaporative Cooling',
        description: 'Escape of high-energy molecules reduces average kinetic energy of remaining liquid, producing evaporative chilling.',
        physicsFormula: 'Heat Extracted = m × L_v (2500 J per gram evaporated)',
      },
      {
        stepNumber: 3,
        title: 'Atmospheric Latent Heat Storage',
        description: 'Latent heat remains hidden within the vapor without raising its sensible temperature.',
      },
      {
        stepNumber: 4,
        title: 'Release Upon Cloud Condensation',
        description: 'When vapor condenses into clouds aloft, the latent heat is released into surrounding air, fueling thunderstorm updrafts and cyclone engines.',
      },
    ],
  },
  {
    id: 'condensation-dew-point',
    title: 'Condensation, Dew Point & Lifting Condensation Level (LCL)',
    subTitle: 'Reaching Saturation and the Role of Cloud Condensation Nuclei (CCN)',
    targetClassLevels: 'Classes 9–12',
    summary:
      'Air becomes saturated when its actual vapor pressure equals its saturation vapor pressure (RH = 100%). Condensation requires microscopic aerosols (CCN).',
    governingLaws: [
      'Kelvin Equation (Curvature effect on droplet vapor pressure)',
      'Raoult Law (Solute effect of hygroscopic sea-salt aerosols)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Adiabatic Cooling in Rising Parcel',
        description: 'An air parcel expands against lower surrounding pressure as it ascends, doing work and cooling at 9.8 °C/km.',
      },
      {
        stepNumber: 2,
        title: 'Reaching the Dew Point (LCL)',
        description: 'The parcel reaches its Lifting Condensation Level (LCL) where temperature drops to dew point and RH hits 100%.',
        physicsFormula: 'LCL Height (m) ≈ 125 × (T_dry - T_dew)',
      },
      {
        stepNumber: 3,
        title: 'Aerosol Nucleation (CCN)',
        description: 'Vapor condenses onto hygroscopic nuclei (sea salt, sulfate particles, mineral dust). Homogeneous nucleation without CCN requires extreme >300% supersaturation.',
      },
      {
        stepNumber: 4,
        title: 'Transition to Saturated Adiabatic Lapse Rate (SALR)',
        description: 'Released latent heat reduces subsequent cooling rate to SALR (~4 to 6 °C/km), increasing parcel buoyancy.',
      },
    ],
  },
  {
    id: 'precipitation-processes',
    title: 'Precipitation Physics: Collision-Coalescence vs Bergeron Process',
    subTitle: 'How Microscopic Droplets (20 µm) Grow 100-Fold Into Raindrops (2 mm)',
    targetClassLevels: 'Classes 10–12 & College Geography',
    summary:
      'Cloud droplets fall too slowly (~1 cm/s) to reach the ground without evaporating. Two distinct mechanisms generate precipitation depending on cloud temperature.',
    governingLaws: [
      'Stokes Law of Terminal Fall Velocity',
      'Wegener-Bergeron-Findeisen Ice-Crystal Growth Mechanism',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Warm Cloud Process: Collision-Coalescence (T > 0°C)',
        description: 'Larger droplets have higher terminal fall velocities, sweeping up and merging with smaller droplets in their path.',
        physicsFormula: 'Terminal Velocity v_t ∝ r² (Stokes Regime)',
      },
      {
        stepNumber: 2,
        title: 'Cold Cloud Process: Bergeron-Findeisen (T < 0°C)',
        description: 'Mixed clouds contain supercooled water droplets and rare ice crystals. Saturation vapor pressure over ice is lower than over liquid water, causing water droplets to evaporate while vapor deposits rapidly onto ice crystals.',
        physicsFormula: 'e_s(liquid) > e_s(ice) at all T < 0 °C',
      },
      {
        stepNumber: 3,
        title: 'Accretion & Aggregation',
        description: 'Falling ice crystals collide with supercooled droplets (riming/graupel) or tangle with other crystals to form snowflakes.',
      },
      {
        stepNumber: 4,
        title: 'Melting Level & Raindrop Formation',
        description: 'When falling crystals cross the 0°C freezing level, they melt into raindrops before reaching the surface.',
      },
    ],
  },
  {
    id: 'air-pressure-gradient',
    title: 'Atmospheric Pressure & Barometric Pressure Gradient',
    subTitle: 'Isobars, Hydrostatic Balance, and Horizontal Pressure Gradient Force',
    targetClassLevels: 'Classes 8–11',
    summary:
      'Atmospheric pressure is the weight of the overlying column of air. Horizontal differences in pressure generate the fundamental driving force of all winds.',
    governingLaws: [
      'Hydrostatic Equation: dP/dz = -ρ × g',
      'Horizontal Pressure Gradient Force: F_pg = -(1/ρ) × (ΔP / Δd)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Hydrostatic Balance',
        description: 'Under calm conditions, upward vertical pressure gradient force exactly balances downward gravitational pull.',
      },
      {
        stepNumber: 2,
        title: 'Isobars on Weather Maps',
        description: 'Lines connecting points of equal atmospheric pressure, typically drawn at 2 hPa or 4 hPa intervals on synoptic charts.',
      },
      {
        stepNumber: 3,
        title: 'Pressure Gradient Force (PGF)',
        description: 'Directed strictly perpendicular (90°) to isobars from High pressure to Low pressure. Closely spaced isobars = steep gradient = strong winds.',
      },
      {
        stepNumber: 4,
        title: 'Vertical Pressure Decay',
        description: 'Air density decreases rapidly with height; half of the entire atmospheric mass lies below 5.5 km (500 hPa level).',
      },
    ],
  },
  {
    id: 'wind-dynamics',
    title: 'Wind Dynamics: Coriolis Force, Ferrel’s Law & Friction',
    subTitle: 'From Pressure Gradient to Geostrophic and Surface Winds',
    targetClassLevels: 'Classes 9–12',
    summary:
      'Air does not blow directly from High to Low because Earth rotation introduces the Coriolis deflection, deflecting winds to the right in the Northern Hemisphere.',
    governingLaws: [
      'Coriolis Force: F_c = 2 × v × ω × sin(latitude)',
      "Ferrel's Law: Winds deflect right in Northern Hemisphere, left in Southern",
      "Buys Ballot's Law: In Northern Hemisphere, stand with back to wind and Low is on your left",
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pressure Gradient Initiation',
        description: 'Air parcel begins accelerating directly toward the low-pressure center under PGF.',
      },
      {
        stepNumber: 2,
        title: 'Coriolis Deflection',
        description: 'As velocity increases, Coriolis force deflects the parcel to the right (Northern Hemisphere). Zero at Equator, maximum at Poles.',
      },
      {
        stepNumber: 3,
        title: 'Geostrophic Wind (Upper Troposphere)',
        description: 'Above the 1 km friction layer, PGF and Coriolis reach exact equilibrium, flowing parallel to straight isobars.',
        physicsFormula: 'v_g = (1 / (2 × ρ × ω × sin φ)) × (ΔP / Δd)',
      },
      {
        stepNumber: 4,
        title: 'Surface Friction & Cross-Isobar Inflow',
        description: 'Surface drag slows wind speed, reducing Coriolis force. PGF dominates, causing surface winds to angle 15°–30° across isobars into the Low.',
      },
      {
        stepNumber: 5,
        title: 'Diurnal Local Wind Systems',
        description: 'Land and sea breezes occur due to differential heating; anabatic (upslope) and katabatic (downslope gravity) winds operate in mountain valleys.',
      },
    ],
  },
  {
    id: 'humidity-types',
    title: 'Atmospheric Moisture: Absolute, Specific & Relative Humidity',
    subTitle: 'Physical Metrics of Water Vapor Concentration in Air Parcels',
    targetClassLevels: 'Classes 8–11',
    summary:
      'Distinguishes three distinct measures of atmospheric moisture and explains why Relative Humidity varies inversely with diurnal temperature.',
    governingLaws: [
      'Ideal Gas Law for Water Vapor: e = ρ_v × R_v × T',
      'Clausius-Clapeyron Exponential Temperature Dependency',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Absolute Humidity (AH)',
        description: 'Actual mass of water vapor per unit volume of air (grams per cubic metre: g/m³). Changes if air parcel expands or compresses.',
        physicsFormula: 'AH = m_v / V (g/m³)',
      },
      {
        stepNumber: 2,
        title: 'Specific Humidity (q)',
        description: 'Mass of water vapor per unit mass of total air (g/kg). Conservative property: does not change with expansion or elevation changes.',
        physicsFormula: 'q = m_v / (m_dry + m_v) ≈ 0.622 × (e / P)',
      },
      {
        stepNumber: 3,
        title: 'Relative Humidity (RH)',
        description: 'Ratio of actual vapor pressure to saturation vapor pressure at that temperature, expressed as a percentage.',
        physicsFormula: 'RH = (e / e_s(T)) × 100%',
      },
      {
        stepNumber: 4,
        title: 'Diurnal Inverse Temperature Relationship',
        description: 'Even with constant moisture content, RH reaches its daily maximum around sunrise (coldest temperature) and daily minimum in mid-afternoon (hottest temperature).',
      },
    ],
  },
  {
    id: 'cloud-genera',
    title: 'Cloud Classification: The 10 Primary Genera (WMO Standard)',
    subTitle: 'Morphology, Altitude Levels, and Synoptic Weather Associations',
    targetClassLevels: 'Classes 7–12',
    summary:
      'Luke Howard (1803) international cloud classification adopted by the World Meteorological Organization, organized by altitude étages and morphology.',
    governingLaws: [
      'High Clouds (Cirro-, > 6,000 m, pure ice crystals)',
      'Middle Clouds (Alto-, 2,000–6,000 m, mixed water/ice)',
      'Low Clouds (Strato-, 0–2,000 m, water droplets)',
      'Clouds with Vertical Development (Cumulo-, base < 2 km, top up to 18 km)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'High Étage (Cirrus Ci, Cirrocumulus Cc, Cirrostratus Cs)',
        description: 'Wispy feather-like clouds of ice crystals. Cirrostratus produces distinctive 22° halos around the sun/moon, indicating an approaching warm front or depression.',
      },
      {
        stepNumber: 2,
        title: 'Middle Étage (Altocumulus Ac, Altostratus As)',
        description: 'Altocumulus displays fleece-like rolls or patches ("mackerel sky"). Altostratus creates a uniform grey sheet where the sun shines dimly as through ground glass.',
      },
      {
        stepNumber: 3,
        title: 'Low Étage (Stratocumulus Sc, Stratus St, Nimbostratus Ns)',
        description: 'Stratus forms low uniform grey blankets often causing drizzle. Nimbostratus is a dark, thick rain-bearing layer producing continuous steady precipitation.',
      },
      {
        stepNumber: 4,
        title: 'Vertical Development (Cumulus Cu, Cumulonimbus Cb)',
        description: 'Cumulus are fluffy fair-weather cotton-wool heaps. Cumulonimbus ("King of Clouds") towers into anvil tops at the tropopause (16–18 km in tropics), producing lightning, thunder, hail, and squalls.',
      },
    ],
  },
  {
    id: 'indian-monsoon-mechanism',
    title: 'Dynamic Mechanism of the Indian Monsoon',
    subTitle: 'Thermal Contrast, Tibetan Plateau, ITCZ Shift & Upper Air Jet Streams',
    targetClassLevels: 'Classes 9–12 & Civil Services / Geography Olympiad',
    summary:
      'Modern meteorological understanding of the Southwest Monsoon: a planetary-scale heat engine driven by land-sea thermal contrasts, the elevated heating of the Tibetan Plateau, seasonal ITCZ migration, and coupled upper-air jet streams.',
    governingLaws: [
      'Thermal Tibetan Anticyclone (Flohn & Koteswaram Hypothesis)',
      'Cross-Equatorial Somali Jet Stream (Findlater)',
      'Tropical Easterly Jet Stream (TEJ) Upper Divergence',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Intense Summer Heating of Indian Landmass',
        description: 'In May–June, interior India heats to >45°C, establishing an intense low-pressure cell (thermal trough) over Northwest India (Thar / Pakistan).',
      },
      {
        stepNumber: 2,
        title: 'Elevated Heat Engine of the Tibetan Plateau',
        description: 'The vast 4,500 m high Tibetan Plateau absorbs intense solar radiation, acting as an elevated heat source that generates a strong warm anticyclone in the upper troposphere (200 hPa).',
      },
      {
        stepNumber: 3,
        title: 'Northward Migration of the ITCZ (Monsoon Trough)',
        description: 'The Inter-Tropical Convergence Zone (ITCZ) shifts from the Equator to 20°N–25°N over the Indo-Gangetic Plains, forming the Monsoon Trough.',
      },
      {
        stepNumber: 4,
        title: 'Cross-Equatorial Surge & Coriolis Deflection',
        description: 'Southeast Trade Winds from the Southern Hemisphere cross the Equator into the Indian Ocean; Coriolis deflection bends them to the right, transforming them into the moisture-laden Southwest Monsoon.',
      },
      {
        stepNumber: 5,
        title: 'Upper Tropospheric Jets Trigger Onset',
        description: 'The Subtropical Westerly Jet (STWJ) abruptly withdraws north of the Himalayas, while the Tropical Easterly Jet (TEJ) forms at 150 hPa, creating upper-level divergence that triggers the monsoon burst over Kerala.',
      },
    ],
  },
  {
    id: 'tropical-cyclone',
    title: 'Tropical Cyclone Genesis and Structural Anatomy',
    subTitle: 'Thermodynamics of Bay of Bengal & Arabian Sea Severe Storms',
    targetClassLevels: 'Classes 10–12 & Disaster Management',
    summary:
      'Intense cyclonic vortex formed over warm tropical oceans ($SST > 26.5^\circ\text{C}$), driven by latent heat release from deep convective towers around a calm central eye.',
    governingLaws: [
      'Carnot Heat Engine thermodynamic cycle for tropical storms (Emanuel Model)',
      'Angular Momentum Conservation: v × r ≈ constant near eyewall',
      'Hydrostatic & Gradient Wind Balance in curved isobaric flow',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Genesis Pre-Conditions',
        description: 'Warm sea surface temperature > 26.5°C down to 50 m depth; Coriolis parameter > 5° latitude from Equator; low vertical wind shear (< 10 m/s); high mid-tropospheric humidity.',
      },
      {
        stepNumber: 2,
        title: 'Low-Level Convergence & Vortex Spin-Up',
        description: 'Convergence of moist air feeds spiraling thunderstorms; latent heat release drops central atmospheric pressure, accelerating cyclostrophic wind inflow.',
      },
      {
        stepNumber: 3,
        title: 'The Eye (Central Calm)',
        description: 'Circular central zone (20–50 km diameter) of subsiding air, cloud-free or thin cirrus, light winds, and lowest barometric pressure.',
      },
      {
        stepNumber: 4,
        title: 'The Eyewall (Deadliest Zone)',
        description: 'Dense ring of cumulonimbus towers enclosing the eye, exhibiting maximum sustained winds, torrential deluges, and violent turbulence.',
      },
      {
        stepNumber: 5,
        title: 'Spiral Rainbands & Storm Surge',
        description: 'Convective feeder bands radiating hundreds of kilometres outward; powerful onshore winds push sea water inland, creating destructive storm surges.',
      },
      {
        stepNumber: 6,
        title: 'Landfall & Decay',
        description: 'Upon crossing coast, cyclone loses its warm ocean moisture source; increased surface roughness/friction dissipates the vortex within 24–48 hours.',
      },
    ],
  },
];

// ─── 7. IMD Climatological Station Directory (35+ Major Cities) ──────────────

export const CLIMATE_STATIONS: ClimateStationData[] = [
  // ── North India ──
  {
    id: 'stn-new-delhi',
    name: 'New Delhi (Safdarjung)',
    state: 'National Capital Territory of Delhi',
    zone: 'North',
    lat: 28.584,
    lon: 77.206,
    elevationM: 216,
    koppenCode: 'Cwg',
    annualRainfallMm: 774,
    monsoonRainfallMm: 607,
    meanMaxTempC: 39.5, // Summer
    meanMinTempC: 7.6,  // Winter
    meanRelativeHumidityPct: 62,
    annualSunshineHours: 2685,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Severe summer heatwaves (>45°C); winter fog and cold waves driven by Western Disturbances.',
  },
  {
    id: 'stn-srinagar',
    name: 'Srinagar',
    state: 'Jammu & Kashmir',
    zone: 'North',
    lat: 34.083,
    lon: 74.797,
    elevationM: 1587,
    koppenCode: 'Cwg',
    annualRainfallMm: 710,
    monsoonRainfallMm: 180,
    meanMaxTempC: 30.1,
    meanMinTempC: -2.0,
    meanRelativeHumidityPct: 71,
    annualSunshineHours: 2430,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Kashmir Valley temperate climate; receives highest precipitation in winter and spring via Western Disturbances.',
  },
  {
    id: 'stn-leh',
    name: 'Leh (Ladakh)',
    state: 'Ladakh',
    zone: 'North',
    lat: 34.152,
    lon: 77.577,
    elevationM: 3514,
    koppenCode: 'E',
    annualRainfallMm: 102,
    monsoonRainfallMm: 38,
    meanMaxTempC: 25.0,
    meanMinTempC: -14.4,
    meanRelativeHumidityPct: 44,
    annualSunshineHours: 3120,
    droughtProne: true,
    cycloneVulnerable: false,
    notes: 'High-altitude cold desert in the rain shadow of the Great Himalayas; extreme winter frost.',
  },
  {
    id: 'stn-shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    zone: 'North',
    lat: 31.104,
    lon: 77.173,
    elevationM: 2205,
    koppenCode: 'Cwg',
    annualRainfallMm: 1575,
    monsoonRainfallMm: 1050,
    meanMaxTempC: 24.1,
    meanMinTempC: 2.2,
    meanRelativeHumidityPct: 66,
    annualSunshineHours: 2480,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Subtropical highland climate; substantial monsoon rains and winter snowfall.',
  },
  {
    id: 'stn-dehradun',
    name: 'Dehradun',
    state: 'Uttarakhand',
    zone: 'North',
    lat: 30.316,
    lon: 78.032,
    elevationM: 682,
    koppenCode: 'Cwg',
    annualRainfallMm: 2209,
    monsoonRainfallMm: 1820,
    meanMaxTempC: 35.8,
    meanMinTempC: 6.2,
    meanRelativeHumidityPct: 70,
    annualSunshineHours: 2510,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Doon Valley foothill climate with heavy orographic monsoon rainfall.',
  },
  {
    id: 'stn-lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    zone: 'North',
    lat: 26.846,
    lon: 80.946,
    elevationM: 123,
    koppenCode: 'Cwg',
    annualRainfallMm: 990,
    monsoonRainfallMm: 855,
    meanMaxTempC: 40.5,
    meanMinTempC: 7.5,
    meanRelativeHumidityPct: 65,
    annualSunshineHours: 2650,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Central Ganga plain; hot summer loo winds followed by monsoon depression deluges.',
  },
  {
    id: 'stn-jaipur',
    name: 'Jaipur (Sanganer)',
    state: 'Rajasthan',
    zone: 'North',
    lat: 26.912,
    lon: 75.787,
    elevationM: 390,
    koppenCode: 'BShw',
    annualRainfallMm: 602,
    monsoonRainfallMm: 520,
    meanMaxTempC: 41.2,
    meanMinTempC: 8.4,
    meanRelativeHumidityPct: 52,
    annualSunshineHours: 2980,
    droughtProne: true,
    cycloneVulnerable: false,
    notes: 'Semi-arid eastern Rajasthan margin with high summer diurnal temperature variation.',
  },
  {
    id: 'stn-jodhpur',
    name: 'Jodhpur',
    state: 'Rajasthan',
    zone: 'North',
    lat: 26.238,
    lon: 73.024,
    elevationM: 224,
    koppenCode: 'BWhw',
    annualRainfallMm: 362,
    monsoonRainfallMm: 310,
    meanMaxTempC: 42.6,
    meanMinTempC: 9.6,
    meanRelativeHumidityPct: 46,
    annualSunshineHours: 3220,
    droughtProne: true,
    cycloneVulnerable: false,
    notes: 'Thar desert fringe; highly erratic monsoon rainfall and severe moisture deficit.',
  },

  // ── West & Central India ──
  {
    id: 'stn-mumbai',
    name: 'Mumbai (Colaba / Santacruz)',
    state: 'Maharashtra',
    zone: 'West',
    lat: 18.906,
    lon: 72.814,
    elevationM: 14,
    koppenCode: 'Amw',
    annualRainfallMm: 2422,
    monsoonRainfallMm: 2260,
    meanMaxTempC: 33.4,
    meanMinTempC: 17.5,
    meanRelativeHumidityPct: 76,
    annualSunshineHours: 2710,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Konkan coastal tropical climate with intense Arabian Sea monsoon downpours.',
  },
  {
    id: 'stn-pune',
    name: 'Pune',
    state: 'Maharashtra',
    zone: 'West',
    lat: 18.520,
    lon: 73.856,
    elevationM: 560,
    koppenCode: 'BShw',
    annualRainfallMm: 722,
    monsoonRainfallMm: 620,
    meanMaxTempC: 37.5,
    meanMinTempC: 11.2,
    meanRelativeHumidityPct: 58,
    annualSunshineHours: 2840,
    droughtProne: true,
    cycloneVulnerable: false,
    notes: 'Deccan plateau rain shadow immediately leeward of the Western Ghats crest.',
  },
  {
    id: 'stn-nagpur',
    name: 'Nagpur',
    state: 'Maharashtra',
    zone: 'Central',
    lat: 21.145,
    lon: 79.088,
    elevationM: 310,
    koppenCode: 'Aw',
    annualRainfallMm: 1161,
    monsoonRainfallMm: 1010,
    meanMaxTempC: 43.1,
    meanMinTempC: 12.8,
    meanRelativeHumidityPct: 59,
    annualSunshineHours: 2790,
    droughtProne: true,
    cycloneVulnerable: false,
    notes: 'Geographical center of India; extreme summer continental heat (>46°C).',
  },
  {
    id: 'stn-bhopal',
    name: 'Bhopal (Bairagarh)',
    state: 'Madhya Pradesh',
    zone: 'Central',
    lat: 23.259,
    lon: 77.412,
    elevationM: 523,
    koppenCode: 'Cwg',
    annualRainfallMm: 1146,
    monsoonRainfallMm: 1030,
    meanMaxTempC: 41.0,
    meanMinTempC: 10.5,
    meanRelativeHumidityPct: 56,
    annualSunshineHours: 2820,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Malwa plateau subtropical climate receiving robust monsoon rainfall.',
  },
  {
    id: 'stn-ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    zone: 'West',
    lat: 23.022,
    lon: 72.571,
    elevationM: 55,
    koppenCode: 'BShw',
    annualRainfallMm: 751,
    monsoonRainfallMm: 700,
    meanMaxTempC: 42.0,
    meanMinTempC: 12.5,
    meanRelativeHumidityPct: 55,
    annualSunshineHours: 2950,
    droughtProne: true,
    cycloneVulnerable: true,
    notes: 'Semi-arid hot climate prone to intense monsoon depressions from the Gulf of Khambhat.',
  },
  {
    id: 'stn-panaji',
    name: 'Panaji (Goa)',
    state: 'Goa',
    zone: 'West',
    lat: 15.498,
    lon: 73.827,
    elevationM: 15,
    koppenCode: 'Amw',
    annualRainfallMm: 2932,
    monsoonRainfallMm: 2680,
    meanMaxTempC: 33.0,
    meanMinTempC: 20.0,
    meanRelativeHumidityPct: 79,
    annualSunshineHours: 2610,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Per-humid tropical monsoon coast; receives torrential rain from June to September.',
  },

  // ── South India ──
  {
    id: 'stn-bengaluru',
    name: 'Bengaluru (HAL)',
    state: 'Karnataka',
    zone: 'South',
    lat: 12.971,
    lon: 77.594,
    elevationM: 920,
    koppenCode: 'Aw',
    annualRainfallMm: 986,
    monsoonRainfallMm: 560,
    meanMaxTempC: 34.2,
    meanMinTempC: 15.8,
    meanRelativeHumidityPct: 65,
    annualSunshineHours: 2730,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Mysore plateau tropical savanna; moderate temperate year-round conditions.',
  },
  {
    id: 'stn-chennai',
    name: 'Chennai (Meenambakkam)',
    state: 'Tamil Nadu',
    zone: 'South',
    lat: 13.082,
    lon: 80.270,
    elevationM: 16,
    koppenCode: 'As',
    annualRainfallMm: 1400,
    monsoonRainfallMm: 440,
    meanMaxTempC: 37.8,
    meanMinTempC: 21.0,
    meanRelativeHumidityPct: 75,
    annualSunshineHours: 2690,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Coromandel Coast tropical climate; receives ~60% of its rain during the Northeast (Post-Monsoon) season (Oct–Dec) and Bay of Bengal cyclones.',
  },
  {
    id: 'stn-hyderabad',
    name: 'Hyderabad (Begumpet)',
    state: 'Telangana',
    zone: 'South',
    lat: 17.385,
    lon: 78.486,
    elevationM: 545,
    koppenCode: 'BShw',
    annualRainfallMm: 812,
    monsoonRainfallMm: 610,
    meanMaxTempC: 39.8,
    meanMinTempC: 14.5,
    meanRelativeHumidityPct: 57,
    annualSunshineHours: 2780,
    droughtProne: true,
    cycloneVulnerable: false,
    notes: 'Deccan plateau semi-arid steppe with warm dry winters and hot summer spells.',
  },
  {
    id: 'stn-visakhapatnam',
    name: 'Visakhapatnam (Waltair)',
    state: 'Andhra Pradesh',
    zone: 'South',
    lat: 17.686,
    lon: 83.218,
    elevationM: 12,
    koppenCode: 'Aw',
    annualRainfallMm: 1118,
    monsoonRainfallMm: 650,
    meanMaxTempC: 34.5,
    meanMinTempC: 18.2,
    meanRelativeHumidityPct: 77,
    annualSunshineHours: 2750,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'East Coast port city highly vulnerable to severe cyclonic storms in October-November.',
  },
  {
    id: 'stn-kochi',
    name: 'Kochi (Willingdon Island)',
    state: 'Kerala',
    zone: 'South',
    lat: 9.931,
    lon: 76.267,
    elevationM: 3,
    koppenCode: 'Amw',
    annualRainfallMm: 3015,
    monsoonRainfallMm: 2050,
    meanMaxTempC: 32.5,
    meanMinTempC: 22.8,
    meanRelativeHumidityPct: 83,
    annualSunshineHours: 2580,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Malabar Coast entry point of Southwest Monsoon (normal onset: 1 June); heavy dual monsoon rains.',
  },
  {
    id: 'stn-thiruvananthapuram',
    name: 'Thiruvananthapuram',
    state: 'Kerala',
    zone: 'South',
    lat: 8.524,
    lon: 76.936,
    elevationM: 64,
    koppenCode: 'Amw',
    annualRainfallMm: 1827,
    monsoonRainfallMm: 980,
    meanMaxTempC: 32.8,
    meanMinTempC: 22.2,
    meanRelativeHumidityPct: 81,
    annualSunshineHours: 2620,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Southern tip of peninsular India; experiences both SW and NE monsoon rainfall.',
  },

  // ── East India ──
  {
    id: 'stn-kolkata',
    name: 'Kolkata (Alipore)',
    state: 'West Bengal',
    zone: 'East',
    lat: 22.572,
    lon: 88.363,
    elevationM: 9,
    koppenCode: 'Aw',
    annualRainfallMm: 1800,
    monsoonRainfallMm: 1280,
    meanMaxTempC: 36.2,
    meanMinTempC: 13.8,
    meanRelativeHumidityPct: 78,
    annualSunshineHours: 2540,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Ganges Delta humid tropical climate prone to Kalbaisakhi (Nor’westers) in April–May and severe Bay cyclones.',
  },
  {
    id: 'stn-bhubaneswar',
    name: 'Bhubaneswar',
    state: 'Odisha',
    zone: 'East',
    lat: 20.296,
    lon: 85.824,
    elevationM: 45,
    koppenCode: 'Aw',
    annualRainfallMm: 1542,
    monsoonRainfallMm: 1140,
    meanMaxTempC: 38.0,
    meanMinTempC: 15.5,
    meanRelativeHumidityPct: 74,
    annualSunshineHours: 2600,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Coastal Odisha plain with recurring high-intensity tropical cyclone landfall risk.',
  },
  {
    id: 'stn-patna',
    name: 'Patna',
    state: 'Bihar',
    zone: 'East',
    lat: 25.594,
    lon: 85.137,
    elevationM: 53,
    koppenCode: 'Cwg',
    annualRainfallMm: 1130,
    monsoonRainfallMm: 980,
    meanMaxTempC: 39.2,
    meanMinTempC: 9.0,
    meanRelativeHumidityPct: 68,
    annualSunshineHours: 2620,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Middle Ganga basin; subject to major monsoon flooding from Himalayan tributaries (Kosi, Gandak).',
  },
  {
    id: 'stn-ranchi',
    name: 'Ranchi',
    state: 'Jharkhand',
    zone: 'East',
    lat: 23.344,
    lon: 85.309,
    elevationM: 651,
    koppenCode: 'Cwg',
    annualRainfallMm: 1430,
    monsoonRainfallMm: 1160,
    meanMaxTempC: 37.2,
    meanMinTempC: 10.3,
    meanRelativeHumidityPct: 64,
    annualSunshineHours: 2690,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Chota Nagpur plateau highland climate with pleasant summers and heavy monsoon showers.',
  },
  {
    id: 'stn-raipur',
    name: 'Raipur (Mana)',
    state: 'Chhattisgarh',
    zone: 'East',
    lat: 21.251,
    lon: 81.629,
    elevationM: 298,
    koppenCode: 'Aw',
    annualRainfallMm: 1330,
    monsoonRainfallMm: 1180,
    meanMaxTempC: 42.5,
    meanMinTempC: 13.0,
    meanRelativeHumidityPct: 60,
    annualSunshineHours: 2750,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Mahanadi plain rice bowl; hot summers followed by steady monsoon rainfall.',
  },

  // ── Northeast India ──
  {
    id: 'stn-cherrapunji',
    name: 'Cherrapunji (Sohra)',
    state: 'Meghalaya',
    zone: 'Northeast',
    lat: 25.270,
    lon: 91.732,
    elevationM: 1313,
    koppenCode: 'Cwg',
    annualRainfallMm: 11777,
    monsoonRainfallMm: 8900,
    meanMaxTempC: 23.5,
    meanMinTempC: 8.0,
    meanRelativeHumidityPct: 88,
    annualSunshineHours: 1980,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'World record rainfall holder alongside nearby Mawsynram; extreme orographic funneling of Bay of Bengal monsoon against Khasi Hills.',
  },
  {
    id: 'stn-shillong',
    name: 'Shillong',
    state: 'Meghalaya',
    zone: 'Northeast',
    lat: 25.578,
    lon: 91.893,
    elevationM: 1525,
    koppenCode: 'Cwg',
    annualRainfallMm: 2253,
    monsoonRainfallMm: 1650,
    meanMaxTempC: 24.0,
    meanMinTempC: 5.5,
    meanRelativeHumidityPct: 80,
    annualSunshineHours: 2240,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Khasi Hills plateau capital ("Scotland of the East") in partial rain shadow of Sohra scarp.',
  },
  {
    id: 'stn-guwahati',
    name: 'Guwahati (Borjhar)',
    state: 'Assam',
    zone: 'Northeast',
    lat: 26.144,
    lon: 91.736,
    elevationM: 55,
    koppenCode: 'Cwg',
    annualRainfallMm: 1722,
    monsoonRainfallMm: 1230,
    meanMaxTempC: 33.5,
    meanMinTempC: 10.6,
    meanRelativeHumidityPct: 81,
    annualSunshineHours: 2380,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Brahmaputra Valley humid subtropical climate with severe pre-monsoon thunderstorms (Bardoisila) and recurring river floods.',
  },
  {
    id: 'stn-agartala',
    name: 'Agartala',
    state: 'Tripura',
    zone: 'Northeast',
    lat: 23.831,
    lon: 91.286,
    elevationM: 15,
    koppenCode: 'Amw',
    annualRainfallMm: 2200,
    monsoonRainfallMm: 1450,
    meanMaxTempC: 34.0,
    meanMinTempC: 10.5,
    meanRelativeHumidityPct: 80,
    annualSunshineHours: 2460,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Tripura plains bordering Bangladesh; high humidity and heavy early monsoon onset.',
  },
  {
    id: 'stn-gangtok',
    name: 'Gangtok',
    state: 'Sikkim',
    zone: 'Northeast',
    lat: 27.338,
    lon: 88.606,
    elevationM: 1650,
    koppenCode: 'Cwg',
    annualRainfallMm: 3580,
    monsoonRainfallMm: 2720,
    meanMaxTempC: 22.8,
    meanMinTempC: 4.0,
    meanRelativeHumidityPct: 86,
    annualSunshineHours: 1890,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Eastern Himalayan mountain climate with perpetual mist, fog, and massive monsoon downpours.',
  },
  {
    id: 'stn-itanagar',
    name: 'Itanagar',
    state: 'Arunachal Pradesh',
    zone: 'Northeast',
    lat: 27.084,
    lon: 93.605,
    elevationM: 320,
    koppenCode: 'Dfc',
    annualRainfallMm: 2865,
    monsoonRainfallMm: 2150,
    meanMaxTempC: 31.0,
    meanMinTempC: 8.5,
    meanRelativeHumidityPct: 84,
    annualSunshineHours: 2150,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Sub-Himalayan foothill rainforest climate with extremely dense vegetation and cloud cover.',
  },
  {
    id: 'stn-imphal',
    name: 'Imphal',
    state: 'Manipur',
    zone: 'Northeast',
    lat: 24.817,
    lon: 93.936,
    elevationM: 781,
    koppenCode: 'Cwg',
    annualRainfallMm: 1380,
    monsoonRainfallMm: 890,
    meanMaxTempC: 30.5,
    meanMinTempC: 4.8,
    meanRelativeHumidityPct: 78,
    annualSunshineHours: 2450,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Manipur intermontane valley basin; mild pleasant climate sheltered by surrounding mountain ridges.',
  },
  {
    id: 'stn-kohima',
    name: 'Kohima',
    state: 'Nagaland',
    zone: 'Northeast',
    lat: 25.675,
    lon: 94.108,
    elevationM: 1444,
    koppenCode: 'Cwg',
    annualRainfallMm: 1840,
    monsoonRainfallMm: 1350,
    meanMaxTempC: 25.2,
    meanMinTempC: 5.0,
    meanRelativeHumidityPct: 82,
    annualSunshineHours: 2210,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Naga Hills ridge climate with frequent cloud immersion and cold winter nights.',
  },
  {
    id: 'stn-aizawl',
    name: 'Aizawl',
    state: 'Mizoram',
    zone: 'Northeast',
    lat: 23.727,
    lon: 92.717,
    elevationM: 1132,
    koppenCode: 'Cwg',
    annualRainfallMm: 2180,
    monsoonRainfallMm: 1540,
    meanMaxTempC: 27.5,
    meanMinTempC: 11.0,
    meanRelativeHumidityPct: 83,
    annualSunshineHours: 2320,
    droughtProne: false,
    cycloneVulnerable: false,
    notes: 'Mizo Hills ridge topography; temperate subtropical climate with heavy monsoon cloud decks.',
  },

  // ── Indian Island Territories ──
  {
    id: 'stn-port-blair',
    name: 'Port Blair',
    state: 'Andaman & Nicobar Islands',
    zone: 'Islands',
    lat: 11.623,
    lon: 92.726,
    elevationM: 16,
    koppenCode: 'Amw',
    annualRainfallMm: 3180,
    monsoonRainfallMm: 2120,
    meanMaxTempC: 32.2,
    meanMinTempC: 22.0,
    meanRelativeHumidityPct: 82,
    annualSunshineHours: 2410,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'South Andaman tropical maritime climate; receives the earliest onset of the Southwest Monsoon (~15–20 May).',
  },
  {
    id: 'stn-kavaratti',
    name: 'Kavaratti (Lakshadweep)',
    state: 'Lakshadweep',
    zone: 'Islands',
    lat: 10.566,
    lon: 72.641,
    elevationM: 2,
    koppenCode: 'Amw',
    annualRainfallMm: 1640,
    monsoonRainfallMm: 1120,
    meanMaxTempC: 32.8,
    meanMinTempC: 24.2,
    meanRelativeHumidityPct: 79,
    annualSunshineHours: 2680,
    droughtProne: false,
    cycloneVulnerable: true,
    notes: 'Coral atoll equatorial maritime climate; strong winds and heavy swells during the Southwest Monsoon.',
  },
];

/**
 * Filter stations by search keyword, zone, or drought/cyclone risk.
 */
export function filterClimateStations(params: {
  searchQuery?: string;
  zone?: string;
  droughtOnly?: boolean;
  cycloneOnly?: boolean;
}): ClimateStationData[] {
  return CLIMATE_STATIONS.filter((s) => {
    if (params.zone && params.zone !== 'all' && s.zone !== params.zone) {
      return false;
    }
    if (params.droughtOnly && !s.droughtProne) {
      return false;
    }
    if (params.cycloneOnly && !s.cycloneVulnerable) {
      return false;
    }
    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.koppenCode.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

