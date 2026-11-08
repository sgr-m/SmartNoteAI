/**
 * assetResolver.ts — Educational Presentation Asset Resolution Pipeline
 * Stage 4: AI Teaching Presentation Generator (TASK-104)
 *
 * Provides a reliable asset resolution system supporting:
 * 1. Safe SVG resolution with strict validation, sanitization, and vector aspect fitting.
 * 2. Raster asset handling (PNG, JPEG, WebP, GIF) with dimension verification.
 * 3. Structured educational placeholders for missing illustrations (anatomy, history, geography, science, tech).
 * 4. Common educational diagrams (flowcharts, logic gates, timelines, concept maps, math/science)
 *    preferring native SmartBoard vector shapes wherever supported.
 *
 * Security & Performance:
 * - Uses existing sanitizeSvg() pipeline — never executes scripts, foreignObjects, or inline handlers.
 * - Generates compact UTF-8 Data URLs instead of bloated base64 where possible.
 * - Memoizes resolved assets in an in-memory LRU-style cache to avoid duplicate parsing.
 * - Non-blocking: executes synchronously without interrupting stylus interaction.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BoundingBox,
  PlaceholderCategory,
  PlaceholderSpec,
  EducationalDiagramType,
  EducationalDiagramSpec,
  AssetResolutionOptions,
  ResolvedAssetResult,
  PresentationTheme,
} from '../../../shared/aiPresentationTypes';
import {
  CanvasObject,
  ShapeObject,
  TextObject,
  ImageObject,
  ShapeType,
} from '../../../shared/types';
import { sanitizeSvg as baseSanitizeSvg } from '../documentImportService';
import { getThemeById } from './presentationThemes';
import { createNativeShape, createNativeText } from './hybridComponentBridge';

// ─── Constants & Category Design Tokens ───────────────────────────────────────

const LAYER_OBJECTS = 'objects';

export interface CategoryThemeTokens {
  icon: string;
  name: string;
  accentColor: string;
  badgeBg: string;
}

export const PLACEHOLDER_CATEGORY_TOKENS: Record<PlaceholderCategory, CategoryThemeTokens> = {
  anatomy: {
    icon: '🫀',
    name: 'Human Anatomy & Biology',
    accentColor: '#e11d48', // Rose / Crimson
    badgeBg: '#ffe4e6',
  },
  history: {
    icon: '🏛️',
    name: 'Historical Archive & Culture',
    accentColor: '#d97706', // Amber / Antique Bronze
    badgeBg: '#fef3c7',
  },
  geography: {
    icon: '🗺️',
    name: 'Geographic Map & Terrain',
    accentColor: '#059669', // Emerald / Forest
    badgeBg: '#d1fae5',
  },
  science: {
    icon: '🔬',
    name: 'Scientific Experiment & Lab',
    accentColor: '#0284c7', // Technical Sky Blue
    badgeBg: '#e0f2fe',
  },
  technology: {
    icon: '💻',
    name: 'Technology & Computing',
    accentColor: '#6366f1', // Indigo / Cyber Violet
    badgeBg: '#e0e7ff',
  },
  mathematics: {
    icon: '📐',
    name: 'Mathematics & Geometry',
    accentColor: '#8b5cf6', // Purple
    badgeBg: '#ede9fe',
  },
  general: {
    icon: '🖼️',
    name: 'Educational Illustration',
    accentColor: '#64748b', // Slate
    badgeBg: '#f1f5f9',
  },
};

// ─── In-Memory Resolution Cache ───────────────────────────────────────────────

const resolvedAssetCache = new Map<string, ResolvedAssetResult>();
const MAX_CACHE_SIZE = 100;

function getCacheKey(type: string, key: string, bounds: BoundingBox): string {
  return `${type}:${key}:${Math.round(bounds.width)}x${Math.round(bounds.height)}`;
}

function cacheResult(cacheKey: string, result: ResolvedAssetResult): ResolvedAssetResult {
  if (resolvedAssetCache.size >= MAX_CACHE_SIZE) {
    const firstKey = resolvedAssetCache.keys().next().value;
    if (firstKey) resolvedAssetCache.delete(firstKey);
  }
  resolvedAssetCache.set(cacheKey, result);
  return result;
}

// ─── Dimension Validation & Aspect Ratio Fitting ──────────────────────────────

/**
 * Validates and clamps asset dimensions, ensuring dimensions are at least 10px
 * and not exceeding maximum limits.
 */
