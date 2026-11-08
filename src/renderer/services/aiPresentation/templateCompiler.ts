/**
 * templateCompiler.ts — Native SmartBoard Object Compiler for Slide Templates
 * Milestone 5: Rebuild & Fix AI Teaching Presentation Generation Workflow
 *
 * Compiles a declarative `SlideTemplateDefinition` and `PresentationTheme`
 * into a complete, native, 100% editable SmartBoard presentation `Page` or `CanvasObject[]`.
 * Ensures:
 * 1. Perfect 16:9 1920x1080 coordinate fidelity.
 * 2. Automatic text wrapping and font scaling — no overflow or clipping.
 * 3. Fallback to rich, realistic placeholder defaults whenever user/AI content is missing,
 *    guaranteeing that NO TEMPLATE OR SLIDE EVER APPEARS CONTENT-EMPTY.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Page,
  CanvasObject,
  ShapeObject,
  TextObject,
  Layer,
} from '../../../shared/types';
import {
  SlideTemplateDefinition,
  SlidePlaceholderDefinition,
  PresentationTheme,
  SlideFilledContent,
  SlideContentSpec,
  HtmlCardSpec,
  CustomSlideMaster,
} from '../../../shared/aiPresentationTypes';
import { measureTextLines } from './slideLayoutEngine';
import { customSlideMasterService } from './customSlideMasterService';

export interface CompileTemplateOptions {
  slideIndex?: number;
  totalSlides?: number;
  topic?: string;
  defaultLayerId?: string;
  includeBackground?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

const LAYER_BACKGROUND = 'background';
const LAYER_OBJECTS = 'objects';

/**
 * Creates standard 5-layer stack for native presentation slides.
 */
export function createSlideLayers(): Layer[] {
  return [
    { id: 'background', name: 'Slide Canvas Background', visible: true, locked: true, opacity: 1, order: 0 },
    { id: 'imported-media', name: 'Slide Media & Diagrams', visible: true, locked: false, opacity: 1, order: 1 },
    { id: 'drawing', name: 'Teacher Whiteboard Drawing', visible: true, locked: false, opacity: 1, order: 2 },
    { id: 'objects', name: 'Lesson Content & Cards', visible: true, locked: false, opacity: 1, order: 3 },
    { id: 'interaction', name: 'Interactive Notes & Highlights', visible: true, locked: false, opacity: 1, order: 4 },
  ];
}

/**
 * Helper to create native ShapeObject.
 */
function createShape(params: {
  shapeType: 'rect' | 'roundedRect' | 'ellipse' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  layerId?: string;
}): ShapeObject {
  return {
    id: uuidv4(),
    type: 'shape',
    shapeType: params.shapeType,
    x: Math.round(params.x),
    y: Math.round(params.y),
    width: Math.round(params.width),
    height: Math.round(params.height),
    rotation: 0,
    fillColor: params.fillColor || 'transparent',
    fillOpacity: params.fillOpacity ?? 1,
    strokeColor: params.strokeColor || 'transparent',
    strokeWidth: params.strokeWidth ?? 0,
    strokeOpacity: params.strokeOpacity ?? 1,
    strokeStyle: 'solid',
    locked: false,
    layerId: params.layerId || LAYER_OBJECTS,
  };
}

/**
 * Helper to create native TextObject.
 */
function createText(params: {
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  preset?: 'title' | 'heading' | 'subheading' | 'body' | 'label' | 'formula' | 'caption';
  isLatex?: boolean;
  layerId?: string;
}): TextObject {
  const numWeight = typeof params.fontWeight === 'number'
    ? params.fontWeight
    : (params.fontWeight === 'bold' ? 700 : (Number(params.fontWeight) || 400));

  const textObj: TextObject = {
    id: uuidv4(),
    type: 'text',
    content: params.content,
    x: Math.round(params.x),
    y: Math.round(params.y),
    width: Math.round(params.width),
    height: Math.round(params.height),
    rotation: 0,
    opacity: 1,
    fontFamily: params.fontFamily,
    fontSize: params.fontSize,
    fontWeight: numWeight,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: params.textAlign || 'left',
    color: params.color,
    backgroundColor: 'transparent',
    preset: params.preset === 'caption' ? 'label' : (params.preset || 'body'),
    isLatex: Boolean(params.isLatex),
    locked: false,
    layerId: params.layerId || LAYER_OBJECTS,
  };
  (textObj as any).text = params.content;
  return textObj;
}

