/**
 * Human and Economic Geography Laboratory Service
 * Stage 10: Population Geography, Agriculture, Minerals & Energy,
 * Industry, Transport & Trade, Thematic Charts & Population Pyramids.
 *
 * Educational Compliance:
 * - Authoritative standard: Census of India (Registrar General & Census Commissioner),
 *   MoA&FW (Ministry of Agriculture & Farmers Welfare), Ministry of Mines, Ministry of Coal,
 *   MoPNG, CEA (Central Electricity Authority), MoRTH, NHAI, Ministry of Ports, Shipping & Waterways.
 * - Strict reference year labeling: Never present old census statistics as current.
 *   Census of India 2011 figures are explicitly labeled as 2011, and modern projections/NFHS-5
 *   are designated with their reference surveys.
 */

// ─── 1. Core Interfaces ─────────────────────────────────────────────────────

export type HumanEconomicCategory =
  | 'population'
  | 'agriculture'
  | 'minerals-energy'
  | 'industry'
  | 'transport-trade'
  | 'charts';

export interface StateDemographicRecord {
  code: string;
  name: string;
  censusYear: number; // 2011
  populationMillions: number;
  densityPerKm2: number;
  decadalGrowthRatePct: number; // 2001-2011
  sexRatioFemalesPer1000Males: number;
  literacyRatePct: number;
  urbanizationPct: number;
  areaKm2: number;
  capital: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast' | 'UT';
  normCoords: [number, number]; // [nx, ny] in 0..1000 normalized space
}

export interface AgeCohort {
  cohort: string; // e.g. "0-4", "5-9", ...
  malePct: number;
  femalePct: number;
}

export interface DemographicPyramidModel {
  id: string;
  title: string;
  stageName: string;
  referenceYearOrEra: string;
  description: string;
  fertilityMortalityDynamics: string;
  cbseExamPoints: string;
  cohorts: AgeCohort[];
}

export interface CropDistributionModel {
  id: string;
  name: string;
  category: 'food-grain' | 'cash-crop' | 'plantation' | 'fibre';
  season: 'Kharif' | 'Rabi' | 'Zaid' | 'Perennial';
  temperatureRangeC: [number, number];
  rainfallRangeCm: [number, number];
  soilTypeRequired: string;
  topProducingStates: string[];
  shareInIndiaPct: number;
  economicSignificance: string;
  geographicLocations: Array<{ name: string; state: string; normCoords: [number, number] }>;
}

export interface MineralDepositModel {
  id: string;
  name: string;
  mineralType: 'metallic-ferrous' | 'metallic-nonferrous' | 'fossil-fuel' | 'renewable-nuclear';
  majorMinesOrFields: string[];
  statesCovered: string[];
  geologicalFormation: string;
  estimatedReservesOrCapacity: string;
  keyIndustrialUses: string;
  referenceYear: string;
  deposits: Array<{ name: string; state: string; type: string; normCoords: [number, number]; capacity?: string }>;
}

export interface IndustrialRegionModel {
  id: string;
  name: string;
  principalIndustries: string[];
  majorCentres: string[];
  favourableFactors: string[];
  challenges: string;
  normCenter: [number, number];
  normRadius: number;
}

export interface TransportNetworkModel {
  id: string;
  name: string;
  type: 'road-corridor' | 'railway-dfc' | 'major-port' | 'inland-waterway' | 'international-airport';
  lengthKmOrCapacity: string;
  nodesOrRoute: string[];
  keyTradeGoods: string[] | string;
  operationalAgency: string;
  points: Array<{ name: string; code?: string; normCoords: [number, number]; labelPos?: 'top' | 'bottom' | 'left' | 'right' }>;
  routeVectors?: Array<[number, number][]>;
}

// ─── 2. Population Geography Datasets ────────────────────────────────────────

/**
 * Official Census of India 2011 State & UT Demographic Records
 * Source: Office of the Registrar General & Census Commissioner, India (Ministry of Home Affairs).
 */
