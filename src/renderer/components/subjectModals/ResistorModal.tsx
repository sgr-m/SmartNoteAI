/**
 * Resistor & Variable Rheostat Configuration Modal (Section 16.2)
 * Allows users to configure resistance value (Ω, kΩ, MΩ), tolerance,
 * switch between fixed resistor and variable rheostat, with live SVG preview.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface ResistorModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
  defaultMode?: 'resistor' | 'rheostat';
}

const PRESET_VALUES = [
  { label: '10 Ω', value: 10, unit: 'Ω' },
  { label: '47 Ω', value: 47, unit: 'Ω' },
  { label: '100 Ω', value: 100, unit: 'Ω' },
  { label: '220 Ω', value: 220, unit: 'Ω' },
  { label: '330 Ω', value: 330, unit: 'Ω' },
  { label: '470 Ω', value: 470, unit: 'Ω' },
  { label: '1 kΩ', value: 1, unit: 'kΩ' },
  { label: '4.7 kΩ', value: 4.7, unit: 'kΩ' },
  { label: '10 kΩ', value: 10, unit: 'kΩ' },
  { label: '100 kΩ', value: 100, unit: 'kΩ' },
  { label: '1 MΩ', value: 1, unit: 'MΩ' },
];

export function ResistorModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
  defaultMode = 'resistor',
}: ResistorModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const isInitialRheostat =
    existingShape?.params?.componentType === 'rheostat' || defaultMode === 'rheostat';

  const [componentType, setComponentType] = useState<'resistor' | 'rheostat'>(
    isInitialRheostat ? 'rheostat' : 'resistor'
  );

  const [resistance, setResistance] = useState<number>(
    existingShape?.params?.resistance ?? (isInitialRheostat ? 100 : 220)
  );
  const [unit, setUnit] = useState<string>(existingShape?.params?.unit || 'Ω');

  // Rheostat range settings
  const [maxResistance, setMaxResistance] = useState<number>(
    existingShape?.params?.maxResistance ?? 100
  );

  const [strokeColor, setStrokeColor] = useState<string>(
    existingShape?.strokeColor || '#38bdf8'
  );

  const currentPageIndex = docState.currentPageIndex;

  const displayLabel =
    componentType === 'rheostat'
      ? `Rheostat (0 - ${maxResistance} ${unit})`
      : `R = ${resistance} ${unit}`;

  const handleInsert = () => {
    const cleanLabel = displayLabel;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        strokeColor,
        label: cleanLabel,
        params: {
          ...existingShape.params,
          componentType,
          resistance: Number(resistance) || 0,
          unit,
          maxResistance: componentType === 'rheostat' ? Number(maxResistance) || 100 : undefined,
          label: cleanLabel,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const shapeW = componentType === 'rheostat' ? 180 : 160;
    const shapeH = componentType === 'rheostat' ? 80 : 60;

    const resistorObj = createShape('circuitComponent', 240, 220, shapeW, shapeH, {
      strokeColor,
      strokeWidth: 2.5,
      label: cleanLabel,
      params: {
        componentType,
        resistance: Number(resistance) || 0,
        unit,
        maxResistance: componentType === 'rheostat' ? Number(maxResistance) || 100 : undefined,
        label: cleanLabel,
      },
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      resistorObj,
      `Insert ${cleanLabel}`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card resistor-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540 }}
      >
        <div className="submodal-header">
          <div className="submodal-title">
            <span>{componentType === 'rheostat' ? '🎚️' : '⚡'}</span>
            <div>
              <h3>{componentType === 'rheostat' ? 'Variable Resistor (Rheostat)' : 'Resistor Configuration'}</h3>
              <p>Configure resistance value, multiplier unit, and electrical schematic symbol</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Component Type Selector */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className={`gate-pill ${componentType === 'resistor' ? 'active' : ''}`}
            onClick={() => setComponentType('resistor')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>⚡</span>
            <span>Fixed Resistor</span>
          </button>
          <button
            type="button"
            className={`gate-pill ${componentType === 'rheostat' ? 'active' : ''}`}
            onClick={() => setComponentType('rheostat')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>🎚️</span>
            <span>Variable Resistor (Rheostat)</span>
          </button>
        </div>

        {/* Live Schematic SVG Preview */}
        <div
          style={{
            background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '24px 16px',
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="340" height="90" viewBox="0 0 340 90">
            {/* Label */}
            <text
              x="170"
              y="22"
              fill="#f8fafc"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
            >
              {displayLabel}
            </text>

            {/* Left Lead */}
            <line x1="30" y1="55" x2="90" y2="55" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />

            {/* Zigzag Resistor Body */}
            <path
              d="M 90 55 L 105 35 L 130 75 L 155 35 L 180 75 L 205 35 L 230 75 L 245 55 L 250 55"
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right Lead */}
            <line x1="250" y1="55" x2="310" y2="55" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />

            {/* Variable Rheostat Diagonal Arrow */}
            {componentType === 'rheostat' && (
              <g>
                <line
                  x1="110"
                  y1="82"
                  x2="228"
                  y2="24"
                  stroke="#f59e0b"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <polygon
                  points="234,20 220,24 226,34"
                  fill="#f59e0b"
                />
              </g>
            )}

            {/* Connection Terminals */}
            <circle cx="30" cy="55" r="4.5" fill={strokeColor} />
            <circle cx="310" cy="55" r="4.5" fill={strokeColor} />
          </svg>
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: componentType === 'rheostat' ? '1fr 1fr' : '2fr 1fr', gap: 12, marginTop: 14 }}>
          {componentType === 'resistor' ? (
            <>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Resistance Value:
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={resistance}
                  onChange={(e) => setResistance(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Unit:
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <option value="Ω">Ω (Ohms)</option>
                  <option value="kΩ">kΩ (Kilo-Ohms)</option>
                  <option value="MΩ">MΩ (Mega-Ohms)</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Max Range (0 to Max):
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxResistance}
                  onChange={(e) => setMaxResistance(parseFloat(e.target.value) || 100)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Unit:
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <option value="Ω">Ω (Ohms)</option>
                  <option value="kΩ">kΩ (Kilo-Ohms)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Quick Value Presets */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Standard E-Series Resistance Presets:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_VALUES.map((p) => (
              <button
                key={p.label}
                type="button"
                className="preset-pill"
                onClick={() => {
                  setResistance(p.value);
                  setUnit(p.unit);
                  if (componentType === 'rheostat') {
                    setMaxResistance(p.value);
                  }
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Color Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Symbol Color:</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ffffff'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setStrokeColor(c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: c,
                  border: strokeColor === c ? '2.5px solid #ffffff' : '1.5px solid transparent',
                  cursor: 'pointer',
                  boxShadow: strokeColor === c ? '0 0 8px ' + c : 'none',
                }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="submodal-actions" style={{ marginTop: 18 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleInsert}>
            {existingShape ? 'Update Resistor' : 'Insert on Board 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
