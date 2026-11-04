/**
 * Physical Geography Interactive Laboratory Service
 * Stage 9: Comprehensive Geomorphology, Plate Tectonics, Earthquakes,
 * Volcanoes, Weathering & Erosion, Hydrology, and Oceanography.
 *
 * Educational Compliance:
 * - Authoritative standard: NCERT, CBSE/ICSE, Geological Survey of India (GSI), USGS, and WMO/IOC.
 * - Clear disclaimer: Simulations are explicitly labeled as educational geodynamic models.
 * - Pure TypeScript models with analytical cross-sections and 3D axonometric math.
 */

// ─── 1. Module Categories & Interfaces ──────────────────────────────────────

export type PhysicalGeoCategory =
  | 'landforms'
  | 'tectonics'
  | 'earthquakes'
  | 'volcanoes'
  | 'weathering'
  | 'hydrology'
  | 'oceanography';

export interface LandformItem {
  id: string;
  name: string;
  category: 'structural' | 'fluvial' | 'glacial' | 'aeolian' | 'coastal' | 'volcanic';
  geomorphicAgent: string;
  formationProcess: string;
  realWorldExamples: string[];
  cbseExamFocalPoints: string;
  crossSectionLayers: Array<{ name: string; color: string; thickness: number }>;
  elevationFunction: (normX: number, normY: number) => number; // Returns elevation 0..1000m
  keyFeatures: string[];
}

export type TectonicBoundaryType =
  | 'divergent-oceanic'
  | 'divergent-continental'
  | 'convergent-continental'
  | 'convergent-oceanic-continental'
  | 'convergent-oceanic-oceanic'
  | 'transform-fault';

export interface TectonicBoundaryModel {
  id: TectonicBoundaryType;
  name: string;
  type: 'divergent' | 'convergent' | 'transform';
  platesInvolved: string[];
  crustalDynamics: string;
  landformsCreated: string[];
  realWorldExample: string;
  earthquakeDepth: 'shallow' | 'intermediate' | 'deep' | 'all';
  volcanismPresent: boolean;
  volcanismType?: string;
  subductionOccurs: boolean;
  schematicLayers: Array<{ label: string; color: string }>;
}

export interface TectonicPlateInfo {
  id: string;
  name: string;
  areaMillionKm2: number;
  crustType: 'oceanic' | 'continental' | 'mixed';
  motionVector: { speedMmYr: number; direction: string; azimuthDeg: number };
  adjacentPlates: string[];
  notableFeatures: string[];
}

export interface FaultModel {
  id: 'normal-fault' | 'reverse-thrust-fault' | 'strike-slip-fault';
  name: string;
  stressType: 'tension' | 'compression' | 'shear';
  hangingWallMotion: 'downward' | 'upward' | 'lateral-horizontal';
  tectonicRegime: string;
  typicalLandforms: string[];
  realWorldExample: string;
}

export interface SeismicWaveModel {
  id: 'p-wave' | 's-wave' | 'rayleigh-wave' | 'love-wave';
  name: string;
  waveClass: 'body' | 'surface';
  particleMotion: string;
  velocityKmS: number;
  propagationMedium: 'solid-liquid-gas' | 'solid-only';
  damagePotential: 'low' | 'moderate' | 'high' | 'severe';
  seismogramArrivalOrder: number;
}

export interface VolcanoTypeModel {
  id: 'shield' | 'stratovolcano' | 'cinder-cone' | 'caldera' | 'flood-basalt';
  name: string;
  magmaComposition: 'basaltic-mafic' | 'andesitic-intermediate' | 'rhyolitic-felsic';
  viscosity: 'low-fluid' | 'moderate-viscous' | 'high-viscous';
  eruptionStyle: 'effusive' | 'explosive-strombolian' | 'plinian-cataclysmic';
  slopeAngleDeg: number;
  internalStructure: string;
  realWorldExamples: string[];
  veiTypical: [number, number];
}

export interface WeatheringProcessModel {
  id: string;
  name: string;
  type: 'mechanical' | 'chemical' | 'biological';
  activeAgent: string;
  chemicalOrPhysicalReaction: string;
  climateZoneFavored: string;
  resultingFeatures: string[];
  realWorldExample: string;
}

export interface DrainagePatternModel {
  id: 'dendritic' | 'trellis' | 'radial' | 'centripetal' | 'rectangular' | 'parallel';
  name: string;
  geometricStructure: string;
  underlyingGeology: string;
  idealTectonicSetting: string;
  indianRiverExample: string;
}

export interface OceanFloorZoneModel {
  id: 'continental-shelf' | 'continental-slope' | 'continental-rise' | 'abyssal-plain' | 'mid-ocean-ridge' | 'ocean-trench';
  name: string;
  typicalDepthRangeM: [number, number];
  gradientPercent: string;
  economicOrBiologicalSignificance: string;
  sedimentType: string;
  realWorldExample: string;
}

// ─── 2. Landform Laboratory (15 Landforms with 3D/Profile Math) ─────────────

