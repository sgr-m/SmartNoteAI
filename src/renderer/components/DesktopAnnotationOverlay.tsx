/**
 * DesktopAnnotationOverlay — In-renderer transparent annotation layer over the board
 * Section 14.2: Desktop Annotation
 * 
 * Architecture: This component renders as a fixed overlay on top of the whiteboard.
 * It captures pointer events while in annotation mode and draws on its own canvas.
 * The underlying board remains visible through the transparent background.
 * Supports pen (multiple colors/sizes), eraser, and laser pointer modes.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import './DesktopAnnotationOverlay.css';

export type AnnotationTool = 'pen' | 'eraser' | 'laser';

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  id: string;
  tool: AnnotationTool;
  color: string;
  width: number;
  points: Point[];
  startTime: number;
}

interface DesktopAnnotationOverlayProps {
  onClose: () => void;
  /** If true, hides overlay but keeps strokes (user went to desktop) */
  hidden?: boolean;
}

const LASER_DURATION = 2200;
const COLORS = ['#ef4444', '#f97316', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#ffffff', '#1e293b'];

export function DesktopAnnotationOverlay({ onClose, hidden }: DesktopAnnotationOverlayProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<AnnotationTool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(4);
  const currentStroke = useRef<Stroke | null>(null);
  const isDrawing = useRef(false);
  const strokes = useRef<Stroke[]>([]);
  const laserStrokesRef = useRef<Stroke[]>([]);
  const rafHandle = useRef<number | null>(null);
  const lastPointerPos = useRef<Point>({ x: 0, y: 0, pressure: 0.5 });

  // ─── Canvas sizing ──────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    redraw();
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  // ─── Redraw all strokes ──────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    for (const stroke of [...strokes.current, ...laserStrokesRef.current]) {
      if (stroke.points.length < 2) continue;

      if (stroke.tool === 'laser') {
        const age = now - stroke.startTime;
        if (age > LASER_DURATION) continue;
        const fade = 1 - age / LASER_DURATION;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = stroke.width * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12 * dpr;
        drawPath(ctx, stroke.points, dpr);
        ctx.restore();
      } else if (stroke.tool === 'eraser') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = stroke.width * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawPath(ctx, stroke.points, dpr);
        ctx.restore();
      } else {
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawPath(ctx, stroke.points, dpr);
        ctx.restore();
      }
    }
  }, []);

  function drawPath(ctx: CanvasRenderingContext2D, pts: Point[], dpr: number) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x * dpr, pts[0].y * dpr);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x * dpr, pts[i].y * dpr, mx * dpr, my * dpr);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x * dpr, last.y * dpr);
    ctx.stroke();
  }

  // ─── Laser animation loop ────────────────────────────────────────────────
  const startLaserLoop = useCallback(() => {
    if (rafHandle.current !== null) return;
    const loop = () => {
      const now = Date.now();
      laserStrokesRef.current = laserStrokesRef.current.filter(
        (s) => now - s.startTime < LASER_DURATION
      );
      redraw();
      if (laserStrokesRef.current.length > 0) {
        rafHandle.current = requestAnimationFrame(loop);
      } else {
        rafHandle.current = null;
      }
    };
    rafHandle.current = requestAnimationFrame(loop);
  }, [redraw]);

  // ─── Pointer events ──────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const pt: Point = { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
      lastPointerPos.current = pt;

      const stroke: Stroke = {
        id: `a_${Date.now()}_${Math.random()}`,
        tool,
        color,
        width: tool === 'eraser' ? lineWidth * 4 : lineWidth,
        points: [pt],
        startTime: Date.now(),
      };

      currentStroke.current = stroke;

      if (tool === 'laser') {
        laserStrokesRef.current.push(stroke);
        startLaserLoop();
      } else {
        strokes.current.push(stroke);
      }
    },
    [tool, color, lineWidth, startLaserLoop]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || !currentStroke.current) return;
      const pt: Point = { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
      currentStroke.current.points.push(pt);
      lastPointerPos.current = pt;

      // Incremental draw for performance
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const pts = currentStroke.current.points;

      if (tool === 'laser') {
        redraw();
        return;
      }

      if (pts.length < 2) return;

      if (tool === 'eraser') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = currentStroke.current.width * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else {
        ctx.save();
        ctx.strokeStyle = currentStroke.current.color;
        ctx.lineWidth = currentStroke.current.width * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      const i = pts.length - 2;
      if (i > 0) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.beginPath();
        ctx.moveTo(((pts[i - 1].x + pts[i].x) / 2) * dpr, ((pts[i - 1].y + pts[i].y) / 2) * dpr);
        ctx.quadraticCurveTo(pts[i].x * dpr, pts[i].y * dpr, mx * dpr, my * dpr);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x * dpr, pts[0].y * dpr);
        ctx.lineTo(pts[1].x * dpr, pts[1].y * dpr);
        ctx.stroke();
      }
      ctx.restore();
    },
    [tool, redraw]
  );

  const onPointerUp = useCallback(() => {
    isDrawing.current = false;
    currentStroke.current = null;
  }, []);

  const handleClear = useCallback(() => {
    strokes.current = [];
    laserStrokesRef.current = [];
    redraw();
  }, [redraw]);

  // Listen for IPC clear command
  useEffect(() => {
    const unsub = window.electronAPI?.on('annotation:doClear', handleClear);
    return () => unsub?.();
  }, [handleClear]);

  if (hidden) return <></>;

  return (
    <div className="annotation-overlay-root">
      {/* Annotation canvas */}
      <canvas
        ref={canvasRef}
        className="annotation-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: tool === 'eraser' ? 'cell' : tool === 'laser' ? 'crosshair' : 'crosshair' }}
      />

      {/* Floating annotation toolbar */}
      <div className="annotation-toolbar">
        <div className="annotation-toolbar-pill">
          {/* Status badge */}
          <div className="annotation-status-dot" />
          <span className="annotation-label">Annotation Mode</span>
          <div className="annotation-sep" />

          {/* Tool buttons */}
          <button
            className={`ann-tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            ✏️
          </button>
          <button
            className={`ann-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            ⬜
          </button>
          <button
            className={`ann-tool-btn ${tool === 'laser' ? 'active' : ''}`}
            onClick={() => setTool('laser')}
            title="Laser Pointer"
          >
            🔴
          </button>

          <div className="annotation-sep" />

          {/* Color picker */}
          <div className="annotation-colors">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`ann-color-dot ${c === color ? 'active' : ''}`}
                style={{ background: c, borderColor: c === '#ffffff' ? '#64748b' : c }}
                onClick={() => { setColor(c); setTool('pen'); }}
                title={c}
              />
            ))}
          </div>

          <div className="annotation-sep" />

          {/* Size */}
          <label className="annotation-label" style={{ fontSize: 11 }}>Size</label>
          <input
            type="range"
            min={1}
            max={24}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="annotation-slider"
            title="Pen width"
          />

          <div className="annotation-sep" />

          {/* Actions */}
          <button className="ann-action-btn" onClick={handleClear} title="Clear all annotations">
            🗑️
          </button>
          <button
            className="ann-close-btn"
            onClick={onClose}
            title="Exit annotation mode (Esc)"
          >
            ✕ Exit
          </button>
        </div>
      </div>
    </div>
  );
}
