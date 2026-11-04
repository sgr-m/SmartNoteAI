/**
 * Geography Resource Registry Types
 * Stage 1: Typed schema for the Geography Resource Centre
 */

export type GeoCategory =
  | 'globe-earth'
  | 'world-atlas'
  | 'india-maps'
  | 'physical'
  | 'topographical'
  | 'oceanography'
  | 'outline-maps';

export interface GeoCategoryDefinition {
  id: GeoCategory;
  name: string;
  icon: string;
  description: string;
  count?: number;
}

export type GeoClassLevel =
  | 'primary'          // Classes 1-5 (Foundational)
  | 'middle'           // Classes 6-8 (Upper Primary)
  | 'secondary'        // Classes 9-10 (Secondary)
  | 'senior-secondary' // Classes 11-12 (Higher Secondary)
  | 'higher-ed';       // College / Advanced Studies

export type GeoScope = 'india' | 'world' | 'regional';

export type GeoResourceType =
  | 'interactive-map'
  | 'thematic-layer'
  | '3d-globe'
  | 'topographic-sheet'
  | 'satellite-mosaic'
  | 'climate-chart'
  | 'activity-worksheet'
  | 'data-layer'
  | 'gis-viewer'
  | 'physical-geo-lab'
  | 'human-economic-geo';

export type GeoAvailabilityStatus =
  | 'available'          // Ready to insert/use immediately
  | 'planned-stage-2'    // Core Cartography (Stage 2)
  | 'planned-stage-3'    // Interactive 2D Vector Map Engine (Stage 3)
  | 'planned-stage-4'    // Topographic Contours & Elevation Profiles (Stage 4)
  | 'planned-stage-5'    // Interactive 3D Globe with Solar Terminator (Stage 5)
  | 'planned-stage-6'    // Climatology, IMD Monsoon & River Basins (Stage 6)
  | 'planned-stage-7'    // Physical Geography Lab & Measurement Tools (Stage 7)
  | 'external-portal';   // Direct link to official government portal (SoI / Bhuvan / IMD)

export interface GeoPreviewInfo {
  thumbnailIcon?: string;
  projection?: string;
  coverageBounds?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  defaultCenter?: [number, number];                 // [lon, lat]
  defaultZoom?: number;
  layers?: string[];
  sampleDataSummary?: string;
}

export interface GeographyResource {
  id: string;
  name: string;
  description: string;
  category: GeoCategory;
  educationalPurpose: string;
  suitableClasses: GeoClassLevel[];
  resourceType: GeoResourceType;
  provider: string;
  sourceUrl: string;
  licenseAndAttribution: string;
  availabilityStatus: GeoAvailabilityStatus;
  previewInfo: GeoPreviewInfo;
  interactionCapabilities: string[]; // e.g. ['pan', 'zoom', 'layer-toggle', 'projection-switch', 'elevation-slice', 'identify']
  tags: string[];
  scope: GeoScope;
  featured?: boolean;
}

export interface GeoFilterState {
  searchQuery: string;
  selectedCategory: GeoCategory | 'all';
  selectedClassLevel: GeoClassLevel | 'all';
  selectedScope: GeoScope | 'all';
  selectedType: GeoResourceType | 'all';
  favoritesOnly: boolean;
  recentlyUsedOnly: boolean;
}

// ─── Stage 2: Interactive Geography Whiteboard Object State ─────────────────

export type GeoInteractionMode = 'select' | 'interact' | 'annotate' | 'presentation';

export interface GeoCameraState {
  center: [number, number]; // [longitude, latitude]
  zoom: number;             // Zoom scale factor (1 = default extent)
  rotation: number;         // Bearing / rotation angle in degrees
  pitch?: number;           // Tilt / pitch angle in degrees (for 3D views)
}

