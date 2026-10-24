/**
 * Resource Library Service — Persistent Educational Asset Management
 * Milestone 3, Section 13
 */

import { CanvasObject, ShapeObject, TextObject } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export type ResourceCategory =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'computer-science'
  | 'diagrams'
  | 'flowcharts'
  | 'shapes'
  | 'text-styles'
  | 'backgrounds'
  | 'images'
  | 'user-collections';

export interface SavedResource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  collectionName?: string;
  tags: string[];
  favorite: boolean;
  thumbnailUrl: string; // PNG or SVG data URL
  objects: CanvasObject[]; // Preserves editable vector structures
  createdAt: number;
}

export interface UserFolder {
  id: string;
  name: string;
  color?: string;
}

const STORAGE_KEY_RESOURCES = 'smartboard_saved_resources_v1';
const STORAGE_KEY_FOLDERS = 'smartboard_resource_folders_v1';

export const BUILTIN_CATEGORIES: { id: ResourceCategory; label: string; icon: string }[] = [
  { id: 'mathematics', label: 'Mathematics', icon: '📐' },
  { id: 'physics', label: 'Physics', icon: '⚛️' },
  { id: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { id: 'computer-science', label: 'Computer Science', icon: '💻' },
  { id: 'diagrams', label: 'Diagrams', icon: '📊' },
  { id: 'flowcharts', label: 'Flowcharts', icon: '🔀' },
  { id: 'shapes', label: 'Shapes & Objects', icon: '🔷' },
  { id: 'text-styles', label: 'Text Styles', icon: '✍️' },
  { id: 'backgrounds', label: 'Backgrounds', icon: '🎨' },
  { id: 'images', label: 'Images & Media', icon: '🖼️' },
  { id: 'user-collections', label: 'My Collections', icon: '📁' },
];

/**
 * Built-in starter teaching resources
 */
export const STARTER_RESOURCES: SavedResource[] = [
  // Mathematics: Cartesian Coordinate System
  {
    id: 'math-cartesian-plane',
    name: 'Cartesian Coordinate Grid (X-Y)',
    description: 'Orthogonal coordinate axes with arrows and origin marker',
    category: 'mathematics',
    tags: ['math', 'axes', 'cartesian', 'graph'],
    favorite: true,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><line x1="10" y1="50" x2="90" y2="50" stroke="%2338bdf8" stroke-width="3"/><line x1="50" y1="90" x2="50" y2="10" stroke="%2338bdf8" stroke-width="3"/></svg>',
    createdAt: 1700000000000,
    objects: [
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'arrow',
        x: 200,
        y: 400,
        width: 500,
        height: 10,
        rotation: 0,
        fillColor: '#38bdf8',
        fillOpacity: 1,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'arrow',
        x: 450,
        y: 150,
        width: 10,
        height: 500,
        rotation: 0,
        fillColor: '#38bdf8',
        fillOpacity: 1,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: uuidv4(),
        type: 'text',
        content: '+y',
        x: 470,
        y: 150,
        width: 40,
        height: 30,
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: 600,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#38bdf8',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'label',
        locked: false,
        layerId: 'objects',
      } as TextObject,
      {
        id: uuidv4(),
        type: 'text',
        content: '+x',
        x: 710,
        y: 415,
        width: 40,
        height: 30,
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: 600,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#38bdf8',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'label',
        locked: false,
        layerId: 'objects',
      } as TextObject,
    ],
  },
  // Physics: Free Body Diagram (FBD)
  {
    id: 'physics-fbd-block',
    name: 'Free Body Force Diagram (FBD)',
    description: 'Central mass block with normal, gravity, applied, and friction vectors',
    category: 'physics',
    tags: ['physics', 'mechanics', 'force', 'vectors'],
    favorite: true,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect x="35" y="35" width="30" height="30" fill="%23f59e0b" stroke="%23d97706" stroke-width="2"/><line x1="50" y1="35" x2="50" y2="10" stroke="%2310b981" stroke-width="2"/><line x1="50" y1="65" x2="50" y2="90" stroke="%23ef4444" stroke-width="2"/></svg>',
    createdAt: 1700000000000,
    objects: [
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'rect',
        x: 400,
        y: 300,
        width: 140,
        height: 140,
        rotation: 0,
        fillColor: '#f59e0b',
        fillOpacity: 0.8,
        strokeColor: '#b45309',
        strokeWidth: 3,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: uuidv4(),
        type: 'text',
        content: 'm',
        x: 450,
        y: 350,
        width: 40,
        height: 40,
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#ffffff',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'heading',
        locked: false,
        layerId: 'objects',
      } as TextObject,
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'arrow',
        x: 465,
        y: 180,
        width: 10,
        height: 110,
        rotation: 0,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#059669',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'arrow',
        x: 465,
        y: 450,
        width: 10,
        height: 110,
        rotation: 180,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#dc2626',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
    ],
  },
  // Chemistry: Benzene Ring Structure
  {
    id: 'chemistry-benzene-ring',
    name: 'Aromatic Benzene Ring (C6H6)',
    description: 'Hexagonal carbon ring with alternating double bonds',
    category: 'chemistry',
    tags: ['chemistry', 'organic', 'benzene', 'molecule'],
    favorite: false,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="none" stroke="%2306b6d4" stroke-width="3"/><circle cx="50" cy="50" r="18" fill="none" stroke="%2306b6d4" stroke-width="2"/></svg>',
    createdAt: 1700000000000,
    objects: [
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'circle',
        x: 400,
        y: 250,
        width: 180,
        height: 180,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 0,
        strokeColor: '#06b6d4',
        strokeWidth: 4,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'circle',
        x: 435,
        y: 285,
        width: 110,
        height: 110,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 0,
        strokeColor: '#22d3ee',
        strokeWidth: 3,
        strokeOpacity: 1,
        strokeStyle: 'dashed',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
    ],
  },
  // Computer Science: Binary Tree Node
  {
    id: 'cs-binary-tree-node',
    name: 'Binary Search Tree Node',
    description: 'Root node connected to left and right pointer branches',
    category: 'computer-science',
    tags: ['cs', 'data-structures', 'binary-tree', 'algorithm'],
    favorite: false,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="25" r="16" fill="%236366f1" stroke="%234338ca" stroke-width="2"/><circle cx="25" cy="75" r="14" fill="%236366f1" stroke="%234338ca" stroke-width="2"/><circle cx="75" cy="75" r="14" fill="%236366f1" stroke="%234338ca" stroke-width="2"/><line x1="40" y1="38" x2="28" y2="62" stroke="%23a5b4fc" stroke-width="2"/><line x1="60" y1="38" x2="72" y2="62" stroke="%23a5b4fc" stroke-width="2"/></svg>',
    createdAt: 1700000000000,
    objects: [
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'circle',
        x: 450,
        y: 180,
        width: 90,
        height: 90,
        rotation: 0,
        fillColor: '#6366f1',
        fillOpacity: 0.9,
        strokeColor: '#4f46e5',
        strokeWidth: 3,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: uuidv4(),
        type: 'text',
        content: '42',
        x: 470,
        y: 210,
        width: 50,
        height: 30,
        fontFamily: 'Inter',
        fontSize: 22,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#ffffff',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'label',
        locked: false,
        layerId: 'objects',
      } as TextObject,
    ],
  },
  // Flowcharts: Decision Diamond & Action Blocks
  {
    id: 'flowchart-decision-block',
    name: 'Flowchart Decision Diamond',
    description: 'Condition diamond with Yes/No branches',
    category: 'flowcharts',
    tags: ['flowchart', 'logic', 'decision', 'algorithm'],
    favorite: true,
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="50,15 85,50 50,85 15,50" fill="%23ec4899" stroke="%23be185d" stroke-width="2"/></svg>',
    createdAt: 1700000000000,
    objects: [
      {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'rect',
        x: 400,
        y: 250,
        width: 160,
        height: 160,
        rotation: 45,
        fillColor: '#ec4899',
        fillOpacity: 0.25,
        strokeColor: '#db2777',
        strokeWidth: 3,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      } as ShapeObject,
      {
        id: uuidv4(),
        type: 'text',
        content: 'x > 0 ?',
        x: 420,
        y: 315,
        width: 120,
        height: 30,
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 600,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#ffffff',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'body',
        locked: false,
        layerId: 'objects',
      } as TextObject,
    ],
  },
];

