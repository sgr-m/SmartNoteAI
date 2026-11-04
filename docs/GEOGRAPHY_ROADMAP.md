# Geography Teaching Module — Multi-Stage Implementation Roadmap

**Document Version:** 1.9.0  
**Current Milestone:** Stage 9 Complete (Physical Geography Interactive Laboratory Established)  
**Next Milestone:** Stage 10 (Awaiting Stage 10 Instruction)  

---

## 1. Project Overview & Execution Protocol

This roadmap defines the multi-stage implementation plan for the Geography Teaching Module inside SmartBoard Studio. Each stage is self-contained, adheres to the established project development rules, and undergoes automated testing, type-checking, and status documentation updates before proceeding to the next stage.

### Stage Execution Protocol
```
A. Inspect relevant existing code
B. Identify files & modules requiring modification
C. Explain implementation approach
D. Implement strictly the requested stage
E. Run tests, typecheck (renderer + main), and build checks
F. Inspect Git diff
G. Update docs/GEOGRAPHY_ROADMAP.md and docs/GEOGRAPHY_STATUS.md
H. Report completed work, test results, limitations, and await next stage instruction
```

---

## 2. Stage Breakdown & Sequence

### Stage 0: Repository Audit & Architectural Baseline (COMPLETE)
- **Objective**: Conduct comprehensive architectural audit of SmartBoard Studio, evaluate geospatial rendering options, establish authoritative source standards (Survey of India priority), and construct documentation governance.
- **Deliverables**:
  - `docs/GEOGRAPHY_ARCHITECTURE.md`
  - `docs/GEOGRAPHY_ROADMAP.md`
  - `docs/GEOGRAPHY_STATUS.md`
  - `docs/GEOGRAPHY_SOURCES.md`
- **Application Code Modifications**: None (Zero modification rule for Stage 0).

---

### Stage 1: Build the Geography Resource Centre (COMPLETE)
- **Objective**: Establish the core module definitions, register Geography in the subject ecosystem, build the typed resource registry across all 15 curriculum categories, and construct the professional touchscreen-ready Geography Resource Centre modal with search, multi-faceted filtering, resource inspector, favorites/recent memory, and dual light/dark themes.
- **Deliverables**:
  - `src/renderer/services/geography/types.ts`: Typed schema for categories, classes, scopes, resource types, and availability.
  - `src/renderer/services/geography/geographyRegistry.ts`: Authoritative registry with real verified metadata across all 15 categories, Survey of India compliance enforcement, and localStorage persistence.
  - `src/renderer/services/subjectModules/geographyModule.ts`: `GeographyModule` implementing `SubjectModule` with tools and templates.
  - `src/renderer/components/geography/GeographyResourceCentreModal.tsx`: Touchscreen UI with category navigation, search, multi-filters, and inspector.
  - `src/renderer/components/geography/GeographyResourceCentreModal.css`: Light and Dark theme styling with ≥44px touch targets.
  - `tests/geographyResourceCentre.test.ts`: Automated unit test suite verifying categories, search, filtering, metadata integrity, SoI compliance, and tools.
- **Verification Gate**: 21/21 test files passing (298/298 tests); zero TypeScript errors; production build verified.

---

### Stage 2: Interactive Geography Objects on the Whiteboard (COMPLETE)
- **Objective**: Implement the architecture that allows Geography resources to be inserted into the existing whiteboard as interactive objects with typed schemas, 4 interaction modes, conflict-free event handling, and 100% loss-free document persistence.
- **Deliverables**:
  - `src/renderer/services/geography/types.ts`: Typed `GeoResourceState` schema with `GeoCameraState`, `GeoLayerConfig`, `GeoAnnotationItem`, `GeoFeatureInfo`, and factory `createDefaultGeoResourceState()`.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Pure Canvas2D vector graphics renderer implementing Survey of India compliant boundaries, major physiographic regions, Graticule grid (IST Meridian 82°30'E, Tropic of Cancer 23°30'N), North Arrow / Compass Rose, graphic scale bar, and mandatory legal attribution.
  - `src/renderer/engine/subjectShapeRenderer.ts`: Registered `geoMap`, `geoGlobe`, `geoTopoProfile`, `geoCoordinateGrid`, and `geoThematicLayer` in `isSubjectShape()` and dispatched to `renderGeographyShape()`.
  - `src/renderer/engine/DrawingEngine.ts`: Pointer event conflict prevention (dragging inside map in interact mode pans camera; wheel scroll zooms viewport without shifting canvas; feature hit-testing on click).
  - `src/renderer/components/WhiteboardCanvas.tsx`: On-board horizontal quick floating toolbar for Geography objects (4-mode switcher: Select, Interact, Annotate, Present; camera zoom/reset controls; layer toggles; feature deselect; presentation mode HUD with one-click return).
  - `tests/geographyWhiteboardObject.test.ts`: 10 comprehensive unit tests covering object model, 4 modes, serialization/persistence, hit testing, undo/redo, and Canvas2D rendering.
