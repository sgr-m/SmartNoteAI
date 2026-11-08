/**
 * livePresentationService.test.ts — Unit Tests for Gamma-Style Progressive Slide Generation
 * Phase 6: Testing Asynchronous Slide-by-Slide Live Generation, Layouts, and Edits
 */

import { describe, expect, it, vi } from 'vitest';
import {
  LivePresentationService,
  livePresentationService,
} from '../src/renderer/services/aiPresentation/livePresentationService';
import { LiveSlideItem, SlideOutlineItem } from '../src/shared/aiPresentationTypes';

describe('Phase 6: Live Progressive Presentation Generation Service', () => {
  const sampleOutline: SlideOutlineItem[] = [
    {
      id: 'o-1',
      slideNumber: 1,
      title: 'Introduction to Quadratic Equations',
      actionGoal: 'Define standard form ax^2 + bx + c = 0',
      selected: true,
    },
    {
      id: 'o-2',
      slideNumber: 2,
      title: 'Solving by Factoring',
      actionGoal: 'Step-by-step worked example',
      selected: true,
    },
    {
      id: 'o-3',
      slideNumber: 3,
      title: 'Quadratic Formula and Discriminant',
      actionGoal: 'Explain formula and nature of roots',
      selected: true,
    },
  ];

  it('1. Generates slides progressively and emits sequential generation states', async () => {
    const statesObserved: Record<number, string[]> = {};
    const completedSlides: LiveSlideItem[] = [];

    const slides = await livePresentationService.startLiveGeneration(sampleOutline, {
      topic: 'Quadratic Equations',
      subject: 'Mathematics',
      gradeLevel: 'Grade 10',
      onSlideUpdate: (updatedSlide) => {
        const num = updatedSlide.slideNumber;
        if (!statesObserved[num]) statesObserved[num] = [];
        if (!statesObserved[num].includes(updatedSlide.status)) {
          statesObserved[num].push(updatedSlide.status);
        }
      },
      onSlideCompleted: (completedSlide) => {
        completedSlides.push({ ...completedSlide });
      },
    });

    expect(slides.length).toBe(3);
    expect(completedSlides.length).toBe(3);

    // Verify all slides achieved 'completed' status
    slides.forEach((s) => {
      expect(s.status).toBe('completed');
      expect(s.page).toBeDefined();
      expect(s.contentSpec).toBeDefined();
      expect(s.contentSpec?.title).toBe(s.title);
      expect(s.page?.objects.length).toBeGreaterThan(0);
    });

    // Verify progression of states for each slide:
    // Started at 'waiting', went through 'generating-content', 'selecting-layout', 'rendering', and 'completed'
    expect(statesObserved[1]).toContain('generating-content');
    expect(statesObserved[1]).toContain('selecting-layout');
    expect(statesObserved[1]).toContain('rendering');
    expect(statesObserved[1]).toContain('completed');

    expect(statesObserved[2]).toContain('generating-content');
    expect(statesObserved[2]).toContain('completed');
  });

  it('2. First slide completes and is available before the second slide begins', async () => {
    const events: string[] = [];

    await livePresentationService.startLiveGeneration(sampleOutline.slice(0, 2), {
      topic: 'Quadratic Equations',
      onSlideUpdate: (slide) => {
        events.push(`Slide ${slide.slideNumber}: ${slide.status}`);
      },
      onSlideCompleted: (slide) => {
        events.push(`Slide ${slide.slideNumber} COMPLETED`);
      },
    });

    // Ensure Slide 1 completed BEFORE Slide 2 was completed
    const slide1DoneIdx = events.indexOf('Slide 1 COMPLETED');
    const slide2DoneIdx = events.indexOf('Slide 2 COMPLETED');

    expect(slide1DoneIdx).toBeGreaterThan(-1);
    expect(slide2DoneIdx).toBeGreaterThan(-1);
    expect(slide1DoneIdx).toBeLessThan(slide2DoneIdx);
  });

  it('3. Changes the layout of an individual slide and recompiles its page', async () => {
    const slides = await livePresentationService.startLiveGeneration([sampleOutline[0]], {
      topic: 'Quadratic Equations',
    });

    const initialSlide = slides[0];
    expect(initialSlide.page).toBeDefined();

    const updated = await livePresentationService.changeSlideLayout(
      initialSlide,
      'problem-solution'
    );

    expect(updated.layoutArchetype).toBe('problem-solution');
    expect(updated.contentSpec?.layout).toBe('problem-solution');
    expect(updated.editedByUser).toBe(true);
    expect(updated.page).toBeDefined();
  });

  it('4. Updates slide title and recompiles page with new title', async () => {
    const slides = await livePresentationService.startLiveGeneration([sampleOutline[0]], {
      topic: 'Quadratic Equations',
    });

    const updated = await livePresentationService.updateSlideTitle(
      slides[0],
      'Mastering Quadratic Equations'
    );

    expect(updated.title).toBe('Mastering Quadratic Equations');
    expect(updated.contentSpec?.title).toBe('Mastering Quadratic Equations');
    expect(updated.page?.title).toBe('Mastering Quadratic Equations');
    expect(updated.editedByUser).toBe(true);
  });

  it('5. Regenerates an individual slide without modifying other slides', async () => {
    const slides = await livePresentationService.startLiveGeneration(sampleOutline.slice(0, 2), {
      topic: 'Quadratic Equations',
    });

    const originalSlide1Id = slides[0].id;
    const originalSlide2PageId = slides[1].page?.id;

    // Regenerate slide 1 only
    const regeneratedSlide1 = await livePresentationService.regenerateSingleSlide(slides[0], {
      topic: 'Quadratic Equations',
    });

    expect(regeneratedSlide1.status).toBe('completed');
    expect(regeneratedSlide1.editedByUser).toBe(true);
    expect(regeneratedSlide1.id).toBe(originalSlide1Id);

    // Slide 2 remains untouched with same page ID
    expect(slides[1].page?.id).toBe(originalSlide2PageId);
  });

  it('6. Preserves previously completed slides when cancellation is triggered', async () => {
    const controller = new AbortController();

    let completedSlideCount = 0;
    const slidesPromise = livePresentationService.startLiveGeneration(sampleOutline, {
      topic: 'Quadratic Equations',
      signal: controller.signal,
      onSlideCompleted: () => {
        completedSlideCount++;
        if (completedSlideCount === 1) {
          // Abort right after first slide completes
          controller.abort();
        }
      },
    });

    const result = await slidesPromise;

    // Slide 1 should be completed
    expect(result[0].status).toBe('completed');
    expect(result[0].page).toBeDefined();

    // Subsequent slides remained in waiting state
    expect(result[2].status).toBe('waiting');
  });

  it('7. Handles individual slide failure gracefully and allows retry', async () => {
    const mockService = new LivePresentationService();

    let failOnce = true;
    vi.spyOn(mockService, 'generateSlideContent').mockImplementation(async (slide) => {
      if (slide.slideNumber === 1 && failOnce) {
        failOnce = false;
        throw new Error('Simulated network timeout');
      }
      return {
        slideNumber: slide.slideNumber,
        title: slide.title,
        layout: 'concept-explanation',
        cards: [{ cardType: 'basic-info', title: 'Test Card', body: 'Test explanation' }],
      };
    });

    const slides = await mockService.startLiveGeneration(sampleOutline.slice(0, 2), {
      topic: 'Quadratic Equations',
    });

    // Slide 1 failed
    expect(slides[0].status).toBe('failed');
    expect(slides[0].error).toContain('Simulated network timeout');

    // Slide 2 completed despite Slide 1 failure!
    expect(slides[1].status).toBe('completed');

    // Retry slide 1
    const retriedSlide1 = await mockService.retryFailedSlide(slides[0], {
      topic: 'Quadratic Equations',
    });

    expect(retriedSlide1.status).toBe('completed');
    expect(retriedSlide1.error).toBeUndefined();
  });
});

