/**
 * MagnifierOverlay — Live high-performance magnification lens for presentations
 * Section 15: Presentation Utilities
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MagnifierOverlay.css';

interface MagnifierOverlayProps {
  onClose: () => void;
}

const DEFAULT_LENS_SIZE = 240;

export function MagnifierOverlay({ onClose }: MagnifierOverlayProps): React.ReactElement {
  const [pos, setPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [zoom, setZoom] = useState(2.5);
  const [lensSize, setLensSize] = useState(DEFAULT_LENS_SIZE);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lensRef = useRef<HTMLDivElement>(null);
  const magCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const posRef = useRef(pos);
  posRef.current = pos;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const lensSizeRef = useRef(lensSize);
  lensSizeRef.current = lensSize;

  // Real-time canvas rendering loop: mirrors the active whiteboard canvases directly
  const renderMagnifier = useCallback(() => {
    const magCanvas = magCanvasRef.current;
    if (!magCanvas) return;
    const ctx = magCanvas.getContext('2d');
    if (!ctx) return;

    const currentPos = posRef.current;
    const currentZoom = zoomRef.current;
    const currentLens = lensSizeRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Synchronize canvas buffer resolution
    if (magCanvas.width !== currentLens * dpr || magCanvas.height !== currentLens * dpr) {
      magCanvas.width = currentLens * dpr;
      magCanvas.height = currentLens * dpr;
    }

    ctx.clearRect(0, 0, magCanvas.width, magCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Query all whiteboard canvases (.bg-canvas, .committed-canvas, .active-canvas)
    const canvases = Array.from(
      document.querySelectorAll<HTMLCanvasElement>('.whiteboard-canvas-wrapper canvas')
    );

    for (const srcCanvas of canvases) {
      const rect = srcCanvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const scaleX = srcCanvas.width / rect.width;
      const scaleY = srcCanvas.height / rect.height;

      // Compute source rectangle centered around currentPos
      const srcW = (currentLens / currentZoom) * scaleX;
      const srcH = (currentLens / currentZoom) * scaleY;
      const srcX = (currentPos.x - rect.left) * scaleX - srcW / 2;
      const srcY = (currentPos.y - rect.top) * scaleY - srcH / 2;

      try {
        ctx.drawImage(
          srcCanvas,
          srcX,
          srcY,
          srcW,
          srcH,
          0,
          0,
          currentLens * dpr,
          currentLens * dpr
        );
      } catch {
        // Skip tainted canvas if any
      }
    }
  }, []);

  useEffect(() => {
    const loop = () => {
      renderMagnifier();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderMagnifier]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (isDragging.current) {
      setPos({
        x: Math.max(40, Math.min(window.innerWidth - 40, e.clientX - dragOffset.current.x)),
        y: Math.max(40, Math.min(window.innerHeight - 40, e.clientY - dragOffset.current.y)),
      });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 8));
      if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 1.25));
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onClose, handlePointerMove, handlePointerUp]);

  const handleLensPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.magnifier-controls')) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const r = lensSize / 2;

  return (
    <div className="magnifier-overlay">
      {/* Passthrough layer allowing board interactions outside the lens */}
      <div className="magnifier-passthrough" />

      {/* The magnifier lens */}
      <div
        ref={lensRef}
        className="magnifier-lens"
        style={{
          left: pos.x - r,
          top: pos.y - r,
          width: lensSize,
          height: lensSize,
          borderRadius: '50%',
        }}
        onPointerDown={handleLensPointerDown}
        title="Drag to roam magnifier across board"
      >
        <div
          className="magnifier-viewport"
          style={{
            width: lensSize,
            height: lensSize,
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={magCanvasRef}
            style={{
              width: lensSize,
              height: lensSize,
              display: 'block',
            }}
          />
        </div>

        {/* Lens ring */}
        <div className="magnifier-lens-ring" style={{ borderRadius: '50%' }} />
      </div>

      {/* Crosshair guides at target center point */}
      <div className="magnifier-crosshair-h" style={{ top: pos.y }} />
      <div className="magnifier-crosshair-v" style={{ left: pos.x }} />

      {/* Controls */}
      <div className="magnifier-controls" onClick={(e) => e.stopPropagation()}>
        <div className="magnifier-controls-pill">
          <span className="mag-ctrl-label">🔍 Magnifier</span>
          <div className="mag-ctrl-sep" />
          <label className="mag-ctrl-label" style={{ fontSize: 11 }}>Zoom {zoom.toFixed(1)}×</label>
          <input
            type="range"
            min={1.25}
            max={8}
            step={0.25}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mag-slider"
            title="Magnification level (+/-)"
          />
          <div className="mag-ctrl-sep" />
          <label className="mag-ctrl-label" style={{ fontSize: 11 }}>Lens {lensSize}px</label>
          <input
            type="range"
            min={120}
            max={480}
            step={20}
            value={lensSize}
            onChange={(e) => setLensSize(Number(e.target.value))}
            className="mag-slider"
            title="Lens size"
          />
          <div className="mag-ctrl-sep" />
          <button className="mag-close-btn" onClick={onClose} title="Close magnifier (Esc)">✕</button>
        </div>
      </div>
    </div>
  );
}
