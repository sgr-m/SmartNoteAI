/**
 * hybridComponentBridge.ts — Declarative Presentation Component Compiler
 * Stage 3: AI Teaching Presentation Generator (TASK-103)
 *
 * Compiles structured, declarative slide card specifications (HtmlCardSpec) into
 * native, independently editable SmartBoard CanvasObject[] (ShapeObject, TextObject, ImageObject).
 *
 * Security Guarantee:
 * - Purely declarative data compilation.
 * - Zero dynamic execution: NO eval(), NO new Function(), NO <script> execution, NO unvalidated innerHTML.
 * - SVGs are strictly sanitized to strip scripts, objects, foreignObjects, and inline event handlers.
 *
 * Visual Standard:
 * - Professional Gamma-grade educational card styling.
 * - Exact box-model positioning using slideLayoutEngine.ts metrics.
 * - Projector-ready color palettes & WCAG 2.1 contrast via presentationThemes.ts.
 * - High-fidelity LaTeX math rendering preserved for formulas.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BoundingBox,
  CardComponentType,
  HtmlCardSpec,
  SlideContentSpec,
  CompileCardOptions,
  CompileSlideOptions,
  PresentationTheme,
  CardStepItem,
  TimelineEventItem,
  FeatureItemSpec,
  DEFAULT_SLIDE_WIDTH,
  DEFAULT_SLIDE_HEIGHT,
} from '../../../shared/aiPresentationTypes';
import {
  CanvasObject,
  ShapeObject,
  TextObject,
  ImageObject,
  GroupObject,
  ShapeType,
} from '../../../shared/types';
import {
  calculateSlideRegions,
  calculateColumnBounds,
  calculateCardBounds,
  measureTextLines,
} from './slideLayoutEngine';
import {
  compileActivityToNativeObjects,
  createInitialActivityState,
  generateCurriculumActivity,
} from './interactiveActivityBridge';
import { matchTemplateByLayout } from './slideTemplateCatalog';
import { compileTemplateToNativeObjects } from './templateCompiler';

// ─── Default Layer Constants ──────────────────────────────────────────────────

const LAYER_OBJECTS = 'objects';
const LAYER_BACKGROUND = 'background';

// ─── Typography Weight Coercion Helper ────────────────────────────────────────

function coerceNumericWeight(w: number | string | undefined, defaultWeight = 400): number {
  if (typeof w === 'number') return w;
  if (typeof w === 'string') {
    const parsed = parseInt(w, 10);
    if (!isNaN(parsed)) return parsed;
    if (w.toLowerCase() === 'bold') return 700;
    if (w.toLowerCase() === 'semibold') return 600;
  }
  return defaultWeight;
}

// ─── Security & Sanitization ──────────────────────────────────────────────────

/**
 * Strips HTML tags and control characters from arbitrary string input.
 * Ensures AI-generated text cannot inject markup.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

/**
 * Strict SVG sanitizer: strips executable elements, foreignObjects, iframes,
 * inline event handlers (on*), and javascript: URIs.
 */