export const STATE_DEMOGRAPHICS: StateDemographicRecord[] = [
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    censusYear: 2011,
    populationMillions: 199.8,
    densityPerKm2: 829,
    decadalGrowthRatePct: 20.2,
    sexRatioFemalesPer1000Males: 912,
    literacyRatePct: 67.7,
    urbanizationPct: 22.3,
    areaKm2: 240928,
    capital: 'Lucknow',
    zone: 'North',
    normCoords: [490, 360],
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    censusYear: 2011,
    populationMillions: 112.4,
    densityPerKm2: 365,
    decadalGrowthRatePct: 16.0,
    sexRatioFemalesPer1000Males: 929,
    literacyRatePct: 82.3,
    urbanizationPct: 45.2,
    areaKm2: 307713,
    capital: 'Mumbai',
    zone: 'West',
    normCoords: [380, 580],
  },
  {
    code: 'BR',
    name: 'Bihar',
    censusYear: 2011,
    populationMillions: 104.1,
    densityPerKm2: 1106, // Highest population density among Indian states
    decadalGrowthRatePct: 25.4,
    sexRatioFemalesPer1000Males: 918,
    literacyRatePct: 61.8,
    urbanizationPct: 11.3,
    areaKm2: 94163,
    capital: 'Patna',
    zone: 'East',
    normCoords: [640, 390],
  },
  {
    code: 'WB',
    name: 'West Bengal',
    censusYear: 2011,
    populationMillions: 91.3,
    densityPerKm2: 1028,
    decadalGrowthRatePct: 13.8,
    sexRatioFemalesPer1000Males: 950,
    literacyRatePct: 76.3,
    urbanizationPct: 31.9,
    areaKm2: 88752,
    capital: 'Kolkata',
    zone: 'East',
    normCoords: [710, 470],
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    censusYear: 2011,
    populationMillions: 72.6,
    densityPerKm2: 236,
    decadalGrowthRatePct: 20.3,
    sexRatioFemalesPer1000Males: 931,
    literacyRatePct: 69.3,
    urbanizationPct: 27.6,
    areaKm2: 308252,
    capital: 'Bhopal',
    zone: 'Central',
    normCoords: [440, 470],
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    censusYear: 2011,
    populationMillions: 72.1,
    densityPerKm2: 555,
    decadalGrowthRatePct: 15.6,
    sexRatioFemalesPer1000Males: 996,
    literacyRatePct: 80.1,
    urbanizationPct: 48.4,
    areaKm2: 130060,
    capital: 'Chennai',
    zone: 'South',
    normCoords: [430, 840],
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    censusYear: 2011,
    populationMillions: 68.5,
    densityPerKm2: 200,
    decadalGrowthRatePct: 21.3,
    sexRatioFemalesPer1000Males: 928,
    literacyRatePct: 66.1,
    urbanizationPct: 24.9,
    areaKm2: 342239, // Largest state by area
    capital: 'Jaipur',
    zone: 'North',
    normCoords: [320, 360],
  },
  {
    code: 'KA',
    name: 'Karnataka',
    censusYear: 2011,
    populationMillions: 61.1,
    densityPerKm2: 319,
    decadalGrowthRatePct: 15.6,
    sexRatioFemalesPer1000Males: 973,
    literacyRatePct: 75.4,
    urbanizationPct: 38.7,
    areaKm2: 191791,
    capital: 'Bengaluru',
    zone: 'South',
    normCoords: [380, 750],
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    censusYear: 2011,
    populationMillions: 60.4,
    densityPerKm2: 308,
    decadalGrowthRatePct: 19.3,
    sexRatioFemalesPer1000Males: 919,
    literacyRatePct: 78.0,
    urbanizationPct: 42.6,
    areaKm2: 196024,
    capital: 'Gandhinagar',
    zone: 'West',
    normCoords: [260, 480],
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    censusYear: 2011,
    populationMillions: 49.5, // Post-bifurcation residual
    densityPerKm2: 304,
    decadalGrowthRatePct: 11.0,
    sexRatioFemalesPer1000Males: 993,
    literacyRatePct: 67.0,
    urbanizationPct: 29.5,
    areaKm2: 162970,
    capital: 'Amaravati',
    zone: 'South',
    normCoords: [490, 710],
  },
  {
    code: 'OR',
    name: 'Odisha',
    censusYear: 2011,
    populationMillions: 42.0,
    densityPerKm2: 270,
    decadalGrowthRatePct: 14.0,
    sexRatioFemalesPer1000Males: 979,
    literacyRatePct: 72.9,
    urbanizationPct: 16.7,
    areaKm2: 155707,
    capital: 'Bhubaneswar',
    zone: 'East',
    normCoords: [590, 560],
  },
  {
    code: 'KL',
    name: 'Kerala',
    censusYear: 2011,
    populationMillions: 33.4,
    densityPerKm2: 860,
    decadalGrowthRatePct: 4.9, // Lowest decadal growth among major states
    sexRatioFemalesPer1000Males: 1084, // Highest sex ratio in India
    literacyRatePct: 94.0, // Highest literacy rate in India
    urbanizationPct: 47.7,
    areaKm2: 38852,
    capital: 'Thiruvananthapuram',
    zone: 'South',
    normCoords: [390, 890],
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    censusYear: 2011,
    populationMillions: 33.0,
    densityPerKm2: 414,
    decadalGrowthRatePct: 22.4,
    sexRatioFemalesPer1000Males: 948,
    literacyRatePct: 66.4,
    urbanizationPct: 24.1,
    areaKm2: 79714,
    capital: 'Ranchi',
    zone: 'East',
    normCoords: [610, 470],
  },
  {
    code: 'AS',
    name: 'Assam',
    censusYear: 2011,
    populationMillions: 31.2,
    densityPerKm2: 398,
    decadalGrowthRatePct: 17.1,
    sexRatioFemalesPer1000Males: 958,
    literacyRatePct: 72.2,
    urbanizationPct: 14.1,
    areaKm2: 78438,
    capital: 'Dispur',
    zone: 'Northeast',
    normCoords: [810, 380],
  },
  {
    code: 'PB',
    name: 'Punjab',
    censusYear: 2011,
    populationMillions: 27.7,
    densityPerKm2: 551,
    decadalGrowthRatePct: 13.9,
    sexRatioFemalesPer1000Males: 895,
    literacyRatePct: 75.8,
    urbanizationPct: 37.5,
    areaKm2: 50362,
    capital: 'Chandigarh',
    zone: 'North',
    normCoords: [370, 240],
  },
  {
    code: 'HR',
    name: 'Haryana',
    censusYear: 2011,
    populationMillions: 25.4,
    densityPerKm2: 573,
    decadalGrowthRatePct: 19.9,
    sexRatioFemalesPer1000Males: 879, // Lowest sex ratio among major states in 2011
    literacyRatePct: 75.6,
    urbanizationPct: 34.9,
    areaKm2: 44212,
    capital: 'Chandigarh',
    zone: 'North',
    normCoords: [400, 290],
  },
  {
    code: 'DL',
    name: 'NCT of Delhi',
    censusYear: 2011,
    populationMillions: 16.8,
    densityPerKm2: 11320, // Highest population density in India
    decadalGrowthRatePct: 21.2,
    sexRatioFemalesPer1000Males: 868,
    literacyRatePct: 86.2,
    urbanizationPct: 97.5,
    areaKm2: 1483,
    capital: 'New Delhi',
    zone: 'UT',
    normCoords: [430, 310],
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    censusYear: 2011,
    populationMillions: 1.38,
    densityPerKm2: 17, // Lowest population density in India
    decadalGrowthRatePct: 26.0,
    sexRatioFemalesPer1000Males: 938,
    literacyRatePct: 65.4,
    urbanizationPct: 22.9,
    areaKm2: 83743,
    capital: 'Itanagar',
    zone: 'Northeast',
    normCoords: [870, 310],
  },
];

