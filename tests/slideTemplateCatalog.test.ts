import { describe, it, expect } from 'vitest';
import {
  MASTER_SLIDE_TEMPLATES,
  getAllSlideTemplates,
  getSlideTemplateById,
  matchTemplateByLayout,
} from '../src/renderer/services/aiPresentation/slideTemplateCatalog';
import {
  compileTemplateToNativeObjects,
  createPageFromTemplate,
} from '../src/renderer/services/aiPresentation/templateCompiler';
import { selectContentAwareLayout } from '../src/renderer/services/aiPresentation/slideLayoutEngine';
import { getThemeById } from '../src/renderer/services/aiPresentation/presentationThemes';
import { generateCurriculumTemplateFallback } from '../src/renderer/services/aiPresentation/promptTemplates';
import { compileDeckSlideToNativeObjects } from '../src/renderer/services/aiPresentation/hybridComponentBridge';

describe('Master Slide Template Architecture & Catalog (Milestone 5 / Phase 1)', () => {
  const defaultTheme = getThemeById('modern-academic');

  describe('1. Catalog Integrity & Schema Specifications', () => {
    it('defines 9 master slide template archetypes', () => {
      const templates = getAllSlideTemplates();
      expect(templates.length).toBe(9);
      expect(templates.map((t) => t.id)).toEqual([
        'title-hero',
        'concept-explanation',
        'mathematical-explanation',
        'comparison',
        'diagram-explanation',
        'problem-solution',
        'two-column-split',
        'step-process',
        'summary-takeaway',
      ]);
    });

    it('every template specifies exact 1920x1080 16:9 dimensions', () => {
      MASTER_SLIDE_TEMPLATES.forEach((tpl) => {
        expect(tpl.width).toBe(1920);
        expect(tpl.height).toBe(1080);
        expect(tpl.aspectRatio).toBe('16:9');
      });
    });

    it('every template has named, typed, bounded placeholders with non-empty default content', () => {
      MASTER_SLIDE_TEMPLATES.forEach((tpl) => {
        expect(tpl.placeholders.length).toBeGreaterThanOrEqual(2);
        tpl.placeholders.forEach((ph) => {
          expect(ph.id).toBeTruthy();
          expect(ph.role).toBeTruthy();
          expect(ph.contentType).toBeTruthy();
          expect(ph.bounds.x).toBeGreaterThanOrEqual(0);
          expect(ph.bounds.y).toBeGreaterThanOrEqual(0);
          expect(ph.bounds.x + ph.bounds.width).toBeLessThanOrEqual(1920);
          expect(ph.bounds.y + ph.bounds.height).toBeLessThanOrEqual(1080);
          const hasContent = Boolean(
            ph.defaultPlaceholderText ||
            ph.defaultFormula ||
            ph.defaultBadge ||
            ph.defaultBulletPoints?.length ||
            ph.defaultSteps?.length ||
            ph.defaultTable
          );
          expect(hasContent).toBe(true);
        });
      });
    });

    it('retrieves template by ID accurately with getSlideTemplateById', () => {
      const mathTpl = getSlideTemplateById('mathematical-explanation');
      expect(mathTpl).toBeDefined();
      expect(mathTpl?.name).toBe('Mathematical Derivation & Formula');

      const fallbackTpl = getSlideTemplateById('non-existent' as any);
      expect(fallbackTpl.id).toBe('concept-explanation');
    });

    it('matches templates by layout with safe fallback via matchTemplateByLayout', () => {
      expect(matchTemplateByLayout('mathematical-explanation').id).toBe('mathematical-explanation');
      expect(matchTemplateByLayout('problem-solution').id).toBe('problem-solution');
      expect(matchTemplateByLayout('comparison').id).toBe('comparison');
      expect(matchTemplateByLayout('diagram-explanation').id).toBe('diagram-explanation');
      expect(matchTemplateByLayout('definition-formula').id).toBe('mathematical-explanation');
      expect(matchTemplateByLayout('summary-quiz').id).toBe('summary-takeaway');
      expect(matchTemplateByLayout('unknown-layout' as any).id).toBe('concept-explanation');
    });
  });

  describe('2. Content-Aware Template Selection', () => {
    it('selects mathematical layout for mathematical keywords and formulas', () => {
      expect(
        selectContentAwareLayout({
          title: 'The Quadratic Formula and Derivation',
          content: 'Solve ax^2 + bx + c = 0 using completing the square',
        })
      ).toBe('mathematical-explanation');

      expect(
        selectContentAwareLayout({
          title: 'Calculus: Derivatives of Trigonometric Functions',
          hasFormula: true,
        })
      ).toBe('mathematical-explanation');
    });

    it('selects problem-solution layout for worked problems and calculations', () => {
      expect(
        selectContentAwareLayout({
          title: 'Classroom Worked Example & Analysis',
          content: 'Find all roots for the given quadratic equation',
        })
      ).toBe('problem-solution');
    });

    it('selects comparison layout for contrasting terms and versus', () => {
      expect(
        selectContentAwareLayout({
          title: 'Mitosis versus Meiosis: Cellular Division Contrasted',
        })
      ).toBe('comparison');
    });

    it('selects diagram-explanation layout for structural anatomy and schematics', () => {
      expect(
        selectContentAwareLayout({
          title: 'Cellular Anatomy & Organelle Flowchart',
          hasDiagram: true,
        })
      ).toBe('diagram-explanation');
    });

    it('selects step-process layout for sequential stages and algorithms', () => {
      expect(
        selectContentAwareLayout({
          title: 'Step-by-Step Factoring Algorithm',
        })
      ).toBe('step-process');
    });

    it('selects summary-takeaway layout for lesson reviews and exit tickets', () => {
      expect(
        selectContentAwareLayout({
          title: 'Lesson Summary & Exit Ticket',
        })
      ).toBe('summary-takeaway');
    });
  });

  describe('3. Native Template Compiler & Object Generation', () => {
    it('compiles template into standard native CanvasObjects without blank bodies', () => {
      const template = getSlideTemplateById('mathematical-explanation')!;
      const objects = compileTemplateToNativeObjects(template, defaultTheme);

      expect(objects.length).toBeGreaterThan(5);

      // Verify presence of background shape
      const bg = objects.find((o) => o.type === 'shape' && (o as any).width === 1920);
      expect(bg).toBeDefined();

      // Verify text objects exist for title and placeholders
      const textObjs = objects.filter((o) => o.type === 'text');
      expect(textObjs.length).toBeGreaterThanOrEqual(4);

      // Verify mathematical formula box placeholder is compiled
      const formulaText = textObjs.find((t) => (t as any).content.includes('x ='));
      expect(formulaText).toBeDefined();
    });

    it('creates a complete native Page with createPageFromTemplate', () => {
      const template = getSlideTemplateById('concept-explanation')!;
      const page = createPageFromTemplate(template, defaultTheme, {
        title: 'Photosynthesis & Light Reactions',
      });

      expect(page.id).toBeTruthy();
      expect(page.title).toBe('Photosynthesis & Light Reactions');
      expect(page.objects.length).toBeGreaterThan(4);
      expect(page.background.color).toBe(defaultTheme.backgroundColor);
    });
  });

  describe('4. Slide Bridge & Content-Filled Slide Compilation', () => {
    it('compiles a slide with 0 cards by falling back to template placeholders (NEVER blank)', () => {
      const slideSpec = {
        slideNumber: 2,
        title: 'Quadratic Equations — Essential Principles',
        subtitle: 'Algebra I',
        layout: 'mathematical-explanation' as const,
        cards: [], // 0 cards!
      };

      const objects = compileDeckSlideToNativeObjects(slideSpec, defaultTheme);
      expect(objects.length).toBeGreaterThan(5);

      const texts = objects.filter((o) => o.type === 'text');
      expect(texts.length).toBeGreaterThan(3);

      // Verify title is compiled
      const titleObj = texts.find((t) => (t as any).content.includes('Quadratic Equations'));
      expect(titleObj).toBeDefined();

      // Verify placeholder content was populated
      const placeholderObj = texts.find((t) => (t as any).content.includes('x =') || (t as any).content.includes('Premise'));
      expect(placeholderObj).toBeDefined();
    });

    it('generates fully content-filled slides for Quadratic Equations via fallback', () => {
      const deck = generateCurriculumTemplateFallback({
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        numberOfSlides: 5,
      });

      expect(deck.slides.length).toBe(5);

      // Slide 1: Hero
      expect(deck.slides[0].title).toBe('Quadratic Equations');
      expect(deck.slides[0].cards.length).toBeGreaterThanOrEqual(2);
      expect(deck.slides[0].cards[0].body).toContain('Quadratic Equations');

      // Slide 2: Definition & Standard Form
      expect(deck.slides[1].title).toContain('Standard Form');
      expect(deck.slides[1].cards.some((c) => c.formalDefinition?.includes('ax² + bx + c = 0'))).toBe(true);

      // Slide 3: Quadratic Formula & Derivation
      expect(deck.slides[2].title).toContain('Quadratic Formula');
      expect(
        deck.slides[2].cards.some(
          (c) =>
            c.formula?.includes('-b ± √(b² - 4ac)') ||
            c.formula?.includes('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}')
        )
      ).toBe(true);
      expect(deck.slides[2].cards.some((c) => c.solution?.text.includes('Complete square'))).toBe(true);

      // Slide 4: Worked Example
      expect(deck.slides[3].title).toContain('Worked Example');
      expect(deck.slides[3].cards.some((c) => c.problem?.text.includes('2x² - 4x - 6 = 0'))).toBe(true);
      expect(deck.slides[3].cards.some((c) => c.solution?.text.includes('64') && c.solution?.text.includes('discriminant'))).toBe(true);

      // Slide 5: Applications & Pitfalls
      expect(deck.slides[4].title).toContain('Applications');
      expect(deck.slides[4].cards.some((c) => c.features?.some((f) => f.title.includes('Projectile Motion')))).toBe(true);

      // Compile every slide to native objects and verify NO slide has fewer than 4 objects
      deck.slides.forEach((slide) => {
        const objs = compileDeckSlideToNativeObjects(slide, defaultTheme);
        expect(objs.length).toBeGreaterThanOrEqual(4);
        const textObjs = objs.filter((o) => o.type === 'text');
        expect(textObjs.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
