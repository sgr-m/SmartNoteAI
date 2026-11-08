import { describe, it, expect } from 'vitest';
import { htmlToSvgDataUrl, measureHtmlSize } from '../src/renderer/services/htmlRenderService';
import { TextObject } from '../src/shared/types';

describe('Typography, HTML/CSS Mode & Markdown Enhancements Suite', () => {
  it('generates valid SVG data URLs for HTML/CSS mode rendering', () => {
    const html = '<div style="color: yellow; font-weight: bold;">Important Board Notice</div>';
    const svgUrl = htmlToSvgDataUrl(html, '#ffffff', 26, 'Segoe UI, sans-serif', 400, 100);

    expect(svgUrl).toContain('data:image/svg+xml');
    expect(svgUrl).toContain('foreignObject');
    expect(svgUrl).toContain('Important%20Board%20Notice');
  });

  it('measures HTML dimensions cleanly with reasonable fallbacks', () => {
    const simpleHtml = '<span>Short Text</span>';
    const measured = measureHtmlSize(simpleHtml, 26, 'Segoe UI, sans-serif', 600);

    expect(measured.width).toBeGreaterThanOrEqual(120);
    expect(measured.height).toBeGreaterThanOrEqual(40);
  });

  it('correctly detects Markdown Horizontal Rules (---, ***, ___) like a Jupyter markdown cell', () => {
    const hrRegex = /^(\s*[-*_]\s*){3,}$/;

    expect(hrRegex.test('---')).toBe(true);
    expect(hrRegex.test('  ---  ')).toBe(true);
    expect(hrRegex.test('***')).toBe(true);
    expect(hrRegex.test('___')).toBe(true);
    expect(hrRegex.test('- - -')).toBe(true);

    expect(hrRegex.test('--')).toBe(false);
    expect(hrRegex.test('- Bullet item')).toBe(false);
    expect(hrRegex.test('Heading text')).toBe(false);
  });

  it('correctly detects Markdown Numbered Lists with markers', () => {
    const numRegex = /^(\d+\.)\s+(.+)$/;

    const match1 = '1. First Term ($a$ or $a_1$):'.match(numRegex);
    expect(match1).not.toBeNull();
    expect(match1![1]).toBe('1.');
    expect(match1![2]).toBe('First Term ($a$ or $a_1$):');

    const match2 = '23. Complex item text'.match(numRegex);
    expect(match2).not.toBeNull();
    expect(match2![1]).toBe('23.');
    expect(match2![2]).toBe('Complex item text');

    expect('Not a numbered list 1.'.match(numRegex)).toBeNull();
  });

  it('verifies TextObject supports isHtml flag and custom styling properties', () => {
    const htmlTextObj: TextObject = {
      id: 'test-html-obj',
      type: 'text',
      x: 100,
      y: 100,
      content: '<div style="background: navy; padding: 10px;">HTML Card</div>',
      fontSize: 26,
      fontFamily: 'Segoe UI, sans-serif',
      color: '#ffffff',
      isHtml: true,
      locked: false,
    };

    expect(htmlTextObj.isHtml).toBe(true);
    expect(htmlTextObj.fontSize).toBe(26);
    expect(htmlTextObj.locked).toBe(false);
  });
});

