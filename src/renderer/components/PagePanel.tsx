/**
 * PagePanel — slide deck drawer showing live page thumbnails, rename, transitions, templates, and reordering
 * Section 10: Lessons, Slides, and Transitions
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, StrokeObject, ShapeObject, TextObject, ImageObject, TransitionType } from '../../shared/types';
import './PagePanel.css';

export function renderPageThumbnailSvg(page: Page): React.ReactElement {
  const w = page.width || 1920;
  const h = page.height || 1080;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: '100%', display: 'block', borderRadius: 4 }}
      aria-hidden="true"
    >
      <rect width={w} height={h} fill={page.background?.color || '#1a1a2e'} />
      {page.objects.map((obj) => {
        if (obj.type === 'stroke') {
          const s = obj as StrokeObject;
          if (s.points.length < 2) return null;
          const d = `M ${s.points[0].x} ${s.points[0].y} ` + s.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
          return (
            <path
              key={s.id}
              d={d}
              stroke={s.style.color}
              strokeWidth={Math.max(4, s.style.width * 1.5)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={s.style.opacity}
            />
          );
        }
        if (obj.type === 'shape') {
          const sh = obj as ShapeObject;
          if (sh.shapeType === 'rect' || sh.shapeType === 'roundedRect') {
            return (
              <rect
                key={sh.id}
                x={sh.x}
                y={sh.y}
                width={sh.width}
                height={sh.height}
                rx={sh.shapeType === 'roundedRect' ? 16 : 0}
                fill={sh.fillColor}
                fillOpacity={sh.fillOpacity}
                stroke={sh.strokeColor}
                strokeWidth={Math.max(2, sh.strokeWidth)}
                opacity={sh.strokeOpacity}
              />
            );
          }
          if (sh.shapeType === 'ellipse') {
            return (
              <ellipse
                key={sh.id}
                cx={sh.x + sh.width / 2}
                cy={sh.y + sh.height / 2}
                rx={Math.abs(sh.width / 2)}
                ry={Math.abs(sh.height / 2)}
                fill={sh.fillColor}
                fillOpacity={sh.fillOpacity}
                stroke={sh.strokeColor}
                strokeWidth={Math.max(2, sh.strokeWidth)}
                opacity={sh.strokeOpacity}
              />
            );
          }
          if (sh.shapeType === 'line' || sh.shapeType === 'arrow') {
            return (
              <line
                key={sh.id}
                x1={sh.x}
                y1={sh.y}
                x2={sh.x + sh.width}
                y2={sh.y + sh.height}
                stroke={sh.strokeColor}
                strokeWidth={Math.max(3, sh.strokeWidth)}
                strokeLinecap="round"
              />
            );
          }
          return (
            <rect
              key={sh.id}
              x={sh.x}
              y={sh.y}
              width={sh.width}
              height={sh.height}
              rx={8}
              fill={sh.fillColor && sh.fillColor !== 'transparent' ? sh.fillColor : 'rgba(56, 189, 248, 0.2)'}
              stroke={sh.strokeColor || '#38bdf8'}
              strokeWidth={Math.max(2, sh.strokeWidth)}
            />
          );
        }
        if (obj.type === 'text') {
          const t = obj as TextObject;
          const fontSize = t.fontSize || 22;
          const isCenter = t.textAlign === 'center';
          const isRight = t.textAlign === 'right';
          const startX = isCenter ? t.x + (t.width || 200) / 2 : isRight ? t.x + (t.width || 200) : t.x;
          const anchor = isCenter ? 'middle' : isRight ? 'end' : 'start';
          const rawLines = (t.content || '').split('\n');
          const lines = rawLines.slice(0, 6);
          const lineHeight = fontSize * 1.35;
          return (
            <text
              key={t.id}
              x={startX}
              y={t.y + fontSize * 0.9}
              fill={t.color || '#ffffff'}
              fontSize={fontSize}
              fontFamily={t.fontFamily || 'Inter, sans-serif'}
              fontWeight={t.fontWeight || 400}
              textAnchor={anchor}
            >
              {lines.map((l, i) => (
                <tspan key={i} x={startX} dy={i === 0 ? 0 : lineHeight}>
                  {l.length > 65 ? `${l.slice(0, 62)}…` : l}
                </tspan>
              ))}
            </text>
          );
        }
        if (obj.type === 'image') {
          const img = obj as ImageObject;
          if (img.dataUrl) {
            return (
              <image
                key={img.id}
                href={img.dataUrl}
                x={img.x}
                y={img.y}
                width={img.width}
                height={img.height}
                opacity={img.opacity ?? 1}
              />
            );
          }
        }
        return null;
      })}
    </svg>
  );
}

const TRANSITIONS: { id: TransitionType; name: string; icon: string }[] = [
  { id: 'none', name: 'None', icon: '⏹️' },
  { id: 'fade', name: 'Fade', icon: '🌫️' },
  { id: 'slide-left', name: 'Slide Left', icon: '⬅️' },
  { id: 'slide-right', name: 'Slide Right', icon: '➡️' },
  { id: 'slide-up', name: 'Slide Up', icon: '⬆️' },
  { id: 'slide-down', name: 'Slide Down', icon: '⬇️' },
  { id: 'wipe', name: 'Wipe', icon: '🧹' },
];

interface PagePanelProps {
  onClose?: () => void;
  onOpenTemplates?: () => void;
  onOpenMetadata?: () => void;
  onOpenGridView?: () => void;
}

export function PagePanel({ onClose, onOpenTemplates, onOpenMetadata, onOpenGridView }: PagePanelProps): React.ReactElement {
  const { docState, docDispatch, duplicateCurrentPage, setToastMessage } = useAppContext();
  const { lesson, currentPageIndex } = docState;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [openTransitionMenuIndex, setOpenTransitionMenuIndex] = useState<number | null>(null);

  // Multi-select and bulk deletion (Requirement 2)
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Drag and drop slide reordering (Requirement 5)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addPage = () => docDispatch({ type: 'ADD_PAGE', after: currentPageIndex });

  const duplicatePage = (index: number) => {
    docDispatch({ type: 'DUPLICATE_PAGE', pageIndex: index });
    setToastMessage?.(`Slide ${index + 1} duplicated`);
  };

  const deletePage = (index: number) => {
    if (lesson.pages.length <= 1) return;
    const page = lesson.pages[index];
    if (page.objects.length > 0) {
      if (!window.confirm(`Delete "${page.title}" (${page.objects.length} objects)?`)) {
        return;
      }
    }
    docDispatch({ type: 'DELETE_PAGE', index });
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedIndices(new Set());
    } else {
      setIsSelectMode(true);
      setSelectedIndices(new Set([currentPageIndex]));
    }
  };

  const toggleSelectSlide = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === lesson.pages.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(lesson.pages.map((_, i) => i)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    const count = selectedIndices.size;
    if (window.confirm(`Delete ${count} selected ${count === 1 ? 'slide' : 'slides'}?`)) {
      docDispatch({ type: 'DELETE_PAGES', indices: Array.from(selectedIndices) });
      setSelectedIndices(new Set());
      setIsSelectMode(false);
      setToastMessage?.(`Deleted ${count} ${count === 1 ? 'slide' : 'slides'}`);
    }
  };

  const movePageUp = (index: number) => {
    if (index > 0) {
      docDispatch({ type: 'MOVE_PAGE', from: index, to: index - 1 });
    }
  };

  const movePageDown = (index: number) => {
    if (index < lesson.pages.length - 1) {
      docDispatch({ type: 'MOVE_PAGE', from: index, to: index + 1 });
    }
  };

  const startRename = (index: number, currentTitle: string) => {
    setEditingIndex(index);
    setEditTitle(currentTitle);
  };

  const submitRename = (index: number) => {
    if (editTitle.trim().length > 0) {
      docDispatch({
        type: 'RENAME_PAGE',
        pageIndex: index,
        title: editTitle.trim(),
      });
    }
    setEditingIndex(null);
  };

  const setPageTransition = (index: number, transitionType: TransitionType) => {
    docDispatch({
      type: 'SET_PAGE_TRANSITION',
      pageIndex: index,
      transition: {
        type: transitionType,
        duration: 400,
      },
    });
    setOpenTransitionMenuIndex(null);
    setToastMessage?.(`Transition set to ${transitionType}`);
  };

  return (
    <div className="page-panel" role="navigation" aria-label="Slides & Lesson Pages">
      {/* ─── Header ─── */}
      <div className="page-panel-header">
        <div className="panel-title-group" onClick={onOpenMetadata} style={{ cursor: 'pointer' }} title="Click to view/edit Lesson details">
          <span className="panel-title">Pages ({lesson.pages.length})</span>
          <span className="panel-lesson-name">{lesson.meta.title}</span>
        </div>

        <div className="panel-header-actions">
          {onOpenGridView && (
            <button
              className="panel-tool-btn"
              onClick={onOpenGridView}
              title="Open Large Slide Grid View (Double-click slide button on dock)"
              aria-label="Grid view"
            >
              ⊞
            </button>
          )}
          <button
            className={`panel-tool-btn ${isSelectMode ? 'active-select-mode' : ''}`}
            onClick={toggleSelectMode}
            title={isSelectMode ? 'Exit Selection Mode' : 'Select Multiple Slides (Bulk Delete)'}
            aria-label="Bulk select slides"
          >
            ☑️
          </button>
          <button
            className="panel-tool-btn"
            onClick={onOpenTemplates}
            title="Add Page from Template (Cornell, Ruled, Grid, Lab, Storyboard)"
            aria-label="Add from template"
          >
            📚
          </button>
          <button
            className="panel-tool-btn"
            onClick={duplicateCurrentPage}
            title="Duplicate Current Page"
            aria-label="Duplicate current page"
          >
            📋
          </button>
          <button
            className="panel-tool-btn add-btn-highlight"
            onClick={addPage}
            title="Add Blank Page"
            aria-label="Add page"
            id="add-page-btn"
          >
            +
          </button>
          {onClose && (
            <button
              className="panel-tool-btn"
              onClick={onClose}
              title="Close Page Panel"
              aria-label="Close page panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Bulk Action Banner (Requirement 2) ─── */}
      {isSelectMode && (
        <div className="page-panel-bulk-bar">
          <button className="bulk-bar-btn" onClick={handleSelectAll}>
            {selectedIndices.size === lesson.pages.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="bulk-bar-count">{selectedIndices.size} selected</span>
          <button
            className="bulk-bar-delete-btn"
            onClick={handleDeleteSelected}
            disabled={selectedIndices.size === 0}
            title="Delete selected slides"
          >
            🗑️ Delete ({selectedIndices.size})
          </button>
          <button className="bulk-bar-done-btn" onClick={toggleSelectMode} title="Cancel selection mode">
            Done
          </button>
        </div>
      )}

      {/* ─── Page Thumbnail List ─── */}
      <div className="page-panel-list">
        {lesson.pages.map((page, index) => {
          const isCurrent = index === currentPageIndex;
          const isSelected = selectedIndices.has(index);
          const currentTransition = page.transition?.type || 'none';
          const transitionInfo = TRANSITIONS.find((t) => t.id === currentTransition) || TRANSITIONS[0];

          return (
            <div
              key={page.id}
              className={`page-thumb-card ${isCurrent ? 'active' : ''} ${isSelectMode && isSelected ? 'selected' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              onClick={() => {
                if (isSelectMode) {
                  toggleSelectSlide(index);
                } else {
                  docDispatch({ type: 'GOTO_PAGE', index });
                }
              }}
              draggable={!isSelectMode && editingIndex === null}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(index));
                e.dataTransfer.effectAllowed = 'move';
                setDraggedIndex(index);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverIndex !== index) {
                  setDragOverIndex(index);
                }
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverIndex === index) {
                  setDragOverIndex(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromStr = e.dataTransfer.getData('text/plain');
                const fromIndex = fromStr !== '' ? parseInt(fromStr, 10) : draggedIndex;
                if (fromIndex !== null && !isNaN(fromIndex) && fromIndex !== index) {
                  docDispatch({ type: 'MOVE_PAGE', from: fromIndex, to: index });
                  setToastMessage?.(`Moved slide ${fromIndex + 1} to position ${index + 1}`);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Page ${index + 1}: ${page.title}`}
              aria-current={isCurrent}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (isSelectMode) {
                    toggleSelectSlide(index);
                  } else {
                    docDispatch({ type: 'GOTO_PAGE', index });
                  }
                }
              }}
            >
              {/* Card Header: Checkbox (Select Mode), Page Number, Title & Actions */}
              <div className="page-card-top">
                {isSelectMode && (
                  <input
                    type="checkbox"
                    className="page-card-checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectSlide(index);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title="Select slide"
                  />
                )}
                <span className="page-index-badge">{index + 1}</span>

                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => submitRename(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename(index);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="page-inline-rename-input"
                  />
                ) : (
                  <span
                    className="page-card-title"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(index, page.title);
                    }}
                    title="Double-click to rename"
                  >
                    {page.title}
                  </span>
                )}

                {/* Duplicate Slide button (Requirement 1) */}
                <button
                  className="page-mini-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePage(index);
                  }}
                  title="Duplicate slide"
                  aria-label={`Duplicate slide ${index + 1}`}
                >
                  📋
                </button>

                <button
                  className="page-mini-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(index, page.title);
                  }}
                  title="Rename slide"
                >
                  ✏️
                </button>
              </div>

              {/* Visual Thumbnail */}
              <div className={`page-thumbnail-viewport ${isCurrent ? 'active' : ''}`}>
                {renderPageThumbnailSvg(page)}
              </div>

              {/* Card Footer: Transitions & Actions */}
              <div className="page-card-bottom" onClick={(e) => e.stopPropagation()}>
                {/* Transition Selector Pill */}
                <div className="transition-selector-wrapper">
                  <button
                    className="transition-pill-btn"
                    onClick={() =>
                      setOpenTransitionMenuIndex(openTransitionMenuIndex === index ? null : index)
                    }
                    title={`Slide Transition: ${transitionInfo.name}`}
                  >
                    <span>{transitionInfo.icon}</span>
                    <span className="trans-name">{transitionInfo.name}</span>
                  </button>

                  {openTransitionMenuIndex === index && (
                    <div className="transition-popup-dropdown">
                      <div className="trans-dropdown-header">Page Transition</div>
                      {TRANSITIONS.map((t) => (
                        <button
                          key={t.id}
                          className={`trans-option-row ${currentTransition === t.id ? 'active' : ''}`}
                          onClick={() => setPageTransition(index, t.id)}
                        >
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions: Reorder, Duplicate & Delete */}
                <div className="page-card-actions">
                  <button
                    className="page-arrow-btn"
                    disabled={index === 0}
                    onClick={() => movePageUp(index)}
                    title="Move slide up"
                  >
                    ▲
                  </button>
                  <button
                    className="page-arrow-btn"
                    disabled={index === lesson.pages.length - 1}
                    onClick={() => movePageDown(index)}
                    title="Move slide down"
                  >
                    ▼
                  </button>
                  <button
                    className="page-arrow-btn page-duplicate-btn"
                    onClick={() => duplicatePage(index)}
                    title="Duplicate slide"
                    aria-label={`Duplicate slide ${index + 1}`}
                  >
                    📋
                  </button>
                  {lesson.pages.length > 1 && (
                    <button
                      className="page-card-delete-btn"
                      onClick={() => deletePage(index)}
                      title="Delete slide"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Bottom Navigation ─── */}
      <div className="page-panel-nav">
        <button
          className="panel-nav-btn"
          onClick={() => docDispatch({ type: 'GOTO_PAGE', index: currentPageIndex - 1 })}
          disabled={currentPageIndex <= 0}
          title="Previous page"
          id="prev-page-btn"
          aria-label="Previous page"
        >
          ‹ Prev
        </button>
        <span className="panel-nav-counter">
          {currentPageIndex + 1} / {lesson.pages.length}
        </span>
        <button
          className="panel-nav-btn"
          onClick={() => docDispatch({ type: 'GOTO_PAGE', index: currentPageIndex + 1 })}
          disabled={currentPageIndex >= lesson.pages.length - 1}
          title="Next page"
          id="next-page-btn"
          aria-label="Next page"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
