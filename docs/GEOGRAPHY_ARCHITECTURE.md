# Geography Teaching Module — System Architecture & Integration Specification

**Module Version:** 0.2.0-stage2  
**Status:** Stage 2 Complete (Interactive Geography Objects Architecture & Vector Engine Established)  
**Target Environment:** Windows 10/11 x64, Electron 34, React 19, TypeScript 5.8, Canvas2D / WebGL  
**Authoritative Reference Standard:** Survey of India (Government of India) for Indian Cartography  

---

## 1. Executive Summary & Purpose

The Geography Teaching Module provides a professional, interactive, and pedagogically authentic geospatial curriculum toolkit embedded natively within SmartBoard Studio. It enables educators to teach physical, political, thematic, physical topography, and climatological geography directly on interactive classroom smartboards and digitizer tablets.

In accordance with project development rules:
1. **Zero Greenfield Redundancy**: It builds directly on SmartBoard Studio's existing Electron 34, React 19, TypeScript 5.8, three-layer canvas pipeline, and `LessonDocument` persistence system.
2. **Authoritative Cartographic Standards**: For Indian territory, it strictly mandates compliance with the official Survey of India administrative boundaries (including Ladakh, Jammu & Kashmir, and island territories).
3. **Optimized for Classroom Hardware**: It prioritizes offline readiness, low-latency stylus annotation, touch-friendly UI, and low-end hardware compatibility (Intel HD Graphics, 4–8 GB RAM).

---

## 2. SmartBoard Studio Repository Audit & Existing Architecture

### 2.1 Framework & Core Subsystems
- **Host Framework**: Electron 34.5.2 with `contextIsolation: true`, `nodeIntegration: false`, and sandboxed preload IPC.
- **Renderer Engine**: React 19.1.0 running under Vite 6.3.3 and TypeScript 5.8.3.
- **Stylus Pipeline**: Windows Pointer Events API (`enable-features=PointerEvents,TouchEvents,DirectManipulationStylus`) with sub-pixel Catmull-Rom smoothing and zero React re-render overhead during drawing.
- **Three-Layer Viewport Stack**:
  1. `bgCanvas`: Page background, grids, ruling lines, or base cartographic underlays.
  2. `committedCanvas`: Finalized vectorized drawing objects, shapes, text, formulas, and diagrams.
  3. `activeCanvas`: Real-time in-flight stylus stroke rendered at 120 FPS.
- **Document Model**: Immutable `LessonDocument` containing `meta: LessonMeta` and `pages: Page[]`. Each page contains `layers: Layer[]` and `objects: CanvasObject[]`.
- **Canvas Object Model**: Tagged union `CanvasObject = StrokeObject | ShapeObject | TextObject | ImageObject | GroupObject`.
- **Extensible Shape Engine**: `ShapeObject` supports `shapeType: ShapeType` and a flexible `params: Record<string, any>` dictionary. Rendering is delegated to `subjectShapeRenderer.ts` via Canvas2D.
- **Undo / Redo Architecture**: `CommandSystem.ts` maintains a bounded 200-step stack implementing the Command pattern (`execute()` and `undo()`).
- **Persistence System**: Documents save to `.sbl` JSON format atomically (`fs.writeFileSync` to `.tmp` followed by `fs.renameSync`).
- **Export Pipeline**: `documentExportService.ts` exports to vector PDF (via `jspdf`), high-res PNG/JPEG (at 1x or 2x 300 DPI), SVG, and JSON.
- **Resource Library**: `resourceLibraryService.ts` organizes categorized educational assets, collections, and lesson templates.
- **Testing & Verification**: 20 Vitest suites with 290 automated unit tests (`npm test`) and dual TypeScript typecheckers (`npm run typecheck` and `npm run typecheck:main`).

---

## 3. Integration Points for the Geography Module

### 3.1 Subject Registry Integration
Geography integrates as a first-class subject module alongside Mathematics, Physics, Chemistry, Computer Science, Digital Logic, and General Teaching:
1. **Type Definition**: Extend `SubjectId` union in `src/renderer/services/subjectRegistry/types.ts`:
   ```typescript
   export type SubjectId =
     | 'commonResources'
     | 'mathematics'
     | 'physics'
     | 'chemistry'
     | 'computerScience'
     | 'digitalLogic'
     | 'geography'          // <-- Registered first-class subject
     | 'flowcharts'
     | 'generalTeaching';
   ```
