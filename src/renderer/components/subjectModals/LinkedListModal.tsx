/**
 * Linked List Diagram Modal (CS Teaching Platform)
 * Fully interactive linked list builder supporting singly, doubly, and circular linked lists,
 * insertion/deletion operations, reverse list, active traversal pointers, and hex addresses.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface LinkedListModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

export function LinkedListModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: LinkedListModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || 'Singly Linked List'
  );
  const [listType, setListType] = useState<'singly' | 'doubly' | 'circular'>(
    existingShape?.params?.isCircular
      ? 'circular'
      : existingShape?.params?.isDoubly
      ? 'doubly'
      : 'singly'
  );
  const [nodes, setNodes] = useState<string[]>(
    existingShape?.params?.nodes || ['12', '99', '37', '5']
  );
  const [activeNodeIdx, setActiveNodeIdx] = useState<number | null>(
    existingShape?.params?.activeNodeIndex ?? null
  );
  const [showAddresses, setShowAddresses] = useState<boolean>(
    existingShape?.params?.showAddresses ?? true
  );
  const [newNodeVal, setNewNodeVal] = useState<string>('');

  const currentPageIndex = docState.currentPageIndex;

  // Type change
  const handleTypeChange = (type: 'singly' | 'doubly' | 'circular') => {
    setListType(type);
    if (!existingShape) {
      if (type === 'doubly') setTitle('Doubly Linked List');
      else if (type === 'circular') setTitle('Circular Linked List');
      else setTitle('Singly Linked List');
    }
  };

  // Node operations
  const handleAddAtTail = () => {
    const val = newNodeVal.trim() || String(Math.floor(Math.random() * 90) + 10);
    setNodes([...nodes, val]);
    setNewNodeVal('');
  };

  const handleAddAtHead = () => {
    const val = newNodeVal.trim() || String(Math.floor(Math.random() * 90) + 10);
    setNodes([val, ...nodes]);
    if (activeNodeIdx !== null) setActiveNodeIdx(activeNodeIdx + 1);
    setNewNodeVal('');
  };

  const handleDeleteHead = () => {
    if (nodes.length <= 1) return;
    setNodes(nodes.slice(1));
    if (activeNodeIdx !== null) {
      setActiveNodeIdx(activeNodeIdx === 0 ? null : activeNodeIdx - 1);
    }
  };

  const handleDeleteTail = () => {
    if (nodes.length <= 1) return;
    setNodes(nodes.slice(0, -1));
    if (activeNodeIdx !== null && activeNodeIdx >= nodes.length - 1) {
      setActiveNodeIdx(null);
    }
  };

  const handleReverseList = () => {
    setNodes([...nodes].reverse());
    if (activeNodeIdx !== null) {
      setActiveNodeIdx(nodes.length - 1 - activeNodeIdx);
    }
  };

  const handleUpdateNode = (idx: number, val: string) => {
    const next = [...nodes];
    next[idx] = val;
    setNodes(next);
  };

  const handleDeleteNode = (idx: number) => {
    if (nodes.length <= 1) return;
    setNodes(nodes.filter((_, i) => i !== idx));
    if (activeNodeIdx === idx) setActiveNodeIdx(null);
    else if (activeNodeIdx !== null && activeNodeIdx > idx) setActiveNodeIdx(activeNodeIdx - 1);
  };

  // Save / Insert
  const handleSave = () => {
    const nodeCount = Math.max(1, nodes.length);
    const width = Math.max(560, Math.min(880, 160 + nodeCount * 115));
    const height = listType === 'circular' ? 200 : 160;

    const params = {
      diagramType: 'linkedList',
      title,
      nodes,
      isDoubly: listType === 'doubly',
      isCircular: listType === 'circular',
      activeNodeIndex: activeNodeIdx,
      showAddresses,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: {
          ...existingShape.params,
          ...params,
        },
        label: `${title} (${nodes.join(' ➔ ')})`,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('csDiagram', 180, 200, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      label: `${title} (${nodes.join(' ➔ ')})`,
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
        className="subject-submodal-card cs-linked-list-modal"
        style={{ maxWidth: '840px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🔗</span>
            <div>
              <h3>Linked List Diagram Builder</h3>
              <p>Construct Singly, Doubly, or Circular linked lists with node values, pointers, and memory tags</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Toolbar: Title & List Type */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>List Title:</label>
            <input
              type="text"
              className="cs-modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Singly Linked List"
            />
          </div>
          <div className="cs-toolbar-field" style={{ flex: 1.5 }}>
            <label>List Structure:</label>
            <div className="cs-toggle-group">
              <button
                className={`cs-toggle-btn ${listType === 'singly' ? 'active' : ''}`}
                onClick={() => handleTypeChange('singly')}
              >
                Singly
              </button>
              <button
                className={`cs-toggle-btn ${listType === 'doubly' ? 'active' : ''}`}
                onClick={() => handleTypeChange('doubly')}
              >
                Doubly
              </button>
              <button
                className={`cs-toggle-btn ${listType === 'circular' ? 'active' : ''}`}
                onClick={() => handleTypeChange('circular')}
              >
                Circular
              </button>
            </div>
          </div>
        </div>

        {/* Quick Operations Bar */}
        <div className="cs-ll-ops-bar">
          <div className="cs-ll-input-group">
            <input
              type="text"
              className="cs-modal-input"
              style={{ width: '120px' }}
              value={newNodeVal}
              placeholder="Node val"
              onChange={(e) => setNewNodeVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAtTail()}
            />
            <button className="cs-action-btn-sm" onClick={handleAddAtHead}>
              ➕ Insert Head
            </button>
            <button className="cs-action-btn-sm" onClick={handleAddAtTail}>
              ➕ Insert Tail
            </button>
          </div>
          <div className="cs-ll-quick-actions">
            <button
              className="cs-action-btn-sm"
              onClick={handleDeleteHead}
              disabled={nodes.length <= 1}
            >
              🗑 Delete Head
            </button>
            <button
              className="cs-action-btn-sm"
              onClick={handleDeleteTail}
              disabled={nodes.length <= 1}
            >
              🗑 Delete Tail
            </button>
            <button className="cs-action-btn-sm" onClick={handleReverseList}>
              🔄 Reverse List
            </button>
            <label className="cs-checkbox-label">
              <input
                type="checkbox"
                checked={showAddresses}
                onChange={(e) => setShowAddresses(e.target.checked)}
              />
              Show Hex Addresses
            </label>
          </div>
        </div>

        {/* Visual Node Chain Representation */}
        <div className="cs-ll-chain-container">
          <div className="cs-ll-head-badge">HEAD ➔</div>

          <div className="cs-ll-nodes-scroll">
            {nodes.map((nodeVal, idx) => {
              const isActive = activeNodeIdx === idx;
              const hexAddr = `0x${(0x1000 + idx * 0x20).toString(16).toUpperCase()}`;

              return (
                <div key={idx} className="cs-ll-node-wrapper">
                  {/* Traversal pointer badge */}
                  <div
                    className={`cs-ll-ptr-tag ${isActive ? 'active-ptr' : ''}`}
                    onClick={() => setActiveNodeIdx(isActive ? null : idx)}
                    title="Click to toggle active traversal pointer"
                  >
                    {isActive ? 'curr ➔' : 'ptr'}
                  </div>

                  {/* Node Box */}
                  <div className={`cs-ll-node-box ${isActive ? 'node-active' : ''}`}>
                    <div className="cs-ll-node-data">
                      <input
                        type="text"
                        className="cs-ll-data-input"
                        value={nodeVal}
                        onChange={(e) => handleUpdateNode(idx, e.target.value)}
                      />
                    </div>
                    <div className="cs-ll-node-ptr">•</div>
                  </div>

                  {/* Hex address label */}
                  {showAddresses && <div className="cs-ll-addr-label">{hexAddr}</div>}

                  {/* Arrow to Next */}
                  {idx < nodes.length - 1 ? (
                    <div className="cs-ll-connector">
                      <span className="cs-ll-arrow-forward">➔</span>
                      {listType === 'doubly' && <span className="cs-ll-arrow-backward">◀</span>}
                    </div>
                  ) : listType === 'circular' ? (
                    <div className="cs-ll-connector">
                      <span className="cs-ll-arrow-circular">➔ ⮌ HEAD</span>
                    </div>
                  ) : (
                    <div className="cs-ll-connector">
                      <span className="cs-ll-arrow-forward">➔</span>
                      <div className="cs-ll-null-box">NULL</div>
                    </div>
                  )}

                  {/* Node removal button */}
                  {nodes.length > 1 && (
                    <button
                      className="cs-ll-del-node"
                      title="Remove node"
                      onClick={() => handleDeleteNode(idx)}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="subject-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="subject-btn-primary" onClick={handleSave}>
            {existingShape ? 'Update Linked List' : 'Insert onto Whiteboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