export function sanitizeSvg(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') return '';
  let sanitized = svgString.trim();

  // Must begin with or contain <svg and end with </svg>
  if (!/<svg[\s\S]*?<\/svg>/i.test(sanitized)) {
    return '';
  }

  // 1. Remove script tags and contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove foreignObject tags and contents (prevents embedding arbitrary HTML)
  sanitized = sanitized.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');

  // 3. Remove dangerous embed/object/iframe/applet tags
  sanitized = sanitized.replace(/<(iframe|object|embed|applet|meta|link)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  sanitized = sanitized.replace(/<(iframe|object|embed|applet|meta|link)\b[^>]*\/?>/gi, '');

  // 4. Strip inline event handlers (e.g. onload=, onclick=, onerror=, onmouseover=)
  sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  // 5. Strip javascript: pseudo-protocols from href, xlink:href, src
  sanitized = sanitized.replace(/(href|xlink:href|src)\s*=\s*(['"])\s*javascript:.*?\2/gi, '$1=""');

  return sanitized;
}

/**
 * Converts a sanitized SVG string into a native SmartBoard ImageObject via Data URL.
 */
export function renderSvgDiagramToCanvasObject(
  svgString: string,
  bounds: BoundingBox,
  id?: string
): ImageObject | null {
  const cleanSvg = sanitizeSvg(svgString);
  if (!cleanSvg) return null;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;

  return {
    id: id || uuidv4(),
    type: 'image',
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.max(10, Math.round(bounds.width)),
    height: Math.max(10, Math.round(bounds.height)),
    rotation: 0,
    filePath: '',
    dataUrl,
    opacity: 1,
    locked: false,
    visible: true,
    layerId: LAYER_OBJECTS,
  };
}

/**
 * Validates and normalizes raw card specs, enforcing safe types and defaults.
 */
export function validateCardSpec(spec: unknown): HtmlCardSpec {
  if (!spec || typeof spec !== 'object') {
    return {
      id: uuidv4(),
      cardType: 'basic-info',
      title: 'Information Card',
      body: [],
    };
  }

  const s = spec as Record<string, any>;
  const validTypes: CardComponentType[] = [
    'basic-info',
    'key-takeaway',
    'definition',
    'problem-solution',
    'metric-highlight',
    'quote',
    'comparison',
    'multi-column-feature',
    'numbered-steps',
    'timeline',
    'warning-note',
    'question-answer',
    'interactive-activity',
    'summary',
  ];

  const rawType = typeof s.cardType === 'string' ? s.cardType : (typeof s.type === 'string' ? s.type : 'basic-info');
  const cardType: CardComponentType = validTypes.includes(rawType as CardComponentType)
    ? (rawType as CardComponentType)
    : 'basic-info';

  const normalized: HtmlCardSpec = {
    id: typeof s.id === 'string' && s.id.trim() ? s.id.trim() : uuidv4(),
    cardType,
    title: typeof s.title === 'string' ? sanitizeText(s.title) : undefined,
    subtitle: typeof s.subtitle === 'string' ? sanitizeText(s.subtitle) : undefined,
    badge: typeof s.badge === 'string' ? sanitizeText(s.badge).toUpperCase() : undefined,
    icon: typeof s.icon === 'string' ? sanitizeText(s.icon) : undefined,
    accentColor: typeof s.accentColor === 'string' ? s.accentColor.trim() : undefined,
    formula: typeof s.formula === 'string' ? s.formula.trim() : undefined,
  };

  // Body / Bullet points
  if (Array.isArray(s.body)) {
    normalized.body = s.body.map((item) => sanitizeText(item)).filter(Boolean);
  } else if (typeof s.body === 'string') {
    normalized.body = sanitizeText(s.body);
  }

  if (Array.isArray(s.bulletPoints)) {
    normalized.bulletPoints = s.bulletPoints.map((item) => sanitizeText(item)).filter(Boolean);
  }

  // Definition fields
  if (s.term || s.formalDefinition || s.definition) {
    const def = s.definition || {};
    normalized.term = sanitizeText(s.term || def.term);
    normalized.pronunciation = sanitizeText(s.pronunciation || def.pronunciation);
    normalized.partOfSpeech = sanitizeText(s.partOfSpeech || def.partOfSpeech);
    normalized.formalDefinition = sanitizeText(s.formalDefinition || def.formalDefinition);
    normalized.example = sanitizeText(s.example || def.example);
  }

  // Metric fields
  if (s.metricValue || s.metricLabel || s.metric) {
    const m = s.metric || {};
    normalized.metricValue = sanitizeText(s.metricValue || m.value);
    normalized.metricLabel = sanitizeText(s.metricLabel || m.label);
    normalized.metricSubtext = sanitizeText(s.metricSubtext || m.subtext);
  }

  // Quote fields
  if (s.quoteText || s.quoteAuthor || s.quote) {
    const q = s.quote || {};
    normalized.quoteText = sanitizeText(s.quoteText || q.text);
    normalized.quoteAuthor = sanitizeText(s.quoteAuthor || q.author);
    normalized.quoteSource = sanitizeText(s.quoteSource || q.source);
  }

  // Comparison fields
  if (s.leftColumn || s.rightColumn || s.comparison) {
    const comp = s.comparison || {};
    const left = s.leftColumn || comp.leftColumn;
    const right = s.rightColumn || comp.rightColumn;
    if (left) {
      normalized.leftColumn = {
        title: sanitizeText(left.title || 'Column A'),
        badge: typeof left.badge === 'string' ? sanitizeText(left.badge) : undefined,
        items: Array.isArray(left.items) ? left.items.map((i: any) => sanitizeText(i)).filter(Boolean) : [],
        accentColor: left.accentColor,
      };
    }
    if (right) {
      normalized.rightColumn = {
        title: sanitizeText(right.title || 'Column B'),
        badge: typeof right.badge === 'string' ? sanitizeText(right.badge) : undefined,
        items: Array.isArray(right.items) ? right.items.map((i: any) => sanitizeText(i)).filter(Boolean) : [],
        accentColor: right.accentColor,
      };
    }
  }

  // Problem-Solution fields
  if (s.problem || s.solution || s.problemSolution) {
    const ps = s.problemSolution || {};
    const p = s.problem || ps;
    const sol = s.solution || ps;
    normalized.problem = {
      title: sanitizeText(p.title || ps.problemTitle || 'Challenge'),
      text: sanitizeText(p.text || ps.problemText || ''),
      formula: p.formula || ps.problemFormula,
    };
    normalized.solution = {
      title: sanitizeText(sol.title || ps.solutionTitle || 'Solution'),
      text: sanitizeText(sol.text || ps.solutionText || ''),
      formula: sol.formula || ps.solutionFormula,
    };
  }

  // Steps
  if (Array.isArray(s.steps)) {
    normalized.steps = s.steps.map((step: any, idx: number) => ({
      stepNumber: step.stepNumber !== undefined ? step.stepNumber : idx + 1,
      title: sanitizeText(step.title || `Step ${idx + 1}`),
      description: sanitizeText(step.description || ''),
      badge: typeof step.badge === 'string' ? sanitizeText(step.badge) : undefined,
    }));
  }

  // Timeline events
  if (Array.isArray(s.timelineEvents)) {
    normalized.timelineEvents = s.timelineEvents.map((ev: any) => ({
      dateOrEra: sanitizeText(ev.dateOrEra || ev.date || ev.year || 'Milestone'),
      title: sanitizeText(ev.title || ''),
      description: sanitizeText(ev.description || ''),
      badge: typeof ev.badge === 'string' ? sanitizeText(ev.badge) : undefined,
    }));
  }

  // Multi-column features
  if (Array.isArray(s.features)) {
    normalized.features = s.features.map((feat: any) => ({
      title: sanitizeText(feat.title || 'Feature'),
      description: sanitizeText(feat.description || ''),
      icon: typeof feat.icon === 'string' ? sanitizeText(feat.icon) : undefined,
      badge: typeof feat.badge === 'string' ? sanitizeText(feat.badge) : undefined,
    }));
  }

  // Question & Answer
  if (s.question || s.answer || s.qa) {
    const qa = s.qa || {};
    normalized.question = sanitizeText(s.question || qa.question);
    normalized.answer = sanitizeText(s.answer || qa.answer);
    normalized.explanation = sanitizeText(s.explanation || qa.explanation);
  }

  // Takeaways / Summary
  if (Array.isArray(s.takeaways)) {
    normalized.takeaways = s.takeaways.map((t: any) => sanitizeText(t)).filter(Boolean);
  }
  if (typeof s.recapNote === 'string') {
    normalized.recapNote = sanitizeText(s.recapNote);
  }

  // Visual card overrides
  if (typeof s.backgroundColor === 'string') normalized.backgroundColor = s.backgroundColor.trim();
  if (typeof s.borderColor === 'string') normalized.borderColor = s.borderColor.trim();
  if (typeof s.borderWidth === 'number') normalized.borderWidth = Math.max(0, s.borderWidth);
  if (typeof s.borderRadius === 'number') normalized.borderRadius = Math.max(0, s.borderRadius);
  if (typeof s.padding === 'number') normalized.padding = Math.max(4, s.padding);

  // Activity payload
  if (s.activity) {
    normalized.activity = s.activity;
  }

  return normalized;
}

// ─── Native Object Constructors ───────────────────────────────────────────────

/**
 * Creates a valid SmartBoard ShapeObject with safe defaults.
 */
export function createNativeShape(
  props: Partial<ShapeObject> & {
    shapeType: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
  }
): ShapeObject {
  return {
    id: props.id || uuidv4(),
    type: 'shape',
    shapeType: props.shapeType,
    x: Math.round(props.x),
    y: Math.round(props.y),
    width: Math.max(1, Math.round(props.width)),
    height: Math.max(1, Math.round(props.height)),
    rotation: props.rotation || 0,
    fillColor: props.fillColor || 'transparent',
    fillOpacity: props.fillOpacity !== undefined ? props.fillOpacity : 1,
    strokeColor: props.strokeColor || 'transparent',
    strokeWidth: props.strokeWidth !== undefined ? props.strokeWidth : 1,
    strokeOpacity: props.strokeOpacity !== undefined ? props.strokeOpacity : 1,
    strokeStyle: props.strokeStyle || 'solid',
    locked: props.locked || false,
    visible: props.visible !== undefined ? props.visible : true,
    layerId: props.layerId || LAYER_OBJECTS,
    label: props.label,
    params: props.params,
  };
}

/**
 * Creates a valid SmartBoard TextObject with safe defaults.
 */
export function createNativeText(
  props: Partial<TextObject> & {
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
): TextObject {
  return {
    id: props.id || uuidv4(),
    type: 'text',
    x: Math.round(props.x),
    y: Math.round(props.y),
    width: Math.max(10, Math.round(props.width)),
    height: Math.max(10, Math.round(props.height)),
    content: props.content,
    fontFamily: props.fontFamily || 'Inter, sans-serif',
    fontSize: Math.max(8, Math.round(props.fontSize || 16)),
    fontWeight: props.fontWeight || 400,
    fontStyle: props.fontStyle || 'normal',
    textDecoration: props.textDecoration || 'none',
    textAlign: props.textAlign || 'left',
    color: props.color || '#ffffff',
    backgroundColor: props.backgroundColor || 'transparent',
    opacity: props.opacity !== undefined ? props.opacity : 1,
    rotation: props.rotation || 0,
    preset: props.preset || 'body',
    locked: props.locked || false,
    visible: props.visible !== undefined ? props.visible : true,
    layerId: props.layerId || LAYER_OBJECTS,
    isLatex: props.isLatex || false,
  };
}

// ─── Common Card Shell & Badge Utilities ──────────────────────────────────────

/**
 * Constructs the base rounded rectangle card container.
 */
function createCardContainer(
  bounds: BoundingBox,
  theme: PresentationTheme,
  spec?: HtmlCardSpec,
  layerId = LAYER_OBJECTS
): ShapeObject {
  const bg = spec?.backgroundColor || theme.cardBackground;
  const border = spec?.borderColor || (spec?.accentColor ? spec.accentColor : theme.cardBorder);
  const bw = spec?.borderWidth !== undefined ? spec.borderWidth : 1.5;

  return createNativeShape({
    shapeType: 'roundedRect',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    fillColor: bg,
    fillOpacity: 0.95,
    strokeColor: border,
    strokeWidth: bw,
    strokeOpacity: 0.85,
    layerId,
  });
}

/**
 * Constructs an educational badge pill (container + text).
 */
function createBadgeElement(
  badgeText: string,
  x: number,
  y: number,
  theme: PresentationTheme,
  accentColor?: string,
  layerId = LAYER_OBJECTS
): CanvasObject[] {
  const accent = accentColor || theme.accentColor;
  const label = badgeText.toUpperCase().trim();
  const fontSize = 11;
  const approxWidth = Math.max(48, label.length * 7.5 + 16);
  const badgeHeight = 22;

  const bgPill = createNativeShape({
    shapeType: 'roundedRect',
    x,
    y,
    width: approxWidth,
    height: badgeHeight,
    fillColor: accent,
    fillOpacity: 0.15,
    strokeColor: accent,
    strokeWidth: 1,
    strokeOpacity: 0.6,
    layerId,
  });

  const textObj = createNativeText({
    content: label,
    x: x + 8,
    y: y + 4,
    width: approxWidth - 16,
    height: badgeHeight - 8,
    fontFamily: theme.typography.fontFamilyHeading,
    fontSize,
    fontWeight: 700,
    color: accent,
    textAlign: 'center',
    preset: 'label',
    layerId,
  });

  return [bgPill, textObj];
}

/**
 * Constructs a vertical accent stripe along the left edge of a card.
 */
function createLeftAccentStripe(
  bounds: BoundingBox,
  accentColor: string,
  stripeWidth = 6,
  layerId = LAYER_OBJECTS
): ShapeObject {
  return createNativeShape({
    shapeType: 'roundedRect',
    x: bounds.x + 2,
    y: bounds.y + 6,
    width: stripeWidth,
    height: Math.max(10, bounds.height - 12),
    fillColor: accentColor,
    fillOpacity: 1,
    strokeColor: 'transparent',
    strokeWidth: 0,
    layerId,
  });
}

/**
 * Constructs a thin horizontal separator line.
 */
function createHorizontalDivider(
  x: number,
  y: number,
  width: number,
  theme: PresentationTheme,
  layerId = LAYER_OBJECTS
): ShapeObject {
  return createNativeShape({
    shapeType: 'line',
    x,
    y,
    width,
    height: 0,
    strokeColor: theme.cardBorder,
    strokeWidth: 1,
    strokeOpacity: 0.5,
    layerId,
  });
}

// ─── Specialized Component Card Compilers ─────────────────────────────────────

/**
 * 1. Basic Information Card:
 * Standard educational card with optional badge, title, subtitle, divider, paragraphs or bullets, and LaTeX formula.
 */
function compileBasicInfoCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerW = Math.max(40, bounds.width - padding * 2);
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;
  const bodySize = theme.typography.bodySize || 16;
  const headingWeight = coerceNumericWeight(theme.typography.headingWeight, 700);
  const bodyWeight = coerceNumericWeight(theme.typography.bodyWeight, 400);

  // 1. Card Container
  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // 2. Badge
  if (spec.badge) {
    const badgeObjs = createBadgeElement(spec.badge, bounds.x + padding, curY, theme, spec.accentColor, layerId);
    objects.push(...badgeObjs);
    curY += 28;
  }

  // 3. Title
  if (spec.title) {
    const titleLines = measureTextLines(spec.title, {
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: headingSize,
      fontWeight: headingWeight,
      maxWidth: innerW,
    });
    const titleH = titleLines.totalHeight;
    objects.push(
      createNativeText({
        content: titleLines.lines.join('\n'),
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: titleH,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: headingSize,
        fontWeight: headingWeight,
        color: theme.primaryText,
        preset: 'heading',
        layerId,
      })
    );
    curY += titleH + 8;
  }

  // 4. Subtitle
  if (spec.subtitle) {
    const subLines = measureTextLines(spec.subtitle, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 14,
      maxWidth: innerW,
    });
    objects.push(
      createNativeText({
        content: subLines.lines.join('\n'),
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: subLines.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        fontWeight: 400,
        color: theme.secondaryText,
        preset: 'subheading',
        layerId,
      })
    );
    curY += subLines.totalHeight + 10;
  }

  // 5. Divider
  if (spec.title || spec.subtitle) {
    objects.push(createHorizontalDivider(bounds.x + padding, curY, innerW, theme, layerId));
    curY += 12;
  }

  // 6. Body & Bullet Points
  const bulletItems = spec.bulletPoints || (Array.isArray(spec.body) ? spec.body : []);
  if (bulletItems.length > 0) {
    for (const item of bulletItems) {
      const itemText = `•  ${item}`;
      const measured = measureTextLines(itemText, {
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: bodySize,
        maxWidth: innerW,
      });
      objects.push(
        createNativeText({
          content: measured.lines.join('\n'),
          x: bounds.x + padding,
          y: curY,
          width: innerW,
          height: measured.totalHeight,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: bodySize,
          fontWeight: bodyWeight,
          color: theme.primaryText,
          preset: 'body',
          layerId,
        })
      );
      curY += measured.totalHeight + 6;
      if (curY > bounds.y + bounds.height - padding - 20) break;
    }
  } else if (typeof spec.body === 'string' && spec.body.trim()) {
    const measured = measureTextLines(spec.body, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: bodySize,
      maxWidth: innerW,
    });
    objects.push(
      createNativeText({
        content: measured.lines.join('\n'),
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: measured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: bodySize,
        fontWeight: bodyWeight,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );
    curY += measured.totalHeight + 10;
  }

  // 7. Formula (LaTeX)
  if (spec.formula) {
    curY += 6;
    const formulaH = 44;
    objects.push(
      createNativeShape({
        shapeType: 'roundedRect',
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: formulaH,
        fillColor: theme.accentColor,
        fillOpacity: 0.08,
        strokeColor: theme.accentColor,
        strokeWidth: 1,
        strokeOpacity: 0.35,
        layerId,
      })
    );
    objects.push(
      createNativeText({
        content: spec.formula,
        x: bounds.x + padding + 12,
        y: curY + 8,
        width: innerW - 24,
        height: formulaH - 16,
        fontFamily: 'KaTeX_Main, Times New Roman, serif',
        fontSize: 20,
        fontWeight: 600,
        color: theme.accentColor,
        textAlign: 'center',
        preset: 'formula',
        isLatex: true,
        layerId,
      })
    );
  }

  return objects;
}

/**
 * 2. Key Takeaway Card:
 * High-emphasis takeaway with accent border, left vertical stripe, and prominent typography.
 */
function compileKeyTakeawayCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const accent = spec.accentColor || theme.accentColor;
  const padding = spec.padding ?? theme.spacing.md;
  const innerLeft = bounds.x + padding + 12;
  const innerW = Math.max(40, bounds.width - padding * 2 - 12);
  let curY = bounds.y + padding;

  const headingSize = (theme.typography.headingSize || 24) + 2;
  const bodySize = (theme.typography.bodySize || 16) + 1;

  const objects: CanvasObject[] = [];

  // Card container with accent border
  const container = createCardContainer(
    bounds,
    theme,
    {
      ...spec,
      borderColor: accent,
      borderWidth: 2,
    },
    layerId
  );
  objects.push(container);

  // Left vertical accent stripe
  objects.push(createLeftAccentStripe(bounds, accent, 6, layerId));

  // Badge
  const badgeLabel = spec.badge || 'KEY TAKEAWAY';
  objects.push(...createBadgeElement(badgeLabel, innerLeft, curY, theme, accent, layerId));
  curY += 30;

  // Title
  if (spec.title) {
    const titleLines = measureTextLines(spec.title, {
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: headingSize,
      fontWeight: 800,
      maxWidth: innerW,
    });
    objects.push(
      createNativeText({
        content: titleLines.lines.join('\n'),
        x: innerLeft,
        y: curY,
        width: innerW,
        height: titleLines.totalHeight,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: headingSize,
        fontWeight: 800,
        color: theme.primaryText,
        preset: 'heading',
        layerId,
      })
    );
    curY += titleLines.totalHeight + 10;
  }

  // Divider
  objects.push(createHorizontalDivider(innerLeft, curY, innerW, theme, layerId));
  curY += 12;

  // Prominent Body
  const bodyText = Array.isArray(spec.body) ? spec.body.join('\n\n') : spec.body || '';
  if (bodyText) {
    const measured = measureTextLines(bodyText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: bodySize,
      lineHeightMultiplier: 1.45,
      maxWidth: innerW,
    });
    objects.push(
      createNativeText({
        content: measured.lines.join('\n'),
        x: innerLeft,
        y: curY,
        width: innerW,
        height: measured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: bodySize,
        fontWeight: 500,
        color: theme.primaryText,
        preset: 'important',
        layerId,
      })
    );
    curY += measured.totalHeight + 10;
  }

  // Optional formula
  if (spec.formula) {
    objects.push(
      createNativeText({
        content: spec.formula,
        x: innerLeft,
        y: curY,
        width: innerW,
        height: 36,
        fontFamily: 'KaTeX_Main, serif',
        fontSize: 22,
        fontWeight: 700,
        color: accent,
        preset: 'formula',
        isLatex: true,
        layerId,
      })
    );
  }

  return objects;
}

/**
 * 3. Definition Card:
 * Term, pronunciation/part-of-speech badge, formal definition, and classroom example.
 */
function compileDefinitionCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerW = bounds.width - padding * 2;
  let curY = bounds.y + padding;

  const headingSize = (theme.typography.headingSize || 24) + 4;
  const bodySize = theme.typography.bodySize || 16;

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // Top Definition Badge
  const badgeLabel = spec.badge || (spec.partOfSpeech ? `DEFINITION • ${spec.partOfSpeech}` : 'DEFINITION');
  objects.push(...createBadgeElement(badgeLabel, bounds.x + padding, curY, theme, spec.accentColor, layerId));
  curY += 30;

  // Term
  const termText = spec.term || spec.title || 'Concept Term';
  objects.push(
    createNativeText({
      content: termText,
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: 32,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: headingSize,
      fontWeight: 800,
      color: theme.accentColor,
      preset: 'title',
      layerId,
    })
  );
  curY += 34;

  // Pronunciation / Meta
  if (spec.pronunciation) {
    objects.push(
      createNativeText({
        content: spec.pronunciation,
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: 20,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 13,
        fontStyle: 'italic',
        color: theme.secondaryText,
        preset: 'label',
        layerId,
      })
    );
    curY += 24;
  }

  // Divider
  objects.push(createHorizontalDivider(bounds.x + padding, curY, innerW, theme, layerId));
  curY += 12;

  // Formal Definition
  const defText = spec.formalDefinition || (Array.isArray(spec.body) ? spec.body.join(' ') : spec.body) || '';
  if (defText) {
    const defMeasured = measureTextLines(defText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: bodySize,
      maxWidth: innerW,
    });
    objects.push(
      createNativeText({
        content: defMeasured.lines.join('\n'),
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: defMeasured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: bodySize,
        fontWeight: 500,
        color: theme.primaryText,
        preset: 'definition',
        layerId,
      })
    );
    curY += defMeasured.totalHeight + 12;
  }

  // Example Section
  if (spec.example) {
    objects.push(
      createNativeText({
        content: `Example: ${spec.example}`,
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: 28,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        fontStyle: 'italic',
        color: theme.secondaryText,
        preset: 'body',
        layerId,
      })
    );
    curY += 32;
  }

  // Formula
  if (spec.formula) {
    objects.push(
      createNativeText({
        content: spec.formula,
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: 36,
        fontFamily: 'KaTeX_Main, serif',
        fontSize: 20,
        color: theme.accentColor,
        preset: 'formula',
        isLatex: true,
        layerId,
      })
    );
  }

  return objects;
}

