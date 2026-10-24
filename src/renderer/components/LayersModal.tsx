import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Layer } from '../../shared/types';
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

export function LayersModal({ onClose }: LayersModalProps): React.ReactElement {
  const { docState, docDispatch, setToastMessage } = useAppContext();
  const pageIndex = docState.currentPageIndex;
  const currentPage = docState.lesson.pages[pageIndex];

  // Defensive fallback if layers aren't yet populated
  const layers: Layer[] = (currentPage?.layers || []).slice().sort((a, b) => b.order - a.order);

  const handleToggleVisibility = (layerId: string, current: boolean) => {
    docDispatch({
      type: 'SET_LAYER_VISIBILITY',
      pageIndex,
      layerId,
      visible: !current,
    });
  };

  const handleToggleLocked = (layerId: string, current: boolean) => {
    docDispatch({
      type: 'SET_LAYER_LOCKED',
      pageIndex,
      layerId,
      locked: !current,
    });
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
    // layers is sorted descending (highest order at index 0)
    const targetIndex = direction === 'up' ? layerIndexInSorted - 1 : layerIndexInSorted + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const newSorted = [...layers];
    const temp = newSorted[layerIndexInSorted];
    newSorted[layerIndexInSorted] = newSorted[targetIndex];
    newSorted[targetIndex] = temp;

    // Re-assign orders ascending from bottom (last in sorted) to top (0 in sorted)
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
    setToastMessage?.('All layers visible');
  };

  const handleUnlockAll = () => {
    layers.forEach((l) => {
      // Keep background locked if desired, or unlock all user layers
      if (l.locked && l.id !== 'background') {
        docDispatch({ type: 'SET_LAYER_LOCKED', pageIndex, layerId: l.id, locked: false });
      }
    });
    setToastMessage?.('User layers unlocked');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="layers-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Layers Management">
        <div className="layers-modal-header">
          <div className="layers-header-title">
            <span className="layers-header-icon">📑</span>
            <h3>Page Layers</h3>
            <span className="layers-page-badge">{currentPage?.title || `Page ${pageIndex + 1}`}</span>
          </div>
          <button className="layers-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="layers-modal-description">
          Organize layer visibility, lock status, and opacity. Layers higher in the list render on top of lower layers.
        </div>

        <div className="layers-quick-actions">
          <button className="layers-action-pill" onClick={handleShowAll} title="Show All Layers">
            👁️ Show All
          </button>
          <button className="layers-action-pill" onClick={handleUnlockAll} title="Unlock All User Layers">
            🔓 Unlock User Layers
          </button>
        </div>

        <div className="layers-list">
          {layers.map((layer, idx) => {
            const objectCount = (currentPage?.objects || []).filter(
              (o) => o.layerId === layer.id
            ).length;
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
                    onClick={() => handleToggleVisibility(layer.id, layer.visible)}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? '👁️' : '🚫'}
                  </button>

                  <button
                    className={`layer-toggle-btn ${layer.locked ? 'btn-active-warning' : ''}`}
                    onClick={() => handleToggleLocked(layer.id, layer.locked)}
                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
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

        <div className="layers-modal-footer">
          <button className="layers-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
