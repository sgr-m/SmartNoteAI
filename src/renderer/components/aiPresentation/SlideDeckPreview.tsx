/**
 * SlideDeckPreview.tsx — Interactive Presentation Slide Deck Preview & Atomic Insertion
 * Allows teachers to preview generated presentations, inspect individual slides,
 * select/exclude specific slides, and insert them into the active lesson atomically
 * with full undo/redo capability via CommandSystem and INSERT_PAGES.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  Page,
  CanvasObject,
  ShapeObject,
  TextObject,
  ImageObject,
  StrokeObject,
  GroupObject,
} from '../../../shared/types';
import {
  PresentationGenerationResult,
  SlideContentSpec,
  EducationalActivity,
} from '../../../shared/aiPresentationTypes';
import { makeInsertPagesCommand } from '../../engine/CommandSystem';
import { renderPageThumbnailSvg } from '../PagePanel';
import { SlideThumbnailRenderer } from './SlideThumbnailRenderer';
import { InteractiveActivityModal } from './InteractiveActivityModal';
import { generateCurriculumActivity } from '../../services/aiPresentation/interactiveActivityBridge';
import './SlideDeckPreview.css';

export interface SlideDeckPreviewProps {
  isOpen: boolean;
  presentationResult?: PresentationGenerationResult | null;
  pages?: Page[];
  onClose: () => void;
  onInserted?: (insertedPages: Page[]) => void;
  onBackToGenerator?: () => void;
  defaultInsertPosition?: 'after-current' | 'end';
}

/**
 * High-fidelity vector preview of a 1920x1080 slide page.
 * Uses exact coordinate and layer order matching the native drawing engine.
 */
export function SlideCanvasPreview({
  page,
  width = 1920,
  height = 1080,
  className = '',
}: {
  page: Page;
  width?: number;
  height?: number;
  className?: string;
}): React.ReactElement {
  return (
    <SlideThumbnailRenderer
      page={page}
      width={width}
      height={height}
      className={`sdp-slide-svg ${className}`}
    />
  );
}

