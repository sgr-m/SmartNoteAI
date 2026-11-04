/**
 * HierarchyChartModal — Custom Hierarchy Tree Diagram Builder
 * Interactive teacher tool for organizational charts, taxonomies, and conceptual hierarchies
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  HierarchyNode,
  HierarchyTheme,
  HierarchyStyle,
  DEFAULT_HIERARCHY_TREE,
} from '../../services/subjectModules/commonResourcesModule';
import './SubjectModals.css';

interface HierarchyChartModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const HIERARCHY_PRESETS: Record<string, { name: string; tree: HierarchyNode; theme: HierarchyTheme; style: HierarchyStyle }> = {
  academic: {
    name: 'University Faculty Hierarchy',
    theme: 'ocean',
    style: 'rounded',
    tree: DEFAULT_HIERARCHY_TREE,
  },
  corporate: {
    name: 'Corporate Executive Structure',
    theme: 'emerald',
    style: 'sharp',
    tree: {
      id: 'root-corp',
      label: 'Chief Executive Officer (CEO)',
      role: 'Executive',
      children: [
        {
          id: 'cto',
          label: 'Chief Technology Officer',
          role: 'Technology',
          children: [
            { id: 'eng', label: 'Engineering Leads', role: 'Dev' },
            { id: 'qa', label: 'Quality Assurance', role: 'Test' },
          ],
        },
        {
          id: 'cfo',
          label: 'Chief Financial Officer',
          role: 'Finance',
          children: [
            { id: 'acct', label: 'Accounting & Payroll', role: 'Treasury' },
          ],
        },
        {
          id: 'cmo',
          label: 'Chief Marketing Officer',
          role: 'Growth',
          children: [
            { id: 'brand', label: 'Brand & Creative', role: 'Design' },
          ],
        },
      ],
    },
  },
  biology: {
    name: 'Biological Taxonomy Tree',
    theme: 'sunset',
    style: 'pill',
    tree: {
      id: 'bio-domain',
      label: 'Domain: Eukaryota',
      role: 'Domain',
      children: [
        {
          id: 'bio-animalia',
          label: 'Kingdom: Animalia',
          role: 'Kingdom',
          children: [
            { id: 'bio-chordata', label: 'Phylum: Chordata', role: 'Phylum' },
            { id: 'bio-arthropoda', label: 'Phylum: Arthropoda', role: 'Phylum' },
          ],
        },
        {
          id: 'bio-plantae',
          label: 'Kingdom: Plantae',
          role: 'Kingdom',
          children: [
            { id: 'bio-angiosperms', label: 'Division: Angiosperms', role: 'Division' },
          ],
        },
      ],
    },
  },
  systemArch: {
    name: 'Cloud System Architecture',
    theme: 'purple',
    style: 'flat',
    tree: {
      id: 'sys-lb',
      label: 'Global Load Balancer',
      role: 'Edge Ingress',
      children: [
        {
          id: 'sys-api',
          label: 'API Gateway Cluster',
          role: 'Microservices',
          children: [
            { id: 'sys-auth', label: 'Auth Service', role: 'OAuth2' },
            { id: 'sys-billing', label: 'Billing Engine', role: 'Stripe' },
          ],
        },
        {
          id: 'sys-db',
          label: 'Distributed Database',
          role: 'Data Tier',
          children: [
            { id: 'sys-primary', label: 'Primary Leader', role: 'R/W' },
            { id: 'sys-replica', label: 'Read Replica', role: 'Read' },
          ],
        },
      ],
    },
  },
};

export function HierarchyChartModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: HierarchyChartModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  const [tree, setTree] = useState<HierarchyNode>(() => {
    if (existingShape?.params?.tree) {
      return JSON.parse(JSON.stringify(existingShape.params.tree));
    }
    return JSON.parse(JSON.stringify(DEFAULT_HIERARCHY_TREE));
  });

  const [theme, setTheme] = useState<HierarchyTheme>(() => {
    return (existingShape?.params?.theme as HierarchyTheme) || 'ocean';
  });

  const [style, setStyle] = useState<HierarchyStyle>(() => {
    return (existingShape?.params?.style as HierarchyStyle) || 'rounded';
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(existingShape?.params?.fontSize) || 14;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-root');
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [editingRole, setEditingRole] = useState<string>('');
  const [childLabelInput, setChildLabelInput] = useState<string>('');

  // Find a node by ID in tree
  const findNode = (node: HierarchyNode, id: string): HierarchyNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const c of node.children) {
        const found = findNode(c, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeNode = findNode(tree, selectedNodeId) || tree;

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const n = findNode(tree, nodeId);
    if (n) {
      setEditingLabel(n.label);
      setEditingRole(n.role || '');
    }
  };

  const handleUpdateActiveNode = () => {
    if (!editingLabel.trim()) return;
    const clone = JSON.parse(JSON.stringify(tree));
    const target = findNode(clone, selectedNodeId);
    if (target) {
      target.label = editingLabel.trim();
      target.role = editingRole.trim() || undefined;
      setTree(clone);
    }
  };

  const handleAddChild = () => {
    const label = childLabelInput.trim() || `Sub-node ${Date.now() % 1000}`;
    const clone = JSON.parse(JSON.stringify(tree));
    const target = findNode(clone, selectedNodeId);
    if (target) {
      if (!target.children) target.children = [];
      const newChild: HierarchyNode = {
        id: `node-${Date.now()}`,
        label,
        role: 'Subtopic',
      };
      target.children.push(newChild);
      setTree(clone);
      setChildLabelInput('');
      setSelectedNodeId(newChild.id);
      setEditingLabel(newChild.label);
      setEditingRole('Subtopic');
    }
  };

  const handleDeleteActiveNode = () => {
    if (selectedNodeId === tree.id) return; // Cannot delete root
    const clone = JSON.parse(JSON.stringify(tree));
    const removeRecursive = (parent: HierarchyNode): boolean => {
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
    setTree(clone);
    setSelectedNodeId(clone.id);
  };

  const handleApplyPreset = (key: string) => {
    const preset = HIERARCHY_PRESETS[key];
    if (!preset) return;
    setTree(JSON.parse(JSON.stringify(preset.tree)));
    setTheme(preset.theme);
    setStyle(preset.style);
    setSelectedNodeId(preset.tree.id);
  };

  const handleSave = () => {
    const params = {
      tree,
      theme,
      style,
      fontSize,
      selectedNodeId,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        label: tree.label,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('hierarchyChart', 180, 130, 720, 440, {
      params,
      label: tree.label,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: theme === 'emerald' ? '#34d399' : theme === 'sunset' ? '#f97316' : '#38bdf8',
      strokeWidth: 2,
    });

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      `Insert Hierarchy Chart (${tree.label})`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  // Helper to list all nodes flat
  const getAllNodesFlat = (node: HierarchyNode, prefix = ''): { id: string; label: string }[] => {
    const current = [{ id: node.id, label: `${prefix}${node.label}` }];
    if (node.children) {
      for (const c of node.children) {
        current.push(...getAllNodesFlat(c, `${prefix}— `));
      }
    }
    return current;
  };
  const flatNodes = getAllNodesFlat(tree);

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-container wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="subject-submodal-header">
          <div className="subject-submodal-title">
            <span className="icon">🏛️</span>
            <div>
              <h3>Hierarchy Chart Builder</h3>
              <p>Design multi-tier taxonomies, organograms, and conceptual structures</p>
            </div>
          </div>
          <button className="subject-submodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="subject-submodal-body two-col">
          {/* Left Controls Panel */}
          <div className="cs-left-panel">
            {/* Presets */}
            <div className="cs-control-group">
              <label>Educational Presets</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {Object.entries(HIERARCHY_PRESETS).map(([k, p]) => (
                  <button
                    key={k}
                    className="cs-action-btn-sm"
                    style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px' }}
                    onClick={() => handleApplyPreset(k)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Styling & Themes */}
            <div className="cs-control-group">
              <label>Visual Theme & Card Style</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {(['ocean', 'emerald', 'sunset', 'purple', 'monochrome'] as HierarchyTheme[]).map((t) => (
                  <button
                    key={t}
                    className={`cs-action-btn-sm ${theme === t ? 'active' : ''}`}
                    style={{ textTransform: 'capitalize', flex: 1, padding: '4px 2px', fontSize: '11px' }}
                    onClick={() => setTheme(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['rounded', 'sharp', 'pill', 'flat'] as HierarchyStyle[]).map((st) => (
                  <button
                    key={st}
                    className={`cs-action-btn-sm ${style === st ? 'active' : ''}`}
                    style={{ textTransform: 'capitalize', flex: 1, padding: '4px 2px', fontSize: '11px' }}
                    onClick={() => setStyle(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="cs-control-group">
              <label>Label Font Size</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[12, 14, 16, 18, 20].map((sz) => (
                  <button
                    key={sz}
                    className={`cs-action-btn-sm ${fontSize === sz ? 'active' : ''}`}
                    style={{ flex: 1, padding: '3px' }}
                    onClick={() => setFontSize(sz)}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Node Selector & Editor */}
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
              <label>Edit Selected Node</label>
              <input
                type="text"
                className="cs-modal-input"
                placeholder="Node text label..."
                value={editingLabel || activeNode.label}
                onChange={(e) => setEditingLabel(e.target.value)}
              />
              <input
                type="text"
                className="cs-modal-input"
                style={{ marginTop: '6px' }}
                placeholder="Role / category subtitle (optional)..."
                value={editingRole !== '' ? editingRole : (activeNode.role || '')}
                onChange={(e) => setEditingRole(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button className="cs-action-btn-sm primary" onClick={handleUpdateActiveNode} style={{ flex: 1 }}>
                  ✓ Update Node
                </button>
                {selectedNodeId !== tree.id && (
                  <button className="cs-action-btn-sm danger" onClick={handleDeleteActiveNode}>
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>

            {/* Add Child Node */}
            <div className="cs-control-group">
              <label>Add Child Node Under "{activeNode.label}"</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="cs-modal-input"
                  placeholder="New sub-node title..."
                  value={childLabelInput}
                  onChange={(e) => setChildLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddChild();
                  }}
                />
                <button className="cs-action-btn-sm primary" onClick={handleAddChild}>
                  ➕ Add
                </button>
              </div>
            </div>
          </div>

          {/* Right Preview Panel */}
          <div className="cs-preview-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="cs-preview-header">
              <span>Dynamic Visual Hierarchy Preview</span>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>Placeholders auto-adjust to text length</span>
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
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {/* Level 0: Root */}
                <div
                  style={{
                    padding: '8px 20px',
                    borderRadius: style === 'sharp' ? '2px' : style === 'pill' ? '24px' : '8px',
                    background: selectedNodeId === tree.id ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.25)',
                    border: selectedNodeId === tree.id ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.5)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: `${fontSize}px`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: selectedNodeId === tree.id ? '0 0 12px #38bdf8' : 'none',
                  }}
                  onClick={() => handleSelectNode(tree.id)}
                >
                  {tree.role && <div style={{ fontSize: '10px', color: '#7dd3fc', marginBottom: '2px' }}>{tree.role}</div>}
                  {tree.label}
                </div>

                {/* Level 1 & 2 Preview */}
                {tree.children && tree.children.length > 0 && (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%' }}>
                    {tree.children.map((c) => (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            padding: '6px 14px',
                            borderRadius: style === 'sharp' ? '2px' : style === 'pill' ? '24px' : '8px',
                            background: selectedNodeId === c.id ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.85)',
                            border: selectedNodeId === c.id ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                            color: '#f8fafc',
                            fontSize: `${fontSize - 1}px`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            boxShadow: selectedNodeId === c.id ? '0 0 10px #38bdf8' : 'none',
                          }}
                          onClick={() => handleSelectNode(c.id)}
                        >
                          {c.role && <div style={{ fontSize: '9px', color: '#94a3b8' }}>{c.role}</div>}
                          {c.label}
                        </div>

                        {/* Level 2 children */}
                        {c.children && c.children.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {c.children.map((gc) => (
                              <div
                                key={gc.id}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: selectedNodeId === gc.id ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.9)',
                                  border: selectedNodeId === gc.id ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                                  color: '#cbd5e1',
                                  fontSize: `${fontSize - 2}px`,
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleSelectNode(gc.id)}
                              >
                                {gc.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="cs-preview-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="subject-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button className="subject-insert-btn" onClick={handleSave}>
                {existingShape ? 'Update Hierarchy on Board' : 'Insert Hierarchy Chart ↗'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

