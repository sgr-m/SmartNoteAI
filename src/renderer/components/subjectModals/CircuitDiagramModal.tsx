/**
 * Interactive Electrical Circuit Builder & Inspector Modal (Section 16.2)
 * Supports dynamic Series and Parallel circuit configurations, adding/editing
 * multiple electronic components (resistors, capacitors, inductors, bulbs, switches, meters),
 * custom battery voltage (V), resistance (Ω), current (A), Ohm's law calculations,
 * and live schematic preview.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

export interface CircuitComponentItem {
  id: string;
  type: 'resistor' | 'capacitor' | 'inductor' | 'lamp' | 'switch' | 'ammeter' | 'rheostat';
  value: number;
  unit: string;
  label: string;
  state?: 'open' | 'closed';
}

interface CircuitDiagramModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
  defaultMode?: 'seriesCircuit' | 'parallelCircuit';
}

const DEFAULT_SERIES_COMPONENTS: CircuitComponentItem[] = [
  { id: 'c1', type: 'resistor', value: 4, unit: 'Ω', label: 'R1' },
  { id: 'c2', type: 'ammeter', value: 0, unit: 'A', label: 'A' },
  { id: 'c3', type: 'switch', value: 0, unit: '', label: 'Switch', state: 'closed' },
];

const DEFAULT_PARALLEL_COMPONENTS: CircuitComponentItem[] = [
  { id: 'p1', type: 'resistor', value: 6, unit: 'Ω', label: 'R1' },
  { id: 'p2', type: 'resistor', value: 12, unit: 'Ω', label: 'R2' },
];

export function CircuitDiagramModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
  defaultMode = 'seriesCircuit',
}: CircuitDiagramModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const initialMode =
    (existingShape?.params?.diagramType as 'seriesCircuit' | 'parallelCircuit') || defaultMode;

  const [diagramType, setDiagramType] = useState<'seriesCircuit' | 'parallelCircuit'>(initialMode);

  // Power Source & Circuit Parameters
  const [voltage, setVoltage] = useState<number>(existingShape?.params?.voltage ?? 12);
  const [autoCalculate, setAutoCalculate] = useState<boolean>(
    existingShape?.params?.autoCalculate !== false
  );
  const [manualCurrent, setManualCurrent] = useState<number>(
    existingShape?.params?.current ?? 3
  );

  // Extra Educational Circuit Features
  const [showCurrentArrows, setShowCurrentArrows] = useState<boolean>(
    existingShape?.params?.showCurrentArrows !== false
  );
  const [showFormulas, setShowFormulas] = useState<boolean>(
    existingShape?.params?.showFormulas !== false
  );

  // Components List
  const initialComponents: CircuitComponentItem[] =
    Array.isArray(existingShape?.params?.components) && existingShape.params.components.length > 0
      ? existingShape.params.components
      : initialMode === 'parallelCircuit'
      ? DEFAULT_PARALLEL_COMPONENTS
      : existingShape?.params?.resistance
      ? [
          { id: 'c1', type: 'resistor', value: existingShape.params.resistance, unit: 'Ω', label: 'R1' },
          { id: 'c2', type: 'ammeter', value: 0, unit: 'A', label: 'A' },
          { id: 'c3', type: 'switch', value: 0, unit: '', label: 'Switch', state: 'closed' },
        ]
      : DEFAULT_SERIES_COMPONENTS;

  const [components, setComponents] = useState<CircuitComponentItem[]>(initialComponents);

  const currentPageIndex = docState.currentPageIndex;

  // Calculate Equivalent Resistance Req
  const resistorItems = components.filter(
    (c) => c.type === 'resistor' || c.type === 'rheostat' || c.type === 'lamp'
  );

  let req = 0;
  if (diagramType === 'seriesCircuit') {
    req = resistorItems.reduce((sum, c) => sum + (c.value || 0), 0);
  } else {
    // Parallel
    const invSum = resistorItems.reduce((sum, c) => sum + (c.value > 0 ? 1 / c.value : 0), 0);
    req = invSum > 0 ? Number((1 / invSum).toFixed(2)) : 0;
  }

  // Calculate or override Total Current
  const computedCurrent = req > 0 ? Number((voltage / req).toFixed(3)) : 0;
  const current = autoCalculate ? computedCurrent : manualCurrent;
  const power = Number((voltage * current).toFixed(2));

  // Add Component to list
  const handleAddComponent = (type: CircuitComponentItem['type']) => {
    const count = components.filter((c) => c.type === type).length + 1;
    let val = 10;
    let unit = 'Ω';
    let label = `${type.toUpperCase()[0]}${count}`;

    if (type === 'capacitor') {
      val = 100;
      unit = 'µF';
      label = `C${count}`;
    } else if (type === 'inductor') {
      val = 10;
      unit = 'mH';
      label = `L${count}`;
    } else if (type === 'lamp') {
      val = 6;
      unit = 'Ω';
      label = `Bulb ${count}`;
    } else if (type === 'ammeter') {
      val = 0;
      unit = 'A';
      label = `A${count}`;
    } else if (type === 'switch') {
      val = 0;
      unit = '';
      label = 'Switch';
    } else if (type === 'rheostat') {
      val = 50;
      unit = 'Ω';
      label = `R_var ${count}`;
    }

    const newItem: CircuitComponentItem = {
      id: 'comp_' + Date.now() + Math.random().toString(36).substring(2, 5),
      type,
      value: val,
      unit,
      label,
      state: type === 'switch' ? 'closed' : undefined,
    };
    setComponents([...components, newItem]);
  };

  const handleRemoveComponent = (id: string) => {
    if (components.length <= 1) return;
    setComponents(components.filter((c) => c.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<CircuitComponentItem>) => {
    setComponents(
      components.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleInsert = () => {
    const isParallel = diagramType === 'parallelCircuit';
    const cleanLabel = isParallel
      ? `Parallel Circuit (V=${voltage}V, Req=${req}Ω, I=${current}A)`
      : `Series Circuit (V=${voltage}V, Req=${req}Ω, I=${current}A)`;

    const shapeW = isParallel ? 520 : 500;
    const shapeH = isParallel ? 360 : 330;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        label: cleanLabel,
        params: {
          ...existingShape.params,
          diagramType,
          voltage,
          resistance: req,
          current,
          autoCalculate,
          showCurrentArrows,
          showFormulas,
          components,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const circuitObj = createShape('physicsDiagram', 200, 160, shapeW, shapeH, {
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      label: cleanLabel,
      params: {
        diagramType,
        voltage,
        resistance: req,
        current,
        autoCalculate,
        showCurrentArrows,
        showFormulas,
        components,
      },
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      circuitObj,
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
        className="subject-submodal-card circuit-diagram-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 740, maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🔌</span>
            <div>
              <h3>Interactive Circuit Builder & Analyzer</h3>
              <p>Configure Series and Parallel circuits with editable electronic components, V, R, and A</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Mode Switcher: Series vs Parallel */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className={`gate-pill ${diagramType === 'seriesCircuit' ? 'active' : ''}`}
            onClick={() => {
              setDiagramType('seriesCircuit');
              if (components.length === 0) setComponents(DEFAULT_SERIES_COMPONENTS);
            }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>🔄</span>
            <span>Series Circuit Loop</span>
          </button>
          <button
            type="button"
            className={`gate-pill ${diagramType === 'parallelCircuit' ? 'active' : ''}`}
            onClick={() => {
              setDiagramType('parallelCircuit');
              if (components.length === 0) setComponents(DEFAULT_PARALLEL_COMPONENTS);
            }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>⏸️</span>
            <span>Parallel Branch Circuit</span>
          </button>
        </div>

        {/* Live Circuit Schematic SVG Preview */}
        <div
          style={{
            background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
            borderRadius: 12,
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: 12,
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 180,
          }}
        >
          <svg width="460" height="170" viewBox="0 0 460 170">
            {/* Header / Info Badge in SVG */}
            <text x="14" y="20" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="Inter, sans-serif">
              {diagramType === 'seriesCircuit' ? '⚡ Series Circuit' : '⚡ Parallel Circuit'}: V = {voltage}V | Req = {req}Ω | I = {current}A
            </text>

            {diagramType === 'seriesCircuit' ? (
              // ─── Series Circuit Preview ───
              <g>
                {/* Loop Rect Wire */}
                <rect x="50" y="40" width="360" height="100" rx="8" fill="none" stroke="#38bdf8" strokeWidth="2.5" />

                {/* Top: Battery */}
                <rect x="205" y="28" width="50" height="24" fill="#0f172a" />
                <line x1="220" y1="32" x2="220" y2="48" stroke="#38bdf8" strokeWidth="2" />
                <line x1="230" y1="36" x2="230" y2="44" stroke="#38bdf8" strokeWidth="4" />
                <text x="212" y="36" fill="#f8fafc" fontSize="10" fontWeight="bold">+</text>
                <text x="236" y="36" fill="#f8fafc" fontSize="10" fontWeight="bold">-</text>
                <text x="225" y="22" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">{voltage}V</text>

                {/* Bottom: Dynamic Components along wire */}
                {components.map((c, idx) => {
                  const segW = 320 / Math.max(1, components.length);
                  const cx = 70 + idx * segW + segW / 2;
                  const cy = 140;

                  return (
                    <g key={c.id}>
                      <rect x={cx - 24} y={cy - 14} width="48" height="28" fill="#0f172a" />
                      {c.type === 'resistor' && (
                        <path
                          d={`M ${cx - 20} ${cy} L ${cx - 13} ${cy - 8} L ${cx - 5} ${cy + 8} L ${cx + 3} ${cy - 8} L ${cx + 11} ${cy + 8} L ${cx + 20} ${cy}`}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.2"
                          strokeLinejoin="round"
                        />
                      )}
                      {c.type === 'rheostat' && (
                        <g>
                          <path
                            d={`M ${cx - 20} ${cy} L ${cx - 13} ${cy - 8} L ${cx - 5} ${cy + 8} L ${cx + 3} ${cy - 8} L ${cx + 11} ${cy + 8} L ${cx + 20} ${cy}`}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.2"
                          />
                          <line x1={cx - 14} y1={cy + 10} x2={cx + 14} y2={cy - 10} stroke="#f59e0b" strokeWidth="2" />
                          <polygon points={`${cx + 16},${cy - 12} ${cx + 10},${cy - 8} ${cx + 12},${cy - 4}`} fill="#f59e0b" />
                        </g>
                      )}
                      {c.type === 'capacitor' && (
                        <g>
                          <line x1={cx - 6} y1={cy - 12} x2={cx - 6} y2={cy + 12} stroke="#38bdf8" strokeWidth="2.5" />
                          <line x1={cx + 6} y1={cy - 12} x2={cx + 6} y2={cy + 12} stroke="#38bdf8" strokeWidth="2.5" />
                        </g>
                      )}
                      {c.type === 'inductor' && (
                        <path
                          d={`M ${cx - 18} ${cy} Q ${cx - 9} ${cy - 12} ${cx} ${cy} Q ${cx + 9} ${cy - 12} ${cx + 18} ${cy}`}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                      )}
                      {c.type === 'lamp' && (
                        <g>
                          <circle cx={cx} cy={cy} r="10" stroke="#facc15" strokeWidth="2" fill="none" />
                          <line x1={cx - 7} y1={cy - 7} x2={cx + 7} y2={cy + 7} stroke="#facc15" strokeWidth="2" />
                          <line x1={cx + 7} y1={cy - 7} x2={cx - 7} y2={cy + 7} stroke="#facc15" strokeWidth="2" />
                        </g>
                      )}
                      {c.type === 'switch' && (
                        <g>
                          <circle cx={cx - 12} cy={cy} r="3" fill="#38bdf8" />
                          <circle cx={cx + 12} cy={cy} r="3" fill="#38bdf8" />
                          <line
                            x1={cx - 12}
                            y1={cy}
                            x2={cx + (c.state === 'open' ? 6 : 12)}
                            y2={c.state === 'open' ? cy - 10 : cy}
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                          />
                        </g>
                      )}
                      {c.type === 'ammeter' && (
                        <g>
                          <circle cx={cx} cy={cy} r="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                          <text x={cx} y={cy + 3.5} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">A</text>
                        </g>
                      )}
                      {/* Component Label */}
                      <text x={cx} y={cy + 22} fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">
                        {c.label}: {c.value > 0 ? `${c.value}${c.unit}` : c.type}
                      </text>
                    </g>
                  );
                })}

                {/* Current Direction Arrow */}
                {showCurrentArrows && (
                  <g>
                    <polygon points="120,36 128,40 120,44" fill="#10b981" />
                    <text x="134" y="36" fill="#10b981" fontSize="10" fontWeight="bold">I = {current}A</text>
                  </g>
                )}
              </g>
            ) : (
              // ─── Parallel Circuit Preview ───
              <g>
                {/* Left supply rail */}
                <line x1="60" y1="50" x2="60" y2="130" stroke="#38bdf8" strokeWidth="2.5" />
                <rect x="46" y="78" width="28" height="24" fill="#0f172a" />
                <line x1="56" y1="82" x2="56" y2="98" stroke="#38bdf8" strokeWidth="2" />
                <line x1="64" y1="86" x2="64" y2="94" stroke="#38bdf8" strokeWidth="4" />
                <text x="36" y="94" fill="#38bdf8" fontSize="10" fontWeight="bold">{voltage}V</text>

                {/* Top Bus Wire */}
                <line x1="60" y1="50" x2="400" y2="50" stroke="#38bdf8" strokeWidth="2.5" />
                {/* Bottom Bus Wire */}
                <line x1="60" y1="130" x2="400" y2="130" stroke="#38bdf8" strokeWidth="2.5" />

                {/* Parallel Branches */}
                {components.map((c, idx) => {
                  const branchSpacing = 280 / Math.max(1, components.length);
                  const bx = 140 + idx * branchSpacing;
                  return (
                    <g key={c.id}>
                      {/* Top and Bottom Node Dots */}
                      <circle cx={bx} cy="50" r="4.5" fill="#38bdf8" />
                      <circle cx={bx} cy="130" r="4.5" fill="#38bdf8" />

                      {/* Branch Wire */}
                      <line x1={bx} y1="50" x2={bx} y2="130" stroke="#38bdf8" strokeWidth="2" />

                      {/* Branch Component */}
                      <rect x={bx - 18} y="74" width="36" height="32" fill="#0f172a" />
                      {c.type === 'resistor' && (
                        <path
                          d={`M ${bx} 74 L ${bx - 7} 79 L ${bx + 7} 85 L ${bx - 7} 91 L ${bx + 7} 97 L ${bx - 7} 101 L ${bx} 106`}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.2"
                        />
                      )}
                      {c.type === 'capacitor' && (
                        <g>
                          <line x1={bx - 10} y1="86" x2={bx + 10} y2="86" stroke="#38bdf8" strokeWidth="2.5" />
                          <line x1={bx - 10} y1="94" x2={bx + 10} y2="94" stroke="#38bdf8" strokeWidth="2.5" />
                        </g>
                      )}
                      {c.type === 'lamp' && (
                        <g>
                          <circle cx={bx} cy="90" r="10" stroke="#facc15" strokeWidth="2" fill="none" />
                          <line x1={bx - 6} y1="84" x2={bx + 6} y2="96" stroke="#facc15" strokeWidth="2" />
                          <line x1={bx + 6} y1="84" x2={bx - 6} y2="96" stroke="#facc15" strokeWidth="2" />
                        </g>
                      )}
                      {c.type !== 'resistor' && c.type !== 'capacitor' && c.type !== 'lamp' && (
                        <circle cx={bx} cy="90" r="8" fill="#0284c7" />
                      )}

                      {/* Branch Label & Current */}
                      <text x={bx + 16} y="88" fill="#f8fafc" fontSize="10" fontWeight="bold">
                        {c.label}: {c.value}{c.unit}
                      </text>
                      <text x={bx + 16} y="100" fill="#10b981" fontSize="9">
                        I = {(c.value > 0 ? (voltage / c.value).toFixed(2) : 0)}A
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        {/* Live Ohm's Law Status Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            marginTop: 12,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            textAlign: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Battery Voltage (V)</span>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#38bdf8' }}>{voltage} V</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Equivalent Req (Ω)</span>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#f59e0b' }}>{req} Ω</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Total Current (I)</span>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#10b981' }}>{current} A</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Electric Power (P)</span>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#ec4899' }}>{power} W</div>
          </div>
        </div>

        {/* Battery & Current Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              🔋 Battery / Source Voltage (V):
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={voltage}
                onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              {[5, 9, 12, 24].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="preset-pill"
                  onClick={() => setVoltage(v)}
                  style={{ padding: '4px 8px' }}
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                ⚡ Current (I in Ampere):
              </label>
              <label style={{ fontSize: 11, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoCalculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                  style={{ accentColor: '#38bdf8' }}
                />
                Auto (I=V/R)
              </label>
            </div>
            <input
              type="number"
              step="any"
              disabled={autoCalculate}
              value={current}
              onChange={(e) => setManualCurrent(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 6,
                border: '1px solid #334155',
                background: autoCalculate ? '#1e293b' : '#0f172a',
                color: autoCalculate ? '#94a3b8' : '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: autoCalculate ? 'not-allowed' : 'text',
              }}
            />
          </div>
        </div>

        {/* Components Manager */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 600 }}>
              Electronic Components in Circuit ({components.length}):
            </span>

            {/* Add Component Quick Buttons */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button type="button" className="preset-pill" onClick={() => handleAddComponent('resistor')} title="Add Resistor">
                + Resistor
              </button>
              <button type="button" className="preset-pill" onClick={() => handleAddComponent('capacitor')} title="Add Capacitor">
                + Capacitor
              </button>
              <button type="button" className="preset-pill" onClick={() => handleAddComponent('inductor')} title="Add Inductor">
                + Inductor
              </button>
              <button type="button" className="preset-pill" onClick={() => handleAddComponent('lamp')} title="Add Lamp">
                + Bulb
              </button>
              <button type="button" className="preset-pill" onClick={() => handleAddComponent('rheostat')} title="Add Variable Rheostat">
                + Rheostat
              </button>
              {diagramType === 'seriesCircuit' && (
                <>
                  <button type="button" className="preset-pill" onClick={() => handleAddComponent('ammeter')} title="Add Ammeter">
                    + Ammeter
                  </button>
                  <button type="button" className="preset-pill" onClick={() => handleAddComponent('switch')} title="Add Switch">
                    + Switch
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Component Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
            {components.map((c, index) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '6px 12px',
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 'bold', color: '#38bdf8', minWidth: 24 }}>
                  #{index + 1}
                </span>

                <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 80, textTransform: 'capitalize' }}>
                  {c.type === 'rheostat' ? 'Rheostat' : c.type}
                </span>

                {/* Label input */}
                <input
                  type="text"
                  value={c.label}
                  onChange={(e) => handleUpdateItem(c.id, { label: e.target.value })}
                  style={{
                    width: 70,
                    padding: '4px 6px',
                    borderRadius: 4,
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 12,
                  }}
                  title="Component designation label"
                />

                {/* Value input (if applicable) */}
                {c.type !== 'ammeter' && c.type !== 'switch' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={c.value}
                      onChange={(e) => handleUpdateItem(c.id, { value: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: 75,
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: 12,
                      }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.unit}</span>
                  </div>
                ) : c.type === 'switch' ? (
                  <button
                    type="button"
                    onClick={() => handleUpdateItem(c.id, { state: c.state === 'closed' ? 'open' : 'closed' })}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: c.state === 'closed' ? '#10b981' : '#f43f5e',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    State: {c.state || 'closed'}
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Inline Meter (A)</span>
                )}

                <div style={{ flex: 1 }} />

                <button
                  type="button"
                  onClick={() => handleRemoveComponent(c.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: '2px 6px',
                  }}
                  title="Remove Component"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showCurrentArrows}
              onChange={(e) => setShowCurrentArrows(e.target.checked)}
              style={{ accentColor: '#10b981' }}
            />
            <span>Show Current Flow Direction (I ➔)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showFormulas}
              onChange={(e) => setShowFormulas(e.target.checked)}
              style={{ accentColor: '#38bdf8' }}
            />
            <span>Show Ohm's Law Formula Card (V = I·R)</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="submodal-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleInsert}>
            {existingShape ? 'Update Circuit Diagram' : 'Insert Circuit Diagram on Board 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
