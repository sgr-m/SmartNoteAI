/**
 * Angle Construction Modal (Section 16.1)
 * Interactive angle constructor and protractor tool.
 * Enables setting, previewing, and adjusting angles (0° to 360°) with custom ray arms and annotations.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface AngleConstructionModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
}

const PRESET_ANGLES = [
  { label: '30° (Acute)', deg: 30 },
  { label: '45° (Acute)', deg: 45 },
  { label: '60° (Equilateral)', deg: 60 },
  { label: '90° (Right Angle)', deg: 90 },
  { label: '120° (Obtuse)', deg: 120 },
  { label: '135° (Obtuse)', deg: 135 },
  { label: '180° (Straight)', deg: 180 },
  { label: '270° (Reflex)', deg: 270 },
  { label: '360° (Full Circle)', deg: 360 },
];

const PRESET_COLORS = [
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'White', hex: '#ffffff' },
];

export function AngleConstructionModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
}: AngleConstructionModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [angle, setAngle] = useState<number>(
    existingShape?.params?.angle ?? 60
  );
  const [strokeColor, setStrokeColor] = useState<string>(
    existingShape?.strokeColor || '#38bdf8'
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(
    existingShape?.strokeWidth || 3
  );
  const [showTheta, setShowTheta] = useState<boolean>(true);

  const currentPageIndex = docState.currentPageIndex;

  const handleSave = () => {
    const label = showTheta ? `θ = ${angle}°` : `${angle}°`;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        strokeColor,
        strokeWidth,
        params: {
          ...existingShape.params,
          angle,
          label,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    // Adaptive bounding box based on angle
    const width = angle > 90 && angle < 270 ? 400 : 340;
    const height = angle > 180 ? 340 : 280;

    const angleObj = createShape('angleMeasurement', 240, 180, width, height, {
      strokeColor,
      strokeWidth,
      params: {
        angle,
        label,
      },
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      angleObj,
      `Insert ${angle}° Angle Construction`
    );
    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // Preview SVG parameters
  const svgSize = 280;
  const cx = svgSize / 2;
  const cy = angle > 180 ? svgSize / 2 : svgSize * 0.72;
  const armLen = 105;

  const rad = (angle * Math.PI) / 180;
  const rx = cx + armLen * Math.cos(rad);
  const ry = cy - armLen * Math.sin(rad);

  const arcR = 45;
  const isLargeArc = angle > 180 ? 1 : 0;
  const arcEndX = cx + arcR * Math.cos(rad);
  const arcEndY = cy - arcR * Math.sin(rad);

  const labelDist = arcR + 24;
  const midRad = -rad / 2;
  const labelX = cx + labelDist * Math.cos(midRad);
  const labelY = cy + labelDist * Math.sin(midRad);

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📐</span>
            <div>
              <h3>Angle Construction & Protractor</h3>
              <p>Construct, measure, and adjust angles with rays, vertex, and degree arc</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '16px 20px', background: '#0f172a' }}>
          {/* Left Column: Interactive Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Angle Slider & Number */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>Angle (Degrees):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(360, Number(e.target.value) || 0));
                      setAngle(val);
                    }}
                    style={{
                      width: 64,
                      background: '#1e293b',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 15,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>°</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                style={{ width: '100%', accentColor: strokeColor, cursor: 'pointer' }}
              />
            </div>

            {/* Quick Angle Presets */}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Common Angles:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESET_ANGLES.map((p) => (
                  <button
                    key={p.deg}
                    type="button"
                    onClick={() => setAngle(p.deg)}
                    style={{
                      background: angle === p.deg ? '#0284c7' : 'rgba(255, 255, 255, 0.06)',
                      border: angle === p.deg ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: angle === p.deg ? '#ffffff' : '#cbd5e1',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ray Color Picker */}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Ray Color:</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setStrokeColor(c.hex)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: c.hex,
                      border: strokeColor === c.hex ? '3px solid #ffffff' : '1px solid rgba(0,0,0,0.4)',
                      boxShadow: strokeColor === c.hex ? '0 0 8px ' + c.hex : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width & Label format */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={showTheta}
                  onChange={(e) => setShowTheta(e.target.checked)}
                />
                Include "θ =" in label
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Thickness:</span>
                {[2, 3, 4].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => setStrokeWidth(th)}
                    style={{
                      background: strokeWidth === th ? '#38bdf8' : '#1e293b',
                      color: strokeWidth === th ? '#0f172a' : '#cbd5e1',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {th}px
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual Protractor Dial */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={svgSize} height={svgSize} style={{ background: '#090d16', borderRadius: 10, border: '1px solid #1e293b' }}>
              {/* Circular protractor guide background */}
              <circle cx={cx} cy={cy} r={armLen} fill="none" stroke="#1e293b" strokeWidth={1.5} strokeDasharray="3,3" />

              {/* Angle guide ticks every 30 degrees */}
              {[0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330].map((deg) => {
                const tr = (deg * Math.PI) / 180;
                const inner = armLen - 6;
                const tx1 = cx + inner * Math.cos(tr);
                const ty1 = cy - inner * Math.sin(tr);
                const tx2 = cx + armLen * Math.cos(tr);
                const ty2 = cy - armLen * Math.sin(tr);
                return <line key={deg} x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#334155" strokeWidth={1} />;
              })}

              {/* Base Ray (0 deg) */}
              <line x1={cx} y1={cy} x2={cx + armLen} y2={cy} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              {/* Arrow on base ray */}
              <polygon
                points={`${cx + armLen + 6},${cy} ${cx + armLen - 2},${cy - 4} ${cx + armLen - 2},${cy + 4}`}
                fill={strokeColor}
              />

              {/* Angled Ray */}
              <line x1={cx} y1={cy} x2={rx} y2={ry} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              {/* Arrow on angled ray */}
              {angle !== 0 && (
                <polygon
                  points={`
                    ${rx + 6 * Math.cos(rad)},${ry - 6 * Math.sin(rad)}
                    ${rx + 4 * Math.cos(rad + 2.5)},${ry - 4 * Math.sin(rad + 2.5)}
                    ${rx + 4 * Math.cos(rad - 2.5)},${ry - 4 * Math.sin(rad - 2.5)}
                  `}
                  fill={strokeColor}
                />
              )}

              {/* Angle Arc or Right-Angle Box */}
              {angle === 90 ? (
                <path
                  d={`M ${cx + 18} ${cy} L ${cx + 18} ${cy - 18} L ${cx} ${cy - 18}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              ) : angle > 0 && angle < 360 ? (
                <path
                  d={`M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 ${isLargeArc} 0 ${arcEndX} ${arcEndY}`}
                  fill="rgba(245, 158, 11, 0.12)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              ) : angle === 360 ? (
                <circle cx={cx} cy={cy} r={arcR} fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth={2} />
              ) : null}

              {/* Vertex Dot */}
              <circle cx={cx} cy={cy} r={4.5} fill={strokeColor} />

              {/* Angle Label */}
              <text
                x={labelX}
                y={labelY}
                fill="#f59e0b"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {showTheta ? `θ = ${angle}°` : `${angle}°`}
              </text>
            </svg>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} type="button">
            📐 {existingShape ? 'Update Angle' : 'Insert Angle on Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
