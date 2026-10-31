/**
 * Truth Table Generator Modal (Digital Logic Teaching Platform)
 * Interactive truth table generator supporting:
 * 1. Standard Logic Gate Presets (AND, OR, NOT, NAND, NOR, XOR, XNOR)
 * 2. Arithmetic Circuit Presets (Half Adder, Full Adder)
 * 3. N-Bit Custom Truth Table Generator (1 to 5 bits, all 2^N straight binary combinations)
 * 4. Configurable number of output columns (e.g. Sum & Carry) and output column names
 * 5. Blank exercise mode for classroom quizzes (dim '-' placeholders for students to solve)
 * 6. Font size customization and whiteboard insertion/updates
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  LogicGateType,
  evaluateLogicGate,
  generateNBitCombinations,
  generateTruthTableData,
  generateCircuitTruthTable,
} from '../../services/subjectModules/digitalLogicModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface TruthTableModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

export type TablePresetType =
  | LogicGateType
  | 'HalfAdder'
  | 'FullAdder';

interface PresetDef {
  id: TablePresetType;
  name: string;
  icon: string;
  expr: string;
}

const PRESETS: PresetDef[] = [
  { id: 'AND', name: 'AND Gate', icon: '⊓', expr: 'Y = A · B' },
  { id: 'OR', name: 'OR Gate', icon: '⊔', expr: 'Y = A + B' },
  { id: 'NOT', name: 'NOT Inverter', icon: '▷', expr: 'Y = ¬A' },
  { id: 'NAND', name: 'NAND Gate', icon: '⊼', expr: 'Y = ¬(A · B)' },
  { id: 'NOR', name: 'NOR Gate', icon: '⊽', expr: 'Y = ¬(A + B)' },
  { id: 'XOR', name: 'XOR Gate', icon: '⊕', expr: 'Y = A ⊕ B' },
  { id: 'XNOR', name: 'XNOR Gate', icon: '⊙', expr: 'Y = ¬(A ⊕ B)' },
  { id: 'HalfAdder', name: 'Half Adder (2-Out)', icon: '➕', expr: 'Sum = A⊕B, Carry = A·B' },
  { id: 'FullAdder', name: 'Full Adder (2-Out)', icon: '➕', expr: 'Sum = A⊕B⊕Cin, Cout' },
];

export function TruthTableModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: TruthTableModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  // Determine initial mode based on existing shape params
  const initialIsCustom =
    existingShape?.params?.isCustom ||
    (existingShape?.params?.inputCount && existingShape.params.inputCount > 2);

  const [activeTab, setActiveTab] = useState<'preset' | 'nBitCustom'>(initialIsCustom ? 'nBitCustom' : 'preset');
  const [selectedPreset, setSelectedPreset] = useState<TablePresetType>(
    (existingShape?.params?.gateType as TablePresetType) || 'XOR'
  );

  // N-Bit Generator State
  const [nBits, setNBits] = useState<number>(existingShape?.params?.inputCount || 3);
  const [inputNames, setInputNames] = useState<string[]>(
    existingShape?.params?.headers?.slice(0, existingShape?.params?.inputCount || 3) || ['A', 'B', 'C']
  );
  const [outputCount, setOutputCount] = useState<number>(
    existingShape?.params?.headers
      ? Math.max(1, existingShape.params.headers.length - (existingShape.params.inputCount || 3))
      : 2
  );
  const [outputNames, setOutputNames] = useState<string[]>(
    existingShape?.params?.headers
      ? existingShape.params.headers.slice(existingShape.params.inputCount || 3)
      : ['Sum', 'Carry']
  );
  const [isBlankOutputs, setIsBlankOutputs] = useState<boolean>(
    existingShape?.params?.isBlankOutputs ?? false
  );
  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || '3-Bit Truth Table'
  );
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);

  // Sync input variable names when N-bits change
  useEffect(() => {
    const defaultLabels = ['A', 'B', 'C', 'D', 'E'];
    const updated = Array.from({ length: nBits }, (_, i) => inputNames[i] || defaultLabels[i] || `X${i + 1}`);
    setInputNames(updated);
  }, [nBits]);

  // Sync output variable names when output count changes
  useEffect(() => {
    const defaultOutputs = ['Y', 'Sum', 'Carry', 'Cout', 'F1', 'F2'];
    const updated = Array.from({ length: outputCount }, (_, i) => outputNames[i] || defaultOutputs[i] || `Y${i + 1}`);
    setOutputNames(updated);
  }, [outputCount]);

  // Generate live table data
  let tableHeaders: string[] = [];
  let tableInputCount = 2;
  let tableRows: (number | string)[][] = [];

  if (activeTab === 'preset') {
    if (selectedPreset === 'HalfAdder' || selectedPreset === 'FullAdder') {
      const circData = generateCircuitTruthTable(selectedPreset);
      tableHeaders = circData.headers;
      tableInputCount = circData.inputCount;
      tableRows = isBlankOutputs
        ? circData.rows.map((r) => [...r.slice(0, tableInputCount), ...Array(tableHeaders.length - tableInputCount).fill('')])
        : circData.rows;
    } else {
      const gateData = generateTruthTableData(selectedPreset);
      tableHeaders = gateData.headers;
      tableInputCount = gateData.inputCount;
      tableRows = isBlankOutputs
        ? gateData.rows.map((r) => [...r.slice(0, tableInputCount), ''])
        : gateData.rows;
    }
  } else {
    // Custom N-Bit Straight Binary Combinations
    tableHeaders = [...inputNames, ...outputNames];
    tableInputCount = nBits;
    const binaryRows = generateNBitCombinations(nBits);

    tableRows = binaryRows.map((inRow) => {
      const outValues = outputNames.map((_, outIdx) => {
        if (isBlankOutputs) return '';
        // Auto-eval standard sum & carry if matching half adder
        if (nBits === 2 && outIdx === 0 && outputNames[0].toLowerCase().includes('sum')) {
          return inRow[0] ^ inRow[1];
        }
        if (nBits === 2 && outIdx === 1 && outputNames[1].toLowerCase().includes('carry')) {
          return inRow[0] & inRow[1];
        }
        return 0;
      });
      return [...inRow, ...outValues];
    });
  }

  const handleSave = () => {
    const isCustom = activeTab === 'nBitCustom';
    const computedTitle = isCustom
      ? title || `${nBits}-Bit Truth Table`
      : selectedPreset === 'HalfAdder'
      ? 'Half Adder Truth Table'
      : selectedPreset === 'FullAdder'
      ? 'Full Adder Truth Table'
      : `${selectedPreset} Truth Table`;

    const width = Math.max(380, tableHeaders.length * 68 + 60);
    const height = Math.max(220, 60 + tableRows.length * 28);

    const params: any = {
      isCustom,
      gateType: activeTab === 'preset' ? selectedPreset : undefined,
      headers: tableHeaders,
      inputCount: tableInputCount,
      rows: tableRows,
      fontSize,
      isBlankOutputs,
      title: computedTitle,
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

    const tableObj = createShape('truthTable', 220, 160, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      label: computedTitle,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      tableObj,
      `Insert ${computedTitle}`
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
        className="subject-submodal-card"
        style={{ maxWidth: '780px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📋</span>
            <div>
              <h3>Truth Table Generator (N-Bit & Multi-Output)</h3>
              <p>Generate truth tables for N-bits in straight binary, add output columns, or create blank student exercises</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0f172a' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'preset' ? 'active' : ''}`}
            onClick={() => setActiveTab('preset')}
            style={{ flex: 1, padding: '10px 16px', borderBottom: activeTab === 'preset' ? '2px solid #38bdf8' : 'none' }}
          >
            ⚡ Standard Gates & Adder Presets
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'nBitCustom' ? 'active' : ''}`}
            onClick={() => setActiveTab('nBitCustom')}
            style={{ flex: 1, padding: '10px 16px', borderBottom: activeTab === 'nBitCustom' ? '2px solid #38bdf8' : 'none' }}
          >
            🔢 Custom N-Bit & Multi-Output Table
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'preset' && (
          <div className="logic-gate-selector">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`gate-pill ${selectedPreset === p.id ? 'active' : ''}`}
                onClick={() => setSelectedPreset(p.id)}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: N-Bit Generator Settings */}
        {activeTab === 'nBitCustom' && (
          <div className="cs-modal-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
            {/* Input Bits Count */}
            <div className="cs-toolbar-field" style={{ minWidth: '130px' }}>
              <label>Input Bits (N):</label>
              <select
                className="cs-modal-select"
                value={nBits}
                onChange={(e) => setNBits(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((b) => (
                  <option key={b} value={b}>
                    {b} Bits ({1 << b} Rows)
                  </option>
                ))}
              </select>
            </div>

            {/* Output Columns Count */}
            <div className="cs-toolbar-field" style={{ minWidth: '140px' }}>
              <label>Output Columns:</label>
              <select
                className="cs-modal-select"
                value={outputCount}
                onChange={(e) => setOutputCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((oc) => (
                  <option key={oc} value={oc}>
                    {oc} Output{oc > 1 ? 's' : ''} (e.g. Sum, Carry)
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="cs-toolbar-field" style={{ flex: 2, minWidth: '180px' }}>
              <label>Table Title:</label>
              <input
                type="text"
                className="cs-modal-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Half Adder Truth Table"
              />
            </div>
          </div>
        )}

        {/* Global Toolbar: Blank Mode & Font Size */}
        <div className="cs-modal-toolbar" style={{ borderTop: 'none', background: '#0b1329', padding: '8px 20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#fbbf24' }}>
            <input
              type="checkbox"
              checked={isBlankOutputs}
              onChange={(e) => setIsBlankOutputs(e.target.checked)}
            />
            <b>📝 Blank Output Rows (Classroom Quiz / Exercise mode with '-')</b>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Font Size:</span>
            <select
              className="cs-modal-select"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '75px' }}
            >
              {[11, 12, 14, 16, 18, 20, 24].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}px
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Column Names Editor for Custom Mode */}
        {activeTab === 'nBitCustom' && (
          <div style={{ padding: '8px 20px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {/* Inputs names */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>INPUTS:</span>
                {inputNames.map((name, idx) => (
                  <input
                    key={`in-${idx}`}
                    type="text"
                    className="cs-modal-input"
                    value={name}
                    onChange={(e) => {
                      const updated = [...inputNames];
                      updated[idx] = e.target.value;
                      setInputNames(updated);
                    }}
                    style={{ width: '48px', padding: '3px 6px', fontSize: 11, textAlign: 'center' }}
                  />
                ))}
              </div>

              {/* Outputs names */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 14 }}>
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>OUTPUTS:</span>
                {outputNames.map((name, idx) => (
                  <input
                    key={`out-${idx}`}
                    type="text"
                    className="cs-modal-input"
                    value={name}
                    onChange={(e) => {
                      const updated = [...outputNames];
                      updated[idx] = e.target.value;
                      setOutputNames(updated);
                    }}
                    style={{ width: '70px', padding: '3px 6px', fontSize: 11, textAlign: 'center' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Truth Table Preview with Visible Dim Grid */}
        <div className="submodal-body" style={{ overflowY: 'auto', maxHeight: '420px', padding: '16px 20px' }}>
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
                fontSize: `${fontSize}px`,
              }}
            >
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1.5px solid #0284c7' }}>
                  {tableHeaders.map((h, i) => {
                    const isInput = i < tableInputCount;
                    return (
                      <th
                        key={i}
                        style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                          color: isInput ? '#38bdf8' : '#34d399',
                          background: isInput ? 'rgba(2, 132, 199, 0.22)' : 'rgba(16, 185, 129, 0.20)',
                          borderRight: i === tableInputCount - 1 ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.22)',
                          fontWeight: 700,
                        }}
                      >
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    style={{
                      background: rIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.15)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.09)',
                    }}
                  >
                    {row.map((val, cIdx) => {
                      const isInput = cIdx < tableInputCount;
                      const isBorder = cIdx === tableInputCount - 1;

                      let cellColor = '#ffffff';
                      if (val === 1 || val === '1') cellColor = '#10b981';
                      else if (val === 0 || val === '0') cellColor = isInput ? '#cbd5e1' : '#94a3b8';
                      else if (val === '-' || val === '') cellColor = 'rgba(148, 163, 184, 0.4)';

                      return (
                        <td
                          key={cIdx}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'center',
                            color: cellColor,
                            fontWeight: val === 1 || val === '1' ? 700 : 500,
                            borderRight: isBorder ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.18)',
                          }}
                        >
                          {val === '' ? '\u00A0' : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            💡 Displays all {tableRows.length} straight binary combinations with dim visible rows
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="submodal-btn submodal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="submodal-btn submodal-btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Truth Table on Board' : 'Insert Truth Table onto Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
