/**
 * Function Plotter Modal (Section 16.1)
 * Configurable axes, labels, grid lines, custom equations, and graph placement
 */

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { compileMathFunction } from '../../services/subjectModules/mathFunctionParser';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface FunctionPlotterModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
}

const PRESET_FUNCTIONS = [
  { label: 'sin(x)', expr: 'sin(x)', xRange: [-10, 10], yRange: [-2, 2] },
  { label: 'cos(x)', expr: 'cos(x)', xRange: [-10, 10], yRange: [-2, 2] },
  { label: 'tan(x)', expr: 'tan(x)', xRange: [-5, 5], yRange: [-5, 5] },
  { label: 'x²', expr: 'x^2', xRange: [-5, 5], yRange: [-2, 20] },
  { label: 'x³ - 3x', expr: 'x^3 - 3*x', xRange: [-3, 3], yRange: [-5, 5] },
  { label: '√x', expr: 'sqrt(x)', xRange: [0, 10], yRange: [-1, 4] },
  { label: '1/x', expr: '1/x', xRange: [-6, 6], yRange: [-6, 6] },
  { label: 'eˣ', expr: 'exp(x)', xRange: [-4, 4], yRange: [-1, 15] },
  { label: 'ln(x)', expr: 'ln(x)', xRange: [0.1, 10], yRange: [-3, 3] },
  { label: '2x + 1', expr: '2*x + 1', xRange: [-6, 6], yRange: [-6, 6] },
  { label: '|x|', expr: 'abs(x)', xRange: [-5, 5], yRange: [-1, 6] },
  { label: 'sin(2x)cos(x)', expr: 'sin(2x)*cos(x)', xRange: [-6, 6], yRange: [-1.5, 1.5] },
];