/**
 * Age-Sex Population Pyramids
 * Compares Demographic Transition stages (Expanding vs India Transition vs Stationary).
 */
export const POPULATION_PYRAMIDS: DemographicPyramidModel[] = [
  {
    id: 'pyr-india-2011',
    title: 'India Population Structure (Census 2011)',
    stageName: 'Stage 3: Demographically Evolving (Bulging Youth Dividend)',
    referenceYearOrEra: 'Census of India 2011',
    description:
      'Characterized by a broad base tapering towards the top with an expanding working-age bulge (15-59 years). Fertility has declined steadily towards replacement level while infant mortality has plummeted.',
    fertilityMortalityDynamics: 'TFR ~2.4, Life expectancy 67.5 years, Working age proportion >63%.',
    cbseExamPoints:
      'Explain "Demographic Dividend": India had over 60% of its population in the productive 15–59 age bracket, creating an economic growth window if backed by skilling and education.',
    cohorts: [
      { cohort: '0-4', malePct: 5.4, femalePct: 4.8 },
      { cohort: '5-9', malePct: 5.7, femalePct: 5.1 },
      { cohort: '10-14', malePct: 5.8, femalePct: 5.3 },
      { cohort: '15-19', malePct: 5.2, femalePct: 4.8 },
      { cohort: '20-24', malePct: 4.6, femalePct: 4.5 },
      { cohort: '25-29', malePct: 4.2, femalePct: 4.2 },
      { cohort: '30-34', malePct: 3.8, femalePct: 3.8 },
      { cohort: '35-39', malePct: 3.5, femalePct: 3.5 },
      { cohort: '40-44', malePct: 3.0, femalePct: 3.0 },
      { cohort: '45-49', malePct: 2.6, femalePct: 2.6 },
      { cohort: '50-54', malePct: 2.2, femalePct: 2.2 },
      { cohort: '55-59', malePct: 1.8, femalePct: 1.8 },
      { cohort: '60-64', malePct: 1.5, femalePct: 1.5 },
      { cohort: '65-69', malePct: 1.1, femalePct: 1.2 },
      { cohort: '70-74', malePct: 0.7, femalePct: 0.8 },
      { cohort: '75-79', malePct: 0.4, femalePct: 0.5 },
      { cohort: '80+', malePct: 0.4, femalePct: 0.5 },
    ],
  },
  {
    id: 'pyr-expanding-stage',
    title: 'Expanding Population Pyramid (High Birth & Death Rates)',
    stageName: 'Stage 1-2: Triangular Progressive (Youth Heavy)',
    referenceYearOrEra: 'Classical Developing Demography (e.g. Nigeria / Early India 1961)',
    description:
      'Triangular shape with very wide base indicating high birth rates, rapidly tapering towards a narrow apex indicating high child mortality and low life expectancy.',
    fertilityMortalityDynamics: 'TFR >4.5, Infant mortality >80 per 1000, Median age <19 years.',
    cbseExamPoints:
      'High dependency ratio driven by high child dependency (0-14 years). Requires massive investments in primary education and maternal/child healthcare.',
    cohorts: [
      { cohort: '0-4', malePct: 8.5, femalePct: 8.2 },
      { cohort: '5-9', malePct: 7.6, femalePct: 7.4 },
      { cohort: '10-14', malePct: 6.8, femalePct: 6.6 },
      { cohort: '15-19', malePct: 5.8, femalePct: 5.6 },
      { cohort: '20-24', malePct: 4.8, femalePct: 4.7 },
      { cohort: '25-29', malePct: 4.0, femalePct: 3.9 },
      { cohort: '30-34', malePct: 3.3, femalePct: 3.2 },
      { cohort: '35-39', malePct: 2.7, femalePct: 2.6 },
      { cohort: '40-44', malePct: 2.1, femalePct: 2.0 },
      { cohort: '45-49', malePct: 1.6, femalePct: 1.5 },
      { cohort: '50-54', malePct: 1.2, femalePct: 1.2 },
      { cohort: '55-59', malePct: 0.9, femalePct: 0.9 },
      { cohort: '60-64', malePct: 0.6, femalePct: 0.7 },
      { cohort: '65-69', malePct: 0.4, femalePct: 0.5 },
      { cohort: '70-74', malePct: 0.2, femalePct: 0.3 },
      { cohort: '75-79', malePct: 0.1, femalePct: 0.2 },
      { cohort: '80+', malePct: 0.1, femalePct: 0.1 },
    ],
  },
  {
    id: 'pyr-stationary-aging',
    title: 'Stationary / Aging Population Pyramid',
    stageName: 'Stage 4-5: Beehive / Urn Constrictive (Post-Industrial)',
    referenceYearOrEra: 'Developed Demography (e.g. Japan / Germany 2020s)',
    description:
      'Narrow base due to fertility below replacement rate (TFR < 1.5), rectangular middle, and bulging top indicating an aging population with high life expectancy (>82 years).',
    fertilityMortalityDynamics: 'TFR <1.4, Median age >48 years, Senior citizens (>60) exceed 28%.',
    cbseExamPoints:
      'Severe old-age dependency ratio, shrinking labor force, rising pension and geriatric healthcare burdens.',
    cohorts: [
      { cohort: '0-4', malePct: 2.2, femalePct: 2.1 },
      { cohort: '5-9', malePct: 2.4, femalePct: 2.3 },
      { cohort: '10-14', malePct: 2.5, femalePct: 2.4 },
      { cohort: '15-19', malePct: 2.8, femalePct: 2.7 },
      { cohort: '20-24', malePct: 3.0, femalePct: 2.9 },
      { cohort: '25-29', malePct: 3.2, femalePct: 3.1 },
      { cohort: '30-34', malePct: 3.3, femalePct: 3.2 },
      { cohort: '35-39', malePct: 3.5, femalePct: 3.4 },
      { cohort: '40-44', malePct: 3.8, femalePct: 3.7 },
      { cohort: '45-49', malePct: 4.0, femalePct: 3.9 },
      { cohort: '50-54', malePct: 3.8, femalePct: 3.7 },
      { cohort: '55-59', malePct: 3.5, femalePct: 3.5 },
      { cohort: '60-64', malePct: 3.4, femalePct: 3.5 },
      { cohort: '65-69', malePct: 3.2, femalePct: 3.5 },
      { cohort: '70-74', malePct: 2.8, femalePct: 3.2 },
      { cohort: '75-79', malePct: 2.0, femalePct: 2.6 },
      { cohort: '80+', malePct: 2.2, femalePct: 3.8 },
    ],
  },
];

