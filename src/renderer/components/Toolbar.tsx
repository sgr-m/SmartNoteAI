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
import { isTypingOrInputFocused } from '../utils/keyboardUtils';
import type { PresentationTool } from './PresentationFloatingToolbar';
import { PenType } from '../../shared/types';
import { ShapeStyle } from '../engine/DrawingEngine';
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
  onActivatePresentationTool?: (tool: PresentationTool) => void;
  activePresentationTool?: PresentationTool | null;
  onToggleTimer?: () => void;
  onScreenshot?: () => void;
  onDesktop?: () => void;
  onReturnToBoard?: () => void;
  isPresentationMode?: boolean;
}

const PEN_NAMES: Record<string, string> = {
  normal: 'Pen / Hard Pen',
  pencil: 'Pen / Hard Pen',
  fine: 'Fine Pen',
  calligraphy: 'Calligraphy Brush',
  highlighter: 'Highlighter',
  marker: 'Highlighter',
  brush: 'Art Brush / Watercolor Brush',
  flatBrush: 'Art Brush / Watercolor Brush',
  laser: 'Laser Pen',
  magic: 'Magic Pen / Smart Pen',
  pattern: 'Texture Pen / Pattern Pen',
};

const SHAPE_NAMES: Record<string, string> = {
  recognition: 'Intelligent Identification',
  circle: 'Circle',
  ellipse: 'Ellipse',
  rect: 'Rectangle',
  roundedRect: 'Rounded Rectangle',
  triangle: 'Triangle',
  rightTriangle: 'Right Triangle',
  parallelogram: 'Parallelogram',
  trapezoid: 'Trapezoid',
  line: 'Straight Line',
  arrow: 'Arrow',
  polyline: 'Polyline',
  arc: 'Curved Line',
  polygon: 'Polygon',
};

function renderPenDockIcon(penType: PenType, color: string) {
  switch (penType) {
    case 'magic':
      return (
        <div className="pen-dock-icon-graphic magic-dock-graphic" data-pen-type="magic">
          <div className="dock-magic-star">★</div>
          <div className="dock-magic-wand" />
        </div>
      );
    case 'brush':
    case 'flatBrush':
      return (
        <div className="pen-dock-icon-graphic flatbrush-dock-graphic" data-pen-type="brush">
          <div className="dock-flatbrush-tip" style={{ backgroundColor: color }} />
          <div className="dock-flatbrush-ferrule" />
          <div className="dock-flatbrush-handle" />
        </div>
      );
    case 'calligraphy':
      return (
        <div className="pen-dock-icon-graphic calligraphy-dock-graphic" data-pen-type="calligraphy">
          <div className="dock-calligraphy-tip" style={{ backgroundColor: color }} />
          <div className="dock-calligraphy-ferrule" />
          <div className="dock-calligraphy-handle" />
        </div>
      );
    case 'highlighter':
    case 'marker':
      return (
        <div className="pen-dock-icon-graphic highlighter-dock-graphic" data-pen-type="highlighter">
          <div className="dock-highlighter-tip" style={{ backgroundColor: color }} />
          <div className="dock-highlighter-body" />
        </div>
      );
    case 'laser':
      return (
        <div className="pen-dock-icon-graphic laser-dock-graphic" data-pen-type="laser">
          <div
            className="dock-laser-beam"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          />
          <div className="dock-laser-barrel" />
        </div>
      );
    case 'pattern':
      return (
        <div className="pen-dock-icon-graphic pattern-dock-graphic" data-pen-type="pattern">
          <div className="dock-pattern-tip" style={{ backgroundColor: color }} />
          <div className="dock-pattern-body" />
        </div>
      );
    case 'normal':
    case 'pencil':
    case 'fine':
    default:
      return (
        <div className="pen-dock-icon-graphic pencil-dock-graphic" data-pen-type="normal">
          <div className="dock-pencil-tip" style={{ borderBottomColor: color }} />
          <div className="dock-pencil-body" />
        </div>
      );
  }
}