export const LANDFORM_MODELS: LandformItem[] = [
  {
    id: 'lf-fold-mountains',
    name: 'Fold Mountains (Himalayas, Alps, Andes)',
    category: 'structural',
    geomorphicAgent: 'Endogenic Compressional Tectonics',
    formationProcess:
      'Formed along convergent plate boundaries where immense horizontal compressive forces crumple, buckle, and fold sedimentary rock strata into anticlines (crests) and synclines (troughs).',
    realWorldExamples: ['Himalayas (Indo-Eurasian collision)', 'Alps (African-Eurasian)', 'Andes (Nazca-South American)'],
    cbseExamFocalPoints: 'Distinguish Young Fold Mountains (rugged, pointed peaks, deep gorges, Himalayas) from Old Fold Mountains (rounded, denuded, Aravallis/Appalachians).',
    crossSectionLayers: [
      { name: 'Overthrust Nappe / Sedimentary Cover', color: '#94a3b8', thickness: 30 },
      { name: 'Crystalline Metamorphic Core (Gneiss/Schist)', color: '#64748b', thickness: 45 },
      { name: 'Granitic Plutonic Basement', color: '#475569', thickness: 60 },
    ],
    elevationFunction: (nx, ny) => {
      // Rugged series of sharp parallel ridges with anticlines
      const ridge1 = Math.exp(-Math.pow((ny - 0.4) * 5, 2)) * 880;
      const ridge2 = Math.exp(-Math.pow((ny - 0.6) * 6, 2)) * 650;
      const rugged = Math.sin(nx * 14) * 80 + Math.cos(ny * 18) * 60;
      return Math.max(120, ridge1 + ridge2 + rugged);
    },
    keyFeatures: ['Anticlines and Synclines', 'Thrust Faults & Nappes', 'High Rugged Relief', 'Deep V-shaped Gorges'],
  },
  {
    id: 'lf-plateaus',
    name: 'Plateaus & Tablelands (Deccan Traps, Tibetan Plateau)',
    category: 'structural',
    geomorphicAgent: 'Volcanic Epeirogeny & Tectonic Uplift',
    formationProcess:
      'Elevated flat-topped tablelands with steep cliff margins (scarps). Formed by extensive fissure basalt outpourings (Deccan Traps) or large-scale continental tectonic uplift (Tibetan Plateau).',
    realWorldExamples: ['Deccan Plateau (India)', 'Tibetan Plateau (Roof of the World)', 'Colorado Plateau (USA)'],
    cbseExamFocalPoints: 'Classify into Intermontane (Tibetan), Piedmont (Patagonia), and Volcanic/Lava (Deccan) plateaus.',
    crossSectionLayers: [
      { name: 'Weathered Black Regur Soil', color: '#1e293b', thickness: 15 },
      { name: 'Layered Basaltic Lava Traps (Fissure Eruptions)', color: '#334155', thickness: 65 },
      { name: 'Precambrian Granite Gneiss Basement', color: '#475569', thickness: 50 },
    ],
    elevationFunction: (nx, ny) => {
      // Flat top tableland with steep peripheral drop-offs
      const distFromCenter = Math.hypot(nx - 0.5, ny - 0.5);
      if (distFromCenter < 0.32) {
        return 650 + Math.sin(nx * 8) * 15; // flat rolling top
      }
      const scarp = Math.max(0, 1 - (distFromCenter - 0.32) * 8);
      return 150 + scarp * 500;
    },
    keyFeatures: ['Extensive Flat Tableland', 'Steep Peripheral Scarps', 'Step-like Trap Topography', 'Mineral Richness'],
  },
  {
    id: 'lf-plains',
    name: 'Alluvial & Flood Plains (Indo-Gangetic Plains)',
    category: 'fluvial',
    geomorphicAgent: 'Running River Water (Aggradation / Deposition)',
    formationProcess:
      'Formed by the extensive, millions-of-years aggradation and deposition of alluvium (silt, sand, clay) transported by major perennial river systems from eroding mountains into subsiding foredeep basins.',
    realWorldExamples: ['Indo-Gangetic-Brahmaputra Plain (India)', 'Mississippi Plains (USA)', 'Huang He Plain (China)'],
    cbseExamFocalPoints: 'Differentiate Bhabar (gravelly permeable porous belt), Terai (marshy wet belt), Bhangar (older higher alluvium with kankar), and Khadar (newer fertile floodplain alluvium).',
    crossSectionLayers: [
      { name: 'Khadar (New Silty Alluvium)', color: '#d97706', thickness: 25 },
      { name: 'Bhangar (Old Clayey Alluvium with Kankar)', color: '#b45309', thickness: 55 },
      { name: 'Deep Foredeep Geosynclinal Sediments', color: '#78350f', thickness: 80 },
    ],
    elevationFunction: (nx, ny) => {
      // Very gentle slope (~1m drop per 5km)
      return 100 + (1 - nx) * 120 + Math.sin(ny * 6) * 10;
    },
    keyFeatures: ['Extremely Low Relief (<200m MSL)', 'Deep Fertile Alluvium', 'Meanders & Oxbow Lakes', 'High Population Density'],
  },
  {
    id: 'lf-valleys',
    name: 'Valleys: V-Shaped River Valleys & U-Shaped Glacial Troughs',
    category: 'fluvial',
    geomorphicAgent: 'River Downcutting vs Glacial Plucking & Scouring',
    formationProcess:
      'Youthful rivers carve steep V-shaped valleys through vertical hydraulic downcutting and abrasion. Glaciers remodel pre-existing river valleys into broad-bottomed, steep-sided U-shaped glacial troughs.',
    realWorldExamples: ['Indus Valley Gorge (Himalayas)', 'Yosemite Valley (U-shaped glacial trough, USA)', 'Lauterbrunnen (Switzerland)'],
    cbseExamFocalPoints: 'Compare V-shaped (fluvial, sharp interlocking spurs) with U-shaped (glacial, flat valley floor, hanging valleys, waterfalls).',
    crossSectionLayers: [
      { name: 'Valley Alluvial Fill / Scree Talus', color: '#ca8a04', thickness: 20 },
      { name: 'Bedrock Incision Floor', color: '#64748b', thickness: 60 },
      { name: 'Solid Crustal Rock', color: '#334155', thickness: 60 },
    ],
    elevationFunction: (nx, ny) => {
      // V-shaped cross section along nx
      const centerDist = Math.abs(nx - 0.5);
      return 120 + Math.pow(centerDist * 2, 1.4) * 650;
    },
    keyFeatures: ['Steep Valley Walls', 'Interlocking Spurs in Fluvial Valleys', 'Hanging Valleys & Waterfalls in Glacial', 'Gorges & Canyons'],
  },
  {
    id: 'lf-basins',
    name: 'Structural & Drainage Basins (Amazon, Congo, Ganga)',
    category: 'structural',
    geomorphicAgent: 'Regional Subsidence & Centripetal Stream Drainage',
    formationProcess:
      'Depression in the Earth surface formed either by tectonic downward warping of strata (structural basin) or defined topographically by drainage divides draining into a common river/ocean.',
    realWorldExamples: ['Ganga Drainage Basin', 'Amazon River Basin', 'Paris Structural Basin'],
    cbseExamFocalPoints: 'Define Watershed / Drainage Divide (elevated ridge separating adjacent drainage basins).',
    crossSectionLayers: [
      { name: 'Lacustrine / Fluvial Silt Deposits', color: '#eab308', thickness: 30 },
      { name: 'Synclinal Downwarped Strata', color: '#64748b', thickness: 60 },
      { name: 'Basement Cratonic Shield', color: '#334155', thickness: 50 },
    ],
    elevationFunction: (nx, ny) => {
      const dist = Math.hypot(nx - 0.5, ny - 0.5);
      return 100 + Math.min(600, Math.pow(dist * 2, 2) * 550);
    },
    keyFeatures: ['Centripetal Drainage Convergence', 'Water Collecting Reservoir', 'Surrounding Watershed Ridges', 'Rich Groundwater Aquifers'],
  },
  {
    id: 'lf-hills',
    name: 'Hills, Mesas & Buttes',
    category: 'structural',
    geomorphicAgent: 'Differential Weathering & Stream Denudation',
    formationProcess:
      'Residual landforms standing prominently above the surrounding plain, left behind as softer surrounding rock strata are eroded away by wind and rain.',
    realWorldExamples: ['Buttes of Monument Valley (USA)', 'Aravalli Hills (India)', 'Chota Nagpur Residual Hills'],
    cbseExamFocalPoints: 'Sequence of erosion: Plateau -> Mesa (broad table) -> Butte (isolated narrow pillar) -> Pinnacle.',
    crossSectionLayers: [
      { name: 'Hard Resistant Caprock (Sandstone/Basalt)', color: '#78350f', thickness: 25 },
      { name: 'Soft Erodible Shale/Clay Layers', color: '#b45309', thickness: 55 },
      { name: 'Talus Scree Slope at Base', color: '#ca8a04', thickness: 40 },
    ],
    elevationFunction: (nx, ny) => {
      const d = Math.hypot(nx - 0.5, ny - 0.5);
      return d < 0.22 ? 550 : Math.max(100, 550 - (d - 0.22) * 1800);
    },
    keyFeatures: ['Resistant Hard Caprock', 'Vertical Cliff Faces', 'Basal Talus Debris Slope', 'Relict Erosional Origin'],
  },
  {
    id: 'lf-ridges',
    name: 'Ridges, Cuestas & Hogbacks',
    category: 'structural',
    geomorphicAgent: 'Differential Denudation on Tilted Strata',
    formationProcess:
      'Elongated crests formed where alternating layers of hard resistant and soft erodible rock strata have been tilted by tectonic uplift and differentially weathered.',
    realWorldExamples: ['Shiwalik Range Cuestas (India)', 'Ridge and Valley Province (Appalachians)', 'Weald-Artois Anticline'],
    cbseExamFocalPoints: 'Cuesta: gentle dip slope (<15°) on one side, steep scarp on other. Hogback: dip slope >40° on both sides.',
    crossSectionLayers: [
      { name: 'Tilted Resistant Hard Sandstone Bed', color: '#64748b', thickness: 35 },
      { name: 'Underlying Soft Erodible Shale Bed', color: '#a16207', thickness: 55 },
      { name: 'Lower Tilted Rock Member', color: '#475569', thickness: 40 },
    ],
    elevationFunction: (nx, ny) => {
      // Asymmetric ridge along y
      const xRel = nx - 0.45;
      if (xRel < 0) return Math.max(100, 100 + (1 + xRel * 3.5) * 500); // steep scarp
      return Math.max(100, 600 - xRel * 900); // gentle dip slope
    },
    keyFeatures: ['Steep Scarp Slope', 'Gentle Dip Slope (Conforming to Dip Angle)', 'Asymmetrical Cross Section', 'Trellis Drainage'],
  },
  {
    id: 'lf-escarpments',
    name: 'Escarpments & Scarp Slopes (Western Ghats Sahyadri)',
    category: 'structural',
    geomorphicAgent: 'Continental Rifting, Faulting & Back-Wasting',
    formationProcess:
      'A continuous, steep, cliff-like vertical slope created by normal faulting during continental breakup (e.g. separation of Madagascar and India) followed by headward fluvial back-wasting.',
    realWorldExamples: ['Western Ghats / Sahyadri Scarp (India)', 'Great Escarpment (Southern Africa)', 'Niagara Escarpment (USA)'],
    cbseExamFocalPoints: 'Explain the orographic effect: Western Ghats scarp blocks SW monsoon, dropping >3000mm rain on windward side and creating leeward rain shadow.',
    crossSectionLayers: [
      { name: 'Upper Hard Basaltic Lava Flows', color: '#334155', thickness: 45 },
      { name: 'Faulted Displaced Strata', color: '#475569', thickness: 55 },
      { name: 'Coastal Down-Dropped Basement', color: '#1e293b', thickness: 50 },
    ],
    elevationFunction: (nx, ny) => {
      // Steep coastal drop on west (left), high plateau on east (right)
      if (nx < 0.35) return 80 + nx * 100; // Coastal lowland
      if (nx < 0.42) return 80 + ((nx - 0.35) / 0.07) * 950; // Dramatic vertical scarp
      return 1030 - (nx - 0.42) * 450; // Gentle eastward sloping Deccan plateau
    },
    keyFeatures: ['Dramatic Vertical Wall', 'Orographic Rain Barrier', 'Origin from Continental Rifting', 'Pronounced Rain Shadow'],
  },
  {
    id: 'lf-canyons',
    name: 'Canyons & Gorges (Grand Canyon, Indus Gorge, Gandikota)',
    category: 'fluvial',
    geomorphicAgent: 'Vertical River Incision in Arid / Semi-Arid Climates',
    formationProcess:
      'Extremely deep, narrow valleys with near-vertical stepped rock walls. Formed when a powerful river vigorously incises vertically through resistant horizontal rock strata in dry regions where lateral slope weathering is slow.',
    realWorldExamples: ['Gandikota Canyon (Pennar River, Andhra Pradesh)', 'Indus Gorge (Gilgit-Baltistan, depth >4500m)', 'Grand Canyon (Colorado River)'],
    cbseExamFocalPoints: 'Gorge has almost vertical walls and equal width at top and bottom. Canyon is wider at top with stepped terraced walls.',
    crossSectionLayers: [
      { name: 'Resistant Hard Sandstone Rim', color: '#78350f', thickness: 30 },
      { name: 'Stepped Shale and Limestone Terraces', color: '#92400e', thickness: 60 },
      { name: 'Precambrian Crystalline Gorge Floor', color: '#334155', thickness: 50 },
    ],
    elevationFunction: (nx, ny) => {
      const centerDist = Math.abs(nx - 0.5);
      if (centerDist < 0.08) return 100; // Canyon river bed
      if (centerDist < 0.28) {
        // Stepped cliffs
        const step = Math.floor((centerDist - 0.08) * 20);
        return 120 + step * 90;
      }
      return 700; // Flat surrounding plateau
    },
    keyFeatures: ['Near-Vertical Stepped Cliffs', 'Extreme Depth-to-Width Ratio', 'Arid Climate Preservation', 'Exposed Geological Time Strata'],
  },
  {
    id: 'lf-deltas',
    name: 'Deltas: Arcuate, Bird’s Foot & Estuarine (Ganga-Brahmaputra)',
    category: 'fluvial',
    geomorphicAgent: 'Fluvial Deposition at River Mouths',
    formationProcess:
      'Triangular or fan-shaped wetland landform built by deposition of river sediment as river velocity abruptly drops upon entering a standing water body (sea or lake). River bifurcates into distributaries.',
    realWorldExamples: ['Sundarbans Delta (Ganga-Brahmaputra, largest in the world)', 'Mississippi Bird’s Foot Delta (USA)', 'Nile Arcuate Delta (Egypt)'],
    cbseExamFocalPoints: 'Conditions for delta formation: large sediment load, calm tides, shallow sea shelf, absence of strong coastal currents.',
    crossSectionLayers: [
      { name: 'Topset Silty Floodplain Beds', color: '#ca8a04', thickness: 20 },
      { name: 'Foreset Sloping Sandy Beds', color: '#eab308', thickness: 50 },
      { name: 'Bottomset Fine Marine Clay Beds', color: '#3b82f6', thickness: 60 },
    ],
    elevationFunction: (nx, ny) => {
      // Fan radiating outwards with distributary channels
      const r = Math.hypot(nx - 0.5, ny);
      if (ny < 0.2) return 80;
      return Math.max(5, 75 - r * 65);
    },
    keyFeatures: ['Distributary Network', 'Topset, Foreset, Bottomset Bedding', 'Highly Dynamic Coastal Wetlands', 'Mangrove Ecosystems (Sundarbans)'],
  },
  {
    id: 'lf-alluvial-fans',
    name: 'Alluvial Fans & Piedmont Cones (Bhabar Zone)',
    category: 'fluvial',
    geomorphicAgent: 'Sudden Fluvial Velocity Deceleration at Mountain Fronts',
    formationProcess:
      'Cone-shaped deposit of coarse boulders, gravel, and sand formed where a fast-flowing mountain torrent abruptly emerges from a steep narrow gorge onto a flat piedmont plain, dumping its load.',
    realWorldExamples: ['Bhabar Belt (Himalayan foothills, Uttarakhand/UP)', 'Death Valley Alluvial Fans (USA)', 'Tarim Basin Fans (China)'],
    cbseExamFocalPoints: 'In the Himalayan Bhabar zone (8–10km wide), streams sink underground due to coarse porous gravel and re-emerge in the wet Terai zone.',
    crossSectionLayers: [
      { name: 'Coarse Boulders & Unsorted Gravel (Apex)', color: '#78350f', thickness: 35 },
      { name: 'Medium Sand & Pebble Strata (Mid-fan)', color: '#b45309', thickness: 45 },
      { name: 'Fine Silty Deposits (Toe of Fan)', color: '#d97706', thickness: 40 },
    ],
    elevationFunction: (nx, ny) => {
      // Conical fan radiating from top center apex (0.5, 0.0)
      const r = Math.hypot(nx - 0.5, ny);
      return Math.max(50, 650 - Math.pow(r, 0.8) * 600);
    },
    keyFeatures: ['Apex at Mountain Gorge Exit', 'Coarse Unsorted Gravel Apex', 'Subsurface Stream Infiltration', 'Conical Radiation Geometry'],
  },
  {
    id: 'lf-sand-dunes',
    name: 'Sand Dunes: Barchans, Seif & Transverse (Thar Desert)',
    category: 'aeolian',
    geomorphicAgent: 'Wind Action (Aeolian Saltation & Deposition)',
    formationProcess:
      'Mounds or ridges of loose windblown sand. Barchans are crescent-shaped dunes with convex backs facing the prevailing wind and two sharp horns pointing downwind.',
    realWorldExamples: ['Sam Sand Dunes (Jaisalmer, Thar Desert)', 'Sahara Desert Ergs', 'Namib Coastal Dunes'],
    cbseExamFocalPoints: 'Barchans form under unidirectional wind with limited sand supply. Seif (longitudinal) form parallel to wind. Transverse form perpendicular.',
    crossSectionLayers: [
      { name: 'Active Shifting Saltation Sand Layer', color: '#fde047', thickness: 30 },
      { name: 'Cross-Bedded Internal Aeolian Strata', color: '#eab308', thickness: 60 },
      { name: 'Compact Basement Desert Pavement', color: '#a16207', thickness: 40 },
    ],
    elevationFunction: (nx, ny) => {
      // Crescentic barchan dune profile
      const x = nx - 0.5;
      const y = ny - 0.45;
      const r = Math.hypot(x, y);
      if (r > 0.3) return 50;
      const peak = Math.max(0, 1 - r / 0.3) * 450;
      const slipFace = x > 0 ? 0.7 : 1.0;
      return 50 + peak * slipFace;
    },
    keyFeatures: ['Gentle Windward Slope (10°–15°)', 'Steep Leeward Slip Face (32°–34° Angle of Repose)', 'Downwind Pointing Horns', 'Cross-Bedding Structure'],
  },
  {
    id: 'lf-glacial-landforms',
    name: 'Glacial Landforms: Cirques, Arêtes, Horns & Moraines',
    category: 'glacial',
    geomorphicAgent: 'Moving Ice / Glaciers (Plucking & Abrasion)',
    formationProcess:
      'Cirques are amphitheatre-shaped armchair hollows gouged into mountain peaks. Where 3 or more cirques erode headward back-to-back, they leave a sharp pyramidal peak called a Horn.',
    realWorldExamples: ['Matterhorn (Switzerland)', 'Gangotri Glacier Cirque (Uttarakhand)', 'Karakoram Lateral Moraines'],
    cbseExamFocalPoints: 'Identify Erosional: Cirque, Tarn lake, Arête, Horn, U-shaped valley, Hanging valley. Depositional: Moraines (terminal/lateral/medial), Drumlins, Eskers.',
    crossSectionLayers: [
      { name: 'Moving Glacier Ice / Firn Snowpack', color: '#e0f2fe', thickness: 40 },
      { name: 'Terminal / Lateral Glacial Moraine Till', color: '#64748b', thickness: 40 },
      { name: 'Scoured Striated Bedrock Basal Floor', color: '#334155', thickness: 50 },
    ],
    elevationFunction: (nx, ny) => {
      // Pyramidal Horn peak with steep cirque bowl scoops
      const d = Math.hypot(nx - 0.5, ny - 0.5);
      const peak = Math.max(0, 1 - d * 2.2) * 850;
      // Scoop out cirque bowl
      const bowl = Math.exp(-Math.pow((nx - 0.5) * 4, 2) - Math.pow((ny - 0.35) * 4, 2)) * 320;
      return Math.max(120, 150 + peak - bowl);
    },
    keyFeatures: ['Armchair Cirque Hollows', 'Knife-Edge Arête Ridges', 'Pyramidal Horn Peaks', 'Unsorted Till in Moraines'],
  },
  {
    id: 'lf-coastal-landforms',
    name: 'Coastal Landforms: Cliffs, Wave-Cut Platforms, Arches & Stacks',
    category: 'coastal',
    geomorphicAgent: 'Ocean Waves, Breakers, and Hydraulic Quarrying',
    formationProcess:
      'Continuous wave pounding undermines the base of a sea cliff through hydraulic action and abrasion, carving a notch. The overhanging cliff collapses, retreating landward and leaving a wave-cut platform. Sea caves erode into arches and eventually collapse into isolated sea stacks.',
    realWorldExamples: ['Twelve Apostles (Australia)', 'White Cliffs of Dover (UK)', 'Goa Coastal Cliffs & Stacks'],
    cbseExamFocalPoints: 'Evolution sequence: Headland -> Sea Cave -> Sea Arch -> Sea Stack -> Sea Stump.',
    crossSectionLayers: [
      { name: 'Precipitous Cliff Face (Limestone/Basalt)', color: '#475569', thickness: 50 },
      { name: 'Submerged Intertidal Wave-Cut Platform', color: '#38bdf8', thickness: 30 },
      { name: 'Offshore Shingle & Sand Terrace', color: '#ca8a04', thickness: 40 },
    ],
    elevationFunction: (nx, ny) => {
      // Cliff drop into ocean
      if (nx > 0.45) return 400 + Math.sin(ny * 8) * 30; // Elevated headland
      if (nx > 0.40) return (nx - 0.40) * 8000; // Vertical sea cliff
      return 20 + Math.sin(nx * 12) * 10; // Low intertidal wave-cut platform
    },
    keyFeatures: ['Vertical Wave-Beaten Cliffs', 'Intertidal Wave-Cut Notch & Platform', 'Headland Sea Arches & Stacks', 'Longshore Drift Deposition (Spits)'],
  },
  {
    id: 'lf-volcanic-landforms',
    name: 'Volcanic Landforms: Calderas, Cinder Cones & Lava Plateaus',
    category: 'volcanic',
    geomorphicAgent: 'Volcanic Eruption & Magmatic Intrusion',
    formationProcess:
      'Extrusive landforms created by the accumulation of lava and pyroclastic ejecta around volcanic vents (composite cones, calderas, cinder cones), and intrusive bodies cooling slowly underground (batholiths, dykes, sills).',
    realWorldExamples: ['Barren Island (India, only active volcano in South Asia)', 'Mount Fuji (Stratovolcano, Japan)', 'Crater Lake Caldera (USA)'],
    cbseExamFocalPoints: 'Distinguish Extrusive (Shield, Composite, Caldera) from Intrusive (Batholith huge magma chamber, Laccolith dome, Sill horizontal sheet, Dyke vertical wall).',
    crossSectionLayers: [
      { name: 'Alternating Ash & Lava Stratovolcano Beds', color: '#ea580c', thickness: 45 },
      { name: 'Central Magma Feeder Conduit', color: '#dc2626', thickness: 35 },
      { name: 'Deep Subterranean Magma Chamber (Batholith)', color: '#991b1b', thickness: 70 },
    ],
    elevationFunction: (nx, ny) => {
      // Symmetrical volcanic cone with summit crater bowl
      const r = Math.hypot(nx - 0.5, ny - 0.5);
      if (r < 0.05) return 550; // Caldera/crater floor depression
      if (r < 0.07) return 720; // Crater rim
      return Math.max(100, 720 - Math.pow(r - 0.07, 0.75) * 1200);
    },
    keyFeatures: ['Central Magma Conduit', 'Summit Crater / Caldera Depression', 'Steep Sloping Flanks', 'Intrusive Dykes and Sills'],
  },
];

