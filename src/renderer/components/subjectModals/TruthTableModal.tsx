/**
 * Truth Table & Logic Gate Generator Modal (Section 16.4 Digital Logic)
 * Select gate, inspect live truth table, insert table or gate shape onto whiteboard
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  LogicGateType,
  generateTruthTableData,
} from '../../services/subjectModules/digitalLogicModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import './SubjectModals.css';

interface TruthTableModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
}

const GATES: { type: LogicGateType; name: string; expr: string }[] = [
  { type: 'AND', name: 'AND Gate', expr: 'Y = A · B' },
  { type: 'OR', name: 'OR Gate', expr: 'Y = A + B' },
  { type: 'NOT', name: 'NOT Inverter', expr: 'Y = ¬A' },
  { type: 'NAND', name: 'NAND Gate', expr: 'Y = ¬(A · B)' },
  { type: 'NOR', name: 'NOR Gate', expr: 'Y = ¬(A + B)' },
  { type: 'XOR', name: 'XOR Gate', expr: 'Y = A ⊕ B' },
  { type: 'XNOR', name: 'XNOR Gate', expr: 'Y = ¬(A ⊕ B)' },
];

export function TruthTableModal({ onClose, onInsertSuccess }: TruthTableModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const [selectedGate, setSelectedGate] = useState<LogicGateType>('XOR');

  const currentPageIndex = docState.currentPageIndex;
  const tableData = generateTruthTableData(selectedGate);
  const currentGateMeta = GATES.find((g) => g.type === selectedGate) || GATES[0];

  const insertTruthTable = () => {
    const tableObj = createShape('truthTable', 220, 160, 420, 260, {
      params: {
        gateType: selectedGate,
        headers: tableData.headers,
        rows: tableData.rows,
      },
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      label: `${selectedGate} Truth Table`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      tableObj,
      `Insert ${selectedGate} Truth Table`
    );
    onClose();
  };

  const insertGateSymbol = () => {
    const gateObj = createShape('logicGate', 250, 200, 170, 90, {
      params: { gateType: selectedGate, inputs: selectedGate === 'NOT' ? 1 : 2 },
      strokeColor: '#38bdf8',
      fillColor: 'rgba(15, 23, 42, 0.92)',
      label: `${selectedGate} Gate`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      gateObj,
      `Insert ${selectedGate} Logic Gate`
    );
    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card truth-table-modal" onClick={(e) => e.stopPropagation()}>
        <div className="submodal-header">
          <div className="submodal-title">
            <span>⚡</span>
            <div>
              <h3>Digital Logic & Truth Table Generator</h3>
              <p>Compute dynamic truth tables, verify boolean expressions, and insert gate symbols</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>✕</button>
        </div>

        {/* Gate selector pills */}
        <div className="logic-gate-selector">
          {GATES.map((g) => (
            <button
              key={g.type}
              className={`gate-pill ${selectedGate === g.type ? 'active' : ''}`}
              onClick={() => setSelectedGate(g.type)}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Expression Badge */}
        <div className="gate-expr-banner">
          <span>Boolean Function:</span>
          <b>{currentGateMeta.expr}</b>
        </div>

        {/* Live Truth Table Preview */}
        <div className="truth-table-preview-container">
          <table className="truth-preview-table">
            <thead>
              <tr>
                {tableData.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((val, cIdx) => (
                    <td
                      key={cIdx}
                      className={
                        cIdx === row.length - 1
                          ? val === 1
                            ? 'val-one'
                            : 'val-zero'
                          : ''
                      }
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="btn btn-secondary" onClick={insertGateSymbol}>
            ⊓ Insert {selectedGate} Gate Symbol
          </button>
          <button className="btn btn-primary" onClick={insertTruthTable}>
            📋 Insert Truth Table onto Board
          </button>
        </div>
      </div>
    </div>
  );
}
