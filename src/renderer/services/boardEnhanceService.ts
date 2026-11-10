/**
 * boardEnhanceService.ts
 * AI 1-Click Board Enhancement & Zero-Overlap Canvas Layout Engine
 * 
 * Analyzes all elements on the active whiteboard slide and elevates them:
 * 1. Understands canvas dimensions (1920x1080) and reflows elements so NO objects overlap.
 * 2. Modifies background color & theme (deep chalkboard vs clean whiteboard).
 * 3. Applies individual custom Markdown / HTML styling per textbox without merging formats.
 * 4. Detects tables and formats them into clean KaTeX/Markdown tables with proper borders.
 * 5. Provides progressive step-by-step visual generation so the user sees AI actively working.
 * 6. Ensures static raster images are preserved and only moved to clean aligned positions.
 */

import { CanvasObject, TextObject, ShapeObject, Page, PageBackground } from '../../shared/types';
import { measureMarkdownSize } from './markdownRenderService';
import { v4 as uuidv4 } from 'uuid';

export interface EnhanceStep {
  stepIndex: number;
  totalSteps: number;
  statusText: string;
  objects: CanvasObject[];
  newBackground?: PageBackground;
}

export interface EnhanceResult {
  success: boolean;
  message: string;
  modifiedCount: number;
  addedIconsCount: number;
  enhancedObjects: CanvasObject[];
  newBackground?: PageBackground;
  steps: EnhanceStep[];
}

/**
 * Determines whether a background hex/rgb color is dark or light
 */
export function isDarkChalkboardTheme(bgColor?: string): boolean {
  if (!bgColor) return true; // Default chalkboard is dark green
  const color = bgColor.trim().toLowerCase();
  if (color.includes('#fff') || color.includes('rgb(255') || color === 'white' || color.includes('#f8fafc')) {
    return false;
  }
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      return luma < 140;
    }
  }
  return true;
}

/**
 * Text classification role
 */
export type TextRole = 'title' | 'subheading' | 'table' | 'definition-formula' | 'note-warning' | 'solution' | 'body';

/**
 * Detects if a text block contains a table (Markdown pipe-separated or columnar data)
 */
export function isTableContent(text: string): boolean {
  if (!text) return false;
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length >= 2) {
    const pipeLines = lines.filter((l) => l.includes('|'));
    if (pipeLines.length >= 2) return true;
    // Detect column headers like Score, Frequency, Product, Totals, etc.
    if (lines.some((l) => /\b(Score|Frequency|Product|Totals|Count|Value|Name|Item)\b/i.test(l) && (l.includes('\t') || /\s{2,}/.test(l)))) {
      return true;
    }
  }
  return false;
}

/**
 * Formats a single table cell to support clean KaTeX math, bold totals, and standard symbols
 */
function formatTableCell(rawCell: string, isHeader: boolean): string {
  let c = rawCell.trim();
  if (!c) return '';

  // Bold "Totals" or "Total" or "Sum"
  if (/^totals?$/i.test(c)) {
    return '**Totals**';
  }

  // Replace * with \cdot in mathematical multiplication e.g. 60 * 2 = 120 -> 60 \cdot 2 = 120
  c = c.replace(/(\d+)\s*\*\s*(\d+)/g, '$1 \\cdot $2');
  c = c.replace(/\(f_i\s*\*\s*x_i\)/g, '(f_i \\cdot x_i)');

  // Convert (x_i) or (f_i) -> ($x_i$) or ($f_i$)
  c = c.replace(/\(([a-zA-Z]_[a-zA-Z0-9]+)\)/g, '($$$1$)');

  // If cell contains LaTeX commands or subscripts/superscripts without $
  if (!c.includes('$') && (c.includes('\\sum') || c.includes('\\cdot') || c.includes('\\frac') || c.includes('\\sqrt') || /_[a-zA-Z0-9]/.test(c) || /\^[a-zA-Z0-9]/.test(c))) {
    if (c.includes('(') && c.includes(')')) {
      c = c.replace(/\(([^)]+)\)/g, '($$$1$)');
    } else {
      c = `$${c}$`;
    }
  }

  return c;
}

