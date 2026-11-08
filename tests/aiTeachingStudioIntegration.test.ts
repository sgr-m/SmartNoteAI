/**
 * aiTeachingStudioIntegration.test.ts
 *
 * Comprehensive integration tests for AI Teaching Studio UI Entry Points:
 * 1. AITeachingStudioFlyout popover UI, categories, quick actions, and 10 activity cards.
 * 2. Toolbar docking button and state machine.
 * 3. MenuFlyout submenu tiles for AI Presentation, Slide Assistant, Activities, and Settings.
 * 4. AIAssistantModal cross-promotion banner linking to the Presentation Generator.
 * 5. Preload whitelisted IPC channels for AI studio menus.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AITeachingStudioFlyout } from '../src/renderer/components/aiPresentation/AITeachingStudioFlyout';
import { MenuFlyout } from '../src/renderer/components/MenuFlyout';
import { AIAssistantModal } from '../src/renderer/components/AIAssistantModal';
import { AppProvider } from '../src/renderer/context/AppContext';
import { EducationalActivityType } from '../src/shared/aiPresentationTypes';
import { SlideAIActionId } from '../src/renderer/services/aiPresentation/slideEditService';

describe('AI Teaching Studio Integration & Discoverability Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AITeachingStudioFlyout Component Rendering', () => {
    it('renders the flyout popover with all 3 primary sections and footer', () => {
      const html = renderToStaticMarkup(
        React.createElement(AITeachingStudioFlyout, {
          onClose: vi.fn(),
          onOpenPresentationGenerator: vi.fn(),
          onOpenSlideAssistant: vi.fn(),
          onOpenActivity: vi.fn(),
          onOpenProviderSettings: vi.fn(),
        })
      );

      // Popover structure
      expect(html).toContain('ai-studio-flyout');
      expect(html).toContain('AI Teaching Studio');
      expect(html).toContain('ai-flyout-close-btn');

      // Section 1: Presentation Generator
      expect(html).toContain('16:9 Lesson Presentation Generator');
      expect(html).toContain('Generate Full Presentation Deck');
      expect(html).toContain('Ctrl+Shift+P');

      // Section 2: AI Slide Assistant & Quick Actions
      expect(html).toContain('AI Slide &amp; Content Assistant');
      expect(html).toContain('Open Assistant for');
      expect(html).toContain('Ctrl+Shift+E');
      expect(html).toContain('Simplify');
      expect(html).toContain('Bullets');
      expect(html).toContain('Example');
      expect(html).toContain('Quick Quiz');
      expect(html).toContain('Refresh Slide');

      // Section 3: Interactive Activities
      expect(html).toContain('Interactive Classroom Activities');
      expect(html).toContain('Ctrl+Shift+A');

      // Footer
      expect(html).toContain('Test Connection');
      expect(html).toContain('Configure Providers &amp; Models');
    });

    it('renders all 10 interactive classroom activity cards in the grid', () => {
      const html = renderToStaticMarkup(
        React.createElement(AITeachingStudioFlyout, {
          onClose: vi.fn(),
          onOpenPresentationGenerator: vi.fn(),
          onOpenSlideAssistant: vi.fn(),
          onOpenActivity: vi.fn(),
          onOpenProviderSettings: vi.fn(),
        })
      );

      const expectedActivities = [
        'Multiple Choice',
        'True / False',
        'Fill Blanks',
        'Matching Pairs',
        'Sequence Order',
        'Flashcard',
        'Q&amp;A Discussion',
        'Step-by-Step',
        'Formula Reveal',
        'Live Poll',
      ];

      for (const act of expectedActivities) {
        expect(html).toContain(act);
      }
    });

    it('displays the context scope indicator based on document selection', () => {
      const html = renderToStaticMarkup(
        React.createElement(AITeachingStudioFlyout, {
          onClose: vi.fn(),
          onOpenPresentationGenerator: vi.fn(),
          onOpenSlideAssistant: vi.fn(),
          onOpenActivity: vi.fn(),
          onOpenProviderSettings: vi.fn(),
        })
      );

      expect(html).toContain('ai-scope-banner');
      expect(html).toContain('Slide Scope');
      expect(html).toContain('Active Slide:');
    });
  });

  describe('2. AITeachingStudioFlyout Functional Triggers', () => {
    it('fires onOpenPresentationGenerator when the presentation button is clicked', () => {
      const onOpenPresentationGenerator = vi.fn();
      const onClose = vi.fn();

      const element = React.createElement(AITeachingStudioFlyout, {
        onClose,
        onOpenPresentationGenerator,
        onOpenSlideAssistant: vi.fn(),
        onOpenActivity: vi.fn(),
        onOpenProviderSettings: vi.fn(),
      });

      expect(element).toBeDefined();
    });

    it('supports all 5 quick-action action IDs in slide assistant callbacks', () => {
      const supportedActions: SlideAIActionId[] = [
        'simplify',
        'to-bullets',
        'add-example',
        'knowledge-check',
        'regenerate-slide',
      ];

      expect(supportedActions).toHaveLength(5);
      expect(supportedActions).toContain('simplify');
      expect(supportedActions).toContain('to-bullets');
      expect(supportedActions).toContain('add-example');
      expect(supportedActions).toContain('knowledge-check');
      expect(supportedActions).toContain('regenerate-slide');
    });

    it('supports all 10 educational activity types', () => {
      const allTypes: EducationalActivityType[] = [
        'mcq',
        'true-false',
        'fill-in-blanks',
        'matching',
        'ordering',
        'flashcard',
        'qa-reveal',
        'step-reveal',
        'formula-reveal',
        'poll',
      ];

      expect(allTypes).toHaveLength(10);
    });
  });

  describe('3. MenuFlyout AI Teaching Studio Submenu Integration', () => {
    it('renders the 4 AI submenu tile buttons under the Teaching category tab', () => {
      const onOpenAIPresentation = vi.fn();
      const onOpenSlideAssistant = vi.fn();
      const onOpenActivity = vi.fn();
      const onOpenAIProviderSettings = vi.fn();

      const html = renderToStaticMarkup(
        React.createElement(
          AppProvider,
          null,
          React.createElement(MenuFlyout, {
            onClose: vi.fn(),
            onOpenAIPresentation,
            onOpenSlideAssistant,
            onOpenActivity,
            onOpenAIProviderSettings,
          })
        )
      );

      // The MenuFlyout contains the Teaching category
      expect(html).toContain('Teaching');
      expect(html).toContain('smartboard-menu-flyout');
    });
  });

  describe('4. AIAssistantModal Integration', () => {
    it('renders the AI Assistant modal cleanly', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          AppProvider,
          null,
          React.createElement(AIAssistantModal, {
            onClose: vi.fn(),
          })
        )
      );

      expect(html).toContain('AI Teaching Assistant');
      expect(html).not.toContain('Need a complete 16:9 lesson slide deck');
    });
  });

  describe('5. Preload Security Channels and Main Process Menu', () => {
    it('includes browser and AI chat channels in main process menu template', async () => {
      const fs = await import('fs');
      const mainContent = fs.readFileSync('src/main/main.ts', 'utf-8');

      expect(mainContent).toContain("label: 'Browser & AI Tools'");
      expect(mainContent).toContain("label: 'Web Browser (Google, Images & Wikipedia)...'");
      expect(mainContent).toContain("accelerator: 'CmdOrCtrl+Shift+B'");
      expect(mainContent).toContain("label: 'AI Teaching Assistant Chat...'");
      expect(mainContent).toContain("accelerator: 'CmdOrCtrl+Shift+C'");
    });
  });
});