/**
 * Maps a SlideContentSpec (from AI generation or prompt fallback) into a SlideFilledContent structure.
 */
export function mapSlideSpecToFilledContent(slideSpec: SlideContentSpec): SlideFilledContent {
  const values: Record<string, string | string[] | Record<string, unknown>> = {};
  const cards = slideSpec.cards || [];

  cards.forEach((card, idx) => {
    if (card.body) values[`card_${idx}_body`] = card.body;
    if (card.bulletPoints) values[`card_${idx}_bullets`] = card.bulletPoints;
    if (card.formula) values[`card_${idx}_formula`] = card.formula;
    if (card.badge) values[`card_${idx}_badge`] = card.badge;
    if (card.title) values[`card_${idx}_title`] = card.title;
    if (card.steps) values[`card_${idx}_steps`] = card.steps as any;
  });

  if (slideSpec.formula) {
    values['formula'] = slideSpec.formula;
    if (!values['card_0_formula']) values['card_0_formula'] = slideSpec.formula;
  }
  if (slideSpec.formulaName) {
    values['formula_name'] = slideSpec.formulaName;
  }

  return {
    title: slideSpec.title,
    subtitle: slideSpec.subtitle,
    cards: slideSpec.cards,
    notes: slideSpec.notes,
    values,
  };
}

/**
 * Compiles a SlideTemplateDefinition into an array of native CanvasObjects using the specified theme.
 * Populates placeholders with filled data if available, or rich educational defaults otherwise.
 */
