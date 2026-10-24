/**
 * Toolbar — Bottom smartboard teaching dock (Reference Image 1)
 * Left island (System/Menu), Center island (Glossy Teaching Dock), Right island (Page Navigation)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PenFlyout } from './PenFlyout';
import { ShapeFlyout } from './ShapeFlyout';
import { EraserFlyout } from './EraserFlyout';
import { MenuFlyout } from './MenuFlyout';
import './Toolbar.css';

interface ToolbarProps {
  onTogglePagePanel?: () => void;
  onOpenSubjectTools?: () => void;
  onOpenResourceLibrary?: () => void;
  onOpenActivities?: () => void;
  onTogglePresentationMode?: () => void;
  onOpenSettings?: () => void;
  onOpenRecentLessons?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenRecordingStudio?: () => void;
  onOpenBackgroundModal?: () => void;
  onOpenLayersModal?: () => void;
  onOpenDocumentImport?: () => void;
  onOpenExport?: () => void;
}

export function Toolbar({
  onTogglePagePanel,
  onOpenSubjectTools,
  onOpenResourceLibrary,
  onOpenActivities,
  onTogglePresentationMode,
  onOpenSettings,
  onOpenRecentLessons,
  onOpenAIAssistant,
  onOpenRecordingStudio,
  onOpenBackgroundModal,
  onOpenLayersModal,
  onOpenDocumentImport,
  onOpenExport,
}: ToolbarProps): React.ReactElement {
  const {
    toolState,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    docState,
    docDispatch,
    duplicateCurrentPage,
    activeToolbarFlyout,
    setActiveToolbarFlyout,
    closeAllPopups,
  } = useAppContext();

  const showPenFlyout = activeToolbarFlyout === 'pen';
  const showShapeFlyout = activeToolbarFlyout === 'shape';
  const showEraserFlyout = activeToolbarFlyout === 'eraser';
  const showMenuFlyout = activeToolbarFlyout === 'menu';

  const activeTool = toolState.activeTool;
  const currentPageIndex = docState.currentPageIndex;
  const totalPages = docState.lesson.pages.length;

  const closeAllFlyouts = useCallback(() => {
    closeAllPopups();
  }, [closeAllPopups]);

  const handlePenClick = useCallback(() => {
    if (activeTool === 'pen') {
      setActiveToolbarFlyout(activeToolbarFlyout === 'pen' ? 'none' : 'pen');
    } else {
      setActiveTool('pen');
      setActiveToolbarFlyout('pen');
    }
  }, [activeTool, setActiveTool, activeToolbarFlyout, setActiveToolbarFlyout]);

  const handleEraserClick = useCallback(() => {
    if (activeTool === 'eraser') {
      setActiveToolbarFlyout(activeToolbarFlyout === 'eraser' ? 'none' : 'eraser');
    } else {
      setActiveTool('eraser');
      setActiveToolbarFlyout('eraser');
    }
  }, [activeTool, setActiveTool, activeToolbarFlyout, setActiveToolbarFlyout]);

  const handleShapeClick = useCallback(() => {
    if (activeTool === 'shape' || activeTool === 'line') {
      setActiveToolbarFlyout(activeToolbarFlyout === 'shape' ? 'none' : 'shape');
    } else {
      setActiveTool('shape');
      setActiveToolbarFlyout('shape');
    }
  }, [activeTool, setActiveTool, activeToolbarFlyout, setActiveToolbarFlyout]);

  const handleMenuClick = useCallback(() => {
    setActiveToolbarFlyout(activeToolbarFlyout === 'menu' ? 'none' : 'menu');
  }, [activeToolbarFlyout, setActiveToolbarFlyout]);

  const handleAddPage = useCallback(() => {
    docDispatch({ type: 'ADD_PAGE', after: currentPageIndex });
  }, [docDispatch, currentPageIndex]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      docDispatch({ type: 'GOTO_PAGE', index: currentPageIndex - 1 });
    }
  }, [docDispatch, currentPageIndex]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      docDispatch({ type: 'GOTO_PAGE', index: currentPageIndex + 1 });
    }
  }, [docDispatch, currentPageIndex, totalPages]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('pen');
      } else if (e.key === 'e' || e.key === 'E') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('eraser');
      } else if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('shape');
      } else if (e.key === 't' || e.key === 'T') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('text');
      } else if (e.key === 'Escape') {
        closeAllFlyouts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, closeAllFlyouts]);

  return (
    <div className="bottom-smartboard-dock-container" role="toolbar" aria-label="Smartboard Tools">
      {/* ─── Left Island (System & Modes) ──────────────────────────────── */}
      <div className="dock-left-island">
        <button className="dock-icon-btn collapse-toggle-btn" title="Collapse toolbar" aria-label="Collapse">
          ‹
        </button>

        <div className="dock-button-wrapper" style={{ position: 'relative' }}>
          <button
            className={`dock-icon-btn menu-disc-btn ${showMenuFlyout ? 'active' : ''}`}
            onClick={handleMenuClick}
            title="Application Menu (File, Import, Export, Settings)"
            aria-label="Menu"
          >
            <div className="hamburger-disc-graphic">
              <span className="disc-stripe" />
              <span className="disc-stripe" />
              <span className="disc-stripe" />
            </div>
          </button>
          {showMenuFlyout && (
            <MenuFlyout
              onClose={closeAllFlyouts}
              onOpenSettings={onOpenSettings}
              onOpenRecentLessons={onOpenRecentLessons}
              onTogglePresentationMode={onTogglePresentationMode}
              onOpenAIAssistant={onOpenAIAssistant}
              onOpenRecordingStudio={onOpenRecordingStudio}
              onOpenBackground={onOpenBackgroundModal}
              onOpenLayers={onOpenLayersModal}
              onOpenDocumentImport={onOpenDocumentImport}
              onOpenExport={onOpenExport}
            />
          )}
        </div>

        <button
          className="dock-icon-btn"
          onClick={() => onTogglePresentationMode?.()}
          title="Presentation Mode / Full Screen Teaching"
          aria-label="Presentation Mode"
        >
          <div className="monitor-icon-graphic">🖥️</div>
        </button>

        <button
          className="dock-icon-btn"
          onClick={() => onOpenBackgroundModal?.()}
          title="Page Background, Grids & Dimensions (Section 9)"
          aria-label="Background & Dimensions"
        >
          <div className="bg-icon-graphic">🎨</div>
        </button>

        <button
          className="dock-icon-btn"
          onClick={() => onOpenLayersModal?.()}
          title="Page Layers Manager (Section 9)"
          aria-label="Layers Manager"
        >
          <div className="layers-icon-graphic">📑</div>
        </button>

        <button
          className="dock-icon-btn"
          onClick={() => onOpenSubjectTools?.()}
          title="Subject Tools: Math Ruler, Protractor, Science Formulas"
          aria-label="Subject Tools"
        >
          <div className="tools-icon-graphic">🛠️</div>
        </button>

        <button
          className="dock-icon-btn"
          onClick={() => onOpenResourceLibrary?.()}
          title="Resource Library: Visual assets & templates"
          aria-label="Resource Library"
        >
          <div className="files-icon-graphic">📂</div>
        </button>

        <button
          className="dock-icon-btn"
          onClick={() => onOpenActivities?.()}
          title="Classroom Activities: Student Picker, Timer, Dice"
          aria-label="Classroom Activities"
        >
          <div className="magnifier-icon-graphic">🔍</div>
        </button>
      </div>

      {/* ─── Center Island (Floating White Glossy Teaching Dock) ────────── */}
      <div className="dock-center-island">
        {/* 1. Cursor / Select Tool */}
        <button
          className={`dock-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('select');
            closeAllFlyouts();
          }}
          title="Select & Move (S)"
          aria-label="Select Tool"
        >
          <span className="dock-tool-icon">▲</span>
        </button>

        {/* 2. Pen Tool with Flyout */}
        <div className="dock-button-wrapper" style={{ position: 'relative' }}>
          <button
            className={`dock-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
            onClick={handlePenClick}
            title="Pen (P) — Click to customize style"
            aria-label="Pen Tool"
          >
            <div className="pen-dock-icon-graphic">
              <div className="dock-pencil-tip" style={{ borderBottomColor: toolState.penStyle.color }} />
              <div className="dock-pencil-body" />
            </div>
          </button>
          {showPenFlyout && activeTool === 'pen' && (
            <PenFlyout onClose={closeAllFlyouts} />
          )}
        </div>

        {/* 3. Eraser Tool with Flyout */}
        <div className="dock-button-wrapper" style={{ position: 'relative' }}>
          <button
            className={`dock-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
            onClick={handleEraserClick}
            title="Eraser (E) — Click to customize modes"
            aria-label="Eraser Tool"
          >
            <div className="dock-eraser-graphic">
              <div className="dock-eraser-blue">
                <span className="dock-eraser-txt">Eraser</span>
              </div>
            </div>
          </button>
          {showEraserFlyout && activeTool === 'eraser' && (
            <EraserFlyout onClose={closeAllFlyouts} />
          )}
        </div>

        {/* 4. Shapes / Intelligent Identification Tool with Flyout */}
        <div className="dock-button-wrapper" style={{ position: 'relative' }}>
          <button
            className={`dock-tool-btn ${activeTool === 'shape' || activeTool === 'line' ? 'active' : ''}`}
            onClick={handleShapeClick}
            title="Shapes & Recognition (H)"
            aria-label="Shape Tool"
          >
            <div className="shape-dock-icon-graphic">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <polygon points="4,15 7,6 17,6 20,15" fill="#90caf9" stroke="#1565c0" strokeWidth="1.5" />
                <text x="10" y="20" fontSize="10">👆</text>
              </svg>
            </div>
          </button>
          {showShapeFlyout && (activeTool === 'shape' || activeTool === 'line') && (
            <ShapeFlyout onClose={closeAllFlyouts} />
          )}
        </div>

        {/* 5. Roam / Pan Hand */}
        <button
          className={`dock-tool-btn ${activeTool === 'pan' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('pan');
            closeAllFlyouts();
          }}
          title="Pan & Roam Canvas (hold Middle Mouse or Space)"
          aria-label="Pan Tool"
        >
          <span className="dock-tool-icon">✋</span>
        </button>

        {/* 6. Text Tool */}
        <button
          className={`dock-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          onClick={() => {
            setActiveTool('text');
            closeAllFlyouts();
          }}
          title="Add Text & Presets (T) — Click canvas to insert"
          aria-label="Text Tool"
        >
          <span className="dock-tool-icon text-serif-t">T</span>
        </button>

        {/* 7. Undo */}
        <button
          className="dock-tool-btn undo-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <span className="dock-tool-icon">↩</span>
        </button>

        {/* 8. Redo */}
        <button
          className="dock-tool-btn redo-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <span className="dock-tool-icon">↪</span>
        </button>
      </div>

      {/* ─── Right Island (Page Navigation) ────────────────────────────── */}
      <div className="dock-right-island">
        {/* Big Add Page Button (+) */}
        <button
          className="dock-add-page-btn"
          onClick={handleAddPage}
          title="Add New Blank Page"
          aria-label="Add Page"
        >
          +
        </button>

        {/* Previous Page Arrow (<) */}
        <button
          className="dock-page-arrow-btn"
          onClick={handlePrevPage}
          disabled={currentPageIndex <= 0}
          title="Previous Page"
          aria-label="Previous Page"
        >
          ‹
        </button>

        {/* Page Thumbnail Sheet Card */}
        <button
          className="dock-page-sheet-card"
          onClick={() => onTogglePagePanel?.()}
          title="Open Page Thumbnails & Slide Deck"
          aria-label={`Page ${currentPageIndex + 1} of ${totalPages}`}
        >
          <div className="page-sheet-graphic">
            <span className="page-number-display">{currentPageIndex + 1}</span>
            <div className="page-corner-fold" />
          </div>
          <span className="page-badge-red">{totalPages}</span>
        </button>

        {/* Next Page Arrow (>) */}
        <button
          className="dock-page-arrow-btn"
          onClick={handleNextPage}
          disabled={currentPageIndex >= totalPages - 1}
          title="Next Page"
          aria-label="Next Page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
