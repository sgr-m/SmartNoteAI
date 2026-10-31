/**
 * Standardized Pseudocode Modal
 * Full interactive editor for curriculum-standard pseudocode (Cambridge IGCSE/A-Level 9618, CBSE, IB)
 * with keyword assistance, multi-color highlighting, and direct 1-click bridge to Flowchart conversion.
 */

import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import { tokenizeCodeLine, getTokenColor } from '../../services/subjectModules/csSyntaxHighlighter';
import './SubjectModals.css';

interface PseudocodeModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
  onConvertToFlowchart?: (pseudocode: string, title: string) => void;
}

const PSEUDO_TEMPLATES: Record<
  string,
  { name: string; standard: string; title: string; code: string }
> = {
  linearSearch: {
    name: 'Linear Search',
    standard: 'Cambridge IGCSE / A-Level',
    title: 'LinearSearch(A, target)',
    code: `// Linear Search in Array
FUNCTION LinearSearch(arr : ARRAY, target : INTEGER) RETURNS INTEGER
    DECLARE i : INTEGER
    FOR i ← 0 TO LENGTH(arr) - 1
        IF arr[i] = target THEN
            RETURN i
        ENDIF
    NEXT i
    RETURN -1
ENDFUNCTION`,
  },
  binarySearch: {
    name: 'Binary Search',
    standard: 'Cambridge IGCSE / A-Level',
    title: 'BinarySearch(arr, target)',
    code: `// Binary Search in Sorted Array
FUNCTION BinarySearch(arr : ARRAY, target : INTEGER) RETURNS INTEGER
    DECLARE low, high, mid : INTEGER
    low ← 0
    high ← LENGTH(arr) - 1

    WHILE low <= high DO
        mid ← (low + high) DIV 2
        IF arr[mid] = target THEN
            RETURN mid
        ELSE
            IF arr[mid] < target THEN
                low ← mid + 1
            ELSE
                high ← mid - 1
            ENDIF
        ENDIF
    ENDWHILE

    RETURN -1
ENDFUNCTION`,
  },
  bubbleSort: {
    name: 'Bubble Sort',
    standard: 'Cambridge IGCSE / A-Level',
    title: 'BubbleSort(A)',
    code: `// Bubble Sort Algorithm
PROCEDURE BubbleSort(arr : ARRAY)
    DECLARE i, j, temp : INTEGER
    DECLARE n : INTEGER
    n ← LENGTH(arr)

    FOR i ← 0 TO n - 2
        FOR j ← 0 TO n - i - 2
            IF arr[j] > arr[j + 1] THEN
                temp ← arr[j]
                arr[j] ← arr[j + 1]
                arr[j + 1] ← temp
            ENDIF
        NEXT j
    NEXT i
ENDPROCEDURE`,
  },
  selectionSort: {
    name: 'Selection Sort',
    standard: 'Cambridge IGCSE / A-Level',
    title: 'SelectionSort(A)',
    code: `// Selection Sort
PROCEDURE SelectionSort(arr : ARRAY)
    DECLARE i, j, minIdx, temp : INTEGER
    FOR i ← 0 TO LENGTH(arr) - 2
        minIdx ← i
        FOR j ← i + 1 TO LENGTH(arr) - 1
            IF arr[j] < arr[minIdx] THEN
                minIdx ← j
            ENDIF
        NEXT j
        temp ← arr[i]
        arr[i] ← arr[minIdx]
        arr[minIdx] ← temp
    NEXT i
ENDPROCEDURE`,
  },
  factorial: {
    name: 'Factorial (Recursion)',
    standard: 'CBSE / College',
    title: 'Factorial(n)',
    code: `// Recursive Factorial
FUNCTION Factorial(n : INTEGER) RETURNS INTEGER
    IF n <= 1 THEN
        RETURN 1
    ELSE
        RETURN n * Factorial(n - 1)
    ENDIF
ENDFUNCTION`,
  },
  stackOps: {
    name: 'Stack Push & Pop',
    standard: 'Cambridge 9618',
    title: 'Stack ADT Operations',
    code: `// Stack Push Operation
PROCEDURE Push(item : INTEGER)
    IF TopPtr >= MaxSize THEN
        OUTPUT "Error: Stack Overflow"
    ELSE
        TopPtr ← TopPtr + 1
        Stack[TopPtr] ← item
        OUTPUT "Item pushed successfully"
    ENDIF
ENDPROCEDURE`,
  },
  userInputLoop: {
    name: 'Input Validation Loop',
    standard: 'Cambridge IGCSE',
    title: 'ValidateAge()',
    code: `// While Loop Input Validation
PROCEDURE ValidateAge()
    DECLARE age : INTEGER
    OUTPUT "Enter student age (11 - 18): "
    INPUT age

    WHILE age < 11 OR age > 18 DO
        OUTPUT "Invalid age! Re-enter: "
        INPUT age
    ENDWHILE

    OUTPUT "Age accepted: ", age
ENDPROCEDURE`,
  },
};