// ─── 3. Plate Tectonics Subsystem ───────────────────────────────────────────

export const TECTONIC_PLATES: TectonicPlateInfo[] = [
  {
    id: 'plate-pacific',
    name: 'Pacific Plate (Largest Oceanic Plate)',
    areaMillionKm2: 103.3,
    crustType: 'oceanic',
    motionVector: { speedMmYr: 80, direction: 'Northwest', azimuthDeg: 305 },
    adjacentPlates: ['North American', 'Indo-Australian', 'Eurasian', 'Nazca', 'Philippine'],
    notableFeatures: ['Circum-Pacific Ring of Fire', 'Mariana Trench (11,034m)', 'Hawaiian Mantle Plume Hotspot Chain'],
  },
  {
    id: 'plate-indo-australian',
    name: 'Indo-Australian Plate (Indian & Australian Sub-plates)',
    areaMillionKm2: 58.9,
    crustType: 'mixed',
    motionVector: { speedMmYr: 50, direction: 'North-Northeast', azimuthDeg: 25 },
    adjacentPlates: ['Eurasian', 'African', 'Antarctic', 'Pacific'],
    notableFeatures: ['Himalayan Collisional Orogeny (5 cm/yr northward surge)', 'Java Trench Subduction Zone', 'Central Indian Ridge'],
  },
  {
    id: 'plate-eurasian',
    name: 'Eurasian Plate',
    areaMillionKm2: 67.8,
    crustType: 'continental',
    motionVector: { speedMmYr: 20, direction: 'East-Southeast', azimuthDeg: 110 },
    adjacentPlates: ['Indo-Australian', 'North American', 'African', 'Arabian', 'Philippine'],
    notableFeatures: ['Tibetan Plateau Crustal Thickening (70km thick)', 'Alpide-Himalayan Orogenic Belt', 'Baikal Rift Zone'],
  },
  {
    id: 'plate-north-american',
    name: 'North American Plate',
    areaMillionKm2: 75.9,
    crustType: 'mixed',
    motionVector: { speedMmYr: 25, direction: 'West-Southwest', azimuthDeg: 245 },
    adjacentPlates: ['Pacific', 'Eurasian', 'South American', 'African'],
    notableFeatures: ['San Andreas Transform Fault', 'Cascadia Subduction Zone', 'Mid-Atlantic Ridge Divergent Margin'],
  },
  {
    id: 'plate-south-american',
    name: 'South American Plate',
    areaMillionKm2: 43.6,
    crustType: 'mixed',
    motionVector: { speedMmYr: 30, direction: 'West', azimuthDeg: 270 },
    adjacentPlates: ['Nazca', 'African', 'Antarctic', 'Caribbean'],
    notableFeatures: ['Andes Volcanic Mountain Arc', 'Peru-Chile Oceanic Trench', 'Mid-Atlantic Ridge Divergence'],
  },
  {
    id: 'plate-african',
    name: 'African Plate (Nubian & Somali Sub-plates)',
    areaMillionKm2: 61.3,
    crustType: 'mixed',
    motionVector: { speedMmYr: 22, direction: 'Northeast', azimuthDeg: 40 },
    adjacentPlates: ['Eurasian', 'Indo-Australian', 'South American', 'Arabian'],
    notableFeatures: ['East African Continental Rift Valley (Active Continental Breakup)', 'Afar Triple Junction', 'Red Sea Spreading'],
  },
  {
    id: 'plate-antarctic',
    name: 'Antarctic Plate',
    areaMillionKm2: 60.9,
    crustType: 'mixed',
    motionVector: { speedMmYr: 15, direction: 'South-Atlanticward', azimuthDeg: 160 },
    adjacentPlates: ['Pacific', 'Indo-Australian', 'South American', 'African'],
    notableFeatures: ['Encircling Mid-Ocean Ridge Belt', 'Mount Erebus Active Volcano', 'West Antarctic Rift'],
  },
  {
    id: 'plate-nazca',
    name: 'Nazca Plate',
    areaMillionKm2: 15.6,
    crustType: 'oceanic',
    motionVector: { speedMmYr: 75, direction: 'East', azimuthDeg: 90 },
    adjacentPlates: ['South American', 'Pacific', 'Cocos', 'Antarctic'],
    notableFeatures: ['Subducting beneath South America forming Andes', 'Peru-Chile Trench', 'Galapagos Hotspot'],
  },
  {
    id: 'plate-arabian',
    name: 'Arabian Plate',
    areaMillionKm2: 5.0,
    crustType: 'continental',
    motionVector: { speedMmYr: 25, direction: 'North-Northeast', azimuthDeg: 30 },
    adjacentPlates: ['Eurasian', 'African', 'Indo-Australian'],
    notableFeatures: ['Zagros Mountains Collision Belt', 'Red Sea Spreading Ridge', 'Dead Sea Transform Fault'],
  },
  {
    id: 'plate-philippine',
    name: 'Philippine Sea Plate',
    areaMillionKm2: 5.5,
    crustType: 'oceanic',
    motionVector: { speedMmYr: 60, direction: 'Northwest', azimuthDeg: 300 },
    adjacentPlates: ['Pacific', 'Eurasian', 'Indo-Australian'],
    notableFeatures: ['Philippine Trench', 'Mariana Trench Subduction', 'Volcanic Island Arcs'],
  },
  {
    id: 'plate-cocos',
    name: 'Cocos Plate',
    areaMillionKm2: 2.9,
    crustType: 'oceanic',
    motionVector: { speedMmYr: 70, direction: 'Northeast', azimuthDeg: 45 },
    adjacentPlates: ['North American', 'Caribbean', 'Pacific', 'Nazca'],
    notableFeatures: ['Middle America Trench Subduction', 'Central American Volcanic Arc'],
  },
];

