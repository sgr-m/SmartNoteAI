/**
 * slideLayoutEngine.ts — Slide Layout Engine for AI Teaching Presentation Generator
 * Milestone 5, Stage 1 (TASK-101)
 *
 * Capabilities:
 * - 1920 × 1080 landscape slide coordinate geometry
 * - Configurable margins, 12-column grid, gutters, and spacing
 * - Standard educational slide region hierarchies (header, title, subtitle, body, footer)
 * - Single-column, two-column (equal and asymmetric), multi-column layouts
 * - Multi-card grid arrangements (1x2, 1x3, 1x4, 2x2, 2x3) with inner padding
 * - Real Canvas 2D font metric measurement (`ctx.measureText()`)
 * - Dynamic word-wrapping with explicit line break (`\n`) and long-word breaking
 * - Automatic font-size fitting within bounds and explicit overflow detection
 * - Independent of React components; safe for both browser and Node/testing environments
 */

import { BoundingBox, Point } from '../../../shared/types';
import {
  DEFAULT_SLIDE_WIDTH,
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_MARGINS,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_GRID_GUTTER,
  SlideMargins,
  SlideGridConfig,
  GridBoundsOptions,
  SlideRegions,
  SlideRegionOptions,
  SlideLayoutType,
  ColumnSplitType,
  ColumnLayoutOptions,
  MultiCardLayoutOptions,
  CardBoundsResult,
  HorizontalAlign,
  VerticalAlign,
  TextMeasureOptions,
  TextMeasureResult,
  TextOverflowDetails,
} from '../../../shared/aiPresentationTypes';

// ─── Canvas Measurement Context Management ────────────────────────────────────

let cachedOffscreenCtx: CanvasRenderingContext2D | null = null;

/**
 * Returns an off-screen Canvas 2D context for text measurement.
 * Lazily instantiates and caches a single off-screen canvas in DOM environments.
 */
export function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (cachedOffscreenCtx) return cachedOffscreenCtx;

  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        cachedOffscreenCtx = ctx;
        return cachedOffscreenCtx;
      }
    } catch {
      // In constrained environments where canvas creation fails
    }
  }
  return null;
}

/**
 * Measures text width using real Canvas 2D font metrics if available,
 * with a deterministic typographical fallback for Node.js / headless testing.
 */