export interface GeoLayerConfig {
  boundaries: boolean;      // International & external frontiers
  states: boolean;          // State & Union Territory boundaries
  capitals: boolean;        // Capital cities & major urban centres
  relief: boolean;          // Physiographic relief shading & elevation
  graticule: boolean;       // Latitude & longitude coordinate grid lines
  rivers?: boolean;         // Major river drainage systems
  mountainRanges?: boolean; // Mountain ranges & highest peaks
  deserts?: boolean;        // Arid desert zones
  grasslands?: boolean;     // Steppes, savannas, prairies
  climaticRegions?: boolean;// Köppen climatic zones
  vegetation?: boolean;     // Global biomes & natural vegetation
  soilRegions?: boolean;    // Major soil orders
  population?: boolean;     // Population distribution & density clusters
  timeZones?: boolean;      // UTC time zones & International Date Line
  tectonicPlates?: boolean; // Lithospheric plate boundaries
  earthquakes?: boolean;    // Seismic belts & major epicenters
  volcanoes?: boolean;      // Active & dormant subduction/hotspot volcanoes
  oceanCurrents?: boolean;  // Warm & cold ocean currents
  bathymetry?: boolean;     // Ocean bathymetry, mid-ocean ridges, and deep-sea trenches
  tradeRoutes?: boolean;    // Maritime choke points & trade corridors
  labels?: boolean;         // Geographic labels and place names
  legend?: boolean;         // Active map legend panel
  distanceTool?: boolean;   // Geodesic distance measurement overlay
  contours?: boolean;       // Topographical 20m contour lines
  spotHeights?: boolean;    // Spot heights, benchmarks, and triangulated stations
  gridLines?: boolean;      // Topographical Eastings & Northings grid
  settlements?: boolean;    // Nucleated and dispersed settlements
  drainage?: boolean;       // Streams, rivers, and water bodies
  transport?: boolean;      // Metalled roads, cart tracks, railways
  vegetationForest?: boolean;// Reserved forests, scrub, and agricultural land
  terminator?: boolean;     // Solar terminator day/night boundary
  tropics?: boolean;        // Tropic of Cancer (23.44°N) and Tropic of Capricorn (23.44°S)
  polarCircles?: boolean;   // Arctic Circle (66.56°N) and Antarctic Circle (66.56°S)
  atmosphere?: boolean;     // Atmospheric limb glow
  cityLights?: boolean;     // Night city lights in shadow
  hemispheres?: boolean;    // Equator & Prime Meridian hemisphere divides
  dateLine?: boolean;       // International Date Line (180° meridian)
}

export interface GeoMeasurementState {
  startPoint: [number, number] | null; // [lon, lat]
  endPoint: [number, number] | null;   // [lon, lat]
  distanceKm: number | null;
  distanceMiles: number | null;
  distanceNauticalMiles: number | null;
  bearingDegrees?: number | null;
}

export interface OfficialIndiaMapRecord {
  id: string;
  title: string;
  category: 'political' | 'physical' | 'outline' | 'state' | 'educational-toposheet';
  scale: string;          // e.g. "1:4,000,000" or "1:50,000"
  edition: string;        // e.g. "Tenth Edition 2024" or "OSM Edition 2019"
  publicationYear: number;
  publisher: string;      // "Surveyor General of India, Department of Science & Technology"
  officialPortalUrl: string;
  referenceStandard: string;
  description: string;
  stateOrUt?: string;
  sheetNumber?: string;   // For toposheets (e.g. "45 D/7", "45 D/10")
  conventionalSigns?: string[];
  contoursInterval?: string;
  gridSystem?: string;    // e.g. "UTM / WGS84" or "Polyconic / Everest 1830"
  previewThumbnail?: string;
}

export interface WorldThematicLayerInfo {
  id: string;
  name: string;
  category: 'physical' | 'political' | 'climatology' | 'biogeography' | 'human' | 'geophysics' | 'economic';
  layerKey: keyof GeoLayerConfig;
  description: string;
  provider: string;       // e.g. "Natural Earth / USGS / NOAA / Köppen-Geiger"
  license: string;        // e.g. "Public Domain (CC0) / Open Access"
  legendItems: Array<{ label: string; color: string; symbol?: string }>;
}

