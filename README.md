<p align="center">
  <img src="assets/logo.png" alt="SmartNoteAI Logo" width="380" />
</p>

# SmartNoteAI 🎓✨

[![Release](https://img.shields.io/github/v/release/sgr-m/SmartNoteAI?color=blue&label=Windows%20Release)](https://github.com/sgr-m/SmartNoteAI/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows)](https://github.com/sgr-m/SmartNoteAI/releases)
[![Tests](https://img.shields.io/badge/Tests-172%20passing-brightgreen)](https://github.com/sgr-m/SmartNoteAI)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SmartNoteAI** is a high-performance interactive digital whiteboard and teaching suite designed specifically for Windows 10 & 11. Built from the ground up for educators, lecturers, content creators, and remote teachers, it delivers ultra-low-latency drawing, dedicated hardware graphics tablet & stylus digitizer integration, live desktop overlay annotation, intelligent geometric shape recognition, and offline LaTeX mathematical formula typography.

---

## 🚀 Feature Highlights & Hardware Compatibility

### 🖊️ Hardware Stylus & Tablet Compatibility
- **Full Windows Ink & DirectManipulation Support**: Built-in support for USB and wireless drawing tablets including:
  - **XP-Pen Deco Mini 7**, Deco Series, and Artist Pen Displays
  - **Wacom One**, **Wacom Intuos**, and **Cintiq**
  - **Huion Inspiroy** and **Kamvas** Series
  - Microsoft Surface Pen and active Windows stylus digitizers
- **Dynamic Pressure Sensitivity**: Real-time line-width variation adapting smoothly from light pencil sketching to bold marker strokes without latency.
- **Dual Mouse & Digitizer Coordination**: Freely interact with mouse clicks and pen drawing without stylus event drops, pointer lock freezes, or driver conflicts.
- **Palm Rejection**: Rejects accidental multi-touch finger inputs while pen tip is engaged.

### 🖥️ Live Desktop Annotation & Screen Snip
- **Annotate Over Any App**: Minimize to a compact floating toolbar and draw notes, formulas, and highlights directly over active desktop windows (VS Code, PowerPoint, web browsers, videos).
- **Interactive Click-Through**: Interact with underlying desktop apps and draw notes simultaneously.
- **Area Screen Snip**: Capture any rectangular region of your desktop with a single click and have it immediately inserted onto your active whiteboard canvas.

### 📺 True Fullscreen Presentation Mode
- **Seamless Window Restoration**: Returning from desktop mode instantly restores true borderless full-screen view without floating window bounds or desktop background interference.
- **Single-Click Presentation Toggle**: Direct synchronization between the presentation icon and native Windows fullscreen mode.
- **Interactive Teaching Dock**: Ergonomic bottom dock with quick flyouts for pen colors, highlighters, multi-mode erasers, shapes, and page management.

### 📐 Intelligent Geometric & Shape Recognition
- **Hand-Drawn Shape Snapping**: Quickly sketch rough shapes—triangles, circles, ellipses, rectangles, polygons, and straight lines—and have them automatically aligned into clean geometric figures.
- **Customizable Geometry**: Adjust stroke thickness, line colors, opacity, and fill.

### 🧮 Mathematical & Scientific Typography (LaTeX / KaTeX)
- **Built-in Formula Editor**: Render complex mathematical and scientific equations directly using LaTeX syntax.
- **Offline Fonts Included**: High-resolution vector KaTeX font glyphs pre-bundled locally with zero internet dependency.

### 📑 Document Import & Export
- **PDF Document Import**: Import multi-page textbooks, question papers, and slides directly onto whiteboard pages.
- **Multi-Format Export**: Export completed lectures to printable **PDF**, high-resolution **PNG**, or vector **SVG**.
- **Native Lesson Format (`.sbl`)**: Save and reload fully interactive, editable lesson files.

---

## 📥 Download & Installation

### Windows Installer (Recommended)
1. Visit the [**Releases**](https://github.com/sgr-m/SmartNoteAI/releases) section.
2. Download the latest installer: **`SmartNoteAI.Setup.0.1.0.exe`**.
3. Run the setup file and launch **SmartNoteAI** from your Desktop or Start Menu.

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Shortcut | Action |
| :--- | :--- |
| `P` | Pen tool |
| `E` | Eraser tool |
| `S` | Select / Move tool |
| `H` | Shape & Recognition tool |
| `T` | Text tool |
| `Space` + Drag | Pan across canvas |
| `Ctrl` + `Z` | Undo |
| `Ctrl` + `Y` / `Ctrl` + `Shift` + `Z` | Redo |
| `Ctrl` + `+` / `Ctrl` + `-` | Zoom In / Out |
| `Ctrl` + `0` | Fit Page |
| `F11` | Toggle Fullscreen Presentation Mode |
| `D` | Toggle Desktop Mode |

---

## 🛠️ Development & Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- Windows 10 or 11

### 1. Clone the repository
```bash
git clone https://github.com/sgr-m/SmartNoteAI.git
cd SmartNoteAI/smartboard-studio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

### 4. Run automated test suite
```bash
npm test
```
Runs all 172 unit and integration tests across drawing engine, stylus event processing, presentation synchronization, and PDF import.

### 5. Package Windows installer
```bash
npm run dist
```
Generates production binaries in `release/`:
- `release/SmartNoteAI Setup 0.1.0.exe` (NSIS installer)
- `release/win-unpacked/SmartNoteAI.exe` (Portable executable)

---

## 🏗️ Architecture & Technology Stack

- **Application Container**: [Electron 34](https://www.electronjs.org/) (Chromium + Node.js)
- **Frontend Engine**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool**: [Vite](https://vitejs.dev/)
- **Mathematical Formula Engine**: [KaTeX](https://katex.org/)
- **PDF & Document Processing**: [pdfjs-dist](https://mozilla.github.io/pdf.js/) & [jsPDF](https://github.com/parallax/jsPDF)
- **Unit & Integration Testing**: [Vitest](https://vitest.dev/)
- **Windows Packaging**: [electron-builder](https://www.electron.build/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