export const TECTONIC_BOUNDARIES: TectonicBoundaryModel[] = [
  {
    id: 'divergent-oceanic',
    name: 'Divergent Boundary: Oceanic Spreading (Mid-Atlantic Ridge)',
    type: 'divergent',
    platesInvolved: ['North American Plate', 'Eurasian Plate'],
    crustalDynamics:
      'Tensional forces pull two oceanic plates apart. Decompression melting in the asthenosphere generates basaltic magma that rises, solidifies along the rift axis, and continuously creates new oceanic crust (Seafloor Spreading, Harry Hess 1960).',
    landformsCreated: ['Mid-Oceanic Ridge', 'Central Rift Valley', 'Submarine Hydrothermal Vents (Black Smokers)', 'Basalt Pillow Lavas'],
    realWorldExample: 'Mid-Atlantic Ridge (extends 16,000 km north-to-south)',
    earthquakeDepth: 'shallow',
    volcanismPresent: true,
    volcanismType: 'Effusive basaltic fissure eruptions',
    subductionOccurs: false,
    schematicLayers: [
      { label: 'Ocean Water Column', color: '#0284c7' },
      { label: 'Pillow Basalt Crust', color: '#475569' },
      { label: 'Sheeted Dyke Complex', color: '#334155' },
      { label: 'Upwelling Mantle Asthenosphere', color: '#dc2626' },
    ],
  },
  {
    id: 'divergent-continental',
    name: 'Divergent Boundary: Continental Rifting (East African Rift)',
    type: 'divergent',
    platesInvolved: ['Nubian Plate', 'Somali Plate'],
    crustalDynamics:
      'Thermal mantle plume bulges beneath continental crust, creating tensional stress. The crust thins, develops parallel normal faults, and the central block drops into a graben (rift valley). Over millions of years, the rift floods to form a linear sea (e.g. Red Sea).',
    landformsCreated: ['Continental Rift Valleys (Grabens)', 'Horsts (Block Mountains)', 'Volcanic Cones (Kilimanjaro, Ol Doinyo Lengai)', 'Deep Rift Lakes (Tanganyika, Malawi)'],
    realWorldExample: 'East African Rift System (Great Rift Valley)',
    earthquakeDepth: 'shallow',
    volcanismPresent: true,
    volcanismType: 'Alkaline continental volcanism & carbonatite lavas',
    subductionOccurs: false,
    schematicLayers: [
      { label: 'Rift Valley Floor & Lakes', color: '#0d9488' },
      { label: 'Down-Dropped Graben Block', color: '#64748b' },
      { label: 'Horst Shoulder Block', color: '#475569' },
      { label: 'Thermal Mantle Plume', color: '#ef4444' },
    ],
  },
  {
    id: 'convergent-continental',
    name: 'Convergent Boundary: Continental Collision (Himalayas)',
    type: 'convergent',
    platesInvolved: ['Indian Plate', 'Eurasian Plate'],
    crustalDynamics:
      'Two buoyant continental lithospheric plates collide head-on. Because both continental crusts are low-density (sialic), neither can subduct deeply into the mantle. The crust buckles, crumples, and thrusts upward and downward, doubling crustal thickness to ~70 km and driving the world highest mountain orogeny.',
    landformsCreated: ['Fold Mountain Ranges (Himalayas)', 'Intermontane Uplifted Plateau (Tibetan Plateau)', 'Major Thrust Faults (MCT, MBT, HFT)'],
    realWorldExample: 'Himalayan Mountain Arc (India colliding with Eurasia at ~5 cm/year)',
    earthquakeDepth: 'shallow',
    volcanismPresent: false, // No subduction of oceanic crust means NO active volcanism
    subductionOccurs: false,
    schematicLayers: [
      { label: 'Himalayan Thrust Belts (Fold Mountains)', color: '#94a3b8' },
      { label: 'Deformed Continental Sial Crust (~70km)', color: '#64748b' },
      { label: 'Underthrust Indian Lithosphere', color: '#334155' },
    ],
  },
  {
    id: 'convergent-oceanic-continental',
    name: 'Convergent Boundary: Oceanic-Continental Subduction (Andes)',
    type: 'convergent',
    platesInvolved: ['Nazca Plate', 'South American Plate'],
    crustalDynamics:
      'Dense, cold oceanic plate (Nazca) plunges beneath the lighter continental plate (South America) at an oceanic trench. Water carried down by the subducting slab lowers the melting point of the overlying mantle wedge (flux melting). Magma ascends to form a continental volcanic arc.',
    landformsCreated: ['Deep Oceanic Trench (Peru-Chile Trench)', 'Continental Volcanic Mountain Arc (Andes)', 'Forearc Basin', 'Accretionary Wedge'],
    realWorldExample: 'Andes Volcanic Mountain Chain (South America)',
    earthquakeDepth: 'all', // Shallow at trench, deepening to 700km along Wadati-Benioff zone
    volcanismPresent: true,
    volcanismType: 'Explosive andesitic stratovolcanoes',
    subductionOccurs: true,
    schematicLayers: [
      { label: 'Oceanic Trench & Accretionary Prism', color: '#0284c7' },
      { label: 'Overriding Continental Crust & Volcanic Arc', color: '#ca8a04' },
      { label: 'Subducting Oceanic Slab (Wadati-Benioff Zone)', color: '#334155' },
      { label: 'Mantle Wedge Flux Melting Zone', color: '#dc2626' },
    ],
  },
  {
    id: 'convergent-oceanic-oceanic',
    name: 'Convergent Boundary: Oceanic-Oceanic Subduction (Mariana Arc)',
    type: 'convergent',
    platesInvolved: ['Pacific Plate', 'Mariana / Philippine Plate'],
    crustalDynamics:
      'The older, colder, and denser of two oceanic plates subducts beneath the younger oceanic plate. Flux melting triggers submarine volcanism that breaches the sea surface to build an arcuate chain of volcanic islands.',
    landformsCreated: ['Deep Ocean Trenches (Mariana Trench 11km depth)', 'Volcanic Island Arcs (Japan, Aleutian, Indonesia)', 'Back-Arc Basin'],
    realWorldExample: 'Mariana Islands & Trench / Aleutian Island Arc',
    earthquakeDepth: 'all',
    volcanismPresent: true,
    volcanismType: 'Basaltic to andesitic island arc stratovolcanoes',
    subductionOccurs: true,
    schematicLayers: [
      { label: 'Deep Ocean Trench', color: '#0369a1' },
      { label: 'Volcanic Island Arc', color: '#f59e0b' },
      { label: 'Subducting Oceanic Lithosphere', color: '#1e293b' },
      { label: 'Asthenosphere Convection', color: '#b91c1c' },
    ],
  },
  {
    id: 'transform-fault',
    name: 'Transform Boundary: Strike-Slip Fault (San Andreas Fault)',
    type: 'transform',
    platesInvolved: ['Pacific Plate', 'North American Plate'],
    crustalDynamics:
      'Two plates slide horizontally past one another along a vertical fault plane. Crust is neither created nor destroyed. Friction locks the fault surfaces until stored elastic strain energy exceeds rock strength, releasing violently as high-magnitude shallow earthquakes.',
    landformsCreated: ['Linear Fault Scarps', 'Offset River Channels & Streams', 'Sag Ponds', 'Shatter Zones'],
    realWorldExample: 'San Andreas Fault (California, USA)',
    earthquakeDepth: 'shallow',
    volcanismPresent: false,
    subductionOccurs: false,
    schematicLayers: [
      { label: 'Pacific Plate (Moving Northwest)', color: '#0ea5e9' },
      { label: 'Vertical Transform Fault Plane', color: '#ef4444' },
      { label: 'North American Plate (Moving Southeast)', color: '#f59e0b' },
    ],
  },
];

