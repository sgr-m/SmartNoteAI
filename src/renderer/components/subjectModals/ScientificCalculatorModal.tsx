/**
 * Scientific Calculator Modal
 * Interactive scientific calculator with arithmetic, trigonometry, powers, logs, and canvas insertion
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createFormula, executeAddObject } from '../../services/subjectModules/commonHelpers';
import './SubjectModals.css';

interface ScientificCalculatorModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
}

export function ScientificCalculatorModal({ onClose, onInsertSuccess }: ScientificCalculatorModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number>(0);
  const [isRad, setIsRad] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const currentPageIndex = docState.currentPageIndex;

  const handleDigit = (digit: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? digit : prev + digit));
  };

  const handleOp = (op: string) => {
    setDisplay((prev) => prev + ' ' + op + ' ');
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleDelete = () => {
    setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1).trimEnd()));
  };

  const handleEvaluate = () => {
    try {
      const sanitized = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e(?![a-zA-Z])/g, 'Math.E')
        .replace(/\^/g, '**');

      const fn = new Function('Math', `with (Math) { return ${sanitized}; }`);
      const result = fn(Math);

      if (typeof result === 'number' && !isNaN(result)) {
        const formatted = Number(result.toFixed(8)).toString();
        setHistory((prev) => [display + ' = ' + formatted, ...prev.slice(0, 4)]);
        setDisplay(formatted);
      } else {
        setDisplay('Error');
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleSciFunction = (fnName: string) => {
    try {
      const val = parseFloat(display);
      let res = 0;
      const angleMultiplier = isRad ? 1 : Math.PI / 180;

      switch (fnName) {
        case 'sin':
          res = Math.sin(val * angleMultiplier);
          break;
        case 'cos':
          res = Math.cos(val * angleMultiplier);
          break;
        case 'tan':
          res = Math.tan(val * angleMultiplier);
          break;
        case 'sqrt':
          res = Math.sqrt(val);
          break;
        case 'sqr':
          res = val * val;
          break;
        case 'ln':
          res = Math.log(val);
          break;
        case 'log10':
          res = Math.log10(val);
          break;
        case 'inv':
          res = 1 / val;
          break;
        case 'neg':
          res = -val;
          break;
      }

      if (!isNaN(res)) {
        const formatted = Number(res.toFixed(8)).toString();
        setHistory((prev) => [`${fnName}(${val}) = ${formatted}`, ...prev.slice(0, 4)]);
        setDisplay(formatted);
      } else {
        setDisplay('Error');
      }
    } catch {
      setDisplay('Error');
    }
  };

  const insertOntoCanvas = (includeEquation = false) => {
    const text = includeEquation && history[0] ? history[0] : display;
    const formulaObj = createFormula(text, 280, 220, 32);
    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      formulaObj,
      `Insert Calculator ${includeEquation ? 'Equation' : 'Result'}`
    );
    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card calculator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🧮</span>
            <h3>Scientific Calculator</h3>
          </div>
          <button className="submodal-close" onClick={onClose}>✕</button>
        </div>

        {/* Display */}
        <div className="calc-display-panel">
          <div className="calc-history">{history[0] || ''}</div>
          <div className="calc-current">{display}</div>
        </div>

        {/* Mode Toggle */}
        <div className="calc-mode-bar">
          <button
            className={`calc-toggle-btn ${!isRad ? 'active' : ''}`}
            onClick={() => setIsRad(false)}
          >
            DEG
          </button>
          <button
            className={`calc-toggle-btn ${isRad ? 'active' : ''}`}
            onClick={() => setIsRad(true)}
          >
            RAD
          </button>
          <button className="calc-mem-btn" onClick={() => setMemory(parseFloat(display) || 0)}>
            M+
          </button>
          <button className="calc-mem-btn" onClick={() => setDisplay(String(memory))}>
            MR ({memory})
          </button>
        </div>

        {/* Buttons Grid */}
        <div className="calc-buttons-grid">
          {/* Row 1: Sci Functions */}
          <button onClick={() => handleSciFunction('sin')}>sin</button>
          <button onClick={() => handleSciFunction('cos')}>cos</button>
          <button onClick={() => handleSciFunction('tan')}>tan</button>
          <button onClick={() => handleSciFunction('sqrt')}>√x</button>
          <button onClick={() => handleSciFunction('sqr')}>x²</button>

          {/* Row 2: Sci Functions */}
          <button onClick={() => handleSciFunction('ln')}>ln</button>
          <button onClick={() => handleSciFunction('log10')}>log</button>
          <button onClick={() => handleDigit('π')}>π</button>
          <button onClick={() => handleDigit('e')}>e</button>
          <button onClick={() => handleOp('^')}>^</button>

          {/* Row 3 */}
          <button className="calc-btn-action" onClick={handleClear}>C</button>
          <button className="calc-btn-action" onClick={handleDelete}>DEL</button>
          <button onClick={() => handleDigit('(')}>(</button>
          <button onClick={() => handleDigit(')')}>)</button>
          <button className="calc-btn-op" onClick={() => handleOp('÷')}>÷</button>

          {/* Row 4 */}
          <button className="calc-btn-num" onClick={() => handleDigit('7')}>7</button>
          <button className="calc-btn-num" onClick={() => handleDigit('8')}>8</button>
          <button className="calc-btn-num" onClick={() => handleDigit('9')}>9</button>
          <button className="calc-btn-op" onClick={() => handleOp('×')}>×</button>
          <button onClick={() => handleSciFunction('inv')}>1/x</button>

          {/* Row 5 */}
          <button className="calc-btn-num" onClick={() => handleDigit('4')}>4</button>
          <button className="calc-btn-num" onClick={() => handleDigit('5')}>5</button>
          <button className="calc-btn-num" onClick={() => handleDigit('6')}>6</button>
          <button className="calc-btn-op" onClick={() => handleOp('-')}>-</button>
          <button onClick={() => handleSciFunction('neg')}>±</button>

          {/* Row 6 */}
          <button className="calc-btn-num" onClick={() => handleDigit('1')}>1</button>
          <button className="calc-btn-num" onClick={() => handleDigit('2')}>2</button>
          <button className="calc-btn-num" onClick={() => handleDigit('3')}>3</button>
          <button className="calc-btn-op" onClick={() => handleOp('+')}>+</button>
          <button className="calc-btn-eq" onClick={handleEvaluate}>=</button>

          {/* Row 7 */}
          <button className="calc-btn-num span-2" onClick={() => handleDigit('0')}>0</button>
          <button className="calc-btn-num" onClick={() => handleDigit('.')}>.</button>
        </div>

        {/* Insertion Footer */}
        <div className="submodal-footer">
          <button className="btn btn-secondary" onClick={() => insertOntoCanvas(true)}>
            📝 Insert Equation ({history[0] || display})
          </button>
          <button className="btn btn-primary" onClick={() => insertOntoCanvas(false)}>
            📌 Insert Result ({display})
          </button>
        </div>
      </div>
    </div>
  );
}
