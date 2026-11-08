/**
 * outlineRefinementChatbox.test.ts — Unit Tests for Conversational Outline Refinement
 * Phase 5: Testing AI and Heuristic Topic Refinement & Chat Interactions
 */

import { describe, expect, it, vi } from 'vitest';
import {
  OutlineRefinementService,
  refineOutlineHeuristic,
} from '../src/renderer/services/aiPresentation/outlineRefinementService';
import { SlideOutlineItem } from '../src/shared/aiPresentationTypes';

describe('Phase 5: Conversational Topic Refinement Service', () => {
  const initialQuadraticOutline: SlideOutlineItem[] = [
    {
      id: 's1',
      slideNumber: 1,
      title: 'Introduction to Quadratic Equations',
      actionGoal: 'Generate definition and real-world hook',
      selected: true,
      changeStatus: 'unchanged',
    },
    {
      id: 's2',
      slideNumber: 2,
      title: 'Standard Form',
      actionGoal: 'Explain general form ax^2 + bx + c = 0',
      selected: true,
      changeStatus: 'unchanged',
    },
    {
      id: 's3',
      slideNumber: 3,
      title: 'Roots of a Quadratic Equation',
      actionGoal: 'Explain roots as parabola x-intercepts',
      selected: true,
      changeStatus: 'unchanged',
    },
    {
      id: 's4',
      slideNumber: 4,
      title: 'Solving by Factorisation',
      actionGoal: 'Demonstrate factoring quadratic equations',
      selected: true,
      changeStatus: 'unchanged',
    },
    {
      id: 's5',
      slideNumber: 5,
      title: 'Quadratic Formula',
      actionGoal: 'Explain and derive quadratic formula',
      selected: true,
      changeStatus: 'unchanged',
    },
    {
      id: 's6',
      slideNumber: 6,
      title: 'Real-Life Applications',
      actionGoal: 'Projectile motion examples',
      selected: true,
      changeStatus: 'unchanged',
    },
  ];

  it('1. Adds completing the square before quadratic formula and includes geometrical interpretation of roots', () => {
    const instruction =
      'Add completing the square before introducing the quadratic formula. Also include the geometrical interpretation of the roots.';

    const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, {
      topic: 'Quadratic Equations',
      subject: 'Mathematics',
      gradeLevel: 'Grade 10',
    });

    expect(result.changes.added.length).toBeGreaterThanOrEqual(2);
    expect(result.changes.added).toContain('Solving by Completing the Square');
    expect(result.changes.added).toContain('Geometrical Interpretation of Roots');

    const formulaIndex = result.updatedOutline.findIndex((s) => s.title.includes('Quadratic Formula'));
    const completingSquareIndex = result.updatedOutline.findIndex((s) =>
      s.title.includes('Completing the Square')
    );

    // Completing the square MUST be placed before the quadratic formula!
    expect(completingSquareIndex).toBeGreaterThan(-1);
    expect(formulaIndex).toBeGreaterThan(-1);
    expect(completingSquareIndex).toBeLessThan(formulaIndex);

    // Sequentially numbered
    result.updatedOutline.forEach((s, idx) => {
      expect(s.slideNumber).toBe(idx + 1);
    });

    // Check changeStatus
    const addedItem = result.updatedOutline[completingSquareIndex];
    expect(addedItem.changeStatus).toBe('added');
  });

  it('2. Updates slide content requirements for solved examples across solving methods', () => {
    const instruction =
      'Include at least two solved examples for every method of solving quadratic equations.';

    const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, {
      topic: 'Quadratic Equations',
      subject: 'Mathematics',
      gradeLevel: 'Grade 10',
    });

    expect(result.changes.modified.length).toBeGreaterThan(0);

    const factorisationSlide = result.updatedOutline.find((s) => s.title.includes('Factorisation'));
    expect(factorisationSlide).toBeDefined();
    expect(factorisationSlide?.actionGoal).toContain('solved');
    expect(factorisationSlide?.changeStatus).toBe('modified');

    const formulaSlide = result.updatedOutline.find((s) => s.title.includes('Quadratic Formula'));
    expect(formulaSlide).toBeDefined();
    expect(formulaSlide?.actionGoal).toContain('solved');
    expect(formulaSlide?.changeStatus).toBe('modified');
  });

  it('3. Removes real-life applications and adds numerical problem solving practice', () => {
    const instruction = 'Remove real-life applications and add more numerical problems.';

    const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, {
      topic: 'Quadratic Equations',
      subject: 'Mathematics',
      gradeLevel: 'Grade 10',
    });

    expect(result.changes.removed).toContain('Real-Life Applications');
    expect(result.changes.added).toContain('Numerical Problem Solving & Practice');

    const hasApplications = result.updatedOutline.some((s) => s.title.includes('Real-Life Applications'));
    expect(hasApplications).toBe(false);

    const numericalSlide = result.updatedOutline.find((s) => s.title.includes('Numerical Problem'));
    expect(numericalSlide).toBeDefined();
    expect(numericalSlide?.changeStatus).toBe('added');
  });

  it('4. Renames an existing slide by slide number or title reference', () => {
    const instruction = 'Rename slide 2 to Standard Form & Coefficients';

    const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, {
      topic: 'Quadratic Equations',
    });

    expect(result.changes.modified).toContain('Standard Form & Coefficients');
    expect(result.updatedOutline[1].title).toBe('Standard Form & Coefficients');
    expect(result.updatedOutline[1].changeStatus).toBe('modified');
  });

  it('5. Reorders slides when requested', () => {
    const instruction = 'Move slide 4 up';

    const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, {
      topic: 'Quadratic Equations',
    });

    expect(result.changes.reordered).toBe(true);
    // Formerly slide 4 ('Solving by Factorisation') is now at index 2 (slide 3)
    expect(result.updatedOutline[2].title).toBe('Solving by Factorisation');
  });

  it('6. OutlineRefinementService returns unchanged outline on empty instruction', async () => {
    const service = new OutlineRefinementService();
    const result = await service.refineOutline('', initialQuadraticOutline, {
      topic: 'Quadratic Equations',
    });

    expect(result.updatedOutline.length).toBe(initialQuadraticOutline.length);
    expect(result.changes.added.length).toBe(0);
    expect(result.changes.modified.length).toBe(0);
  });

  it('7. OutlineRefinementService delegates to heuristic refiner when AI provider is unconfigured', async () => {
    const mockManager: any = {
      getActiveProvider: () => 'openai',
      hasApiKey: vi.fn().mockResolvedValue(false),
      checkOllamaStatus: vi.fn().mockResolvedValue({ available: false }),
    };

    const service = new OutlineRefinementService(mockManager);
    const result = await service.refineOutline(
      'Add completing the square before quadratic formula',
      initialQuadraticOutline,
      { topic: 'Quadratic Equations' }
    );

    expect(result.changes.added).toContain('Solving by Completing the Square');
    expect(result.updatedOutline.length).toBe(initialQuadraticOutline.length + 1);
  });

  it('8. Preserves selected/deselected states and manual teacher additions', () => {
    const customOutline: SlideOutlineItem[] = [
      ...initialQuadraticOutline,
      {
        id: 'teacher-custom-1',
        slideNumber: 7,
        title: 'Special Homework Challenge',
        actionGoal: 'Advanced Olympiad style question',
        selected: false, // Teacher explicitly unselected
        changeStatus: 'unchanged',
      },
    ];

    const result = refineOutlineHeuristic('Include two solved examples in formula', customOutline, {
      topic: 'Quadratic Equations',
    });

    const challengeSlide = result.updatedOutline.find((s) => s.id === 'teacher-custom-1');
    expect(challengeSlide).toBeDefined();
    expect(challengeSlide?.title).toBe('Special Homework Challenge');
    expect(challengeSlide?.selected).toBe(false); // Selection state preserved!
  });

  it('9. Handles moving slides down and to explicit numerical positions', () => {
    const instruction = 'Move slide 2 down';
    const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, {
      topic: 'Quadratic Equations',
    });

    expect(result.changes.reordered).toBe(true);
    expect(result.updatedOutline[2].title).toBe('Standard Form');
  });

  it('10. Adds pedagogical summary or quiz at the end if requested', () => {
    const instruction = 'Add an interactive quiz';
    const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, {
      topic: 'Quadratic Equations',
    });

    expect(result.changes.added.length).toBe(1);
    expect(result.changes.added[0]).toContain('Quiz');
    const lastSlide = result.updatedOutline[result.updatedOutline.length - 1];
    expect(lastSlide.title).toContain('Quiz');
    expect(lastSlide.layoutArchetype).toBe('summary-quiz');
  });

  it('11. AI Provider integration parses structured response and preserves teacher context', async () => {
    const mockManager: any = {
      getActiveProvider: () => 'openai',
      hasApiKey: vi.fn().mockResolvedValue(true),
      checkOllamaStatus: vi.fn().mockResolvedValue({ available: true }),
      generateStructuredJson: vi.fn().mockResolvedValue({
        success: true,
        data: {
          explanation: 'Added historical context and adjusted Bloom taxonomy progression.',
          updatedOutline: [
            ...initialQuadraticOutline.slice(0, 1),
            {
              id: 'ai-history',
              title: 'Historical Origins & Babylonian Algebra',
              actionGoal: 'Explain geometrical dissections from ancient Babylon',
              layoutArchetype: 'concept-explanation',
              selected: true,
              changeStatus: 'added',
            },
            ...initialQuadraticOutline.slice(1),
          ],
          changes: {
            added: ['Historical Origins & Babylonian Algebra'],
            modified: [],
            removed: [],
            reordered: false,
          },
        },
      }),
    };

    const service = new OutlineRefinementService(mockManager);
    const result = await service.refineOutline(
      'Include historical origins of quadratic equations',
      initialQuadraticOutline,
      { topic: 'Quadratic Equations', provider: 'openai' },
      [
        {
          id: 'm1',
          sender: 'teacher',
          text: 'Initial draft looks good',
          timestamp: Date.now() - 5000,
        },
      ]
    );

    expect(result.explanation).toContain('historical context');
    expect(result.changes.added).toContain('Historical Origins & Babylonian Algebra');
    expect(result.updatedOutline[1].title).toBe('Historical Origins & Babylonian Algebra');
    expect(result.updatedOutline[1].slideNumber).toBe(2);
    expect(result.updatedOutline.length).toBe(initialQuadraticOutline.length + 1);
  });
});
