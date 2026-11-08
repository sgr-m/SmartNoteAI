/**
 * aiContentValidation.test.ts — Unit tests for Phase 3: AI Teaching Content Generation & LaTeX Validation
 * 
 * Verifies:
 * 1. Pedagogical prompt construction with strict educational depth rules.
 * 2. KaTeX / LaTeX formula validation, auto-healing of delimiters, fractions, and operators.
 * 3. Validation pipeline: content presence, word count density, mandatory formulas, worked examples.
 * 4. Quadratic Equations curriculum generation: Standard Form, Roots, Discriminant, Factoring, Quadratic Formula.
 * 5. Rejection of blank/heading-only slides and auto-repair.
 * 6. Vector KaTeX foreignObject rendering in SlideThumbnailRenderer.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  countWords,
  extractSlideFormulas,
  validateAndHealFormula,
  validateSlideContent,
  validateDeckContent,
  buildTeachingPresentationPrompt,
  generateOutlineDrivenSlides,
  generateCurriculumTemplateFallback,
} from '../src/renderer/services/aiPresentation/promptTemplates';
import { SlideThumbnailRenderer } from '../src/renderer/components/aiPresentation/SlideThumbnailRenderer';
import { compileDeckSlideToNativeObjects } from '../src/renderer/services/aiPresentation/hybridComponentBridge';
import { getThemeById } from '../src/renderer/services/aiPresentation/presentationThemes';
import { Page, TextObject } from '../src/shared/types';
import { PresentationDeckSpec, SlideContentSpec } from '../src/shared/aiPresentationTypes';

describe('PHASE 3: AI Content Generation & LaTeX Validation Pipeline', () => {
  // ─── 1. Word Count & Formula Extraction Helpers ─────────────────────────────
  describe('1. Content Metrics & Formula Extraction', () => {
    it('accurately counts words in educational text', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('Standard form of a quadratic equation is ax^2 + bx + c = 0.')).toBe(14);
      expect(countWords('Line one\n\nLine two with multiple   spaces')).toBe(7);
    });

    it('extracts formulas from slide properties, card properties, and inline delimiters', () => {
      const slide: SlideContentSpec = {
        slideNumber: 1,
        title: 'Standard Form',
        layout: 'definition-formula',
        formula: '$$ax^2 + bx + c = 0$$',
        cards: [
          {
            cardType: 'definition',
            title: 'Discriminant',
            formula: '$$\\Delta = b^2 - 4ac$$',
            body: 'Consider the case where $\\Delta > 0$ for two distinct roots.',
          },
        ],
      };

      const formulas = extractSlideFormulas(slide);
      expect(formulas).toContain('$$ax^2 + bx + c = 0$$');
      expect(formulas).toContain('$$\\Delta = b^2 - 4ac$$');
      expect(formulas).toContain('$\\Delta > 0$');
    });
  });

  // ─── 2. LaTeX & KaTeX Formula Validation and Auto-Healing ───────────────────
  describe('2. LaTeX / KaTeX Formula Validation Engine', () => {
    it('validates canonical quadratic equations with KaTeX', () => {
      const standardForm = validateAndHealFormula('$$ax^2 + bx + c = 0$$');
      expect(standardForm.isValid).toBe(true);
      expect(standardForm.healedFormula).toBe('$$ax^2 + bx + c = 0$$');

      const discriminant = validateAndHealFormula('$$\\Delta = b^2 - 4ac$$');
      expect(discriminant.isValid).toBe(true);

      const quadraticFormula = validateAndHealFormula('$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$');
      expect(quadraticFormula.isValid).toBe(true);
    });

    it('auto-heals slash fraction notations into vertical LaTeX \\frac fractions', () => {
      const naturalFraction = validateAndHealFormula('(b^2 - 4ac)/(2a)');
      expect(naturalFraction.isValid).toBe(true);
      expect(naturalFraction.healedFormula).toContain('\\frac');
    });

    it('auto-heals unclosed braces when possible', () => {
      const unclosed = validateAndHealFormula('\\frac{a}{b');
      expect(unclosed.isValid).toBe(true);
      expect(unclosed.healedFormula).toContain('\\frac{a}{b}');
    });

    it('flags unparseable or completely corrupted LaTeX syntax', () => {
      const badLatex = validateAndHealFormula('\\begin{incomplete_syntax');
      expect(badLatex.isValid).toBe(false);
      expect(badLatex.error).toBeDefined();
    });
  });

  // ─── 3. Per-Slide Content Validation Engine ─────────────────────────────────
  describe('3. Slide Content Quality & Validation (validateSlideContent)', () => {
    it('identifies and rejects completely blank or empty slides', () => {
      const emptySlide = {
        slideNumber: 2,
        title: 'Empty Slide',
        cards: [],
      };

      const { report, repairedSlide, slideErrors, isRepaired } = validateSlideContent(emptySlide, {
        topic: 'Quadratic Equations',
        slideIndex: 1,
      });

      expect(isRepaired).toBe(true);
      expect(slideErrors.some((e) => e.includes('had no cards'))).toBe(true);
      expect(repairedSlide.cards).toBeDefined();
      expect(repairedSlide.cards!.length).toBeGreaterThan(0);
    });

    it('validates a high-quality educational slide as success with high score', () => {
      const richSlide: SlideContentSpec = {
        slideNumber: 2,
        title: 'Standard Form of a Quadratic Equation',
        layout: 'definition-formula',
        formula: '$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$',
        cards: [
          {
            cardType: 'definition',
            title: 'Canonical Form Definition',
            badge: 'Standard Equation',
            formula: '$$ax^2 + bx + c = 0$$',
            formalDefinition:
              'A second-order polynomial equation in a single variable x with non-zero leading coefficient.',
            body: 'Every quadratic equation can be rearranged into canonical standard form by collecting all terms on one side equal to zero.',
            example: 'In 3x^2 - 5x + 2 = 0, the coefficients are a = 3, b = -5, and c = 2.',
          },
        ],
      };

      const { report } = validateSlideContent(richSlide, {
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        slideIndex: 1,
      });

      expect(report.status).toBe('success');
      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.hasFormulas).toBe(true);
      expect(report.validLatex).toBe(true);
      expect(report.hasExplanationOrExample).toBe(true);
      expect(report.wordCount).toBeGreaterThanOrEqual(25);
    });
  });

  // ─── 4. Substantive Content for Quadratic Equations ─────────────────────────
  describe('4. Complete Pedagogical Teaching Material (Quadratic Equations)', () => {
    it('generates complete classroom teaching content for all core Quadratic Equation topics', () => {
      const outline = [
        { slideNumber: 1, title: 'Introduction to Quadratic Equations' },
        { slideNumber: 2, title: 'Standard Form of a Quadratic Equation' },
        { slideNumber: 3, title: 'Roots of a Quadratic Equation' },
        { slideNumber: 4, title: 'The Discriminant and Nature of Roots' },
        { slideNumber: 5, title: 'Solving by Factorisation' },
        { slideNumber: 6, title: 'Universal Quadratic Formula' },
      ];

      const slides = generateOutlineDrivenSlides(outline, undefined, 'Grade 10', 'intermediate');
      expect(slides).toHaveLength(6);

      // Slide 1: Introduction & Hook
      const slide1 = slides[0];
      expect(slide1.title).toBe('Introduction to Quadratic Equations');
      expect(slide1.cards!.length).toBeGreaterThanOrEqual(2);
      expect(slide1.cards![0].body).toContain('Welcome to this instructional session');

      // Slide 2: Standard Form (ax^2 + bx + c = 0, a != 0, coefficients, worked example)
      const slide2 = slides[1];
      expect(slide2.title).toBe('Standard Form of a Quadratic Equation');
      expect(slide2.formula).toContain('ax^2 + bx + c = 0');
      const defCard = slide2.cards!.find((c) => c.cardType === 'definition');
      expect(defCard).toBeDefined();
      expect(defCard?.formula).toContain('ax^2 + bx + c = 0');
      expect(defCard?.example).toContain('3x² - 5x + 2 = 0');

      // Slide 3: Roots of a Quadratic Equation
      const slide3 = slides[2];
      expect(slide3.title).toBe('Roots of a Quadratic Equation');
      const rootDef = slide3.cards!.find((c) => c.term === 'Roots of Quadratic Equation');
      expect(rootDef).toBeDefined();
      expect(rootDef?.formalDefinition).toContain('intersects the horizontal x-axis');

      // Slide 4: Discriminant (\Delta = b^2 - 4ac, 3 regimes, calculation warning)
      const slide4 = slides[3];
      expect(slide4.title).toBe('The Discriminant and Nature of Roots');
      expect(slide4.formula).toContain('b^2 - 4ac');
      const warningCard = slide4.cards!.find((c) => c.cardType === 'warning-note');
      expect(warningCard).toBeDefined();
      expect(warningCard?.body).toContain('(-b)² is always positive');

      // Slide 5: Solving by Factorisation (concrete problem and step-by-step solution)
      const slide5 = slides[4];
      expect(slide5.title).toBe('Solving by Factorisation');
      const probSolCard = slide5.cards!.find((c) => c.cardType === 'problem-solution');
      expect(probSolCard).toBeDefined();
      expect(probSolCard?.problem?.text).toContain('x² - 5x + 6 = 0');
      expect(probSolCard?.solution?.text).toContain('(x - 2)(x - 3) = 0');
      expect(probSolCard?.solution?.text).toContain('x₁ = 2 and x₂ = 3');

      // Slide 6: Universal Quadratic Formula (\frac{-b \pm \sqrt{b^2-4ac}}{2a} and proof)
      const slide6 = slides[5];
      expect(slide6.title).toBe('Universal Quadratic Formula');
      expect(slide6.formula).toContain('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
    });

    it('offline fallback generates full substantive teaching content without any blank slides', () => {
      const fallbackDeck = generateCurriculumTemplateFallback({
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        numberOfSlides: 5,
      });

      expect(fallbackDeck.slides).toHaveLength(5);
      fallbackDeck.slides.forEach((slide, idx) => {
        expect(slide.title.trim().length).toBeGreaterThan(5);
        expect(slide.cards).toBeDefined();
        expect(slide.cards!.length).toBeGreaterThan(0);
        const totalWords = slide.cards!.reduce((sum, c) => {
          let cardWords = countWords(typeof c.body === 'string' ? c.body : (c.body || []).join(' '));
          if (c.bulletPoints) c.bulletPoints.forEach((bp) => (cardWords += countWords(bp)));
          if (c.formalDefinition) cardWords += countWords(c.formalDefinition);
          if (c.example) cardWords += countWords(c.example);
          if (c.problemSolution) {
            cardWords += countWords(c.problemSolution.problemText) + countWords(c.problemSolution.solutionText);
          }
          if (c.problem) cardWords += countWords(c.problem.text);
          if (c.solution) cardWords += countWords(c.solution.text);
          if (c.steps) c.steps.forEach((st: any) => (cardWords += countWords(st.title) + countWords(st.description || st.content)));
          if (c.features) c.features.forEach((f: any) => (cardWords += countWords(f.title) + countWords(f.description)));
          return sum + cardWords;
        }, 0);
        expect(totalWords).toBeGreaterThanOrEqual(15);
      });
    });
  });

  // ─── 5. Deck-Level Content Validation (validateDeckContent) ─────────────────
  describe('5. Deck-Level Content Validation & Quality Scoring', () => {
    it('evaluates entire presentation decks and returns quality score and slide reports', () => {
      const sampleDeck: PresentationDeckSpec = {
        topic: 'Quadratic Equations',
        subject: 'Mathematics',
        gradeLevel: 'Grade 10',
        themeId: 'modern-academic',
        slides: [
          {
            slideNumber: 1,
            title: 'Standard Form of Quadratic Equations',
            layout: 'definition-formula',
            formula: '$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$',
            cards: [
              {
                cardType: 'definition',
                title: 'Canonical Standard Form',
                body: 'Every quadratic equation can be rearranged into canonical standard form ax^2 + bx + c = 0.',
                formula: '$$ax^2 + bx + c = 0$$',
                example: 'In 2x^2 + 4x - 6 = 0, a=2, b=4, c=-6',
              },
            ],
          },
          {
            slideNumber: 2,
            title: 'The Discriminant',
            layout: 'concept-explanation',
            formula: '$$\\Delta = b^2 - 4ac$$',
            cards: [
              {
                cardType: 'basic-info',
                title: 'Root Regimes',
                body: 'The discriminant determines the number and nature of roots without full factorization.',
                bulletPoints: ['Δ > 0: two distinct real roots', 'Δ = 0: one repeated root', 'Δ < 0: two complex roots'],
              },
            ],
          },
        ],
      };

      const result = validateDeckContent(sampleDeck);
      expect(result.isValid).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.status).toBe('success');
      expect(result.slideReports).toHaveLength(2);
      expect(result.slideReports![0].hasFormulas).toBe(true);
      expect(result.slideReports![0].validLatex).toBe(true);
    });
  });

  // ─── 6. Live Vector KaTeX Rendering in SVG ──────────────────────────────────
  describe('6. High-Fidelity KaTeX Rendering in SlideThumbnailRenderer', () => {
    it('renders LaTeX formulas as SVG foreignObject containing KaTeX HTML typography', () => {
      const latexTextObject: TextObject = {
        id: 'formula-text-1',
        type: 'text',
        x: 100,
        y: 200,
        width: 600,
        height: 80,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        layerId: 'objects',
        content: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
        fontSize: 24,
        color: '#38bdf8',
        textAlign: 'center',
        isLatex: true,
      };

      const mockPage: Page = {
        id: 'test-page-latex',
        title: 'Formula Slide',
        width: 1920,
        height: 1080,
        background: { type: 'blank', color: '#0f172a' },
        layers: [{ id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 0 }],
        objects: [latexTextObject],
      };

      const svgHtml = renderToString(React.createElement(SlideThumbnailRenderer, { page: mockPage }));

      // Must contain foreignObject for vector KaTeX HTML
      expect(svgHtml).toContain('<foreignObject');
      // Must contain rendered KaTeX class
      expect(svgHtml).toContain('class="katex"');
      // Must embed KATEX_SVG_CSS in <defs><style>
      expect(svgHtml).toContain('<defs><style>');
      expect(svgHtml).toContain('.katex');
    });

    it('native slide compilation preserves isLatex: true on formula TextObjects', () => {
      const slide: SlideContentSpec = {
        slideNumber: 1,
        title: 'Standard Form',
        layout: 'definition-formula',
        formula: '$$ax^2 + bx + c = 0$$',
        cards: [
          {
            cardType: 'basic-info',
            title: 'Overview',
            body: 'General equation form.',
            formula: '$$ax^2 + bx + c = 0$$',
          },
        ],
      };

      const theme = getThemeById('modern-academic');
      const objects = compileDeckSlideToNativeObjects(slide, theme);

      const formulaTexts = objects.filter((o) => o.type === 'text' && (o as TextObject).isLatex);
      expect(formulaTexts.length).toBeGreaterThanOrEqual(1);
      const fText = formulaTexts[0] as TextObject;
      expect(fText.content).toContain('ax^2 + bx + c = 0');
      expect(fText.isLatex).toBe(true);
    });
  });
});
