/**
 * Karnaugh Map Modal (Digital Logic Teaching Platform)
 * Interactive designer for 2, 3, 4, and 5-variable Karnaugh Maps (K-Maps).
 * Traditional textbook styling with Gray code axes, diagonal split variable header,
 * decimal cell indices in bottom-right corner, custom variable naming (e.g. w,x,y,z),
 * Canonical SOP / POS generation, and blank exercise mode.
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  getKMapMintermIndex,
  createKMapGrid,
  getDefaultKMapVariableNames,
} from '../../services/subjectModules/digitalLogicModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface KarnaughMapModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

type KMapMode = 'blank' | 'sop' | 'pos';

export function KarnaughMapModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: KarnaughMapModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  const initialVars = Math.max(2, Math.min(5, Number(existingShape?.params?.variables) || 3));
  const [variables, setVariables] = useState<number>(initialVars);

  const initialVarNames = Array.isArray(existingShape?.params?.varNames) && existingShape.params.varNames.length >= initialVars
    ? existingShape.params.varNames
    : getDefaultKMapVariableNames(initialVars);

  const [varNamesStr, setVarNamesStr] = useState<string>(initialVarNames.join(', '));
  const [mode, setMode] = useState<KMapMode>((existingShape?.params?.form as KMapMode) || 'blank');
  const [sopMinterms, setSopMinterms] = useState<string>(existingShape?.params?.mintermStr || '');
  const [posMaxterms, setPosMaxterms] = useState<string>(existingShape?.params?.maxtermStr || '');
  const [dontCares, setDontCares] = useState<string>(existingShape?.params?.dontCareStr || '');
  const [unselectedAsBlank, setUnselectedAsBlank] = useState<boolean>(existingShape?.params?.unselectedAsBlank ?? false);
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);
  const [title, setTitle] = useState<string>(existingShape?.label || '');

  // Parse active variable names array
  const parsedVarNames = varNamesStr
    .split(/[, ]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const activeVarNames = Array.from(
    { length: variables },
    (_, i) => parsedVarNames[i] || getDefaultKMapVariableNames(variables)[i] || `V${i + 1}`
  );

  // 2D grid state (rows x cols)
  const [grid, setGrid] = useState<string[][]>(() => {
    if (Array.isArray(existingShape?.params?.grid)) {
      return existingShape.params.grid;
    }
    return createKMapGrid(initialVars, 'blank');
  });

  // When variables count changes, reset default variable names string and re-generate grid
  const handleVariableChange = (newVars: number) => {
    setVariables(newVars);
    const defaults = getDefaultKMapVariableNames(newVars);
    setVarNamesStr(defaults.join(', '));
    const newGrid = createKMapGrid(newVars, mode, parseIndices(sopMinterms), parseIndices(posMaxterms), parseIndices(dontCares), unselectedAsBlank);
    setGrid(newGrid);
  };

  function parseIndices(str: string): number[] {
    const matches = str.match(/\d+/g);
    if (!matches) return [];
    const maxIdx = (1 << variables) - 1;
    return matches.map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= maxIdx);
  }

  // Recompute grid when mode or SOP/POS expressions change
  const handleRegenerateGrid = (targetMode: KMapMode = mode, unselectedBlank: boolean = unselectedAsBlank) => {
    const mins = parseIndices(sopMinterms);
    const maxs = parseIndices(posMaxterms);
    const dcs = parseIndices(dontCares);
    const newGrid = createKMapGrid(variables, targetMode, mins, maxs, dcs, unselectedBlank);
    setGrid(newGrid);
  };

  // Interactive cell click: cycle Blank -> 1 -> 0 -> X -> Blank
  const handleCellClick = (r: number, c: number) => {
    setGrid((prevGrid) => {
      const nextGrid = prevGrid.map((row) => [...row]);
      const cur = nextGrid[r]?.[c] ?? '';
      let nextVal = '1';
      if (cur === '1') nextVal = '0';
      else if (cur === '0') nextVal = 'X';
      else if (cur === 'X' || cur === 'x') nextVal = '';
      else nextVal = '1';

      if (!nextGrid[r]) nextGrid[r] = [];
      nextGrid[r][c] = nextVal;
      return nextGrid;
    });
  };

  const handleSave = () => {
    const width = variables === 5 ? 780 : variables === 4 ? 460 : variables === 2 ? 340 : 440;
    const height = variables === 4 || variables === 5 ? 430 : 300;

    let canonicalExpr = '';
    if (mode === 'sop' && sopMinterms.trim()) {
      canonicalExpr = `F = ∑m(${parseIndices(sopMinterms).join(', ')})`;
      if (dontCares.trim()) canonicalExpr += ` + d(${parseIndices(dontCares).join(', ')})`;
    } else if (mode === 'pos' && posMaxterms.trim()) {
      canonicalExpr = `F = ∏M(${parseIndices(posMaxterms).join(', ')})`;
      if (dontCares.trim()) canonicalExpr += ` + d(${parseIndices(dontCares).join(', ')})`;
    }

    const computedTitle =
      title.trim() ||
      (canonicalExpr ? `${variables}-Var: ${canonicalExpr}` : `${variables}-Variable Karnaugh Map`);

    const params: any = {
      variables,
      varNames: activeVarNames,
      form: mode,
      mintermStr: sopMinterms,
      maxtermStr: posMaxterms,
      dontCareStr: dontCares,
      canonicalExpr,
      unselectedAsBlank,
      grid,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        label: computedTitle,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const kmapShape = createShape('karnaughMap', 200, 140, width, height, {
      params,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'rgba(15, 23, 42, 0.96)',
      label: computedTitle,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      kmapShape,
      `Insert ${variables}-Variable K-Map`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // Preview Grid Labels & Axis Coordinates
  const numRows = variables === 4 || variables === 5 ? 4 : 2;
  const numCols = variables === 2 ? 2 : variables === 5 ? 8 : 4;
  const rowLabels = variables === 4 || variables === 5 ? ['00', '01', '11', '10'] : ['0', '1'];
  const colLabels = variables === 2 ? ['0', '1'] : ['00', '01', '11', '10'];

  const rowVarText =
    variables === 2
      ? activeVarNames[0]
      : variables === 3
      ? activeVarNames[0]
      : variables === 5
      ? `${activeVarNames[1]}${activeVarNames[2]}`
      : `${activeVarNames[0]}${activeVarNames[1]}`;

  const colVarText =
    variables === 2
      ? activeVarNames[1]
      : variables === 3
      ? `${activeVarNames[1]}${activeVarNames[2]}`
      : variables === 5
      ? `${activeVarNames[3]}${activeVarNames[4]}`
      : `${activeVarNames[2]}${activeVarNames[3]}`;

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card"
        style={{ maxWidth: variables === 5 ? '860px' : '720px', maxHeight: '94vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🔲</span>
            <div>
              <h3>Karnaugh Map (K-Map) Designer</h3>
              <p>Textbook traditional styling with Gray code, cell decimal indices, and Canonical SOP / POS</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Top Control Bar: Variables, Variable Naming, Font Size */}
        <div className="cs-modal-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Number of Variables */}
          <div className="cs-toolbar-field" style={{ minWidth: '130px' }}>
            <label>Variables (N):</label>
            <select
              className="cs-modal-select"
              value={variables}
              onChange={(e) => handleVariableChange(Number(e.target.value))}
            >
              {[2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v} Variables ({1 << v} Minterms)
                </option>
              ))}
            </select>
          </div>

          {/* Variable Names */}
          <div className="cs-toolbar-field" style={{ flex: 1, minWidth: '160px' }}>
            <label>Variable Names (e.g. W, X, Y, Z):</label>
            <input
              type="text"
              className="cs-modal-input"
              value={varNamesStr}
              onChange={(e) => setVarNamesStr(e.target.value)}
              placeholder="A, B, C, D"
            />
          </div>

          {/* Font Size */}
          <div className="cs-toolbar-field" style={{ minWidth: '95px' }}>
            <label>Font Size:</label>
            <select
              className="cs-modal-select"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              {[11, 12, 14, 16, 18, 20, 24].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}px
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Selector Tabs: Blank / Canonical SOP / Canonical POS */}
        <div style={{ display: 'flex', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            className={`tab-btn ${mode === 'blank' ? 'active' : ''}`}
            onClick={() => {
              setMode('blank');
              handleRegenerateGrid('blank');
            }}
            style={{ flex: 1, padding: '10px 14px', borderBottom: mode === 'blank' ? '2px solid #38bdf8' : 'none' }}
          >
            📝 Blank K-Map (Exercise Mode)
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'sop' ? 'active' : ''}`}
            onClick={() => {
              setMode('sop');
              handleRegenerateGrid('sop');
            }}
            style={{ flex: 1, padding: '10px 14px', borderBottom: mode === 'sop' ? '2px solid #38bdf8' : 'none' }}
          >
            ➕ Canonical SOP (∑m)
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'pos' ? 'active' : ''}`}
            onClick={() => {
              setMode('pos');
              handleRegenerateGrid('pos');
            }}
            style={{ flex: 1, padding: '10px 14px', borderBottom: mode === 'pos' ? '2px solid #38bdf8' : 'none' }}
          >
            ✖️ Canonical POS (∏M)
          </button>
        </div>

        {/* Mode Specific Inputs */}
        {mode === 'sop' && (
          <div className="cs-modal-toolbar" style={{ background: '#0b1329', padding: '10px 20px', gap: 12 }}>
            <div className="cs-toolbar-field" style={{ flex: 2 }}>
              <label>Minterm Indices (∑m) e.g. 1, 3, 5, 7:</label>
              <input
                type="text"
                className="cs-modal-input"
                value={sopMinterms}
                onChange={(e) => setSopMinterms(e.target.value)}
                placeholder="1, 3, 5, 7"
              />
            </div>
            <div className="cs-toolbar-field" style={{ flex: 1 }}>
              <label>Don't Care (+ d) optional:</label>
              <input
                type="text"
                className="cs-modal-input"
                value={dontCares}
                onChange={(e) => setDontCares(e.target.value)}
                placeholder="0, 2"
              />
            </div>
            <div className="cs-toolbar-field" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="cs-action-btn-sm cs-action-btn-primary"
                onClick={() => handleRegenerateGrid('sop')}
                style={{ padding: '6px 14px' }}
              >
                Apply SOP
              </button>
            </div>
          </div>
        )}

        {mode === 'pos' && (
          <div className="cs-modal-toolbar" style={{ background: '#0b1329', padding: '10px 20px', gap: 12 }}>
            <div className="cs-toolbar-field" style={{ flex: 2 }}>
              <label>Maxterm Indices (∏M) e.g. 0, 2, 4, 6:</label>
              <input
                type="text"
                className="cs-modal-input"
                value={posMaxterms}
                onChange={(e) => setPosMaxterms(e.target.value)}
                placeholder="0, 2, 4, 6"
              />
            </div>
            <div className="cs-toolbar-field" style={{ flex: 1 }}>
              <label>Don't Care (+ d) optional:</label>
              <input
                type="text"
                className="cs-modal-input"
                value={dontCares}
                onChange={(e) => setDontCares(e.target.value)}
                placeholder="1, 5"
              />
            </div>
            <div className="cs-toolbar-field" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="cs-action-btn-sm cs-action-btn-primary"
                onClick={() => handleRegenerateGrid('pos')}
                style={{ padding: '6px 14px' }}
              >
                Apply POS
              </button>
            </div>
          </div>
        )}

        {/* Unselected Blank Toggle for SOP / POS */}
        {mode !== 'blank' && (
          <div style={{ padding: '4px 20px 8px', background: '#0b1329', display: 'flex', gap: 16 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#94a3b8' }}>
              <input
                type="checkbox"
                checked={unselectedAsBlank}
                onChange={(e) => {
                  setUnselectedAsBlank(e.target.checked);
                  handleRegenerateGrid(mode, e.target.checked);
                }}
                style={{ accentColor: '#38bdf8' }}
              />
              Leave unselected cells blank (instead of {mode === 'sop' ? '0' : '1'})
            </label>
          </div>
        )}

        {/* Live Interactive K-Map Grid Preview */}
        <div className="submodal-body" style={{ overflowY: 'auto', maxHeight: '420px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600 }}>
              💡 Live Interactive Preview (Click any cell to cycle Blank → 1 → 0 → X)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Subscripts indicate standard decimal minterm indices (m₀, m₁, m₂...)
            </div>
          </div>

          {variables === 5 ? (
            /* 5-Variable Dual Map Preview */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Map 1: V0 = 0 */}
              <div>
                <div style={{ textAlign: 'center', fontWeight: 700, color: '#38bdf8', padding: '4px 0', background: 'rgba(56,189,248,0.1)', borderRadius: 4, marginBottom: 6 }}>
                  {activeVarNames[0]} = 0 (Minterms 0 - 15)
                </div>
                {renderPreviewTable(0)}
              </div>

              {/* Map 2: V0 = 1 */}
              <div>
                <div style={{ textAlign: 'center', fontWeight: 700, color: '#38bdf8', padding: '4px 0', background: 'rgba(56,189,248,0.1)', borderRadius: 4, marginBottom: 6 }}>
                  {activeVarNames[0]} = 1 (Minterms 16 - 31)
                </div>
                {renderPreviewTable(4)}
              </div>
            </div>
          ) : (
            /* 2, 3, or 4-Variable Standard Preview */
            renderPreviewTable(0)
          )}
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Traditional textbook diagonal split ({rowVarText} \ {colVarText}) with Gray code ordering
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {existingShape ? 'Update K-Map' : 'Insert K-Map to Whiteboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Helper function to render a traditional K-Map preview table
   */
  function renderPreviewTable(colOffset: number) {
    return (
      <div
        style={{
          background: '#090d16',
          border: '1.5px solid #0284c7',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            textAlign: 'center',
          }}
        >
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1.5px solid #0284c7' }}>
              {/* Diagonal header cell */}
              <th
                style={{
                  width: '65px',
                  padding: '6px',
                  background: 'rgba(2, 132, 199, 0.25)',
                  borderRight: '1.5px solid #0284c7',
                  position: 'relative',
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                <div style={{ textAlign: 'right', color: '#38bdf8' }}>{colVarText}</div>
                <div style={{ textAlign: 'left', color: '#38bdf8' }}>{rowVarText}</div>
              </th>

              {/* Column Gray code headers */}
              {colLabels.map((cl, i) => (
                <th
                  key={i}
                  style={{
                    padding: '8px 12px',
                    color: '#fbbf24',
                    background: 'rgba(251, 191, 36, 0.1)',
                    borderRight: i < colLabels.length - 1 ? '1px solid rgba(255,255,255,0.18)' : 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {cl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rl, r) => (
              <tr key={r} style={{ borderBottom: r < rowLabels.length - 1 ? '1px solid rgba(255,255,255,0.18)' : 'none' }}>
                {/* Row Gray code header */}
                <td
                  style={{
                    padding: '10px 8px',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    borderRight: '1.5px solid #0284c7',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {rl}
                </td>

                {/* Data Cells */}
                {colLabels.map((_, c) => {
                  const actualCol = c + colOffset;
                  const val = grid[r]?.[actualCol] ?? '';
                  const mintermIdx = getKMapMintermIndex(variables, r, actualCol);

                  let cellColor = '#cbd5e1';
                  if (val === '1') cellColor = '#10b981';
                  else if (val === 'X' || val === 'x') cellColor = '#f59e0b';

                  return (
                    <td
                      key={c}
                      onClick={() => handleCellClick(r, actualCol)}
                      title={`Cell m${mintermIdx} - Click to cycle: Blank → 1 → 0 → X`}
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        position: 'relative',
                        background:
                          val === '1'
                            ? 'rgba(16, 185, 129, 0.16)'
                            : val === 'X' || val === 'x'
                            ? 'rgba(245, 158, 11, 0.16)'
                            : 'rgba(255,255,255,0.02)',
                        borderRight: c < colLabels.length - 1 ? '1px solid rgba(255,255,255,0.18)' : 'none',
                      }}
                    >
                      <span
                        style={{
                          fontSize: `${fontSize}px`,
                          fontWeight: val === '1' || val === 'X' ? 700 : 500,
                          color: cellColor,
                        }}
                      >
                        {val === '' ? '\u00A0' : val}
                      </span>

                      {/* Small decimal minterm index in bottom-right corner */}
                      <span
                        style={{
                          position: 'absolute',
                          right: '4px',
                          bottom: '2px',
                          fontSize: '9px',
                          color: 'rgba(148, 163, 184, 0.65)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {mintermIdx}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

