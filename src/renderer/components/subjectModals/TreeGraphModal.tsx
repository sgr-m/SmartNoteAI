/**
 * Tree & Graph Diagram Modal (CS Teaching Platform)
 * Unified interactive builder for Binary Search Trees (BST) and Graph Networks (directed/undirected, weighted),
 * complete with node/edge manipulation, algorithm presets, and whiteboard insertion.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

export interface GraphNodeDef {
  id: string;
  label: string;
}

export interface GraphEdgeDef {
  from: string;
  to: string;
  weight?: string;
}

interface TreeGraphModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const TREE_PRESETS: Record<
  string,
  {
    name: string;
    title: string;
    rootVal: string;
    leftVal: string;
    rightVal: string;
    leftLeftVal: string;
    leftRightVal: string;
    rightLeftVal: string;
    rightRightVal: string;
  }
> = {
  balancedBst: {
    name: 'Balanced Binary Search Tree (BST)',
    title: 'Binary Search Tree (BST)',
    rootVal: '50',
    leftVal: '30',
    rightVal: '70',
    leftLeftVal: '20',
    leftRightVal: '40',
    rightLeftVal: '60',
    rightRightVal: '80',
  },
  alphabetBst: {
    name: 'Alphabetical BST',
    title: 'Binary Search Tree (Alphabetical)',
    rootVal: 'M',
    leftVal: 'F',
    rightVal: 'T',
    leftLeftVal: 'B',
    leftRightVal: 'H',
    rightLeftVal: 'P',
    rightRightVal: 'Z',
  },
  minHeap: {
    name: 'Min-Heap Priority Queue',
    title: 'Binary Min-Heap (Parent <= Children)',
    rootVal: '10',
    leftVal: '15',
    rightVal: '20',
    leftLeftVal: '30',
    leftRightVal: '40',
    rightLeftVal: '50',
    rightRightVal: '60',
  },
  maxHeap: {
    name: 'Max-Heap Priority Queue',
    title: 'Binary Max-Heap (Parent >= Children)',
    rootVal: '99',
    leftVal: '85',
    rightVal: '72',
    leftLeftVal: '60',
    leftRightVal: '55',
    rightLeftVal: '48',
    rightRightVal: '30',
  },
};

const GRAPH_PRESETS: Record<
  string,
  {
    name: string;
    title: string;
    isDirected: boolean;
    nodes: GraphNodeDef[];
    edges: GraphEdgeDef[];
  }
> = {
  dag: {
    name: 'Directed Acyclic Graph (DAG)',
    title: 'Directed Graph (Topological / Dijkstra)',
    isDirected: true,
    nodes: [
      { id: 'A', label: 'A' },
      { id: 'B', label: 'B' },
      { id: 'C', label: 'C' },
      { id: 'D', label: 'D' },
      { id: 'E', label: 'E' },
    ],
    edges: [
      { from: 'A', to: 'B', weight: '4' },
      { from: 'A', to: 'C', weight: '2' },
      { from: 'B', to: 'C', weight: '1' },
      { from: 'B', to: 'D', weight: '5' },
      { from: 'C', to: 'D', weight: '8' },
      { from: 'C', to: 'E', weight: '10' },
      { from: 'D', to: 'E', weight: '2' },
    ],
  },
  undirected: {
    name: 'Undirected Weighted Network',
    title: 'Undirected Network (MST / Prim-Kruskal)',
    isDirected: false,
    nodes: [
      { id: '1', label: '1' },
      { id: '2', label: '2' },
      { id: '3', label: '3' },
      { id: '4', label: '4' },
    ],
    edges: [
      { from: '1', to: '2', weight: '3' },
      { from: '2', to: '3', weight: '4' },
      { from: '3', to: '4', weight: '2' },
      { from: '4', to: '1', weight: '6' },
      { from: '1', to: '3', weight: '5' },
    ],
  },
  cycle: {
    name: 'Cycle Graph (C4)',
    title: 'Cycle Graph (Ring Topology)',
    isDirected: false,
    nodes: [
      { id: 'A', label: 'A' },
      { id: 'B', label: 'B' },
      { id: 'C', label: 'C' },
      { id: 'D', label: 'D' },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'D' },
      { from: 'D', to: 'A' },
    ],
  },
};

export function TreeGraphModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: TreeGraphModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const initialMode =
    existingShape?.params?.diagramType === 'graph' || existingShape?.params?.graphMode === 'graph'
      ? 'graph'
      : 'tree';

  const [mode, setMode] = useState<'tree' | 'graph'>(initialMode);

  // Tree State
  const [treeTitle, setTreeTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || TREE_PRESETS.balancedBst.title
  );
  const [rootVal, setRootVal] = useState<string>(existingShape?.params?.rootVal || '50');
  const [leftVal, setLeftVal] = useState<string>(existingShape?.params?.leftVal || '30');
  const [rightVal, setRightVal] = useState<string>(existingShape?.params?.rightVal || '70');
  const [leftLeftVal, setLeftLeftVal] = useState<string>(
    existingShape?.params?.leftLeftVal || '20'
  );
  const [leftRightVal, setLeftRightVal] = useState<string>(
    existingShape?.params?.leftRightVal || '40'
  );
  const [rightLeftVal, setRightLeftVal] = useState<string>(
    existingShape?.params?.rightLeftVal || '60'
  );
  const [rightRightVal, setRightRightVal] = useState<string>(
    existingShape?.params?.rightRightVal || '80'
  );
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );
  const [bstInsertInput, setBstInsertInput] = useState<string>('');
  const [bstFeedback, setBstFeedback] = useState<string>('');

  // Graph State
  const [graphTitle, setGraphTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || GRAPH_PRESETS.dag.title
  );
  const [isDirected, setIsDirected] = useState<boolean>(
    existingShape?.params?.isDirected ?? true
  );
  const [graphNodes, setGraphNodes] = useState<GraphNodeDef[]>(
    existingShape?.params?.graphNodes || GRAPH_PRESETS.dag.nodes
  );
  const [graphEdges, setGraphEdges] = useState<GraphEdgeDef[]>(
    existingShape?.params?.graphEdges || GRAPH_PRESETS.dag.edges
  );
  const [newEdgeFrom, setNewEdgeFrom] = useState<string>('A');
  const [newEdgeTo, setNewEdgeTo] = useState<string>('B');
  const [newEdgeWeight, setNewEdgeWeight] = useState<string>('');
  const [newNodeLabel, setNewNodeLabel] = useState<string>('');

  const currentPageIndex = docState.currentPageIndex;

  // BST Node Insertion
  const compareVals = (a: string, b: string): number => {
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  };

  const handleBstInsertNode = () => {
    const val = bstInsertInput.trim();
    if (!val) return;

    if (!rootVal.trim()) {
      setRootVal(val);
      setBstFeedback(`Tree was empty. Inserted "${val}" as Root Node.`);
      setBstInsertInput('');
      return;
    }

    const cmpRoot = compareVals(val, rootVal);
    if (cmpRoot < 0) {
      // Go Left Subtree
      if (!leftVal.trim()) {
        setLeftVal(val);
        setBstFeedback(`${val} < ${rootVal} ➔ Inserted as Left Child.`);
      } else {
        const cmpLeft = compareVals(val, leftVal);
        if (cmpLeft < 0) {
          setLeftLeftVal(val);
          setBstFeedback(`${val} < ${rootVal} ➔ < ${leftVal} ➔ Inserted at Left-Left Leaf.`);
        } else {
          setLeftRightVal(val);
          setBstFeedback(`${val} < ${rootVal} ➔ > ${leftVal} ➔ Inserted at Left-Right Leaf.`);
        }
      }
    } else if (cmpRoot > 0) {
      // Go Right Subtree
      if (!rightVal.trim()) {
        setRightVal(val);
        setBstFeedback(`${val} > ${rootVal} ➔ Inserted as Right Child.`);
      } else {
        const cmpRight = compareVals(val, rightVal);
        if (cmpRight < 0) {
          setRightLeftVal(val);
          setBstFeedback(`${val} > ${rootVal} ➔ < ${rightVal} ➔ Inserted at Right-Left Leaf.`);
        } else {
          setRightRightVal(val);
          setBstFeedback(`${val} > ${rootVal} ➔ > ${rightVal} ➔ Inserted at Right-Right Leaf.`);
        }
      }
    } else {
      setBstFeedback(`Value "${val}" already exists as Root Node.`);
    }

    setBstInsertInput('');
  };

  const handleClearTree = () => {
    setRootVal('');
    setLeftVal('');
    setRightVal('');
    setLeftLeftVal('');
    setLeftRightVal('');
    setRightLeftVal('');
    setRightRightVal('');
    setBstFeedback('Tree cleared. Enter a value to set new root.');
  };

  // Tree Presets
  const handleSelectTreePreset = (key: string) => {
    const p = TREE_PRESETS[key];
    if (p) {
      setTreeTitle(p.title);
      setRootVal(p.rootVal);
      setLeftVal(p.leftVal);
      setRightVal(p.rightVal);
      setLeftLeftVal(p.leftLeftVal);
      setLeftRightVal(p.leftRightVal);
      setRightLeftVal(p.rightLeftVal);
      setRightRightVal(p.rightRightVal);
    }
  };

  // Graph Presets
  const handleSelectGraphPreset = (key: string) => {
    const p = GRAPH_PRESETS[key];
    if (p) {
      setGraphTitle(p.title);
      setIsDirected(p.isDirected);
      setGraphNodes(p.nodes.map((n) => ({ ...n })));
      setGraphEdges(p.edges.map((e) => ({ ...e })));
      if (p.nodes.length >= 2) {
        setNewEdgeFrom(p.nodes[0].id);
        setNewEdgeTo(p.nodes[1].id);
      }
    }
  };

  // Graph Operations
  const handleAddGraphNode = () => {
    const label = newNodeLabel.trim() || String.fromCharCode(65 + graphNodes.length);
    const newId = label;
    if (graphNodes.some((n) => n.id === newId)) return;
    setGraphNodes([...graphNodes, { id: newId, label }]);
    setNewNodeLabel('');
  };

  const handleDeleteGraphNode = (id: string) => {
    if (graphNodes.length <= 2) return;
    setGraphNodes(graphNodes.filter((n) => n.id !== id));
    setGraphEdges(graphEdges.filter((e) => e.from !== id && e.to !== id));
  };

  const handleAddGraphEdge = () => {
    if (newEdgeFrom === newEdgeTo) return;
    const exists = graphEdges.some((e) => e.from === newEdgeFrom && e.to === newEdgeTo);
    if (exists) return;
    setGraphEdges([
      ...graphEdges,
      { from: newEdgeFrom, to: newEdgeTo, weight: newEdgeWeight.trim() || undefined },
    ]);
    setNewEdgeWeight('');
  };

  const handleDeleteGraphEdge = (idx: number) => {
    setGraphEdges(graphEdges.filter((_, i) => i !== idx));
  };

  // Save / Insert
  const handleSave = () => {
    if (mode === 'tree') {
      const params = {
        diagramType: 'binaryTree',
        graphMode: 'tree',
        title: treeTitle,
        rootVal,
        leftVal,
        rightVal,
        leftLeftVal,
        leftRightVal,
        rightLeftVal,
        rightRightVal,
        fontSize,
      };

      if (existingShape && onUpdateShape) {
        const updated: ShapeObject = {
          ...existingShape,
          params: { ...existingShape.params, ...params },
          label: treeTitle,
        };
        onUpdateShape(updated);
        onClose();
        return;
      }

      const shapeObj = createShape('csDiagram', 220, 140, 500, 360, {
        params,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: treeTitle,
      });

      executeAddObject(
        { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
        shapeObj,
        `Insert ${treeTitle}`
      );
    } else {
      // Graph
      const params = {
        diagramType: 'graph',
        graphMode: 'graph',
        title: graphTitle,
        isDirected,
        graphNodes,
        graphEdges,
        fontSize,
      };

      if (existingShape && onUpdateShape) {
        const updated: ShapeObject = {
          ...existingShape,
          params: { ...existingShape.params, ...params },
          label: graphTitle,
        };
        onUpdateShape(updated);
        onClose();
        return;
      }

      const shapeObj = createShape('csDiagram', 200, 140, 520, 380, {
        params,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: graphTitle,
      });

      executeAddObject(
        { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
        shapeObj,
        `Insert ${graphTitle}`
      );
    }

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card cs-tree-graph-modal"
        style={{ maxWidth: '860px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🌳</span>
            <div>
              <h3>Binary Search Tree & Graph Builder</h3>
              <p>Construct hierarchical binary trees or weighted directed/undirected graphs</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="cs-mode-tabs-bar">
          <button
            className={`cs-mode-tab ${mode === 'tree' ? 'active' : ''}`}
            onClick={() => setMode('tree')}
          >
            🌳 Binary Search Tree (BST)
          </button>
          <button
            className={`cs-mode-tab ${mode === 'graph' ? 'active' : ''}`}
            onClick={() => setMode('graph')}
          >
            🕸 Graph / Network Topology
          </button>
        </div>

        {/* TREE MODE VIEW */}
        {mode === 'tree' ? (
          <div className="cs-tree-editor-view">
            <div className="cs-modal-toolbar">
              <div className="cs-toolbar-field" style={{ flex: 2 }}>
                <label>Tree Title:</label>
                <input
                  type="text"
                  className="cs-modal-input"
                  value={treeTitle}
                  onChange={(e) => setTreeTitle(e.target.value)}
                />
              </div>
              <div className="cs-toolbar-field" style={{ flex: 1 }}>
                <label>Preset Tree:</label>
                <select
                  className="cs-modal-select"
                  onChange={(e) => handleSelectTreePreset(e.target.value)}
                  defaultValue="balancedBst"
                >
                  {Object.entries(TREE_PRESETS).map(([k, p]) => (
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

            {/* Interactive BST Node Insertion Controller */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '10px 16px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                  ➕ Insert Node into BST:
                </span>
                <input
                  type="text"
                  placeholder="Enter value (e.g. 25, 65)..."
                  className="cs-modal-input"
                  value={bstInsertInput}
                  onChange={(e) => setBstInsertInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBstInsertNode()}
                  style={{ width: 180, padding: '4px 8px', fontSize: 12 }}
                />
                <button
                  onClick={handleBstInsertNode}
                  className="cs-action-btn-sm cs-action-btn-primary"
                  style={{ padding: '5px 12px', background: '#059669', borderColor: '#10b981' }}
                >
                  Insert Node
                </button>
                <button
                  onClick={handleClearTree}
                  className="cs-action-btn-sm"
                  style={{ padding: '5px 10px', color: '#94a3b8' }}
                >
                  Clear Tree
                </button>
              </div>
              {bstFeedback && (
                <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                  ⚡ {bstFeedback}
                </div>
              )}
            </div>

            {/* Visual Tree Node Level Inputs */}
            <div className="cs-tree-hierarchy-box">
              {/* Level 0: Root */}
              <div className="cs-tree-level">
                <div className="cs-tree-level-label">Level 0 (Root)</div>
                <div className="cs-tree-node-input-wrap">
                  <span className="cs-tree-node-badge">Root</span>
                  <input
                    type="text"
                    className="cs-tree-node-input"
                    value={rootVal}
                    onChange={(e) => setRootVal(e.target.value)}
                  />
                </div>
              </div>

              {/* Level 1: Left & Right */}
              <div className="cs-tree-level">
                <div className="cs-tree-level-label">Level 1 (Subtrees)</div>
                <div className="cs-tree-level-row">
                  <div className="cs-tree-node-input-wrap">
                    <span className="cs-tree-node-badge">Left</span>
                    <input
                      type="text"
                      className="cs-tree-node-input"
                      value={leftVal}
                      onChange={(e) => setLeftVal(e.target.value)}
                    />
                  </div>
                  <div className="cs-tree-node-input-wrap">
                    <span className="cs-tree-node-badge">Right</span>
                    <input
                      type="text"
                      className="cs-tree-node-input"
                      value={rightVal}
                      onChange={(e) => setRightVal(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Level 2: Four Leaves */}
              <div className="cs-tree-level">
                <div className="cs-tree-level-label">Level 2 (Leaves)</div>
                <div className="cs-tree-level-row">
                  <div className="cs-tree-node-input-wrap">
                    <span className="cs-tree-node-badge">L-Left</span>
                    <input
                      type="text"
                      className="cs-tree-node-input"
                      value={leftLeftVal}
                      onChange={(e) => setLeftLeftVal(e.target.value)}
                    />
                  </div>
                  <div className="cs-tree-node-input-wrap">
                    <span className="cs-tree-node-badge">L-Right</span>
                    <input
                      type="text"
                      className="cs-tree-node-input"
                      value={leftRightVal}
                      onChange={(e) => setLeftRightVal(e.target.value)}
                    />
                  </div>
                  <div className="cs-tree-node-input-wrap">
                    <span className="cs-tree-node-badge">R-Left</span>
                    <input
                      type="text"
                      className="cs-tree-node-input"
                      value={rightLeftVal}
                      onChange={(e) => setRightLeftVal(e.target.value)}
                    />
                  </div>
                  <div className="cs-tree-node-input-wrap">
                    <span className="cs-tree-node-badge">R-Right</span>
                    <input
                      type="text"
                      className="cs-tree-node-input"
                      value={rightRightVal}
                      onChange={(e) => setRightRightVal(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* GRAPH MODE VIEW */
          <div className="cs-graph-editor-view">
            <div className="cs-modal-toolbar">
              <div className="cs-toolbar-field" style={{ flex: 2 }}>
                <label>Graph Title:</label>
                <input
                  type="text"
                  className="cs-modal-input"
                  value={graphTitle}
                  onChange={(e) => setGraphTitle(e.target.value)}
                />
              </div>
              <div className="cs-toolbar-field" style={{ flex: 1 }}>
                <label>Preset Topology:</label>
                <select
                  className="cs-modal-select"
                  onChange={(e) => handleSelectGraphPreset(e.target.value)}
                  defaultValue="dag"
                >
                  {Object.entries(GRAPH_PRESETS).map(([k, p]) => (
                    <option key={k} value={k}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cs-toolbar-field" style={{ width: '130px' }}>
                <label>Edges:</label>
                <button
                  className={`cs-toggle-btn ${isDirected ? 'active' : ''}`}
                  onClick={() => setIsDirected(!isDirected)}
                  style={{ width: '100%' }}
                >
                  {isDirected ? 'Directed ➔' : 'Undirected —'}
                </button>
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

            {/* Vertices & Edges Manager */}
            <div className="cs-graph-tables-grid">
              {/* Vertices List */}
              <div className="cs-graph-panel">
                <div className="cs-graph-panel-title">Vertices (Nodes)</div>
                <div className="cs-graph-add-node-bar">
                  <input
                    type="text"
                    className="cs-modal-input"
                    value={newNodeLabel}
                    placeholder="Vertex (e.g. F)"
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGraphNode()}
                  />
                  <button className="cs-action-btn-sm" onClick={handleAddGraphNode}>
                    Add
                  </button>
                </div>
                <div className="cs-vertices-chips">
                  {graphNodes.map((n) => (
                    <div key={n.id} className="cs-vertex-chip">
                      <span>{n.label}</span>
                      {graphNodes.length > 2 && (
                        <button
                          className="cs-chip-del"
                          onClick={() => handleDeleteGraphNode(n.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Edges List */}
              <div className="cs-graph-panel">
                <div className="cs-graph-panel-title">Edges & Weights</div>
                <div className="cs-graph-add-edge-bar">
                  <select
                    className="cs-cell-select"
                    value={newEdgeFrom}
                    onChange={(e) => setNewEdgeFrom(e.target.value)}
                  >
                    {graphNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                  <span>{isDirected ? '➔' : '—'}</span>
                  <select
                    className="cs-cell-select"
                    value={newEdgeTo}
                    onChange={(e) => setNewEdgeTo(e.target.value)}
                  >
                    {graphNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="cs-modal-input"
                    style={{ width: '60px' }}
                    placeholder="wt"
                    value={newEdgeWeight}
                    onChange={(e) => setNewEdgeWeight(e.target.value)}
                  />
                  <button className="cs-action-btn-sm" onClick={handleAddGraphEdge}>
                    Add
                  </button>
                </div>
                <div className="cs-edges-list">
                  {graphEdges.map((e, idx) => (
                    <div key={idx} className="cs-edge-item">
                      <span>
                        {e.from} {isDirected ? '➔' : '—'} {e.to}
                        {e.weight ? ` (w=${e.weight})` : ''}
                      </span>
                      <button className="cs-row-del-btn" onClick={() => handleDeleteGraphEdge(idx)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="submodal-footer">
          <button className="subject-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="subject-btn-primary" onClick={handleSave}>
            {existingShape
              ? mode === 'tree'
                ? 'Update Binary Tree'
                : 'Update Graph'
              : mode === 'tree'
              ? 'Insert Binary Tree'
              : 'Insert Graph'}
          </button>
        </div>
      </div>
    </div>
  );
}

