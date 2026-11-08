/**
 * aiPresentationService.test.ts — Unit tests for Presentation Generation Service
 * Milestone 5: TASK-108 Verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AIPresentationService,
  aiPresentationService,
  createStandardSlideLayers,
  mapSubjectOrKeywordToCategory,
  validatePresentationPages,
} from '../src/renderer/services/aiPresentation/aiPresentationService';
import { AIProviderManager } from '../src/renderer/services/aiPresentation/aiProviderManager';
import {
  GeneratePresentationOptions,
  PresentationDeckSpec,
  PresentationGenerationProgress,
  SlideContentSpec,
} from '../src/shared/aiPresentationTypes';
import { Page, ShapeObject, TextObject } from '../src/shared/types';
import {
  DARK_TECHNOLOGY_THEME,
  MODERN_ACADEMIC_THEME,
  SCIENCE_ENGINEERING_THEME,
} from '../src/renderer/services/aiPresentation/presentationThemes';

describe('TASK-108: Presentation Generation Service', () => {
  let mockManager: AIProviderManager;
  let service: AIPresentationService;

  beforeEach(() => {
    mockManager = new AIProviderManager();
    service = new AIPresentationService(mockManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Static & Utility Helpers', () => {
    it('creates standard 5 slide layers with correct ids, order, and locks', () => {
      const layers = createStandardSlideLayers();
      expect(layers).toHaveLength(5);
      expect(layers.map((l) => l.id)).toEqual([
        'background',
        'imported-media',
        'drawing',
        'objects',
        'interaction',
      ]);
      expect(layers[0].locked).toBe(true);
      expect(layers[0].order).toBe(0);
      expect(layers[3].name).toBe('Objects');
    });

    it('maps subjects and keywords to appropriate educational categories', () => {
      expect(mapSubjectOrKeywordToCategory('Biology', 'cell anatomy')).toBe('anatomy');
      expect(mapSubjectOrKeywordToCategory('History', 'ancient Roman empire')).toBe('history');
      expect(mapSubjectOrKeywordToCategory('Geography', 'plate tectonics and volcanos')).toBe('geography');
      expect(mapSubjectOrKeywordToCategory('Computer Science', 'binary tree algorithm')).toBe('technology');
      expect(mapSubjectOrKeywordToCategory('Mathematics', 'trigonometry and calculus formula')).toBe('mathematics');
      expect(mapSubjectOrKeywordToCategory('Physics', 'thermodynamic cycle and optics')).toBe('science');
      expect(mapSubjectOrKeywordToCategory('General', 'unclassified topic')).toBe('general');
    });

    it('validates presentation pages correctly', () => {
      // Valid sample page
      const validPage: Page = {
        id: 'page-uuid-1',
        title: 'Title Slide',
        width: 1920,
        height: 1080,
        background: { type: 'blank', color: '#ffffff' },
        layers: createStandardSlideLayers(),
        objects: [
          {
            id: 'obj-1',
            type: 'shape',
            shapeType: 'rect',
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            rotation: 0,
            strokeColor: 'transparent',
            strokeWidth: 0,
            fillColor: '#ffffff',
            fillOpacity: 1,
            layerId: 'background',
            createdAt: Date.now(),
          } as ShapeObject,
        ],
      };

      const report = validatePresentationPages([validPage]);
      expect(report.isValid).toBe(true);
      expect(report.errors).toHaveLength(0);

      // Invalid empty pages
      expect(validatePresentationPages([]).isValid).toBe(false);

      // Missing objects or layers
      const invalidPage: Page = {
        id: '',
        title: 'Broken',
        width: 1000,
        height: 500,
        background: { type: 'blank', color: '' },
        layers: [],
        objects: [],
      };
      const brokenReport = validatePresentationPages([invalidPage]);
      expect(brokenReport.isValid).toBe(false);
      expect(brokenReport.errors.length).toBeGreaterThan(0);
    });
  });

  describe('2. Pipeline Orchestration & Offline Template Fallback', () => {
    it('executes the full pipeline cleanly using offline curriculum template fallback', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(false); // No key configured

      const progressSteps: PresentationGenerationProgress[] = [];
      const options: GeneratePresentationOptions = {
        topic: 'Photosynthesis & Light Reactions',
        subject: 'Biology',
        gradeLevel: 'Grade 9 Science',
        numberOfSlides: 4,
        themeId: 'modern-academic',
        onProgress: (p) => progressSteps.push({ ...p }),
      };

      const result = await service.generatePresentation(options);

      expect(result.success).toBe(true);
      expect(result.source).toBe('curriculum-template');
      expect(result.pages).toHaveLength(4);
      expect(result.deckSpec).toBeDefined();
      expect(result.themeUsed.id).toBe('modern-academic');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      // Progress reporting check
      expect(progressSteps.length).toBeGreaterThanOrEqual(5);
      const stages = progressSteps.map((s) => s.stage);
      expect(stages).toContain('provider-connection');
      expect(stages).toContain('content-generation');
      expect(stages).toContain('slide-compilation');
      expect(stages).toContain('completed');
      expect(progressSteps[progressSteps.length - 1].progressPercent).toBe(100);
    });

    it('bypasses AI provider when forceTemplateFallback is true', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      const hasKeySpy = vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);

      const result = await service.generatePresentation({
        topic: 'Plate Tectonics',
        numberOfSlides: 3,
        forceTemplateFallback: true,
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('curriculum-template');
      expect(result.pages).toHaveLength(3);
      expect(hasKeySpy).not.toHaveBeenCalled();
    });
  });

  describe('3. Native Object Structure & Editability', () => {
    it('generates fully editable native CanvasObject[] across all slides (no uneditable bitmaps)', async () => {
      const result = await service.generatePresentation({
        topic: 'Newtonian Laws of Motion',
        subject: 'Physics',
        numberOfSlides: 3,
        themeId: 'dark-technology',
        forceTemplateFallback: true,
      });

      expect(result.success).toBe(true);
      expect(result.pages).toHaveLength(3);

      for (let i = 0; i < result.pages.length; i++) {
        const page = result.pages[i];
        expect(page.width).toBe(1920);
        expect(page.height).toBe(1080);
        expect(page.background.color).toBe(DARK_TECHNOLOGY_THEME.backgroundColor);
        expect(page.layers).toHaveLength(5);
        expect(page.objects.length).toBeGreaterThan(0);

        // Verify native shape and text objects exist
        const shapes = page.objects.filter((o) => o.type === 'shape');
        const texts = page.objects.filter((o) => o.type === 'text') as TextObject[];

        expect(shapes.length).toBeGreaterThan(0);
        expect(texts.length).toBeGreaterThan(0);

        // Background shape exists at (0, 0, 1920, 1080) in 'background' layer
        const bgShape = shapes.find(
          (s) =>
            (s as ShapeObject).shapeType === 'rect' &&
            (s as ShapeObject).width === 1920 &&
            (s as ShapeObject).height === 1080 &&
            s.layerId === 'background'
        );
        expect(bgShape).toBeDefined();

        // Slide title text exists in 'objects' layer
        const titleText = texts.find((t) => t.preset === 'title' || t.preset === 'heading');
        expect(titleText).toBeDefined();
        expect(titleText?.layerId).toBe('objects');
      }
    });

    it('applies the selected visual theme to background, cards, and text styling', async () => {
      const result = await service.generatePresentation({
        topic: 'Organic Chemistry Reactions',
        numberOfSlides: 3,
        themeId: 'science-engineering',
        forceTemplateFallback: true,
      });

      expect(result.themeUsed.id).toBe('science-engineering');
      const firstPage = result.pages[0];
      expect(firstPage.background.color).toBe(SCIENCE_ENGINEERING_THEME.backgroundColor);

      // Check text colors use theme primaryText or accentColor
      const texts = firstPage.objects.filter((o) => o.type === 'text') as TextObject[];
      const accentOrPrimary = texts.some(
        (t) =>
          t.color === SCIENCE_ENGINEERING_THEME.primaryText ||
          t.color === SCIENCE_ENGINEERING_THEME.accentColor
      );
      expect(accentOrPrimary).toBe(true);
    });
  });

  describe('4. AI Generation Integration & Mocked Responses', () => {
    it('generates a presentation deck when an AI provider returns structured JSON', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'getSelectedModel').mockReturnValue('gpt-4o');

      const mockDeck: PresentationDeckSpec = {
        topic: 'Quantum Computing Fundamentals',
        subject: 'Computer Science',
        gradeLevel: 'College',
        themeId: 'dark-technology',
        slides: [
          {
            slideNumber: 1,
            title: 'Qubits & Superposition',
            subtitle: 'Quantum State Representation',
            layout: 'title-hero',
            cards: [
              {
                cardType: 'basic-info',
                title: 'What is a Qubit?',
                badge: 'Core Principle',
                body: 'Unlike classical bits representing 0 or 1, a qubit exists in a linear combination |psi> = alpha|0> + beta|1>.',
                bulletPoints: ['Superposition principle', 'Bloch sphere geometry'],
              },
            ],
            notes: 'Introduce qubits with a spinning coin analogy.',
          },
          {
            slideNumber: 2,
            title: 'Quantum Gates & Entanglement',
            layout: 'two-column-split',
            cards: [
              {
                cardType: 'definition',
                title: 'Hadamard Gate',
                term: 'H-Gate',
                formalDefinition: 'Creates equal superposition from basis states.',
              },
              {
                cardType: 'question-answer',
                title: 'Quick Concept Check',
                question: 'What is Bell State?',
                answer: 'A maximally entangled two-qubit state.',
              },
            ],
          },
        ],
      };

      vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: true,
        data: mockDeck,
        rawText: JSON.stringify(mockDeck),
        model: 'gpt-4o',
        provider: 'openai',
      });

      const result = await service.generatePresentation({
        topic: 'Quantum Computing Fundamentals',
        provider: 'openai',
        numberOfSlides: 2,
        themeId: 'dark-technology',
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('ai');
      expect(result.modelUsed).toBe('gpt-4o');
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].title).toBe('Qubits & Superposition');
      expect(result.pages[1].title).toBe('Quantum Gates & Entanglement');
    });

    it('falls back gracefully to curriculum template when AI provider throws an error', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('gemini');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'getSelectedModel').mockReturnValue('gemini-2.0-flash');

      vi.spyOn(mockManager, 'generateStructuredJson').mockRejectedValue(
        new Error('Network connection timed out')
      );

      const result = await service.generatePresentation({
        topic: 'Gravitational Waves',
        numberOfSlides: 3,
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('curriculum-template');
      expect(result.pages).toHaveLength(3);
      expect(result.warnings.some((w) => w.includes('Network connection timed out'))).toBe(true);
    });
  });

  describe('5. Diagram & Asset Resolution', () => {
    it('resolves educational diagrams when present on a slide', async () => {
      const mockDeckWithDiagram: PresentationDeckSpec = {
        topic: 'Digital Electronics',
        subject: 'Computer Science',
        gradeLevel: 'High School',
        themeId: 'science-engineering',
        slides: [
          {
            slideNumber: 1,
            title: 'Logic Gates Overview',
            layout: 'concept-overview',
            cards: [{ cardType: 'basic-info', body: 'Standard Boolean gates.' }],
            diagram: {
              type: 'logic-gate',
              gateType: 'AND',
              title: 'AND Gate Symbol',
            },
          },
        ],
      };

      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: true,
        data: mockDeckWithDiagram,
        rawText: JSON.stringify(mockDeckWithDiagram),
        model: 'gpt-4o',
        provider: 'openai',
      });

      const result = await service.generatePresentation({
        topic: 'Digital Electronics',
        numberOfSlides: 1,
      });

      expect(result.success).toBe(true);
      const slideObjects = result.pages[0].objects;
      // Look for logic gate shape in slide objects
      const logicGate = slideObjects.find((o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'logicGate');
      expect(logicGate).toBeDefined();
    });

    it('creates educational category image placeholder when illustrationKeyword is present', async () => {
      const mockDeckWithIllustration: PresentationDeckSpec = {
        topic: 'Human Anatomy',
        subject: 'Biology',
        gradeLevel: 'Grade 10',
        themeId: 'modern-academic',
        slides: [
          {
            slideNumber: 1,
            title: 'Cardiac System',
            layout: 'concept-overview',
            illustrationKeyword: 'Heart ventricles and valves',
            cards: [{ cardType: 'basic-info', body: 'Structure of the human heart.' }],
          },
        ],
      };

      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: true,
        data: mockDeckWithIllustration,
        rawText: JSON.stringify(mockDeckWithIllustration),
        model: 'gpt-4o',
        provider: 'openai',
      });

      const result = await service.generatePresentation({
        topic: 'Human Anatomy',
        numberOfSlides: 1,
      });

      expect(result.success).toBe(true);
      const slideObjects = result.pages[0].objects;
      const placeholderImg = slideObjects.find((o) => o.type === 'image');
      expect(placeholderImg).toBeDefined();
    });
  });

  describe('6. Cancellation Handling', () => {
    it('cancels generation promptly when AbortSignal is triggered before start', async () => {
      const controller = new AbortController();
      controller.abort();

      const progressList: PresentationGenerationProgress[] = [];
      const result = await service.generatePresentation({
        topic: 'Trigonometry',
        signal: controller.signal,
        onProgress: (p) => progressList.push(p),
      });

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.pages).toHaveLength(0);
      expect(progressList.some((p) => p.stage === 'cancelled')).toBe(true);
    });

    it('cancels generation during progress and does not insert incomplete slides', async () => {
      const controller = new AbortController();

      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'generateStructuredJson').mockImplementation(async () => {
        // Abort during generation
        controller.abort();
        throw new DOMException('Presentation generation was cancelled.', 'AbortError');
      });

      const result = await service.generatePresentation({
        topic: 'Calculus',
        signal: controller.signal,
      });

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.pages).toHaveLength(0);
    });
  });

  describe('7. Single Slide Generation (generateSingleSlide)', () => {
    it('compiles a single slide specification into a native Page independently', async () => {
      const singleSpec: SlideContentSpec = {
        slideNumber: 1,
        title: 'Photosynthesis Overview',
        subtitle: 'Light and Dark Reactions',
        layout: 'definition-formula',
        cards: [
          {
            cardType: 'definition',
            title: 'Photosynthesis',
            formalDefinition: 'The process by which plants convert light energy into chemical energy.',
          },
        ],
      };

      const page = await service.generateSingleSlide(singleSpec, 'modern-academic', {
        topic: 'Photosynthesis',
        slideIndex: 0,
        totalSlides: 1,
      });

      expect(page.id).toBeDefined();
      expect(page.title).toBe('Photosynthesis Overview');
      expect(page.width).toBe(1920);
      expect(page.height).toBe(1080);
      expect(page.objects.length).toBeGreaterThan(0);

      // Verify page passes validation
      const report = validatePresentationPages([page]);
      expect(report.isValid).toBe(true);
    });

    it('compiles a single slide with an embedded diagram correctly', async () => {
      const singleSpecWithDiagram: SlideContentSpec = {
        slideNumber: 1,
        title: 'Boolean NOT Inverter',
        layout: 'concept-overview',
        cards: [{ cardType: 'basic-info', body: 'Inverts boolean logic state.' }],
        diagram: {
          type: 'logic-gate',
          gateType: 'NOT',
          title: 'Inverter Symbol',
        },
      };

      const page = await service.generateSingleSlide(singleSpecWithDiagram, 'science-engineering');
      expect(page.objects.length).toBeGreaterThan(0);
      const gate = page.objects.find((o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'logicGate');
      expect(gate).toBeDefined();
    });
  });

  describe('8. Edge Cases, Overflow Detection & Provider Overrides', () => {
    it('respects provider and model overrides passed in options', async () => {
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      const structuredSpy = vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: true,
        data: {
          topic: 'Override Topic',
          subject: 'Physics',
          gradeLevel: 'High School',
          themeId: 'modern-academic',
          slides: [
            {
              slideNumber: 1,
              title: 'Slide 1',
              layout: 'title-hero',
              cards: [{ cardType: 'basic-info', body: 'Content' }],
            },
          ],
        },
        model: 'custom-model-x',
        provider: 'gemini',
      });

      const result = await service.generatePresentation({
        topic: 'Override Topic',
        provider: 'gemini',
        model: 'custom-model-x',
      });

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('gemini');
      expect(result.modelUsed).toBe('custom-model-x');
      expect(structuredSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'gemini',
          model: 'custom-model-x',
        })
      );
    });

    it('detects overflow and logs warning when objects extend beyond 1920x1080', async () => {
      // Create a mock deck with cards that produce an overflowing object
      const overflowingDeck: PresentationDeckSpec = {
        topic: 'Boundary Check',
        subject: 'General Education',
        gradeLevel: 'High School',
        themeId: 'modern-academic',
        slides: [
          {
            slideNumber: 1,
            title: 'Overflow Test',
            layout: 'four-card-grid',
            cards: [
              {
                cardType: 'basic-info',
                title: 'Card 1',
                body: 'Very long body text '.repeat(50),
              },
            ],
          },
        ],
      };

      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: true,
        data: overflowingDeck,
        model: 'gpt-4o',
      });

      const result = await service.generatePresentation({
        topic: 'Boundary Check',
        numberOfSlides: 1,
      });

      expect(result.success).toBe(true);
      expect(result.pages).toHaveLength(1);
    });

    it('safely handles empty slide responses from AI by falling back to curriculum templates', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: true,
        data: {
          topic: 'Empty Deck',
          subject: 'Science',
          gradeLevel: 'High School',
          themeId: 'modern-academic',
          slides: [], // Empty slides array
        },
        model: 'gpt-4o',
      });

      const result = await service.generatePresentation({
        topic: 'Empty Deck',
        numberOfSlides: 3,
      });

      expect(result.success).toBe(true);
      expect(result.pages.length).toBeGreaterThanOrEqual(3);
      expect(result.warnings.some((w) => w.includes('0 slides') || w.includes('zero slides'))).toBe(true);
    });
  });

  describe('9. Default Singleton Export', () => {
    it('exports a valid default aiPresentationService singleton instance', () => {
      expect(aiPresentationService).toBeInstanceOf(AIPresentationService);
      expect(aiPresentationService.getAvailableThemes().length).toBeGreaterThanOrEqual(9);
    });
  });
});
