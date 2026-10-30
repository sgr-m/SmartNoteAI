/**
 * Collaborative Number Line Modal (Section 16.1)
 * Interactive number line constructor with user-configurable range (min, max),
 * step interval, highlighted numbers, live SVG preview, and 1-click board placement.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface NumberLineModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
}

const PRESETS = [
  { label: '-5 to 5 (Standard)', min: -5, max: 5, step: 1, highlight: [0] },
  { label: '-10 to 10 (Expanded)', min: -10, max: 10, step: 1, highlight: [0] },
  { label: '0 to 10 (Counting / Whole)', min: 0, max: 10, step: 1, highlight: [0] },
  { label: '0 to 20 (Expanded)', min: 0, max: 20, step: 1, highlight: [0] },
  { label: '-20 to 20 (Wide, Step 2)', min: -20, max: 20, step: 2, highlight: [0] },
  { label: '-2 to 2 (Decimals, Step 0.5)', min: -2, max: 2, step: 0.5, highlight: [0] },
];

export function NumberLineModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
}: NumberLineModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [min, setMin] = useState<number>(existingShape?.params?.min ?? -5);
  const [max, setMax] = useState<number>(existingShape?.params?.max ?? 5);
  const [step, setStep] = useState<number>(existingShape?.params?.step ?? 1);
  const [highlightText, setHighlightText] = useState<string>(
    Array.isArray(existingShape?.params?.highlight)
      ? existingShape.params.highlight.join(', ')
      : '0'
  );
  const [strokeColor, setStrokeColor] = useState<string>(existingShape?.strokeColor || '#38bdf8');

  const currentPageIndex = docState.currentPageIndex;

  // Sanitized parameters
  const validMin = isNaN(min) ? -5 : Math.min(min, max - 1);
  const validMax = isNaN(max) ? 5 : Math.max(max, min + 1);
  const validStep = Math.max(0.01, isNaN(step) || step <= 0 ? 1 : step);

  const parsedHighlights = highlightText
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));

  const totalRange = validMax - validMin;
  const countOfValues = Math.floor(totalRange / validStep) + 1;

  const handleApplyPreset = (p: (typeof PRESETS)[0]) => {
    setMin(p.min);
    setMax(p.max);
    setStep(p.step);
    setHighlightText(p.highlight.join(', '));
  };

  const handleInsert = () => {
    const cleanLabel = `Number Line [${validMin}..${validMax}]`;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        strokeColor,
        label: cleanLabel,
        params: {
          ...existingShape.params,
          min: validMin,
          max: validMax,
          step: validStep,
          highlight: parsedHighlights,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const numberLineObj = createShape('numberLine', 180, 240, 640, 100, {
      strokeColor,
      strokeWidth: 2.5,
      params: {
        min: validMin,
        max: validMax,
        step: validStep,
        highlight: parsedHighlights,
      },
      label: cleanLabel,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      numberLineObj,
      `Insert Number Line [${validMin}..${validMax}]`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // SVG Preview Calculations
  const previewWidth = 520;
  const previewHeight = 110;
  const cy = previewHeight / 2;
  const margin = 36;
  const startX = margin;
  const endX = previewWidth - margin;
  const availableW = endX - startX;

  const labelInterval = countOfValues > 25 ? Math.ceil(countOfValues / 15) : 1;

  const ticks: { x: number; val: number; isZero: boolean; isHighlighted: boolean; showLabel: boolean }[] = [];
  let idx = 0;
  for (let v = validMin; v <= validMax + validStep * 0.001; v += validStep, idx++) {
    const norm = (v - validMin) / Math.max(0.1, totalRange);
    const tx = startX + norm * availableW;
    const isZero = Math.abs(v) < 1e-9;
    const isHighlighted = parsedHighlights.some((h) => Math.abs(h - v) < 1e-9);
    const showLabel = isZero || isHighlighted || idx % labelInterval === 0;
    ticks.push({ x: tx, val: v, isZero, isHighlighted, showLabel });
  }

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card number-line-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620 }}
      >
        <div className="submodal-header">
          <div className="submodal-title">
            <span>↔️</span>
            <div>
              <h3>Collaborative Number Line Constructor</h3>
              <p>Configure start and end numbers, step interval, and marked focus points</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Live SVG Preview */}
        <div
          className="plotter-preview-container"
          style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width={previewWidth} height={previewHeight} viewBox={`0 0 ${previewWidth} ${previewHeight}`}>
            {/* Main horizontal axis line */}
            <line
              x1={startX}
              y1={cy}
              x2={endX}
              y2={cy}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Left arrow */}
            <polyline
              points={`${startX + 10},${cy - 6} ${startX},${cy} ${startX + 10},${cy + 6}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right arrow */}
            <polyline
              points={`${endX - 10},${cy - 6} ${endX},${cy} ${endX - 10},${cy + 6}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Ticks and Labels */}
            {ticks.map((t, i) => {
              const tickH = t.isZero ? 13 : t.showLabel ? 8 : 5;
              const col = t.isHighlighted ? '#f59e0b' : strokeColor;
              return (
                <g key={i}>
                  <line
                    x1={t.x}
                    y1={cy - tickH}
                    x2={t.x}
                    y2={cy + tickH}
                    stroke={col}
                    strokeWidth={t.isZero || t.isHighlighted ? '2.5' : '1.5'}
                    strokeLinecap="round"
                  />
                  {t.showLabel && (
                    <text
                      x={t.x}
                      y={cy + tickH + 15}
                      textAnchor="middle"
                      fill={t.isHighlighted ? '#f59e0b' : '#94a3b8'}
                      fontSize={t.isZero || t.isHighlighted ? '12' : '10.5'}
                      fontWeight={t.isZero || t.isHighlighted ? '700' : '500'}
                      fontFamily="Inter, sans-serif"
                    >
                      {Number(t.val.toFixed(2))}
                    </text>
                  )}
                  {t.isHighlighted && (
                    <circle cx={t.x} cy={cy} r="4.5" fill="#f59e0b" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Range Controls */}
        <div className="submodal-content" style={{ marginTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Start Number (Min):</label>
              <input
                type="number"
                className="modal-number-input"
                value={min}
                onChange={(e) => setMin(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 10px' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>End Number (Max):</label>
              <input
                type="number"
                className="modal-number-input"
                value={max}
                onChange={(e) => setMax(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 10px' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Step Interval:</label>
              <input
                type="number"
                step="any"
                min="0.01"
                className="modal-number-input"
                value={step}
                onChange={(e) => setStep(parseFloat(e.target.value) || 1)}
                style={{ width: '100%', padding: '8px 10px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="form-group">
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                Highlight Focus Numbers (comma separated):
              </label>
              <input
                type="text"
                className="modal-text-input"
                placeholder="e.g. 0, 3, -2"
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value)}
                style={{ width: '100%', padding: '8px 10px' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Line Color:</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setStrokeColor(c)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: strokeColor === c ? '2.5px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Quick Range Presets:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="preset-pill"
                  onClick={() => handleApplyPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
            ℹ️ Number line will display <b>{countOfValues}</b> values from <b>{validMin}</b> to <b>{validMax}</b>.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="submodal-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleInsert}>
            {existingShape ? 'Update Number Line' : 'Insert on Board 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
