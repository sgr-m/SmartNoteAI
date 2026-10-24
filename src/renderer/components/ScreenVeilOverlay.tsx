/**
 * ScreenVeilOverlay — Covers the whiteboard, reveals content progressively
 * Section 15: Presentation Utilities
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './ScreenVeilOverlay.css';

type RevealDir = 'down' | 'up' | 'right' | 'left';

interface ScreenVeilOverlayProps {
  onClose: () => void;
}

export function ScreenVeilOverlay({ onClose }: ScreenVeilOverlayProps): React.ReactElement {
  const [revealed, setRevealed] = useState(0); // 0..1 fraction revealed
  const [direction, setDirection] = useState<RevealDir>('down');
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const revealedAtDragStart = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      const step = 0.05;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setRevealed((r) => Math.min(1, r + step));
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setRevealed((r) => Math.max(0, r - step));
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.veil-controls')) return;
    isDragging.current = true;
    dragStart.current = direction === 'down' || direction === 'up' ? e.clientY : e.clientX;
    revealedAtDragStart.current = revealed;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    let delta = 0;
    if (direction === 'down') {
      delta = (e.clientY - dragStart.current) / rect.height;
    } else if (direction === 'up') {
      delta = -(e.clientY - dragStart.current) / rect.height;
    } else if (direction === 'right') {
      delta = (e.clientX - dragStart.current) / rect.width;
    } else {
      delta = -(e.clientX - dragStart.current) / rect.width;
    }
    setRevealed(Math.max(0, Math.min(1, revealedAtDragStart.current + delta)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Compute clip rect — the veil area that remains covered
  let veilStyle: React.CSSProperties = {};
  const pct = `${(1 - revealed) * 100}%`;
  if (direction === 'down') {
    veilStyle = { top: `${revealed * 100}%`, left: 0, right: 0, bottom: 0 };
  } else if (direction === 'up') {
    veilStyle = { top: 0, left: 0, right: 0, height: pct };
  } else if (direction === 'right') {
    veilStyle = { top: 0, left: `${revealed * 100}%`, right: 0, bottom: 0 };
  } else {
    veilStyle = { top: 0, left: 0, width: pct, bottom: 0 };
  }

  // Handle edge for dragging
  let handlePos: React.CSSProperties = {};
  if (direction === 'down') {
    handlePos = { top: `${revealed * 100}%`, left: 0, right: 0, transform: 'translateY(-50%)' };
  } else if (direction === 'up') {
    handlePos = { top: pct, left: 0, right: 0, transform: 'translateY(-50%)' };
  } else if (direction === 'right') {
    handlePos = { top: 0, bottom: 0, left: `${revealed * 100}%`, transform: 'translateX(-50%)' };
  } else {
    handlePos = { top: 0, bottom: 0, left: pct, transform: 'translateX(-50%)' };
  }

  const isHoriz = direction === 'left' || direction === 'right';

  return (
    <div
      ref={overlayRef}
      className="veil-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Veil block */}
      <div className="veil-block" style={veilStyle} />

      {/* Drag handle line */}
      <div
        className={`veil-handle-line ${isHoriz ? 'horiz' : 'vert'}`}
        style={handlePos}
      >
        <div className="veil-handle-grip" />
      </div>

      {/* Controls */}
      <div className="veil-controls" onClick={(e) => e.stopPropagation()}>
        <div className="veil-controls-pill">
          <span className="veil-ctrl-label">🪟 Screen Veil</span>
          <div className="veil-ctrl-sep" />

          {(['down', 'up', 'right', 'left'] as RevealDir[]).map((d) => (
            <button
              key={d}
              className={`veil-dir-btn ${direction === d ? 'active' : ''}`}
              onClick={() => setDirection(d)}
              title={`Reveal ${d}`}
            >
              {d === 'down' ? '↓' : d === 'up' ? '↑' : d === 'right' ? '→' : '←'}
            </button>
          ))}

          <div className="veil-ctrl-sep" />
          <button className="veil-action-btn" onClick={() => setRevealed(0)}>Reset</button>
          <button className="veil-action-btn" onClick={() => setRevealed(1)}>Show All</button>
          <div className="veil-ctrl-sep" />
          <button className="veil-close-btn" onClick={onClose} title="Close veil (Esc)">✕</button>
        </div>
      </div>
    </div>
  );
}