// ─── 3. Agriculture Subsystem ───────────────────────────────────────────────

export const MAJOR_CROPS: CropDistributionModel[] = [
  {
    id: 'crop-rice',
    name: 'Rice (Oryza sativa) — Primary Food Grain',
    category: 'food-grain',
    season: 'Kharif',
    temperatureRangeC: [22, 32],
    rainfallRangeCm: [100, 200],
    soilTypeRequired: 'Deep clayey and loamy alluvial soils capable of retaining standing water',
    topProducingStates: ['West Bengal (14.5%)', 'Uttar Pradesh (13.8%)', 'Punjab (11.5%)', 'Andhra Pradesh'],
    shareInIndiaPct: 42.0,
    economicSignificance: 'Feeds >50% of the Indian population; staple grain of eastern and southern India.',
    geographicLocations: [
      { name: 'Burdwan (Rice Bowl of WB)', state: 'West Bengal', normCoords: [700, 460] },
      { name: 'Ganga-Ghaghara Doab', state: 'Uttar Pradesh', normCoords: [520, 360] },
      { name: 'Krishna-Godavari Delta', state: 'Andhra Pradesh', normCoords: [540, 680] },
      { name: 'Cauvery Delta', state: 'Tamil Nadu', normCoords: [450, 830] },
    ],
  },
  {
    id: 'crop-wheat',
    name: 'Wheat (Triticum aestivum) — Temperate Winter Grain',
    category: 'food-grain',
    season: 'Rabi',
    temperatureRangeC: [10, 25],
    rainfallRangeCm: [50, 75],
    soilTypeRequired: 'Well-drained fertile loamy and clayey loamy soils (Alluvial Bhangar/Khadar)',
    topProducingStates: ['Uttar Pradesh (32.0%)', 'Madhya Pradesh (20.5%)', 'Punjab (16.2%)', 'Haryana (12.0%)'],
    shareInIndiaPct: 35.0,
    economicSignificance: 'Second most important cereal; backbone of Green Revolution (HYV Mexican dwarf varieties).',
    geographicLocations: [
      { name: 'Punjab-Haryana Plain', state: 'Punjab', normCoords: [360, 250] },
      { name: 'Ganga-Yamuna Doab', state: 'Uttar Pradesh', normCoords: [430, 340] },
      { name: 'Malwa Plateau', state: 'Madhya Pradesh', normCoords: [400, 460] },
    ],
  },
  {
    id: 'crop-cotton',
    name: 'Cotton (White Gold) — Industrial Fibre',
    category: 'fibre',
    season: 'Kharif',
    temperatureRangeC: [21, 30],
    rainfallRangeCm: [50, 100],
    soilTypeRequired: 'Deep black regur basaltic soil of the Deccan trap; 210 frost-free days required',
    topProducingStates: ['Gujarat (29.5%)', 'Maharashtra (22.0%)', 'Telangana (15.0%)', 'Rajasthan'],
    shareInIndiaPct: 24.0,
    economicSignificance: 'Supplies raw material to India’s largest organized manufacturing industry (Textile mills).',
    geographicLocations: [
      { name: 'Khandesh & Vidarbha', state: 'Maharashtra', normCoords: [390, 550] },
      { name: 'Saurashtra Plain', state: 'Gujarat', normCoords: [250, 500] },
      { name: 'Deccan Cotton Belt', state: 'Telangana', normCoords: [480, 620] },
    ],
  },
  {
    id: 'crop-sugarcane',
    name: 'Sugarcane (Saccharum officinarum)',
    category: 'cash-crop',
    season: 'Perennial',
    temperatureRangeC: [21, 27],
    rainfallRangeCm: [75, 120],
    soilTypeRequired: 'Deep rich loamy, alluvial and black soils with good drainage and abundant irrigation',
    topProducingStates: ['Uttar Pradesh (45.0%)', 'Maharashtra (23.5%)', 'Karnataka (11.0%)', 'Tamil Nadu'],
    shareInIndiaPct: 18.0,
    economicSignificance: 'Raw material for sugar mills and bio-ethanol blending program (E20 mandate).',
    geographicLocations: [
      { name: 'Rohilkhand-Terai Belt', state: 'Uttar Pradesh', normCoords: [470, 310] },
      { name: 'Kolhapur-Sangli Belt', state: 'Maharashtra', normCoords: [360, 660] },
      { name: 'Mandya Sugarcane Belt', state: 'Karnataka', normCoords: [400, 780] },
    ],
  },
  {
    id: 'crop-tea',
    name: 'Tea (Camellia sinensis) — Plantation Beverage',
    category: 'plantation',
    season: 'Perennial',
    temperatureRangeC: [20, 30],
    rainfallRangeCm: [150, 300],
    soilTypeRequired: 'Deep, fertile, well-drained acidic forest soil rich in humus and iron; sloping land without stagnant water',
    topProducingStates: ['Assam (52.0%)', 'West Bengal (Darjeeling/Dooars, 24.0%)', 'Tamil Nadu (Nilgiris, 12.0%)', 'Kerala'],
    shareInIndiaPct: 21.0,
    economicSignificance: 'Major foreign exchange earner; labor-intensive employment for rural women.',
    geographicLocations: [
      { name: 'Brahmaputra Valley Gardens', state: 'Assam', normCoords: [830, 360] },
      { name: 'Darjeeling & Jalpaiguri Dooars', state: 'West Bengal', normCoords: [710, 340] },
      { name: 'Nilgiri Hills', state: 'Tamil Nadu', normCoords: [410, 810] },
    ],
  },
  {
    id: 'crop-coffee',
    name: 'Coffee (Coffea arabica & robusta) — Shade Plantation',
    category: 'plantation',
    season: 'Perennial',
    temperatureRangeC: [16, 28],
    rainfallRangeCm: [150, 250],
    soilTypeRequired: 'Rich well-drained loamy forest soils rich in organic humus on hill slopes under two-tier tree shade',
    topProducingStates: ['Karnataka (71.0%)', 'Kerala (20.5%)', 'Tamil Nadu (6.5%)'],
    shareInIndiaPct: 3.5,
    economicSignificance: 'Indian shade-grown Arabica and Robusta are highly prized in European espresso markets.',
    geographicLocations: [
      { name: 'Chikmagalur & Baba Budan Giri', state: 'Karnataka', normCoords: [380, 740] },
      { name: 'Kodagu (Coorg)', state: 'Karnataka', normCoords: [385, 770] },
      { name: 'Wayanad High Ranges', state: 'Kerala', normCoords: [390, 800] },
    ],
  },
];