export interface GeoAnnotationItem {
  id: string;
  type: 'marker' | 'callout' | 'highlight' | 'pen' | 'highlighter';
  position?: [number, number]; // [xPercent, yPercent] or [lon, lat]
  label?: string;
  text?: string;
  color?: string;
  // Freehand whiteboard annotation stroke data (normalized to map [0..1000, 0..1000] coordinate space)
  points?: [number, number][]; // Array of [normX, normY] points
  width?: number;              // Stroke width in base units
  opacity?: number;            // Opacity (0.0 to 1.0)
}

export interface GeoFeatureInfo {
  id: string;
  name: string;
  type: string;             // 'physiographic' | 'state' | 'ut' | 'waterbody' | 'mountain'
  category?: string;
  description: string;
  color?: string;
}

/**
 * Reusable Embedded Geography Resource Object State
 * Strictly serializable: No DOM nodes, no WebGL references, no live closures.
 * Fully survives .sbl document save and reopen across sessions.
 */
export interface PhysicalGeoState {
  activeCategory: 'landforms' | 'tectonics' | 'earthquakes' | 'volcanoes' | 'weathering' | 'hydrology' | 'oceanography';
  selectedItemId?: string;
  subItemId?: string;
  viewMode?: '3d-model' | 'cross-section' | 'diagram' | '3d' | 'map';
  animationPlaying?: boolean;
  animationStep?: number;
  parameters?: Record<string, number>;
}

export interface HumanEconomicGeoState {
  activeCategory: 'population' | 'agriculture' | 'minerals-energy' | 'industry' | 'transport-trade' | 'charts';
  selectedMetricId?: string;
  selectedItemId?: string;
  viewMode?: 'map' | 'chart' | 'pyramid' | 'details';
  chartType?: 'bar' | 'pie' | 'line' | 'pyramid';
  referenceYear?: string;
  showLabels?: boolean;
  classifiedBreaks?: number[];
  filterZone?: string;
}

export interface GeoResourceState {
  version: number;          // Schema version for migrations (e.g. 1)
  resourceId: string;       // Unique ID from geographyRegistry
  resourceType: GeoResourceType;
  mapType?: string;         // Backwards compatibility alias for map resource identifier
  provider: string;         // e.g. "Survey of India"
  attribution: string;      // Mandatory legal attribution
  sourceUrl?: string;       // Educational / official reference URL
  scope: GeoScope;          // 'india' | 'world' | 'regional'
  title: string;            // Display title of the embedded resource
  interactionMode: GeoInteractionMode; // 'select' | 'interact' | 'annotate' | 'presentation'

  // Camera & Extent
  camera: GeoCameraState;
  extent: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  panOffset: { x: number; y: number };      // Local pixel pan offset in viewport
  zoomLevel: number;                        // Relative zoom multiplier (1.0 = fit)
  rotationAngle: number;                    // Viewport rotation angle in degrees

  // Layer Configuration
  layers: GeoLayerConfig;

  // Selected Feature / Entity
  selectedFeatureId: string | null;
  features: GeoFeatureInfo[];

  // Styling & Projection
  colorTheme: string;       // 'classroom' | 'physical' | 'political' | 'high-contrast'
  projection: string;       // 'albers_india' | 'robinson' | 'mercator' | 'equirectangular'

  // Whiteboard Annotations directly tied to this resource
  annotations: GeoAnnotationItem[];

  // Transparent placeholder on whiteboard canvas
  transparentBackground?: boolean;

  // Geodesic Great-Circle distance measurement tool state
  measurement?: GeoMeasurementState;

  // Topographical Sheet Extension State (Stage 4)
  sheetNumber?: string;                     // e.g. "45 D/7"
  contourInterval?: number;                 // e.g. 20 (metres)
  scaleRF?: number;                         // e.g. 50000
  gridReferenceMode?: 'none' | '4figure' | '6figure' | 'geo';
  topoMeasureMode?: 'none' | 'distance' | 'area';
  topoPoints?: Array<{ easting: number; northing: number; label?: string }>;