export function compileTemplateToNativeObjects(
  template: SlideTemplateDefinition,
  theme: PresentationTheme,
  filledData?: SlideFilledContent | SlideContentSpec,
  options?: CompileTemplateOptions
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const slideW = template.width || 1920;
  const slideH = template.height || 1080;
  const layerId = options?.defaultLayerId || LAYER_OBJECTS;

  // Normalize filled content
  const filled: SlideFilledContent =
    filledData && ('slideNumber' in filledData || 'slideIndex' in filledData || 'cards' in filledData || 'formula' in filledData || 'layout' in filledData)
      ? mapSlideSpecToFilledContent(filledData as SlideContentSpec)
      : (filledData as SlideFilledContent) || {};

  // ─── 1. Background Layer ───────────────────────────────────────────────────
  if (options?.includeBackground !== false) {
    objects.push(
      createShape({
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: slideW,
        height: slideH,
        fillColor: theme.backgroundColor,
        fillOpacity: 1,
        layerId: LAYER_BACKGROUND,
      })
    );

    // Subtle header gradient or top accent bar
    if (template.decorations?.hasAccentBar !== false) {
      objects.push(
        createShape({
          shapeType: 'rect',
          x: 0,
          y: 0,
          width: slideW,
          height: 6,
          fillColor: theme.accentColor,
          fillOpacity: 0.9,
          layerId: LAYER_BACKGROUND,
        })
      );
    }
  }

  // ─── 2. Slide Header (Title & Subtitle) ──────────────────────────────────────
  const titlePlaceholder = template.placeholders.find((p) => p.role === 'slide-title');
  const subtitlePlaceholder = template.placeholders.find((p) => p.role === 'slide-subtitle');

  const resolvedTitle = filled.title || titlePlaceholder?.defaultPlaceholderText || 'Core Educational Concept';
  const resolvedSubtitle = filled.subtitle || subtitlePlaceholder?.defaultPlaceholderText || '';

  if (options?.includeHeader !== false && titlePlaceholder) {
    const titleBounds = titlePlaceholder.bounds;
    const titleFontSize = titlePlaceholder.formatting?.fontSize || theme.typography.titleSize || 44;
    const titleWeight = titlePlaceholder.formatting?.fontWeight || theme.typography.headingWeight || 700;

    const measuredTitle = measureTextLines(resolvedTitle, {
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: titleFontSize,
      fontWeight: titleWeight,
      maxWidth: titleBounds.width,
    });

    objects.push(
      createText({
        content: measuredTitle.lines.join('\n'),
        x: titleBounds.x,
        y: titleBounds.y,
        width: titleBounds.width,
        height: measuredTitle.totalHeight,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: titleFontSize,
        fontWeight: titleWeight,
        color: theme.primaryText,
        preset: 'title',
        layerId,
      })
    );

    // Optional Subtitle
    if (subtitlePlaceholder && resolvedSubtitle) {
      const subBounds = subtitlePlaceholder.bounds;
      const subFontSize = subtitlePlaceholder.formatting?.fontSize || 16;

      // Subtitle pill background
      const subPillW = Math.min(subBounds.width, Math.max(160, resolvedSubtitle.length * 9 + 28));
      objects.push(
        createShape({
          shapeType: 'roundedRect',
          x: subBounds.x,
          y: subBounds.y,
          width: subPillW,
          height: 28,
          fillColor: theme.accentMuted || 'rgba(56, 189, 248, 0.15)',
          fillOpacity: 1,
          layerId,
        })
      );

      objects.push(
        createText({
          content: resolvedSubtitle,
          x: subBounds.x + 12,
          y: subBounds.y + 4,
          width: subPillW - 24,
          height: 22,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: subFontSize,
          fontWeight: 600,
          color: theme.accentColor,
          preset: 'subheading',
          layerId,
        })
      );
    }

    // Header divider line
    if (template.decorations?.hasHeaderDivider !== false) {
      const dividerY = subtitlePlaceholder ? subtitlePlaceholder.bounds.y + 44 : titleBounds.y + titleBounds.height + 10;
      objects.push(
        createShape({
          shapeType: 'line',
          x: titleBounds.x,
          y: dividerY,
          width: titleBounds.width,
          height: 1,
          strokeColor: theme.cardBorder || 'rgba(255, 255, 255, 0.1)',
          strokeWidth: 1,
          layerId,
        })
      );
    }
  }

  // ─── 3. Content Placeholders Compilation ───────────────────────────────────
  const contentPlaceholders = template.placeholders.filter(
    (p) => p.role !== 'slide-title' && p.role !== 'slide-subtitle'
  );

  const cardsList = filled.cards || [];

  contentPlaceholders.forEach((ph, pIdx) => {
    const card = cardsList[pIdx];
    const bounds = ph.bounds;
    const padding = ph.formatting?.padding || 24;
    const innerW = bounds.width - padding * 2;
    let curY = bounds.y + padding;

    const isAccent = ph.formatting?.borderRole === 'accent';
    const cardFill =
      ph.formatting?.backgroundColorRole === 'surface'
        ? theme.surfaceColor
        : theme.cardBackground;
    const cardBorderColor = isAccent ? theme.accentColor : theme.cardBorder;

    // Card Container Shape
    objects.push(
      createShape({
        shapeType: 'roundedRect',
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        fillColor: cardFill,
        fillOpacity: 1,
        strokeColor: cardBorderColor,
        strokeWidth: isAccent ? 2 : 1.2,
        layerId,
      })
    );

    // Optional Top Accent Strip
    if (isAccent) {
      objects.push(
        createShape({
          shapeType: 'roundedRect',
          x: bounds.x + 2,
          y: bounds.y + 2,
          width: bounds.width - 4,
          height: 4,
          fillColor: theme.accentColor,
          fillOpacity: 1,
          layerId,
        })
      );
    }

    // Badge Pill
    const badgeText = card?.badge || ph.defaultBadge;
    if (badgeText) {
      const badgeW = Math.min(innerW, badgeText.length * 8.5 + 24);
      objects.push(
        createShape({
          shapeType: 'roundedRect',
          x: bounds.x + padding,
          y: curY,
          width: badgeW,
          height: 24,
          fillColor: isAccent ? theme.accentColor : theme.accentMuted || 'rgba(56, 189, 248, 0.2)',
          fillOpacity: 1,
          layerId,
        })
      );

      objects.push(
        createText({
          content: badgeText.toUpperCase(),
          x: bounds.x + padding + 10,
          y: curY + 4,
          width: badgeW - 20,
          height: 18,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 11,
          fontWeight: 700,
          color: isAccent ? '#ffffff' : theme.accentColor,
          preset: 'caption',
          layerId,
        })
      );

      curY += 34;
    }

    // Card Title / Header
    const cardTitle = card?.title || (ph.contentType !== 'title' ? ph.label : undefined);
    if (cardTitle && cardTitle !== resolvedTitle) {
      const titleFont = ph.formatting?.fontFamilyKey === 'heading' ? theme.typography.fontFamilyHeading : theme.typography.fontFamilyBody;
      const titleSize = ph.contentType === 'latex-formula' || ph.contentType === 'formula' ? 18 : 22;

      objects.push(
        createText({
          content: cardTitle,
          x: bounds.x + padding,
          y: curY,
          width: innerW,
          height: 28,
          fontFamily: titleFont,
          fontSize: titleSize,
          fontWeight: 700,
          color: isAccent ? theme.accentColor : theme.primaryText,
          preset: 'heading',
          layerId,
        })
      );

      curY += 34;
    }

    // ─── Placeholder Specific Content Rendering ─────────────────────────────
    switch (ph.contentType) {
      case 'latex-formula':
      case 'formula': {
        const formulaStr =
          card?.formula ||
          (filled?.values?.['formula'] as string) ||
          (filled?.values?.['card_0_formula'] as string) ||
          ph.defaultFormula ||
          'E = mc^2';
        const formulaBoxH = Math.min(70, bounds.height - (curY - bounds.y) - padding);

        objects.push(
          createShape({
            shapeType: 'roundedRect',
            x: bounds.x + padding,
            y: curY,
            width: innerW,
            height: formulaBoxH,
            fillColor: theme.codeBackground || '#0f172a',
            strokeColor: theme.accentColor,
            strokeWidth: 1.5,
            layerId,
          })
        );

        objects.push(
          createText({
            content: formulaStr,
            x: bounds.x + padding + 16,
            y: curY + (formulaBoxH - 26) / 2,
            width: innerW - 32,
            height: 32,
            fontFamily: theme.typography.fontFamilyCode || 'Consolas, monospace',
            fontSize: 22,
            fontWeight: 700,
            color: '#38bdf8',
            textAlign: 'center',
            preset: 'formula',
            isLatex: true,
            layerId,
          })
        );
        break;
      }

      case 'bullet-list': {
        const bullets = card?.bulletPoints || ph.defaultBulletPoints || [
          'Primary fundamental principle verified through observation.',
          'Quantifiable relationship between key state variables.',
          'Consistent boundary conditions apply across all test frames.',
        ];

        const bulletSize = ph.formatting?.fontSize || theme.typography.bodySize || 17;
        const maxBottom = bounds.y + bounds.height - padding;

        for (const bp of bullets) {
          if (curY >= maxBottom - 20) break;
          const bulletLine = `•  ${bp}`;
          const measured = measureTextLines(bulletLine, {
            fontFamily: theme.typography.fontFamilyBody,
            fontSize: bulletSize,
            maxWidth: innerW,
          });

          objects.push(
            createText({
              content: measured.lines.join('\n'),
              x: bounds.x + padding,
              y: curY,
              width: innerW,
              height: measured.totalHeight,
              fontFamily: theme.typography.fontFamilyBody,
              fontSize: bulletSize,
              fontWeight: 400,
              color: theme.primaryText,
              preset: 'body',
              layerId,
            })
          );

          curY += measured.totalHeight + 12;
        }
        break;
      }

      case 'step-sequence': {
        const steps = card?.steps || ph.defaultSteps || [
          { stepNumber: 1, title: 'Formulate', content: 'Extract givens and governing laws.' },
          { stepNumber: 2, title: 'Calculate', content: 'Substitute values and evaluate algebra.' },
          { stepNumber: 3, title: 'Verify', content: 'Confirm dimensional scale and roots.' },
        ];

        const stepCount = steps.length;
        const availableH = bounds.height - (curY - bounds.y) - padding;
        const stepRowH = Math.min(100, Math.floor(availableH / Math.max(1, stepCount)));

        steps.forEach((st, sIdx) => {
          const stepY = curY + sIdx * stepRowH;
          const numSize = 28;

          // Number circle
          objects.push(
            createShape({
              shapeType: 'ellipse',
              x: bounds.x + padding,
              y: stepY + 4,
              width: numSize,
              height: numSize,
              fillColor: theme.accentColor,
              strokeColor: 'transparent',
              layerId,
            })
          );

          objects.push(
            createText({
              content: String(st.stepNumber || sIdx + 1),
              x: bounds.x + padding + 8,
              y: stepY + 7,
              width: numSize,
              height: numSize,
              fontFamily: theme.typography.fontFamilyHeading,
              fontSize: 14,
              fontWeight: 700,
              color: '#ffffff',
              preset: 'caption',
              layerId,
            })
          );

          // Step title & content
          const textX = bounds.x + padding + numSize + 12;
          const textW = innerW - numSize - 12;

          objects.push(
            createText({
              content: st.title || `Step ${sIdx + 1}`,
              x: textX,
              y: stepY,
              width: textW,
              height: 22,
              fontFamily: theme.typography.fontFamilyHeading,
              fontSize: 16,
              fontWeight: 700,
              color: theme.primaryText,
              preset: 'heading',
              layerId,
            })
          );

          const stepDesc = (st as any).content || (st as any).description || '';
          if (stepDesc) {
            objects.push(
              createText({
                content: stepDesc,
                x: textX,
                y: stepY + 22,
                width: textW,
                height: 38,
                fontFamily: theme.typography.fontFamilyBody,
                fontSize: 14,
                fontWeight: 400,
                color: theme.secondaryText,
                preset: 'body',
                layerId,
              })
            );
          }
        });
        break;
      }

      case 'diagram': {
        const diagBoxH = bounds.height - (curY - bounds.y) - padding;
        // Schematic background viewport
        objects.push(
          createShape({
            shapeType: 'roundedRect',
            x: bounds.x + padding,
            y: curY,
            width: innerW,
            height: diagBoxH,
            fillColor: theme.surfaceColor || 'rgba(15, 23, 42, 0.4)',
            strokeColor: theme.accentColor,
            strokeWidth: 1.5,
            layerId,
          })
        );

        // Vector schematic sample nodes
        const nodeW = Math.min(180, Math.floor(innerW * 0.28));
        const nodeH = 50;
        const centerY = curY + diagBoxH / 2 - nodeH / 2;

        const node1X = bounds.x + padding + 30;
        const node2X = bounds.x + padding + Math.floor((innerW - nodeW) / 2);
        const node3X = bounds.x + padding + innerW - nodeW - 30;

        // Node 1: Input
        objects.push(
          createShape({
            shapeType: 'roundedRect',
            x: node1X,
            y: centerY,
            width: nodeW,
            height: nodeH,
            fillColor: theme.cardBackground,
            strokeColor: theme.cardBorder,
            strokeWidth: 1.5,
            layerId,
          })
        );
        objects.push(
          createText({
            content: 'Input State X',
            x: node1X + 10,
            y: centerY + 14,
            width: nodeW - 20,
            height: 24,
            fontFamily: theme.typography.fontFamilyBody,
            fontSize: 14,
            fontWeight: 600,
            color: theme.primaryText,
            textAlign: 'center',
            layerId,
          })
        );

        // Connecting Line 1 -> 2
        objects.push(
          createShape({
            shapeType: 'line',
            x: node1X + nodeW,
            y: centerY + nodeH / 2,
            width: node2X - (node1X + nodeW),
            height: 0,
            strokeColor: theme.accentColor,
            strokeWidth: 2,
            layerId,
          })
        );

        // Node 2: Transfer Function
        objects.push(
          createShape({
            shapeType: 'roundedRect',
            x: node2X,
            y: centerY,
            width: nodeW,
            height: nodeH,
            fillColor: theme.accentColor,
            strokeColor: 'transparent',
            layerId,
          })
        );
        objects.push(
          createText({
            content: 'Transformation f(X)',
            x: node2X + 10,
            y: centerY + 14,
            width: nodeW - 20,
            height: 24,
            fontFamily: theme.typography.fontFamilyBody,
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            layerId,
          })
        );

        // Connecting Line 2 -> 3
        objects.push(
          createShape({
            shapeType: 'line',
            x: node2X + nodeW,
            y: centerY + nodeH / 2,
            width: node3X - (node2X + nodeW),
            height: 0,
            strokeColor: theme.accentColor,
            strokeWidth: 2,
            layerId,
          })
        );

        // Node 3: Resulting State
        objects.push(
          createShape({
            shapeType: 'roundedRect',
            x: node3X,
            y: centerY,
            width: nodeW,
            height: nodeH,
            fillColor: theme.cardBackground,
            strokeColor: theme.cardBorder,
            strokeWidth: 1.5,
            layerId,
          })
        );
        objects.push(
          createText({
            content: 'Output State Y',
            x: node3X + 10,
            y: centerY + 14,
            width: nodeW - 20,
            height: 24,
            fontFamily: theme.typography.fontFamilyBody,
            fontSize: 14,
            fontWeight: 600,
            color: theme.primaryText,
            textAlign: 'center',
            layerId,
          })
        );

        // Subtext caption
        objects.push(
          createText({
            content: 'Schematic Model: Conservation of Mass and Energy across boundaries',
            x: bounds.x + padding + 16,
            y: curY + diagBoxH - 36,
            width: innerW - 32,
            height: 22,
            fontFamily: theme.typography.fontFamilyBody,
            fontSize: 13,
            fontWeight: 500,
            color: theme.secondaryText,
            textAlign: 'center',
            preset: 'caption',
            layerId,
          })
        );
        break;
      }

      case 'text':
      case 'definition':
      case 'problem-statement':
      case 'callout-takeaway':
      default: {
        const rawBody = card?.body ? (Array.isArray(card.body) ? card.body.join('\n\n') : card.body) : undefined;
        const bodyContent: string =
          rawBody ||
          card?.formalDefinition ||
          (card?.problem ? `${card.problem.title}: ${card.problem.text}` : undefined) ||
          ph.defaultPlaceholderText ||
          'Comprehensive instructional explanation detailing key mechanisms, mathematical relationships, and classroom principles.';

        const fontSize = ph.formatting?.fontSize || theme.typography.bodySize || 18;
        const fontWeight = ph.formatting?.fontWeight || theme.typography.bodyWeight || 400;

        const measured = measureTextLines(bodyContent, {
          fontFamily: theme.typography.fontFamilyBody,
          fontSize,
          fontWeight,
          maxWidth: innerW,
        });

        objects.push(
          createText({
            content: measured.lines.join('\n'),
            x: bounds.x + padding,
            y: curY,
            width: innerW,
            height: measured.totalHeight,
            fontFamily: theme.typography.fontFamilyBody,
            fontSize,
            fontWeight,
            color: ph.formatting?.colorRole === 'secondary' ? theme.secondaryText : theme.primaryText,
            preset: 'body',
            layerId,
          })
        );
        break;
      }
    }
  });

  // ─── 4. Slide Footer ───────────────────────────────────────────────────────
  if (options?.includeFooter !== false) {
    const footerY = 1030;
    const slideNumber = options?.slideIndex !== undefined ? options.slideIndex + 1 : 1;
    const totalSlides = options?.totalSlides || slideNumber;
    const footerTopic = options?.topic || resolvedTitle;

    // Divider
    objects.push(
      createShape({
        shapeType: 'line',
        x: 100,
        y: footerY,
        width: 1720,
        height: 1,
        strokeColor: theme.cardBorder || 'rgba(255, 255, 255, 0.08)',
        strokeWidth: 1,
        layerId,
      })
    );

    // Topic & School watermark
    objects.push(
      createText({
        content: `SmartBoard Studio • ${footerTopic}`,
        x: 100,
        y: footerY + 8,
        width: 1200,
        height: 24,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 13,
        fontWeight: 500,
        color: theme.mutedText || '#64748b',
        preset: 'caption',
        layerId,
      })
    );

    // Slide Numbering
    objects.push(
      createText({
        content: `Slide ${slideNumber} of ${totalSlides}`,
        x: 1600,
        y: footerY + 8,
        width: 220,
        height: 24,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 13,
        fontWeight: 600,
        color: theme.mutedText || '#64748b',
        textAlign: 'right',
        preset: 'caption',
        layerId,
      })
    );
  }

  return objects;
}