/**
 * 4. Problem & Solution Split Card:
 * Side-by-side or stacked problem challenge vs worked solution.
 */
function compileProblemSolutionCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;
  const headingWeight = coerceNumericWeight(theme.typography.headingWeight, 700);

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // Main Header
  const titleText = spec.title || 'Worked Example';
  objects.push(
    createNativeText({
      content: titleText,
      x: bounds.x + padding,
      y: curY,
      width: bounds.width - padding * 2,
      height: 28,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: headingSize,
      fontWeight: headingWeight,
      color: theme.primaryText,
      preset: 'heading',
      layerId,
    })
  );
  curY += 34;

  const innerBounds: BoundingBox = {
    x: bounds.x + padding,
    y: curY,
    width: bounds.width - padding * 2,
    height: bounds.y + bounds.height - curY - padding,
  };

  const isWide = innerBounds.width >= 460;
  if (isWide) {
    // 2 Sub-Columns
    const [probBounds, solBounds] = calculateColumnBounds({
      containerBounds: innerBounds,
      splitType: 'two-equal',
      gutter: 16,
    });

    // Problem Box (Left)
    objects.push(
      createNativeShape({
        shapeType: 'roundedRect',
        x: probBounds.x,
        y: probBounds.y,
        width: probBounds.width,
        height: probBounds.height,
        fillColor: theme.semantic.warning,
        fillOpacity: 0.08,
        strokeColor: theme.semantic.warning,
        strokeWidth: 1.5,
        strokeOpacity: 0.6,
        layerId,
      })
    );
    objects.push(
      ...createBadgeElement('CHALLENGE', probBounds.x + 12, probBounds.y + 12, theme, theme.semantic.warning, layerId)
    );

    const probText = spec.problem?.text || (Array.isArray(spec.body) ? spec.body[0] : spec.body) || 'Problem statement';
    const probMeasured = measureTextLines(probText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 14,
      maxWidth: probBounds.width - 24,
    });
    objects.push(
      createNativeText({
        content: probMeasured.lines.join('\n'),
        x: probBounds.x + 12,
        y: probBounds.y + 44,
        width: probBounds.width - 24,
        height: probMeasured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );

    // Solution Box (Right)
    objects.push(
      createNativeShape({
        shapeType: 'roundedRect',
        x: solBounds.x,
        y: solBounds.y,
        width: solBounds.width,
        height: solBounds.height,
        fillColor: theme.semantic.success,
        fillOpacity: 0.08,
        strokeColor: theme.semantic.success,
        strokeWidth: 1.5,
        strokeOpacity: 0.6,
        layerId,
      })
    );
    objects.push(
      ...createBadgeElement('SOLUTION', solBounds.x + 12, solBounds.y + 12, theme, theme.semantic.success, layerId)
    );

    const solText = spec.solution?.text || (Array.isArray(spec.body) ? spec.body[1] : '') || 'Solution steps';
    const solMeasured = measureTextLines(solText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 14,
      maxWidth: solBounds.width - 24,
    });
    objects.push(
      createNativeText({
        content: solMeasured.lines.join('\n'),
        x: solBounds.x + 12,
        y: solBounds.y + 44,
        width: solBounds.width - 24,
        height: solMeasured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );
  } else {
    // Stacked vertically
    const halfH = Math.max(40, (innerBounds.height - 12) / 2);

    // Problem Top
    objects.push(
      createNativeShape({
        shapeType: 'roundedRect',
        x: innerBounds.x,
        y: innerBounds.y,
        width: innerBounds.width,
        height: halfH,
        fillColor: theme.semantic.warning,
        fillOpacity: 0.08,
        strokeColor: theme.semantic.warning,
        strokeWidth: 1,
        layerId,
      })
    );
    objects.push(
      createNativeText({
        content: spec.problem?.text || 'Challenge',
        x: innerBounds.x + 10,
        y: innerBounds.y + 10,
        width: innerBounds.width - 20,
        height: halfH - 20,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );

    // Solution Bottom
    objects.push(
      createNativeShape({
        shapeType: 'roundedRect',
        x: innerBounds.x,
        y: innerBounds.y + halfH + 12,
        width: innerBounds.width,
        height: halfH,
        fillColor: theme.semantic.success,
        fillOpacity: 0.08,
        strokeColor: theme.semantic.success,
        strokeWidth: 1,
        layerId,
      })
    );
    objects.push(
      createNativeText({
        content: spec.solution?.text || 'Solution',
        x: innerBounds.x + 10,
        y: innerBounds.y + halfH + 22,
        width: innerBounds.width - 20,
        height: halfH - 20,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );
  }

  return objects;
}

/**
 * 5. Metric Highlight Card:
 * Massive number / statistic + descriptive label + subtext.
 */
function compileMetricHighlightCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerW = bounds.width - padding * 2;
  const accent = spec.accentColor || theme.accentColor;
  let curY = bounds.y + padding;

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // Top Badge
  if (spec.badge) {
    objects.push(...createBadgeElement(spec.badge, bounds.x + padding, curY, theme, accent, layerId));
    curY += 28;
  }

  // Giant Metric Value (e.g. "9.8 m/s²", "98.4%")
  const val = spec.metricValue || spec.metric?.value || spec.title || '100%';
  const valFontSize = Math.min(56, Math.max(36, Math.round(bounds.width / 8)));
  objects.push(
    createNativeText({
      content: val,
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: valFontSize + 12,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: valFontSize,
      fontWeight: 800,
      color: accent,
      preset: 'title',
      layerId,
    })
  );
  curY += valFontSize + 16;

  // Label
  const labelText = spec.metricLabel || spec.metric?.label || spec.subtitle || 'Key Metric';
  objects.push(
    createNativeText({
      content: labelText,
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: 26,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 18,
      fontWeight: 700,
      color: theme.primaryText,
      preset: 'heading',
      layerId,
    })
  );
  curY += 30;

  // Divider
  objects.push(createHorizontalDivider(bounds.x + padding, curY, innerW, theme, layerId));
  curY += 10;

  // Subtext / description
  const subtext = spec.metricSubtext || spec.metric?.subtext || (Array.isArray(spec.body) ? spec.body.join(' ') : spec.body);
  if (subtext) {
    const measured = measureTextLines(subtext, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 14,
      maxWidth: innerW,
    });
    objects.push(
      createNativeText({
        content: measured.lines.join('\n'),
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: measured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        color: theme.secondaryText,
        preset: 'body',
        layerId,
      })
    );
  }

  return objects;
}

/**
 * 6. Quote Card:
 * Stylized quotation mark, italicized quote body, author attribution, and source citation.
 */
function compileQuoteCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerW = bounds.width - padding * 2;
  const accent = spec.accentColor || theme.accentColor;
  let curY = bounds.y + padding;

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // Large stylized quotation glyph
  objects.push(
    createNativeText({
      content: '“',
      x: bounds.x + padding,
      y: curY - 10,
      width: 48,
      height: 48,
      fontFamily: 'Georgia, serif',
      fontSize: 54,
      fontWeight: 700,
      color: accent,
      opacity: 0.5,
      preset: 'title',
      layerId,
    })
  );
  curY += 32;

  // Quote Text
  const quoteStr = spec.quoteText || spec.quote?.text || (Array.isArray(spec.body) ? spec.body.join(' ') : spec.body) || 'Inspiring quote';
  const quoteMeasured = measureTextLines(quoteStr, {
    fontFamily: 'Georgia, serif',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeightMultiplier: 1.45,
    maxWidth: innerW,
  });

  objects.push(
    createNativeText({
      content: quoteMeasured.lines.join('\n'),
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: quoteMeasured.totalHeight,
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fontStyle: 'italic',
      color: theme.primaryText,
      preset: 'body',
      layerId,
    })
  );
  curY += quoteMeasured.totalHeight + 14;

  // Divider
  objects.push(createHorizontalDivider(bounds.x + padding, curY, innerW, theme, layerId));
  curY += 12;

  // Author
  const author = spec.quoteAuthor || spec.quote?.author || spec.title || 'Author';
  objects.push(
    createNativeText({
      content: `— ${author}`,
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: 22,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 15,
      fontWeight: 700,
      color: theme.primaryText,
      preset: 'heading',
      layerId,
    })
  );
  curY += 24;

  // Source
  const source = spec.quoteSource || spec.quote?.source || spec.subtitle;
  if (source) {
    objects.push(
      createNativeText({
        content: source,
        x: bounds.x + padding + 16,
        y: curY,
        width: innerW - 16,
        height: 18,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 13,
        color: theme.secondaryText,
        preset: 'label',
        layerId,
      })
    );
  }

  return objects;
}

/**
 * 7. Comparison Card:
 * Side-by-side two-column contrast (e.g. Concept A vs Concept B).
 */
function compileComparisonCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;
  const headingWeight = coerceNumericWeight(theme.typography.headingWeight, 700);

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // Card Title
  if (spec.title) {
    objects.push(
      createNativeText({
        content: spec.title,
        x: bounds.x + padding,
        y: curY,
        width: bounds.width - padding * 2,
        height: 28,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: headingSize,
        fontWeight: headingWeight,
        color: theme.primaryText,
        preset: 'heading',
        layerId,
      })
    );
    curY += 34;
  }

  const innerBounds: BoundingBox = {
    x: bounds.x + padding,
    y: curY,
    width: bounds.width - padding * 2,
    height: bounds.y + bounds.height - curY - padding,
  };

  const [leftBounds, rightBounds] = calculateColumnBounds({
    containerBounds: innerBounds,
    splitType: 'two-equal',
    gutter: 20,
  });

  // Left Column
  const leftCol = spec.leftColumn || spec.comparison?.leftColumn || { title: 'Option A', items: [] };
  objects.push(
    createNativeText({
      content: leftCol.title,
      x: leftBounds.x,
      y: leftBounds.y,
      width: leftBounds.width,
      height: 24,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 16,
      fontWeight: 700,
      color: leftCol.accentColor || theme.accentColor,
      preset: 'heading',
      layerId,
    })
  );

  let leftY = leftBounds.y + 28;
  for (const item of leftCol.items) {
    const itemText = `•  ${item}`;
    const measured = measureTextLines(itemText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 13,
      maxWidth: leftBounds.width,
    });
    objects.push(
      createNativeText({
        content: measured.lines.join('\n'),
        x: leftBounds.x,
        y: leftY,
        width: leftBounds.width,
        height: measured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 13,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );
    leftY += measured.totalHeight + 4;
  }

  // Center vertical divider
  const midX = (leftBounds.x + leftBounds.width + rightBounds.x) / 2;
  objects.push(
    createNativeShape({
      shapeType: 'line',
      x: midX,
      y: innerBounds.y,
      width: 0,
      height: innerBounds.height,
      strokeColor: theme.cardBorder,
      strokeWidth: 1,
      strokeOpacity: 0.5,
      layerId,
    })
  );

  // Right Column
  const rightCol = spec.rightColumn || spec.comparison?.rightColumn || { title: 'Option B', items: [] };
  objects.push(
    createNativeText({
      content: rightCol.title,
      x: rightBounds.x,
      y: rightBounds.y,
      width: rightBounds.width,
      height: 24,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 16,
      fontWeight: 700,
      color: rightCol.accentColor || theme.highlightColor,
      preset: 'heading',
      layerId,
    })
  );

  let rightY = rightBounds.y + 28;
  for (const item of rightCol.items) {
    const itemText = `•  ${item}`;
    const measured = measureTextLines(itemText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 13,
      maxWidth: rightBounds.width,
    });
    objects.push(
      createNativeText({
        content: measured.lines.join('\n'),
        x: rightBounds.x,
        y: rightY,
        width: rightBounds.width,
        height: measured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 13,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );
    rightY += measured.totalHeight + 4;
  }

  return objects;
}

/**
 * 8. Multi-Column Feature Card:
 * Group of 2-4 sub-feature tiles inside a unified card.
 */
function compileMultiColumnFeatureCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;
  const headingWeight = coerceNumericWeight(theme.typography.headingWeight, 700);

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  if (spec.title) {
    objects.push(
      createNativeText({
        content: spec.title,
        x: bounds.x + padding,
        y: curY,
        width: bounds.width - padding * 2,
        height: 28,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: headingSize,
        fontWeight: headingWeight,
        color: theme.primaryText,
        preset: 'heading',
        layerId,
      })
    );
    curY += 34;
  }

  const features: FeatureItemSpec[] = spec.features || [];
  const count = Math.max(1, Math.min(4, features.length));
  if (count > 0) {
    const innerBounds: BoundingBox = {
      x: bounds.x + padding,
      y: curY,
      width: bounds.width - padding * 2,
      height: bounds.y + bounds.height - curY - padding,
    };

    const ratios = Array(count).fill(1 / count);
    const colBounds = calculateColumnBounds({
      containerBounds: innerBounds,
      customRatios: ratios,
      gutter: 12,
    });

    colBounds.forEach((b, idx) => {
      const feat = features[idx] || { title: `Feature ${idx + 1}`, description: '' };
      // Sub-tile background
      objects.push(
        createNativeShape({
          shapeType: 'roundedRect',
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          fillColor: theme.cardBackground,
          fillOpacity: 0.6,
          strokeColor: theme.cardBorder,
          strokeWidth: 1,
          layerId,
        })
      );

      let tileY = b.y + 10;
      if (feat.icon) {
        objects.push(
          createNativeText({
            content: feat.icon,
            x: b.x + 10,
            y: tileY,
            width: 24,
            height: 24,
            fontSize: 18,
            color: theme.accentColor,
            layerId,
          })
        );
        tileY += 28;
      }

      objects.push(
        createNativeText({
          content: feat.title,
          x: b.x + 10,
          y: tileY,
          width: b.width - 20,
          height: 22,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 15,
          fontWeight: 700,
          color: theme.accentColor,
          preset: 'heading',
          layerId,
        })
      );
      tileY += 26;

      const descMeasured = measureTextLines(feat.description, {
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 12,
        maxWidth: b.width - 20,
      });
      objects.push(
        createNativeText({
          content: descMeasured.lines.join('\n'),
          x: b.x + 10,
          y: tileY,
          width: b.width - 20,
          height: descMeasured.totalHeight,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 12,
          color: theme.secondaryText,
          preset: 'body',
          layerId,
        })
      );
    });
  }

  return objects;
}

/**
 * 9. Numbered Steps Card:
 * Sequential procedure (1, 2, 3...) with step badges, titles, and descriptions.
 */
function compileNumberedStepsCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerW = bounds.width - padding * 2;
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;
  const headingWeight = coerceNumericWeight(theme.typography.headingWeight, 700);

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  if (spec.title) {
    objects.push(
      createNativeText({
        content: spec.title,
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: 28,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: headingSize,
        fontWeight: headingWeight,
        color: theme.primaryText,
        preset: 'heading',
        layerId,
      })
    );
    curY += 34;
  }

  const steps: CardStepItem[] = spec.steps || [
    { stepNumber: 1, title: 'First Step', description: 'Begin procedure' },
  ];

  const badgeSize = 26;
  const textLeft = bounds.x + padding + badgeSize + 12;
  const textW = innerW - badgeSize - 12;

  steps.forEach((step, idx) => {
    const num = step.stepNumber !== undefined ? String(step.stepNumber) : String(idx + 1);

    // Number Badge Circle
    objects.push(
      createNativeShape({
        shapeType: 'circle',
        x: bounds.x + padding,
        y: curY,
        width: badgeSize,
        height: badgeSize,
        fillColor: theme.accentColor,
        fillOpacity: 1,
        strokeColor: 'transparent',
        strokeWidth: 0,
        layerId,
      })
    );

    objects.push(
      createNativeText({
        content: num,
        x: bounds.x + padding,
        y: curY + 4,
        width: badgeSize,
        height: badgeSize - 8,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: 12,
        fontWeight: 700,
        color: '#ffffff',
        textAlign: 'center',
        preset: 'label',
        layerId,
      })
    );

    // Step Title
    objects.push(
      createNativeText({
        content: step.title,
        x: textLeft,
        y: curY + 2,
        width: textW,
        height: 22,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: 15,
        fontWeight: 700,
        color: theme.primaryText,
        preset: 'heading',
        layerId,
      })
    );

    let stepContentH = 24;
    // Step Description
    if (step.description) {
      const descMeasured = measureTextLines(step.description, {
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 13,
        maxWidth: textW,
      });
      objects.push(
        createNativeText({
          content: descMeasured.lines.join('\n'),
          x: textLeft,
          y: curY + 24,
          width: textW,
          height: descMeasured.totalHeight,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 13,
          color: theme.secondaryText,
          preset: 'body',
          layerId,
        })
      );
      stepContentH += descMeasured.totalHeight;
    }

    curY += Math.max(badgeSize + 10, stepContentH + 10);
  });

  return objects;
}

/**
 * 10. Timeline Card:
 * Chronological timeline with milestones along an axis.
 */
function compileTimelineCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;
  const headingWeight = coerceNumericWeight(theme.typography.headingWeight, 700);

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  if (spec.title) {
    objects.push(
      createNativeText({
        content: spec.title,
        x: bounds.x + padding,
        y: curY,
        width: bounds.width - padding * 2,
        height: 28,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: headingSize,
        fontWeight: headingWeight,
        color: theme.primaryText,
        preset: 'heading',
        layerId,
      })
    );
    curY += 34;
  }

  const events: TimelineEventItem[] = spec.timelineEvents || [
    { dateOrEra: 'Phase 1', title: 'Initiation', description: 'Project kick-off' },
  ];

  const isWide = bounds.width >= 500 && events.length > 1;
  if (isWide) {
    // Horizontal Timeline
    const totalW = bounds.width - padding * 2;
    const stepW = totalW / events.length;
    const lineY = curY + 45;

    // Timeline Axis
    objects.push(
      createNativeShape({
        shapeType: 'line',
        x: bounds.x + padding + stepW / 2,
        y: lineY,
        width: totalW - stepW,
        height: 0,
        strokeColor: theme.accentColor,
        strokeWidth: 2,
        strokeOpacity: 0.7,
        layerId,
      })
    );

    events.forEach((ev, idx) => {
      const nodeX = bounds.x + padding + idx * stepW + stepW / 2;

      // Node Dot
      objects.push(
        createNativeShape({
          shapeType: 'circle',
          x: nodeX - 7,
          y: lineY - 7,
          width: 14,
          height: 14,
          fillColor: theme.accentColor,
          strokeColor: '#ffffff',
          strokeWidth: 2,
          layerId,
        })
      );

      // Date Tag Above
      objects.push(
        createNativeText({
          content: ev.dateOrEra,
          x: nodeX - stepW / 2 + 4,
          y: lineY - 30,
          width: stepW - 8,
          height: 20,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 12,
          fontWeight: 700,
          color: theme.accentColor,
          textAlign: 'center',
          preset: 'label',
          layerId,
        })
      );

      // Title Below
      objects.push(
        createNativeText({
          content: ev.title,
          x: nodeX - stepW / 2 + 4,
          y: lineY + 14,
          width: stepW - 8,
          height: 20,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 13,
          fontWeight: 700,
          color: theme.primaryText,
          textAlign: 'center',
          preset: 'heading',
          layerId,
        })
      );

      // Description
      if (ev.description) {
        const descMeasured = measureTextLines(ev.description, {
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 11,
          maxWidth: stepW - 8,
        });
        objects.push(
          createNativeText({
            content: descMeasured.lines.join('\n'),
            x: nodeX - stepW / 2 + 4,
            y: lineY + 36,
            width: stepW - 8,
            height: descMeasured.totalHeight,
            fontFamily: theme.typography.fontFamilyBody,
            fontSize: 11,
            color: theme.secondaryText,
            textAlign: 'center',
            preset: 'body',
            layerId,
          })
        );
      }
    });
  } else {
    // Vertical Timeline
    events.forEach((ev) => {
      objects.push(
        createNativeText({
          content: ev.dateOrEra,
          x: bounds.x + padding,
          y: curY,
          width: 90,
          height: 22,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 12,
          fontWeight: 700,
          color: theme.accentColor,
          preset: 'label',
          layerId,
        })
      );

      objects.push(
        createNativeText({
          content: ev.title,
          x: bounds.x + padding + 100,
          y: curY,
          width: bounds.width - padding * 2 - 100,
          height: 22,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 14,
          fontWeight: 700,
          color: theme.primaryText,
          preset: 'heading',
          layerId,
        })
      );
      curY += 24;

      if (ev.description) {
        const descMeasured = measureTextLines(ev.description, {
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 12,
          maxWidth: bounds.width - padding * 2 - 100,
        });
        objects.push(
          createNativeText({
            content: descMeasured.lines.join('\n'),
            x: bounds.x + padding + 100,
            y: curY,
            width: bounds.width - padding * 2 - 100,
            height: descMeasured.totalHeight,
            fontFamily: theme.typography.fontFamilyBody,
            fontSize: 12,
            color: theme.secondaryText,
            preset: 'body',
            layerId,
          })
        );
        curY += descMeasured.totalHeight + 8;
      }
    });
  }

  return objects;
}

