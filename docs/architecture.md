# SmartBoard Studio — Architecture & Technical Decisions

## 1. System Overview & Mission
SmartBoard Studio is a professional, high-performance Windows teaching application designed for smartboards, interactive whiteboards, and digital drawing tablets (such as Wacom One and XP-Pen Deco Mini 7). It delivers immediate, lag-free stylus ink, an intuitive classroom UI, and reliable document management.

---

## 2. Technology Selection & Rationale

### Framework Evaluation
| Framework | Strengths | Trade-offs | Verdict |
| :--- | :--- | :--- | :--- |
| **Electron 34 + React 19 + TypeScript + Vite** | • Mature Windows pointer/stylus integration (`WM_POINTER` -> W3C Pointer Events).<br>• Advanced canvas/WebGL/WebGPU acceleration.<br>• Mature multi-window transparent overlays for desktop annotation.<br>• Rich ecosystem for PDF rendering (PDF.js), math rendering, and media. | • Larger binary footprint (~80–110 MB unpacked). | **Selected Primary Architecture** |
| **Tauri (v2)** | • Smaller application size (~15 MB).<br>• Lower baseline RAM usage. | • WebView2 stylus event latency and multi-window transparent overlay on Windows have known edge-case driver quirks.<br>• Limited plugin maturity for complex educational toolkits. | Evaluated as secondary alternative |
| **Native C++ / WinUI 3** | • Direct DirectX 12 / DirectComposition low-level control. | • Significantly slower velocity for rich interactive UI and multi-subject tooling. | Reserved if hybrid bottlenecks occur |

### Decision Summary
Electron 34 with React 19 and Vite provides the ideal balance of hardware-accelerated graphics capabilities, rapid feature development for multi-subject classrooms, rock-solid Windows installer generation (`electron-builder` NSIS), and sub-8ms ink latency via optimized Canvas2D rendering.

---

## 3. High-Performance Stylus Pipeline

### 3.1 Eliminating React Overhead on the Hot Path
In standard React applications, routing high-frequency pointer events (`pointermove` at 120Hz–240Hz) through component state triggers continuous layout recalculations and garbage collection pauses. SmartBoard Studio isolates drawing from React:
- **Direct Event Listeners**: Pointer events are captured directly on the HTML5 `<canvas>` element via native DOM event listeners.
- **`requestAnimationFrame` Batching**: Mouse/stylus positions are buffered in memory and rendered using `requestAnimationFrame`, synchronizing with the display's refresh rate (60Hz or 120Hz).
- **Pointer Coalescing**: When the OS or tablet driver generates multiple events per frame, `event.getCoalescedEvents()` extracts all intermediate hardware samples to prevent jagged lines during fast handwriting.
- **React Decoupling**: React only updates upon `pointerup` (stroke completion) when committing the finished stroke to the centralized document store and undo/redo stack.

### 3.2 Three-Layer Canvas Stack
To maintain 120 FPS even when a lesson contains hundreds of shapes, formulas, and text elements, the rendering viewport utilizes three distinct stacked canvases:
1. **Background Layer (`bgCanvas`)**:
   - Renders page background (blank, ruling lines, math grids, isometric grids, music staves).
   - Only redrawn when page settings, color, or zoom level change.
2. **Committed Objects Layer (`committedCanvas`)**:
   - Renders all finalized strokes, geometric shapes, imported images, and annotations.
   - Rendered once; updated only when objects are added, removed, or edited.
3. **Active In-Progress Stroke Layer (`activeCanvas`)**:
   - Dedicated exclusively to the single in-flight stroke currently being drawn by the teacher's stylus.
   - Cleared and redrawn in <1ms per frame using sub-pixel Catmull-Rom spline smoothing.

---

## 4. State Management & Command Architecture

### 4.1 Reversible Operations (Command Pattern)
All mutations to the canvas (adding a stroke, erasing, moving an object, creating a page) implement the `Command` interface:
```typescript
export interface Command {
  id: string;
  description: string;
  execute(): void;
  undo(): void;
}
```
The `CommandSystem` maintains a bounded history stack (up to 200 operations) with full undo and redo capabilities, emitting state changes to toolbar indicators.

### 4.2 Document Store & Lesson Serialization
The active lesson is represented by an immutable state tree (`LessonDocument`):
- Metadata (title, creation timestamp, author, tags).
- Pages array (background configurations, object hierarchies, thumbnails).
- Serialization produces standard JSON files (`.sbl` format) containing complete vectorized stroke geometry and styles.

---

## 5. Security & IPC Architecture

### 5.1 Defense in Depth
SmartBoard Studio enforces strict security boundaries:
- `nodeIntegration: false`: Renderer has zero access to Node.js APIs or `require`.
- `contextIsolation: true`: Renderer and preload scripts run in separate JavaScript execution contexts.
- `sandbox: false`: Allows controlled, audited Node bridge in preload.
- `webSecurity: true`: Cross-origin restrictions enforced.
- Navigation Lockdown: `will-navigate` blocks navigation to external or arbitrary URLs. External links open strictly in the user's default OS browser.

### 5.2 Preload API Bridge
All main-process capabilities are exposed to the renderer through `window.smartboard`:
```typescript
window.smartboard = {
  window: { minimize, maximize, close, isMaximized },
  settings: { get, set, getAll },
  file: { readText, readBinary, writeText, delete, exists, listDir, openDialog, saveDialog, openInExplorer },
  paths: { autosave, lessons, resources },
  db: { getRecentLessons, upsertLesson },
  onMenuAction: (callback) => unsubscribe,
};
```

---

## 6. Persistence & Storage Architecture
To guarantee 100% portability without external C++ compilation dependencies (like MSVC / node-gyp), the application uses an atomic JSON database service:
- Synchronous memory cache for microsecond reads.
- Atomic disk writes (`fs.writeFileSync` to `.tmp` + `fs.renameSync`) to ensure document safety even during power failure or unexpected process termination.
- Schema versioning support for seamless updates.

---

## 7. Verification & Automated Quality Gates
- **Renderer Type Checking**: `npm run typecheck` (`tsc --noEmit`).
- **Main Process Type Checking**: `npm run typecheck:main` (`tsc -p tsconfig.main.json --noEmit`).
- **Unit Testing**: Vitest suite covering Document Reducer, Command Pattern undo/redo, and Database persistence.
- **Production Bundling**: Vite ES2022 bundle + TypeScript compilation.
- **Windows Packaging**: `electron-builder` producing both portable/unpacked binaries and standard NSIS `.exe` installers.
