import { describe, it, expect, beforeAll } from 'vitest';
import {
  exportNativeLesson,
  exportLessonToCsv,
  exportSelectedObjectsAsImage,
  exportPageAsImage,
  exportLessonToPdf,
} from '../src/renderer/services/documentExportService';
import { LessonDocument, Page, ShapeObject, TextObject, StrokeObject } from '../src/shared/types';

beforeAll(() => {
  if (typeof document === 'undefined') {
    (global as any).document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 1920,
            height: 1080,
            getContext: () => ({
              scale: () => {},
              save: () => {},
              restore: () => {},
              fillRect: () => {},
              beginPath: () => {},
              moveTo: () => {},
              lineTo: () => {},
              stroke: () => {},
              fill: () => {},
              rect: () => {},
              ellipse: () => {},
              arc: () => {},
              quadraticCurveTo: () => {},
              closePath: () => {},
              fillText: () => {},
              drawImage: () => {},
              translate: () => {},
              rotate: () => {},
              strokeStyle: '',
              fillStyle: '',
              lineWidth: 1,
              lineCap: 'round',
              lineJoin: 'round',
              font: '',
              textBaseline: '',
              globalAlpha: 1,
            }),
            toDataURL: (format: string) => `data:image/png;base64,mockCanvasData`,
          };
        }
        return {};
      },
    };
  }
  if (typeof Image === 'undefined') {
    (global as any).Image = class {
      onload: any;
      src = '';
      width = 100;
      height = 100;
    };
  }
});

describe('Document Export Subsystem (Section 12)', () => {
  const samplePage1: Page = {
    id: 'page-1',
    title: 'Intro to Quantum Mechanics',
    width: 1920,
    height: 1080,
    background: { type: 'grid', color: '#1a1a2e', gridSize: 40 },
    layers: [
      { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
      { id: 'objects', name: 'Shapes & Text', visible: true, locked: false, opacity: 1, order: 1 },
    ],
    objects: [
      {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rect',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        rotation: 0,
        fillColor: '#3b82f6',
        fillOpacity: 0.5,
        strokeColor: '#60a5fa',
        strokeWidth: 3,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: 'text-1',
        type: 'text',
        content: 'Wave-particle duality',
        x: 120,
        y: 130,
        width: 250,
        height: 40,
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 600,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#ffffff',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'title',
        locked: false,
        layerId: 'objects',
      } as TextObject,
    ],
  };

  const samplePage2: Page = {
    id: 'page-2',
    title: 'Wave Equation',
    width: 1920,
    height: 1080,
    background: { type: 'ruled', color: '#1a1a2e', gridSize: 36 },
    layers: [
      { id: 'drawing', name: 'Ink', visible: true, locked: false, opacity: 1, order: 0 },
    ],
    objects: [
      {
        id: 'stroke-1',
        type: 'stroke',
        points: [
          { x: 50, y: 50 },
          { x: 100, y: 150 },
          { x: 200, y: 50 },
        ],
        style: {
          penType: 'brush',
          color: '#eab308',
          width: 5,
          opacity: 1,
          smoothing: 0.5,
          pressureSensitive: true,
        },
        bbox: { x: 50, y: 50, width: 150, height: 100 },
        locked: false,
        layerId: 'drawing',
        createdAt: Date.now(),
      } as StrokeObject,
    ],
  };

  const sampleLesson: LessonDocument = {
    meta: {
      id: 'meta-123',
      title: 'Quantum Physics 101',
      subject: 'Physics',
      author: 'Dr. Feynman',
      tags: ['quantum', 'waves', 'physics'],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      version: 1,
    },
    pages: [samplePage1, samplePage2],
  };

  describe('Native Lesson Export (.sbl)', () => {
    it('generates versioned native lesson JSON preserving all editable structures', () => {
      const exportedJson = exportNativeLesson(sampleLesson);
      const parsed = JSON.parse(exportedJson);

      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.generator).toBe('SmartBoard Studio v0.1.0');
      expect(parsed.meta.title).toBe('Quantum Physics 101');
      expect(parsed.pages.length).toBe(2);
      expect(parsed.pages[0].objects[0].shapeType).toBe('rect');
      expect(parsed.pages[1].objects[0].type).toBe('stroke');
    });
  });

  describe('CSV Summary Export', () => {
    it('produces formatted CSV rows with headers and slide metrics', () => {
      const csv = exportLessonToCsv(sampleLesson);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        'Slide Index,Slide Title,Width,Height,Background Type,Object Count,Text Elements Summary'
      );
      expect(lines.length).toBe(3); // header + 2 slides

      expect(lines[1]).toContain('1,"Intro to Quantum Mechanics",1920,1080,grid,2,"Wave-particle duality"');
      expect(lines[2]).toContain('2,"Wave Equation",1920,1080,ruled,1,""');
    });
  });

  describe('PDF Multi-Page Export', () => {
    it('generates a multi-page PDF blob with progress reporting', async () => {
      const progressSteps: number[] = [];
      const blob = await exportLessonToPdf(
        sampleLesson,
        {
          pages: 'all',
          paperSize: '16:9',
          orientation: 'landscape',
          includeBackground: true,
          highResolution: false,
          addPagination: true,
        },
        (pct) => progressSteps.push(pct)
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(progressSteps.length).toBeGreaterThan(0);
      expect(progressSteps[progressSteps.length - 1]).toBe(100);
    });

    it('supports single-page PDF export', async () => {
      const blob = await exportLessonToPdf(sampleLesson, {
        pages: 'current',
        pageIndices: [0],
        paperSize: 'a4',
        orientation: 'landscape',
        includeBackground: false,
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('Image Export (PNG/JPEG)', () => {
    it('exports a page to a PNG data URL', async () => {
      const pngUrl = await exportPageAsImage(samplePage1, 'png', { scale: 1 });
      expect(pngUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('exports selected objects cropped to their bounding box', async () => {
      const pngUrl = await exportSelectedObjectsAsImage(samplePage1.objects, 1);
      expect(pngUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('returns null if no objects are provided for selection export', async () => {
      const result = await exportSelectedObjectsAsImage([], 1);
      expect(result).toBeNull();
    });
  });
});
