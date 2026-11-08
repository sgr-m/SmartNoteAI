/**
 * slideDeckPreview.test.ts — Unit tests for Presentation Slide Preview & Atomic Insertion
 * Milestone 5: TASK-110 Verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SlideDeckPreview,
  SlideCanvasPreview,
} from '../src/renderer/components/aiPresentation/SlideDeckPreview';
import {
  makeInsertPagesCommand,
  CommandSystem,
} from '../src/renderer/engine/CommandSystem';
import {
  documentReducer,
  initialDocumentState,
  createDefaultPage,
  serializeLesson,
  deserializeLesson,
} from '../src/renderer/store/documentStore';
import {
  Page,
  ShapeObject,
  TextObject,
  ImageObject,
  StrokeObject,
  GroupObject,
} from '../src/shared/types';
import {
  PresentationDeckSpec,
  PresentationGenerationResult,
} from '../src/shared/aiPresentationTypes';
import { MODERN_ACADEMIC_THEME } from '../src/renderer/services/aiPresentation/presentationThemes';

// Mock AppContext
const mockDocDispatch = vi.fn();
const mockSetToastMessage = vi.fn();
const mockCommandSystem = new CommandSystem();

let mockDocState = {
  ...initialDocumentState,
  lesson: {
    ...initialDocumentState.lesson,
    pages: [
      {
        ...createDefaultPage(),
        id: 'original-page-1',
        title: 'Original Slide 1',
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
    setToastMessage: mockSetToastMessage,
  }),
}));

function createSampleGeneratedPages(): Page[] {
  const page1: Page = {
    id: 'ai-page-1',
    title: 'Introduction to Photosynthesis',
    width: 1920,
    height: 1080,
    background: { type: 'blank', color: '#0f172a' },
    layers: [
      { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
      { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
      { id: 'drawing', name: 'Drawing', visible: true, locked: false, opacity: 1, order: 2 },
      { id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 3 },
      { id: 'interaction', name: 'Interaction', visible: true, locked: false, opacity: 1, order: 4 },
    ],
    objects: [
      {
        id: 'shape-header-card',
        type: 'shape',
        shapeType: 'roundedRect',
        x: 80,
        y: 80,
        width: 1760,
        height: 140,
        fillColor: '#1e293b',
        fillOpacity: 0.9,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        rotation: 0,
      } as ShapeObject,
      {
        id: 'text-slide-title',
        type: 'text',
        x: 120,
        y: 110,
        width: 1680,
        height: 50,
        content: 'Photosynthesis: Harnessing Sunlight',
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
        id: 'text-slide-subtitle',
        type: 'text',
        x: 120,
        y: 165,
        width: 1680,
        height: 30,
        content: 'The biological engine converting light energy into chemical energy',
        fontFamily: 'Inter, sans-serif',
        fontSize: 20,
        fontWeight: 400,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#94a3b8',
        backgroundColor: 'transparent',
      } as TextObject,
    ],
    transition: { type: 'none', duration: 300 },
  };

  const page2: Page = {
    id: 'ai-page-2',
    title: 'The Chemical Equation',
    width: 1920,
    height: 1080,
    background: { type: 'blank', color: '#0f172a' },
    layers: [
      { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
      { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
      { id: 'drawing', name: 'Drawing', visible: true, locked: false, opacity: 1, order: 2 },
      { id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 3 },
      { id: 'interaction', name: 'Interaction', visible: true, locked: false, opacity: 1, order: 4 },
    ],
    objects: [
      {
        id: 'shape-equation-card',
        type: 'shape',
        shapeType: 'roundedRect',
        x: 80,
        y: 280,
        width: 1760,
        height: 240,
        fillColor: '#1e293b',
        fillOpacity: 0.9,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        rotation: 0,
      } as ShapeObject,
      {
        id: 'text-equation',
        type: 'text',
        x: 120,
        y: 350,
        width: 1680,
        height: 60,
        content: '6CO2 + 6H2O + Light -> C6H12O6 + 6O2',
        fontFamily: 'Inter, sans-serif',
        fontSize: 32,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#38bdf8',
        backgroundColor: 'transparent',
      } as TextObject,
    ],
    transition: { type: 'none', duration: 300 },
  };

  const page3: Page = {
    id: 'ai-page-3',
    title: 'Check for Understanding',
    width: 1920,
    height: 1080,
    background: { type: 'blank', color: '#0f172a' },
    layers: [
      { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
      { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
      { id: 'drawing', name: 'Drawing', visible: true, locked: false, opacity: 1, order: 2 },
      { id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 3 },
      { id: 'interaction', name: 'Interaction', visible: true, locked: false, opacity: 1, order: 4 },
    ],
    objects: [],
    transition: { type: 'none', duration: 300 },
  };

  return [page1, page2, page3];
}

function createSamplePresentationResult(): PresentationGenerationResult {
  const pages = createSampleGeneratedPages();
  const deckSpec: PresentationDeckSpec = {
    topic: 'Photosynthesis in Plants',
    gradeLevel: 'Grade 9-10 (High School)',
    subject: 'Biology',
    themeId: 'modern-academic',
    slides: [
      {
        slideNumber: 1,
        title: 'Introduction to Photosynthesis',
        subtitle: 'The biological engine converting light energy into chemical energy',
        layout: 'title-hero',
        notes: 'Welcome class. Today we will explore how chloroplasts capture photons.',
      },
      {
        slideNumber: 2,
        title: 'The Chemical Equation',
        layout: 'definition-formula',
        notes: 'Emphasize the stoichiometry of 6 carbon dioxide and 6 water molecules.',
      },
      {
        slideNumber: 3,
        title: 'Check for Understanding',
        layout: 'summary-quiz',
        notes: 'Ask students what the byproduct gas released into the atmosphere is.',
        cards: [
          {
            cardType: 'question-answer',
            title: 'Concept Check',
            content: 'What gas is produced as a byproduct of the light-dependent reactions?',
            revealPrompt: 'Oxygen (O2)',
          },
        ],
      },
    ],
    isTemplateFallback: false,
    source: 'ai',
  };

  return {
    success: true,
    pages,
    deckSpec,
    source: 'ai',
    themeUsed: MODERN_ACADEMIC_THEME,
    durationMs: 1200,
    warnings: [],
  };
}

describe('TASK-110: Slide Deck Preview & Atomic Insertion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDocDispatch.mockClear();
    mockSetToastMessage.mockClear();
    mockDocState = {
      ...initialDocumentState,
      lesson: {
        ...initialDocumentState.lesson,
        pages: [
          {
            ...createDefaultPage(),
            id: 'original-page-1',
            title: 'Original Slide 1',
          },
        ],
      },
      currentPageIndex: 0,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Preview Modal Rendering & Visibility', () => {
    it('returns empty markup when isOpen is false', () => {
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: false,
          presentationResult: createSamplePresentationResult(),
          onClose: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('returns empty markup when pages are empty', () => {
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          pages: [],
          onClose: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('renders modal dialog with ARIA attributes and title when isOpen is true', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('slide-deck-preview-backdrop');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('Photosynthesis in Plants');
      expect(html).toContain('3 Slides');
    });

    it('renders "← Edit Options" button when onBackToGenerator is supplied', () => {
      const result = createSamplePresentationResult();
      const onBackToGenerator = vi.fn();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
          onBackToGenerator,
        })
      );

      expect(html).toContain('sdp-back-btn');
      expect(html).toContain('← Edit Options');
    });

    it('displays curriculum template fallback badge when isTemplateFallback is true', () => {
      const result = createSamplePresentationResult();
      result.deckSpec!.isTemplateFallback = true;
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('pill-fallback');
      expect(html).toContain('Curriculum Template');
    });
  });

  describe('2. Slide Navigation & Filmstrip Thumbnails', () => {
    it('displays slide counter badge for slide 1 initially', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('1 / 3');
      expect(html).toContain('Introduction to Photosynthesis');
    });

    it('renders filmstrip with all slide thumbnails and numbers', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('sdp-filmstrip-bar');
      expect(html).toContain('#1');
      expect(html).toContain('#2');
      expect(html).toContain('#3');
      expect(html).toContain('Introduction to Photosynthesis');
      expect(html).toContain('The Chemical Equation');
      expect(html).toContain('Check for Understanding');
    });

    it('disables previous button on the first slide', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      // Previous button should have disabled attribute
      expect(html).toMatch(/sdp-nav-prev[^>]*disabled/);
    });
  });

  describe('3. Slide Inspector & Pedagogical Script', () => {
    it('displays slide title, layout, and element breakdown', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('Slide Inspector');
      expect(html).toContain('title hero');
      expect(html).toContain('3 Native Objects');
      expect(html).toContain('1'); // 1 shape
      expect(html).toContain('2'); // 2 text elements
    });

    it('renders teacher lecture script from slide notes', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain("Teacher&#x27;s Script &amp; Notes");
      expect(html).toContain('Welcome class. Today we will explore how chloroplasts capture photons.');
    });

    it('displays interactive check-for-understanding quiz question in inspector', () => {
      const result = createSamplePresentationResult();
      // Set active slide spec directly by passing a 1-slide result with quiz
      const quizResult: PresentationGenerationResult = {
        ...result,
        pages: [result.pages[2]],
        deckSpec: {
          ...result.deckSpec!,
          slides: [result.deckSpec!.slides[2]],
        },
      };

      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: quizResult,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('Interactive Activity');
      expect(html).toContain('Check for Understanding');
      expect(html).toContain('Oxygen (O2)');
    });
  });

  describe('4. Slide Selection & Footer Controls', () => {
    it('includes all slides by default in footer statistics', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('Selected: <strong>3</strong> of 3 slides');
      expect(html).toContain('Insert Selected (3)');
    });

    it('renders Quick Selection buttons for Select All and Deselect All', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('Select All');
      expect(html).toContain('Deselect All');
    });

    it('renders insert location selector with After Current and Append options', () => {
      const result = createSamplePresentationResult();
      const html = renderToStaticMarkup(
        React.createElement(SlideDeckPreview, {
          isOpen: true,
          presentationResult: result,
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('Insert Location:');
      expect(html).toContain('After Current Slide (Slide 1)');
      expect(html).toContain('Append to End of Lesson (Slide 2)');
    });
  });

  describe('5. High-Fidelity SlideCanvasPreview Component', () => {
    it('renders 1920x1080 viewBox SVG with background rectangle', () => {
      const pages = createSampleGeneratedPages();
      const html = renderToStaticMarkup(
        React.createElement(SlideCanvasPreview, { page: pages[0] })
      );

      expect(html).toContain('viewBox="0 0 1920 1080"');
      expect(html).toContain('fill="#0f172a"');
    });

    it('renders rounded rectangles and text elements with exact coordinates', () => {
      const pages = createSampleGeneratedPages();
      const html = renderToStaticMarkup(
        React.createElement(SlideCanvasPreview, { page: pages[0] })
      );

      expect(html).toContain('<rect');
      expect(html).toContain('rx="14"');
      expect(html).toContain('width="1760"');
      expect(html).toContain('height="140"');
      expect(html).toContain('Photosynthesis: Harnessing Sunlight');
    });

    it('renders multi-line text with tspans', () => {
      const multiLinePage: Page = {
        ...createDefaultPage(),
        objects: [
          {
            id: 'multi-text',
            type: 'text',
            x: 100,
            y: 200,
            width: 800,
            height: 200,
            content: 'Line 1: Carbon Dioxide\nLine 2: Water Vapor\nLine 3: Sunlight Energy',
            fontSize: 24,
            color: '#ffffff',
            fontFamily: 'Inter',
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            backgroundColor: 'transparent',
          } as TextObject,
        ],
      };

      const html = renderToStaticMarkup(
        React.createElement(SlideCanvasPreview, { page: multiLinePage })
      );

      expect(html).toContain('<tspan');
      expect(html).toContain('Line 1: Carbon Dioxide');
      expect(html).toContain('Line 2: Water Vapor');
      expect(html).toContain('Line 3: Sunlight Energy');
    });

    it('renders image objects with dataUrl', () => {
      const imagePage: Page = {
        ...createDefaultPage(),
        objects: [
          {
            id: 'sample-img',
            type: 'image',
            x: 200,
            y: 300,
            width: 400,
            height: 300,
            dataUrl: 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E',
            opacity: 0.9,
          } as ImageObject,
        ],
      };

      const html = renderToStaticMarkup(
        React.createElement(SlideCanvasPreview, { page: imagePage })
      );

      expect(html).toContain('<image');
      expect(html).toContain('href="data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E"');
      expect(html).toContain('width="400"');
      expect(html).toContain('height="300"');
    });

    it('renders stroke ink objects and group objects', () => {
      const groupPage: Page = {
        ...createDefaultPage(),
        objects: [
          {
            id: 'group-1',
            type: 'group',
            objects: [
              {
                id: 'stroke-1',
                type: 'stroke',
                points: [{ x: 10, y: 10 }, { x: 50, y: 50 }],
                style: {
                  penType: 'normal',
                  color: '#38bdf8',
                  width: 3,
                  opacity: 1,
                  smoothing: 0.5,
                  pressureSensitive: false,
                },
              } as StrokeObject,
            ],
          } as GroupObject,
        ],
      };

      const html = renderToStaticMarkup(
        React.createElement(SlideCanvasPreview, { page: groupPage })
      );

      expect(html).toContain('<g');
      expect(html).toContain('<path');
      expect(html).toContain('d="M 10 10 L 50 50"');
      expect(html).toContain('stroke="#38bdf8"');
    });
  });

  describe('6. makeInsertPagesCommand & CommandSystem Reversibility', () => {
    it('creates an atomic command with unique id and description', () => {
      const pages = createSampleGeneratedPages();
      const dispatch = vi.fn();
      const cmd = makeInsertPagesCommand({
        dispatch,
        pages,
        afterIndex: 0,
        previousPageIndex: 0,
      });

      expect(cmd.id).toBeDefined();
      expect(cmd.description).toBe('Insert 3 Slides');
      expect(typeof cmd.execute).toBe('function');
      expect(typeof cmd.undo).toBe('function');
    });

    it('executes INSERT_PAGES action with pages and after index', () => {
      const pages = createSampleGeneratedPages();
      const dispatch = vi.fn();
      const cmd = makeInsertPagesCommand({
        dispatch,
        pages,
        afterIndex: 2,
        previousPageIndex: 1,
      });

      cmd.execute();
      expect(dispatch).toHaveBeenCalledWith({
        type: 'INSERT_PAGES',
        pages,
        after: 2,
      });
    });

    it('undoes by dispatching DELETE_PAGES_BY_ID and restoring previousPageIndex', () => {
      const pages = createSampleGeneratedPages();
      const dispatch = vi.fn();
      const cmd = makeInsertPagesCommand({
        dispatch,
        pages,
        afterIndex: 0,
        previousPageIndex: 0,
      });

      cmd.undo();
      expect(dispatch).toHaveBeenCalledWith({
        type: 'DELETE_PAGES_BY_ID',
        pageIds: ['ai-page-1', 'ai-page-2', 'ai-page-3'],
      });
      expect(dispatch).toHaveBeenCalledWith({
        type: 'GOTO_PAGE',
        index: 0,
      });
    });

    it('integrates with CommandSystem stack for single-step undo and redo', () => {
      const cs = new CommandSystem();
      const dispatch = vi.fn();
      const pages = createSampleGeneratedPages();

      const cmd = makeInsertPagesCommand({
        dispatch,
        pages,
        afterIndex: 0,
        previousPageIndex: 0,
      });

      // Execute via CommandSystem
      cs.execute(cmd);
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(cs.canUndo()).toBe(true);
      expect(cs.canRedo()).toBe(false);

      // Single Undo
      cs.undo();
      expect(dispatch).toHaveBeenCalledTimes(3); // 1 execute + 2 undo calls (DELETE_PAGES_BY_ID, GOTO_PAGE)
      expect(cs.canUndo()).toBe(false);
      expect(cs.canRedo()).toBe(true);

      // Single Redo
      cs.redo();
      expect(dispatch).toHaveBeenCalledTimes(4); // + 1 execute
      expect(cs.canUndo()).toBe(true);
      expect(cs.canRedo()).toBe(false);
    });
  });

  describe('7. DocumentStore Reducer Integration & Integrity', () => {
    it('inserts pages at specified index and updates currentPageIndex', () => {
      let state = {
        ...initialDocumentState,
        lesson: {
          ...initialDocumentState.lesson,
          pages: [
            { ...createDefaultPage(), id: 'orig-1', title: 'Page 1' },
            { ...createDefaultPage(), id: 'orig-2', title: 'Page 2' },
          ],
        },
        currentPageIndex: 0,
      };

      const newPages = createSampleGeneratedPages();
      state = documentReducer(state, {
        type: 'INSERT_PAGES',
        pages: newPages,
        after: 0, // Insert after slide 1
      });

      expect(state.lesson.pages).toHaveLength(5);
      expect(state.lesson.pages[0].id).toBe('orig-1');
      expect(state.lesson.pages[1].id).toBe('ai-page-1');
      expect(state.lesson.pages[2].id).toBe('ai-page-2');
      expect(state.lesson.pages[3].id).toBe('ai-page-3');
      expect(state.lesson.pages[4].id).toBe('orig-2');
      expect(state.currentPageIndex).toBe(1); // Navigates to first inserted slide
      expect(state.isDirty).toBe(true);
    });

    it('appends pages to the end of the lesson when after is not provided or set to last page', () => {
      let state = {
        ...initialDocumentState,
        lesson: {
          ...initialDocumentState.lesson,
          pages: [{ ...createDefaultPage(), id: 'orig-1', title: 'Page 1' }],
        },
        currentPageIndex: 0,
      };

      const newPages = createSampleGeneratedPages();
      state = documentReducer(state, {
        type: 'INSERT_PAGES',
        pages: newPages,
        after: 0,
      });

      expect(state.lesson.pages).toHaveLength(4);
      expect(state.lesson.pages[0].id).toBe('orig-1');
      expect(state.lesson.pages[3].id).toBe('ai-page-3');
    });

    it('reverses insertion completely using DELETE_PAGES_BY_ID', () => {
      let state = {
        ...initialDocumentState,
        lesson: {
          ...initialDocumentState.lesson,
          pages: [{ ...createDefaultPage(), id: 'orig-1', title: 'Page 1' }],
        },
        currentPageIndex: 0,
      };

      const newPages = createSampleGeneratedPages();
      // Step 1: Insert
      state = documentReducer(state, {
        type: 'INSERT_PAGES',
        pages: newPages,
        after: 0,
      });
      expect(state.lesson.pages).toHaveLength(4);

      // Step 2: Undo via DELETE_PAGES_BY_ID
      state = documentReducer(state, {
        type: 'DELETE_PAGES_BY_ID',
        pageIds: ['ai-page-1', 'ai-page-2', 'ai-page-3'],
      });

      expect(state.lesson.pages).toHaveLength(1);
      expect(state.lesson.pages[0].id).toBe('orig-1');
      expect(state.currentPageIndex).toBe(0);
    });

    it('creates default page if all pages are deleted by DELETE_PAGES_BY_ID', () => {
      let state = {
        ...initialDocumentState,
        lesson: {
          ...initialDocumentState.lesson,
          pages: [{ ...createDefaultPage(), id: 'only-page', title: 'Page 1' }],
        },
        currentPageIndex: 0,
      };

      state = documentReducer(state, {
        type: 'DELETE_PAGES_BY_ID',
        pageIds: ['only-page'],
      });

      expect(state.lesson.pages).toHaveLength(1);
      expect(state.lesson.pages[0].id).not.toBe('only-page');
    });

    it('preserves all inserted presentation objects across serializeLesson and deserializeLesson', () => {
      let state = {
        ...initialDocumentState,
        lesson: {
          ...initialDocumentState.lesson,
          pages: [{ ...createDefaultPage(), id: 'orig-1', title: 'Page 1' }],
        },
        currentPageIndex: 0,
      };

      const newPages = createSampleGeneratedPages();
      state = documentReducer(state, {
        type: 'INSERT_PAGES',
        pages: newPages,
        after: 0,
      });

      const serialized = serializeLesson(state.lesson);
      const deserialized = deserializeLesson(serialized);

      expect(deserialized.pages).toHaveLength(4);
      expect(deserialized.pages[1].title).toBe('Introduction to Photosynthesis');
      expect(deserialized.pages[1].objects).toHaveLength(3);
      expect(deserialized.pages[1].objects[0].id).toBe('shape-header-card');
      expect((deserialized.pages[1].objects[0] as ShapeObject).strokeColor).toBe('#38bdf8');
      expect((deserialized.pages[1].objects[1] as TextObject).content).toBe(
        'Photosynthesis: Harnessing Sunlight'
      );
    });
  });
});