// ─── 4. Earthquakes Subsystem ───────────────────────────────────────────────

export const FAULT_MODELS: FaultModel[] = [
  {
    id: 'normal-fault',
    name: 'Normal Fault (Tensional Stress)',
    stressType: 'tension',
    hangingWallMotion: 'downward',
    tectonicRegime: 'Divergent Boundaries & Continental Rifting',
    typicalLandforms: ['Horsts and Grabens', 'Fault Scarps', 'Rift Valleys'],
    realWorldExample: 'Basin and Range Province (Nevada, USA), Narmada Rift (India)',
  },
  {
    id: 'reverse-thrust-fault',
    name: 'Reverse / Thrust Fault (Compressional Stress)',
    stressType: 'compression',
    hangingWallMotion: 'upward',
    tectonicRegime: 'Convergent Boundaries & Subduction / Orogeny',
    typicalLandforms: ['Fold Mountains', 'Overthrust Nappes', 'Fault-Propagated Folds'],
    realWorldExample: 'Main Central Thrust (MCT) & Main Boundary Thrust (MBT) in Himalayas',
  },
  {
    id: 'strike-slip-fault',
    name: 'Strike-Slip / Transcurrent Fault (Shear Stress)',
    stressType: 'shear',
    hangingWallMotion: 'lateral-horizontal',
    tectonicRegime: 'Transform Plate Boundaries',
    typicalLandforms: ['Offset Streams', 'Linear Fault Valleys', 'Sag Ponds'],
    realWorldExample: 'San Andreas Fault (USA), Alpine Fault (New Zealand)',
  },
];