  // Contour and Terrain Laboratory Extension State (Stage 5)
  topoMode?: 'toposheet' | 'crossSectionProfile' | 'contourTerrainLab';
  landformId?: string;
  verticalExaggeration?: number;            // e.g. 1, 2, 5, 10
  profilePoints?: Array<{
    distKm: number;
    elevationM: number;
    label?: string;
  }>;
  sectionLine?: {
    start: [number, number];                // [normX, normY] in 0..1
    end: [number, number];                  // [normX, normY] in 0..1
  };
  terrainConfig?: {
    baseElevation: number;
    peakHeight: number;
    valleyDepth: number;
    slopeFactor: number;
    shapePreset: string;
  };

  // 3D Globe & Earth Laboratory Extension State (Stage 6)
  globeState?: {
    centerLon: number;                      // Longitude facing camera (-180..180)
    centerLat: number;                      // Latitude facing camera (-90..90)
    zoom: number;                           // 0.6..3.0
    axialTilt: number;                      // Standard 23.44 degrees
    dayOfYear: number;                      // 1..365 (e.g. 172 = June 21, 355 = Dec 21)
    timeOfDayHours: number;                 // UTC hours 0..24
    projectionMode: 'globe' | 'flat';
    demoMode: 'none' | 'rotation' | 'revolution' | 'seasons' | 'timezones';
    animating: boolean;
    animSpeed: number;                      // e.g. 1x, 5x, 20x
    showTerminator: boolean;
    showAtmosphere: boolean;
    showGraticule: boolean;
    showTropics: boolean;
    showPolarCircles: boolean;
    showTimeZones: boolean;
    showCityLights: boolean;
    selectedLocation?: {
      name: string;
      lat: number;
      lon: number;
      country?: string;
      description?: string;
    };
  };

  // GIS, Satellite Imagery & Thematic Map Laboratory Extension State (Stage 7)
  gisState?: {
    activeLayerIds: string[];
    layerOpacities: Record<string, number>;
    layerOrder: string[];
    comparisonMode: 'none' | 'swipe' | 'sideBySide';
    comparisonLayerAId: string;
    comparisonLayerBId: string;
    swipePosition: number; // 0..100 percentage
    inspectedLocation?: {
      lon: number;
      lat: number;
      elevationM?: number;
      lulcClass?: string;
      soilType?: string;
      drainageBasin?: string;
      floodRisk?: string;
      stateName?: string;
      districtName?: string;
    };
  };

  // Weather & Climate Teaching Laboratory Extension State (Stage 8)
  weatherState?: {
    activeCategory: 'weather-maps' | 'climate-maps' | 'instruments' | 'concepts' | 'stations';
    weatherProduct?: string;
    climateProduct?: string;
    instrumentType?: string;
    instrumentValues?: Record<string, number>;
    conceptType?: string;
    selectedStationId?: string;
    observationTime?: string;
    issueTime?: string;
    validityPeriodHours?: number;
    isArchivedSimulation?: boolean;
    warningLevel?: 'green' | 'yellow' | 'orange' | 'red';
  };

  // Physical Geography Interactive Laboratory Extension State (Stage 9)
  physicalGeoState?: PhysicalGeoState;

  // Human & Economic Geography Laboratory Extension State (Stage 10)
  humanEconomicState?: HumanEconomicGeoState;