export function measureStringWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: number | string = 400,
  fontStyle: 'normal' | 'italic' = 'normal',
  customCtx?: CanvasRenderingContext2D | null
): number {
  if (!text || text.length === 0) return 0;

  const ctx = customCtx !== undefined ? customCtx : getMeasurementContext();

  if (ctx && typeof ctx.measureText === 'function') {
    try {
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      if (metrics && typeof metrics.width === 'number' && metrics.width > 0) {
        return metrics.width;
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback estimation for Node test environments without native font rasterization
  // Proportional weight multiplier: ~0.55 width-to-height ratio for modern sans-serif
  const isMonospace = /mono|consolas|courier/i.test(fontFamily);
  const charWidthRatio = isMonospace ? 0.6 : 0.52;
  const weightRatio = typeof fontWeight === 'number' && fontWeight >= 700 ? 1.08 : 1.0;
  return Math.round(text.length * fontSize * charWidthRatio * weightRatio);
}

// ─── Slide Dimensions & Margins ───────────────────────────────────────────────

/**
 * Computes the printable/usable content bounds of a slide given margins.
 */
export function getSlideContentBounds(
  margins: SlideMargins = DEFAULT_SLIDE_MARGINS,
  slideWidth: number = DEFAULT_SLIDE_WIDTH,
  slideHeight: number = DEFAULT_SLIDE_HEIGHT
): BoundingBox {
  const safeLeft = Math.max(0, margins.left);
  const safeRight = Math.max(0, margins.right);
  const safeTop = Math.max(0, margins.top);
  const safeBottom = Math.max(0, margins.bottom);

  const width = Math.max(0, slideWidth - safeLeft - safeRight);
  const height = Math.max(0, slideHeight - safeTop - safeBottom);

  return {
    x: safeLeft,
    y: safeTop,
    width,
    height,
  };
}

// ─── 12-Column Grid System ────────────────────────────────────────────────────

/**
 * Calculates a bounding box spanning a given column range within a 12-column grid.
 *
 * @param options Grid calculation options (colStart 1..12, colSpan 1..12, top, height)
 * @returns Precise BoundingBox in slide canvas coordinates
 */
export function calculateGridBounds(options: GridBoundsOptions): BoundingBox {
  const container = options.containerBounds || getSlideContentBounds();
  const totalCols = Math.max(1, options.gridConfig?.columns || DEFAULT_GRID_COLUMNS);
  const gutter = Math.max(0, options.gridConfig?.gutter !== undefined ? options.gridConfig.gutter : DEFAULT_GRID_GUTTER);

  // Validate and clamp column ranges
  const safeColStart = Math.max(1, Math.min(totalCols, Math.floor(options.colStart)));
  const maxAvailableSpan = totalCols - safeColStart + 1;
  const safeColSpan = Math.max(1, Math.min(maxAvailableSpan, Math.floor(options.colSpan)));

  const totalGutterWidth = (totalCols - 1) * gutter;
  const availableWidth = Math.max(0, container.width - totalGutterWidth);
  const colWidth = availableWidth / totalCols;

  const x = container.x + (safeColStart - 1) * (colWidth + gutter);
  const width = safeColSpan * colWidth + (safeColSpan - 1) * gutter;
  const y = container.y + Math.max(0, options.top);
  const height = Math.max(0, options.height);

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
  };
}

// ─── Standard Educational Slide Regions ───────────────────────────────────────

/**
 * Partitions a slide into standard pedagogical regions:
 * Header (Title + optional Subtitle/Pill), Body (Educational content), and Footer.
 */
export function calculateSlideRegions(options: SlideRegionOptions = {}): SlideRegions {
  const margins = options.margins || DEFAULT_SLIDE_MARGINS;
  const slideW = options.slideWidth || DEFAULT_SLIDE_WIDTH;
  const slideH = options.slideHeight || DEFAULT_SLIDE_HEIGHT;
  const contentBounds = getSlideContentBounds(margins, slideW, slideH);

  const hasSubtitle = options.hasSubtitle ?? true;
  const hasFooter = options.hasFooter ?? true;

  const headerHeight = options.headerHeight || (hasSubtitle ? 130 : 90);
  const footerHeight = options.footerHeight || (hasFooter ? 36 : 0);
  const regionGap = 20;

  // Header zone
  const headerBounds: BoundingBox = {
    x: contentBounds.x,
    y: contentBounds.y,
    width: contentBounds.width,
    height: headerHeight,
  };

  let titleBounds: BoundingBox;
  let subtitleBounds: BoundingBox | undefined;

  if (hasSubtitle) {
    titleBounds = {
      x: headerBounds.x,
      y: headerBounds.y,
      width: headerBounds.width,
      height: 74,
    };
    subtitleBounds = {
      x: headerBounds.x,
      y: headerBounds.y + 78,
      width: headerBounds.width,
      height: 38,
    };
  } else {
    titleBounds = {
      x: headerBounds.x,
      y: headerBounds.y,
      width: headerBounds.width,
      height: headerBounds.height,
    };
  }

  // Footer zone
  let footerBounds: BoundingBox | undefined;
  if (hasFooter && footerHeight > 0) {
    footerBounds = {
      x: contentBounds.x,
      y: contentBounds.y + contentBounds.height - footerHeight,
      width: contentBounds.width,
      height: footerHeight,
    };
  }

  // Body zone (occupies remaining height between header and footer)
  const bodyTop = headerBounds.y + headerBounds.height + regionGap;
  const bodyBottom = footerBounds ? footerBounds.y - regionGap : contentBounds.y + contentBounds.height;
  const bodyHeight = Math.max(0, bodyBottom - bodyTop);

  const bodyBounds: BoundingBox = {
    x: contentBounds.x,
    y: bodyTop,
    width: contentBounds.width,
    height: bodyHeight,
  };

  return {
    contentBounds,
    headerBounds,
    titleBounds,
    subtitleBounds,
    bodyBounds,
    footerBounds,
  };
}

// ─── Multi-Column Educational Layouts ─────────────────────────────────────────

/**
 * Computes bounding boxes for multi-column splits (e.g. 50/50, 60/40 concept/illustration, 30/70 sidebar).
 */
export function calculateColumnBounds(options: ColumnLayoutOptions): BoundingBox[] {
  const { containerBounds, splitType = 'two-equal', gutter = DEFAULT_GRID_GUTTER } = options;

  let ratios: number[];

  if (options.customRatios && options.customRatios.length > 0) {
    ratios = options.customRatios.map((r) => Math.max(0.1, r));
  } else {
    switch (splitType) {
      case 'single':
        ratios = [1];
        break;
      case 'two-equal':
        ratios = [1, 1];
        break;
      case 'two-concept-demo':
        ratios = [7, 5]; // ~58% concept / ~42% interactive demo
        break;
      case 'two-sidebar-main':
        ratios = [4, 8]; // ~33% outline / ~67% main content
        break;
      case 'two-main-sidebar':
        ratios = [8, 4]; // ~67% main content / ~33% key points
        break;
      case 'three-equal':
        ratios = [1, 1, 1];
        break;
      case 'four-equal':
        ratios = [1, 1, 1, 1];
        break;
      default:
        ratios = [1, 1];
        break;
    }
  }

  const numCols = ratios.length;
  if (numCols === 1) {
    return [{ ...containerBounds }];
  }

  const totalGutter = (numCols - 1) * gutter;
  const availableWidth = Math.max(0, containerBounds.width - totalGutter);
  const sumRatios = ratios.reduce((sum, r) => sum + r, 0);

  const columns: BoundingBox[] = [];
  let currentX = containerBounds.x;

  for (let i = 0; i < numCols; i++) {
    const colWidth = Math.round((availableWidth * ratios[i]) / sumRatios);
    // Give any rounding remainder to the final column
    const finalWidth = i === numCols - 1 ? Math.max(0, containerBounds.x + containerBounds.width - currentX) : colWidth;

    columns.push({
      x: currentX,
      y: containerBounds.y,
      width: Math.max(0, finalWidth),
      height: containerBounds.height,
    });

    currentX += finalWidth + gutter;
  }

  return columns;
}

// ─── Multi-Card Educational Grid Layouts ──────────────────────────────────────

/**
 * Distributes a set of educational cards evenly within a container bounds.
 * Computes outer card boxes and padded inner content bounds.
 */
export function calculateCardBounds(options: MultiCardLayoutOptions): CardBoundsResult {
  const { containerBounds, cardCount, gapX = 24, gapY = 24 } = options;

  if (cardCount <= 0) {
    return { cards: [], innerBounds: [], cardPadding: 24, columns: 0, rows: 0 };
  }

  let columns = options.columns;
  let rows = options.rows;

  if (!columns || !rows) {
    if (cardCount === 1) {
      columns = 1;
      rows = 1;
    } else if (cardCount === 2) {
      columns = 2;
      rows = 1;
    } else if (cardCount === 3) {
      columns = 3;
      rows = 1;
    } else if (cardCount === 4) {
      // 2x2 grid preferred for 4 cards in 16:9
      columns = 2;
      rows = 2;
    } else if (cardCount <= 6) {
      columns = 3;
      rows = 2;
    } else {
      columns = 4;
      rows = Math.ceil(cardCount / 4);
    }
  }

  const safeCols = Math.max(1, columns);
  const safeRows = Math.max(1, rows);

  const totalGapX = (safeCols - 1) * gapX;
  const totalGapY = (safeRows - 1) * gapY;

  const cardWidth = Math.max(0, Math.floor((containerBounds.width - totalGapX) / safeCols));
  const cardHeight = Math.max(0, Math.floor((containerBounds.height - totalGapY) / safeRows));
  const cardPadding = Math.min(24, Math.round(cardWidth * 0.06));

  const cards: BoundingBox[] = [];
  const innerBounds: BoundingBox[] = [];

  for (let idx = 0; idx < cardCount; idx++) {
    const colIdx = idx % safeCols;
    const rowIdx = Math.floor(idx / safeCols);

    const x = containerBounds.x + colIdx * (cardWidth + gapX);
    const y = containerBounds.y + rowIdx * (cardHeight + gapY);

    const cardBox: BoundingBox = {
      x,
      y,
      width: cardWidth,
      height: cardHeight,
    };

    cards.push(cardBox);

    innerBounds.push({
      x: cardBox.x + cardPadding,
      y: cardBox.y + cardPadding,
      width: Math.max(0, cardBox.width - cardPadding * 2),
      height: Math.max(0, cardBox.height - cardPadding * 2),
    });
  }

  return {
    cards,
    innerBounds,
    cardPadding,
    columns: safeCols,
    rows: safeRows,
  };
}

// ─── Alignment Utilities ──────────────────────────────────────────────────────

/**
 * Aligns content within a target bounding box according to horizontal and vertical alignment rules.
 */
export function alignBounds(
  contentBounds: BoundingBox,
  targetBounds: BoundingBox,
  hAlign: HorizontalAlign = 'left',
  vAlign: VerticalAlign = 'top'
): BoundingBox {
  let x = contentBounds.x;
  let y = contentBounds.y;

  if (hAlign === 'left') {
    x = targetBounds.x;
  } else if (hAlign === 'center') {
    x = targetBounds.x + (targetBounds.width - contentBounds.width) / 2;
  } else if (hAlign === 'right') {
    x = targetBounds.x + targetBounds.width - contentBounds.width;
  }

  if (vAlign === 'top') {
    y = targetBounds.y;
  } else if (vAlign === 'middle') {
    y = targetBounds.y + (targetBounds.height - contentBounds.height) / 2;
  } else if (vAlign === 'bottom') {
    y = targetBounds.y + targetBounds.height - contentBounds.height;
  }

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    width: contentBounds.width,
    height: contentBounds.height,
  };
}

// ─── Text Measurement, Word Wrapping & Metrics ────────────────────────────────

/**
 * Splits a long word that exceeds the available maxWidth into chunks that fit within maxWidth.
 */
function breakLongWord(
  word: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: number | string,
  fontStyle: 'normal' | 'italic',
  ctx?: CanvasRenderingContext2D | null
): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < word.length; i++) {
    const candidate = currentChunk + word[i];
    const width = measureStringWidth(candidate, fontSize, fontFamily, fontWeight, fontStyle, ctx);

    if (width > maxWidth && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = word[i];
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Measures text using real font metrics, wraps words to maxWidth, and respects explicit newlines (`\n`).
 */
export function measureTextLines(
  text: string,
  options: TextMeasureOptions,
  customCtx?: CanvasRenderingContext2D | null
): TextMeasureResult {
  const {
    fontFamily = 'Inter, sans-serif',
    fontSize = 18,
    fontWeight = 400,
    fontStyle = 'normal',
    lineHeightMultiplier = 1.35,
    maxWidth,
    maxHeight,
    maxLines,
  } = options;

  if (maxWidth <= 0 || !text || text.length === 0) {
    return {
      lines: [],
      lineHeight: Math.round(fontSize * lineHeightMultiplier),
      totalWidth: 0,
      totalHeight: 0,
      actualFontSize: fontSize,
      isOverflow: false,
    };
  }

  const lineHeight = Math.round(fontSize * lineHeightMultiplier);
  const resultLines: string[] = [];
  let maxLineWidthMeasured = 0;

  // Split by explicit line breaks first
  const rawParagraphs = text.split(/\r?\n/);

  for (const para of rawParagraphs) {
    if (para.trim().length === 0) {
      // Empty line preserved
      resultLines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx];
      const wordWidth = measureStringWidth(word, fontSize, fontFamily, fontWeight, fontStyle, customCtx);

      // If a single word is wider than the entire available width, break it
      if (wordWidth > maxWidth) {
        if (currentLine.length > 0) {
          resultLines.push(currentLine);
          const lw = measureStringWidth(currentLine, fontSize, fontFamily, fontWeight, fontStyle, customCtx);
          maxLineWidthMeasured = Math.max(maxLineWidthMeasured, lw);
          currentLine = '';
        }

        const brokenChunks = breakLongWord(word, maxWidth, fontSize, fontFamily, fontWeight, fontStyle, customCtx);
        for (let cIdx = 0; cIdx < brokenChunks.length - 1; cIdx++) {
          resultLines.push(brokenChunks[cIdx]);
          const cw = measureStringWidth(brokenChunks[cIdx], fontSize, fontFamily, fontWeight, fontStyle, customCtx);
          maxLineWidthMeasured = Math.max(maxLineWidthMeasured, cw);
        }
        currentLine = brokenChunks[brokenChunks.length - 1];
        continue;
      }

      const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
      const testWidth = measureStringWidth(testLine, fontSize, fontFamily, fontWeight, fontStyle, customCtx);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine.length > 0) {
          resultLines.push(currentLine);
          const lw = measureStringWidth(currentLine, fontSize, fontFamily, fontWeight, fontStyle, customCtx);
          maxLineWidthMeasured = Math.max(maxLineWidthMeasured, lw);
        }
        currentLine = word;
      }
    }

    if (currentLine.length > 0) {
      resultLines.push(currentLine);
      const lw = measureStringWidth(currentLine, fontSize, fontFamily, fontWeight, fontStyle, customCtx);
      maxLineWidthMeasured = Math.max(maxLineWidthMeasured, lw);
    }
  }

  const totalHeight = resultLines.length * lineHeight;
  let isOverflow = false;
  let overflowDetails: TextOverflowDetails | undefined;

  const heightOverflow = maxHeight !== undefined && totalHeight > maxHeight;
  const lineOverflow = maxLines !== undefined && resultLines.length > maxLines;

  if (heightOverflow || lineOverflow) {
    isOverflow = true;
    const availableHeight = maxHeight !== undefined ? maxHeight : (maxLines || resultLines.length) * lineHeight;
    const maxFittingLines = Math.max(0, Math.floor(availableHeight / lineHeight));
    const hiddenLineCount = Math.max(0, resultLines.length - maxFittingLines);

    overflowDetails = {
      isOverflow: true,
      requiredHeight: totalHeight,
      availableHeight,
      requiredWidth: maxLineWidthMeasured,
      availableWidth: maxWidth,
      hiddenLineCount,
      warningMessage: `Text content exceeds bounds by ${Math.round(totalHeight - availableHeight)}px (${hiddenLineCount} lines truncated)`,
    };
  }

  return {
    lines: resultLines,
    lineHeight,
    totalWidth: Math.round(maxLineWidthMeasured),
    totalHeight,
    actualFontSize: fontSize,
    isOverflow,
    overflowDetails,
  };
}