export const SEISMIC_WAVES: SeismicWaveModel[] = [
  {
    id: 'p-wave',
    name: 'Primary (P) Wave — Compressional / Longitudinal',
    waveClass: 'body',
    particleMotion: 'Parallel to wave propagation (Push-Pull alternation like an accordion)',
    velocityKmS: 6.5, // ~6 to 8 km/s in upper crust
    propagationMedium: 'solid-liquid-gas',
    damagePotential: 'low',
    seismogramArrivalOrder: 1, // Arrives first at seismograph
  },
  {
    id: 's-wave',
    name: 'Secondary (S) Wave — Shear / Transverse',
    waveClass: 'body',
    particleMotion: 'Perpendicular to wave propagation (Side-to-side or up-and-down shear)',
    velocityKmS: 3.8, // ~3.5 to 4.5 km/s (~60% of P-wave velocity)
    propagationMedium: 'solid-only', // Cannot propagate through liquids (proves Earth's outer core is liquid!)
    damagePotential: 'moderate',
    seismogramArrivalOrder: 2,
  },
  {
    id: 'love-wave',
    name: 'Love (L) Wave — Horizontal Surface Shear',
    waveClass: 'surface',
    particleMotion: 'Horizontal side-to-side perpendicular to direction of travel in surface crust',
    velocityKmS: 3.2,
    propagationMedium: 'solid-only',
    damagePotential: 'severe',
    seismogramArrivalOrder: 3,
  },
  {
    id: 'rayleigh-wave',
    name: 'Rayleigh (R) Wave — Retrograde Ground Roll',
    waveClass: 'surface',
    particleMotion: 'Elliptical retrograde rolling motion (like ocean waves on water surface)',
    velocityKmS: 2.8,
    propagationMedium: 'solid-only',
    damagePotential: 'severe',
    seismogramArrivalOrder: 4,
  },
];

/**
 * Calculates Moment Magnitude (Mw) from seismic moment (M0 in N·m).
 * Formula: Mw = 2/3 * log10(M0) - 10.7
 */
