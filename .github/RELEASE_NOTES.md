## 🚀 SmartNoteAI v2.1.0 — Web AI Search, Multi-Tab Browser & Smart Slide Enhance

SmartNoteAI `v2.1.0` upgrades AI-assisted teaching, live web research, automated slide enhancement, geometric shape recognition, and vector diagram reliability across desktop and classroom smartboards.

---

### 🌟 What's New & Improved in v2.1.0

#### 1. 🔍 Web AI Search & Educational Image Discovery
* **Web Search Toggle in AI Chat**: Enable live web research directly from the AI Teaching Assistant chat panel (`Google Gemini` grounding / web image search).
* **Inline Web Image Thumbnails**: Topics requesting visual diagrams surface crisp web image results directly inside chat cards with URL links, drag-and-drop onto the whiteboard, **Insert**, and **Open in Browser** actions.
* **Direct First-Prompt Teaching Output**: Stripped redundant `"Welcome to SmartBoard"` preambles so teachers immediately receive structured educational explanations, formulas, and diagrams.

#### 2. 🌍 Built-in Browser Improvements (Multi-Tab & Region Capture)
* **Full Multi-Tab Support**: Open links cleanly in new tabs inside the integrated browser (`Open Link in New Tab`) instead of spawning external windows, complete with a visual tab bar, smart URL/domain/search-engine resolution, and clean tab switching/closing.
* **Interactive Capture Region to Board**: Select any rectangular area of a web page (across DPI scaling) and snap it directly onto the SmartBoard canvas as a clean image object.

#### 3. ✨ Automatic AI Slide & Individual Textbox Enhance + UI Improvements
* **AI-Driven Individual & Full-Slide Enhancement**: Uses the connected AI model with slide dimensions, background/theme colors, and existing element positions so enhanced content stays visually aligned without overlapping images or elements.
* **Smart Format Auto-Detection & Clean HTML**: Automatically picks LaTeX math, HTML/CSS, or Markdown modes; removes stray fixed CSS `font-size` rules so teachers retain full font-size control on-canvas; and converts leftover Markdown syntax (`**`, `*`, `--`, `#`, `` ` ``) cleanly when enhancing into HTML.
* **Ask AI Workflow & UI Polish**: Refined on-canvas formatting controls (`Ask AI`, `Enhance`, typography/spacing/contrast controls) and clean formula rendering without label clutter or edge cropping.

#### 4. 🤖 AI Chatbox & Gemini Quota Resilience Improvements
* **Accurate Model Selection & Discovery**: Fixes unexpected `gemini-4-argon` `limit: 0` quota failures by honoring user-selected models, filtering specialized/zero-quota preview models, ranking free-tier Flash models cleanly, falling back without web-search grounding if grounding triggers `429`/`403`, and clearing stale cached models when switching API keys/accounts.
* **Working Vector Flowcharts & Diagram Cards**: Fixed Mermaid `getBBox()` `0×0` layout collapse caused by global CSS error-suppression rules, enabled native SVG `<text>` labels (`htmlLabels: false`) and explicit `viewBox` dimensions for both chat preview and canvas insertion, serialized concurrent diagram renders, and fixed tall-flowchart scroll clipping.

#### 5. 🔷 Intelligent Shape Recognition & Chemistry Fixes
* **Accurate Quadrilateral & Triangle Recognition**: Dedicated geometric recognizer (`shapeRecognitionService`) fixes square/rectangle-vs-circle misclassification and handles rotated diamonds/rhombuses, parallelograms, trapezoids, unclosed corners, and right/equilateral triangles reliably.
* **Chemical Equation Balancer Fix**: Fixed KaTeX rendering and board insertion in `EquationBalancerModal` so multi-species chemical equations display cleanly without distortion.

---

### 📦 Download & Install
* Download **`SmartNoteAI.Setup.2.1.0.exe`** below and run it on Windows 10 / 11 (64-bit).
* Installer excludes development source datasets (`assets/MapsData/` raw PDFs) while bundling all compressed offline Survey of India maps, 36 state SVGs, toposheets, and globe textures inside `dist/`.

**Full Changelog**: https://github.com/sgr-m/SmartNoteAI/compare/v2.0.0...v2.1.0