/**
 * 11. Warning or Important Note Card:
 * High-visibility cautionary warning or exam pitfall.
 */
function compileWarningNoteCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerLeft = bounds.x + padding + 12;
  const innerW = bounds.width - padding * 2 - 12;
  const warningColor = spec.accentColor || theme.semantic.warning;
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;
  const bodySize = theme.typography.bodySize || 16;

  // Outer container with warning color border
  objects.push(
    createCardContainer(
      bounds,
      theme,
      {
        ...spec,
        borderColor: warningColor,
        borderWidth: 2,
      },
      layerId
    )
  );

  // Left warning stripe
  objects.push(createLeftAccentStripe(bounds, warningColor, 6, layerId));

  // Badge: "⚠️ CAUTION" or "⚠️ EXAM TIP"
  const badgeLabel = spec.badge || '⚠️ CAUTION';
  objects.push(...createBadgeElement(badgeLabel, innerLeft, curY, theme, warningColor, layerId));
  curY += 30;

  // Title
  if (spec.title) {
    objects.push(
      createNativeText({
        content: spec.title,
        x: innerLeft,
        y: curY,
        width: innerW,
        height: 26,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: headingSize,
        fontWeight: 800,
        color: warningColor,
        preset: 'warning',
        layerId,
      })
    );
    curY += 32;
  }

  // Divider
  objects.push(createHorizontalDivider(innerLeft, curY, innerW, theme, layerId));
  curY += 12;

  // Body
  const bodyText = Array.isArray(spec.body) ? spec.body.join('\n\n') : spec.body || '';
  if (bodyText) {
    const measured = measureTextLines(bodyText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: bodySize,
      maxWidth: innerW,
    });
    objects.push(
      createNativeText({
        content: measured.lines.join('\n'),
        x: innerLeft,
        y: curY,
        width: innerW,
        height: measured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: bodySize,
        color: theme.primaryText,
        preset: 'important',
        layerId,
      })
    );
  }

  return objects;
}