export function calculateMomentMagnitude(shearModulusPa: number, faultAreaM2: number, slipMeters: number): {
  seismicMomentM0: number;
  momentMagnitudeMw: number;
  energyJoules: number;
  tntEquivalentTons: number;
} {
  const m0 = shearModulusPa * faultAreaM2 * slipMeters;
  const mw = (2 / 3) * Math.log10(m0) - 10.7;
  // Energy in Joules: log10(E) = 4.8 + 1.5 * Mw
  const energyJ = Math.pow(10, 4.8 + 1.5 * mw);
  const tntTons = energyJ / 4.184e9;

  return {
    seismicMomentM0: m0,
    momentMagnitudeMw: Math.round(mw * 10) / 10,
    energyJoules: energyJ,
    tntEquivalentTons: tntTons >= 1 ? Math.round(tntTons) : Math.round(tntTons * 1000) / 1000,
  };
}

// ─── 5. Volcanoes Subsystem ─────────────────────────────────────────────────

export const VOLCANO_TYPES: VolcanoTypeModel[] = [
  {
    id: 'shield',
    name: 'Shield Volcanoes (Mauna Loa, Kilauea)',
    magmaComposition: 'basaltic-mafic',
    viscosity: 'low-fluid',
    eruptionStyle: 'effusive',
    slopeAngleDeg: 6,
    internalStructure: 'Broad, gently sloping convex dome built of successive layers of fluid basaltic lava flows.',
    realWorldExamples: ['Mauna Loa (Hawaii)', 'Erta Ale (Ethiopia)'],
    veiTypical: [0, 1],
  },
  {
    id: 'stratovolcano',
    name: 'Composite / Stratovolcanoes (Mt Fuji, Vesuvius, Barren Island)',
    magmaComposition: 'andesitic-intermediate',
    viscosity: 'moderate-viscous',
    eruptionStyle: 'explosive-strombolian',
    slopeAngleDeg: 30,
    internalStructure: 'Steep conical mountain composed of alternating layers of hardened lava flows, tephra, volcanic ash, and pumice.',
    realWorldExamples: ['Mount Fuji (Japan)', 'Barren Island (Andaman Sea, India)', 'Mount Vesuvius (Italy)'],
    veiTypical: [3, 5],
  },
  {
    id: 'cinder-cone',
    name: 'Cinder Cones (Parícutin)',
    magmaComposition: 'basaltic-mafic',
    viscosity: 'moderate-viscous',
    eruptionStyle: 'explosive-strombolian',
    slopeAngleDeg: 33,
    internalStructure: 'Small, steep conical hill of loose pyroclastic scoria and cinders ejected from a single central vent.',
    realWorldExamples: ['Parícutin (Mexico)', 'Sunset Crater (USA)'],
    veiTypical: [1, 2],
  },
  {
    id: 'caldera',
    name: 'Calderas (Yellowstone, Crater Lake, Toba)',
    magmaComposition: 'rhyolitic-felsic',
    viscosity: 'high-viscous',
    eruptionStyle: 'plinian-cataclysmic',
    slopeAngleDeg: 2,
    internalStructure: 'Gigantic circular volcanic depression formed when a huge magma chamber empties rapidly during an ultra-Plinian eruption, causing the overlying mountain to collapse inward.',
    realWorldExamples: ['Yellowstone Supervolcano (USA)', 'Crater Lake (Oregon, USA)', 'Lake Toba (Sumatra)'],
    veiTypical: [6, 8],
  },
  {
    id: 'flood-basalt',
    name: 'Flood Basalt Plateaus (Deccan Traps)',
    magmaComposition: 'basaltic-mafic',
    viscosity: 'low-fluid',
    eruptionStyle: 'effusive',
    slopeAngleDeg: 1,
    internalStructure: 'Enormous volume of highly fluid basalt lava extruded from long linear crustal fissures over hundreds of thousands of years, covering millions of square kilometres with layered horizontal trap sheets.',
    realWorldExamples: ['Deccan Traps (Maharashtra/Gujarat, India, 500,000 km²)', 'Columbia River Basalt (USA)'],
    veiTypical: [0, 1],
  },
];

// ─── 6. Weathering, Erosion & Mass Wasting ──────────────────────────────────

export const WEATHERING_PROCESSES: WeatheringProcessModel[] = [
  {
    id: 'wthr-frost-wedging',
    name: 'Frost Wedging (Freeze-Thaw Mechanical Weathering)',
    type: 'mechanical',
    activeAgent: 'Water freezing in rock fractures',
    chemicalOrPhysicalReaction:
      'Liquid water seeps into joints and bedding planes. Upon freezing at 0°C, water expands by ~9% in volume, exerting extreme pressure (>200 MPa) that widens the fracture until the rock shatters into angular block talus/scree.',
    climateZoneFavored: 'Cold temperate, alpine, periglacial regions with frequent freeze-thaw cycles',
    resultingFeatures: ['Felsenmeer (Block fields)', 'Scree / Talus slopes below mountain scarps'],
    realWorldExample: 'High Himalayan summits, Ladakh scree slopes',
  },
  {
    id: 'wthr-exfoliation',
    name: 'Exfoliation & Thermal Expansion (Onion Peeling)',
    type: 'mechanical',
    activeAgent: 'Diurnal solar heating and cooling',
    chemicalOrPhysicalReaction:
      'Extreme daily temperature fluctuations in hot arid deserts cause outer rock shells to expand during the day and contract at night while the interior remains cool. Differential strain causes outer concentric shells to peel off like onion layers.',
    climateZoneFavored: 'Hot arid deserts with diurnal range >20°C',
    resultingFeatures: ['Exfoliation Domes', 'Inselbergs', 'Bornhardts'],
    realWorldExample: 'Granite domes in Hyderabad and Mahabalipuram (India)',
  },
  {
    id: 'wthr-carbonation',
    name: 'Carbonation & Karst Solution (Limestone Dissolution)',
    type: 'chemical',
    activeAgent: 'Atmospheric carbon dioxide dissolved in rainwater (Weak Carbonic Acid H2CO3)',
    chemicalOrPhysicalReaction:
      'Rainwater absorbs atmospheric CO2: H2O + CO2 -> H2CO3. This weak carbonic acid dissolves calcium carbonate limestone into soluble calcium bicarbonate: CaCO3 + H2CO3 -> Ca(HCO3)2, creating subterranean cave networks.',
    climateZoneFavored: 'Warm humid regions underlain by massive limestone beds',
    resultingFeatures: ['Sinkholes (Dolines)', 'Limestone Caves', 'Stalactites and Stalagmites', 'Karst Towers'],
    realWorldExample: 'Borra Caves (Visakhapatnam, AP), Guptadham (Bihar)',
  },
  {
    id: 'wthr-oxidation',
    name: 'Oxidation & Rusting of Iron Minerals',
    type: 'chemical',
    activeAgent: 'Atmospheric Oxygen dissolved in moisture',
    chemicalOrPhysicalReaction:
      'Ferrous iron (Fe2+) in minerals like olivine, pyroxene, and biotite reacts with oxygen to form ferric oxide (Fe2O3, hematite) and hydrated iron oxide (limonite): 4FeSiO3 + O2 -> 2Fe2O3 + 4SiO2. The rock weakens and turns reddish-brown.',
    climateZoneFavored: 'Warm humid tropical climates with alternating wet and dry seasons',
    resultingFeatures: ['Red Laterite Soils', 'Rust-colored rock crusts'],
    realWorldExample: 'Laterite soils of Western Ghats and Deccan basalt outcrops',
  },
  {
    id: 'wthr-biological-root',
    name: 'Biological Weathering (Plant Root Wedging & Lichen Acids)',
    type: 'biological',
    activeAgent: 'Tree roots and lithophytic lichens/mosses',
    chemicalOrPhysicalReaction:
      'Seeds germinate in rock crevices. As roots grow thicker, they exert powerful wedging pressure that pries fractures apart. Lichens and mycorrhizal fungi secrete organic chelating acids (oxalic acid) that chemically decompose mineral lattices.',
    climateZoneFavored: 'Dense vegetative temperate and tropical forest biomes',
    resultingFeatures: ['Split boulders', 'Pitted rock surfaces under moss carpets'],
    realWorldExample: 'Ancient temple stones (e.g. Angkor Wat, Western Ghats temple rocks)',
  },
];

