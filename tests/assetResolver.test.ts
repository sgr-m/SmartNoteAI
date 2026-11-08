/**
 * assetResolver.test.ts — Unit tests for Educational Asset Resolver Pipeline
 * TASK-104 Verification
 */

import { describe, it, expect } from 'vitest';
import {
  validateAssetDimensions,
  calculateFittedBounds,
  validateSvg,
  resolveSvgAsset,
  resolveRasterAsset,
  isSupportedRasterFormat,
  createImagePlaceholder,
  resolveEducationalDiagram,
  PLACEHOLDER_CATEGORY_TOKENS,
} from '../src/renderer/services/aiPresentation/assetResolver';
import {
  MODERN_ACADEMIC_THEME,
  DARK_TECHNOLOGY_THEME,
} from '../src/renderer/services/aiPresentation/presentationThemes';
import { BoundingBox, PlaceholderCategory } from '../src/shared/aiPresentationTypes';
import { ShapeObject, ImageObject, TextObject } from '../src/shared/types';

describe('TASK-104: Asset Resolver Pipeline', () => {
  const containerBounds: BoundingBox = { x: 100, y: 100, width: 600, height: 400 };
  const theme = MODERN_ACADEMIC_THEME;

  describe('1. Dimension Validation & Aspect Ratio Fitting', () => {
    it('validates and clamps valid dimensions', () => {
      const res = validateAssetDimensions(800, 600);
      expect(res.isValid).toBe(true);
      expect(res.width).toBe(800);
      expect(res.height).toBe(600);
      expect(res.aspectRatio).toBeCloseTo(800 / 600);
    });

    it('clamps minimum dimensions to at least 10px', () => {
      const res = validateAssetDimensions(2, -5);
      expect(res.width).toBe(10);
      expect(res.height).toBe(10);
      expect(res.isValid).toBe(false);
    });

    it('clamps maximum dimensions within limits', () => {
      const res = validateAssetDimensions(2500, 1500, 1920, 1080);
      expect(res.width).toBe(1920);
      expect(res.height).toBe(1080);
    });

    it('fits wide natural asset proportionally in contain mode', () => {
      // 16:9 asset (1600x900) into 600x400 container
      const fitted = calculateFittedBounds(1600, 900, containerBounds, 'contain');
      expect(fitted.width).toBe(600);
      expect(fitted.height).toBe(Math.round(600 / (16 / 9))); // 338
      // Must be vertically centered inside container
      expect(fitted.y).toBe(containerBounds.y + Math.round((400 - fitted.height) / 2));
    });

    it('fits tall natural asset proportionally in contain mode', () => {
      // 1:2 portrait asset (400x800) into 600x400 container
      const fitted = calculateFittedBounds(400, 800, containerBounds, 'contain');
      expect(fitted.height).toBe(400);
      expect(fitted.width).toBe(200);
      // Must be horizontally centered inside container
      expect(fitted.x).toBe(containerBounds.x + Math.round((600 - 200) / 2));
    });

    it('returns exact container bounds in fill/stretch mode', () => {
      const fitted = calculateFittedBounds(400, 800, containerBounds, 'fill');
      expect(fitted.x).toBe(containerBounds.x);
      expect(fitted.y).toBe(containerBounds.y);
      expect(fitted.width).toBe(containerBounds.width);
      expect(fitted.height).toBe(containerBounds.height);
    });
  });

  describe('2. SVG Validation & Sanitization', () => {
    it('validates well-formed SVG and extracts natural dimensions', () => {
      const validSvg = `<svg width="500" height="300" viewBox="0 0 500 300"><circle cx="250" cy="150" r="100" fill="red"/></svg>`;
      const res = validateSvg(validSvg);

      expect(res.isValid).toBe(true);
      expect(res.width).toBe(500);
      expect(res.height).toBe(300);
      expect(res.viewBox).toBe('0 0 500 300');
      expect(res.cleanSvg).toContain('<circle');
    });

    it('extracts dimensions from viewBox if width/height are omitted', () => {
      const viewBoxSvg = `<svg viewBox="0 0 1024 768"><path d="M 0 0 L 100 100"/></svg>`;
      const res = validateSvg(viewBoxSvg);

      expect(res.isValid).toBe(true);
      expect(res.width).toBe(1024);
      expect(res.height).toBe(768);
    });

    it('strictly sanitizes SVG by stripping script tags, handlers, and javascript URLs', () => {
      const dangerousSvg = `
        <svg viewBox="0 0 100 100">
          <script>window.pwned = true;</script>
          <rect width="100" height="100" fill="blue" onclick="evil()" onmouseover="bad()"/>
          <a href="javascript:attack()"><text x="10" y="20">Click</text></a>
        </svg>
      `;

      const res = validateSvg(dangerousSvg);
      expect(res.isValid).toBe(true);
      expect(res.cleanSvg).not.toContain('<script');
      expect(res.cleanSvg).not.toContain('onclick');
      expect(res.cleanSvg).not.toContain('onmouseover');
      expect(res.cleanSvg).not.toContain('javascript:');
      expect(res.cleanSvg).toContain('<rect');
    });

    it('rejects invalid, malformed, or non-SVG content', () => {
      expect(validateSvg('').isValid).toBe(false);
      expect(validateSvg('<div>Not an SVG</div>').isValid).toBe(false);
      expect(validateSvg(null as any).isValid).toBe(false);
    });
  });

  describe('3. SVG Asset Resolution', () => {
    it('resolves valid SVG into an ImageObject with Data URL and fitted bounds', () => {
      const svg = `<svg width="400" height="200"><rect width="400" height="200" fill="green"/></svg>`;
      const res = resolveSvgAsset(svg, containerBounds);

      expect(res.isValid).toBe(true);
      expect(res.assetType).toBe('svg');
      expect(res.isSanitized).toBe(true);
      expect(res.mimeType).toBe('image/svg+xml');

      const img = res.object as ImageObject;
      expect(img.type).toBe('image');
      expect(img.dataUrl).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
      expect(img.width).toBe(600);
      expect(img.height).toBe(300); // 2:1 aspect ratio inside 600x400 container
    });

    it('accepts SVG asset objects with name and title descriptors', () => {
      const res = resolveSvgAsset(
        {
          svgContent: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>`,
          title: 'Cellular Mitosis Stage',
        },
        containerBounds
      );

      expect(res.isValid).toBe(true);
      const img = res.object as ImageObject;
      expect(img.filePath).toBe('Cellular Mitosis Stage.svg');
    });

    it('falls back to structured placeholder on invalid SVG when placeholderOnFailure is true', () => {
      const res = resolveSvgAsset('broken svg text', containerBounds, {
        placeholderOnFailure: true,
        fallbackCategory: 'science',
        fallbackTitle: 'Lab Apparatus Diagram',
      });

      expect(res.isValid).toBe(false);
      expect(res.assetType).toBe('placeholder');
      const img = res.object as ImageObject;
      expect(img.dataUrl).toContain('data:image/svg+xml');
      expect(img.filePath).toContain('placeholder:science');
    });
  });

  describe('4. Raster Asset Resolution', () => {
    it('detects supported raster image formats (PNG, JPEG, WebP, GIF)', () => {
      expect(isSupportedRasterFormat('data:image/png;base64,ABC').isSupported).toBe(true);
      expect(isSupportedRasterFormat('data:image/jpeg;base64,XYZ').isSupported).toBe(true);
      expect(isSupportedRasterFormat('data:image/webp;base64,123').isSupported).toBe(true);
      expect(isSupportedRasterFormat('data:image/gif;base64,GIF').isSupported).toBe(true);
      expect(isSupportedRasterFormat('photo.png').isSupported).toBe(true);
      expect(isSupportedRasterFormat('photo.jpg').isSupported).toBe(true);
      expect(isSupportedRasterFormat('photo.webp').isSupported).toBe(true);

      // Unsupported
      expect(isSupportedRasterFormat('file.bmp').isSupported).toBe(false);
      expect(isSupportedRasterFormat('file.exe').isSupported).toBe(false);
      expect(isSupportedRasterFormat('file.pdf').isSupported).toBe(false);
    });

    it('resolves valid PNG data URL with proportional scaling', () => {
      const pngData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = resolveRasterAsset(
        {
          dataUrl: pngData,
          name: 'microscope-slide.png',
          naturalWidth: 400,
          naturalHeight: 300,
        },
        containerBounds
      );

      expect(res.isValid).toBe(true);
      expect(res.assetType).toBe('raster');
      expect(res.mimeType).toBe('image/png');

      const img = res.object as ImageObject;
      expect(img.type).toBe('image');
      expect(img.dataUrl).toBe(pngData);
      expect(img.width).toBe(533); // 4:3 fit into 600x400
      expect(img.height).toBe(400);
    });

    it('falls back to placeholder on unsupported raster formats', () => {
      const res = resolveRasterAsset('corrupt-file.bmp', containerBounds, {
        placeholderOnFailure: true,
        fallbackCategory: 'technology',
        fallbackTitle: 'Microprocessor Architecture',
      });

      expect(res.isValid).toBe(false);
      expect(res.assetType).toBe('placeholder');
      const img = res.object as ImageObject;
      expect(img.filePath).toContain('placeholder:technology');
    });
  });

  describe('5. Educational Image Placeholders', () => {
    const categories: PlaceholderCategory[] = [
      'anatomy',
      'history',
      'geography',
      'science',
      'technology',
      'mathematics',
      'general',
    ];

    it.each(categories)('generates valid vector placeholder for category: %s', (category) => {
      const tokens = PLACEHOLDER_CATEGORY_TOKENS[category];
      const ph = createImagePlaceholder(
        {
          category,
          title: `${category.toUpperCase()} Illustration`,
          description: `Educational reference asset for ${category}`,
          theme,
        },
        containerBounds
      );

      expect(ph.type).toBe('image');
      expect(ph.width).toBe(containerBounds.width);
      expect(ph.height).toBe(containerBounds.height);
      expect(ph.filePath).toContain(`placeholder:${category}`);
      expect(ph.dataUrl).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);

      // Decode SVG and verify contents
      const decodedSvg = decodeURIComponent(ph.dataUrl!.replace('data:image/svg+xml;charset=utf-8,', ''));
      expect(decodedSvg).toContain(tokens.icon);
      expect(decodedSvg).toContain(tokens.name.toUpperCase());
      expect(decodedSvg).toContain('replace');
    });

    it('respects dark theme colors in placeholder SVG generation', () => {
      const darkTheme = DARK_TECHNOLOGY_THEME;
      const ph = createImagePlaceholder(
        {
          category: 'technology',
          title: 'Quantum Chipset',
          theme: darkTheme,
        },
        containerBounds
      );

      const decodedSvg = decodeURIComponent(ph.dataUrl!.replace('data:image/svg+xml;charset=utf-8,', ''));
      expect(decodedSvg).toContain('#0f172a'); // Dark slate background stop
    });
  });

  describe('6. Educational Diagrams Resolution', () => {
    it('compiles native flowchart sequence with nodes, labels, and connecting arrows', () => {
      const diagram = resolveEducationalDiagram(
        {
          type: 'flowchart',
          title: 'Algorithm Execution Flow',
          nodes: [
            { id: '1', label: 'Input Data', shape: 'roundedRect' },
            { id: '2', label: 'Transform Vector', shape: 'rect' },
            { id: '3', label: 'Output Result', shape: 'roundedRect' },
          ],
        },
        containerBounds,
        theme
      );

      // Title + 3 Node Shapes + 3 Node Labels + 2 Connecting Arrows = 9 objects
      expect(diagram.length).toBeGreaterThanOrEqual(7);

      const titleObj = diagram.find((o) => o.type === 'text' && (o as TextObject).content === 'Algorithm Execution Flow');
      expect(titleObj).toBeDefined();

      const arrows = diagram.filter((o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'arrow');
      expect(arrows).toHaveLength(2);

      const step1 = diagram.find((o) => o.type === 'text' && (o as TextObject).content === 'Input Data');
      expect(step1).toBeDefined();
    });

    it('compiles native logic gate diagram with title and gate shape', () => {
      const diagram = resolveEducationalDiagram(
        {
          type: 'logic-gate',
          title: 'NAND Logic Gate',
          gateType: 'NAND',
        },
        containerBounds,
        theme
      );

      expect(diagram.length).toBe(2);
      const titleObj = diagram[0] as TextObject;
      expect(titleObj.content).toBe('NAND Logic Gate');

      const gateShape = diagram[1] as ShapeObject;
      expect(gateShape.shapeType).toBe('logicGate');
      expect(gateShape.params?.gateType).toBe('NAND');
    });

    it('compiles native mathematical coordinate plane with cartesianAxes shape', () => {
      const diagram = resolveEducationalDiagram(
        {
          type: 'mathematical',
          mathType: 'axes',
          title: 'Trigonometric Unit Circle Axes',
        },
        containerBounds,
        theme
      );

      expect(diagram.length).toBe(2);
      const axesShape = diagram.find((o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'cartesianAxes') as ShapeObject;
      expect(axesShape).toBeDefined();
      expect(axesShape.params?.xMin).toBe(-5);
      expect(axesShape.params?.xMax).toBe(5);
    });

    it('compiles native circuit component diagram for electrical science', () => {
      const diagram = resolveEducationalDiagram(
        {
          type: 'scientific',
          scienceType: 'circuit',
          title: 'Series Resistor Circuit',
        },
        containerBounds,
        theme
      );

      expect(diagram.length).toBe(2);
      const circuitShape = diagram.find((o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'circuitComponent') as ShapeObject;
      expect(circuitShape).toBeDefined();
      expect(circuitShape.params?.componentType).toBe('resistor');
    });

    it('resolves raw SVG diagram when provided in diagram spec', () => {
      const svg = `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="purple"/></svg>`;
      const diagram = resolveEducationalDiagram(
        {
          type: 'concept-map',
          svgContent: svg,
        },
        containerBounds,
        theme
      );

      expect(diagram).toHaveLength(1);
      const img = diagram[0] as ImageObject;
      expect(img.type).toBe('image');
      expect(img.dataUrl).toContain('data:image/svg+xml');
    });

    it('falls back to educational placeholder for unhandled diagram types', () => {
      const diagram = resolveEducationalDiagram(
        {
          type: 'timeline' as any,
          title: 'Historical Timeline Sequence',
        },
        containerBounds,
        theme
      );

      expect(diagram).toHaveLength(1);
      const img = diagram[0] as ImageObject;
      expect(img.type).toBe('image');
      expect(img.filePath).toContain('placeholder:history');
    });
  });

  describe('7. Serialization & Caching', () => {
    it('produces JSON-serializable ImageObject instances matching DocumentStore schema', () => {
      const svg = `<svg viewBox="0 0 100 100"><rect width="100" height="100"/></svg>`;
      const res = resolveSvgAsset(svg, containerBounds);
      const json = JSON.stringify(res.object);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('image');
      expect(parsed.dataUrl).toBeDefined();
      expect(parsed.x).toBeTypeOf('number');
      expect(parsed.y).toBeTypeOf('number');
      expect(parsed.width).toBeTypeOf('number');
      expect(parsed.height).toBeTypeOf('number');
      expect(parsed.layerId).toBe('objects');
    });

    it('returns memoized result for identical SVG input and dimensions', () => {
      const svg = `<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20"/></svg>`;
      const first = resolveSvgAsset(svg, containerBounds);
      const second = resolveSvgAsset(svg, containerBounds);

      expect(first).toBe(second); // Exact same object reference from cache
    });
  });
});