function renderShapeDockIcon(shapeStyle?: ShapeStyle) {
  const shapeType = shapeStyle?.shapeType || 'recognition';
  const strokeStyle = shapeStyle?.strokeStyle || 'solid';

  switch (shapeType) {
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="circle">
          <circle cx="12" cy="12" r="8" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'ellipse':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="ellipse">
          <ellipse cx="12" cy="12" rx="9" ry="6" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'rect':
    case 'roundedRect':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="rect">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="triangle">
          <polygon points="12,4 20,20 4,20" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'rightTriangle':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="rightTriangle">
          <polygon points="4,4 4,20 20,20" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'parallelogram':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="parallelogram">
          <polygon points="7,5 20,5 17,19 4,19" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'trapezoid':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="trapezoid">
          <polygon points="7,6 17,6 20,18 4,18" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'arrow':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="arrow">
          <line x1="5" y1="19" x2="19" y2="5" stroke="#1565c0" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="13,5 19,5 19,11" fill="#1565c0" />
        </svg>
      );
    case 'line':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="line">
          <line
            x1="4"
            y1="20"
            x2="20"
            y2="4"
            stroke="#1565c0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={strokeStyle === 'dashed' ? '4,3' : undefined}
          />
        </svg>
      );
    case 'polyline':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="polyline">
          <polyline
            points="4,18 9,6 15,18 20,6"
            fill="none"
            stroke="#1565c0"
            strokeWidth="2"
            strokeDasharray={strokeStyle === 'dotted' ? '2,2' : undefined}
          />
        </svg>
      );
    case 'arc':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="arc">
          <path d="M4 18 Q12 4 20 18" fill="none" stroke="#1565c0" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'polygon':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="polygon">
          <polygon points="12,3 20,9 17,19 7,19 4,9" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      );
    case 'recognition':
    default:
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" data-shape-type="recognition">
          <polygon points="4,15 7,6 17,6 20,15" fill="#90caf9" stroke="#1565c0" strokeWidth="1.5" />
          <text x="10" y="20" fontSize="10">👆</text>
        </svg>
      );
  }
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
  onActivatePresentationTool,
  activePresentationTool,
  onToggleTimer,
  onScreenshot,
  onDesktop,
  onReturnToBoard,
  isPresentationMode,
}: ToolbarProps): React.ReactElement {
  const {
    toolState,
    shapeStyle,
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

  const [isDockSwapped, setIsDockSwapped] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smartboard_dock_swapped') === 'true';
    } catch {
      return false;
    }
  });
  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);

  const handleToggleDockSwap = useCallback(() => {
    setIsDockSwapped((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('smartboard_dock_swapped', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleToggleMenuExpand = useCallback(() => {
    setIsMenuExpanded((prev) => !prev);
  }, []);

  const showPenFlyout = activeToolbarFlyout === 'pen';
  const showShapeFlyout = activeToolbarFlyout === 'shape';
  const showEraserFlyout = activeToolbarFlyout === 'eraser';
  const showMenuFlyout = activeToolbarFlyout === 'menu';

  const activeTool = toolState.activeTool;
  const currentPageIndex = docState.currentPageIndex;
  const totalPages = docState.lesson.pages.length;

  const penLabel = PEN_NAMES[toolState.penStyle.penType] || 'Pen';
  const shapeLabel = SHAPE_NAMES[shapeStyle?.shapeType] || 'Shapes & Recognition';

  const closeAllFlyouts = useCallback(() => {
    closeAllPopups();
  }, [closeAllPopups]);

  const handlePenClick = useCallback(() => {
    if (activeTool === 'pen') {
      setActiveToolbarFlyout(activeToolbarFlyout === 'pen' ? 'none' : 'pen');
    } else {
      setActiveTool('pen');
      setActiveToolbarFlyout('none');
    }
  }, [activeTool, setActiveTool, activeToolbarFlyout, setActiveToolbarFlyout]);

  const handleEraserClick = useCallback(() => {
    if (activeTool === 'eraser') {
      setActiveToolbarFlyout(activeToolbarFlyout === 'eraser' ? 'none' : 'eraser');
    } else {
      setActiveTool('eraser');
      setActiveToolbarFlyout('none');
    }
  }, [activeTool, setActiveTool, activeToolbarFlyout, setActiveToolbarFlyout]);

  const handleShapeClick = useCallback(() => {
    const isShapeActive = activeTool === 'shape' || activeTool === 'line';
    if (isShapeActive) {
      setActiveToolbarFlyout(activeToolbarFlyout === 'shape' ? 'none' : 'shape');
    } else {
      setActiveTool('shape');
      setActiveToolbarFlyout('none');
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
      if (isTypingOrInputFocused(e)) {
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('pen');
      } else if (e.key === 'e' || e.key === 'E') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('eraser');
      } else if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('pan');
      } else if (e.key === 't' || e.key === 'T') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('text');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          handlePrevPage();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          handleNextPage();
        }
      } else if (e.key === 'Escape') {
        closeAllFlyouts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, closeAllFlyouts, handlePrevPage, handleNextPage]);

  // ─── Menu Island (Left / Right Swappable) ──────────────────────────────────
  const renderMenuIsland = (isRightSide: boolean) => {
    const cornerArrow = isRightSide ? '›' : '‹';
    const expandIcon = isMenuExpanded ? '«' : '»';
    const expandTitle = isMenuExpanded ? 'Collapse additional tools' : 'Expand additional tools (>>)';

    const cornerSwapBtn = (
      <button
        key="menu-corner-swap"
        className="corner-swap-btn"
        onClick={handleToggleDockSwap}
        title="Switch toolbar position (Left / Right Handed Teacher Mode)"
        aria-label="Switch Bar Position"
      >
        {cornerArrow}
      </button>
    );

    const menuButton = (
      <div key="menu-btn-wrapper" className="dock-button-wrapper" style={{ position: 'relative' }}>
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
            alignRight={isRightSide}
            onClose={closeAllFlyouts}
            onOpenSettings={onOpenSettings}
            onOpenRecentLessons={onOpenRecentLessons}
            onOpenSubjectTools={onOpenSubjectTools}
            onTogglePresentationMode={onTogglePresentationMode}
            onOpenAIAssistant={onOpenAIAssistant}
            onOpenRecordingStudio={onOpenRecordingStudio}
            onOpenBackground={onOpenBackgroundModal}
            onOpenLayers={onOpenLayersModal}
            onOpenDocumentImport={onOpenDocumentImport}
            onOpenExport={onOpenExport}
            onActivatePresentationTool={onActivatePresentationTool}
            onToggleTimer={onToggleTimer}
            onScreenshot={onScreenshot}
            onDesktop={onDesktop}
          />
        )}
      </div>
    );

    const coreTools = [
      /* Desktop Mode: Minimize whiteboard to interact with desktop */
      <button
        key="desktop-mode-btn"
        className="dock-icon-btn"
        onClick={() => onDesktop?.()}
        title="Desktop Mode: Minimize whiteboard to interact with desktop (D)"
        aria-label="Show Desktop"
      >
        <div className="monitor-icon-graphic">🖥️</div>
      </button>,

      /* Full Screen Presentation Mode */
      <button
        key="presentation-mode-btn"
        className={`dock-icon-btn ${isPresentationMode ? 'active' : ''}`}
        onClick={() => onTogglePresentationMode?.()}
        title="Presentation Mode: Full screen teaching view (F11)"
        aria-label="Presentation Mode"
      >
        <div className="monitor-icon-graphic">⛶</div>
      </button>,

      /* Presentation Tools: Spotlight */
      <button
        key="spotlight-btn"
        className={`dock-icon-btn ${activePresentationTool === 'spotlight' ? 'active' : ''}`}
        onClick={() => onActivatePresentationTool?.('spotlight')}
        title="Spotlight: Focus audience attention on a specific area"
        aria-label="Spotlight"
      >
        <div className="monitor-icon-graphic">🔦</div>
      </button>,

      /* Desktop Annotation Pen & Overlay */
      <button
        key="annotation-btn"
        className={`dock-icon-btn ${activePresentationTool === 'annotation' ? 'active' : ''}`}
        onClick={() => onActivatePresentationTool?.('annotation')}
        title="Desktop Annotation: Draw directly over any open application"
        aria-label="Desktop Annotation"
      >
        <div className="monitor-icon-graphic">✏️</div>
      </button>,
    ];

    const expandToggleBtn = (
      <button
        key="expand-toggle-btn"
        className="expand-toggle-btn"
        onClick={handleToggleMenuExpand}
        title={expandTitle}
        aria-label={isMenuExpanded ? 'Collapse Tools' : 'Expand Tools'}
      >
        {expandIcon}
      </button>
    );

    const extraTools = (
      <div key="extra-tools-group" className="dock-expanded-tools">
        {/* Timer & Stopwatch */}
        <button
          className="dock-icon-btn"
          onClick={() => onToggleTimer?.()}
          title="Classroom Timer & Stopwatch"
          aria-label="Timer"
        >
          <div className="monitor-icon-graphic">⏱️</div>
        </button>

        {/* Screenshot capture */}
        <button
          className="dock-icon-btn"
          onClick={() => onScreenshot?.()}
          title="Screen Capture: Snip region and insert onto board"
          aria-label="Screenshot"
        >
          <div className="monitor-icon-graphic">📸</div>
        </button>

        {/* Page Style & Background */}
        <button
          className="dock-icon-btn"
          onClick={() => onOpenBackgroundModal?.()}
          title="Page Style: Background color, grids, lines & dimensions"
          aria-label="Background & Dimensions"
        >
          <div className="bg-icon-graphic">🎨</div>
        </button>

        {/* Layers Manager */}
        <button
          className="dock-icon-btn"
          onClick={() => onOpenLayersModal?.()}
          title="Page Layers: Reorder, lock, and manage canvas elements"
          aria-label="Layers Manager"
        >
          <div className="layers-icon-graphic">📑</div>
        </button>

        {/* Subject Teaching Platform */}
        <button
          className="dock-icon-btn"
          onClick={() => onOpenSubjectTools?.()}
          title="Subject Teaching Platform: Math, Physics, Chemistry, Computer Science, Digital Logic & Flowcharts"
          aria-label="Subject Teaching Platform"
        >
          <div className="tools-icon-graphic">🎓</div>
        </button>

        {/* Resource Library */}
        <button
          className="dock-icon-btn"
          onClick={() => onOpenResourceLibrary?.()}
          title="Resource Library: Visual assets & templates"
          aria-label="Resource Library"
        >
          <div className="files-icon-graphic">📂</div>
        </button>

        {/* Classroom Activities */}
        <button
          className="dock-icon-btn"
          onClick={() => onOpenActivities?.()}
          title="Classroom Activities: Student Picker, Timer, Dice"
          aria-label="Classroom Activities"
        >
          <div className="magnifier-icon-graphic">🔍</div>
        </button>
      </div>
    );

    return (
      <div className={`dock-left-island ${isRightSide ? 'dock-swapped-right' : ''}`}>
        {!isRightSide && cornerSwapBtn}
        {isRightSide && isMenuExpanded && extraTools}
        {isRightSide && expandToggleBtn}
        {isRightSide ? coreTools : menuButton}
        {isRightSide ? menuButton : coreTools}
        {!isRightSide && expandToggleBtn}
        {!isRightSide && isMenuExpanded && extraTools}
        {isRightSide && cornerSwapBtn}
      </div>
    );
  };

  // ─── Center Island (Floating White Glossy Teaching Dock) ───────────────────
  const renderCenterTeachingDock = () => (
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
          title={`${penLabel} (P) — Click to select, click again for menu`}
          aria-label="Pen Tool"
        >
          {renderPenDockIcon(toolState.penStyle.penType, toolState.penStyle.color)}
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
          title="Eraser (E) — Click to select, click again for menu"
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
          title={`${shapeLabel} — Click to select, click again for shapes`}
          aria-label="Shape Tool"
        >
          <div className="shape-dock-icon-graphic">
            {renderShapeDockIcon(shapeStyle)}
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
        title="Hand Tool (H) — Pan & Roam Canvas (or hold Space / Middle Mouse)"
        aria-label="Hand Tool"
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
  );

  // ─── Right Island (Page Navigation & Slides) ──────────────────────────────
  const renderNavigationIsland = (isLeftSide: boolean) => {
    const cornerArrow = isLeftSide ? '‹' : '›';

    const cornerSwapBtn = (
      <button
        key="nav-corner-swap"
        className="corner-swap-btn"
        onClick={handleToggleDockSwap}
        title="Switch toolbar position (Left / Right Handed Teacher Mode)"
        aria-label="Switch Bar Position"
      >
        {cornerArrow}
      </button>
    );

    const navControls = (
      <React.Fragment key="nav-controls">
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
          onClick={(e) => {
            e.stopPropagation();
            handlePrevPage();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={currentPageIndex <= 0}
          title="Previous Page (Left Arrow / PageUp)"
          aria-label="Previous Page"
        >
          ‹
        </button>

        {/* Page Thumbnail Sheet Card */}
        <button
          className="dock-page-sheet-card"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePagePanel?.();
          }}
          onPointerDown={(e) => e.stopPropagation()}
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
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={currentPageIndex >= totalPages - 1}
          title="Next Page (Right Arrow / PageDown)"
          aria-label="Next Page"
        >
          ›
        </button>
      </React.Fragment>
    );

    return (
      <div className={`dock-right-island ${isLeftSide ? 'dock-swapped-left' : ''}`}>
        {isLeftSide && cornerSwapBtn}
        {navControls}
        {!isLeftSide && cornerSwapBtn}
      </div>
    );
  };

  return (
    <div className="bottom-smartboard-dock-container" role="toolbar" aria-label="Smartboard Tools">
      {isDockSwapped ? renderNavigationIsland(true) : renderMenuIsland(false)}
      {renderCenterTeachingDock()}
      {isDockSwapped ? renderMenuIsland(true) : renderNavigationIsland(false)}
    </div>
  );
}
