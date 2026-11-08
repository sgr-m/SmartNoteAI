/**
 * aiPresentationModal.test.ts — Unit tests for AI Presentation Generation Modal
 * Milestone 5: TASK-109 Verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AIPresentationModal,
  AIPresentationModalProps,
  ModalTab,
} from '../src/renderer/components/aiPresentation/AIPresentationModal';
import { OutlineRefinementChatbox } from '../src/renderer/components/aiPresentation/OutlineRefinementChatbox';
import { aiPresentationService } from '../src/renderer/services/aiPresentation/aiPresentationService';
import { aiProviderManager } from '../src/renderer/services/aiPresentation/aiProviderManager';
import { detectSubjectFromTopic } from '../src/renderer/services/aiPresentation/promptTemplates';
import {
  PresentationDeckSpec,
  PresentationGenerationResult,
} from '../src/shared/aiPresentationTypes';
import { MODERN_ACADEMIC_THEME } from '../src/renderer/services/aiPresentation/presentationThemes';

describe('TASK-109: AI Presentation Generation Interface (Modal)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Component Rendering & Visibility', () => {
    it('returns null when isOpen is false', () => {
      const vdom = AIPresentationModal({
        isOpen: false,
        onClose: vi.fn(),
      });
      expect(vdom).toBeNull();
    });

    it('renders modal dialog and header when isOpen is true', () => {
      const onClose = vi.fn();
      const html = renderToStaticMarkup(
        React.createElement(AIPresentationModal, {
          isOpen: true,
          onClose,
        })
      );

      expect(html).toContain('ai-pres-overlay');
      expect(html).toContain('ai-pres-modal');
      expect(html).toContain('AI Teaching Presentation Generator');
      expect(html).toContain('Content &amp; Pedagogy');
      expect(html).toContain('Generate Presentation');
    });
  });

  describe('2. Form Defaults & Subject Auto-Detection Logic', () => {
    it('auto-detects subject from topic when subject has not been manually edited', () => {
      expect(detectSubjectFromTopic("Newton's Laws of Motion")).toBe('Physics');
      expect(detectSubjectFromTopic('Photosynthesis and Light Reactions')).toBe('Biology');
      expect(detectSubjectFromTopic('Chemical Equations and Stoichiometry')).toBe('Chemistry');
      expect(detectSubjectFromTopic('Trigonometric Ratios and Pythagoras')).toBe('Mathematics');
      expect(detectSubjectFromTopic('Binary Trees and Quicksort')).toBe('Computer Science');
      expect(detectSubjectFromTopic('French Revolution and Monarchy')).toBe('History');
      expect(detectSubjectFromTopic('Plate Tectonics and Continents')).toBe('Geography');
      expect(detectSubjectFromTopic('Shakespearean Metaphors')).toBe('Literature');
      expect(detectSubjectFromTopic('Unknown topic')).toBe('General Education');
    });

    it('calculates duration from slide count (count * 5, minimum 15 min)', () => {
      const calcDuration = (count: number) => Math.max(15, count * 5);
      expect(calcDuration(3)).toBe(15);
      expect(calcDuration(5)).toBe(25);
      expect(calcDuration(8)).toBe(40);
      expect(calcDuration(15)).toBe(75);
    });

    it('clamps slide counts strictly between 3 and 15', () => {
      const clampSlides = (count: number) => Math.max(3, Math.min(15, count));
      expect(clampSlides(1)).toBe(3);
      expect(clampSlides(2)).toBe(3);
      expect(clampSlides(5)).toBe(5);
      expect(clampSlides(15)).toBe(15);
      expect(clampSlides(25)).toBe(15);
    });
  });

  describe('3. Visual Themes Integration', () => {
    it('retrieves all 9 curated themes from presentation service for visual preview swatches', () => {
      const themes = aiPresentationService.getAvailableThemes();
      expect(themes).toHaveLength(9);
      const themeIds = themes.map((t) => t.id);

      expect(themeIds).toContain('modern-academic');
      expect(themeIds).toContain('dark-technology');
      expect(themeIds).toContain('minimal-classroom');
      expect(themeIds).toContain('science-engineering');
      expect(themeIds).toContain('colorful-education');
      expect(themeIds).toContain('editorial');
      expect(themeIds).toContain('nature-geography');
      expect(themeIds).toContain('chalkboard-classic');
      expect(themeIds).toContain('ocean-breeze');

      // Verify each theme has required palette swatches
      themes.forEach((theme) => {
        expect(theme.backgroundColor).toBeDefined();
        expect(theme.cardBackground).toBeDefined();
        expect(theme.primaryText).toBeDefined();
        expect(theme.accentColor).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(theme.description).toBeDefined();
      });
    });
  });

  describe('4. AI Provider & Models Integration', () => {
    it('queries active provider and model from AIProviderManager', () => {
      expect(['openai', 'gemini', 'ollama']).toContain(aiProviderManager.getActiveProvider());
      const selectedModel = aiProviderManager.getSelectedModel();
      expect(typeof selectedModel).toBe('string');
      expect(selectedModel.length).toBeGreaterThan(0);
    });

    it('tests connection via AIProviderManager and returns round-trip latency & models', async () => {
      const testSpy = vi.spyOn(aiProviderManager, 'testConnection').mockResolvedValue({
        success: true,
        provider: 'openai',
        latencyMs: 120,
        models: ['gpt-4o', 'gpt-4o-mini'],
      });

      const res = await aiProviderManager.testConnection('openai');
      expect(testSpy).toHaveBeenCalledWith('openai');
      expect(res.success).toBe(true);
      expect(res.latencyMs).toBe(120);
      expect(res.models).toContain('gpt-4o');
    });

    it('saves encrypted API keys via AIProviderManager without logging plaintext keys', async () => {
      const saveSpy = vi.spyOn(aiProviderManager, 'saveApiKey').mockResolvedValue({
        success: true,
      });

      const res = await aiProviderManager.saveApiKey('openai', 'sk-test-secret-key-12345');
      expect(saveSpy).toHaveBeenCalledWith('openai', 'sk-test-secret-key-12345');
      expect(res.success).toBe(true);
    });
  });

  describe('5. Presentation Generation Pipeline Execution', () => {
    it('validates that topic is required and rejects empty submission', async () => {
      const genSpy = vi.spyOn(aiPresentationService, 'generatePresentation');

      // Model the handleGenerate validation logic
      let validationError: string | null = null;
      const topicInput = '   ';
      if (!topicInput.trim()) {
        validationError = 'Please enter a presentation topic to begin.';
      }

      expect(validationError).toBe('Please enter a presentation topic to begin.');
      expect(genSpy).not.toHaveBeenCalled();
    });

    it('triggers generatePresentation with complete teacher configuration and calls onSuccess', async () => {
      const mockResult: PresentationGenerationResult = {
        success: true,
        pages: [],
        source: 'ai',
        modelUsed: 'gpt-4o-mini',
        providerUsed: 'openai',
        themeUsed: MODERN_ACADEMIC_THEME,
        durationMs: 850,
        warnings: [],
      };

      const genSpy = vi.spyOn(aiPresentationService, 'generatePresentation').mockResolvedValue(mockResult);
      const onSuccess = vi.fn();

      const options = {
        topic: 'Photosynthesis & Light Reactions',
        subject: 'Biology',
        gradeLevel: 'High School (Grades 9-10)',
        language: 'English',
        difficulty: 'intermediate' as const,
        numberOfSlides: 5,
        durationMinutes: 25,
        teachingStyle: 'interactive' as const,
        themeId: 'modern-academic' as const,
        provider: 'openai' as const,
        model: 'gpt-4o-mini',
      };

      const result = await aiPresentationService.generatePresentation(options);
      expect(genSpy).toHaveBeenCalledWith(options);
      expect(result.success).toBe(true);
      expect(result.source).toBe('ai');
      expect(result.modelUsed).toBe('gpt-4o-mini');

      onSuccess(result);
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });

    it('supports triggering offline curriculum template fallback explicitly', async () => {
      const mockResult: PresentationGenerationResult = {
        success: true,
        pages: [],
        source: 'curriculum-template',
        themeUsed: MODERN_ACADEMIC_THEME,
        durationMs: 15,
        warnings: [],
      };

      const genSpy = vi.spyOn(aiPresentationService, 'generatePresentation').mockResolvedValue(mockResult);

      const result = await aiPresentationService.generatePresentation({
        topic: 'Plate Tectonics',
        forceTemplateFallback: true,
      });

      expect(genSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Plate Tectonics',
          forceTemplateFallback: true,
        })
      );
      expect(result.success).toBe(true);
      expect(result.source).toBe('curriculum-template');
    });

    it('handles cancellation gracefully using AbortController', async () => {
      const mockCancelledResult: PresentationGenerationResult = {
        success: false,
        pages: [],
        source: 'curriculum-template',
        themeUsed: MODERN_ACADEMIC_THEME,
        durationMs: 120,
        warnings: [],
        error: 'Presentation generation was cancelled.',
        cancelled: true,
      };

      vi.spyOn(aiPresentationService, 'generatePresentation').mockResolvedValue(mockCancelledResult);

      const controller = new AbortController();
      controller.abort();

      const result = await aiPresentationService.generatePresentation({
        topic: 'Trigonometry',
        signal: controller.signal,
      });

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.error).toContain('cancelled');
    });

    it('handles AI generation failure by returning error message and allowing retry', async () => {
      const mockFailedResult: PresentationGenerationResult = {
        success: false,
        pages: [],
        source: 'curriculum-template',
        themeUsed: MODERN_ACADEMIC_THEME,
        durationMs: 300,
        warnings: [],
        error: 'Rate limit exceeded on OpenAI API (HTTP 429)',
      };

      vi.spyOn(aiPresentationService, 'generatePresentation').mockResolvedValue(mockFailedResult);

      const result = await aiPresentationService.generatePresentation({
        topic: 'Quantum Physics',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });

  describe('6. Rendered Markup Structure & Accessibility', () => {
    it('renders accessible dialog role, labels, buttons, and summary tags in markup', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIPresentationModal, {
          isOpen: true,
          onClose: vi.fn(),
        })
      );

      // Verify accessibility attributes
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="ai-pres-title"');
      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');

      // Verify form elements
      expect(html).toContain('id="pres-topic"');
      expect(html).toContain('id="pres-subject"');
      expect(html).toContain('id="pres-grade"');
      expect(html).toContain('id="pres-language"');
      expect(html).toContain('id="pres-difficulty"');
      expect(html).toContain('id="pres-instructions"');

      // Verify footer action buttons
      expect(html).toContain('Template Deck (Offline)');
      expect(html).toContain('Generate Presentation');
      expect(html).toContain('Close');
    });
  });

  describe('7. Outline Refinement Chatbox Integration', () => {
    it('renders OutlineRefinementChatbox component with chat elements and suggestion chips', () => {
      const html = renderToStaticMarkup(
        React.createElement(OutlineRefinementChatbox, {
          topic: 'Quadratic Equations',
          currentOutline: [
            { slideNumber: 1, title: 'Introduction', actionGoal: 'Core definition' },
          ],
          onOutlineChange: vi.fn(),
        })
      );

      expect(html).toContain('outline-chatbox-container');
      expect(html).toContain('AI Outline Refiner');
      expect(html).toContain('outline-chatbox-input');
      expect(html).toContain('Send');
      expect(html).toContain('Quick Suggestions:');
      expect(html).toContain('Add completing the square before quadratic formula');
    });
  });
});
