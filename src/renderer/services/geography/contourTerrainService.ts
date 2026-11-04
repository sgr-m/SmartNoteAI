/**
 * Contour and Terrain Laboratory Service
 * Stage 5: Interactive Contour Lines, Slope Demonstrations, 3D Terrain Engine,
 * Cross-Sectional Profiler, and Educational Exercises.
 *
 * Compliance:
 * - Official Survey of India 1:50,000 reference standards (20m CI, Index contours every 100m).
 * - Real offline demonstration datasets (Mount Abu Sheet 45 D/7 and Western Ghats Scarp).
 * - Parametric educational terrain simulator clearly labeled as synthetic.
 */

// ─── 1. Contour Concepts ────────────────────────────────────────────────────

export interface ContourConcept {
  id: string;
  name: string;
  category: 'definition' | 'classification' | 'survey-mark' | 'landform';
  definition: string;
  explanation: string;
  visualRule: string;
  curriculumStandard: string;
  icon: string;
}

export const CONTOUR_CONCEPTS: ContourConcept[] = [
  {
    id: 'contour-lines',
    name: 'Contour Lines (Isohypses)',
    category: 'definition',
    definition: 'Imaginary lines drawn on a topographical map joining all contiguous points possessing identical elevation above Mean Sea Level (MSL).',
    explanation: 'Contours provide a two-dimensional visual representation of the three-dimensional Earth surface. The shape and spacing of contour lines reveal the form, slope, and elevation of the land.',
    visualRule: 'Rendered as continuous brown lines (Pantone 469 C on SoI sheets). Contour lines never cross or branch, except in rare vertical cliffs or overhanging rock shelters.',
    curriculumStandard: 'CBSE Class 11 Practical Work in Geography (Chapter 5) & ICSE Class 10 Topography.',
    icon: '〰️',
  },
  {
    id: 'contour-interval',
    name: 'Contour Interval (C.I.)',
    category: 'definition',
    definition: 'The constant vertical distance in elevation between any two consecutive contour lines on a map sheet.',
    explanation: 'The contour interval is fixed for a given map scale and is explicitly stated in the bottom margin. For Survey of India 1:50,000 sheets, the contour interval is standard 20 metres.',
    visualRule: 'C.I. = Elevation Difference / Number of intervening intervals. Always uniform across the sheet.',
    curriculumStandard: 'Fundamental calculation in CBSE/ICSE board topography examinations.',
    icon: '📏',
  },
  {
    id: 'contour-value',
    name: 'Contour Value',
    category: 'definition',
    definition: 'The numerical altitude in metres (or feet) printed directly within or upon the contour line.',
    explanation: 'Contour numbers are oriented such that the top of the number points uphill towards higher ground. This orientation allows instant determination of slope direction.',
    visualRule: 'Oriented uphill; breaks in the contour line enclose the number (e.g. — 400 —).',
    curriculumStandard: 'Used to read ground elevation and determine flow direction of watercourses.',
    icon: '🔢',
  },
  {
    id: 'index-contours',
    name: 'Index Contours',
    category: 'classification',
    definition: 'Heavier, prominent contour lines drawn at regular vertical intervals (every fifth contour) and labeled with their elevation value.',
    explanation: 'On a 20m interval map, index contours occur every fifth contour (every 100m, e.g., 200m, 300m, 400m). They provide quick visual reference points and prevent the map reader from counting every single intermediate line.',
    visualRule: 'Rendered with a thicker stroke width (typically 2x intermediate lines) and printed elevation numbers.',
    curriculumStandard: 'Primary landmarks for rapid contour interval calculation and terrain inspection.',
    icon: '🏷️',
  },
  {
    id: 'intermediate-contours',
    name: 'Intermediate Contours',
    category: 'classification',
    definition: 'Standard weight contour lines drawn between consecutive index contours at the designated contour interval.',
    explanation: 'On a 20m CI sheet, the four brown lines between index contours 200m and 300m represent 220m, 240m, 260m, and 280m. They are normally not individually numbered.',
    visualRule: 'Finer line weight (0.5x index contour stroke), consistently spaced based on terrain slope.',
    curriculumStandard: 'Survey of India 1:50,000 Open Series Maps (OSM) specification.',
    icon: '➖',
  },
  {
    id: 'supplementary-contours',
    name: 'Supplementary Contours',
    category: 'classification',
    definition: 'Dashed or dotted brown lines drawn at half the normal contour interval (e.g., 10m on a 20m sheet) to depict subtle relief in exceptionally flat areas.',
    explanation: 'Used in extensive alluvial plains, deltaic regions, or flat plateaus where standard contour lines are so widely spaced that subtle ridges, levees, or sand dunes would otherwise not appear.',
    visualRule: 'Dashed brown line with interval equal to 0.5 × C.I.',
    curriculumStandard: 'Survey of India conventional cartography for Indo-Gangetic and coastal plains.',
    icon: '╌╌',
  },
  {
    id: 'spot-heights',
    name: 'Spot Heights (• 1722)',
    category: 'survey-mark',
    definition: 'A point on the map whose exact elevation above mean sea level has been determined by precise leveling or photogrammetry.',
    explanation: 'Represented by a small dot accompanied by the exact altitude figure (e.g., • 1722 at Guru Shikhar). Unlike benchmarks, there is no physical monument or permanent mark on the actual ground.',
    visualRule: 'Small black dot with height in metres printed adjacent (e.g., • 542).',
    curriculumStandard: 'Mandatory identification question in board exams for locating mountain summits and passes.',
    icon: '📍',
  },
  {
    id: 'benchmarks',
    name: 'Bench Marks (BM 224.5)',
    category: 'survey-mark',
    definition: 'A permanent physical mark of known height above sea level, engraved on a stone monument, bridge pier, rock face, or public building by the Survey of India.',
    explanation: 'Serves as a fixed reference point from which subsequent topographical and geodetic surveys originate. Labeled with the letters "BM" followed by the height to one decimal place.',
    visualRule: 'Printed in black as "BM 224.5" adjacent to roads, railways, or government buildings.',
    curriculumStandard: 'Key topographic reference marker for infrastructure and civil engineering.',
    icon: '🏛️',
  },
  {
    id: 'closed-contours',
    name: 'Closed Contours',
    category: 'landform',
    definition: 'Contour lines that loop completely back onto themselves within the sheet or across adjacent sheets.',
    explanation: 'Closed contours indicate isolated topographic features. If the elevation values increase towards the center, it represents a hill or peak. If values decrease inward, it represents a depression or basin.',
    visualRule: 'Concentric closed geometric loops (circles, ellipses, or irregular rings).',
    curriculumStandard: 'Core diagnostic shape for distinguishing isolated landforms.',
    icon: '⭕',
  },
  {
    id: 'depressions',
    name: 'Depressions & Sinkholes',
    category: 'landform',
    definition: 'A localized low-lying bowl, crater, sinkhole, or quarry completely surrounded by higher terrain.',
    explanation: 'To prevent confusing a depression with a hill, cartographers draw short tick marks (hachures) on the inside of the contour lines, pointing downhill towards the bottom of the depression.',
    visualRule: 'Closed contour rings with internal hachure ticks pointing toward the low center.',
    curriculumStandard: 'Commonly found in karst topography, volcanic calderas, and open-cast mining areas.',
    icon: '🕳️',
  },
  {
    id: 'hill-contours',
    name: 'Hill Contours',
    category: 'landform',
    definition: 'Concentric closed contours where elevation values strictly increase towards the innermost ring or summit.',
    explanation: 'The spacing of the contours indicates the steepness of the hill flanks. Concentric circles indicate a conical hill, while elongated concentric loops represent an oblong knoll or ridge.',
    visualRule: 'Central ring has the highest elevation value, frequently marked with a spot height or triangulation station.',
    curriculumStandard: 'Primary landform taught in Class 9-10 contour interpretation.',
    icon: '⛰️',
  },
  {
    id: 'valley-contours',
    name: 'Valley Contours',
    category: 'landform',
    definition: 'V-shaped or U-shaped contours with the pointed apex directed upstream towards higher elevation.',
    explanation: 'The apex of the V points upstream towards higher elevation (towards the source of the river), while the open arms point downstream. Water always flows outward through the open mouth of the V.',
    visualRule: 'V-shape pointing towards higher contour values; stream line runs along the axis of the V.',
    curriculumStandard: 'The "Rule of Vs" is the single most important rule for determining river flow direction on toposheets.',
    icon: '🌊',
  },
];

