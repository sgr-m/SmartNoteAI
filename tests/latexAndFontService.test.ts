import { describe, it, expect } from 'vitest';
import {
  isLatexSyntax,
  cleanLatexDelimiters,
  renderLatexHtml,
  autoFormatLatexFractions,
  autoFormatMathOperators,
  measureLatexSize,
  latexToSvgDataUrl,
  getCachedLatexImage,
  clearLatexImageCache,
} from '../src/renderer/services/latexService';

import { getAvailableFonts, initializeWindowsFonts } from '../src/renderer/services/fontService';

describe('latexService', () => {
  it('correctly identifies LaTeX formulas', () => {
    expect(isLatexSyntax('\\frac{1}{2}')).toBe(true);
    expect(isLatexSyntax('\\sqrt{x^2 + y^2}')).toBe(true);
    expect(isLatexSyntax('\\int_{0}^{\\infty} e^{-x} dx')).toBe(true);
    expect(isLatexSyntax('\\sum_{i=1}^{n} x_i')).toBe(true);
    expect(isLatexSyntax('x^2 + y^2 = r^2')).toBe(true);
    expect(isLatexSyntax('E = mc^2')).toBe(true);
    expect(isLatexSyntax('\\alpha + \\beta = \\theta')).toBe(true);
    expect(isLatexSyntax('$x + y = z$')).toBe(true);
    expect(isLatexSyntax('$$\\Delta = b^2 - 4ac$$')).toBe(true);
  });

  it('does not falsely classify normal English prose as LaTeX', () => {
    expect(isLatexSyntax('Hello World! Welcome to the lesson.')).toBe(false);
    expect(isLatexSyntax('Today we will learn about photosynthesis.')).toBe(false);
    expect(isLatexSyntax('Item 1: Read page 24.')).toBe(false);
  });

  it('strips LaTeX delimiters correctly', () => {
    expect(cleanLatexDelimiters('$$x^2 + 1$$')).toBe('x^2 + 1');
    expect(cleanLatexDelimiters('$a + b$')).toBe('a + b');
    expect(cleanLatexDelimiters('\\(f(x)\\)')).toBe('f(x)');
    expect(cleanLatexDelimiters('\\[E=mc^2\\]')).toBe('E=mc^2');
  });

  it('renders valid HTML string using KaTeX without duplicating MathML', () => {
    const result = renderLatexHtml('ax^2 + bx + c = 0');
    expect(result.html).toContain('katex');
    // Crucial fix: MathML tags must NOT be present to prevent duplicate equation lines
    expect(result.html).not.toContain('<math');
    expect(result.html).not.toContain('katex-mathml');
    expect(result.error).toBeUndefined();
  });

  it('gracefully handles incomplete or malformed LaTeX formulas', () => {
    const result = renderLatexHtml('\\frac{incomplete');
    expect(result.html).toBeDefined();
    // In throwOnError: false mode, KaTeX outputs error span
    expect(typeof result.html).toBe('string');
  });

  it('converts slash fractions (1/2, a/b, parenthesized fractions) into proper vertical fractions', () => {
    expect(autoFormatLatexFractions('1/2')).toBe('\\frac{1}{2}');
    expect(autoFormatLatexFractions('3/4')).toBe('\\frac{3}{4}');
    expect(autoFormatLatexFractions('a/b')).toBe('\\frac{a}{b}');
    expect(autoFormatLatexFractions('(\\pi \\theta / 360)')).toBe('\\left(\\frac{\\pi \\theta}{360}\\right)');
    expect(autoFormatLatexFractions('(1/12)')).toBe('\\left(\\frac{1}{12}\\right)');
    expect(autoFormatLatexFractions('(a + b)/(c + d)')).toBe('\\frac{a + b}{c + d}');
    expect(autoFormatLatexFractions('r^2 (\\pi \\theta / 360) - 1/2 sin \\theta')).toContain('\\frac{1}{2}');
    expect(autoFormatLatexFractions('r^2 (\\pi \\theta / 360) - 1/2 sin \\theta')).toContain('\\left(\\frac{\\pi \\theta}{360}\\right)');
  });

  it('auto-formats math operators without backslash into proper LaTeX operators', () => {
    expect(autoFormatMathOperators('sin \\theta')).toBe('\\sin \\theta');
    expect(autoFormatMathOperators('cos^2 \\theta')).toBe('\\cos^2 \\theta');
    expect(autoFormatMathOperators('tan x')).toBe('\\tan x');
  });

  it('renders 1/2 and (pi theta / 360) as a proper vertical KaTeX fraction', () => {
    const result = renderLatexHtml('r^2 (\\pi \\theta / 360) - 1/2 sin \\theta');
    expect(result.success).toBe(true);
    expect(result.html).toContain('mfrac'); // KaTeX vertical fraction class!
    expect(result.html).toContain('frac-line'); // Horizontal fraction bar!
  });

  it('measures rendered LaTeX dimensions tightly without huge excess empty space', () => {
    const sizeShort = measureLatexSize('E = mc^2', 24);
    expect(sizeShort.width).toBeGreaterThanOrEqual(60);
    expect(sizeShort.width).toBeLessThan(300); // tightly measured, NOT 1000px+
    expect(sizeShort.height).toBeGreaterThanOrEqual(36);
    expect(sizeShort.height).toBeLessThan(120);

    const sizeLong = measureLatexSize('r^2 \\pi \\frac{\\theta}{360} - \\sin \\frac{\\theta}{2} \\cos \\frac{\\theta}{2}', 24);
    expect(sizeLong.width).toBeGreaterThanOrEqual(180);
    expect(sizeLong.width).toBeLessThan(500); // tightly measured around 250px, NOT 1387px!
  });

  it('increases measured dimensions proportionally when fontSize increases', () => {
    const smallSize = measureLatexSize('ax^2 + bx + c = 0', 20);
    const largeSize = measureLatexSize('ax^2 + bx + c = 0', 60);

    expect(largeSize.width).toBeGreaterThan(smallSize.width * 1.8);
    expect(largeSize.height).toBeGreaterThan(smallSize.height * 1.8);
  });

  it('generates snug SVG Data URLs without giant artificial margins', () => {
    const dataUrl = latexToSvgDataUrl('E = mc^2', '#ffffff', 32, 140, 48);
    expect(dataUrl).toContain('data:image/svg+xml');

    const decoded = decodeURIComponent(dataUrl);
    expect(decoded).toContain('width="140"');
    expect(decoded).toContain('height="48"');
    expect(decoded).toContain('viewBox="0 0 140 48"');
    expect(decoded).toContain('font-size: 32px');
    expect(decoded).toContain('padding: 4px 6px');
    // Ensure no 340px or 140px artificial blowups
    expect(decoded).not.toContain('width="340"');
    expect(decoded).not.toContain('padding: 24px 20px');
  });

  it('generates distinct cached images when fontSize is changed', () => {
    clearLatexImageCache();
    const originalImage = globalThis.Image;
    try {
      class MockImage {
        src = '';
        complete = true;
        naturalWidth = 100;
        naturalHeight = 50;
        crossOrigin = '';
        onload: (() => void) | null = null;
      }
      (globalThis as any).Image = MockImage;

      // First render at 24px
      const img24 = getCachedLatexImage('test-id', 'ax^2 + bx + c = 0', '#ffffff', 24, 160, 48);
      // At 48px it must generate a distinct cached image, NOT reuse the 24px one
      const img48 = getCachedLatexImage('test-id', 'ax^2 + bx + c = 0', '#ffffff', 48, 320, 96);

      expect(img24).toBeDefined();
      expect(img48).toBeDefined();
      expect(img24).not.toBe(img48);
    } finally {
      (globalThis as any).Image = originalImage;
    }
  });
});

