/**
 * promptTemplates.test.ts — Unit tests for Pedagogical Content Generation Pipeline
 * Milestone 5: TASK-107 Verification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectSubjectFromTopic,
  normalizeTeacherInput,
  planPedagogicalSequence,
  buildTeachingPresentationPrompt,
  validateDeckContent,
  generateCurriculumTemplateFallback,
  generateTeachingContent,
  ALLOWED_LAYOUT_TYPES,
  ALLOWED_CARD_TYPES,
  DEFAULT_GRADE_LEVEL,
  DEFAULT_LANGUAGE,
  DEFAULT_DIFFICULTY,
  DEFAULT_TEACHING_STYLE,
  DEFAULT_SLIDE_COUNT,
} from '../src/renderer/services/aiPresentation/promptTemplates';
import { AIProviderManager } from '../src/renderer/services/aiPresentation/aiProviderManager';
import { PresentationDeckSpec } from '../src/shared/aiPresentationTypes';

describe('TASK-107: Structured Teaching Content Generation', () => {
  describe('1. Subject Auto-Detection', () => {
    it('detects Physics topics from keywords', () => {
      expect(detectSubjectFromTopic("Newton's Third Law of Motion")).toBe('Physics');
      expect(detectSubjectFromTopic('Quantum Mechanics and Wave Optics')).toBe('Physics');
      expect(detectSubjectFromTopic('Electric Circuit Analysis and Energy')).toBe('Physics');
    });

    it('detects Chemistry topics from keywords', () => {
      expect(detectSubjectFromTopic('Chemical Bonding and Molecular Geometry')).toBe('Chemistry');
      expect(detectSubjectFromTopic('Acid-Base Equilibrium and Stoichiometry')).toBe('Chemistry');
      expect(detectSubjectFromTopic('Periodic Table Trends')).toBe('Chemistry');
    });

    it('detects Biology topics from keywords', () => {
      expect(detectSubjectFromTopic('Cellular Respiration and Photosynthesis')).toBe('Biology');
      expect(detectSubjectFromTopic('DNA Replication and Genetics')).toBe('Biology');
      expect(detectSubjectFromTopic('Mitosis and Human Anatomy')).toBe('Biology');
    });

    it('detects Mathematics topics from keywords', () => {
      expect(detectSubjectFromTopic('Pythagorean Theorem and Trigonometry')).toBe('Mathematics');
      expect(detectSubjectFromTopic('Differential Calculus and Derivatives')).toBe('Mathematics');
      expect(detectSubjectFromTopic('Probability and Statistics')).toBe('Mathematics');
    });

    it('detects Computer Science topics from keywords', () => {
      expect(detectSubjectFromTopic('Binary Search Trees and Algorithms')).toBe('Computer Science');
      expect(detectSubjectFromTopic('Python Programming and Data Structures')).toBe('Computer Science');
      expect(detectSubjectFromTopic('Relational Database and Sorting')).toBe('Computer Science');
    });

    it('detects History, Geography, and Literature topics', () => {
      expect(detectSubjectFromTopic('The French Revolution and 18th Century')).toBe('History');
      expect(detectSubjectFromTopic('Plate Tectonics and Volcanic Biomes')).toBe('Geography');
      expect(detectSubjectFromTopic('Shakespearean Metaphors and Poetry')).toBe('Literature');
    });

    it('defaults to General Education when topic has no domain keywords', () => {
      expect(detectSubjectFromTopic('Effective Time Management')).toBe('General Education');
      expect(detectSubjectFromTopic('Public Speaking Essentials')).toBe('General Education');
    });
  });

  describe('2. Teacher Input Normalization', () => {
    it('normalizes minimal input with standard defaults', () => {
      const normalized = normalizeTeacherInput({ topic: 'Photosynthesis' });

      expect(normalized.topic).toBe('Photosynthesis');
      expect(normalized.subject).toBe('Biology');
      expect(normalized.gradeLevel).toBe(DEFAULT_GRADE_LEVEL);
      expect(normalized.language).toBe(DEFAULT_LANGUAGE);
      expect(normalized.difficulty).toBe(DEFAULT_DIFFICULTY);
      expect(normalized.teachingStyle).toBe(DEFAULT_TEACHING_STYLE);
      expect(normalized.numberOfSlides).toBe(DEFAULT_SLIDE_COUNT);
      expect(normalized.durationMinutes).toBe(25); // 5 * 5
      expect(normalized.themeId).toBe('modern-academic');
      expect(normalized.learningObjectives).toEqual([]);
      expect(normalized.additionalInstructions).toBe('');
    });

    it('clamps numberOfSlides strictly between 3 and 15', () => {
      expect(normalizeTeacherInput({ topic: 'Test', numberOfSlides: 1 }).numberOfSlides).toBe(3);
      expect(normalizeTeacherInput({ topic: 'Test', numberOfSlides: 2 }).numberOfSlides).toBe(3);
      expect(normalizeTeacherInput({ topic: 'Test', numberOfSlides: 15 }).numberOfSlides).toBe(15);
      expect(normalizeTeacherInput({ topic: 'Test', numberOfSlides: 30 }).numberOfSlides).toBe(15);
      expect(normalizeTeacherInput({ topic: 'Test', numberOfSlides: -5 }).numberOfSlides).toBe(3);
    });

    it('parses learning objectives from arrays or delimited strings', () => {
      const fromArr = normalizeTeacherInput({
        topic: 'Test',
        learningObjectives: [' Understand photosynthesis ', 'Identify light reactions', ''],
      });
      expect(fromArr.learningObjectives).toEqual(['Understand photosynthesis', 'Identify light reactions']);

      const fromStr = normalizeTeacherInput({
        topic: 'Test',
        learningObjectives: 'Define velocity; Calculate acceleration, Distinguish speed from velocity\nGraph motion',
      });
      expect(fromStr.learningObjectives).toEqual([
        'Define velocity',
        'Calculate acceleration',
        'Distinguish speed from velocity',
        'Graph motion',
      ]);
    });

    it('preserves teacher customizations for subject, grade, theme, and style', () => {
      const custom = normalizeTeacherInput({
        topic: 'Linear Algebra',
        subject: 'Advanced Mathematics',
        gradeLevel: 'College / Undergraduate',
        language: 'Spanish',
        difficulty: 'advanced',
        teachingStyle: 'socratic',
        numberOfSlides: 8,
        durationMinutes: 45,
        themeId: 'dark-technology',
        additionalInstructions: 'Focus on eigenvalue decomposition proofs.',
      });

      expect(custom.subject).toBe('Advanced Mathematics');
      expect(custom.gradeLevel).toBe('College / Undergraduate');
      expect(custom.language).toBe('Spanish');
      expect(custom.difficulty).toBe('advanced');
      expect(custom.teachingStyle).toBe('socratic');
      expect(custom.numberOfSlides).toBe(8);
      expect(custom.durationMinutes).toBe(45);
      expect(custom.themeId).toBe('dark-technology');
      expect(custom.additionalInstructions).toBe('Focus on eigenvalue decomposition proofs.');
    });
  });

  describe('3. Pedagogical Sequence Planner', () => {
    it('plans 3-slide sequence with Hook, Core Concept, and Quiz', () => {
      const seq = planPedagogicalSequence(3, 'Physics');
      expect(seq).toHaveLength(3);
      expect(seq[0].slideNumber).toBe(1);
      expect(seq[0].recommendedLayout).toBe('title-hero');
      expect(seq[1].slideNumber).toBe(2);
      expect(seq[1].recommendedLayout).toBe('two-column-split');
      expect(seq[2].slideNumber).toBe(3);
      expect(seq[2].recommendedLayout).toBe('summary-quiz');
    });

    it('plans 4-slide sequence', () => {
      const seq = planPedagogicalSequence(4, 'Chemistry');
      expect(seq).toHaveLength(4);
      expect(seq[0].recommendedLayout).toBe('title-hero');
      expect(seq[1].recommendedLayout).toBe('definition-formula');
      expect(seq[2].recommendedLayout).toBe('problem-solution');
      expect(seq[3].recommendedLayout).toBe('summary-quiz');
    });

    it('plans standard 5-slide pedagogical sequence', () => {
      const seq = planPedagogicalSequence(5, 'Biology');
      expect(seq).toHaveLength(5);
      expect(seq.map((s) => s.recommendedLayout)).toEqual([
        'title-hero',
        'definition-formula',
        'problem-solution',
        'two-column-split',
        'summary-quiz',
      ]);
      expect(seq[4].cardTypes).toContain('summary');
      expect(seq[4].cardTypes).toContain('question-answer');
    });

    it('plans comprehensive multi-slide sequence (8 slides)', () => {
      const seq = planPedagogicalSequence(8, 'History');
      expect(seq).toHaveLength(8);
      expect(seq[0].recommendedLayout).toBe('title-hero');
      expect(seq[1].recommendedLayout).toBe('concept-overview');
      expect(seq[2].recommendedLayout).toBe('definition-formula');
      expect(seq[3].recommendedLayout).toBe('three-card-grid');
      expect(seq[4].recommendedLayout).toBe('two-column-split');
      expect(seq[5].recommendedLayout).toBe('four-card-grid');
      expect(seq[7].recommendedLayout).toBe('summary-quiz');
    });

    it('clamps sequence count to bounds [3, 15]', () => {
      expect(planPedagogicalSequence(1)).toHaveLength(3);
      expect(planPedagogicalSequence(20)).toHaveLength(15);
    });
  });

  describe('4. Prompt Engineering & Prompt Builders', () => {
    it('constructs system and user prompts with instructional guidelines', () => {
      const { systemPrompt, userPrompt } = buildTeachingPresentationPrompt({
        topic: 'Photosynthesis',
        gradeLevel: 'Grade 8 Science',
        learningObjectives: ['Define chlorophyll', 'Explain the Calvin cycle'],
        additionalInstructions: 'Include interactive student questions.',
      });

      expect(systemPrompt).toContain('Photosynthesis');
      expect(systemPrompt).toContain('Grade 8 Science');
      expect(systemPrompt).toContain('PEDAGOGICAL EXCELLENCE RULES');
      expect(systemPrompt).toContain('SUBSTANTIVE CONTENT');
      expect(systemPrompt).toContain('SEPARATION OF CONCERNS');
      expect(systemPrompt).toContain('title-hero');
      expect(systemPrompt).toContain('summary-quiz');

      expect(userPrompt).toContain('TOPIC: "Photosynthesis"');
      expect(userPrompt).toContain('Define chlorophyll');
      expect(userPrompt).toContain('Explain the Calvin cycle');
      expect(userPrompt).toContain('Include interactive student questions.');
      expect(systemPrompt).toContain('PresentationDeckSpec schema');
      expect(userPrompt).toContain('Respond with pure JSON conforming to this schema');
    });

    it('generates Bloom’s taxonomy objectives recommendation when objectives are empty', () => {
      const { systemPrompt } = buildTeachingPresentationPrompt({
        topic: 'Gravity and Free Fall',
      });
      expect(systemPrompt).toContain('Bloom’s taxonomy learning goals');
    });
  });

  describe('5. Schema Validation & Repair Engine', () => {
    it('validates a well-formed presentation deck successfully', () => {
      const sampleDeck: PresentationDeckSpec = {
        topic: 'Newtonian Gravitation',
        subject: 'Physics',
        gradeLevel: 'High School (Grades 11-12)',
        themeId: 'science-engineering',
        slides: [
          {
            slideNumber: 1,
            title: 'Universal Gravitation',
            subtitle: 'Inverse-Square Law',
            layout: 'title-hero',
            notes: 'Introduce historical context with Galileo and Newton.',
            cards: [
              {
                id: 'card-1-1',
                cardType: 'basic-info',
                title: 'Overview',
                badge: 'Key Concept',
                body: 'Every mass attracts every other mass with a force proportional to product of masses.',
                bulletPoints: ['Universal constant G', 'Radial symmetry'],
              },
            ],
          },
          {
            slideNumber: 2,
            title: 'Gravitational Force Formula',
            layout: 'definition-formula',
            notes: 'Walk students through the SI units of G.',
            cards: [
              {
                id: 'card-2-1',
                cardType: 'definition',
                title: 'Gravitational Constant',
                term: 'G',
                formalDefinition: '6.67430 x 10^-11 N m^2 kg^-2',
              },
            ],
          },
        ],
      };

      const result = validateDeckContent(sampleDeck);
      expect(result.isValid).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.errors).toHaveLength(0);
      expect(result.deck.slides).toHaveLength(2);
      expect(result.deck.slides[0].title).toBe('Universal Gravitation');
    });

    it('safely handles non-object or null input with emergency curriculum fallback', () => {
      const result = validateDeckContent(null, { topic: 'Electromagnetism' });
      expect(result.isValid).toBe(false);
      expect(result.repaired).toBe(true);
      expect(result.deck.topic).toBe('Electromagnetism');
      expect(result.deck.slides.length).toBeGreaterThanOrEqual(3);
      expect(result.deck.isTemplateFallback).toBe(true);
    });

    it('repairs missing topic and empty slides gracefully', () => {
      const malformed = {
        slides: [],
      };
      const result = validateDeckContent(malformed, { topic: 'Plate Tectonics' });
      expect(result.isValid).toBe(false);
      expect(result.repaired).toBe(true);
      expect(result.deck.topic).toBe('Plate Tectonics');
      expect(result.deck.slides.length).toBeGreaterThanOrEqual(3);
    });

    it('truncates decks exceeding 20 slides to prevent memory bloat', () => {
      const manySlides = Array.from({ length: 25 }, (_, i) => ({
        slideNumber: i + 1,
        title: `Slide ${i + 1}`,
        layout: 'concept-overview',
        cards: [{ cardType: 'basic-info', body: 'Content' }],
      }));

      const deck = {
        topic: 'Extensive Lecture',
        slides: manySlides,
      };

      const result = validateDeckContent(deck);
      expect(result.repaired).toBe(true);
      expect(result.deck.slides).toHaveLength(20);
      expect(result.errors.some((e) => e.includes('truncated to 20 slides'))).toBe(true);
    });

    it('repairs slides with unknown layouts, missing titles, and empty cards', () => {
      const malformedDeck = {
        topic: 'Cell Biology',
        slides: [
          {
            // missing title
            layout: 'non-existent-layout-xyz',
            cards: [
              {
                // empty card with no body or bullets
                title: 'Empty Card',
              },
            ],
          },
        ],
      };

      const result = validateDeckContent(malformedDeck);
      expect(result.repaired).toBe(true);
      expect(result.deck.slides[0].title).toBe('Part 1: Cell Biology');
      expect(result.deck.slides[0].layout).toBe('concept-overview'); // fallback layout
      expect(result.deck.slides[0].cards![0].body).toBe('Key concept for Empty Card.');
    });

    it('preserves specialized card payloads (definition, problem-solution, metric, quote, qa, steps)', () => {
      const deck = {
        topic: 'Complex Numbers',
        slides: [
          {
            title: 'Foundations',
            layout: 'definition-formula',
            cards: [
              {
                cardType: 'definition',
                definition: {
                  term: 'Imaginary Unit',
                  formalDefinition: 'i is defined as sqrt(-1)',
                },
                problemSolution: {
                  problem: { text: 'Simplify i^4' },
                  solution: { text: 'i^4 = (i^2)^2 = (-1)^2 = 1' },
                },
                metric: {
                  metricValue: '1',
                  metricLabel: 'Norm of i',
                },
              },
            ],
          },
        ],
      };

      const result = validateDeckContent(deck);
      const card = result.deck.slides[0].cards![0];
      expect(card.definition?.term).toBe('Imaginary Unit');
      expect(card.problemSolution?.solution?.text).toContain('(-1)^2 = 1');
      expect(card.metric?.metricValue).toBe('1');
    });
  });

  describe('6. Offline Curriculum Template Fallback', () => {
    it('produces a substantive, complete deck without AI', () => {
      const fallback = generateCurriculumTemplateFallback({
        topic: 'Photosynthesis and Energy Conversion',
        subject: 'Biology',
        gradeLevel: 'Grade 9',
        numberOfSlides: 5,
        themeId: 'colorful-education',
      });

      expect(fallback.topic).toBe('Photosynthesis and Energy Conversion');
      expect(fallback.subject).toBe('Biology');
      expect(fallback.gradeLevel).toBe('Grade 9');
      expect(fallback.themeId).toBe('colorful-education');
      expect(fallback.slides).toHaveLength(5);
      expect(fallback.source).toBe('curriculum-template');
      expect(fallback.isTemplateFallback).toBe(true);

      // Verify all slides have content, non-empty titles, and speaker notes
      fallback.slides.forEach((slide) => {
        expect(slide.title.length).toBeGreaterThan(0);
        expect(slide.notes).toBeDefined();
        expect(slide.cards).toBeDefined();
        expect(slide.cards!.length).toBeGreaterThan(0);
        expect(ALLOWED_LAYOUT_TYPES).toContain(slide.layout);
      });

      // Verify slide 1 is title-hero
      expect(fallback.slides[0].layout).toBe('title-hero');
      // Verify final slide is summary-quiz
      expect(fallback.slides[4].layout).toBe('summary-quiz');
      expect(fallback.slides[4].cards!.some((c) => c.cardType === 'question-answer')).toBe(true);
    });

    it('adapts slide count correctly according to teacher request (4 slides)', () => {
      const fallback = generateCurriculumTemplateFallback({
        topic: 'The Water Cycle',
        numberOfSlides: 4,
      });

      expect(fallback.slides).toHaveLength(4);
      expect(fallback.slides[0].layout).toBe('title-hero');
      expect(fallback.slides[1].layout).toBe('definition-formula');
      expect(fallback.slides[2].layout).toBe('problem-solution');
      expect(fallback.slides[3].layout).toBe('summary-quiz');
    });

    it('never labels curriculum template fallback as AI generated', () => {
      const fallback = generateCurriculumTemplateFallback({ topic: 'Calculus Derivatives' });
      expect(fallback.source).toBe('curriculum-template');
      expect(fallback.isTemplateFallback).toBe(true);
    });
  });

  describe('7. End-to-End Content Generation Pipeline (generateTeachingContent)', () => {
    let mockManager: AIProviderManager;

    beforeEach(() => {
      mockManager = new AIProviderManager();
    });

    it('falls back cleanly to curriculum template when no AI provider is configured', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(false);

      const result = await generateTeachingContent(
        { topic: 'Plate Tectonics', numberOfSlides: 4 },
        { providerManager: mockManager }
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('curriculum-template');
      expect(result.deck.isTemplateFallback).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('No active AI provider configured');
      expect(result.deck.slides).toHaveLength(4);
    });

    it('uses curriculum template when forceTemplateFallback is explicitly requested', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);

      const result = await generateTeachingContent(
        { topic: 'Atmospheric Layers', numberOfSlides: 3 },
        { providerManager: mockManager, forceTemplateFallback: true }
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('curriculum-template');
      expect(result.deck.slides).toHaveLength(3);
    });

    it('generates presentation from AI provider when provider is ready and responds with JSON', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('openai');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'getSelectedModel').mockReturnValue('gpt-4o');

      const mockAiDeck: PresentationDeckSpec = {
        topic: 'Photosynthesis',
        subject: 'Biology',
        gradeLevel: 'High School',
        themeId: 'modern-academic',
        slides: [
          {
            slideNumber: 1,
            title: 'Welcome to Photosynthesis',
            layout: 'title-hero',
            cards: [{ cardType: 'basic-info', body: 'Introduction to light reactions.' }],
          },
          {
            slideNumber: 2,
            title: 'Chloroplast Anatomy',
            layout: 'two-column-split',
            cards: [{ cardType: 'basic-info', body: 'Thylakoids and stroma.' }],
          },
          {
            slideNumber: 3,
            title: 'Quiz & Wrap-Up',
            layout: 'summary-quiz',
            cards: [{ cardType: 'question-answer', question: 'Where does Calvin cycle occur?', answer: 'In the stroma.' }],
          },
        ],
      };

      vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: true,
        data: mockAiDeck,
        model: 'gpt-4o',
      });

      const result = await generateTeachingContent(
        { topic: 'Photosynthesis', numberOfSlides: 3 },
        { providerManager: mockManager }
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('ai');
      expect(result.modelUsed).toBe('gpt-4o');
      expect(result.deck.slides).toHaveLength(3);
      expect(result.deck.slides[0].title).toBe('Welcome to Photosynthesis');
    });

    it('handles AI provider failure gracefully by falling back to curriculum template', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('gemini');
      vi.spyOn(mockManager, 'hasApiKey').mockResolvedValue(true);
      vi.spyOn(mockManager, 'getSelectedModel').mockReturnValue('gemini-2.0-flash');

      vi.spyOn(mockManager, 'generateStructuredJson').mockRejectedValue(
        new Error('API quota limit exceeded (429)')
      );

      const result = await generateTeachingContent(
        { topic: 'Thermodynamics Laws', numberOfSlides: 5 },
        { providerManager: mockManager }
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('curriculum-template');
      expect(result.deck.isTemplateFallback).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('API quota limit exceeded');
      expect(result.deck.slides).toHaveLength(5);
    });

    it('extracts JSON from rawText if direct structured json is empty but raw markdown exists', async () => {
      vi.spyOn(mockManager, 'getActiveProvider').mockReturnValue('ollama');
      vi.spyOn(mockManager, 'checkOllamaStatus').mockResolvedValue({
        available: true,
        endpoint: 'http://localhost:11434',
        status: 'ready',
        installedModels: [{ name: 'llama3.2', model: 'llama3.2:latest', size: 2000000000 }],
      });
      vi.spyOn(mockManager, 'getSelectedModel').mockReturnValue('llama3.2');

      const rawJson = `\`\`\`json
{
  "topic": "Python Recursion",
  "subject": "Computer Science",
  "gradeLevel": "High School",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Recursion Basics",
      "layout": "title-hero",
      "cards": [{ "cardType": "basic-info", "body": "Base case and recursive case." }]
    },
    {
      "slideNumber": 2,
      "title": "Call Stack",
      "layout": "concept-overview",
      "cards": [{ "cardType": "basic-info", "body": "Stack frames push and pop." }]
    },
    {
      "slideNumber": 3,
      "title": "Review Quiz",
      "layout": "summary-quiz",
      "cards": [{ "cardType": "question-answer", "question": "What stops recursion?", "answer": "The base case." }]
    }
  ]
}
\`\`\``;

      vi.spyOn(mockManager, 'generateStructuredJson').mockResolvedValue({
        success: false,
        rawText: rawJson,
        model: 'llama3.2',
      });

      const result = await generateTeachingContent(
        { topic: 'Python Recursion', numberOfSlides: 3 },
        { providerManager: mockManager }
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('ai');
      expect(result.deck.topic).toBe('Python Recursion');
      expect(result.deck.slides).toHaveLength(3);
    });
  });
});
