/**
 * CPU Instruction Cycle Modal (CS Teaching Platform)
 * Interactive builder & step-by-step simulator for the Fetch-Decode-Execute (F-D-E) cycle.
 * Models Program Counter (PC), MAR, MDR, CIR, Accumulator (ACC), and execution phases.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface InstructionCycleModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

export interface FdeStage {
  name: string;
  subtext: string;
  color: string;
  registerActivity: string;
}

const PRESET_PROGRAMS = {
  add: {
    name: 'Arithmetic: ADD R1, R2',
    instruction: 'ADD R1, R2',
    description: 'Add contents of register R2 to R1 via ALU and store result in Accumulator',
    pc: '0x004',
    mar: '0x004',
    mdr: '0x2102',
    cir: 'ADD R1, R2',
    acc: '42',
  },
  load: {
    name: 'Memory Read: LOAD 0x1A',
    instruction: 'LOAD 0x1A',
    description: 'Load operand data from RAM address 0x1A into Memory Data Register & ACC',
    pc: '0x002',
    mar: '0x01A',
    mdr: '0x007F',
    cir: 'LOAD 0x1A',
    acc: '127',
  },
  store: {
    name: 'Memory Write: STORE 0x2B',
    instruction: 'STORE 0x2B',
    description: 'Store accumulated calculation result from ACC to RAM address 0x2B',
    pc: '0x006',
    mar: '0x02B',
    mdr: '0x00FF',
    cir: 'STORE 0x2B',
    acc: '255',
  },
  branch: {
    name: 'Control Flow: JMP 0x10',
    instruction: 'JMP 0x10',
    description: 'Branch execution path unconditionally by setting Program Counter to 0x10',
    pc: '0x010',
    mar: '0x008',
    mdr: '0x4010',
    cir: 'JMP 0x10',
    acc: '0',
  },
};

const STAGES: FdeStage[] = [
  {
    name: '1. FETCH',
    subtext: 'Copy PC to MAR, read RAM at MAR into MDR, copy MDR into CIR, PC = PC + 1',
    color: '#38bdf8',
    registerActivity: 'PC ➔ MAR ➔ RAM ➔ MDR ➔ CIR',
  },
  {
    name: '2. DECODE',
    subtext: 'Control Unit (CU) interprets opcode, addressing mode, and operand register IDs',
    color: '#fbbf24',
    registerActivity: 'CU decodes CIR opcode & arguments',
  },
  {
    name: '3. EXECUTE',
    subtext: 'ALU performs integer calculation, bit shift, or data bus routes memory transfer',
    color: '#10b981',
    registerActivity: 'ALU calculates / Data Bus transfers',
  },
  {
    name: '4. STORE & CHECK',
    subtext: 'Results written to ACC or RAM; CPU polls interrupt flags before next instruction',
    color: '#a78bfa',
    registerActivity: 'Result ➔ ACC/RAM, check IRQ flags',
  },
];

export function InstructionCycleModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: InstructionCycleModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || 'CPU Instruction Cycle (F-D-E)'
  );
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESET_PROGRAMS>('add');
  const [instruction, setInstruction] = useState<string>(
    existingShape?.params?.instruction || PRESET_PROGRAMS.add.instruction
  );
  const [activeStageIdx, setActiveStageIdx] = useState<number>(
    existingShape?.params?.activeStageIndex ?? 0
  );
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );

  // Register Values
  const [pc, setPc] = useState<string>(existingShape?.params?.pc || PRESET_PROGRAMS.add.pc);
  const [mar, setMar] = useState<string>(existingShape?.params?.mar || PRESET_PROGRAMS.add.mar);
  const [mdr, setMdr] = useState<string>(existingShape?.params?.mdr || PRESET_PROGRAMS.add.mdr);
  const [cir, setCir] = useState<string>(existingShape?.params?.cir || PRESET_PROGRAMS.add.cir);
  const [acc, setAcc] = useState<string>(existingShape?.params?.acc || PRESET_PROGRAMS.add.acc);

  const currentPageIndex = docState.currentPageIndex;

  const handleSelectPreset = (key: keyof typeof PRESET_PROGRAMS) => {
    setSelectedPreset(key);
    const p = PRESET_PROGRAMS[key];
    setInstruction(p.instruction);
    setPc(p.pc);
    setMar(p.mar);
    setMdr(p.mdr);
    setCir(p.cir);
    setAcc(p.acc);
  };

  const handleNextStage = () => {
    setActiveStageIdx((prev) => (prev + 1) % STAGES.length);
  };

  const handlePrevStage = () => {
    setActiveStageIdx((prev) => (prev - 1 + STAGES.length) % STAGES.length);
  };

  const handleSave = () => {
    const width = 540;
    const height = 400;

    const params = {
      diagramType: 'instructionCycle',
      title,
      instruction,
      activeStageIndex: activeStageIdx,
      fontSize,
      pc,
      mar,
      mdr,
      cir,
      acc,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        label: title,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('csDiagram', 200, 160, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#a855f7',
      label: title,
    });

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      `Insert ${title}`
    );

    onInsertSuccess?.();
    onClose();
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card"
        style={{ maxWidth: '840px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🔁</span>
            <div>
              <h3>CPU Instruction Cycle (Fetch-Decode-Execute)</h3>
              <p>Model the cyclical execution flow and internal register transformations</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Instruction:</label>
            <input
              type="text"
              className="cs-modal-input"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. ADD R1, R2"
            />
          </div>

          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Preset Program:</label>
            <select
              className="cs-modal-select"
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value as keyof typeof PRESET_PROGRAMS)}
            >
              {Object.entries(PRESET_PROGRAMS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        {/* Body */}
        <div className="submodal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 4 Lifecycle Stages Interactive Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {STAGES.map((st, idx) => {
              const isActive = activeStageIdx === idx;
              return (
                <div
                  key={st.name}
                  onClick={() => setActiveStageIdx(idx)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 8,
                    border: '1.5px solid',
                    borderColor: isActive ? st.color : 'rgba(255, 255, 255, 0.1)',
                    background: isActive ? `${st.color}22` : 'rgba(15, 23, 42, 0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? `0 0 16px ${st.color}44` : 'none',
                  }}
                >
                  <div style={{ color: st.color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    {st.name} {isActive && '★'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.35 }}>
                    {st.subtext}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? '#ffffff' : '#64748b',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {st.registerActivity}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stepper Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button className="cs-action-btn-sm" onClick={handlePrevStage}>
              ◀ Previous Phase
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
              Phase {activeStageIdx + 1} of 4: <span style={{ color: STAGES[activeStageIdx].color }}>{STAGES[activeStageIdx].name}</span>
            </span>
            <button className="cs-action-btn-sm cs-action-btn-primary" onClick={handleNextStage}>
              Next Phase ▶
            </button>
          </div>

          {/* CPU Registers State Panel */}
          <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, border: '1px solid rgba(168,85,247,0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#c084fc', marginBottom: 8 }}>
              CURRENT REGISTER VALUES (PHASE {activeStageIdx + 1})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>PC (Program Counter)</span>
                <input
                  type="text"
                  value={pc}
                  onChange={(e) => setPc(e.target.value)}
                  className="cs-modal-input"
                  style={{ width: '100%', fontSize: 12, marginTop: 4, padding: '3px 6px' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>MAR (Address Reg)</span>
                <input
                  type="text"
                  value={mar}
                  onChange={(e) => setMar(e.target.value)}
                  className="cs-modal-input"
                  style={{ width: '100%', fontSize: 12, marginTop: 4, padding: '3px 6px' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>MDR (Data Reg)</span>
                <input
                  type="text"
                  value={mdr}
                  onChange={(e) => setMdr(e.target.value)}
                  className="cs-modal-input"
                  style={{ width: '100%', fontSize: 12, marginTop: 4, padding: '3px 6px' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>CIR (Instruction)</span>
                <input
                  type="text"
                  value={cir}
                  onChange={(e) => setCir(e.target.value)}
                  className="cs-modal-input"
                  style={{ width: '100%', fontSize: 12, marginTop: 4, padding: '3px 6px' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>ACC (Accumulator)</span>
                <input
                  type="text"
                  value={acc}
                  onChange={(e) => setAcc(e.target.value)}
                  className="cs-modal-input"
                  style={{ width: '100%', fontSize: 12, marginTop: 4, padding: '3px 6px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            💡 Double-click diagram on whiteboard anytime to step through phases
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="submodal-btn submodal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="submodal-btn submodal-btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Cycle on Board' : 'Insert Instruction Cycle onto Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

