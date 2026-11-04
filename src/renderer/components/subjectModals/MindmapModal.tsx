/**
 * MindmapModal — Interactive Brainstorming & Concept Mindmap Builder
 * Interactive teacher tool for visual thinking, lecture outlines, and interactive node expansion
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import { MindmapNode, DEFAULT_MINDMAP } from '../../services/subjectModules/commonResourcesModule';
import './SubjectModals.css';

interface MindmapModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const MINDMAP_PRESETS: Record<string, { name: string; root: MindmapNode }> = {
  science: {
    name: 'Scientific Research Mindmap',
    root: DEFAULT_MINDMAP,
  },
  computing: {
    name: 'Computer Science & Software',
    root: {
      id: 'cs-root',
      text: 'Full-Stack Software System',
      color: '#3b82f6',
      icon: '💻',
      children: [
        {
          id: 'cs-frontend',
          text: 'User Interface (UI/UX)',
          color: '#06b6d4',
          icon: '🎨',
          children: [
            { id: 'cs-f1', text: 'Responsive Components' },
            { id: 'cs-f2', text: 'State Management' },
            { id: 'cs-f3', text: 'Accessibility (a11y)' },
          ],
        },
        {
          id: 'cs-backend',
          text: 'Backend Microservices',
          color: '#10b981',
          icon: '⚙️',
          children: [
            { id: 'cs-b1', text: 'REST & GraphQL APIs' },
            { id: 'cs-b2', text: 'Authentication & JWT' },
            { id: 'cs-b3', text: 'Distributed Cache' },
          ],
        },
        {
          id: 'cs-data',
          text: 'Data Storage & Persistence',
          color: '#f59e0b',
          icon: '🗄️',
          children: [
            { id: 'cs-d1', text: 'Relational SQL' },
            { id: 'cs-d2', text: 'NoSQL Document Store' },
          ],
        },
        {
          id: 'cs-devops',
          text: 'Cloud & CI/CD Pipeline',
          color: '#ec4899',
          icon: '☁️',
          children: [
            { id: 'cs-c1', text: 'Containerization (Docker)' },
            { id: 'cs-c2', text: 'Automated Test Suites' },
          ],
        },
      ],
    },
  },
  essay: {
    name: 'Academic Essay & Argumentation',
    root: {
      id: 'essay-root',
      text: 'Thesis / Main Argument',
      color: '#8b5cf6',
      icon: '✍️',
      children: [
        {
          id: 'es-intro',
          text: 'Introduction & Hook',
          color: '#38bdf8',
          icon: '🎯',
          children: [
            { id: 'es-i1', text: 'Background Context' },
            { id: 'es-i2', text: 'Central Thesis Statement' },
          ],
        },
        {
          id: 'es-claim1',
          text: 'Primary Evidence & Analysis',
          color: '#10b981',
          icon: '📊',
          children: [
            { id: 'es-c1-1', text: 'Quantitative Proof' },
            { id: 'es-c1-2', text: 'Expert Quotations' },
          ],
        },
        {
          id: 'es-rebuttal',
          text: 'Counter-Claims & Rebuttal',
          color: '#f43f5e',
          icon: '⚖️',
          children: [
            { id: 'es-r1', text: 'Opposing Perspectives' },
            { id: 'es-r2', text: 'Critical Flaws Refutation' },
          ],
        },
        {
          id: 'es-conclusion',
          text: 'Synthesized Conclusion',
          color: '#f59e0b',
          icon: '🏁',
          children: [
            { id: 'es-cn1', text: 'Restatement of Thesis' },
            { id: 'es-cn2', text: 'Broader Implications' },
          ],
        },
      ],
    },
  },
};

export function MindmapModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: MindmapModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  const [root, setRoot] = useState<MindmapNode>(() => {
    if (existingShape?.params?.root) {
      return JSON.parse(JSON.stringify(existingShape.params.root));
    }
    return JSON.parse(JSON.stringify(DEFAULT_MINDMAP));
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>('mm-root');
  const [editingText, setEditingText] = useState<string>('');
  const [newSubIdeaText, setNewSubIdeaText] = useState<string>('');

  const findNode = (node: MindmapNode, id: string): MindmapNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const c of node.children) {
        const found = findNode(c, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeNode = findNode(root, selectedNodeId) || root;

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
    const n = findNode(root, id);
    if (n) {
      setEditingText(n.text);
    }
  };

  const handleUpdateText = () => {
    if (!editingText.trim()) return;
    const clone = JSON.parse(JSON.stringify(root));
    const target = findNode(clone, selectedNodeId);
    if (target) {
      target.text = editingText.trim();
      setRoot(clone);
    }
  };

  const handleAddSubIdea = () => {
    const text = newSubIdeaText.trim() || `Idea ${Date.now() % 1000}`;
    const clone = JSON.parse(JSON.stringify(root));
    const target = findNode(clone, selectedNodeId);
    if (target) {
      if (!target.children) target.children = [];
      const newIdea: MindmapNode = {
        id: `idea-${Date.now()}`,
        text,
      };
      target.children.push(newIdea);
      setRoot(clone);
      setNewSubIdeaText('');
      setSelectedNodeId(newIdea.id);
      setEditingText(newIdea.text);
    }
  };

  const handleToggleCollapse = (id: string) => {
    const clone = JSON.parse(JSON.stringify(root));
    const target = findNode(clone, id);
    if (target && target.children && target.children.length > 0) {
      target.collapsed = !target.collapsed;
      setRoot(clone);
    }
  };

  const handleDeleteNode = () => {
    if (selectedNodeId === root.id) return;
    const clone = JSON.parse(JSON.stringify(root));
    const removeRecursive = (parent: MindmapNode): boolean => {
      if (!parent.children) return false;
      const idx = parent.children.findIndex((c) => c.id === selectedNodeId);
      if (idx >= 0) {
        parent.children.splice(idx, 1);
        return true;
      }
      for (const child of parent.children) {
        if (removeRecursive(child)) return true;
      }
      return false;
    };
    removeRecursive(clone);
    setRoot(clone);
    setSelectedNodeId(clone.id);
  };

  const handleApplyPreset = (key: string) => {
    const preset = MINDMAP_PRESETS[key];
    if (!preset) return;
    setRoot(JSON.parse(JSON.stringify(preset.root)));
    setSelectedNodeId(preset.root.id);
  };

  const handleSave = () => {
    const params = {
      root,
      selectedNodeId,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        label: root.text,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('mindmap', 180, 130, 740, 460, {
      params,
      label: root.text,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#818cf8',
      strokeWidth: 2,
    });

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      `Insert Mindmap (${root.text})`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  const getAllNodesFlat = (node: MindmapNode, prefix = ''): { id: string; label: string }[] => {
    const current = [{ id: node.id, label: `${prefix}${node.icon ? node.icon + ' ' : ''}${node.text}` }];
    if (node.children) {
      for (const c of node.children) {
        current.push(...getAllNodesFlat(c, `${prefix}— `));
      }
    }
    return current;
  };
  const flatNodes = getAllNodesFlat(root);

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-container wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="subject-submodal-header">
          <div className="subject-submodal-title">
            <span className="icon">🧠</span>
            <div>
              <h3>Interactive Mindmap Builder</h3>
              <p>Create live interactive concept maps, brainstorm trees, and lesson outlines</p>
            </div>
          </div>
          <button className="subject-submodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="subject-submodal-body two-col">
          {/* Left Controls */}
          <div className="cs-left-panel">
            <div className="cs-control-group">
              <label>Curriculum Presets</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(MINDMAP_PRESETS).map(([k, p]) => (
                  <button
                    key={k}
                    className="cs-action-btn-sm"
                    style={{ textAlign: 'left', padding: '6px 8px' }}
                    onClick={() => handleApplyPreset(k)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="cs-control-group">
              <label>Select Node to Modify</label>
              <select
                className="cs-modal-select"
                value={selectedNodeId}
                onChange={(e) => handleSelectNode(e.target.value)}
              >
                {flatNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cs-control-group">
              <label>Edit Selected Idea</label>
              <input
                type="text"
                className="cs-modal-input"
                placeholder="Idea text..."
                value={editingText || activeNode.text}
                onChange={(e) => setEditingText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button className="cs-action-btn-sm primary" onClick={handleUpdateText} style={{ flex: 1 }}>
                  ✓ Update Idea
                </button>
                {activeNode.children && activeNode.children.length > 0 && (
                  <button
                    className="cs-action-btn-sm"
                    onClick={() => handleToggleCollapse(selectedNodeId)}
                    title="Toggle child nodes visibility"
                  >
                    {activeNode.collapsed ? '👁 Expand' : '🙈 Collapse'}
                  </button>
                )}
                {selectedNodeId !== root.id && (
                  <button className="cs-action-btn-sm danger" onClick={handleDeleteNode}>
                    🗑
                  </button>
                )}
              </div>
            </div>

            <div className="cs-control-group">
              <label>Add Sub-Idea under "{activeNode.text}"</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="cs-modal-input"
                  placeholder="New sub-concept..."
                  value={newSubIdeaText}
                  onChange={(e) => setNewSubIdeaText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubIdea();
                  }}
                />
                <button className="cs-action-btn-sm primary" onClick={handleAddSubIdea}>
                  ➕ Add
                </button>
              </div>
            </div>
          </div>

          {/* Right Preview */}
          <div className="cs-preview-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="cs-preview-header">
              <span>Interactive Mindmap Preview</span>
              <span style={{ fontSize: '11px', color: '#818cf8' }}>Click nodes directly to toggle/highlight</span>
            </div>

            <div
              className="cs-preview-canvas-container"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#090d16',
                borderRadius: '8px',
                padding: '20px',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* Central Root Node */}
                <div
                  style={{
                    padding: '12px 24px',
                    borderRadius: '24px',
                    background: selectedNodeId === root.id ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.25)',
                    border: selectedNodeId === root.id ? '2px solid #ffffff' : '2px solid #818cf8',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: selectedNodeId === root.id ? '0 0 16px #818cf8' : 'none',
                    textAlign: 'center',
                  }}
                  onClick={() => handleSelectNode(root.id)}
                >
                  {root.icon && <span style={{ marginRight: '6px' }}>{root.icon}</span>}
                  {root.text}
                </div>

                {/* Branches Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(root.children || []).map((b) => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          padding: '8px 16px',
                          borderRadius: '16px',
                          background: selectedNodeId === b.id ? `${b.color || '#38bdf8'}44` : `${b.color || '#38bdf8'}22`,
                          border: selectedNodeId === b.id ? '2px solid #ffffff' : `1px solid ${b.color || '#38bdf8'}`,
                          color: '#f8fafc',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: selectedNodeId === b.id ? `0 0 12px ${b.color || '#38bdf8'}` : 'none',
                        }}
                        onClick={() => handleSelectNode(b.id)}
                      >
                        {b.icon && <span style={{ marginRight: '6px' }}>{b.icon}</span>}
                        {b.text}
                        {b.children && b.children.length > 0 && (
                          <span
                            style={{
                              marginLeft: '8px',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              background: b.color || '#38bdf8',
                              color: '#0f172a',
                              fontWeight: 'bold',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCollapse(b.id);
                            }}
                          >
                            {b.collapsed ? `+${b.children.length}` : '−'}
                          </span>
                        )}
                      </div>

                      {/* Sub-children if not collapsed */}
                      {!b.collapsed && b.children && b.children.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {b.children.map((sc) => (
                            <div
                              key={sc.id}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: selectedNodeId === sc.id ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.9)',
                                border: selectedNodeId === sc.id ? '2px solid #ffffff' : '1px solid rgba(148, 163, 184, 0.3)',
                                color: '#cbd5e1',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleSelectNode(sc.id)}
                            >
                              {sc.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="cs-preview-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="subject-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button className="subject-insert-btn" onClick={handleSave}>
                {existingShape ? 'Update Mindmap on Board' : 'Insert Interactive Mindmap ↗'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