// ─── 7. Hydrology & Drainage Patterns ───────────────────────────────────────

export const DRAINAGE_PATTERNS: DrainagePatternModel[] = [
  {
    id: 'dendritic',
    name: 'Dendritic Drainage (Tree-Branch Pattern)',
    geometricStructure: 'Tributaries join main river at acute angles (<90°), resembling the branching of a deciduous tree.',
    underlyingGeology: 'Uniform horizontal bedrock of homogeneous resistance to erosion (e.g. flat sedimentary strata or massive crystalline rocks).',
    idealTectonicSetting: 'Uplifted plains or flat-lying plateaus',
    indianRiverExample: 'Indo-Gangetic Basin (Ganga, Yamuna and their tributaries)',
  },
  {
    id: 'trellis',
    name: 'Trellis Drainage (Right-Angle Rectilinear Pattern)',
    geometricStructure: 'Short tributary streams join the primary subsequent river almost at right angles (90°).',
    underlyingGeology: 'Alternating parallel belts of hard resistant and soft erodible rock strata that have been folded or tilted.',
    idealTectonicSetting: 'Fold mountain belts and Appalachian-style valley ridges',
    indianRiverExample: 'Narmada, Tapi and Chota Nagpur plateau streams',
  },
  {
    id: 'radial',
    name: 'Radial Drainage (Spoke-like Outward Divergence)',
    geometricStructure: 'Streams radiate outward in all directions from a central elevated highland peak or dome.',
    underlyingGeology: 'Conical volcanic peak, isolated dome mountain, or circular hill.',
    idealTectonicSetting: 'Volcanic cones or isolated structural domes',
    indianRiverExample: 'Amarkantak Plateau (Narmada flows west, Son flows north, Mahanadi flows southeast)',
  },
  {
    id: 'centripetal',
    name: 'Centripetal Drainage (Internal Basin Convergence)',
    geometricStructure: 'Streams flow inward from all surrounding elevated directions toward a central closed depression or inland lake.',
    underlyingGeology: 'Closed structural basin or inland depression with no oceanic outlet.',
    idealTectonicSetting: 'Endorheic arid basins and volcanic calderas',
    indianRiverExample: 'Sambhar Salt Lake Basin (Rajasthan), Loktak Lake (Manipur)',
  },
  {
    id: 'rectangular',
    name: 'Rectangular Drainage (Joint-Controlled Right Angles)',
    geometricStructure: 'Main streams and tributaries exhibit sharp right-angle bends conforming to joint intersections.',
    underlyingGeology: 'Hard crystalline rocks traversed by two sets of intersecting vertical geological joints or faults at 90°.',
    idealTectonicSetting: 'Jointed granitic batholiths and cratons',
    indianRiverExample: 'Streams of the Vindhyan rock formations in Central India',
  },
  {
    id: 'parallel',
    name: 'Parallel Drainage (Straight Linear Downslope Streams)',
    geometricStructure: 'Rivers flow in straight, swift, parallel courses down a steep uniform regional slope.',
    underlyingGeology: 'Steep uniform regional slope underlain by resistant rock strata.',
    idealTectonicSetting: 'Steep coastal fault scarps',
    indianRiverExample: 'Short swift west-flowing rivers of the Western Ghats (Sharavathi, Netravati, Periyar)',
  },
];

// ─── 8. Oceanography Subsystem ──────────────────────────────────────────────

export const OCEAN_FLOOR_ZONES: OceanFloorZoneModel[] = [
  {
    id: 'continental-shelf',
    name: 'Continental Shelf (Shallow Coastal Margin)',
    typicalDepthRangeM: [0, 200],
    gradientPercent: 'Gentle (1° or less, ~1.7 m per km)',
    economicOrBiologicalSignificance:
      'Occupies ~7.5% of total ocean area but contains >90% of all marine commercial fishing grounds, offshore petroleum/natural gas fields (e.g. Mumbai High), and placer mineral deposits.',
    sedimentType: 'Terrigenous coastal sands, silts, and biogenic coral carbonates',
    realWorldExample: 'Siberian Continental Shelf (widest, 1500 km); Mumbai High Shelf (India)',
  },
  {
    id: 'continental-slope',
    name: 'Continental Slope (Steep Continental Boundary)',
    typicalDepthRangeM: [200, 3000],
    gradientPercent: 'Steep (2° to 5°, occasionally >20°)',
    economicOrBiologicalSignificance:
      'True boundary between continental sial crust and oceanic sima crust. Frequently carved by deep V-shaped submarine canyons excavated by powerful turbidity currents.',
    sedimentType: 'Turbidite deposits, hemipelagic muds, and underwater slump debris',
    realWorldExample: 'Ganges Submarine Canyon (Swatch of No Ground, Bay of Bengal)',
  },
  {
    id: 'continental-rise',
    name: 'Continental Rise (Sediment Apron)',
    typicalDepthRangeM: [3000, 4000],
    gradientPercent: 'Gentle (0.5° to 1°)',
    economicOrBiologicalSignificance:
      'Formed by the merging of submarine fan deposits at the foot of the continental slope, representing massive deep-sea depositional wedges.',
    sedimentType: 'Deep-sea turbidity fan sands, deep contourite drifts',
    realWorldExample: 'Indus Deep-Sea Fan (Arabian Sea, 2nd largest in the world)',
  },
  {
    id: 'abyssal-plain',
    name: 'Abyssal Plains & Hills (Deep Ocean Floor)',
    typicalDepthRangeM: [3000, 6000],
    gradientPercent: 'Extremely flat (< 0.05°)',
    economicOrBiologicalSignificance:
      'Covers >40% of Earth total surface. Contains extensive fields of polymetallic nodules (manganese, nickel, copper, cobalt), governed by the International Seabed Authority (ISA).',
    sedimentType: 'Pelagic red clays, siliceous oozes (radiolarian/diatom), calcareous oozes',
    realWorldExample: 'Central Indian Ocean Basin (India pioneer investor exploration site)',
  },
  {
    id: 'mid-ocean-ridge',
    name: 'Mid-Ocean Ridges & Rifts (Submarine Volcanic Chain)',
    typicalDepthRangeM: [2000, 3500],
    gradientPercent: 'Rugged mountainous relief',
    economicOrBiologicalSignificance:
      'Continuous 65,000 km interconnected mountain chain circling the globe. Site of seafloor spreading, hydrothermal vents (black smokers), and chemosynthetic ecosystems independent of sunlight.',
    sedimentType: 'Fresh pillow basalts, hydrothermal metal sulfide deposits',
    realWorldExample: 'Mid-Atlantic Ridge, Central Indian Ridge',
  },
  {
    id: 'ocean-trench',
    name: 'Deep Ocean Trenches (Subduction Chasm)',
    typicalDepthRangeM: [6000, 11034],
    gradientPercent: 'V-shaped steep trough (>10° to 16°)',
    economicOrBiologicalSignificance:
      'Deepest depressions on Earth, formed where cold oceanic lithosphere subducts into the asthenosphere. Site of high-magnitude earthquakes and devastating tsunamis.',
    sedimentType: 'Pelagic clay and slumped trench turbidites',
    realWorldExample: 'Mariana Trench (Challenger Deep, 11,034 m); Java Trench (Indian Ocean, 7,450 m)',
  },
];
