/**
 * Algorithm Trace Table Modal (CS Teaching Platform)
 * Fully interactive execution trace table editor with configurable columns,
 * editable row cells, step auto-numbering, prebuilt algorithm presets,
 * and live canvas insertion.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface TraceTableModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

interface PresetTrace {
  name: string;
  title: string;
  columns: string[];
  rows: string[][];
}

const PRESETS: Record<string, PresetTrace> = {
  binarySearch: {
    name: 'Binary Search (Target: 23)',
    title: 'Binary Search Trace Table (arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91])',
    columns: ['Step', 'low', 'high', 'mid', 'arr[mid]', 'arr[mid] == 23', 'Action'],
    rows: [
      ['1', '0', '9', '4', '16', 'False', 'low = mid + 1 (5)'],
      ['2', '5', '9', '7', '56', 'False', 'high = mid - 1 (6)'],
      ['3', '5', '6', '5', '23', 'True', 'Return index 5 (Found!)'],
    ],
  },
  linearSearch: {
    name: 'Linear Search (Target: 42)',
    title: 'Linear Search Trace (arr = [10, 24, 42, 67, 99])',
    columns: ['Step', 'Line', 'i', 'arr[i]', 'arr[i] == 42 ?', 'Output'],
    rows: [
      ['Init', '1-2', '0', '10', 'False', '-'],
      ['1', '3-4', '1', '24', 'False', '-'],
      ['2', '3-4', '2', '42', 'True', 'Return 2 (Found)'],
    ],
  },
  bubbleSort: {
    name: 'Bubble Sort (Pass 1)',
    title: 'Bubble Sort Trace (Pass 1 on [5, 1, 4, 2, 8])',
    columns: ['Pass', 'j', 'arr[j]', 'arr[j+1]', 'arr[j] > arr[j+1]', 'Swap?', 'Array State'],
    rows: [
      ['1', '0', '5', '1', 'True', 'Yes', '[1, 5, 4, 2, 8]'],
      ['1', '1', '5', '4', 'True', 'Yes', '[1, 4, 5, 2, 8]'],
      ['1', '2', '5', '2', 'True', 'Yes', '[1, 4, 2, 5, 8]'],
      ['1', '3', '5', '8', 'False', 'No', '[1, 4, 2, 5, 8]'],
    ],
  },
  factorialRecursion: {
    name: 'Factorial Recursion Trace',
    title: 'Recursion Trace: factorial(4)',
    columns: ['Call #', 'Function', 'n', 'n <= 1 ?', 'Recursive Expression', 'Return Value'],
    rows: [
      ['1', 'factorial(4)', '4', 'False', '4 * factorial(3)', '24'],
      ['2', 'factorial(3)', '3', 'False', '3 * factorial(2)', '6'],
      ['3', 'factorial(2)', '2', 'False', '2 * factorial(1)', '2'],
      ['4', 'factorial(1)', '1', 'True', 'Base Case: return 1', '1'],
    ],
  },
  accumulatorLoop: {
    name: 'Sum Loop Accumulator',
    title: 'While Loop Trace (Sum of 1 to 4)',
    columns: ['Step', 'Line', 'i', 'sum', 'i < 5 ?', 'Output'],
    rows: [
      ['Init', '1-2', '0', '0', 'True', '-'],
      ['1', '3-4', '1', '1', 'True', '-'],
      ['2', '3-4', '2', '3', 'True', '-'],
      ['3', '3-4', '3', '6', 'True', '-'],
      ['4', '3-4', '4', '10', 'False', '10'],
    ],
  },
};

export function TraceTableModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: TraceTableModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || PRESETS.accumulatorLoop.title
  );
  const [columns, setColumns] = useState<string[]>(
    existingShape?.params?.columns || PRESETS.accumulatorLoop.columns
  );
  const [rows, setRows] = useState<string[][]>(
    existingShape?.params?.rows || PRESETS.accumulatorLoop.rows
  );
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );
  const [newColName, setNewColName] = useState<string>('');

  const currentPageIndex = docState.currentPageIndex;

  // Handle Preset selection
  const handleSelectPreset = (key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      setTitle(preset.title);
      setColumns([...preset.columns]);
      setRows(preset.rows.map((r) => [...r]));
    }
  };

  // Column manipulation
  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const name = newColName.trim();
    setColumns([...columns, name]);
    setRows(rows.map((r) => [...r, '-']));
    setNewColName('');
  };

  const handleUpdateColumnName = (idx: number, val: string) => {
    const next = [...columns];
    next[idx] = val;
    setColumns(next);
  };

  const handleDeleteColumn = (idx: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, i) => i !== idx));
    setRows(rows.map((r) => r.filter((_, i) => i !== idx)));
  };

  // Row manipulation
  const handleAddRow = () => {
    const newRow = columns.map((_, i) => (i === 0 ? String(rows.length + 1) : '-'));
    setRows([...rows, newRow]);
  };

  const handleUpdateCell = (rIdx: number, cIdx: number, val: string) => {
    const nextRows = rows.map((r, i) => {
      if (i !== rIdx) return r;
      const nextR = [...r];
      nextR[cIdx] = val;
      return nextR;
    });
    setRows(nextRows);
  };

  const handleDeleteRow = (rIdx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== rIdx));
  };

  const handleAutoNumberSteps = () => {
    setRows(
      rows.map((r, i) => {
        const next = [...r];
        next[0] = i === 0 && r[0].toLowerCase() === 'init' ? 'Init' : String(i);
        return next;
      })
    );
  };

  // Save / Insert
  const handleSave = () => {
    const colCount = Math.max(1, columns.length);
    const rowCount = Math.max(1, rows.length);
    const width = Math.max(540, Math.min(840, colCount * 115 + 60));
    const height = Math.max(260, Math.min(600, 70 + rowCount * 30 + 30));

    const params = {
      diagramType: 'traceTable',
      title,
      columns,
      rows,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: {
          ...existingShape.params,
          ...params,
        },
        label: title,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('csDiagram', 200, 160, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      label: title,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      shapeObj,
      `Insert ${title}`
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
        className="subject-submodal-card cs-trace-table-modal"
        style={{ maxWidth: '880px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📊</span>
            <div>
              <h3>Algorithm Trace Table Builder</h3>
              <p>Configure columns, step-by-step variable values, conditions, and outputs</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Toolbar: Presets & Title */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Table Title:</label>
            <input
              type="text"
              className="cs-modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Binary Search Execution Trace"
            />
          </div>
          <div className="cs-toolbar-field" style={{ flex: 1 }}>
            <label>Load Preset Algorithm:</label>
            <select
              className="cs-modal-select"
              onChange={(e) => handleSelectPreset(e.target.value)}
              defaultValue="accumulatorLoop"
            >
              {Object.entries(PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="cs-toolbar-field" style={{ width: '90px' }}>
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

        {/* Columns Manager */}
        <div className="cs-columns-editor-bar">
          <span className="cs-section-label">Columns:</span>
          <div className="cs-columns-tags">
            {columns.map((col, idx) => (
              <div key={idx} className="cs-column-chip">
                <input
                  type="text"
                  value={col}
                  onChange={(e) => handleUpdateColumnName(idx, e.target.value)}
                  className="cs-chip-input"
                />
                {columns.length > 1 && (
                  <button
                    className="cs-chip-del"
                    title="Remove column"
                    onClick={() => handleDeleteColumn(idx)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="cs-add-col-group">
            <input
              type="text"
              value={newColName}
              placeholder="+ New Column"
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              className="cs-new-col-input"
            />
            <button className="cs-action-btn-sm" onClick={handleAddColumn}>
              Add
            </button>
          </div>
        </div>

        {/* Interactive Editable Table */}
        <div className="cs-trace-table-container">
          <table className="cs-editable-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                {columns.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
                <th style={{ width: '40px' }}>Act</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td className="cs-row-num">{rIdx + 1}</td>
                  {columns.map((_, cIdx) => {
                    const cellVal = row[cIdx] ?? '';
                    const isTrue = String(cellVal).toLowerCase() === 'true';
                    const isFalse = String(cellVal).toLowerCase() === 'false';
                    const isNum = /^-?\d+(\.\d+)?$/.test(String(cellVal));

                    return (
                      <td key={cIdx}>
                        <input
                          type="text"
                          className={`cs-cell-input ${isTrue ? 'val-true' : isFalse ? 'val-false' : isNum ? 'val-num' : ''}`}
                          value={cellVal}
                          onChange={(e) => handleUpdateCell(rIdx, cIdx, e.target.value)}
                        />
                      </td>
                    );
                  })}
                  <td>
                    {rows.length > 1 && (
                      <button
                        className="cs-row-del-btn"
                        title="Delete row"
                        onClick={() => handleDeleteRow(rIdx)}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Action Controls */}
        <div className="cs-table-actions-bar">
          <button className="cs-action-btn-sm" onClick={handleAddRow}>
            ➕ Add Step Row
          </button>
          <button className="cs-action-btn-sm" onClick={handleAutoNumberSteps}>
            🔢 Auto-Number Steps
          </button>
          <span className="cs-hint-note">
            💡 Tip: "True" highlights green, "False" highlights red, numbers highlight amber on whiteboard.
          </span>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="subject-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="subject-btn-primary" onClick={handleSave}>
            {existingShape ? 'Update Trace Table' : 'Insert onto Whiteboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

