import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  ResourceLibraryService,
  BUILTIN_CATEGORIES,
  SavedResource,
} from '../src/renderer/services/resourceLibraryService';
import { ShapeObject } from '../src/shared/types';

beforeAll(() => {
  if (typeof localStorage === 'undefined') {
    let store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = String(val); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  }
});

describe('Resource Library Subsystem (Section 13)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Categories and Built-ins (Section 13.1)', () => {
    it('provides all 11 required educational categories', () => {
      const categoryIds = BUILTIN_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain('mathematics');
      expect(categoryIds).toContain('physics');
      expect(categoryIds).toContain('chemistry');
      expect(categoryIds).toContain('computer-science');
      expect(categoryIds).toContain('diagrams');
      expect(categoryIds).toContain('flowcharts');
      expect(categoryIds).toContain('shapes');
      expect(categoryIds).toContain('text-styles');
      expect(categoryIds).toContain('backgrounds');
      expect(categoryIds).toContain('images');
      expect(categoryIds).toContain('user-collections');
    });

    it('returns built-in STEM starter resources', () => {
      const resources = ResourceLibraryService.getResources();
      expect(resources.length).toBeGreaterThanOrEqual(5);

      const mathItem = resources.find((r) => r.category === 'mathematics');
      expect(mathItem).toBeDefined();
      expect(mathItem?.name).toContain('Cartesian');
      expect(mathItem?.objects.length).toBeGreaterThan(0);

      const physicsItem = resources.find((r) => r.category === 'physics');
      expect(physicsItem).toBeDefined();
      expect(physicsItem?.name).toContain('Free Body');

      const chemItem = resources.find((r) => r.category === 'chemistry');
      expect(chemItem).toBeDefined();
      expect(chemItem?.name).toContain('Benzene');
    });
  });

  describe('Saving and Managing Custom Resources (Section 13.2)', () => {
    it('saves canvas objects as a reusable resource preserving editable properties', () => {
      const customShape: ShapeObject = {
        id: 'triangle-1',
        type: 'shape',
        shapeType: 'triangle',
        x: 100,
        y: 100,
        width: 150,
        height: 150,
        rotation: 0,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#059669',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      };

      const saved = ResourceLibraryService.saveResource({
        name: 'Isosceles Triangle',
        description: 'Green equilateral/isosceles triangle for geometry proofs',
        category: 'mathematics',
        tags: ['triangle', 'geometry', 'proofs'],
        favorite: false,
        thumbnailUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        objects: [customShape],
      });

      expect(saved.id).toBeDefined();
      expect(saved.createdAt).toBeGreaterThan(0);
      expect(saved.name).toBe('Isosceles Triangle');

      const allResources = ResourceLibraryService.getResources();
      const found = allResources.find((r) => r.id === saved.id);
      expect(found).toBeDefined();
      expect(found?.objects[0].type).toBe('shape');
      expect((found?.objects[0] as ShapeObject).shapeType).toBe('triangle');
    });

    it('toggles favorite status on a resource', () => {
      const resources = ResourceLibraryService.getResources();
      const firstId = resources[0].id;
      const initialFav = resources[0].favorite;

      const newFav = ResourceLibraryService.toggleFavorite(firstId);
      expect(newFav).toBe(!initialFav);

      const updatedResources = ResourceLibraryService.getResources();
      const updatedItem = updatedResources.find((r) => r.id === firstId);
      expect(updatedItem?.favorite).toBe(newFav);
    });

    it('deletes a custom saved resource', () => {
      const saved = ResourceLibraryService.saveResource({
        name: 'Temporary Resource',
        description: 'Testing deletion',
        category: 'user-collections',
        tags: ['temp'],
        favorite: false,
        thumbnailUrl: '',
        objects: [],
      });

      expect(ResourceLibraryService.getResources().some((r) => r.id === saved.id)).toBe(true);

      ResourceLibraryService.deleteResource(saved.id);
      expect(ResourceLibraryService.getResources().some((r) => r.id === saved.id)).toBe(false);
    });
  });

  describe('User Folders and Collections', () => {
    it('creates, renames, and deletes custom user folders', () => {
      const folder = ResourceLibraryService.createFolder('AP Physics C', '#3b82f6');
      expect(folder.id).toBeDefined();
      expect(folder.name).toBe('AP Physics C');

      let folders = ResourceLibraryService.getUserFolders();
      expect(folders.some((f) => f.id === folder.id)).toBe(true);

      ResourceLibraryService.renameFolder(folder.id, 'AP Physics Mechanics');
      folders = ResourceLibraryService.getUserFolders();
      const renamed = folders.find((f) => f.id === folder.id);
      expect(renamed?.name).toBe('AP Physics Mechanics');

      ResourceLibraryService.deleteFolder(folder.id);
      folders = ResourceLibraryService.getUserFolders();
      expect(folders.some((f) => f.id === folder.id)).toBe(false);
    });
  });

  describe('Import and Export Collection Packages (.sbr)', () => {
    it('exports and imports resource collection packages', () => {
      const customResources: SavedResource[] = [
        {
          id: 'export-test-1',
          name: 'Logic Gate AND',
          description: 'Standard 2-input AND gate',
          category: 'computer-science',
          tags: ['logic', 'digital'],
          favorite: true,
          thumbnailUrl: 'data:image/svg+xml;utf8,<svg></svg>',
          objects: [],
          createdAt: Date.now(),
        },
      ];

      const jsonPkg = ResourceLibraryService.exportCollectionPackage(customResources);
      expect(jsonPkg).toContain('"packageVersion": 1');
      expect(jsonPkg).toContain('Logic Gate AND');

      const importedCount = ResourceLibraryService.importCollectionPackage(jsonPkg);
      expect(importedCount).toBe(1);

      const all = ResourceLibraryService.getResources();
      expect(all.some((r) => r.name === 'Logic Gate AND')).toBe(true);
    });
  });
});
