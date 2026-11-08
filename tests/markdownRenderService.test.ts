/**
 * tests/markdownRenderService.test.ts
 * Verifies combined Markdown and LaTeX/KaTeX rendering:
 * - Mathematical formulas within markdown (sums, roots, fractions, dots)
 * - Headings, bold, lists, and horizontal dividers
 * - Clean SVG data URL generation
 */

import { describe, it, expect } from 'vitest';
import {
  renderInlineMarkdownAndLatex,
  markdownToHtml,
  markdownToSvgDataUrl,
} from '../src/renderer/services/markdownRenderService';

describe('Markdown & LaTeX Vector Rendering Service', () => {
  it('renders inline LaTeX formulas inside markdown text into KaTeX spans', () => {
    const raw = 'The dot product is $A \\cdot B$, calculated as $\\sum_{i=1}^n A_i B_i$.';
    const html = renderInlineMarkdownAndLatex(raw);
    expect(html).toContain('katex');
    expect(html).toContain('The dot product is');
    // Ensure raw unparsed dollar signs are replaced by KaTeX output
    expect(html).not.toContain('$A');
  });

  it('renders bold markdown with LaTeX formulas combined (Reference Image test)', () => {
    const raw = '- **$\\|A\\|:$** The Euclidean magnitude, calculated as $\\sqrt{\\sum_{i=1}^n A_i^2}$.';
    const html = markdownToHtml(raw);
    expect(html).toContain('<strong>');
    expect(html).toContain('katex');
    expect(html).toContain('Euclidean magnitude');
    expect(html).toContain('<li');
  });

  it('renders display block formulas $$...$$ correctly', () => {
    const raw = '$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$';
    const html = markdownToHtml(raw);
    expect(html).toContain('katex-display');
  });

  it('renders markdown horizontal divider --- into hr tag', () => {
    const raw = 'Section 1\n---\nSection 2';
    const html = markdownToHtml(raw);
    expect(html).toContain('<hr');
    expect(html).toContain('Section 1');
    expect(html).toContain('Section 2');
  });

  it('generates crisp SVG foreignObject data URL', () => {
    const raw = '### Title\n- Item with $\\alpha + \\beta$';
    const dataUrl = markdownToSvgDataUrl(raw, '#ffffff', 36, 'Inter', 700, 300);
    expect(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(dataUrl).toContain('foreignObject');
    expect(dataUrl).toContain('katex');
  });
});
