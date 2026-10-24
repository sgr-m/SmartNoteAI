/**
 * PresentationFloatingToolbar — Floating teaching toolbar for presentation mode
 * Section 14: Desktop Annotation and Bottom Toolbar
 * 
 * Provides quick access to all presentation tools during full-screen teaching mode.
 * Draggable, auto-hides on inactivity, shows on hover.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import './PresentationFloatingToolbar.css';

export type PresentationTool = 'spotlight' | 'veil' | 'magnifier' | 'annotation' | 'screenshot' | 'laser' | 'timer';

interface PresentationFloatingToolbarProps {
  activeTool: PresentationTool | null;
  onActivateTool: (tool: PresentationTool) => void;
  onDeactivateTool: () => void;
  onDesktop: () => void;
  onReturnToBoard: () => void;
  onScreenshot: () => void;
  onTogglePresentationMode: () => void;
  isPresentationMode: boolean;
  timerVisible: boolean;
  onToggleTimer: () => void;
  onAreaScreenshot?: () => void;
}

export function PresentationFloatingToolbar({
  activeTool,
  onActivateTool,
  onDeactivateTool,
  onDesktop,
  onReturnToBoard,
  onScreenshot,
  onTogglePresentationMode,
  isPresentationMode,
  timerVisible,
  onToggleTimer,
  onAreaScreenshot,
}: PresentationFloatingToolbarProps): React.ReactElement {
  const [pos, setPos] = useState({ x: 24, y: window.innerHeight / 2 - 200 });
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const hideTimerRef = useRef<number | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const showToolbar = useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (!isDragging) setIsVisible(false);
    }, 3500);
  }, [isDragging]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show if mouse near left edge or near toolbar
      const tb = toolbarRef.current;
      if (e.clientX < 120 || (tb && tb.contains(e.target as Node))) {
        showToolbar();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showToolbar]);

  // Dragging
  const handleDragStart = (e: React.PointerEvent) => {
    const tb = toolbarRef.current;
    if (!tb) return;
    const rect = tb.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 60, newX)),
      y: Math.max(0, Math.min(window.innerHeight - 400, newY)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const toggle = (t: PresentationTool) => {
    if (activeTool === t) {
      onDeactivateTool();
    } else {
      onActivateTool(t);
    }
  };

  return (
    <div
      ref={toolbarRef}
      className={`pres-toolbar ${isVisible ? 'visible' : 'hidden'} ${isDragging ? 'dragging' : ''}`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Drag handle */}
      <div
        className="pres-toolbar-handle"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        title="Drag to move toolbar"
      >
        ⠿
      </div>

      {/* Presentation mode toggle */}
      <button
        className={`pres-btn pres-mode-btn ${isPresentationMode ? 'active' : ''}`}
        onClick={onTogglePresentationMode}
        title={isPresentationMode ? 'Exit Full Screen (F11)' : 'Full Screen (F11)'}
      >
        {isPresentationMode ? '⊡' : '⛶'}
      </button>

      <div className="pres-divider" />

      {/* Spotlight */}
      <button
        className={`pres-btn ${activeTool === 'spotlight' ? 'active' : ''}`}
        onClick={() => toggle('spotlight')}
        title="Spotlight"
      >
        🔦
      </button>

      {/* Screen Veil */}
      <button
        className={`pres-btn ${activeTool === 'veil' ? 'active' : ''}`}
        onClick={() => toggle('veil')}
        title="Screen Veil / Reveal"
      >
        🪟
      </button>

      {/* Magnifier */}
      <button
        className={`pres-btn ${activeTool === 'magnifier' ? 'active' : ''}`}
        onClick={() => toggle('magnifier')}
        title="Magnifier"
      >
        🔍
      </button>

      {/* Annotation */}
      <button
        className={`pres-btn ${activeTool === 'annotation' ? 'active' : ''}`}
        onClick={() => toggle('annotation')}
        title="Annotate over board"
      >
        ✏️
      </button>

      <div className="pres-divider" />

      {/* Timer/Stopwatch */}
      <button
        className={`pres-btn ${timerVisible ? 'active' : ''}`}
        onClick={onToggleTimer}
        title="Timer & Stopwatch"
      >
        ⏱️
      </button>

      {/* Screenshot */}
      <button
        className="pres-btn"
        onClick={onScreenshot}
        title="Screenshot (Full screen / Board)"
      >
        📸
      </button>

      {/* Area Screenshot */}
      {onAreaScreenshot && (
        <button
          className="pres-btn"
          onClick={onAreaScreenshot}
          title="Select Area Screenshot (Snip region)"
        >
          📐
        </button>
      )}

      <div className="pres-divider" />

      {/* Show Desktop */}
      <button
        className="pres-btn pres-desktop-btn"
        onClick={onDesktop}
        title="Show Desktop (minimize board)"
      >
        🖥️
      </button>

      {/* Return to Board */}
      <button
        className="pres-btn pres-return-btn"
        onClick={onReturnToBoard}
        title="Return to Board"
      >
        ⬅️
      </button>
    </div>
  );
}
