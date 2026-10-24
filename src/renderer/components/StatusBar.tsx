/**
 * StatusBar — shows tool, zoom, page, save status, and stylus info
 */

import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';

export function StatusBar(): React.ReactElement {
  const { toolState, docState, canUndo, canRedo } = useAppContext();
  const [pointerType, setPointerType] = useState<string>('mouse');
  const [pressure, setPressure] = useState(0);

  // Track pointer type for display
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      setPointerType(e.pointerType || 'mouse');
      setPressure(Math.round(e.pressure * 100));
    };
    window.addEventListener('pointermove', handler, { passive: true });
    return () => window.removeEventListener('pointermove', handler);
  }, []);

  const saveStatus = docState.isDirty ? 'Unsaved' : docState.lastSavedAt
    ? `Saved ${new Date(docState.lastSavedAt).toLocaleTimeString()}`
    : 'Not saved';

  return (
    <div className="status-bar" role="status" aria-live="polite">
      {/* Tool */}
      <div className="status-item">
        <span className="status-label">Tool:</span>
        <span className="status-value">{toolState.activeTool}</span>
      </div>

      <span className="status-sep">│</span>

      {/* Zoom */}
      <div className="status-item">
        <span className="status-label">Zoom:</span>
        <span className="status-value">{Math.round(toolState.zoom * 100)}%</span>
      </div>

      <span className="status-sep">│</span>

      {/* Page */}
      <div className="status-item">
        <span className="status-label">Page:</span>
        <span className="status-value">
          {docState.currentPageIndex + 1} / {docState.lesson.pages.length}
        </span>
      </div>

      <span className="status-sep">│</span>

      {/* Pointer */}
      <div className="status-item">
        <span className="status-label">Input:</span>
        <span className="status-value" style={{ textTransform: 'capitalize' }}>{pointerType}</span>
        {pointerType === 'pen' && <span className="status-value"> · {pressure}%</span>}
      </div>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Undo/Redo state */}
      {(canUndo || canRedo) && (
        <>
          <div className="status-item">
            <span className="status-value" style={{ opacity: canUndo ? 1 : 0.4 }}>↩ Undo</span>
            <span className="status-value" style={{ opacity: canRedo ? 1 : 0.4 }}> ↪ Redo</span>
          </div>
          <span className="status-sep">│</span>
        </>
      )}

      {/* Save status */}
      <div className="status-item">
        <div className={`status-dot ${docState.isDirty ? 'unsaved' : ''}`} />
        <span className="status-value">{saveStatus}</span>
      </div>
    </div>
  );
}
