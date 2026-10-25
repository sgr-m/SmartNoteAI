/**
 * DesktopModeView — Floating Return Icon for Windows Desktop Mode
 *
 * Provides:
 * - A sleek, circular floating icon button on the Windows desktop
 * - Single-click or tap return to SmartBoard (preserving full-screen or previous mode)
 * - Drag-to-reposition anywhere without -webkit-app-region non-client hit-test conflicts
 */

import React, { useCallback, useRef } from 'react';
import './DesktopModeView.css';

export function DesktopModeView(): React.ReactElement {
  const pointerState = useRef<{
    isDown: boolean;
    startX: number;
    startY: number;
    moved: boolean;
  }>({
    isDown: false,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const handleReturnToBoard = useCallback(async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('window:restore');
      } else {
        window.close();
      }
    } catch (err) {
      console.error('Failed to restore main lesson window:', err);
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    pointerState.current = {
      isDown: true,
      startX: e.screenX,
      startY: e.screenY,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pointerState.current.isDown) return;
    const deltaX = e.screenX - pointerState.current.startX;
    const deltaY = e.screenY - pointerState.current.startY;

    // If moved more than 4px, treat as drag to reposition the button
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      pointerState.current.moved = true;
      pointerState.current.startX = e.screenX;
      pointerState.current.startY = e.screenY;
      window.electronAPI?.invoke('window:moveOverlay', { deltaX, deltaY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pointerState.current.isDown) return;
    const wasMoved = pointerState.current.moved;
    pointerState.current.isDown = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // If pointer did not drag across screen, fire return to SmartBoard immediately
    if (!wasMoved) {
      handleReturnToBoard();
    }
  };

  return (
    <div className="desktop-return-container">
      <button
        className="desktop-return-icon-btn"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          e.stopPropagation();
          // Fallback if pointer events didn't trigger
          if (!pointerState.current.moved) {
            handleReturnToBoard();
          }
        }}
        title="Return to Whiteboard (SmartNoteAI) — Drag to move"
        aria-label="Return to Whiteboard"
      >
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="desktop-return-svg"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}
