/**
 * Interactive Flowchart Builder & Pseudocode-to-Flowchart Converter Modal
 * Supports visual interactive node editing, live SVG rendering with zoom/pan,
 * automated conversion of pseudocode to standard flowchart diagrams,
 * and SmartBoard placement (as a unified card or individual canvas shapes).
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject, executeAddMultipleObjects } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  FlowchartGraph,
  FlowchartGraphNode,
  FlowchartGraphEdge,
  convertPseudocodeToFlowchart,
} from '../../services/subjectModules/csSyntaxHighlighter';
import './SubjectModals.css';

interface FlowchartBuilderModalProps {
  initialPseudocode?: string;
  initialTitle?: string;
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const PRESET_FLOWCHARTS: Record<string, { title: string; pseudocode: string }> = {
  evenOdd: {
    title: 'Check Even or Odd',
    pseudocode: `START
INPUT num
IF num MOD 2 = 0 THEN
    OUTPUT "Even Number"
ELSE
    OUTPUT "Odd Number"
ENDIF
END`,
  },
  votingAge: {
    title: 'Voting Eligibility',
    pseudocode: `START
INPUT age
IF age >= 18 THEN
    OUTPUT "Eligible to Vote"
ELSE
    OUTPUT "Not Eligible"
ENDIF
END`,
  },
  sumN: {
    title: 'Sum of 1 to N',
    pseudocode: `START
INPUT N
sum ← 0
i ← 1
WHILE i <= N DO
    sum ← sum + i
    i ← i + 1
ENDWHILE
OUTPUT sum
END`,
  },
  maxThree: {
    title: 'Find Maximum of 3 Numbers',
    pseudocode: `START
INPUT a, b, c
IF a > b AND a > c THEN
    max ← a
ELSE
    IF b > c THEN
        max ← b
    ELSE
        max ← c
    ENDIF
ENDIF
OUTPUT max
END`,
  },
  linearSearch: {
    title: 'Linear Search Algorithm',
    pseudocode: `START
INPUT target
found ← -1
i ← 0
WHILE i < LENGTH(arr) DO
    IF arr[i] = target THEN
        found ← i
    ENDIF
    i ← i + 1
ENDWHILE
OUTPUT found
END`,
  },
};

export function FlowchartBuilderModal({
  initialPseudocode,
  initialTitle,
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: FlowchartBuilderModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  // Mode: "converter" (pseudocode to flowchart) or "builder" (node-by-node)
  const [activeTab, setActiveTab] = useState<'converter' | 'builder'>('converter');

  // Pseudocode Converter state
  const [pseudocodeText, setPseudocodeText] = useState<string>(
    initialPseudocode ||
      existingShape?.params?.sourcePseudocode ||
      PRESET_FLOWCHARTS.evenOdd.pseudocode
  );
  const [flowchartTitle, setFlowchartTitle] = useState<string>(
    initialTitle ||
      existingShape?.params?.title ||
      existingShape?.label ||
      'Algorithm Flowchart'
  );

  // Graph state (nodes & edges)
  const [graph, setGraph] = useState<FlowchartGraph>(() => {
    if (existingShape?.params?.nodes && existingShape?.params?.edges) {
      return {
        title: existingShape.params.title || 'Algorithm Flowchart',
        nodes: existingShape.params.nodes,
        edges: existingShape.params.edges,
      };
    }
    const pseudo =
      initialPseudocode ||
      existingShape?.params?.sourcePseudocode ||
      PRESET_FLOWCHARTS.evenOdd.pseudocode;
    return convertPseudocodeToFlowchart(pseudo, flowchartTitle);
  });

  // Selected node for editing
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Zoom level for preview
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);

  const currentPageIndex = docState.currentPageIndex;

  // Trigger conversion from pseudocode
  const handleConvert = () => {
    const generated = convertPseudocodeToFlowchart(pseudocodeText, flowchartTitle);
    setGraph(generated);
  };

  // Preset algorithm selection
  const handlePresetSelect = (key: string) => {
    const tmpl = PRESET_FLOWCHARTS[key];
    if (tmpl) {
      setFlowchartTitle(tmpl.title);
      setPseudocodeText(tmpl.pseudocode);
      const generated = convertPseudocodeToFlowchart(tmpl.pseudocode, tmpl.title);
      setGraph(generated);
    }
  };

  // Node builder operations
  const handleAddNode = (type: FlowchartGraphNode['type']) => {
    const newId = String(Date.now());
    let defaultLabel = 'Process Step';
    if (type === 'terminator') defaultLabel = 'End';
    else if (type === 'decision') defaultLabel = 'Condition ?';
    else if (type === 'inputOutput') defaultLabel = 'Read Input';

    const lastNode = graph.nodes[graph.nodes.length - 1];
    const newY = lastNode ? (lastNode.y || 0) + (lastNode.height || 60) + 60 : 50;

    const newNode: FlowchartGraphNode = {
      id: newId,
      type,
      label: defaultLabel,
      x: 170,
      y: newY,
      width: type === 'decision' ? 160 : type === 'terminator' ? 140 : 180,
      height: type === 'decision' ? 90 : type === 'terminator' ? 50 : 65,
    };

    const newNodes = [...graph.nodes, newNode];
    const newEdges = [...graph.edges];
    if (lastNode) {
      newEdges.push({ from: lastNode.id, to: newId });
    }

    setGraph({ ...graph, nodes: newNodes, edges: newEdges });
    setSelectedNodeId(newId);
  };

  const handleUpdateNodeLabel = (id: string, newLabel: string) => {
    setGraph({
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === id ? { ...n, label: newLabel } : n)),
    });
  };

  const handleUpdateNodeType = (id: string, newType: FlowchartGraphNode['type']) => {
    setGraph({
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              type: newType,
              width: newType === 'decision' ? 160 : newType === 'terminator' ? 140 : 180,
              height: newType === 'decision' ? 90 : newType === 'terminator' ? 50 : 65,
            }
          : n
      ),
    });
  };

  const handleDeleteNode = (id: string) => {
    setGraph({
      ...graph,
      nodes: graph.nodes.filter((n) => n.id !== id),
      edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === graph.nodes.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newNodes = [...graph.nodes];
    const temp = newNodes[index];
    newNodes[index] = newNodes[targetIdx];
    newNodes[targetIdx] = temp;

    // Recalculate Y positions
    let cy = 50;
    for (const n of newNodes) {
      n.y = cy;
      cy += (n.height || 60) + 70;
    }

    setGraph({ ...graph, nodes: newNodes });
  };

  // Insertion Option 1: Unified Flowchart Card
  const handleInsertCard = () => {
    const totalHeight = Math.max(
      420,
      graph.nodes.reduce((max, n) => Math.max(max, (n.y || 0) + (n.height || 60)), 0) + 80
    );

    const params = {
      diagramType: 'flowchart',
      title: flowchartTitle,
      nodes: graph.nodes,
      edges: graph.edges,
      sourcePseudocode: pseudocodeText,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: {
          ...existingShape.params,
          ...params,
        },
        label: `Flowchart: ${flowchartTitle}`,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const cardObj = createShape('csDiagram', 200, 120, 560, Math.min(850, totalHeight), {
      params,
      fillColor: 'rgba(15, 23, 42, 0.96)',
      strokeColor: '#38bdf8',
      label: `Flowchart: ${flowchartTitle}`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      cardObj,
      `Insert Flowchart Card (${flowchartTitle})`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // Insertion Option 2: Individual Shapes on Board (Editable flowchart pieces)
  const handleInsertCanvasShapes = () => {
    const startX = 250;
    const startY = 160;
    const shapesToAdd: ShapeObject[] = [];

    // Map graph nodes to whiteboard flowchartNode shapes
    for (const node of graph.nodes) {
      let shapeNodeType = 'process';
      let strokeColor = '#38bdf8';
      let fillColor = 'rgba(15, 23, 42, 0.92)';

      if (node.type === 'terminator') {
        shapeNodeType = 'terminator';
        strokeColor = '#10b981'; // Green for Start/End
      } else if (node.type === 'decision') {
        shapeNodeType = 'decision';
        strokeColor = '#f59e0b'; // Amber for decisions
      } else if (node.type === 'inputOutput') {
        shapeNodeType = 'inputOutput';
        strokeColor = '#38bdf8';
      }

      const shape = createShape(
        'flowchartNode',
        startX + (node.x || 0),
        startY + (node.y || 0),
        node.width || 180,
        node.height || 65,
        {
          params: {
            nodeType: shapeNodeType,
            label: node.label,
          },
          strokeColor,
          fillColor,
          label: node.label,
        }
      );
      shapesToAdd.push(shape);
    }

    // Insert arrows for edges
    for (const edge of graph.edges) {
      const fromNode = graph.nodes.find((n) => n.id === edge.from);
      const toNode = graph.nodes.find((n) => n.id === edge.to);

      if (fromNode && toNode) {
        const fromX = startX + (fromNode.x || 0) + (fromNode.width || 180) / 2;
        const fromY = startY + (fromNode.y || 0) + (fromNode.height || 65);
        const toX = startX + (toNode.x || 0) + (toNode.width || 180) / 2;
        const toY = startY + (toNode.y || 0);

        // Arrow shape
        const arrow = createShape('arrow', fromX, fromY, Math.max(20, toX - fromX), Math.max(20, toY - fromY), {
          strokeColor: edge.label === 'Yes' || edge.label === 'True' ? '#10b981' : edge.label === 'No' || edge.label === 'False' ? '#f43f5e' : '#38bdf8',
          strokeWidth: 2,
          label: edge.label,
        });
        shapesToAdd.push(arrow);
      }
    }

    executeAddMultipleObjects(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      shapesToAdd,
      `Insert Flowchart Elements (${flowchartTitle})`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // Calculate SVG dimensions
  const svgWidth = 520;
  const svgHeight = Math.max(
    520,
    graph.nodes.reduce((max, n) => Math.max(max, (n.y || 0) + (n.height || 60)), 0) + 100
  );

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card flowchart-submodal"
        style={{ maxWidth: '1060px', width: '96%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span style={{ fontSize: '26px' }}>🔀</span>
            <div>
              <h3>Interactive Flowchart Builder & Converter</h3>
              <p>Construct algorithmic flowcharts visually or convert pseudocode directly into interactive flowcharts</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>✕</button>
        </div>

        {/* Top Control Bar */}
        <div className="cs-code-toolbar">
          <div className="cs-code-toolbar-group">
            <label className="cs-label">Diagram Title:</label>
            <input
              type="text"
              className="cs-file-input"
              value={flowchartTitle}
              onChange={(e) => setFlowchartTitle(e.target.value)}
              placeholder="e.g. Voting Eligibility Flowchart"
            />
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Mode:</label>
            <div className="cs-theme-toggle">
              <button
                type="button"
                className={`cs-theme-btn ${activeTab === 'converter' ? 'active' : ''}`}
                onClick={() => setActiveTab('converter')}
              >
                ⚡ Pseudocode to Flowchart
              </button>
              <button
                type="button"
                className={`cs-theme-btn ${activeTab === 'builder' ? 'active' : ''}`}
                onClick={() => setActiveTab('builder')}
              >
                🛠️ Visual Node Builder
              </button>
            </div>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Curriculum Presets:</label>
            <select
              className="cs-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handlePresetSelect(e.target.value);
              }}
            >
              <option value="" disabled>Load Algorithm Preset...</option>
              <option value="evenOdd">Check Even or Odd (Decision)</option>
              <option value="votingAge">Voting Eligibility (Decision)</option>
              <option value="sumN">Sum of 1 to N (Loop)</option>
              <option value="maxThree">Maximum of 3 Numbers (Nested)</option>
              <option value="linearSearch">Linear Search in Array</option>
            </select>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Preview Zoom:</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" className="cs-icon-btn" onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}>−</button>
              <span style={{ fontSize: '12px', padding: '4px 6px', color: '#94a3b8' }}>{Math.round(zoomLevel * 100)}%</span>
              <button type="button" className="cs-icon-btn" onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}>+</button>
              <button type="button" className="cs-icon-btn" onClick={() => setZoomLevel(1)}>Reset</button>
            </div>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Font Size:</label>
            <select
              className="cs-select"
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

        {/* Main Body */}
        <div className="cs-editor-split" style={{ minHeight: '440px' }}>
          {/* Left Pane: Converter or Node Builder */}
          <div className="cs-editor-pane" style={{ flex: '1 1 45%' }}>
            {activeTab === 'converter' ? (
              <div className="cs-converter-container">
                <div className="cs-pane-header">
                  <span>📝 Input Pseudocode</span>
                  <button type="button" className="cs-convert-action-btn" onClick={handleConvert}>
                    ⚡ Convert to Flowchart
                  </button>
                </div>
                <textarea
                  className="cs-code-textarea"
                  style={{ height: '360px', padding: '12px', width: '100%', boxSizing: 'border-box' }}
                  value={pseudocodeText}
                  onChange={(e) => setPseudocodeText(e.target.value)}
                  placeholder="Enter or paste pseudocode statements..."
                />
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                  Supports <code>START / END</code>, <code>INPUT / OUTPUT</code>, <code>IF ... THEN ... ELSE</code>, <code>WHILE ... DO</code>, <code>FOR ... NEXT</code>, and assignments.
                </div>
              </div>
            ) : (
              <div className="cs-builder-container">
                <div className="cs-pane-header">
                  <span>🛠️ Flowchart Nodes ({graph.nodes.length})</span>
                  <div className="cs-add-node-bar">
                    <button type="button" className="cs-chip-kw" onClick={() => handleAddNode('terminator')}>+ Terminator</button>
                    <button type="button" className="cs-chip-kw" onClick={() => handleAddNode('process')}>+ Process</button>
                    <button type="button" className="cs-chip-kw" onClick={() => handleAddNode('decision')}>+ Decision</button>
                    <button type="button" className="cs-chip-kw" onClick={() => handleAddNode('inputOutput')}>+ I/O</button>
                  </div>
                </div>

                <div className="cs-nodes-list" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {graph.nodes.map((node, idx) => (
                    <div
                      key={node.id}
                      className={`cs-node-item ${selectedNodeId === node.id ? 'selected' : ''}`}
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      <span className="cs-node-badge" data-type={node.type}>
                        {node.type === 'terminator' ? '⬭' : node.type === 'decision' ? '◇' : node.type === 'inputOutput' ? '▱' : '▭'}
                      </span>
                      <input
                        type="text"
                        className="cs-node-label-input"
                        value={node.label}
                        onChange={(e) => handleUpdateNodeLabel(node.id, e.target.value)}
                      />
                      <select
                        className="cs-node-type-select"
                        value={node.type}
                        onChange={(e) => handleUpdateNodeType(node.id, e.target.value as any)}
                      >
                        <option value="terminator">Terminator</option>
                        <option value="process">Process</option>
                        <option value="decision">Decision</option>
                        <option value="inputOutput">Input / Output</option>
                      </select>
                      <button type="button" className="cs-node-btn" onClick={() => handleMoveNode(idx, 'up')} title="Move Up">↑</button>
                      <button type="button" className="cs-node-btn" onClick={() => handleMoveNode(idx, 'down')} title="Move Down">↓</button>
                      <button type="button" className="cs-node-btn cs-delete-btn" onClick={() => handleDeleteNode(node.id)} title="Delete">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: Live Interactive Flowchart SVG Viewer */}
          <div className="cs-preview-pane" style={{ flex: '1 1 55%', overflow: 'hidden' }}>
            <div className="cs-pane-header">
              <span>👁️ Live Flowchart Canvas</span>
              <span className="cs-badge-highlight">{graph.nodes.length} Steps</span>
            </div>

            <div
              className="cs-flowchart-svg-container"
              style={{
                height: '420px',
                overflow: 'auto',
                backgroundColor: '#0b1120',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '20px',
              }}
            >
              <svg
                width={svgWidth * zoomLevel}
                height={svgHeight * zoomLevel}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ overflow: 'visible' }}
              >
                <defs>
                  {/* Arrowhead marker */}
                  <marker
                    id="fc-arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker
                    id="fc-arrow-yes"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
                  </marker>
                  <marker
                    id="fc-arrow-no"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#f43f5e" />
                  </marker>
                </defs>

                {/* Edges / Connector Lines */}
                {graph.edges.map((edge, eIdx) => {
                  const from = graph.nodes.find((n) => n.id === edge.from);
                  const to = graph.nodes.find((n) => n.id === edge.to);
                  if (!from || !to) return null;

                  const fx = (from.x || 0) + (from.width || 180) / 2;
                  const fy = (from.y || 0) + (from.height || 65);
                  const tx = (to.x || 0) + (to.width || 180) / 2;
                  const ty = to.y || 0;

                  // Branch styling
                  let stroke = '#38bdf8';
                  let marker = 'url(#fc-arrow)';
                  if (edge.label === 'Yes' || edge.label === 'True') {
                    stroke = '#10b981';
                    marker = 'url(#fc-arrow-yes)';
                  } else if (edge.label === 'No' || edge.label === 'False') {
                    stroke = '#f43f5e';
                    marker = 'url(#fc-arrow-no)';
                  }

                  // Loopback edge check
                  const isLoopback = ty < fy;
                  const midY = (fy + ty) / 2;

                  return (
                    <g key={eIdx}>
                      {isLoopback ? (
                        <path
                          d={`M ${fx} ${fy} L ${fx + 120} ${fy} L ${fx + 120} ${ty + 20} L ${tx + (to.width || 180) / 2} ${ty + 20}`}
                          fill="none"
                          stroke={stroke}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          markerEnd={marker}
                        />
                      ) : (
                        <path
                          d={`M ${fx} ${fy} L ${tx} ${ty}`}
                          fill="none"
                          stroke={stroke}
                          strokeWidth="2"
                          markerEnd={marker}
                        />
                      )}

                      {/* Edge Label (e.g. Yes / No) */}
                      {edge.label && (
                        <g transform={`translate(${(fx + tx) / 2 + 10}, ${midY})`}>
                          <rect
                            x="-18"
                            y="-10"
                            width="36"
                            height="20"
                            rx="4"
                            fill="#0f172a"
                            stroke={stroke}
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="4"
                            fill={stroke}
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {edge.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {graph.nodes.map((node) => {
                  const nx = node.x || 0;
                  const ny = node.y || 0;
                  const nw = node.width || 180;
                  const nh = node.height || 65;
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Terminator (Rounded Pill) */}
                      {node.type === 'terminator' && (
                        <rect
                          x={nx}
                          y={ny}
                          width={nw}
                          height={nh}
                          rx={nh / 2}
                          ry={nh / 2}
                          fill="rgba(16, 185, 129, 0.18)"
                          stroke={isSelected ? '#38bdf8' : '#10b981'}
                          strokeWidth={isSelected ? '3' : '2'}
                        />
                      )}

                      {/* Decision (Diamond) */}
                      {node.type === 'decision' && (
                        <polygon
                          points={`${nx + nw / 2},${ny} ${nx + nw},${ny + nh / 2} ${nx + nw / 2},${ny + nh} ${nx},${ny + nh / 2}`}
                          fill="rgba(245, 158, 11, 0.16)"
                          stroke={isSelected ? '#38bdf8' : '#f59e0b'}
                          strokeWidth={isSelected ? '3' : '2'}
                        />
                      )}

                      {/* Input/Output (Parallelogram) */}
                      {node.type === 'inputOutput' && (
                        <polygon
                          points={`${nx + 18},${ny} ${nx + nw},${ny} ${nx + nw - 18},${ny + nh} ${nx},${ny + nh}`}
                          fill="rgba(56, 189, 248, 0.16)"
                          stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                          strokeWidth={isSelected ? '3' : '2'}
                        />
                      )}

                      {/* Process (Rectangle) */}
                      {node.type === 'process' && (
                        <rect
                          x={nx}
                          y={ny}
                          width={nw}
                          height={nh}
                          rx="6"
                          ry="6"
                          fill="rgba(30, 41, 59, 0.9)"
                          stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                          strokeWidth={isSelected ? '3' : '2'}
                        />
                      )}

                      {/* Connector (Circle) */}
                      {node.type === 'connector' && (
                        <circle
                          cx={nx + nw / 2}
                          cy={ny + nh / 2}
                          r={nw / 2}
                          fill="#1e293b"
                          stroke="#a855f7"
                          strokeWidth="2"
                        />
                      )}

                      {/* Node Label Text */}
                      <text
                        x={nx + nw / 2}
                        y={ny + nh / 2 + 5}
                        fill="#ffffff"
                        fontSize={node.type === 'decision' ? '12' : '13'}
                        fontWeight="600"
                        fontFamily="Inter, sans-serif"
                        textAnchor="middle"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Insert as a single diagram card or as individual draggable whiteboard elements.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="submodal-btn submodal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="submodal-btn submodal-btn-secondary"
              onClick={handleInsertCanvasShapes}
              title="Inserts nodes and arrows as individual draggable elements on the board"
            >
              ➕ Insert as Canvas Shapes
            </button>
            <button type="button" className="submodal-btn submodal-btn-primary" onClick={handleInsertCard}>
              {existingShape ? 'Update Flowchart' : 'Insert Flowchart Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