2. **Module Declaration**: Implement `GeographyModule: SubjectModule` inside `src/renderer/services/subjectModules/geographyModule.ts`:
   - `id: 'geography'`
   - `name: 'Geography'`
   - `icon: '🌍'`
   - `description: 'Physical, political, thematic maps, 3D globe, topographic contours, and climate simulators'`
   - `tools: SubjectTool[]`
   - `templates: SubjectTemplate[]`
3. **Module Registration**: Register `GeographyModule` inside `initializeSubjectModules()` in `src/renderer/services/subjectModules/index.ts`.
4. **Subject Platform Modal**: `SubjectToolsModal.tsx` automatically renders the "🌍 Geography" tab dynamically through `SubjectRegistry.getAllModules()`.

### 3.2 Whiteboard Shape & Object Model Integration
Every geographic resource inserted onto the whiteboard must be an authentic, persistent canvas object:
1. **Shape Types**:
   Extend `ShapeType` in `src/shared/types.ts` with dedicated geographic shapes:
   ```typescript
   export type ShapeType =
     // ... existing shapes ...
     | 'geoMap'              // 2D Interactive Vector Map (World, India, Continents, Regions)
     | 'geoGlobe'            // 3D Interactive Orthographic/Spherical Globe
     | 'geoTopoProfile'      // Topographic Contour Map & Cross-Section Elevation Profile
     | 'geoCoordinateGrid'   // Graticule, Lat/Long coordinate reference with Solar Terminator
     | 'geoThematicLayer';   // Thematic overlay (Climate, Rainfall, Biomes, Ocean Currents)
   ```
2. **Parameters Schema (`params: Record<string, any>`)**:
   - `mapType`: `'india_political' | 'india_physical' | 'world_political' | 'world_physical' | 'continent' | 'region'`
   - `projection`: `'equirectangular' | 'mercator' | 'robinson' | 'orthographic' | 'albers_india'`
   - `center`: `[longitude, latitude]`
   - `zoom`: number
   - `layers`: string[] (e.g. `['boundaries', 'states', 'capitals', 'rivers', 'relief', 'graticule']`)
   - `selectedFeatureId`: string | null
   - `elevationProfile`: `{ pathPoints: [number, number][]; elevationSamples: number[] }`
   - `solarTerminator`: `{ date: string; declination: number }`
3. **Renderer Pipeline**:
   `isSubjectShape()` in `src/renderer/engine/subjectShapeRenderer.ts` registers geographic shape types and dispatches them to specialized rendering functions in `src/renderer/engine/geographyShapeRenderer.ts` using native Canvas2D paths.

### 3.3 Interactive Dual-Mode Architecture (On-Board + Modal Designer)
Following the pattern established for CS diagrams, digital circuits, and mindmaps:
1. **In-Modal Design & Deep Analysis**:
   Dedicated modal dialogs (e.g. `MapViewerModal.tsx`, `Globe3DModal.tsx`, `TopoProfileModal.tsx`, `ClimateSimulatorModal.tsx`) allow teachers to configure layers, select projections, query metadata, measure distances, and preview themes before insertion.
2. **On-Board Live Classroom Teaching**:
   When a geographic shape is selected on the canvas:
   - A quick floating action toolbar provides one-click live toggles (layer visibility, theme styling, coordinate readout, zoom stepper, daytime/nighttime terminator toggle, measure tool).
   - Direct canvas interaction: clicking a state or country selects and highlights the entity with an on-board label pill.
   - Double-clicking opens the full configuration modal with seamless two-way state synchronization.

---

## 4. Geospatial Technology Evaluation & Strategy

To guarantee performance on classroom computers (often running Intel integrated graphics with 4–8 GB RAM) and maintain sub-8ms whiteboard pen latency, we evaluated multiple mapping architectures:

