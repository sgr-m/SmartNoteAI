/**
 * SpotlightOverlay — Circular/rectangular spotlight effect over the board
 * Section 15: Presentation Utilities
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './SpotlightOverlay.css';

export type SpotlightShape = 'circle' | 'rect';

interface SpotlightOverlayProps {
  onClose: () => void;
}

export function SpotlightOverlay({ onClose }: SpotlightOverlayProps): React.ReactElement {
  const [shape, setShape] = useState<SpotlightShape>('circle');
  const [pos, setPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [size, setSize] = useState(200);
  const [dimness, setDimness] = useState(0.75);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (isDragging.current) {
      setPos({
        x: Math.max(30, Math.min(window.innerWidth - 30, e.clientX - dragOffset.current.x)),
        y: Math.max(30, Math.min(window.innerHeight - 30, e.clientY - dragOffset.current.y)),
      });
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only move spotlight if clicking on the dimmed area or ring, not controls
    const target = e.target as HTMLElement;
    if (target.closest('.spotlight-controls')) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pos]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setSize((s) => Math.min(s + 20, 600));
      if (e.key === '-') setSize((s) => Math.max(s - 20, 60));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onClose, handlePointerMove, handlePointerUp]);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const rectW = Math.round(size * 1.6);
  const rectH = Math.round(size);

  const maskId = 'spotlight-mask';

  return (
    <div
      ref={overlayRef}
      className="spotlight-overlay"
      onPointerDown={handlePointerDown}
    >
      {/* SVG Mask definition: white covers screen, black creates crystal-clear cutout */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            {/* White base = fully dimmed veil */}
            <rect x="0" y="0" width={w} height={h} fill="white" />
            {/* Black hole = transparent focus area */}
            {shape === 'circle' ? (
              <circle cx={pos.x} cy={pos.y} r={size} fill="black" />
            ) : (
              <rect
                x={pos.x - rectW / 2}
                y={pos.y - rectH / 2}
                width={rectW}
                height={rectH}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
      </svg>

      {/* Dimmed veil with mask cutout */}
      <div
        className="spotlight-veil"
        style={{
          background: `rgba(0, 0, 0, ${dimness})`,
          mask: `url(#${maskId})`,
          WebkitMask: `url(#${maskId})`,
        }}
      />

      {/* Spotlight glow border ring */}
      {shape === 'circle' ? (
        <div
          className="spotlight-ring"
          style={{
            left: pos.x - size,
            top: pos.y - size,
            width: size * 2,
            height: size * 2,
            borderRadius: '50%',
          }}
        />
      ) : (
        <div
          className="spotlight-ring spotlight-rect"
          style={{
            left: pos.x - rectW / 2,
            top: pos.y - rectH / 2,
            width: rectW,
            height: rectH,
            borderRadius: 12,
          }}
        />
      )}

      {/* Controls Pill */}
      <div className="spotlight-controls" onClick={(e) => e.stopPropagation()}>
        <div className="spotlight-controls-pill">
          <span className="spotlight-ctrl-label">🔦 Spotlight</span>
          <div className="spotlight-ctrl-sep" />

          <button
            className={`spotlight-shape-btn ${shape === 'circle' ? 'active' : ''}`}
            onClick={() => setShape('circle')}
            title="Circular spotlight"
          >
            ○
          </button>
          <button
            className={`spotlight-shape-btn ${shape === 'rect' ? 'active' : ''}`}
            onClick={() => setShape('rect')}
            title="Rectangular spotlight"
          >
            ▭
          </button>

          <div className="spotlight-ctrl-sep" />
          <label className="spotlight-ctrl-label" style={{ fontSize: 11 }}>Size</label>
          <input
            type="range"
            min={60}
            max={600}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="spotlight-slider"
            title="Spotlight size (+/-)"
          />

          <div className="spotlight-ctrl-sep" />
          <label className="spotlight-ctrl-label" style={{ fontSize: 11 }}>Dim</label>
          <input
            type="range"
            min={0.2}
            max={0.97}
            step={0.05}
            value={dimness}
            onChange={(e) => setDimness(Number(e.target.value))}
            className="spotlight-slider"
            title="Surrounding dimness"
          />

          <div className="spotlight-ctrl-sep" />
          <button className="spotlight-close-btn" onClick={onClose} title="Close spotlight (Esc)">✕</button>
        </div>
      </div>
    </div>
  );
}
