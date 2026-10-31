/**
 * CPU & Von Neumann Architecture Modal (CS Teaching Platform)
 * Interactive builder for Computer Architecture diagrams:
 * Control Unit (CU), ALU, Registers (PC, MAR, MDR, ACC, CIR),
 * System Buses (Address, Data, Control), Memory (RAM), and I/O devices.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface CpuArchModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

export type ArchitectureType = 'vonNeumann' | 'harvard' | 'fdeCycle';

const ARCH_PRESETS: Record<
  ArchitectureType,
  {
    name: string;
    title: string;
    description: string;
    registers: string[];
    busWidth: string;
  }
> = {
  vonNeumann: {
    name: 'Von Neumann Architecture',
    title: 'Von Neumann Architecture (Stored-Program Concept)',
    description: 'Shared bus and memory space for both program instructions and runtime data',
    registers: ['PC', 'MAR', 'MDR', 'ACC', 'CIR'],
    busWidth: '64-bit',
  },
  harvard: {
    name: 'Harvard Architecture',
    title: 'Harvard Architecture (Dual Memory Spaces)',
    description: 'Physically separated storage and signal pathways for instructions and data',
    registers: ['PC', 'MAR', 'MDR', 'ACC'],
    busWidth: '32-bit',
  },
  fdeCycle: {
    name: 'Fetch-Decode-Execute Flow',
    title: 'Instruction Cycle: Fetch ➔ Decode ➔ Execute',
    description: 'Execution lifecycle of machine instructions inside the Central Processing Unit',
    registers: ['PC', 'MAR', 'MDR', 'CIR', 'ACC'],
    busWidth: '64-bit',
  },
};

export function CpuArchModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: CpuArchModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [archType, setArchType] = useState<ArchitectureType>(
    (existingShape?.params?.archType as ArchitectureType) || 'vonNeumann'
  );
  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || ARCH_PRESETS.vonNeumann.title
  );
  const [registers, setRegisters] = useState<string[]>(
    existingShape?.params?.registers || ARCH_PRESETS.vonNeumann.registers
  );
  const [busWidth, setBusWidth] = useState<string>(
    existingShape?.params?.busWidth || '64-bit'
  );
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );
  const [showIO, setShowIO] = useState<boolean>(
    existingShape?.params?.showIO ?? true
  );

  const currentPageIndex = docState.currentPageIndex;

  const handleSelectArch = (type: ArchitectureType) => {
    setArchType(type);
    const p = ARCH_PRESETS[type];
    setTitle(p.title);
    setRegisters([...p.registers]);
    setBusWidth(p.busWidth);
  };

  const handleToggleRegister = (reg: string) => {
    if (registers.includes(reg)) {
      if (registers.length <= 2) return;
      setRegisters(registers.filter((r) => r !== reg));
    } else {
      setRegisters([...registers, reg]);
    }
  };

  const handleSave = () => {
    const width = 580;
    const height = 420;

    const params = {
      diagramType: 'cpuArchitecture',
      archType,
      title,
      registers,
      busWidth,
      fontSize,
      showIO,
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

    const shapeObj = createShape('csDiagram', 180, 140, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#10b981',
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

  const availableRegisters = ['PC', 'MAR', 'MDR', 'ACC', 'CIR', 'SP', 'FLAGS'];

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card"
        style={{ maxWidth: '820px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🖥️</span>
            <div>
              <h3>CPU & Computer Architecture Diagram Builder</h3>
              <p>Configure processor architecture, registers, system buses, and memory layout</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Architecture Style:</label>
            <select
              className="cs-modal-select"
              value={archType}
              onChange={(e) => handleSelectArch(e.target.value as ArchitectureType)}
            >
              {Object.entries(ARCH_PRESETS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="cs-toolbar-field" style={{ flex: 1 }}>
            <label>Bus Architecture:</label>
            <select
              className="cs-modal-select"
              value={busWidth}
              onChange={(e) => setBusWidth(e.target.value)}
            >
              {['8-bit', '16-bit', '32-bit', '64-bit'].map((w) => (
                <option key={w} value={w}>
                  {w}
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
          {/* Title Customization */}
          <div className="cs-toolbar-field">
            <label>Diagram Title:</label>
            <input
              type="text"
              className="cs-modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Registers Configuration */}
          <div style={{ background: '#0f172a', borderRadius: 8, padding: 14, border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>
              CPU INTERNAL REGISTERS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availableRegisters.map((reg) => {
                const isSelected = registers.includes(reg);
                return (
                  <button
                    key={reg}
                    onClick={() => handleToggleRegister(reg)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: isSelected ? '#10b981' : 'rgba(255,255,255,0.15)',
                      background: isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(15,23,42,0.8)',
                      color: isSelected ? '#34d399' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {reg} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
              • PC = Program Counter &nbsp;|&nbsp; MAR = Memory Address Register &nbsp;|&nbsp; MDR = Memory Data Register &nbsp;|&nbsp; ACC = Accumulator &nbsp;|&nbsp; CIR = Current Instruction Register
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showIO}
                onChange={(e) => setShowIO(e.target.checked)}
              />
              Include Input / Output (I/O) Device Subsystems
            </label>
          </div>

          {/* Architectural Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                Control Unit (CU) & ALU
              </div>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, lineHeight: 1.4 }}>
                The Control Unit coordinates execution signals and instruction decoding, while the ALU handles integer arithmetic and Boolean logic operations.
              </p>
            </div>

            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                System Bus Trio ({busWidth})
              </div>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, lineHeight: 1.4 }}>
                Address Bus (unidirectional), Data Bus (bi-directional), and Control Bus (signal coordination) linking CPU, Memory, and I/O.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            💡 Double-click diagram on whiteboard anytime to reconfigure
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="submodal-btn submodal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="submodal-btn submodal-btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Architecture on Board' : 'Insert Architecture onto Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