export function PseudocodeModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
  onConvertToFlowchart,
}: PseudocodeModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || 'LinearSearch(A, target)'
  );
  const [standard, setStandard] = useState<string>(
    existingShape?.params?.standard || 'Cambridge IGCSE / A-Level (9618)'
  );
  const [pseudocode, setPseudocode] = useState<string>(
    existingShape?.params?.code || PSEUDO_TEMPLATES.linearSearch.code
  );
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);

  const currentPageIndex = docState.currentPageIndex;

  // Insert standard keyword at cursor
  const insertKeyword = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = pseudocode.substring(0, start) + snippet + pseudocode.substring(end);
    setPseudocode(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    }, 0);
  };

  // Tab & Auto-indentation key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    ';

      if (e.shiftKey) {
        const before = pseudocode.substring(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const currentLine = pseudocode.substring(lineStart, end);
        if (currentLine.startsWith(spaces)) {
          const newCode = pseudocode.substring(0, lineStart) + currentLine.slice(spaces.length) + pseudocode.substring(end);
          setPseudocode(newCode);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - spaces.length);
            textarea.selectionEnd = Math.max(lineStart, end - spaces.length);
          }, 0);
        }
      } else {
        const newCode = pseudocode.substring(0, start) + spaces + pseudocode.substring(end);
        setPseudocode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        }, 0);
      }
    } else if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const currentLine = pseudocode.substring(0, start).split('\n').pop() || '';
      const match = currentLine.match(/^(\s+)/);
      let indent = match ? match[1] : '';

      if (
        currentLine.toUpperCase().includes('THEN') ||
        currentLine.toUpperCase().includes('DO') ||
        currentLine.toUpperCase().includes('PROCEDURE') ||
        currentLine.toUpperCase().includes('FUNCTION')
      ) {
        indent += '    ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const newCode = pseudocode.substring(0, start) + '\n' + indent + pseudocode.substring(start);
        setPseudocode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  // Preset Template Select
  const handleTemplateSelect = (key: string) => {
    const tmpl = PSEUDO_TEMPLATES[key];
    if (tmpl) {
      setTitle(tmpl.title);
      setPseudocode(tmpl.code);
    }
  };

  // Save / Insert to SmartBoard
  const handleSave = () => {
    const lines = pseudocode.split('\n');
    const dynamicHeight = Math.max(260, Math.min(680, 75 + lines.length * 22));
    const dynamicWidth = Math.max(480, Math.min(760, 200 + Math.max(...lines.map((l) => l.length)) * 9));

    const params = {
      diagramType: 'pseudocode',
      title,
      standard,
      code: pseudocode,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: {
          ...existingShape.params,
          ...params,
        },
        label: `Pseudocode: ${title}`,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const pseudoObj = createShape('csDiagram', 220, 140, dynamicWidth, dynamicHeight, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.96)',
      strokeColor: '#a855f7', // Purple accent for pseudocode
      label: `Pseudocode: ${title}`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      pseudoObj,
      `Insert Pseudocode Block (${title})`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  const lines = pseudocode.split('\n');

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card pseudocode-submodal"
        style={{ maxWidth: '980px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span style={{ fontSize: '26px' }}>📝</span>
            <div>
              <h3>Standardized Pseudocode Platform</h3>
              <p>Curriculum-aligned pseudocode editor with standardized keywords, syntax highlighting, and flowchart generation</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar */}
        <div className="cs-code-toolbar">
          <div className="cs-code-toolbar-group">
            <label className="cs-label">Algorithm Name:</label>
            <input
              type="text"
              className="cs-file-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BinarySearch(arr, target)"
            />
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Curriculum Standard:</label>
            <select
              className="cs-select"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
            >
              <option value="Cambridge IGCSE / A-Level (9618)">Cambridge IGCSE / A-Level (9618)</option>
              <option value="CBSE / NCERT Standard">CBSE / NCERT Standard</option>
              <option value="IB Computer Science">IB Computer Science</option>
              <option value="General College Pseudocode">General College Pseudocode</option>
            </select>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Curriculum Library:</label>
            <select
              className="cs-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleTemplateSelect(e.target.value);
              }}
            >
              <option value="" disabled>Load Curriculum Algorithm...</option>
              <option value="linearSearch">Linear Search</option>
              <option value="binarySearch">Binary Search</option>
              <option value="bubbleSort">Bubble Sort</option>
              <option value="selectionSort">Selection Sort</option>
              <option value="factorial">Factorial (Recursion)</option>
              <option value="stackOps">Stack Push / Pop Operations</option>
              <option value="userInputLoop">Input Validation While Loop</option>
            </select>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Font Size:</label>
            <select
              className="cs-select"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              <option value={12}>12px</option>
              <option value={14}>14px (Standard)</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
            </select>
          </div>
        </div>

        {/* Quick Keyword Inserters */}
        <div className="cs-keyword-bar">
          <span className="cs-keyword-title">Insert Standard Keyword:</span>
          <div className="cs-keyword-chips">
            <button type="button" className="cs-chip-kw kw-arrow" onClick={() => insertKeyword('← ')} title="Assignment Arrow">
              ← Assign
            </button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('DECLARE ')}>DECLARE</button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('INPUT ')}>INPUT</button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('OUTPUT ')}>OUTPUT</button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('IF  THEN\n    \nENDIF')}>IF...THEN</button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('FOR i ← 0 TO n - 1\n    \nNEXT i')}>FOR...NEXT</button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('WHILE  DO\n    \nENDWHILE')}>WHILE...DO</button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('PROCEDURE MyProc()\n    \nENDPROCEDURE')}>PROCEDURE</button>
            <button type="button" className="cs-chip-kw" onClick={() => insertKeyword('FUNCTION MyFunc() RETURNS INTEGER\n    \nENDFUNCTION')}>FUNCTION</button>
          </div>
        </div>

        {/* Split View: Editor + Live Preview */}
        <div className="cs-editor-split">
          {/* Left: Input Textarea */}
          <div className="cs-editor-pane">
            <div className="cs-pane-header">
              <span>✏️ Pseudocode Input</span>
              <span className="cs-pane-tip">Tab to indent • Auto-indent enabled</span>
            </div>
            <div className="cs-textarea-container">
              <div className="cs-line-numbers">
                {lines.map((_, idx) => (
                  <div key={idx} className="cs-line-num">
                    {idx + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="cs-code-textarea"
                value={pseudocode}
                onChange={(e) => setPseudocode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="Type or paste pseudocode here..."
              />
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="cs-preview-pane">
            <div className="cs-pane-header">
              <span>👁️ Whiteboard Card Preview</span>
              <span className="cs-badge-purple">{standard.split(' ')[0]}</span>
            </div>

            <div
              className="cs-board-card-preview dark"
              style={{
                fontSize: `${fontSize}px`,
                backgroundColor: '#0f172a',
                borderColor: '#a855f7',
              }}
            >
              {/* Card Header Bar */}
              <div className="cs-card-title-bar" style={{ borderBottomColor: 'rgba(168, 85, 247, 0.25)' }}>
                <div className="cs-window-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="cs-card-filename" style={{ color: '#c084fc' }}>
                  📝 {title}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
                  {standard}
                </div>
              </div>

              {/* Code lines */}
              <div className="cs-card-content">
                {lines.map((line, lIdx) => {
                  const tokens = tokenizeCodeLine(line, 'pseudocode');
                  return (
                    <div key={lIdx} className="cs-code-preview-row">
                      <span className="cs-row-num" style={{ color: '#475569' }}>
                        {lIdx + 1}
                      </span>
                      <span className="cs-row-tokens">
                        {tokens.length === 0 ? (
                          <>&nbsp;</>
                        ) : (
                          tokens.map((token, tIdx) => (
                            <span
                              key={tIdx}
                              style={{
                                color: getTokenColor(token.type, 'dark'),
                                whiteSpace: 'pre',
                                fontWeight:
                                  token.type === 'control' || token.type === 'declaration' || token.type === 'function'
                                    ? '600'
                                    : 'normal',
                                fontStyle: token.type === 'comment' ? 'italic' : 'normal',
                              }}
                            >
                              {token.text}
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ justifyContent: 'space-between' }}>
          <div className="cs-footer-left">
            {onConvertToFlowchart && (
              <button
                type="button"
                className="cs-flow-bridge-btn"
                onClick={() => onConvertToFlowchart(pseudocode, title)}
                title="Convert this pseudocode into an interactive visual flowchart"
              >
                🔀 Convert to Flowchart
              </button>
            )}
          </div>
          <div className="cs-footer-right" style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="submodal-btn submodal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="submodal-btn submodal-btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Pseudocode' : 'Insert on Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

