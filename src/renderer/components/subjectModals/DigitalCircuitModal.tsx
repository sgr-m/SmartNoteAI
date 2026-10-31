/**
 * Digital Circuit Modal (Digital Logic Teaching Platform)
 * Interactive designer and live simulator for:
 * 1. Multiplexers (Customizable N:1 MUX: 2:1, 4:1, 8:1, 16:1) with live channel routing
 * 2. Arithmetic Adders (Half Adder & Full Adder) with live bit inputs and truth table
 * 3. Clocked Flip-Flops (D, JK, T, SR) with interactive clock pulses & state transitions
 * 4. 4-Bit Binary Counter with live LED readout, count up/down, and reset
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  evaluateMux,
  evaluateAdder,
  evaluateFlipFlopNextState,
  evaluateCounter,
} from '../../services/subjectModules/digitalLogicModule';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface DigitalCircuitModalProps {
  existingShape?: ShapeObject | null;
  defaultMode?: 'mux' | 'adder' | 'flipflop' | 'counter';
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

type CircuitTab = 'mux' | 'adder' | 'flipflop' | 'counter';

export function DigitalCircuitModal({
  existingShape,
  defaultMode,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: DigitalCircuitModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  // Detect initial circuit mode from existing shape or prop
  const detectInitialTab = (): CircuitTab => {
    if (defaultMode) return defaultMode;
    const bt = existingShape?.params?.blockType;
    if (bt === 'HalfAdder' || bt === 'FullAdder') return 'adder';
    if (bt === 'FlipFlop') return 'flipflop';
    if (bt === 'Counter4' || bt === 'BinaryCounter') return 'counter';
    return 'mux';
  };

  const [activeTab, setActiveTab] = useState<CircuitTab>(detectInitialTab);

  // ─── 1. Multiplexer State ───
  const [muxSize, setMuxSize] = useState<number>(existingShape?.params?.muxSize || 4);
  const [muxInputs, setMuxInputs] = useState<number[]>(() => {
    if (Array.isArray(existingShape?.params?.inputValues)) {
      return existingShape.params.inputValues;
    }
    return [0, 1, 0, 1];
  });
  const [selectedChannel, setSelectedChannel] = useState<number>(existingShape?.params?.selectedChannel ?? 1);

  // Sync inputs array when MUX size changes
  const handleMuxSizeChange = (size: number) => {
    setMuxSize(size);
    setMuxInputs((prev) => Array.from({ length: size }, (_, i) => prev[i] ?? (i % 2 === 1 ? 1 : 0)));
    setSelectedChannel((prev) => Math.min(size - 1, prev));
  };

  const toggleMuxInput = (idx: number) => {
    setMuxInputs((prev) => {
      const next = [...prev];
      next[idx] = (next[idx] ?? 0) === 1 ? 0 : 1;
      return next;
    });
  };

  // ─── 2. Adder State ───
  const [isFullAdder, setIsFullAdder] = useState<boolean>(existingShape?.params?.blockType === 'FullAdder');
  const [inputA, setInputA] = useState<number>(existingShape?.params?.inputA ?? 1);
  const [inputB, setInputB] = useState<number>(existingShape?.params?.inputB ?? 0);
  const [inputCin, setInputCin] = useState<number>(existingShape?.params?.cin ?? 1);

  // ─── 3. Flip-Flop State ───
  const [ffType, setFfType] = useState<'D' | 'JK' | 'T' | 'SR'>((existingShape?.params?.ffType as any) || 'D');
  const [ffStateQ, setFfStateQ] = useState<number>(existingShape?.params?.stateQ ?? 0);
  const [ffInputD, setFfInputD] = useState<number>(existingShape?.params?.inputD ?? 1);
  const [ffInputJ, setFfInputJ] = useState<number>(existingShape?.params?.inputJ ?? 1);
  const [ffInputK, setFfInputK] = useState<number>(existingShape?.params?.inputK ?? 0);
  const [ffInputT, setFfInputT] = useState<number>(existingShape?.params?.inputT ?? 1);
  const [ffInputS, setFfInputS] = useState<number>(existingShape?.params?.inputS ?? 1);
  const [ffInputR, setFfInputR] = useState<number>(existingShape?.params?.inputR ?? 0);

  const handleClockPulse = () => {
    const { nextQ } = evaluateFlipFlopNextState(ffType, ffStateQ, {
      d: ffInputD,
      j: ffInputJ,
      k: ffInputK,
      t: ffInputT,
      s: ffInputS,
      r: ffInputR,
    });
    setFfStateQ(nextQ);
  };

  // ─── 4. Counter State ───
  const [counterVal, setCounterVal] = useState<number>(existingShape?.params?.countValue ?? 0);

  // Global settings
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);
  const [showLabels, setShowLabels] = useState<boolean>(existingShape?.params?.showLabels ?? true);

  // Save / Insert to Whiteboard
  const handleSave = () => {
    let blockType = 'MUX';
    let width = 260;
    let height = 260;
    let label = 'Digital Circuit';
    let params: any = { fontSize, showLabels };

    if (activeTab === 'mux') {
      blockType = 'MUX';
      width = 260;
      height = muxSize === 8 ? 340 : muxSize === 16 ? 480 : 260;
      label = `${muxSize}:1 Multiplexer (MUX)`;
      const selectCount = Math.ceil(Math.log2(muxSize));
      params = {
        ...params,
        blockType: 'MUX',
        muxSize,
        inputs: Array.from({ length: muxSize }, (_, i) => `D${i}`),
        selects: Array.from({ length: selectCount }, (_, i) => `S${i}`),
        inputValues: muxInputs,
        selectedChannel,
        output: 'Y',
      };
    } else if (activeTab === 'adder') {
      blockType = isFullAdder ? 'FullAdder' : 'HalfAdder';
      width = 260;
      height = 220;
      label = isFullAdder ? 'Full Adder (FA)' : 'Half Adder (HA)';
      params = {
        ...params,
        blockType,
        inputA,
        inputB,
        cin: isFullAdder ? inputCin : 0,
        inputs: isFullAdder ? ['A', 'B', 'Cin'] : ['A', 'B'],
        outputs: ['Sum (S)', isFullAdder ? 'Cout' : 'Carry (C)'],
      };
    } else if (activeTab === 'flipflop') {
      blockType = 'FlipFlop';
      width = 220;
      height = 240;
      label = `${ffType} Flip-Flop`;
      params = {
        ...params,
        blockType: 'FlipFlop',
        ffType,
        inputD: ffInputD,
        inputJ: ffInputJ,
        inputK: ffInputK,
        inputT: ffInputT,
        inputS: ffInputS,
        inputR: ffInputR,
        stateQ: ffStateQ,
      };
    } else if (activeTab === 'counter') {
      blockType = 'Counter4';
      width = 280;
      height = 230;
      label = '4-Bit Binary Counter';
      params = {
        ...params,
        blockType: 'Counter4',
        countValue: counterVal,
      };
    }

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        label,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const circuitShape = createShape('logicGate', 230, 160, width, height, {
      params,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      label,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      circuitShape,
      `Insert ${label}`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // Evaluation derived calculations
  const muxOutput = muxInputs[selectedChannel] ?? 0;
  const adderResult = evaluateAdder(isFullAdder, inputA, inputB, inputCin);
  const ffResult = evaluateFlipFlopNextState(ffType, ffStateQ, {
    d: ffInputD,
    j: ffInputJ,
    k: ffInputK,
    t: ffInputT,
    s: ffInputS,
    r: ffInputR,
  });

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card"
        style={{ maxWidth: '780px', maxHeight: '94vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>⚙️</span>
            <div>
              <h3>Combinational & Sequential Circuits</h3>
              <p>Multiplexers (N:1 MUX), Adders, Flip-Flops, and 4-Bit Binary Counter</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'mux' ? 'active' : ''}`}
            onClick={() => setActiveTab('mux')}
            style={{ flex: 1, padding: '10px 12px', borderBottom: activeTab === 'mux' ? '2px solid #38bdf8' : 'none' }}
          >
            🔀 N:1 Multiplexer
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'adder' ? 'active' : ''}`}
            onClick={() => setActiveTab('adder')}
            style={{ flex: 1, padding: '10px 12px', borderBottom: activeTab === 'adder' ? '2px solid #38bdf8' : 'none' }}
          >
            ➕ Arithmetic Adders
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'flipflop' ? 'active' : ''}`}
            onClick={() => setActiveTab('flipflop')}
            style={{ flex: 1, padding: '10px 12px', borderBottom: activeTab === 'flipflop' ? '2px solid #38bdf8' : 'none' }}
          >
            ⏱️ Clocked Flip-Flops
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'counter' ? 'active' : ''}`}
            onClick={() => setActiveTab('counter')}
            style={{ flex: 1, padding: '10px 12px', borderBottom: activeTab === 'counter' ? '2px solid #38bdf8' : 'none' }}
          >
            🔢 4-Bit Counter
          </button>
        </div>

        {/* Body Content */}
        <div className="submodal-body" style={{ overflowY: 'auto', maxHeight: '520px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ─── TAB 1: N:1 MULTIPLEXER ─── */}
          {activeTab === 'mux' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#090d16', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>Select MUX Size:</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[2, 4, 8, 16].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`cs-action-btn-sm ${muxSize === sz ? 'cs-action-btn-primary' : ''}`}
                      onClick={() => handleMuxSizeChange(sz)}
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                    >
                      {sz}:1 MUX
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                  {Math.ceil(Math.log2(muxSize))} Select Lines (S)
                </span>
              </div>

              {/* Channel Selector Pills */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: 6, display: 'block' }}>
                  Routed Channel (Select lines evaluate to this channel):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Array.from({ length: muxSize }, (_, i) => {
                    const isSel = selectedChannel === i;
                    const bit = muxInputs[i] ?? 0;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedChannel(i)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          background: isSel ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.04)',
                          color: isSel ? '#10b981' : '#cbd5e1',
                          border: isSel ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          fontWeight: isSel ? 700 : 500,
                        }}
                      >
                        {isSel ? '▶ ' : ''}D{i} = {bit}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data Input Bit Toggles */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: 6, display: 'block' }}>
                  Click to Toggle Data Bit Values (0 ↔ 1):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Array.from({ length: muxSize }, (_, i) => {
                    const bit = muxInputs[i] ?? 0;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleMuxInput(i)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          background: bit === 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                          color: bit === 1 ? '#10b981' : '#94a3b8',
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                        }}
                      >
                        D{i}: <strong>{bit}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Output Banner */}
              <div style={{ background: '#020617', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Live Routed Expression: </span>
                  <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                    Y = D{selectedChannel} (Channel {selectedChannel})
                  </span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: muxOutput === 1 ? '#10b981' : '#cbd5e1' }}>
                  Output Y = {muxOutput}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: ARITHMETIC ADDERS ─── */}
          {activeTab === 'adder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Adder Type Selector */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className={`cs-action-btn-sm ${!isFullAdder ? 'cs-action-btn-primary' : ''}`}
                  onClick={() => setIsFullAdder(false)}
                  style={{ flex: 1, padding: '8px' }}
                >
                  Half Adder (2 Inputs: A, B → S, C)
                </button>
                <button
                  type="button"
                  className={`cs-action-btn-sm ${isFullAdder ? 'cs-action-btn-primary' : ''}`}
                  onClick={() => setIsFullAdder(true)}
                  style={{ flex: 1, padding: '8px' }}
                >
                  Full Adder (3 Inputs: A, B, Cin → S, Cout)
                </button>
              </div>

              {/* Interactive Bit Toggles */}
              <div style={{ display: 'flex', gap: 12, background: '#090d16', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)', alignItems: 'center', justifyContent: 'space-around' }}>
                <button
                  type="button"
                  onClick={() => setInputA((v) => (v === 1 ? 0 : 1))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    background: inputA === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: inputA === 1 ? '#10b981' : '#cbd5e1',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  Operand A: <strong>{inputA}</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setInputB((v) => (v === 1 ? 0 : 1))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    background: inputB === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                    color: inputB === 1 ? '#10b981' : '#cbd5e1',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  Operand B: <strong>{inputB}</strong>
                </button>

                {isFullAdder && (
                  <button
                    type="button"
                    onClick={() => setInputCin((v) => (v === 1 ? 0 : 1))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      background: inputCin === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                      color: inputCin === 1 ? '#10b981' : '#cbd5e1',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                    }}
                  >
                    Carry-in (Cin): <strong>{inputCin}</strong>
                  </button>
                )}
              </div>

              {/* Arithmetic Live Calculation Card */}
              <div style={{ background: '#020617', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Live Arithmetic Sum & Logic Evaluation:</div>
                <div style={{ fontSize: '18px', fontFamily: 'monospace', color: '#f8fafc', fontWeight: 700 }}>
                  {adderResult.formulaStr}
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                  <div style={{ fontSize: '15px', color: '#38bdf8' }}>
                    Sum (S) = <strong style={{ color: adderResult.sum === 1 ? '#10b981' : '#cbd5e1' }}>{adderResult.sum}</strong>
                  </div>
                  <div style={{ fontSize: '15px', color: '#fbbf24' }}>
                    {isFullAdder ? 'Carry-out (Cout)' : 'Carry (C)'} = <strong style={{ color: adderResult.cout === 1 ? '#10b981' : '#cbd5e1' }}>{adderResult.cout}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: CLOCKED FLIP-FLOPS ─── */}
          {activeTab === 'flipflop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Flip-Flop Type Selector */}
              <div style={{ display: 'flex', gap: 8 }}>
                {(['D', 'JK', 'T', 'SR'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`cs-action-btn-sm ${ffType === t ? 'cs-action-btn-primary' : ''}`}
                    onClick={() => setFfType(t)}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    {t} Flip-Flop
                  </button>
                ))}
              </div>

              {/* Input Toggles & Clock Trigger */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#090d16', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)' }}>
                {ffType === 'D' && (
                  <button
                    type="button"
                    onClick={() => setFfInputD((v) => (v === 1 ? 0 : 1))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      background: ffInputD === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                      color: ffInputD === 1 ? '#10b981' : '#cbd5e1',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                    }}
                  >
                    Data Input (D): <strong>{ffInputD}</strong>
                  </button>
                )}

                {ffType === 'T' && (
                  <button
                    type="button"
                    onClick={() => setFfInputT((v) => (v === 1 ? 0 : 1))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      background: ffInputT === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                      color: ffInputT === 1 ? '#10b981' : '#cbd5e1',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                    }}
                  >
                    Toggle Input (T): <strong>{ffInputT}</strong>
                  </button>
                )}

                {ffType === 'JK' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setFfInputJ((v) => (v === 1 ? 0 : 1))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        background: ffInputJ === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                        color: ffInputJ === 1 ? '#10b981' : '#cbd5e1',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      J: <strong>{ffInputJ}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFfInputK((v) => (v === 1 ? 0 : 1))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        background: ffInputK === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                        color: ffInputK === 1 ? '#10b981' : '#cbd5e1',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      K: <strong>{ffInputK}</strong>
                    </button>
                  </>
                )}

                {ffType === 'SR' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setFfInputS((v) => (v === 1 ? 0 : 1))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        background: ffInputS === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                        color: ffInputS === 1 ? '#10b981' : '#cbd5e1',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      Set (S): <strong>{ffInputS}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFfInputR((v) => (v === 1 ? 0 : 1))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        background: ffInputR === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                        color: ffInputR === 1 ? '#10b981' : '#cbd5e1',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      Reset (R): <strong>{ffInputR}</strong>
                    </button>
                  </>
                )}

                {/* Clock Pulse Trigger Button */}
                <button
                  type="button"
                  className="cs-action-btn-sm cs-action-btn-primary"
                  onClick={handleClockPulse}
                  style={{
                    marginLeft: 'auto',
                    padding: '10px 18px',
                    fontSize: '13px',
                    background: '#f59e0b',
                    color: '#000000',
                    fontWeight: 800,
                  }}
                >
                  ⚡ Trigger Clock Pulse (CLK)
                </button>
              </div>

              {/* State & Mode Display */}
              <div style={{ background: '#020617', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Active Characteristic Mode:</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24' }}>{ffResult.mode}</div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: ffStateQ === 1 ? '#10b981' : '#cbd5e1' }}>
                    Q = {ffStateQ}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: (1 - ffStateQ) === 1 ? '#10b981' : '#cbd5e1' }}>
                    Q̅ = {1 - ffStateQ}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 4: 4-BIT BINARY COUNTER ─── */}
          {activeTab === 'counter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Digital LED Readout */}
              <div
                style={{
                  background: '#020617',
                  border: '2px solid rgba(56,189,248,0.5)',
                  borderRadius: 10,
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 0 24px rgba(16,185,129,0.1)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>
                  4-Bit Synchronous Binary Output [ Q3 Q2 Q1 Q0 ]
                </div>
                <div
                  style={{
                    fontSize: '44px',
                    fontFamily: "'JetBrains Mono', Consolas, monospace",
                    fontWeight: 900,
                    color: '#10b981',
                    letterSpacing: '14px',
                    textShadow: '0 0 16px rgba(16,185,129,0.7)',
                  }}
                >
                  {((counterVal >> 3) & 1)} {((counterVal >> 2) & 1)} {((counterVal >> 1) & 1)} {(counterVal & 1)}
                </div>
                <div style={{ marginTop: 8, fontSize: '16px', color: '#38bdf8', fontWeight: 700 }}>
                  Decimal Value: {counterVal} / 15 {counterVal === 15 ? '🔥 (Terminal Count TC = 1)' : ''}
                </div>
              </div>

              {/* Counter Controls */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="cs-action-btn-sm"
                  onClick={() => setCounterVal((v) => evaluateCounter(v, 'dec'))}
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  ◀ Count Down (-1)
                </button>

                <button
                  type="button"
                  className="cs-action-btn-sm cs-action-btn-primary"
                  onClick={() => setCounterVal((v) => evaluateCounter(v, 'inc'))}
                  style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 800 }}
                >
                  ⚡ Clock Pulse (+1)
                </button>

                <button
                  type="button"
                  className="cs-action-btn-sm"
                  onClick={() => setCounterVal(0)}
                  style={{ padding: '8px 18px', fontSize: '13px', color: '#f87171' }}
                >
                  ↺ Reset (RST)
                </button>
              </div>
            </div>
          )}

          {/* Global Controls: Font Size & Pin Labels */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            <div className="cs-toolbar-field" style={{ minWidth: '100px' }}>
              <label>Font Size:</label>
              <select
                className="cs-modal-select"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              >
                {[11, 12, 14, 16, 18, 20, 24].map((sz) => (
                  <option key={sz} value={sz}>{sz}px</option>
                ))}
              </select>
            </div>

            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0', userSelect: 'none', marginTop: '16px' }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
              />
              <span>Show Pin Names & Labels</span>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Interactive Digital Logic Circuit Block (All inputs evaluated live)
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Circuit Block' : 'Insert Circuit to Whiteboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

