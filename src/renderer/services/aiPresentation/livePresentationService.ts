/**
 * livePresentationService.ts — Gamma-Style Progressive Slide Generation Orchestrator
 * Phase 6: Live Workspace with Progressive Slide-by-Slide Asynchronous Generation
 *
 * Implements real-time progressive presentation generation where slides appear
 * one-by-one as they are generated, validated, and rendered into high-fidelity
 * vector pages, with full per-slide state tracking, cancellation, and in-flight editing.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  HtmlCardSpec,
  LiveGenerationOptions,
  LiveSlideItem,
  PresentationThemeId,
  SlideContentSpec,
  SlideLayoutType,
  SlideOutlineItem,
} from '../../../shared/aiPresentationTypes';
import { Page } from '../../../shared/types';
import { aiPresentationService } from './aiPresentationService';
import { aiProviderManager, AIProviderManager } from './aiProviderManager';
import { customSlideMasterService } from './customSlideMasterService';
import {
  generateOutlineDrivenSlides,
  normalizeTeacherInput,
  NormalizedTeacherInput,
  validateSlideContent,
} from './promptTemplates';

export class LivePresentationService {
  private providerManager: AIProviderManager;

  constructor(providerManager?: AIProviderManager) {
    this.providerManager = providerManager || aiProviderManager;
  }

  /**
   * Starts progressive slide generation.
   * Emits live status updates as each slide transitions:
   * 'waiting' -> 'generating-content' -> 'selecting-layout' -> 'rendering' -> 'completed' / 'failed'
   * Completed slides appear in real time in the live preview workspace.
   */
  public async startLiveGeneration(
    outline: SlideOutlineItem[],
    options: LiveGenerationOptions
  ): Promise<LiveSlideItem[]> {
    const normInput = normalizeTeacherInput({
      topic: options.topic,
      subject: options.subject,
      gradeLevel: options.gradeLevel,
      language: options.language,
      difficulty: options.difficulty,
      teachingStyle: options.teachingStyle,
      themeId: options.themeId,
      customMasterId: options.customMasterId,
      customMaster: options.customMaster,
      slideOutline: outline,
    });

    const activeOutline = outline.filter((o) => o.selected !== false);
    const effectiveOutline = activeOutline.length > 0 ? activeOutline : outline;

    // 1. Initialize all slides in 'waiting' state
    const liveSlides: LiveSlideItem[] = effectiveOutline.map((item, index) => ({
      id: item.id || `live-slide-${index + 1}-${uuidv4().slice(0, 6)}`,
      slideNumber: index + 1,
      title: item.title,
      actionGoal: item.actionGoal || item.objective,
      layoutArchetype: item.layoutArchetype || 'concept-explanation',
      status: 'waiting',
      progressMessage: 'Waiting in queue...',
    }));

    // Emit initial queue to workspace
    if (options.onSlideUpdate && liveSlides.length > 0) {
      options.onSlideUpdate(liveSlides[0], [...liveSlides]);
    }

    let completedCount = 0;

    // 2. Process each slide sequentially and asynchronously
    for (let i = 0; i < liveSlides.length; i++) {
      if (options.signal?.aborted) {
        break;
      }

      const slide = liveSlides[i];

      try {
        // Step A: Generating Content
        slide.status = 'generating-content';
        slide.progressMessage = 'Generating educational explanations & formulas...';
        options.onSlideUpdate?.(slide, [...liveSlides]);

        const contentSpec = await this.generateSlideContent(
          slide,
          options,
          normInput,
          i,
          liveSlides.length
        );

        if (options.signal?.aborted) break;

        // Step B: Selecting Layout
        slide.status = 'selecting-layout';
        slide.layoutArchetype = contentSpec.layout;
        slide.progressMessage = `Selecting template layout (${contentSpec.layout})...`;
        options.onSlideUpdate?.(slide, [...liveSlides]);

        // Step C: Rendering Vector Slide
        slide.status = 'rendering';
        slide.progressMessage = 'Rendering vector elements & KaTeX formulas...';
        options.onSlideUpdate?.(slide, [...liveSlides]);

        const customMaster =
          options.customMaster ||
          (options.customMasterId
            ? customSlideMasterService.getMasterById(options.customMasterId)
            : undefined);

        const page = await aiPresentationService.generateSingleSlide(
          contentSpec,
          options.themeId || 'modern-academic',
          {
            topic: options.topic,
            slideIndex: i,
            totalSlides: liveSlides.length,
            customMaster,
          }
        );

        // Step D: Completed
        slide.status = 'completed';
        slide.contentSpec = contentSpec;
        slide.page = page;
        slide.progressMessage = 'Completed and ready for classroom presentation.';
        completedCount++;

        options.onSlideUpdate?.(slide, [...liveSlides]);
        options.onSlideCompleted?.(slide, [...liveSlides]);
        options.onProgress?.(completedCount, liveSlides.length, slide.title);
      } catch (err: any) {
        if (options.signal?.aborted) {
          break;
        }

        console.error(`[LivePresentationService] Error generating slide ${slide.slideNumber}:`, err);
        slide.status = 'failed';
        slide.error = err?.message || 'Failed to generate slide content';
        slide.progressMessage = `Generation failed: ${slide.error}`;
        options.onSlideUpdate?.(slide, [...liveSlides]);
      }
    }

    return liveSlides;
  }

  /**
   * Generates content specification for an individual slide.
   * Queries active AI provider when available; falls back to structured curriculum templates.
   */
  public async generateSlideContent(
    slide: LiveSlideItem | SlideOutlineItem,
    options: LiveGenerationOptions,
    normInput?: NormalizedTeacherInput,
    slideIndex = 0,
    totalSlides = 1
  ): Promise<SlideContentSpec> {
    const norm =
      normInput ||
      normalizeTeacherInput({
        topic: options.topic,
        subject: options.subject,
        gradeLevel: options.gradeLevel,
        difficulty: options.difficulty,
        teachingStyle: options.teachingStyle,
      });

    const activeProvider = options.provider || this.providerManager.getActiveProvider();
    let isProviderReady = false;

    try {
      if (activeProvider === 'ollama') {
        const status = await this.providerManager.checkOllamaStatus();
        isProviderReady = status.available && (status.status === 'ready' || status.installedModels.length > 0);
      } else {
        isProviderReady = await this.providerManager.hasApiKey(activeProvider);
      }
    } catch {
      isProviderReady = false;
    }

    if (isProviderReady && !options.signal?.aborted) {
      try {
        const aiSpec = await this.queryAiForSlideContent(slide, options, norm, slideIndex, totalSlides);
        if (aiSpec && aiSpec.title) {
          const { repairedSlide: validated } = validateSlideContent(aiSpec, {
            topic: options.topic,
            subject: norm.subject,
            gradeLevel: norm.gradeLevel,
            slideIndex,
            totalSlides,
            outlineItem: {
              title: slide.title,
              actionGoal: (slide as any).actionGoal,
            },
            normInput: norm,
          });

          return validated;
        }
      } catch (aiErr) {
        console.warn(`[LivePresentationService] AI generation failed for slide "${slide.title}", using curriculum template:`, aiErr);
      }
    }

    // Deterministic educational curriculum template generator
    const fallbackSlides = generateOutlineDrivenSlides(
      [
        {
          slideNumber: slide.slideNumber,
          title: slide.title,
          actionGoal: (slide as any).actionGoal,
          layoutArchetype: slide.layoutArchetype,
        },
      ],
      norm
    );

    const generated = fallbackSlides[0];
    const { repairedSlide: validated } = validateSlideContent(generated, {
      topic: options.topic,
      subject: norm.subject,
      gradeLevel: norm.gradeLevel,
      slideIndex,
      totalSlides,
      outlineItem: {
        title: slide.title,
        actionGoal: (slide as any).actionGoal,
      },
      normInput: norm,
    });

    return validated;
  }

  /**
   * Calls AI provider for a targeted single-slide generation.
   */
  private async queryAiForSlideContent(
    slide: LiveSlideItem | SlideOutlineItem,
    options: LiveGenerationOptions,
    norm: NormalizedTeacherInput,
    slideIndex: number,
    totalSlides: number
  ): Promise<SlideContentSpec | null> {
    const activeProvider = options.provider || this.providerManager.getActiveProvider();
    const model = options.model || this.providerManager.getSelectedModel(activeProvider);

    const systemPrompt = `You are an expert pedagogical presentation designer for SmartBoard Studio.
Generate a complete, rich, classroom-ready educational slide.
CRITICAL PEDAGOGICAL RULES:
1. Provide comprehensive teaching material (clear definitions, step-by-step derivations, worked numerical problems, or key takeaways).
2. DO NOT output blank or placeholder text.
3. For mathematics/physics, include raw KaTeX math strings (e.g. "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}").
4. Return pure JSON conforming strictly to the SlideContentSpec schema:
{
  "slideNumber": ${slide.slideNumber || slideIndex + 1},
  "title": "${slide.title}",
  "subtitle": "${norm.subject} • ${norm.gradeLevel}",
  "layout": "${slide.layoutArchetype || 'concept-explanation'}",
  "formula": "optional LaTeX formula",
  "formulaName": "optional formula label",
  "cards": [
    {
      "cardType": "basic-info" | "definition" | "problem-solution" | "key-takeaway" | "comparison" | "summary",
      "title": "Card Title",
      "badge": "Category Badge",
      "body": "Detailed educational explanation...",
      "bulletPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "notes": "Teacher lecture notes and student discussion questions"
}`;

    const userPrompt = `LESSON TOPIC: ${options.topic}
SUBJECT: ${norm.subject}
GRADE LEVEL: ${norm.gradeLevel}
TEACHING STYLE: ${options.teachingStyle || 'interactive'}

SLIDE ${slide.slideNumber || slideIndex + 1} OF ${totalSlides}:
TITLE: "${slide.title}"
PEDAGOGICAL GOAL: "${(slide as any).actionGoal || 'Provide comprehensive explanation with examples'}"
PREFERRED LAYOUT: "${slide.layoutArchetype || 'concept-explanation'}"

Generate the complete educational slide JSON now:`;

    const res = await this.providerManager.generateStructuredJson<SlideContentSpec>({
      provider: activeProvider,
      model,
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.4,
      timeoutMs: 25000,
      signal: options.signal,
    });

    if (res.success && res.data && res.data.title) {
      return res.data;
    }

    return null;
  }

  /**
   * Regenerates an individual slide without modifying any other slide.
   */
  public async regenerateSingleSlide(
    slide: LiveSlideItem,
    options: LiveGenerationOptions
  ): Promise<LiveSlideItem> {
    const normInput = normalizeTeacherInput({
      topic: options.topic,
      subject: options.subject,
      gradeLevel: options.gradeLevel,
      themeId: options.themeId,
      customMasterId: options.customMasterId,
      customMaster: options.customMaster,
    });

    slide.status = 'generating-content';
    slide.progressMessage = 'Regenerating slide content...';

    const contentSpec = await this.generateSlideContent(
      slide,
      options,
      normInput,
      slide.slideNumber - 1,
      1
    );

    slide.status = 'rendering';
    slide.progressMessage = 'Compiling regenerated vector slide...';

    const customMaster =
      options.customMaster ||
      (options.customMasterId
        ? customSlideMasterService.getMasterById(options.customMasterId)
        : undefined);

    const page = await aiPresentationService.generateSingleSlide(
      contentSpec,
      options.themeId || 'modern-academic',
      {
        topic: options.topic,
        slideIndex: slide.slideNumber - 1,
        totalSlides: 1,
        customMaster,
      }
    );

    slide.status = 'completed';
    slide.contentSpec = contentSpec;
    slide.page = page;
    slide.error = undefined;
    slide.progressMessage = 'Slide regenerated successfully.';
    slide.editedByUser = true;

    return slide;
  }

  /**
   * Changes the layout archetype of an existing slide and recompiles it.
   */
  public async changeSlideLayout(
    slide: LiveSlideItem,
    newLayout: SlideLayoutType,
    options: {
      topic?: string;
      themeId?: PresentationThemeId;
      customMasterId?: string;
      customMaster?: any;
    } = {}
  ): Promise<LiveSlideItem> {
    if (!slide.contentSpec) {
      slide.layoutArchetype = newLayout;
      return slide;
    }

    const updatedSpec: SlideContentSpec = {
      ...slide.contentSpec,
      layout: newLayout,
    };

    const customMaster =
      options.customMaster ||
      (options.customMasterId
        ? customSlideMasterService.getMasterById(options.customMasterId)
        : undefined);

    const page = await aiPresentationService.generateSingleSlide(
      updatedSpec,
      options.themeId || 'modern-academic',
      {
        topic: options.topic || slide.title,
        slideIndex: slide.slideNumber - 1,
        totalSlides: 1,
        customMaster,
      }
    );

    return {
      ...slide,
      layoutArchetype: newLayout,
      contentSpec: updatedSpec,
      page,
      editedByUser: true,
      progressMessage: `Layout updated to ${newLayout}.`,
    };
  }

  /**
   * Updates a slide's title and re-renders its native vector elements.
   */
  public async updateSlideTitle(
    slide: LiveSlideItem,
    newTitle: string,
    options: {
      topic?: string;
      themeId?: PresentationThemeId;
      customMasterId?: string;
      customMaster?: any;
    } = {}
  ): Promise<LiveSlideItem> {
    const cleanTitle = newTitle.trim() || slide.title;
    const updatedSpec: SlideContentSpec = {
      ...(slide.contentSpec || {
        slideNumber: slide.slideNumber,
        title: cleanTitle,
        layout: slide.layoutArchetype || 'concept-explanation',
        cards: [],
      }),
      title: cleanTitle,
    };

    const customMaster =
      options.customMaster ||
      (options.customMasterId
        ? customSlideMasterService.getMasterById(options.customMasterId)
        : undefined);

    const page = await aiPresentationService.generateSingleSlide(
      updatedSpec,
      options.themeId || 'modern-academic',
      {
        topic: options.topic || cleanTitle,
        slideIndex: slide.slideNumber - 1,
        totalSlides: 1,
        customMaster,
      }
    );

    return {
      ...slide,
      title: cleanTitle,
      contentSpec: updatedSpec,
      page,
      editedByUser: true,
      progressMessage: 'Title updated.',
    };
  }

  /**
   * Retries generation for a slide that previously failed.
   */
  public async retryFailedSlide(
    slide: LiveSlideItem,
    options: LiveGenerationOptions
  ): Promise<LiveSlideItem> {
    return this.regenerateSingleSlide(slide, options);
  }
}

export const livePresentationService = new LivePresentationService();