/**
 * 12. Question & Answer Card:
 * Formative classroom check-for-understanding quiz card.
 */
function compileQuestionAnswerCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerW = bounds.width - padding * 2;
  let curY = bounds.y + padding;

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // Title / Badge
  const badgeLabel = spec.badge || 'CHECK FOR UNDERSTANDING';
  objects.push(...createBadgeElement(badgeLabel, bounds.x + padding, curY, theme, theme.accentColor, layerId));
  curY += 32;

  // Question Block
  const qText = spec.question || spec.title || 'Question prompt';
  objects.push(
    createNativeText({
      content: `Q: ${qText}`,
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: 32,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 17,
      fontWeight: 700,
      color: theme.primaryText,
      preset: 'qa',
      layerId,
    })
  );
  curY += 38;

  // Divider
  objects.push(createHorizontalDivider(bounds.x + padding, curY, innerW, theme, layerId));
  curY += 12;

  // Answer Block (Highlighted)
  const aText = spec.answer || (Array.isArray(spec.body) ? spec.body.join(' ') : spec.body) || 'Answer / Explanation';
  const aMeasured = measureTextLines(aText, {
    fontFamily: theme.typography.fontFamilyBody,
    fontSize: 14,
    maxWidth: innerW - 20,
  });

  const ansBoxH = Math.max(50, aMeasured.totalHeight + 24);
  objects.push(
    createNativeShape({
      shapeType: 'roundedRect',
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: ansBoxH,
      fillColor: theme.semantic.success,
      fillOpacity: 0.1,
      strokeColor: theme.semantic.success,
      strokeWidth: 1.5,
      layerId,
    })
  );

  objects.push(
    createNativeText({
      content: `A: ${aMeasured.lines.join('\n')}`,
      x: bounds.x + padding + 10,
      y: curY + 10,
      width: innerW - 20,
      height: aMeasured.totalHeight,
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 14,
      fontWeight: 500,
      color: theme.primaryText,
      preset: 'body',
      layerId,
    })
  );

  return objects;
}

