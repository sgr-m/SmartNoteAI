/**
 * Geography Resource Registry
 * Centralized Authoritative Geography Educational Resource Library
 * Strictly conforms to Survey of India mandate for all Indian territorial representations.
 */

import {
  GeographyResource,
  GeoCategory,
  GeoCategoryDefinition,
  GeoFilterState,
} from './types';

export const GEOGRAPHY_CATEGORIES: GeoCategoryDefinition[] = [
  {
    id: 'globe-earth',
    name: 'Globe and Earth',
    icon: '🌐',
    description: '3D virtual globe, 23.5° axial tilt, diurnal rotation, latitude/longitude graticule, and solar day/night terminator.',
  },
  {
    id: 'world-atlas',
    name: 'World Atlas',
    icon: '🗺️',
    description: 'Survey of India World Political Map and World Hydrography with sovereign international borders.',
  },
  {
    id: 'india-maps',
    name: 'India Maps & Administration',
    icon: '🇮🇳',
    description: 'Official Survey of India 2026 political edition, national district boundary atlas, and Indian Railways network.',
  },
  {
    id: 'physical',
    name: 'Physical Geography',
    icon: '🏔️',
    description: 'Survey of India physical relief, physiographic divisions, and CWC major river drainage basins.',
  },
  {
    id: 'oceanography',
    name: 'Oceanography',
    icon: '🌊',
    description: 'Global thermohaline circulation, warm/cold ocean currents, and the 5 great subtropical gyres.',
  },
  {
    id: 'topographical',
    name: 'Topographical Maps (1:50,000)',
    icon: '📐',
    description: 'Authentic Survey of India Open Series Maps (OSM: Series 45D, 45F, 53B, 53E, 63K) and 50K National Index Grid.',
  },
  {
    id: 'outline-maps',
    name: 'Classroom Outline & Practice Maps',
    icon: '✏️',
    description: 'Official Survey of India blank outline maps, rivers outline, and state boundary worksheets for classroom practice.',
  },
];

