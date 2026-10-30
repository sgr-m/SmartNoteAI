/**
 * Element Card (Bohr / Info) Modal (Section 16.3)
 * Interactive element picker for all 118 elements with live SVG placard preview,
 * category filters, electron configurations, and whiteboard canvas placement.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PERIODIC_ELEMENTS, ChemicalElement, ElementCategory } from '../../services/subjectModules/chemistryModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface ElementCardModalProps {
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

// Popular classroom teaching elements for 1-click selection
const QUICK_ELEMENTS = [
  'H', 'He', 'Li', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ca',
  'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'U'
];

export function ElementCardModal({
  onClose,
  existingShape,
  onUpdateShape,
  onInsertSuccess,
}: ElementCardModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const initialElement =
    (existingShape?.params?.element as ChemicalElement) ||
    PERIODIC_ELEMENTS.find((e) => e.number === (existingShape?.params?.atomicNumber ?? 6)) ||
    PERIODIC_ELEMENTS[5]; // Carbon default

  const [selectedElement, setSelectedElement] = useState<ChemicalElement>(initialElement);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showConfig, setShowConfig] = useState(true);
  const [showShells, setShowShells] = useState(true);

  const currentPageIndex = docState.currentPageIndex;

  const filteredElements = PERIODIC_ELEMENTS.filter((el) => {
    if (selectedCategory !== 'all' && el.category !== selectedCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      String(el.number) === q
    );
  });

  const catColor = CATEGORY_COLORS[selectedElement.category] || '#38bdf8';

  const handleSave = () => {
    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        label: `${selectedElement.name} (${selectedElement.symbol}) - Z=${selectedElement.number}`,
        strokeColor: catColor,
        params: {
          ...existingShape.params,
          element: selectedElement,
          mode: 'card',
          showConfig,
          showShells,
        },
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const card = createShape('periodicElement', 240, 180, 240, 280, {
      params: {
        element: selectedElement,
        mode: 'card',
        showConfig,
        showShells,
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

  const handleInsertBohrModel = () => {
    const bohr = createShape('atomicModel', 240, 160, 360, 360, {
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

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card resistor-modal"
        style={{ maxWidth: 900, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="submodal-header" style={{ padding: '12px 20px', flexShrink: 0 }}>
          <div className="submodal-title">
            <span>📇</span>
            <div>
              <h3>{existingShape ? 'Edit Element Placard Card' : 'Select Element Placard / Bohr Model'}</h3>
              <p>Choose any of the 118 chemical elements to place as an info placard or Bohr atomic model</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{
                background: '#0284c7',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
              onClick={handleInsertBohrModel}
              title={`Place Bohr Atomic Model for ${selectedElement.name} on board`}
            >
              ⚛️ Place Bohr Model ({selectedElement.symbol}) 🚀
            </button>
            <button className="submodal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Quick Classroom Element Chips */}
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
          {QUICK_ELEMENTS.map((sym) => {
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

        {/* Search & Category Filter */}
        <div className="periodic-filter-bar">
          <input
            type="text"
            className="periodic-search-input"
            placeholder="Search element name, symbol, or Z (e.g. Iron, Fe, 26)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="periodic-category-pills">
            <button
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All (118)
            </button>
            <button
              className={`cat-pill ${selectedCategory === 'nonmetal' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('nonmetal')}
            >
              Nonmetals
            </button>
            <button
              className={`cat-pill ${selectedCategory === 'nobleGas' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('nobleGas')}
            >
              Noble Gases
            </button>
            <button
              className={`cat-pill ${selectedCategory === 'alkali' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('alkali')}
            >
              Alkali
            </button>
            <button
              className={`cat-pill ${selectedCategory === 'transitionMetal' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('transitionMetal')}
            >
              Transition
            </button>
            <button
              className={`cat-pill ${selectedCategory === 'lanthanide' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('lanthanide')}
            >
              Lanthanides
            </button>
            <button
              className={`cat-pill ${selectedCategory === 'actinide' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('actinide')}
            >
              Actinides
            </button>
          </div>
        </div>

        {/* Modal Body: Element List & Preview Placard */}
        <div style={{ display: 'flex', flex: 1, minHeight: '380px', maxHeight: '520px', background: '#0b1120' }}>
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

          {/* Right Preview & Config Options */}
          <div style={{ width: '340px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            {/* Primary Placement Action Buttons (Always Visible at Top of Inspector) */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                className="btn btn-primary"
                style={{
                  flex: 1.2,
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
                onClick={handleInsertBohrModel}
                title={`Place Bohr Atomic Model for ${selectedElement.name} on board`}
              >
                ⚛️ Bohr Model 🚀
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
                onClick={handleSave}
                title={`Place Element Card for ${selectedElement.name} on board`}
              >
                📇 Place Card
              </button>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>
                Live Canvas Placard Preview
              </div>

              {/* Placard Preview Box */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.94)',
                  border: `2px solid ${catColor}`,
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 0 16px rgba(${parseInt(catColor.slice(1,3),16)}, ${parseInt(catColor.slice(3,5),16)}, ${parseInt(catColor.slice(5,7),16)}, 0.12)`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  <span>Z = {selectedElement.number}</span>
                  <span>{selectedElement.mass.toFixed(3)} u</span>
                </div>
                <div style={{ fontSize: '46px', fontWeight: 800, color: catColor, margin: '6px 0' }}>
                  {selectedElement.symbol}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                  {selectedElement.name}
                </div>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.06)',
                  color: catColor,
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginTop: '4px',
                }}>
                  {selectedElement.category.toUpperCase()}
                </div>

                <div style={{ marginTop: '14px', textAlign: 'left', fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Group / Period:</span>
                    <b>Grp {selectedElement.group} · Per {selectedElement.period}</b>
                  </div>
                  {showConfig && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Electron Config:</span>
                      <b style={{ color: '#f59e0b' }}>{selectedElement.electronConfig}</b>
                    </div>
                  )}
                  {showShells && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Shells [K..Q]:</span>
                      <b style={{ color: '#38bdf8' }}>[{selectedElement.electronsPerShell.join(', ')}]</b>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showConfig}
                    onChange={(e) => setShowConfig(e.target.checked)}
                  />
                  <span>Display Electron Configuration</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showShells}
                    onChange={(e) => setShowShells(e.target.checked)}
                  />
                  <span>Display Shells Distribution</span>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1.4, background: '#0284c7', fontSize: '12px', fontWeight: 700 }}
                onClick={handleInsertBohrModel}
              >
                ⚛️ Place Bohr Model 🚀
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1.2, background: 'rgba(30, 41, 59, 0.85)', fontSize: '12px', fontWeight: 600 }}
                onClick={handleSave}
              >
                {existingShape ? 'Update Card' : 'Place Card'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
