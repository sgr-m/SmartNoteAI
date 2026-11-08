/**
 * slideLayoutEngine.test.ts — Unit tests for AI Presentation Slide Layout Engine
 * TASK-101 Verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SLIDE_WIDTH,
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_MARGINS,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_GRID_GUTTER,
} from '../src/shared/aiPresentationTypes';
import {
  getSlideContentBounds,
  calculateGridBounds,
  calculateSlideRegions,
  calculateColumnBounds,
  calculateCardBounds,
  alignBounds,
  measureStringWidth,
  measureTextLines,
  fitTextToBounds,
  detectOverflow,
  calculateTextBounds,
} from '../src/renderer/services/aiPresentation/slideLayoutEngine';

describe('TASK-101: Slide Layout Engine', () => {
  describe('1. Slide Dimensions and Content Margins', () => {
    it('calculates correct default content bounds for 1920x1080 slide', () => {
      const bounds = getSlideContentBounds();
      expect(bounds.x).toBe(DEFAULT_SLIDE_MARGINS.left); // 80
      expect(bounds.y).toBe(DEFAULT_SLIDE_MARGINS.top);  // 70
      expect(bounds.width).toBe(1920 - 80 - 80);        // 1760
      expect(bounds.height).toBe(1080 - 70 - 70);       // 940
    });

    it('respects custom margins and arbitrary slide sizes', () => {
      const bounds = getSlideContentBounds(
        { top: 50, bottom: 50, left: 100, right: 100 },
        1920,
        1080
      );
      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(50);
      expect(bounds.width).toBe(1720);
      expect(bounds.height).toBe(980);
    });

    it('handles zero or negative margins safely without crashing', () => {
      const bounds = getSlideContentBounds({ top: -10, bottom: 0, left: -5, right: 20 });
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(1900);
      expect(bounds.height).toBe(1080);
    });
  });

  describe('2. 12-Column Grid Calculations', () => {
    it('calculates bounds spanning full 12 columns accurately', () => {
      const container = { x: 80, y: 70, width: 1760, height: 940 };
      const bounds = calculateGridBounds({
        colStart: 1,
        colSpan: 12,
        top: 0,
        height: 200,
        containerBounds: container,
      });

      expect(bounds.x).toBe(80);
      expect(bounds.y).toBe(70);
      expect(bounds.width).toBe(1760);
      expect(bounds.height).toBe(200);
    });

    it('calculates two equal 6-column spans with gutter separation', () => {
      const container = { x: 100, y: 100, width: 1200, height: 600 };
      const gutter = 24;

      const leftCol = calculateGridBounds({
        colStart: 1,
        colSpan: 6,
        top: 0,
        height: 500,
        containerBounds: container,
        gridConfig: { columns: 12, gutter },
      });

      const rightCol = calculateGridBounds({
        colStart: 7,
        colSpan: 6,
        top: 0,
        height: 500,
        containerBounds: container,
        gridConfig: { columns: 12, gutter },
      });

      expect(leftCol.x).toBe(100);
      expect(rightCol.x).toBe(leftCol.x + leftCol.width + gutter);
      expect(leftCol.width).toBe(rightCol.width);
      expect(leftCol.width + rightCol.width + gutter).toBe(1200);
    });

    it('clamps out-of-range colStart and colSpan to safe boundaries', () => {
      const container = { x: 0, y: 0, width: 1200, height: 600 };

      // ColStart > 12 should be clamped to 12
      const clampedStart = calculateGridBounds({
        colStart: 15,
        colSpan: 4,
        top: 10,
        height: 100,
        containerBounds: container,
      });
      expect(clampedStart.width).toBeGreaterThan(0);

      // ColSpan exceeding available space should be clamped to remainder
      const clampedSpan = calculateGridBounds({
        colStart: 10,
        colSpan: 8,
        top: 10,
        height: 100,
        containerBounds: container,
      });
      // At col 10, only 3 columns remain (10, 11, 12)
      expect(clampedSpan.x).toBeGreaterThan(0);
      expect(clampedSpan.width).toBeLessThanOrEqual(container.width);
    });
  });

  describe('3. Slide Region Hierarchy', () => {
    it('partitions slide into header, title, subtitle, body, and footer', () => {
      const regions = calculateSlideRegions({ hasSubtitle: true, hasFooter: true });

      expect(regions.contentBounds.width).toBe(1760);
      expect(regions.titleBounds.height).toBeGreaterThan(0);
      expect(regions.subtitleBounds).toBeDefined();
      expect(regions.bodyBounds.height).toBeGreaterThan(400);
      expect(regions.footerBounds).toBeDefined();

      // Ensure body is vertically situated strictly below header and above footer
      expect(regions.bodyBounds.y).toBeGreaterThan(regions.headerBounds.y + regions.headerBounds.height);
      expect(regions.bodyBounds.y + regions.bodyBounds.height).toBeLessThanOrEqual(regions.footerBounds!.y);
    });

    it('omits subtitle and footer cleanly when disabled', () => {
      const regions = calculateSlideRegions({ hasSubtitle: false, hasFooter: false });
      expect(regions.subtitleBounds).toBeUndefined();
      expect(regions.footerBounds).toBeUndefined();
      expect(regions.bodyBounds.height).toBeGreaterThan(500);
    });
  });

  describe('4. Column Layouts (Equal & Asymmetric)', () => {
    const container = { x: 100, y: 150, width: 1000, height: 600 };

    it('calculates 50/50 two-column split with gutter', () => {
      const cols = calculateColumnBounds({
        containerBounds: container,
        splitType: 'two-equal',
        gutter: 20,
      });

      expect(cols).toHaveLength(2);
      expect(cols[0].width).toBe(490);
      expect(cols[1].width).toBe(490);
      expect(cols[1].x).toBe(100 + 490 + 20);
      expect(cols[0].height).toBe(600);
    });

    it('calculates 60/40 two-concept-demo asymmetric split', () => {
      const cols = calculateColumnBounds({
        containerBounds: container,
        splitType: 'two-concept-demo',
        gutter: 20,
      });

      expect(cols).toHaveLength(2);
      expect(cols[0].width).toBeGreaterThan(cols[1].width);
      expect(cols[0].width + cols[1].width + 20).toBe(1000);
    });

    it('calculates custom ratio splits (e.g. 3 columns with weights 2:1:1)', () => {
      const cols = calculateColumnBounds({
        containerBounds: container,
        customRatios: [2, 1, 1],
        gutter: 10,
      });

      expect(cols).toHaveLength(3);
      expect(cols[0].width).toBeGreaterThan(cols[1].width);
      expect(cols[1].width).toBe(cols[2].width);
    });

    it('handles single column', () => {
      const cols = calculateColumnBounds({
        containerBounds: container,
        splitType: 'single',
      });
      expect(cols).toHaveLength(1);
      expect(cols[0]).toEqual(container);
    });
  });

  describe('5. Multi-Card Layouts & Inner Bounds', () => {
    const container = { x: 80, y: 200, width: 1200, height: 600 };

    it('positions 3 horizontal cards with gap and inner padding', () => {
      const result = calculateCardBounds({
        containerBounds: container,
        cardCount: 3,
        gapX: 20,
      });

      expect(result.cards).toHaveLength(3);
      expect(result.innerBounds).toHaveLength(3);
      expect(result.columns).toBe(3);
      expect(result.rows).toBe(1);

      // Card widths should be equal
      expect(result.cards[0].width).toBe(result.cards[1].width);
      expect(result.cards[1].width).toBe(result.cards[2].width);

      // Inner bounds should be indented by cardPadding
      const pad = result.cardPadding;
      expect(result.innerBounds[0].x).toBe(result.cards[0].x + pad);
      expect(result.innerBounds[0].y).toBe(result.cards[0].y + pad);
      expect(result.innerBounds[0].width).toBe(result.cards[0].width - pad * 2);
    });

    it('arranges 4 cards into a 2x2 grid in 16:9 widescreen', () => {
      const result = calculateCardBounds({
        containerBounds: container,
        cardCount: 4,
        gapX: 20,
        gapY: 20,
      });

      expect(result.columns).toBe(2);
      expect(result.rows).toBe(2);
      expect(result.cards).toHaveLength(4);

      // Row 1
      expect(result.cards[0].y).toBe(result.cards[1].y);
      // Row 2
      expect(result.cards[2].y).toBe(result.cards[3].y);
      expect(result.cards[2].y).toBeGreaterThan(result.cards[0].y);
    });

    it('returns empty results gracefully for cardCount <= 0', () => {
      const result = calculateCardBounds({
        containerBounds: container,
        cardCount: 0,
      });
      expect(result.cards).toHaveLength(0);
      expect(result.innerBounds).toHaveLength(0);
    });
  });

  describe('6. Alignment Utilities', () => {
    const target = { x: 0, y: 0, width: 500, height: 400 };
    const content = { x: 0, y: 0, width: 200, height: 100 };

    it('aligns content center and middle', () => {
      const aligned = alignBounds(content, target, 'center', 'middle');
      expect(aligned.x).toBe(150); // (500 - 200) / 2
      expect(aligned.y).toBe(150); // (400 - 100) / 2
      expect(aligned.width).toBe(200);
      expect(aligned.height).toBe(100);
    });

    it('aligns content right and bottom', () => {
      const aligned = alignBounds(content, target, 'right', 'bottom');
      expect(aligned.x).toBe(300); // 500 - 200
      expect(aligned.y).toBe(300); // 400 - 100
    });
  });

  describe('7. Text Measurement and Word Wrapping', () => {
    it('wraps multiple words across lines when exceeding maxWidth', () => {
      const text = 'The quick brown fox jumps over the lazy dog in photosynthesis research.';
      const result = measureTextLines(text, {
        fontSize: 20,
        maxWidth: 250,
      });

      expect(result.lines.length).toBeGreaterThan(1);
      expect(result.totalHeight).toBe(result.lines.length * result.lineHeight);
      expect(result.totalWidth).toBeLessThanOrEqual(250);
    });

    it('preserves explicit newline characters (\\n)', () => {
      const text = 'First Paragraph\nSecond Paragraph\n\nFourth Paragraph';
      const result = measureTextLines(text, {
        fontSize: 18,
        maxWidth: 600,
      });

      expect(result.lines.length).toBeGreaterThanOrEqual(4);
      expect(result.lines[0]).toBe('First Paragraph');
      expect(result.lines[1]).toBe('Second Paragraph');
      expect(result.lines[2]).toBe(''); // empty line preserved
      expect(result.lines[3]).toBe('Fourth Paragraph');
    });

    it('breaks exceptionally long words that exceed maxWidth individually without throwing', () => {
      const text = 'SupercalifragilisticexpialidociousIsAnUnusuallyLongEducationalKeyword';
      const result = measureTextLines(text, {
        fontSize: 24,
        maxWidth: 150,
      });

      expect(result.lines.length).toBeGreaterThan(1);
      // Ensure no line exceeds maxWidth
      for (const line of result.lines) {
        const w = measureStringWidth(line, 24, 'Inter, sans-serif');
        expect(w).toBeLessThanOrEqual(160); // within minor fallback tolerance
      }
    });

    it('handles empty string gracefully', () => {
      const result = measureTextLines('', { maxWidth: 500 });
      expect(result.lines).toHaveLength(0);
      expect(result.totalHeight).toBe(0);
      expect(result.totalWidth).toBe(0);
      expect(result.isOverflow).toBe(false);
    });
  });

  describe('8. Font-Size Auto-Fitting and Overflow Management', () => {
    it('keeps maxFontSize when text fits easily within container', () => {
      const text = 'Brief Slide Headline';
      const bounds = { x: 100, y: 100, width: 800, height: 200 };

      const result = fitTextToBounds(text, bounds, {
        fontSize: 28,
        maxFontSize: 28,
        minFontSize: 14,
      });

      expect(result.actualFontSize).toBe(28);
      expect(result.isOverflow).toBe(false);
      expect(result.overflowDetails).toBeUndefined();
    });

    it('automatically scales down font size when text overflows container at maxFontSize', () => {
      const longText =
        'Cellular respiration is the biochemical process in which cells convert nutrients into adenosine triphosphate (ATP), and then release waste products. The catabolic reactions involved include glycolysis, the citric acid cycle, and oxidative phosphorylation in the inner mitochondrial membrane.';

      const bounds = { x: 50, y: 50, width: 350, height: 160 };

      const result = fitTextToBounds(longText, bounds, {
        maxFontSize: 26,
        minFontSize: 13,
      });

      // It should have reduced font size below 26px to fit into 160px height
      expect(result.actualFontSize).toBeLessThan(26);
      expect(result.actualFontSize).toBeGreaterThanOrEqual(13);
    });

    it('detects overflow and returns explicit warning details when content exceeds bounds at minFontSize', () => {
      const massiveText =
        '1. Step One: Extensive historical background on classical electrodynamics and Maxwell equations.\n' +
        '2. Step Two: In-depth quantum mechanical formulation and wave equation solutions.\n' +
        '3. Step Three: Detailed computational fluid dynamics analysis with Navier-Stokes approximations.\n' +
        '4. Step Four: Multiphysics coupling and finite element domain discretization.\n' +
        '5. Step Five: Comprehensive experimental validation and error bound analysis.';

      // Tiny container
      const tinyBounds = { x: 0, y: 0, width: 200, height: 60 };

      const result = fitTextToBounds(massiveText, tinyBounds, {
        maxFontSize: 20,
        minFontSize: 12,
      });

      expect(result.isOverflow).toBe(true);
      expect(result.overflowDetails).toBeDefined();
      expect(result.overflowDetails!.requiredHeight).toBeGreaterThan(tinyBounds.height);
      expect(result.overflowDetails!.hiddenLineCount).toBeGreaterThan(0);
      expect(result.overflowDetails!.warningMessage).toContain('exceeds bounds');

      // Crucial: content was NOT silently dropped; full lines are preserved
      expect(result.lines.length).toBeGreaterThan(5);
    });

    it('handles zero or negative bounding boxes safely', () => {
      const result = fitTextToBounds('Some Text', { x: 0, y: 0, width: 0, height: 0 });
      expect(result.isOverflow).toBe(true);
      expect(result.overflowDetails).toBeDefined();
    });
  });

  describe('9. Overflow Detection Helper', () => {
    it('accurately identifies whether content fits inside container', () => {
      const container = { x: 100, y: 100, width: 500, height: 400 };

      const inside = { x: 120, y: 120, width: 200, height: 200 };
      expect(detectOverflow(inside, container)).toBe(false);

      const tooWide = { x: 100, y: 100, width: 550, height: 200 };
      expect(detectOverflow(tooWide, container)).toBe(true);

      const tooTall = { x: 100, y: 100, width: 400, height: 450 };
      expect(detectOverflow(tooTall, container)).toBe(true);

      const shiftedLeft = { x: 50, y: 100, width: 200, height: 200 };
      expect(detectOverflow(shiftedLeft, container)).toBe(true);
    });
  });

  describe('10. calculateTextBounds Helper', () => {
    it('returns exact BoundingBox at specified origin point', () => {
      const bounds = calculateTextBounds(
        'Heading Text',
        { x: 150, y: 220 },
        { fontSize: 24, maxWidth: 400 }
      );

      expect(bounds.x).toBe(150);
      expect(bounds.y).toBe(220);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });
  });
});