export class ResourceLibraryService {
  /**
   * Load all saved resources (combines starters + user-saved items)
   */
  static getResources(): SavedResource[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESOURCES);
      if (stored) {
        const userSaved: SavedResource[] = JSON.parse(stored);
        return [...STARTER_RESOURCES, ...userSaved];
      }
    } catch (e) {
      console.warn('Failed to parse saved resources from localStorage:', e);
    }
    return STARTER_RESOURCES;
  }

  /**
   * Save a new resource created from canvas objects
   */
  static saveResource(resource: Omit<SavedResource, 'id' | 'createdAt'>): SavedResource {
    const newResource: SavedResource = {
      ...resource,
      id: uuidv4(),
      createdAt: Date.now(),
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESOURCES);
      const userSaved: SavedResource[] = stored ? JSON.parse(stored) : [];
      userSaved.unshift(newResource);
      localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(userSaved));
    } catch (e) {
      console.error('Failed to save resource to localStorage:', e);
    }

    return newResource;
  }

  /**
   * Delete a custom resource
   */
  static deleteResource(id: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESOURCES);
      if (stored) {
        let userSaved: SavedResource[] = JSON.parse(stored);
        userSaved = userSaved.filter((r) => r.id !== id);
        localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(userSaved));
      }
    } catch (e) {
      console.error('Failed to delete resource:', e);
    }
  }

  /**
   * Toggle favorite flag on a resource
   */
  static toggleFavorite(id: string): boolean {
    const resources = this.getResources();
    const item = resources.find((r) => r.id === id);
    if (!item) return false;

    const nextState = !item.favorite;
    item.favorite = nextState;

    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESOURCES);
      let userSaved: SavedResource[] = stored ? JSON.parse(stored) : [];
      const userItem = userSaved.find((r) => r.id === id);
      if (userItem) {
        userItem.favorite = nextState;
        localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(userSaved));
      }
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
    return nextState;
  }

  /**
   * Get user custom collections / folders
   */
  static getUserFolders(): UserFolder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FOLDERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return [
      { id: 'folder-favorites', name: 'Starred Items', color: '#f59e0b' },
      { id: 'folder-lesson-units', name: 'Unit 1: Kinematics', color: '#38bdf8' },
    ];
  }

  /**
   * Create a new folder
   */
  static createFolder(name: string, color = '#38bdf8'): UserFolder {
    const folder: UserFolder = { id: uuidv4(), name, color };
    const folders = this.getUserFolders();
    folders.push(folder);
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    return folder;
  }

  /**
   * Rename an existing folder
   */
  static renameFolder(id: string, newName: string): void {
    const folders = this.getUserFolders().map((f) => (f.id === id ? { ...f, name: newName } : f));
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }

  /**
   * Delete a folder
   */
  static deleteFolder(id: string): void {
    const folders = this.getUserFolders().filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }

  /**
   * Export collection package as JSON (.sbr)
   */
  static exportCollectionPackage(resources: SavedResource[]): string {
    const pkg = {
      packageVersion: 1,
      exportedAt: new Date().toISOString(),
      itemCount: resources.length,
      resources,
    };
    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Import collection package from JSON string
   */
  static importCollectionPackage(jsonStr: string): number {
    try {
      const parsed = JSON.parse(jsonStr);
      const incoming: SavedResource[] = parsed.resources || [];
      if (!Array.isArray(incoming)) return 0;

      const stored = localStorage.getItem(STORAGE_KEY_RESOURCES);
      const existing: SavedResource[] = stored ? JSON.parse(stored) : [];

      // Avoid duplicates by id
      const existingIds = new Set(existing.map((e) => e.id));
      const fresh = incoming.filter((i) => !existingIds.has(i.id));

      const updated = [...fresh, ...existing];
      localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(updated));
      return fresh.length;
    } catch (e) {
      console.error('Failed to import collection package:', e);
      return 0;
    }
  }
}
