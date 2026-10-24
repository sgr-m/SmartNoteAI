/**
 * SubjectToolsModal — Subject-specific teaching tools (Section 4.2 #5)
 * Math: Cartesian Axes with Points, Calibrated Ruler, 180° Protractor, Compass, Formulas
 * Science: Physics Constants, Chemistry Reactions, Ideal Gas Law
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShapeObject, TextObject, StrokeObject } from '../../shared/types';
import { measureLatexSize } from '../services/latexService';
import { v4 as uuidv4 } from 'uuid';
import './SubjectToolsModal.css';

interface SubjectToolsModalProps {
  onClose: () => void;
}

type TabType = 'math' | 'science' | 'geometry';

export function SubjectToolsModal({ onClose }: SubjectToolsModalProps): React.ReactElement {
  const { docDispatch, docState, commandSystem } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('math');
  const [rulerLength, setRulerLength] = useState(480);

  const currentPageIndex = docState.currentPageIndex;

  /**
   * Inserts authentic KaTeX formatted mathematical formula
   */
  const insertTextFormula = (latexContent: string, title?: string) => {
    const measured = measureLatexSize(latexContent, 28);
    const textObj: TextObject = {
      id: uuidv4(),
      type: 'text',
      x: 280,
      y: 200,
      width: measured.width,
      height: measured.height,
      content: latexContent,
      fontFamily: "KaTeX_Main, 'Cambria Math', 'Times New Roman', serif",
      fontSize: 28,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      color: '#ffffff',
      backgroundColor: 'transparent',
      opacity: 1,
      rotation: 0,
      preset: 'formula',
      locked: false,
      layerId: 'objects',
      isLatex: true,
    };

    commandSystem.execute({
      id: uuidv4(),
      description: title || `Insert formula: ${latexContent}`,
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: textObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: textObj.id });
      },
    });

    onClose();
  };

  /**
   * 1. Cartesian Coordinate Axes with Points, Grid Dots, Origin, & Numbered Ticks
   */
  const insertCoordinateGrid = () => {
    const axesObj: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'cartesianAxes',
      x: 240,
      y: 120,
      width: 500,
      height: 500,
      rotation: 0,
      fillColor: 'rgba(15, 23, 42, 0.92)',
      fillOpacity: 1,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: 'Insert Cartesian Coordinate Axes with Points & Grid',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: axesObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: axesObj.id });
      },
    });

    onClose();
  };

  /**
   * 3. Calibrated Smart Classroom Ruler with Centimeter & Millimeter units
   */
  const insertSmartRuler = () => {
    const rulerObj: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'ruler',
      x: 200,
      y: 220,
      width: rulerLength,
      height: 76,
      rotation: 0,
      fillColor: 'rgba(248, 250, 252, 0.88)',
      fillOpacity: 0.88,
      strokeColor: '#0284c7',
      strokeWidth: 1.5,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: 'Insert Calibrated Classroom Ruler',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: rulerObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: rulerObj.id });
      },
    });

    onClose();
  };

  /**
   * 4. Draw a calibrated straight line directly along the ruler scale
   */
  const drawLineAlongRuler = () => {
    const strokeObj: StrokeObject = {
      id: uuidv4(),
      type: 'stroke',
      points: [
        { x: 220, y: 220, pressure: 0.8 },
        { x: 220 + rulerLength, y: 220, pressure: 0.8 },
      ],
      style: {
        penType: 'normal',
        color: '#0284c7',
        width: 3,
        opacity: 1,
        smoothing: 0.5,
        pressureSensitive: false,
      },
      bbox: { x: 220, y: 218, width: rulerLength, height: 4 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };

    commandSystem.execute({
      id: uuidv4(),
      description: `Draw ${Math.round(rulerLength / 32)} cm calibrated straight line`,
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: strokeObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: strokeObj.id });
      },
    });

    onClose();
  };

  /**
   * 5. 180° Classroom Protractor Instrument
   */
  const insertProtractor = () => {
    const protractorObj: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'protractor',
      x: 240,
      y: 180,
      width: 440,
      height: 230,
      rotation: 0,
      fillColor: 'rgba(224, 242, 254, 0.75)',
      fillOpacity: 0.75,
      strokeColor: '#0284c7',
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: 'Insert 180° Classroom Protractor',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: protractorObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: protractorObj.id });
      },
    });

    onClose();
  };

  /**
   * 6. Geometric Compass Instrument
   */
  const insertCompass = () => {
    const compassObj: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'compass',
      x: 260,
      y: 160,
      width: 360,
      height: 280,
      rotation: 0,
      fillColor: 'transparent',
      fillOpacity: 1,
      strokeColor: '#0284c7',
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: 'Insert Geometric Compass Instrument',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: compassObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: compassObj.id });
      },
    });

    onClose();
  };

  return (
    <div className="subject-tools-overlay" onClick={onClose}>
      <div className="subject-tools-modal" onClick={(e) => e.stopPropagation()}>
        <div className="subject-tools-header">
          <div className="subject-tools-title-group">
            <span className="subject-tools-icon">🛠️</span>
            <div>
              <h3>Subject Teaching Tools</h3>
              <p>Calibrated classroom instruments & STEM mathematical formulas</p>
            </div>
          </div>
          <button className="subject-tools-close" onClick={onClose}>✕</button>
        </div>

        {/* Category Tabs */}
        <div className="subject-tools-tabs">
          <button
            className={`tab-btn ${activeTab === 'math' ? 'active' : ''}`}
            onClick={() => setActiveTab('math')}
          >
            📐 Mathematics
          </button>
          <button
            className={`tab-btn ${activeTab === 'geometry' ? 'active' : ''}`}
            onClick={() => setActiveTab('geometry')}
          >
            📏 Geometry & Instruments
          </button>
          <button
            className={`tab-btn ${activeTab === 'science' ? 'active' : ''}`}
            onClick={() => setActiveTab('science')}
          >
            🔬 Physics & Chemistry
          </button>
        </div>

        {/* Content Area */}
        <div className="subject-tools-body">
          {activeTab === 'math' && (
            <div className="tools-grid">
              {/* 1. Cartesian Coordinate Axes with Points */}
              <div className="tool-card" onClick={insertCoordinateGrid}>
                <div className="tool-card-icon">📈</div>
                <h4>Cartesian Axes (X-Y) with Points</h4>
                <p>Grid points, origin (0,0), coordinate arrows & numbered ticks (-5 to +5)</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              {/* 2. Proper LaTeX Equations */}
              <div className="tool-card" onClick={() => insertTextFormula('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', 'Quadratic Formula')}>
                <div className="tool-card-icon">🧮</div>
                <h4>Quadratic Formula</h4>
                <p>Standard root solver with vertical fraction & square root</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('E = mc^2', 'Mass-Energy Equivalence')}>
                <div className="tool-card-icon">⚡</div>
                <h4>Mass-Energy Equivalence</h4>
                <p>Einstein: E = mc²</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('a^2 + b^2 = c^2', 'Pythagorean Theorem')}>
                <div className="tool-card-icon">📐</div>
                <h4>Pythagorean Theorem</h4>
                <p>Right-angle triangle formula: a² + b² = c²</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('A = \\pi r^2 \\quad \\cdot \\quad C = 2\\pi r', 'Circle Area & Circumference')}>
                <div className="tool-card-icon">⭕</div>
                <h4>Circle Area & Circumference</h4>
                <p>Area A = πr², Circumference C = 2πr</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('\\sin^2\\theta + \\cos^2\\theta = 1', 'Trigonometric Identity')}>
                <div className="tool-card-icon">📊</div>
                <h4>Trigonometric Identity</h4>
                <p>Fundamental Pythagorean trigonometric identity</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('\\frac{d}{dx}\\left(x^n\\right) = n x^{n-1}', 'Calculus Power Rule')}>
                <div className="tool-card-icon">∫</div>
                <h4>Calculus Derivative Rule</h4>
                <p>Power rule: d/dx(xⁿ) = n·xⁿ⁻¹</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('e^{i\\pi} + 1 = 0', "Euler's Identity")}>
                <div className="tool-card-icon">✨</div>
                <h4>Euler's Identity</h4>
                <p>e^(iπ) + 1 = 0</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>
            </div>
          )}

          {activeTab === 'geometry' && (
            <div className="geometry-tools-container">
              {/* 3 & 4. Smart Ruler with Units & Line Drawing */}
              <div className="geometry-instrument-card">
                <div className="instrument-header">
                  <span style={{ fontSize: 28 }}>📏</span>
                  <div>
                    <h4>Calibrated Smart Ruler</h4>
                    <p>Metric scale calibrated in cm and mm units with automatic line snapping guide</p>
                  </div>
                </div>
                <div className="ruler-preview-strip">
                  <div className="ruler-marks">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <span key={num} className="ruler-tick">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 13, color: '#94a3b8' }}>Ruler Length:</label>
                  <select
                    className="ruler-select"
                    value={rulerLength}
                    onChange={(e) => setRulerLength(Number(e.target.value))}
                  >
                    <option value={320}>Short (10 cm / 320px)</option>
                    <option value={480}>Standard (15 cm / 480px)</option>
                    <option value={640}>Medium (20 cm / 640px)</option>
                    <option value={960}>Full Board (30 cm / 960px)</option>
                  </select>
                  <button className="btn btn-primary" onClick={insertSmartRuler}>
                    Place Ruler on Board
                  </button>
                  <button className="btn btn-secondary" onClick={drawLineAlongRuler} title="Draw straight line using ruler scale">
                    ✏️ Draw Calibrated Line
                  </button>
                </div>
              </div>

              <div className="tools-grid" style={{ marginTop: 16 }}>
                {/* 5. 180° Classroom Protractor */}
                <div className="tool-card" onClick={insertProtractor}>
                  <div className="tool-card-icon">🧭</div>
                  <h4>180° Classroom Protractor</h4>
                  <p>Interactive 180° protractor with dual scales (0-180° & 180-0°), degree ticks & center crosshair</p>
                  <button className="insert-btn">Insert Protractor</button>
                </div>

                {/* 6. Geometric Compass */}
                <div className="tool-card" onClick={insertCompass}>
                  <div className="tool-card-icon">📍</div>
                  <h4>Geometric Compass Instrument</h4>
                  <p>Dual-leg compass with needle pivot, pencil clamp, calibrated radius & arc guide</p>
                  <button className="insert-btn">Insert Compass</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'science' && (
            <div className="tools-grid">
              <div className="tool-card" onClick={() => insertTextFormula('F = m \\cdot a \\quad \\cdot \\quad W = m \\cdot g', "Newton's 2nd Law of Motion")}>
                <div className="tool-card-icon">🚀</div>
                <h4>Newton's 2nd Law of Motion</h4>
                <p>Force F = m·a, Weight W = m·g</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('V = I \\cdot R \\quad \\cdot \\quad P = V \\cdot I', "Ohm's Law & Electric Power")}>
                <div className="tool-card-icon">⚡</div>
                <h4>Ohm's Law & Electric Power</h4>
                <p>Voltage = Current × Resistance</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('P \\cdot V = n \\cdot R \\cdot T', 'Ideal Gas Law')}>
                <div className="tool-card-icon">🧪</div>
                <h4>Ideal Gas Law</h4>
                <p>PV = nRT (pressure, volume, moles, temp)</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('2\\text{H}_2 + \\text{O}_2 \\longrightarrow 2\\text{H}_2\\text{O} \\quad (\\Delta H = -572\\text{ kJ})', 'Water Synthesis Reaction')}>
                <div className="tool-card-icon">💧</div>
                <h4>Water Synthesis Reaction</h4>
                <p>Exothermic chemical reaction equation</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('E_k = \\frac{1}{2} m v^2', 'Kinetic Energy')}>
                <div className="tool-card-icon">🏎️</div>
                <h4>Kinetic Energy</h4>
                <p>Ek = 1/2 · m · v²</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('\\lambda = \\frac{h}{p} = \\frac{h}{m v}', 'De Broglie Wavelength')}>
                <div className="tool-card-icon">🌊</div>
                <h4>De Broglie Wavelength</h4>
                <p>λ = h/p = h/(mv)</p>
                <button className="insert-btn">Insert LaTeX Formula</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