| Technology | Architectural Evaluation | Classroom Hardware Suitability | Verdict |
| :--- | :--- | :--- | :--- |
| **CesiumJS** | Full-fledged 3D GIS virtual globe. Requires heavy WebGL2, multi-megabyte runtime (>15 MB bundle), high VRAM usage, and continuous online streaming. | Unsuitable for low-end offline classroom smartboards; high crash risk on older Intel GPUs. | **Rejected** |
| **MapLibre GL JS** | High-performance vector tile map engine. Excellent for 60 FPS mobile panning, but requires dedicated WebGL context and vector tile pipeline. | Requires vector tile servers or heavy local MBTiles packaging; risk of GPU context loss when multiple canvas layers exist. | **Reserved for optional high-density tiling** |
| **OpenLayers** | Mature, highly capable GIS library. Large API surface and complex bundle (~1.8 MB). | Moderate. Good projection support, but heavy DOM integration. | **Evaluated as non-minimal** |
| **Three.js** | Lightweight 3D WebGL library (~600 KB). Excellent for rendering a textured 3D celestial globe with orbit controls, bump maps, and day/night illumination. | Smooth 60 FPS on modest GPUs; clean WebGL context isolation; graceful canvas fallback. | **Recommended for 3D Globe View** |
| **Pure Canvas2D + Mathematical Projections (D3-Geo Algorithms)** | Direct vector rendering to HTML5 Canvas2D (`ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`) using topological/GeoJSON boundaries. Zero external server requirement, sub-100 KB footprint, 100% offline. | **Flawless**: Zero GPU context contention with whiteboard ink, instant PDF/PNG export parity, sub-5ms redraws. | **Selected Core 2D Architecture** |

### Recommended Technology Stack:
1. **2D Interactive Vector Engine**:
   - High-precision Canvas2D vector projection pipeline.
   - Pre-simplified, topological GeoJSON datasets (e.g. Natural Earth 1:110m and 1:50m for world; official Survey of India boundary for India).
   - Standard cartographic projection algorithms: Equirectangular, Mercator, Robinson, Orthographic, and India-standard Albers Equal Area.
2. **3D Interactive Globe**:
   - Hybrid architecture: Three.js for hardware-accelerated 3D sphere orbit with bump/bathymetry shaders, with an ultra-light Canvas2D orthographic projection fallback for hardware lacking WebGL capabilities.
3. **Topography & Elevation Profiles**:
   - 2D Canvas Marching Squares algorithm for contour lines.
   - 1D spline interpolation for elevation cross-section graph profiles.
4. **Offline Tile & Raster Basemaps**:
   - Local asset bundling for classroom starter packages.
   - Pre-rendered raster relief tiles and satellite mosaics cached locally in the app data directory.

---

## 5. Cartographic Integrity & Legal Mandates

### 5.1 The Survey of India Requirement (Critical Mandate)
- Under the National Geospatial Policy and official guidelines issued by the Government of India, all maps depicting the political boundaries of India must strictly adhere to the authoritative delineation provided by the **Survey of India (SoI)**.
- **Zero Tolerance Policy**:
  - The international border and external boundary of India must accurately include the Union Territory of Jammu & Kashmir and the Union Territory of Ladakh in their entirety, as well as Arunachal Pradesh, the Andaman & Nicobar Islands, and Lakshadweep.
  - Never utilize unverified, third-party, or AI-generated boundaries that depict disputed or altered borders for India.
  - All Indian maps must bear the clear attribution: *"Based upon Survey of India map with the permission of the Surveyor General of India."*

---

## 6. Security, Memory & Offline Design Principles

1. **Strict Context Isolation**:
   No native Node.js filesystem access from within map renderers. All local map data is read via secure `smartboard.file` preload IPC or bundled in verified read-only asset manifests.
2. **Data Budgeting & Low Footprint**:
   - Vector GeoJSON boundaries are topological and compressed (simplification tolerance optimized for classroom display: ~500 KB to 2 MB total bundle).
   - High-density datasets (e.g. 30m digital elevation) are downsampled or accessed as pre-tiled local caches to avoid memory leaks.
3. **No External Network Dependency on the Hot Path**:
   All core maps, national boundaries, and teaching tools must function 100% offline in remote or network-restricted classrooms.
4. **Deterministic Document Persistence**:
   A saved `.sbl` lesson file stores exact geographic state coordinates, zoom levels, and active annotations, ensuring full fidelity upon reload or across platforms.