- **Verification Gate**: 22/22 test files passing (308/308 tests); zero TypeScript errors (`tsc --noEmit`); clean production build.

---

### Stage 3: India Map Library and World Atlas (COMPLETE)
- **Objective**: Implement the Geography atlas using genuine geographic resources: official Survey of India maps (Political, Physical, Outline, Toposheets 45 D/7, 45 D/10, 53 E/4), 28 States & 8 UTs directory, World Atlas with 17 verified thematic datasets, geodesic distance measurement (Haversine formula), and interactive atlas viewer modal.
- **Deliverables**:
  - `src/renderer/services/geography/atlasData.ts`: Official Survey of India catalog, 28 States & 8 UTs with official capitals and SoI portal links, 17 World Atlas thematic datasets (Natural Earth CC0, USGS, NOAA, Köppen), and verified geographic feature entities.
  - `src/renderer/services/geography/geodesicService.ts`: Spherical Haversine distance calculator in km, miles, NM; forward azimuth/bearing & 16-wind compass headings; great-circle waypoint arc interpolator.
  - `src/renderer/components/geography/GeographyAtlasModal.tsx` & `.css`: Touchscreen dual-tab atlas explorer ("Official India Maps & Toposheets" vs "World Atlas & Thematic Explorer"), live canvas preview, thematic layer checkboxes, entity search, location inspector card, geodesic measurement tool, and one-click whiteboard insertion.
  - `src/renderer/engine/geographyShapeRenderer.ts`: World continent/ocean vector paths, tectonic plates, warm/cold ocean currents, volcanoes, mountains, dynamic cartographic legend drawer, geodesic great-circle arc, and readout badges.
  - `src/renderer/services/subjectModules/geographyModule.ts`: Registered Stage 3 tools (`geo-tool-atlas`, `geo-tool-soi-toposheets`, `geo-tool-geodesic-distance`, etc.).
  - `tests/geographyAtlasAndIndiaMaps.test.ts`: 17 automated tests verifying SoI catalog, state directory, 17 thematic datasets, geodesic math, Canvas2D rendering, hit testing, and serialization.
- **Verification Gate**: 23/23 test files passing (325/325 tests); zero TypeScript errors; clean production build.

---

