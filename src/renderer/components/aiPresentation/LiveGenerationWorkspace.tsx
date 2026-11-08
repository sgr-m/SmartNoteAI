/**
 * LiveGenerationWorkspace.tsx — Gamma-Style Progressive Slide Generation Workspace
 * Phase 6: Live Workspace with Progressive Slide-by-Slide Asynchronous Generation
 *
 * Provides a live presentation generation experience where slides appear progressively
 * in real-time as they are generated, validated, and rendered. Teachers can inspect
 * completed slides, edit titles, change layouts, reorder, delete, and regenerate individual
 * slides during and after generation, and atomically insert the presentation into the lesson.
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LiveGenerationOptions,
  LiveSlideItem,
  PresentationThemeId,
  SlideGenerationState,
  SlideLayoutType,
  SlideOutlineItem,
  TeachingDifficulty,
  TeachingStyle,
} from '../../../shared/aiPresentationTypes';
import { Page } from '../../../shared/types';
import { useAppContext } from '../../context/AppContext';
import { makeInsertPagesCommand } from '../../engine/CommandSystem';
import { livePresentationService } from '../../services/aiPresentation/livePresentationService';
import { SlideThumbnailRenderer } from './SlideThumbnailRenderer';
import './LiveGenerationWorkspace.css';

export interface LiveGenerationWorkspaceProps {
  isOpen: boolean;
  topic: string;
  subject?: string;
  gradeLevel?: string;
  language?: string;
  difficulty?: TeachingDifficulty;
  teachingStyle?: TeachingStyle;
  themeId?: PresentationThemeId;
  customMasterId?: string;
  outline: SlideOutlineItem[];
  provider?: any;
  model?: string;
  onClose: () => void;
  onBackToOutline?: () => void;
  onInserted?: (pages: Page[]) => void;
}

const LAYOUT_OPTIONS: Array<{ value: SlideLayoutType; label: string; icon: string }> = [
  { value: 'concept-explanation', label: 'Concept Explanation (Template A)', icon: '📖' },
  { value: 'mathematical-explanation', label: 'Formal Derivation & Math (Template B)', icon: '∑' },
  { value: 'comparison', label: 'Comparative Matrix (Template C)', icon: '⚖️' },
  { value: 'diagram-explanation', label: 'Structural Diagram (Template D)', icon: '🔬' },
  { value: 'problem-solution', label: 'Problem & Worked Solution (Template E)', icon: '💡' },
  { value: 'summary-takeaway', label: 'Key Takeaways & Exit Notes (Template F)', icon: '🎯' },
  { value: 'summary-quiz', label: 'Diagnostic Quiz & Check', icon: '❓' },
  { value: 'two-column-split', label: 'Two-Column Split', icon: '▥' },
  { value: 'three-card-grid', label: 'Three-Card Matrix', icon: '☷' },
];

export const LiveGenerationWorkspace: FC<LiveGenerationWorkspaceProps> = ({
  isOpen,
  topic,
  subject = 'General Science / Mathematics',
  gradeLevel = 'Grade 10',
  language = 'English',
  difficulty = 'intermediate',
  teachingStyle = 'interactive',
  themeId = 'modern-academic',
  customMasterId,
  outline,
  provider,
  model,
  onClose,
  onBackToOutline,
  onInserted,
}) => {
  const { docState, docDispatch, commandSystem, setToastMessage } = useAppContext();

  // Slide state array initialized from outline queue
  const [slides, setSlides] = useState<LiveSlideItem[]>(() =>
    outline.map((item, index) => ({
      id: item.id || `live-slide-${index + 1}`,
      slideNumber: index + 1,
      title: item.title,
      actionGoal: item.actionGoal || item.objective,
      layoutArchetype: item.layoutArchetype || 'concept-explanation',
      status: 'waiting',
      progressMessage: 'Waiting in queue...',
    }))
  );
  // Active slide shown in main canvas
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  // Whether progressive generation is actively running
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  // Abort controller for cancellation
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  // Insertion target position
  const [insertPosition, setInsertPosition] = useState<'after-current' | 'end'>('after-current');
  // Inline title editing state
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string>('');
  // Lecture notes accordion open
  const [showNotes, setShowNotes] = useState<boolean>(false);
  // Error alert
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track if teacher has manually picked a slide so we don't yank their focus during generation
  const hasUserSelectedSlideRef = useRef<boolean>(false);

  // Completed slides count
  const completedCount = useMemo(() => {
    return slides.filter((s) => s.status === 'completed').length;
  }, [slides]);

  const totalSlides = slides.length || outline.length;
  const progressPct = totalSlides > 0 ? Math.round((completedCount / totalSlides) * 100) : 0;

  // Active slide object
  const activeSlide: LiveSlideItem | undefined = slides[activeSlideIndex];

  // ─── Progressive Generation Loop ──────────────────────────────────────────────
  const runGeneration = useCallback(async () => {
    if (outline.length === 0) return;

    setIsGenerating(true);
    setErrorMessage(null);
    hasUserSelectedSlideRef.current = false;

    const controller = new AbortController();
    setAbortController(controller);

    try {
      await livePresentationService.startLiveGeneration(outline, {
        topic,
        subject,
        gradeLevel,
        language,
        difficulty,
        teachingStyle,
        themeId,
        customMasterId,
        provider,
        model,
        signal: controller.signal,
        onSlideUpdate: (_slide, allSlides) => {
          setSlides([...allSlides]);
        },
        onSlideCompleted: (completedSlide, allSlides) => {
          setSlides([...allSlides]);
          // Automatically advance main canvas to the new slide if user hasn't manually selected one
          if (!hasUserSelectedSlideRef.current) {
            const nextIdx = allSlides.findIndex((s) => s.id === completedSlide.id);
            if (nextIdx >= 0) {
              setActiveSlideIndex(nextIdx);
            }
          }
        },
      });
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setErrorMessage(err?.message || 'Generation encountered an error');
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [
    outline,
    topic,
    subject,
    gradeLevel,
    language,
    difficulty,
    teachingStyle,
    themeId,
    customMasterId,
    provider,
    model,
  ]);

  // Start generation upon mount / open
  useEffect(() => {
    if (isOpen) {
      runGeneration();
    }
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [isOpen]);

  // Cancel generation
  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setToastMessage?.('Generation stopped. Completed slides preserved.');
    }
  };

  // Select active slide manually
  const handleSelectSlide = (index: number) => {
    hasUserSelectedSlideRef.current = true;
    setActiveSlideIndex(index);
    setEditingTitleId(null);
  };

  // Regenerate an individual slide
  const handleRegenerateSlide = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    try {
      const updated = await livePresentationService.regenerateSingleSlide(slide, {
        topic,
        subject,
        gradeLevel,
        themeId,
        customMasterId,
        provider,
        model,
      });

      setSlides((prev) => prev.map((s, idx) => (idx === slideIndex ? updated : s)));
      setToastMessage?.(`Regenerated Slide ${slide.slideNumber}: "${slide.title}"`);
    } catch (err: any) {
      setErrorMessage(`Failed to regenerate slide ${slide.slideNumber}: ${err?.message}`);
    }
  };

  // Change layout for active slide
  const handleChangeLayout = async (slideIndex: number, newLayout: SlideLayoutType) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    try {
      const updated = await livePresentationService.changeSlideLayout(slide, newLayout, {
        topic,
        themeId,
        customMasterId,
      });

      setSlides((prev) => prev.map((s, idx) => (idx === slideIndex ? updated : s)));
      setToastMessage?.(`Applied layout: ${newLayout}`);
    } catch (err: any) {
      setErrorMessage(`Failed to change layout: ${err?.message}`);
    }
  };

  // Title Editing Handlers
  const handleStartEditTitle = (slide: LiveSlideItem) => {
    setEditingTitleId(slide.id);
    setTitleDraft(slide.title);
  };

  const handleSaveTitle = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide || !titleDraft.trim()) {
      setEditingTitleId(null);
      return;
    }

    try {
      const updated = await livePresentationService.updateSlideTitle(slide, titleDraft.trim(), {
        topic,
        themeId,
        customMasterId,
      });

      setSlides((prev) => prev.map((s, idx) => (idx === slideIndex ? updated : s)));
    } catch (err: any) {
      setErrorMessage(`Failed to update title: ${err?.message}`);
    } finally {
      setEditingTitleId(null);
    }
  };

  // Reorder slides
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });

    setActiveSlideIndex(targetIdx);
  };

  // Delete slide
  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
    setActiveSlideIndex((prev) => Math.max(0, Math.min(slides.length - 2, prev)));
  };

  // Add new slide
  const handleAddSlide = async () => {
    const newSlideNum = slides.length + 1;
    const newSlideItem: SlideOutlineItem = {
      id: `live-slide-${Date.now()}`,
      slideNumber: newSlideNum,
      title: `Slide ${newSlideNum}: Deep Dive & Examples`,
      actionGoal: 'Provide worked examples and student practice problems',
      layoutArchetype: 'problem-solution',
      selected: true,
    };

    const newLiveItem: LiveSlideItem = {
      id: newSlideItem.id!,
      slideNumber: newSlideNum,
      title: newSlideItem.title,
      actionGoal: newSlideItem.actionGoal,
      layoutArchetype: newSlideItem.layoutArchetype,
      status: 'generating-content',
      progressMessage: 'Generating educational content...',
    };

    setSlides((prev) => [...prev, newLiveItem]);
    setActiveSlideIndex(slides.length);
    hasUserSelectedSlideRef.current = true;

    try {
      const contentSpec = await livePresentationService.generateSlideContent(
        newSlideItem,
        { topic, subject, gradeLevel, themeId, customMasterId, provider, model },
        undefined,
        newSlideNum - 1,
        newSlideNum
      );

      const renderedPage = await livePresentationService.regenerateSingleSlide(
        {
          ...newLiveItem,
          contentSpec,
          status: 'rendering',
        },
        { topic, subject, gradeLevel, themeId, customMasterId }
      );

      setSlides((prev) =>
        prev.map((s) => (s.id === newLiveItem.id ? renderedPage : s))
      );
    } catch (err: any) {
      setSlides((prev) =>
        prev.map((s) =>
          s.id === newLiveItem.id
            ? { ...s, status: 'failed', error: err?.message || 'Failed to generate slide' }
            : s
        )
      );
    }
  };

  // Insert presentation into active Whiteboard session atomically
  const handleInsertIntoWhiteboard = () => {
    const completedPages = slides
      .filter((s) => s.status === 'completed' && s.page)
      .map((s) => s.page as Page);

    if (completedPages.length === 0) {
      setErrorMessage('No completed slides available to insert.');
      return;
    }

    const originalTotalPages = docState.lesson?.pages?.length || 1;
    const originalPageIndex = docState.currentPageIndex || 0;

    const afterIndex =
      insertPosition === 'after-current'
        ? originalPageIndex
        : originalTotalPages - 1;

    const command = makeInsertPagesCommand({
      dispatch: docDispatch,
      pages: completedPages,
      afterIndex,
      previousPageIndex: originalPageIndex,
      description: `Insert AI Presentation (${completedPages.length} slide${completedPages.length === 1 ? '' : 's'})`,
    });

    commandSystem.execute(command);
    setToastMessage?.(`Inserted ${completedPages.length} presentation slides into lesson!`);

    onInserted?.(completedPages);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="live-workspace-overlay">
      <div className="live-workspace-container" role="dialog" aria-modal="true">
        {/* Top Header Bar */}
        <header className="live-workspace-header">
          <div className="live-workspace-header-left">
            <div className="live-workspace-topic-row">
              <span className="live-workspace-spark">✨</span>
              <h2 className="live-workspace-title">{topic}</h2>
              <span className="live-workspace-badge">{subject}</span>
              <span className="live-workspace-badge grade">{gradeLevel}</span>
            </div>
            <div className="live-workspace-status-row">
              {isGenerating ? (
                <div className="live-workspace-status-pulsing">
                  <span className="live-workspace-pulse-dot" />
                  <span>
                    Generating Slide {Math.min(completedCount + 1, totalSlides)} of {totalSlides}... ({progressPct}%)
                  </span>
                </div>
              ) : (
                <div className="live-workspace-status-ready">
                  <span>✓</span>
                  <span>{completedCount} of {totalSlides} Slides Classroom-Ready</span>
                </div>
              )}
            </div>
          </div>

          <div className="live-workspace-header-actions">
            {isGenerating ? (
              <button
                type="button"
                className="live-workspace-btn secondary"
                onClick={handleCancelGeneration}
                title="Stop generation (preserves already completed slides)"
              >
                ✕ Cancel Generation
              </button>
            ) : (
              <>
                {onBackToOutline && (
                  <button
                    type="button"
                    className="live-workspace-btn secondary"
                    onClick={onBackToOutline}
                  >
                    ← Back to Outline
                  </button>
                )}

                <div className="live-workspace-insert-group">
                  <select
                    className="live-workspace-select"
                    value={insertPosition}
                    onChange={(e) => setInsertPosition(e.target.value as 'after-current' | 'end')}
                  >
                    <option value="after-current">Insert after current page</option>
                    <option value="end">Insert at end of lesson</option>
                  </select>

                  <button
                    type="button"
                    className="live-workspace-btn primary"
                    onClick={handleInsertIntoWhiteboard}
                    disabled={completedCount === 0}
                  >
                    ✓ Insert Presentation ({completedCount} Slides)
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              className="live-workspace-close-btn"
              onClick={onClose}
              title="Close generation workspace"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Top Slim Progress Bar */}
        <div className="live-workspace-progress-track">
          <div
            className={`live-workspace-progress-bar ${isGenerating ? 'active' : 'complete'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="live-workspace-error-banner">
            <span>⚠️</span>
            <span>{errorMessage}</span>
            <button
              type="button"
              className="live-workspace-error-close"
              onClick={() => setErrorMessage(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Body: Side Panel + Canvas Area */}
        <div className="live-workspace-body">
          {/* Side Panel: Slide Queue & Status */}
          <aside className="live-workspace-sidebar">
            <div className="live-workspace-sidebar-header">
              <span className="live-workspace-sidebar-title">Presentation Slides</span>
              <span className="live-workspace-sidebar-count">
                {completedCount} / {totalSlides} Ready
              </span>
            </div>

            <div className="live-workspace-slide-list">
              {slides.map((s, index) => {
                const isActive = index === activeSlideIndex;
                return (
                  <div
                    key={s.id}
                    className={`live-slide-card ${isActive ? 'active' : ''} ${s.status}`}
                    onClick={() => handleSelectSlide(index)}
                  >
                    <div className="live-slide-card-top">
                      <div className="live-slide-card-badge">Slide {s.slideNumber}</div>
                      <SlideStatusBadge status={s.status} />
                    </div>

                    <div className="live-slide-card-title">{s.title}</div>

                    {s.actionGoal && (
                      <div className="live-slide-card-goal">{s.actionGoal}</div>
                    )}

                    {/* Progress note for active generating state */}
                    {s.status !== 'completed' && s.progressMessage && (
                      <div className="live-slide-card-msg">{s.progressMessage}</div>
                    )}

                    {/* Card Actions */}
                    <div
                      className="live-slide-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="live-slide-mini-btn"
                        disabled={index === 0 || isGenerating}
                        onClick={() => handleMoveSlide(index, 'up')}
                        title="Move slide up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="live-slide-mini-btn"
                        disabled={index === slides.length - 1 || isGenerating}
                        onClick={() => handleMoveSlide(index, 'down')}
                        title="Move slide down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="live-slide-mini-btn"
                        disabled={isGenerating}
                        onClick={() => handleRegenerateSlide(index)}
                        title="Regenerate this slide"
                      >
                        🔄
                      </button>
                      <button
                        type="button"
                        className="live-slide-mini-btn delete"
                        disabled={slides.length <= 1 || isGenerating}
                        onClick={() => handleDeleteSlide(index)}
                        title="Remove slide"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="live-workspace-sidebar-footer">
              <button
                type="button"
                className="live-workspace-add-btn"
                onClick={handleAddSlide}
                disabled={isGenerating || slides.length >= 20}
              >
                + Add Slide
              </button>
            </div>
          </aside>

          {/* Main Area: Slide Canvas Preview & Controls */}
          <main className="live-workspace-main">
            {activeSlide ? (
              <div className="live-workspace-canvas-wrap">
                {/* Canvas Viewport */}
                <div className="live-workspace-viewport">
                  {activeSlide.status === 'completed' && activeSlide.page ? (
                    <div className="live-workspace-slide-render">
                      <SlideThumbnailRenderer
                        page={activeSlide.page}
                        width={1920}
                        height={1080}
                        className="live-workspace-svg"
                      />
                    </div>
                  ) : activeSlide.status === 'failed' ? (
                    <div className="live-workspace-state-card failed">
                      <div className="live-workspace-state-icon">⚠️</div>
                      <h3>Slide Generation Failed</h3>
                      <p>{activeSlide.error || 'Network interruption or provider timeout.'}</p>
                      <button
                        type="button"
                        className="live-workspace-btn primary"
                        onClick={() => handleRegenerateSlide(activeSlideIndex)}
                      >
                        🔄 Retry Slide Generation
                      </button>
                    </div>
                  ) : (
                    /* Live Generation Blueprint Card */
                    <div className="live-workspace-state-card generating">
                      <div className="live-workspace-pulse-icon">
                        {activeSlide.status === 'generating-content' && '✨'}
                        {activeSlide.status === 'selecting-layout' && '📐'}
                        {activeSlide.status === 'rendering' && '🎨'}
                        {activeSlide.status === 'waiting' && '⏳'}
                      </div>
                      <h3>{activeSlide.title}</h3>
                      <div className="live-workspace-blueprint-step">
                        {activeSlide.progressMessage || 'Processing educational content...'}
                      </div>
                      <div className="live-workspace-shimmer-box">
                        <div className="live-workspace-shimmer-line header" />
                        <div className="live-workspace-shimmer-line body" />
                        <div className="live-workspace-shimmer-line body short" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Slide Toolbar & Inspector */}
                <div className="live-workspace-toolbar">
                  <div className="live-workspace-toolbar-left">
                    <button
                      type="button"
                      className="live-workspace-btn secondary icon"
                      disabled={activeSlideIndex === 0}
                      onClick={() => handleSelectSlide(activeSlideIndex - 1)}
                      title="Previous slide"
                    >
                      ◀ Previous
                    </button>
                    <span className="live-workspace-counter">
                      Slide {activeSlideIndex + 1} of {slides.length}
                    </span>
                    <button
                      type="button"
                      className="live-workspace-btn secondary icon"
                      disabled={activeSlideIndex === slides.length - 1}
                      onClick={() => handleSelectSlide(activeSlideIndex + 1)}
                      title="Next slide"
                    >
                      Next ▶
                    </button>
                  </div>

                  {/* Title editor */}
                  <div className="live-workspace-toolbar-center">
                    {editingTitleId === activeSlide.id ? (
                      <div className="live-workspace-title-edit-form">
                        <input
                          type="text"
                          className="live-workspace-title-input"
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(activeSlideIndex);
                            if (e.key === 'Escape') setEditingTitleId(null);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="live-workspace-mini-save"
                          onClick={() => handleSaveTitle(activeSlideIndex)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        className="live-workspace-title-display"
                        onClick={() => handleStartEditTitle(activeSlide)}
                        title="Click to rename slide"
                      >
                        <span>{activeSlide.title}</span>
                        <span className="live-workspace-edit-pen">✏️</span>
                      </div>
                    )}
                  </div>

                  {/* Layout selector & actions */}
                  <div className="live-workspace-toolbar-right">
                    <select
                      className="live-workspace-select layout"
                      value={activeSlide.layoutArchetype || 'concept-explanation'}
                      onChange={(e) =>
                        handleChangeLayout(activeSlideIndex, e.target.value as SlideLayoutType)
                      }
                      disabled={isGenerating || activeSlide.status !== 'completed'}
                      title="Change template layout archetype"
                    >
                      {LAYOUT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="live-workspace-btn secondary"
                      disabled={isGenerating}
                      onClick={() => handleRegenerateSlide(activeSlideIndex)}
                      title="Regenerate this slide with fresh content"
                    >
                      🔄 Regenerate
                    </button>

                    {activeSlide.contentSpec?.notes && (
                      <button
                        type="button"
                        className={`live-workspace-btn secondary ${showNotes ? 'active' : ''}`}
                        onClick={() => setShowNotes(!showNotes)}
                        title="Toggle lecture script / teaching notes"
                      >
                        📝 Notes
                      </button>
                    )}
                  </div>
                </div>

                {/* Lecture Notes Drawer if toggled */}
                {showNotes && activeSlide.contentSpec?.notes && (
                  <div className="live-workspace-notes-drawer">
                    <div className="live-workspace-notes-header">
                      <span>Teacher Lecture Script &amp; Discussion Prompts</span>
                      <button
                        type="button"
                        className="live-workspace-notes-close"
                        onClick={() => setShowNotes(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="live-workspace-notes-body">
                      {activeSlide.contentSpec.notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="live-workspace-empty">No slides available in workspace.</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// ─── Status Badge Component ───────────────────────────────────────────────────

const SlideStatusBadge: FC<{ status: SlideGenerationState }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <span className="slide-badge-status completed">✓ Ready</span>;
    case 'generating-content':
      return <span className="slide-badge-status generating">✨ Writing...</span>;
    case 'selecting-layout':
      return <span className="slide-badge-status selecting">📐 Layout...</span>;
    case 'rendering':
      return <span className="slide-badge-status rendering">🎨 Rendering...</span>;
    case 'failed':
      return <span className="slide-badge-status failed">⚠️ Failed</span>;
    case 'waiting':
    default:
      return <span className="slide-badge-status waiting">⏳ Waiting</span>;
  }
};
