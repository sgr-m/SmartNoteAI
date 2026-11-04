/**
 * Page Layers & Elements Manager Modal
 * Displays all page contents and overlapping elements so teachers can select and interact with them.
 * Aggregates all freehand strokes into a single 'Freehand Drawing' unit.
 * Enforces non-erasable/non-removable locks and automatically moves locked elements/layers
 * to the bottom so that active drawing renders over them, not behind them.
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Layer, CanvasObject, StrokeObject, ShapeObject, TextObject, ImageObject, GroupObject } from '../../shared/types';
import './LayersModal.css';

interface LayersModalProps {
  onClose: () => void;
}

const LAYER_ICONS: Record<string, string> = {
  interaction: '🎯',
  objects: '📐',
  drawing: '✍️',
  'imported-media': '🖼️',
  background: '🏞️',
};

function getObjectDisplayInfo(obj: CanvasObject): { icon: string; title: string; subtitle: string } {
  if (obj.type === 'shape') {
    const s = obj as ShapeObject;
    if (s.shapeType === 'csDiagram') {
      const dt = s.params?.diagramType;
      if (dt === 'codeBlock') {
        const file = s.params?.fileName || `${s.params?.language || 'python'}.py`;
        return { icon: '💻', title: `Code: ${file}`, subtitle: `${(s.params?.language || 'Python').toUpperCase()} Code Block` };
      }
      if (dt === 'pseudocode') {
        const t = s.params?.title || s.label || 'Algorithm';
        return { icon: '📝', title: `Pseudocode: ${t}`, subtitle: s.params?.standard || 'Standard Pseudocode' };
      }
      if (dt === 'flowchart') {
        const t = s.params?.title || s.label || 'Algorithm Flowchart';
        const stepCount = (s.params?.nodes || []).length;
        return { icon: '🔀', title: `Flowchart: ${t}`, subtitle: `${stepCount} steps / nodes` };
      }
      return { icon: '💻', title: s.label || 'CS Diagram', subtitle: dt || 'Diagram' };
    }
    if (s.shapeType === 'truthTable') {
      return { icon: '⚡', title: s.label || `${s.params?.gateType || 'Logic'} Truth Table`, subtitle: 'Digital Logic' };
    }
    if (s.shapeType === 'logicGate') {
      return { icon: '⚡', title: s.label || `${s.params?.gateType || 'Logic'} Gate`, subtitle: 'Logic Gate' };
    }
    if (s.shapeType === 'periodicElement') {
      return { icon: '🧪', title: s.label || `${s.params?.name || 'Element'} (${s.params?.symbol || ''})`, subtitle: 'Chemistry' };
    }
    if (s.shapeType === 'atomicModel') {
      return { icon: '⚛️', title: s.label || `Bohr Model: ${s.params?.name || 'Atom'}`, subtitle: 'Atomic Model' };
    }
    if (s.shapeType === 'labApparatus') {
      return { icon: '⚗️', title: s.label || 'Laboratory Apparatus', subtitle: 'Lab Apparatus' };
    }
    if (s.shapeType === 'circuitComponent' || s.shapeType === 'physicsDiagram') {
      return { icon: '🔌', title: s.label || 'Circuit Diagram', subtitle: 'Physics' };
    }
    if (s.shapeType === 'functionPlot') {
      return { icon: '📈', title: s.label || `f(x) = ${s.params?.fnExpression || 'Plot'}`, subtitle: 'Function Plot' };
    }
    if (s.shapeType === 'cartesianAxes') {
      return { icon: '📐', title: 'Cartesian Coordinate Plane', subtitle: 'Coordinate Grid' };
    }
    if (s.shapeType === 'numberLine') {
      return { icon: '🔢', title: s.label || 'Number Line', subtitle: 'Mathematics' };
    }
    if (s.shapeType === 'geometry3D') {
      return { icon: '🧊', title: `3D ${s.params?.solidType || 'Solid'}`, subtitle: '3D Geometry' };
    }
    if (s.shapeType === 'rect') return { icon: '▭', title: s.label || 'Rectangle', subtitle: 'Shape' };
    if (s.shapeType === 'circle') return { icon: '◯', title: s.label || 'Circle', subtitle: 'Shape' };
    if (s.shapeType === 'triangle') return { icon: '▲', title: s.label || 'Triangle', subtitle: 'Shape' };
    if (s.shapeType === 'arrow') return { icon: '➜', title: s.label || 'Arrow', subtitle: 'Shape' };
    return { icon: '📐', title: s.label || s.shapeType, subtitle: 'Shape' };
  }
  if (obj.type === 'text') {
    const t = obj as TextObject;
    if (t.isLatex) {
      return { icon: '∑', title: t.content ? `Formula: ${t.content.slice(0, 26)}` : 'Math Formula', subtitle: 'LaTeX Formula' };
    }
    return { icon: '🔤', title: t.content ? (t.content.length > 28 ? `${t.content.slice(0, 28)}...` : t.content) : 'Text Card', subtitle: `${t.preset || 'standard'} text` };
  }
  if (obj.type === 'image') {
    const img = obj as ImageObject;
    return { icon: '🖼️', title: 'Imported Image', subtitle: `${Math.round(img.width || 200)} × ${Math.round(img.height || 150)} px` };
  }
  if (obj.type === 'group') {
    const grp = obj as GroupObject;
    return { icon: '📦', title: `Group (${grp.objects?.length || 0} items)`, subtitle: 'Group Selection' };
  }
  return { icon: '📄', title: 'Canvas Object', subtitle: (obj as any).type || 'Element' };
}

export function LayersModal({ onClose }: LayersModalProps): React.ReactElement {
  const {
    docState,
    docDispatch,
    setToastMessage,
    selectedObject,
    setSelectedObject,
    setActiveTool,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'elements' | 'layers'>('elements');
  const [searchQuery, setSearchQuery] = useState('');

  const pageIndex = docState.currentPageIndex;
  const currentPage = docState.lesson.pages[pageIndex];

  // Layer categories sorted descending (highest order at index 0)
  const layers: Layer[] = (currentPage?.layers || []).slice().sort((a, b) => b.order - a.order);

  // All page objects
  const allObjects: CanvasObject[] = currentPage?.objects || [];

  // Group all freehand strokes into a single unit
  const strokes = allObjects.filter((o) => o.type === 'stroke') as StrokeObject[];
  const isDrawingLocked = strokes.length > 0 && strokes.every((s) => s.locked);
  const isDrawingVisible = strokes.length === 0 || strokes.some((s) => s.visible !== false);

  // Non-stroke elements
  const nonStrokeObjects = allObjects.filter((o) => o.type !== 'stroke');

  // Filter elements by search query
  const filteredNonStrokes = nonStrokeObjects.filter((obj) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const info = getObjectDisplayInfo(obj);
    return info.title.toLowerCase().includes(q) || info.subtitle.toLowerCase().includes(q);
  });

  // Display elements from top to bottom (visual z-index: topmost first)
  const visualElementList = [...filteredNonStrokes].reverse();

  // ─── Object Handlers ────────────────────────────────────────────────────────

  // Select an element on the canvas so the user can interact with overlapping elements
  const handleSelectObject = (obj: CanvasObject) => {
    setSelectedObject(obj);
    setActiveTool('select');
    const info = getObjectDisplayInfo(obj);
    setToastMessage?.(`Selected "${info.title}"`);
  };

  // Toggle lock on an individual element (Requirement 2 & 3)
  const handleToggleObjectLock = (obj: CanvasObject, e: React.MouseEvent) => {
    e.stopPropagation();
    const willLock = !obj.locked;
    const info = getObjectDisplayInfo(obj);

    if (willLock) {
      // Mark locked, move to bottom layer ('background'), and place at index 0 (bottom of stack)
      // so active drawings draw OVER it, not behind it!
      const updated = {
        ...obj,
        locked: true,
        layerId: 'background',
      };
      const otherObjects = allObjects.filter((o) => o.id !== obj.id);
      const reordered = [updated, ...otherObjects]; // index 0 is bottom

      docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: reordered });
      if (selectedObject?.id === obj.id) {
        setSelectedObject(updated);
      }
    } else {
      // Unlock element and restore to standard layer
      const restoredLayer = obj.type === 'image' ? 'imported-media' : 'objects';
      const updated = {
        ...obj,
        locked: false,
        layerId: restoredLayer,
      };

      docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
      if (selectedObject?.id === obj.id) {
        setSelectedObject(updated);
      }
    }
  };

  // Toggle visibility on an individual element
  const handleToggleObjectVisibility = (obj: CanvasObject, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVisible = obj.visible === false ? true : false;
    const updated = { ...obj, visible: newVisible };

    docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
    if (selectedObject?.id === obj.id && !newVisible) {
      setSelectedObject(null);
    }
    const info = getObjectDisplayInfo(obj);
    setToastMessage?.(newVisible ? `Showing "${info.title}"` : `Hidden "${info.title}"`);
  };

  // Reorder element in visual z-index stack
  const handleMoveObject = (objId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const curIdx = allObjects.findIndex((o) => o.id === objId);
    if (curIdx === -1) return;

    // In allObjects: index 0 is bottom, last index is top
    // Moving "up" in UI list means moving higher in z-index (curIdx + 1)
    // Moving "down" in UI list means moving lower in z-index (curIdx - 1)
    const targetIdx = direction === 'up' ? curIdx + 1 : curIdx - 1;
    if (targetIdx < 0 || targetIdx >= allObjects.length) return;

    const newObjects = [...allObjects];
    const temp = newObjects[curIdx];
    newObjects[curIdx] = newObjects[targetIdx];
    newObjects[targetIdx] = temp;

    docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: newObjects });
  };

  // Delete element (guarded against locked items)
  const handleDeleteObject = (obj: CanvasObject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (obj.locked) {
      setToastMessage?.('Element is locked. Unlock it to delete.');
      return;
    }
    docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: obj.id });
    if (selectedObject?.id === obj.id) {
      setSelectedObject(null);
    }
    const info = getObjectDisplayInfo(obj);
    setToastMessage?.(`Deleted "${info.title}"`);
  };

  // ─── Freehand Drawing Unit Handlers ─────────────────────────────────────────

  const handleToggleDrawingVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVis = !isDrawingVisible;
    docDispatch({
      type: 'SET_LAYER_VISIBILITY',
      pageIndex,
      layerId: 'drawing',
      visible: nextVis,
    });
    // Also toggle stroke objects
    for (const stroke of strokes) {
      docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: { ...stroke, visible: nextVis } });
    }
    setToastMessage?.(nextVis ? 'Freehand drawing visible' : 'Freehand drawing hidden');
  };

  const handleToggleDrawingLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLock = !isDrawingLocked;
    docDispatch({
      type: 'SET_LAYER_LOCKED',
      pageIndex,
      layerId: 'drawing',
      locked: nextLock,
    });
    for (const stroke of strokes) {
      docDispatch({
        type: 'UPDATE_OBJECT',
        pageIndex,
        object: { ...stroke, locked: nextLock, layerId: nextLock ? 'background' : 'drawing' },
      });
    }
  };

  // ─── Global Layer Handlers ──────────────────────────────────────────────────

  const handleToggleLayerVisibility = (layerId: string, current: boolean) => {
    docDispatch({
      type: 'SET_LAYER_VISIBILITY',
      pageIndex,
      layerId,
      visible: !current,
    });
  };

  // REQUIREMENT 3: When a layer is locked, automatically move it to the bottom of the board
  // so that drawing on screen draws over it, not behind it!
  const handleToggleLayerLocked = (layerId: string, current: boolean) => {
    const willBeLocked = !current;
    if (willBeLocked) {
      const targetLayer = layers.find((l) => l.id === layerId);
      if (!targetLayer) return;

      const otherLayers = layers.filter((l) => l.id !== layerId);
      const updatedTarget = { ...targetLayer, locked: true };
      // Move to bottom of stack (last in descending list = lowest order)
      const newSorted = [...otherLayers, updatedTarget];

      const updatedLayers = newSorted.map((l, idx) => ({
        ...l,
        order: newSorted.length - 1 - idx,
      }));

      docDispatch({
        type: 'REORDER_LAYERS',
        pageIndex,
        layers: updatedLayers,
      });
    } else {
      docDispatch({
        type: 'SET_LAYER_LOCKED',
        pageIndex,
        layerId,
        locked: false,
      });
    }
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    docDispatch({
      type: 'SET_LAYER_OPACITY',
      pageIndex,
      layerId,
      opacity,
    });
  };

  const handleMoveLayer = (layerIndexInSorted: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? layerIndexInSorted - 1 : layerIndexInSorted + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const newSorted = [...layers];
    const temp = newSorted[layerIndexInSorted];
    newSorted[layerIndexInSorted] = newSorted[targetIndex];
    newSorted[targetIndex] = temp;

    const updatedLayers = newSorted.map((l, idx) => ({
      ...l,
      order: newSorted.length - 1 - idx,
    }));

    docDispatch({
      type: 'REORDER_LAYERS',
      pageIndex,
      layers: updatedLayers,
    });
  };

  const handleShowAll = () => {
    layers.forEach((l) => {
      if (!l.visible) {
        docDispatch({ type: 'SET_LAYER_VISIBILITY', pageIndex, layerId: l.id, visible: true });
      }
    });
    for (const o of allObjects) {
      if (o.visible === false) {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: { ...o, visible: true } });
      }
    }
    setToastMessage?.('All elements and layers visible');
  };

  const handleUnlockAll = () => {
    layers.forEach((l) => {
      if (l.locked && l.id !== 'background') {
        docDispatch({ type: 'SET_LAYER_LOCKED', pageIndex, layerId: l.id, locked: false });
      }
    });
    for (const o of allObjects) {
      if (o.locked) {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: { ...o, locked: false } });
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="layers-modal"
        style={{ width: '580px', maxWidth: '96vw' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Layers & Elements Management"
      >
        {/* Header */}
        <div className="layers-modal-header">
          <div className="layers-header-title">
            <span className="layers-header-icon">📑</span>
            <div>
              <h3>Page Layers & Elements</h3>
              <span className="layers-page-badge">{currentPage?.title || `Page ${pageIndex + 1}`}</span>
            </div>
          </div>
          <button className="layers-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="layers-tab-bar">
          <button
            type="button"
            className={`layers-tab-btn ${activeTab === 'elements' ? 'active' : ''}`}
            onClick={() => setActiveTab('elements')}
          >
            📄 Page Elements ({nonStrokeObjects.length + (strokes.length > 0 ? 1 : 0)})
          </button>
          <button
            type="button"
            className={`layers-tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            📑 Layer Categories ({layers.length})
          </button>
        </div>

        {/* Description & Quick Search Bar */}
        <div className="layers-modal-description" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>
            {activeTab === 'elements'
              ? 'Click any element to select and interact with overlapping content on the page.'
              : 'Layers higher in the list render on top. Locking a layer automatically moves it to the bottom.'}
          </span>
          {activeTab === 'elements' && nonStrokeObjects.length > 3 && (
            <input
              type="text"
              className="layers-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter elements..."
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="layers-quick-actions">
          <button className="layers-action-pill" onClick={handleShowAll} title="Show All Elements">
            👁️ Show All
          </button>
          <button className="layers-action-pill" onClick={handleUnlockAll} title="Unlock All Elements">
            🔓 Unlock All
          </button>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>
            {allObjects.length} total item{allObjects.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Main List Body */}
        {activeTab === 'elements' ? (
          <div className="layers-list elements-view">
            {allObjects.length === 0 ? (
              <div className="layers-empty-state">
                <span style={{ fontSize: '32px' }}>📝</span>
                <p>The page is currently empty.</p>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Draw strokes, insert shapes, code blocks, or text to see them listed here.</span>
              </div>
            ) : (
              <>
                {/* 1. Freehand Drawing Unit (Aggregated single unit) */}
                {strokes.length > 0 && (
                  <div className={`layer-row element-row drawing-unit-row ${!isDrawingVisible ? 'layer-hidden' : ''} ${isDrawingLocked ? 'layer-locked' : ''}`}>
                    <div className="layer-main-info" onClick={() => setActiveTool('pen')}>
                      <span className="layer-icon" style={{ fontSize: '20px' }}>✍️</span>
                      <div className="layer-text-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="layer-name">Freehand Drawing</span>
                          {isDrawingLocked && <span className="element-locked-badge">🔒 Locked</span>}
                        </div>
                        <span className="layer-subtext">
                          {strokes.length} stroke{strokes.length === 1 ? '' : 's'} • Ink Unit
                        </span>
                      </div>
                    </div>

                    <div className="layer-controls">
                      <button
                        className={`layer-toggle-btn ${!isDrawingVisible ? 'btn-active-danger' : ''}`}
                        onClick={handleToggleDrawingVisibility}
                        title={isDrawingVisible ? 'Hide Freehand Drawing' : 'Show Freehand Drawing'}
                      >
                        {isDrawingVisible ? '👁️' : '🚫'}
                      </button>

                      <button
                        className={`layer-toggle-btn ${isDrawingLocked ? 'btn-active-warning' : ''}`}
                        onClick={handleToggleDrawingLock}
                        title={isDrawingLocked ? 'Unlock Freehand Drawing' : 'Lock Freehand Drawing'}
                      >
                        {isDrawingLocked ? '🔒' : '🔓'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Individual Non-Stroke Page Elements */}
                {visualElementList.map((obj, vIdx) => {
                  const info = getObjectDisplayInfo(obj);
                  const isSelected = selectedObject?.id === obj.id;
                  const isVisible = obj.visible !== false;
                  const isLocked = obj.locked;

                  return (
                    <div
                      key={obj.id}
                      className={`layer-row element-row ${isSelected ? 'selected' : ''} ${!isVisible ? 'layer-hidden' : ''} ${isLocked ? 'layer-locked' : ''}`}
                      onClick={() => handleSelectObject(obj)}
                      title="Click to select this element on the whiteboard"
                    >
                      <div className="layer-main-info">
                        <span className="layer-icon">{info.icon}</span>
                        <div className="layer-text-group">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="layer-name">{info.title}</span>
                            {isSelected && <span className="element-active-badge">Active</span>}
                            {isLocked && <span className="element-locked-badge">🔒 Locked</span>}
                          </div>
                          <span className="layer-subtext">
                            {info.subtitle} • {obj.layerId || 'objects'}
                          </span>
                        </div>
                      </div>

                      <div className="layer-controls">
                        {/* Visibility toggle */}
                        <button
                          className={`layer-toggle-btn ${!isVisible ? 'btn-active-danger' : ''}`}
                          onClick={(e) => handleToggleObjectVisibility(obj, e)}
                          title={isVisible ? 'Hide Element' : 'Show Element'}
                        >
                          {isVisible ? '👁️' : '🚫'}
                        </button>

                        {/* Lock toggle (automatically moves to bottom layer when locked) */}
                        <button
                          className={`layer-toggle-btn ${isLocked ? 'btn-active-warning' : ''}`}
                          onClick={(e) => handleToggleObjectLock(obj, e)}
                          title={isLocked ? 'Unlock Element' : 'Lock Element & Move to Bottom'}
                        >
                          {isLocked ? '🔒' : '🔓'}
                        </button>

                        {/* Reorder in z-index */}
                        <div className="layer-order-buttons">
                          <button
                            className="layer-arrow-btn"
                            disabled={vIdx === 0}
                            onClick={(e) => handleMoveObject(obj.id, 'up', e)}
                            title="Bring Forward (Up in Stack)"
                          >
                            ▲
                          </button>
                          <button
                            className="layer-arrow-btn"
                            disabled={vIdx === visualElementList.length - 1}
                            onClick={(e) => handleMoveObject(obj.id, 'down', e)}
                            title="Send Backward (Down in Stack)"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Delete button (disabled if locked) */}
                        <button
                          className="layer-delete-btn"
                          disabled={isLocked}
                          onClick={(e) => handleDeleteObject(obj, e)}
                          title={isLocked ? 'Cannot delete locked element' : 'Delete Element'}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ) : (
          /* Layer Categories View */
          <div className="layers-list">
            {layers.map((layer, idx) => {
              const objectCount = allObjects.filter((o) => o.layerId === layer.id).length;
              const icon = LAYER_ICONS[layer.id] || '📄';
              const isTop = idx === 0;
              const isBottom = idx === layers.length - 1;

              return (
                <div
                  key={layer.id}
                  className={`layer-row ${!layer.visible ? 'layer-hidden' : ''} ${layer.locked ? 'layer-locked' : ''}`}
                >
                  <div className="layer-main-info">
                    <span className="layer-icon" title={layer.name}>
                      {icon}
                    </span>
                    <div className="layer-text-group">
                      <span className="layer-name">{layer.name}</span>
                      <span className="layer-subtext">
                        {objectCount} {objectCount === 1 ? 'object' : 'objects'} • Order {layer.order}
                      </span>
                    </div>
                  </div>

                  <div className="layer-controls">
                    <div className="layer-opacity-control" title={`Opacity: ${Math.round((layer.opacity ?? 1) * 100)}%`}>
                      <span className="opacity-label">{Math.round((layer.opacity ?? 1) * 100)}%</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layer.opacity ?? 1}
                        onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                        className="layer-opacity-slider"
                      />
                    </div>

                    <button
                      className={`layer-toggle-btn ${!layer.visible ? 'btn-active-danger' : ''}`}
                      onClick={() => handleToggleLayerVisibility(layer.id, layer.visible)}
                      title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.visible ? '👁️' : '🚫'}
                    </button>

                    <button
                      className={`layer-toggle-btn ${layer.locked ? 'btn-active-warning' : ''}`}
                      onClick={() => handleToggleLayerLocked(layer.id, layer.locked)}
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer & Move to Bottom'}
                    >
                      {layer.locked ? '🔒' : '🔓'}
                    </button>

                    <div className="layer-order-buttons">
                      <button
                        className="layer-arrow-btn"
                        disabled={isTop}
                        onClick={() => handleMoveLayer(idx, 'up')}
                        title="Move Up in Stack"
                      >
                        ▲
                      </button>
                      <button
                        className="layer-arrow-btn"
                        disabled={isBottom}
                        onClick={() => handleMoveLayer(idx, 'down')}
                        title="Move Down in Stack"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="layers-modal-footer">
          <button className="layers-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