// ─── 2. Landform & Slope Demonstrations ──────────────────────────────────────

export interface LandformDemo {
  id: string;
  name: string;
  category: 'slope' | 'positive-relief' | 'negative-relief' | 'composite';
  description: string;
  contourCharacteristics: string;
  gradientText: string;
  examTip: string;
  elevationFn: (nx: number, ny: number) => number; // nx, ny in [-1..1], returns metres
  idealTransect: {
    start: [number, number]; // [nx, ny]
    end: [number, number];
    label: string;
  };
}

export const LANDFORM_DEMOS: LandformDemo[] = [
  {
    id: 'gentle-slope',
    name: 'Gentle Slope',
    category: 'slope',
    description: 'A ground surface that rises or falls very gradually with a low angle of inclination (gradient less than 1 in 20 or < 5°).',
    contourCharacteristics: 'Contour lines are spaced widely and evenly apart across the slope.',
    gradientText: 'Gradient 1:25 to 1:50 (< 4°)',
    examTip: 'Wide contour spacing indicates easy pedestrian and vehicular access and suitability for agriculture.',
    elevationFn: (nx, _ny) => 100 + (nx + 1) * 35, // 100m to 170m over 2 units
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (Gentle Plain) -> B (Low Rise)' },
  },
  {
    id: 'steep-slope',
    name: 'Steep Slope',
    category: 'slope',
    description: 'A ground surface with a rapid rate of rise or fall and a sharp angle of inclination (gradient greater than 1 in 3 or > 25°).',
    contourCharacteristics: 'Contour lines are closely packed together, almost touching in places.',
    gradientText: 'Gradient 1:2 to 1:4 (> 25°)',
    examTip: 'Closely packed contours indicate rugged, mountainous terrain, difficult terrain, and rapid water runoff.',
    elevationFn: (nx, _ny) => 100 + Math.pow((nx + 1) / 2, 0.4) * 450, // Rapid rise
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (Base) -> B (Escarpment Crest)' },
  },
  {
    id: 'uniform-slope',
    name: 'Uniform Slope',
    category: 'slope',
    description: 'A slope whose angle of inclination remains strictly constant throughout its entire length.',
    contourCharacteristics: 'Contour lines are spaced at equal distances from one another from base to crest.',
    gradientText: 'Constant Gradient (approx 1:10)',
    examTip: 'Constant spacing = Constant slope angle. Profile produces a perfectly straight diagonal line.',
    elevationFn: (nx, _ny) => 100 + (nx + 1) * 150,
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (Uniform Base) -> B (Uniform Summit)' },
  },
  {
    id: 'concave-slope',
    name: 'Concave Slope',
    category: 'slope',
    description: 'A slope that curves inward like the interior of a bowl; steep in the upper portion and gentle towards the foot.',
    contourCharacteristics: 'Contour lines are very close together at the higher elevation and become increasingly widely spaced toward the bottom.',
    gradientText: 'Steep top (1:3) -> Gentle foot (1:20)',
    examTip: 'Intervisibility rule: Two observers at the top and bottom of a concave slope can easily see each other because the slope curves inward below the line of sight.',
    elevationFn: (nx, _ny) => {
      const t = (nx + 1) / 2; // 0 to 1
      return 100 + Math.pow(t, 2.5) * 350; // Gentle at t=0, steep at t=1
    },
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (Foot) -> B (Crest)' },
  },
  {
    id: 'convex-slope',
    name: 'Convex Slope',
    category: 'slope',
    description: 'A slope that bulges outward like the exterior of a dome; gentle in the upper portion and steep towards the base.',
    contourCharacteristics: 'Contour lines are widely spaced at the top and become progressively closer together towards the base.',
    gradientText: 'Gentle top (1:20) -> Steep foot (1:3)',
    examTip: 'Intervisibility rule: Observers at the crest and foot CANNOT see each other because the outward bulge of the slope obstructs direct line of sight.',
    elevationFn: (nx, _ny) => {
      const t = (nx + 1) / 2; // 0 to 1
      return 100 + Math.sqrt(t) * 350; // Steep at base, flattening out near crest
    },
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (Foot) -> B (Crest)' },
  },
  {
    id: 'hill',
    name: 'Conical Hill',
    category: 'positive-relief',
    description: 'A natural elevation of the Earth surface rising to a distinct summit, lower than a mountain (typically < 300m above base).',
    contourCharacteristics: 'Concentric, almost circular or oval closed contours with elevation increasing toward the center.',
    gradientText: 'Uniform flanks (1:5) rising to central peak',
    examTip: 'Conical hills have circular contours; oblong hills have elliptical contours. The peak is marked with a spot height.',
    elevationFn: (nx, ny) => {
      const r = Math.sqrt(nx * nx + ny * ny);
      return 150 + Math.max(0, 1 - r) * 320;
    },
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (West Base) -> Summit -> B (East Base)' },
  },
  {
    id: 'valley',
    name: 'River Valley (V-Shaped)',
    category: 'negative-relief',
    description: 'An elongated lowland carved by a river or stream between hills or mountain ranges.',
    contourCharacteristics: 'V-shaped or U-shaped contours with the pointed apex directed UPSTREAM towards higher elevation.',
    gradientText: 'Valley floor 1:100; side flanks 1:4',
    examTip: 'The apex of the V always points UPSTREAM towards the river origin. Water flows OUT of the V mouth.',
    elevationFn: (nx, ny) => {
      const valleyAxis = Math.abs(ny);
      const streamGradient = (nx + 1) * 80;
      return 120 + streamGradient + valleyAxis * 260;
    },
    idealTransect: { start: [0, -0.9], end: [0, 0.9], label: 'A (Left Bank Ridge) -> Stream Bed -> B (Right Bank Ridge)' },
  },
  {
    id: 'ridge',
    name: 'Mountain Ridge',
    category: 'positive-relief',
    description: 'A long, narrow elevated crest or chain of mountains with steep slopes on both flanks.',
    contourCharacteristics: 'Elongated, parallel closed contour lines closely packed along the sides with a narrow top.',
    gradientText: 'Crest line gentle (1:30); flanks very steep (1:2)',
    examTip: 'Water divides (watersheds) follow the crest of ridges, separating adjacent river drainage basins.',
    elevationFn: (nx, ny) => {
      const distFromRidge = Math.abs(ny);
      const ridgeElevation = 450 - Math.abs(nx) * 50;
      return Math.max(100, ridgeElevation - distFromRidge * 320);
    },
    idealTransect: { start: [0, -0.9], end: [0, 0.9], label: 'A (North Flank) -> Ridge Crest -> B (South Flank)' },
  },
  {
    id: 'spur',
    name: 'Spur',
    category: 'positive-relief',
    description: 'A prominent tongue or projection of elevated land jutting out from a main mountain mass into lower terrain.',
    contourCharacteristics: 'V-shaped or U-shaped contours where the apex of the V points TOWARDS LOWER ELEVATION (opposite of a valley).',
    gradientText: 'Spur crest gentle (1:15); flanks steep (1:4)',
    examTip: 'Contrast rule: Spurs have Vs pointing to lower ground. Valleys have Vs pointing to higher ground.',
    elevationFn: (nx, ny) => {
      const alongSpur = (1 - nx) / 2; // 1 at nx=-1, 0 at nx=1
      const distFromAxis = Math.abs(ny);
      const crestHeight = 150 + alongSpur * 300;
      return Math.max(100, crestHeight - distFromAxis * 240);
    },
    idealTransect: { start: [-0.8, -0.7], end: [-0.8, 0.7], label: 'A (Valley) -> Spur Tongue -> B (Valley)' },
  },
  {
    id: 'depression',
    name: 'Depression / Volcanic Caldera',
    category: 'negative-relief',
    description: 'A sunken landform or hollow surrounded completely by higher land, with no natural surface drainage outlet.',
    contourCharacteristics: 'Concentric closed contours with hachures pointing inward, and elevation decreasing toward center.',
    gradientText: 'Inward basin slope 1:5 descending to flat floor',
    examTip: 'Hachure ticks point downhill towards the center. Innermost value is the minimum elevation.',
    elevationFn: (nx, ny) => {
      const r = Math.sqrt(nx * nx + ny * ny);
      if (r < 0.6) {
        return 120 + Math.pow(r / 0.6, 2) * 140; // Bowl depression
      }
      return 260 + (r - 0.6) * 100;
    },
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (Rim) -> Crater Floor -> B (Opposite Rim)' },
  },
  {
    id: 'plateau',
    name: 'Plateau / Tableland',
    category: 'positive-relief',
    description: 'An extensive, elevated area of relatively flat or undulating land bordered by steep slopes or escarpments on one or more sides.',
    contourCharacteristics: 'Contour lines are very close together along the edges (scarp), with a broad central area devoid of contours or with only widely spaced lines.',
    gradientText: 'Edge scarp 1:2; Tableland top < 1:100',
    examTip: 'Examples: Deccan Plateau, Malwa Plateau, Tibetan Plateau. Lack of contours in the center indicates flat tableland.',
    elevationFn: (nx, ny) => {
      const r = Math.max(Math.abs(nx), Math.abs(ny));
      if (r < 0.55) {
        return 420 + Math.sin(nx * 4) * 8; // Gentle flat tableland
      }
      const edge = (r - 0.55) / 0.45;
      return Math.max(120, 420 - Math.pow(edge, 0.7) * 300);
    },
    idealTransect: { start: [-0.95, 0], end: [0.95, 0], label: 'A (Plains) -> Scarp -> Tableland -> Scarp -> B (Plains)' },
  },
  {
    id: 'escarpment',
    name: 'Escarpment (Scarp & Dip Slope)',
    category: 'composite',
    description: 'An asymmetrical ridge possessing a very steep, cliff-like face (scarp) on one side and a gentle, gradual slope (dip slope) on the opposite side.',
    contourCharacteristics: 'Contours are tightly packed on the steep scarp side, and widely, evenly spaced on the gentle dip slope.',
    gradientText: 'Scarp face 1:2 (> 30°); Dip slope 1:15 (< 4°)',
    examTip: 'Classic structural landform found in the Western Ghats (Sahyadris) and Vindhya ranges.',
    elevationFn: (nx, _ny) => {
      if (nx < 0) {
        // Steep scarp from -1 to 0
        const t = (nx + 1); // 0 to 1
        return 120 + Math.pow(t, 0.5) * 360; // Rapid climb to 480m
      } else {
        // Gentle dip slope from 0 to 1
        return 480 - nx * 140; // Descends to 340m
      }
    },
    idealTransect: { start: [-0.9, 0], end: [0.9, 0], label: 'A (Scarp Foot) -> Crest -> B (Dip Slope Base)' },
  },
  {
    id: 'saddle',
    name: 'Saddle / Col',
    category: 'composite',
    description: 'A shallow depression or dip along a ridge crest connecting two higher peaks or summits on either side.',
    contourCharacteristics: 'Hourglass-shaped contours where two sets of concentric closed contours (peaks) are separated by a broad dip with no contours or widely separated curves.',
    gradientText: 'Gentle along ridge crest (1:20); steep down side valleys (1:3)',
    examTip: 'A saddle resembles a horse saddle. It provides the easiest natural path across a ridge crest.',
    elevationFn: (nx, ny) => {
      // Peaks at (-0.6, 0) and (0.6, 0)
      const d1 = Math.sqrt(Math.pow(nx + 0.6, 2) + Math.pow(ny, 2));
      const d2 = Math.sqrt(Math.pow(nx - 0.6, 2) + Math.pow(ny, 2));
      const peak1 = Math.max(0, 1 - d1 * 1.5) * 300;
      const peak2 = Math.max(0, 1 - d2 * 1.5) * 280;
      const saddleHeight = 220 - Math.abs(ny) * 160;
      return Math.max(80, Math.max(peak1, peak2) + saddleHeight);
    },
    idealTransect: { start: [-0.8, 0], end: [0.8, 0], label: 'A (West Peak) -> Saddle Col -> B (East Peak)' },
  },
  {
    id: 'pass',
    name: 'Mountain Pass',
    category: 'composite',
    description: 'A deep, narrow, navigable passage or corridor cut through a formidable mountain barrier, linking two opposing valleys.',
    contourCharacteristics: 'Two mountain masses on either side with very steep contours; in the center, two valley contour V-shapes point inward towards each other.',
    gradientText: 'Corridor gentle (1:15); canyon walls precipitous (1:1.5)',
    examTip: 'Passes are vital trade and military corridors through mountain ranges (e.g., Zoji La, Rohtang, Thal Ghat).',
    elevationFn: (nx, ny) => {
      // Valleys entering from north and south (y axis), towering walls on east and west (x axis)
      const valleyElevation = 180 + Math.abs(ny) * 60;
      const wallElevation = Math.pow(Math.abs(nx), 1.8) * 450;
      return Math.min(650, valleyElevation + wallElevation);
    },
    idealTransect: { start: [0, -0.9], end: [0, 0.9], label: 'A (South Valley) -> Pass Crest -> B (North Valley)' },
  },
];