// ─── 4. Mineral & Energy Resources ──────────────────────────────────────────

export const MINERAL_ENERGY_RESOURCES: MineralDepositModel[] = [
  {
    id: 'res-coal',
    name: 'Coal Fields (Gondwana & Tertiary)',
    mineralType: 'fossil-fuel',
    majorMinesOrFields: ['Jharia (Jharkhand)', 'Raniganj (West Bengal)', 'Bokaro (Jharkhand)', 'Singrauli (MP/UP)', 'Talcher (Odisha)', 'Neyveli Lignite (TN)'],
    statesCovered: ['Jharkhand', 'Odisha', 'Chhattisgarh', 'West Bengal', 'Madhya Pradesh', 'Tamil Nadu'],
    geologicalFormation: 'Gondwana Basin (~200 million years old, 98% of reserves) and Tertiary Strata (Eocene/Oligocene)',
    estimatedReservesOrCapacity: '361 Billion Tonnes (Coal Inventory 2022, GSI)',
    keyIndustrialUses: 'Thermal power plants (NTPC), blast furnace smelting in integrated steel plants, cement manufacturing.',
    referenceYear: 'Coal Ministry & GSI Annual Report 2022',
    deposits: [
      { name: 'Jharia Coalfield (Prime Coking Coal)', state: 'Jharkhand', type: 'Gondwana Bituminous', normCoords: [630, 460] },
      { name: 'Raniganj Coalfield (Oldest Coalfield, 1774)', state: 'West Bengal', type: 'Gondwana Bituminous', normCoords: [670, 460] },
      { name: 'Singrauli Coalfield (Energy Capital of India)', state: 'Madhya Pradesh', type: 'Non-coking Coal', normCoords: [540, 430] },
      { name: 'Talcher Coalfield (Mahanadi Coalfields)', state: 'Odisha', type: 'Power Grade Coal', normCoords: [610, 530] },
      { name: 'Neyveli Lignite Mines', state: 'Tamil Nadu', type: 'Tertiary Lignite (Brown Coal)', normCoords: [450, 840] },
    ],
  },
  {
    id: 'res-petroleum-gas',
    name: 'Petroleum & Natural Gas Fields',
    mineralType: 'fossil-fuel',
    majorMinesOrFields: ['Mumbai High Offshore', 'Bassein Offshore', 'Digboi (Oldest Refined Field, 1889)', 'Ankleshwar (Gujarat)', 'Krishna-Godavari Deepwater (KG-D6)'],
    statesCovered: ['Maharashtra Offshore', 'Gujarat', 'Assam', 'Andhra Pradesh Offshore', 'Rajasthan (Barmer)'],
    geologicalFormation: 'Tertiary Marine Sedimentary Basins (Cambay, Assam-Arakan, Mumbai Offshore, Krishna-Godavari)',
    estimatedReservesOrCapacity: 'Crude Oil: 651 MT; Natural Gas: 1149 BCM (MoPNG 2022)',
    keyIndustrialUses: 'Transportation fuel (Petrol/Diesel/ATF), petrochemical feedstock, LPG, urea fertilizer production via HVJ Pipeline.',
    referenceYear: 'Ministry of Petroleum & Natural Gas 2022',
    deposits: [
      { name: 'Mumbai High Offshore Platform', state: 'Offshore Maharashtra', type: 'Offshore Crude & Gas', normCoords: [320, 580] },
      { name: 'Digboi Oil Field', state: 'Assam', type: 'Onshore Anticlinal Basin', normCoords: [880, 310] },
      { name: 'Ankleshwar Oil Field', state: 'Gujarat', type: 'Cambay Basin Oil', normCoords: [290, 520] },
      { name: 'KG-D6 Deepwater Gas Field', state: 'Offshore Andhra Pradesh', type: 'Bay of Bengal Deepwater Gas', normCoords: [570, 680] },
      { name: 'Mangala Field (Barmer Basin)', state: 'Rajasthan', type: 'Onshore Sandstone Reservoir', normCoords: [280, 410] },
    ],
  },
  {
    id: 'res-iron-ore',
    name: 'Iron Ore (Haematite & Magnetite)',
    mineralType: 'metallic-ferrous',
    majorMinesOrFields: ['Bailadila (Chhattisgarh)', 'Mayurbhanj (Odisha)', 'Kudremukh (Karnataka)', 'Noamundi (Jharkhand)', 'Bellary-Hospet (Karnataka)'],
    statesCovered: ['Odisha (53%)', 'Chhattisgarh (18%)', 'Karnataka (14%)', 'Jharkhand (11%)', 'Goa'],
    geologicalFormation: 'Precambrian Iron Ore Series (Banded Haematite Quartzite BHQ / BHJ, Dharwar Craton)',
    estimatedReservesOrCapacity: '33.2 Billion Tonnes (Haematite + Magnetite, IBM 2021)',
    keyIndustrialUses: 'Primary raw material for Steel Authority of India (SAIL), Tata Steel, JSW; exported via Visakhapatnam and Paradip ports.',
    referenceYear: 'Indian Bureau of Mines (IBM) 2021',
    deposits: [
      { name: 'Bailadila Range (Highest Grade Haematite)', state: 'Chhattisgarh', type: 'High-grade Haematite (>66% Fe)', normCoords: [510, 600] },
      { name: 'Kudremukh Magnetite Deposits', state: 'Karnataka', type: 'Magnetite Ore Band', normCoords: [370, 760] },
      { name: 'Mayurbhanj-Keonjhar Belt', state: 'Odisha', type: 'Haematite Super-group', normCoords: [630, 520] },
      { name: 'Bellary-Hospet-Sandur Belt', state: 'Karnataka', type: 'Haematite & Iron Ore Slag', normCoords: [410, 710] },
    ],
  },
  {
    id: 'res-renewable-clean',
    name: 'Clean Energy & Power Plants (Solar, Nuclear, Hydro)',
    mineralType: 'renewable-nuclear',
    majorMinesOrFields: ['Bhadla Solar Park (2.25 GW)', 'Pavagada Solar Park (2.05 GW)', 'Kudankulam Nuclear Plant (2 GW)', 'Bhakra Nangal Dam', 'Tehri Hydroelectric (2.4 GW)'],
    statesCovered: ['Rajasthan', 'Karnataka', 'Tamil Nadu', 'Himachal Pradesh', 'Uttarakhand', 'Maharashtra'],
    geologicalFormation: 'Alluvium/River Gorges (Hydro), Arid Solar Deserts, Coastal Nuclear cooling zones',
    estimatedReservesOrCapacity: 'Renewable Capacity: 175+ GW; Nuclear: 7.4 GW (CEA 2023)',
    keyIndustrialUses: 'Grid decarbonization, green hydrogen production, round-the-clock clean energy supply.',
    referenceYear: 'Central Electricity Authority (CEA) / MNRE 2023',
    deposits: [
      { name: 'Bhadla Solar Park (World’s largest solar park)', state: 'Rajasthan', type: 'Photovoltaic Solar', normCoords: [290, 330], capacity: '2245 MW' },
      { name: 'Kudankulam Nuclear Power Plant (VVER-1000)', state: 'Tamil Nadu', type: 'Pressurized Water Nuclear', normCoords: [440, 940], capacity: '2000 MW' },
      { name: 'Tehri Hydro Complex (Highest Dam in India, 260m)', state: 'Uttarakhand', type: 'Hydroelectric Storage', normCoords: [440, 240], capacity: '2400 MW' },
      { name: 'Muppandal Wind Farm (Largest onshore wind)', state: 'Tamil Nadu', type: 'Onshore Wind Turbines', normCoords: [430, 930], capacity: '1500 MW' },
      { name: 'Tarapur Atomic Power Station (Oldest, 1969)', state: 'Maharashtra', type: 'Boiling Water Reactor', normCoords: [330, 570], capacity: '1400 MW' },
    ],
  },
];