/**
 * 13. Summary Card:
 * Review checklist with green checkmark glyphs and memorable recap callout.
 */
function compileSummaryCard(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = spec.padding ?? theme.spacing.md;
  const innerW = bounds.width - padding * 2;
  let curY = bounds.y + padding;

  const headingSize = theme.typography.headingSize || 24;

  objects.push(createCardContainer(bounds, theme, spec, layerId));

  // Badge & Title
  const badgeLabel = spec.badge || 'LESSON SUMMARY';
  objects.push(...createBadgeElement(badgeLabel, bounds.x + padding, curY, theme, theme.semantic.success, layerId));
  curY += 30;

  const titleText = spec.title || 'Key Points to Remember';
  objects.push(
    createNativeText({
      content: titleText,
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: 28,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: headingSize,
      fontWeight: 800,
      color: theme.primaryText,
      preset: 'heading',
      layerId,
    })
  );
  curY += 34;

  // Divider
  objects.push(createHorizontalDivider(bounds.x + padding, curY, innerW, theme, layerId));
  curY += 12;

  // Takeaway Checklist
  const takeaways = spec.takeaways || spec.bulletPoints || (Array.isArray(spec.body) ? spec.body : []);
  for (const item of takeaways) {
    const itemText = `✓  ${item}`;
    const measured = measureTextLines(itemText, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 14,
      maxWidth: innerW,
    });

    objects.push(
      createNativeText({
        content: measured.lines.join('\n'),
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: measured.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        fontWeight: 500,
        color: theme.primaryText,
        preset: 'body',
        layerId,
      })
    );
    curY += measured.totalHeight + 6;
  }

  // Bottom Recap Banner
  if (spec.recapNote) {
    curY += 8;
    const recapMeasured = measureTextLines(spec.recapNote, {
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 13,
      maxWidth: innerW - 20,
    });
    const bannerH = recapMeasured.totalHeight + 16;

    objects.push(
      createNativeShape({
        shapeType: 'roundedRect',
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: bannerH,
        fillColor: theme.accentColor,
        fillOpacity: 0.12,
        strokeColor: theme.accentColor,
        strokeWidth: 1,
        layerId,
      })
    );

    objects.push(
      createNativeText({
        content: recapMeasured.lines.join('\n'),
        x: bounds.x + padding + 10,
        y: curY + 8,
        width: innerW - 20,
        height: recapMeasured.totalHeight,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: 13,
        fontWeight: 600,
        color: theme.accentColor,
        preset: 'label',
        layerId,
      })
    );
  }

  return objects;
}

