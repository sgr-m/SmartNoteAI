/**
 * Kinematic Projectile Motion Diagram Inspector & Builder Modal (Section 16.2)
 * Allows users to configure launch velocity (v0), launch angle (θ), gravity (g),
 * calculates range, maximum peak height, flight time, and plots the parabolic trajectory.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { calculateProjectileMotion } from '../../services/subjectModules/physicsModule';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface MotionDiagramModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
}

export function MotionDiagramModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
}: MotionDiagramModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  // Kinematic Parameters
  const [initialVelocity, setInitialVelocity] = useState<number>(
    existingShape?.params?.initialVelocity ?? 25
  );
  const [angle, setAngle] = useState<number>(
    existingShape?.params?.angle ?? 45
  );
  const [gravity, setGravity] = useState<number>(
    existingShape?.params?.gravity ?? 9.81
  );
  const [showVelocityVectors, setShowVelocityVectors] = useState<boolean>(
    existingShape?.params?.showVelocityVectors !== false
  );

  const currentPageIndex = docState.currentPageIndex;

  // Real-time kinematic calculations
  const motionData = calculateProjectileMotion(initialVelocity, angle, gravity);

  const handleApplyPreset = (v0: number, ang: number, g: number) => {
    setInitialVelocity(v0);
    setAngle(ang);
    setGravity(g);
  };

  const handleInsert = () => {
    const cleanLabel = `Projectile: v0=${initialVelocity}m/s, θ=${angle}°, Range=${motionData.range}m`;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        label: cleanLabel,
        params: {
          ...existingShape.params,
          diagramType: 'motionDiagram',
          initialVelocity,
          angle,
          gravity,
          flightTime: motionData.flightTime,
          maxHeight: motionData.maxHeight,
          range: motionData.range,
          trajectory: motionData.trajectoryPoints,
          showVelocityVectors,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('physicsDiagram', 200, 160, 520, 370, {
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      label: cleanLabel,
      params: {
        diagramType: 'motionDiagram',
        initialVelocity,
        angle,
        gravity,
        flightTime: motionData.flightTime,
        maxHeight: motionData.maxHeight,
        range: motionData.range,
        trajectory: motionData.trajectoryPoints,
        showVelocityVectors,
      },
    });

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      'Insert Kinematic Motion Diagram'
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
  const originX = 45;
  const groundY = previewH - 35;
  const plotW = previewW - originX - 40;
  const plotH = groundY - 35;

  const maxR = Math.max(1, motionData.range);
  const maxH = Math.max(1, motionData.maxHeight);

  // Map trajectory coordinates to SVG space
  const svgPathD = motionData.trajectoryPoints
    .map((p, idx) => {
      const svgX = originX + (p.x / maxR) * plotW;
      const svgY = groundY - (p.y / maxH) * plotH;
      return `${idx === 0 ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
    })
    .join(' ');

  const apexX = originX + plotW / 2;
  const apexY = groundY - plotH;
  const launchRad = (angle * Math.PI) / 180;

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card motion-diagram-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 660 }}
      >
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🎢</span>
            <div>
              <h3>Kinematic Motion & Projectile Trajectory</h3>
              <p>2D parabolic motion simulation, flight time, maximum height, and horizontal range</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="submodal-body" style={{ padding: '16px 20px', maxHeight: '82vh', overflowY: 'auto' }}>
          {/* Preset Buttons */}
          <div className="preset-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center' }}>Presets:</span>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset(25, 45, 9.81)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: angle === 45 && gravity > 9 ? '#0284c7' : '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              45° Max Range (Earth)
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset(35, 30, 9.81)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: angle === 30 ? '#0284c7' : '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              30° Flat Throw
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset(30, 60, 9.81)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: angle === 60 ? '#0284c7' : '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              60° High Arc
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset(15, 45, 1.62)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: gravity < 2 ? '#0284c7' : '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              🌕 Moon Trajectory (1.62 m/s²)
            </button>
          </div>

          {/* Real-time SVG Graph Preview */}
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
              v0 = {initialVelocity} m/s | θ = {angle}° | Range = {motionData.range} m | Hmax = {motionData.maxHeight} m | Time = {motionData.flightTime} s
            </div>

            <svg width={previewW} height={previewH} style={{ overflow: 'visible' }}>
              {/* Axes */}
              <line x1={originX} y1={groundY} x2={previewW - 20} y2={groundY} stroke="#475569" strokeWidth="2" />
              <line x1={originX} y1={groundY} x2={originX} y2={25} stroke="#475569" strokeWidth="1.5" />
              <text x={previewW - 14} y={groundY + 4} fill="#64748b" fontSize="10">x</text>
              <text x={originX - 10} y={20} fill="#64748b" fontSize="10">y</text>

              {/* Peak Height Dashed Line */}
              <line x1={apexX} y1={groundY} x2={apexX} y2={apexY} stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={apexX} cy={apexY} r="3.5" fill="#facc15" />
              <text x={apexX + 6} y={apexY - 6} fill="#facc15" fontSize="10" fontWeight="bold">
                Hmax = {motionData.maxHeight}m
              </text>

              {/* Trajectory Parabolic Curve */}
              <path d={svgPathD} fill="none" stroke="#38bdf8" strokeWidth="3" />

              {/* Launch Angle Arc */}
              <path
                d={`M ${originX + 22} ${groundY} A 22 22 0 0 0 ${
                  originX + 22 * Math.cos(launchRad)
                } ${groundY - 22 * Math.sin(launchRad)}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
              />
              <text x={originX + 28} y={groundY - 8} fill="#10b981" fontSize="10" fontWeight="bold">
                {angle}°
              </text>

              {/* Launch Velocity Vector Arrow */}
              {showVelocityVectors && (
                <>
                  <line
                    x1={originX}
                    y1={groundY}
                    x2={originX + 45 * Math.cos(launchRad)}
                    y2={groundY - 45 * Math.sin(launchRad)}
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`${originX + 48 * Math.cos(launchRad)},${groundY - 48 * Math.sin(launchRad)} ${
                      originX + 40 * Math.cos(launchRad) - 4 * Math.sin(launchRad)
                    },${groundY - 40 * Math.sin(launchRad) - 4 * Math.cos(launchRad)} ${
                      originX + 40 * Math.cos(launchRad) + 4 * Math.sin(launchRad)
                    },${groundY - 40 * Math.sin(launchRad) + 4 * Math.cos(launchRad)}`}
                    fill="#f43f5e"
                  />
                  <text
                    x={originX + 50 * Math.cos(launchRad)}
                    y={groundY - 50 * Math.sin(launchRad)}
                    fill="#f43f5e"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    v0={initialVelocity}m/s
                  </text>
                </>
              )}

              {/* Range Marker */}
              <circle cx={originX + plotW} cy={groundY} r="4" fill="#38bdf8" />
              <text x={originX + plotW} y={groundY + 16} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                R = {motionData.range}m
              </text>
            </svg>
          </div>

          {/* Form Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="modal-form-group">
              <label>Initial Velocity (v0 in m/s)</label>
              <input
                type="number"
                min="1"
                max="200"
                step="1"
                value={initialVelocity}
                onChange={(e) => setInitialVelocity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            <div className="modal-form-group">
              <label>Launch Angle (θ in degrees)</label>
              <input
                type="number"
                min="5"
                max="85"
                step="5"
                value={angle}
                onChange={(e) => setAngle(Math.max(1, Math.min(89, Number(e.target.value) || 1)))}
              />
            </div>

            <div className="modal-form-group">
              <label>Gravity (g in m/s²)</label>
              <input
                type="number"
                min="0.5"
                max="30"
                step="0.1"
                value={gravity}
                onChange={(e) => setGravity(Math.max(0.1, Number(e.target.value) || 9.81))}
              />
            </div>
          </div>

          {/* Kinematics Formula Summary Card */}
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
              Range = (v0² · sin(2θ)) / g = ({initialVelocity}² · sin({2 * angle}°)) / {gravity} = {motionData.range} m
            </div>
            <div style={{ fontSize: 12, color: '#facc15', fontWeight: 600, marginTop: 4 }}>
              Peak Height H_max = (v0 · sin(θ))² / (2g) = {motionData.maxHeight} m  |  Flight Time = {motionData.flightTime} s
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
