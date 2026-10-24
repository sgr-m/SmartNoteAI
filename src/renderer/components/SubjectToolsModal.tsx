/**
 * SubjectToolsModal — Subject-specific teaching tools (Section 4.2 #5)
 * Math: Ruler, Protractor, Compass, Formulas
 * Science: Chemistry Periodic Table, Physics Constants
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShapeObject, TextObject } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import './SubjectToolsModal.css';

interface SubjectToolsModalProps {
  onClose: () => void;
}

type TabType = 'math' | 'science' | 'geometry';

export function SubjectToolsModal({ onClose }: SubjectToolsModalProps): React.ReactElement {
  const { docDispatch, docState, commandSystem } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('math');
  const [rulerLength, setRulerLength] = useState(400);

  const currentPageIndex = docState.currentPageIndex;

  const insertTextFormula = (content: string, preset: 'formula' | 'definition' | 'important' = 'formula') => {
    const textObj: TextObject = {
      id: uuidv4(),
      type: 'text',
      x: 300,
      y: 200,
      width: Math.max(220, content.length * 15),
      height: 60,
      content,
      fontFamily: preset === 'formula' ? 'JetBrains Mono, Courier New, monospace' : 'Inter, sans-serif',
      fontSize: 26,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      color: preset === 'formula' ? '#38bdf8' : '#10b981',
      backgroundColor: preset === 'formula' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)',
      opacity: 1,
      rotation: 0,
      preset,
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: `Insert formula: ${content}`,
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: textObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: textObj.id });
      },
    });

    onClose();
  };

  const insertCoordinateGrid = () => {
    const shapeX: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'arrow',
      x: 200,
      y: 400,
      width: 500,
      height: 0,
      rotation: 0,
      fillColor: '#38bdf8',
      fillOpacity: 1,
      strokeColor: '#38bdf8',
      strokeWidth: 3,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };
    const shapeY: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'arrow',
      x: 450,
      y: 650,
      width: 0,
      height: -500,
      rotation: 0,
      fillColor: '#38bdf8',
      fillOpacity: 1,
      strokeColor: '#38bdf8',
      strokeWidth: 3,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: 'Insert Coordinate Axes (X-Y)',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: shapeX });
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: shapeY });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECTS', pageIndex: currentPageIndex, objectIds: [shapeX.id, shapeY.id] });
      },
    });

    onClose();
  };

  const insertSmartRuler = () => {
    const rulerObj: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'roundedRect',
      x: 250,
      y: 250,
      width: rulerLength,
      height: 70,
      rotation: 0,
      fillColor: '#f8fafc',
      fillOpacity: 0.85,
      strokeColor: '#0284c7',
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: 'Insert Smartboard Classroom Ruler',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: rulerObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: rulerObj.id });
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
              <p>Specialized classroom instruments for STEM education</p>
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
              <div className="tool-card" onClick={insertCoordinateGrid}>
                <div className="tool-card-icon">📈</div>
                <h4>Cartesian Axes (X-Y)</h4>
                <p>Standard coordinate plane with directional arrows</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('E = mc²')}>
                <div className="tool-card-icon">⚡</div>
                <h4>Mass-Energy Equivalence</h4>
                <p>Einstein: E = mc²</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('a² + b² = c²')}>
                <div className="tool-card-icon">📐</div>
                <h4>Pythagorean Theorem</h4>
                <p>Right-angle triangle formula: a² + b² = c²</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('x = (-b ± √(b² - 4ac)) / (2a)')}>
                <div className="tool-card-icon">🧮</div>
                <h4>Quadratic Formula</h4>
                <p>Standard quadratic equation root solver</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('A = πr²   ·   C = 2πr')}>
                <div className="tool-card-icon">⭕</div>
                <h4>Circle Area & Circumference</h4>
                <p>A = πr², Circumference C = 2πr</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('sin²θ + cos²θ = 1')}>
                <div className="tool-card-icon">📊</div>
                <h4>Trigonometric Identity</h4>
                <p>Fundamental Pythagorean trigonometric identity</p>
                <button className="insert-btn">Insert on Board</button>
              </div>
            </div>
          )}

          {activeTab === 'geometry' && (
            <div className="geometry-tools-container">
              <div className="geometry-instrument-card">
                <div className="instrument-header">
                  <span style={{ fontSize: 28 }}>📏</span>
                  <div>
                    <h4>Calibrated Smart Ruler</h4>
                    <p>Interactive scale calibrated in metric (cm) and imperial (in)</p>
                  </div>
                </div>
                <div className="ruler-preview-strip">
                  <div className="ruler-marks">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span key={num} className="ruler-tick">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                  <label style={{ fontSize: 13, color: '#94a3b8' }}>Length:</label>
                  <select
                    className="ruler-select"
                    value={rulerLength}
                    onChange={(e) => setRulerLength(Number(e.target.value))}
                  >
                    <option value={300}>Short (15 cm / 300px)</option>
                    <option value={450}>Medium (20 cm / 450px)</option>
                    <option value={600}>Full Desk (30 cm / 600px)</option>
                  </select>
                  <button className="btn btn-primary" onClick={insertSmartRuler}>
                    Place Ruler on Board
                  </button>
                </div>
              </div>

              <div className="tools-grid" style={{ marginTop: 16 }}>
                <div
                  className="tool-card"
                  onClick={() => insertTextFormula('180° Protractor: ∠ABC = 60°', 'definition')}
                >
                  <div className="tool-card-icon">🧭</div>
                  <h4>180° Classroom Protractor</h4>
                  <p>Measure and demonstrate angles</p>
                  <button className="insert-btn">Insert Protractor</button>
                </div>

                <div
                  className="tool-card"
                  onClick={() => insertTextFormula('Radius r = 5.0 cm (Compass)', 'definition')}
                >
                  <div className="tool-card-icon">📍</div>
                  <h4>Geometric Compass</h4>
                  <p>Demonstrate circle arcs and perpendicular bisectors</p>
                  <button className="insert-btn">Insert Compass</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'science' && (
            <div className="tools-grid">
              <div className="tool-card" onClick={() => insertTextFormula('F = m · a   ·   W = m · g')}>
                <div className="tool-card-icon">🚀</div>
                <h4>Newton\'s 2nd Law of Motion</h4>
                <p>Force = mass × acceleration</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('V = I · R   ·   P = V · I')}>
                <div className="tool-card-icon">⚡</div>
                <h4>Ohm\'s Law & Electric Power</h4>
                <p>Voltage = Current × Resistance</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('PV = nRT  (Ideal Gas Law)')}>
                <div className="tool-card-icon">🧪</div>
                <h4>Ideal Gas Law</h4>
                <p>P = pressure, V = volume, n = moles, T = temp</p>
                <button className="insert-btn">Insert on Board</button>
              </div>

              <div className="tool-card" onClick={() => insertTextFormula('2 H₂ + O₂ ⟶ 2 H₂O  (ΔH = -572 kJ)')}>
                <div className="tool-card-icon">💧</div>
                <h4>Water Synthesis Reaction</h4>
                <p>Exothermic chemical reaction equation</p>
                <button className="insert-btn">Insert on Board</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