describe('fontService', () => {
  it('provides a comprehensive Windows font library', () => {
    const fonts = getAvailableFonts();
    expect(fonts.length).toBeGreaterThan(25);

    const families = fonts.map((f) => f.family.toLowerCase());
    // Teaching & Chalkboard
    expect(families.some((f) => f.includes('comic') || f.includes('ink free') || f.includes('segoe print'))).toBe(true);
    // Modern Sans
    expect(families.some((f) => f.includes('segoe ui') || f.includes('calibri') || f.includes('arial'))).toBe(true);
    // Serif & Academic
    expect(families.some((f) => f.includes('times') || f.includes('cambria') || f.includes('georgia'))).toBe(true);
    // Math & Code
    expect(families.some((f) => f.includes('cambria math') || f.includes('cascadia') || f.includes('consolas'))).toBe(true);
  });

  it('categorizes fonts into distinct groups', () => {
    const fonts = getAvailableFonts();
    const categories = new Set(fonts.map((f) => f.category));
    expect(categories.has('Teaching & Chalkboard')).toBe(true);
    expect(categories.has('Modern Sans')).toBe(true);
    expect(categories.has('Serif & Academic')).toBe(true);
    expect(categories.has('Math & Code')).toBe(true);
  });

  it('initializes Windows fonts asynchronously without errors or lag', async () => {
    const fonts = await initializeWindowsFonts();
    expect(Array.isArray(fonts)).toBe(true);
    expect(fonts.length).toBeGreaterThan(0);
  });
});
