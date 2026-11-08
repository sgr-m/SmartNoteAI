/**
 * InteractiveActivityModal.tsx — Classroom Interactive Activity Presentation Player
 * Milestone 5: Stage 12 (TASK-112)
 *
 * Full-screen / modal interactive player for educational activities.
 * Allows teachers and students to interact with questions live in the classroom,
 * toggle teacher reveals, view step-by-step solutions, flip flashcards, and vote on polls.
 * Supports 1-click atomic insertion of the active activity as a native whiteboard slide.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  EducationalActivity,
  ActivityInteractionState,
  PresentationTheme,
  DEFAULT_SLIDE_WIDTH,
  DEFAULT_SLIDE_HEIGHT,
} from '../../../shared/aiPresentationTypes';
import {
  ACTIVITY_TYPES_CATALOG,
  createInitialActivityState,
  selectOption,
  setMatchingAnswer,
  reorderItem,
  setBlankInput,
  submitAnswer,
  revealAnswer,
  revealNextStep,
  flipFlashcard,
  revealHint,
  retryActivity,
  castPollVote,
  createActivitySlidePage,
} from '../../services/aiPresentation/interactiveActivityBridge';
import { DEFAULT_PRESENTATION_THEME } from '../../services/aiPresentation/presentationThemes';
import { useAppContext } from '../../context/AppContext';
import { makeInsertPagesCommand } from '../../engine/CommandSystem';
import './InteractiveActivityModal.css';

export interface InteractiveActivityModalProps {
  isOpen: boolean;
  activity: EducationalActivity | null;
  onClose: () => void;
  theme?: PresentationTheme;
  onInsertSlide?: (activity: EducationalActivity) => void;
}

export function InteractiveActivityModal({
  isOpen,
  activity,
  onClose,
  theme = DEFAULT_PRESENTATION_THEME,
  onInsertSlide,
}: InteractiveActivityModalProps): React.ReactElement | null {
  // Graceful fallback for AppContext if rendered outside full provider
  let docDispatch: any;
  let commandSystem: any;
  let setToastMessage: any;
  let docState: any;

  try {
    const app = useAppContext();
    docDispatch = app.docDispatch;
    commandSystem = app.commandSystem;
    setToastMessage = app.setToastMessage;
    docState = app.docState;
  } catch {
    // Test environment or standalone render
  }

  const [state, setState] = useState<ActivityInteractionState | null>(() => {
    return activity ? createInitialActivityState(activity) : null;
  });

  // Keep state synchronized if activity changes
  useEffect(() => {
    if (activity) {
      setState(createInitialActivityState(activity));
    } else {
      setState(null);
    }
  }, [activity]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activity && state) {
          if (!state.isSubmitted) {
            setState(submitAnswer(activity, state));
          } else {
            setState(revealAnswer(state));
          }
        }
        return;
      }

      // Number keys 1-4 for MCQ options
      if (activity?.type === 'mcq' && activity.options && !state?.isSubmitted) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= activity.options.length) {
          const opt = activity.options[num - 1];
          if (opt && state) {
            setState(selectOption(state, opt.id));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activity, state, onClose]);

  if (!isOpen || !activity || !state) {
    return null;
  }

  const catalogMeta = ACTIVITY_TYPES_CATALOG[activity.type] || ACTIVITY_TYPES_CATALOG.mcq;

  // Handlers
  const handleSelectOption = (optId: string) => {
    setState(selectOption(state, optId));
  };

  const handleMatchingChange = (leftId: string, rightVal: string) => {
    setState(setMatchingAnswer(state, leftId, rightVal));
  };

  const handleMoveOrder = (fromIdx: number, toIdx: number) => {
    setState(reorderItem(state, fromIdx, toIdx));
  };

  const handleBlankChange = (blankIdx: number, val: string) => {
    setState(setBlankInput(state, blankIdx, val));
  };

  const handleSubmit = () => {
    setState(submitAnswer(activity, state));
  };

  const handleTeacherReveal = () => {
    setState(revealAnswer(state));
  };

  const handleNextStep = () => {
    setState(revealNextStep(activity, state));
  };

  const handleFlipCard = () => {
    setState(flipFlashcard(state));
  };

  const handleShowHint = () => {
    setState(revealHint(activity, state));
  };

  const handleRetry = () => {
    setState(retryActivity(activity, state));
  };

  const handleVotePoll = (optId: string) => {
    const res = castPollVote(activity, state, optId);
    setState(res.updatedState);
  };

  const handleInsertAsSlide = () => {
    if (onInsertSlide) {
      onInsertSlide(activity);
      onClose();
      return;
    }

    if (docDispatch && commandSystem) {
      const activeIdx = docState?.currentLessonPageIndex ?? 0;
      const slidePage = createActivitySlidePage(activity, theme, (docState?.lesson?.pages?.length ?? 0) + 1);

      const command = makeInsertPagesCommand({
        dispatch: docDispatch,
        pages: [slidePage],
        afterIndex: activeIdx,
        previousPageIndex: activeIdx,
        description: `Insert Interactive Activity (${activity.title})`,
      });

      commandSystem.execute(command);
      setToastMessage?.(`Inserted "${activity.title}" as slide.`);
      onClose();
    }
  };

  return (
    <div className="iam-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="iam-modal-title">
      <div className="iam-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="iam-header">
          <div className="iam-header-left">
            <span className="iam-badge-pill">
              <span>{catalogMeta.icon}</span>
              <span>{catalogMeta.badge}</span>
            </span>
            <h2 id="iam-modal-title" className="iam-title">
              {activity.title}
            </h2>
          </div>

          <div className="iam-header-right">
            {(state.attemptsCount > 0 || state.score > 0) && (
              <div className="iam-score-badge">
                Score: {state.score} pts (Attempt {state.attemptsCount})
              </div>
            )}
            <button className="iam-close-btn" onClick={onClose} aria-label="Close activity" title="Close (Esc)">
              ✕
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="iam-body">
          {/* Question / Prompt Card */}
          <section className="iam-question-card">
            <h3 className="iam-question-text">{activity.question}</h3>
            {activity.instructions && (
              <p className="iam-instructions-text">💡 {activity.instructions}</p>
            )}
          </section>

          {/* Activity-Specific Interactive Zone */}
          <section className="iam-interactive-zone">
            {/* 1 & 2: MCQ & True/False */}
            {(activity.type === 'mcq' || activity.type === 'true-false') && (
              <div className="iam-options-grid">
                {activity.options?.map((opt, idx) => {
                  const isSelected = state.selectedOptionId === opt.id;
                  const isCorrectOpt = opt.id === activity.correctAnswer;
                  const showResult = state.isSubmitted || state.isRevealed;

                  let optClass = 'iam-option-btn';
                  if (isSelected) optClass += ' selected';
                  if (showResult) {
                    if (isCorrectOpt) optClass += ' correct';
                    else if (isSelected && !isCorrectOpt) optClass += ' incorrect';
                  }

                  return (
                    <button
                      key={opt.id}
                      className={optClass}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={state.isSubmitted && state.isCorrect === true}
                    >
                      <span className="iam-opt-badge">{opt.badge || String.fromCharCode(65 + idx)}</span>
                      <span className="iam-opt-label">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3: Fill in the Blanks */}
            {activity.type === 'fill-in-blanks' && (
              <div className="iam-blanks-container">
                <div style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
                  {activity.question.split(/\[blank\]|___/).map((part, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span>{part}</span>
                      {idx < arr.length - 1 && (
                        <input
                          type="text"
                          className="iam-blank-input"
                          style={{
                            margin: '0 8px',
                            padding: '6px 12px',
                            borderRadius: 6,
                            background: '#0f172a',
                            border: '1.5px solid rgba(56, 189, 248, 0.4)',
                            color: '#ffffff',
                            fontWeight: 600,
                            width: 140,
                          }}
                          value={state.blanksInput?.[idx] || ''}
                          onChange={(e) => handleBlankChange(idx, e.target.value)}
                          placeholder={`Blank ${idx + 1}`}
                          disabled={state.isSubmitted && state.isCorrect === true}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Word Bank Chips (if provided) */}
                {activity.options && activity.options.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', marginRight: 4 }}>Word Bank:</span>
                    {activity.options.map((opt) => (
                      <span
                        key={opt.id}
                        style={{
                          background: 'rgba(56, 189, 248, 0.14)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: 13,
                          color: '#38bdf8',
                        }}
                      >
                        {opt.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4: Match the Following */}
            {activity.type === 'matching' && (
              <div className="iam-matching-list">
                {activity.matchingPairs?.map((pair, idx) => (
                  <div key={pair.id} className="iam-matching-row">
                    <div className="iam-matching-left">
                      {idx + 1}. {pair.left}
                    </div>
                    <div className="iam-matching-arrow">➔</div>
                    <select
                      className="iam-matching-select"
                      value={state.matchingAnswers?.[pair.id] || ''}
                      onChange={(e) => handleMatchingChange(pair.id, e.target.value)}
                      disabled={state.isSubmitted && state.isCorrect === true}
                    >
                      <option value="">-- Choose Matching Definition --</option>
                      {activity.matchingPairs?.map((target) => (
                        <option key={target.id} value={target.right}>
                          {target.right}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* 5: Arrange in Correct Order */}
            {activity.type === 'ordering' && (
              <div className="iam-ordering-list">
                {state.currentOrder?.map((item, idx) => (
                  <div key={idx} className="iam-ordering-item">
                    <div className="iam-ordering-item-content">
                      <span className="iam-opt-badge">{idx + 1}</span>
                      <span>{item}</span>
                    </div>
                    <div className="iam-ordering-actions">
                      <button
                        className="iam-order-btn"
                        onClick={() => handleMoveOrder(idx, idx - 1)}
                        disabled={idx === 0 || (state.isSubmitted && state.isCorrect === true)}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        className="iam-order-btn"
                        onClick={() => handleMoveOrder(idx, idx + 1)}
                        disabled={
                          idx === (state.currentOrder?.length ?? 1) - 1 ||
                          (state.isSubmitted && state.isCorrect === true)
                        }
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6: Q&A Discussion Card */}
            {activity.type === 'qa-reveal' && (
              <div
                style={{
                  background: state.isRevealed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.08)',
                  border: `1.5px ${state.isRevealed ? 'solid #10b981' : 'dashed rgba(56, 189, 248, 0.4)'}`,
                  borderRadius: 14,
                  padding: 24,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                {state.isRevealed ? (
                  <div>
                    <div style={{ color: '#34d399', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                      ✓ TEACHER ANSWER & DISCUSSION POINTS:
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.6, color: '#f8fafc' }}>
                      {activity.explanation || (typeof activity.correctAnswer === 'object' ? JSON.stringify(activity.correctAnswer) : String(activity.correctAnswer ?? ''))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
                    <div>Answer is hidden for classroom discussion.</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: '#64748b' }}>
                      Click "Reveal Answer" when students have shared their hypotheses.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7: Flashcard */}
            {activity.type === 'flashcard' && (
              <div className="iam-flashcard-stage">
                <div className="iam-flashcard" onClick={handleFlipCard} role="button" tabIndex={0}>
                  <div className="iam-flashcard-badge">
                    {state.isFlashcardFlipped ? 'BACK — DEFINITION & EXPLANATION' : 'FRONT — CONCEPT / QUESTION'}
                  </div>
                  <div className="iam-flashcard-text">
                    {state.isFlashcardFlipped
                      ? activity.flashcardBack || activity.explanation
                      : activity.question}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12, color: '#64748b' }}>
                    (Click or press Space to flip)
                  </div>
                </div>
              </div>
            )}

            {/* 8: Step-by-Step Reveal */}
            {activity.type === 'step-reveal' && (
              <div className="iam-step-list">
                {activity.steps?.map((step, idx) => {
                  const isRevealed = state.isRevealed || idx <= state.revealedStepIndex;
                  return (
                    <div key={idx} className={`iam-step-card ${isRevealed ? 'revealed' : ''}`}>
                      <div className="iam-step-header">
                        Step {step.stepNumber}: {step.title}
                      </div>
                      <div className="iam-step-content">
                        {isRevealed ? step.content : '🔒 Hidden step — click "Next Step" to reveal'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 9: Formula Reveal */}
            {activity.type === 'formula-reveal' && (
              <div>
                <div className="iam-formula-banner">
                  <div style={{ fontSize: 13, textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6, fontWeight: 700 }}>
                    {activity.formulaName || 'Governing Law'}
                  </div>
                  <div className="iam-formula-code">{activity.formula}</div>
                </div>

                <div className="iam-variable-grid">
                  {activity.variableBreakdown?.map((v, idx) => (
                    <div key={idx} className="iam-var-card">
                      <strong style={{ color: '#38bdf8' }}>{v.symbol}</strong> : {v.meaning}
                      {v.unit && <span style={{ color: '#94a3b8' }}> ({v.unit})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10: Quick Classroom Poll */}
            {activity.type === 'poll' && (
              <div className="iam-poll-list">
                {activity.pollOptions?.map((opt) => {
                  const total = activity.pollOptions?.reduce((a, b) => a + (b.votes || 0), 0) || 0;
                  const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
                  const isVoted = state.pollVotedOptionId === opt.id;

                  return (
                    <div key={opt.id} className="iam-poll-item">
                      <div className="iam-poll-progress" style={{ width: `${pct}%` }} />
                      <div className="iam-poll-inner">
                        <div>
                          <strong style={{ color: isVoted ? '#38bdf8' : '#f8fafc' }}>{opt.text}</strong>
                          {isVoted && <span style={{ marginLeft: 8, color: '#38bdf8' }}>✓ (Your Vote)</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: 13 }}>
                            {pct}% ({opt.votes || 0} votes)
                          </span>
                          <button
                            className="iam-vote-btn"
                            onClick={() => handleVotePoll(opt.id)}
                            disabled={state.pollVotedOptionId !== undefined}
                          >
                            Vote
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Feedback & Result Banner */}
          {(state.feedbackMessage || state.isRevealed) && (
            <section
              className={`iam-feedback-banner ${
                state.isCorrect === true
                  ? 'correct'
                  : state.isCorrect === false
                  ? 'incorrect'
                  : 'revealed'
              }`}
            >
              <div>
                <strong>
                  {state.isCorrect === true
                    ? '🎉 Correct!'
                    : state.isCorrect === false
                    ? '❌ Needs Review:'
                    : 'ℹ️ Explanation:'}
                </strong>{' '}
                {state.feedbackMessage || activity.explanation}
              </div>
            </section>
          )}

          {/* Hints Section */}
          {state.hintsRevealedCount > 0 && activity.hints && (
            <section className="iam-hints-box">
              <strong>💡 Pedagogical Hint {state.hintsRevealedCount}:</strong>{' '}
              {activity.hints[state.hintsRevealedCount - 1]}
            </section>
          )}
        </main>

        {/* Footer Teacher Controls */}
        <footer className="iam-footer">
          <div className="iam-footer-left">
            {activity.hints && activity.hints.length > 0 && (
              <button
                className="iam-btn iam-btn-secondary"
                onClick={handleShowHint}
                disabled={state.hintsRevealedCount >= activity.hints.length}
                title="Reveal Next Hint (H)"
              >
                💡 Hint ({activity.hints.length - state.hintsRevealedCount} left)
              </button>
            )}

            <button
              className="iam-btn iam-btn-secondary"
              onClick={handleTeacherReveal}
              title="Reveal Answer (Teacher Control)"
            >
              👁️ Reveal Answer
            </button>

            {activity.type === 'step-reveal' && (
              <button
                className="iam-btn iam-btn-secondary"
                onClick={handleNextStep}
                disabled={state.revealedStepIndex >= ((activity.steps?.length ?? 1) - 1)}
              >
                🪜 Next Step
              </button>
            )}

            {activity.type === 'flashcard' && (
              <button className="iam-btn iam-btn-secondary" onClick={handleFlipCard}>
                🔄 Flip Card
              </button>
            )}

            <button className="iam-btn iam-btn-secondary" onClick={handleRetry} title="Reset / Retry Question (R)">
              🔄 Retry
            </button>
          </div>

          <div className="iam-footer-right">
            <button
              className="iam-btn iam-btn-insert"
              onClick={handleInsertAsSlide}
              title="Insert this activity as a full native slide into the active whiteboard lesson"
            >
              ➕ Insert as Slide into Lesson
            </button>

            {!state.isSubmitted && activity.type !== 'poll' && (
              <button className="iam-btn iam-btn-primary" onClick={handleSubmit}>
                ✓ Submit Answer
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