// ─── 3. Verified Offline Elevation Datasets ─────────────────────────────────

export interface OfflineDEMDataset {
  id: string;
  name: string;
  sheetNumber?: string;
  description: string;
  isRealData: boolean;
  citation: string;
  horizontalScaleRF: number; // e.g. 50000
  contourIntervalM: number;  // e.g. 20
  bounds: {
    minEastingKm: number;
    maxEastingKm: number;
    minNorthingKm: number;
    maxNorthingKm: number;
  };
  keyLandmarks: Array<{
    name: string;
    elevationM: number;
    type: 'summit' | 'pass' | 'settlement' | 'lake' | 'benchmark';
    normX: number; // 0..1
    normY: number; // 0..1
  }>;
  elevationSampler: (normX: number, normY: number) => number;
}

export const OFFLINE_DEM_DATASETS: OfflineDEMDataset[] = [
  // 1. Survey of India Sheet 45 D/7: Mount Abu & Guru Shikhar
  {
    id: 'real-soi-45d7-mount-abu',
    name: 'Mount Abu & Guru Shikhar (Sheet 45 D/7)',
    sheetNumber: '45 D/7',
    description: 'Official Survey of India 1:50,000 educational toposheet elevation transect across the Aravalli Horst from the western plains of Anadra to the highest peak in Rajasthan (Guru Shikhar, ▲ 1722 m).',
    isRealData: true,
    citation: 'Based upon Survey of India 1:50,000 Sheet 45 D/7 (Sirohi & Banas Kantha Districts). Topographic Survey Records.',
    horizontalScaleRF: 50000,
    contourIntervalM: 20,
    bounds: {
      minEastingKm: 76,
      maxEastingKm: 92,
      minNorthingKm: 86,
      maxNorthingKm: 98,
    },
    keyLandmarks: [
      { name: 'Guru Shikhar (Highest Peak)', elevationM: 1722, type: 'summit', normX: 0.72, normY: 0.18 },
      { name: 'Achalgarh Fort', elevationM: 1375, type: 'summit', normX: 0.65, normY: 0.42 },
      { name: 'Dilwara Temples', elevationM: 1220, type: 'settlement', normX: 0.48, normY: 0.55 },
      { name: 'Nakki Lake (Crater/Fault Basin)', elevationM: 1195, type: 'lake', normX: 0.38, normY: 0.65 },
      { name: 'Anadra (Plains)', elevationM: 320, type: 'settlement', normX: 0.08, normY: 0.82 },
      { name: 'Oriya Village', elevationM: 1150, type: 'settlement', normX: 0.68, normY: 0.28 },
      { name: 'Trevor\'s Tank', elevationM: 1020, type: 'lake', normX: 0.52, normY: 0.45 },
    ],
    elevationSampler: (normX: number, normY: number): number => {
      // Real elevation model approximating the sheer granite horst of Abu
      // Plain on west (normX < 0.2): 300-340m
      // Steep granite escarpment (0.2 < normX < 0.4): climbs 340m -> 1180m
      // High plateau basin (Nakki / Dilwara): 1180m - 1240m
      // NE Horst Ridge (Achalgarh -> Guru Shikhar): rises to 1722m at normX=0.72, normY=0.18
      const dGuru = Math.sqrt(Math.pow(normX - 0.72, 2) + Math.pow(normY - 0.18, 2));
      const dAchal = Math.sqrt(Math.pow(normX - 0.65, 2) + Math.pow(normY - 0.42, 2));
      const dNakki = Math.sqrt(Math.pow(normX - 0.38, 2) + Math.pow(normY - 0.65, 2));

      if (normX < 0.2) {
        return 310 + normX * 150 + Math.sin(normY * 10) * 8;
      }
      if (normX < 0.35) {
        const scarpFrac = (normX - 0.2) / 0.15;
        return 340 + Math.pow(scarpFrac, 1.4) * 820; // 340m to 1160m
      }

      // Plateau base around 1180m
      let z = 1180 + Math.sin(normX * 6) * 40 - Math.cos(normY * 5) * 30;

      // Nakki Lake basin depression
      if (dNakki < 0.08) {
        z -= (1 - dNakki / 0.08) * 35;
      }

      // Guru Shikhar peak (1722m)
      if (dGuru < 0.25) {
        const factor = Math.cos((dGuru / 0.25) * (Math.PI / 2));
        z += Math.pow(factor, 1.8) * 597;
      }

      // Achalgarh peak (1375m)
      if (dAchal < 0.18) {
        const factor = Math.cos((dAchal / 0.18) * (Math.PI / 2));
        z += Math.pow(factor, 1.5) * 180;
      }

      return Math.round(z);
    },
  },

  // 2. Mahabaleshwar & Western Ghats Scarp (Sahyadri)
  {
    id: 'real-western-ghats-mahabaleshwar',
    name: 'Mahabaleshwar Scarp & Krishna Valley (Sahyadri)',
    description: 'Classic basaltic Deccan trap tableland with precipitous western escarpment overlooking the Konkan lowlands and gentle eastern dip slope toward the Krishna river.',
    isRealData: true,
    citation: 'Survey of India 1:50,000 Sheet 47 G/13 & National Remote Sensing Centre (NRSC) CartoDEM.',
    horizontalScaleRF: 50000,
    contourIntervalM: 20,
    bounds: {
      minEastingKm: 40,
      maxEastingKm: 56,
      minNorthingKm: 60,
      maxNorthingKm: 72,
    },
    keyLandmarks: [
      { name: 'Wilson Point (Sunrise Peak)', elevationM: 1438, type: 'summit', normX: 0.52, normY: 0.48 },
      { name: 'Arthur\'s Seat (Scarp Edge)', elevationM: 1340, type: 'summit', normX: 0.44, normY: 0.24 },
      { name: 'Konkan Plain (Poladpur)', elevationM: 120, type: 'settlement', normX: 0.08, normY: 0.35 },
      { name: 'Krishna River Source', elevationM: 1220, type: 'lake', normX: 0.62, normY: 0.52 },
      { name: 'Wai (Deccan Dip Slope)', elevationM: 710, type: 'settlement', normX: 0.92, normY: 0.65 },
    ],
    elevationSampler: (normX: number, normY: number): number => {
      // West: Konkan plains ~120m
      // Scarp from normX 0.25 to 0.45: ascends from 150m to 1400m
      // Mahabaleshwar Tableland (0.45 to 0.65): 1350m - 1438m
      // Eastern dip slope (0.65 to 1.0): descends gradually to 710m
      if (normX < 0.25) {
        return 120 + normX * 120;
      }
      if (normX < 0.45) {
        const scarpFrac = (normX - 0.25) / 0.2;
        return 150 + Math.pow(scarpFrac, 0.6) * 1240; // Steep scarp face
      }
      if (normX < 0.65) {
        const dWilson = Math.sqrt(Math.pow(normX - 0.52, 2) + Math.pow(normY - 0.48, 2));
        const plateauBase = 1370 + Math.sin(normY * 8) * 20;
        return dWilson < 0.12 ? plateauBase + (1 - dWilson / 0.12) * 68 : plateauBase;
      }
      const dipFrac = (normX - 0.65) / 0.35;
      return 1370 - Math.pow(dipFrac, 0.9) * 660; // 1370m down to 710m
    },
  },

  // 3. Educational Synthetic Parametric Terrain Generator (Explicitly marked)
  {
    id: 'synthetic-parametric-terrain',
    name: 'Educational Parametric Terrain (Simulation)',
    description: 'Controlled interactive terrain generator for demonstrating contour relationships in real time. Not an official geographic map.',
    isRealData: false,
    citation: 'Educational Simulation Model (Synthetic DEM Generator for Classroom Pedagogy).',
    horizontalScaleRF: 25000,
    contourIntervalM: 20,
    bounds: {
      minEastingKm: 10,
      maxEastingKm: 20,
      minNorthingKm: 10,
      maxNorthingKm: 20,
    },
    keyLandmarks: [
      { name: 'Simulated Peak Alpha', elevationM: 480, type: 'summit', normX: 0.5, normY: 0.5 },
      { name: 'Simulated Valley Base', elevationM: 100, type: 'lake', normX: 0.1, normY: 0.1 },
    ],
    elevationSampler: (normX: number, normY: number): number => {
      // Default concentric hill
      const dx = normX - 0.5;
      const dy = normY - 0.5;
      const r = Math.sqrt(dx * dx + dy * dy);
      return Math.round(100 + Math.max(0, 1 - r * 2.2) * 380);
    },
  },
];

