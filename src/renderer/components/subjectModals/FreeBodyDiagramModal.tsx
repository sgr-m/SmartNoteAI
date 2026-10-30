/**
 * Interactive Free Body Diagram (FBD) Inspector & Builder Modal (Section 16.2)
 * Allows users to configure mass, applied force, friction coefficient, inclined plane angle,
 * normal force, and net acceleration with live SVG mechanics preview.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface FreeBodyDiagramModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
}

export function FreeBodyDiagramModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
}: FreeBodyDiagramModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  // Mechanics Parameters
  const [mass, setMass] = useState<number>(existingShape?.params?.mass ?? 5);
  const [appliedForce, setAppliedForce] = useState<number>(
    existingShape?.params?.appliedForce ?? 30
  );
  const [frictionCoeff, setFrictionCoeff] = useState<number>(
    existingShape?.params?.frictionCoeff ?? 0.3
  );
  const [inclineAngle, setInclineAngle] = useState<number>(
    existingShape?.params?.inclineAngle ?? 0
  );
  const [gravity, setGravity] = useState<number>(
    existingShape?.params?.gravity ?? 9.8
  );
  const [showComponents, setShowComponents] = useState<boolean>(
    existingShape?.params?.showComponents !== false
  );

  const currentPageIndex = docState.currentPageIndex;

  // Mechanical Physics Calculations
  const alphaRad = (inclineAngle * Math.PI) / 180;
  const weight = Number((mass * gravity).toFixed(1));
  const normalForce = Number((weight * Math.cos(alphaRad)).toFixed(1));
  const frictionForce = Number((frictionCoeff * normalForce).toFixed(1));
  const gravityParallel = Number((weight * Math.sin(alphaRad)).toFixed(1));
  const netForce = Number((appliedForce - frictionForce - gravityParallel).toFixed(1));
  const acceleration = mass > 0 ? Number((netForce / mass).toFixed(2)) : 0;

  const handleApplyPreset = (m: number, f: number, mu: number, angle: number) => {
    setMass(m);
    setAppliedForce(f);
    setFrictionCoeff(mu);
    setInclineAngle(angle);
  };

  const handleInsert = () => {
    const cleanLabel =
      inclineAngle > 0
        ? `FBD: m=${mass}kg @ ${inclineAngle}°, Fnet=${netForce}N, a=${acceleration}m/s²`
        : `Free Body Diagram: m=${mass}kg, Fnet=${netForce}N, a=${acceleration}m/s²`;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        label: cleanLabel,
        params: {
          ...existingShape.params,
          diagramType: 'freeBodyDiagram',
          mass,
          appliedForce,
          frictionCoeff,
          frictionForce,
          normalForce,
          weight,
          inclineAngle,
          gravity,
          netForce,
          acceleration,
          showComponents,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('physicsDiagram', 200, 160, 480, 390, {
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      label: cleanLabel,
      params: {
        diagramType: 'freeBodyDiagram',
        mass,
        appliedForce,
        frictionCoeff,
        frictionForce,
        normalForce,
        weight,
        inclineAngle,
        gravity,
        netForce,
        acceleration,
        showComponents,
      },
    });

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      'Insert Free Body Diagram'
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // SVG Preview Dimensions
  const previewW = 380;
  const previewH = 220;
  const cx = previewW / 2;
  const cy = previewH / 2 + 10;
  const blockW = 60;
  const blockH = 45;

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card free-body-diagram-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 660 }}
      >
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📦</span>
            <div>
              <h3>Free Body Diagram (FBD) Configuration</h3>
              <p>Configure mass, applied force, friction, incline angle, and net acceleration</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="submodal-body" style={{ padding: '16px 20px', maxHeight: '82vh', overflowY: 'auto' }}>
          {/* Quick Presets */}
          <div className="preset-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center' }}>Presets:</span>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset(5, 30, 0.3, 0)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: inclineAngle === 0 && frictionCoeff > 0 ? '#0284c7' : '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Horizontal (Flat)
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset(8, 50, 0.2, 30)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: inclineAngle === 30 ? '#0284c7' : '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Inclined Ramp (30°)
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset(5, 25, 0, 0)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: frictionCoeff === 0 ? '#0284c7' : '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Frictionless (Ice)
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
              Fnet = {netForce} N | a = {acceleration} m/s² | W = {weight} N | FN = {normalForce} N | fk = {frictionForce} N
            </div>

            <svg width={previewW} height={previewH} style={{ overflow: 'visible' }}>
              {/* Surface Line */}
              {inclineAngle === 0 ? (
                <>
                  <line x1={30} y1={cy + blockH / 2} x2={previewW - 30} y2={cy + blockH / 2} stroke="#64748b" strokeWidth="2" />
                  {/* Hatch lines */}
                  {[-80, -40, 0, 40, 80].map((dx, i) => (
                    <line key={i} x1={cx + dx} y1={cy + blockH / 2} x2={cx + dx - 8} y2={cy + blockH / 2 + 8} stroke="#475569" strokeWidth="1" />
                  ))}
                </>
              ) : (
                <>
                  {/* Incline Wedge */}
                  <polygon
                    points={`30,${cy + blockH / 2 + 40} ${previewW - 30},${cy + blockH / 2 + 40} ${previewW - 30},${cy - 20}`}
                    fill="rgba(56, 189, 248, 0.08)"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  <text x={70} y={cy + blockH / 2 + 30} fill="#facc15" fontSize="10" fontWeight="bold">
                    θ = {inclineAngle}°
                  </text>
                </>
              )}

              {/* Mass Block */}
              <g transform={inclineAngle > 0 ? `rotate(${-inclineAngle}, ${cx}, ${cy})` : undefined}>
                <rect
                  x={cx - blockW / 2}
                  y={cy - blockH / 2}
                  width={blockW}
                  height={blockH}
                  rx="4"
                  fill="rgba(56, 189, 248, 0.22)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy + 4}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  m = {mass}kg
                </text>

                {/* Normal Force Upward */}
                <line x1={cx} y1={cy - blockH / 2} x2={cx} y2={cy - blockH / 2 - 45} stroke="#10b981" strokeWidth="2.5" />
                <polygon points={`${cx},${cy - blockH / 2 - 50} ${cx - 4},${cy - blockH / 2 - 42} ${cx + 4},${cy - blockH / 2 - 42}`} fill="#10b981" />
                <text x={cx} y={cy - blockH / 2 - 54} fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">
                  FN={normalForce}N
                </text>

                {/* Applied Force Right */}
                {appliedForce > 0 && (
                  <>
                    <line x1={cx + blockW / 2} y1={cy} x2={cx + blockW / 2 + 45} y2={cy} stroke="#38bdf8" strokeWidth="2.5" />
                    <polygon points={`${cx + blockW / 2 + 50},${cy} ${cx + blockW / 2 + 42},${cy - 4} ${cx + blockW / 2 + 42},${cy + 4}`} fill="#38bdf8" />
                    <text x={cx + blockW / 2 + 54} y={cy + 4} fill="#38bdf8" fontSize="10" fontWeight="bold">
                      Fapp={appliedForce}N
                    </text>
                  </>
                )}

                {/* Friction Force Left */}
                {frictionForce > 0 && (
                  <>
                    <line x1={cx - blockW / 2} y1={cy} x2={cx - blockW / 2 - 40} y2={cy} stroke="#f59e0b" strokeWidth="2.5" />
                    <polygon points={`${cx - blockW / 2 - 45},${cy} ${cx - blockW / 2 - 37},${cy - 4} ${cx - blockW / 2 - 37},${cy + 4}`} fill="#f59e0b" />
                    <text x={cx - blockW / 2 - 48} y={cy + 4} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="end">
                      fk={frictionForce}N
                    </text>
                  </>
                )}
              </g>

              {/* Gravity / Weight Arrow Downward */}
              <line x1={cx} y1={cy + blockH / 2} x2={cx} y2={cy + blockH / 2 + 48} stroke="#f43f5e" strokeWidth="2.5" />
              <polygon points={`${cx},${cy + blockH / 2 + 53} ${cx - 4},${cy + blockH / 2 + 45} ${cx + 4},${cy + blockH / 2 + 45}`} fill="#f43f5e" />
              <text x={cx} y={cy + blockH / 2 + 64} fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">
                W=mg={weight}N
              </text>
            </svg>
          </div>

          {/* Parameter Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="modal-form-group">
              <label>Mass (m in kg)</label>
              <input
                type="number"
                min="0.5"
                max="500"
                step="0.5"
                value={mass}
                onChange={(e) => setMass(Math.max(0.1, Number(e.target.value) || 0.1))}
              />
            </div>

            <div className="modal-form-group">
              <label>Applied Push/Pull Force (F_app in N)</label>
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={appliedForce}
                onChange={(e) => setAppliedForce(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            <div className="modal-form-group">
              <label>Kinetic Friction Coeff (μ_k)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={frictionCoeff}
                onChange={(e) => setFrictionCoeff(Math.max(0, Math.min(1, Number(e.target.value) || 0)))}
              />
            </div>

            <div className="modal-form-group">
              <label>Incline Angle (α in degrees: 0° = Flat)</label>
              <input
                type="number"
                min="0"
                max="60"
                step="5"
                value={inclineAngle}
                onChange={(e) => setInclineAngle(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
              />
            </div>
          </div>

          {/* Equation summary card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              marginTop: 14,
            }}
          >
            <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600 }}>
              Newton&apos;s 2nd Law: F_net = F_app − f_k − mg·sin(α) = {netForce} N
            </div>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
              Acceleration a = F_net / m = {netForce} N / {mass} kg = {acceleration} m/s²
            </div>
          </div>
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
