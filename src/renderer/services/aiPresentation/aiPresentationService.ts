/**
 * aiPresentationService.ts — Presentation Generation Orchestration Service
 * Milestone 5: TASK-108
 * 
 * Central asynchronous pipeline orchestrator that transforms teacher prompts into
 * a complete, visually structured, projector-ready, editable native SmartBoard presentation (Page[]).
 * 
 * Pipeline:
 * Teacher Options
 * → Provider Selection
 * → AI Content Generation
 * → Structured Response Validation
 * → Slide Definition Processing
 * → Theme Selection
 * → Layout Calculation
 * → Native Object Compilation
 * → Asset & Diagram Resolution
 * → Overflow Validation
 * → Final Native Page[]
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BoundingBox,
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
  GeneratePresentationOptions,
  GenerationStage,
  PlaceholderCategory,
  PresentationDeckSpec,
  PresentationGenerationProgress,
  PresentationGenerationResult,
  PresentationTheme,
  PresentationThemeId,
  SlideContentSpec,
  CustomSlideMaster,
} from '../../../shared/aiPresentationTypes';
import { CanvasObject, Layer, Page } from '../../../shared/types';
import { AIProviderManager, aiProviderManager } from './aiProviderManager';
import { customSlideMasterService } from './customSlideMasterService';
import { compileCustomMasterToNativeObjects } from './templateCompiler';
import {
  DEFAULT_PRESENTATION_THEME,
  getAllThemes,
  getThemeById,
  validateThemeContrast,
} from './presentationThemes';
import {
  generateCurriculumTemplateFallback,
  generateTeachingContent,
  normalizeTeacherInput,
  validateDeckContent,
} from './promptTemplates';
import {
  compileDeckSlideToNativeObjects,
  compileHtmlCardToNativeObjects,
  compileSlideFooterToNativeObjects,
  compileSlideHeaderToNativeObjects,
} from './hybridComponentBridge';
import {
  calculateCardBounds,
  calculateColumnBounds,
  calculateSlideRegions,
  detectOverflow,
} from './slideLayoutEngine';
import {
  createImagePlaceholder,
  resolveEducationalDiagram,
} from './assetResolver';

// ─── Standard Slide Layer Factory ─────────────────────────────────────────────

export function createStandardSlideLayers(): Layer[] {
  return [
    { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
    { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
    { id: 'drawing', name: 'Drawing', visible: true, locked: false, opacity: 1, order: 2 },
    { id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 3 },
    { id: 'interaction', name: 'Interaction', visible: true, locked: false, opacity: 1, order: 4 },
  ];
}

// ─── Subject / Keyword Category Mapper ────────────────────────────────────────

export function mapSubjectOrKeywordToCategory(
  subject?: string,
  keyword?: string
): PlaceholderCategory {
  const text = `${subject || ''} ${keyword || ''}`.toLowerCase();
  if (/anatomy|cell|organ|human|biology|dna|respiration|mitosis/.test(text)) return 'anatomy';
  if (/history|war|empire|revolution|century|ancient|civilization/.test(text)) return 'history';
  if (/geography|map|plate|earth|river|mountain|continent|biome|volcano/.test(text)) return 'geography';
  if (/circuit|code|binary|algorithm|software|computer|data|network|programming/.test(text)) return 'technology';
  if (/math|geometry|calculus|algebra|triangle|equation|formula|trigonometry/.test(text)) return 'mathematics';
  if (/physics|chemistry|reaction|atom|molecule|optics|energy|force|motion/.test(text)) return 'science';
  return 'general';
}

// ─── Presentation Page Validator ──────────────────────────────────────────────

export interface PageValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePresentationPages(pages: Page[]): PageValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(pages) || pages.length === 0) {
    errors.push('Presentation deck contains zero pages.');
    return { isValid: false, errors, warnings };
  }

  pages.forEach((page, idx) => {
    const slideNum = idx + 1;
    if (!page.id || typeof page.id !== 'string') {
      errors.push(`Page ${slideNum} is missing a valid UUID.`);
    }
    if (page.width !== DEFAULT_SLIDE_WIDTH || page.height !== DEFAULT_SLIDE_HEIGHT) {
      warnings.push(
        `Page ${slideNum} dimensions (${page.width}x${page.height}) deviate from standard 16:9 (${DEFAULT_SLIDE_WIDTH}x${DEFAULT_SLIDE_HEIGHT}).`
      );
    }
    if (!page.background || !page.background.color) {
      errors.push(`Page ${slideNum} is missing a valid background configuration.`);
    }
    if (!Array.isArray(page.layers) || page.layers.length === 0) {
      errors.push(`Page ${slideNum} is missing layer definitions.`);
    }
    if (!Array.isArray(page.objects) || page.objects.length === 0) {
      errors.push(`Page ${slideNum} contains zero canvas objects.`);
    } else {
      page.objects.forEach((obj, oIdx) => {
        if (!obj || typeof obj !== 'object') {
          errors.push(`Page ${slideNum}, Object ${oIdx + 1} is invalid.`);
          return;
        }
        const anyObj = obj as any;
        if (!anyObj.id) {
          errors.push(`Page ${slideNum}, Object ${oIdx + 1} is missing an object id.`);
        }
        if (!anyObj.type) {
          errors.push(`Page ${slideNum}, Object ${anyObj.id || oIdx + 1} is missing an object type.`);
        }
        if (!anyObj.layerId) {
          warnings.push(`Page ${slideNum}, Object ${anyObj.id || oIdx + 1} is missing layerId.`);
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Presentation Generation Service ──────────────────────────────────────────

export class AIPresentationService {
  private providerManager: AIProviderManager;

  constructor(manager?: AIProviderManager) {
    this.providerManager = manager || aiProviderManager;
  }

  /**
   * Helper to emit progress updates cleanly.
   */
  private reportProgress(
    onProgress: ((progress: PresentationGenerationProgress) => void) | undefined,
    stage: GenerationStage,
    progressPercent: number,
    message: string,
    currentSlide?: number,
    totalSlides?: number
  ): void {
    if (onProgress) {
      try {
        onProgress({
          stage,
          progressPercent: Math.max(0, Math.min(100, progressPercent)),
          message,
          currentSlide,
          totalSlides,
        });
      } catch {
        // Progress subscriber threw; ignore safely to protect pipeline
      }
    }
  }

  /**
   * Check if the generation has been aborted via AbortSignal.
   */
  private checkCancellation(signal?: AbortSignal): void {
    if (signal?.aborted) {
      const err = new DOMException('Presentation generation was cancelled.', 'AbortError');
      throw err;
    }
  }

  /**
   * Get all available educational presentation themes.
   */
  public getAvailableThemes(): PresentationTheme[] {
    return getAllThemes();
  }

  /**
   * Resolve a theme by ID with safe fallback.
   */
  public getTheme(themeId?: string): PresentationTheme {
    return getThemeById(themeId);
  }

  /**
   * Main asynchronous pipeline: Transforms teacher inputs into a complete, native Page[] deck.
   * Does NOT directly mutate the documentStore.
   */
  public async generatePresentation(
    options: GeneratePresentationOptions
  ): Promise<PresentationGenerationResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const signal = options.signal;
    const onProgress = options.onProgress;

    try {
      // ─── Stage 1: Options Normalization & Provider Selection ────────────────
      this.checkCancellation(signal);
      this.reportProgress(onProgress, 'provider-connection', 5, 'Validating options and verifying AI provider...');

      const normInput = normalizeTeacherInput(options);
      const activeProvider = options.provider || this.providerManager.getActiveProvider();
      const selectedModel = options.model || this.providerManager.getSelectedModel(activeProvider);

      // Verify provider availability unless forcing template fallback
      if (!options.forceTemplateFallback) {
        if (activeProvider === 'ollama') {
          const status = await this.providerManager.checkOllamaStatus();
          if (!status.available) {
            warnings.push(`Local Ollama daemon is offline (${status.message}). Falling back to curriculum template.`);
          }
        } else {
          const hasKey = await this.providerManager.hasApiKey(activeProvider);
          if (!hasKey) {
            warnings.push(`No API key configured for provider "${activeProvider}". Falling back to curriculum template.`);
          }
        }
      }

      this.checkCancellation(signal);

      // ─── Stage 2: AI Content Generation ─────────────────────────────────────
      this.reportProgress(
        onProgress,
        'content-generation',
        20,
        options.forceTemplateFallback
          ? 'Generating structured curriculum presentation template...'
          : `Generating presentation content using ${activeProvider} (${selectedModel})...`
      );

      const contentResult = await generateTeachingContent(normInput, {
        providerManager: this.providerManager,
        provider: options.provider,
        model: options.model,
        signal,
        forceTemplateFallback: options.forceTemplateFallback,
      });

      if (contentResult.warnings && contentResult.warnings.length > 0) {
        warnings.push(...contentResult.warnings);
      }

      this.checkCancellation(signal);

      // ─── Stage 3: Structured Content Validation & Repair ────────────────────
      this.reportProgress(onProgress, 'content-validation', 45, 'Validating pedagogical structure and card schemas...');

      let validatedDeck: PresentationDeckSpec;
      if (contentResult.success && contentResult.deck) {
        const valRes = validateDeckContent(contentResult.deck, normInput);
        validatedDeck = valRes.deck;
        if (valRes.errors.length > 0) {
          warnings.push(...valRes.errors);
        }
        if (valRes.overallScore !== undefined) {
          this.reportProgress(
            onProgress,
            'content-validation',
            50,
            `Validated ${validatedDeck.slides.length} slides (quality score: ${valRes.overallScore}/100, status: ${valRes.status || 'success'})...`
          );
        }
      } else {
        warnings.push('AI content generation returned no deck; generated offline curriculum template.');
        validatedDeck = generateCurriculumTemplateFallback(normInput);
      }

      // Ensure we have at least 1 slide
      if (!validatedDeck.slides || validatedDeck.slides.length === 0) {
        warnings.push('Deck had 0 slides; generating emergency curriculum template fallback.');
        validatedDeck = generateCurriculumTemplateFallback(normInput);
      }

      this.checkCancellation(signal);

      // ─── Stage 4: Theme Selection & Contrast Verification ───────────────────
      this.reportProgress(onProgress, 'layout-processing', 55, 'Selecting presentation theme and layout geometry...');

      const customMaster =
        options.customMaster ||
        (options.customMasterId ? customSlideMasterService.getMasterById(options.customMasterId) : undefined);

      const themeId = options.themeId || validatedDeck.themeId || 'modern-academic';
      const theme = customMaster
        ? customSlideMasterService.masterToPresentationTheme(customMaster)
        : getThemeById(themeId);

      const contrast = validateThemeContrast(theme);
      if (!contrast.isValid) {
        warnings.push(`Theme "${theme.name}" contrast notice: ${contrast.issues.join('; ')}`);
      }

      this.checkCancellation(signal);

      // ─── Stage 5 & 6: Slide Compilation, Layout, and Asset Resolution ────────
      const totalSlides = validatedDeck.slides.length;
      const pages: Page[] = [];

      for (let i = 0; i < totalSlides; i++) {
        this.checkCancellation(signal);

        const slide = validatedDeck.slides[i];
        const slideNum = i + 1;
        const progressPct = 60 + Math.round((25 * i) / totalSlides);

        this.reportProgress(
          onProgress,
          'slide-compilation',
          progressPct,
          `Compiling slide ${slideNum} of ${totalSlides}: "${slide.title}"...`,
          slideNum,
          totalSlides
        );

        // 1. Compile base native objects (Background, Header, Content Cards, Footer)
        const slideObjects: CanvasObject[] = customMaster
          ? compileCustomMasterToNativeObjects(customMaster, slide, {
              slideIndex: i,
              totalSlides,
              topic: validatedDeck.topic,
              defaultLayerId: 'objects',
              includeBackground: true,
              includeHeader: true,
              includeFooter: true,
            })
          : compileDeckSlideToNativeObjects(slide, theme, {
              slideIndex: i,
              totalSlides,
              topic: validatedDeck.topic,
              defaultLayerId: 'objects',
              includeBackground: true,
              includeHeader: true,
              includeFooter: true,
            });

        // 2. Asset & Educational Diagram Resolution
        this.reportProgress(
          onProgress,
          'asset-resolution',
          progressPct + 2,
          `Resolving diagrams and visual assets for slide ${slideNum}...`,
          slideNum,
          totalSlides
        );

        if (slide.diagram) {
          try {
            // Allocate bounds in lower-right or dedicated diagram area
            const diagramBounds: BoundingBox = {
              x: DEFAULT_SLIDE_WIDTH - 420 - 80,
              y: DEFAULT_SLIDE_HEIGHT - 320 - 70,
              width: 420,
              height: 260,
            };
            const diagramObjects = resolveEducationalDiagram(slide.diagram, diagramBounds, theme);
            slideObjects.push(...diagramObjects);
          } catch (err: any) {
            warnings.push(`Slide ${slideNum}: Diagram resolution error (${err?.message || 'unknown error'}).`);
          }
        } else if (slide.illustrationKeyword) {
          // If slide specifically requested an illustration keyword, create a category placeholder
          try {
            const category = mapSubjectOrKeywordToCategory(validatedDeck.subject, slide.illustrationKeyword);
            const placeholderBounds: BoundingBox = {
              x: DEFAULT_SLIDE_WIDTH - 380 - 80,
              y: DEFAULT_SLIDE_HEIGHT - 260 - 70,
              width: 380,
              height: 220,
            };
            const placeholder = createImagePlaceholder(
              { category, title: slide.illustrationKeyword },
              placeholderBounds,
              { theme }
            );
            slideObjects.push(placeholder);
          } catch (err: any) {
            warnings.push(`Slide ${slideNum}: Asset placeholder error (${err?.message || 'unknown'}).`);
          }
        }

        // 3. Overflow Detection & Boundary Validation
        const slideCanvasBounds: BoundingBox = {
          x: 0,
          y: 0,
          width: DEFAULT_SLIDE_WIDTH,
          height: DEFAULT_SLIDE_HEIGHT,
        };

        slideObjects.forEach((obj) => {
          const o = obj as any;
          if (typeof o.x === 'number' && typeof o.y === 'number' && typeof o.width === 'number' && typeof o.height === 'number') {
            const objBounds: BoundingBox = { x: o.x, y: o.y, width: o.width, height: o.height };
            if (detectOverflow(objBounds, slideCanvasBounds)) {
              warnings.push(
                `Slide ${slideNum}: Object "${o.label || o.id}" extends beyond 16:9 canvas [right: ${o.x + o.width}, bottom: ${o.y + o.height}].`
              );
            }
          }
        });

        // 4. Construct complete native Page object
        const page: Page = {
          id: uuidv4(),
          title: slide.title ? slide.title.trim() : `Slide ${slideNum}`,
          width: DEFAULT_SLIDE_WIDTH,
          height: DEFAULT_SLIDE_HEIGHT,
          background: {
            type: 'blank',
            color: theme.backgroundColor,
          },
          layers: createStandardSlideLayers(),
          objects: slideObjects,
          transition: {
            type: 'fade',
            duration: 300,
          },
        };

        pages.push(page);
      }

      this.checkCancellation(signal);

      // ─── Stage 7: Final Validation ──────────────────────────────────────────
      this.reportProgress(onProgress, 'final-validation', 95, 'Running final slide deck integrity check...');

      const validationReport = validatePresentationPages(pages);
      if (!validationReport.isValid) {
        throw new Error(`Presentation validation failed: ${validationReport.errors.join('; ')}`);
      }
      if (validationReport.warnings.length > 0) {
        warnings.push(...validationReport.warnings);
      }

      // ─── Stage 8: Completed ─────────────────────────────────────────────────
      const durationMs = Math.round(performance.now() - startTime);
      this.reportProgress(
        onProgress,
        'completed',
        100,
        `Successfully generated ${pages.length} presentation slides in ${(durationMs / 1000).toFixed(1)}s.`,
        pages.length,
        pages.length
      );

      return {
        success: true,
        pages,
        deckSpec: validatedDeck,
        source: contentResult.source,
        modelUsed: contentResult.modelUsed || selectedModel,
        providerUsed: activeProvider,
        themeUsed: theme,
        durationMs,
        warnings,
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);

      if (err?.name === 'AbortError' || signal?.aborted) {
        this.reportProgress(onProgress, 'cancelled', 0, 'Presentation generation was cancelled by teacher.');
        return {
          success: false,
          pages: [],
          source: 'curriculum-template',
          themeUsed: getThemeById(options.themeId),
          durationMs,
          warnings,
          error: 'Presentation generation was cancelled.',
          cancelled: true,
        };
      }

      this.reportProgress(onProgress, 'failed', 0, `Presentation generation failed: ${err?.message || 'Unknown error'}`);
      return {
        success: false,
        pages: [],
        source: 'curriculum-template',
        themeUsed: getThemeById(options.themeId),
        durationMs,
        warnings,
        error: err?.message || 'An unexpected error occurred during presentation generation.',
      };
    }
  }

  /**
   * Compiles an individual slide specification directly into a single native Page.
   */
  public async generateSingleSlide(
    slideSpec: SlideContentSpec,
    themeId?: PresentationThemeId,
    options?: { topic?: string; slideIndex?: number; totalSlides?: number; customMaster?: CustomSlideMaster }
  ): Promise<Page> {
    const theme = getThemeById(themeId);
    const slideIndex = options?.slideIndex || 0;
    const totalSlides = options?.totalSlides || 1;
    const topic = options?.topic || 'Classroom Presentation';

    let objects: CanvasObject[];
    if (options?.customMaster) {
      objects = compileCustomMasterToNativeObjects(options.customMaster, slideSpec, {
        slideIndex,
        totalSlides,
        topic,
        defaultLayerId: 'objects',
      });
    } else {
      objects = compileDeckSlideToNativeObjects(slideSpec, theme, {
        slideIndex,
        totalSlides,
        topic,
        defaultLayerId: 'objects',
        includeBackground: true,
        includeHeader: true,
        includeFooter: true,
      });

      if (slideSpec.diagram) {
        try {
          const diagramBounds: BoundingBox = {
            x: DEFAULT_SLIDE_WIDTH - 420 - 80,
            y: DEFAULT_SLIDE_HEIGHT - 320 - 70,
            width: 420,
            height: 260,
          };
          const diagramObjects = resolveEducationalDiagram(slideSpec.diagram, diagramBounds, theme);
          objects.push(...diagramObjects);
        } catch {
          // Safe diagram fallback
        }
      }
    }

    const bgColor = options?.customMaster ? options.customMaster.theme.backgroundColor : theme.backgroundColor;

    return {
      id: uuidv4(),
      title: slideSpec.title || `Slide ${slideIndex + 1}`,
      width: DEFAULT_SLIDE_WIDTH,
      height: DEFAULT_SLIDE_HEIGHT,
      background: {
        type: 'blank',
        color: bgColor,
      },
      layers: createStandardSlideLayers(),
      objects,
      transition: {
        type: 'fade',
        duration: 300,
      },
    };
  }
}

// ─── Export Default Singleton ─────────────────────────────────────────────────

export const aiPresentationService = new AIPresentationService();