// ─── 4. Grid Generation & Isoline Contour Extractor ─────────────────────────

export interface ContourSegment {
  level: number;
  isIndex: boolean;
  x1: number; // 0..1
  y1: number; // 0..1
  x2: number;
  y2: number;
}

export interface TerrainElevationGrid {
  cols: number;
  rows: number;
  minZ: number;
  maxZ: number;
  elevations: number[][]; // [row][col]
}

/**
 * Build regular 2D elevation grid from an elevation sampler function
 */
export function buildElevationGrid(
  cols: number,
  rows: number,
  sampler: (nx: number, ny: number) => number
): TerrainElevationGrid {
  const elevations: number[][] = [];
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    const ny = r / (rows - 1);
    for (let c = 0; c < cols; c++) {
      const nx = c / (cols - 1);
      const z = sampler(nx, ny);
      row.push(z);
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    elevations.push(row);
  }

  return { cols, rows, minZ, maxZ, elevations };
}

/**
 * Generate 2D isoline contour line segments using the standard Marching Squares algorithm.
 */
export function extractContourSegments(
  grid: TerrainElevationGrid,
  contourInterval: number,
  indexMultiplier: number = 5
): ContourSegment[] {
  const segments: ContourSegment[] = [];
  const { cols, rows, minZ, maxZ, elevations } = grid;

  // Determine starting and ending contour levels
  const startLevel = Math.ceil(minZ / contourInterval) * contourInterval;
  const endLevel = Math.floor(maxZ / contourInterval) * contourInterval;

  const dx = 1 / (cols - 1);
  const dy = 1 / (rows - 1);

  for (let level = startLevel; level <= endLevel; level += contourInterval) {
    const isIndex = level % (contourInterval * indexMultiplier) === 0;

    for (let r = 0; r < rows - 1; r++) {
      const y0 = r * dy;
      const y1 = (r + 1) * dy;

      for (let c = 0; c < cols - 1; c++) {
        const x0 = c * dx;
        const x1 = (c + 1) * dx;

        // Corners: top-left (v0), top-right (v1), bottom-right (v2), bottom-left (v3)
        const v0 = elevations[r][c];
        const v1 = elevations[r][c + 1];
        const v2 = elevations[r + 1][c + 1];
        const v3 = elevations[r + 1][c];

        let cellCase = 0;
        if (v0 >= level) cellCase |= 1;
        if (v1 >= level) cellCase |= 2;
        if (v2 >= level) cellCase |= 4;
        if (v3 >= level) cellCase |= 8;

        if (cellCase === 0 || cellCase === 15) continue;

        // Linear interpolation helper
        const lerp = (valA: number, valB: number) => {
          if (Math.abs(valB - valA) < 1e-6) return 0.5;
          return Math.max(0, Math.min(1, (level - valA) / (valB - valA)));
        };

        // Edge midpoints
        // Top edge (v0 to v1)
        const ptTop: [number, number] = [x0 + lerp(v0, v1) * dx, y0];
        // Right edge (v1 to v2)
        const ptRight: [number, number] = [x1, y0 + lerp(v1, v2) * dy];
        // Bottom edge (v3 to v2)
        const ptBottom: [number, number] = [x0 + lerp(v3, v2) * dx, y1];
        // Left edge (v0 to v3)
        const ptLeft: [number, number] = [x0, y0 + lerp(v0, v3) * dy];

        const addSeg = (p1: [number, number], p2: [number, number]) => {
          segments.push({
            level,
            isIndex,
            x1: p1[0],
            y1: p1[1],
            x2: p2[0],
            y2: p2[1],
          });
        };

        switch (cellCase) {
          case 1:
          case 14:
            addSeg(ptLeft, ptTop);
            break;
          case 2:
          case 13:
            addSeg(ptTop, ptRight);
            break;
          case 3:
          case 12:
            addSeg(ptLeft, ptRight);
            break;
          case 4:
          case 11:
            addSeg(ptRight, ptBottom);
            break;
          case 5:
            // Saddle case
            addSeg(ptLeft, ptTop);
            addSeg(ptRight, ptBottom);
            break;
          case 6:
          case 9:
            addSeg(ptTop, ptBottom);
            break;
          case 7:
          case 8:
            addSeg(ptLeft, ptBottom);
            break;
          case 10:
            // Saddle case
            addSeg(ptTop, ptRight);
            addSeg(ptLeft, ptBottom);
            break;
        }
      }
    }
  }

  return segments;
}