// ─── Font-Size Auto-Fitting & Overflow Management ─────────────────────────────

/**
 * Fits text within a target bounding box by adjusting font size between minFontSize and maxFontSize.
 * If text cannot fit even at minFontSize, returns full lines and an explicit overflow warning.
 *
 * Sequence:
 * 1. Calculate text dimensions at maxFontSize.
 * 2. Wrap text within maxWidth.
 * 3. Calculate required height.
 * 4. Step down font size if overflowing.
 * 5. Recalculate layout.
 * 6. Return explicit overflow details if content exceeds bounds at minFontSize.
 */
export function fitTextToBounds(
  text: string,
  bounds: BoundingBox,
  options: Partial<TextMeasureOptions> = {},
  customCtx?: CanvasRenderingContext2D | null
): TextMeasureResult {
  if (bounds.width <= 0 || bounds.height <= 0 || !text || text.trim().length === 0) {
    return {
      lines: text ? [text] : [],
      lineHeight: 20,
      totalWidth: 0,
      totalHeight: 0,
      actualFontSize: options.fontSize || 18,
      isOverflow: bounds.width <= 0 || bounds.height <= 0,
      overflowDetails:
        bounds.width <= 0 || bounds.height <= 0
          ? {
              isOverflow: true,
              requiredHeight: 20,
              availableHeight: Math.max(0, bounds.height),
              requiredWidth: 0,
              availableWidth: Math.max(0, bounds.width),
              hiddenLineCount: 1,
              warningMessage: 'Target bounding box width or height is zero or negative',
            }
          : undefined,
    };
  }

  const maxFontSize = Math.max(10, options.maxFontSize || options.fontSize || 24);
  const minFontSize = Math.max(8, options.minFontSize || 13);
  const allowShrink = options.allowShrink !== false;

  let currentFontSize = maxFontSize;
  let bestResult: TextMeasureResult = measureTextLines(
    text,
    {
      ...options,
      fontSize: currentFontSize,
      maxWidth: bounds.width,
      maxHeight: bounds.height,
    },
    customCtx
  );

  if (!bestResult.isOverflow || !allowShrink) {
    return bestResult;
  }

  // Iteratively reduce font size until content fits or minFontSize is reached
  while (currentFontSize > minFontSize) {
    currentFontSize = Math.max(minFontSize, currentFontSize - 1);
    const attempt = measureTextLines(
      text,
      {
        ...options,
        fontSize: currentFontSize,
        maxWidth: bounds.width,
        maxHeight: bounds.height,
      },
      customCtx
    );

    bestResult = attempt;
    if (!attempt.isOverflow) {
      return attempt;
    }
  }

  // If still overflowing at minFontSize, return explicit overflow details without discarding text
  return bestResult;
}

