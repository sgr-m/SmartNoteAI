/**
 * interactiveActivityBridge.test.ts — Unit tests for Interactive Educational Activities
 * Milestone 5: Stage 12 Verification (TASK-112)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ACTIVITY_TYPES_CATALOG,
  validateActivity,
  sanitizeText,
  createInitialActivityState,
  selectOption,
  setMatchingAnswer,
  reorderItem,
  setBlankInput,
  checkAnswer,
  submitAnswer,
  revealAnswer,
  revealNextStep,
  flipFlashcard,
  revealHint,
  retryActivity,
  castPollVote,
  compileActivityToNativeObjects,
  createActivitySlidePage,
  generateCurriculumActivity,
  generateCurriculumActivityDeck,
  generateActivityPrompt,
  generateActivityDeck,
} from '../src/renderer/services/aiPresentation/interactiveActivityBridge';
import {
  DEFAULT_PRESENTATION_THEME,
  getThemeById,
} from '../src/renderer/services/aiPresentation/presentationThemes';
import {
  EducationalActivity,
  EducationalActivityType,
  BoundingBox,
} from '../src/shared/aiPresentationTypes';
import { InteractiveActivityModal } from '../src/renderer/components/aiPresentation/InteractiveActivityModal';
import { ShapeObject, TextObject } from '../src/shared/types';

describe('TASK-112: Interactive Educational Activities Subsystem', () => {
  // ─── 1. Activity Catalog & Metadata ─────────────────────────────────────────

  describe('1. Activity Catalog & Metadata', () => {
    const expectedTypes: EducationalActivityType[] = [
      'mcq',
      'true-false',
      'fill-in-blanks',
      'matching',
      'ordering',
      'qa-reveal',
      'flashcard',
      'step-reveal',
      'formula-reveal',
      'poll',
    ];

    it('contains metadata for all 10 educational activity types', () => {
      expectedTypes.forEach((type) => {
        const entry = ACTIVITY_TYPES_CATALOG[type];
        expect(entry).toBeDefined();
        expect(entry.type).toBe(type);
        expect(entry.title.length).toBeGreaterThan(0);
        expect(entry.shortName.length).toBeGreaterThan(0);
        expect(entry.icon.length).toBeGreaterThan(0);
        expect(entry.badge.length).toBeGreaterThan(0);
        expect(entry.description.length).toBeGreaterThan(0);
        expect(['assessment', 'reinforcement', 'discussion', 'engagement']).toContain(entry.category);
      });
    });

    it('prioritizes core formative assessment types (mcq, true-false, fill-in-blanks, matching)', () => {
      expect(ACTIVITY_TYPES_CATALOG.mcq.category).toBe('assessment');
      expect(ACTIVITY_TYPES_CATALOG['true-false'].category).toBe('assessment');
      expect(ACTIVITY_TYPES_CATALOG['fill-in-blanks'].category).toBe('assessment');
      expect(ACTIVITY_TYPES_CATALOG.matching.category).toBe('reinforcement');
    });
  });

  // ─── 2. Structural Validation & Sanitization ────────────────────────────────

  describe('2. Structural Validation & Sanitization', () => {
    it('throws error when validating non-object or null input', () => {
      expect(() => validateActivity(null)).toThrow();
      expect(() => validateActivity('invalid')).toThrow();
      expect(() => validateActivity(undefined)).toThrow();
    });

    it('sanitizes HTML tags and control characters from text fields', () => {
      const sanitized = sanitizeText('<script>alert("xss")</script>Hello <b>World</b>');
      expect(sanitized).toBe('alert("xss")Hello World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<b>');
    });

    it('validates and repairs multiple-choice question (mcq) with missing options', () => {
      const act = validateActivity({
        type: 'mcq',
        title: 'Cell Biology MCQ',
        question: 'Which organelle produces ATP?',
      });

      expect(act.type).toBe('mcq');
      expect(act.options).toBeDefined();
      expect(act.options!.length).toBeGreaterThanOrEqual(2);
      expect(act.options![0].badge).toBe('A');
      expect(act.options![1].badge).toBe('B');
      expect(act.correctAnswer).toBe(act.options![0].id);
    });

    it('validates true/false question and standardizes options to True and False', () => {
      const act = validateActivity({
        type: 'true-false',
        question: 'The mitochondria is the powerhouse of the cell.',
        correctAnswer: 'true',
      });

      expect(act.type).toBe('true-false');
      expect(act.options).toHaveLength(2);
      expect(act.options![0].text).toBe('True');
      expect(act.options![1].text).toBe('False');
      expect(act.correctAnswer).toBe('true');
    });

    it('validates fill-in-the-blanks and ensures blank token exists', () => {
      const act = validateActivity({
        type: 'fill-in-blanks',
        question: 'Energy cannot be created or destroyed', // Missing token
        blanksAnswer: 'conserved',
      });

      expect(act.type).toBe('fill-in-blanks');
      expect(act.question).toContain('[blank]');
      expect(act.blanksAnswer).toEqual(['conserved']);
    });

    it('validates matching pairs and maps correct answer pairs', () => {
      const act = validateActivity({
        type: 'matching',
        matchingPairs: [
          { id: 'p1', left: 'Atom', right: 'Smallest unit of ordinary matter' },
          { id: 'p2', left: 'Molecule', right: 'Electrically neutral group of atoms' },
        ],
      });

      expect(act.type).toBe('matching');
      expect(act.matchingPairs).toHaveLength(2);
      expect(act.correctAnswer).toEqual({
        p1: 'Smallest unit of ordinary matter',
        p2: 'Electrically neutral group of atoms',
      });
    });

    it('validates ordering activity with default sequential items when missing', () => {
      const act = validateActivity({
        type: 'ordering',
        question: 'Order the life cycle stages',
      });

      expect(act.type).toBe('ordering');
      expect(act.orderedItems).toBeDefined();
      expect(act.orderedItems!.length).toBeGreaterThanOrEqual(3);
      expect(act.correctAnswer).toEqual(act.orderedItems);
    });

    it('validates formula-reveal with default variable definitions', () => {
      const act = validateActivity({
        type: 'formula-reveal',
        formula: 'F = m \\cdot a',
        formulaName: "Newton's Second Law",
      });

      expect(act.type).toBe('formula-reveal');
      expect(act.formula).toBe('F = m \\cdot a');
      expect(act.variableBreakdown).toBeDefined();
      expect(act.variableBreakdown!.length).toBeGreaterThan(0);
    });

    it('validates quick classroom poll with vote counts', () => {
      const act = validateActivity({
        type: 'poll',
        question: 'Which energy source should be prioritized?',
        pollOptions: [
          { id: 'opt-solar', text: 'Solar Energy', votes: 10 },
          { id: 'opt-wind', text: 'Wind Energy', votes: 5 },
        ],
      });

      expect(act.type).toBe('poll');
      expect(act.pollOptions).toHaveLength(2);
      expect(act.pollOptions![0].votes).toBe(10);
    });
  });

  // ─── 3. Interaction Engine & State Transitions ──────────────────────────────

  describe('3. Interaction Engine & State Transitions', () => {
    let mcqActivity: EducationalActivity;

    beforeEach(() => {
      mcqActivity = validateActivity({
        type: 'mcq',
        id: 'test-mcq-1',
        title: 'Photosynthesis Question',
        question: 'Where do light-dependent reactions occur?',
        options: [
          { id: 'opt-a', text: 'Thylakoid Membrane', isCorrect: true },
          { id: 'opt-b', text: 'Stroma Matrix' },
          { id: 'opt-c', text: 'Outer Membrane' },
        ],
        correctAnswer: 'opt-a',
        explanation: 'Thylakoids contain the chlorophyll pigment.',
        hints: ['Hint 1: Look inside the chloroplast.'],
        scoring: { pointsPerQuestion: 10, penaltyPerWrongAttempt: 2 },
      });
    });

    it('creates a clean initial interaction state', () => {
      const state = createInitialActivityState(mcqActivity);
      expect(state.activityId).toBe('test-mcq-1');
      expect(state.selectedOptionId).toBeUndefined();
      expect(state.isSubmitted).toBe(false);
      expect(state.isCorrect).toBeUndefined();
      expect(state.isRevealed).toBe(false);
      expect(state.score).toBe(0);
      expect(state.attemptsCount).toBe(0);
    });

    it('updates selection when an option is clicked', () => {
      let state = createInitialActivityState(mcqActivity);
      state = selectOption(state, 'opt-b');
      expect(state.selectedOptionId).toBe('opt-b');
      expect(state.selectedOptions).toEqual(['opt-b']);

      state = selectOption(state, 'opt-a');
      expect(state.selectedOptionId).toBe('opt-a');
    });

    it('evaluates correct answer and awards full points on first attempt', () => {
      let state = createInitialActivityState(mcqActivity);
      state = selectOption(state, 'opt-a');
      const evalRes = checkAnswer(mcqActivity, state);
      expect(evalRes.isCorrect).toBe(true);
      expect(evalRes.scoreEarned).toBe(10);

      state = submitAnswer(mcqActivity, state);
      expect(state.isSubmitted).toBe(true);
      expect(state.isCorrect).toBe(true);
      expect(state.score).toBe(10);
      expect(state.attemptsCount).toBe(1);
    });

    it('applies wrong attempt penalty on retry', () => {
      let state = createInitialActivityState(mcqActivity);
      state = selectOption(state, 'opt-b'); // Wrong
      state = submitAnswer(mcqActivity, state);
      expect(state.isCorrect).toBe(false);
      expect(state.score).toBe(0);
      expect(state.attemptsCount).toBe(1);

      // Retry
      state = retryActivity(mcqActivity, state);
      expect(state.isSubmitted).toBe(false);
      expect(state.attemptsCount).toBe(1); // Attempts preserved

      // Now choose correct answer (Attempt 2)
      state = selectOption(state, 'opt-a');
      state = submitAnswer(mcqActivity, state);
      expect(state.isCorrect).toBe(true);
      expect(state.earnedPoints).toBe(8); // 10 - 2 penalty
      expect(state.attemptsCount).toBe(2);
    });

    it('supports teacher-controlled answer reveal', () => {
      let state = createInitialActivityState(mcqActivity);
      expect(state.isRevealed).toBe(false);
      state = revealAnswer(state);
      expect(state.isRevealed).toBe(true);
      expect(state.isSubmitted).toBe(true);
    });

    it('reveals hints progressively without exceeding available hints', () => {
      let state = createInitialActivityState(mcqActivity);
      expect(state.hintsRevealedCount).toBe(0);
      state = revealHint(mcqActivity, state);
      expect(state.hintsRevealedCount).toBe(1);
      state = revealHint(mcqActivity, state);
      expect(state.hintsRevealedCount).toBe(1); // Max hints clamped
    });

    it('supports matching pair answers and partial credit evaluation', () => {
      const matchAct = validateActivity({
        type: 'matching',
        matchingPairs: [
          { id: 'p1', left: 'Left A', right: 'Right A' },
          { id: 'p2', left: 'Left B', right: 'Right B' },
        ],
      });

      let state = createInitialActivityState(matchAct);
      state = setMatchingAnswer(state, 'p1', 'Right A'); // 1 correct
      state = setMatchingAnswer(state, 'p2', 'Wrong'); // 1 wrong

      const check = checkAnswer(matchAct, state);
      expect(check.isCorrect).toBe(false);
      expect(check.scoreEarned).toBe(5); // 50% partial credit
    });

    it('supports reordering items in sequence activities', () => {
      const orderAct = validateActivity({
        type: 'ordering',
        orderedItems: ['Step 1', 'Step 2', 'Step 3'],
      });

      let state = createInitialActivityState(orderAct);
      expect(state.currentOrder).toBeDefined();

      // Swap item 0 and 1
      state = reorderItem(state, 0, 1);
      expect(state.currentOrder).toHaveLength(3);
    });

    it('evaluates fill-in-the-blanks with case-insensitivity', () => {
      const blankAct = validateActivity({
        type: 'fill-in-blanks',
        question: 'Water is composed of hydrogen and [blank].',
        blanksAnswer: ['Oxygen'],
      });

      let state = createInitialActivityState(blankAct);
      state = setBlankInput(state, 0, '   oxygen   '); // Different case & extra whitespace
      const check = checkAnswer(blankAct, state);
      expect(check.isCorrect).toBe(true);
    });

    it('advances step-by-step solutions with revealNextStep', () => {
      const stepAct = validateActivity({
        type: 'step-reveal',
        steps: [
          { stepNumber: 1, title: 'Step 1', content: 'First' },
          { stepNumber: 2, title: 'Step 2', content: 'Second' },
          { stepNumber: 3, title: 'Step 3', content: 'Third' },
        ],
      });

      let state = createInitialActivityState(stepAct);
      expect(state.revealedStepIndex).toBe(0);
      state = revealNextStep(stepAct, state);
      expect(state.revealedStepIndex).toBe(1);
      state = revealNextStep(stepAct, state);
      expect(state.revealedStepIndex).toBe(2);
      expect(state.isRevealed).toBe(true);
    });

    it('flips flashcards back and forth', () => {
      let state = createInitialActivityState(mcqActivity);
      expect(state.isFlashcardFlipped).toBe(false);
      state = flipFlashcard(state);
      expect(state.isFlashcardFlipped).toBe(true);
      state = flipFlashcard(state);
      expect(state.isFlashcardFlipped).toBe(false);
    });

    it('records votes on classroom polls', () => {
      const pollAct = validateActivity({
        type: 'poll',
        pollOptions: [
          { id: 'opt-a', text: 'Option A', votes: 3 },
          { id: 'opt-b', text: 'Option B', votes: 1 },
        ],
      });

      const state = createInitialActivityState(pollAct);
      const res = castPollVote(pollAct, state, 'opt-a');
      expect(res.updatedActivity.pollOptions![0].votes).toBe(4);
      expect(res.updatedState.pollVotedOptionId).toBe('opt-a');
      expect(res.updatedState.isSubmitted).toBe(true);
    });
  });

  // ─── 4. Native Whiteboard CanvasObject Compilation ──────────────────────────

  describe('4. Native Whiteboard CanvasObject Compilation', () => {
    const testBounds: BoundingBox = { x: 100, y: 150, width: 800, height: 600 };
    const theme = DEFAULT_PRESENTATION_THEME;

    it('compiles MCQ activity into native CanvasObjects with params metadata', () => {
      const act = validateActivity({
        type: 'mcq',
        question: 'What is the speed of light in vacuum?',
        options: [
          { id: 'opt-a', text: '3 x 10^8 m/s', isCorrect: true },
          { id: 'opt-b', text: '3 x 10^6 m/s' },
        ],
        correctAnswer: 'opt-a',
      });

      const state = createInitialActivityState(act);
      const objects = compileActivityToNativeObjects(act, state, testBounds, theme);

      expect(objects.length).toBeGreaterThan(5);

      // Verify outer container shape
      const container = objects[0] as ShapeObject;
      expect(container.type).toBe('shape');
      expect(container.shapeType).toBe('roundedRect');
      expect(container.params?.isInteractiveActivity).toBe(true);
      expect(container.params?.activityType).toBe('mcq');
      expect(container.params?.activityData).toBeDefined();

      // Verify text elements exist
      const texts = objects.filter((o) => o.type === 'text') as TextObject[];
      expect(texts.some((t) => t.content.includes('speed of light'))).toBe(true);
    });

    it('reflects selection and submission styling in compiled objects', () => {
      const act = validateActivity({
        type: 'mcq',
        options: [
          { id: 'opt-a', text: 'Option A', isCorrect: true },
          { id: 'opt-b', text: 'Option B' },
        ],
        correctAnswer: 'opt-a',
      });

      let state = createInitialActivityState(act);
      state = selectOption(state, 'opt-a');
      state = submitAnswer(act, state);

      const objects = compileActivityToNativeObjects(act, state, testBounds, theme);
      const container = objects[0] as ShapeObject;

      // Container border turns success color on correct answer
      expect(container.strokeColor).toBe(theme.semantic.success);
    });

    it('creates a complete 1920x1080 slide page with standard 5-layer architecture', () => {
      const act = validateActivity({
        type: 'formula-reveal',
        title: 'Mass-Energy Equivalence',
        formula: 'E = m \\cdot c^2',
      });

      const page = createActivitySlidePage(act, theme, 3);
      expect(page.id).toContain('activity-page-');
      expect(page.width).toBe(1920);
      expect(page.height).toBe(1080);
      expect(page.layers).toHaveLength(5);
      expect(page.layers.map((l) => l.id)).toEqual([
        'background',
        'imported-media',
        'drawing',
        'objects',
        'interaction',
      ]);
      expect(page.objects.length).toBeGreaterThan(5);

      // Verify header and footer
      const texts = page.objects.filter((o) => o.type === 'text') as TextObject[];
      expect(texts.some((t) => t.content.includes('Slide 3'))).toBe(true);
      expect(texts.some((t) => t.content.includes('Mass-Energy Equivalence'))).toBe(true);
    });

    it('supports JSON serialization and deserialization roundtrip without loss of metadata', () => {
      const act = validateActivity({
        type: 'matching',
        title: 'Anatomy Matching',
        matchingPairs: [
          { id: 'p1', left: 'Heart', right: 'Pumps blood' },
          { id: 'p2', left: 'Lungs', right: 'Gas exchange' },
        ],
      });

      const page = createActivitySlidePage(act, theme, 1);
      const json = JSON.stringify(page);
      const restored = JSON.parse(json);

      expect(restored.width).toBe(1920);
      expect(restored.height).toBe(1080);
      expect(restored.objects).toHaveLength(page.objects.length);

      const container = restored.objects.find((o: any) => o.params?.isInteractiveActivity);
      expect(container).toBeDefined();
      expect(container.params.activityType).toBe('matching');
    });
  });

  // ─── 5. Offline Curriculum Activity Library ─────────────────────────────────

  describe('5. Offline Curriculum Activity Library', () => {
    it('generates high-fidelity science activities for Photosynthesis', () => {
      const mcq = generateCurriculumActivity('Photosynthesis in Chloroplasts', 'Biology', 'mcq');
      expect(mcq.type).toBe('mcq');
      expect(mcq.options).toBeDefined();
      expect(mcq.explanation).toContain('Chloroplasts');

      const formula = generateCurriculumActivity('Photosynthesis', 'Biology', 'formula-reveal');
      expect(formula.formula).toContain('CO_2');
      expect(formula.variableBreakdown!.length).toBeGreaterThan(0);

      const match = generateCurriculumActivity('Photosynthesis', 'Biology', 'matching');
      expect(match.matchingPairs!.length).toBeGreaterThanOrEqual(3);

      const steps = generateCurriculumActivity('Photosynthesis', 'Biology', 'step-reveal');
      expect(steps.steps!.length).toBeGreaterThanOrEqual(4);
    });

    it('generates high-fidelity physics activities for Newton’s Laws', () => {
      const matching = generateCurriculumActivity("Newton's Laws of Motion", 'Physics', 'matching');
      expect(matching.matchingPairs!.length).toBe(3);

      const formula = generateCurriculumActivity('Force and Acceleration', 'Physics', 'formula-reveal');
      expect(formula.formula).toContain('\\vec{F}_{net}');
    });

    it('generates geometry activities for Pythagorean Theorem', () => {
      const formula = generateCurriculumActivity('Pythagorean Theorem', 'Mathematics', 'formula-reveal');
      expect(formula.formula).toBe('a^2 + b^2 = c^2');

      const steps = generateCurriculumActivity('Pythagorean Theorem', 'Mathematics', 'step-reveal');
      expect(steps.steps!.length).toBeGreaterThanOrEqual(4);
    });

    it('generates computer science activities for Binary Search', () => {
      const order = generateCurriculumActivity('Binary Search Algorithm', 'Computer Science', 'ordering');
      expect(order.orderedItems!.length).toBeGreaterThanOrEqual(4);

      const poll = generateCurriculumActivity('Binary Search vs Linear Search', 'Computer Science', 'poll');
      expect(poll.pollOptions!.length).toBeGreaterThanOrEqual(3);
    });

    it('generates general fallback activities for any custom topic', () => {
      const custom = generateCurriculumActivity('Quantum Computing Principles', 'Advanced CS', 'true-false');
      expect(custom.type).toBe('true-false');
      expect(custom.question).toContain('Quantum Computing Principles');

      const customMcq = generateCurriculumActivity('Roman Architecture', 'History', 'mcq');
      expect(customMcq.type).toBe('mcq');
      expect(customMcq.question).toContain('Roman Architecture');
    });

    it('generates complete multi-activity decks', () => {
      const deck = generateCurriculumActivityDeck('Plate Tectonics', 'Geography', ['mcq', 'true-false', 'matching']);
      expect(deck).toHaveLength(3);
      expect(deck[0].type).toBe('mcq');
      expect(deck[1].type).toBe('true-false');
      expect(deck[2].type).toBe('matching');
    });
  });

  // ─── 6. AI Prompt Generation & LLM Integration ──────────────────────────────

  describe('6. AI Prompt Generation & LLM Integration', () => {
    it('constructs detailed, schema-compliant prompts for LLM providers', () => {
      const prompt = generateActivityPrompt('Cellular Mitosis', 'Biology', 'mcq', 'High School (Grades 9-10)');
      expect(prompt).toContain('TOPIC: "Cellular Mitosis"');
      expect(prompt).toContain('ACTIVITY TYPE: "mcq"');
      expect(prompt).toContain('Provide 4 distinct options');
      expect(prompt).toContain('OUTPUT FORMAT: Return ONLY a valid JSON object');
    });

    it('gracefully falls back to offline templates when LLM provider is unavailable', async () => {
      const activities = await generateActivityDeck({
        topic: 'Volcanoes and Magma',
        subject: 'Earth Science',
        types: ['mcq', 'true-false'],
        provider: 'openai',
        apiKey: undefined, // Missing key triggers fallback
      });

      expect(activities).toHaveLength(2);
      expect(activities[0].type).toBe('mcq');
      expect(activities[1].type).toBe('true-false');
      expect(activities[0].question.length).toBeGreaterThan(0);
    });
  });

  // ─── 7. React Presentation Modal (InteractiveActivityModal) ────────────────

  describe('7. React Presentation Modal (InteractiveActivityModal)', () => {
    const sampleActivity = validateActivity({
      type: 'mcq',
      title: 'Formative Quiz',
      question: 'Which planet is closest to the Sun?',
      options: [
        { id: 'opt-a', text: 'Mercury', isCorrect: true },
        { id: 'opt-b', text: 'Venus' },
        { id: 'opt-c', text: 'Earth' },
      ],
      correctAnswer: 'opt-a',
      explanation: 'Mercury orbits at approximately 57.9 million km from the Sun.',
      hints: ['It is named after the Roman messenger god.'],
    });

    it('renders null when closed', () => {
      const html = renderToStaticMarkup(
        React.createElement(InteractiveActivityModal, {
          isOpen: false,
          activity: sampleActivity,
          onClose: () => {},
        })
      );
      expect(html).toBe('');
    });

    it('renders modal dialog with accessible attributes and activity content when open', () => {
      const html = renderToStaticMarkup(
        React.createElement(InteractiveActivityModal, {
          isOpen: true,
          activity: sampleActivity,
          onClose: () => {},
        })
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('Which planet is closest to the Sun?');
      expect(html).toContain('Mercury');
      expect(html).toContain('Venus');
      expect(html).toContain('Earth');
      expect(html).toContain('MULTIPLE CHOICE');
      expect(html).toContain('Submit Answer');
      expect(html).toContain('Reveal Answer');
      expect(html).toContain('Insert as Slide into Lesson');
    });
  });
});