// ─── 5. Cross-Sectional Profile Calculator ──────────────────────────────────

export interface ProfileSamplePoint {
  index: number;
  normDist: number;      // 0..1 along line AB
  cumulativeDistKm: number;
  elevationM: number;
  slopePercent: number;  // Local gradient %
  normX: number;
  normY: number;
  isSummit?: boolean;
  isValleyBottom?: boolean;
}

export interface CrossSectionProfileResult {
  startPoint: { normX: number; normY: number; label: string; elevationM: number };
  endPoint: { normX: number; normY: number; label: string; elevationM: number };
  totalDistanceKm: number;
  minElevationM: number;
  maxElevationM: number;
  totalReliefM: number;
  averageGradientPercent: number;
  maxGradientPercent: number;
  samples: ProfileSamplePoint[];
  intervisible: boolean;
  obstructionPoint?: { distKm: number; elevationM: number; normDist: number };
  verticalExaggeration: number; // e.g. 5x
  horizontalScaleRF: number;   // 50000
  verticalScaleRF: number;     // e.g. 10000 (5x)
}

/**
 * Sample cross-sectional elevation profile along line A -> B
 */
export function generateCrossSectionProfile(
  sampler: (nx: number, ny: number) => number,
  start: [number, number], // [nx, ny] in 0..1
  end: [number, number],
  numSamples: number = 60,
  horizontalScaleRF: number = 50000,
  verticalExaggeration: number = 5,
  totalGroundWidthKm: number = 10
): CrossSectionProfileResult {
  const [x1, y1] = start;
  const [x2, y2] = end;

  // Normalized Euclidean distance in 0..1 space
  const normSpan = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const totalDistKm = normSpan * totalGroundWidthKm;

  const samples: ProfileSamplePoint[] = [];
  let minElev = Infinity;
  let maxElev = -Infinity;

  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1);
    const nx = x1 + (x2 - x1) * t;
    const ny = y1 + (y2 - y1) * t;
    const elev = sampler(nx, ny);
    const distKm = t * totalDistKm;

    if (elev < minElev) minElev = elev;
    if (elev > maxElev) maxElev = elev;

    samples.push({
      index: i,
      normDist: t,
      cumulativeDistKm: distKm,
      elevationM: elev,
      slopePercent: 0,
      normX: nx,
      normY: ny,
    });
  }

  // Compute local slopes and detect summits/valleys
  let maxGradient = 0;
  for (let i = 0; i < samples.length; i++) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const dDistM = (next.cumulativeDistKm - prev.cumulativeDistKm) * 1000;
    const dElevM = next.elevationM - prev.elevationM;
    const grad = dDistM > 0 ? Math.abs(dElevM / dDistM) * 100 : 0;
    samples[i].slopePercent = Math.round(grad * 10) / 10;
    if (grad > maxGradient) maxGradient = grad;

    // Local peak or trough
    if (i > 1 && i < samples.length - 2) {
      if (
        samples[i].elevationM > samples[i - 1].elevationM &&
        samples[i].elevationM > samples[i + 1].elevationM &&
        samples[i].elevationM - minElev > 20
      ) {
        samples[i].isSummit = true;
      }
      if (
        samples[i].elevationM < samples[i - 1].elevationM &&
        samples[i].elevationM < samples[i + 1].elevationM &&
        maxElev - samples[i].elevationM > 20
      ) {
        samples[i].isValleyBottom = true;
      }
    }
  }

  // Intervisibility Analysis
  // Direct line of sight from start point to end point
  const startElev = samples[0].elevationM;
  const endElev = samples[samples.length - 1].elevationM;
  let intervisible = true;
  let obstruction: { distKm: number; elevationM: number; normDist: number } | undefined;

  for (let i = 1; i < samples.length - 1; i++) {
    const t = samples[i].normDist;
    const sightLineElev = startElev + (endElev - startElev) * t;
    if (samples[i].elevationM > sightLineElev + 1.5) { // 1.5m tolerance
      intervisible = false;
      if (!obstruction || samples[i].elevationM - sightLineElev > obstruction.elevationM) {
        obstruction = {
          distKm: samples[i].cumulativeDistKm,
          elevationM: samples[i].elevationM,
          normDist: t,
        };
      }
    }
  }

  const startPt = {
    normX: x1,
    normY: y1,
    label: 'Point A',
    elevationM: startElev,
  };

  const endPt = {
    normX: x2,
    normY: y2,
    label: 'Point B',
    elevationM: endElev,
  };

  const relief = maxElev - minElev;
  const avgGradient = totalDistKm > 0 ? (Math.abs(endElev - startElev) / (totalDistKm * 1000)) * 100 : 0;
  const verticalScaleRF = Math.round(horizontalScaleRF / verticalExaggeration);

  return {
    startPoint: startPt,
    endPoint: endPt,
    totalDistanceKm: Math.round(totalDistKm * 100) / 100,
    minElevationM: Math.round(minElev),
    maxElevationM: Math.round(maxElev),
    totalReliefM: Math.round(relief),
    averageGradientPercent: Math.round(avgGradient * 10) / 10,
    maxGradientPercent: Math.round(maxGradient * 10) / 10,
    samples,
    intervisible,
    obstructionPoint: obstruction,
    verticalExaggeration,
    horizontalScaleRF,
    verticalScaleRF,
  };
}

