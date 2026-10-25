# Changelog

All notable changes to the **SmartNoteAI** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-10-25

### Initial Public Windows Release

#### Added
- **Digital Whiteboard Core**:
  - Low-latency HTML5 canvas drawing engine with high-FPS rendering.
  - Infinite / extended document canvas with smooth pan (`Space` + drag) and zoom.
  - Multi-page lesson slide management with drag-and-drop page ordering.
  - Custom whiteboard backgrounds: Blackboard Green, Classic Whiteboard, Blueprint Grid, Engineering Lined, and Coordinate Plane.

- **Hardware Stylus & Digitizer Integration**:
  - Full support for **XP-Pen Deco Mini 7**, **Wacom One / Intuos**, **Huion Inspiroy**, and Windows Ink digitizers via Chromium `DirectManipulationStylus`.
  - Dynamic pressure sensitivity supporting thin sketching to bold strokes.
  - Touch palm rejection ignoring accidental secondary touches while stylus is engaged.
  - Dual mouse and stylus coordination preventing pointer lock conflicts or dropped strokes.

- **Desktop Annotation & Area Snip**:
  - Live desktop mode allowing annotation over active Windows applications (VS Code, PowerPoint, web browsers, media players).
  - Area screen-snip tool capturing rectangular desktop regions directly onto the active whiteboard.
  - Floating desktop navigation widget with instant single-click return to full whiteboard view.

- **Geometric Shape Recognition**:
  - Real-time recognition and snapping for hand-drawn straight lines, triangles, polygons, circles, ellipses, and rectangles.
  - Full styling control over stroke width, line color, opacity, and shape fill.

- **Mathematical Typography (LaTeX / KaTeX)**:
  - Built-in LaTeX equation editor with real-time rendering.
  - Bundled local KaTeX vector font glyphs without external CDN dependencies.

- **Document Import & Export**:
  - PDF document import onto whiteboard slides with local PDF.js worker parsing.
  - Export lessons to multi-page printable PDF documents via jsPDF.
  - High-resolution image export (PNG/JPEG) and vector SVG export.
  - Native editable lesson format (`.sbl`) preserving editable stroke objects and layers.

- **Classroom Teaching Tools**:
  - 180° math protractor and 30 cm ruler instruments.
  - Spotlight focus overlay and screen veil reveal tools.
  - Classroom stopwatch and countdown timer widget.
  - Teaching Resource Library with Windows filesystem sync (`Documents\SmartNoteAI\Resources`).

#### Fixed
- Fixed window restore bounds desynchronization when returning to presentation mode from minimized desktop state.
- Fixed stylus event dropping in dual mouse/pen configurations.
- Fixed 0-width strokes on initial stylus contact with fallback pressure handling.