export const GEOGRAPHY_RESOURCES: GeographyResource[] = [
  // ─── 1. Globe and Earth ──────────────────────────────────────────────────
  {
    id: 'geo-globe-solar-terminator',
    name: '3D Globe with Solar Day/Night Terminator',
    description: 'Interactive 3D virtual sphere demonstrating Earth axial tilt (23.5°), rotation direction, and astronomical day/night boundary across solstices and equinoxes.',
    category: 'globe-earth',
    educationalPurpose: 'Demonstrate causes of day/night, unequal length of days across latitudes, and seasonal variations.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary'],
    resourceType: '3d-globe',
    provider: 'NASA Visible Earth / SmartBoard Studio',
    sourceUrl: 'https://visibleearth.nasa.gov/collection/1484/blue-marble',
    licenseAndAttribution: 'NASA Public Domain / Creative Commons. Blue Marble imagery courtesy NASA Goddard Space Flight Center.',
    availabilityStatus: 'planned-stage-5',
    previewInfo: {
      thumbnailIcon: '🌐',
      projection: 'Orthographic 3D Sphere',
      layers: ['landmass', 'clouds', 'terminator', 'graticule'],
      sampleDataSummary: '23.5° axial inclination, continuous diurnal rotation, equinox/solstice date presets.',
    },
    interactionCapabilities: ['rotate-3d', 'orbit-camera', 'solar-date-slider', 'graticule-toggle'],
    tags: ['globe', 'rotation', 'seasons', 'equinox', 'solstice', 'day-night', 'earth'],
    scope: 'world',
    featured: true,
  },
  {
    id: 'geo-earth-graticule-coordinates',
    name: 'Global Latitude, Longitude & Time Zones',
    description: 'Precision coordinate grid showing Prime Meridian (Greenwich 0°), Equator, Tropics (Cancer/Capricorn), Polar Circles, and 24 International Standard Time Zones.',
    category: 'globe-earth',
    educationalPurpose: 'Teach geographical coordinate systems, latitude calculation, antipodes, and Greenwich Mean Time (GMT/UTC) conversion.',
    suitableClasses: ['primary', 'middle', 'secondary'],
    resourceType: 'interactive-map',
    provider: 'Natural Earth Cartography',
    sourceUrl: 'https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-graticules/',
    licenseAndAttribution: 'Public Domain (Natural Earth). Mathematical graticule generation.',
    availabilityStatus: 'planned-stage-3',
    previewInfo: {
      thumbnailIcon: '🧭',
      projection: 'Equirectangular / Robinson',
      layers: ['equator', 'tropics', 'meridians', 'time-zones'],
      sampleDataSummary: '15° longitudinal time-step intervals with Indian Standard Time (IST 82.5° E) highlight.',
    },
    interactionCapabilities: ['pan', 'zoom', 'coordinate-hover', 'time-calculator'],
    tags: ['coordinates', 'latitude', 'longitude', 'timezones', 'greenwich', 'ist', 'graticule'],
    scope: 'world',
  },

  // ─── 2. World Atlas ──────────────────────────────────────────────────────
  {
    id: 'geo-world-political-atlas',
    name: 'World Political Map (Official Survey of India Edition)',
    description: 'Official global political map published under the direction of the Surveyor General of India, illustrating sovereign nations, international boundaries, and national capitals.',
    category: 'world-atlas',
    educationalPurpose: 'Foundational world geography, continental divisions, geopolitical boundaries, and capital identification.',
    suitableClasses: ['primary', 'middle', 'secondary', 'senior-secondary'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India. All Indian borders strictly reflect Government of India sovereignty.',
    availabilityStatus: 'planned-stage-3',
    previewInfo: {
      thumbnailIcon: '🗺️',
      projection: 'Gall Stereographic / Survey of India Official Projection',
      layers: ['borders', 'capitals', 'country-fills', 'labels'],
      sampleDataSummary: 'Authoritative sovereign database published by Survey of India.',
    },
    interactionCapabilities: ['pan', 'zoom', 'country-select', 'projection-switch', 'label-toggle'],
    tags: ['world', 'political', 'countries', 'capitals', 'continents', 'atlas', 'soi'],
    scope: 'world',
    featured: true,
  },
  {
    id: 'geo-world-rivers-official',
    name: 'Survey of India World Map with Major Rivers',
    description: 'Official Survey of India world hydrographic map delineating principal global river systems (Amazon, Nile, Yangtze, Mississippi, Danube, Congo, Ganges, Volga) alongside sovereign borders.',
    category: 'world-atlas',
    educationalPurpose: 'Global drainage systems, major international waterways, river mouths, continental divides, and ocean drainage basins.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-3',
    previewInfo: {
      thumbnailIcon: '🌐',
      projection: 'Survey of India World Projection',
      layers: ['world-rivers', 'sovereign-borders', 'oceans', 'drainage-basins'],
      sampleDataSummary: 'Comprehensive global hydrographic compilation from Survey of India.',
    },
    interactionCapabilities: ['pan', 'zoom', 'river-highlight', 'basin-inspect'],
    tags: ['world', 'rivers', 'hydrography', 'drainage', 'amazon', 'nile', 'soi'],
    scope: 'world',
  },

  // ─── 3. India Maps & Administration ──────────────────────────────────────
  {
    id: 'geo-india-political-2026',
    name: 'Official Political Map of India (Latest 2026 Edition)',
    description: 'The authoritative 2026 updated Survey of India Political Map showing all 28 States, 8 Union Territories, state capitals, and authenticated external boundaries.',
    category: 'india-maps',
    educationalPurpose: 'Mandatory benchmark for Indian curriculum: national borders, state governance divisions, UTs of J&K and Ladakh, and coastal island territories.',
    suitableClasses: ['primary', 'middle', 'secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: '© Survey of India, Government of India. Updated 2026 Official Edition.',
    availabilityStatus: 'planned-stage-2',
    previewInfo: {
      thumbnailIcon: '🇮🇳',
      projection: 'Lambert Conformal Conic / Albers Equal Area (India)',
      defaultCenter: [78.9629, 22.5937],
      defaultZoom: 4,
      layers: ['international-boundary', 'state-boundaries', 'state-capitals', 'andaman-lakshadweep'],
      sampleDataSummary: '28 States, 8 UTs including complete Jammu & Kashmir and Ladakh boundaries.',
    },
    interactionCapabilities: ['pan', 'zoom', 'state-highlight', 'capital-inspector'],
    tags: ['india', 'soi', 'states', 'capitals', 'union-territories', 'political', '2026-edition'],
    scope: 'india',
    featured: true,
  },
  {
    id: 'geo-india-districts-administrative',
    name: 'India Administrative Districts Atlas',
    description: 'High-density administrative map containing all 780+ revenue districts across all States and Union Territories of India with headquarters markers.',
    category: 'india-maps',
    educationalPurpose: 'Detailed state-level geography, regional governance studies, district-level demographic analysis, and administrative planning.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'interactive-map',
    provider: 'Survey of India / Census of India',
    sourceUrl: 'https://indiamaps.gov.in',
    licenseAndAttribution: '© Survey of India / Registrar General & Census Commissioner of India.',
    availabilityStatus: 'planned-stage-2',
    previewInfo: {
      thumbnailIcon: '🏛️',
      projection: 'Albers Equal Area (India Standard)',
      layers: ['districts', 'headquarters', 'state-outlines'],
      sampleDataSummary: '780+ district polygons mapped to state identifiers and headquarters.',
    },
    interactionCapabilities: ['pan', 'zoom', 'district-search', 'state-filter'],
    tags: ['india', 'districts', 'administration', 'census', 'headquarters'],
    scope: 'india',
  },
  {
    id: 'geo-india-railway-network-2026',
    name: 'Official Indian Railways Network Map (23rd Edn 2026)',
    description: 'Ministry of Railways & Survey of India official 1:10,000,000 railway map displaying all zonal divisions, major junction nodes, broad gauge routes, and national freight corridors.',
    category: 'india-maps',
    educationalPurpose: 'Transport geography, economic connectivity, rail freight corridors, and urban mobility infrastructure across India.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'interactive-map',
    provider: 'Ministry of Railways / Survey of India',
    sourceUrl: 'https://indianrailways.gov.in',
    licenseAndAttribution: '© Ministry of Railways & Survey of India, Government of India.',
    availabilityStatus: 'planned-stage-2',
    previewInfo: {
      thumbnailIcon: '🚆',
      projection: 'Albers Equal Area (India)',
      layers: ['railway-lines', 'junctions', 'zonal-headquarters', 'freight-corridors'],
      sampleDataSummary: 'All 18 Railway Zones, Dedicated Freight Corridors (DFC), and national trunk routes.',
    },
    interactionCapabilities: ['pan', 'zoom', 'zone-inspect', 'route-trace'],
    tags: ['railways', 'transport', 'infrastructure', 'freight', 'connectivity', 'india'],
    scope: 'india',
  },

  // ─── 4. Physical Geography ───────────────────────────────────────────────
  {
    id: 'geo-india-physiographic-divisions',
    name: 'Physiographic Divisions of India',
    description: 'Comprehensive thematic map demarcating India\'s 6 major physiographic units: The Northern Mountains, Northern Plains, Peninsular Plateau, Indian Desert, Coastal Plains, and Islands.',
    category: 'physical',
    educationalPurpose: 'Core NCERT curriculum: understand tectonic origin, elevation contrasts, and geological age of India\'s distinct landforms.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary'],
    resourceType: 'thematic-layer',
    provider: 'Survey of India / Geological Survey of India (GSI)',
    sourceUrl: 'https://www.gsi.gov.in',
    licenseAndAttribution: '© Geological Survey of India / Survey of India.',
    availabilityStatus: 'planned-stage-3',
    previewInfo: {
      thumbnailIcon: '⛰️',
      projection: 'Albers Equal Area (India)',
      layers: ['himalayas', 'northern-plains', 'peninsular-plateau', 'thar-desert', 'western-eastern-ghats', 'islands'],
      sampleDataSummary: 'Distinct hypsometric classification with cross-sectional profiles across 24°N and 77°E.',
    },
    interactionCapabilities: ['division-isolate', 'elevation-hover', 'profile-view', 'annotation'],
    tags: ['physiography', 'himalayas', 'peninsula', 'ghats', 'plains', 'india'],
    scope: 'india',
    featured: true,
  },
  {
    id: 'geo-india-major-drainage-rivers',
    name: 'India Drainage System & River Basins',
    description: 'Dedicated cartographic map depicting CWC major river drainage basins (Indus, Ganga, Brahmaputra, Godavari, Krishna, Mahanadi, Narmada, Tapi, Cauvery) and major multipurpose dams.',
    category: 'physical',
    educationalPurpose: 'Study river courses, catchment basins, drainage patterns (dendritic, radial, trellis), and national water resources.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary'],
    resourceType: 'interactive-map',
    provider: 'Central Water Commission (CWC) / Survey of India',
    sourceUrl: 'https://bhuvan-app1.nrsc.gov.in/water/',
    licenseAndAttribution: 'Central Water Commission / Survey of India, Government of India.',
    availabilityStatus: 'planned-stage-6',
    previewInfo: {
      thumbnailIcon: '🌊',
      projection: 'Survey of India Standard',
      layers: ['river-basins', 'river-channels', 'multipurpose-dams', 'water-divides'],
      sampleDataSummary: 'Color-coded CWC catchment basins, major flow vectors, and hydel projects.',
    },
    interactionCapabilities: ['pan', 'zoom', 'basin-inspect', 'flow-trace'],
    tags: ['rivers', 'drainage', 'ganga', 'brahmaputra', 'indus', 'godavari', 'cwc'],
    scope: 'india',
    featured: true,
  },
  {
    id: 'geo-india-physical-official',
    name: 'Official Physical Map of India (Survey of India Edition)',
    description: 'Authoritative Survey of India hypsometric relief map displaying physical topography, contour elevations, mountain ranges, peaks, and river valleys across India.',
    category: 'physical',
    educationalPurpose: 'Study elevation gradients, mountain ranges (Karakoram, Zanskar, Aravalli, Vindhya, Satpura, Western/Eastern Ghats), and altitude zones.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: '© Survey of India, Government of India.',
    availabilityStatus: 'planned-stage-3',
    previewInfo: {
      thumbnailIcon: '🏔️',
      projection: 'Survey of India Official Physical Projection',
      layers: ['hypsometric-tints', 'spot-heights', 'mountain-peaks', 'contours'],
      sampleDataSummary: 'Full-color elevation relief from coastal sea level to 8,000+ metre Himalayan summits.',
    },
    interactionCapabilities: ['pan', 'zoom', 'elevation-inspect'],
    tags: ['physical', 'relief', 'himalayas', 'elevation', 'peaks', 'soi'],
    scope: 'india',
  },

  // ─── 5. Oceanography ─────────────────────────────────────────────────────
  {
    id: 'geo-ocean-currents-circulation',
    name: 'Major Global Ocean Currents & Oceanic Gyres',
    description: 'High-resolution cartographic map displaying world surface ocean currents: warm currents (Gulf Stream, Kuroshio, North/South Equatorial, Brazil, Agulhas) and cold currents (Labrador, California, Canaries, Benguela, Peru, West Wind Drift), and the 5 great subtropical gyres.',
    category: 'oceanography',
    educationalPurpose: 'Thermohaline and wind-driven circulation, Coriolis effect on currents, marine ecosystems, and maritime climate moderation.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'thematic-layer',
    provider: 'NOAA Ocean Service / Survey of India Standard',
    sourceUrl: 'https://oceanservice.noaa.gov/facts/current.html',
    licenseAndAttribution: 'Public Domain / Scientific Oceanographic Cartography.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '🌊',
      projection: 'World Cylindrical Cartographic',
      layers: ['warm-currents', 'cold-currents', 'subtropical-gyres', 'fishing-banks'],
      sampleDataSummary: 'Vector flow vectors with temperature-coded color schemes and rotating gyres.',
    },
    interactionCapabilities: ['pan', 'zoom', 'current-select', 'gyre-toggle'],
    tags: ['ocean-currents', 'gyres', 'gulf-stream', 'kuroshio', 'circulation', 'climate'],
    scope: 'world',
    featured: true,
  },

  // ─── 6. Topographical Maps (Survey of India 1:50,000 OSM) ─────────────────
  {
    id: 'geo-osm-toposheet-45d7',
    name: 'OSM Toposheet 45D/7 (G43S7) — Mount Abu & Aravalli Range',
    description: 'Survey of India 1:50,000 Open Series Map featuring Mount Abu, Guru Shikhar (1722m), Nakki Lake, steep scarp contours, radial drainage, and bench marks.',
    category: 'topographical',
    educationalPurpose: 'Contour reading, steep slope analysis, radial drainage interpretation, spot height calculation, and ICSE/CBSE toposheet examination training.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 43N / WGS84 (1:50,000 RF)',
      layers: ['contours-20m', 'grid-easting-northing', 'spot-heights', 'conventional-signs'],
      sampleDataSummary: 'Grid lines 80-95 Easting, 85-102 Northing with 20m contour intervals.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc', 'contour-profile'],
    tags: ['toposheet', '45d7', 'mount-abu', 'contours', 'soi', 'osm'],
    scope: 'india',
    featured: true,
  },
  {
    id: 'geo-osm-toposheet-45d10',
    name: 'OSM Toposheet 45D/10 (G43S10) — Palanpur & Banas Valley',
    description: 'Survey of India 1:50,000 Open Series Map of Palanpur and Banas Kantha, illustrating semi-arid alluvial plain topography, disappearing streams, and transportation corridors.',
    category: 'topographical',
    educationalPurpose: 'Gentle gradient contours, alluvial drainage, dry stream beds, and human settlement grid references.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 43N / WGS84 (1:50,000 RF)',
      layers: ['contours-20m', 'grid-easting-northing', 'dry-streams', 'railway-network'],
      sampleDataSummary: 'Grid lines 0-15 Easting, 80-95 Northing.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc'],
    tags: ['toposheet', '45d10', 'palanpur', 'banas', 'soi', 'osm'],
    scope: 'india',
  },
  {
    id: 'geo-osm-toposheet-45f3',
    name: 'OSM Toposheet 45F/3 (G43H3) — Jodhpur & Luni Inland Drainage',
    description: 'Survey of India 1:50,000 Open Series Map of Jodhpur and Pali districts in Rajasthan, demonstrating Thar desert sand dunes, ephemeral drainage, and tank reservoirs.',
    category: 'topographical',
    educationalPurpose: 'Desert geomorphology, sand ridge orientation, inland drainage patterns, and 6-figure grid references.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 43N / WGS84 (1:50,000 RF)',
      layers: ['dunes', 'ephemeral-streams', 'tanks', 'contours'],
      sampleDataSummary: 'Grid lines 50-65 Easting, 30-48 Northing.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc'],
    tags: ['toposheet', '45f3', 'jodhpur', 'luni', 'thar', 'soi'],
    scope: 'india',
  },
  {
    id: 'geo-osm-toposheet-53b7',
    name: 'OSM Toposheet 53B/7 (H43K7) — Solan, Kalka & Shiwalik Foothills',
    description: 'Survey of India 1:50,000 Open Series Map depicting the Shiwalik hill range, Kalka-Shimla mountain railway corridor, escarpments, and perennial hill streams.',
    category: 'topographical',
    educationalPurpose: 'Folded mountain contours, ridge and valley topography, hill pass identification, and slope angle calculation.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 43N / WGS84 (1:50,000 RF)',
      layers: ['shiwalik-contours', 'hill-railway', 'forests', 'spot-heights'],
      sampleDataSummary: 'High-relief Shiwalik contours with 20m interval.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc'],
    tags: ['toposheet', '53b7', 'solan', 'shiwalik', 'kalka', 'soi'],
    scope: 'india',
  },
  {
    id: 'geo-osm-toposheet-53e16',
    name: 'OSM Toposheet H43F16 / 53E16 — Shimla & Giri River Valley',
    description: 'Survey of India 1:50,000 Open Series Map of Shimla and Sirmaur districts, exhibiting deep V-shaped Himalayan valleys, dendritic drainage, and forest reserves.',
    category: 'topographical',
    educationalPurpose: 'Himalayan fluvial landforms, spurs, interlocking spurs, drainage basin delineation, and spot height interpretation.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 43N / WGS84 (1:50,000 RF)',
      layers: ['himalayan-contours', 'giri-river', 'ridge-crests', 'spot-elevations'],
      sampleDataSummary: 'Deep valley topography with spot heights exceeding 2,500m.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc'],
    tags: ['toposheet', '53e16', 'shimla', 'giri-river', 'himalayas', 'soi'],
    scope: 'india',
  },
  {
    id: 'geo-osm-toposheet-63k12',
    name: 'OSM Toposheet 63K/12 (G44Q12) — Mirzapur & Vindhyan Escarpment',
    description: 'Survey of India 1:50,000 Open Series Map showing the transition from the Ganga alluvial plains to the Vindhyan sandstone scarps and waterfall ravines.',
    category: 'topographical',
    educationalPurpose: 'Plain to plateau transitions, river meanders, escarpment cliffs, and canal irrigation networks.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 44N / WGS84 (1:50,000 RF)',
      layers: ['ganga-floodplain', 'vindhyan-scarp', 'canals', 'contours'],
      sampleDataSummary: 'Grid reference analysis across Mirzapur and Vindhyan terrain.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc'],
    tags: ['toposheet', '63k12', 'mirzapur', 'ganga', 'vindhyas', 'soi'],
    scope: 'india',
  },
  {
    id: 'geo-osm-toposheet-64p13',
    name: 'OSM Toposheet 64P/13 (F44X13) — Balangir & Eastern Ghats',
    description: 'Survey of India 1:50,000 Open Series Map of Balangir (Odisha), featuring Eastern Ghats residual hills, Mahanadi river tributaries, and forest reserves.',
    category: 'topographical',
    educationalPurpose: 'Inselbergs, residual hill topography, trellis drainage networks, and forest density reading on toposheets.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 44N / WGS84 (1:50,000 RF)',
      layers: ['eastern-ghats', 'mahanadi-catchment', 'forests', 'contours'],
      sampleDataSummary: 'Residual hills and river catchment in Western Odisha.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc'],
    tags: ['toposheet', '64p13', 'balangir', 'eastern-ghats', 'odisha', 'soi'],
    scope: 'india',
  },
  {
    id: 'geo-osm-toposheet-56d11',
    name: 'OSM Toposheet 56D/11 (E43W11) — Raichur & Tungabhadra Basin',
    description: 'Survey of India 1:50,000 Open Series Map illustrating the Deccan peninsular plateau, Tungabhadra and Krishna interfluve (Raichur Doab), and canal commands.',
    category: 'topographical',
    educationalPurpose: 'Plateau topography, river interfluve / doab morphology, canal irrigation networks, and grid references.',
    suitableClasses: ['secondary', 'senior-secondary', 'higher-ed'],
    resourceType: 'topographic-sheet',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
    availabilityStatus: 'planned-stage-4',
    previewInfo: {
      thumbnailIcon: '📐',
      projection: 'UTM Zone 43N / WGS84 (1:50,000 RF)',
      layers: ['deccan-plateau', 'tungabhadra-river', 'canals', 'contours'],
      sampleDataSummary: 'Raichur doab relief and agricultural canal networks.',
    },
    interactionCapabilities: ['pan', 'zoom', 'grid-reference-calc'],
    tags: ['toposheet', '56d11', 'raichur', 'tungabhadra', 'doab', 'deccan', 'soi'],
    scope: 'india',
  },

  // ─── 7. Classroom Outline & Practice Maps ────────────────────────────────
  {
    id: 'geo-outline-india-blank',
    name: 'Survey of India Official Blank Outline Map of India',
    description: 'Authentic Survey of India blank outline map with verified sovereign national borders, ideal for classroom drawing, student tests, and map pointing practice.',
    category: 'outline-maps',
    educationalPurpose: 'Blank slate for pen/drawing annotations: mark mountain passes, river courses, ports, and national parks.',
    suitableClasses: ['primary', 'middle', 'secondary', 'senior-secondary'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: '© Survey of India, Government of India. Official Blank Outline Map.',
    availabilityStatus: 'planned-stage-2',
    previewInfo: {
      thumbnailIcon: '✏️',
      projection: 'Survey of India Outline Standard',
      layers: ['boundary-outline', 'island-territories'],
      sampleDataSummary: 'Clean, unbroken sovereign boundary of India for teacher-led drawing.',
    },
    interactionCapabilities: ['pan', 'zoom', 'annotate'],
    tags: ['outline', 'blank', 'practice', 'worksheet', 'drawing', 'soi'],
    scope: 'india',
    featured: true,
  },
  {
    id: 'geo-outline-india-rivers',
    name: 'Survey of India Outline Map of India with Major Rivers',
    description: 'Official Survey of India educational outline map featuring primary river courses (Indus, Ganga, Brahmaputra, Narmada, Tapi, Godavari, Krishna, Cauvery) for hydrological practice.',
    category: 'outline-maps',
    educationalPurpose: 'Hydrographic map study, river identification exercises, labeling tributaries, and marking dams and reservoirs.',
    suitableClasses: ['middle', 'secondary', 'senior-secondary'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: '© Survey of India, Government of India.',
    availabilityStatus: 'planned-stage-2',
    previewInfo: {
      thumbnailIcon: '🌊',
      projection: 'Survey of India Outline Standard',
      layers: ['boundary-outline', 'river-courses'],
      sampleDataSummary: 'National outline with unlabelled river vectors for student identification.',
    },
    interactionCapabilities: ['pan', 'zoom', 'annotate'],
    tags: ['outline', 'rivers', 'practice', 'hydrology', 'soi'],
    scope: 'india',
  },
  {
    id: 'geo-outline-india-state-boundary',
    name: 'Survey of India Outline Map of India with State Boundaries',
    description: 'Official Survey of India classroom outline map illustrating sovereign external borders along with all internal State and Union Territory boundaries.',
    category: 'outline-maps',
    educationalPurpose: 'Political map coloring, state recognition drills, capital location practice, and census data shading.',
    suitableClasses: ['primary', 'middle', 'secondary'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: '© Survey of India, Government of India.',
    availabilityStatus: 'planned-stage-2',
    previewInfo: {
      thumbnailIcon: '🗺️',
      projection: 'Survey of India Outline Standard',
      layers: ['boundary-outline', 'state-boundaries'],
      sampleDataSummary: 'Complete internal administrative boundary polygons without labels.',
    },
    interactionCapabilities: ['pan', 'zoom', 'annotate'],
    tags: ['outline', 'states', 'boundaries', 'practice', 'soi'],
    scope: 'india',
  },
  {
    id: 'geo-outline-india-state-names',
    name: 'Survey of India Outline Map of India with State Names & Capitals',
    description: 'Official Survey of India educational reference map with labeled States, Union Territories, and capital city markers for classroom quick-reference.',
    category: 'outline-maps',
    educationalPurpose: 'Classroom visual reference for state names, territorial extent, and geographic orientation.',
    suitableClasses: ['primary', 'middle', 'secondary'],
    resourceType: 'interactive-map',
    provider: 'Survey of India (Government of India)',
    sourceUrl: 'https://surveyofindia.gov.in',
    licenseAndAttribution: '© Survey of India, Government of India.',
    availabilityStatus: 'planned-stage-2',
    previewInfo: {
      thumbnailIcon: '🏷️',
      projection: 'Survey of India Outline Standard',
      layers: ['boundary-outline', 'state-boundaries', 'state-names', 'capitals'],
      sampleDataSummary: 'Pre-labeled state reference map with crisp typography.',
    },
    interactionCapabilities: ['pan', 'zoom', 'annotate'],
    tags: ['outline', 'states', 'names', 'capitals', 'reference', 'soi'],
    scope: 'india',
  },
];

// ─── Storage Keys for Preferences ───────────────────────────────────────────
const STORAGE_KEY_GEO_FAVORITES = 'smartboard_geo_favorites_v1';
const STORAGE_KEY_GEO_RECENT = 'smartboard_geo_recent_v1';

let memoryFavorites: string[] = ['geo-india-political-2026', 'geo-world-political-atlas', 'geo-globe-solar-terminator'];
let memoryRecent: string[] = [];

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getCategoryDefinitions(): GeoCategoryDefinition[] {
  return GEOGRAPHY_CATEGORIES.map((cat) => ({
    ...cat,
    count: GEOGRAPHY_RESOURCES.filter((r) => r.category === cat.id).length,
  }));
}

export function getAllGeographyResources(): GeographyResource[] {
  return GEOGRAPHY_RESOURCES;
}

export function getGeographyResourceById(id: string): GeographyResource | undefined {
  return GEOGRAPHY_RESOURCES.find((r) => r.id === id);
}

export function getFavoriteResourceIds(): string[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY_GEO_FAVORITES);
      if (data) {
        memoryFavorites = JSON.parse(data);
        return memoryFavorites;
      }
    }
  } catch (err) {
    console.warn('Failed to load geography favorites from localStorage:', err);
  }
  return memoryFavorites;
}

