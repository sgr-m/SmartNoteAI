/**
 * slideAIToolbar.test.ts — Unit tests for AI-Assisted Slide Editing & Refinement
 * Milestone 5: TASK-111 Verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideAIToolbar } from '../src/renderer/components/aiPresentation/SlideAIToolbar';
import {
  slideEditService,
  SlideAIEditRequest,
  SLIDE_AI_ACTIONS,
} from '../src/renderer/services/aiPresentation/slideEditService';
import {
  CommandSystem,
  makeUpdateObjectCommand,
  makeRenamePageCommand,
} from '../src/renderer/engine/CommandSystem';
import {
  documentReducer,
  initialDocumentState,
  createDefaultPage,
} from '../src/renderer/store/documentStore';
import { Page, TextObject, ShapeObject } from '../src/shared/types';

// Mock AppContext
const mockDocDispatch = vi.fn();
const mockSetSelectedObject = vi.fn();
const mockSetToastMessage = vi.fn();
const mockCommandSystem = new CommandSystem();

let mockSelectedObject: any = null;

let mockDocState = {
  ...initialDocumentState,
  lesson: {
    ...initialDocumentState.lesson,
    pages: [
      {
        ...createDefaultPage(),
        id: 'test-slide-1',
        title: 'Photosynthesis Overview',
        objects: [
          {
            id: 'text-title',
            type: 'text',
            x: 80,
            y: 80,
            width: 1760,
            height: 60,
            content: 'Photosynthesis Overview',
            fontFamily: 'Inter, sans-serif',
            fontSize: 36,
            fontWeight: 700,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#ffffff',
            backgroundColor: 'transparent',
          } as TextObject,
          {
            id: 'text-body',
            type: 'text',
            x: 80,
            y: 200,
            width: 1760,
            height: 120,
            content:
              'In order to utilize sunlight, plants demonstrate that chlorophyll facilitates energy absorption.',
            fontFamily: 'Inter, sans-serif',
            fontSize: 22,
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#e2e8f0',
            backgroundColor: 'transparent',
          } as TextObject,
        ],
      },
    ],
  },
  currentPageIndex: 0,
};

vi.mock('../src/renderer/context/AppContext', () => ({
  useAppContext: () => ({
    docState: mockDocState,
    docDispatch: mockDocDispatch,
    commandSystem: mockCommandSystem,
    selectedObject: mockSelectedObject,
    setSelectedObject: mockSetSelectedObject,
    setToastMessage: mockSetToastMessage,
  }),
}));

describe('TASK-111: AI-Assisted Slide Editing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDocDispatch.mockClear();
    mockSetSelectedObject.mockClear();
    mockSetToastMessage.mockClear();
    mockSelectedObject = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Component Visibility & Closed State', () => {
    it('returns empty markup when isOpen is false', () => {
      const html = renderToStaticMarkup(
        React.createElement(SlideAIToolbar, {
          isOpen: false,
          onClose: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('renders modal dialog when isOpen is true', () => {
      const html = renderToStaticMarkup(
        React.createElement(SlideAIToolbar, {
          isOpen: true,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('slide-ai-toolbar-backdrop');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('AI Slide Assistant');
    });
  });

  describe('2. Dynamic Scope Resolution & Context Targeting', () => {
    it('resolves text scope when a TextObject is selected', () => {
      mockSelectedObject = mockDocState.lesson.pages[0].objects[1] as TextObject;

      const html = renderToStaticMarkup(
        React.createElement(SlideAIToolbar, {
          isOpen: true,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('text Scope');
      expect(html).toContain('Targeting: Selected Text Element');
      expect(html).toContain('In order to utilize sunlight');
      expect(html).toContain('Text Improvements');
    });

    it('resolves card scope when a ShapeObject is selected', () => {
      mockSelectedObject = {
        id: 'shape-card-1',
        type: 'shape',
        shapeType: 'roundedRect',
        x: 100,
        y: 100,
        width: 400,
        height: 200,
      } as ShapeObject;

      const html = renderToStaticMarkup(
        React.createElement(SlideAIToolbar, {
          isOpen: true,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('card Scope');
      expect(html).toContain('Teaching Improvements');
    });

    it('resolves slide scope when no object is selected', () => {
      mockSelectedObject = null;

      const html = renderToStaticMarkup(
        React.createElement(SlideAIToolbar, {
          isOpen: true,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('slide Scope');
      expect(html).toContain('Slide Improvements');
      expect(html).toContain('Slide: &quot;Photosynthesis Overview&quot;');
    });
  });

  describe('3. Action Registry & Category Coverage', () => {
    it('contains all 19 defined pedagogical editing actions in registry', () => {
      expect(SLIDE_AI_ACTIONS).toHaveLength(19);

      const actionIds = SLIDE_AI_ACTIONS.map((a) => a.id);
      // Text Improvements
      expect(actionIds).toContain('simplify');
      expect(actionIds).toContain('expand');
      expect(actionIds).toContain('grammar');
      expect(actionIds).toContain('simpler-language');
      expect(actionIds).toContain('concise');
      expect(actionIds).toContain('to-bullets');
      expect(actionIds).toContain('to-paragraph');
      expect(actionIds).toContain('add-example');
      // Teaching Improvements
      expect(actionIds).toContain('add-application');
      expect(actionIds).toContain('add-steps');
      expect(actionIds).toContain('generate-quiz');
      expect(actionIds).toContain('explain-differently');
      expect(actionIds).toContain('identify-misconceptions');
      expect(actionIds).toContain('adjust-grade-level');
      // Slide Improvements
      expect(actionIds).toContain('regenerate-slide');
      expect(actionIds).toContain('improve-title');
      expect(actionIds).toContain('improve-hierarchy');
      expect(actionIds).toContain('suggest-layout');
      expect(actionIds).toContain('reduce-density');
    });

    it('renders text improvement actions in Text category tab', () => {
      mockSelectedObject = mockDocState.lesson.pages[0].objects[1] as TextObject;

      const html = renderToStaticMarkup(
        React.createElement(SlideAIToolbar, {
          isOpen: true,
          onClose: vi.fn(),
          initialScope: 'text',
        })
      );

      expect(html).toContain('Simplify Explanation');
      expect(html).toContain('Expand Explanation');
      expect(html).toContain('Improve Grammar');
      expect(html).toContain('Rewrite in Simpler Language');
      expect(html).toContain('Make Content Concise');
      expect(html).toContain('Convert to Bullet Points');
      expect(html).toContain('Convert to Paragraph');
      expect(html).toContain('Add Educational Example');
    });

    it('renders slide improvement actions in Slide category tab', () => {
      const html = renderToStaticMarkup(
        React.createElement(SlideAIToolbar, {
          isOpen: true,
          onClose: vi.fn(),
          initialScope: 'slide',
        })
      );

      expect(html).toContain('Regenerate Slide Content');
      expect(html).toContain('Improve Slide Title');
      expect(html).toContain('Improve Content Hierarchy');
      expect(html).toContain('Suggest Better Layout');
      expect(html).toContain('Reduce Content Density');
    });
  });

  describe('4. slideEditService Rule-Based Transformations', () => {
    const samplePage = mockDocState.lesson.pages[0];

    it('simplifies wordy phrasing and replaces jargon (simplify)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'simplify',
        scope: 'text',
        content: 'In order to utilize sunlight, plants demonstrate that chlorophyll facilitates energy absorption.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toBe('to use sunlight, plants shows chlorophyll helps energy absorption.');
      expect(res.summary).toContain('Simplified sentence structures');
    });

    it('expands conceptual depth and observational evidence (expand)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'expand',
        scope: 'text',
        content: 'Chloroplasts absorb photons.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('Chloroplasts absorb photons.');
      expect(res.proposedContent).toContain('Furthermore, this principle operates consistently');
    });

    it('fixes grammar, capitalization, and punctuation (grammar)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'grammar',
        scope: 'text',
        content: 'plants capture sunlight . then i saw it work',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('I');
      expect(res.proposedContent).toContain('Plants capture sunlight.');
      expect(res.proposedContent.endsWith('.')).toBe(true);
    });

    it('replaces academic vocabulary with student-friendly words (simpler-language)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'simpler-language',
        scope: 'text',
        content: 'Students must comprehend how plants commence energy transfer.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('understand');
      expect(res.proposedContent).toContain('start');
    });

    it('converts continuous sentences to bullet points (to-bullets)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'to-bullets',
        scope: 'text',
        content: 'First plants absorb water. Second they take in carbon dioxide. Third they capture sunlight.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('• First plants absorb water.');
      expect(res.proposedContent).toContain('• Second they take in carbon dioxide.');
      expect(res.proposedContent).toContain('• Third they capture sunlight.');
    });

    it('converts bullet points into a fluent paragraph (to-paragraph)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'to-paragraph',
        scope: 'text',
        content: '• Absorbs sunlight\n• Splits water molecules\n• Releases oxygen gas',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).not.toContain('•');
      expect(res.proposedContent).toContain('Absorbs sunlight Splits water molecules Releases oxygen gas');
    });

    it('appends educational classroom example (add-example)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'add-example',
        scope: 'text',
        content: 'Gas compression increases internal thermal energy.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('Example:');
      expect(res.proposedContent).toContain('bicycle pump');
    });

    it('adds real-world application (add-application)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'add-application',
        scope: 'card',
        content: 'Light-dependent electron transport produces ATP.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('Real-World Application:');
      expect(res.proposedContent).toContain('energy-efficient technologies');
    });

    it('adds numbered teaching steps (add-steps)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'add-steps',
        scope: 'card',
        content: 'Calculate moles. Determine limiting reagent. Find percentage yield.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('Step 1: Calculate moles.');
      expect(res.proposedContent).toContain('Step 2: Determine limiting reagent.');
      expect(res.proposedContent).toContain('Step 3: Find percentage yield.');
    });

    it('generates knowledge-check quiz question and answer (generate-quiz)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'generate-quiz',
        scope: 'card',
        content: 'Conservation of energy dictates that energy cannot be created or destroyed.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('Check for Understanding:');
      expect(res.proposedContent).toContain('Q:');
      expect(res.proposedContent).toContain('A:');
    });

    it('explains difficult concept differently using analogy (explain-differently)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'explain-differently',
        scope: 'card',
        content: 'Ohm’s law states that V = IR.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('water network');
      expect(res.proposedContent).toContain('Ohm’s law states that V = IR.');
    });

    it('identifies student misconceptions (identify-misconceptions)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'identify-misconceptions',
        scope: 'card',
        content: 'Heat transfer occurs when objects touch.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toContain('Common Misconception:');
    });

    it('improves slide headline (improve-title)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'improve-title',
        scope: 'slide',
        content: 'Photosynthesis',
        page: { ...samplePage, title: 'Cellular Plant Energy Transformation' },
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedTitle).toBe('Cellular Plant Energy: Key Principles');
    });

    it('suggests better layout for classroom presentation (suggest-layout)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'suggest-layout',
        scope: 'slide',
        content: 'Overview of key ideas',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedLayout).toBe('concept-overview');
    });

    it('reduces content density to maximize whitespace (reduce-density)', () => {
      const res = slideEditService.performRuleBasedEdit({
        action: 'reduce-density',
        scope: 'slide',
        content:
          'Sentence one is fundamental. Sentence two gives details. Sentence three explains exceptions. Sentence four adds historical background.',
        page: samplePage,
        pageIndex: 0,
      });

      expect(res.success).toBe(true);
      expect(res.proposedContent).toBe('Sentence one is fundamental. Sentence two gives details.');
    });
  });

  describe('5. Safe Editing Workflow & Atomic CommandSystem Execution', () => {
    it('applies text edit safely via makeUpdateObjectCommand and preserves styling', () => {
      const cs = new CommandSystem();
      const dispatch = vi.fn();
      const setSelectedObj = vi.fn();

      const prevText = mockDocState.lesson.pages[0].objects[1] as TextObject;
      const editResult = slideEditService.performRuleBasedEdit({
        action: 'simplify',
        scope: 'text',
        content: prevText.content,
        page: mockDocState.lesson.pages[0],
        pageIndex: 0,
      });

      // Apply edit
      slideEditService.applyEdit({
        commandSystem: cs,
        dispatch,
        setSelectedObject: setSelectedObj,
        result: editResult,
        pageIndex: 0,
        page: mockDocState.lesson.pages[0],
        selectedObject: prevText,
      });

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_OBJECT',
          pageIndex: 0,
          object: expect.objectContaining({
            id: 'text-body',
            fontSize: 22,
            fontFamily: 'Inter, sans-serif',
            color: '#e2e8f0',
            content: editResult.proposedContent,
          }),
        })
      );
      expect(setSelectedObj).toHaveBeenCalled();
      expect(cs.canUndo()).toBe(true);

      // Single Undo
      cs.undo();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_OBJECT',
          pageIndex: 0,
          object: prevText,
        })
      );

      // Single Redo
      cs.redo();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_OBJECT',
          pageIndex: 0,
          object: expect.objectContaining({ content: editResult.proposedContent }),
        })
      );
    });

    it('applies title improvement via makeRenamePageCommand and text update', () => {
      const cs = new CommandSystem();
      const dispatch = vi.fn();
      const setSelectedObj = vi.fn();

      const page = mockDocState.lesson.pages[0];
      const editResult = slideEditService.performRuleBasedEdit({
        action: 'improve-title',
        scope: 'slide',
        content: page.title,
        page,
        pageIndex: 0,
      });

      slideEditService.applyEdit({
        commandSystem: cs,
        dispatch,
        setSelectedObject: setSelectedObj,
        result: editResult,
        pageIndex: 0,
        page,
      });

      // Should dispatch RENAME_PAGE
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RENAME_PAGE',
          pageIndex: 0,
          title: editResult.proposedTitle,
        })
      );
    });

    it('integrates with documentReducer to update object without touching unrelated objects', () => {
      let state = { ...mockDocState };
      const updatedObject: TextObject = {
        ...(state.lesson.pages[0].objects[1] as TextObject),
        content: 'Clean simplified text.',
      };

      state = documentReducer(state, {
        type: 'UPDATE_OBJECT',
        pageIndex: 0,
        object: updatedObject,
      });

      // Object 1 updated
      expect((state.lesson.pages[0].objects[1] as TextObject).content).toBe('Clean simplified text.');
      // Object 0 untouched
      expect((state.lesson.pages[0].objects[0] as TextObject).content).toBe('Photosynthesis Overview');
      expect(state.isDirty).toBe(true);
    });
  });
});

