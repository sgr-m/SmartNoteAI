import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  DiagramType,
  detectDiagramType,
  renderDiagramToSvg,
  diagramSvgToDataUrl,
} from '../../services/vectorDiagramService';
import './VectorDiagramModal.css';

interface VectorDiagramModalProps {
  initialCode?: string;
  onClose: () => void;
  onInsert: (svg: string, code: string, type: DiagramType) => void;
}

const TEMPLATES: Array<{ label: string; icon: string; engine: string; code: string }> = [
  {
    label: 'Parabola y = x² - 4',
    icon: '📈',
    engine: 'Function Plot / Graph',
    code: `{\n  "type": "graph",\n  "title": "Quadratic Parabola: y = x^2 - 4",\n  "expressions": ["y = x^2 - 4"],\n  "xRange": [-5, 5],\n  "yRange": [-5, 10],\n  "axes": true,\n  "grid": true\n}`,
  },
  {
    label: 'Sine Wave y = sin(x)',
    icon: '〰️',
    engine: 'Function Plot / Graph',
    code: `{\n  "type": "graph",\n  "title": "Trigonometric Sine Curve",\n  "expressions": ["y = 2 * sin(x)", "y = cos(x)"],\n  "xRange": [-6.28, 6.28],\n  "yRange": [-3, 3],\n  "axes": true,\n  "grid": true\n}`,
  },
  {
    label: 'Algorithm Flowchart',
    icon: '🔀',
    engine: 'Mermaid.js',
    code: `graph TD\n  Start([Start]) --> In[/Input Value x/]\n  In --> Check{x >= 0 ?}\n  Check -- Yes --> Pos[Compute Square Root]\n  Check -- No --> Neg[Output: Negative number]\n  Pos --> Output[/Display Result/]\n  Neg --> Output\n  Output --> Done([End])`,
  },
  {
    label: 'Right Triangle ABC',
    icon: '📐',
    engine: '2D Geometry (JSXGraph)',
    code: `{\n  "type": "geometry",\n  "title": "Right Triangle ABC",\n  "shapes": [\n    {\n      "kind": "triangle",\n      "points": [[-3, -2], [3, -2], [3, 2.5]],\n      "label": "Triangle ABC",\n      "rightAngle": true,\n      "color": "#38bdf8",\n      "fill": "rgba(56, 189, 248, 0.15)"\n    }\n  ]\n}`,
  },
  {
    label: 'Logic Circuit (Half Adder)',
    icon: '⚡',
    engine: 'Digital Logic (CircuitikZ)',
    code: `{\n  "type": "circuit",\n  "title": "Half Adder Circuit",\n  "gates": [\n    { "type": "XOR", "label": "XOR1", "x": 220, "y": 80 },\n    { "type": "AND", "label": "AND1", "x": 220, "y": 200 }\n  ],\n  "inputs": [\n    { "label": "Input A", "x": 60, "y": 80 },\n    { "label": "Input B", "x": 60, "y": 200 }\n  ],\n  "outputs": [\n    { "label": "Sum (S)", "x": 380, "y": 80 },\n    { "label": "Carry (C)", "x": 380, "y": 200 }\n  ]\n}`,
  },
  {
    label: 'Timing Waveform (Clock)',
    icon: '⏱️',
    engine: 'Timing (WaveDrom)',
    code: `{\n  "signal": [\n    { "name": "CLK", "wave": "p........" },\n    { "name": "DATA", "wave": "0.10.10.1" },\n    { "name": "ENABLE", "wave": "0.1..0..." },\n    { "name": "OUTPUT", "wave": "x.3.4.5.x", "data": ["D0", "D1", "D2"] }\n  ]\n}`,
  },
  {
    label: 'TikZ Coordinate Paths',
    icon: '✏️',
    engine: 'TikZ / Vector Path',
    code: `\\begin{tikzpicture}\n  \\draw[->] (-3,0) -- (3,0) node[right] {$x$};\n  \\draw[->] (0,-3) -- (0,3) node[above] {$y$};\n  \\draw[thick, blue] (-2,-1) -- (0,2) -- (2,-1) -- cycle;\n  \\draw (0,0) circle (1.5);\n\\end{tikzpicture}`,
  },
];