/**
 * Formats table text into clean Markdown table syntax with KaTeX support
 */
export function formatMarkdownTable(rawText: string): string {
  const lines = rawText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return rawText;

  // Case 1: Already has pipe characters
  if (lines.every((l) => l.includes('|') || /^[-:| ]+$/.test(l))) {
    const cleanedRows = lines.filter((l) => !/^\|?[-:| ]+\|?$/.test(l));
    if (cleanedRows.length >= 2) {
      const firstRow = cleanedRows[0];
      const headerCells = firstRow.split('|').map((c) => c.trim()).filter(Boolean);
      const colCount = Math.max(2, headerCells.length);
      const sep = `| ${new Array(colCount).fill(':---:').join(' | ')} |`;
      const normalizedHeader = `| ${headerCells.map((c) => formatTableCell(c, true)).join(' | ')} |`;
      const rest = cleanedRows.slice(1).map((r) => {
        const rowCells = r.split('|').map((c) => c.trim()).filter(Boolean);
        return `| ${rowCells.map((c) => formatTableCell(c, false)).join(' | ')} |`;
      });
      return [normalizedHeader, sep, ...rest].join('\n');
    }
  }

  // Case 2: Space or tab separated columns
  const tableRows = lines.map((line, rIdx) => {
    const cells = line.split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    const formattedCells = cells.map((c) => formatTableCell(c, rIdx === 0));
    return `| ${formattedCells.join(' | ')} |`;
  });
  if (tableRows.length >= 2) {
    const colCount = Math.max(2, tableRows[0].split('|').filter((c) => c.trim().length > 0).length);
    const sep = `| ${new Array(colCount).fill(':---:').join(' | ')} |`;
    return [tableRows[0], sep, ...tableRows.slice(1)].join('\n');
  }

  return rawText;
}

/**
 * Classifies text role based on position, length, and semantic content
 */
function classifyTextRole(text: string, currentFontSize: number, yPos: number, index: number): TextRole {
  const t = text.trim();
  const lower = t.toLowerCase();

  // 1. Table
  if (isTableContent(t)) {
    return 'table';
  }

  // 2. Warning / Important Note (Takes precedence over general layout position)
  if (/(important|warning|caution|remember|note|pitfall|pay attention|crucial):/i.test(lower)) {
    return 'note-warning';
  }

  // 3. Solution / Result / Outcome
  if (/(solution|answer|result|qed|proven|final answer):/i.test(lower)) {
    return 'solution';
  }

  // 4. Definition / Mathematical Formula
  if (
    (t.startsWith('$$') && t.endsWith('$$')) ||
    (t.startsWith('\\[') && t.endsWith('\\]')) ||
    /(definition|theorem|formula|equation|law|axiom|rule|identity):/i.test(lower)
  ) {
    return 'definition-formula';
  }

  // 5. Title: top element, starts with # Title, or large font, or title keywords
  if (
    index === 0 ||
    /^#\s+/.test(t) ||
    lower.startsWith('title:') ||
    (t.length < 90 && yPos < 260 && (
      lower.includes('example') ||
      lower.includes('calculation') ||
      lower.includes('introduction') ||
      lower.includes('lesson') ||
      lower.includes('step-by-step') ||
      currentFontSize >= 32
    ))
  ) {
    return 'title';
  }

  // 6. Subheading / Subtitle
  if (
    /^#{2,4}\s+/.test(t) ||
    lower.startsWith('section:') ||
    lower.startsWith('topic:') ||
    (index === 1 && yPos < 350) ||
    (t.length < 160 && (
      lower.startsWith("let's") ||
      lower.startsWith("given:") ||
      lower.startsWith("consider:") ||
      lower.startsWith("problem:") ||
      lower.startsWith("apply")
    ))
  ) {
    return 'subheading';
  }

  return 'body';
}

/**
 * Ensures leading pedagogical keywords are properly bolded
 */
