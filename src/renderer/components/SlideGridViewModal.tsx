/**
 * SlideGridViewModal — Full-screen or large modal scrollable grid of all lesson slides
 * Section 10: Slide Deck Overview & Organization
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, TransitionType } from '../../shared/types';
import { renderPageThumbnailSvg } from './PagePanel';
import './SlideGridViewModal.css';

interface SlideGridViewModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function SlideGridViewModal({ isOpen, onClose }: SlideGridViewModalProps): React.ReactElement | null {
  const { docState, docDispatch, setToastMessage } = useAppContext();
  const { lesson, currentPageIndex } = docState;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [openTransitionMenuIndex, setOpenTransitionMenuIndex] = useState<number | null>(null);

  // Multi-select and bulk deletion (Requirement 2)
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Drag and drop reordering (Requirement 5)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activeCardRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active slide when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        activeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addPage = () => {
    docDispatch({ type: 'ADD_PAGE', after: lesson.pages.length - 1 });
    setToastMessage?.(`Added new slide ${lesson.pages.length + 1}`);
  };

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
    <div className="slide-grid-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Slide Grid View">
      <div className="slide-grid-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* ─── Modal Header ─── */}
        <div className="slide-grid-header">
          <div className="slide-grid-title-area">
            <span className="slide-grid-icon">⊞</span>
            <h2>Slide Grid View</h2>
            <span className="slide-grid-count-badge">{lesson.pages.length} Slides</span>
            <span className="slide-grid-lesson-title">— {lesson.meta.title}</span>
          </div>

          <div className="slide-grid-header-actions">
            {isSelectMode ? (
              <div className="slide-grid-bulk-controls">
                <button className="grid-action-pill-btn" onClick={handleSelectAll}>
                  {selectedIndices.size === lesson.pages.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="grid-selected-count">{selectedIndices.size} selected</span>
                <button
                  className="grid-action-pill-btn grid-delete-bulk-btn"
                  onClick={handleDeleteSelected}
                  disabled={selectedIndices.size === 0}
                  title="Delete selected slides"
                >
                  🗑️ Delete Selected ({selectedIndices.size})
                </button>
                <button className="grid-action-pill-btn" onClick={toggleSelectMode}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  className="grid-action-pill-btn"
                  onClick={toggleSelectMode}
                  title="Select multiple slides for bulk deletion"
                >
                  ☑️ Bulk Select
                </button>
                <button
                  className="grid-action-pill-btn grid-add-slide-btn"
                  onClick={addPage}
                  title="Add blank slide"
                >
                  + Add Slide
                </button>
              </>
            )}

            <button
              className="grid-close-btn"
              onClick={onClose}
              title="Close Grid View (Esc)"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── Scrollable Grid Body ─── */}
        <div className="slide-grid-body">
          <div className="slide-grid-items">
            {lesson.pages.map((page, index) => {
              const isCurrent = index === currentPageIndex;
              const isSelected = selectedIndices.has(index);
              const currentTransition = page.transition?.type || 'none';
              const transitionInfo = TRANSITIONS.find((t) => t.id === currentTransition) || TRANSITIONS[0];

              return (
                <div
                  key={page.id}
                  ref={isCurrent ? activeCardRef : undefined}
                  className={`grid-slide-card ${isCurrent ? 'active-current-slide' : ''} ${isSelectMode && isSelected ? 'selected-for-bulk' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectSlide(index);
                    } else {
                      docDispatch({ type: 'GOTO_PAGE', index });
                      onClose();
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
                  aria-label={`Slide ${index + 1}: ${page.title}`}
                  aria-current={isCurrent}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (isSelectMode) {
                        toggleSelectSlide(index);
                      } else {
                        docDispatch({ type: 'GOTO_PAGE', index });
                        onClose();
                      }
                    }
                  }}
                >
                  {/* Card Top: Checkbox, Index badge, Title, Quick Actions */}
                  <div className="grid-card-top">
                    <div className="grid-card-top-left">
                      {isSelectMode && (
                        <input
                          type="checkbox"
                          className="grid-card-checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectSlide(index);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          title="Select slide"
                        />
                      )}
                      <span className={`grid-index-badge ${isCurrent ? 'active' : ''}`}>
                        {index + 1}
                      </span>
                    </div>

                    <div className="grid-card-title-box">
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
                          className="grid-card-rename-input"
                        />
                      ) : (
                        <span
                          className="grid-card-title-text"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startRename(index, page.title);
                          }}
                          title="Double-click to rename"
                        >
                          {page.title}
                        </span>
                      )}
                    </div>

                    <div className="grid-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="grid-icon-btn"
                        onClick={() => duplicatePage(index)}
                        title="Duplicate slide"
                        aria-label={`Duplicate slide ${index + 1}`}
                      >
                        📋
                      </button>
                      <button
                        className="grid-icon-btn"
                        onClick={() => startRename(index, page.title)}
                        title="Rename slide"
                      >
                        ✏️
                      </button>
                      {lesson.pages.length > 1 && (
                        <button
                          className="grid-icon-btn grid-delete-btn"
                          onClick={() => deletePage(index)}
                          title="Delete slide"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Large High-Fidelity Thumbnail */}
                  <div className="grid-thumbnail-viewport">
                    {renderPageThumbnailSvg(page)}
                    {isCurrent && (
                      <div className="grid-current-indicator-tag">
                        CURRENT SLIDE
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Transition & Reorder Grip */}
                  <div className="grid-card-bottom" onClick={(e) => e.stopPropagation()}>
                    <div className="grid-transition-wrapper">
                      <button
                        className="grid-transition-btn"
                        onClick={() =>
                          setOpenTransitionMenuIndex(openTransitionMenuIndex === index ? null : index)
                        }
                        title={`Slide Transition: ${transitionInfo.name}`}
                      >
                        <span>{transitionInfo.icon}</span>
                        <span>{transitionInfo.name}</span>
                      </button>

                      {openTransitionMenuIndex === index && (
                        <div className="grid-transition-dropdown">
                          {TRANSITIONS.map((t) => (
                            <button
                              key={t.id}
                              className={`grid-trans-item ${currentTransition === t.id ? 'active' : ''}`}
                              onClick={() => setPageTransition(index, t.id)}
                            >
                              <span>{t.icon}</span>
                              <span>{t.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid-drag-handle" title="Drag to reorder slide">
                      ⋮⋮
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="slide-grid-footer">
          <span className="grid-hint">
            💡 Click any slide to jump to it • Drag thumbnails to reorder • Double-click slide title to rename
          </span>
          <button className="grid-action-pill-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