export function FunctionPlotterModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
}: FunctionPlotterModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [expression, setExpression] = useState<string>(
    existingShape?.params?.expression ?? 'sin(x)'
  );
  const [xMin, setXMin] = useState<number>(existingShape?.params?.xMin ?? -10);
  const [xMax, setXMax] = useState<number>(existingShape?.params?.xMax ?? 10);
  const [yMin, setYMin] = useState<number>(existingShape?.params?.yMin ?? -2);
  const [yMax, setYMax] = useState<number>(existingShape?.params?.yMax ?? 2);

  const currentPageIndex = docState.currentPageIndex;

  // Compile user's expression with error diagnostics
  const compiled = useMemo(() => {
    return compileMathFunction(expression);
  }, [expression]);

  const handleApplyPreset = (preset: typeof PRESET_FUNCTIONS[0]) => {
    setExpression(preset.expr);
    setXMin(preset.xRange[0]);
    setXMax(preset.xRange[1]);
    setYMin(preset.yRange[0]);
    setYMax(preset.yRange[1]);
  };

  const handleSave = () => {
    const cleanLabel = `y = ${expression.replace(/^[a-zA-Z](\([a-zA-Z]\))?\s*=\s*/, '')}`;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        label: cleanLabel,
        params: {
          ...existingShape.params,
          expression,
          xMin,
          xMax,
          yMin,
          yMax,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const plotObj = createShape('functionPlot', 220, 120, 540, 420, {
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      params: {
        expression,
        xMin,
        xMax,
        yMin,
        yMax,
      },
      label: cleanLabel,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      plotObj,
      `Plot Function: ${cleanLabel}`
    );
    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // Generate SVG path for live preview
  const previewWidth = 520;
  const previewHeight = 220;
  const samples = 200;

  const validXRange = xMax > xMin ? xMax - xMin : 1;
  const validYRange = yMax > yMin ? yMax - yMin : 1;

  const mapX = (mx: number) => ((mx - xMin) / validXRange) * previewWidth;
  const mapY = (my: number) => previewHeight - ((my - yMin) / validYRange) * previewHeight;

  let pathD = '';
  if (compiled.isValid) {
    let inSegment = false;
    for (let i = 0; i <= samples; i++) {
      const mx = xMin + (i / samples) * validXRange;
      const my = compiled.fn(mx);
      if (!isNaN(my) && isFinite(my) && my >= yMin - (validYRange * 0.2) && my <= yMax + (validYRange * 0.2)) {
        const sx = mapX(mx);
        const sy = mapY(my);
        if (!inSegment) {
          pathD += ` M ${sx.toFixed(1)} ${sy.toFixed(1)}`;
          inSegment = true;
        } else {
          pathD += ` L ${sx.toFixed(1)} ${sy.toFixed(1)}`;
        }
      } else {
        inSegment = false;
      }
    }
  }

  const originX = mapX(0);
  const originY = mapY(0);

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card function-modal" onClick={(e) => e.stopPropagation()}>
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📉</span>
            <div>
              <h3>Function Plotter & Coordinate Grapher</h3>
              <p>Type any algebraic, trigonometric, or calculus equation (e.g. sin(2x), x^2 - 4x + 3, e^x)</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Expression Input & Presets */}
        <div className="function-input-section">
          <div className="func-input-row">
            <span className="func-prefix">y =</span>
            <input
              type="text"
              className="func-input"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. sin(2x), x^2 - 4, cos(x) + 2, e^(-x^2)..."
              autoFocus
            />
          </div>

          {/* Validation Feedback */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {compiled.isValid ? (
              <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✓ Valid Equation</span>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>({compiled.cleanedExpr})</span>
              </span>
            ) : (
              <span style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>⚠️ {compiled.error}</span>
              </span>
            )}
            <span style={{ fontSize: 11, color: '#64748b' }}>Supports ^, sin, cos, tan, sqrt, abs, ln, exp, pi</span>
          </div>

          <div className="func-presets-row">
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Presets:</span>
            {PRESET_FUNCTIONS.map((p) => (
              <button
                key={p.expr}
                className={`preset-pill ${expression === p.expr ? 'active' : ''}`}
                onClick={() => handleApplyPreset(p)}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live SVG Graph Preview */}
        <div className="func-graph-preview-box">
          <svg width={previewWidth} height={previewHeight} className="func-svg-preview" style={{ background: '#090d16', borderRadius: 8, border: '1px solid #1e293b' }}>
            {/* Grid background lines */}
            {[-4, -2, 0, 2, 4].map((v) => {
              const gx = mapX((v / 4) * validXRange + xMin);
              const gy = mapY((v / 4) * validYRange + yMin);
              return (
                <React.Fragment key={v}>
                  <line x1={gx} y1={0} x2={gx} y2={previewHeight} stroke="#1e293b" strokeDasharray="3,3" strokeWidth={1} />
                  <line x1={0} y1={gy} x2={previewWidth} y2={gy} stroke="#1e293b" strokeDasharray="3,3" strokeWidth={1} />
                </React.Fragment>
              );
            })}

            {/* X Axis */}
            {originY >= 0 && originY <= previewHeight && (
              <line x1={0} y1={originY} x2={previewWidth} y2={originY} stroke="#64748b" strokeWidth={1.5} />
            )}

            {/* Y Axis */}
            {originX >= 0 && originX <= previewWidth && (
              <line x1={originX} y1={0} x2={originX} y2={previewHeight} stroke="#64748b" strokeWidth={1.5} />
            )}

            {/* Axis Labels */}
            {originY >= 0 && originY <= previewHeight && (
              <text x={previewWidth - 14} y={originY - 6} fill="#94a3b8" fontSize="11" fontWeight="bold">X</text>
            )}
            {originX >= 0 && originX <= previewWidth && (
              <text x={originX + 6} y={16} fill="#94a3b8" fontSize="11" fontWeight="bold">Y</text>
            )}

            {/* Function Curve */}
            {pathD && <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth={2.5} />}
          </svg>
        </div>

        {/* Range Controls */}
        <div className="func-range-grid">
          <div className="range-item">
            <label>X Min:</label>
            <input type="number" value={xMin} onChange={(e) => setXMin(Number(e.target.value))} />
          </div>
          <div className="range-item">
            <label>X Max:</label>
            <input type="number" value={xMax} onChange={(e) => setXMax(Number(e.target.value))} />
          </div>
          <div className="range-item">
            <label>Y Min:</label>
            <input type="number" value={yMin} onChange={(e) => setYMin(Number(e.target.value))} />
          </div>
          <div className="range-item">
            <label>Y Max:</label>
            <input type="number" value={yMax} onChange={(e) => setYMax(Number(e.target.value))} />
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            type="button"
            disabled={!compiled.isValid}
          >
            📈 {existingShape ? 'Update Function Plot' : 'Insert Function Plot onto Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