export function VectorDiagramModal({
  initialCode,
  onClose,
  onInsert,
}: VectorDiagramModalProps): React.ReactElement {
  const [code, setCode] = useState<string>(
    initialCode || TEMPLATES[0].code
  );
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const detectedType = useMemo(() => detectDiagramType(code), [code]);

  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);

    renderTimeoutRef.current = setTimeout(async () => {
      setIsRendering(true);
      setErrorMsg(null);
      try {
        const res = await renderDiagramToSvg(code, detectedType);
        setRenderedSvg(res.svg);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Diagram syntax parsing error');
      } finally {
        setIsRendering(false);
      }
    }, 200);

    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [code, detectedType]);

  const handleInsert = () => {
    if (!renderedSvg) return;
    onInsert(renderedSvg, code, detectedType);
    onClose();
  };

  const handleCopySvg = async () => {
    if (!renderedSvg) return;
    try {
      await navigator.clipboard.writeText(renderedSvg);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG:', err);
    }
  };

  return (
    <div className="vector-diagram-modal-overlay" onClick={onClose}>
      <div
        className="vector-diagram-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Code-to-Vector Diagram Studio"
      >
        {/* Header */}
        <div className="vector-diagram-header">
          <div className="vector-diagram-title-area">
            <div className="vector-diagram-icon">📐</div>
            <div>
              <h2 className="vector-diagram-title">Code-to-Vector Diagram Studio</h2>
              <p className="vector-diagram-subtitle">
                Create & edit interactive SVG diagrams from code: Mermaid.js, Mathematical Graphs, 2D Geometry, Logic Circuits & Waveforms
              </p>
            </div>
          </div>
          <button
            className="vector-diagram-close-btn"
            onClick={onClose}
            title="Close dialog"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Template Snippets Bar */}
        <div className="vector-diagram-templates-bar">
          <span className="templates-label">Quick Templates:</span>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.label}
              className={`template-chip ${code === tmpl.code ? 'active' : ''}`}
              onClick={() => setCode(tmpl.code)}
              title={`${tmpl.label} (${tmpl.engine})`}
            >
              <span>{tmpl.icon}</span>
              <span>{tmpl.label}</span>
            </button>
          ))}
        </div>

        {/* Main Workspace: Split Pane */}
        <div className="vector-diagram-body">
          {/* Left: Code Editor */}
          <div className="vector-diagram-code-pane">
            <div className="pane-header">
              <span className="pane-title">Diagram Code</span>
              <div className="engine-badge-tag">
                <span className="engine-dot" />
                <span>
                  {detectedType === 'mermaid' && 'Mermaid.js (SVG)'}
                  {detectedType === 'graph' && 'Function Plot (SVG)'}
                  {detectedType === 'geometry' && 'JSXGraph 2D (SVG)'}
                  {detectedType === 'circuit' && 'CircuitikZ Logic (SVG)'}
                  {detectedType === 'timing' && 'WaveDrom Timing (SVG)'}
                  {detectedType === 'tikz' && 'TikZ Vector (SVG)'}
                </span>
              </div>
            </div>

            <textarea
              className="vector-diagram-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste or write diagram code here (Mermaid, JSON graph, JSXGraph geometry, circuit, timing, or TikZ)..."
              spellCheck={false}
            />

            {errorMsg ? (
              <div className="vector-diagram-error-banner">
                <span className="error-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="vector-diagram-status-banner">
                <span>✓ Valid code syntax • Auto-renders vector SVG</span>
              </div>
            )}
          </div>

          {/* Right: Live Vector Preview */}
          <div className="vector-diagram-preview-pane">
            <div className="pane-header">
              <span className="pane-title">Live Vector SVG Preview</span>
              {isRendering && <span className="rendering-indicator">Updating...</span>}
            </div>

            <div className="vector-preview-viewport chalkboard-theme">
              {renderedSvg ? (
                <div
                  className="svg-render-canvas"
                  dangerouslySetInnerHTML={{ __html: renderedSvg }}
                />
              ) : (
                <div className="empty-preview-prompt">
                  <span>Enter diagram code on the left to preview vector output</span>
                </div>
              )}
            </div>

            <div className="preview-pane-footer">
              <div className="footer-left">
                <button
                  className="preview-aux-btn"
                  onClick={handleCopySvg}
                  title="Copy raw SVG markup to clipboard"
                  disabled={!renderedSvg}
                >
                  {copySuccess ? '✓ Copied SVG!' : '📋 Copy SVG'}
                </button>
              </div>

              <div className="footer-right">
                <button className="preview-cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="preview-insert-btn"
                  onClick={handleInsert}
                  disabled={!renderedSvg}
                  title="Insert this vector diagram directly onto the SmartBoard"
                >
                  ➕ Insert onto SmartBoard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