export function toggleFavoriteResource(id: string): boolean {
  try {
    const favorites = [...getFavoriteResourceIds()];
    const idx = favorites.indexOf(id);
    let isFav = false;
    if (idx >= 0) {
      favorites.splice(idx, 1);
      isFav = false;
    } else {
      favorites.push(id);
      isFav = true;
    }
    memoryFavorites = favorites;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_GEO_FAVORITES, JSON.stringify(favorites));
    }
    return isFav;
  } catch (err) {
    console.warn('Failed to toggle geography favorite:', err);
    return false;
  }
}

export function isFavoriteResource(id: string): boolean {
  return getFavoriteResourceIds().includes(id);
}

export function getRecentResourceIds(): string[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY_GEO_RECENT);
      if (data) {
        memoryRecent = JSON.parse(data);
        return memoryRecent;
      }
    }
  } catch (err) {
    console.warn('Failed to load geography recent resources:', err);
  }
  return memoryRecent;
}

export function recordRecentResource(id: string): void {
  try {
    const recent = [...getRecentResourceIds()];
    const filtered = recent.filter((rId) => rId !== id);
    filtered.unshift(id);
    const trimmed = filtered.slice(0, 20); // Keep last 20
    memoryRecent = trimmed;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_GEO_RECENT, JSON.stringify(trimmed));
    }
  } catch (err) {
    console.warn('Failed to record recent geography resource:', err);
  }
}

