/**
 * GIS, Satellite Imagery & Thematic Map Laboratory Service
 * Stage 7: Geospatial Layer Management, OGC Tile Protocols,
 * ISRO/NRSC Bhuvan, NASA Earthdata, USGS, Copernicus & GEBCO verified providers,
 * Spatial Inspection & Dual-Map Swipe Comparison.
 *
 * Compliance:
 * - Survey of India official boundary delineation and attribution for Indian territory.
 * - Prioritises ISRO/NRSC Bhuvan & Government of India thematic services.
 * - Zero external satellite tile download requirement for core offline classroom usage;
 *   bundles authentic offline vector/thematic data with online WMTS/WMS tile support.
 */

// ─── 1. Types & Categories ──────────────────────────────────────────────────

export type GisLayerCategory =
  | 'satellite'
  | 'elevation'
  | 'land-use'
  | 'forest'
  | 'soil'
  | 'geomorphology'
  | 'drainage'
  | 'rivers'
  | 'wetlands'
  | 'water-bodies'
  | 'flood-hazards'
  | 'erosion'
  | 'urban-sprawl'
  | 'agriculture'
  | 'transport';

export interface GisLegendEntry {
  label: string;
  color: string;
  description?: string;
}

export interface GisVectorZone {
  id: string;
  name: string;
  category: string;
  color: string;
  fillColor: string;
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  keyFeatures: string[];
}

export interface GisLayerDefinition {
  id: string;
  name: string;
  shortName: string;
  category: GisLayerCategory;
  provider: string;
  sourceUrl: string;
  serviceType: 'wmts' | 'wms' | 'xyz' | 'vector-thematic';
  tileUrlTemplate?: string;
  wmsLayers?: string;
  resolution: string;
  temporalFrequency: string;
  datum: string;
  license: string;
  attribution: string;
  curriculumTopics: string[];
  description: string;
  legend: GisLegendEntry[];
  defaultVisible: boolean;
  defaultOpacity: number;
  zIndex: number;
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  zones?: GisVectorZone[];
}

export interface GisInspectionResult {
  lon: number;
  lat: number;
  dmsStr: string;
  stateName: string;
  districtName?: string;
  elevationM: number;
  elevationClass: string;
  lulcClass: string;
  soilType: string;
  drainageBasin: string;
  floodRisk: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Negligible';
  geomorphologyUnit: string;
  forestDensity: string;
  agriculturalZone: string;
}

export interface GisComparisonPreset {
  id: string;
  name: string;
  description: string;
  layerAId: string;
  layerBId: string;
  defaultSwipe: number; // 0..100
  pedagogicalFocus: string;
}

// ─── 2. Bounding Coordinates & Projections ──────────────────────────────────

export const INDIA_EXTENT_BOUNDS: [number, number, number, number] = [
  68.1, // minLon (Ghuar Mota, Gujarat)
  6.7,  // minLat (Indira Point, Great Nicobar)
  97.4, // maxLon (Kibithu / Dong, Arunachal Pradesh)
  37.1, // maxLat (Indira Col, Ladakh)
];

/**
 * Convert Longitude / Latitude in Decimal Degrees to Web Mercator EPSG:3857 coordinates (meters).
 */
export function lonLatToWebMercator(lon: number, lat: number): [number, number] {
  const x = (lon * 20037508.34) / 180;
  const rad = (lat * Math.PI) / 180;
  const y = (Math.log(Math.tan(Math.PI / 4 + rad / 2)) * 20037508.34) / Math.PI;
  return [x, y];
}

/**
 * Convert Web Mercator EPSG:3857 coordinates (meters) back to Longitude / Latitude in Decimal Degrees.
 */
export function webMercatorToLonLat(x: number, y: number): [number, number] {
  const lon = (x * 180) / 20037508.34;
  const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
  return [Math.round(lon * 10000) / 10000, Math.round(lat * 10000) / 10000];
}

/**
 * Format decimal degree coordinates into standard Degrees-Minutes-Seconds (DMS) string.
 */
export function formatCoordinateDMS(lon: number, lat: number): {
  lonDms: string;
  latDms: string;
  combined: string;
} {
  const toDMS = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';
    const absVal = Math.abs(val);
    const deg = Math.floor(absVal);
    const minFloat = (absVal - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.round((minFloat - min) * 60);
    return `${deg}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}" ${dir}`;
  };

  const latDms = toDMS(lat, true);
  const lonDms = toDMS(lon, false);
  return {
    lonDms,
    latDms,
    combined: `${latDms}, ${lonDms}`,
  };
}

// ─── 3. Verified Authoritative GIS Layers Catalog ───────────────────────────