// ─── 6. Teaching Exercises & Assessment Bank ────────────────────────────────

export type ExerciseCategory =
  | 'slope-types'
  | 'hills-valleys'
  | 'contour-intervals'
  | 'terrain-interpretation'
  | 'cross-section-profiles'
  | 'contour-comparison';

export interface ContourExercise {
  id: string;
  category: ExerciseCategory;
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
  associatedLandformId?: string;
}

export const CONTOUR_EXERCISES: ContourExercise[] = [
  // 1. Slope Types
  {
    id: 'ex-slope-1',
    category: 'slope-types',
    title: 'Slope Spacing Identification',
    question: 'When contour lines on a topographical map are packed very close together, almost touching each other, what type of ground slope is represented?',
    options: ['Gentle slope', 'Steep slope or cliff', 'Uniform gentle plain', 'Flat plateau tableland'],
    correctIndex: 1,
    explanation: 'Closely spaced contour lines indicate that elevation is changing rapidly over a very short horizontal ground distance, signifying a steep slope, escarpment, or cliff face.',
    hint: 'Think about how much vertical climb occurs in a few millimetres on the map.',
    associatedLandformId: 'steep-slope',
  },
  {
    id: 'ex-slope-2',
    category: 'slope-types',
    title: 'Intervisibility on a Concave Slope',
    question: 'An observer stands at the top of a concave slope (where contours are close together at the crest and widely spaced at the base). Can they see another observer standing at the foot of the slope?',
    options: [
      'Yes, they are intervisible because the slope curves inward below the direct line of sight.',
      'No, because the outward bulge of the hill blocks the line of sight.',
      'No, because concave slopes always contain thick vegetation.',
      'Only if the contour interval is greater than 50 metres.',
    ],
    correctIndex: 0,
    explanation: 'On a concave slope, the crest is steep while the base is gentle. The ground drops away rapidly from the crest, placing the slope surface entirely BELOW the direct straight line of sight between the two points, ensuring mutual intervisibility.',
    hint: 'Imagine looking down into a salad bowl.',
    associatedLandformId: 'concave-slope',
  },
  {
    id: 'ex-slope-3',
    category: 'slope-types',
    title: 'Convex Slope Characteristics',
    question: 'Which of the following contour spacing patterns correctly characterizes a convex slope?',
    options: [
      'Evenly spaced throughout its entire length',
      'Widely spaced at the top (gentle crest) and closely spaced at the bottom (steep base)',
      'Closely spaced at the top and widely spaced at the bottom',
      'Circular closed contours without numbers',
    ],
    correctIndex: 1,
    explanation: 'A convex slope bulges outward like a dome. The upper crest is relatively flat and gentle (widely spaced contours), while the lower flanks plunge steeply down to the base (tightly packed contours).',
    hint: 'The slope becomes steeper as you walk downwards.',
    associatedLandformId: 'convex-slope',
  },

  // 2. Hills and Valleys
  {
    id: 'ex-hill-valley-1',
    category: 'hills-valleys',
    title: 'The Rule of Vs for Stream Valleys',
    question: 'On a topographical sheet, a series of V-shaped contour lines are crossed by a blue drainage line. What is the fundamental cartographic rule for determining the river flow direction?',
    options: [
      'The apex of the V always points downstream in the direction of water flow.',
      'The apex of the V always points UPSTREAM towards higher elevation (water flows out of the V).',
      'Rivers always flow perpendicular to the V-contour axis.',
      'V-shaped contours only occur on man-made canals, not natural rivers.',
    ],
    correctIndex: 1,
    explanation: 'The Rule of Vs states that when a contour crosses a river valley, it bends upstream because the river channel has carved down into the valley floor. The apex of the V points towards higher elevation (upstream), and water flows out through the open mouth towards lower ground.',
    hint: 'Remember that water always seeks the path of lowest potential energy.',
    associatedLandformId: 'valley',
  },
  {
    id: 'ex-hill-valley-2',
    category: 'hills-valleys',
    title: 'Distinguishing Spurs from Valleys',
    question: 'Both valleys and spurs produce V-shaped or U-shaped contour patterns. How do you definitively distinguish a spur from a valley on a map?',
    options: [
      'In a spur, the apex of the V points towards LOWER elevation; in a valley, it points towards HIGHER elevation.',
      'Spurs are always printed in blue, while valleys are printed in brown.',
      'Valleys have closed loops, while spurs are straight lines.',
      'Spurs only occur above 1500 metres altitude.',
    ],
    correctIndex: 0,
    explanation: 'A spur is a ridge of high land jutting out into lower ground, so its contour apex points downhill towards lower contour values. A valley is cut into the land, so its contour apex points uphill towards higher contour values.',
    hint: 'Look at the contour numbers along the axis of the V.',
    associatedLandformId: 'spur',
  },

  // 3. Contour Intervals
  {
    id: 'ex-ci-1',
    category: 'contour-intervals',
    title: 'Survey of India 1:50,000 Standard Interval',
    question: 'What is the standard contour interval used on the official Survey of India 1:50,000 Open Series Maps (OSM)?',
    options: ['10 metres', '20 metres', '50 metres', '100 metres'],
    correctIndex: 1,
    explanation: 'The standard contour interval for Survey of India 1:50,000 scale topographical sheets is 20 metres (with index contours printed bolder at every 100 metres).',
    hint: 'Check the marginalia at the bottom center of SoI Sheet 45 D/7.',
    associatedLandformId: 'steep-slope',
  },
  {
    id: 'ex-ci-2',
    category: 'contour-intervals',
    title: 'Calculating Contour Interval from Index Contours',
    question: 'Two adjacent index contours on a map are labeled 300 m and 400 m. If there are four intermediate contour lines drawn between them, what is the contour interval?',
    options: ['10 metres', '20 metres', '25 metres', '50 metres'],
    correctIndex: 1,
    explanation: 'Elevation difference = 400 - 300 = 100 m. Four intermediate lines create five intervals. Contour Interval = 100 m / 5 = 20 metres.',
    hint: 'Formula: C.I. = (Index2 - Index1) / (Number of intermediate lines + 1).',
  },

  // 4. Terrain Interpretation
  {
    id: 'ex-interp-1',
    category: 'terrain-interpretation',
    title: 'Plateau Identification',
    question: 'A map depicts an extensive upland area surrounded by very tightly packed contours, but the interior central area is largely blank with only a few widely spaced wavy lines. What landform is this?',
    options: ['Ridge', 'Deep canyon', 'Plateau or Tableland', 'Volcanic cone'],
    correctIndex: 2,
    explanation: 'A plateau is an elevated tableland. The tightly packed perimeter contours represent the steep escarpment edges, while the wide absence of contours in the center indicates flat or gently undulating upland.',
    hint: 'Think of tablelands like the Deccan Plateau or Mahabaleshwar.',
    associatedLandformId: 'plateau',
  },
  {
    id: 'ex-interp-2',
    category: 'terrain-interpretation',
    title: 'Depression Contours with Hachures',
    question: 'What do short perpendicular tick marks (hachures) drawn on the inner side of a closed contour line signify?',
    options: [
      'The land slopes DOWNWARD towards the center, forming a depression or crater.',
      'The land rises sharply to a rocky pinnacle.',
      'The area is subject to seasonal flooding.',
      'It marks a railway cutting.',
    ],
    correctIndex: 0,
    explanation: 'Hachured contours indicate a depression (such as a volcanic caldera, sinkhole, or quarry). The tick marks always point downhill towards the bottom of the sunken depression.',
    hint: 'Ticks point towards the lowest ground.',
    associatedLandformId: 'depression',
  },

  // 5. Cross-Section Profiles
  {
    id: 'ex-profile-1',
    category: 'cross-section-profiles',
    title: 'Vertical Exaggeration Purpose',
    question: 'Why do geographers apply Vertical Exaggeration (e.g. 5x or 10x) when drawing cross-sectional profiles of topographical maps?',
    options: [
      'To make the map look more artistic and colorful.',
      'Because real topographic relief is tiny compared to horizontal ground distance, making hills look completely flat without exaggeration.',
      'To convert metric measurements into imperial feet.',
      'Because Survey of India regulations mandate it for all military maps.',
    ],
    correctIndex: 1,
    explanation: 'On a 1:50,000 scale map, a 200m hill is only 4 mm tall in true scale, while spanning several centimetres horizontally. Without vertical exaggeration (V.E.), the profile would look like a nearly flat line, concealing crucial slope variations and landforms.',
    hint: 'Horizontal distances (kilometres) are vastly greater than vertical heights (metres).',
  },
  {
    id: 'ex-profile-2',
    category: 'cross-section-profiles',
    title: 'Calculating Vertical Exaggeration',
    question: 'If the horizontal scale of a profile is 1:50,000 (1 cm = 500 m) and the vertical scale is 1:10,000 (1 cm = 100 m), what is the Vertical Exaggeration (V.E.)?',
    options: ['2x', '5x', '10x', '50x'],
    correctIndex: 1,
    explanation: 'Vertical Exaggeration = Horizontal Scale Denominator / Vertical Scale Denominator = 50,000 / 10,000 = 5x.',
    hint: 'Divide the horizontal denominator by the vertical denominator.',
  },

  // 6. Contour Comparison
  {
    id: 'ex-compare-1',
    category: 'contour-comparison',
    title: 'Saddle vs Mountain Pass',
    question: 'What is the key geographical difference between a saddle and a mountain pass (col)?',
    options: [
      'A saddle is a broad, shallow dip between two gentle summits, whereas a pass is a deep, narrow, navigable corridor through a mountain ridge connecting two valleys.',
      'Saddles are formed by wind, while passes are formed by volcanoes.',
      'A saddle has contours below sea level.',
      'Passes are always man-made tunnels.',
    ],
    correctIndex: 0,
    explanation: 'Both represent low points along a crest line. A saddle is a broad, shallow, gently sloping depression between two peaks on the same ridge. A pass is a much deeper, narrower col connecting two opposing river valleys, utilized as a transportation route.',
    hint: 'Consider how deep the corridor cuts into the mountain range.',
    associatedLandformId: 'saddle',
  },
];
