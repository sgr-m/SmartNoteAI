/**
 * Bohr Atomic Model Modal (Section 16.3)
 * Full interactive element selection across all 118 elements with live animated SVG Bohr model preview,
 * nucleus particle counts (p+, n0), concentric K..Q electron shells, and whiteboard canvas placement.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PERIODIC_ELEMENTS, ChemicalElement } from '../../services/subjectModules/chemistryModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface BohrModelModalProps {
  onClose: () => void;
  existingShape?: ShapeObject | null;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  alkali: '#f87171',
  alkalineEarth: '#fb923c',
  transitionMetal: '#facc15',
  postTransition: '#4ade80',
  metalloid: '#2dd4bf',
  nonmetal: '#38bdf8',
  halogen: '#818cf8',
  nobleGas: '#c084fc',
  lanthanide: '#f472b6',
  actinide: '#e879f9',
};

// Popular classroom atoms for 1-click selection
const POPULAR_ATOMS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Au'
];

export function BohrModelModal({
  onClose,
  existingShape,
  onUpdateShape,
  onInsertSuccess,
}: BohrModelModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const initialElement =
    (existingShape?.params?.symbol
      ? PERIODIC_ELEMENTS.find((e) => e.symbol === existingShape.params?.symbol)
      : null) ||
    PERIODIC_ELEMENTS.find((e) => e.number === (existingShape?.params?.atomicNumber ?? 8)) ||
    PERIODIC_ELEMENTS[7]; // Oxygen default (Z=8)

  const [selectedElement, setSelectedElement] = useState<ChemicalElement>(initialElement);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const currentPageIndex = docState.currentPageIndex;

  const filteredElements = PERIODIC_ELEMENTS.filter((el) => {
    if (activeCategory !== 'all' && el.category !== activeCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      String(el.number) === q
    );
  });

  const catColor = CATEGORY_COLORS[selectedElement.category] || '#38bdf8';
  const neutrons = Math.max(0, Math.round(selectedElement.mass - selectedElement.number));
  const shells = selectedElement.electronsPerShell;

  const handleSave = () => {
    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        label: `Bohr Model: ${selectedElement.name} (Z=${selectedElement.number})`,
        params: {
          ...existingShape.params,
          symbol: selectedElement.symbol,
          name: selectedElement.name,
          atomicNumber: selectedElement.number,
          mass: selectedElement.mass,
          electronsPerShell: selectedElement.electronsPerShell,
        },
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const bohr = createShape('atomicModel', 240, 160, 380, 380, {
      params: {
        symbol: selectedElement.symbol,
        name: selectedElement.name,
        atomicNumber: selectedElement.number,
        mass: selectedElement.mass,
        electronsPerShell: selectedElement.electronsPerShell,
      },
      strokeColor: '#38bdf8',
      strokeWidth: 1.5,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      label: `Bohr Model: ${selectedElement.name} (Z=${selectedElement.number})`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      bohr,
      `Insert Bohr Model: ${selectedElement.name}`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  const handleInsertCard = () => {
    const card = createShape('periodicElement', 240, 180, 240, 280, {
      params: {
        element: selectedElement,
        mode: 'card',
        showConfig: true,
        showShells: true,
      },
      strokeColor: catColor,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      label: `${selectedElement.name} (${selectedElement.symbol}) - Z=${selectedElement.number}`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      card,
      `Insert Element Card: ${selectedElement.name}`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // SVG Geometry calculations for Bohr preview (compacted so it never overflows)
  const svgSize = 240;
  const center = svgSize / 2;
  const nucRadius = Math.max(16, Math.min(24, 55 / Math.max(1, shells.length)));
  const maxRadius = center - 20;
  const radiusStep = (maxRadius - nucRadius - 6) / Math.max(1, shells.length);
  const shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card resistor-modal"
        style={{ maxWidth: 940, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="submodal-header" style={{ padding: '12px 20px', flexShrink: 0 }}>
          <div className="submodal-title">
            <span>⚛️</span>
            <div>
              <h3>{existingShape ? 'Edit Bohr Atomic Model' : 'Bohr Atomic Model Explorer'}</h3>
              <p>Select any of the 118 elements to visualize nucleus (protons & neutrons) and orbital electron shells</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{
                background: '#0284c7',
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
              onClick={handleSave}
            >
              ⚛️ {existingShape ? 'Update Bohr Model' : `Place Bohr Model (${selectedElement.symbol}) on Board 🚀`}
            </button>
            <button className="submodal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Popular Atoms Quick Bar */}
        <div style={{
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Quick Pick:</span>
          {POPULAR_ATOMS.map((sym) => {
            const el = PERIODIC_ELEMENTS.find((e) => e.symbol === sym);
            if (!el) return null;
            const isSel = selectedElement.symbol === sym;
            const cColor = CATEGORY_COLORS[el.category] || '#38bdf8';
            return (
              <button
                key={sym}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: `1px solid ${isSel ? '#ffffff' : cColor}`,
                  background: isSel ? cColor : 'rgba(30, 41, 59, 0.8)',
                  color: isSel ? '#0f172a' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setSelectedElement(el)}
              >
                {sym}
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="periodic-filter-bar">
          <input
            type="text"
            className="periodic-search-input"
            placeholder="Search element name, symbol, or Z (e.g. Oxygen, O, 8)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="periodic-category-pills">
            <button
              className={`cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All (118)
            </button>
            <button
              className={`cat-pill ${activeCategory === 'nonmetal' ? 'active' : ''}`}
              onClick={() => setActiveCategory('nonmetal')}
            >
              Nonmetals
            </button>
            <button
              className={`cat-pill ${activeCategory === 'nobleGas' ? 'active' : ''}`}
              onClick={() => setActiveCategory('nobleGas')}
            >
              Noble Gases
            </button>
            <button
              className={`cat-pill ${activeCategory === 'alkali' ? 'active' : ''}`}
              onClick={() => setActiveCategory('alkali')}
            >
              Alkali
            </button>
            <button
              className={`cat-pill ${activeCategory === 'transitionMetal' ? 'active' : ''}`}
              onClick={() => setActiveCategory('transitionMetal')}
            >
              Transition
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: '380px', maxHeight: '540px', background: '#0b1120' }}>
          {/* Scrollable Element Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="periodic-elements-grid">
              {filteredElements.map((el) => {
                const isSelected = selectedElement.number === el.number;
                const cColor = CATEGORY_COLORS[el.category] || '#38bdf8';
                return (
                  <div
                    key={el.number}
                    className={`periodic-cell ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? '#ffffff' : cColor,
                      boxShadow: isSelected ? `0 0 0 2px ${cColor}` : 'none',
                    }}
                    onClick={() => setSelectedElement(el)}
                  >
                    <span className="p-num">{el.number}</span>
                    <span className="p-sym" style={{ color: cColor }}>
                      {el.symbol}
                    </span>
                    <span className="p-name">{el.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Bohr Model SVG Visualization */}
          <div style={{ width: '380px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            {/* Direct placement button at top of inspector */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                className="btn btn-primary"
                style={{
                  flex: 1.4,
                  background: '#0284c7',
                  padding: '9px 12px',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  border: '1px solid #38bdf8',
                }}
                onClick={handleSave}
              >
                ⚛️ {existingShape ? 'Update Bohr Model' : `Place Bohr Model 🚀`}
              </button>
              <button
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: `1px solid ${catColor}`,
                  color: '#f8fafc',
                  padding: '9px 12px',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={handleInsertCard}
              >
                📇 Place Card
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                  {selectedElement.name} ({selectedElement.symbol})
                </span>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  Z = {selectedElement.number} · {selectedElement.mass.toFixed(1)} u
                </span>
              </div>

              {/* Interactive SVG Bohr Model Preview */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.96)',
                border: '1px solid #334155',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '6px',
              }}>
                <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
                  <defs>
                    <radialGradient id="nucGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
                    </radialGradient>
                    <filter id="electronGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Concentric Orbital Rings & Electrons */}
                  {shells.map((electronCount, sIdx) => {
                    const r = nucRadius + (sIdx + 1) * radiusStep;
                    const shellLetter = shellNames[sIdx] || `n=${sIdx + 1}`;
                    return (
                      <g key={sIdx}>
                        {/* Orbital ring */}
                        <circle
                          cx={center}
                          cy={center}
                          r={r}
                          fill="none"
                          stroke="rgba(56, 189, 248, 0.35)"
                          strokeWidth="1.2"
                          strokeDasharray="4 3"
                        />
                        {/* Shell tag */}
                        <text
                          x={center}
                          y={center - r - 3}
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {shellLetter}: {electronCount}e⁻
                        </text>

                        {/* Orbiting electrons */}
                        {Array.from({ length: electronCount }).map((_, eIdx) => {
                          const angle = (eIdx * 2 * Math.PI) / electronCount - Math.PI / 2;
                          const ex = center + r * Math.cos(angle);
                          const ey = center + r * Math.sin(angle);
                          return (
                            <circle
                              key={eIdx}
                              cx={ex}
                              cy={ey}
                              r="4"
                              fill="#38bdf8"
                              stroke="#ffffff"
                              strokeWidth="1"
                              filter="url(#electronGlow)"
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Central Nucleus */}
                  <circle
                    cx={center}
                    cy={center}
                    r={nucRadius}
                    fill="url(#nucGlow)"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                  />
                  <text
                    x={center}
                    y={center - 4}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {selectedElement.symbol}
                  </text>
                  <text
                    x={center}
                    y={center + 8}
                    fill="#fecdd3"
                    fontSize="8.5"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {selectedElement.number}p⁺ {neutrons}n⁰
                  </text>
                </svg>
              </div>

              {/* Quantum Shell Breakdown Table */}
              <div style={{ marginTop: '10px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {shells.map((count, idx) => {
                  const maxCapacity = 2 * (idx + 1) * (idx + 1);
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        minWidth: '40px',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '6px',
                        padding: '4px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>{shellNames[idx]}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>{count}</div>
                      <div style={{ fontSize: '8px', color: '#64748b' }}>/{maxCapacity}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1.5, background: '#0284c7', fontSize: '12px', fontWeight: 700 }}
                onClick={handleSave}
              >
                ⚛️ {existingShape ? 'Update Bohr Model' : 'Place Bohr Model 🚀'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, background: 'rgba(30, 41, 59, 0.85)', fontSize: '12px' }}
                onClick={handleInsertCard}
              >
                📇 Place Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
