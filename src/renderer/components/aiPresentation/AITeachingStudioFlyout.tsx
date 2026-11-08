/**
 * AITeachingStudioFlyout.tsx — Central AI Teaching Studio Popover Menu
 * Final Integration: AI Teaching Studio
 *
 * Professional popover docked directly to the toolbar, providing instant access to:
 * 1. AI Presentation Generator (16:9 lesson slide decks with Gamma-grade cards)
 * 2. AI Slide Assistant (19 pedagogical refinement actions with side-by-side diff)
 * 3. 10 Interactive Educational Activities (MCQs, matching, ordering, polls, flashcards)
 * 4. AI Provider Settings & Connection Status (OpenAI, Gemini, Ollama, Offline)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  EducationalActivityType,
  AIProviderType,
} from '../../../shared/aiPresentationTypes';
import { ACTIVITY_TYPES_CATALOG } from '../../services/aiPresentation/interactiveActivityBridge';
import { aiProviderManager } from '../../services/aiPresentation/aiProviderManager';
import { SlideAIActionId } from '../../services/aiPresentation/slideEditService';
import { TextObject } from '../../../shared/types';
import './AITeachingStudioFlyout.css';

export interface AITeachingStudioFlyoutProps {
  onClose: () => void;
  onOpenPresentationGenerator: () => void;
  onOpenSlideAssistant: (initialAction?: SlideAIActionId) => void;
  onOpenActivity: (type: EducationalActivityType) => void;
  onOpenProviderSettings: () => void;
}

export function AITeachingStudioFlyout({
  onClose,
  onOpenPresentationGenerator,
  onOpenSlideAssistant,
  onOpenActivity,
  onOpenProviderSettings,
}: AITeachingStudioFlyoutProps): React.ReactElement {
  let docState: any = null;
  let selectedObject: any = null;
  try {
    const ctx = useAppContext();
    docState = ctx.docState;
    selectedObject = ctx.selectedObject;
  } catch {
    // Outside AppProvider context fallback for headless rendering
  }
  const flyoutRef = useRef<HTMLDivElement>(null);

  const [activeProvider, setActiveProvider] = useState<AIProviderType>(() => {
    return aiProviderManager.getActiveProvider();
  });
  const [providerStatus, setProviderStatus] = useState<string>('Offline Ready');
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Load lightweight cached provider status on mount (without continuous polling)
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const prov = aiProviderManager.getActiveProvider();
        setActiveProvider(prov);

        if (prov === 'ollama') {
          const res = await aiProviderManager.checkOllamaStatus();
          if (isMounted) {
            setProviderStatus(res.available ? 'Ollama Ready' : 'Ollama Offline');
          }
        } else {
          const hasKey = await aiProviderManager.hasApiKey(prov);
          if (isMounted) {
            setProviderStatus(hasKey ? `${prov.toUpperCase()} Configured` : 'Offline Templates');
          }
        }
      } catch {
        if (isMounted) setProviderStatus('Offline Templates');
      }
    };

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick single connection test
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await aiProviderManager.testConnection(activeProvider);
      if (res.success) {
        setProviderStatus(`${activeProvider.toUpperCase()} (${res.latencyMs || 0}ms)`);
      } else {
        setProviderStatus(res.error ? 'Connection Failed' : 'Key Required');
      }
    } catch {
      setProviderStatus('Connection Failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Resolve current whiteboard context / selection
  const currentPageIndex = docState?.currentPageIndex ?? 0;
  const currentPage = docState?.lesson?.pages?.[currentPageIndex];
  const slideTitle = currentPage?.title || `Slide ${currentPageIndex + 1}`;

  const contextScope = useMemo(() => {
    if (selectedObject?.type === 'text') {
      const text = (selectedObject as TextObject).content || '';
      const snippet = text.length > 28 ? `${text.slice(0, 25)}...` : text;
      return {
        tag: 'Text Scope',
        desc: `Selected Text: "${snippet}"`,
      };
    }
    if (selectedObject?.type === 'shape' || selectedObject?.type === 'group') {
      return {
        tag: 'Card Scope',
        desc: `Selected Card / Container`,
      };
    }
    return {
      tag: 'Slide Scope',
      desc: `Active Slide: "${slideTitle}"`,
    };
  }, [selectedObject, slideTitle]);

  const activityTypes = Object.keys(ACTIVITY_TYPES_CATALOG) as EducationalActivityType[];

  return (
    <div
      ref={flyoutRef}
      className="ai-studio-flyout"
      role="dialog"
      aria-modal="false"
      aria-label="AI Teaching Studio"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <header className="ai-flyout-header">
        <div className="ai-flyout-header-title">
          <span>✨</span>
          <span>AI Teaching Studio</span>
        </div>

        <div className="ai-flyout-header-right">
          <span className="ai-provider-status-pill" title="Active AI provider mode">
            ● {providerStatus}
          </span>
          <button className="ai-flyout-close-btn" onClick={onClose} title="Close" aria-label="Close">
            ✕
          </button>
        </div>
      </header>

      {/* ─── Scope Context Banner ─────────────────────────────────────────────── */}
      <div className="ai-scope-banner">
        <span className="ai-scope-target">
          <span>🎯</span>
          <span>{contextScope.desc}</span>
        </span>
        <span className="ai-scope-tag">{contextScope.tag}</span>
      </div>

      {/* ─── Scrollable Menu Body ─────────────────────────────────────────────── */}
      <main className="ai-flyout-body">
        {/* Section 1: Presentation Generator */}
        <section className="ai-section-box">
          <div className="ai-section-header">
            <div className="ai-section-title">
              <span>🖥️</span>
              <span>16:9 Lesson Presentation Generator</span>
            </div>
            <span className="ai-shortcut-badge">Ctrl+Shift+P</span>
          </div>

          <p className="ai-section-desc">
            Generate complete curriculum slide decks with Gamma-grade cards, formulas, diagrams, and speaker notes.
          </p>

          <button
            type="button"
            className="ai-action-btn-primary"
            onClick={() => {
              onClose();
              onOpenPresentationGenerator();
            }}
          >
            <span>🚀 Generate Full Presentation Deck...</span>
            <span>➔</span>
          </button>
        </section>

        {/* Section 2: AI Slide Assistant */}
        <section className="ai-section-box">
          <div className="ai-section-header">
            <div className="ai-section-title">
              <span>🪄</span>
              <span>AI Slide & Content Assistant</span>
            </div>
            <span className="ai-shortcut-badge">Ctrl+Shift+E</span>
          </div>

          <p className="ai-section-desc">
            Refine existing text, add real-world examples, create formative quizzes, or improve layout in place with Before/After diffs.
          </p>

          <button
            type="button"
            className="ai-action-btn-secondary"
            onClick={() => {
              onClose();
              onOpenSlideAssistant();
            }}
          >
            <span>✨ Open Assistant for {contextScope.tag}...</span>
            <span>➔</span>
          </button>

          {/* Quick Action Shortcuts */}
          <div className="ai-quick-actions-row">
            <button
              type="button"
              className="ai-quick-pill"
              onClick={() => {
                onClose();
                onOpenSlideAssistant('simplify');
              }}
              title="Simplify explanation"
            >
              ✂️ Simplify
            </button>
            <button
              type="button"
              className="ai-quick-pill"
              onClick={() => {
                onClose();
                onOpenSlideAssistant('to-bullets');
              }}
              title="Convert paragraph to bullet points"
            >
              📋 Bullets
            </button>
            <button
              type="button"
              className="ai-quick-pill"
              onClick={() => {
                onClose();
                onOpenSlideAssistant('add-example');
              }}
              title="Add educational example"
            >
              💡 Example
            </button>
            <button
              type="button"
              className="ai-quick-pill"
              onClick={() => {
                onClose();
                onOpenSlideAssistant('generate-quiz');
              }}
              title="Generate check-for-understanding quiz question"
            >
              ❓ Quick Quiz
            </button>
            <button
              type="button"
              className="ai-quick-pill"
              onClick={() => {
                onClose();
                onOpenSlideAssistant('regenerate-slide');
              }}
              title="Regenerate entire slide content"
            >
              🔄 Refresh Slide
            </button>
          </div>
        </section>

        {/* Section 3: Interactive Educational Activities */}
        <section className="ai-section-box">
          <div className="ai-section-header">
            <div className="ai-section-title">
              <span>🎯</span>
              <span>Interactive Classroom Activities</span>
            </div>
            <span className="ai-shortcut-badge">Ctrl+Shift+A</span>
          </div>

          <p className="ai-section-desc">
            Present live formative activities to the class or insert them as slides into your lesson:
          </p>

          <div className="ai-activity-grid">
            {activityTypes.map((type) => {
              const meta = ACTIVITY_TYPES_CATALOG[type];
              return (
                <button
                  key={type}
                  type="button"
                  className="ai-activity-card-btn"
                  onClick={() => {
                    onClose();
                    onOpenActivity(type);
                  }}
                  title={meta.description}
                >
                  <span className="ai-activity-icon">{meta.icon}</span>
                  <span>{meta.shortName}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* ─── Footer: Models & Settings ────────────────────────────────────────── */}
      <footer className="ai-flyout-footer">
        <button
          type="button"
          className="ai-footer-link"
          onClick={handleTestConnection}
          disabled={isTestingConnection}
          title="Test active provider connection"
        >
          <span>⚡</span>
          <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
        </button>

        <button
          type="button"
          className="ai-footer-link"
          onClick={() => {
            onClose();
            onOpenProviderSettings();
          }}
          title="Configure OpenAI, Gemini, or Ollama API keys and models"
        >
          <span>⚙️</span>
          <span>Configure Providers & Models</span>
        </button>
      </footer>
    </div>
  );
}