export function searchGeographyResources(filters: Partial<GeoFilterState>): GeographyResource[] {
  const favorites = getFavoriteResourceIds();
  const recent = getRecentResourceIds();

  return GEOGRAPHY_RESOURCES.filter((res) => {
    // 1. Search Query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = res.name.toLowerCase().includes(q);
      const matchDesc = res.description.toLowerCase().includes(q);
      const matchPurpose = res.educationalPurpose.toLowerCase().includes(q);
      const matchProvider = res.provider.toLowerCase().includes(q);
      const matchTags = res.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchPurpose && !matchProvider && !matchTags) {
        return false;
      }
    }

    // 2. Category
    if (filters.selectedCategory && filters.selectedCategory !== 'all') {
      if (res.category !== filters.selectedCategory) return false;
    }

    // 3. Class Level
    if (filters.selectedClassLevel && filters.selectedClassLevel !== 'all') {
      if (!res.suitableClasses.includes(filters.selectedClassLevel)) return false;
    }

    // 4. Scope (India vs World vs Regional)
    if (filters.selectedScope && filters.selectedScope !== 'all') {
      if (res.scope !== filters.selectedScope) return false;
    }

    // 5. Resource Type
    if (filters.selectedType && filters.selectedType !== 'all') {
      if (res.resourceType !== filters.selectedType) return false;
    }

    // 6. Favorites Only
    if (filters.favoritesOnly) {
      if (!favorites.includes(res.id)) return false;
    }

    // 7. Recently Used Only
    if (filters.recentlyUsedOnly) {
      if (!recent.includes(res.id)) return false;
    }

    return true;
  });
}