### Stage 4: Interactive Topographical Map Viewer (COMPLETE)
- **Objective**: Build a dedicated topographical map viewer based on Survey of India educational map series (Sheet 45 D/7 Mount Abu & Sirohi, Sheet 45 D/10 Palanpur, Sheet 53 E/4 Shiwaliks), conventional signs & symbols learning panel, National Topographical Grid reference demonstrations (4-figure & 6-figure GR), scale and measurement laboratory, and seamless whiteboard integration.
- **Deliverables**:
  - `src/renderer/services/geography/topoService.ts`: Survey of India toposheet catalog (45 D/7, 45 D/10, 53 E/4), verified landmarks, mathematical Easting/Northing grid calculations, 4-figure and 6-figure GR generator/parser, grid <-> geo Lat/Long DMS coordinate transformations, scale distance (RF 1:50,000, 2 cm = 1 km), whole-circle bearings, and area calculator (km² and hectares).
  - `src/renderer/services/geography/topoSymbols.ts`: Authentic Survey of India conventional signs & symbols catalog (>35 symbols across 10 categories: roads, railways, bridges, settlements, buildings, religious, water, relief, vegetation, boundaries) with colors, glyphs, definitions, and CBSE/ICSE exam tips.
  - `src/renderer/components/geography/TopographicalMapModal.tsx` & `.css`: Touchscreen interactive topographical viewer modal with pan, zoom, fullscreen, real-time coordinate HUD, symbol learning drawer, grid reference lab, distance/bearing measurement, area calculation, and one-click whiteboard insertion.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Topographical sheet renderer implementing 20m contours, 100m index contours, 1km x 1km National Grid, hypsometric relief wash, drainage, settlements, roads, conventional signs, scale bar, and marginal info.
  - `src/renderer/components/WhiteboardCanvas.tsx`: Floating toolbar `[📐 Toposheet]` button, double-click toposheet launcher, and modal rendering.
  - `src/renderer/services/subjectModules/geographyModule.ts`: Registered Stage 4 tools (`geo-tool-soi-toposheets`, `geo-tool-topo-grid-lab`, `geo-tool-topo-symbols`).
  - `tests/topographicalMapViewer.test.ts`: 15 comprehensive unit tests covering toposheets catalog, conventional signs, grid reference math, scale distance, area, Canvas2D rendering, hit testing, and serialization persistence.
- **Verification Gate**: 24/24 test files passing (340/340 tests); zero TypeScript errors; clean production build.

---

### Stage 5: Interactive Contour and Terrain Laboratory (COMPLETE)
- **Objective**: Build a comprehensive educational laboratory for understanding topographical maps, contour lines, slope archetypes, 3D terrain projection, dynamic cross-sectional profiler, and CBSE/ICSE practical geography exercises.
- **Deliverables**:
  - `src/renderer/services/geography/contourTerrainService.ts`: 12 Contour Concepts, 14 Slope & Landform mathematical models with analytic elevation functions, Marching Squares isoline extraction algorithm, dynamic cross-sectional profiler with cumulative ground distance, relief, slope %, line-of-sight intervisibility, vertical exaggeration, verified offline DEM datasets (SoI Sheet 45 D/7 Guru Shikhar & Mahabaleshwar Scarp), and 6 practice assessment modules.
  - `src/renderer/components/geography/ContourTerrainModal.tsx` & `.css`: Touchscreen interactive modal with linked 2D contour map (pan, inspect coords/elev/slope, drag section line A -> B), 3D projected terrain block (mouse/touch orbit yaw/pitch, zoom, 3D contour lines, section cutting plane), live cross-sectional profile chart, concepts directory, 14 landform browser, parametric generator, and quiz engine.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Enhanced `geoTopoProfile` rendering with `renderCrossSectionProfileChart` and `renderContourTerrainLabShape` in pure Canvas2D.
  - `src/renderer/components/WhiteboardCanvas.tsx`: Added `[🏔️ Contour Lab]` button to floating geography toolbar, double-click launch on profile shapes, and modal mounting.
  - `src/renderer/components/SubjectToolsModal.tsx`: Added `'contourTerrainLab'` modal launcher and registered tools (`geo-tool-topo-contours`, `geo-tool-slope-analyzer`, `geo-tool-cross-section-profiler`).
  - `tests/contourAndTerrainLab.test.ts`: 19 automated unit tests verifying concepts, landforms, DEM datasets, Marching Squares isolines, cross-section sampling, intervisibility, exercises, and Canvas2D rendering.
- **Verification Gate**: 25/25 test files passing (359/359 tests); zero TypeScript errors; clean production build.

---

