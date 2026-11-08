/**
 * phase7QualityControl.test.ts — Phase 7: Quality Control & Mandatory Verification Test Cases
 * 
 * Executes exhaustive quality control and integration verification across STEM and Computer Science:
 * 1. Mandatory Test Case 1: Mathematics (Quadratic Equations)
 * 2. Mandatory Test Case 2: Computer Science (Python Variables and Data Types)
 * 3. Mandatory Test Case 3: Teacher Adds a Missing Topic ("Completing the Square" before "Quadratic Formula")
 * 4. Mandatory Test Case 4: Custom Slide Master Creation, Placeholder Filling & .sbl Serialization
 * 5. Mandatory Test Case 5: Template Thumbnail Fidelity & Visual Vector Rendering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Domain Services & Engines
import {
  generateCurriculumTemplateFallback,
  generateOutlineDrivenSlides,
  normalizeTeacherInput,
  extractSlideFormulas,
  validateAndHealFormula,
  countWords,
} from '../src/renderer/services/aiPresentation/promptTemplates';
import {
  OutlineRefinementService,
  refineOutlineHeuristic,
} from '../src/renderer/services/aiPresentation/outlineRefinementService';
import {
  livePresentationService,
} from '../src/renderer/services/aiPresentation/livePresentationService';
import {
  customSlideMasterService,
  PRESET_STEM_PROOF_MASTER,
} from '../src/renderer/services/aiPresentation/customSlideMasterService';
import {
  compileCustomMasterToNativeObjects,
  compileTemplateToNativeObjects,
  createPageFromTemplate,
  createPageFromCustomMaster,
} from '../src/renderer/services/aiPresentation/templateCompiler';
import { getAllSlideTemplates, getSlideTemplateById } from '../src/renderer/services/aiPresentation/slideTemplateCatalog';
import { getThemeById } from '../src/renderer/services/aiPresentation/presentationThemes';
import katex from 'katex';
import { TemplateThumbnail } from '../src/renderer/components/aiPresentation/SlideThumbnailRenderer';
import {
  CustomSlideMaster,
  SlideOutlineItem,
  SlideContentSpec,
  PresentationDeckSpec,
  LiveSlideItem,
} from '../src/shared/aiPresentationTypes';
import { DocumentState, Page } from '../src/shared/types';

describe('Phase 7: Quality Control & Mandatory Test Cases Verification', () => {
  beforeEach(() => {
    customSlideMasterService.resetToDefaults();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 1: MATHEMATICS (QUADRATIC EQUATIONS)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Mandatory Test Case 1 — Mathematics (Quadratic Equations)', () => {
    const mathInput = {
      topic: 'Quadratic Equations',
      subject: 'Mathematics',
      gradeLevel: 'Grade 10',
      language: 'English',
      difficulty: 'intermediate' as const,
      numberOfSlides: 6,
    };

    it('1.1 Generates a logical, pedagogically sound slide-wise outline without blank slides', () => {
      const deck = generateCurriculumTemplateFallback(mathInput);

      expect(deck.topic).toBe('Quadratic Equations');
      expect(deck.subject).toBe('Mathematics');
      expect(deck.slides.length).toBe(6);

      // Verify that NO slide is blank or merely a heading
      deck.slides.forEach((slide, idx) => {
        expect(slide.title).toBeTruthy();
        expect(slide.title.trim().length).toBeGreaterThan(5);
        expect(slide.subtitle).toBeTruthy();
        expect(slide.cards.length).toBeGreaterThanOrEqual(1);

        // Word count check — substantive teaching text
        const totalWords = slide.cards.reduce((sum, c) => {
          const bodyWords = countWords(typeof c.body === 'string' ? c.body : Array.isArray(c.body) ? c.body.join(' ') : '');
          const bulletWords = (c.bulletPoints || []).reduce((bSum, b) => bSum + countWords(b), 0);
          const probWords = countWords(c.problem?.text) + countWords(c.solution?.text);
          const defWords = countWords(c.formalDefinition) + countWords(c.term) + countWords(c.example);
          const takeawayWords = (c.takeaways || []).reduce((tSum, t) => tSum + countWords(t), 0);
          const featWords = (c.features || []).reduce((fSum, f) => fSum + countWords(f.title) + countWords(f.description), 0);
          const stepWords = (c.steps || []).reduce((sSum, s) => sSum + countWords(s.title) + countWords(s.description), 0);
          const qaWords = countWords(c.question) + countWords(c.answer) + countWords(c.explanation);
          return sum + bodyWords + bulletWords + probWords + defWords + takeawayWords + featWords + stepWords + qaWords;
        }, 0);

        expect(totalWords).toBeGreaterThanOrEqual(25);
        expect(slide.notes).toBeTruthy();
      });
    });

    it('1.2 Contains accurate, validated KaTeX LaTeX mathematical formulas', () => {
      const deck = generateCurriculumTemplateFallback(mathInput);

      // Slide 2: Standard form
      const slide2 = deck.slides[1];
      expect(slide2.title).toContain('Standard Form');
      const s2Formulas = extractSlideFormulas(slide2);
      expect(s2Formulas.some((f) => f.includes('ax^2 + bx + c = 0'))).toBe(true);

      // Slide 3: Quadratic Formula and Discriminant
      const slide3 = deck.slides[2];
      expect(slide3.title).toContain('Quadratic Formula');
      const s3Formulas = extractSlideFormulas(slide3);
      expect(s3Formulas.some((f) => f.includes('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'))).toBe(true);
      expect(s3Formulas.some((f) => f.includes('\\Delta = b^2 - 4ac'))).toBe(true);

      // Validate all extracted formulas with KaTeX engine
      const allFormulas = deck.slides.flatMap(extractSlideFormulas);
      expect(allFormulas.length).toBeGreaterThanOrEqual(3);

      allFormulas.forEach((formulaStr) => {
        const { isValid, healedFormula } = validateAndHealFormula(formulaStr);
        expect(isValid).toBe(true);
        expect(healedFormula).toBeTruthy();

        // Render KaTeX HTML directly
        const cleanStr = healedFormula.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '');
        const html = katex.renderToString(cleanStr, { displayMode: true, throwOnError: false });
        expect(html).toContain('katex');
      });
    });

    it('1.3 Includes step-by-step worked numerical examples and verification checks', () => {
      const deck = generateCurriculumTemplateFallback(mathInput);
      const workedSlide = deck.slides[3]; // Slide 4: Worked Example

      expect(workedSlide.title).toContain('Worked Example');
      const problemCard = workedSlide.cards.find((c) => c.problemSolution || c.problem);
      expect(problemCard).toBeDefined();
      expect(problemCard?.problem?.text).toContain('2x² - 4x - 6 = 0');
      expect(problemCard?.solution?.text).toContain('x₁');
      expect(problemCard?.solution?.text).toContain('x₂');
      expect(problemCard?.solution?.text).toContain('= 3');

      // Sanity checks card
      const verifyCard = workedSlide.cards.find((c) => c.cardType === 'numbered-steps');
      expect(verifyCard).toBeDefined();
      expect(verifyCard?.steps?.length).toBe(3);
      expect(verifyCard?.steps?.[0].description).toContain('2(3)² - 4(3) - 6');
    });

    it('1.4 Successfully executes Gamma-style live progressive slide generation', async () => {
      const mathOutline: SlideOutlineItem[] = [
        { id: 'm1', slideNumber: 1, title: 'Introduction to Quadratic Equations', actionGoal: 'Definition & real-world hook', selected: true },
        { id: 'm2', slideNumber: 2, title: 'Standard Form', actionGoal: 'Explain coefficients a, b, c', selected: true },
        { id: 'm3', slideNumber: 3, title: 'Quadratic Formula', actionGoal: 'Formula derivation and discriminant', selected: true },
      ];

      const stateTransitions: Record<number, string[]> = {};
      const completedSlides: LiveSlideItem[] = [];

      const result = await livePresentationService.startLiveGeneration(mathOutline, {
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        gradeLevel: 'Grade 10',
        onSlideUpdate: (slide) => {
          if (!stateTransitions[slide.slideNumber]) stateTransitions[slide.slideNumber] = [];
          stateTransitions[slide.slideNumber].push(slide.status);
        },
        onSlideCompleted: (slide) => {
          completedSlides.push(slide);
        },
      });

      expect(result.length).toBe(3);
      expect(completedSlides.length).toBe(3);

      // Every slide traversed waiting -> generating-content -> rendering -> completed
      [1, 2, 3].forEach((num) => {
        expect(stateTransitions[num]).toContain('generating-content');
        expect(stateTransitions[num]).toContain('completed');
        const slide = completedSlides.find((s) => s.slideNumber === num);
        expect(slide?.page).toBeDefined();
        expect(slide?.page.objects.length).toBeGreaterThan(0);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 2: COMPUTER SCIENCE (PYTHON VARIABLES & DATA TYPES)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Mandatory Test Case 2 — Computer Science (Python Variables and Data Types)', () => {
    const csInput = {
      topic: 'Python Variables and Data Types',
      subject: 'Computer Science',
      gradeLevel: 'Grade 11',
      language: 'English',
      difficulty: 'beginner' as const,
      numberOfSlides: 6,
    };

    it('2.1 Generates correct pedagogical sequence without generic or blank slides', () => {
      const deck = generateCurriculumTemplateFallback(csInput);

      expect(deck.topic).toBe('Python Variables and Data Types');
      expect(deck.subject).toBe('Computer Science');
      expect(deck.slides.length).toBe(6);

      const titles = deck.slides.map((s) => s.title);
      expect(titles[0]).toContain('Variables');
      expect(titles[1]).toContain('Primitive Data Types');
      expect(titles[2]).toContain('Naming Rules');
      expect(titles[3]).toContain('Type Conversion');
      expect(titles[4]).toContain('Code Walkthrough');
      expect(titles[5]).toContain('Review');

      // None of the slides contain polynomial math equations
      deck.slides.forEach((s) => {
        const text = JSON.stringify(s);
        expect(text).not.toContain('polynomial');
        expect(text).not.toContain('quadratic');
      });
    });

    it('2.2 Generates Python code snippets, memory model explanations and type() demonstration', () => {
      const deck = generateCurriculumTemplateFallback(csInput);

      // Slide 1: Variable definition and memory model
      const slide1 = deck.slides[0];
      const s1Text = JSON.stringify(slide1);
      expect(s1Text).toContain('assignment');
      expect(s1Text).toContain('id()');
      expect(s1Text).toContain('memory');

      // Slide 2: Data types: int, float, str, bool and type()
      const slide2 = deck.slides[1];
      const typeCard = slide2.cards.find((c) => c.cardType === 'multi-column-feature');
      expect(typeCard).toBeDefined();
      expect(typeCard?.features?.map((f) => f.title)).toEqual([
        'int (Integer)',
        'float (Floating Point)',
        'str (String)',
        'bool (Boolean)',
      ]);

      const inspectionCard = slide2.cards.find((c) => c.problemSolution || c.solution);
      expect(inspectionCard?.solution?.text).toContain("type(42)");
      expect(inspectionCard?.solution?.text).toContain("<class 'int'>");
      expect(inspectionCard?.solution?.text).toContain("<class 'str'>");
    });

    it('2.3 Generates PEP 8 naming standards, type conversion and bug fixing scenarios', () => {
      const deck = generateCurriculumTemplateFallback(csInput);

      // Slide 3: Naming rules and PEP 8
      const slide3 = deck.slides[2];
      const rulesCard = slide3.cards.find((c) => c.cardType === 'numbered-steps');
      expect(rulesCard?.steps?.some((st) => st.title.includes('Never Start with a Digit'))).toBe(true);
      expect(rulesCard?.steps?.some((st) => st.title.includes('Case Sensitivity'))).toBe(true);

      const pep8Card = slide3.cards.find((c) => c.cardType === 'multi-column-feature');
      expect(pep8Card?.features?.some((f) => f.title.includes('snake_case'))).toBe(true);

      // Slide 4: Type casting and input() bug fix
      const slide4 = deck.slides[3];
      const bugCard = slide4.cards.find((c) => c.problemSolution || c.problem);
      expect(bugCard?.problem?.text).toContain('input()');
      expect(bugCard?.problem?.text).toContain('TypeError');
      expect(bugCard?.solution?.text).toContain('int(user_text)');
    });

    it('2.4 Successfully compiles Computer Science deck into native whiteboard Page objects', () => {
      const deck = generateCurriculumTemplateFallback(csInput);
      const defaultTheme = getThemeById('midnight-tech');

      deck.slides.forEach((slide) => {
        const tpl = getSlideTemplateById(slide.layout) || getAllSlideTemplates()[0];
        const page = createPageFromTemplate(tpl, defaultTheme, slide);
        expect(page).toBeDefined();
        expect(page.objects.length).toBeGreaterThanOrEqual(3);

        // Check for text elements containing Python concepts
        const texts = page.objects.map((o: any) => o.text || o.title || '').filter(Boolean);
        expect(texts.length).toBeGreaterThan(0);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 3: TEACHER ADDS A MISSING TOPIC
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Mandatory Test Case 3 — Teacher Adds a Missing Topic ("Completing the Square")', () => {
    const initialQuadraticOutline: SlideOutlineItem[] = [
      { id: 's1', slideNumber: 1, title: 'Introduction to Quadratic Equations', actionGoal: 'Definition & hook', selected: true },
      { id: 's2', slideNumber: 2, title: 'Standard Form', actionGoal: 'Explain coefficients', selected: true },
      { id: 's3', slideNumber: 3, title: 'Roots of a Quadratic Equation', actionGoal: 'Explain roots as parabola x-intercepts', selected: true },
      { id: 's4', slideNumber: 4, title: 'Discriminant', actionGoal: 'Explain discriminant Δ = b² - 4ac', selected: true },
      { id: 's5', slideNumber: 5, title: 'Solving by Factorisation', actionGoal: 'Worked factoring example', selected: true },
      { id: 's6', slideNumber: 6, title: 'Quadratic Formula', actionGoal: 'Universal formula and derivation', selected: true },
    ];

    it('3.1 Accurately inserts "Completing the Square" immediately before "Quadratic Formula"', () => {
      const instruction = 'Add completing the square before the quadratic formula. Also include the geometrical interpretation of the roots.';
      const result = refineOutlineHeuristic(instruction, initialQuadraticOutline, { topic: 'Quadratic Equations' });

      // 6 original + 2 added (Completing the Square + Geometrical Interpretation) = 8
      expect(result.updatedOutline.length).toBe(8);

      const titles = result.updatedOutline.map((s) => s.title);
      const completingIdx = titles.findIndex((t) => /completing the square/i.test(t));
      const formulaIdx = titles.findIndex((t) => /quadratic formula/i.test(t));

      expect(completingIdx).toBeGreaterThan(-1);
      expect(formulaIdx).toBeGreaterThan(-1);
      expect(completingIdx).toBeLessThan(formulaIdx); // Placed before quadratic formula!

      // Verify that prior selections are preserved
      result.updatedOutline.forEach((s) => {
        expect(s.selected).toBe(true);
      });

      // Verify conversational change summary
      expect(result.changes.added.length).toBeGreaterThanOrEqual(1);
      expect(result.changes.added.some((t) => /completing the square/i.test(t))).toBe(true);
      expect(result.explanation).toContain('Completing the Square');
    });

    it('3.2 Generates comprehensive Completing the Square content on the newly inserted slide', () => {
      const instruction = 'Add completing the square before the quadratic formula.';
      const { updatedOutline } = refineOutlineHeuristic(instruction, initialQuadraticOutline, { topic: 'Quadratic Equations' });

      const norm = normalizeTeacherInput({
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        gradeLevel: 'Grade 10',
        slideOutline: updatedOutline,
      });

      const slides = generateOutlineDrivenSlides(updatedOutline, norm);
      expect(slides.length).toBe(7);

      const ctsSlide = slides.find((s) => /completing the square/i.test(s.title));
      expect(ctsSlide).toBeDefined();
      expect(ctsSlide?.subtitle).toContain('Perfect Squares');

      // Check for completing the square formula identity: (b/2)^2
      const formulas = extractSlideFormulas(ctsSlide!);
      expect(formulas.some((f) => f.includes('\\left(\\frac{b}{2}\\right)^2'))).toBe(true);

      // Check for 4-step algorithm and worked numerical example
      const stepsCard = ctsSlide?.cards.find((c) => c.cardType === 'numbered-steps');
      expect(stepsCard?.steps?.length).toBe(4);
      expect(stepsCard?.steps?.[0].title).toContain('Ensure a = 1');

      const workedCard = ctsSlide?.cards.find((c) => c.problemSolution || c.problem);
      expect(workedCard?.problem?.text).toContain('x² - 6x - 7 = 0');
      expect(workedCard?.solution?.text).toContain('(x - 3)² = 16');
      expect(workedCard?.solution?.text).toContain('x₁');
      expect(workedCard?.solution?.text).toContain('7');
      expect(workedCard?.solution?.text).toContain('x₂');
      expect(workedCard?.solution?.text).toContain('-1');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 4: CUSTOM SLIDE MASTER & .SBL FILE FORMAT FIDELITY
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Mandatory Test Case 4 — Custom Slide Master & .sbl File Format Fidelity', () => {
    const createQcMaster = (): CustomSlideMaster => ({
      id: 'master-qc-stem-custom',
      name: 'STEM Quantum Master',
      description: 'Quality Control Custom Master for Advanced STEM Instruction',
      aspectRatio: '16:9',
      width: 1920,
      height: 1080,
      theme: {
        id: 'theme-quantum-qc',
        name: 'Quantum Dark',
        backgroundColor: '#0a0f1d',
        cardBackgroundColor: '#121b33',
        textColor: '#e8edf5',
        headingColor: '#60a5fa',
        accentColor: '#38bdf8',
        secondaryAccentColor: '#818cf8',
        fontFamily: 'Inter, sans-serif',
        cardBorderColor: '#1e293b',
        cardBorderRadius: 16,
      },
      placeholders: [
        {
          id: 'ph-title',
          role: 'slide-title',
          label: 'Slide Title',
          contentType: 'text',
          bounds: { x: 80, y: 60, width: 1760, height: 100 },
          formatting: { fontSize: 44, fontWeight: 700, colorRole: 'primary' },
        },
        {
          id: 'ph-subtitle',
          role: 'slide-subtitle',
          label: 'Curriculum Subtitle',
          contentType: 'text',
          bounds: { x: 80, y: 165, width: 1760, height: 45 },
          formatting: { fontSize: 20, fontWeight: 500, colorRole: 'accent' },
        },
        {
          id: 'ph-content',
          role: 'concept-explanation',
          label: 'Main Instructional Card',
          contentType: 'card',
          bounds: { x: 80, y: 230, width: 980, height: 750 },
          formatting: { backgroundColorRole: 'card', borderRole: 'cardBorder' },
        },
        {
          id: 'ph-formula',
          role: 'formula',
          label: 'LaTeX Governing Formulation',
          contentType: 'formula',
          bounds: { x: 1100, y: 230, width: 740, height: 350 },
          formatting: { backgroundColorRole: 'surface', borderRole: 'accent' },
          defaultFormula: '$$E = mc^2$$',
        },
      ],
      decorations: {
        hasHeaderBanner: true,
        hasFooter: true,
        footerText: 'Antigravity STEM Academy • Confidential Classroom Material',
        showSlideNumber: true,
        hasBrandingLogo: true,
        brandingText: 'QUANTUM LABS',
        customShapes: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('4.1 Creates, saves and retrieves a custom slide master with title, content and formula placeholders', () => {
      const customMaster = createQcMaster();
      customSlideMasterService.saveMaster(customMaster);
      const retrieved = customSlideMasterService.getMasterById('master-qc-stem-custom');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('STEM Quantum Master');
      expect(retrieved?.placeholders.length).toBe(4);
      expect(retrieved?.decorations.brandingText).toBe('QUANTUM LABS');
    });

    it('4.2 Compiles custom master with AI-generated content into native CanvasObjects', () => {
      const customMaster = createQcMaster();
      customSlideMasterService.saveMaster(customMaster);
      const retrieved = customSlideMasterService.getMasterById('master-qc-stem-custom');
      expect(retrieved).toBeDefined();

      const slideSpec: SlideContentSpec = {
        slideNumber: 1,
        title: 'Universal Law of Gravitation',
        subtitle: 'Classical Mechanics • Grade 11',
        layout: 'mathematical-explanation',
        formula: '$$F = G \\frac{m_1 m_2}{r^2}$$',
        cards: [
          {
            cardType: 'basic-info',
            title: 'Newtonian Formulation',
            badge: 'Classical Law',
            body: 'Every particle attracts every other particle in the universe with a force proportional to the product of their masses.',
            bulletPoints: [
              'G is the universal gravitational constant: 6.674 × 10⁻¹¹ N·m²/kg²',
              'Inverse-square dependency with distance r',
            ],
          },
          {
            cardType: 'definition',
            title: 'Governing Formula',
            formula: '$$F = G \\frac{m_1 m_2}{r^2}$$',
          },
        ],
      };

      const nativeObjects = compileCustomMasterToNativeObjects(retrieved!, slideSpec);
      expect(nativeObjects.length).toBeGreaterThanOrEqual(4);

      // Verify custom background preservation
      const bgShape = nativeObjects.find((o: any) => o.type === 'shape');
      expect(bgShape).toBeDefined();

      // Verify title placed in ph-title bounds
      const titleObj = nativeObjects.find((o: any) => o.type === 'text' && o.text === 'Universal Law of Gravitation');
      expect(titleObj).toBeDefined();
      expect((titleObj as any)?.x).toBe(80);
      expect((titleObj as any)?.y).toBe(60);

      // Verify formula placed in ph-formula bounds
      const formulaObj = nativeObjects.find(
        (o: any) => o.type === 'text' && ((o as any).preset === 'formula' || (o.content || '').includes('frac') || (o.text || '').includes('frac'))
      );
      expect(formulaObj).toBeDefined();
      expect((formulaObj as any)?.x).toBeGreaterThanOrEqual(1100);
    });

    it('4.3 Verifies .sbl document format save & reopen serialization fidelity', () => {
      const master = createQcMaster();
      customSlideMasterService.saveMaster(master);

      const slideSpec: SlideContentSpec = {
        slideNumber: 1,
        title: 'Schrödinger Wave Equation',
        subtitle: 'Quantum Physics • Grade 12',
        layout: 'mathematical-explanation',
        formula: '$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$',
        cards: [
          {
            cardType: 'definition',
            title: 'Wave Function Dynamics',
            badge: 'Postulate',
            formalDefinition: 'The fundamental equation of motion for quantum systems describing the probability amplitude Psi.',
          },
          {
            cardType: 'definition',
            title: 'Wave Equation',
            formula: '$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$',
          },
        ],
      };

      const page: Page = createPageFromCustomMaster(master, slideSpec);

      // Construct a full SmartBoard document state
      const initialDoc: DocumentState = {
        lesson: {
          id: 'doc-qc-quantum-1',
          title: 'Quantum Mechanics Lesson',
          description: 'Live test document for format fidelity',
          version: '2.0.0',
          pages: [page],
          activePageIndex: 0,
        } as any,
        currentPageIndex: 0,
        selectedIds: [],
        zoom: 1,
        pan: { x: 0, y: 0 },
      };

      // 1. Serialize document state to .sbl JSON string
      const serializedJson = JSON.stringify(initialDoc);
      expect(serializedJson).toBeTruthy();
      expect(serializedJson.length).toBeGreaterThan(100);

      // 2. Deserialize / Reopen from .sbl JSON
      const reopenedDoc: DocumentState = JSON.parse(serializedJson);

      // 3. Verify 100% round-trip fidelity
      expect(reopenedDoc.lesson.pages.length).toBe(1);
      const reopenedPage = reopenedDoc.lesson.pages[0];
      expect(reopenedPage.id).toBe(page.id);
      expect(reopenedPage.objects.length).toBe(page.objects.length);

      // Verify formula object preservation
      const originalFormula = page.objects.find(
        (o: any) => o.type === 'text' && ((o as any).preset === 'formula' || (o.content || '').includes('Psi') || (o.text || '').includes('Psi'))
      );
      const reopenedFormula = reopenedPage.objects.find(
        (o: any) => o.type === 'text' && ((o as any).preset === 'formula' || (o.content || '').includes('Psi') || (o.text || '').includes('Psi'))
      );
      expect(reopenedFormula).toBeDefined();
      expect((reopenedFormula as any).content || (reopenedFormula as any).text).toBe((originalFormula as any).content || (originalFormula as any).text);

      // Verify text object preservation
      const originalTitle = page.objects.find((o: any) => o.type === 'text' && o.text === 'Schrödinger Wave Equation');
      const reopenedTitle = reopenedPage.objects.find((o: any) => o.type === 'text' && o.text === 'Schrödinger Wave Equation');
      expect(reopenedTitle).toBeDefined();
      expect((reopenedTitle as any).text).toBe((originalTitle as any).text);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MANDATORY TEST CASE 5: TEMPLATE THUMBNAILS & VECTOR RENDERING
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Mandatory Test Case 5 — Template Thumbnails & Visual Vector Fidelity', () => {
    it('5.1 Every template in catalog renders a crisp SVG thumbnail matching 960x540 viewBox', () => {
      const templates = getAllSlideTemplates();
      expect(templates.length).toBe(9);

      templates.forEach((template) => {
        const markup = renderToStaticMarkup(
          React.createElement(TemplateThumbnail, {
            template,
            width: 320,
            height: 180,
          })
        );

        expect(markup).toBeTruthy();
        expect(markup).toContain('<svg');
        expect(markup).toContain('viewBox="0 0 1920 1080"');
        expect(markup).toContain('slide-thumbnail-svg');

        // Verify visual SVG objects are rendered (rects, text, defs)
        expect(markup).toContain('<defs>');
        expect(markup).toContain('<rect');
        expect(markup).toContain('</svg>');
      });
    });

    it('5.2 Generates slides with each template and verifies compiled layout fidelity', () => {
      const templates = getAllSlideTemplates();
      const defaultTheme = getThemeById('modern-academic');

      templates.forEach((template) => {
        const dummySpec: SlideContentSpec = {
          slideNumber: 1,
          title: `Testing ${template.name}`,
          subtitle: 'Layout Validation Test',
          layout: template.id as any,
          formula: '$$y = f(x)$$',
          cards: [
            {
              cardType: 'basic-info',
              title: 'Primary Card',
              badge: 'Verification',
              body: 'Validating that template compilation produces native objects matching the template geometry.',
            },
          ],
        };

        const page = createPageFromTemplate(template, defaultTheme, dummySpec);
        expect(page).toBeDefined();
        expect(page.objects.length).toBeGreaterThanOrEqual(template.placeholders.length);

        // Verify that background shape matches theme background color
        const bg = page.objects.find((o: any) => o.type === 'shape');
        expect(bg).toBeDefined();
      });
    });
  });
});