// ─── 5. Industrial Regions & Corridors ───────────────────────────────────────

export const INDUSTRIAL_REGIONS: IndustrialRegionModel[] = [
  {
    id: 'ind-mumbai-pune',
    name: 'Mumbai-Pune Industrial Region',
    principalIndustries: ['Cotton Textiles', 'Petrochemicals & Refineries', 'Automobiles (Tata/Bajaj)', 'Pharmaceuticals', 'Precision Engineering'],
    majorCentres: ['Mumbai', 'Thane', 'Navi Mumbai', 'Kalyan', 'Pune', 'Pimpri-Chinchwad'],
    favourableFactors: ['Port facility of Mumbai & JNPT', 'Early Parsi/Bhatia merchant capital', 'Cheap hydro power from Western Ghats (Tata Power)', 'Humid coastal climate ideal for cotton yarn spinning'],
    challenges: 'Severe traffic congestion, sky-high land and real estate costs, out-migration of heavy manufacturing.',
    normCenter: [350, 600],
    normRadius: 45,
  },
  {
    id: 'ind-hugli-kolkata',
    name: 'Hugli Industrial Region',
    principalIndustries: ['Jute Manufacturing', 'Heavy Engineering & Railway Stock', 'Chemicals', 'Paper & Printing', 'Leather Goods'],
    majorCentres: ['Kolkata', 'Howrah', 'Bhatpara', 'Titagarh', 'Serampore', 'Rishra'],
    favourableFactors: ['Port of Kolkata providing international trade outlet', 'Proximity to Raniganj coalfields and Chota Nagpur iron', 'Abundant fresh river water from Hugli for jute retting', 'Cheap labor from Bihar, UP, and Odisha'],
    challenges: 'Loss of raw jute supply post-1947 Partition (went to East Pakistan/Bangladesh), siltation of Hugli channel.',
    normCenter: [710, 480],
    normRadius: 40,
  },
  {
    id: 'ind-bengaluru-tamilnadu',
    name: 'Bengaluru-Tamil Nadu Industrial Region',
    principalIndustries: ['Information Technology & Software', 'Aerospace (HAL/ISRO)', 'Automobiles (Chennai Auto Hub)', 'Cotton Textiles (Coimbatore)', 'Heavy Electricals (BHEL)'],
    majorCentres: ['Bengaluru', 'Chennai', 'Coimbatore', 'Salem', 'Hosur', 'Tiruchirappalli'],
    favourableFactors: ['Early Pykara and Mettur hydroelectric projects', 'High technical literacy and premier research hubs (IISc, IIT Madras)', 'Favorable weather and proactive industrial policies'],
    challenges: 'Severe summer water scarcity, power transmission constraints.',
    normCenter: [420, 800],
    normRadius: 55,
  },
  {
    id: 'ind-chotanagpur',
    name: 'Chota Nagpur Industrial Region (Rhur of India)',
    principalIndustries: ['Integrated Iron & Steel Plants', 'Heavy Machinery (HEC)', 'Aluminium Smelting', 'Cement & Glass', 'Fertilizers'],
    majorCentres: ['Jamshedpur', 'Ranchi', 'Bokaro', 'Dhanbad', 'Sindri', 'Rourkela', 'Asansol'],
    favourableFactors: ['Dense concentration of mineral wealth (Coal, Iron ore, Manganese, Limestone)', 'Damodar Valley Corporation (DVC) thermal and hydro power', 'Unskilled and semi-skilled local tribal workforce'],
    challenges: 'Environmental degradation from opencast mining, industrial pollution, transport bottlenecks.',
    normCenter: [630, 480],
    normRadius: 50,
  },
  {
    id: 'ind-gujarat',
    name: 'Gujarat Industrial Region (Ahmedabad-Vadodara)',
    principalIndustries: ['Petrochemicals (Kandla/Jamnagar)', 'Cotton & Synthetic Textiles', 'Pharmaceuticals', 'Chemicals & Dyes', 'Dairy Processing (Amul)'],
    majorCentres: ['Ahmedabad', 'Vadodara', 'Surat', 'Ankleshwar', 'Bharuch', 'Jamnagar', 'Kalol'],
    favourableFactors: ['Local cotton growing black soil belt', 'Petroleum discoveries in Cambay and Ankleshwar', 'Proximity to Kandla Port and Mumbai market', 'Dynamic Gujarati entrepreneurial tradition'],
    challenges: 'Groundwater depletion, chemical effluent pollution in Golden Corridor.',
    normCenter: [270, 500],
    normRadius: 45,
  },
];