### Stage 6: Interactive 3D Earth and Globe Laboratory (COMPLETE)
- **Objective**: Implement a complete interactive 3D globe for Geography teaching with Windows desktop optimization, 100% offline stability, zero external tile/imagery downloads, camera rotation/pan/zoom, flat-map unrolling, solar terminator, planetary motions, and whiteboard insertion (`geoGlobe`).
- **Deliverables**:
  - `src/renderer/services/geography/globeService.ts`: Spherical orthographic 3D projection and inverse transformation; astronomical Fourier/Cooper solar declination model; instantaneous subsolar point calculation; great-circle solar terminator generator; daylight zenith angle tester; 24-hr Midnight Sun and Polar Night illumination status; local solar time and timezone calculator ($15^\circ = 1\text{ hr}$, IST $82.5^\circ\text{ E} = \text{UTC}+05:30$); 6 CBSE/ICSE Earth science demonstration presets (Summer/Winter Solstices, Vernal/Autumnal Equinoxes, Diurnal Rotation, Time Zones); 48 cataloged geographic landmarks with fuzzy search.
  - `src/renderer/components/geography/Globe3DModal.tsx` & `.css`: Touchscreen interactive modal with 3D orbit rotation, wheel zoom ($0.6\times \dots 3.0\times$), camera reset (India center), 3D globe vs 2D flat-map switcher, live animation loop ($1\times, 5\times, 20\times$), UTC hour slider ($0..24$), Day of Year slider ($1..365$), and 4-tab sidebar (Demos, Layers, Searchable Landmarks, View settings).
  - `src/renderer/engine/geographyShapeRenderer.ts`: Pure Canvas2D `geoGlobe` renderer with starfield, Rayleigh atmospheric blue glow, axial tilt rod ($23.44^\circ$), graticule ($30^\circ$), Equator, Tropics ($\pm 23.44^\circ$), Polar Circles ($\pm 66.56^\circ$), Prime Meridian, continent polygons, authentic Survey of India boundaries, night shadow gradient, night city lights, and landmark pins.
  - `src/renderer/components/WhiteboardCanvas.tsx`: Floating toolbar `[🌐 3D Globe]` launcher button, double-click launch on `geoGlobe` shapes, and modal rendering.
  - `src/renderer/components/SubjectToolsModal.tsx`: Registered `globe3DModal` in submodal states and wired launcher to `geo-tool-3d-globe`.
  - `src/renderer/components/geography/GeographyResourceCentreModal.tsx`: Added `[🌐 3D Earth & Globe Lab]` quick button in header and inspector action.
  - `tests/earthGlobeLaboratory.test.ts`: 22 automated unit tests covering planetary constants, orthographic projection math, solar declination, terminator Great Circle, polar day/night, local solar time, presets, landmarks, Canvas2D rendering, hit testing, and `.sbl` serialization persistence.
- **Verification Gate**: 26/26 test files passing (381/381 tests); zero TypeScript errors; clean production build.

---

### Stage 7: GIS, Satellite Imagery & Thematic Map Laboratory (COMPLETE)
- **Objective**: Build an educational GIS-style map viewer with layer management, spatial inspection, dual-map swipe comparison, verified data providers (ISRO/NRSC Bhuvan, Survey of India, NASA, USGS, GEBCO), and whiteboard integration.
- **Deliverables**:
  - `src/renderer/services/geography/gisService.ts`: Technology evaluation (OpenLayers vs MapLibre GL JS vs architecture fit); 15 verified thematic layers catalog (Satellite, Elevation, LULC, Forest, Soil, Geomorphology, Drainage, Rivers, Wetlands, Water Bodies, Flood Hazards, Erosion, Urban Sprawl, Agriculture, Transport); Web Mercator (EPSG:3857) & DMS coordinate projection; Layer management (add, remove, toggle, opacity, stack z-ordering); Geographic attribute inspection engine (Elevation, LULC, Soil order, Drainage basin, Flood risk, State/district); Dual-map comparison engine with 5 educational comparison presets.
  - `src/renderer/components/geography/GisThematicModal.tsx` & `.css`: Touchscreen interactive GIS modal with 4 tabs (Layer Management, Dual-Map Comparison, Location Inspector, Dynamic Legend & Metadata), interactive draggable swipe divider ($0\% \dots 100\%$), real-time coordinate HUD, pan, zoom ($0.6\times \dots 6.0\times$), reset, and one-click whiteboard insertion.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Pure Canvas2D `gis-viewer` renderer supporting multi-layer compositing, swipe line clipping, target pinpoint marker with callout box, and Survey of India legal attribution.
  - `src/renderer/components/WhiteboardCanvas.tsx`: Added `[🛰️ GIS Lab]` floating toolbar button, double-click launch on GIS shapes, and modal mounting.
  - `src/renderer/components/SubjectToolsModal.tsx`: Added `'gisThematicLab'` submodal launcher and registered `geo-tool-gis-lab`.
  - `src/renderer/components/geography/GeographyResourceCentreModal.tsx`: Added `[🛰️ GIS Thematic Lab]` quick button in header.
  - `tests/gisThematicLaboratory.test.ts`: 19 automated unit tests verifying layers catalog, Web Mercator math, layer filtering and stack ordering, spatial attribute inspection, comparison presets, Canvas2D rendering, hit testing, and `.sbl` serialization persistence.
