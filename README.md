# SmartBoard Studio (SmartNoteAI) 🎓✨

[![Release](https://img.shields.io/github/v/release/sgr-m/SmartNoteAI?color=blue&label=Windows%20Release)](https://github.com/sgr-m/SmartNoteAI/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows)](https://github.com/sgr-m/SmartNoteAI/releases)
[![Tests](https://img.shields.io/badge/Tests-172%20passing-brightgreen)](https://github.com/sgr-m/SmartNoteAI)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SmartBoard Studio** is a high-performance, modern interactive smartboard and digital teaching suite built for Windows 10 & 11. Designed specifically for educators, presenters, and creators, it delivers a low-latency digital canvas, hardware stylus digitizer support, instant live desktop annotation, smart shape recognition, and native LaTeX equation rendering.

---

## 🚀 Key Features

### 🖊️ Hardware Stylus & Tablet Support
- **Precision Digitizer Integration**: Engineered for graphics tablets including **XP-Pen Deco Mini 7**, **Wacom One/Intuos**, **Huion Inspiroy**, and Windows Ink styluses.
- **Natural Pressure Sensitivity**: Smooth line-weight variation based on pen pressure with zero lag.
- **Dual Mouse & Tablet Handling**: Seamlessly switch between mouse clicks and stylus drawing without dropping strokes or pointer lock conflicts.
- **Palm Rejection**: Rejects accidental multi-touch palm inputs during active drawing.

### 🖥️ Live Desktop Annotation Mode
- **Draw Over Any Application**: Switch instantly to Desktop Mode with a floating toolbar to annotate directly over presentations, PDFs, coding editors (like VS Code), browsers, or videos.
- **Interactive Click-Through**: Interact with underlying desktop apps and draw notes simultaneously.
- **Area Screen Snip & Paste**: Capture any rectangular region of your screen with one click and automatically paste it onto your active whiteboard canvas for discussion.

### 📐 Intelligent Shape & Geometric Recognition
- **Real-Time Shape Identification**: Draw rough geometric shapes—triangles, circles, rectangles, polygons, or straight lines—and have them automatically aligned and snapped to clean geometric figures.
- **Adjustable Line Styles**: Full control over stroke width, color palette, opacity, and fill.

### 🧮 Mathematical & Scientific Typography (LaTeX / KaTeX)
- **Built-in Equation Editor**: Write mathematical expressions in LaTeX syntax and render them as crisp, scalable vector formulas on the board.
- **Offline Fonts Included**: Pre-bundled KaTeX font families without any external web CDN dependency.

### 📑 Document Import & Export
- **PDF Import**: Open multi-page PDF textbooks, assignments, and slides directly onto canvas pages with local PDF worker parsing.
- **High-Resolution Export**: Export your completed lessons to **PDF documents**, high-resolution **PNG images**, or vector **SVG files**.

### 🎨 Classroom & Presentation Modes
- **Immersive Full-Screen Presentation**: Borderless, distraction-free view designed for projectors, TVs, and large interactive touchscreens.
- **Floating Island Dock**: Ergonomic bottom dock with quick-access flyouts for pen colors, highlighters, eraser modes, shapes, and page navigation.
- **Custom Board Backgrounds**: Switch between Blackboard green, Whiteboard classic, grid paper, coordinate planes, or lined notebook styles.

---

## 📥 Download & Installation

### Windows Installer (Recommended)
1. Go to the [**Releases**](https://github.com/sgr-m/SmartNoteAI/releases) page.
2. Download the latest `SmartBoard.Studio.Setup.0.1.0.exe`.
3. Run the installer and launch **SmartBoard Studio** from your Start Menu or Desktop shortcut.

---

## ⌨️ Keyboard Shortcuts

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
| `F11` | Toggle Fullscreen / Presentation Mode |
| `D` | Toggle Desktop Mode |

---

## 🛠️ Development Setup

If you want to contribute to SmartBoard Studio or run it locally from source:

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

### 3. Start development server
```bash
npm run dev
```
This concurrently starts the Vite hot-module-reloading frontend and Electron main process.

### 4. Run tests
```bash
npm test
```
Runs the full Vitest suite (172 unit and integration tests across drawing, presentation, PDF import, and desktop snip subsystems).

### 5. Build production executable
```bash
npm run dist
```
Generates an installer inside the `release/` directory:
- `release/SmartBoard Studio Setup 0.1.0.exe`
- `release/win-unpacked/SmartBoard Studio.exe`

---

## 🏗️ Architecture & Technology Stack

- **Framework**: [Electron](https://www.electronjs.org/) (Chromium + Node.js)
- **UI Engine**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Math Engine**: [KaTeX](https://katex.org/)
- **Document Engine**: [pdfjs-dist](https://mozilla.github.io/pdf.js/) & [jsPDF](https://github.com/parallax/jsPDF)
- **Testing**: [Vitest](https://vitest.dev/)
- **Packaging**: [electron-builder](https://www.electron.build/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