export function SlideDeckPreview({
  isOpen,
  presentationResult,
  pages: directPages,
  onClose,
  onInserted,
  onBackToGenerator,
  defaultInsertPosition = 'after-current',
}: SlideDeckPreviewProps): React.ReactElement | null {
  const { docState, docDispatch, commandSystem, setToastMessage } = useAppContext();

  // Resolve slides to preview
  const resolvedPages: Page[] = useMemo(() => {
    if (presentationResult?.pages && presentationResult.pages.length > 0) {
      return presentationResult.pages;
    }
    if (directPages && directPages.length > 0) {
      return directPages;
    }
    return [];
  }, [presentationResult, directPages]);

  // Track active slide in main viewport (0 to resolvedPages.length - 1)
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Set of included slide indices for insertion (defaults to all included)
  const [includedIndices, setIncludedIndices] = useState<Set<number>>(() => {
    return new Set(resolvedPages.map((_, i) => i));
  });

  // Insertion target position
  const [insertPosition, setInsertPosition] = useState<'after-current' | 'end'>(
    defaultInsertPosition
  );

  const [validationError, setValidationError] = useState<string | null>(null);
  const [interactiveActivityToPlay, setInteractiveActivityToPlay] = useState<EducationalActivity | null>(null);

  // Keep included indices synchronized when resolved pages change
  useEffect(() => {
    setActiveSlideIndex(0);
    setIncludedIndices(new Set(resolvedPages.map((_, i) => i)));
    setValidationError(null);
  }, [resolvedPages]);

  // Current active slide object
  const activeSlide: Page | undefined = resolvedPages[activeSlideIndex];

  // Current active slide spec metadata (if available from result)
  const activeSlideSpec: SlideContentSpec | undefined = useMemo(() => {
    return presentationResult?.deckSpec?.slides?.[activeSlideIndex];
  }, [presentationResult, activeSlideIndex]);

  // Is current active slide marked for inclusion?
  const isActiveIncluded = includedIndices.has(activeSlideIndex);

  // Toggle inclusion of an individual slide
  const toggleSlideInclusion = useCallback((index: number) => {
    setIncludedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setValidationError(null);
  }, []);

  // Quick select actions
  const selectAll = useCallback(() => {
    setIncludedIndices(new Set(resolvedPages.map((_, i) => i)));
    setValidationError(null);
  }, [resolvedPages]);

  const deselectAll = useCallback(() => {
    setIncludedIndices(new Set());
  }, []);

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    setActiveSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setActiveSlideIndex((prev) => Math.min(resolvedPages.length - 1, prev + 1));
  }, [resolvedPages.length]);

  // Keyboard navigation listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside an input or select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggleSlideInclusion(activeSlideIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSlideIndex, goToPrevious, goToNext, toggleSlideInclusion, onClose]);

  // Slide element breakdown calculation
  const elementSummary = useMemo(() => {
    if (!activeSlide) return { shapes: 0, text: 0, images: 0, strokes: 0, total: 0 };
    let shapes = 0;
    let text = 0;
    let images = 0;
    let strokes = 0;

    for (const obj of activeSlide.objects || []) {
      if (obj.type === 'shape') shapes++;
      else if (obj.type === 'text') text++;
      else if (obj.type === 'image') images++;
      else if (obj.type === 'stroke') strokes++;
    }

    return {
      shapes,
      text,
      images,
      strokes,
      total: activeSlide.objects?.length || 0,
    };
  }, [activeSlide]);

  // Execute atomic presentation insertion
  const handleInsert = useCallback(
    (insertAll = false) => {
      // Determine pages to insert
      const pagesToInsert: Page[] = insertAll
        ? resolvedPages
        : resolvedPages.filter((_, i) => includedIndices.has(i));

      if (pagesToInsert.length === 0) {
        setValidationError('Please select at least one slide to insert into your lesson.');
        return;
      }

      // Deep clone pages to avoid mutating external references
      const clonedPages: Page[] = JSON.parse(JSON.stringify(pagesToInsert));

      // Sanitize page IDs and ensure standard dimensions
      for (const p of clonedPages) {
        if (!p.id) p.id = `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        if (!p.width) p.width = 1920;
        if (!p.height) p.height = 1080;
      }

      // Calculate target insertion index
      const originalTotalPages = docState.lesson.pages.length;
      const originalPageIndex = docState.currentPageIndex;

      let afterIndex: number;
      if (insertPosition === 'after-current') {
        afterIndex = originalPageIndex;
      } else {
        afterIndex = originalTotalPages - 1;
      }

      // Create and execute atomic insertion command
      const command = makeInsertPagesCommand({
        dispatch: docDispatch,
        pages: clonedPages,
        afterIndex,
        previousPageIndex: originalPageIndex,
        description: `Insert AI Presentation (${clonedPages.length} slide${clonedPages.length === 1 ? '' : 's'})`,
      });

      commandSystem.execute(command);

      // User confirmation feedback
      setToastMessage?.(
        `Inserted ${clonedPages.length} presentation slide${clonedPages.length === 1 ? '' : 's'} into lesson`
      );

      // Trigger callback
      onInserted?.(clonedPages);

      // Close modal
      onClose();
    },
    [
      resolvedPages,
      includedIndices,
      insertPosition,
      docState.lesson.pages.length,
      docState.currentPageIndex,
      docDispatch,
      commandSystem,
      setToastMessage,
      onInserted,
      onClose,
    ]
  );

  if (!isOpen || resolvedPages.length === 0) {
    return null;
  }

  const deckTitle =
    presentationResult?.deckSpec?.topic ||
    activeSlide?.title ||
    'AI Generated Presentation';

  const themeDisplay =
    presentationResult?.themeUsed?.name ||
    presentationResult?.deckSpec?.themeId?.replace(/-/g, ' ');

  const isTemplateFallback = presentationResult?.deckSpec?.isTemplateFallback;
  const selectedCount = includedIndices.size;
  const totalCount = resolvedPages.length;

  return (
    <div
      className="slide-deck-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Presentation Preview and Insertion"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="slide-deck-preview-modal">
        {/* Header Bar */}
        <header className="sdp-header">
          <div className="sdp-header-left">
            {onBackToGenerator && (
              <button
                type="button"
                className="sdp-back-btn"
                onClick={onBackToGenerator}
                title="Return to Presentation Generator options"
              >
                ← Edit Options
              </button>
            )}

            <div className="sdp-title-group">
              <h2 className="sdp-title">{deckTitle}</h2>
              <div className="sdp-badges-row">
                {presentationResult?.deckSpec?.topic && (
                  <span className="sdp-pill pill-primary">
                    📚 {presentationResult.deckSpec.topic}
                  </span>
                )}
                {themeDisplay && (
                  <span className="sdp-pill pill-accent">
                    🎨 {themeDisplay}
                  </span>
                )}
                {isTemplateFallback && (
                  <span className="sdp-pill pill-fallback" title="Generated using curriculum outline templates">
                    📋 Curriculum Template
                  </span>
                )}
                <span className="sdp-pill">
                  {totalCount} Slides
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="sdp-close-btn"
            onClick={onClose}
            aria-label="Close Preview"
            title="Close Preview (Esc)"
          >
            ✕
          </button>
        </header>

        {/* Validation Warning Banner */}
        {validationError && (
          <div
            style={{
              padding: '8px 24px',
              background: 'rgba(239, 68, 68, 0.2)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Body (Viewport + Inspector) */}
        <div className="sdp-body">
          {/* Main Viewport Stage */}
          <main className="sdp-stage">
            {/* Viewport Top Floating Controls */}
            <div className="sdp-viewport-controls">
              <div className="sdp-slide-counter">
                <span>Slide</span>
                <span className="sdp-slide-counter-badge">
                  {activeSlideIndex + 1} / {totalCount}
                </span>
                <span>• {activeSlide?.title || `Slide ${activeSlideIndex + 1}`}</span>
              </div>

              <button
                type="button"
                className={`sdp-inclusion-toggle-btn ${
                  isActiveIncluded ? 'included' : 'excluded'
                }`}
                onClick={() => toggleSlideInclusion(activeSlideIndex)}
                title="Toggle slide inclusion (Space)"
              >
                {isActiveIncluded ? '✓ Included in Lesson' : '✕ Excluded from Lesson'}
              </button>
            </div>

            {/* Navigation Arrows */}
            <button
              type="button"
              className="sdp-nav-btn sdp-nav-prev"
              onClick={goToPrevious}
              disabled={activeSlideIndex === 0}
              aria-label="Previous Slide (Arrow Left)"
              title="Previous Slide (Arrow Left)"
            >
              ‹
            </button>

            <button
              type="button"
              className="sdp-nav-btn sdp-nav-next"
              onClick={goToNext}
              disabled={activeSlideIndex === totalCount - 1}
              aria-label="Next Slide (Arrow Right)"
              title="Next Slide (Arrow Right)"
            >
              ›
            </button>

            {/* 16:9 Slide Canvas Preview Container */}
            <div
              className={`sdp-slide-viewport-wrapper ${
                !isActiveIncluded ? 'is-excluded' : ''
              }`}
            >
              {activeSlide && <SlideCanvasPreview page={activeSlide} />}

              {/* Watermark when slide is excluded from insertion */}
              {!isActiveIncluded && (
                <div className="sdp-excluded-watermark">
                  <div className="sdp-excluded-pill">
                    ✕ Slide Excluded from Insertion
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Inspector Sidebar */}
          <aside className="sdp-inspector" aria-label="Slide Details">
            <div>
              <div className="sdp-section-heading">Slide Inspector</div>
              <div className="sdp-inspector-card">
                <div className="sdp-slide-title-preview">
                  {activeSlide?.title || `Slide ${activeSlideIndex + 1}`}
                </div>
                {activeSlideSpec?.subtitle && (
                  <div className="sdp-slide-subtitle-preview">
                    {activeSlideSpec.subtitle}
                  </div>
                )}

                <div className="sdp-metadata-grid">
                  <div className="sdp-meta-item">
                    <span className="sdp-meta-label">Layout:</span>
                    <span className="sdp-meta-val">
                      {activeSlideSpec?.layout?.replace(/-/g, ' ') || 'Standard'}
                    </span>
                  </div>
                  <div className="sdp-meta-item">
                    <span className="sdp-meta-label">Elements:</span>
                    <span className="sdp-meta-val">
                      {elementSummary.total} Native Objects
                    </span>
                  </div>
                  <div className="sdp-meta-item">
                    <span className="sdp-meta-label">Shapes / Cards:</span>
                    <span className="sdp-meta-val">{elementSummary.shapes}</span>
                  </div>
                  <div className="sdp-meta-item">
                    <span className="sdp-meta-label">Text Elements:</span>
                    <span className="sdp-meta-val">{elementSummary.text}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pedagogical Speaker Notes */}
            {activeSlideSpec?.notes && (
              <div>
                <div className="sdp-section-heading">Teacher's Script & Notes</div>
                <div className="sdp-speaker-notes-content">
                  {activeSlideSpec.notes}
                </div>
              </div>
            )}

            {/* Interactive Activity / Check for Understanding */}
            {activeSlideSpec?.cards?.some((c) => c.cardType === 'question-answer' || c.revealPrompt) && (
              <div>
                <div className="sdp-section-heading">Interactive Activity</div>
                <div className="sdp-activity-content">
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Check for Understanding
                  </div>
                  <div>
                    {activeSlideSpec.cards.find((c) => c.cardType === 'question-answer' || c.revealPrompt)?.revealPrompt ||
                      activeSlideSpec.cards.find((c) => c.cardType === 'question-answer')?.title ||
                      'Interactive classroom check-for-understanding quiz question.'}
                  </div>
                  <button
                    type="button"
                    className="sdp-btn-secondary"
                    style={{ marginTop: 10, width: '100%', fontSize: 13, padding: '7px 12px' }}
                    onClick={() => {
                      const foundCard = activeSlideSpec.cards?.find(
                        (c) => c.activity || c.cardType === 'question-answer' || c.cardType === 'interactive-activity'
                      );
                      const act =
                        activeSlideSpec.activity ||
                        foundCard?.activity ||
                        generateCurriculumActivity(
                          foundCard?.question || activeSlideSpec.title || 'Check for Understanding',
                          presentationResult?.deckSpec?.subject || 'General Education',
                          'mcq'
                        );
                      setInteractiveActivityToPlay(act);
                    }}
                  >
                    ▶ Launch Interactive Activity
                  </button>
                </div>
              </div>
            )}

            {/* Slide Inclusion Switch */}
            <div style={{ marginTop: 'auto' }}>
              <button
                type="button"
                className={`sdp-inclusion-toggle-btn ${
                  isActiveIncluded ? 'included' : 'excluded'
                }`}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => toggleSlideInclusion(activeSlideIndex)}
              >
                {isActiveIncluded
                  ? '✓ Slide Selected for Insertion'
                  : '✕ Slide Skipped / Excluded'}
              </button>
            </div>
          </aside>
        </div>

        {/* Filmstrip Carousel Bar */}
        <nav className="sdp-filmstrip-bar" aria-label="Slide Thumbnails">
          {resolvedPages.map((page, idx) => {
            const isCurrent = idx === activeSlideIndex;
            const isIncluded = includedIndices.has(idx);

            return (
              <div
                key={page.id || `thumb-${idx}`}
                className={`sdp-thumb-card ${isCurrent ? 'active' : ''} ${
                  !isIncluded ? 'excluded' : ''
                }`}
                onClick={() => setActiveSlideIndex(idx)}
                role="button"
                tabIndex={0}
                aria-label={`Slide ${idx + 1}: ${page.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveSlideIndex(idx);
                  }
                }}
              >
                {/* Thumbnail Preview SVG */}
                <div className="sdp-thumb-preview">
                  <SlideThumbnailRenderer page={page} />
                </div>

                {/* Thumbnail Top Badges */}
                <div className="sdp-thumb-header">
                  <span className="sdp-thumb-num">#{idx + 1}</span>
                  <input
                    type="checkbox"
                    className="sdp-thumb-checkbox"
                    checked={isIncluded}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSlideInclusion(idx);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Include slide ${idx + 1}`}
                    title="Include slide in lesson"
                  />
                </div>

                {/* Truncated Title */}
                <div className="sdp-thumb-title">{page.title}</div>
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <footer className="sdp-footer">
          {/* Left: Selection Statistics & Bulk Select */}
          <div className="sdp-footer-left">
            <span className="sdp-selection-count">
              Selected: <strong>{selectedCount}</strong> of {totalCount} slides
            </span>
            <div className="sdp-quick-select-actions">
              <button
                type="button"
                className="sdp-btn-secondary"
                onClick={selectAll}
                title="Include all slides in insertion"
              >
                Select All
              </button>
              <button
                type="button"
                className="sdp-btn-secondary"
                onClick={deselectAll}
                title="Deselect all slides"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Center: Insertion Target Selector */}
          <div className="sdp-footer-center">
            <label htmlFor="sdp-insert-position" className="sdp-position-label">
              Insert Location:
            </label>
            <select
              id="sdp-insert-position"
              className="sdp-position-select"
              value={insertPosition}
              onChange={(e) =>
                setInsertPosition(e.target.value as 'after-current' | 'end')
              }
            >
              <option value="after-current">
                After Current Slide (Slide {docState.currentPageIndex + 1})
              </option>
              <option value="end">
                Append to End of Lesson (Slide {docState.lesson.pages.length + 1})
              </option>
            </select>
          </div>

          {/* Right: Action Buttons */}
          <div className="sdp-footer-right">
            <button
              type="button"
              className="sdp-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            {selectedCount < totalCount && (
              <button
                type="button"
                className="sdp-btn-secondary"
                style={{ padding: '9px 16px' }}
                onClick={() => handleInsert(true)}
              >
                Insert All ({totalCount})
              </button>
            )}

            <button
              type="button"
              className="sdp-btn-insert"
              onClick={() => handleInsert(false)}
              disabled={selectedCount === 0}
            >
              <span>📥</span>
              <span>Insert Selected ({selectedCount})</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Interactive Activity Presenter Modal */}
      {interactiveActivityToPlay && (
        <InteractiveActivityModal
          isOpen={Boolean(interactiveActivityToPlay)}
          activity={interactiveActivityToPlay}
          onClose={() => setInteractiveActivityToPlay(null)}
          theme={presentationResult?.themeUsed || undefined}
        />
      )}
    </div>
  );
}
