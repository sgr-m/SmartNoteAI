/**
 * Survey of India Conventional Signs & Symbols Catalog
 * Stage 4: Interactive Topographical Map Viewer
 *
 * Sourced from the official Survey of India Topographical Map Legend
 * (Standard 1:50,000 Open Series Maps and Educational Map Series).
 * Includes detailed pedagogical explanations and curriculum exam tips
 * prescribed across CBSE and ICSE Higher Secondary Geography syllabi.
 */

export interface TopoSymbolRecord {
  id: string;
  name: string;
  category:
    | 'roads'
    | 'railways'
    | 'bridges'
    | 'settlements'
    | 'buildings'
    | 'religious'
    | 'water'
    | 'relief'
    | 'vegetation'
    | 'boundaries';
  color: string;
  symbolGlyph: string;
  meaning: string;
  topographicalContext: string;
  curriculumSignificance: string;
}

export const SO_TOPOGRAPHICAL_SYMBOLS: TopoSymbolRecord[] = [
  // ── 1. Roads & Transport ──
  {
    id: 'sym-road-metalled',
    name: 'Metalled Road (NH / SH)',
    category: 'roads',
    color: '#ef4444',
    symbolGlyph: '═══',
    meaning: 'Tarred or all-weather macadamized road with bridges and culverts across drainage channels.',
    topographicalContext: 'Indicates high economic connectivity, vehicular transport, and links between towns or district centers.',
    curriculumSignificance: 'Students are frequently asked to identify all-weather connectivity between two settlements.',
  },
  {
    id: 'sym-road-unmetalled',
    name: 'Unmetalled Road',
    category: 'roads',
    color: '#ef4444',
    symbolGlyph: '---',
    meaning: 'Kachcha road or graded dirt track, usable primarily in dry weather.',
    topographicalContext: 'Connects interior rural villages with secondary highways; may be impassable during the monsoon.',
    curriculumSignificance: 'Question: "What type of communication connects village A with village B?"',
  },
  {
    id: 'sym-cart-track',
    name: 'Cart Track',
    category: 'roads',
    color: '#ef4444',
    symbolGlyph: '───',
    meaning: 'Single red line denoting a pathway traversed by bullock carts or tractors.',
    topographicalContext: 'Predominant mode of transit in agricultural plains and rural farming tracts.',
    curriculumSignificance: 'Often features a causeway or ferry crossing across dry seasonal streams.',
  },
  {
    id: 'sym-pack-track',
    name: 'Pack Track / Mule Track',
    category: 'roads',
    color: '#92400e',
    symbolGlyph: '- - -',
    meaning: 'Bridle path or mule track suitable for pack animals in hilly or forested terrain.',
    topographicalContext: 'Indicates steep or rocky relief where vehicular traffic and carts cannot operate.',
    curriculumSignificance: 'Common in Mount Abu (45 D/7) and Himalayan foothills (53 E/4).',
  },
  {
    id: 'sym-footpath',
    name: 'Footpath with Pass',
    category: 'roads',
    color: '#dc2626',
    symbolGlyph: '·····',
    meaning: 'Single dashed red line indicating pedestrian path across mountains or forests, often traversing a col or pass.',
    topographicalContext: 'Used by villagers and trekkers across ridges and steep valley scarps.',
    curriculumSignificance: 'Identifies saddles, cols, and natural crossing points across contour ridges.',
  },

  // ── 2. Railways ──
  {
    id: 'sym-railway-bg',
    name: 'Broad Gauge Railway',
    category: 'railways',
    color: '#0f172a',
    symbolGlyph: '┼┼┼┼',
    meaning: 'Standard 1,676 mm broad gauge railway line with station, distance stones, and sidings.',
    topographicalContext: 'Heavy freight and inter-city passenger rail line serving regional junctions.',
    curriculumSignificance: 'Identified by "RS" symbol alongside the track for Railway Station.',
  },
  {
    id: 'sym-level-crossing',
    name: 'Level Crossing (LC)',
    category: 'railways',
    color: '#0f172a',
    symbolGlyph: 'LC ┼',
    meaning: 'Intersection where a metalled or unmetalled road crosses a railway track at the same grade.',
    topographicalContext: 'Indicates road-rail integration, usually gated with a gateman lodge.',
    curriculumSignificance: 'Common six-figure grid reference question target.',
  },

  // ── 3. Bridges & Crossings ──
  {
    id: 'sym-causeway',
    name: 'Causeway',
    category: 'bridges',
    color: '#2563eb',
    symbolGlyph: '≈[CW]≈',
    meaning: 'Raised metalled platform or paved ford across a shallow non-perennial stream bed.',
    topographicalContext: 'Water flows over or through culverts during flash floods but remains crossable most of the year.',
    curriculumSignificance: 'Prominent evidence of seasonal drainage in semi-arid areas like Palanpur and Sirohi.',
  },
  {
    id: 'sym-masonry-bridge',
    name: 'Masonry Bridge',
    category: 'bridges',
    color: '#ef4444',
    symbolGlyph: '][',
    meaning: 'Permanent stone, concrete, or steel bridge spanning a river, railway, or canal.',
    topographicalContext: 'Enables year-round uninterrupted transport across perennial rivers or deep ravines.',
    curriculumSignificance: 'Symbolized by brackets "][" across the blue water line on a red road.',
  },

  // ── 4. Settlements ──
  {
    id: 'sym-settlement-nucleated',
    name: 'Nucleated / Clustered Settlement',
    category: 'settlements',
    color: '#dc2626',
    symbolGlyph: '■■■',
    meaning: 'Compact cluster of red permanent dwelling blocks around a common water source or intersection.',
    topographicalContext: 'Dominant settlement pattern in fertile plains with communal farming, security needs, and water availability.',
    curriculumSignificance: 'Question: "What is the settlement pattern of village X?" Answer: Nucleated.',
  },
  {
    id: 'sym-settlement-dispersed',
    name: 'Dispersed / Scattered Settlement',
    category: 'settlements',
    color: '#dc2626',
    symbolGlyph: '▫  ▫  ▫',
    meaning: 'Isolated individual farmsteads or huts scattered across a wide area.',
    topographicalContext: 'Characteristic of rugged hilly terrain, sand dunes, or forested plateaus with fragmented arable land.',
    curriculumSignificance: 'Contrasted with nucleated settlements; common in Mount Abu hills.',
  },
  {
    id: 'sym-settlement-linear',
    name: 'Linear Settlement',
    category: 'settlements',
    color: '#dc2626',
    symbolGlyph: '■-■-■',
    meaning: 'Dwellings arranged in a narrow row along a metalled road, river bank, or canal levee.',
    topographicalContext: 'Pattern driven by accessibility to the transport ribbon or river front.',
    curriculumSignificance: 'Identified by observing settlement blocks aligned parallel to a road.',
  },

  // ── 5. Buildings & Administrative Public Utilities ──
  {
    id: 'sym-post-office',
    name: 'Post Office (PO)',
    category: 'buildings',
    color: '#dc2626',
    symbolGlyph: 'PO',
    meaning: 'Postal and postal banking facility denoted by the red abbreviation "PO".',
    topographicalContext: 'Identifies central administrative or market village serving neighboring hamlets.',
    curriculumSignificance: 'Frequent target for four-figure and six-figure grid reference questions.',
  },
  {
    id: 'sym-police-station',
    name: 'Police Station (PS)',
    category: 'buildings',
    color: '#dc2626',
    symbolGlyph: 'PS',
    meaning: 'Law enforcement and civic security station labeled "PS".',
    topographicalContext: 'Denotes taluk headquarters, police outpost, or significant administrative node.',
    curriculumSignificance: 'Indicates civic administrative importance of a settlement.',
  },
  {
    id: 'sym-inspection-bungalow',
    name: 'Inspection Bungalow (IB) / Rest House (RH)',
    category: 'buildings',
    color: '#dc2626',
    symbolGlyph: 'IB',
    meaning: 'Government rest facility for public works, forest, or irrigation department officials.',
    topographicalContext: 'Located near forested tracts, reservoirs, canals, or hill roads for touring officers.',
    curriculumSignificance: 'Appears as "IB", "RH", or "CH" (Circuit House) in Survey of India sheets.',
  },

  // ── 6. Religious & Cultural Landmarks ──
  {
    id: 'sym-temple',
    name: 'Temple',
    category: 'religious',
    color: '#dc2626',
    symbolGlyph: '🛕 ⛫',
    meaning: 'Hindu shrine or temple, indicated by a square base with a shikhara and flag.',
    topographicalContext: 'Focal cultural point of villages and hilltops (e.g. Dilwara Temples on Sheet 45 D/7).',
    curriculumSignificance: 'Often built on commanding ridges or near perennial springs and tanks.',
  },
  {
    id: 'sym-chhatri',
    name: 'Chhatri (Cenotaph)',
    category: 'religious',
    color: '#dc2626',
    symbolGlyph: '⯌',
    meaning: 'Elevated dome-shaped pavilion erected as a memorial cenotaph.',
    topographicalContext: 'Historic and cultural landmark characteristic of Rajasthan and Gujarat landscape.',
    curriculumSignificance: 'Appears frequently in Rajasthan sheets (45 D/7, 45 D/10).',
  },
  {
    id: 'sym-mosque',
    name: 'Mosque',
    category: 'religious',
    color: '#dc2626',
    symbolGlyph: '🕌',
    meaning: 'Islamic place of worship with minarets and dome.',
    topographicalContext: 'Civic religious facility in towns and agricultural villages.',
    curriculumSignificance: 'Identified by crescent and dome symbol.',
  },

  // ── 7. Water Features & Drainage ──
  {
    id: 'sym-river-perennial',
    name: 'Perennial River (Blue Water Channel)',
    category: 'water',
    color: '#0284c7',
    symbolGlyph: '≋≋≋',
    meaning: 'River maintaining continuous surface water flow throughout the year, shown in solid blue.',
    topographicalContext: 'Fed by snowmelt or high-rainfall perennial springs; vital source for canal headworks.',
    curriculumSignificance: 'Differentiated from non-perennial streams which lack a solid blue water channel.',
  },
  {
    id: 'sym-river-non-perennial',
    name: 'Non-Perennial River / Dry Riverbed',
    category: 'water',
    color: '#0f172a',
    symbolGlyph: '░░░',
    meaning: 'Broad riverbed of dry sand with black banks, containing water only during monsoon rains.',
    topographicalContext: 'Prevalent in semi-arid western India (Sirohi, Banas Kantha, Aravalli rain shadow).',
    curriculumSignificance: 'Symbol of seasonal rainfall; often crossable by cart tracks and causeways.',
  },
  {
    id: 'sym-open-lined-well',
    name: 'Lined Perennial Well (Solid Blue Circle)',
    category: 'water',
    color: '#0284c7',
    symbolGlyph: '●',
    meaning: 'Masonry-lined permanent well containing water throughout the year.',
    topographicalContext: 'Primary irrigation and drinking water source in alluvial farmland.',
    curriculumSignificance: 'Key exam clue for dominant occupation (agriculture) and high water table.',
  },
  {
    id: 'sym-open-unlined-well',
    name: 'Unlined Well (Open Blue Circle)',
    category: 'water',
    color: '#0284c7',
    symbolGlyph: '○',
    meaning: 'Kachcha unlined pit dug down to the water table without brick masonry casing.',
    topographicalContext: 'Temporary well in fields; susceptible to collapse during heavy rains.',
    curriculumSignificance: 'Distinguished from solid blue circle (lined well).',
  },
  {
    id: 'sym-canal',
    name: 'Canal with Lock',
    category: 'water',
    color: '#0284c7',
    symbolGlyph: '══|══',
    meaning: 'Artificial irrigation or navigation channel diverting water from a river or reservoir.',
    topographicalContext: 'Engineered waterway with embankments and regulating sluice gates.',
    curriculumSignificance: 'Blue line with parallel black casing lines indicating artificial construction.',
  },
  {
    id: 'sym-perennial-tank',
    name: 'Perennial Tank with Masonry Embankment',
    category: 'water',
    color: '#0284c7',
    symbolGlyph: '◖█◗',
    meaning: 'Artificial reservoir or lake with concrete/stone bund retaining water year-round (e.g. Nakki Lake).',
    topographicalContext: 'Supplies drinking water to hill stations and gravity irrigation to foothill farms.',
    curriculumSignificance: 'Solid blue fill with thick black hatched embankment wall.',
  },

  // ── 8. Relief & Elevation ──
  {
    id: 'sym-contour-line',
    name: 'Contour Line (20m Interval)',
    category: 'relief',
    color: '#854d0e',
    symbolGlyph: '∿∿∿',
    meaning: 'Brown line joining points of equal elevation above mean sea level (vertical interval: 20 m).',
    topographicalContext: 'Closely spaced contours indicate steep slopes/cliffs; widely spaced contours indicate gentle plains.',
    curriculumSignificance: 'Fundamental tool for calculating slope, gradient, and identifying landforms.',
  },
  {
    id: 'sym-contour-index',
    name: 'Index Contour (100m Interval, Labeled)',
    category: 'relief',
    color: '#713f12',
    symbolGlyph: '━━ 500 ━━',
    meaning: 'Thicker brown contour line printed every 50m or 100m, labeled with its height in metres.',
    topographicalContext: 'Enables rapid visual identification of general elevation without counting every line.',
    curriculumSignificance: 'Always look for index contours first when calculating elevations.',
  },
  {
    id: 'sym-spot-height',
    name: 'Spot Height (e.g. .542)',
    category: 'relief',
    color: '#0f172a',
    symbolGlyph: '.542',
    meaning: 'Precise ground elevation in metres at a specific point, indicated by a black dot with the number.',
    topographicalContext: 'Indicates local summits, hill crests, or depression floors.',
    curriculumSignificance: 'Direct answer for elevation questions (e.g. "What is the height of spot height .542? Answer: 542 m").',
  },
  {
    id: 'sym-triangulated-height',
    name: 'Triangulated Height (e.g. ▲ 1722 Guru Shikhar)',
    category: 'relief',
    color: '#0f172a',
    symbolGlyph: '▲ 1722',
    meaning: 'Elevation accurately surveyed using trigonometric triangulation from a geodetic benchmark station.',
    topographicalContext: 'Marks primary high peaks (e.g. Guru Shikhar 1722 m on Sheet 45 D/7).',
    curriculumSignificance: 'Symbolized by a triangle followed by the exact surveyed altitude.',
  },
  {
    id: 'sym-bench-mark',
    name: 'Bench Mark (BM 348)',
    category: 'relief',
    color: '#0f172a',
    symbolGlyph: 'BM 348',
    meaning: 'Permanent mark cut on a stone pillar, rock, or building by the Survey of India showing precise height.',
    topographicalContext: 'Serves as reference point for local engineering, road construction, and canal surveys.',
    curriculumSignificance: 'Distinguished from spot height by the letters "BM".',
  },
  {
    id: 'sym-sand-dunes',
    name: 'Sand Dunes & Shifting Sands',
    category: 'relief',
    color: '#ca8a04',
    symbolGlyph: '∴∵∴',
    meaning: 'Brown stippled pattern representing wind-blown sand dunes, barkhans, and arid sand ridges.',
    topographicalContext: 'Dominant landform in Sheet 45 D/10 (semi-arid transitional plain bordering Thar Desert).',
    curriculumSignificance: 'Indicates wind deposition, arid climate, and sparse agricultural potential.',
  },

  // ── 9. Vegetation & Land Use ──
  {
    id: 'sym-reserved-forest',
    name: 'Reserved Forest (RF)',
    category: 'vegetation',
    color: '#15803d',
    symbolGlyph: '[RF] 🌲',
    meaning: 'Reserved Forest (RF) is a state-owned forest protected under the Indian Forest Act with restricted commercial exploitation.',
    topographicalContext: 'Covers high hill ranges (Mount Abu sanctuary) preventing soil erosion on steep slopes.',
    curriculumSignificance: 'Look for green tint with green dashed border and letters "RF".',
  },
  {
    id: 'sym-protected-forest',
    name: 'Protected Forest (PF)',
    category: 'vegetation',
    color: '#16a34a',
    symbolGlyph: '[PF] 🌳',
    meaning: 'Forest area where local communities have limited grazing and firewood collection rights.',
    topographicalContext: 'Buffer zones surrounding reserved forests and village commons.',
    curriculumSignificance: 'Identified by green wash and letters "PF".',
  },
  {
    id: 'sym-open-scrub',
    name: 'Open Scrub',
    category: 'vegetation',
    color: '#84cc16',
    symbolGlyph: 'ψ ψ ψ',
    meaning: 'Stunted thorny vegetation, xerophytic bushes, and scattered grass tufts.',
    topographicalContext: 'Indicates rocky terrain, thin degraded soil, and rainfall under 75 cm.',
    curriculumSignificance: 'Primary occupation in open scrub areas is pastoralism / sheep and goat rearing.',
  },
  {
    id: 'sym-stony-waste',
    name: 'Stony Waste / Sheet Rock',
    category: 'vegetation',
    color: '#eab308',
    symbolGlyph: '▒▒▒',
    meaning: 'Barren exposed bedrock, scree, and boulder fields unfit for agriculture.',
    topographicalContext: 'Common in weathered granite/gneiss hills of the Aravalli range.',
    curriculumSignificance: 'Indicates non-arable wasteland where cultivation is impossible.',
  },

  // ── 10. Boundaries ──
  {
    id: 'sym-boundary-state',
    name: 'State Boundary',
    category: 'boundaries',
    color: '#475569',
    symbolGlyph: '— · — ·',
    meaning: 'Border separating two Indian States (e.g. Rajasthan and Gujarat on Sheet 45 D/7).',
    topographicalContext: 'Administrative demarcation delineated strictly per Survey of India gazetteers.',
    curriculumSignificance: 'Line of alternating thick dash and single dot in black or purple.',
  },
  {
    id: 'sym-boundary-district',
    name: 'District Boundary',
    category: 'boundaries',
    color: '#64748b',
    symbolGlyph: '— — — —',
    meaning: 'Administrative border between two revenue districts (e.g. Sirohi and Banas Kantha).',
    topographicalContext: 'Demarcates local administrative jurisdiction and municipal governance.',
    curriculumSignificance: 'Dashed black line with uniform spacing.',
  },
];
