/**
 * SlideAIToolbar.tsx — Contextual AI Slide Editing & Content Refinement Toolbar
 * Allows teachers to improve existing slide content, selected text, or pedagogical structure
 * with full preview diff and atomic undo/redo via CommandSystem.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TextObject, CanvasObject } from '../../../shared/types';
import {
  SlideAIActionId,
  SlideAIActionCategory,
  SlideAIScope,
  SLIDE_AI_ACTIONS,
  slideEditService,
  SlideAIEditResult,
} from '../../services/aiPresentation/slideEditService';
import './SlideAIToolbar.css';

export interface SlideAIToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: SlideAIScope;
  initialAction?: SlideAIActionId;
  targetGradeLevel?: string;
  onApplied?: (result: SlideAIEditResult) => void;
}

export function SlideAIToolbar({
  isOpen,
  onClose,
  initialScope,
  initialAction,
  targetGradeLevel,
  onApplied,
}: SlideAIToolbarProps): React.ReactElement | null {
  const { docState, docDispatch, commandSystem, selectedObject, setSelectedObject, setToastMessage } =
    useAppContext();

  const currentPageIndex = docState.currentPageIndex;
  const currentPage = docState.lesson.pages[currentPageIndex];

  // Resolve scope based on current selection
  const resolvedScope: SlideAIScope = useMemo(() => {
    if (initialScope) return initialScope;
    if (selectedObject?.type === 'text') return 'text';
    if (selectedObject?.type === 'shape' || selectedObject?.type === 'group') return 'card';
    return 'slide';
  }, [initialScope, selectedObject]);

  // Initial category based on scope
  const initialCategory: SlideAIActionCategory = useMemo(() => {
    if (resolvedScope === 'text') return 'text';
    if (resolvedScope === 'card') return 'teaching';
    return 'slide';
  }, [resolvedScope]);

  const [activeCategory, setActiveCategory] = useState<SlideAIActionCategory>(initialCategory);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingAction, setProcessingAction] = useState<SlideAIActionId | null>(null);
  const [editResult, setEditResult] = useState<SlideAIEditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Synchronize category when selectedObject changes
  useEffect(() => {
    setActiveCategory(initialCategory);
    setEditResult(null);
    setErrorMessage(null);
  }, [initialCategory, selectedObject?.id]);

  // Resolve active content from selection or current slide
  const targetContent = useMemo(() => {
    if (selectedObject?.type === 'text') {
      return (selectedObject as TextObject).content || '';
    }

    if (!currentPage) return '';

    // Collect text from objects on the current slide
    const slideTexts = (currentPage.objects || [])
      .filter((o) => o.type === 'text')
      .map((o) => (o as TextObject).content)
      .filter((c) => c && c.trim().length > 0);

    if (slideTexts.length > 0) {
      return slideTexts.join('\n\n');
    }

    return currentPage.title || 'Slide Content';
  }, [selectedObject, currentPage]);

  // Filter actions for active category
  const filteredActions = useMemo(() => {
    return SLIDE_AI_ACTIONS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  // Execute an AI editing action
  const handleExecuteAction = useCallback(
    async (actionId: SlideAIActionId) => {
      if (!currentPage) return;

      const actionConfig = SLIDE_AI_ACTIONS.find((a) => a.id === actionId);
      if (!actionConfig) return;

      setIsProcessing(true);
      setProcessingAction(actionId);
      setErrorMessage(null);

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const result = await slideEditService.executeEdit({
          action: actionId,
          scope: actionConfig.scope,
          content: targetContent,
          page: currentPage,
          pageIndex: currentPageIndex,
          selectedObject,
          targetGradeLevel,
          topic: docState.lesson.meta?.title,
          signal: controller.signal,
        });

        if (result.success) {
          setEditResult(result);
        } else if (result.cancelled) {
          setErrorMessage('Operation was cancelled.');
        } else {
          setErrorMessage(result.error || 'Failed to generate improvement.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'An unexpected error occurred while editing.');
      } finally {
        setIsProcessing(false);
        setAbortController(null);
      }
    },
    [currentPage, targetContent, currentPageIndex, selectedObject, targetGradeLevel, docState.lesson.meta?.title]
  );

  // Auto-run if initialAction is supplied
  useEffect(() => {
    if (isOpen && initialAction && !editResult && !isProcessing) {
      handleExecuteAction(initialAction);
    }
  }, [isOpen, initialAction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel in-progress operation
  const handleCancelOperation = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
    setIsProcessing(false);
    setProcessingAction(null);
  }, [abortController]);

  // Apply accepted changes to document
  const handleAcceptChanges = useCallback(() => {
    if (!editResult || !currentPage) return;

    slideEditService.applyEdit({
      commandSystem,
      dispatch: docDispatch,
      setSelectedObject,
      result: editResult,
      pageIndex: currentPageIndex,
      page: currentPage,
      selectedObject,
    });

    setToastMessage?.(`Applied: ${editResult.summary}`);
    onApplied?.(editResult);
    onClose();
  }, [
    editResult,
    currentPage,
    commandSystem,
    docDispatch,
    setSelectedObject,
    currentPageIndex,
    selectedObject,
    setToastMessage,
    onApplied,
    onClose,
  ]);

  // Reject proposed changes
  const handleRejectChanges = useCallback(() => {
    setEditResult(null);
  }, []);

  // Keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isProcessing) {
          handleCancelOperation();
        } else if (editResult) {
          handleRejectChanges();
        } else {
          onClose();
        }
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editResult) {
        e.preventDefault();
        handleAcceptChanges();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, editResult, handleCancelOperation, handleRejectChanges, handleAcceptChanges, onClose]);

  if (!isOpen || !currentPage) {
    return null;
  }

  const activeActionConfig = SLIDE_AI_ACTIONS.find((a) => a.id === processingAction);

  return (
    <div
      className="slide-ai-toolbar-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="AI Slide Content Refinement Toolbar"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="slide-ai-toolbar-card">
        {/* Header Bar */}
        <header className="satb-header">
          <div className="satb-header-title-group">
            <span className="satb-sparkle-icon">✨</span>
            <h3 className="satb-header-title">AI Slide Assistant</h3>
            <span className="satb-scope-pill">{resolvedScope} Scope</span>
          </div>

          <button
            type="button"
            className="satb-close-btn"
            onClick={onClose}
            aria-label="Close Assistant"
            title="Close Assistant (Esc)"
          >
            ✕
          </button>
        </header>

        {/* Category Tabs (only when not in diff review) */}
        {!editResult && !isProcessing && (
          <nav className="satb-tabs" aria-label="Improvement Categories">
            <button
              type="button"
              className={`satb-tab-btn ${activeCategory === 'text' ? 'active' : ''}`}
              onClick={() => setActiveCategory('text')}
            >
              <span>📝</span>
              <span>Text Improvements</span>
            </button>
            <button
              type="button"
              className={`satb-tab-btn ${activeCategory === 'teaching' ? 'active' : ''}`}
              onClick={() => setActiveCategory('teaching')}
            >
              <span>💡</span>
              <span>Teaching Improvements</span>
            </button>
            <button
              type="button"
              className={`satb-tab-btn ${activeCategory === 'slide' ? 'active' : ''}`}
              onClick={() => setActiveCategory('slide')}
            >
              <span>🖼️</span>
              <span>Slide Improvements</span>
            </button>
          </nav>
        )}

        {/* Selected Context Bar */}
        <div className="satb-context-bar">
          <span className="satb-context-label">
            Targeting: {selectedObject?.type === 'text' ? 'Selected Text Element' : `Slide: "${currentPage.title}"`}
          </span>
          <div className="satb-context-snippet" title={targetContent}>
            {targetContent || '(Empty content)'}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(239, 68, 68, 0.2)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Content Body */}
        <div className="satb-content-body">
          {/* State 1: In Progress / Loading */}
          {isProcessing && (
            <div className="satb-loading-box">
              <div className="satb-spinner" />
              <div className="satb-loading-text">
                {activeActionConfig?.label ? `${activeActionConfig.label}...` : 'Applying pedagogical AI refinement...'}
              </div>
              <button
                type="button"
                className="satb-btn-cancel-op"
                onClick={handleCancelOperation}
              >
                Cancel Operation
              </button>
            </div>
          )}

          {/* State 2: Diff / Proposed Changes Review */}
          {!isProcessing && editResult && (
            <div className="satb-diff-panel">
              <div className="satb-summary-banner">
                <span>✓</span>
                <span>{editResult.summary}</span>
              </div>

              <div className="satb-diff-columns">
                {/* Original Content Card */}
                <div className="satb-diff-card">
                  <div className="satb-diff-card-header original">Before (Original)</div>
                  <div className="satb-diff-card-body">
                    {editResult.originalContent || '(Empty)'}
                  </div>
                </div>

                {/* Proposed Content Card */}
                <div className="satb-diff-card">
                  <div className="satb-diff-card-header proposed">After (Proposed AI Improvement)</div>
                  <div className="satb-diff-card-body proposed-body">
                    {editResult.proposedContent}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* State 3: Action Grid Selector */}
          {!isProcessing && !editResult && (
            <div className="satb-action-grid">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="satb-action-card"
                  onClick={() => handleExecuteAction(action.id)}
                >
                  <div className="satb-card-top">
                    <span className="satb-card-icon">{action.icon}</span>
                    <span className="satb-card-title">{action.label}</span>
                  </div>
                  <span className="satb-card-desc">{action.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <footer className="satb-footer">
          {/* Left Buttons */}
          <div className="satb-footer-left">
            {editResult ? (
              <button
                type="button"
                className="satb-btn-ghost"
                onClick={() => setEditResult(null)}
              >
                ← Choose Another Action
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Select an action to enhance your teaching slide with AI
              </span>
            )}
          </div>

          {/* Right Buttons */}
          <div className="satb-footer-right">
            {editResult ? (
              <>
                <button
                  type="button"
                  className="satb-btn-ghost"
                  onClick={() => handleExecuteAction(editResult.action)}
                >
                  🔄 Try Again
                </button>
                <button
                  type="button"
                  className="satb-btn-ghost"
                  onClick={handleRejectChanges}
                >
                  ✕ Discard
                </button>
                <button
                  type="button"
                  className="satb-btn-apply"
                  onClick={handleAcceptChanges}
                >
                  <span>✓</span>
                  <span>Accept &amp; Apply</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="satb-btn-ghost"
                onClick={onClose}
              >
                Cancel
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

