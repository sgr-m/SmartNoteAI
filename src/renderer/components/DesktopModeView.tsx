/**
 * DesktopModeView — Full-featured transparent desktop teaching overlay
 * Section 14: Desktop Annotation and Floating Bottom Toolbar
 * Section 15: Presentation Utilities over Desktop
 *
 * Provides:
 * - Persistent, draggable Floating Toolbar on the Windows desktop
 * - Click-through pointer mode to interact with underlying Windows apps
 * - Desktop annotation (pen, highlighter, eraser, laser pointer)
 * - All presentation tools over desktop (Spotlight, Screen Veil, Magnifier, Timer)
 * - Area screenshot tool to select and snip specific screen regions
 * - Return-to-board action restoring the main lesson window
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SpotlightOverlay } from './SpotlightOverlay';
import { ScreenVeilOverlay } from './ScreenVeilOverlay';
import { MagnifierOverlay } from './MagnifierOverlay';
import { FloatingTimerWidget } from './FloatingTimerWidget';
import { ScreenshotModal } from './ScreenshotModal';
import { AreaScreenshotOverlay } from './AreaScreenshotOverlay';
import './DesktopModeView.css';

export type DesktopTool = 'pointer' | 'pen' | 'highlighter' | 'eraser' | 'laser';
export type DesktopPresentationOverlay = 'spotlight' | 'veil' | 'magnifier' | null;

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  id: string;
  tool: DesktopTool;
  color: string;
  width: number;
  points: Point[];
  startTime: number;
}

const LASER_DURATION = 2200;
const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#facc15', // Yellow
  '#4ade80', // Green
  '#38bdf8', // Cyan
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#ffffff', // White
];

export function DesktopModeView(): React.ReactElement {
  const [activeTool, setActiveTool] = useState<DesktopTool>('pointer');
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(5);
  const [activeOverlay, setActiveOverlay] = useState<DesktopPresentationOverlay>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [showAreaSnip, setShowAreaSnip] = useState(false);
  const [snipInitialCapture, setSnipInitialCapture] = useState<string | null>(null);

  // Floating Toolbar state
  const [toolbarPos, setToolbarPos] = useState({ x: 28, y: 120 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Drawing Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<Stroke | null>(null);
  const isDrawing = useRef(false);
  const strokes = useRef<Stroke[]>([]);
  const laserStrokesRef = useRef<Stroke[]>([]);
  const rafHandle = useRef<number | null>(null);

  // ─── Native Electron Click-Through Management ──────────────────────────────
  const isIgnoringRef = useRef<boolean | null>(null);

  const setIgnoreState = useCallback((ignore: boolean) => {
    if (isIgnoringRef.current === ignore) return;
    isIgnoringRef.current = ignore;
    if (window.electronAPI) {
      window.electronAPI.invoke('window:setIgnoreMouseEvents', ignore).catch(() => {});
    }
  }, []);

  // When in pointer mode:
  // - Over floating toolbar / interactive widgets: setIgnoreMouseEvents(false) so buttons can be clicked
  // - Over desktop / background windows: setIgnoreMouseEvents(true) so teacher can click VS Code, run code, etc.
  // When in pen / highlighter / eraser / laser / overlay / modal mode:
  // - setIgnoreMouseEvents(false) so user can draw anywhere across the screen
  useEffect(() => {
    const isPointerMode =
      activeTool === 'pointer' &&
      !activeOverlay &&
      !showScreenshotModal &&
      !showAreaSnip &&
      !isDraggingToolbar;

    if (!isPointerMode) {
      // In drawing or overlay mode, allow drawing anywhere across screen
      setIgnoreState(false);
      return;
    }

    // In pointer mode, initially allow clicking through to Windows desktop apps
    setIgnoreState(true);

    const isInsideRect = (el: Element | null, x: number, y: number, padding = 8) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return (
        x >= r.left - padding &&
        x <= r.right + padding &&
        y >= r.top - padding &&
        y <= r.bottom + padding
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      // 1. Direct bounding box check on the toolbar (always works even if hit-test is weird)
      const isOverToolbar = isInsideRect(toolbarRef.current, e.clientX, e.clientY, 10);

      // 2. Direct bounding box check on palette, timer, modals
      const paletteEl = document.querySelector('.desktop-pen-palette');
      const isOverPalette = isInsideRect(paletteEl, e.clientX, e.clientY, 8);

      const timerEl = document.querySelector('.floating-timer-root');
      const isOverTimer = isInsideRect(timerEl, e.clientX, e.clientY, 6);

      const modalEl = document.querySelector('.screenshot-modal, .area-screenshot-overlay');
      const isOverModal = isInsideRect(modalEl, e.clientX, e.clientY, 0);

      // 3. Fallback hit-test & closest element check
      const target = e.target as HTMLElement | null;
      const elFromPoint = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const isOverInteractive =
        isOverToolbar ||
        isOverPalette ||
        isOverTimer ||
        isOverModal ||
        !!(
          target?.closest?.(
            '.desktop-floating-toolbar, .desktop-pen-palette, .floating-timer-root, .screenshot-modal, .screenshot-modal-backdrop, .area-screenshot-overlay, .interactive, button, input'
          ) ||
          elFromPoint?.closest?.(
            '.desktop-floating-toolbar, .desktop-pen-palette, .floating-timer-root, .screenshot-modal, .screenshot-modal-backdrop, .area-screenshot-overlay, .interactive, button, input'
          )
        );

      if (isOverInteractive) {
        setIgnoreState(false);
      } else {
        setIgnoreState(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeTool, activeOverlay, showScreenshotModal, showAreaSnip, isDraggingToolbar, setIgnoreState]);

  // Listen for desktop:resetMode from main process when desktop mode is opened
  useEffect(() => {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.on('desktop:resetMode', () => {
      setActiveTool('pointer');
      setActiveOverlay(null);
      setShowScreenshotModal(false);
      setShowAreaSnip(false);
      isIgnoringRef.current = null;
      setIgnoreState(true);
    });
    return cleanup;
  }, [setIgnoreState]);

  // When hovering over the toolbar or controls, immediately disable click-through for instant response
  const handleToolbarMouseEnter = () => {
    setIgnoreState(false);
  };

  const handleToolbarMouseLeave = () => {
    if (activeTool === 'pointer' && !activeOverlay && !showScreenshotModal && !showAreaSnip && !isDraggingToolbar) {
      setIgnoreState(true);
    }
  };

  // ─── Canvas Resizing & Rendering ───────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
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
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
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
        ctx.strokeStyle = '#ff3344';
        ctx.lineWidth = stroke.width * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ff1122';
        ctx.shadowBlur = 14 * dpr;
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
      } else if (stroke.tool === 'highlighter') {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * 2.5 * dpr;
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

  // ─── Laser Animation Loop ──────────────────────────────────────────────────
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

  // ─── Drawing Pointer Events ────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pointer' || activeOverlay) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;

    const pt: Point = { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
    const stroke: Stroke = {
      id: `d_${Date.now()}_${Math.random()}`,
      tool: activeTool,
      color,
      width: activeTool === 'eraser' ? lineWidth * 3.5 : lineWidth,
      points: [pt],
      startTime: Date.now(),
    };

    currentStroke.current = stroke;

    if (activeTool === 'laser') {
      laserStrokesRef.current.push(stroke);
      startLaserLoop();
    } else {
      strokes.current.push(stroke);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current) return;
    const pt: Point = { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
    currentStroke.current.points.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const pts = currentStroke.current.points;

    if (activeTool === 'laser') {
      redraw();
      return;
    }

    if (pts.length < 2) return;

    if (activeTool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = currentStroke.current.width * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (activeTool === 'highlighter') {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = currentStroke.current.color;
      ctx.lineWidth = currentStroke.current.width * 2.5 * dpr;
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
  };

  const onPointerUp = () => {
    isDrawing.current = false;
    currentStroke.current = null;
  };

  const handleClearAll = () => {
    strokes.current = [];
    laserStrokesRef.current = [];
    redraw();
  };

  // ─── Floating Toolbar Dragging ─────────────────────────────────────────────
  const handleDragStart = (e: React.PointerEvent) => {
    const tb = toolbarRef.current;
    if (!tb) return;
    const rect = tb.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDraggingToolbar(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDraggingToolbar) return;
    setToolbarPos({
      x: Math.max(8, Math.min(window.innerWidth - 68, e.clientX - dragOffset.x)),
      y: Math.max(8, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y)),
    });
  };

  const handleDragEnd = () => {
    setIsDraggingToolbar(false);
  };

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleReturnToBoard = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('window:restore');
      }
    } catch (err) {
      console.error('Failed to restore main lesson window:', err);
    }
  };

  const handleExitApp = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('app:quit');
      } else {
        window.close();
      }
    } catch (err) {
      console.error('Failed to exit app:', err);
    }
  };

  const handleAreaCaptureComplete = (croppedUrl: string) => {
    setShowAreaSnip(false);
    setSnipInitialCapture(croppedUrl);
    setShowScreenshotModal(true);
  };

  const toggleOverlay = (tool: DesktopPresentationOverlay) => {
    setActiveOverlay((prev) => (prev === tool ? null : tool));
    if (activeTool === 'pointer') {
      setActiveTool('pen');
    }
  };

  return (
    <div className="desktop-mode-root">
      {/* ─── Transparent Drawing Canvas ───────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="desktop-draw-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          pointerEvents: activeTool === 'pointer' || activeOverlay ? 'none' : 'all',
          cursor:
            activeTool === 'pointer'
              ? 'default'
              : activeTool === 'eraser'
              ? 'cell'
              : activeTool === 'laser'
              ? 'crosshair'
              : 'crosshair',
        }}
      />

      {/* ─── Persistent Desktop Floating Toolbar ──────────────────────────── */}
      {/* ─── Persistent Desktop Floating Toolbar ──────────────────────────── */}
      <div
        ref={toolbarRef}
        className={`desktop-floating-toolbar ${isCollapsed ? 'collapsed' : ''} ${
          isDraggingToolbar ? 'dragging' : ''
        }`}
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onMouseEnter={handleToolbarMouseEnter}
        onMouseLeave={handleToolbarMouseLeave}
      >
        {/* Drag handle */}
        <div
          className="desktop-bar-handle"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          title="Drag toolbar anywhere"
        >
          ⠿
        </div>

        {/* Collapse / Expand Toggle */}
        <button
          className="desktop-btn collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Floating Toolbar' : 'Collapse Floating Toolbar'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>

        {/* 1. Return to Whiteboard */}
        <button
          className="desktop-btn return-btn"
          onClick={handleReturnToBoard}
          title="Return to Whiteboard Lesson"
        >
          ⬅️
        </button>

        <div className="desktop-divider" />

        {/* 2. Mouse / Pointer Mode (click through to Windows apps) */}
        <button
          className={`desktop-btn ${activeTool === 'pointer' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('pointer');
            setActiveOverlay(null);
          }}
          title="Mouse Mode: Click through and interact with desktop applications"
        >
          👆
        </button>

        {/* 3. Annotation Pen */}
        <button
          className={`desktop-btn ${activeTool === 'pen' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('pen');
            setActiveOverlay(null);
          }}
          title="Desktop Annotation Pen: Draw over applications"
        >
          ✏️
        </button>

        {!isCollapsed && (
          <>
            {/* 4. Highlighter */}
            <button
              className={`desktop-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
              onClick={() => {
                setActiveTool('highlighter');
                setActiveOverlay(null);
              }}
              title="Desktop Highlighter: Highlight text on screen"
            >
              🖍️
            </button>

            {/* 5. Eraser */}
            <button
              className={`desktop-btn ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => {
                setActiveTool('eraser');
                setActiveOverlay(null);
              }}
              title="Desktop Annotation Eraser"
            >
              ⬜
            </button>

            {/* 6. Laser Pointer */}
            <button
              className={`desktop-btn ${activeTool === 'laser' ? 'active' : ''}`}
              onClick={() => {
                setActiveTool('laser');
                setActiveOverlay(null);
              }}
              title="Laser Pointer (Auto-fades)"
            >
              🔴
            </button>

            {/* 7. Clear Markings */}
            <button className="desktop-btn" onClick={handleClearAll} title="Clear all desktop annotations">
              🗑️
            </button>

            <div className="desktop-divider" />

            {/* 8. Presentation Tools on Desktop: Spotlight */}
            <button
              className={`desktop-btn ${activeOverlay === 'spotlight' ? 'active' : ''}`}
              onClick={() => toggleOverlay('spotlight')}
              title="Spotlight: Focus area on desktop"
            >
              🔦
            </button>

            {/* 9. Presentation Tools on Desktop: Screen Veil */}
            <button
              className={`desktop-btn ${activeOverlay === 'veil' ? 'active' : ''}`}
              onClick={() => toggleOverlay('veil')}
              title="Screen Veil: Progressive reveal on desktop"
            >
              🪟
            </button>

            {/* 10. Presentation Tools on Desktop: Magnifier */}
            <button
              className={`desktop-btn ${activeOverlay === 'magnifier' ? 'active' : ''}`}
              onClick={() => toggleOverlay('magnifier')}
              title="Magnifier: Magnify desktop region"
            >
              🔍
            </button>

            {/* 11. Timer / Stopwatch */}
            <button
              className={`desktop-btn ${showTimer ? 'active' : ''}`}
              onClick={() => setShowTimer((t) => !t)}
              title="Timer & Stopwatch on Desktop"
            >
              ⏱️
            </button>

            <div className="desktop-divider" />

            {/* 12. Area Screenshot (Drag to select specific region) */}
            <button
              className="desktop-btn snip-btn"
              onClick={() => setShowAreaSnip(true)}
              title="Select Area Screenshot: Drag a box to snip any part of the desktop"
            >
              📐
            </button>

            {/* 13. Full Screenshot Modal */}
            <button
              className="desktop-btn"
              onClick={() => {
                setSnipInitialCapture(null);
                setShowScreenshotModal(true);
              }}
              title="Capture Desktop Screenshot & Preview"
            >
              📸
            </button>

            <div className="desktop-divider" />

            {/* 14. Exit SmartBoard Studio */}
            <button
              className="desktop-btn exit-app-btn"
              onClick={handleExitApp}
              title="Close & Exit SmartBoard Studio"
            >
              ❌
            </button>
          </>
        )}
      </div>

      {/* ─── Pen Color & Size Mini Dock (Shown when drawing) ───────────────── */}
      {(activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') && (
        <div
          className="desktop-pen-palette"
          style={{ left: toolbarPos.x + 64, top: toolbarPos.y }}
          onMouseEnter={handleToolbarMouseEnter}
          onMouseLeave={handleToolbarMouseLeave}
        >
          <div className="palette-colors">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`palette-dot ${color === c ? 'active' : ''}`}
                style={{ background: c, borderColor: c === '#ffffff' ? '#64748b' : c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>

          <div className="palette-sep" />

          <label style={{ fontSize: 11, color: '#94a3b8' }}>Size</label>
          <input
            type="range"
            min={2}
            max={28}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="palette-slider"
            title="Stroke thickness"
          />
        </div>
      )}

      {/* ─── Presentation Overlays on Desktop ─────────────────────────────── */}
      {activeOverlay === 'spotlight' && (
        <SpotlightOverlay onClose={() => setActiveOverlay(null)} />
      )}

      {activeOverlay === 'veil' && (
        <ScreenVeilOverlay onClose={() => setActiveOverlay(null)} />
      )}

      {activeOverlay === 'magnifier' && (
        <MagnifierOverlay onClose={() => setActiveOverlay(null)} />
      )}

      {/* ─── Floating Timer Widget on Desktop ─────────────────────────────── */}
      {showTimer && <FloatingTimerWidget onClose={() => setShowTimer(false)} />}

      {/* ─── Area / Region Snip Tool ───────────────────────────────────────── */}
      {showAreaSnip && (
        <AreaScreenshotOverlay
          onCapture={handleAreaCaptureComplete}
          onClose={() => setShowAreaSnip(false)}
        />
      )}

      {/* ─── Screenshot Modal Preview ─────────────────────────────────────── */}
      {showScreenshotModal && (
        <ScreenshotModal
          initialCapture={snipInitialCapture}
          onInsertCustom={async (url) => {
            if (window.electronAPI) {
              await window.electronAPI.invoke('desktop:insertImage', url);
            }
          }}
          onClose={() => {
            setShowScreenshotModal(false);
            setSnipInitialCapture(null);
          }}
        />
      )}
    </div>
  );
}