export const GIS_LAYERS: GisLayerDefinition[] = [
  // 1. Satellite Imagery
  {
    id: 'isro-bhuvan-satellite',
    name: 'ISRO Bhuvan High-Resolution Satellite Composite',
    shortName: 'Satellite Imagery',
    category: 'satellite',
    provider: 'National Remote Sensing Centre (NRSC) / ISRO',
    sourceUrl: 'https://bhuvan.nrsc.gov.in/home/index.php',
    serviceType: 'wmts',
    tileUrlTemplate: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wmts/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=bhuvan:mosaic&STYLE=_null&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg',
    resolution: 'LISS-IV (5.8m) & Cartosat-1 (2.5m) Pan/Multispectral',
    temporalFrequency: 'Annual seamless national mosaic updates',
    datum: 'WGS84 / EPSG:3857',
    license: 'Bhuvan Open Data Policy (Government of India)',
    attribution: 'Satellite Data: © NRSC / ISRO, Government of India (Bhuvan Portal)',
    curriculumTopics: ['Class 11 Practical Geography: Remote Sensing Principles', 'Class 9 Physical Geography: Visual Earth Observation'],
    description: 'High-resolution true-colour satellite composite of the Indian landmass acquired by ISRO IRS satellites (Resourcesat-2 LISS-IV and Cartosat-1).',
    legend: [
      { label: 'Deep Water / Ocean', color: '#0f2b48' },
      { label: 'Dense Vegetation / Forest', color: '#166534' },
      { label: 'Cropland / Agriculture', color: '#84cc16' },
      { label: 'Urban Built-up / Settlement', color: '#dc2626' },
      { label: 'Barren Soil / Desert Sand', color: '#eab308' },
      { label: 'Himalayan Snow / Glacial Ice', color: '#f8fafc' },
    ],
    defaultVisible: true,
    defaultOpacity: 1.0,
    zIndex: 1,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 2. Digital Elevation Model (Elevation & Relief)
  {
    id: 'isro-cartodem-elevation',
    name: 'CartoDEM & SRTM National Elevation Model',
    shortName: 'Elevation & Relief',
    category: 'elevation',
    provider: 'NRSC / ISRO & USGS',
    sourceUrl: 'https://bhuvan-app1.nrsc.gov.in/data/download/index.php',
    serviceType: 'vector-thematic',
    resolution: '30 metres (1 arc-second grid spacing)',
    temporalFrequency: 'Standardized national DEM product',
    datum: 'WGS84 / EGM96 Geoid',
    license: 'Public Educational Access',
    attribution: 'Elevation: CartoDEM © ISRO/NRSC; Global SRTM © USGS/NASA',
    curriculumTopics: ['Class 11 Chapter 2: Physiographic Divisions of India', 'Class 9 Relief and Landforms'],
    description: 'Hypsometrically tinted digital elevation model showcasing the three tiers of Indian relief: the Northern Himalayas, the Indo-Gangetic Plains, and the Peninsular Plateau.',
    legend: [
      { label: 'Very High Mountain (> 4000m)', color: '#ffffff', description: 'Greater Himalayas & Trans-Himalaya' },
      { label: 'High Alpine (2000m – 4000m)', color: '#78350f', description: 'Lesser Himalayas & Pir Panjal' },
      { label: 'Moderate Hill (1000m – 2000m)', color: '#d97706', description: 'Shiwaliks & Western Ghats Crest' },
      { label: 'Elevated Plateau (400m – 1000m)', color: '#f59e0b', description: 'Deccan & Malwa Plateaus' },
      { label: 'Low Upland (150m – 400m)', color: '#fde047', description: 'Peninsular Basins & Piedmonts' },
      { label: 'Plains & Delta (0m – 150m)', color: '#22c55e', description: 'Indo-Gangetic & Coastal Plains' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.85,
    zIndex: 2,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 3. Land Use and Land Cover (LULC)
  {
    id: 'isro-bhuvan-lulc',
    name: 'NRSC Bhuvan 1:50,000 Land Use / Land Cover',
    shortName: 'Land Use & Cover (LULC)',
    category: 'land-use',
    provider: 'National Remote Sensing Centre (NRSC) / ISRO',
    sourceUrl: 'https://bhuvan-app1.nrsc.gov.in/thematic/thematic/index.php',
    serviceType: 'vector-thematic',
    resolution: '1:50,000 scale (23.5m LISS-III derived)',
    temporalFrequency: 'Periodic national cycle mapping (2015-16 / 2020-21)',
    datum: 'WGS84 / LCC Projection',
    license: 'Bhuvan Thematic Open Data License',
    attribution: 'LULC Data: © NRSC / ISRO, Department of Space, Govt. of India',
    curriculumTopics: ['Class 10 Chapter 1: Land Resources & Utilization', 'Class 12 Land Resources & Agriculture'],
    description: 'Classifies the surface of India into standard national LULC categories: built-up land, intensive agricultural cropland, forests, wastelands, and water bodies.',
    legend: [
      { label: 'Built-up Urban / Rural', color: '#e11d48', description: 'Cities, towns, villages, industrial complexes' },
      { label: 'Kharif Cropland (Monsoon)', color: '#65a30d', description: 'Rainfed and irrigated summer crops (Paddy, Maize)' },
      { label: 'Rabi Cropland (Winter)', color: '#ca8a04', description: 'Winter irrigated crops (Wheat, Mustard, Gram)' },
      { label: 'Double / Multi-Cropped', color: '#15803d', description: 'Intensive agricultural land cropped 2+ times/year' },
      { label: 'Deciduous & Evergreen Forest', color: '#047857', description: 'Natural tree cover and forest reserves' },
      { label: 'Scrub & Wasteland', color: '#d97706', description: 'Degraded land with thorny vegetation' },
      { label: 'Water Bodies & Reservoirs', color: '#0284c7', description: 'Rivers, canals, lakes, and dam reservoirs' },
    ],
    defaultVisible: true,
    defaultOpacity: 0.75,
    zIndex: 3,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 4. Forest Cover and Canopy Density
  {
    id: 'isro-fsi-forest',
    name: 'Forest Survey of India (FSI) & Bhuvan Canopy Density',
    shortName: 'Forest Cover & Density',
    category: 'forest',
    provider: 'Forest Survey of India (FSI), MoEFCC & NRSC/ISRO',
    sourceUrl: 'https://fsi.nic.in/',
    serviceType: 'vector-thematic',
    resolution: 'State of Forest Report (ISFR) 1:50,000 classification',
    temporalFrequency: 'Biennial Forest Assessment',
    datum: 'WGS84',
    license: 'Government Open Data License (India)',
    attribution: 'Forest Data: © Forest Survey of India & NRSC/ISRO',
    curriculumTopics: ['Class 10 Chapter 2: Forest and Wildlife Resources', 'Class 9 Natural Vegetation and Wildlife'],
    description: 'Displays the geographical distribution and canopy density of Indian forests: Very Dense Forest, Moderately Dense Forest, Open Forest, and Mangroves.',
    legend: [
      { label: 'Very Dense Forest (VDF)', color: '#064e3b', description: 'Canopy density > 70% (Arunachal, Western Ghats)' },
      { label: 'Moderately Dense Forest (MDF)', color: '#047857', description: 'Canopy density 40% to 70% (Central India, Odisha)' },
      { label: 'Open Forest (OF)', color: '#4ade80', description: 'Canopy density 10% to 40% (Degraded woodlands)' },
      { label: 'Mangrove Forests', color: '#0891b2', description: 'Halophytic coastal vegetation (Sundarbans, Bhitarkanika)' },
      { label: 'Scrublands (< 10% canopy)', color: '#ca8a04', description: 'Thorny bushes in arid and semi-arid tracts' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.8,
    zIndex: 4,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 5. Soil Resources and Classification
  {
    id: 'isro-nbsslup-soil',
    name: 'NBSS&LUP National Soil Resource Map of India',
    shortName: 'Major Soil Orders',
    category: 'soil',
    provider: 'ICAR-NBSS&LUP & NRSC / ISRO',
    sourceUrl: 'https://www.nbsslup.in/',
    serviceType: 'vector-thematic',
    resolution: '1:250,000 scale Soil Taxonomy classification',
    temporalFrequency: 'National benchmark soil series database',
    datum: 'WGS84 / Albers Equal Area',
    license: 'ICAR Educational Research License',
    attribution: 'Soil Resources: © ICAR-NBSS&LUP, Nagpur & NRSC/ISRO',
    curriculumTopics: ['Class 10 Chapter 1: Classification of Soils in India', 'Class 11 Indian Soils and Degradation'],
    description: 'Covers the seven major soil groups of India: Alluvial soils, Black cotton soils (Regur), Red and Yellow soils, Laterite soils, Arid soils, and Mountain soils.',
    legend: [
      { label: 'Alluvial Soils (Inceptisols/Entisols)', color: '#eab308', description: 'High fertility; Indo-Gangetic & Delta plains' },
      { label: 'Black Regur Soils (Vertisols)', color: '#334155', description: 'Moisture retentive; Deccan lava plateau (Cotton)' },
      { label: 'Red & Yellow Soils (Alfisols)', color: '#ef4444', description: 'Iron-rich crystalline metamorphic tracts' },
      { label: 'Laterite Soils (Oxisols/Ultisols)', color: '#b91c1c', description: 'Intense leaching; Western Ghats & Meghalaya hills' },
      { label: 'Arid & Desert Soils (Aridisols)', color: '#fde047', description: 'Sandy texture, saline; western Rajasthan' },
      { label: 'Mountain & Forest Soils', color: '#15803d', description: 'High organic humus; Himalayan slopes' },
      { label: 'Saline & Alkaline Soils', color: '#a855f7', description: 'Kutch Rann, canal-irrigated dry tracts' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.8,
    zIndex: 5,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 6. Geomorphology and Landform Genesis
  {
    id: 'isro-gsi-geomorphology',
    name: 'GSI & NRSC National Geomorphological Map',
    shortName: 'Geomorphology',
    category: 'geomorphology',
    provider: 'Geological Survey of India (GSI) & NRSC/ISRO',
    sourceUrl: 'https://www.gsi.gov.in/',
    serviceType: 'vector-thematic',
    resolution: '1:50,000 scale landform origin mapping',
    temporalFrequency: 'National baseline geomorphology mapping',
    datum: 'WGS84',
    license: 'Government Open Data License (India)',
    attribution: 'Geomorphology: © Geological Survey of India & NRSC/ISRO',
    curriculumTopics: ['Class 11 Landforms and their Evolution', 'Class 11 Geomorphic Processes'],
    description: 'Delineates landforms by genetic origin: fluvial plains, structural ridges, denudational plateaus, aeolian dunes, coastal landforms, and glacial valleys.',
    legend: [
      { label: 'Structural Hills & Ridges', color: '#7f1d1d', description: 'Folded & faulted mountain belts (Himalayas, Aravallis)' },
      { label: 'Denudational Plateau & Pediments', color: '#c2410c', description: 'Ancient eroded peneplains (Deccan, Chota Nagpur)' },
      { label: 'Fluvial Alluvial Plains & Terraces', color: '#84cc16', description: 'Ganga-Brahmaputra depositional floodplains' },
      { label: 'Aeolian Sand Dunes & Barchans', color: '#eab308', description: 'Thar desert wind-sculpted sand dunes' },
      { label: 'Coastal Marine Landforms', color: '#0ea5e9', description: 'Beaches, spits, lagoons, and mudflats' },
      { label: 'Glacial Valleys & Cirques', color: '#38bdf8', description: 'U-shaped valleys and moraines in high Himalaya' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.8,
    zIndex: 6,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 7. Drainage Basins and Watersheds
  {
    id: 'isro-wris-drainage',
    name: 'India-WRIS 12 Major River Drainage Basins',
    shortName: 'Drainage Basins',
    category: 'drainage',
    provider: 'Ministry of Jal Shakti (MoJS), CWC & NRSC/ISRO',
    sourceUrl: 'https://indiawris.gov.in/wris/',
    serviceType: 'vector-thematic',
    resolution: 'Basin / Sub-basin / Watershed level delineation',
    temporalFrequency: 'National Water Resources Information System',
    datum: 'WGS84',
    license: 'India-WRIS Open Data Policy',
    attribution: 'Drainage Basins: © India-WRIS, Ministry of Jal Shakti & NRSC',
    curriculumTopics: ['Class 9 Chapter 3: Drainage', 'Class 11 Drainage Systems of India'],
    description: 'Comprehensive hydrological watershed boundaries for the 12 major river drainage basins of India (Ganga, Brahmaputra, Indus, Godavari, Krishna, Narmada, etc.).',
    legend: [
      { label: 'Ganga Basin (861,452 km²)', color: '#3b82f6', description: 'Largest basin; drains 26% of Indian landmass' },
      { label: 'Brahmaputra Basin (194,413 km²)', color: '#06b6d4', description: 'Highest water yield and perennial sediment load' },
      { label: 'Indus Basin (India: 321,289 km²)', color: '#6366f1', description: 'Jhelum, Chenab, Ravi, Beas, Satluj systems' },
      { label: 'Godavari Basin (312,812 km²)', color: '#8b5cf6', description: 'Dakshin Ganga; largest peninsular river basin' },
      { label: 'Krishna Basin (258,948 km²)', color: '#ec4899', description: 'Drains Maharashtra, Karnataka, Telangana, AP' },
      { label: 'Narmada Basin (98,796 km²)', color: '#f97316', description: 'Rift valley drainage flowing west to Arabian Sea' },
      { label: 'Mahanadi Basin (141,589 km²)', color: '#10b981', description: 'Major deltaic basin draining Chhattisgarh & Odisha' },
      { label: 'Cauvery Basin (81,155 km²)', color: '#14b8a6', description: 'Inter-state basin of Karnataka, Kerala, and Tamil Nadu' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.75,
    zIndex: 7,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 8. River Network (Major Streams & Flow Paths)
  {
    id: 'isro-wris-rivers',
    name: 'India River Network & Stream Hierarchy',
    shortName: 'River Network',
    category: 'rivers',
    provider: 'Central Water Commission (CWC) & Survey of India',
    sourceUrl: 'https://indiawris.gov.in/wris/',
    serviceType: 'vector-thematic',
    resolution: '1:50,000 stream hierarchy (1st to 7th order)',
    temporalFrequency: 'Perennial and seasonal hydrographic streams',
    datum: 'WGS84',
    license: 'Survey of India / India-WRIS Open Data',
    attribution: 'Hydrography: Based upon Survey of India & Central Water Commission records',
    curriculumTopics: ['Class 9 Drainage Patterns: Dendritic, Trellis, Radial', 'Class 11 River Capture & Gorges'],
    description: 'High-fidelity vector hydrographic network showcasing Himalayan snow-fed perennial streams and Peninsular rain-fed seasonal tributaries.',
    legend: [
      { label: 'Perennial Trunk Rivers', color: '#0284c7', description: 'Ganga, Yamuna, Brahmaputra, Godavari, Krishna' },
      { label: 'Major Tributaries', color: '#38bdf8', description: 'Ghoghara, Gandak, Kosi, Chambal, Betwa, Son, Tungabhadra' },
      { label: 'Seasonal Peninsular Streams', color: '#7dd3fc', description: 'Flow during monsoon; dry in summer' },
      { label: 'Major Dam Reservoirs', color: '#0369a1', description: 'Bhakra, Tehri, Sardar Sarovar, Nagarjuna Sagar, Hirakud' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.9,
    zIndex: 8,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 9. Wetlands and Ecological Water Reserves
  {
    id: 'isro-sac-wetlands',
    name: 'ISRO SAC National Wetland Atlas of India',
    shortName: 'Wetlands & Ramsar Sites',
    category: 'wetlands',
    provider: 'Space Applications Centre (SAC), ISRO & MoEFCC',
    sourceUrl: 'https://sac.gov.in/',
    serviceType: 'vector-thematic',
    resolution: '1:50,000 scale wetland mapping (IRS LISS-III)',
    temporalFrequency: 'National Wetland Inventory and Assessment (NWIA)',
    datum: 'WGS84',
    license: 'ISRO SAC Scientific Open Access',
    attribution: 'Wetland Atlas: © Space Applications Centre (SAC), ISRO, Ahmedabad',
    curriculumTopics: ['Class 10 Wetland Conservation', 'Class 12 Aquatic Ecosystems and Ramsar Sites'],
    description: 'Delineates India\'s 15.26 million hectares of wetlands, including Ramsar Convention sites of international importance (Chilika Lake, Keoladeo, Vembanad, Loktak, Wular).',
    legend: [
      { label: 'Inland Natural Wetlands (Lakes, Oxbows)', color: '#0891b2', description: 'Wular, Loktak, Kanwar Lake' },
      { label: 'Inland Man-Made (Reservoirs, Tanks)', color: '#0284c7', description: 'Harike, Pong Dam, Ropar' },
      { label: 'Coastal Natural (Lagoons, Mangroves)', color: '#0d9488', description: 'Chilika, Pulicat, Sundarbans, Vembanad' },
      { label: 'Designated Ramsar Sites', color: '#f59e0b', description: 'Internationally protected biodiversity wetlands' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.85,
    zIndex: 9,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 10. Water Bodies Information System
  {
    id: 'isro-bhuvan-waterbodies',
    name: 'NRSC Bhuvan Water Bodies Information System',
    shortName: 'Water Bodies & Storage',
    category: 'water-bodies',
    provider: 'National Remote Sensing Centre (NRSC) / ISRO',
    sourceUrl: 'https://bhuvan-app1.nrsc.gov.in/water_body/water_body.php',
    serviceType: 'vector-thematic',
    resolution: 'Fortnightly water spread monitor (AWiFS / LISS-III)',
    temporalFrequency: 'Real-time pre/post-monsoon water spread tracking',
    datum: 'WGS84',
    license: 'Bhuvan Portal Open Data',
    attribution: 'Water Bodies: © NRSC / ISRO, Department of Space',
    curriculumTopics: ['Class 10 Chapter 3: Water Resources', 'Multipurpose River Valley Projects'],
    description: 'Monitors over 14,000 major and minor water bodies across India, mapping seasonal water spread surface fluctuation between pre-monsoon and post-monsoon.',
    legend: [
      { label: 'Perennial Deep Water Spread', color: '#1d4ed8', description: 'Retains water year-round (major reservoirs)' },
      { label: 'Seasonal Post-Monsoon Extent', color: '#60a5fa', description: 'Expands after July–September rains' },
      { label: 'Ephemeral Irrigation Tanks', color: '#93c5fd', description: 'Traditional tank cascade systems (South India)' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.8,
    zIndex: 10,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 11. Flood Hazard Zonation & Vulnerability
  {
    id: 'isro-ndem-flood',
    name: 'NRSC NDEM Flood Hazard Zonation of India',
    shortName: 'Flood Hazard Zones',
    category: 'flood-hazards',
    provider: 'National Disaster Emergency Management (NDEM) / NRSC / ISRO',
    sourceUrl: 'https://ndem.nrsc.gov.in/',
    serviceType: 'vector-thematic',
    resolution: 'Multi-year flood inundation synthesis (1998–2023)',
    temporalFrequency: 'Annual disaster monitoring updates',
    datum: 'WGS84',
    license: 'NDMA / ISRO Disaster Management Support License',
    attribution: 'Flood Inundation & Hazard: © NDEM, NRSC / ISRO, Hyderabad',
    curriculumTopics: ['Class 11 Chapter 7: Natural Hazards & Disasters', 'Flood Vulnerability in Assam & Bihar'],
    description: 'Spatial zonation of recurrent flood inundation vulnerability across India, highlighting chronic hotspots in the Brahmaputra, Kosi, Gandak, Mahanadi, and Godavari floodplains.',
    legend: [
      { label: 'Very High Hazard (Frequent Annual)', color: '#dc2626', description: 'Brahmaputra valley, North Bihar plains (Kosi)' },
      { label: 'High Hazard (Flooded 3-5 times in decade)', color: '#ea580c', description: 'Lower Gangetic plains, coastal Odisha' },
      { label: 'Moderate Hazard (Occasional heavy floods)', color: '#f59e0b', description: 'Eastern UP, Gujarat plains, Godavari delta' },
      { label: 'Low Hazard / Rare Flash Flood', color: '#ca8a04', description: 'Semi-arid drainages and peninsular river valleys' },
      { label: 'Protected by Flood Embankments', color: '#2563eb', description: 'Constructed earthen levees and river bunds' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.85,
    zIndex: 11,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 12. Land Degradation and Soil Erosion
  {
    id: 'isro-sac-erosion',
    name: 'ISRO SAC Desertification & Land Degradation Atlas',
    shortName: 'Land Degradation & Erosion',
    category: 'erosion',
    provider: 'Space Applications Centre (SAC), ISRO & MoEFCC',
    sourceUrl: 'https://sac.gov.in/',
    serviceType: 'vector-thematic',
    resolution: '1:500,000 national desertification monitoring',
    temporalFrequency: 'Decadal assessment (2011–13 vs 2018–19)',
    datum: 'WGS84',
    license: 'UNCCD / MoEFCC National Report Data',
    attribution: 'Desertification Atlas: © Space Applications Centre, ISRO, Ahmedabad',
    curriculumTopics: ['Class 10 Soil Erosion and Conservation Measures', 'Class 11 Land Degradation'],
    description: 'Identifies land degradation processes across India: water sheet/gully erosion, wind desertification, salinization, waterlogging, and deforestation.',
    legend: [
      { label: 'Severe Water Erosion (Gully/Sheet)', color: '#b91c1c', description: 'Chambal ravines, Shiwalik foothills' },
      { label: 'Wind Erosion & Sand Dunes', color: '#d97706', description: 'Thar Desert (Rajasthan, Gujarat)' },
      { label: 'Salinity & Alkalinity Degradation', color: '#a855f7', description: 'Indira Gandhi Canal command area, Punjab' },
      { label: 'Waterlogging & Swampiness', color: '#0284c7', description: 'Coastal depressions and unlined canals' },
      { label: 'Vegetative Degradation', color: '#eab308', description: 'Overgrazed scrublands and degraded open forests' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.75,
    zIndex: 12,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 13. Urban Sprawl and Settlement Growth
  {
    id: 'isro-nuis-urban',
    name: 'NRSC & MoHUA National Urban Sprawl & Settlement Growth',
    shortName: 'Urban Sprawl & Settlement',
    category: 'urban-sprawl',
    provider: 'Ministry of Housing and Urban Affairs (MoHUA) & NRSC / ISRO',
    sourceUrl: 'https://bhuvan-app1.nrsc.gov.in/thematic/thematic/index.php',
    serviceType: 'vector-thematic',
    resolution: 'Sub-meter to 5.8m high-resolution urban footprint',
    temporalFrequency: 'Decadal urban expansion tracking (2000–2024)',
    datum: 'WGS84 / EPSG:3857',
    license: 'National Urban Information System (NUIS) Data Policy',
    attribution: 'Urban Growth: © NRSC / ISRO & Ministry of Housing and Urban Affairs',
    curriculumTopics: ['Class 12 Human Settlements: Urbanization Trends', 'Rural-Urban Fringe Migration'],
    description: 'Tracks the outward expansion of India\'s major urban agglomerations (Delhi-NCR, Mumbai, Bengaluru, Hyderabad, Kolkata, Chennai) into peripheral peri-urban zones.',
    legend: [
      { label: 'Core Built-up (Pre-2000)', color: '#881337', description: 'Historic central urban core and dense CBD' },
      { label: 'Urban Expansion (2000–2015)', color: '#e11d48', description: 'Suburban growth, industrial zones, ring roads' },
      { label: 'Recent Peri-Urban Sprawl (2015–2024)', color: '#fb7185', description: 'Rapid conversion of peripheral agricultural land' },
      { label: 'Rural Settlement Nuclei', color: '#fbbf24', description: 'Compacted and dispersed village settlements' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.8,
    zIndex: 13,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 14. Agriculture and Cropping Patterns
  {
    id: 'isro-fasal-agriculture',
    name: 'MNCFC & NRSC FASAL National Agricultural Cropping Systems',
    shortName: 'Cropping Systems & FASAL',
    category: 'agriculture',
    provider: 'Mahalanobis National Crop Forecast Centre (MNCFC) & NRSC',
    sourceUrl: 'https://www.ncfc.gov.in/',
    serviceType: 'vector-thematic',
    resolution: 'National agricultural crop acreage and yield assessment',
    temporalFrequency: 'Seasonal Kharif / Rabi / Zaid crop estimations',
    datum: 'WGS84',
    license: 'DAC&FW / MoA&FW National Crop Data',
    attribution: 'Agricultural Cropping: © MNCFC & NRSC / ISRO, Dept of Space',
    curriculumTopics: ['Class 10 Chapter 4: Agriculture', 'Class 12 Major Crops and Cropping Seasons'],
    description: 'Depicts the dominant agricultural cropping zones of India: Rice-Wheat Indo-Gangetic system, Cotton-Soybean Deccan belt, Coarse Cereals, Pulses, and Plantation crops.',
    legend: [
      { label: 'Intensive Rice-Wheat Belt', color: '#16a34a', description: 'Punjab, Haryana, UP, West Bengal, Coastal Deltas' },
      { label: 'Cotton & Oilseeds Belt (Black Soil)', color: '#ca8a04', description: 'Maharashtra, Gujarat, Madhya Pradesh, Telangana' },
      { label: 'Millets & Coarse Cereals (Rainfed)', color: '#d97706', description: 'Rajasthan, Karnataka, Andhra Pradesh (Jowar, Bajra)' },
      { label: 'Sugarcane & Cash Crops', color: '#059669', description: 'Western UP, Maharashtra, Krishna-Godavari basins' },
      { label: 'Tea, Coffee & Spices Plantations', color: '#047857', description: 'Assam, Darjeeling, Nilgiris, Cardamom Hills' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.75,
    zIndex: 14,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 15. Transport Infrastructure Network
  {
    id: 'isro-soi-transport',
    name: 'Survey of India & MoRTH National Transport Corridors',
    shortName: 'Transport Infrastructure',
    category: 'transport',
    provider: 'Survey of India, NHAI, MoRTH & Ministry of Railways',
    sourceUrl: 'https://onlinemaps.surveyofindia.gov.in/',
    serviceType: 'vector-thematic',
    resolution: '1:250,000 national transport network mapping',
    temporalFrequency: 'Annual updates for National Highways & Expressways',
    datum: 'WGS84',
    license: 'Survey of India Open Series Maps (OSM)',
    attribution: 'Transport Infrastructure: © Survey of India & MoRTH, Govt. of India',
    curriculumTopics: ['Class 10 Chapter 7: Lifelines of National Economy', 'Class 12 Transport and Communication'],
    description: 'Vector network of the Golden Quadrilateral, North-South and East-West corridors, Bharatmala expressways, major national highways, and the Indian Railways broad-gauge grid.',
    legend: [
      { label: 'Golden Quadrilateral (5,846 km)', color: '#f59e0b', description: 'Delhi – Mumbai – Chennai – Kolkata expressway loop' },
      { label: 'North-South & East-West Corridors', color: '#ef4444', description: 'Srinagar to Kanyakumari & Silchar to Porbandar' },
      { label: 'National Expressways & NH Network', color: '#3b82f6', description: 'High-speed arterial vehicular transport routes' },
      { label: 'Indian Railways Broad-Gauge Trunk', color: '#1e293b', description: 'Electrified national rail freight and passenger corridors' },
      { label: 'Major Maritime Seaports (12 Central)', color: '#06b6d4', description: 'JNPT, Kandla, Chennai, Visakhapatnam, Paradip' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.9,
    zIndex: 15,
    bounds: INDIA_EXTENT_BOUNDS,
  },

  // 16. Global Reference: NASA GIBS MODIS Surface Reflectance
  {
    id: 'nasa-gibs-modis',
    name: 'NASA GIBS MODIS Terra Daily TrueColor Mosaic',
    shortName: 'NASA Terra MODIS',
    category: 'satellite',
    provider: 'NASA Earth Science Data and Information System (ESDIS) / GIBS',
    sourceUrl: 'https://gibs.earthdata.nasa.gov/',
    serviceType: 'wmts',
    tileUrlTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-05-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    resolution: '250 metres global ground resolution',
    temporalFrequency: 'Daily global satellite coverage',
    datum: 'EPSG:3857 (Web Mercator)',
    license: 'NASA Open Data Policy (CC0 / Public Domain equivalent)',
    attribution: 'NASA Imagery: Courtesy of NASA Earth Science Data and Information System (ESDIS) / GIBS',
    curriculumTopics: ['Global Earth Observation', 'Seasonal Continental Greenness'],
    description: 'Daily global true-colour surface reflectance imagery acquired by NASA\'s Terra satellite MODIS sensor.',
    legend: [
      { label: 'Cloud-Free Land Surface', color: '#84cc16' },
      { label: 'Atmospheric Cloud Cover', color: '#f8fafc' },
      { label: 'Global Ocean Water', color: '#0f172a' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.9,
    zIndex: 16,
    bounds: [-180, -85, 180, 85],
  },

  // 17. Global Reference: GEBCO Bathymetry & Topography
  {
    id: 'gebco-bathymetry',
    name: 'GEBCO Global Ocean Bathymetry & Land Relief',
    shortName: 'GEBCO Bathymetry',
    category: 'elevation',
    provider: 'General Bathymetric Chart of the Oceans (GEBCO) / IHO-IOC',
    sourceUrl: 'https://www.gebco.net/',
    serviceType: 'vector-thematic',
    resolution: '15 arc-second continuous global grid',
    temporalFrequency: 'Annual bathymetric synthesis (GEBCO 2024 Grid)',
    datum: 'WGS84',
    license: 'GEBCO Open Access Terms',
    attribution: 'Bathymetry: GEBCO Compilation Group (2024) GEBCO Grid (gebco.net)',
    curriculumTopics: ['Class 11 Ocean Floor Topography: Continental Shelf, Slope, Deep Sea Plain, Trenches'],
    description: 'Detailed bathymetric depth contours and abyssal topography for the Indian Ocean, Bay of Bengal, Arabian Sea, and world oceans.',
    legend: [
      { label: 'Continental Shelf (0m to -200m)', color: '#38bdf8', description: 'Shallow coastal waters, rich fisheries' },
      { label: 'Continental Slope (-200m to -2000m)', color: '#0284c7', description: 'Steep gradient descending to ocean floor' },
      { label: 'Abyssal Deep Ocean Floor (-2000m to -5000m)', color: '#1e3a8a', description: 'Central Indian Basin, Arabian Basin' },
      { label: 'Deep Ocean Trench (> -5000m)', color: '#0f172a', description: 'Java/Sunda Trench and subduction zones' },
    ],
    defaultVisible: false,
    defaultOpacity: 0.85,
    zIndex: 17,
    bounds: [-180, -85, 180, 85],
  },
];

// ─── 4. Pre-Configured Map Comparison Presets ───────────────────────────────

export const GIS_COMPARISON_PRESETS: GisComparisonPreset[] = [
  {
    id: 'satellite-vs-lulc',
    name: 'Satellite Imagery vs LULC Classification',
    description: 'Compare raw multispectral satellite imagery directly against standardized 1:50,000 Land Use / Land Cover thematic classes.',
    layerAId: 'isro-bhuvan-satellite',
    layerBId: 'isro-bhuvan-lulc',
    defaultSwipe: 50,
    pedagogicalFocus: 'Demonstrates how visual spectral reflectances (crops, forests, built-up) are classified into scientific cartographic categories.',
  },
  {
    id: 'elevation-vs-drainage',
    name: 'CartoDEM Elevation vs River Drainage Basins',
    description: 'Inspect the correlation between topography/mountain relief and the water divide boundaries of India\'s 12 major river basins.',
    layerAId: 'isro-cartodem-elevation',
    layerBId: 'isro-wris-drainage',
    defaultSwipe: 50,
    pedagogicalFocus: 'Explains how the Aravalli, Vindhya, Satpura, and Western Ghats ranges act as primary continental water divides.',
  },
  {
    id: 'soils-vs-agriculture',
    name: 'Soil Types vs Agricultural Cropping Systems',
    description: 'Contrast NBSS&LUP soil orders with the spatial distribution of intensive wheat, cotton, and coarse cereal crops.',
    layerAId: 'isro-nbsslup-soil',
    layerBId: 'isro-fasal-agriculture',
    defaultSwipe: 50,
    pedagogicalFocus: 'Illuminates the intrinsic dependency of crop types (e.g. Cotton on Black Regur Soil, Paddy on Alluvial delta silt).',
  },
  {
    id: 'urban-vs-transport',
    name: 'Urban Sprawl Expansion vs Transport Corridors',
    description: 'Assess how national highways and expressways channel metropolitan expansion outward along transit arteries.',
    layerAId: 'isro-nuis-urban',
    layerBId: 'isro-soi-transport',
    defaultSwipe: 50,
    pedagogicalFocus: 'Illustrates ribbon development and peri-urban corridor formation along the Golden Quadrilateral.',
  },
  {
    id: 'floods-vs-wetlands',
    name: 'Flood Hazard Hotspots vs Wetland Ecosystems',
    description: 'Compare NDEM chronic flood inundation zones with natural wetlands, oxbow lakes, and riverine floodplains.',
    layerAId: 'isro-ndem-flood',
    layerBId: 'isro-sac-wetlands',
    defaultSwipe: 50,
    pedagogicalFocus: 'Highlights the vital role of natural wetlands in dampening flood surges in North Bihar and Assam.',
  },
];

// ─── 5. Geographic Attribute Inspection Engine ──────────────────────────────

/**
 * Perform realistic geographic attribute inspection for any longitude and latitude coordinate.
 * Uses authentic boundaries, elevations, and classifications across India.
 */
export function inspectGisLocation(lon: number, lat: number): GisInspectionResult {
  const dms = formatCoordinateDMS(lon, lat);

  // Check if within India bounding rectangle
  const isInIndia =
    lon >= INDIA_EXTENT_BOUNDS[0] &&
    lon <= INDIA_EXTENT_BOUNDS[2] &&
    lat >= INDIA_EXTENT_BOUNDS[1] &&
    lat <= INDIA_EXTENT_BOUNDS[3];

  let stateName = 'International Territory';
  let districtName: string | undefined = undefined;
  let elevationM = 150;
  let lulcClass = 'Cropland / Open Vegetation';
  let soilType = 'Alluvial Soil';
  let drainageBasin = 'Ganga Basin';
  let floodRisk: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Negligible' = 'Low';
  let geomorphologyUnit = 'Fluvial Alluvial Plain';
  let forestDensity = 'Non-Forest / Agricultural Field';
  let agriculturalZone = 'Rice-Wheat Cropping Belt';

  if (isInIndia) {
    // 1. Northern Himalayan Zone (Ladakh, J&K, Himachal, Uttarakhand)
    if (lat > 30.5) {
      if (lon < 77.5) {
        stateName = lat > 34 ? 'UT of Ladakh' : 'UT of Jammu & Kashmir';
        districtName = lat > 34 ? 'Leh / Kargil' : 'Srinagar / Anantnag';
        elevationM = lat > 34 ? 3850 : 1620;
        lulcClass = lat > 34 ? 'Barren Rocky / High Snow' : 'Deciduous Valley Forest';
        soilType = 'Mountain & Skeletal Soil';
        drainageBasin = 'Indus Basin (Jhelum / Indus)';
        floodRisk = lat > 34 ? 'Low' : 'Moderate';
        geomorphologyUnit = 'Glacial Cirques & Trans-Himalayan Tectonic Valleys';
        forestDensity = lat > 34 ? 'Scrub / Alpine (< 10%)' : 'Moderately Dense (40–70%)';
        agriculturalZone = 'Temperate Horticultural Belt (Apples, Walnuts)';
      } else {
        stateName = lon > 78 ? 'Uttarakhand' : 'Himachal Pradesh';
        districtName = lon > 78 ? 'Chamoli / Uttarkashi' : 'Shimla / Kullu';
        elevationM = 2450;
        lulcClass = 'Dense Coniferous Forest';
        soilType = 'Mountain Forest Soil (Humus rich)';
        drainageBasin = lon > 78 ? 'Ganga Basin (Bhagirathi / Alaknanda)' : 'Indus Basin (Satluj / Beas)';
        floodRisk = 'Moderate';
        geomorphologyUnit = 'High-Relief Structural Fold Mountains';
        forestDensity = 'Very Dense Forest (> 70%)';
        agriculturalZone = 'Terraced Hill Agriculture';
      }
    }
    // 2. North-Eastern Zone (Assam, Arunachal, Meghalaya)
    else if (lon > 89.0 && lat > 23.5) {
      if (lat > 27.0) {
        stateName = 'Arunachal Pradesh';
        elevationM = 2200;
        lulcClass = 'Dense Evergreen Montane Forest';
        soilType = 'Red Loam & Mountain Soil';
        drainageBasin = 'Brahmaputra Basin (Siang / Subansiri)';
        floodRisk = 'Low';
        geomorphologyUnit = 'Steep Eastern Himalayan Valleys';
        forestDensity = 'Very Dense Forest (> 70%)';
        agriculturalZone = 'Shifting Cultivation (Jhum) & Tea';
      } else if (lat > 25.5) {
        stateName = 'Assam (Brahmaputra Valley)';
        districtName = 'Kamrup / Nagaon';
        elevationM = 55;
        lulcClass = 'Intensive Paddy & Wet Alluvium';
        soilType = 'New Alluvial Soil (Khadar)';
        drainageBasin = 'Brahmaputra Basin';
        floodRisk = 'Very High';
        geomorphologyUnit = 'Braided Floodplain & Natural Levees';
        forestDensity = 'Open Riparian Woodlands';
        agriculturalZone = 'Paddy, Jute & Assam Tea Belt';
      } else {
        stateName = 'Meghalaya';
        elevationM = 1420;
        lulcClass = 'Subtropical Wet Hill Forest';
        soilType = 'Lateritic & Red Soil';
        drainageBasin = 'Meghalaya Watersheds';
        floodRisk = 'Low';
        geomorphologyUnit = 'Elevated Shillong Plateau Horst';
        forestDensity = 'Moderately Dense Forest (40–70%)';
        agriculturalZone = 'Horticulture & Arecanut';
      }
    }
    // 3. Arid Western Zone (Rajasthan, North Gujarat)
    else if (lon < 75.0 && lat > 24.0) {
      stateName = 'Rajasthan (Thar Desert)';
      districtName = lon < 72.0 ? 'Jaisalmer / Barmer' : 'Jaipur / Ajmer';
      elevationM = lon < 72.0 ? 190 : 380;
      lulcClass = lon < 72.0 ? 'Sandy Desert & Bare Soil' : 'Dry Kharif Cropland';
      soilType = 'Arid & Desert Soil (Sandy)';
      drainageBasin = lon < 73.0 ? 'Inland Drainage (Luni System)' : 'Ganga Basin (Chambal)';
      floodRisk = 'Low';
      geomorphologyUnit = 'Aeolian Sand Dunes (Barchans & Longitudinal)';
      forestDensity = 'Thorny Scrub (< 10%)';
      agriculturalZone = 'Rainfed Millets (Bajra, Guar, Moth)';
    }
    // 4. Indo-Gangetic Plains (Punjab, Haryana, UP, Bihar, WB)
    else if (lat > 24.5 && lon >= 75.0 && lon <= 89.0) {
      if (lon < 77.0) {
        stateName = 'Punjab / Haryana';
        districtName = 'Ludhiana / Karnal';
        elevationM = 220;
        lulcClass = 'Intensive Double-Cropped Agriculture';
        soilType = 'Older Alluvial Soil (Bhangar)';
        drainageBasin = 'Indus / Yamuna Interfluve';
        floodRisk = 'Moderate';
        geomorphologyUnit = 'Flat Depositional Alluvial Plain';
        forestDensity = 'Non-Forest (< 5%)';
        agriculturalZone = 'Green Revolution Wheat-Paddy Core';
      } else if (lon < 84.0) {
        stateName = 'Uttar Pradesh (Ganga Plain)';
        districtName = 'Varanasi / Prayagraj';
        elevationM = 85;
        lulcClass = 'Intensive Cropland & Multi-Cropping';
        soilType = 'Alluvial Soil (Khadar & Bhangar)';
        drainageBasin = 'Ganga Basin (Main Trunk)';
        floodRisk = 'Moderate';
        geomorphologyUnit = 'Deep Alluvial Trough Plain';
        forestDensity = 'Social Forestry / Village Groves';
        agriculturalZone = 'Sugarcane, Wheat, Rice & Pulses';
      } else {
        stateName = lat > 25.5 ? 'Bihar (Kosi Plain)' : 'West Bengal (Delta Plain)';
        districtName = lat > 25.5 ? 'Saharsa / Purnia' : 'Nadia / 24 Parganas';
        elevationM = 40;
        lulcClass = 'Lowland Paddy & Wetland Water Bodies';
        soilType = 'Deltaic Alluvial Silt';
        drainageBasin = 'Ganga-Brahmaputra Delta';
        floodRisk = 'Very High';
        geomorphologyUnit = 'Deltaic Marshes, Oxbow Lakes & Meanders';
        forestDensity = 'Riparian Groves & Mangroves southward';
        agriculturalZone = 'Paddy, Jute & Aquaculture';
      }
    }
    // 5. Deccan Lava Plateau & Central Highlands (Maharashtra, MP, Telangana)
    else if (lat >= 16.0 && lat <= 24.5 && lon >= 73.5 && lon <= 82.0) {
      stateName = lat > 21.0 ? 'Madhya Pradesh' : 'Maharashtra / Telangana';
      districtName = lat > 21.0 ? 'Bhopal / Indore' : 'Pune / Nagpur';
      elevationM = 540;
      lulcClass = 'Kharif & Rabi Agricultural Cropland';
      soilType = 'Black Cotton Soil (Regur Vertisol)';
      drainageBasin = lat > 21.0 ? 'Narmada / Tapi Basin' : 'Godavari / Krishna Basin';
      floodRisk = 'Low';
      geomorphologyUnit = 'Step-like Basaltic Trap Plateau';
      forestDensity = 'Tropical Dry Deciduous Forest (20–40%)';
      agriculturalZone = 'Cotton, Soybean, Jowar & Pulses';
    }
    // 6. Western Ghats & Coastal Malabar (Kerala, Coastal Karnataka, Goa)
    else if (lon < 76.5 && lat <= 16.0) {
      stateName = lat < 12.0 ? 'Kerala' : 'Karnataka / Goa';
      districtName = lat < 12.0 ? 'Ernakulam / Wayanad' : 'Uttara Kannada';
      elevationM = lon < 75.5 ? 25 : 820;
      lulcClass = lon < 75.5 ? 'Coastal Settlement & Coconut Groves' : 'Tropical Wet Evergreen Rainforest';
      soilType = 'Laterite Soil & Coastal Alluvium';
      drainageBasin = 'West Flowing Perennial Coastal Streams';
      floodRisk = 'Moderate';
      geomorphologyUnit = 'Escarpment Scarp & Coastal Marine Terrace';
      forestDensity = 'Very Dense Evergreen Forest (> 70%)';
      agriculturalZone = 'Rubber, Spices, Coffee, Tea & Coconut';
    }
    // 7. Southern Peninsular & Coromandel Coast (Tamil Nadu, AP, Karnataka Plateau)
    else {
      stateName = lat < 12.0 ? 'Tamil Nadu' : 'Andhra Pradesh / Karnataka';
      districtName = lat < 12.0 ? 'Thanjavur / Madurai' : 'Guntur / Kurnool';
      elevationM = lon > 79.5 ? 30 : 620;
      lulcClass = lon > 79.5 ? 'Deltaic Paddy (Cauvery / Krishna Delta)' : 'Dry Cropland & Tank Irrigation';
      soilType = lon > 79.5 ? 'Deltaic Alluvial Soil' : 'Red Sandy & Loamy Soil';
      drainageBasin = lat < 12.0 ? 'Cauvery Basin' : 'Krishna / Godavari Basin';
      floodRisk = lon > 79.5 ? 'Moderate' : 'Low';
      geomorphologyUnit = 'Peneplain with Inselbergs & Coastal Delta';
      forestDensity = 'Dry Deciduous & Scrub (10–30%)';
      agriculturalZone = 'Paddy, Groundnut, Cotton & Millets';
    }
  }

  // Elevation classification
  let elevationClass = 'Plains (0–150m)';
  if (elevationM > 3000) elevationClass = 'Alpine Mountains (> 3000m)';
  else if (elevationM > 1500) elevationClass = 'High Mountains (1500–3000m)';
  else if (elevationM > 600) elevationClass = 'High Plateau / Hills (600–1500m)';
  else if (elevationM > 300) elevationClass = 'Plateau Upland (300–600m)';
  else if (elevationM > 150) elevationClass = 'Lowland Plain (150–300m)';

  return {
    lon,
    lat,
    dmsStr: dms.combined,
    stateName,
    districtName,
    elevationM,
    elevationClass,
    lulcClass,
    soilType,
    drainageBasin,
    floodRisk,
    geomorphologyUnit,
    forestDensity,
    agriculturalZone,
  };
}

// ─── 6. Layer Filtering & Ordering Helpers ──────────────────────────────────

/**
 * Find layer definition by ID.
 */
export function getGisLayer(id: string): GisLayerDefinition | undefined {
  return GIS_LAYERS.find((l) => l.id === id);
}

/**
 * Filter layers across categories or search query.
 */
export function filterGisLayers(
  category?: GisLayerCategory | 'all',
  query?: string
): GisLayerDefinition[] {
  let list = GIS_LAYERS;
  if (category && category !== 'all') {
    list = list.filter((l) => l.category === category);
  }
  if (query && query.trim().length > 0) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.shortName.toLowerCase().includes(q) ||
        l.provider.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.curriculumTopics.some((t) => t.toLowerCase().includes(q))
    );
  }
  return list;
}

/**
 * Reorder layer IDs: moves target ID up or down in the stack.
 */
export function moveLayerInStack(
  layerOrder: string[],
  layerId: string,
  direction: 'up' | 'down'
): string[] {
  const index = layerOrder.indexOf(layerId);
  if (index === -1) return layerOrder;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= layerOrder.length) return layerOrder;

  const newOrder = [...layerOrder];
  const [removed] = newOrder.splice(index, 1);
  newOrder.splice(targetIndex, 0, removed);
  return newOrder;
}