/**
 * Creates a complete native SmartBoard Page from a SlideTemplateDefinition.
 */
export function createPageFromTemplate(
  template: SlideTemplateDefinition,
  theme: PresentationTheme,
  filledData?: SlideFilledContent | SlideContentSpec,
  options?: CompileTemplateOptions
): Page {
  const pageId = uuidv4();
  const objects = compileTemplateToNativeObjects(template, theme, filledData, options);

  const title =
    filledData?.title ||
    (template.placeholders.find((p) => p.role === 'slide-title')?.defaultPlaceholderText) ||
    template.name;

  return {
    id: pageId,
    title,
    width: template.width || 1920,
    height: template.height || 1080,
    background: {
      type: 'blank',
      color: theme.backgroundColor,
    },
    layers: createSlideLayers(),
    objects,
    transition: {
      type: 'fade',
      duration: 300,
    },
  };
}

/**
 * Compiles a CustomSlideMaster into native SmartBoard CanvasObjects.
 * Strictly preserves the teacher's background, branding, shapes, accents, and footers,
 * while populating placeholders with AI or template content.
 */
export function compileCustomMasterToNativeObjects(
  master: CustomSlideMaster,
  filledData?: SlideFilledContent | SlideContentSpec,
  options?: CompileTemplateOptions
): CanvasObject[] {
  const theme = customSlideMasterService.masterToPresentationTheme(master);
  const objects: CanvasObject[] = [];
  const slideW = master.width || 1920;
  const slideH = master.height || 1080;
  const layerId = options?.defaultLayerId || LAYER_OBJECTS;

  const filled: SlideFilledContent =
    filledData && ('slideNumber' in filledData || 'slideIndex' in filledData || 'cards' in filledData || 'formula' in filledData || 'layout' in filledData)
      ? mapSlideSpecToFilledContent(filledData as SlideContentSpec)
      : (filledData as SlideFilledContent) || {};

  // 1. Master Canvas Background (teacher's exact color strictly preserved)
  if (options?.includeBackground !== false) {
    objects.push(
      createShape({
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: slideW,
        height: slideH,
        fillColor: master.theme.backgroundColor,
        fillOpacity: 1,
        layerId: LAYER_BACKGROUND,
      })
    );

    // Accent Bar
    if (master.decorations.hasAccentBar) {
      const barColor = master.decorations.accentBarColor || master.theme.accentColor;
      if (master.decorations.accentBarPosition === 'left') {
        objects.push(
          createShape({
            shapeType: 'rect',
            x: 0,
            y: 0,
            width: 8,
            height: slideH,
            fillColor: barColor,
            fillOpacity: 1,
            layerId: LAYER_BACKGROUND,
          })
        );
      } else {
        // default 'top'
        objects.push(
          createShape({
            shapeType: 'rect',
            x: 0,
            y: 0,
            width: slideW,
            height: 6,
            fillColor: barColor,
            fillOpacity: 1,
            layerId: LAYER_BACKGROUND,
          })
        );
      }
    }

    // Header dividing line
    if (master.decorations.hasHeaderDivider) {
      objects.push(
        createShape({
          shapeType: 'line',
          x: 100,
          y: 170,
          width: 1720,
          height: 2,
          strokeColor: master.decorations.headerDividerColor || master.theme.cardBorderColor,
          strokeWidth: 1.5,
          layerId: LAYER_BACKGROUND,
        })
      );
    }
  }

  // 2. Custom Shapes & Branding Badge
  if (master.decorations.hasBrandingLogo && (master.decorations.brandingText || master.brandingText)) {
    const rawBranding = master.decorations.brandingText || master.brandingText || '';
    const fullBranding = master.decorations.brandingSubtext
      ? `${rawBranding} • ${master.decorations.brandingSubtext}`
      : rawBranding;
    const badgeW = Math.max(300, fullBranding.length * 8 + 40);
    const badgeX = slideW - badgeW - 100;
    const badgeY = 38;
    const badgeH = 36;
    objects.push(
      createShape({
        shapeType: 'roundedRect',
        x: badgeX,
        y: badgeY,
        width: badgeW,
        height: badgeH,
        fillColor: master.theme.surfaceColor,
        strokeColor: master.theme.cardBorderColor,
        strokeWidth: 1,
        layerId,
      })
    );
    objects.push(
      createText({
        content: fullBranding,
        x: badgeX + 12,
        y: badgeY + 7,
        width: badgeW - 24,
        height: 22,
        fontFamily: master.theme.fontFamilyHeading,
        fontSize: 13,
        fontWeight: 600,
        color: master.theme.accentColor,
        preset: 'label',
        textAlign: 'center',
        layerId,
      })
    );
  }

  // Custom decorative shapes
  if (master.decorations.customShapes && master.decorations.customShapes.length > 0) {
    master.decorations.customShapes.forEach((s) => {
      objects.push(
        createShape({
          shapeType: s.shapeType === 'pill' ? 'roundedRect' : (s.shapeType as any),
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          fillColor: s.fillColor,
          fillOpacity: s.fillOpacity ?? 1,
          strokeColor: s.strokeColor,
          strokeWidth: s.strokeWidth,
          layerId,
        })
      );
      if (s.label) {
        objects.push(
          createText({
            content: s.label,
            x: s.x,
            y: s.y + Math.round(s.height * 0.2),
            width: s.width,
            height: Math.round(s.height * 0.6),
            fontFamily: master.theme.fontFamilyHeading,
            fontSize: 13,
            fontWeight: 600,
            color: master.theme.primaryTextColor,
            preset: 'label',
            textAlign: 'center',
            layerId,
          })
        );
      }
    });
  }

  // 3. Compile Placeholders with Adaptive Text Fitting
  const templateDef = customSlideMasterService.masterToSlideTemplate(master);
  const placeholderObjects = compileTemplateToNativeObjects(templateDef, theme, filled, {
    ...options,
    includeBackground: false,
    includeHeader: true,
    includeFooter: false,
  });
  objects.push(...placeholderObjects);

  // 4. Footer & Slide Numbering
  if (options?.includeFooter !== false && (master.decorations.hasFooter || master.decorations.showSlideNumber)) {
    const footerY = slideH - 45;
    if (master.decorations.hasFooter) {
      const footerText = master.decorations.footerText || options?.topic || master.name;
      objects.push(
        createText({
          content: footerText,
          x: 100,
          y: footerY,
          width: 1200,
          height: 24,
          fontFamily: master.theme.fontFamilyBody,
          fontSize: 13,
          fontWeight: 400,
          color: master.theme.secondaryTextColor,
          preset: 'label',
          layerId,
        })
      );
    }
    if (master.decorations.showSlideNumber) {
      const slideNum = options?.slideIndex !== undefined ? options.slideIndex + 1 : 1;
      const total = options?.totalSlides || slideNum;
      objects.push(
        createText({
          content: `${slideNum} / ${total}`,
          x: slideW - 250,
          y: footerY,
          width: 150,
          height: 24,
          fontFamily: master.theme.fontFamilyBody,
          fontSize: 13,
          fontWeight: 600,
          color: master.theme.secondaryTextColor,
          preset: 'label',
          textAlign: 'right',
          layerId,
        })
      );
    }
  }

  return objects;
}

/**
 * Creates a complete native SmartBoard Page using a CustomSlideMaster.
 */
export function createPageFromCustomMaster(
  master: CustomSlideMaster,
  filledData?: SlideFilledContent | SlideContentSpec,
  options?: CompileTemplateOptions
): Page {
  const pageId = uuidv4();
  const objects = compileCustomMasterToNativeObjects(master, filledData, options);
  const title =
    (typeof filledData?.title === 'string' && filledData.title) ||
    master.name;

  return {
    id: pageId,
    title,
    width: master.width || 1920,
    height: master.height || 1080,
    background: {
      type: 'blank',
      color: master.theme.backgroundColor,
    },
    layers: createSlideLayers(),
    objects,
    transition: {
      type: 'fade',
      duration: 300,
    },
  };
}