/**
 * Calculates outer text bounds given an origin point and measurement options.
 */
export function calculateTextBounds(
  text: string,
  origin: Point,
  options: TextMeasureOptions,
  customCtx?: CanvasRenderingContext2D | null
): BoundingBox {
  const result = measureTextLines(text, options, customCtx);
  return {
    x: origin.x,
    y: origin.y,
    width: result.totalWidth,
    height: result.totalHeight,
  };
}

/**
 * Checks if a content bounding box overflows its container box in either dimension.
 */
export function detectOverflow(contentBounds: BoundingBox, containerBounds: BoundingBox): boolean {
  return (
    contentBounds.width > containerBounds.width ||
    contentBounds.height > containerBounds.height ||
    contentBounds.x < containerBounds.x ||
    contentBounds.y < containerBounds.y ||
    contentBounds.x + contentBounds.width > containerBounds.x + containerBounds.width ||
    contentBounds.y + contentBounds.height > containerBounds.y + containerBounds.height
  );
}

// ─── Content-Aware Template & Layout Selection ────────────────────────────────

export interface ContentAwareSelectionOptions {
  title: string;
  subtitle?: string;
  contentText?: string;
  content?: string;
  topic?: string;
  subject?: string;
  slideIndex?: number;
  totalSlides?: number;
  hasFormula?: boolean;
  hasDiagram?: boolean;
}