export function validateAssetDimensions(
  width: number,
  height: number,
  maxWidth = 1920,
  maxHeight = 1080
): { width: number; height: number; isValid: boolean; aspectRatio: number } {
  if (typeof width !== 'number' || isNaN(width) || typeof height !== 'number' || isNaN(height)) {
    return { width: 100, height: 100, isValid: false, aspectRatio: 1 };
  }

  const isValid = width > 0 && height > 0 && width <= 10000 && height <= 10000;
  const clampedW = Math.max(10, Math.min(maxWidth, Math.round(width)));
  const clampedH = Math.max(10, Math.min(maxHeight, Math.round(height)));
  const aspectRatio = clampedH > 0 ? clampedW / clampedH : 1;

  return {
    width: clampedW,
    height: clampedH,
    isValid,
    aspectRatio,
  };
}

/**
 * Calculates proportional target bounds within a container respecting fitMode.
 */
export function calculateFittedBounds(
  naturalWidth: number,
  naturalHeight: number,
  targetBounds: BoundingBox,
  fitMode: 'contain' | 'cover' | 'fill' | 'stretch' = 'contain'
): BoundingBox {
  const nw = Math.max(1, naturalWidth);
  const nh = Math.max(1, naturalHeight);
  const naturalAspect = nw / nh;

  const targetW = Math.max(10, targetBounds.width);
  const targetH = Math.max(10, targetBounds.height);
  const targetAspect = targetW / targetH;

  if (fitMode === 'fill' || fitMode === 'stretch') {
    return {
      x: targetBounds.x,
      y: targetBounds.y,
      width: targetW,
      height: targetH,
    };
  }

  // 'contain': fit within targetBounds preserving aspect ratio, centered
  let drawW = targetW;
  let drawH = targetW / naturalAspect;

  if (drawH > targetH) {
    drawH = targetH;
    drawW = targetH * naturalAspect;
  }

  drawW = Math.max(10, Math.round(drawW));
  drawH = Math.max(10, Math.round(drawH));

  const drawX = Math.round(targetBounds.x + (targetW - drawW) / 2);
  const drawY = Math.round(targetBounds.y + (targetH - drawH) / 2);

  return {
    x: drawX,
    y: drawY,
    width: drawW,
    height: drawH,
  };
}

// ─── SVG Validation & Parsing ─────────────────────────────────────────────────

export interface SvgValidationResult {
  isValid: boolean;
  error?: string;
  width?: number;
  height?: number;
  viewBox?: string;
  cleanSvg?: string;
}

/**
 * Validates and sanitizes raw SVG text, extracting dimensions and viewBox.
 */
