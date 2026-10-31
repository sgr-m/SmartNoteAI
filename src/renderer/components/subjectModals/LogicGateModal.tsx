/**
 * Logic Gate Modal (Digital Logic Teaching Platform)
 * Interactive designer for all IEEE logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR)
 * and combinational blocks with customizable input counts (1, 2, or 3),
 * customizable input labels (A, B, C), output labels, and font sizes.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LogicGateType } from '../../services/subjectModules/digitalLogicModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface LogicGateModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

interface GateDef {
  type: LogicGateType | 'HalfAdder' | 'FullAdder';
  name: string;
  symbol: string;
  expr: string;
  desc: string;
}

const GATES: GateDef[] = [
  { type: 'AND', name: 'AND Gate', symbol: '⊓', expr: 'Y = A · B', desc: 'Output is 1 only when all inputs are 1' },
  { type: 'OR', name: 'OR Gate', symbol: '⊔', expr: 'Y = A + B', desc: 'Output is 1 if any input is 1' },
  { type: 'NOT', name: 'NOT Inverter', symbol: '▷', expr: 'Y = ¬A', desc: 'Inverts the digital input state' },
  { type: 'NAND', name: 'NAND Gate', symbol: '⊼', expr: 'Y = ¬(A · B)', desc: 'Universal gate: inverted AND' },
  { type: 'NOR', name: 'NOR Gate', symbol: '⊽', expr: 'Y = ¬(A + B)', desc: 'Universal gate: inverted OR' },
  { type: 'XOR', name: 'XOR Gate', symbol: '⊕', expr: 'Y = A ⊕ B', desc: 'Exclusive OR: output is 1 when inputs differ' },
  { type: 'XNOR', name: 'XNOR Gate', symbol: '⊙', expr: 'Y = ¬(A ⊕ B)', desc: 'Equivalence gate: output is 1 when inputs match' },
  { type: 'HalfAdder', name: 'Half Adder', symbol: '➕', expr: 'S=A⊕B, C=A·B', desc: 'Adds two 1-bit operands (Sum and Carry)' },
  { type: 'FullAdder', name: 'Full Adder', symbol: '➕', expr: 'S=A⊕B⊕Cin, Cout', desc: 'Adds three 1-bit operands including Carry-in' },
];

export function LogicGateModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: LogicGateModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  const initialGate = (existingShape?.params?.gateType || existingShape?.params?.blockType || 'AND') as
    | LogicGateType
    | 'HalfAdder'
    | 'FullAdder';

  const [selectedGate, setSelectedGate] = useState<LogicGateType | 'HalfAdder' | 'FullAdder'>(initialGate);
  const [inputsCount, setInputsCount] = useState<number>(
    existingShape?.params?.inputs === 1 || selectedGate === 'NOT'
      ? 1
      : existingShape?.params?.inputs === 3
      ? 3
      : 2
  );

  const [labelA, setLabelA] = useState<string>(existingShape?.params?.labelA || 'A');
  const [labelB, setLabelB] = useState<string>(existingShape?.params?.labelB || 'B');
  const [labelC, setLabelC] = useState<string>(existingShape?.params?.labelC || 'C');
  const [labelY, setLabelY] = useState<string>(existingShape?.params?.labelY || 'Y');
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);
  const [showLabels, setShowLabels] = useState<boolean>(existingShape?.params?.showLabels ?? true);

  const currentMeta = GATES.find((g) => g.type === selectedGate) || GATES[0];
  const isAdder = selectedGate === 'HalfAdder' || selectedGate === 'FullAdder';
  const isNOT = selectedGate === 'NOT';

  const handleSelectGate = (gate: LogicGateType | 'HalfAdder' | 'FullAdder') => {
    setSelectedGate(gate);
    if (gate === 'NOT') {
      setInputsCount(1);
    } else if (gate === 'FullAdder') {
      setInputsCount(3);
      setLabelA('A');
      setLabelB('B');
      setLabelC('Cin');
      setLabelY('Sum');
    } else if (gate === 'HalfAdder') {
      setInputsCount(2);
      setLabelA('A');
      setLabelB('B');
      setLabelY('Sum');
    } else {
      if (inputsCount === 1) setInputsCount(2);
    }
  };

  const handleSave = () => {
    const isBlock = isAdder;
    const width = isBlock ? 220 : 180;
    const height = isBlock ? 200 : inputsCount === 3 ? 110 : 95;

    const inputLabels = inputsCount === 1 ? [labelA] : inputsCount === 3 ? [labelA, labelB, labelC] : [labelA, labelB];

    const params: any = {
      inputs: inputsCount,
      inputLabels,
      labelA,
      labelB: inputsCount >= 2 ? labelB : undefined,
      labelC: inputsCount >= 3 ? labelC : undefined,
      labelY,
      fontSize,
      showLabels,
    };

    if (isBlock) {
      params.blockType = selectedGate;
    } else {
      params.gateType = selectedGate;
    }

    if (existingShape && onUpdateShape) {
      const mergedParams = { ...existingShape.params, ...params };
      if (isBlock) {
        delete mergedParams.gateType;
      } else {
        delete mergedParams.blockType;
      }
      const updated: ShapeObject = {
        ...existingShape,
        params: mergedParams,
        label: isBlock ? `${selectedGate}` : `${selectedGate} Gate`,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const gateObj = createShape('logicGate', 250, 200, width, height, {
      params,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'rgba(15, 23, 42, 0.92)',
      label: isBlock ? `${selectedGate}` : `${selectedGate} Gate`,
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
      <div
        className="subject-submodal-card"
        style={{ maxWidth: '680px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>⚡</span>
            <div>
              <h3>Logic Gate & Circuit Designer</h3>
              <p>Configure logic gates, input names (A, B, C), output names, and font size</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Gate Selector Pills */}
        <div className="logic-gate-selector">
          {GATES.map((g) => (
            <button
              key={g.type}
              className={`gate-pill ${selectedGate === g.type ? 'active' : ''}`}
              onClick={() => handleSelectGate(g.type)}
            >
              {g.symbol} {g.name}
            </button>
          ))}
        </div>

        {/* Expression Banner */}
        <div className="gate-expr-banner">
          <span>Boolean Function:</span>
          <b>{currentMeta.expr}</b>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>{currentMeta.desc}</span>
        </div>

        {/* Configuration Toolbar */}
        <div className="cs-modal-toolbar">
          {!isNOT && !isAdder && (
            <div className="cs-toolbar-field" style={{ flex: 1.5 }}>
              <label>Number of Inputs:</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`cs-action-btn-sm ${inputsCount === 2 ? 'cs-action-btn-primary' : ''}`}
                  onClick={() => setInputsCount(2)}
                  style={{ flex: 1, padding: '4px 10px' }}
                >
                  2 Inputs (A, B)
                </button>
                <button
                  type="button"
                  className={`cs-action-btn-sm ${inputsCount === 3 ? 'cs-action-btn-primary' : ''}`}
                  onClick={() => setInputsCount(3)}
                  style={{ flex: 1, padding: '4px 10px' }}
                >
                  3 Inputs (A, B, C)
                </button>
              </div>
            </div>
          )}

          <div className="cs-toolbar-field" style={{ flex: 1 }}>
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

          <div className="cs-toolbar-field" style={{ justifyContent: 'center' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none', marginTop: '16px' }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                style={{ accentColor: '#38bdf8', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>Show Pin Labels</span>
            </label>
          </div>
        </div>

        {/* Body: Inputs & Output Labels */}
        <div className="submodal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: inputsCount === 1 ? '1fr 1fr' : inputsCount === 2 ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr',
              gap: 12,
              background: '#0f172a',
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid rgba(56,189,248,0.2)',
            }}
          >
            <div className="cs-toolbar-field">
              <label>Input 1 Label:</label>
              <input
                type="text"
                className="cs-modal-input"
                value={labelA}
                onChange={(e) => setLabelA(e.target.value)}
                maxLength={6}
                placeholder="A"
              />
            </div>

            {inputsCount >= 2 && (
              <div className="cs-toolbar-field">
                <label>Input 2 Label:</label>
                <input
                  type="text"
                  className="cs-modal-input"
                  value={labelB}
                  onChange={(e) => setLabelB(e.target.value)}
                  maxLength={6}
                  placeholder="B"
                />
              </div>
            )}

            {inputsCount >= 3 && (
              <div className="cs-toolbar-field">
                <label>Input 3 Label:</label>
                <input
                  type="text"
                  className="cs-modal-input"
                  value={labelC}
                  onChange={(e) => setLabelC(e.target.value)}
                  maxLength={6}
                  placeholder="C"
                />
              </div>
            )}

            <div className="cs-toolbar-field">
              <label>Output Label:</label>
              <input
                type="text"
                className="cs-modal-input"
                value={labelY}
                onChange={(e) => setLabelY(e.target.value)}
                maxLength={8}
                placeholder="Y"
              />
            </div>
          </div>

          {/* Live Gate Visual Preview Card */}
          <div
            style={{
              background: '#090d16',
              border: '1px solid rgba(56,189,248,0.25)',
              borderRadius: 8,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8, alignSelf: 'flex-start' }}>
              GATE PREVIEW (AUTHENTIC IEEE SYMBOL WITH INPUTS)
            </div>

            <div style={{ position: 'relative', width: '280px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Inputs wire pins */}
              <div style={{ position: 'absolute', left: 10, display: 'flex', flexDirection: 'column', gap: inputsCount === 3 ? 12 : 24 }}>
                <span style={{ fontSize: `${fontSize - 2}px`, color: '#38bdf8', fontWeight: 'bold' }}>{labelA} ──</span>
                {inputsCount >= 2 && (
                  <span style={{ fontSize: `${fontSize - 2}px`, color: '#38bdf8', fontWeight: 'bold' }}>{labelB} ──</span>
                )}
                {inputsCount >= 3 && (
                  <span style={{ fontSize: `${fontSize - 2}px`, color: '#38bdf8', fontWeight: 'bold' }}>{labelC} ──</span>
                )}
              </div>

              {/* Gate center badge */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '2px solid #38bdf8',
                  borderRadius: selectedGate === 'AND' || selectedGate === 'NAND' ? '0 30px 30px 0' : selectedGate === 'NOT' ? '4px' : '0 24px 24px 0',
                  padding: '14px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                }}
              >
                <span style={{ fontSize: 24 }}>{currentMeta.symbol}</span>
                <span style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', color: '#ffffff' }}>{selectedGate}</span>
              </div>

              {/* Output wire pin */}
              <div style={{ position: 'absolute', right: 15, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: `${fontSize - 2}px`, color: '#34d399', fontWeight: 'bold' }}>── {labelY}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            💡 Drag corners on whiteboard anytime to scale diagram & text proportionally
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="submodal-btn submodal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="submodal-btn submodal-btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Gate on Board' : `Insert ${selectedGate} Gate onto Board`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

