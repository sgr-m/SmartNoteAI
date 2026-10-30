/**
 * Cartesian Plane Setup Modal (Section 16.1)
 * Enables setting the number of values on X and Y axes, step size, grid lines, and dots before plotting on the board.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface CartesianPlaneModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
}

const PRESETS = [
  { label: '5 × 5 (Standard)', xMin: -5, xMax: 5, yMin: -5, yMax: 5, step: 1 },
  { label: '10 × 10 (Expanded)', xMin: -10, xMax: 10, yMin: -10, yMax: 10, step: 1 },
  { label: '15 × 15 (Wide)', xMin: -15, xMax: 15, yMin: -15, yMax: 15, step: 2 },
  { label: 'Quadrant 1 Only (0 to 10)', xMin: 0, xMax: 10, yMin: 0, yMax: 10, step: 1 },
  { label: 'Landscape (-10 to 10, -5 to 5)', xMin: -10, xMax: 10, yMin: -5, yMax: 5, step: 1 },
];

export function CartesianPlaneModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
}: CartesianPlaneModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [xMin, setXMin] = useState<number>(existingShape?.params?.xMin ?? -5);
  const [xMax, setXMax] = useState<number>(existingShape?.params?.xMax ?? 5);
  const [yMin, setYMin] = useState<number>(existingShape?.params?.yMin ?? -5);
  const [yMax, setYMax] = useState<number>(existingShape?.params?.yMax ?? 5);
  const [step, setStep] = useState<number>(existingShape?.params?.step ?? 1);
  const [showGrid, setShowGrid] = useState<boolean>(existingShape?.params?.showGrid !== false);
  const [showDots, setShowDots] = useState<boolean>(existingShape?.params?.showDots !== false);

  const currentPageIndex = docState.currentPageIndex;

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setXMin(p.xMin);
    setXMax(p.xMax);
    setYMin(p.yMin);
    setYMax(p.yMax);
    setStep(p.step);
  };

  const handleSave = () => {
    const validXMin = Math.min(xMin, xMax - 1);
    const validXMax = Math.max(xMax, xMin + 1);
    const validYMin = Math.min(yMin, yMax - 1);
    const validYMax = Math.max(yMax, yMin + 1);
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
          step: validStep,
          showGrid,
          showDots,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const axesObj = createShape('cartesianAxes', 220, 120, 520, 520, {
      fillColor: 'rgba(15, 23, 42, 0.92)',
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      params: {
        xMin: validXMin,
        xMax: validXMax,
        yMin: validYMin,
        yMax: validYMax,
        step: validStep,
        showGrid,
        showDots,
      },
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      axesObj,
      `Insert Cartesian Plane (${validXMin} to ${validXMax}, ${validYMin} to ${validYMax})`
    );
    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // SVG Preview Calculations
  const previewSize = 280;
  const pad = 36;
  const plotW = previewSize - pad * 2;
  const plotH = previewSize - pad * 2;

  const validXRange = Math.max(1, xMax - xMin);
  const validYRange = Math.max(1, yMax - yMin);

  const mapX = (val: number) => pad + ((val - xMin) / validXRange) * plotW;
  const mapY = (val: number) => pad + plotH - ((val - yMin) / validYRange) * plotH;

  const originX = mapX(0);
  const originY = mapY(0);

  // Ticks along X
  const xTicks: number[] = [];
  const safeStep = Math.max(0.5, step);
  for (let val = Math.ceil(xMin / safeStep) * safeStep; val <= xMax; val += safeStep) {
    xTicks.push(val);
  }

  // Ticks along Y
  const yTicks: number[] = [];
  for (let val = Math.ceil(yMin / safeStep) * safeStep; val <= yMax; val += safeStep) {
    yTicks.push(val);
  }

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card" style={{ maxWidth: 660 }} onClick={(e) => e.stopPropagation()}>
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📈</span>
            <div>
              <h3>Cartesian Coordinate Plane (X-Y) Setup</h3>
              <p>Configure number of values, intervals, grid mesh, and coordinate points</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, padding: '16px 20px', background: '#0f172a' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick Presets */}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Grid Presets:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      background: xMin === p.xMin && xMax === p.xMax && yMin === p.yMin && yMax === p.yMax
                        ? '#0284c7'
                        : 'rgba(255, 255, 255, 0.06)',
                      border: xMin === p.xMin && xMax === p.xMax && yMin === p.yMin && yMax === p.yMax
                        ? '1px solid #38bdf8'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      color: xMin === p.xMin && xMax === p.xMax && yMin === p.yMin && yMax === p.yMax ? '#ffffff' : '#cbd5e1',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* X-Axis Number of Values / Range */}
            <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>X-Axis Range & Values:</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Total: {validXRange} units ({xTicks.length} ticks)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8' }}>X Min:</label>
                  <input
                    type="number"
                    value={xMin}
                    onChange={(e) => setXMin(Number(e.target.value))}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8' }}>X Max:</label>
                  <input
                    type="number"
                    value={xMax}
                    onChange={(e) => setXMax(Number(e.target.value))}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Y-Axis Number of Values / Range */}
            <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>Y-Axis Range & Values:</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Total: {validYRange} units ({yTicks.length} ticks)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8' }}>Y Min:</label>
                  <input
                    type="number"
                    value={yMin}
                    onChange={(e) => setYMin(Number(e.target.value))}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8' }}>Y Max:</label>
                  <input
                    type="number"
                    value={yMax}
                    onChange={(e) => setYMax(Number(e.target.value))}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Step Interval & Display Options */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#94a3b8' }}>Step:</label>
                <select
                  value={step}
                  onChange={(e) => setStep(Number(e.target.value))}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}
                >
                  <option value={1}>1 (Every unit)</option>
                  <option value={2}>2 (Every 2 units)</option>
                  <option value={5}>5 (Every 5 units)</option>
                  <option value={10}>10 (Every 10 units)</option>
                </select>
              </div>

              <label style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                Grid Lines
              </label>

              <label style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={showDots} onChange={(e) => setShowDots(e.target.checked)} />
                Points
              </label>
            </div>
          </div>

          {/* Live SVG Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={previewSize} height={previewSize} style={{ background: '#090d16', borderRadius: 10, border: '1px solid #1e293b' }}>
              {/* Outer boundary */}
              <rect x={pad} y={pad} width={plotW} height={plotH} fill="none" stroke="#1e293b" />

              {/* Grid Lines */}
              {showGrid && (
                <>
                  {xTicks.map((val) => {
                    if (val === 0) return null;
                    const gx = mapX(val);
                    return <line key={`gx-${val}`} x1={gx} y1={pad} x2={gx} y2={pad + plotH} stroke="rgba(56, 189, 248, 0.18)" strokeDasharray="2,2" />;
                  })}
                  {yTicks.map((val) => {
                    if (val === 0) return null;
                    const gy = mapY(val);
                    return <line key={`gy-${val}`} x1={pad} y1={gy} x2={pad + plotW} y2={gy} stroke="rgba(56, 189, 248, 0.18)" strokeDasharray="2,2" />;
                  })}
                </>
              )}

              {/* Grid Points */}
              {showDots && (
                <>
                  {xTicks.map((vx) =>
                    yTicks.map((vy) => {
                      if (vx === 0 && vy === 0) return null;
                      const px = mapX(vx);
                      const py = mapY(vy);
                      return <circle key={`dot-${vx}-${vy}`} cx={px} cy={py} r={1.5} fill="rgba(56, 189, 248, 0.5)" />;
                    })
                  )}
                </>
              )}

              {/* Primary X Axis */}
              {originY >= pad && originY <= pad + plotH && (
                <>
                  <line x1={pad - 10} y1={originY} x2={pad + plotW + 10} y2={originY} stroke="#38bdf8" strokeWidth={2} />
                  {/* Arrowheads */}
                  <polygon points={`${pad + plotW + 14},${originY} ${pad + plotW + 6},${originY - 4} ${pad + plotW + 6},${originY + 4}`} fill="#38bdf8" />
                  <polygon points={`${pad - 14},${originY} ${pad - 6},${originY - 4} ${pad - 6},${originY + 4}`} fill="#38bdf8" />
                  <text x={pad + plotW + 18} y={originY + 4} fill="#38bdf8" fontSize="10" fontWeight="bold">X</text>
                </>
              )}

              {/* Primary Y Axis */}
              {originX >= pad && originX <= pad + plotW && (
                <>
                  <line x1={originX} y1={pad + plotH + 10} x2={originX} y2={pad - 10} stroke="#38bdf8" strokeWidth={2} />
                  {/* Arrowheads */}
                  <polygon points={`${originX},${pad - 14} ${originX - 4},${pad - 6} ${originX + 4},${pad - 6}`} fill="#38bdf8" />
                  <polygon points={`${originX},${pad + plotH + 14} ${originX - 4},${pad + plotH + 6} ${originX + 4},${pad + plotH + 6}`} fill="#38bdf8" />
                  <text x={originX} y={pad - 18} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">Y</text>
                </>
              )}

              {/* Origin Circle */}
              {originX >= pad && originX <= pad + plotW && originY >= pad && originY <= pad + plotH && (
                <circle cx={originX} cy={originY} r={3} fill="#f59e0b" />
              )}

              {/* Ticks and Numbers on X Axis */}
              {originY >= pad && originY <= pad + plotH && (
                xTicks.map((val) => {
                  if (val === 0) return null;
                  const tx = mapX(val);
                  return (
                    <React.Fragment key={`xt-${val}`}>
                      <line x1={tx} y1={originY - 3} x2={tx} y2={originY + 3} stroke="#38bdf8" strokeWidth={1.5} />
                      <text x={tx} y={originY + 12} fill="#cbd5e1" fontSize="9" textAnchor="middle">{val}</text>
                    </React.Fragment>
                  );
                })
              )}

              {/* Ticks and Numbers on Y Axis */}
              {originX >= pad && originX <= pad + plotW && (
                yTicks.map((val) => {
                  if (val === 0) return null;
                  const ty = mapY(val);
                  return (
                    <React.Fragment key={`yt-${val}`}>
                      <line x1={originX - 3} y1={ty} x2={originX + 3} stroke="#38bdf8" strokeWidth={1.5} />
                      <text x={originX - 6} y={ty + 3} fill="#cbd5e1" fontSize="9" textAnchor="end">{val}</text>
                    </React.Fragment>
                  );
                })
              )}
            </svg>
            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              Grid: [{xMin}, {xMax}] × [{yMin}, {yMax}] (Step: {step})
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} type="button">
            📈 {existingShape ? 'Update Cartesian Plane' : 'Insert Cartesian Plane onto Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
