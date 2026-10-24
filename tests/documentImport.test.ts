import { describe, it, expect } from 'vitest';
import {
  sanitizeSvg,
  createImageObject,
  convertDocumentPagesToSmartboardPages,
  ImportedDocumentPage,
} from '../src/renderer/services/documentImportService';

describe('Document Import Subsystem (Section 11)', () => {
  describe('SVG Sanitization (Section 11.3)', () => {
    it('strips script tags from untrusted SVG', () => {
      const maliciousSvg = '<svg><script>alert("hack")</script><rect width="100" height="100"/></svg>';
      const sanitized = sanitizeSvg(maliciousSvg);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert("hack")');
      expect(sanitized).toContain('<rect width="100" height="100"/>');
    });

    it('strips inline on* event handlers', () => {
      const maliciousSvg = '<circle cx="50" cy="50" r="40" onload="doEvil()" onclick=\'evilClick()\' />';
      const sanitized = sanitizeSvg(maliciousSvg);
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('doEvil()');
      expect(sanitized).toContain('cx="50"');
    });

    it('neutralizes javascript: URLs in hyperlinks', () => {
      const maliciousSvg = '<a href="javascript:stealTokens()"><text>Click me</text></a>';
      const sanitized = sanitizeSvg(maliciousSvg);
      expect(sanitized).not.toContain('javascript:stealTokens()');
      expect(sanitized).toContain('href="#"');
    });
  });

  describe('Image Object Creation (Section 11.3)', () => {
    it('creates an ImageObject preserving aspect ratio within bounds', () => {
      const imgObj = createImageObject(
        'data:image/png;base64,mockImageData',
        'diagram.png',
        200,
        150,
        800,
        600,
        1600,
        1200
      );

      expect(imgObj.type).toBe('image');
      expect(imgObj.x).toBe(200);
      expect(imgObj.y).toBe(150);
      expect(imgObj.width).toBe(800);
      expect(imgObj.height).toBe(600);
      expect(imgObj.layerId).toBe('imported-media');
      expect(imgObj.filePath).toBe('diagram.png');
      expect(imgObj.dataUrl).toBe('data:image/png;base64,mockImageData');
      expect(imgObj.rotation).toBe(0);
      expect(imgObj.locked).toBe(false);
    });

    it('handles portrait aspect ratios accurately', () => {
      const imgObj = createImageObject(
        'data:image/png;base64,portraitData',
        'sheet.png',
        100,
        100,
        800,
        600,
        600,
        1200
      );

      // Height should fit within 600 max, ratio is 0.5 -> width 300, height 600
      expect(imgObj.width).toBe(300);
      expect(imgObj.height).toBe(600);
    });
  });

  describe('Document Page Conversion (Section 11.1 & 11.2)', () => {
    const mockPages: ImportedDocumentPage[] = [
      {
        pageNumber: 1,
        thumbnailDataUrl: 'data:image/png;base64,thumb1',
        fullDataUrl: 'data:image/png;base64,full1',
        width: 1920,
        height: 1080,
      },
      {
        pageNumber: 2,
        thumbnailDataUrl: 'data:image/png;base64,thumb2',
        fullDataUrl: 'data:image/png;base64,full2',
        width: 1920,
        height: 1080,
      },
    ];

    it('converts pages into SmartBoard pages with presentation background for pen annotation', () => {
      const pages = convertDocumentPagesToSmartboardPages(mockPages, {
        asBackground: true,
        titlePrefix: 'Physics Lecture',
      });

      expect(pages.length).toBe(2);
      expect(pages[0].title).toBe('Physics Lecture (Page 1)');
      expect(pages[0].background.type).toBe('image');
      expect(pages[0].background.imageUrl).toBe('data:image/png;base64,full1');
      expect(pages[0].layers.length).toBe(5);
      expect(pages[0].objects.length).toBe(0);

      expect(pages[1].title).toBe('Physics Lecture (Page 2)');
      expect(pages[1].background.imageUrl).toBe('data:image/png;base64,full2');
    });

    it('converts pages into canvas ImageObjects when asBackground is false', () => {
      const pages = convertDocumentPagesToSmartboardPages(mockPages, {
        asBackground: false,
        titlePrefix: 'Math Slides',
      });

      expect(pages.length).toBe(2);
      expect(pages[0].title).toBe('Math Slides (Page 1)');
      expect(pages[0].background.type).toBe('blank');
      expect(pages[0].objects.length).toBe(1);
      expect(pages[0].objects[0].type).toBe('image');
      expect((pages[0].objects[0] as any).dataUrl).toBe('data:image/png;base64,full1');
    });
  });
});
