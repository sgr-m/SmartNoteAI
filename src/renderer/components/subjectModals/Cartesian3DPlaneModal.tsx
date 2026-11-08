/**
 * Cartesian 3D Plane Setup Modal (Mathematics Module)
 * Enables setting ranges for X, Y, and Z axes, step size, grid lines, ground plane,
 * and interactively rotating the 3D perspective before or after placing on the board.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface Cartesian3DPlaneModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
}

const PRESETS = [
  { label: '5 × 5 × 5 (Standard)', xMin: -5, xMax: 5, yMin: -5, yMax: 5, zMin: -5, zMax: 5, step: 1, rotX: 25, rotY: -35 },
  { label: '10 × 10 × 10 (Expanded)', xMin: -10, xMax: 10, yMin: -10, yMax: 10, zMin: -10, zMax: 10, step: 2, rotX: 25, rotY: -35 },
  { label: 'Octant 1 Only (0 to 10)', xMin: 0, xMax: 10, yMin: 0, yMax: 10, zMin: 0, zMax: 10, step: 1, rotX: 30, rotY: -45 },
  { label: 'Isometric View (30°, -45°)', xMin: -5, xMax: 5, yMin: -5, yMax: 5, zMin: -5, zMax: 5, step: 1, rotX: 30, rotY: -45 },
  { label: 'Top-Down Angle (65°, -30°)', xMin: -5, xMax: 5, yMin: -5, yMax: 5, zMin: -5, zMax: 5, step: 1, rotX: 65, rotY: -30 },
];

export function Cartesian3DPlaneModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
}: Cartesian3DPlaneModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [xMin, setXMin] = useState<number>(existingShape?.params?.xMin ?? -5);
  const [xMax, setXMax] = useState<number>(existingShape?.params?.xMax ?? 5);
  const [yMin, setYMin] = useState<number>(existingShape?.params?.yMin ?? -5);
  const [yMax, setYMax] = useState<number>(existingShape?.params?.yMax ?? 5);
  const [zMin, setZMin] = useState<number>(existingShape?.params?.zMin ?? -5);
  const [zMax, setZMax] = useState<number>(existingShape?.params?.zMax ?? 5);
  const [step, setStep] = useState<number>(existingShape?.params?.step ?? 1);
  const [showGrid, setShowGrid] = useState<boolean>(existingShape?.params?.showGrid !== false);
  const [showDots, setShowDots] = useState<boolean>(existingShape?.params?.showDots ?? false);
  const [showPlanes, setShowPlanes] = useState<boolean>(existingShape?.params?.showPlanes !== false);
  const [rotX, setRotX] = useState<number>(existingShape?.params?.rotX ?? 25); // Tilt / elevation
  const [rotY, setRotY] = useState<number>(existingShape?.params?.rotY ?? -35); // Yaw / azimuth

  const isDraggingPreviewRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 25,
    startRotY: -35,
  });

  const currentPageIndex = docState.currentPageIndex;

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setXMin(p.xMin);
    setXMax(p.xMax);
    setYMin(p.yMin);
    setYMax(p.yMax);
    setZMin(p.zMin);
    setZMax(p.zMax);
    setStep(p.step);
    setRotX(p.rotX);
    setRotY(p.rotY);
  };

  const handleSave = () => {
    const validXMin = Math.min(xMin, xMax - 1);
    const validXMax = Math.max(xMax, xMin + 1);
    const validYMin = Math.min(yMin, yMax - 1);
    const validYMax = Math.max(yMax, yMin + 1);
    const validZMin = Math.min(zMin, zMax - 1);
    const validZMax = Math.max(zMax, zMin + 1);
    const validStep = Math.max(0.5, step);

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        params: {
          ...existingShape.params,
          xMin: validXMin,
          xMax: validXMax,
          yMin: validYMin,
          yMax: validYMax,
          zMin: validZMin,
          zMax: validZMax,
          step: validStep,
          showGrid,
          showDots,
          showPlanes,
          rotX,
          rotY,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const planeObj = createShape('cartesian3DPlane', 220, 100, 560, 560, {
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      params: {
        xMin: validXMin,
        xMax: validXMax,
        yMin: validYMin,
        yMax: validYMax,
        zMin: validZMin,
        zMax: validZMax,
        step: validStep,
        showGrid,
        showDots,
        showPlanes,
        rotX,
        rotY,
      },
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      planeObj,
      `Insert 3D Coordinate Plane (${validXMin}..${validXMax}, ${validYMin}..${validYMax}, ${validZMin}..${validZMax})`
    );
    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // 3D Preview Projection
  const previewSize = 300;
  const cx = previewSize / 2;
  const cy = previewSize / 2 + 10;
  const maxRange = Math.max(1, xMax - xMin, yMax - yMin, zMax - zMin);
  const unitScale = (previewSize - 80) / (maxRange * 1.5);

  const radX = (rotX * Math.PI) / 180;
  const radY = (rotY * Math.PI) / 180;
  const cosY = Math.cos(radY);
  const sinY = Math.sin(radY);
  const cosX = Math.cos(radX);
  const sinX = Math.sin(radX);

  const project = (px: number, py: number, pz: number) => {
    const x1 = px * cosY + py * sinY;
    const y1 = -px * sinY + py * cosY;
    const z1 = pz;

    const x2 = x1;
    const z2 = y1 * sinX + z1 * cosX;

    return {
      x: cx + x2 * unitScale,
      y: cy - z2 * unitScale,
    };
  };

  const originPt = project(0, 0, 0);
  const xPosPt = project(xMax, 0, 0);
  const xNegPt = project(xMin, 0, 0);
  const yPosPt = project(0, yMax, 0);
  const yNegPt = project(0, yMin, 0);
  const zPosPt = project(0, 0, zMax);
  const zNegPt = project(0, 0, zMin);

  // XY Plane corners for SVG polygon
  const floorP1 = project(xMin, yMin, 0);
  const floorP2 = project(xMax, yMin, 0);
  const floorP3 = project(xMax, yMax, 0);
  const floorP4 = project(xMin, yMax, 0);

  // Preview interactive pointer dragging
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingPreviewRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingPreviewRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newRotY = ((dragStartRef.current.startRotY + dx * 0.7 + 180) % 360) - 180;
    const newRotX = Math.max(-85, Math.min(85, dragStartRef.current.startRotX - dy * 0.7));

    setRotY(Math.round(newRotY));
    setRotX(Math.round(newRotX));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    isDraggingPreviewRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card" style={{ maxWidth: 740 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🧊</span>
            <div>
              <h3>3D Cartesian Coordinate Plane (X-Y-Z) Setup</h3>
              <p>Configure 3D axes values, intervals, grid planes, and interactive rotation angles</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Modal Body */}
        <div className="submodal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Left: Configuration Inputs */}
          <div className="cartesian-config-col" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick Presets */}
            <div className="submodal-field-group">
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Quick Presets
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-pill-btn"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 6,
                      color: '#e2e8f0',
                      fontSize: 11,
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* X Axis Range */}
            <div className="submodal-field-group" style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(244, 63, 94, 0.25)' }}>
              <label style={{ color: '#f43f5e', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
                X-Axis Range (Red)
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Min:</span>
                  <input
                    type="number"
                    value={xMin}
                    onChange={(e) => setXMin(Number(e.target.value))}
                    className="submodal-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Max:</span>
                  <input
                    type="number"
                    value={xMax}
                    onChange={(e) => setXMax(Number(e.target.value))}
                    className="submodal-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            {/* Y Axis Range */}
            <div className="submodal-field-group" style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <label style={{ color: '#10b981', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Y-Axis Range (Green)
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Min:</span>
                  <input
                    type="number"
                    value={yMin}
                    onChange={(e) => setYMin(Number(e.target.value))}
                    className="submodal-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Max:</span>
                  <input
                    type="number"
                    value={yMax}
                    onChange={(e) => setYMax(Number(e.target.value))}
                    className="submodal-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            {/* Z Axis Range */}
            <div className="submodal-field-group" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <label style={{ color: '#38bdf8', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
                Z-Axis Range (Blue / Height)
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Min:</span>
                  <input
                    type="number"
                    value={zMin}
                    onChange={(e) => setZMin(Number(e.target.value))}
                    className="submodal-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Max:</span>
                  <input
                    type="number"
                    value={zMax}
                    onChange={(e) => setZMax(Number(e.target.value))}
                    className="submodal-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            {/* Step Size & Display Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Step Size:</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={step}
                  onChange={(e) => setStep(Math.max(0.5, Number(e.target.value)))}
                  className="submodal-input"
                  style={{ width: '100%', padding: '4px 8px', fontSize: 12, marginTop: 2 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                <label style={{ fontSize: 11, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  Show Grid Lines
                </label>
                <label style={{ fontSize: 11, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showPlanes}
                    onChange={(e) => setShowPlanes(e.target.checked)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  Show Ground Plane
                </label>
              </div>
            </div>

            {/* 3D Angle Sliders */}
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>
                <span>Tilt Elevation (Pitch): {rotX}°</span>
                <span style={{ color: '#94a3b8' }}>-80° to 80°</span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                value={rotX}
                onChange={(e) => setRotX(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4, accentColor: '#38bdf8' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginTop: 8 }}>
                <span>Azimuth Angle (Yaw): {rotY}°</span>
                <span style={{ color: '#94a3b8' }}>-180° to 180°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotY}
                onChange={(e) => setRotY(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4, accentColor: '#38bdf8' }}
              />
            </div>
          </div>

          {/* Right: Live Interactive 3D Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Live 3D Preview (Drag to Rotate)
            </span>

            <div
              style={{
                width: previewSize,
                height: previewSize,
                background: '#090d16',
                borderRadius: 12,
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'grab',
                touchAction: 'none',
              }}
            >
              <svg
                width={previewSize}
                height={previewSize}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                {/* XY Ground plane polygon */}
                {showPlanes && (
                  <polygon
                    points={`${floorP1.x},${floorP1.y} ${floorP2.x},${floorP2.y} ${floorP3.x},${floorP3.y} ${floorP4.x},${floorP4.y}`}
                    fill="rgba(56, 189, 248, 0.08)"
                    stroke="rgba(56, 189, 248, 0.3)"
                    strokeWidth="1"
                  />
                )}

                {/* X Axis Line */}
                <line x1={xNegPt.x} y1={xNegPt.y} x2={xPosPt.x} y2={xPosPt.y} stroke="#f43f5e" strokeWidth="2.5" />
                <circle cx={xPosPt.x} cy={xPosPt.y} r="3" fill="#f43f5e" />
                <text x={xPosPt.x + 8} y={xPosPt.y + 4} fill="#f43f5e" fontSize="13" fontWeight="bold" fontStyle="italic">x</text>

                {/* Y Axis Line */}
                <line x1={yNegPt.x} y1={yNegPt.y} x2={yPosPt.x} y2={yPosPt.y} stroke="#10b981" strokeWidth="2.5" />
                <circle cx={yPosPt.x} cy={yPosPt.y} r="3" fill="#10b981" />
                <text x={yPosPt.x + 8} y={yPosPt.y + 4} fill="#10b981" fontSize="13" fontWeight="bold" fontStyle="italic">y</text>

                {/* Z Axis Line */}
                <line x1={zNegPt.x} y1={zNegPt.y} x2={zPosPt.x} y2={zPosPt.y} stroke="#38bdf8" strokeWidth="2.5" />
                <circle cx={zPosPt.x} cy={zPosPt.y} r="3" fill="#38bdf8" />
                <text x={zPosPt.x} y={zPosPt.y - 8} fill="#38bdf8" fontSize="13" fontWeight="bold" fontStyle="italic" textAnchor="middle">z</text>

                {/* Origin Point O(0,0,0) */}
                <circle cx={originPt.x} cy={originPt.y} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <text x={originPt.x + 6} y={originPt.y + 12} fill="#fde68a" fontSize="10" fontWeight="bold">O</text>
              </svg>

              <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#64748b', pointerEvents: 'none' }}>
                Drag inside preview to spin 3D space
              </div>
            </div>

            {/* Quick Angle Reset Pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="preset-pill-btn"
                onClick={() => { setRotX(30); setRotY(-45); }}
                style={{ fontSize: 10, padding: '3px 7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer' }}
              >
                Isometric (30°, -45°)
              </button>
              <button
                type="button"
                className="preset-pill-btn"
                onClick={() => { setRotX(0); setRotY(0); }}
                style={{ fontSize: 10, padding: '3px 7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer' }}
              >
                Frontal (0°, 0°)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            💡 Teachers can rotate the 3D plane on the board at any time.
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="submodal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="submodal-insert-btn" onClick={handleSave}>
              {existingShape ? 'Update 3D Plane' : 'Place 3D Plane on Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

