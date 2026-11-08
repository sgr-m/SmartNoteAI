import { describe, it, expect, beforeEach } from 'vitest';
import {
  customSlideMasterService,
  BUILT_IN_MASTERS,
  PRESET_CLASSROOM_MASTER,
  PRESET_STEM_PROOF_MASTER,
  PRESET_TWO_COLUMN_MASTER,
  masterToPresentationTheme,
  masterToSlideTemplate,
} from '../src/renderer/services/aiPresentation/customSlideMasterService';
import {
  compileCustomMasterToNativeObjects,
  createPageFromCustomMaster,
} from '../src/renderer/services/aiPresentation/templateCompiler';
import {
  generateOutlineDrivenSlides,
  normalizeTeacherInput,
  generateCurriculumTemplateFallback,
} from '../src/renderer/services/aiPresentation/promptTemplates';
import { aiPresentationService } from '../src/renderer/services/aiPresentation/aiPresentationService';
import {
  CustomSlideMaster,
  SlideContentSpec,
  SlideOutlineItem,
} from '../src/shared/aiPresentationTypes';
import { ShapeObject, TextObject } from '../src/shared/types';

describe('Phase 2 — Custom Slide Master & Slide Title Outline Generation', () => {
  beforeEach(() => {
    // Reset service state before each test
    customSlideMasterService.resetToDefaults();
  });

  describe('1. Custom Slide Master Service & Catalog (Section 2.1)', () => {
    it('initializes with 3 high-fidelity educational presets', () => {
      const masters = customSlideMasterService.getAllMasters();
      expect(masters.length).toBeGreaterThanOrEqual(3);

      const masterIds = masters.map((m) => m.id);
      expect(masterIds).toContain('preset-standard-classroom');
      expect(masterIds).toContain('preset-stem-proof');
      expect(masterIds).toContain('preset-two-column-split');
    });

    it('each preset has strict 1920x1080 16:9 dimensions', () => {
      BUILT_IN_MASTERS.forEach((master) => {
        expect(master.width).toBe(1920);
        expect(master.height).toBe(1080);
        expect(master.aspectRatio).toBe('16:9');
        expect(master.placeholders.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('retrieves master by ID correctly', () => {
      const classroom = customSlideMasterService.getMasterById('preset-standard-classroom');
      expect(classroom).toBeDefined();
      expect(classroom?.name).toBe('Standard Classroom Master');
      expect(classroom?.decorations.hasBrandingLogo).toBe(true);
      expect(classroom?.decorations.brandingText).toBe('SmartBoard Academy');

      const stem = customSlideMasterService.getMasterById('preset-stem-proof');
      expect(stem).toBeDefined();
      expect(stem?.name).toBe('Math & STEM Proof Master');
      expect(stem?.theme.backgroundColor).toBe(PRESET_STEM_PROOF_MASTER.theme.backgroundColor); // Dark theme
    });

    it('creates a new blank master with required placeholders and saves it', () => {
      const blank = customSlideMasterService.createBlankMaster('Physics Department Master');
      expect(blank.id).toBeTruthy();
      expect(blank.name).toBe('Physics Department Master');
      expect(blank.placeholders.length).toBeGreaterThanOrEqual(3);

      customSlideMasterService.saveMaster(blank);
      const retrieved = customSlideMasterService.getMasterById(blank.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Physics Department Master');
    });

    it('clones an existing master with a new name and distinct ID', () => {
      const cloned = customSlideMasterService.cloneMaster(
        'preset-standard-classroom',
        'Custom Biology Master'
      );
      expect(cloned).toBeDefined();
      expect(cloned?.id).not.toBe('preset-standard-classroom');
      expect(cloned?.name).toBe('Custom Biology Master');
      expect(cloned?.isBuiltIn).toBe(false);

      const all = customSlideMasterService.getAllMasters();
      expect(all.some((m) => m.id === cloned?.id)).toBe(true);
    });

    it('prevents deletion of built-in presets and allows deletion of user masters', () => {
      // Trying to delete a built-in preset should be rejected
      const presetDeleted = customSlideMasterService.deleteMaster('preset-standard-classroom');
      expect(presetDeleted).toBe(false);
      expect(customSlideMasterService.getMasterById('preset-standard-classroom')).toBeDefined();

      // Create a user master and delete it
      const userMaster = customSlideMasterService.createBlankMaster('Temporary Master');
      customSlideMasterService.saveMaster(userMaster);
      expect(customSlideMasterService.getMasterById(userMaster.id)).toBeDefined();

      const userDeleted = customSlideMasterService.deleteMaster(userMaster.id);
      expect(userDeleted).toBe(true);
      expect(customSlideMasterService.getMasterById(userMaster.id)).toBeUndefined();
    });

    it('supports JSON export and import for portable master sharing', () => {
      const json = customSlideMasterService.exportMasterJson('preset-stem-proof');
      expect(json).toBeTruthy();
      expect(json).toContain('Math & STEM Proof Master');

      const imported = customSlideMasterService.importMasterJson(json);
      expect(imported).toBeDefined();
      expect(imported?.id).not.toBe('preset-stem-proof'); // Generates fresh ID to prevent collision
      expect(imported?.name).toContain('Imported');
    });

    it('converts master to presentation theme and slide template via adapters', () => {
      const theme = masterToPresentationTheme(PRESET_CLASSROOM_MASTER);
      expect(theme.id).toBe(PRESET_CLASSROOM_MASTER.id);
      expect(theme.backgroundColor).toBe(PRESET_CLASSROOM_MASTER.theme.backgroundColor);
      expect(theme.primaryText).toBe(PRESET_CLASSROOM_MASTER.theme.primaryTextColor);

      const template = masterToSlideTemplate(PRESET_CLASSROOM_MASTER);
      expect(template.id).toBe(PRESET_CLASSROOM_MASTER.id);
      expect(template.placeholders.length).toBe(PRESET_CLASSROOM_MASTER.placeholders.length);
    });
  });

  describe('2. Design Preservation & Native Canvas Compilation (Section 2.3)', () => {
    it('preserves master background, accent bar, header line, and branding badge without alteration', () => {
      const master: CustomSlideMaster = {
        ...PRESET_CLASSROOM_MASTER,
        decorations: {
          ...PRESET_CLASSROOM_MASTER.decorations,
          brandingText: 'Apex High School',
          brandingSubtext: 'Department of Mathematics',
          hasAccentBar: true,
          accentBarPosition: 'top',
          accentBarColor: '#2563eb',
          hasHeaderDivider: true,
          headerDividerColor: '#93c5fd',
          hasFooter: true,
          footerText: 'Term 1 Mathematics Lecture',
          showSlideNumber: true,
        },
      };

      const slideSpec: SlideContentSpec = {
        slideIndex: 0,
        layout: 'concept-explanation',
        title: 'Introduction to Quadratic Equations',
        subtitle: 'Foundations of Degree 2 Polynomials',
        cards: [
          {
            title: 'Definition & Core Invariant',
            body: 'A quadratic equation is a second-order polynomial equation in a single variable x with a non-zero coefficient for x².',
          },
        ],
      };

      const objects = compileCustomMasterToNativeObjects(master, slideSpec, {
        slideIndex: 0,
        totalSlides: 6,
        topic: 'Quadratic Equations',
      });

      // 1. Must include background shape
      const bg = objects.find(
        (o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'rect' && o.width === 1920 && o.height === 1080
      ) as ShapeObject | undefined;
      expect(bg).toBeDefined();
      expect(bg?.fillColor).toBe(master.theme.backgroundColor);

      // 2. Must render accent bar
      const accentBar = objects.find(
        (o) => o.type === 'shape' && (o as ShapeObject).fillColor === '#2563eb' && o.y === 0
      );
      expect(accentBar).toBeDefined();

      // 3. Must render school branding pill
      const brandingTextObj = objects.find(
        (o) => o.type === 'text' && (o as TextObject).text.includes('Apex High School')
      ) as TextObject | undefined;
      expect(brandingTextObj).toBeDefined();
      expect(brandingTextObj?.text).toContain('Department of Mathematics');

      // 4. Must render lecture footer and slide number
      const footerObj = objects.find(
        (o) => o.type === 'text' && (o as TextObject).text.includes('Term 1 Mathematics Lecture')
      ) as TextObject | undefined;
      expect(footerObj).toBeDefined();

      const pageNumObj = objects.find(
        (o) => o.type === 'text' && (o as TextObject).text.includes('1 / 6')
      );
      expect(pageNumObj).toBeDefined();

      // 5. Must render teacher slide title & subtitle
      const titleObj = objects.find(
        (o) => o.type === 'text' && (o as TextObject).text === 'Introduction to Quadratic Equations'
      );
      expect(titleObj).toBeDefined();

      const subtitleObj = objects.find(
        (o) => o.type === 'text' && (o as TextObject).text === 'Foundations of Degree 2 Polynomials'
      );
      expect(subtitleObj).toBeDefined();
    });

    it('renders LaTeX formula in designated formula placeholder without distortion', () => {
      const master = PRESET_STEM_PROOF_MASTER;
      const slideSpec: SlideContentSpec = {
        slideIndex: 5,
        layout: 'mathematical-explanation',
        title: 'Quadratic Formula',
        formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        formulaName: 'General Solution of Quadratic Equation',
        cards: [
          {
            title: 'Derivation Steps',
            body: 'Obtained through completing the square on ax² + bx + c = 0.',
          },
        ],
      };

      const objects = compileCustomMasterToNativeObjects(master, slideSpec, {
        slideIndex: 5,
        totalSlides: 6,
        topic: 'Quadratic Equations',
      });

      const formulaObj = objects.find(
        (o) => o.type === 'text' && Boolean(((o as TextObject).content || (o as any).text || '').includes('4ac'))
      ) as TextObject | undefined;
      expect(formulaObj).toBeDefined();
    });

    it('creates a complete, projector-ready SmartBoard Page using createPageFromCustomMaster', () => {
      const page = createPageFromCustomMaster(
        PRESET_CLASSROOM_MASTER,
        {
          slideIndex: 2,
          layout: 'concept-explanation',
          title: 'Roots of a Quadratic Equation',
          cards: [{ title: 'Geometric Meaning', body: 'The x-intercepts of the parabola where y = 0.' }],
        },
        { slideIndex: 2, totalSlides: 5, topic: 'Quadratic Equations' }
      );

      expect(page.id).toBeTruthy();
      expect(page.title).toBe('Roots of a Quadratic Equation');
      expect(page.width).toBe(1920);
      expect(page.height).toBe(1080);
      expect(page.layers.length).toBeGreaterThanOrEqual(4);
      expect(page.objects.length).toBeGreaterThan(5);
      expect(page.transition?.type).toBe('fade');
    });
  });

  describe('3. Slide Title Outline & AI Content Generation (Section 2.2)', () => {
    it('normalizes slide outline input and sets exact slide count', () => {
      const outline: SlideOutlineItem[] = [
        { title: 'Introduction to Quadratic Equations', actionGoal: 'Generate definition and hook' },
        { title: 'Standard Form', actionGoal: 'Explain ax² + bx + c = 0' },
        { title: 'Roots of a Quadratic Equation', actionGoal: 'Explain roots with examples' },
        { title: 'Discriminant', actionGoal: 'Explain discriminant interpretation' },
        { title: 'Solving by Factorisation', actionGoal: 'Worked factoring example' },
        { title: 'Quadratic Formula', actionGoal: 'Derive formula' },
      ];

      const normalized = normalizeTeacherInput({
        topic: 'Quadratic Equations',
        slideOutline: outline,
      });

      expect(normalized.slideOutline).toBeDefined();
      expect(normalized.slideOutline?.length).toBe(6);
      expect(normalized.numberOfSlides).toBe(6);
      expect(normalized.slideOutline?.[0].title).toBe('Introduction to Quadratic Equations');
      expect(normalized.slideOutline?.[5].title).toBe('Quadratic Formula');
    });

    it('generates rich, complete, non-empty teaching slides matching each outline title', () => {
      const outline: SlideOutlineItem[] = [
        { title: 'Introduction to Quadratic Equations', actionGoal: 'Generate definition and hook' },
        { title: 'Standard Form', actionGoal: 'Explain ax² + bx + c = 0' },
        { title: 'Roots of a Quadratic Equation', actionGoal: 'Explain roots with examples' },
        { title: 'Discriminant', actionGoal: 'Explain discriminant interpretation' },
        { title: 'Solving by Factorisation', actionGoal: 'Worked factoring example' },
        { title: 'Quadratic Formula', actionGoal: 'Derive formula' },
      ];

      const slides = generateOutlineDrivenSlides('Quadratic Equations', outline, 'Grade 10', 'intermediate');
      expect(slides.length).toBe(6);

      // Verify Slide 1: Introduction
      expect(slides[0].title).toBe('Introduction to Quadratic Equations');
      expect(slides[0].cards).toBeDefined();
      expect(slides[0].cards?.length).toBeGreaterThanOrEqual(2);
      expect(
        slides[0].cards?.some((c) => c.title.toLowerCase().includes('definition') || c.badge?.toLowerCase().includes('definition'))
      ).toBe(true);
      expect(slides[0].cards?.[0].body).toBeTruthy();

      // Verify Slide 2: Standard Form
      expect(slides[1].title).toBe('Standard Form');
      expect(slides[1].formula).toContain('ax^2 + bx + c = 0');
      expect(slides[1].cards?.[0].title).toContain('Standard Form');

      // Verify Slide 3: Roots
      expect(slides[2].title).toBe('Roots of a Quadratic Equation');
      expect(slides[2].cards?.some((c) => c.title.toLowerCase().includes('roots') || c.title.toLowerCase().includes('intercept'))).toBe(true);

      // Verify Slide 4: Discriminant
      expect(slides[3].title).toBe('Discriminant');
      expect(slides[3].formula).toContain('b^2 - 4ac');
      expect(
        slides[3].cards?.some(
          (c) =>
            c.title.toLowerCase().includes('discriminant') ||
            c.title.toLowerCase().includes('regimes') ||
            c.title.toLowerCase().includes('trap')
        )
      ).toBe(true);

      // Verify Slide 5: Solving by Factorisation (Worked Example)
      expect(slides[4].title).toBe('Solving by Factorisation');
      expect(slides[4].workedExample).toBeDefined();
      expect(slides[4].workedExample?.steps.length).toBeGreaterThanOrEqual(3);
      expect(
        slides[4].cards?.some(
          (c) =>
            c.title.toLowerCase().includes('problem') ||
            c.title.toLowerCase().includes('factor') ||
            c.title.toLowerCase().includes('proof')
        )
      ).toBe(true);

      // Verify Slide 6: Quadratic Formula
      expect(slides[5].title).toBe('Quadratic Formula');
      expect(slides[5].formula).toContain('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
      expect(slides[5].cards?.[0].body).toBeTruthy();

      // Crucial: No slide is blank!
      slides.forEach((slide) => {
        expect(slide.title).toBeTruthy();
        expect(slide.cards && slide.cards.length > 0).toBe(true);
        slide.cards?.forEach((card) => {
          expect(card.title).toBeTruthy();
          const hasContent = Boolean(
            card.body ||
            card.formalDefinition ||
            card.problem ||
            card.steps?.length ||
            card.features?.length ||
            card.metricValue ||
            card.formula
          );
          expect(hasContent).toBe(true);
        });
      });
    });

    it('branches generateCurriculumTemplateFallback to generateOutlineDrivenSlides when outline is present', () => {
      const outline: SlideOutlineItem[] = [
        { title: 'Introduction to Quadratic Equations' },
        { title: 'Standard Form' },
        { title: 'Discriminant' },
      ];

      const deck = generateCurriculumTemplateFallback({
        topic: 'Quadratic Equations',
        numberOfSlides: 3,
        slideOutline: outline,
      });

      expect(deck.slides.length).toBe(3);
      expect(deck.slides[0].title).toBe('Introduction to Quadratic Equations');
      expect(deck.slides[1].title).toBe('Standard Form');
      expect(deck.slides[2].title).toBe('Discriminant');
    });

    it('generates customized fallback content for custom user-defined outline titles', () => {
      const customOutline: SlideOutlineItem[] = [
        { title: 'The Wave Equation in Quantum Mechanics', actionGoal: 'Explain Schrödinger formulation' },
        { title: 'Boundary Conditions and Quantization', actionGoal: 'Derive infinite square well energy levels' },
      ];

      const slides = generateOutlineDrivenSlides('Quantum Physics', customOutline, 'Grade 12', 'advanced');
      expect(slides.length).toBe(2);
      expect(slides[0].title).toBe('The Wave Equation in Quantum Mechanics');
      expect(slides[0].cards?.length).toBeGreaterThanOrEqual(1);
      expect(slides[0].cards?.[0].body).toContain('Quantum Mechanics');

      expect(slides[1].title).toBe('Boundary Conditions and Quantization');
      expect(slides[1].cards?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Full Pipeline Integration with Custom Master & Outline', () => {
    it('generates a complete 6-slide presentation compiling directly to custom master layouts', async () => {
      const outline: SlideOutlineItem[] = [
        { title: 'Introduction to Quadratic Equations' },
        { title: 'Standard Form' },
        { title: 'Roots of a Quadratic Equation' },
        { title: 'Discriminant' },
        { title: 'Solving by Factorisation' },
        { title: 'Quadratic Formula' },
      ];

      const result = await aiPresentationService.generatePresentation({
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        gradeLevel: 'Grade 10',
        customMasterId: 'preset-standard-classroom',
        slideOutline: outline,
        forceTemplateFallback: true,
      });

      expect(result.success).toBe(true);
      expect(result.pages.length).toBe(6);

      // Verify each page preserves the master branding and has rendered slide titles
      result.pages.forEach((page, index) => {
        expect(page.title).toBe(outline[index].title);
        expect(page.width).toBe(1920);
        expect(page.height).toBe(1080);

        // Branding pill must be present on every page
        const brandingPill = page.objects.find(
          (o) => o.type === 'text' && Boolean((o as TextObject).text && (o as TextObject).text.includes('SmartBoard Academy'))
        );
        expect(brandingPill).toBeDefined();

        // Title object must match outline title
        const titleObj = page.objects.find(
          (o) => o.type === 'text' && (o as TextObject).text === outline[index].title
        );
        expect(titleObj).toBeDefined();

        // Must have non-empty body text content (no blank slides)
        const textObjects = page.objects.filter((o) => o.type === 'text') as TextObject[];
        expect(textObjects.length).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
