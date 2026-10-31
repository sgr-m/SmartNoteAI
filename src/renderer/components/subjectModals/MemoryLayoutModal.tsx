/**
 * Memory Layout & Pointer Diagram Modal (CS Teaching Platform)
 * Interactive hex memory grid builder with variable names, types, values,
 * and visual pointer reference arrows.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

export interface MemoryCellDef {
  address: string;
  name: string;
  type: string;
  value: string;
  pointsTo?: string;
}

interface MemoryLayoutModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const PRESETS: Record<string, { name: string; title: string; cells: MemoryCellDef[] }> = {
  pointerBasic: {
    name: 'Basic Pointer & Reference',
    title: 'Memory Layout: Pointer & Dereference (int* ptr = &target)',
    cells: [
      { address: '0x1000', name: 'ptr', type: 'int*', value: '0x1008', pointsTo: '0x1008' },
      { address: '0x1004', name: 'count', type: 'int', value: '42' },
      { address: '0x1008', name: 'target', type: 'int', value: '99' },
      { address: '0x100C', name: 'flag', type: 'bool', value: 'true' },
    ],
  },
  doublePointer: {
    name: 'Double Pointer (int** pp)',
    title: 'Memory Layout: Pointer-to-Pointer Chain (int** pp -> *p -> val)',
    cells: [
      { address: '0x3000', name: 'pp', type: 'int**', value: '0x3004', pointsTo: '0x3004' },
      { address: '0x3004', name: 'p', type: 'int*', value: '0x3008', pointsTo: '0x3008' },
      { address: '0x3008', name: 'val', type: 'int', value: '256' },
      { address: '0x300C', name: 'status', type: 'char', value: "'A'" },
    ],
  },
  dynamicNode: {
    name: 'Struct Node & Next Pointer',
    title: 'Memory Layout: Linked Struct Nodes (Heap Allocation)',
    cells: [
      { address: '0x2000', name: 'head', type: 'Node*', value: '0x5000', pointsTo: '0x5000' },
      { address: '0x5000', name: 'node1.data', type: 'int', value: '10' },
      { address: '0x5004', name: 'node1.next', type: 'Node*', value: '0x5008', pointsTo: '0x5008' },
      { address: '0x5008', name: 'node2.data', type: 'int', value: '20' },
      { address: '0x500C', name: 'node2.next', type: 'Node*', value: 'NULL' },
    ],
  },
  arrayMemory: {
    name: 'Contiguous Array & Pointer',
    title: 'Memory Layout: Array Elements (4 bytes each) & Array Pointer',
    cells: [
      { address: '0x7FF0', name: 'arr[0]', type: 'int', value: '15' },
      { address: '0x7FF4', name: 'arr[1]', type: 'int', value: '27' },
      { address: '0x7FF8', name: 'arr[2]', type: 'int', value: '42' },
      { address: '0x7FFC', name: 'pArr', type: 'int*', value: '0x7FF0', pointsTo: '0x7FF0' },
    ],
  },
};

export function MemoryLayoutModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: MemoryLayoutModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || PRESETS.pointerBasic.title
  );
  const [cells, setCells] = useState<MemoryCellDef[]>(
    existingShape?.params?.cells || PRESETS.pointerBasic.cells
  );
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );

  const currentPageIndex = docState.currentPageIndex;

  // Handle Preset Selection
  const handleSelectPreset = (key: string) => {
    const p = PRESETS[key];
    if (p) {
      setTitle(p.title);
      setCells(p.cells.map((c) => ({ ...c })));
    }
  };

  // Add Cell with auto-incrementing hex address
  const handleAddCell = () => {
    let nextHex = '0x1010';
    if (cells.length > 0) {
      const lastAddr = cells[cells.length - 1].address;
      const num = parseInt(lastAddr, 16);
      if (!isNaN(num)) {
        nextHex = '0x' + (num + 4).toString(16).toUpperCase();
      }
    }
    const newCell: MemoryCellDef = {
      address: nextHex,
      name: `var_${cells.length + 1}`,
      type: 'int',
      value: '0',
    };
    setCells([...cells, newCell]);
  };

  // Update cell field
  const handleUpdateCell = (idx: number, field: keyof MemoryCellDef, val: string) => {
    const next = [...cells];
    next[idx] = { ...next[idx], [field]: val };
    setCells(next);
  };

  // Delete cell
  const handleDeleteCell = (idx: number) => {
    if (cells.length <= 1) return;
    setCells(cells.filter((_, i) => i !== idx));
  };

  // Save / Insert
  const handleSave = () => {
    const cellCount = Math.max(1, cells.length);
    const height = Math.max(280, Math.min(650, 70 + cellCount * 42 + 40));
    const width = 560;

    const params = {
      diagramType: 'memoryLayout',
      title,
      cells,
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
        className="subject-submodal-card cs-memory-modal"
        style={{ maxWidth: '860px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🧠</span>
            <div>
              <h3>Memory Layout & Pointer Builder</h3>
              <p>Model memory addresses, data types, variable values, and pointer reference arrows</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Toolbar: Presets & Title */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Diagram Title:</label>
            <input
              type="text"
              className="cs-modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Memory Layout & Pointers"
            />
          </div>
          <div className="cs-toolbar-field" style={{ flex: 1 }}>
            <label>Load Memory Preset:</label>
            <select
              className="cs-modal-select"
              onChange={(e) => handleSelectPreset(e.target.value)}
              defaultValue="pointerBasic"
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

        {/* Interactive Memory Grid */}
        <div className="cs-memory-table-container">
          <table className="cs-editable-table cs-memory-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Address (Hex)</th>
                <th style={{ width: '140px' }}>Variable Name</th>
                <th style={{ width: '110px' }}>Type</th>
                <th style={{ width: '120px' }}>Value</th>
                <th style={{ width: '140px' }}>Points To (Target)</th>
                <th style={{ width: '40px' }}>Act</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      className="cs-cell-input cs-mem-addr"
                      value={cell.address}
                      onChange={(e) => handleUpdateCell(idx, 'address', e.target.value)}
                      placeholder="0x1000"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="cs-cell-input cs-mem-var"
                      value={cell.name}
                      onChange={(e) => handleUpdateCell(idx, 'name', e.target.value)}
                      placeholder="varName"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="cs-cell-input cs-mem-type"
                      value={cell.type}
                      onChange={(e) => handleUpdateCell(idx, 'type', e.target.value)}
                      placeholder="int*"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="cs-cell-input cs-mem-val"
                      value={cell.value}
                      onChange={(e) => handleUpdateCell(idx, 'value', e.target.value)}
                      placeholder="value"
                    />
                  </td>
                  <td>
                    <select
                      className="cs-cell-select"
                      value={cell.pointsTo || ''}
                      onChange={(e) => handleUpdateCell(idx, 'pointsTo', e.target.value)}
                    >
                      <option value="">None (Value)</option>
                      {cells
                        .filter((_, i) => i !== idx)
                        .map((other, oIdx) => (
                          <option key={oIdx} value={other.address}>
                            ➔ {other.address} ({other.name})
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    {cells.length > 1 && (
                      <button
                        className="cs-row-del-btn"
                        title="Delete cell"
                        onClick={() => handleDeleteCell(idx)}
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

        {/* Action Controls */}
        <div className="cs-table-actions-bar">
          <button className="cs-action-btn-sm" onClick={handleAddCell}>
            ➕ Add Memory Slot (+4 Bytes)
          </button>
          <span className="cs-hint-note">
            💡 Selecting a "Points To" target automatically renders a smooth pointer reference arrow on the canvas.
          </span>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="subject-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="subject-btn-primary" onClick={handleSave}>
            {existingShape ? 'Update Memory Diagram' : 'Insert onto Whiteboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