// ─── 6. Transport & Trade Subsystem ─────────────────────────────────────────

export const TRANSPORT_NETWORKS: TransportNetworkModel[] = [
  {
    id: 'trn-golden-quadrilateral',
    name: 'Golden Quadrilateral (GQ) Highway Network',
    type: 'road-corridor',
    lengthKmOrCapacity: '5,846 km (4/6 Lane Express Highways)',
    nodesOrRoute: ['Delhi', 'Mumbai', 'Chennai', 'Kolkata'],
    keyTradeGoods: 'Manufactured products, agricultural produce, FMCG, container trucks, petroleum products.',
    operationalAgency: 'National Highways Authority of India (NHAI)',
    points: [
      { name: 'Delhi (North Node)', code: 'DEL', normCoords: [430, 310], labelPos: 'top' },
      { name: 'Mumbai (West Node)', code: 'BOM', normCoords: [340, 600], labelPos: 'left' },
      { name: 'Chennai (South Node)', code: 'MAA', normCoords: [480, 800], labelPos: 'right' },
      { name: 'Kolkata (East Node)', code: 'CCU', normCoords: [710, 480], labelPos: 'right' },
    ],
    routeVectors: [
      // Delhi to Mumbai (NH 48)
      [[430, 310], [380, 370], [320, 440], [280, 500], [340, 600]],
      // Mumbai to Chennai (NH 48)
      [[340, 600], [370, 650], [400, 730], [420, 780], [480, 800]],
      // Chennai to Kolkata (NH 16)
      [[480, 800], [510, 730], [550, 660], [610, 560], [710, 480]],
      // Kolkata to Delhi (NH 19)
      [[710, 480], [640, 440], [560, 400], [490, 360], [430, 310]],
    ],
  },
  {
    id: 'trn-major-ports',
    name: '12 Major Indian Commercial Seaports',
    type: 'major-port',
    lengthKmOrCapacity: 'Annual Cargo Capacity: >1,600 Million Metric Tonnes',
    nodesOrRoute: ['Kandla', 'Mumbai', 'JNPT', 'Mormugao', 'New Mangalore', 'Cochin', 'Tuticorin', 'Chennai', 'Ennore', 'Visakhapatnam', 'Paradip', 'Kolkata-Haldia'],
    keyTradeGoods: 'Crude oil, petroleum products, coal, iron ore, containerized manufactured goods, chemicals, grains.',
    operationalAgency: 'Ministry of Ports, Shipping and Waterways',
    points: [
      { name: 'Deendayal Port (Kandla)', code: 'KDL', normCoords: [220, 470], labelPos: 'left' },
      { name: 'Mumbai Port (Old Natural Port)', code: 'BOM', normCoords: [330, 590], labelPos: 'left' },
      { name: 'Jawaharlal Nehru Port (JNPT)', code: 'JNPT', normCoords: [340, 605], labelPos: 'left' },
      { name: 'Mormugao Port (Iron Ore)', code: 'MRM', normCoords: [340, 700], labelPos: 'left' },
      { name: 'New Mangalore Port', code: 'NMP', normCoords: [360, 770], labelPos: 'left' },
      { name: 'Cochin Port (Natural Harbour)', code: 'COK', normCoords: [380, 870], labelPos: 'left' },
      { name: 'VO Chidambaranar Port (Tuticorin)', code: 'TUT', normCoords: [430, 920], labelPos: 'bottom' },
      { name: 'Chennai Port (Artificial Port)', code: 'CHE', normCoords: [480, 800], labelPos: 'right' },
      { name: 'Kamarajar Port (Ennore)', code: 'ENR', normCoords: [485, 785], labelPos: 'right' },
      { name: 'Visakhapatnam Port (Deepest Landlocked)', code: 'VTZ', normCoords: [580, 650], labelPos: 'right' },
      { name: 'Paradip Port (Iron Ore/Coal)', code: 'PRT', normCoords: [650, 550], labelPos: 'right' },
      { name: 'Syama Prasad Mookerjee Port (Kolkata)', code: 'CCU', normCoords: [710, 490], labelPos: 'right' },
    ],
  },
  {
    id: 'trn-inland-waterways',
    name: 'National Waterways (NW-1 & NW-2)',
    type: 'inland-waterway',
    lengthKmOrCapacity: 'NW-1: 1,620 km; NW-2: 891 km',
    nodesOrRoute: ['NW-1: Prayagraj to Haldia (Ganga-Bhagirathi-Hooghly)', 'NW-2: Sadiya to Dhubri (Brahmaputra)'],
    keyTradeGoods: 'Fly ash, cement, coal, heavy over-dimensional cargo, foodgrains, fertilizer.',
    operationalAgency: 'Inland Waterways Authority of India (IWAI)',
    points: [
      { name: 'Prayagraj (NW-1 Origin)', normCoords: [510, 390], labelPos: 'left' },
      { name: 'Varanasi Multimodal Terminal', normCoords: [550, 395], labelPos: 'bottom' },
      { name: 'Sahibganj Multimodal Terminal', normCoords: [670, 410], labelPos: 'top' },
      { name: 'Haldia Terminal (NW-1 End)', normCoords: [705, 510], labelPos: 'right' },
      { name: 'Dhubri (NW-2)', normCoords: [770, 380], labelPos: 'left' },
      { name: 'Sadiya (NW-2 Origin)', normCoords: [890, 300], labelPos: 'right' },
    ],
    routeVectors: [
      // NW-1 Ganga river course
      [[510, 390], [550, 395], [600, 395], [640, 390], [670, 410], [690, 440], [705, 510]],
      // NW-2 Brahmaputra course
      [[770, 380], [800, 370], [840, 340], [870, 315], [890, 300]],
    ],
  },
];