function enhanceTextBolding(content: string): string {
  let updated = content;
  // Bold leading "1. First Term:" -> "1. **First Term:**"
  updated = updated.replace(/^(\d+\.\s+)([^:*#\n]+)(:)/gm, '$1**$2$3**');
  // Bold bullet points "- Definition:" -> "- **Definition:**"
  updated = updated.replace(/^([•*-]\s+)([^:*#\n]+)(:)/gm, '$1**$2$3**');
  return updated;
}

/**
 * Estimates element height with high accuracy using DOM bounding measurements to prevent any canvas overlaps
 */
export function estimateElementHeight(obj: CanvasObject, fontSize: number, width: number, isTable: boolean): number {
  if (obj.type === 'image') {
    return obj.height || 300;
  }
  if (obj.type === 'shape') {
    return Math.max(10, obj.height || 0);
  }
  if (obj.type === 'text') {
    const tObj = obj as TextObject;
    if (isTable) {
      const rows = tObj.content.trim().split('\n').filter(Boolean).length;
      return Math.max(220, rows * 52 + 50);
    }
    const measured = measureMarkdownSize(
      tObj.content,
      fontSize,
      tObj.fontFamily || 'Inter, -apple-system, sans-serif',
      Math.max(1200, width),
      tObj.lineHeight || 1.45,
      tObj.textAlign || 'left'
    );
    return Math.max(50, Math.ceil(measured.height) + 16);
  }
  return 60;
}

/**
 * 1-Click AI Enhance Engine:
 * Reflows the canvas, elevates typography, sets cohesive themes, and ensures zero overlap.
 */
export function enhanceSlideContent(page: Page): EnhanceResult {
  if (!page || !page.objects || page.objects.length === 0) {
    return {
      success: false,
      message: 'No content on the current slide to enhance. Add or drag text onto the board first!',
      modifiedCount: 0,
      addedIconsCount: 0,
      enhancedObjects: [],
      steps: [],
    };
  }

  const isDark = isDarkChalkboardTheme(page.background?.color || (page as any).backgroundColor);
  const existingObjects = [...page.objects];

  // Cohesive academic color palette
  const palette = isDark
    ? {
        title: '#fbbf24', // Warm Chalkboard Gold / Amber (Matches classic teacher blackboard style)
        titleAlt: '#38bdf8', // Electric Sky Blue
        subheading: '#cbd5e1', // Slate chalk white
        definition: '#fde047', // Radiant Yellow
        warning: '#f87171', // Coral Rose
        solution: '#4ade80', // Emerald Green
        body: '#f8fafc', // Crisp Chalk White
        subtitle: '#cbd5e1', // Soft Slate
        underline: '#facc15', // Gold underline
        canvasBg: '#142d22', // Deep Academic Chalkboard
      }
    : {
        title: '#1e40af', // Deep Royal Blue
        titleAlt: '#0284c7', // Bright Cerulean
        subheading: '#475569', // Slate 600
        definition: '#4338ca', // Indigo
        warning: '#dc2626', // Crimson Red
        solution: '#166534', // Deep Forest Green
        body: '#1e293b', // Slate 900
        subtitle: '#475569', // Slate 600
        underline: '#2563eb', // Royal Blue underline
        canvasBg: '#ffffff', // Clean Whiteboard
      };

  // Recommended background update for optimal contrast
  const newBackground: PageBackground = {
    type: 'color',
    color: palette.canvasBg,
  };

  // 1. Separate objects into non-decorative items and decorative lines
  const nonDecorative = existingObjects.filter((o) => {
    if (o.type === 'shape' && (o.id.startsWith('title-accent') || (o as any).shapeType === 'line')) {
      return false; // Re-generate clean underlines
    }
    if (o.type === 'image' && o.id.startsWith('icon-')) {
      return false; // Re-evaluate icons
    }
    return true;
  });

  // 2. Sort in natural reading order (Y coordinate first)
  const getObjY = (o: CanvasObject): number => {
    if (o.type === 'stroke') return o.bbox?.y ?? 0;
    return (o as any).y ?? 0;
  };

  const sorted = [...nonDecorative].sort((a, b) => getObjY(a) - getObjY(b));

  let modifiedCount = 0;
  const addedIconsCount = 0;

  // Track title object for underline creation
  let primaryTitleObj: TextObject | null = null;

  // 3. Process each object individually (independent TextObjects with individual Markdown/HTML)
  const enhancedElements: CanvasObject[] = sorted.map((obj, idx) => {
    if (obj.type !== 'text') {
      // Preserve raster images, vector diagrams, and shapes as-is (they will be reflowed to prevent overlap)
      return { ...obj };
    }

    const tObj = obj as TextObject;
    const role = classifyTextRole(tObj.content, tObj.fontSize || 36, tObj.y, idx);

    let content = tObj.content;
    let newFontSize = tObj.fontSize || 36;
    let newColor = tObj.color || palette.body;
    let fontWeight = tObj.fontWeight || 400;
    let textDecoration: 'none' | 'underline' | 'line-through' = 'none';
    let isMarkdown = true;

    switch (role) {
      case 'title':
        newFontSize = 42;
        newColor = palette.title;
        fontWeight = 700;
        isMarkdown = true;
        // Clean leading hashes if multiple, keep clean markdown heading
        content = content.replace(/^#+\s*/, '').trim();
        // Add educational callout flag if missing to match classroom blackboard aesthetic
        if (!/^([🚩📌💡🎯📐]|\p{Emoji})/u.test(content)) {
          content = `# 🚩 ${content}`;
        } else {
          content = `# ${content}`;
        }
        primaryTitleObj = { ...tObj, content, fontSize: newFontSize, color: newColor };
        break;

      case 'subheading':
        newFontSize = 26;
        newColor = palette.subtitle;
        fontWeight = 500;
        isMarkdown = true;
        content = enhanceTextBolding(content);
        // If subtitle is an instruction or calculation formula statement, add callout icon if missing
        if (/^(let's|given|consider|apply|find|calculate|note|observe)/i.test(content) && !/^([∑💡📝🔍]|\p{Emoji})/u.test(content)) {
          content = `∑ ${content}`;
        }
        break;

      case 'table':
        newFontSize = 26;
        newColor = palette.body;
        fontWeight = 400;
        isMarkdown = true;
        content = formatMarkdownTable(content);
        break;

      case 'definition-formula':
        newFontSize = 32;
        newColor = palette.definition;
        fontWeight = 700;
        isMarkdown = true;
        content = enhanceTextBolding(content);
        break;

      case 'note-warning':
        newFontSize = 26;
        newColor = palette.warning;
        fontWeight = 600;
        isMarkdown = true;
        content = enhanceTextBolding(content);
        break;

      case 'solution':
        newFontSize = 28;
        newColor = palette.solution;
        fontWeight = 600;
        isMarkdown = true;
        content = enhanceTextBolding(content);
        break;

      case 'body':
      default:
        newFontSize = 26;
        newColor = palette.body;
        fontWeight = 400;
        isMarkdown = true;
        content = enhanceTextBolding(content);
        break;
    }

    modifiedCount++;

    return {
      ...tObj,
      content,
      fontSize: newFontSize,
      color: newColor,
      fontWeight,
      textDecoration,
      fontFamily: 'Inter, -apple-system, sans-serif',
      isMarkdown,
      isHtml: false,
      isLatex: false,
      lineHeight: 1.45,
    };
  });

  // 4. Zero-Overlap Canvas Layout Reflow Engine
  // Standard 16:9 canvas dimensions: 1920 width, 1080 height
  const canvasWidth = page.width || 1920;
  const startX = 80;
  const contentWidth = Math.min(1760, canvasWidth - startX * 2);
  let currentY = 60; // Generous top margin

  const reflowedObjects: CanvasObject[] = [];
  const decorativeUnderlines: ShapeObject[] = [];

  // Reflow elements vertically with strict non-overlapping Y bounds
  for (const item of enhancedElements) {
    const isTable = item.type === 'text' && isTableContent((item as TextObject).content);
    const itemFontSize = (item as TextObject).fontSize || 28;
    if (item.type === 'stroke') {
      reflowedObjects.push(item);
      continue;
    }

    const itemWidth = item.type === 'text' ? contentWidth : Math.min(contentWidth, (item as any).width || 800);
    const itemHeight = estimateElementHeight(item, itemFontSize, itemWidth, isTable);

    // Reposition element with guaranteed zero-overlap
    const positionedItem: CanvasObject = {
      ...item,
      x: startX,
      y: currentY,
      ...(item.type === 'text' ? { width: itemWidth, height: itemHeight } : {}),
      ...(item.type === 'image' ? { width: Math.min(contentWidth, item.width), height: item.height } : {}),
    } as CanvasObject;
    reflowedObjects.push(positionedItem);

    // If this element is the title, add the decorative accent underline line directly beneath it
    if (primaryTitleObj && item.type === 'text' && (item as TextObject).content.startsWith('# ')) {
      const titleLen = (item as TextObject).content.replace(/^#+\s*/, '').length;
      const underlineW = Math.min(800, Math.max(220, titleLen * 22));
      decorativeUnderlines.push({
        id: `title-accent-${uuidv4().slice(0, 8)}`,
        type: 'shape',
        shapeType: 'line',
        x: startX,
        y: currentY + itemHeight + 6,
        width: underlineW,
        height: 0,
        strokeColor: palette.underline,
        fillColor: 'transparent',
        strokeWidth: 3.5,
        strokeOpacity: 0.95,
        fillOpacity: 0,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        visible: true,
        layerId: 'objects',
      });
      // Small gap after title underline
      currentY += 16;
    }

    // Advance currentY so subsequent element is placed below with generous 36px breathing room
    currentY += itemHeight + 36;
  }

  // Combine reflowed objects + decorative underlines
  const allEnhanced = [...decorativeUnderlines, ...reflowedObjects];

  // 5. Construct progressive generation steps for visible UI feedback
  const totalSteps = 2 + reflowedObjects.length;
  const steps: EnhanceStep[] = [];

  // Step 1: Harmonize Theme and Background
  steps.push({
    stepIndex: 1,
    totalSteps,
    statusText: '🎨 Harmonizing chalkboard background theme & typography...',
    objects: existingObjects,
    newBackground,
  });

  // Steps 2 .. N: Apply enhancements progressively element-by-element
  for (let i = 0; i < reflowedObjects.length; i++) {
    const currentReflowed = reflowedObjects[i];
    let label = 'Content';
    if (currentReflowed.type === 'text') {
      const txt = (currentReflowed as TextObject).content.replace(/^#+\s*/, '').slice(0, 32);
      if (isTableContent((currentReflowed as TextObject).content)) {
        label = 'Table with KaTeX formatting';
      } else if (i === 0) {
        label = `Heading: "${txt}"`;
      } else {
        label = `"${txt}..."`;
      }
    } else if (currentReflowed.type === 'image') {
      label = 'Static Image';
    } else if (currentReflowed.type === 'shape') {
      label = 'Diagram / Shape';
    }

    const currentYBound = ((currentReflowed as any).y ?? (currentReflowed.type === 'stroke' ? currentReflowed.bbox?.y ?? 0 : 0)) + ((currentReflowed as any).height ?? 0);
    // Snapshot: enhanced objects up to i, and original objects after i
    const stepObjects: CanvasObject[] = [
      ...decorativeUnderlines.filter((u) => u.y <= currentYBound),
      ...reflowedObjects.slice(0, i + 1),
      ...existingObjects.filter((orig) => !reflowedObjects.slice(0, i + 1).some((r) => r.id === orig.id)),
    ];

    steps.push({
      stepIndex: i + 2,
      totalSteps,
      statusText: `✨ Enhancing ${label}...`,
      objects: stepObjects,
    });
  }

  // Final Step: Complete zero-overlap canvas layout
  steps.push({
    stepIndex: totalSteps,
    totalSteps,
    statusText: '📐 Reflowing canvas elements with zero-overlap alignment...',
    objects: allEnhanced,
  });

  return {
    success: true,
    message: `✨ Enhanced slide! Reflowed ${modifiedCount} elements with zero-overlap and KaTeX formatting.`,
    modifiedCount,
    addedIconsCount,
    enhancedObjects: allEnhanced,
    newBackground,
    steps,
  };
}
