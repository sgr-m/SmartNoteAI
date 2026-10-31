/**
 * Call Stack Diagram Modal (CS Teaching Platform)
 * Interactive LIFO execution stack builder with function activation records,
 * local variables, parameters, push/pop simulation, and presets.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface StackFrame {
  id: string;
  func: string;
  vars: string;
  isTop?: boolean;
}

interface CallStackModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const PRESETS: Record<string, { name: string; title: string; frames: StackFrame[] }> = {
  factorial: {
    name: 'Factorial Recursion (factorial(4))',
    title: 'Call Stack: factorial(4) Recursion',
    frames: [
      { id: '1', func: 'factorial(n=1)', vars: 'n=1, Base case: returns 1', isTop: true },
      { id: '2', func: 'factorial(n=2)', vars: 'n=2, suspended: waiting for 2 * factorial(1)' },
      { id: '3', func: 'factorial(n=3)', vars: 'n=3, suspended: waiting for 3 * factorial(2)' },
      { id: '4', func: 'factorial(n=4)', vars: 'n=4, suspended: waiting for 4 * factorial(3)' },
      { id: '5', func: 'main()', vars: 'int result = factorial(4)' },
    ],
  },
  fibonacci: {
    name: 'Fibonacci Recursion (fib(3))',
    title: 'Call Stack: fib(3) Recursion Tree Branch',
    frames: [
      { id: '1', func: 'fib(n=1)', vars: 'n=1, Base case: returns 1', isTop: true },
      { id: '2', func: 'fib(n=2)', vars: 'n=2, suspended: fib(1) + fib(0)' },
      { id: '3', func: 'fib(n=3)', vars: 'n=3, suspended: fib(2) + fib(1)' },
      { id: '4', func: 'main()', vars: 'cout << fib(3)' },
    ],
  },
  nestedCalls: {
    name: 'Nested Function Calls',
    title: 'Call Stack: Nested Execution Contexts',
    frames: [
      { id: '1', func: 'calculateTax(subtotal=150.0)', vars: 'rate=0.08, tax=12.0', isTop: true },
      { id: '2', func: 'processOrder(orderId=9021)', vars: 'subtotal=150.0, discount=0' },
      { id: '3', func: 'checkout(cartId=44)', vars: 'status="processing"' },
      { id: '4', func: 'main()', vars: 'runServer()' },
    ],
  },
  quicksort: {
    name: 'QuickSort Partitioning',
    title: 'Call Stack: quickSort(arr, low, high)',
    frames: [
      { id: '1', func: 'partition(arr, 0, 2)', vars: 'pivot=arr[2], i=0, j=1', isTop: true },
      { id: '2', func: 'quickSort(arr, 0, 2)', vars: 'low=0, high=2, left half' },
      { id: '3', func: 'quickSort(arr, 0, 5)', vars: 'low=0, high=5, initial call' },
      { id: '4', func: 'main()', vars: 'arr = [7, 2, 1, 6, 8, 5]' },
    ],
  },
};

export function CallStackModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: CallStackModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || PRESETS.factorial.title
  );
  const [frames, setFrames] = useState<StackFrame[]>(
    existingShape?.params?.frames || PRESETS.factorial.frames
  );
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );

  const [newFunc, setNewFunc] = useState<string>('');
  const [newVars, setNewVars] = useState<string>('');

  const currentPageIndex = docState.currentPageIndex;

  // Presets
  const handleSelectPreset = (key: string) => {
    const p = PRESETS[key];
    if (p) {
      setTitle(p.title);
      setFrames(p.frames.map((f) => ({ ...f })));
    }
  };

  // Push Frame to Top
  const handlePushFrame = () => {
    const funcName = newFunc.trim() || 'newFunction()';
    const varsVal = newVars.trim() || 'locals: void';
    const newFrame: StackFrame = {
      id: String(Date.now()),
      func: funcName,
      vars: varsVal,
      isTop: true,
    };
    // Unmark existing tops
    const updated = frames.map((f) => ({ ...f, isTop: false }));
    setFrames([newFrame, ...updated]);
    setNewFunc('');
    setNewVars('');
  };

  // Pop Frame from Top
  const handlePopFrame = () => {
    if (frames.length <= 1) return;
    const remaining = frames.slice(1);
    if (remaining.length > 0) {
      remaining[0].isTop = true;
    }
    setFrames(remaining);
  };

  // Frame editing
  const handleUpdateFrame = (idx: number, field: 'func' | 'vars', val: string) => {
    const next = [...frames];
    next[idx] = { ...next[idx], [field]: val };
    setFrames(next);
  };

  const handleDeleteFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const next = frames.filter((_, i) => i !== idx);
    if (next.length > 0) {
      next[0].isTop = true;
    }
    setFrames(next);
  };

  // Save / Insert
  const handleSave = () => {
    const frameCount = Math.max(1, frames.length);
    const height = Math.max(340, Math.min(650, 70 + frameCount * 65 + 30));
    const width = 420;

    // Ensure first frame is tagged as top
    const sanitizedFrames = frames.map((f, i) => ({
      func: f.func,
      vars: f.vars,
      isTop: i === 0,
    }));

    const params = {
      diagramType: 'callStack',
      title,
      frames: sanitizedFrames,
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

    const shapeObj = createShape('csDiagram', 240, 160, width, height, {
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
        className="subject-submodal-card cs-call-stack-modal"
        style={{ maxWidth: '820px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📚</span>
            <div>
              <h3>Call Stack Diagram Builder</h3>
              <p>Model LIFO execution stack frames, function activations, recursion, and local scopes</p>
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
              placeholder="e.g. Call Stack (Recursion)"
            />
          </div>
          <div className="cs-toolbar-field" style={{ flex: 1 }}>
            <label>Load Recursion Preset:</label>
            <select
              className="cs-modal-select"
              onChange={(e) => handleSelectPreset(e.target.value)}
              defaultValue="factorial"
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

        {/* LIFO Operations Bar */}
        <div className="cs-stack-ops-bar">
          <div className="cs-stack-push-inputs">
            <input
              type="text"
              className="cs-modal-input"
              style={{ width: '220px' }}
              value={newFunc}
              placeholder="Function: foo(x=5)"
              onChange={(e) => setNewFunc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePushFrame()}
            />
            <input
              type="text"
              className="cs-modal-input"
              style={{ flex: 1 }}
              value={newVars}
              placeholder="Locals: x=5, return x*2"
              onChange={(e) => setNewVars(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePushFrame()}
            />
            <button className="cs-action-btn-primary" onClick={handlePushFrame}>
              ▲ Push Frame
            </button>
          </div>
          <button
            className="cs-action-btn-danger"
            onClick={handlePopFrame}
            disabled={frames.length <= 1}
            title="Pop top frame from stack"
          >
            ▼ Pop Frame
          </button>
        </div>

        {/* Visual Stack Frames List (LIFO: Top on top) */}
        <div className="cs-stack-frames-container">
          <div className="cs-stack-indicator-label">
            <span>▲ TOP OF STACK (Active Activation Record)</span>
            <span>GROWTH DIRECTION ▲</span>
          </div>

          <div className="cs-frames-list">
            {frames.map((frame, idx) => {
              const isTop = idx === 0;
              return (
                <div
                  key={frame.id || idx}
                  className={`cs-frame-card ${isTop ? 'frame-top-active' : ''}`}
                >
                  <div className="cs-frame-top-badge">
                    {isTop ? '➔ TOP (ACTIVE)' : `FRAME #${frames.length - idx}`}
                  </div>
                  <div className="cs-frame-inputs">
                    <input
                      type="text"
                      className="cs-frame-func-input"
                      value={frame.func}
                      onChange={(e) => handleUpdateFrame(idx, 'func', e.target.value)}
                      placeholder="functionName(args)"
                    />
                    <input
                      type="text"
                      className="cs-frame-vars-input"
                      value={frame.vars}
                      onChange={(e) => handleUpdateFrame(idx, 'vars', e.target.value)}
                      placeholder="variables, return address, status"
                    />
                  </div>
                  <div className="cs-frame-actions">
                    {frames.length > 1 && (
                      <button
                        className="cs-row-del-btn"
                        title="Delete frame"
                        onClick={() => handleDeleteFrame(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cs-stack-base-label">
            <span>▼ BOTTOM OF STACK (Initial Entry: main / caller)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="subject-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="subject-btn-primary" onClick={handleSave}>
            {existingShape ? 'Update Call Stack' : 'Insert onto Whiteboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

