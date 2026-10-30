/**
 * Shared types used by both main and renderer processes
 */

// ─── Document Model ───────────────────────────────────────────────────────────

export type ObjectType = 'stroke' | 'shape' | 'text' | 'image' | 'media' | 'group';

export interface Point {
  x: number;
  y: number;
  pressure?: number;  // 0..1
  tiltX?: number;     // degrees
  tiltY?: number;
  timestamp?: number; // ms
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Stroke ───────────────────────────────────────────────────────────────────

export type PenType =
  | 'normal'
  | 'flatBrush'
  | 'calligraphy'
  | 'fine'
  | 'pencil'
  | 'highlighter'
  | 'brush'
  | 'laser'
  | 'magic'
  | 'pattern'
  | 'dashed'
  | 'dotted'
  | 'marker';

export interface StrokeStyle {
  penType: PenType;
  color: string;       // hex or rgba
  width: number;       // base width in doc units
  opacity: number;     // 0..1
  smoothing: number;   // 0..1
  pressureSensitive: boolean;
}

export interface StrokeObject {
  id: string;
  type: 'stroke';
  points: Point[];
  style: StrokeStyle;
  bbox: BoundingBox;
  locked: boolean;
  layerId: string;
  createdAt: number;
}

// ─── Shape ────────────────────────────────────────────────────────────────────

export type ShapeType =
  | 'line'
  | 'arrow'
  | 'rect'
  | 'roundedRect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'rightTriangle'
  | 'parallelogram'
  | 'trapezoid'
  | 'polygon'
  | 'arc'
  | 'polyline'
  | 'recognition'
  | 'freeform'
  | 'cartesianAxes'
  | 'ruler'
  | 'protractor'
  | 'compass'
  | 'setSquare45'
  | 'setSquare30'
  | 'angleMeasurement'
  | 'numberLine'
  | 'functionPlot'
  | 'geometry3D'
  | 'circuitComponent'
  | 'physicsDiagram'
  | 'periodicElement'
  | 'atomicModel'
  | 'labApparatus'
  | 'flowchartNode'
  | 'csDiagram'
  | 'logicGate'
  | 'truthTable'
  | 'karnaughMap'
  | 'teachingTemplate';

export interface ShapeObject {
  id: string;
  type: 'shape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  locked: boolean;
  layerId: string;
  label?: string;
  params?: Record<string, any>;
}

// ─── Text ─────────────────────────────────────────────────────────────────────

export type TextPreset = 'title' | 'subtitle' | 'heading' | 'subheading' | 'body' | 'definition' |
  'important' | 'qa' | 'formula' | 'code' | 'label' | 'warning';

export interface TextObject {
  id: string;
  type: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string;
  opacity: number;
  rotation: number;
  preset: TextPreset;
  locked: boolean;
  layerId: string;
  isLatex?: boolean;
}

// ─── Image ────────────────────────────────────────────────────────────────────

export interface ImageObject {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  filePath: string;
  dataUrl?: string;   // for embedded small images
  opacity: number;
  locked: boolean;
  layerId: string;
}

// ─── Group (Multi-Object Selection) ──────────────────────────────────────────

export interface GroupObject {
  id: string;
  type: 'group';
  objects: CanvasObject[];
  bbox: BoundingBox;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  locked: boolean;
  layerId: string;
}

// ─── Document Object Union ────────────────────────────────────────────────────

export type CanvasObject = StrokeObject | ShapeObject | TextObject | ImageObject | GroupObject;

// ─── Layer ────────────────────────────────────────────────────────────────────

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export type BackgroundType = 'blank' | 'ruled' | 'grid' | 'dotted' | 'image' | 'pdf';

export interface PageBackground {
  type: BackgroundType;
  color: string;
  imageUrl?: string;
  gridSize?: number;
  lineColor?: string;
  opacity?: number;
  pdfData?: {
    filePath?: string;
    pageNumber: number;
    dataUrl?: string;
  };
}

export type PageDimensionPreset =
  | 'fullscreen'
  | '16:9'
  | '16:10'
  | '4:3'
  | 'a4-portrait'
  | 'a4-landscape'
  | 'custom'
  | 'infinite';

export interface Page {
  id: string;
  title: string;
  width: number;
  height: number;
  background: PageBackground;
  layers: Layer[];
  objects: CanvasObject[];
  thumbnail?: string;
  transition?: PageTransition;
}

export type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'wipe';

export interface PageTransition {
  type: TransitionType;
  duration: number; // ms
}

// ─── Lesson / Document ────────────────────────────────────────────────────────

export interface LessonMeta {
  id: string;
  title: string;
  subject?: string;
  author?: string;
  tags: string[];
  filePath?: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface LessonDocument {
  meta: LessonMeta;
  pages: Page[];
}

// ─── Tool System ──────────────────────────────────────────────────────────────

export type ToolId = string;

export type ToolCategory = 'drawing' | 'eraser' | 'shape' | 'text' | 'select' | 'presentation' | 'annotation' | 'subject';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  icon: string;
  category: ToolCategory;
  shortcut?: string;
  defaultSettings: Record<string, unknown>;
}

// ─── Command System (Undo/Redo) ───────────────────────────────────────────────

export interface Command {
  id: string;
  description: string;
  execute(): void;
  undo(): void;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type AppEvent =
  | { type: 'TOOL_CHANGED'; toolId: ToolId }
  | { type: 'PAGE_CHANGED'; pageIndex: number }
  | { type: 'LESSON_SAVED'; path: string }
  | { type: 'LESSON_LOADED'; lesson: LessonDocument }
  | { type: 'ZOOM_CHANGED'; zoom: number }
  | { type: 'THEME_CHANGED'; theme: string };