/**
 * Dynamically chooses the optimal slide layout archetype based on educational content,
 * semantic keywords, mathematical formulas, and position in the pedagogical sequence.
 */
export function selectContentAwareLayout(options: ContentAwareSelectionOptions): SlideLayoutType {
  const {
    title,
    subtitle = '',
    contentText = '',
    content = '',
    topic = '',
    subject = '',
    slideIndex,
    totalSlides,
    hasFormula,
    hasDiagram,
  } = options;

  const rawText = `${contentText} ${content}`;
  const combined = `${title} ${subtitle} ${rawText} ${topic} ${subject}`.toLowerCase();

  // 1. Explicit First slide in sequence (Intro / Agenda)
  if (slideIndex === 0 && !hasFormula && !hasDiagram) {
    return 'title-hero';
  }
  if (
    combined.includes('learning objective') ||
    combined.includes('agenda') ||
    combined.includes('unit overview') ||
    combined.includes('course introduction')
  ) {
    return 'title-hero';
  }

  // 2. Explicit or keyword Final slide in sequence (Summary / Exit ticket / Review)
  if (
    (typeof totalSlides === 'number' && typeof slideIndex === 'number' && totalSlides > 1 && slideIndex === totalSlides - 1) ||
    combined.includes('exit ticket') ||
    combined.includes('summary checklist') ||
    combined.includes('lesson review') ||
    combined.includes('lesson summary') ||
    combined.includes('recap') ||
    combined.includes('wrap-up')
  ) {
    return 'summary-takeaway';
  }

  // 3. Guided problem solving & numerical exercises
  if (
    combined.includes('worked example') ||
    combined.includes('problem-solving') ||
    combined.includes('practice problem') ||
    combined.includes('challenge problem') ||
    title.toLowerCase().includes('problem') ||
    title.toLowerCase().includes('worked') ||
    (combined.includes('solve for') && !combined.includes('formula'))
  ) {
    return 'problem-solution';
  }

  // 4. Mathematical derivations & LaTeX formulas
  if (
    combined.includes('formula') ||
    combined.includes('equation') ||
    combined.includes('derive') ||
    combined.includes('derivation') ||
    combined.includes('quadratic') ||
    combined.includes('pythagorean') ||
    combined.includes('algebraic') ||
    combined.includes('calculus') ||
    combined.includes('theorem') ||
    combined.includes('\\frac') ||
    combined.includes('\\sqrt') ||
    combined.includes('discriminant') ||
    combined.includes('ax²') ||
    combined.includes('f(x)')
  ) {
    return 'mathematical-explanation';
  }

  // 5. Side-by-side comparative analysis & contrasting models
  if (
    combined.includes('compare') ||
    combined.includes('versus') ||
    combined.includes(' vs ') ||
    combined.includes('difference') ||
    combined.includes('contrast') ||
    combined.includes('tradeoff') ||
    combined.includes('advantages and disadvantages') ||
    combined.includes('pro and con')
  ) {
    return 'comparison';
  }

  // 6. Visual diagrams, anatomy, schematics & cycles
  if (
    combined.includes('diagram') ||
    combined.includes('schematic') ||
    combined.includes('anatomy') ||
    combined.includes('cycle') ||
    combined.includes('chloroplast') ||
    combined.includes('circuit') ||
    combined.includes('pathway') ||
    combined.includes('visual model') ||
    combined.includes('architecture')
  ) {
    return 'diagram-explanation';
  }

  // 7. Sequential stages, timeline, or protocols
  if (
    combined.includes('step') ||
    combined.includes('protocol') ||
    combined.includes('stage') ||
    combined.includes('sequence') ||
    combined.includes('timeline') ||
    combined.includes('phases') ||
    combined.includes('algorithm')
  ) {
    return 'step-process';
  }

  // 8. Theory vs Practical applications
  if (
    combined.includes('application') ||
    combined.includes('industry') ||
    combined.includes('real-world') ||
    combined.includes('case study')
  ) {
    return 'two-column-split';
  }

  // 9. Default concept explanation
  return 'concept-explanation';
}

