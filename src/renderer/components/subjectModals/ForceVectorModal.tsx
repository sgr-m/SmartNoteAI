/**
 * Force Vector & Resultant Force Vector Addition Modal (Section 16.2)
 * Allows users to configure directional force vectors, resolve x/y components,
 * perform vector addition (parallelogram law), compute resultant magnitude and angle,
 * with real-time SVG schematic preview.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { calculateResultantForce } from '../../services/subjectModules/physicsModule';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface VectorItem {
  id: string;
  name: string;
  magnitude: number;
  angleDegrees: number;
  color: string;
}

interface ForceVectorModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
  defaultMode?: 'forceVector' | 'resultantForce';
}

const COLOR_PRESETS = ['#f43f5e', '#38bdf8', '#10b981', '#facc15', '#a855f7'];

export function ForceVectorModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
  defaultMode = 'forceVector',
}: ForceVectorModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const initialMode =
    (existingShape?.params?.diagramType as 'forceVector' | 'resultantForce') || defaultMode;

  const [mode, setMode] = useState<'forceVector' | 'resultantForce'>(initialMode);

  // Single Vector parameters
  const [magnitude, setMagnitude] = useState<number>(
    existingShape?.params?.magnitude ?? 50
  );
  const [angle, setAngle] = useState<number>(
    existingShape?.params?.angle ?? 45
  );
  const [vectorName, setVectorName] = useState<string>(
    existingShape?.params?.name || 'F_app'
  );
  const [vectorColor, setVectorColor] = useState<string>(
    existingShape?.strokeColor || '#f43f5e'
  );
  const [showComponents, setShowComponents] = useState<boolean>(
    existingShape?.params?.showComponents !== false
  );

  // Resultant addition forces
  const [forces, setForces] = useState<VectorItem[]>(() => {
    if (existingShape?.params?.forces) {
      return existingShape.params.forces;
    }
    if (existingShape?.params?.diagramType === 'resultantForce') {
      return [
        {
          id: 'v1',
          name: 'F1',
          magnitude: existingShape.params.f1 ?? 40,
          angleDegrees: existingShape.params.theta1 ?? 0,
          color: '#38bdf8',
        },
        {
          id: 'v2',
          name: 'F2',
          magnitude: existingShape.params.f2 ?? 30,
          angleDegrees: existingShape.params.theta2 ?? 90,
          color: '#10b981',
        },
      ];
    }
    return [
      { id: 'v1', name: 'F1', magnitude: 40, angleDegrees: 0, color: '#38bdf8' },
      { id: 'v2', name: 'F2', magnitude: 30, angleDegrees: 90, color: '#10b981' },
    ];
  });

  const currentPageIndex = docState.currentPageIndex;

  // Single vector calculations
  const rad = (angle * Math.PI) / 180;
  const fx = Number((magnitude * Math.cos(rad)).toFixed(1));
  const fy = Number((magnitude * Math.sin(rad)).toFixed(1));

  // Resultant vector calculations
  const resultantCalc = calculateResultantForce(forces);

  const handleAddForce = () => {
    if (forces.length >= 4) return;
    const newIdx = forces.length + 1;
    const color = COLOR_PRESETS[forces.length % COLOR_PRESETS.length];
    setForces([
      ...forces,
      {
        id: 'v_' + Date.now(),
        name: `F${newIdx}`,
        magnitude: 35,
        angleDegrees: newIdx === 3 ? 135 : 210,
        color,
      },
    ]);
  };

  const handleRemoveForce = (id: string) => {
    if (forces.length <= 2) return;
    setForces(forces.filter((f) => f.id !== id));
  };

  const handleUpdateForce = (id: string, updates: Partial<VectorItem>) => {
    setForces(forces.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleInsert = () => {
    if (mode === 'forceVector') {
      const cleanLabel = `F = ${magnitude} N (${angle}°)`;
      if (existingShape && onUpdateExisting) {
        const updated: ShapeObject = {
          ...existingShape,
          label: cleanLabel,
          strokeColor: vectorColor,
          params: {
            ...existingShape.params,
            diagramType: 'forceVector',
            magnitude,
            angle,
            name: vectorName,
            fx,
            fy,
            showComponents,
          },
        };
        onUpdateExisting(updated);
        onClose();
        return;
      }

      const shapeObj = createShape('physicsDiagram', 220, 180, 420, 360, {
        strokeColor: vectorColor,
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: cleanLabel,
        params: {
          diagramType: 'forceVector',
          magnitude,
          angle,
          name: vectorName,
          fx,
          fy,
          showComponents,
        },
      });

      executeAddObject(
        { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
        shapeObj,
        `Insert ${cleanLabel}`
      );
    } else {
      const cleanLabel = `Resultant Force R = ${resultantCalc.magnitude} N @ ${resultantCalc.angleDegrees}°`;
      if (existingShape && onUpdateExisting) {
        const updated: ShapeObject = {
          ...existingShape,
          label: cleanLabel,
          params: {
            ...existingShape.params,
            diagramType: 'resultantForce',
            forces,
            rx: resultantCalc.rx,
            ry: resultantCalc.ry,
            r: resultantCalc.magnitude,
            theta: resultantCalc.angleDegrees,
          },
        };
        onUpdateExisting(updated);
        onClose();
        return;
      }

      const shapeObj = createShape('physicsDiagram', 200, 160, 480, 400, {
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: cleanLabel,
        params: {
          diagramType: 'resultantForce',
          forces,
          rx: resultantCalc.rx,
          ry: resultantCalc.ry,
          r: resultantCalc.magnitude,
          theta: resultantCalc.angleDegrees,
        },
      });

      executeAddObject(
        { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
        shapeObj,
        'Insert Resultant Force Demonstration'
      );
    }

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // SVG Preview Coordinates
  const previewW = 340;
  const previewH = 240;
  const cx = previewW / 2;
  const cy = previewH / 2 + 10;
  const maxVisualLen = 80;

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card force-vector-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        <div className="submodal-header">
          <div className="submodal-title">
            <span>{mode === 'forceVector' ? '↗️' : '📐'}</span>
            <div>
              <h3>{mode === 'forceVector' ? 'Force Vector Configuration' : 'Resultant Force Demonstration'}</h3>
              <p>Directional force vectors, Cartesian components, and vector addition</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="submodal-body" style={{ padding: '16px 20px', maxHeight: '82vh', overflowY: 'auto' }}>
          {/* Mode Switcher Tabs */}
          <div className="logic-gate-tabs" style={{ marginBottom: 16 }}>
            <button
              className={`gate-pill ${mode === 'forceVector' ? 'active' : ''}`}
              onClick={() => setMode('forceVector')}
            >
              ↗️ Single Force Vector
            </button>
            <button
              className={`gate-pill ${mode === 'resultantForce' ? 'active' : ''}`}
              onClick={() => setMode('resultantForce')}
            >
              📐 Resultant Addition (R = F1 + F2)
            </button>
          </div>

          {/* Real-time SVG Schematic Preview */}
          <div
            className="circuit-preview-box"
            style={{
              background: '#090d16',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 8,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
              {mode === 'forceVector'
                ? `Vector: |F| = ${magnitude} N, θ = ${angle}°, Fx = ${fx} N, Fy = ${fy} N`
                : `Resultant: R = ${resultantCalc.magnitude} N @ ${resultantCalc.angleDegrees}° (Rx = ${resultantCalc.rx} N, Ry = ${resultantCalc.ry} N)`}
            </div>

            <svg width={previewW} height={previewH} style={{ overflow: 'visible' }}>
              {/* Axes Crosshair */}
              <line x1={20} y1={cy} x2={previewW - 20} y2={cy} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1={cx} y1={previewH - 20} x2={cx} y2={20} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x={previewW - 14} y={cy + 4} fill="#64748b" fontSize="10" fontFamily="sans-serif">+x</text>
              <text x={cx} y={15} fill="#64748b" fontSize="10" fontFamily="sans-serif" textAnchor="middle">+y</text>
              <circle cx={cx} cy={cy} r="3" fill="#64748b" />

              {mode === 'forceVector' ? (
                <>
                  {/* Angle Arc */}
                  <path
                    d={`M ${cx + 28} ${cy} A 28 28 0 ${angle > 180 ? 1 : 0} 0 ${
                      cx + 28 * Math.cos(-rad)
                    } ${cy + 28 * Math.sin(-rad)}`}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx + 36 * Math.cos(-rad / 2)}
                    y={cy + 36 * Math.sin(-rad / 2)}
                    fill="#facc15"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {angle}°
                  </text>

                  {/* Components */}
                  {showComponents && (
                    <>
                      {/* Fx dashed */}
                      <line
                        x1={cx}
                        y1={cy}
                        x2={cx + maxVisualLen * Math.cos(rad)}
                        y2={cy}
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                      {/* Fy dashed */}
                      <line
                        x1={cx + maxVisualLen * Math.cos(rad)}
                        y1={cy}
                        x2={cx + maxVisualLen * Math.cos(rad)}
                        y2={cy - maxVisualLen * Math.sin(rad)}
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    </>
                  )}

                  {/* Vector Arrow */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx + maxVisualLen * Math.cos(rad)}
                    y2={cy - maxVisualLen * Math.sin(rad)}
                    stroke={vectorColor}
                    strokeWidth="3.5"
                  />
                  {/* Arrowhead */}
                  <circle
                    cx={cx + maxVisualLen * Math.cos(rad)}
                    cy={cy - maxVisualLen * Math.sin(rad)}
                    r="4.5"
                    fill={vectorColor}
                  />
                  <text
                    x={cx + (maxVisualLen + 14) * Math.cos(rad)}
                    y={cy - (maxVisualLen + 14) * Math.sin(rad)}
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {vectorName} ({magnitude}N)
                  </text>
                </>
              ) : (
                <>
                  {/* Forces Addition in Preview */}
                  {forces.map((f, i) => {
                    const fRad = (f.angleDegrees * Math.PI) / 180;
                    const scale = maxVisualLen / 50;
                    const tipX = cx + f.magnitude * scale * Math.cos(fRad);
                    const tipY = cy - f.magnitude * scale * Math.sin(fRad);
                    return (
                      <g key={f.id || i}>
                        <line x1={cx} y1={cy} x2={tipX} y2={tipY} stroke={f.color} strokeWidth="2.5" />
                        <circle cx={tipX} cy={tipY} r="3.5" fill={f.color} />
                        <text
                          x={tipX + 10 * Math.cos(fRad)}
                          y={tipY - 10 * Math.sin(fRad)}
                          fill={f.color}
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {f.name} ({f.magnitude}N)
                        </text>
                      </g>
                    );
                  })}

                  {/* Resultant Arrow */}
                  {(() => {
                    const rRad = (resultantCalc.angleDegrees * Math.PI) / 180;
                    const scale = maxVisualLen / 50;
                    const rTipX = cx + resultantCalc.magnitude * scale * Math.cos(rRad);
                    const rTipY = cy - resultantCalc.magnitude * scale * Math.sin(rRad);
                    return (
                      <g>
                        <line x1={cx} y1={cy} x2={rTipX} y2={rTipY} stroke="#f43f5e" strokeWidth="3.5" />
                        <circle cx={rTipX} cy={rTipY} r="5" fill="#f43f5e" />
                        <text
                          x={rTipX + 12 * Math.cos(rRad)}
                          y={rTipY - 12 * Math.sin(rRad)}
                          fill="#f43f5e"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          R = {resultantCalc.magnitude}N @ {resultantCalc.angleDegrees}°
                        </text>
                      </g>
                    );
                  })()}
                </>
              )}
            </svg>
          </div>

          {/* Mode 1: Single Vector Controls */}
          {mode === 'forceVector' ? (
            <div className="vector-controls-grid" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-form-group">
                  <label>Force Magnitude (|F| in Newtons)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    value={magnitude}
                    onChange={(e) => setMagnitude(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>

                <div className="modal-form-group">
                  <label>Vector Angle (θ in degrees)</label>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    step="1"
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Angle Preset Buttons */}
              <div className="preset-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center' }}>Presets:</span>
                {[0, 30, 45, 60, 90, 120, 135, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    className={`preset-btn ${angle === deg ? 'active' : ''}`}
                    onClick={() => setAngle(deg)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      background: angle === deg ? '#0284c7' : '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 6,
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    {deg}°
                  </button>
                ))}
              </div>

              {/* Resolved Components Pill */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600 }}>
                    Horizontal Component Fx = {magnitude} · cos({angle}°) = {fx} N
                  </div>
                  <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                    Vertical Component Fy = {magnitude} · sin({angle}°) = {fy} N
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showComponents}
                    onChange={(e) => setShowComponents(e.target.checked)}
                  />
                  Show Projections
                </label>
              </div>
            </div>
          ) : (
            /* Mode 2: Resultant Addition Controls */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>Component Forces to Add:</span>
                {forces.length < 4 && (
                  <button
                    onClick={handleAddForce}
                    style={{
                      background: 'rgba(2, 132, 199, 0.2)',
                      border: '1px solid #0284c7',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Vector
                  </button>
                )}
              </div>

              {forces.map((f, idx) => (
                <div
                  key={f.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: 8,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: f.color }} />
                  <span style={{ fontSize: 13, fontWeight: 'bold', width: 30 }}>{f.name}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Mag:</span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={f.magnitude}
                      onChange={(e) => handleUpdateForce(f.id, { magnitude: Number(e.target.value) || 0 })}
                      style={{ width: 65, padding: '4px', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#fff' }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>N</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Angle:</span>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={f.angleDegrees}
                      onChange={(e) => handleUpdateForce(f.id, { angleDegrees: Number(e.target.value) || 0 })}
                      style={{ width: 65, padding: '4px', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#fff' }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>°</span>
                  </div>
                  {forces.length > 2 && (
                    <button
                      onClick={() => handleRemoveForce(f.id)}
                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: 14 }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Calculated Resultant Summary */}
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: '#f43f5e', fontWeight: 'bold' }}>
                    Resultant Vector R = {resultantCalc.magnitude} N @ {resultantCalc.angleDegrees}°
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Rx = ∑Fx = {resultantCalc.rx} N | Ry = ∑Fy = {resultantCalc.ry} N
                  </div>
                </div>
                <span style={{ fontSize: 22 }}>📐</span>
              </div>
            </div>
          )}
        </div>

        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            style={{
              padding: '8px 22px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {existingShape ? 'Update Diagram' : 'Insert on Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
