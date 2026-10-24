/**
 * EraserFlyout — Smartboard eraser settings popup (Reference Image 3)
 * Provides "Erase point" (geometric stroke splitter), "Erase object", and interactive "Slide to clear pages".
 * Works seamlessly with stylus, touch, and mouse input.
 */

import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import './EraserFlyout.css';

interface EraserFlyoutProps {
  onClose: () => void;
}

export function EraserFlyout({ onClose }: EraserFlyoutProps): React.ReactElement {
  const { toolState, setEraserMode, clearCurrentPage, setActiveTool } = useAppContext();
  const [slidePos, setSlidePos] = useState(0); // 0 to 100
  const [clearedFeedback, setClearedFeedback] = useState(false);
  const isDraggingSlide = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const activeMode = toolState.eraserMode;

  const updateSlideFromClientX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const availableWidth = rect.width - 48;
    const x = Math.max(0, Math.min(availableWidth, clientX - rect.left - 24));
    const pct = Math.max(0, Math.min(100, (x / availableWidth) * 100));
    setSlidePos(pct);

    if (pct >= 82) {
      isDraggingSlide.current = false;
      setSlidePos(100);
      setClearedFeedback(true);
      setTimeout(() => {
        clearCurrentPage();
        setSlidePos(0);
        setClearedFeedback(false);
        onClose();
      }, 200);
    }
  };

  const handlePointerDownSlide = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingSlide.current = true;
    if (trackRef.current) {
      trackRef.current.setPointerCapture(e.pointerId);
    }
    updateSlideFromClientX(e.clientX);
  };

  const handlePointerMoveSlide = (e: React.PointerEvent) => {
    if (!isDraggingSlide.current) return;
    e.preventDefault();
    updateSlideFromClientX(e.clientX);
  };

  const handlePointerUpSlide = (e: React.PointerEvent) => {
    if (isDraggingSlide.current) {
      isDraggingSlide.current = false;
      if (trackRef.current && trackRef.current.hasPointerCapture(e.pointerId)) {
        trackRef.current.releasePointerCapture(e.pointerId);
      }
      setSlidePos(0);
    }
  };

  return (
    <div className="smartboard-eraser-flyout" role="dialog" aria-label="Eraser Settings">
      {/* Black Title Header Bar */}
      <div className="flyout-header-bar">
        <span className="flyout-title">
          {activeMode === 'stroke' ? 'Erase point' : 'Erase object'}
        </span>
        <button className="flyout-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="eraser-flyout-body">
        {/* Row of Eraser Modes matching Image 3 */}
        <div className="eraser-modes-row">
          {/* 1. Erase Point (Geometric stroke splitter) */}
          <button
            className={`eraser-mode-card ${activeMode === 'stroke' ? 'active' : ''}`}
            onClick={() => {
              setEraserMode('stroke');
              setActiveTool('eraser');
            }}
            title="Erase point: erases only touched stroke points (splits stroke)"
          >
            <div className="eraser-icon-graphic">
              <div className="eraser-blue-body">
                <span className="eraser-label-text">Eraser</span>
              </div>
            </div>
          </button>

          {/* 2. Erase Object (Dashed Box whole object eraser) */}
          <button
            className={`eraser-mode-card ${activeMode === 'object' ? 'active' : ''}`}
            onClick={() => {
              setEraserMode('object');
              setActiveTool('eraser');
            }}
            title="Erase object: removes entire stroke, shape, text, or image"
          >
            <div className="dashed-box-wrapper">
              <div className="eraser-blue-body small">
                <span className="eraser-label-text">Eraser</span>
              </div>
            </div>
          </button>

          {/* 3. Slide to clear pages (Stylus & Touch enabled) */}
          <div
            ref={trackRef}
            className={`slide-to-clear-track ${clearedFeedback ? 'cleared' : ''}`}
            onPointerDown={handlePointerDownSlide}
            onPointerMove={handlePointerMoveSlide}
            onPointerUp={handlePointerUpSlide}
            onPointerCancel={handlePointerUpSlide}
            title="Drag right with stylus or finger to clear all content on page"
          >
            {/* Dynamic green fill indicating slide progress */}
            <div
              className="slide-fill-progress"
              style={{ width: `${slidePos}%` }}
            />

            <div
              className="slide-eraser-thumb"
              style={{ transform: `translateX(${slidePos * 1.3}px)` }}
            >
              <div className="eraser-blue-body mini">
                <span className="eraser-label-text">Eraser</span>
              </div>
            </div>

            <div className="slide-track-text">
              <span>{clearedFeedback ? 'Page Cleared! ✓' : 'Slide to clear'}</span>
              {!clearedFeedback && <span className="slide-arrows">►►►</span>}
            </div>

            <div className="slide-page-target">
              <span className="page-sheet-icon">📄</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom callout pointer arrow */}
      <div className="eraser-flyout-pointer" />
    </div>
  );
}