export function validateSvg(svgString: string): SvgValidationResult {
  if (!svgString || typeof svgString !== 'string') {
    return { isValid: false, error: 'Empty or non-string SVG input' };
  }

  const trimmed = svgString.trim();
  if (!/<svg[\s\S]*?<\/svg>/i.test(trimmed)) {
    return { isValid: false, error: 'Input does not contain valid <svg> root tags' };
  }

  // Sanitize via existing pipeline
  const sanitized = baseSanitizeSvg(trimmed);
  if (!sanitized || !/<svg[\s\S]*?<\/svg>/i.test(sanitized)) {
    return { isValid: false, error: 'SVG was rejected during security sanitization' };
  }

  // Extract viewBox if present: viewBox="minX minY width height"
  const vbMatch = sanitized.match(/viewBox\s*=\s*['"]([-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+))['"]/i);
  let vbWidth: number | undefined;
  let vbHeight: number | undefined;
  let viewBox: string | undefined;

  if (vbMatch) {
    viewBox = vbMatch[1];
    const w = parseFloat(vbMatch[2]);
    const h = parseFloat(vbMatch[3]);
    if (!isNaN(w) && w > 0) vbWidth = w;
    if (!isNaN(h) && h > 0) vbHeight = h;
  }

  // Extract explicit width and height attributes if present
  const wMatch = sanitized.match(/\bwidth\s*=\s*['"]([\d.]+)(?:px)?['"]/i);
  const hMatch = sanitized.match(/\bheight\s*=\s*['"]([\d.]+)(?:px)?['"]/i);
  let width = wMatch ? parseFloat(wMatch[1]) : vbWidth;
  let height = hMatch ? parseFloat(hMatch[1]) : vbHeight;

  if (!width || isNaN(width) || width <= 0) width = 800;
  if (!height || isNaN(height) || height <= 0) height = 600;

  return {
    isValid: true,
    width,
    height,
    viewBox,
    cleanSvg: sanitized,
  };
}

// ─── SVG Asset Resolution ─────────────────────────────────────────────────────

export type SvgAssetInput =
  | string
  | {
      svgContent?: string;
      dataUrl?: string;
      name?: string;
      title?: string;
    };

/**
 * Resolves an SVG asset safely into a native ImageObject.
 * Guarantees sanitization, proportional scaling within bounds, and fallback to placeholder on error.
 */
export function resolveSvgAsset(
  input: SvgAssetInput,
  bounds: BoundingBox,
  options?: AssetResolutionOptions
): ResolvedAssetResult {
  let rawSvg = '';
  let assetName = 'vector-diagram.svg';

  if (typeof input === 'string') {
    if (input.startsWith('data:image/svg+xml')) {
      // Decode data URL to raw SVG
      try {
        const commaIdx = input.indexOf(',');
        const payload = input.slice(commaIdx + 1);
        rawSvg = input.includes(';base64') ? atob(payload) : decodeURIComponent(payload);
      } catch {
        rawSvg = '';
      }
    } else {
      rawSvg = input;
    }
  } else if (input && typeof input === 'object') {
    rawSvg = input.svgContent || '';
    if (!rawSvg && input.dataUrl && input.dataUrl.startsWith('data:image/svg+xml')) {
      try {
        const commaIdx = input.dataUrl.indexOf(',');
        const payload = input.dataUrl.slice(commaIdx + 1);
        rawSvg = input.dataUrl.includes(';base64') ? atob(payload) : decodeURIComponent(payload);
      } catch {
        rawSvg = '';
      }
    }
    if (input.name) assetName = input.name;
    if (input.title) assetName = `${input.title}.svg`;
  }

  // Check cache
  const cacheKey = getCacheKey('svg', rawSvg.slice(0, 100) + rawSvg.length, bounds);
  const cached = resolvedAssetCache.get(cacheKey);
  if (cached) return cached;

  const validation = validateSvg(rawSvg);
  if (!validation.isValid || !validation.cleanSvg) {
    if (options?.placeholderOnFailure !== false) {
      const ph = createImagePlaceholder(
        {
          category: options?.fallbackCategory || 'general',
          title: options?.fallbackTitle || 'Vector Illustration',
          description: validation.error || 'Invalid or untrusted SVG graphic',
          theme: options?.theme,
        },
        bounds
      );
      return cacheResult(cacheKey, {
        object: ph,
        isSanitized: true,
        naturalWidth: bounds.width,
        naturalHeight: bounds.height,
        bounds,
        isValid: false,
        assetType: 'placeholder',
        errorMessage: validation.error,
      });
    }

    // Return empty placeholder object with isValid: false
    const fallbackObj: ImageObject = {
      id: uuidv4(),
      type: 'image',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      filePath: assetName,
      dataUrl: '',
      opacity: 0,
      locked: false,
      visible: false,
      layerId: options?.defaultLayerId || LAYER_OBJECTS,
    };
    return cacheResult(cacheKey, {
      object: fallbackObj,
      isSanitized: false,
      naturalWidth: 0,
      naturalHeight: 0,
      bounds,
      isValid: false,
      assetType: 'svg',
      errorMessage: validation.error,
    });
  }

  const naturalW = validation.width || 800;
  const naturalH = validation.height || 600;
  const fittedBounds = calculateFittedBounds(naturalW, naturalH, bounds, options?.fitMode || 'contain');

  // Produce UTF-8 encoded Data URL (33% smaller than base64)
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(validation.cleanSvg)}`;

  const imageObj: ImageObject = {
    id: uuidv4(),
    type: 'image',
    x: fittedBounds.x,
    y: fittedBounds.y,
    width: fittedBounds.width,
    height: fittedBounds.height,
    rotation: 0,
    filePath: assetName,
    dataUrl,
    opacity: 1,
    locked: false,
    visible: true,
    layerId: options?.defaultLayerId || LAYER_OBJECTS,
  };

  return cacheResult(cacheKey, {
    object: imageObj,
    isSanitized: true,
    naturalWidth: naturalW,
    naturalHeight: naturalH,
    bounds: fittedBounds,
    isValid: true,
    assetType: 'svg',
    mimeType: 'image/svg+xml',
  });
}

// ─── Raster Asset Resolution ──────────────────────────────────────────────────

export type RasterAssetInput =
  | string
  | {
      dataUrl?: string;
      filePath?: string;
      mimeType?: string;
      name?: string;
      naturalWidth?: number;
      naturalHeight?: number;
    };

/**
 * Validates whether a MIME type or file extension is supported for raster rendering.
 */
export function isSupportedRasterFormat(dataUrlOrPath: string): { isSupported: boolean; mimeType?: string } {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== 'string') {
    return { isSupported: false };
  }

  const str = dataUrlOrPath.toLowerCase();

  if (str.startsWith('data:image/png')) return { isSupported: true, mimeType: 'image/png' };
  if (str.startsWith('data:image/jpeg') || str.startsWith('data:image/jpg'))
    return { isSupported: true, mimeType: 'image/jpeg' };
  if (str.startsWith('data:image/webp')) return { isSupported: true, mimeType: 'image/webp' };
  if (str.startsWith('data:image/gif')) return { isSupported: true, mimeType: 'image/gif' };

  if (str.endsWith('.png')) return { isSupported: true, mimeType: 'image/png' };
  if (str.endsWith('.jpg') || str.endsWith('.jpeg')) return { isSupported: true, mimeType: 'image/jpeg' };
  if (str.endsWith('.webp')) return { isSupported: true, mimeType: 'image/webp' };
  if (str.endsWith('.gif')) return { isSupported: true, mimeType: 'image/gif' };

  return { isSupported: false };
}

/**
 * Resolves a raster image (PNG, JPEG, WebP, GIF) safely into a native ImageObject.
 */
export function resolveRasterAsset(
  input: RasterAssetInput,
  bounds: BoundingBox,
  options?: AssetResolutionOptions
): ResolvedAssetResult {
  let dataUrl = '';
  let filePath = '';
  let naturalW = 800;
  let naturalH = 600;

  if (typeof input === 'string') {
    if (input.startsWith('data:image/')) {
      dataUrl = input;
    } else {
      filePath = input;
    }
  } else if (input && typeof input === 'object') {
    dataUrl = input.dataUrl || '';
    filePath = input.filePath || input.name || '';
    if (input.naturalWidth && input.naturalWidth > 0) naturalW = input.naturalWidth;
    if (input.naturalHeight && input.naturalHeight > 0) naturalH = input.naturalHeight;
  }

  const formatCheck = isSupportedRasterFormat(dataUrl || filePath);
  const cacheKey = getCacheKey('raster', (dataUrl || filePath).slice(0, 100), bounds);
  const cached = resolvedAssetCache.get(cacheKey);
  if (cached) return cached;

  if (!formatCheck.isSupported) {
    if (options?.placeholderOnFailure !== false) {
      const ph = createImagePlaceholder(
        {
          category: options?.fallbackCategory || 'general',
          title: options?.fallbackTitle || 'Raster Image Asset',
          description: 'Unsupported image format. Please supply PNG, JPEG, or WebP.',
          theme: options?.theme,
        },
        bounds
      );
      return cacheResult(cacheKey, {
        object: ph,
        isSanitized: true,
        naturalWidth: bounds.width,
        naturalHeight: bounds.height,
        bounds,
        isValid: false,
        assetType: 'placeholder',
        errorMessage: 'Unsupported image format',
      });
    }

    const invalidObj: ImageObject = {
      id: uuidv4(),
      type: 'image',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      filePath,
      dataUrl,
      opacity: 0,
      locked: false,
      visible: false,
      layerId: options?.defaultLayerId || LAYER_OBJECTS,
    };
    return cacheResult(cacheKey, {
      object: invalidObj,
      isSanitized: true,
      naturalWidth: naturalW,
      naturalHeight: naturalH,
      bounds,
      isValid: false,
      assetType: 'raster',
      errorMessage: 'Unsupported image format',
    });
  }

  const fittedBounds = calculateFittedBounds(naturalW, naturalH, bounds, options?.fitMode || 'contain');

  const imageObj: ImageObject = {
    id: uuidv4(),
    type: 'image',
    x: fittedBounds.x,
    y: fittedBounds.y,
    width: fittedBounds.width,
    height: fittedBounds.height,
    rotation: 0,
    filePath,
    dataUrl,
    opacity: 1,
    locked: false,
    visible: true,
    layerId: options?.defaultLayerId || LAYER_OBJECTS,
  };

  return cacheResult(cacheKey, {
    object: imageObj,
    isSanitized: true,
    naturalWidth: naturalW,
    naturalHeight: naturalH,
    bounds: fittedBounds,
    isValid: true,
    assetType: 'raster',
    mimeType: formatCheck.mimeType,
  });
}

// ─── Educational Image Placeholders ───────────────────────────────────────────

/**
 * Creates a high-fidelity, projector-optimized educational vector placeholder.
 * Communicates the intended subject matter and remains readily replaceable by teachers.
 */
export function createImagePlaceholder(
  spec: PlaceholderSpec,
  bounds: BoundingBox,
  options?: { defaultLayerId?: string; theme?: PresentationTheme }
): ImageObject {
  const category = spec.category || 'general';
  const tokens = PLACEHOLDER_CATEGORY_TOKENS[category] || PLACEHOLDER_CATEGORY_TOKENS.general;
  const theme = spec.theme || options?.theme || getThemeById('modern-academic');

  const width = Math.max(120, Math.round(bounds.width));
  const height = Math.max(80, Math.round(bounds.height));
  const icon = spec.customIcon || tokens.icon;
  const title = spec.title || tokens.name;
  const desc = spec.description || 'Illustration placeholder for instructional presentation';
  const instruction = spec.instructions || 'Click or drag & drop image to replace';
  const accent = tokens.accentColor;
  const bg = theme.isDark ? '#0f172a' : '#f8fafc';
  const cardBorder = theme.isDark ? '#334155' : '#cbd5e1';
  const textMain = theme.isDark ? '#f8fafc' : '#1e293b';
  const textSub = theme.isDark ? '#94a3b8' : '#64748b';

  // Generate responsive, vector-sharp SVG
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="grid_${width}" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${theme.isDark ? '#1e293b' : '#f1f5f9'}" stroke-width="1"/>
        </pattern>
        <linearGradient id="grad_${width}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="100%" stop-color="${theme.isDark ? '#090d16' : '#e2e8f0'}" />
        </linearGradient>
      </defs>

      <!-- Background card -->
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="12" fill="url(#grad_${width})" stroke="${cardBorder}" stroke-width="1.5"/>
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="12" fill="url(#grid_${width})" />

      <!-- Dashed Accent Inset -->
      <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="8" fill="none" stroke="${accent}" stroke-width="1.8" stroke-dasharray="6,4" stroke-opacity="0.7"/>

      <!-- Center Icon Badge -->
      <g transform="translate(${width / 2}, ${Math.max(36, height * 0.32)})">
        <circle cx="0" cy="0" r="26" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
        <text x="0" y="8" font-size="24" text-anchor="middle">${icon}</text>
      </g>

      <!-- Category Label Pill -->
      <g transform="translate(${width / 2}, ${Math.max(76, height * 0.52)})">
        <rect x="-80" y="-12" width="160" height="22" rx="11" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-width="1"/>
        <text x="0" y="3" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="0.8">
          ${tokens.name.toUpperCase()}
        </text>
      </g>

      <!-- Title Text -->
      <text x="${width / 2}" y="${Math.max(106, height * 0.68)}" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="700" fill="${textMain}" text-anchor="middle">
        ${title}
      </text>

      <!-- Description / Hint -->
      <text x="${width / 2}" y="${Math.max(126, height * 0.80)}" font-family="Inter, system-ui, sans-serif" font-size="12" fill="${textSub}" text-anchor="middle">
        ${desc}
      </text>

      <!-- Instruction Badge -->
      <text x="${width / 2}" y="${Math.max(144, height * 0.90)}" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="500" fill="${accent}" text-anchor="middle">
        ⚡ ${instruction}
      </text>

      <!-- Dimensions Pill (top right) -->
      <g transform="translate(${width - 80}, 24)">
        <rect x="0" y="-10" width="66" height="18" rx="4" fill="${theme.isDark ? '#1e293b' : '#e2e8f0'}" fill-opacity="0.9"/>
        <text x="33" y="3" font-family="monospace" font-size="10" fill="${textSub}" text-anchor="middle">
          ${width}×${height}
        </text>
      </g>
    </svg>
  `.trim();

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

  return {
    id: uuidv4(),
    type: 'image',
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width,
    height,
    rotation: 0,
    filePath: `placeholder:${category}:${title.replace(/\s+/g, '-').toLowerCase()}`,
    dataUrl,
    opacity: 1,
    locked: false,
    visible: true,
    layerId: options?.defaultLayerId || LAYER_OBJECTS,
  };
}

// ─── Educational Diagrams Resolution ──────────────────────────────────────────

/**
 * Resolves structured educational diagrams (flowcharts, logic gates, timelines,
 * concept maps, circuits, and math planes).
 * Uses native vector objects where available; falls back to sanitized SVG or structured placeholders.
 */
export function resolveEducationalDiagram(
  spec: EducationalDiagramSpec,
  bounds: BoundingBox,
  theme: PresentationTheme
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const type = spec.type || 'flowchart';

  // 1. If explicit SVG content is provided, resolve as vector asset
  if (spec.svgContent) {
    const resolved = resolveSvgAsset(spec.svgContent, bounds, { theme });
    if (resolved.isValid) {
      return [resolved.object];
    }
  }

  // 2. Logic Gate Diagrams
  if (type === 'logic-gate') {
    const gateType = spec.gateType || 'AND';
    const gateShape = createNativeShape({
      shapeType: 'logicGate',
      x: bounds.x + 20,
      y: bounds.y + 20,
      width: Math.min(240, bounds.width - 40),
      height: Math.min(160, bounds.height - 40),
      strokeColor: theme.accentColor,
      strokeWidth: 2,
      params: {
        gateType,
        ...spec.params,
      },
    });

    const titleText = createNativeText({
      content: spec.title || `${gateType} Logic Gate`,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: 24,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 16,
      fontWeight: 700,
      color: theme.primaryText,
      preset: 'heading',
    });

    return [titleText, gateShape];
  }

  // 3. Mathematical Coordinate Plane / Axes
  if (type === 'mathematical') {
    const mathType = spec.mathType || 'axes';
    if (mathType === 'axes') {
      const axesShape = createNativeShape({
        shapeType: 'cartesianAxes',
        x: bounds.x,
        y: bounds.y + 30,
        width: bounds.width,
        height: Math.max(100, bounds.height - 30),
        strokeColor: theme.accentColor,
        strokeWidth: 2,
        fillColor: theme.cardBackground,
        params: {
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          step: 1,
          ...spec.params,
        },
      });

      const titleObj = createNativeText({
        content: spec.title || 'Cartesian Coordinate Plane (X-Y)',
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: 24,
        fontFamily: theme.typography.fontFamilyHeading,
        fontSize: 16,
        fontWeight: 700,
        color: theme.primaryText,
      });

      return [titleObj, axesShape];
    }
  }

  // 4. Science / Circuit Components
  if (type === 'scientific' && spec.scienceType === 'circuit') {
    const circuitShape = createNativeShape({
      shapeType: 'circuitComponent',
      x: bounds.x + 20,
      y: bounds.y + 30,
      width: bounds.width - 40,
      height: Math.max(80, bounds.height - 40),
      strokeColor: theme.accentColor,
      strokeWidth: 2,
      params: {
        componentType: 'resistor',
        ...spec.params,
      },
    });

    const titleObj = createNativeText({
      content: spec.title || 'Circuit Schematic Component',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: 24,
      fontFamily: theme.typography.fontFamilyHeading,
      fontSize: 16,
      fontWeight: 700,
      color: theme.primaryText,
    });

    return [titleObj, circuitShape];
  }

  // 5. Flowchart / Process Diagram (Native Vector Sequence)
  if (type === 'flowchart' || type === 'process') {
    const nodes = spec.nodes || [
      { id: 'start', label: 'Start', shape: 'roundedRect' },
      { id: 'process', label: 'Process Step', shape: 'rect' },
      { id: 'end', label: 'Finish', shape: 'roundedRect' },
    ];

    const padding = 16;
    const titleH = spec.title ? 32 : 0;
    if (spec.title) {
      objects.push(
        createNativeText({
          content: spec.title,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: 26,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 16,
          fontWeight: 700,
          color: theme.primaryText,
        })
      );
    }

    const availableW = bounds.width - padding * 2;
    const nodeCount = nodes.length;
    const nodeW = Math.max(80, Math.min(160, Math.round((availableW - (nodeCount - 1) * 36) / nodeCount)));
    const nodeH = Math.min(60, Math.max(40, bounds.height - titleH - padding * 2));
    const centerY = bounds.y + titleH + Math.round((bounds.height - titleH - nodeH) / 2);
    const gap = (availableW - nodeCount * nodeW) / Math.max(1, nodeCount - 1);

    nodes.forEach((node, idx) => {
      const nodeX = Math.round(bounds.x + padding + idx * (nodeW + gap));
      const shapeType: ShapeType = node.shape === 'circle' ? 'circle' : 'roundedRect';

      // Node Shape
      objects.push(
        createNativeShape({
          shapeType,
          x: nodeX,
          y: centerY,
          width: nodeW,
          height: nodeH,
          fillColor: node.color || theme.cardBackground,
          fillOpacity: 0.9,
          strokeColor: theme.accentColor,
          strokeWidth: 2,
        })
      );

      // Node Label
      objects.push(
        createNativeText({
          content: node.label,
          x: nodeX + 4,
          y: centerY + Math.round(nodeH / 2) - 10,
          width: nodeW - 8,
          height: 20,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 13,
          fontWeight: 600,
          color: theme.primaryText,
          textAlign: 'center',
        })
      );

      // Connecting Arrow to next node
      if (idx < nodeCount - 1) {
        const arrowX = nodeX + nodeW + 4;
        const arrowW = Math.max(12, gap - 8);
        objects.push(
          createNativeShape({
            shapeType: 'arrow',
            x: arrowX,
            y: centerY + Math.round(nodeH / 2) - 4,
            width: arrowW,
            height: 8,
            fillColor: theme.accentColor,
            strokeColor: theme.accentColor,
            strokeWidth: 1.5,
          })
        );
      }
    });

    return objects;
  }

  // 6. Default Fallback: Generate Educational Placeholder
  const categoryMap: Record<EducationalDiagramType, PlaceholderCategory> = {
    flowchart: 'technology',
    process: 'technology',
    timeline: 'history',
    'concept-map': 'general',
    scientific: 'science',
    mathematical: 'mathematics',
    'computer-science': 'technology',
    'logic-gate': 'technology',
  };

  const ph = createImagePlaceholder(
    {
      category: categoryMap[type] || 'general',
      title: spec.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Diagram`,
      description: spec.subtitle || 'Instructional educational diagram',
      theme,
    },
    bounds
  );

  return [ph];
}

