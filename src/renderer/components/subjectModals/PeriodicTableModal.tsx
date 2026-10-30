/**
 * Interactive Periodic Table Modal (Section 16.3)
 * Full 118-element matrix, detailed elemental placard, Bohr atomic model preview,
 * single element card placement, and complete periodic table insertion onto whiteboard.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PERIODIC_ELEMENTS, ChemicalElement, ElementCategory } from '../../services/subjectModules/chemistryModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface PeriodicTableModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateShape?: (shape: ShapeObject) => void;
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

export function PeriodicTableModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateShape,
}: PeriodicTableModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  // Initialize selected element from existing shape or default to Carbon (Z=6)
  const initialElement =
    (existingShape?.params?.element as ChemicalElement) ||
    PERIODIC_ELEMENTS.find((e) => e.number === (existingShape?.params?.atomicNumber ?? 6)) ||
    PERIODIC_ELEMENTS[5];

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

  /**
   * Inserts the COMPLETE 118-element Periodic Table overview on board
   */
  const insertFullPeriodicTable = () => {
    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        width: existingShape.width < 800 ? 1040 : existingShape.width,
        height: existingShape.height < 500 ? 640 : existingShape.height,
        label: 'Periodic Table of the Elements (118 Elements)',
        params: {
          ...existingShape.params,
          mode: 'table',
        },
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const tableShape = createShape('periodicElement', 80, 60, 1040, 640, {
      params: { mode: 'table' },
      strokeColor: '#38bdf8',
      fillColor: 'rgba(15, 23, 42, 0.96)',
      label: 'Periodic Table of the Elements (118 Elements)',
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      tableShape,
      'Insert Complete Periodic Table (118 Elements)'
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  /**
   * Inserts single Element Card onto whiteboard
   */
  const insertElementCard = () => {
    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        label: `${selectedElement.name} (${selectedElement.symbol}) - Z=${selectedElement.number}`,
        strokeColor: CATEGORY_COLORS[selectedElement.category] || '#38bdf8',
        params: {
          ...existingShape.params,
          element: selectedElement,
          mode: 'card',
        },
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const card = createShape('periodicElement', 240, 180, 240, 280, {
      params: { element: selectedElement, mode: 'card' },
      strokeColor: CATEGORY_COLORS[selectedElement.category] || '#38bdf8',
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

  /**
   * Inserts Bohr Atomic Model onto whiteboard
   */
  const insertBohrModel = () => {
    const bohr = createShape('atomicModel', 240, 160, 360, 360, {
      params: {
        symbol: selectedElement.symbol,
        name: selectedElement.name,
        atomicNumber: selectedElement.number,
        mass: selectedElement.mass,
        electronsPerShell: selectedElement.electronsPerShell,
      },
      strokeColor: '#38bdf8',
      fillColor: 'rgba(15, 23, 42, 0.92)',
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

  const catColor = CATEGORY_COLORS[selectedElement.category] || '#38bdf8';

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card periodic-modal" style={{ maxWidth: 960, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Submodal Header */}
        <div className="submodal-header" style={{ padding: '12px 20px', flexShrink: 0 }}>
          <div className="submodal-title">
            <span>🧪</span>
            <div>
              <h3>Interactive Periodic Table of Elements</h3>
              <p>Explore 118 elements, inspect atomic structures, and insert Bohr models, placards, or the full table</p>
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
              }}
              onClick={insertBohrModel}
              title={`Place Bohr Atomic Model for ${selectedElement.name} on whiteboard`}
            >
              ⚛️ Place Bohr Model ({selectedElement.symbol}) 🚀
            </button>
            <button className="submodal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Action Header Banner with Direct Quick-Place Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px',
          background: 'rgba(56, 189, 248, 0.08)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          gap: '12px',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>
              Selected: <b style={{ color: catColor }}>{selectedElement.name} ({selectedElement.symbol}) · Z={selectedElement.number}</b>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onClick={insertBohrModel}
            >
              ⚛️ Place Bohr Model ({selectedElement.symbol})
            </button>
            <button
              className="btn btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onClick={insertElementCard}
            >
              📇 Place Card ({selectedElement.symbol})
            </button>
            <button
              className="btn btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onClick={insertFullPeriodicTable}
            >
              📋 Insert Full Table
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="periodic-filter-bar" style={{ flexShrink: 0, padding: '8px 20px' }}>
          <input
            type="text"
            className="periodic-search-input"
            placeholder="Search element name, symbol, or Z (e.g. Gold, Au, 79)..."
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
              className={`cat-pill ${activeCategory === 'alkalineEarth' ? 'active' : ''}`}
              onClick={() => setActiveCategory('alkalineEarth')}
            >
              Alkaline Earth
            </button>
            <button
              className={`cat-pill ${activeCategory === 'transitionMetal' ? 'active' : ''}`}
              onClick={() => setActiveCategory('transitionMetal')}
            >
              Transition
            </button>
            <button
              className={`cat-pill ${activeCategory === 'postTransition' ? 'active' : ''}`}
              onClick={() => setActiveCategory('postTransition')}
            >
              Post-Transition
            </button>
            <button
              className={`cat-pill ${activeCategory === 'metalloid' ? 'active' : ''}`}
              onClick={() => setActiveCategory('metalloid')}
            >
              Metalloids
            </button>
            <button
              className={`cat-pill ${activeCategory === 'halogen' ? 'active' : ''}`}
              onClick={() => setActiveCategory('halogen')}
            >
              Halogens
            </button>
            <button
              className={`cat-pill ${activeCategory === 'lanthanide' ? 'active' : ''}`}
              onClick={() => setActiveCategory('lanthanide')}
            >
              Lanthanides
            </button>
            <button
              className={`cat-pill ${activeCategory === 'actinide' ? 'active' : ''}`}
              onClick={() => setActiveCategory('actinide')}
            >
              Actinides
            </button>
          </div>
        </div>

        {/* Main Content: Element Matrix & Inspector */}
        <div className="periodic-body" style={{ flex: 1, minHeight: 0, height: 'auto', display: 'flex' }}>
          {/* Elements Matrix Grid */}
          <div className="periodic-matrix-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="periodic-elements-grid">
              {filteredElements.map((el) => {
                const isSelected = selectedElement.number === el.number;
                const cellCatColor = CATEGORY_COLORS[el.category] || '#38bdf8';
                return (
                  <div
                    key={el.number}
                    className={`periodic-cell ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? '#ffffff' : cellCatColor,
                      boxShadow: isSelected ? `0 0 0 2px ${cellCatColor}` : 'none',
                    }}
                    onClick={() => setSelectedElement(el)}
                  >
                    <span className="p-num">{el.number}</span>
                    <span className="p-sym" style={{ color: cellCatColor }}>
                      {el.symbol}
                    </span>
                    <span className="p-name">{el.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Element Inspector Placard */}
          <div className="periodic-inspector" style={{ width: 310, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Primary Placement Action Buttons (Always Visible at Top of Inspector) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary"
                style={{
                  background: '#0284c7',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
                onClick={insertBohrModel}
              >
                ⚛️ Place Bohr Model ({selectedElement.symbol}) 🚀
              </button>
              <button
                className="btn btn-secondary"
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  padding: '8px 14px',
                  fontWeight: 600,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={insertElementCard}
              >
                📇 Place Element Card ({selectedElement.symbol})
              </button>
            </div>

            {/* Visual Placard */}
            <div
              className="inspector-placard"
              style={{
                borderColor: catColor,
                padding: '12px',
                boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 0 16px rgba(${parseInt(catColor.slice(1,3),16)}, ${parseInt(catColor.slice(3,5),16)}, ${parseInt(catColor.slice(5,7),16)}, 0.1)`,
              }}
            >
              <div className="placard-top">
                <span className="placard-z" style={{ color: '#e2e8f0', fontWeight: 600 }}>Z = {selectedElement.number}</span>
                <span className="placard-mass">{selectedElement.mass.toFixed(3)} u</span>
              </div>
              <div
                className="placard-symbol"
                style={{ color: catColor, fontSize: '38px', margin: '2px 0' }}
              >
                {selectedElement.symbol}
              </div>
              <div className="placard-name" style={{ fontSize: '15px' }}>{selectedElement.name}</div>
              <div
                className="placard-category"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: catColor,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontWeight: 600,
                  fontSize: '10px',
                }}
              >
                {selectedElement.category.toUpperCase()}
              </div>

              <div className="placard-details" style={{ marginTop: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div className="detail-row">
                  <span>Group / Period:</span>
                  <b>Grp {selectedElement.group} · Per {selectedElement.period}</b>
                </div>
                <div className="detail-row">
                  <span>Electron Config:</span>
                  <b style={{ color: '#f59e0b' }}>{selectedElement.electronConfig}</b>
                </div>
                <div className="detail-row">
                  <span>Shells [K..Q]:</span>
                  <b style={{ color: '#38bdf8' }}>[{selectedElement.electronsPerShell.join(', ')}]</b>
                </div>
              </div>
            </div>

            {/* Bottom Full Table Placement Option */}
            <button
              className="btn btn-secondary"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                padding: '8px 12px',
                fontWeight: 600,
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: 'auto',
              }}
              onClick={insertFullPeriodicTable}
            >
              📋 Place Full 118-Element Table on Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