- **Verification Gate**: 27/27 test files passing (400/400 tests); zero TypeScript errors; clean production build.

---

### Stage 8: Weather and Climate Teaching Laboratory (COMPLETE)
- **Objective**: Implement an interactive weather and climate teaching module integrating India Meteorological Department (IMD) Mausam products, 30-year climatological normals, 8 CBSE/ICSE weather instruments, 10 atmospheric physics simulations, and 35+ station directory with whiteboard integration.
- **Deliverables**:
  - `src/renderer/services/geography/weatherClimateService.ts`: IMD Mausam products catalog (10 products with validity period and stale data enforcement); 30-year climatological normals (1981–2010); Köppen climate classification for India (`Amw`, `As`, `Aw`, `BShw`, `BWhw`, `Cwg`, `Dfc`, `E`); 8 weather instruments with physics models (Six's thermometer, Fortin/aneroid barometer, Symons rain gauge, wet/dry bulb psychrometer, Robinson anemometer, wind vane, Campbell-Stokes sunshine recorder, Stevenson screen); atmospheric physics equations (Magnus-Tetens vapor pressure, psychrometric equation for RH% and Dew Point, hypsometric barometric lapse with altitude, Beaufort wind scale, 16-point cardinal compass); 10 interactive atmospheric physics concepts; 35+ station directory with real normals.
  - `src/renderer/components/geography/WeatherClimateModal.tsx` & `.css`: Touchscreen modal with 5 tabs (Weather Maps, Climatology, Instruments, Physics Concepts, Station Directory), interactive physics sliders, concept step player, and one-click whiteboard insertion.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Pure Canvas2D `climate-chart` renderer supporting synoptic isohyet/isotherm gradients, NLM isochrones, cyclone tracking cone of uncertainty, radar rings, and realistic instrument visualization; hit-testing for climate stations.
  - `src/renderer/components/WhiteboardCanvas.tsx`: Added `[🌦️ Weather Lab]` floating toolbar button and modal rendering.
  - `src/renderer/components/SubjectToolsModal.tsx`: Added `'weatherClimateLab'` submodal launcher and registered `geo-tool-weather-climate-lab` & `geo-tool-monsoon-climate`.
  - `src/renderer/components/geography/GeographyResourceCentreModal.tsx`: Added `[🌦️ Weather & Climate Lab]` quick button in header.
  - `tests/weatherAndClimateLab.test.ts`: 21 automated unit tests verifying IMD products, freshness enforcement, climatology, 8 instruments, mathematical models, 10 concepts, 35 stations, Canvas2D rendering, hit testing, and `.sbl` serialization persistence.
- **Verification Gate**: 28/28 test files passing (421/421 tests); zero TypeScript errors; clean production build.

---

### Stage 9: Physical Geography Interactive Laboratory (COMPLETE)
- **Objective**: Implement comprehensive interactive geomorphology, plate tectonics, earthquakes, volcanoes, weathering & erosion, hydrology, and oceanography visualisations with 3D axonometric elevation models, stratigraphic cross-sections, parameter sliders, educational geodynamic simulation disclaimers, and whiteboard integration.
- **Deliverables**:
  - `src/renderer/services/geography/physicalGeographyService.ts`: 15 verified landforms with analytical 3D elevation functions $Z(nx, ny)$ and stratigraphic layers; 11 major and minor tectonic plates with motion vectors; 6 boundary geodynamic models (divergent oceanic, continental rifting, continental collision Himalayas, subduction Andes, Mariana arc, San Andreas transform); Fault mechanics (Normal, Reverse/Thrust, Strike-Slip); 4 seismic waves with propagation media and velocities; Hanks-Kanamori Moment Magnitude equation ($M_w = \frac{2}{3}\log_{10}M_0 - 10.7$) with seismic energy and TNT equivalent; 5 volcano types with VEI index 0-8 and magma composition; 5 weathering mechanisms (mechanical, chemical karst/oxidation, biological); 6 drainage patterns with Indian river examples; 6 ocean floor bathymetric zones conforming to the hypsographic curve.
  - `src/renderer/components/geography/PhysicalGeographyModal.tsx` & `.css`: Touchscreen interactive modal with 7 tabs (Landforms, Tectonics, Earthquakes, Volcanoes, Weathering, Hydrology, Oceanography), 3 view modes (3D Block Model, Stratigraphic Cross-Section, Schematic Diagram), animation controls (Play/Pause, Step, Reset View), interactive parameter sliders (fault slip, rupture area, plate velocity, VEI, river gradient, tidal amplitude), and one-click whiteboard insertion.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Pure Canvas2D `physical-geo-lab` vector renderer supporting 3D axonometric isometric projection, stratigraphic cross-sections, boundary dynamics, fault plane with seismic wave circles, volcano magma chambers and conduits, drainage patterns, and bathymetric ocean profiles; hit-testing for physical geography landforms.
  - `src/renderer/components/WhiteboardCanvas.tsx`: Added `[🏔️ Physical Geo Lab]` floating toolbar button and modal mounting.
  - `src/renderer/components/SubjectToolsModal.tsx`: Added `'physicalGeoLab'` submodal launcher and registered `geo-tool-physical-geo-lab`.
  - `src/renderer/components/geography/GeographyResourceCentreModal.tsx`: Added `[🏔️ Physical Geo Lab]` quick button in header.
  - `tests/physicalGeographyLab.test.ts`: 18 automated unit tests verifying 15 landforms, elevation math, plate tectonics, fault models, seismic wave velocities, Moment magnitude equation, volcano types, weathering processes, drainage patterns, ocean floor zones, Canvas2D rendering, hit testing, and `.sbl` serialization persistence.
- **Verification Gate**: 29/29 test files passing (439/439 tests); zero TypeScript errors; clean production build.

---

### Stage 10: Human and Economic Geography Laboratory (COMPLETE)
- **Objective**: Implement interactive human and economic geography resources covering population geography (Census of India 2011, density, growth, structure), age-sex population pyramids, agriculture (major crops, seasons, soils, irrigation), minerals & energy resources (coal Gondwana/Tertiary, petroleum/gas, iron ore, clean energy), industrial regions, transport networks (Golden Quadrilateral, 12 major ports, NW-1/NW-2), and statistical thematic charts (110-year decadal growth series, land use, energy generation mix) with whiteboard integration.
- **Deliverables**:
  - `src/renderer/services/geography/humanEconomicGeographyService.ts`: Comprehensive datasets with explicit reference year standards: Census of India 2011 state/UT demographics; 3 age-sex demographic pyramids (India 2011 demographic dividend, triangular expanding stage, stationary aging stage) with 17 age cohorts; 6 verified major crops (Rice, Wheat, Cotton, Sugarcane, Tea, Coffee) with agro-climatic requirements, seasons, and producing states; 4 mineral & energy categories with mine/deposit coordinates and operating agencies (Coal India, ONGC, NMDC, NPCIL, SECI); 5 major industrial regions with principal industries, major centres, and locational factors; Transport networks with Golden Quadrilateral (5,846 km routes and nodes), 12 Major Commercial Seaports, and National Waterways (NW-1 & NW-2); Thematic historical series: 110-year decadal population growth (1901–2011 with the 1921 Year of Great Divide), MoA&FW Land Use Classification, and CEA Electricity Generation Capacity Mix.
  - `src/renderer/components/geography/HumanEconomicModal.tsx` & `.css`: Touch-friendly 6-tab modal (Population, Agriculture, Minerals & Energy, Industry, Transport & Trade, Thematic Charts), 4 view modes (Map, Chart, Pyramid, Details), interactive canvas preview with pan/zoom, classified legend ramps, and whiteboard insertion.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Pure Canvas2D `human-economic-geo` vector renderer supporting choropleth state maps with classified color breaks, age-sex population pyramids, crop distribution clusters, mineral deposits, industrial regions, Golden Quadrilateral highway vectors, ports, and thematic charts (line, donut, horizontal bar); hit-testing for human and economic geography features.
  - `src/renderer/components/WhiteboardCanvas.tsx`: Added `[👥 Human & Economic Geo]` floating toolbar button and modal rendering.
  - `src/renderer/components/SubjectToolsModal.tsx`: Added `'humanEconomicLab'` submodal launcher and registered `geo-tool-human-economic-lab`.
  - `src/renderer/components/geography/GeographyResourceCentreModal.tsx`: Added `[👥 Human & Economic Geo]` quick launcher button in header.
  - `tests/humanEconomicGeography.test.ts`: 16 automated unit tests verifying Census 2011 state demographics, age-sex pyramids, major crops, mineral/energy deposits, industrial regions, transport networks, thematic charts, Canvas2D rendering, hit testing, and `.sbl` serialization persistence.
- **Verification Gate**: 30/30 test files passing (455/455 tests); zero TypeScript errors; clean production build.

---

### Refinement & Quality Gate: High-Fidelity Maps, Globe Continents & Offline Asset Manager (COMPLETE)
- **Objective**: Fix low-poly India map, dark geometric artifacts, and blank ocean globe rendering identified in user visual feedback; embed authentic Survey of India sovereign boundary coordinates (>80 vertices), 26 detailed administrative state polygons, major river vectors, high-fidelity world continents, and a dedicated offline map caching and download subsystem.
- **Deliverables**:
  - `src/renderer/services/geography/detailedMapData.ts`: High-density Survey of India boundary coordinates (`SOI_INDIA_BOUNDARY_LONLAT` and `DETAILED_INDIA_BOUNDARY_NORMALIZED`) covering Siachen, Ladakh, J&K, Arunachal Pradesh, Rann of Kutch, Sir Creek, Konkan, Malabar, and Coromandel; 26 detailed administrative states and UT polygons with capitals and theme colors (`DETAILED_INDIAN_STATES`); 10 major Indian river paths (`MAJOR_INDIAN_RIVERS`); 13 global landmass and island polygons (`DETAILED_WORLD_LANDMASSES`).
  - `src/renderer/services/geography/offlineMapService.ts`: Dedicated offline asset manager tracking 8 essential Survey of India and World Atlas map packages with storage quota calculations, single-map download, batch "Download All Essential Maps" capability, and localStorage persistence.
  - `src/renderer/components/geography/Globe3DModal.tsx`: Renders high-fidelity continental landmasses in both 3D spherical orthographic view and 2D unrolled flat-map view using spherical vertex interpolation and horizon clamping, with Survey of India boundary highlighted in gold/amber.
  - `src/renderer/engine/geographyShapeRenderer.ts`: Replaced crude 38-point polygon with high-density Survey of India boundary; added `renderIndianStatesAndAdministrative` with pastel tints, state labels, and capitals; added `renderMajorIndianRivers`; upgraded `renderWorldBase` and `render3DGlobeShape` to use `DETAILED_WORLD_LANDMASSES`.
  - `src/renderer/components/geography/GeographyAtlasModal.tsx`, `GeographyResourceCentreModal.tsx`, `TopographicalMapModal.tsx`: Added offline status badges, "Download for Offline Use" actions, batch "Download All Essential Maps" header launcher, and high-res "Export Map (PNG)" feature for classroom presentation.
  - `tests/highFidelityMapsAndOfflineService.test.ts`: 13 automated unit tests verifying Survey of India boundary accuracy, state coverage, river vectors, globe projection, offline download simulation, batch caching, and Canvas2D rendering.
- **Verification Gate**: 31/31 test files passing (468/468 tests); zero TypeScript errors; clean production build.

---

### Stage 11: Geography Activities, Practice, Offline Packaging & Performance Optimization (NEXT)
- **Objective**: Geography classroom activities, map pointing exercises, interactive quizzes, offline packaging validation (`npm run dist`), and end-to-end performance optimization.