// ─── Public Component Compiler API ───────────────────────────────────────────

/**
 * Compiles any declarative HtmlCardSpec into native SmartBoard CanvasObject[]
 * within the specified bounding box according to the chosen presentation theme.
 */
export function compileHtmlCardToNativeObjects(
  spec: HtmlCardSpec,
  bounds: BoundingBox,
  theme: PresentationTheme,
  options?: CompileCardOptions
): CanvasObject[] {
  const safeSpec = validateCardSpec(spec);
  const layerId = options?.defaultLayerId || LAYER_OBJECTS;

  let compiled: CanvasObject[];

  switch (safeSpec.cardType) {
    case 'key-takeaway':
      compiled = compileKeyTakeawayCard(safeSpec, bounds, theme, layerId);
      break;
    case 'definition':
      compiled = compileDefinitionCard(safeSpec, bounds, theme, layerId);
      break;
    case 'problem-solution':
      compiled = compileProblemSolutionCard(safeSpec, bounds, theme, layerId);
      break;
    case 'metric-highlight':
      compiled = compileMetricHighlightCard(safeSpec, bounds, theme, layerId);
      break;
    case 'quote':
      compiled = compileQuoteCard(safeSpec, bounds, theme, layerId);
      break;
    case 'comparison':
      compiled = compileComparisonCard(safeSpec, bounds, theme, layerId);
      break;
    case 'multi-column-feature':
      compiled = compileMultiColumnFeatureCard(safeSpec, bounds, theme, layerId);
      break;
    case 'numbered-steps':
      compiled = compileNumberedStepsCard(safeSpec, bounds, theme, layerId);
      break;
    case 'timeline':
      compiled = compileTimelineCard(safeSpec, bounds, theme, layerId);
      break;
    case 'warning-note':
      compiled = compileWarningNoteCard(safeSpec, bounds, theme, layerId);
      break;
    case 'question-answer':
      compiled = compileQuestionAnswerCard(safeSpec, bounds, theme, layerId);
      break;
    case 'interactive-activity': {
      if (safeSpec.activity) {
        const state = createInitialActivityState(safeSpec.activity);
        compiled = compileActivityToNativeObjects(safeSpec.activity, state, bounds, theme, layerId);
      } else {
        const generated = generateCurriculumActivity(
          safeSpec.title || safeSpec.question || 'Check for Understanding',
          'General Education',
          'mcq'
        );
        const state = createInitialActivityState(generated);
        compiled = compileActivityToNativeObjects(generated, state, bounds, theme, layerId);
      }
      break;
    }
    case 'summary':
      compiled = compileSummaryCard(safeSpec, bounds, theme, layerId);
      break;
    case 'basic-info':
    default:
      compiled = compileBasicInfoCard(safeSpec, bounds, theme, layerId);
      break;
  }

  // If requested, wrap objects into a GroupObject
  if (options?.createGroup) {
    const groupObj: GroupObject = {
      id: safeSpec.id || uuidv4(),
      type: 'group',
      objects: compiled,
      bbox: { ...bounds },
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      locked: false,
      visible: true,
      layerId,
    };
    return [groupObj];
  }

  return compiled;
}

/**
 * Compiles a slide header (Title + Subtitle + Accent Underline) into native TextObjects and Shapes.
 */
export function compileSlideHeaderToNativeObjects(
  title: string,
  subtitle: string | undefined,
  bounds: BoundingBox,
  theme: PresentationTheme,
  options?: { defaultLayerId?: string }
): CanvasObject[] {
  const layerId = options?.defaultLayerId || LAYER_OBJECTS;
  const objects: CanvasObject[] = [];

  const cleanTitle = sanitizeText(title);
  if (!cleanTitle) return objects;

  const titleFontSize = theme.typography.titleSize || 38;
  const headingWeight = coerceNumericWeight(theme.typography.headingWeight, 700);

  const titleLines = measureTextLines(cleanTitle, {
    fontFamily: theme.typography.fontFamilyHeading,
    fontSize: titleFontSize,
    fontWeight: headingWeight,
    maxWidth: bounds.width,
  });

  objects.push(
    createNativeText({
      content: titleLines.lines.join('\n'),
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: titleLines.totalHeight,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: titleFontSize,
      fontWeight: headingWeight,
      color: theme.primaryText,
      preset: 'title',
      layerId,
    })
  );

  let curY = bounds.y + titleLines.totalHeight + 8;

  // Subtitle
  const cleanSubtitle = subtitle ? sanitizeText(subtitle) : '';
  if (cleanSubtitle) {
    const subFontSize = theme.typography.subtitleSize || 20;
    const subLines = measureTextLines(cleanSubtitle, {
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: subFontSize,
      maxWidth: bounds.width,
    });
    objects.push(
      createNativeText({
        content: subLines.lines.join('\n'),
        x: bounds.x,
        y: curY,
        width: bounds.width,
        height: subLines.totalHeight,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: subFontSize,
        color: theme.secondaryText,
        preset: 'subheading',
        layerId,
      })
    );
    curY += subLines.totalHeight + 6;
  }

  // Accent underline
  objects.push(
    createNativeShape({
      shapeType: 'roundedRect',
      x: bounds.x,
      y: curY,
      width: Math.min(120, bounds.width * 0.25),
      height: 3,
      fillColor: theme.accentColor,
      strokeColor: 'transparent',
      layerId,
    })
  );

  return objects;
}