// ─── 7. Thematic Charts & Historical Trends ─────────────────────────────────

export interface DecadalGrowthPoint {
  year: number;
  populationMillions: number;
  decadalGrowthPct: number;
  demographicPhase: string;
}

export const INDIA_DECADAL_POPULATION: DecadalGrowthPoint[] = [
  { year: 1901, populationMillions: 238.4, decadalGrowthPct: 0.0, demographicPhase: 'Phase I: Stagnant Growth' },
  { year: 1911, populationMillions: 252.1, decadalGrowthPct: 5.75, demographicPhase: 'Phase I: Stagnant Growth' },
  { year: 1921, populationMillions: 251.3, decadalGrowthPct: -0.31, demographicPhase: 'Phase I: Year of Great Divide' }, // Negative growth due to 1918 influenza pandemic
  { year: 1931, populationMillions: 279.0, decadalGrowthPct: 11.0, demographicPhase: 'Phase II: Steady Growth' },
  { year: 1941, populationMillions: 318.7, decadalGrowthPct: 14.22, demographicPhase: 'Phase II: Steady Growth' },
  { year: 1951, populationMillions: 361.1, decadalGrowthPct: 13.31, demographicPhase: 'Phase II: Steady Growth' },
  { year: 1961, populationMillions: 439.2, decadalGrowthPct: 21.64, demographicPhase: 'Phase III: Population Explosion' },
  { year: 1971, populationMillions: 548.2, decadalGrowthPct: 24.80, demographicPhase: 'Phase III: Population Explosion' },
  { year: 1981, populationMillions: 683.3, decadalGrowthPct: 24.66, demographicPhase: 'Phase III: Population Explosion' },
  { year: 1991, populationMillions: 846.4, decadalGrowthPct: 23.87, demographicPhase: 'Phase IV: High Growth with Deceleration' },
  { year: 2001, populationMillions: 1028.7, decadalGrowthPct: 21.54, demographicPhase: 'Phase IV: High Growth with Deceleration' },
  { year: 2011, populationMillions: 1210.9, decadalGrowthPct: 17.70, demographicPhase: 'Phase IV: Declining Growth Rate' },
];

export interface LandUseCategory {
  category: string;
  sharePct: number;
  color: string;
  description: string;
}

export const LAND_USE_CLASSIFICATION: LandUseCategory[] = [
  { category: 'Net Sown Area', sharePct: 45.5, color: '#16a34a', description: 'Total land cultivated and harvested with agricultural crops' },
  { category: 'Forest Area', sharePct: 23.3, color: '#15803d', description: 'Classified government forest tracts (National Forest Policy goal is 33%)' },
  { category: 'Non-Agricultural Uses', sharePct: 8.7, color: '#64748b', description: 'Settlements, urban areas, roads, railways, canals, factories' },
  { category: 'Barren & Unculturable', sharePct: 6.7, color: '#78350f', description: 'Rocky mountains, deserts, ravenous gullies incapable of cultivation' },
  { category: 'Current Fallow', sharePct: 4.9, color: '#eab308', description: 'Left uncultivated for 1 year or less to regain natural soil fertility' },
  { category: 'Culturable Waste Land', sharePct: 4.0, color: '#d97706', description: 'Fallow land left uncultivated for more than 5 years' },
  { category: 'Fallow other than Current', sharePct: 3.6, color: '#ca8a04', description: 'Left uncultivated for 1 to 5 years' },
  { category: 'Permanent Pastures', sharePct: 3.3, color: '#84cc16', description: 'Village common grazing lands (Gauchar land)' },
];

export interface EnergyMixCategory {
  source: string;
  sharePct: number;
  color: string;
  generationType: 'fossil' | 'renewable' | 'nuclear';
}

export const ENERGY_GENERATION_MIX: EnergyMixCategory[] = [
  { source: 'Coal & Lignite', sharePct: 49.1, color: '#334155', generationType: 'fossil' },
  { source: 'Solar Power', sharePct: 18.2, color: '#f59e0b', generationType: 'renewable' },
  { source: 'Large Hydroelectric', sharePct: 11.2, color: '#0284c7', generationType: 'renewable' },
  { source: 'Wind Power', sharePct: 10.5, color: '#06b6d4', generationType: 'renewable' },
  { source: 'Gas & Diesel', sharePct: 7.3, color: '#94a3b8', generationType: 'fossil' },
  { source: 'Nuclear Power', sharePct: 1.7, color: '#ef4444', generationType: 'nuclear' },
  { source: 'Bio-Power & Waste', sharePct: 2.0, color: '#10b981', generationType: 'renewable' },
];