  // Saved state for presentation mode transitions
  savedBoundsBeforePresentation?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Standard Sample Physiographic Features for India (Survey of India Compliant)
 */
export const SAMPLE_INDIA_FEATURES: GeoFeatureInfo[] = [
  {
    id: 'feat-ladakh-jk',
    name: 'UT of Ladakh & Jammu & Kashmir',
    type: 'ut',
    category: 'Administrative & High Valleys',
    description: 'Northern frontier territories of India, encompassing the Karakoram range, Ladakh plateau, and Kashmir valley.',
    color: '#38bdf8',
  },
  {
    id: 'feat-himalaya',
    name: 'Northern Mountain Wall (Himalayas)',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Young fold mountains stretching from the Indus to the Brahmaputra, acting as a climatic barrier and source of perennial rivers.',
    color: '#0284c7',
  },
  {
    id: 'feat-plains',
    name: 'Indo-Gangetic Fertile Plains',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Vast alluvial plain formed by the deposition of silt by the Indus, Ganga, and Brahmaputra river systems.',
    color: '#22c55e',
  },
  {
    id: 'feat-thar',
    name: 'Thar Great Indian Desert',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Arid region in northwestern India with low rainfall, undulating sandy terrain, and inland drainage streams.',
    color: '#eab308',
  },
  {
    id: 'feat-highlands',
    name: 'Central Highlands & Malwa Plateau',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Highland region north of the Narmada River, sloping northeast towards the Yamuna and Ganga basins.',
    color: '#f97316',
  },
  {
    id: 'feat-deccan',
    name: 'Deccan Peninsular Plateau',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Ancient triangular plateau of volcanic basalt and crystalline rocks, bounded by the Satpura and Vindhya ranges.',
    color: '#a855f7',
  },
  {
    id: 'feat-wghats',
    name: 'Western Ghats (Sahyadri)',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Continuous mountain wall parallel to the western coast, recognized as a global biodiversity hotspot.',
    color: '#10b981',
  },
  {
    id: 'feat-eghats',
    name: 'Eastern Ghats',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Discontinuous and eroded hills along the eastern coast, dissected by the Godavari, Krishna, and Mahanadi rivers.',
    color: '#84cc16',
  },
  {
    id: 'feat-coastal',
    name: 'Coastal Plains & Islands',
    type: 'physiographic',
    category: 'Physiographic Division',
    description: 'Narrow western and broader eastern coastal plains, along with the Andaman & Nicobar and Lakshadweep island chains.',
    color: '#06b6d4',
  },
];

/**
 * Creates a default, fully serializable GeoResourceState for a given resource or standard India map
 */
export function createDefaultGeoResourceState(
  resourceId = 'soi-india-political',
  name = 'Official Survey of India Map of India'
): GeoResourceState {
  return {
    version: 1,
    resourceId,
    resourceType: 'interactive-map',
    mapType: resourceId === 'soi-india-political' ? 'india_political' : resourceId,
    provider: 'Survey of India',
    attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    sourceUrl: 'https://onlinemaps.surveyofindia.gov.in',
    scope: 'india',
    title: name,
    interactionMode: 'select',
    camera: {
      center: [82.5, 22.0], // Centered on India (82°30'E Standard Meridian, 22°N)
      zoom: 1.0,
      rotation: 0,
      pitch: 0,
    },
    extent: [68.1, 6.7, 97.4, 37.1], // Standard bounding box for India (Survey of India extent)
    panOffset: { x: 0, y: 0 },
    zoomLevel: 1.0,
    rotationAngle: 0,
    layers: {
      boundaries: true,
      states: true,
      capitals: true,
      relief: true,
      graticule: true,
      rivers: true,
      mountainRanges: false,
      deserts: false,
      grasslands: false,
      climaticRegions: false,
      vegetation: false,
      soilRegions: false,
      population: false,
      timeZones: false,
      tectonicPlates: false,
      earthquakes: false,
      volcanoes: false,
      oceanCurrents: false,
      bathymetry: false,
      tradeRoutes: false,
      labels: true,
      legend: false,
      distanceTool: false,
    },
    selectedFeatureId: null,
    features: SAMPLE_INDIA_FEATURES,
    colorTheme: 'classroom',
    projection: 'albers_india',
    annotations: [],
  };
}

/**
 * Checks if a given CanvasObject is an embedded geography shape
 */
export function isGeoShapeType(shapeType: string): boolean {
  return [
    'geoMap',
    'geoGlobe',
    'geoTopoProfile',
    'geoCoordinateGrid',
    'geoThematicLayer',
  ].includes(shapeType);
}