/**
 * Compiles slide footer metadata (Slide Counter + Topic) into native objects.
 */
export function compileSlideFooterToNativeObjects(
  slideNumber: number,
  totalSlides: number,
  lessonTopic: string,
  bounds: BoundingBox,
  theme: PresentationTheme,
  options?: { defaultLayerId?: string }
): CanvasObject[] {
  const layerId = options?.defaultLayerId || LAYER_OBJECTS;
  const objects: CanvasObject[] = [];

  // Footer top separator line
  objects.push(
    createNativeShape({
      shapeType: 'line',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: 0,
      strokeColor: theme.cardBorder,
      strokeWidth: 1,
      strokeOpacity: 0.4,
      layerId,
    })
  );

  // Left topic label
  const cleanTopic = sanitizeText(lessonTopic);
  if (cleanTopic) {
    objects.push(
      createNativeText({
        content: cleanTopic,
        x: bounds.x,
        y: bounds.y + 8,
        width: Math.round(bounds.width * 0.6),
        height: 20,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 12,
        color: theme.secondaryText,
        preset: 'label',
        layerId,
      })
    );
  }

  // Right slide count label
  const counterText = `Slide ${slideNumber} of ${totalSlides}`;
  const counterW = 140;
  objects.push(
    createNativeText({
      content: counterText,
      x: bounds.x + bounds.width - counterW,
      y: bounds.y + 8,
      width: counterW,
      height: 20,
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 12,
      color: theme.secondaryText,
      textAlign: 'right',
      preset: 'label',
      layerId,
    })
  );

  return objects;
}

/**
 * Compiles a full educational slide (Background, Header, Content Cards, Footer)
 * into a complete set of native CanvasObject[] ready for direct insertion into Page.objects.
 */
export function compileDeckSlideToNativeObjects(
  slideSpec: SlideContentSpec,
  theme: PresentationTheme,
  options?: CompileSlideOptions
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const slideW = DEFAULT_SLIDE_WIDTH;
  const slideH = DEFAULT_SLIDE_HEIGHT;
  const layerId = options?.defaultLayerId || LAYER_OBJECTS;

  // 1. Slide Canvas Background (Ensures accurate exports and projector display)
  if (options?.includeBackground !== false) {
    objects.push(
      createNativeShape({
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: slideW,
        height: slideH,
        fillColor: theme.backgroundColor,
        fillOpacity: 1,
        strokeColor: 'transparent',
        strokeWidth: 0,
        layerId: LAYER_BACKGROUND,
      })
    );
  }

  // 2. Partition slide regions
  const regions = calculateSlideRegions({
    slideWidth: slideW,
    slideHeight: slideH,
    hasSubtitle: Boolean(slideSpec.subtitle),
    hasFooter: options?.includeFooter !== false,
  });

  // 3. Header
  if (options?.includeHeader !== false) {
    const headerObjs = compileSlideHeaderToNativeObjects(
      slideSpec.title,
      slideSpec.subtitle,
      regions.headerBounds,
      theme,
      { defaultLayerId: layerId }
    );
    objects.push(...headerObjs);
  }

  // 4. Body Content Cards
  let rawCards = slideSpec.cards || [];

  // Propagate top-level slide formula and worked example to cards if missing
  const cards = rawCards.map((c, idx) => {
    const cardCopy = { ...c };
    if (idx === 0 && slideSpec.formula && !cardCopy.formula) {
      cardCopy.formula = slideSpec.formula;
    }
    if (slideSpec.workedExample && !cardCopy.problemSolution && !cardCopy.problem) {
      cardCopy.problemSolution = {
        problemTitle: slideSpec.workedExample.title || 'Worked Problem',
        problemText: slideSpec.workedExample.problemStatement,
        solutionTitle: 'Step-by-Step Solution',
        solutionText:
          (slideSpec.workedExample.steps || []).join('\n') +
          (slideSpec.workedExample.finalAnswer ? `\n\nFinal Answer: ${slideSpec.workedExample.finalAnswer}` : ''),
      };
    }
    return cardCopy;
  });

  if (cards.length === 0) {
    // Rebuild & Fix: Fallback to declarative master template placeholders so slides are NEVER empty!
    const template = matchTemplateByLayout(slideSpec.layout);
    const templateObjs = compileTemplateToNativeObjects(template, theme, slideSpec, {
      ...options,
      includeBackground: false,
      includeHeader: false,
      includeFooter: false,
    });
    objects.push(...templateObjs);
  } else {
    let cardBounds: BoundingBox[] = [];

    switch (slideSpec.layout) {
      case 'title-hero': {
        // 1 large centered hero card
        cardBounds = [
          {
            x: regions.bodyBounds.x + Math.round(regions.bodyBounds.width * 0.1),
            y: regions.bodyBounds.y + 20,
            width: Math.round(regions.bodyBounds.width * 0.8),
            height: Math.max(100, regions.bodyBounds.height - 40),
          },
        ];
        break;
      }
      case 'two-column-split':
      case 'comparison':
      case 'problem-solution':
      case 'definition-formula':
      case 'mathematical-explanation':
      case 'concept-explanation': {
        cardBounds = calculateColumnBounds({
          containerBounds: regions.bodyBounds,
          splitType: 'two-equal',
          gutter: 24,
        });
        break;
      }
      case 'diagram-explanation': {
        cardBounds = calculateColumnBounds({
          containerBounds: regions.bodyBounds,
          splitType: 'two-concept-demo',
          gutter: 24,
        });
        break;
      }
      case 'step-process':
      case 'four-card-grid': {
        const gridRes = calculateCardBounds({
          containerBounds: regions.bodyBounds,
          cardCount: Math.max(4, cards.length),
          columns: cards.length <= 4 ? cards.length : 2,
          rows: cards.length <= 4 ? 1 : 2,
          gapX: 20,
          gapY: 20,
        });
        cardBounds = gridRes.cards;
        break;
      }
      case 'three-card-grid':
      case 'summary-takeaway': {
        const gridRes = calculateCardBounds({
          containerBounds: regions.bodyBounds,
          cardCount: 3,
          columns: 3,
          rows: 1,
          gapX: 24,
          gapY: 0,
        });
        cardBounds = gridRes.cards;
        break;
      }
      case 'concept-overview':
      case 'timeline-milestones':
      case 'summary-quiz':
      default: {
        if (cards.length === 1) {
          cardBounds = [regions.bodyBounds];
        } else if (cards.length === 2) {
          cardBounds = calculateColumnBounds({
            containerBounds: regions.bodyBounds,
            splitType: 'two-equal',
            gutter: 24,
          });
        } else if (cards.length === 3) {
          const gridRes = calculateCardBounds({
            containerBounds: regions.bodyBounds,
            cardCount: 3,
            columns: 3,
            rows: 1,
            gapX: 24,
            gapY: 0,
          });
          cardBounds = gridRes.cards;
        } else {
          const gridRes = calculateCardBounds({
            containerBounds: regions.bodyBounds,
            cardCount: cards.length,
            gapX: 20,
            gapY: 20,
          });
          cardBounds = gridRes.cards;
        }
        break;
      }
    }

    cards.forEach((card, idx) => {
      const bounds = cardBounds[idx] || cardBounds[cardBounds.length - 1];
      const cardObjs = compileHtmlCardToNativeObjects(card, bounds, theme, {
        cardIndex: idx,
        totalCards: cards.length,
        defaultLayerId: layerId,
      });
      objects.push(...cardObjs);
    });
  }

  // 5. Footer
  if (options?.includeFooter !== false && regions.footerBounds) {
    const slideNum = options?.slideIndex !== undefined ? options.slideIndex + 1 : slideSpec.slideNumber || 1;
    const total = options?.totalSlides || slideNum;
    const topic = options?.topic || '';

    const footerObjs = compileSlideFooterToNativeObjects(
      slideNum,
      total,
      topic,
      regions.footerBounds,
      theme,
      { defaultLayerId: layerId }
    );
    objects.push(...footerObjs);
  }

  return objects;
}
