/**
 * DrawingEngine — High-performance interactive whiteboard rendering engine
 *
 * Architecture:
 * - Dedicated triple/dual canvas layers bypassing React during active interactions
 * - Sub-millisecond latency for pointer/stylus events
 * - Full support for:
 *   1. Freehand stylus drawing (Midpoint quadratic Bezier smoothing, pressure sensitivity, 7 pen types)
 *   2. Ephemeral laser pen with glowing neon trail and rapid blinking before fade-out
 *   3. Intelligent shape recognition (recognizes freehand lines, arrows, circles, ellipses, triangles, rects)
 *   4. 8-handle shape and object transformation (stretching and resizing by corners and edges)
 *   5. Precision eraser (geometric stroke splitting, whole object eraser, area eraser)
 *   6. Pan and zoom with hardware DPR scaling and full edge-to-edge coverage
 */

import {
  Point,
  StrokeStyle,
  StrokeObject,
  ShapeObject,
  ShapeType,
  TextObject,
  ImageObject,
  CanvasObject,
  GroupObject,
  BoundingBox,
  ToolId,
  Layer,
} from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { isLatexSyntax, getCachedLatexImage, measureLatexSize } from '../services/latexService';


export interface ShapeStyle {
  shapeType: ShapeType;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
}

export type EraserMode = 'stroke' | 'object' | 'area';
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'start' | 'end' | 'rotate';

interface ActiveStroke {
  id: string;
  points: Point[];
  style: StrokeStyle;
  layerId: string;
}

interface LaserTrail {
  id: string;
  points: Point[];
  style: StrokeStyle;
  startTime: number;
  duration: number; // e.g. 2500ms
  blinkStartTime: number; // e.g. 1400ms
}

export interface EraseSession {
  removedIds: Set<string>;
  newStrokes: Map<string, StrokeObject>;
  originalObjects: Map<string, CanvasObject>;
}

export interface DrawingEngineCallbacks {
  onStrokeComplete?: (stroke: StrokeObject) => void;
  onShapeComplete?: (shape: ShapeObject) => void;
  onEraseObjects?: (objectIds: string[]) => void;
  onSplitStroke?: (originalId: string, newStrokes: StrokeObject[]) => void;
  onEraseBatchComplete?: (
    removedIds: string[],
    addedObjects: CanvasObject[],
    originalObjects: CanvasObject[]
  ) => void;
  onSelectObject?: (object: CanvasObject | null) => void;
  onUpdateObject?: (object: CanvasObject, prevObject?: CanvasObject) => void;
  onDuplicateClone?: (clone: CanvasObject) => void;
  onViewChange?: (zoom: number, panX: number, panY: number) => void;
  onTextClick?: (pos: Point) => void;
  onInteractionStart?: () => void;
}

export class DrawingEngine {
  private committedCanvas: HTMLCanvasElement;
  private activeCanvas: HTMLCanvasElement;
  private committedCtx: CanvasRenderingContext2D;
  private activeCtx: CanvasRenderingContext2D;

  private activeTool: ToolId = 'pen';
  private activeStroke: ActiveStroke | null = null;
  private shapeOrigin: Point | null = null;
  private currentPointerPos: Point | null = null;
  private isPointerDown = false;
  private isPanning = false;
  private panStartScreen = { x: 0, y: 0 };
  private panStartOffset = { x: 0, y: 0 };

  // Ephemeral Laser Trails
  private laserTrails: LaserTrail[] = [];
  private laserRaf: number | null = null;

  // Intelligent Shape Recognition Points
  private recognitionPoints: Point[] = [];

  // Selection & drag state
  private selectedObjectId: string | null = null;
  private selectedGroupObject: GroupObject | null = null;
  private isDraggingObject = false;
  private dragStartDocPoint = { x: 0, y: 0 };
  private draggedObjectInitial: CanvasObject | null = null;

  // Multi-element marquee & lasso selection
  private isMarqueeSelecting = false;
  private marqueeStartPt: Point | null = null;
  private isLassoSelecting = false;
  private lassoPoints: Point[] = [];

  // Object Resizing & Stretching State
  private isResizingObject = false;
  private activeResizeHandle: ResizeHandle | null = null;
  private resizeStartDocPoint: Point = { x: 0, y: 0 };
  private resizeObjectInitial: CanvasObject | null = null;

  // Cached committed objects for hit testing and erasing
  private committedObjects: CanvasObject[] = [];
  private locallyCommittedIds = new Set<string>();

  // Configuration
  private currentStyle: StrokeStyle;
  private currentShapeStyle: ShapeStyle;
  private eraserMode: EraserMode = 'stroke';
  private eraserRadius = 20;
  private currentLayerId = 'drawing';
  private eraseSession: EraseSession | null = null;
  private cloneMode: boolean = false;
  private layers: Layer[] = [];
  private layersMap: Map<string, Layer> = new Map();

  // Transform
  private zoom = 1.0;
  private panX = 0;
  private panY = 0;
  private devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // Callbacks
  private callbacks: DrawingEngineCallbacks;
  private rafHandle: number | null = null;
  private committedRafHandle: number | null = null;
  private lastErasePos: Point | null = null;
  private imageCache = new Map<string, HTMLImageElement>();

  constructor(options: {
    committedCanvas: HTMLCanvasElement;
    activeCanvas: HTMLCanvasElement;
    callbacks?: DrawingEngineCallbacks;
    initialStyle?: Partial<StrokeStyle>;
    initialLayerId?: string;
  }) {
    this.committedCanvas = options.committedCanvas;
    this.activeCanvas = options.activeCanvas;
    this.callbacks = options.callbacks ?? {};
    this.currentLayerId = options.initialLayerId ?? 'drawing';

    const cc = this.committedCanvas.getContext('2d', { alpha: true, desynchronized: true });
    const ac = this.activeCanvas.getContext('2d', { alpha: true, desynchronized: true });

    if (!cc || !ac) throw new Error('DrawingEngine: Failed to get 2D canvas context');
    this.committedCtx = cc;
    this.activeCtx = ac;

    // Enable high quality anti-aliasing on both contexts
    this.committedCtx.imageSmoothingEnabled = true;
    this.committedCtx.imageSmoothingQuality = 'high';
    this.activeCtx.imageSmoothingEnabled = true;
    this.activeCtx.imageSmoothingQuality = 'high';

    this.currentStyle = {
      penType: 'normal',
      color: '#ffffff',
      width: 3,
      opacity: 1,
      smoothing: 0.5,
      pressureSensitive: true,
      ...options.initialStyle,
    };

    this.currentShapeStyle = {
      shapeType: 'recognition',
      fillColor: '#4facfe',
      fillOpacity: 0, // 100% transparent by default
      strokeColor: '#00f2fe',
      strokeWidth: 3,
      strokeOpacity: 1,
      strokeStyle: 'solid',
    };

    this.setupEventListeners();

    // Immediately size canvases to client/window with hardware DPR resolution
    const dpr = Math.max(1, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    this.devicePixelRatio = dpr;
    const initialW = this.activeCanvas.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    const initialH = this.activeCanvas.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080);
    this.resize(initialW, initialH);
  }

  // ─── Event Setup ──────────────────────────────────────────────────────────

  private setupEventListeners(): void {
    const canvas = this.activeCanvas;
    canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    canvas.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    canvas.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    canvas.addEventListener('pointercancel', this.handlePointerCancel, { passive: false });
    canvas.addEventListener('pointerleave', this.handlePointerLeave, { passive: false });
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', this.handleWindowBlur);
      window.addEventListener('focus', this.handleWindowFocus);
    }
  }

  // ─── Pointer Event Handlers ───────────────────────────────────────────────

  private handlePointerDown = (e: PointerEvent): void => {
    if (!e.isPrimary && e.pointerType === 'touch') return;
    this.callbacks.onInteractionStart?.();
    if (e.cancelable) e.preventDefault();
    this.isPointerDown = true;
    try {
      this.activeCanvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails (synthetic/touch event)
    }

    const docPt = this.eventToDocPoint(e);
    this.currentPointerPos = docPt;

    // Pan with middle mouse button or Spacebar held
    if (e.button === 1 || this.activeTool === 'pan' || e.buttons === 4) {
      this.isPanning = true;
      this.panStartScreen = { x: e.clientX, y: e.clientY };
      this.panStartOffset = { x: this.panX, y: this.panY };
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // If not in select tool, clear any lingering selection immediately
    if (this.activeTool !== 'select' && this.selectedObjectId) {
      this.selectedObjectId = null;
      this.selectedGroupObject = null;
      this.callbacks.onSelectObject?.(null);
      this.clearActiveCanvas();
    }

    // Check if user clicked a resize handle of the currently selected object (single or group) in select mode
    if (this.activeTool === 'select' && this.selectedObjectId) {
      const selectedObj =
        this.selectedGroupObject?.id === this.selectedObjectId
          ? this.selectedGroupObject
          : this.committedObjects.find((o) => o.id === this.selectedObjectId);
      if (selectedObj) {
        const handle = this.hitTestResizeHandle(docPt, selectedObj);
        if (handle) {
          this.isResizingObject = true;
          this.activeResizeHandle = handle;
          this.resizeStartDocPoint = docPt;
          this.resizeObjectInitial = JSON.parse(JSON.stringify(selectedObj));
          if (handle === 'rotate') {
            this.activeCanvas.style.cursor = 'grabbing';
          }
          this.clearActiveCanvas();
          this.redrawCommitted(this.committedObjects);
          this.renderObject(this.activeCtx, selectedObj);
          this.drawSelectionOutline(this.activeCtx, this.getObjectBoundingBox(selectedObj), selectedObj);
          return;
        }
      }
    }

    // Update cursor according to active tool (crosshair for pen/shape, etc.)
    this.updateToolCursor();

    switch (this.activeTool) {
      case 'pen':
      case 'highlighter': {
        if (this.selectedObjectId) {
          this.selectedObjectId = null;
          this.selectedGroupObject = null;
          this.callbacks.onSelectObject?.(null);
          this.clearActiveCanvas();
        }
        const snappedPt = this.snapPointToRulerIfNear(docPt);
        this.activeStroke = {
          id: uuidv4(),
          points: [snappedPt],
          style: { ...this.currentStyle },
          layerId: this.currentLayerId,
        };
        this.requestActiveRender();
        break;
      }

      case 'shape':
      case 'line': {
        if (this.selectedObjectId) {
          this.selectedObjectId = null;
          this.selectedGroupObject = null;
          this.callbacks.onSelectObject?.(null);
          this.clearActiveCanvas();
        }
        const shapeType = this.activeTool === 'line' ? 'line' : this.currentShapeStyle.shapeType;
        const originPt = shapeType === 'line' ? this.snapPointToRulerIfNear(docPt) : docPt;
        if (shapeType === 'recognition') {
          this.recognitionPoints = [docPt];
        } else {
          this.shapeOrigin = originPt;
        }
        this.requestActiveRender();
        break;
      }

      case 'eraser': {
        if (this.selectedObjectId) {
          this.selectedObjectId = null;
          this.selectedGroupObject = null;
          this.callbacks.onSelectObject?.(null);
          this.clearActiveCanvas();
        }
        this.eraseSession = {
          removedIds: new Set(),
          newStrokes: new Map(),
          originalObjects: new Map(),
        };
        this.lastErasePos = docPt;
        this.eraseAtPoint(docPt, docPt);
        this.requestActiveRender();
        break;
      }

      case 'text': {
        this.callbacks.onTextClick?.(docPt);
        break;
      }

      case 'select': {
        // 1. If currently in group selection, test if click is inside the group or hits any group child
        if (this.selectedGroupObject && this.selectedObjectId === this.selectedGroupObject.id) {
          const grpBbox = this.selectedGroupObject.bbox;
          const insideGroupBbox =
            docPt.x >= grpBbox.x &&
            docPt.x <= grpBbox.x + grpBbox.width &&
            docPt.y >= grpBbox.y &&
            docPt.y <= grpBbox.y + grpBbox.height;

          if (insideGroupBbox) {
            this.isDraggingObject = true;
            this.dragStartDocPoint = docPt;
            this.draggedObjectInitial = JSON.parse(JSON.stringify(this.selectedGroupObject));
            this.redrawCommitted(this.committedObjects);
            this.renderDraggedObject(this.draggedObjectInitial!, 0, 0);
            break;
          }
        }

        // 2. Single object hit test
        const hit = this.hitTest(docPt);

        if (hit) {
          // If hit is part of current selectedGroupObject, drag group
          if (this.selectedGroupObject && this.selectedGroupObject.objects.some((o) => o.id === hit.id)) {
            this.isDraggingObject = true;
            this.dragStartDocPoint = docPt;
            this.draggedObjectInitial = JSON.parse(JSON.stringify(this.selectedGroupObject));
            this.redrawCommitted(this.committedObjects);
            this.renderDraggedObject(this.draggedObjectInitial!, 0, 0);
            break;
          }

          // Otherwise, select this single object immediately
          this.selectedGroupObject = null;
          this.selectedObjectId = hit.id;
          this.callbacks.onSelectObject?.(hit);
          this.requestActiveRender();

          // Check if user clicked directly on one of the resize handles of this object
          const handle = this.hitTestResizeHandle(docPt, hit);
          if (handle) {
            this.isResizingObject = true;
            this.activeResizeHandle = handle;
            this.resizeStartDocPoint = docPt;
            this.resizeObjectInitial = JSON.parse(JSON.stringify(hit));
            this.clearActiveCanvas();
            this.renderObject(this.activeCtx, hit);
            this.drawSelectionOutline(this.activeCtx, this.getObjectBoundingBox(hit), hit);
          } else {
            this.isDraggingObject = true;
            this.dragStartDocPoint = docPt;
            if (this.cloneMode) {
              const clone = JSON.parse(JSON.stringify(hit)) as CanvasObject;
              clone.id = uuidv4();
              this.committedObjects.push(clone);
              this.callbacks.onDuplicateClone?.(clone);
            }
            this.draggedObjectInitial = JSON.parse(JSON.stringify(hit));
            this.redrawCommitted(this.committedObjects);
            this.renderDraggedObject(this.draggedObjectInitial!, 0, 0);
          }
        } else {
          // Empty canvas: clear selection and start multi-selection!
          this.selectedObjectId = null;
          this.selectedGroupObject = null;
          this.callbacks.onSelectObject?.(null);
          this.clearActiveCanvas();
          this.redrawCommitted(this.committedObjects);

          if (e.pointerType === 'pen') {
            // Freehand lasso selection for stylus
            this.isLassoSelecting = true;
            this.lassoPoints = [docPt];
          } else {
            // Rectangular marquee selection for mouse / touch
            this.isMarqueeSelecting = true;
            this.marqueeStartPt = docPt;
          }
        }
        break;
      }
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!e.isPrimary && e.pointerType === 'touch') return;
    if (this.isPointerDown && e.cancelable) e.preventDefault();
    const docPt = this.eventToDocPoint(e);
    this.currentPointerPos = docPt;

    if (this.isPanning) {
      const dx = (e.clientX - this.panStartScreen.x) / this.zoom;
      const dy = (e.clientY - this.panStartScreen.y) / this.zoom;
      this.panX = this.panStartOffset.x + dx;
      this.panY = this.panStartOffset.y + dy;
      this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
      this.redrawCommitted(this.committedObjects);
      return;
    }

    // Hover handle cursor changes when not dragging
    if (!this.isPointerDown) {
      if (this.activeTool === 'eraser') {
        this.requestActiveRender();
      } else if (this.activeTool === 'select' && this.selectedObjectId) {
        const selObj = this.committedObjects.find((o) => o.id === this.selectedObjectId);
        if (selObj) {
          const h = this.hitTestResizeHandle(docPt, selObj);
          this.updateCursorForHandle(h);
        }
      }
      return;
    }

    // ── Resizing Object Live Preview ──
    if (this.isResizingObject && this.resizeObjectInitial && this.activeResizeHandle) {
      this.requestActiveRender();
      return;
    }

    switch (this.activeTool) {
      case 'pen':
      case 'highlighter': {
        if (!this.activeStroke) return;
        const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
        const events = coalesced && coalesced.length > 0 ? coalesced : [e];
        for (const ce of events) {
          const rawPt = this.eventToDocPoint(ce);
          const pt = this.snapPointToRulerIfNear(rawPt);
          const isSnapped = pt.x !== rawPt.x || pt.y !== rawPt.y;
          const pts = this.activeStroke.points;
          const last = pts[pts.length - 1];
          if (!last) {
            pts.push(pt);
            continue;
          }
          const d2 = distSq(pt, last);
          if (d2 >= 0.49 || Math.abs((pt.pressure ?? 0.5) - (last.pressure ?? 0.5)) >= 0.03) {
            const smoothing = this.currentStyle.smoothing ?? 0.45;
            const weight = 1 - Math.min(0.7, Math.max(0.1, smoothing * 0.75));
            const smoothedPt: Point = {
              x: last.x + (pt.x - last.x) * weight,
              y: last.y + (pt.y - last.y) * weight,
              pressure: (last.pressure ?? 0.5) + ((pt.pressure ?? 0.5) - (last.pressure ?? 0.5)) * weight,
              tiltX: pt.tiltX,
              tiltY: pt.tiltY,
              timestamp: pt.timestamp,
            };
            pts.push(isSnapped ? pt : smoothedPt);
          }
        }
        // Immediate active rendering gives 0ms latency - ink appears right at pen tip without lagging
        this.renderActiveLayer();
        break;
      }

      case 'shape':
      case 'line': {
        const shapeType = this.activeTool === 'line' ? 'line' : this.currentShapeStyle.shapeType;
        if (shapeType === 'recognition') {
          if (this.recognitionPoints.length > 0) {
            const last = this.recognitionPoints[this.recognitionPoints.length - 1];
            if (!last || distSq(docPt, last) >= 1.5) {
              this.recognitionPoints.push(docPt);
              this.requestActiveRender();
            }
          }
        } else if (this.shapeOrigin) {
          this.requestActiveRender();
        }
        break;
      }

      case 'eraser': {
        if (this.isPointerDown) {
          const prev = this.lastErasePos || docPt;
          if (!this.lastErasePos || distSq(docPt, this.lastErasePos) >= 4) {
            this.eraseAtPoint(docPt, prev);
            this.lastErasePos = docPt;
          }
        }
        this.requestActiveRender();
        break;
      }

      case 'select': {
        if (this.isDraggingObject && this.draggedObjectInitial) {
          this.currentPointerPos = docPt;
          const deltaX = docPt.x - this.dragStartDocPoint.x;
          const deltaY = docPt.y - this.dragStartDocPoint.y;
          this.renderDraggedObject(this.draggedObjectInitial, deltaX, deltaY);
        } else if (this.isMarqueeSelecting) {
          this.requestActiveRender();
        } else if (this.isLassoSelecting) {
          const last = this.lassoPoints[this.lassoPoints.length - 1];
          if (!last || distSq(docPt, last) >= 4) {
            this.lassoPoints.push(docPt);
            this.requestActiveRender();
          }
        }
        break;
      }
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (!e.isPrimary && e.pointerType === 'touch') return;
    this.isPointerDown = false;
    try {
      if (this.activeCanvas.hasPointerCapture(e.pointerId)) {
        this.activeCanvas.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    // ── Commit Resize / Rotate ──
    if (this.isResizingObject && this.resizeObjectInitial && this.activeResizeHandle && this.currentPointerPos) {
      const deltaX = this.currentPointerPos.x - this.resizeStartDocPoint.x;
      const deltaY = this.currentPointerPos.y - this.resizeStartDocPoint.y;
      const distMoved = Math.hypot(deltaX, deltaY);
      const minDistance = this.activeResizeHandle === 'rotate' ? 4 : 1;

      if (distMoved >= minDistance) {
        const initial = this.resizeObjectInitial;
        const updated = this.applyResizeToObject(
          initial,
          this.activeResizeHandle,
          deltaX,
          deltaY,
          this.currentPointerPos
        );
        if (updated.type === 'group') {
          const grp = updated as GroupObject;
          this.selectedGroupObject = grp;
          this.selectedObjectId = grp.id;
          const childMap = new Map(grp.objects.map((o) => [o.id, o]));
          this.committedObjects = this.committedObjects.map((o) => childMap.get(o.id) || o);
          this.callbacks.onUpdateObject?.(grp, initial);
        } else {
          const idx = this.committedObjects.findIndex((o) => o.id === updated.id);
          if (idx >= 0) {
            this.committedObjects[idx] = updated;
          }
          this.selectedObjectId = updated.id;
          this.callbacks.onUpdateObject?.(updated, initial);
        }
      }
      this.isResizingObject = false;
      this.activeResizeHandle = null;
      this.resizeObjectInitial = null;
      this.clearActiveCanvas();
      this.redrawCommitted(this.committedObjects);
      this.updateToolCursor();
      return;
    }

    switch (this.activeTool) {
      case 'pen':
      case 'highlighter': {
        if (this.activeStroke) {
          this.finalizeStroke();
        }
        break;
      }

      case 'shape':
      case 'line': {
        const shapeType = this.activeTool === 'line' ? 'line' : this.currentShapeStyle.shapeType;
        if (shapeType === 'recognition' && this.recognitionPoints.length > 0) {
          const rec = this.recognizeGesture(this.recognitionPoints);
          this.finalizeRecognizedShape(rec.shapeType, rec.origin, rec.current);
          this.recognitionPoints = [];
          this.clearActiveCanvas();
        } else if (this.shapeOrigin && this.currentPointerPos) {
          const finalPt = shapeType === 'line' ? this.snapPointToRulerIfNear(this.currentPointerPos) : this.currentPointerPos;
          this.finalizeShape(this.shapeOrigin, finalPt);
          this.shapeOrigin = null;
          this.clearActiveCanvas();
        }
        break;
      }

      case 'eraser': {
        if (this.committedRafHandle !== null) {
          cancelAnimationFrame(this.committedRafHandle);
          this.committedRafHandle = null;
        }
        this.redrawCommitted(this.committedObjects);
        this.lastErasePos = null;

        if (
          this.eraseSession &&
          (this.eraseSession.removedIds.size > 0 || this.eraseSession.newStrokes.size > 0)
        ) {
          const removedIds = Array.from(this.eraseSession.removedIds);
          const addedStrokes = Array.from(this.eraseSession.newStrokes.values());
          const originalObjs = Array.from(this.eraseSession.originalObjects.values());
          this.callbacks.onEraseBatchComplete?.(removedIds, addedStrokes, originalObjs);
        }
        this.eraseSession = null;
        this.clearActiveCanvas();
        break;
      }

      case 'select': {
        const pt = this.currentPointerPos || this.eventToDocPoint(e);
        if (this.isDraggingObject && this.draggedObjectInitial) {
          const deltaX = pt.x - this.dragStartDocPoint.x;
          const deltaY = pt.y - this.dragStartDocPoint.y;
          if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            const initial = this.draggedObjectInitial;
            const updated = this.applyDeltaToObject(initial, deltaX, deltaY);
            if (updated.type === 'group') {
              const grp = updated as GroupObject;
              this.selectedGroupObject = grp;
              this.selectedObjectId = grp.id;
              const childMap = new Map(grp.objects.map((o) => [o.id, o]));
              this.committedObjects = this.committedObjects.map((o) => childMap.get(o.id) || o);
              this.callbacks.onUpdateObject?.(grp, initial);
            } else {
              const idx = this.committedObjects.findIndex((o) => o.id === updated.id);
              if (idx >= 0) {
                this.committedObjects[idx] = updated;
              }
              this.selectedObjectId = updated.id;
              this.callbacks.onUpdateObject?.(updated, initial);
            }
          }
          this.isDraggingObject = false;
          this.draggedObjectInitial = null;
          this.clearActiveCanvas();
          this.redrawCommitted(this.committedObjects);
          this.requestActiveRender();
        } else if (this.isMarqueeSelecting && this.marqueeStartPt) {
          const x = Math.min(this.marqueeStartPt.x, pt.x);
          const y = Math.min(this.marqueeStartPt.y, pt.y);
          const w = Math.abs(pt.x - this.marqueeStartPt.x);
          const h = Math.abs(pt.y - this.marqueeStartPt.y);
          this.isMarqueeSelecting = false;
          this.marqueeStartPt = null;

          if (w > 5 || h > 5) {
            const marqueeBbox: BoundingBox = { x, y, width: w, height: h };
            const matches = this.committedObjects.filter((o) => {
              if (o.locked) return false;
              const l = this.layersMap.get(o.layerId);
              if (l && (!l.visible || l.locked)) return false;
              return this.objectIntersectsRect(o, marqueeBbox);
            });
            if (matches.length === 1) {
              this.selectedGroupObject = null;
              this.selectedObjectId = matches[0].id;
              this.callbacks.onSelectObject?.(matches[0]);
            } else if (matches.length > 1) {
              const grp = this.createGroupFromObjects(matches);
              this.selectedGroupObject = grp;
              this.selectedObjectId = grp.id;
              this.callbacks.onSelectObject?.(grp);
            } else {
              this.selectedGroupObject = null;
              this.selectedObjectId = null;
              this.callbacks.onSelectObject?.(null);
            }
          }
          this.clearActiveCanvas();
          this.redrawCommitted(this.committedObjects);
          this.requestActiveRender();
        } else if (this.isLassoSelecting) {
          const pts = [...this.lassoPoints];
          this.isLassoSelecting = false;
          this.lassoPoints = [];

          if (pts.length >= 3) {
            const matches = this.committedObjects.filter((o) => {
              if (o.locked) return false;
              const l = this.layersMap.get(o.layerId);
              if (l && (!l.visible || l.locked)) return false;
              return this.objectIntersectsPolygon(o, pts);
            });
            if (matches.length === 1) {
              this.selectedGroupObject = null;
              this.selectedObjectId = matches[0].id;
              this.callbacks.onSelectObject?.(matches[0]);
            } else if (matches.length > 1) {
              const grp = this.createGroupFromObjects(matches);
              this.selectedGroupObject = grp;
              this.selectedObjectId = grp.id;
              this.callbacks.onSelectObject?.(grp);
            } else {
              this.selectedGroupObject = null;
              this.selectedObjectId = null;
              this.callbacks.onSelectObject?.(null);
            }
          }
          this.clearActiveCanvas();
          this.redrawCommitted(this.committedObjects);
          this.requestActiveRender();
        }
        break;
      }
    }
  };

  private handlePointerCancel = (e?: PointerEvent): void => {
    if (e && !e.isPrimary && e.pointerType === 'touch') return;
    if (e) {
      try {
        if (this.activeCanvas.hasPointerCapture(e.pointerId)) {
          this.activeCanvas.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
    this.resetInteractions();
  };

  public resetInteractions(): void {
    this.isPointerDown = false;
    this.isPanning = false;
    this.isDraggingObject = false;
    this.draggedObjectInitial = null;
    this.isResizingObject = false;
    this.activeResizeHandle = null;
    this.resizeObjectInitial = null;
    this.isMarqueeSelecting = false;
    this.marqueeStartPt = null;
    this.isLassoSelecting = false;
    this.lassoPoints = [];
    this.activeStroke = null;
    this.shapeOrigin = null;
    this.recognitionPoints = [];
    this.eraseSession = null;
    this.clearActiveCanvas();
    this.redrawCommitted(this.committedObjects);
  }

  private handleWindowBlur = (): void => {
    this.resetInteractions();
  };

  private handleWindowFocus = (): void => {
    this.resetInteractions();
    const w = this.activeCanvas.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    const h = this.activeCanvas.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080);
    if (w > 0 && h > 0) {
      this.resize(w, h);
    }
  };

  private handlePointerLeave = (): void => {
    if (!this.isPointerDown) {
      this.clearActiveCanvas();
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (e.ctrlKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));

      const rect = this.activeCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.panX -= ((mouseX / this.zoom) * (newZoom - this.zoom)) / newZoom;
      this.panY -= ((mouseY / this.zoom) * (newZoom - this.zoom)) / newZoom;
      this.zoom = newZoom;

      this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
      this.redrawCommitted(this.committedObjects);
    } else {
      this.panX -= e.deltaX / this.zoom;
      this.panY -= e.deltaY / this.zoom;
      this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
      this.redrawCommitted(this.committedObjects);
    }
  };

  // ─── Active Render Loop ───────────────────────────────────────────────────

  private requestActiveRender(): void {
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      this.renderActiveLayer();
    });
  }

  private requestCommittedRender(): void {
    if (this.committedRafHandle !== null) return;
    this.committedRafHandle = requestAnimationFrame(() => {
      this.committedRafHandle = null;
      this.redrawCommitted(this.committedObjects);
    });
  }

  private renderActiveLayer(): void {
    const ctx = this.activeCtx;
    this.clearActiveCanvas();

    // 1. Draw Ephemeral Laser Trails (pulsing/blinking rapidly before fade-out)
    if (this.laserTrails.length > 0) {
      const now = Date.now();
      for (const trail of this.laserTrails) {
        const elapsed = now - trail.startTime;
        let alpha = 1.0;
        if (elapsed >= trail.blinkStartTime) {
          // Rapid 10Hz blinking during the final 1100ms
          const blinkPhase = Math.floor((elapsed - trail.blinkStartTime) / 100) % 2;
          alpha = blinkPhase === 0 ? 0.95 : 0.05;
        }

        ctx.save();
        this.applyStrokeStyle(ctx, trail.style);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 14 * this.zoom * this.devicePixelRatio;
        ctx.beginPath();
        this.drawSmoothCurve(ctx, trail.points, trail.style);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Draw in-progress stroke with pressure and calligraphic curve dynamics
    if (this.activeStroke && this.activeStroke.points.length > 0) {
      this.drawStyledStroke(ctx, this.activeStroke);
    }

    // 3. Draw live Intelligent Recognition gesture preview
    if (
      this.activeTool === 'shape' &&
      this.currentShapeStyle.shapeType === 'recognition' &&
      this.recognitionPoints.length > 0
    ) {
      ctx.save();
      const activeColor = this.currentShapeStyle.strokeColor || '#38bdf8';
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = activeColor;
      ctx.lineWidth = Math.max(3, this.currentShapeStyle.strokeWidth) * this.zoom * this.devicePixelRatio;
      ctx.globalAlpha = 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 3 * this.zoom * this.devicePixelRatio;
      ctx.beginPath();
      this.drawSmoothCurve(ctx, this.recognitionPoints, this.currentStyle);
      ctx.stroke();
      ctx.restore();
    }
    // Standard shape preview
    else if (this.shapeOrigin && this.currentPointerPos) {
      const shapeType = this.activeTool === 'line' ? 'line' : this.currentShapeStyle.shapeType;
      const previewPt = shapeType === 'line' ? this.snapPointToRulerIfNear(this.currentPointerPos) : this.currentPointerPos;
      this.drawShapePreview(ctx, this.shapeOrigin, previewPt, shapeType);
    }

    // 4. Draw eraser circle indicator
    if (this.activeTool === 'eraser' && this.currentPointerPos) {
      this.drawEraserIndicator(ctx, this.currentPointerPos);
    }

    // 5. Draw resizing preview
    if (
      this.isResizingObject &&
      this.resizeObjectInitial &&
      this.currentPointerPos &&
      this.activeResizeHandle
    ) {
      const deltaX = this.currentPointerPos.x - this.resizeStartDocPoint.x;
      const deltaY = this.currentPointerPos.y - this.resizeStartDocPoint.y;
      const resized = this.applyResizeToObject(
        this.resizeObjectInitial,
        this.activeResizeHandle,
        deltaX,
        deltaY,
        this.currentPointerPos
      );
      this.renderObject(ctx, resized);
      this.drawSelectionOutline(ctx, this.getObjectBoundingBox(resized), resized);
    }

    // 5b. Draw dragging preview (CRITICAL: prevents dragged image or object from disappearing)
    if (this.isDraggingObject && this.draggedObjectInitial) {
      const curPt = this.currentPointerPos || this.dragStartDocPoint;
      const deltaX = curPt.x - this.dragStartDocPoint.x;
      const deltaY = curPt.y - this.dragStartDocPoint.y;
      const updated = this.applyDeltaToObject(this.draggedObjectInitial, deltaX, deltaY);
      this.renderObject(ctx, updated);
      this.drawSelectionOutline(ctx, this.getObjectBoundingBox(updated), updated);
    }

    // 6. Draw rectangular marquee selection preview (Mouse)
    if (this.isMarqueeSelecting && this.marqueeStartPt && this.currentPointerPos) {
      const s = this.zoom * this.devicePixelRatio;
      const x1 = Math.min(this.marqueeStartPt.x, this.currentPointerPos.x);
      const y1 = Math.min(this.marqueeStartPt.y, this.currentPointerPos.y);
      const w = Math.abs(this.currentPointerPos.x - this.marqueeStartPt.x);
      const h = Math.abs(this.currentPointerPos.y - this.marqueeStartPt.y);

      const sx = (x1 + this.panX) * s;
      const sy = (y1 + this.panY) * s;
      const sw = w * s;
      const sh = h * s;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 145, 255, 0.12)';
      ctx.fillRect(sx, sy, sw, sh);

      ctx.strokeStyle = '#0091ff';
      ctx.lineWidth = 1.6 * this.devicePixelRatio;
      ctx.setLineDash([6 * this.devicePixelRatio, 4 * this.devicePixelRatio]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.restore();
    }

    // 7. Draw freehand lasso selection preview (Stylus)
    if (this.isLassoSelecting && this.lassoPoints.length > 1) {
      const s = this.zoom * this.devicePixelRatio;
      ctx.save();
      ctx.beginPath();
      const p0 = this.lassoPoints[0];
      ctx.moveTo((p0.x + this.panX) * s, (p0.y + this.panY) * s);
      for (let i = 1; i < this.lassoPoints.length; i++) {
        const pt = this.lassoPoints[i];
        ctx.lineTo((pt.x + this.panX) * s, (pt.y + this.panY) * s);
      }
      ctx.closePath();

      ctx.fillStyle = 'rgba(79, 172, 254, 0.14)';
      ctx.fill();

      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2 * this.devicePixelRatio;
      ctx.setLineDash([6 * this.devicePixelRatio, 4 * this.devicePixelRatio]);
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 4 * this.devicePixelRatio;
      ctx.stroke();
      ctx.restore();
    }

    // 8. Draw persistent selection outline & rotate icon for currently selected object (select tool only)
    if (this.activeTool === 'select' && this.selectedObjectId && !this.isDraggingObject && !this.isResizingObject) {
      const selObj =
        this.selectedGroupObject?.id === this.selectedObjectId
          ? this.selectedGroupObject
          : this.committedObjects.find((o) => o.id === this.selectedObjectId);
      if (selObj) {
        this.drawSelectionOutline(ctx, this.getObjectBoundingBox(selObj), selObj);
      }
    }

  }

  // ─── Laser Animation Loop ─────────────────────────────────────────────────

  private startLaserAnimation(): void {
    if (this.laserRaf !== null) return;
    const tick = () => {
      const now = Date.now();
      this.laserTrails = this.laserTrails.filter((t) => now - t.startTime < t.duration);
      this.renderActiveLayer();

      if (this.laserTrails.length > 0) {
        this.laserRaf = requestAnimationFrame(tick);
      } else {
        this.laserRaf = null;
        this.clearActiveCanvas();
      }
    };
    this.laserRaf = requestAnimationFrame(tick);
  }

  // ─── Shape Creation & Rendering ───────────────────────────────────────────

  private drawShapePreview(
    ctx: CanvasRenderingContext2D,
    origin: Point,
    current: Point,
    shapeType: ShapeType
  ): void {
    const s = this.zoom * this.devicePixelRatio;
    const x0 = (origin.x + this.panX) * s;
    const y0 = (origin.y + this.panY) * s;
    const x1 = (current.x + this.panX) * s;
    const y1 = (current.y + this.panY) * s;

    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);

    ctx.save();
    ctx.strokeStyle = this.currentShapeStyle.strokeColor;
    ctx.lineWidth = this.currentShapeStyle.strokeWidth * this.zoom * this.devicePixelRatio;
    ctx.fillStyle = this.currentShapeStyle.fillColor;
    ctx.globalAlpha = this.currentShapeStyle.fillOpacity;

    if (this.currentShapeStyle.strokeStyle === 'dashed') {
      ctx.setLineDash([8, 6]);
    } else if (this.currentShapeStyle.strokeStyle === 'dotted') {
      ctx.setLineDash([2, 4]);
    }

    switch (shapeType) {
      case 'line':
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity || 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        break;

      case 'arrow':
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity || 1;
        ctx.fillStyle = this.currentShapeStyle.strokeColor;
        this.drawArrow(ctx, x0, y0, x1, y1);
        break;

      case 'arc':
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity || 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2, y0 - h * 0.5, x1, y1);
        ctx.stroke();
        break;

      case 'rect':
      case 'recognition':
        if (this.currentShapeStyle.fillOpacity > 0) ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
        ctx.strokeRect(x, y, w, h);
        break;

      case 'roundedRect':
        this.drawRoundedRect(ctx, x, y, w, h, 16 * this.zoom);
        break;

      case 'circle': {
        const radius = Math.min(w, h) / 2;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
        if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
        ctx.stroke();
        break;
      }

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(
          x + w / 2,
          y + h / 2,
          Math.max(1, w / 2),
          Math.max(1, h / 2),
          0,
          0,
          Math.PI * 2
        );
        if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
        ctx.stroke();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
        ctx.stroke();
        break;

      case 'rightTriangle':
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
        ctx.stroke();
        break;

      case 'parallelogram':
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w * 0.75, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
        ctx.stroke();
        break;

      case 'trapezoid':
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y);
        ctx.lineTo(x + w * 0.8, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
        ctx.stroke();
        break;

      case 'polygon':
        this.drawStar(ctx, x + w / 2, y + h / 2, 5, w / 2, w / 4);
        break;

      case 'polyline':
        ctx.globalAlpha = this.currentShapeStyle.strokeOpacity || 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo((x0 + x1) / 2, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        break;
    }
    ctx.restore();
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): void {
    const headlen = 16 * this.zoom * this.devicePixelRatio;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(
      x1 - headlen * Math.cos(angle - Math.PI / 6),
      y1 - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x1 - headlen * Math.cos(angle + Math.PI / 6),
      y1 - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const radius = Math.min(r, Math.min(w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
    ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
    ctx.stroke();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    if (this.currentShapeStyle.fillOpacity > 0) ctx.fill();
    ctx.globalAlpha = this.currentShapeStyle.strokeOpacity;
    ctx.stroke();
  }

  // ─── Intelligent Gesture Recognition ──────────────────────────────────────

  private recognizeGesture(pts: Point[]): { shapeType: ShapeType; origin: Point; current: Point } {
    if (pts.length < 3) {
      return { shapeType: 'line', origin: pts[0], current: pts[pts.length - 1] };
    }

    const start = pts[0];
    const end = pts[pts.length - 1];

    let totalLength = 0;
    let minX = pts[0].x,
      maxX = pts[0].x,
      minY = pts[0].y,
      maxY = pts[0].y;
    for (let i = 0; i < pts.length; i++) {
      minX = Math.min(minX, pts[i].x);
      maxX = Math.max(maxX, pts[i].x);
      minY = Math.min(minY, pts[i].y);
      maxY = Math.max(maxY, pts[i].y);
      if (i > 0) {
        totalLength += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      }
    }

    const width = Math.max(10, maxX - minX);
    const height = Math.max(10, maxY - minY);
    const diag = Math.hypot(width, height);
    const chordDist = Math.hypot(end.x - start.x, end.y - start.y);
    const straightness = totalLength > 0 ? chordDist / totalLength : 1;

    // Open gesture: start and end are far apart
    const isOpen = chordDist > 0.22 * diag;

    if (isOpen) {
      // Check for arrow: last 30% of gesture turns back or creates a barb
      let isArrow = false;
      const endSliceStart = Math.floor(pts.length * 0.7);
      if (pts.length >= 6) {
        const vMain = { x: pts[endSliceStart].x - start.x, y: pts[endSliceStart].y - start.y };
        const vHead = { x: end.x - pts[endSliceStart].x, y: end.y - pts[endSliceStart].y };
        const dot = vMain.x * vHead.x + vMain.y * vHead.y;
        const mag1 = Math.hypot(vMain.x, vMain.y);
        const mag2 = Math.hypot(vHead.x, vHead.y);
        if (mag1 > 0 && mag2 > 0) {
          const cosAngle = dot / (mag1 * mag2);
          if (cosAngle < 0.25) {
            isArrow = true;
          }
        }
      }

      if (isArrow) {
        return { shapeType: 'arrow', origin: start, current: end };
      }

      if (straightness > 0.7) {
        return { shapeType: 'line', origin: start, current: end };
      }

      return { shapeType: 'arc', origin: start, current: end };
    }

    // Closed gesture: circle, ellipse, triangle, or rectangle
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const radii = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;
    const varianceR =
      radii.reduce((sum, r) => sum + Math.pow(r - meanR, 2), 0) / radii.length;
    const stdDevR = Math.sqrt(varianceR);
    const circularity = meanR > 0 ? stdDevR / meanR : 1;
    const aspectRatio = width / height;

    if (circularity < 0.22 && aspectRatio >= 0.75 && aspectRatio <= 1.33) {
      return { shapeType: 'circle', origin: { x: minX, y: minY }, current: { x: maxX, y: maxY } };
    }

    if (circularity < 0.28 && (aspectRatio < 0.75 || aspectRatio > 1.33)) {
      return { shapeType: 'ellipse', origin: { x: minX, y: minY }, current: { x: maxX, y: maxY } };
    }

    const corners = this.detectCorners(pts);
    if (corners.length === 3) {
      return { shapeType: 'triangle', origin: { x: minX, y: minY }, current: { x: maxX, y: maxY } };
    }

    return { shapeType: 'rect', origin: { x: minX, y: minY }, current: { x: maxX, y: maxY } };
  }

  private detectCorners(pts: Point[]): Point[] {
    const corners: Point[] = [];
    const step = Math.max(2, Math.floor(pts.length / 14));
    for (let i = step; i < pts.length - step; i += step) {
      const pPrev = pts[i - step];
      const pCurr = pts[i];
      const pNext = pts[i + step];
      const v1 = { x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y };
      const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const m1 = Math.hypot(v1.x, v1.y);
      const m2 = Math.hypot(v2.x, v2.y);
      if (m1 > 3 && m2 > 3) {
        const cos = dot / (m1 * m2);
        if (cos < 0.5) {
          corners.push(pCurr);
        }
      }
    }
    return corners;
  }

  private finalizeRecognizedShape(
    recognizedType: ShapeType,
    origin: Point,
    current: Point
  ): void {
    const isLinear = recognizedType === 'line' || recognizedType === 'arrow' || recognizedType === 'arc';
    const x = isLinear ? origin.x : Math.min(origin.x, current.x);
    const y = isLinear ? origin.y : Math.min(origin.y, current.y);
    const width = isLinear ? current.x - origin.x : Math.max(15, Math.abs(current.x - origin.x));
    const height = isLinear ? current.y - origin.y : Math.max(15, Math.abs(current.y - origin.y));

    const shapeObj: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: recognizedType,
      x,
      y,
      width,
      height,
      rotation: 0,
      fillColor: this.currentShapeStyle.fillColor,
      fillOpacity: isLinear ? 0 : this.currentShapeStyle.fillOpacity,
      strokeColor: this.currentShapeStyle.strokeColor,
      strokeWidth: this.currentShapeStyle.strokeWidth,
      strokeOpacity: 1.0,
      strokeStyle: this.currentShapeStyle.strokeStyle,
      locked: false,
      layerId: this.currentLayerId,
    };

    // Immediately render to committed canvas to guarantee zero-flicker persistence
    this.renderObject(this.committedCtx, shapeObj);
    this.committedObjects.push(shapeObj);
    this.locallyCommittedIds.add(shapeObj.id);

    this.callbacks.onShapeComplete?.(shapeObj);
    this.selectedObjectId = shapeObj.id;
    this.callbacks.onSelectObject?.(shapeObj);
  }

  private finalizeShape(origin: Point, current: Point): void {
    let shapeType = this.activeTool === 'line' ? 'line' : this.currentShapeStyle.shapeType;
    const isLinear = shapeType === 'line' || shapeType === 'arrow' || shapeType === 'arc';

    const x = isLinear ? origin.x : Math.min(origin.x, current.x);
    const y = isLinear ? origin.y : Math.min(origin.y, current.y);
    const width = isLinear ? current.x - origin.x : Math.max(10, Math.abs(current.x - origin.x));
    const height = isLinear ? current.y - origin.y : Math.max(10, Math.abs(current.y - origin.y));

    const shapeObj: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType,
      x,
      y,
      width,
      height,
      rotation: 0,
      fillColor: this.currentShapeStyle.fillColor,
      fillOpacity: isLinear ? 0 : this.currentShapeStyle.fillOpacity,
      strokeColor: this.currentShapeStyle.strokeColor,
      strokeWidth: this.currentShapeStyle.strokeWidth,
      strokeOpacity: 1.0,
      strokeStyle: this.currentShapeStyle.strokeStyle,
      locked: false,
      layerId: this.currentLayerId,
    };

    // Immediately render to committed canvas to guarantee zero-flicker persistence
    this.renderObject(this.committedCtx, shapeObj);
    this.committedObjects.push(shapeObj);
    this.locallyCommittedIds.add(shapeObj.id);

    this.callbacks.onShapeComplete?.(shapeObj);
    this.selectedObjectId = shapeObj.id;
    this.callbacks.onSelectObject?.(shapeObj);
  }

  // ─── Eraser Engine ────────────────────────────────────────────────────────

  private drawEraserIndicator(ctx: CanvasRenderingContext2D, pos: Point): void {
    const s = this.zoom * this.devicePixelRatio;
    const cx = (pos.x + this.panX) * s;
    const cy = (pos.y + this.panY) * s;
    const r = this.eraserRadius * this.zoom * this.devicePixelRatio;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(33, 150, 243, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#0091ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private eraseAtPoint(pos: Point, prevPos?: Point): void {
    const r = this.eraserRadius;
    const session = this.eraseSession;
    const fromPt = prevPos || pos;

    // Fast GPU visual erase directly on committedCtx with zero latency
    const s = this.zoom * this.devicePixelRatio;
    const p1 = { x: (fromPt.x + this.panX) * s, y: (fromPt.y + this.panY) * s };
    const p2 = { x: (pos.x + this.panX) * s, y: (pos.y + this.panY) * s };
    const rScreen = r * s;

    this.committedCtx.save();
    this.committedCtx.globalCompositeOperation = 'destination-out';
    this.committedCtx.beginPath();
    this.committedCtx.arc(p2.x, p2.y, rScreen, 0, Math.PI * 2);
    this.committedCtx.fill();
    if (distSq(p1, p2) > 0.5) {
      this.committedCtx.beginPath();
      this.committedCtx.lineWidth = rScreen * 2;
      this.committedCtx.lineCap = 'round';
      this.committedCtx.moveTo(p1.x, p1.y);
      this.committedCtx.lineTo(p2.x, p2.y);
      this.committedCtx.stroke();
    }
    this.committedCtx.restore();

    // Fast swept bounding box pre-rejection in document coordinates
    const sweepMinX = Math.min(fromPt.x, pos.x) - r - 20;
    const sweepMaxX = Math.max(fromPt.x, pos.x) + r + 20;
    const sweepMinY = Math.min(fromPt.y, pos.y) - r - 20;
    const sweepMaxY = Math.max(fromPt.y, pos.y) + r + 20;

    if (this.eraserMode === 'stroke' || this.eraserMode === 'area') {
      const modifiedObjects: CanvasObject[] = [];
      let didModify = false;

      for (let i = 0; i < this.committedObjects.length; i++) {
        const obj = this.committedObjects[i];
        const layer = this.layersMap.get(obj.layerId);
        if (obj.locked || (layer && (layer.locked || !layer.visible))) {
          modifiedObjects.push(obj);
          continue;
        }

        const bbox = obj.type === 'stroke'
          ? (obj as StrokeObject).bbox || this.computeBBox((obj as StrokeObject).points, (obj as StrokeObject).style.width)
          : this.getObjectBoundingBox(obj);

        if (bbox.x + bbox.width < sweepMinX || bbox.x > sweepMaxX || bbox.y + bbox.height < sweepMinY || bbox.y > sweepMaxY) {
          modifiedObjects.push(obj);
          continue;
        }

        if (obj.type === 'stroke') {
          const stroke = obj as StrokeObject;
          if (!this.strokeIntersectsCircle(stroke, pos, r) && !this.strokeIntersectsCircle(stroke, fromPt, r)) {
            modifiedObjects.push(stroke);
            continue;
          }

          didModify = true;
          const threshold = r + stroke.style.width / 2;
          const threshSq = threshold * threshold;

          const subSegments: Point[][] = [];
          let currentSeg: Point[] = [];

          for (let j = 0; j < stroke.points.length; j++) {
            const pt = stroke.points[j];
            const isErased = distSq(pt, pos) <= threshSq || distSq(pt, fromPt) <= threshSq || distToSegmentSquared(pt, fromPt, pos) <= threshSq;

            if (!isErased) {
              currentSeg.push(pt);
            } else {
              if (currentSeg.length >= 1) {
                subSegments.push(currentSeg);
              }
              currentSeg = [];
            }
          }
          if (currentSeg.length >= 1) {
            subSegments.push(currentSeg);
          }

          const splitPieces: StrokeObject[] = subSegments.map((pts) => ({
            id: uuidv4(),
            type: 'stroke',
            points: pts,
            style: { ...stroke.style },
            bbox: this.computeBBox(pts, stroke.style.width),
            locked: false,
            layerId: stroke.layerId,
            createdAt: Date.now(),
          }));

          if (session) {
            if (session.newStrokes.has(stroke.id)) {
              session.newStrokes.delete(stroke.id);
            } else {
              session.originalObjects.set(stroke.id, stroke);
              session.removedIds.add(stroke.id);
            }
            for (const sp of splitPieces) {
              session.newStrokes.set(sp.id, sp);
            }
          } else {
            this.callbacks.onSplitStroke?.(stroke.id, splitPieces);
          }

          for (const sp of splitPieces) {
            modifiedObjects.push(sp);
          }
        } else if (this.eraserMode === 'area') {
          if (this.objectIntersectsCircle(obj, pos, r) || this.objectIntersectsCircle(obj, fromPt, r)) {
            didModify = true;
            if (session) {
              session.originalObjects.set(obj.id, obj);
              session.removedIds.add(obj.id);
            }
          } else {
            modifiedObjects.push(obj);
          }
        } else {
          modifiedObjects.push(obj);
        }
      }

      if (didModify) {
        this.committedObjects = modifiedObjects;
        this.locallyCommittedIds.clear();
      }
      return;
    }

    // Object eraser mode: remove entire object touched
    const remainingObjects: CanvasObject[] = [];
    let didRemove = false;
    const removedIds: string[] = [];

    for (const obj of this.committedObjects) {
      const layer = this.layersMap.get(obj.layerId);
      if (obj.locked || (layer && (layer.locked || !layer.visible))) {
        remainingObjects.push(obj);
        continue;
      }

      const bbox = obj.type === 'stroke'
        ? (obj as StrokeObject).bbox || this.computeBBox((obj as StrokeObject).points, (obj as StrokeObject).style.width)
        : this.getObjectBoundingBox(obj);

      if (bbox.x + bbox.width < sweepMinX || bbox.x > sweepMaxX || bbox.y + bbox.height < sweepMinY || bbox.y > sweepMaxY) {
        remainingObjects.push(obj);
        continue;
      }

      const intersects =
        obj.type === 'stroke'
          ? (this.strokeIntersectsCircle(obj as StrokeObject, pos, r) || this.strokeIntersectsCircle(obj as StrokeObject, fromPt, r))
          : (this.objectIntersectsCircle(obj, pos, r) || this.objectIntersectsCircle(obj, fromPt, r));

      if (intersects) {
        didRemove = true;
        removedIds.push(obj.id);
        if (session) {
          session.originalObjects.set(obj.id, obj);
          session.removedIds.add(obj.id);
        }
      } else {
        remainingObjects.push(obj);
      }
    }

    if (didRemove) {
      this.committedObjects = remainingObjects;
      this.locallyCommittedIds.clear();
      this.requestCommittedRender();
      if (!session && removedIds.length > 0) {
        this.callbacks.onEraseObjects?.(removedIds);
      }
    }
  }

  private strokeIntersectsCircle(stroke: StrokeObject, center: Point, radius: number): boolean {
    const pts = stroke.points;
    if (pts.length === 0) return false;
    const threshold = radius + stroke.style.width / 2;
    const threshSq = threshold * threshold;

    // Fast O(1) bounding box pre-check to reject non-intersecting strokes instantly
    let bbox = stroke.bbox;
    if (!bbox && pts.length > 0) {
      bbox = this.computeBBox(pts, stroke.style.width);
      stroke.bbox = bbox;
    }
    if (bbox) {
      const closestX = Math.max(bbox.x, Math.min(center.x, bbox.x + bbox.width));
      const closestY = Math.max(bbox.y, Math.min(center.y, bbox.y + bbox.height));
      const dx = center.x - closestX;
      const dy = center.y - closestY;
      if (dx * dx + dy * dy > threshSq) return false;
    }

    const len = pts.length;
    const step = len > 60 ? 2 : 1;
    for (let i = 0; i < len; i += step) {
      const p1 = pts[i];
      if (distSq(p1, center) <= threshSq) return true;
      if (i < len - 1) {
        const p2 = pts[Math.min(len - 1, i + step)];
        if (distToSegmentSquared(center, p1, p2) <= threshSq) return true;
      }
    }
    return false;
  }

  private objectIntersectsCircle(obj: CanvasObject, center: Point, radius: number): boolean {
    const bbox = this.getObjectBoundingBox(obj);
    const closestX = Math.max(bbox.x, Math.min(center.x, bbox.x + bbox.width));
    const closestY = Math.max(bbox.y, Math.min(center.y, bbox.y + bbox.height));
    const dx = center.x - closestX;
    const dy = center.y - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  // ─── Selection, Handle Hit Testing & Resizing ─────────────────────────────

  private hitTest(pt: Point): CanvasObject | null {
    // Sort from highest layer order to lowest layer so top layers (text, shapes, drawing) are hit-tested before background media
    const sortedObjects = [...this.committedObjects].sort((a, b) => {
      const orderA = this.layersMap.get(a.layerId)?.order ?? 2;
      const orderB = this.layersMap.get(b.layerId)?.order ?? 2;
      return orderB - orderA;
    });

    for (const obj of sortedObjects) {
      if (obj.locked) continue;
      const layer = this.layersMap.get(obj.layerId);
      if (layer && (!layer.visible || layer.locked)) continue;

      const bbox = this.getObjectBoundingBox(obj);
      if (
        pt.x >= bbox.x &&
        pt.x <= bbox.x + bbox.width &&
        pt.y >= bbox.y &&
        pt.y <= bbox.y + bbox.height
      ) {
        return obj;
      }
    }
    return null;
  }

  private getObjectBoundingBox(obj: CanvasObject): BoundingBox {
    if (obj.type === 'stroke') {
      return (obj as StrokeObject).bbox;
    }
    if (obj.type === 'group') {
      const g = obj as GroupObject;
      if (g.bbox) return g.bbox;
      return { x: g.x, y: g.y, width: g.width, height: g.height };
    }
    if (obj.type === 'shape') {
      const s = obj as ShapeObject;
      if (s.shapeType === 'line' || s.shapeType === 'arrow' || s.shapeType === 'arc') {
        const x = Math.min(s.x, s.x + s.width);
        const y = Math.min(s.y, s.y + s.height);
        const w = Math.max(16, Math.abs(s.width));
        const h = Math.max(16, Math.abs(s.height));
        return { x: x - 8, y: y - 8, width: w + 16, height: h + 16 };
      }
      if (s.rotation && s.rotation % 360 !== 0) {
        const rad = (s.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const w = Math.abs(s.width) * cos + Math.abs(s.height) * sin;
        const h = Math.abs(s.width) * sin + Math.abs(s.height) * cos;
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        return {
          x: cx - w / 2,
          y: cy - h / 2,
          width: Math.max(10, w),
          height: Math.max(10, h),
        };
      }
      return {
        x: s.x,
        y: s.y,
        width: Math.max(10, Math.abs(s.width)),
        height: Math.max(10, Math.abs(s.height)),
      };
    }
    if (obj.type === 'text') {
      const t = obj as TextObject;
      const isLatex = t.isLatex || isLatexSyntax(t.content);

      let tw = t.width;
      let th = t.height;

      if (!tw || !th) {
        if (isLatex) {
          const m = measureLatexSize(t.content, t.fontSize || 24);
          tw = tw || m.width;
          th = th || m.height;
        } else {
          tw = tw || 200;
          th = th || 40;
        }
      }

      if (t.rotation && t.rotation % 360 !== 0) {
        const rad = (t.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const w = tw * cos + th * sin;
        const h = tw * sin + th * cos;
        const cx = t.x + tw / 2;
        const cy = t.y + th / 2;
        return {
          x: cx - w / 2,
          y: cy - h / 2,
          width: Math.max(40, w),
          height: Math.max(24, h),
        };
      }
      return { x: t.x, y: t.y, width: tw, height: th };
    }
    if (obj.type === 'image') {
      const img = obj as ImageObject;
      if (img.rotation && img.rotation % 360 !== 0) {
        const rad = (img.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const w = Math.abs(img.width) * cos + Math.abs(img.height) * sin;
        const h = Math.abs(img.width) * sin + Math.abs(img.height) * cos;
        const cx = img.x + img.width / 2;
        const cy = img.y + img.height / 2;
        return {
          x: cx - w / 2,
          y: cy - h / 2,
          width: Math.max(10, w),
          height: Math.max(10, h),
        };
      }
      return { x: img.x, y: img.y, width: img.width, height: img.height };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  public createGroupFromObjects(objects: CanvasObject[]): GroupObject {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const obj of objects) {
      const b = this.getObjectBoundingBox(obj);
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }
    const bbox: BoundingBox = {
      x: minX,
      y: minY,
      width: Math.max(10, maxX - minX),
      height: Math.max(10, maxY - minY),
    };
    return {
      id: `group_${uuidv4()}`,
      type: 'group',
      objects,
      bbox,
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      rotation: 0,
      locked: objects.some((o) => o.locked),
      layerId: objects[0]?.layerId || 'default',
    };
  }

  private objectIntersectsRect(obj: CanvasObject, rect: BoundingBox): boolean {
    const b = this.getObjectBoundingBox(obj);
    const disjoint =
      b.x + b.width < rect.x ||
      b.x > rect.x + rect.width ||
      b.y + b.height < rect.y ||
      b.y > rect.y + rect.height;
    if (disjoint) return false;

    if (obj.type === 'stroke') {
      const str = obj as StrokeObject;
      for (const p of str.points) {
        if (p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height) {
          return true;
        }
      }
    }
    return true;
  }

  private objectIntersectsPolygon(obj: CanvasObject, poly: Point[]): boolean {
    if (poly.length < 3) return false;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of poly) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const polyBbox: BoundingBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    if (!this.objectIntersectsRect(obj, polyBbox)) return false;

    if (obj.type === 'stroke') {
      const str = obj as StrokeObject;
      for (const pt of str.points) {
        if (pointInPolygon(pt, poly)) return true;
      }
      return false;
    }

    const b = this.getObjectBoundingBox(obj);
    const center: Point = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    if (pointInPolygon(center, poly)) return true;

    const corners: Point[] = [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x + b.width, y: b.y + b.height },
      { x: b.x, y: b.y + b.height },
    ];
    for (const c of corners) {
      if (pointInPolygon(c, poly)) return true;
    }

    for (const p of poly) {
      if (p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height) {
        return true;
      }
    }

    return false;
  }

  public hitTestResizeHandle(pt: Point, obj: CanvasObject): ResizeHandle | null {
    const s = this.zoom;
    const hitRadius = 16 / s;
    const hitSq = hitRadius * hitRadius;

    if (obj.type === 'shape') {
      const sh = obj as ShapeObject;
      if (sh.shapeType === 'line' || sh.shapeType === 'arrow' || sh.shapeType === 'arc') {
        const startPt = { x: sh.x, y: sh.y };
        const endPt = { x: sh.x + sh.width, y: sh.y + sh.height };
        if (distSq(pt, startPt) <= hitSq) return 'start';
        if (distSq(pt, endPt) <= hitSq) return 'end';
        return null;
      }
    }

    const bbox = this.getObjectBoundingBox(obj);
    const padDoc = 12 / s;

    // 1. Top-Right Rotate Handle (Circle at x + width + padDoc, y - padDoc or x + width, y)
    const rotHitRadius = 24 / s;
    const rotHandlePt = {
      x: bbox.x + bbox.width + padDoc,
      y: bbox.y - padDoc,
    };
    const rotAltPt = {
      x: bbox.x + bbox.width,
      y: bbox.y,
    };
    if (
      distSq(pt, rotHandlePt) <= rotHitRadius * rotHitRadius ||
      distSq(pt, rotAltPt) <= rotHitRadius * rotHitRadius
    ) {
      return 'rotate';
    }

    // 2. Corner Resizing Handles (NW, SW, SE - NO 'ne' handle as it is reserved for Rotate)
    const cornerHitRadius = 20 / s;
    const cornerHitSq = cornerHitRadius * cornerHitRadius;

    // NW corner
    if (
      distSq(pt, { x: bbox.x - padDoc, y: bbox.y - padDoc }) <= cornerHitSq ||
      distSq(pt, { x: bbox.x, y: bbox.y }) <= hitSq
    ) {
      return 'nw';
    }
    // SW corner
    if (
      distSq(pt, { x: bbox.x - padDoc, y: bbox.y + bbox.height + padDoc }) <= cornerHitSq ||
      distSq(pt, { x: bbox.x, y: bbox.y + bbox.height }) <= hitSq
    ) {
      return 'sw';
    }
    // SE corner
    if (
      distSq(pt, { x: bbox.x + bbox.width + padDoc, y: bbox.y + bbox.height + padDoc }) <= cornerHitSq ||
      distSq(pt, { x: bbox.x + bbox.width, y: bbox.y + bbox.height }) <= hitSq
    ) {
      return 'se';
    }

    // Edge midpoints
    const edgeHandles: { handle: ResizeHandle; x: number; y: number }[] = [
      { handle: 'n', x: bbox.x + bbox.width / 2, y: bbox.y },
      { handle: 'e', x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 },
      { handle: 's', x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height },
      { handle: 'w', x: bbox.x, y: bbox.y + bbox.height / 2 },
    ];

    for (const h of edgeHandles) {
      if (distSq(pt, { x: h.x, y: h.y }) <= hitSq) {
        return h.handle;
      }
    }

    return null;
  }

  private updateCursorForHandle(handle: ResizeHandle | null): void {
    if (!handle) {
      this.updateToolCursor();
      return;
    }
    switch (handle) {
      case 'nw':
      case 'se':
        this.activeCanvas.style.cursor = 'nwse-resize';
        break;
      case 'ne':
      case 'sw':
        this.activeCanvas.style.cursor = 'nesw-resize';
        break;
      case 'n':
      case 's':
        this.activeCanvas.style.cursor = 'ns-resize';
        break;
      case 'e':
      case 'w':
        this.activeCanvas.style.cursor = 'ew-resize';
        break;
      case 'rotate':
        this.activeCanvas.style.cursor = 'grab';
        break;
      case 'start':
      case 'end':
        this.activeCanvas.style.cursor = 'move';
        break;
      default:
        this.updateToolCursor();
        break;
    }
  }

  private rotateObjectGeometry(
    obj: CanvasObject,
    deltaAngle: number,
    deltaDeg: number,
    cx: number,
    cy: number
  ): CanvasObject {
    if (obj.type === 'stroke') {
      const str = obj as StrokeObject;
      const cos = Math.cos(deltaAngle);
      const sin = Math.sin(deltaAngle);
      const pts = str.points.map((p) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return {
          ...p,
          x: cx + dx * cos - dy * sin,
          y: cy + dx * sin + dy * cos,
        };
      });
      return {
        ...str,
        points: pts,
        bbox: this.computeBBox(pts, str.style.width),
      };
    }

    if (obj.type === 'shape') {
      const sh = obj as ShapeObject;
      const cos = Math.cos(deltaAngle);
      const sin = Math.sin(deltaAngle);

      if (sh.shapeType === 'line' || sh.shapeType === 'arrow' || sh.shapeType === 'arc') {
        const x1 = sh.x, y1 = sh.y;
        const x2 = sh.x + sh.width, y2 = sh.y + sh.height;
        const nx1 = cx + (x1 - cx) * cos - (y1 - cy) * sin;
        const ny1 = cy + (x1 - cx) * sin + (y1 - cy) * cos;
        const nx2 = cx + (x2 - cx) * cos - (y2 - cy) * sin;
        const ny2 = cy + (x2 - cx) * sin + (y2 - cy) * cos;
        return {
          ...sh,
          x: nx1,
          y: ny1,
          width: nx2 - nx1,
          height: ny2 - ny1,
        };
      }

      const scx = sh.x + sh.width / 2;
      const scy = sh.y + sh.height / 2;
      const newScx = cx + (scx - cx) * cos - (scy - cy) * sin;
      const newScy = cy + (scx - cx) * sin + (scy - cy) * cos;
      const newRot = Math.round(((sh.rotation || 0) + deltaDeg) % 360);
      return {
        ...sh,
        x: newScx - sh.width / 2,
        y: newScy - sh.height / 2,
        rotation: (newRot + 360) % 360,
      };
    }

    if (obj.type === 'text') {
      const t = obj as TextObject;
      const cos = Math.cos(deltaAngle);
      const sin = Math.sin(deltaAngle);
      const tw = t.width || 200;
      const th = t.height || 40;
      const tcx = t.x + tw / 2;
      const tcy = t.y + th / 2;
      const newTcx = cx + (tcx - cx) * cos - (tcy - cy) * sin;
      const newTcy = cy + (tcx - cx) * sin + (tcy - cy) * cos;
      const newRot = Math.round(((t.rotation || 0) + deltaDeg) % 360);
      return {
        ...t,
        x: newTcx - tw / 2,
        y: newTcy - th / 2,
        rotation: (newRot + 360) % 360,
      };
    }

    if (obj.type === 'image') {
      const img = obj as ImageObject;
      const cos = Math.cos(deltaAngle);
      const sin = Math.sin(deltaAngle);
      const icx = img.x + img.width / 2;
      const icy = img.y + img.height / 2;
      const newIcx = cx + (icx - cx) * cos - (icy - cy) * sin;
      const newIcy = cy + (icx - cx) * sin + (icy - cy) * cos;
      const newRot = Math.round(((img.rotation || 0) + deltaDeg) % 360);
      return {
        ...img,
        x: newIcx - img.width / 2,
        y: newIcy - img.height / 2,
        rotation: (newRot + 360) % 360,
      };
    }

    if (obj.type === 'group') {
      const g = obj as GroupObject;
      const rotatedChildren = g.objects.map((child) =>
        this.rotateObjectGeometry(child, deltaAngle, deltaDeg, cx, cy)
      );

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const c of rotatedChildren) {
        const b = this.getObjectBoundingBox(c);
        if (b.x < minX) minX = b.x;
        if (b.y < minY) minY = b.y;
        if (b.x + b.width > maxX) maxX = b.x + b.width;
        if (b.y + b.height > maxY) maxY = b.y + b.height;
      }
      const newBbox: BoundingBox = {
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
      };
      return {
        ...g,
        x: newBbox.x,
        y: newBbox.y,
        width: newBbox.width,
        height: newBbox.height,
        bbox: newBbox,
        objects: rotatedChildren,
        rotation: Math.round(((g.rotation || 0) + deltaDeg + 360) % 360),
      };
    }

    return obj;
  }

  private applyResizeToObject(
    obj: CanvasObject,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    currentPos?: Point
  ): CanvasObject {
    if (handle === 'rotate') {
      const bbox = this.getObjectBoundingBox(obj);
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      const curPt = currentPos || {
        x: this.resizeStartDocPoint.x + deltaX,
        y: this.resizeStartDocPoint.y + deltaY,
      };

      const distMoved = Math.hypot(curPt.x - this.resizeStartDocPoint.x, curPt.y - this.resizeStartDocPoint.y);
      // Pure tap or click without dragging does NOT rotate
      if (distMoved < 3) {
        return obj;
      }

      const startAngle = Math.atan2(
        this.resizeStartDocPoint.y - cy,
        this.resizeStartDocPoint.x - cx
      );
      const currentAngle = Math.atan2(curPt.y - cy, curPt.x - cx);

      const deltaAngle = currentAngle - startAngle;
      const deltaDeg = (deltaAngle * 180) / Math.PI;

      return this.rotateObjectGeometry(obj, deltaAngle, deltaDeg, cx, cy);
    }

    if (obj.type === 'shape') {
      const sh = obj as ShapeObject;
      if (sh.shapeType === 'line' || sh.shapeType === 'arrow' || sh.shapeType === 'arc') {
        if (handle === 'start') {
          return {
            ...sh,
            x: sh.x + deltaX,
            y: sh.y + deltaY,
            width: sh.width - deltaX,
            height: sh.height - deltaY,
          };
        }
        if (handle === 'end') {
          return {
            ...sh,
            width: sh.width + deltaX,
            height: sh.height + deltaY,
          };
        }
      }

      let { x, y, width, height } = sh;
      switch (handle) {
        case 'se':
          width += deltaX;
          height += deltaY;
          break;
        case 'e':
          width += deltaX;
          break;
        case 's':
          height += deltaY;
          break;
        case 'ne':
          y += deltaY;
          width += deltaX;
          height -= deltaY;
          break;
        case 'n':
          y += deltaY;
          height -= deltaY;
          break;
        case 'nw':
          x += deltaX;
          y += deltaY;
          width -= deltaX;
          height -= deltaY;
          break;
        case 'w':
          x += deltaX;
          width -= deltaX;
          break;
        case 'sw':
          x += deltaX;
          width -= deltaX;
          height += deltaY;
          break;
      }

      return {
        ...sh,
        x,
        y,
        width: Math.max(10, width),
        height: Math.max(10, height),
      };
    }

    if (obj.type === 'text') {
      const t = obj as TextObject;
      const isLatex = t.isLatex || isLatexSyntax(t.content);
      const initW = t.width || (isLatex ? 200 : 200);
      const initH = t.height || (isLatex ? 50 : 40);
      const initFontSize = t.fontSize || (isLatex ? 32 : 20);

      if (isLatex) {
        const aspect = initW / Math.max(1, initH);
        let width = initW;
        let height = initH;
        let x = t.x;
        let y = t.y;
        let scale = 1;

        if (handle === 'se') {
          scale = Math.max(0.2, (initW + deltaX) / initW);
          width = Math.max(40, Math.round(initW * scale));
          height = Math.max(20, Math.round(width / aspect));
        } else if (handle === 'sw') {
          scale = Math.max(0.2, (initW - deltaX) / initW);
          const newW = Math.max(40, Math.round(initW * scale));
          const newH = Math.max(20, Math.round(newW / aspect));
          x = t.x + (initW - newW);
          width = newW;
          height = newH;
        } else if (handle === 'ne') {
          scale = Math.max(0.2, (initW + deltaX) / initW);
          const newW = Math.max(40, Math.round(initW * scale));
          const newH = Math.max(20, Math.round(newW / aspect));
          y = t.y + (initH - newH);
          width = newW;
          height = newH;
        } else if (handle === 'nw') {
          scale = Math.max(0.2, (initW - deltaX) / initW);
          const newW = Math.max(40, Math.round(initW * scale));
          const newH = Math.max(20, Math.round(newW / aspect));
          x = t.x + (initW - newW);
          y = t.y + (initH - newH);
          width = newW;
          height = newH;
        } else if (handle === 'e') {
          scale = Math.max(0.2, (initW + deltaX) / initW);
          width = Math.max(40, Math.round(initW * scale));
          height = Math.max(20, Math.round(width / aspect));
        } else if (handle === 'w') {
          scale = Math.max(0.2, (initW - deltaX) / initW);
          const newW = Math.max(40, Math.round(initW * scale));
          const newH = Math.max(20, Math.round(newW / aspect));
          x = t.x + (initW - newW);
          width = newW;
          height = newH;
        } else if (handle === 's') {
          scale = Math.max(0.2, (initH + deltaY) / initH);
          height = Math.max(20, Math.round(initH * scale));
          width = Math.max(40, Math.round(height * aspect));
        } else if (handle === 'n') {
          scale = Math.max(0.2, (initH - deltaY) / initH);
          const newH = Math.max(20, Math.round(initH * scale));
          const newW = Math.max(40, Math.round(newH * aspect));
          y = t.y + (initH - newH);
          width = newW;
          height = newH;
        }

        const fontSize = Math.max(12, Math.min(160, Math.round(initFontSize * scale)));
        return { ...t, x, y, width, height, fontSize };
      }

      let width = t.width || 200;
      let height = t.height || 40;
      let x = t.x;
      let y = t.y;

      switch (handle) {
        case 'se':
          width += deltaX;
          height += deltaY;
          break;
        case 'e':
          width += deltaX;
          break;
        case 's':
          height += deltaY;
          break;
        case 'ne':
          y += deltaY;
          width += deltaX;
          height -= deltaY;
          break;
        case 'n':
          y += deltaY;
          height -= deltaY;
          break;
        case 'nw':
          x += deltaX;
          y += deltaY;
          width -= deltaX;
          height -= deltaY;
          break;
        case 'w':
          x += deltaX;
          width -= deltaX;
          break;
        case 'sw':
          x += deltaX;
          width -= deltaX;
          height += deltaY;
          break;
      }

      const minW = 40;
      const minH = 24;
      if (width < minW) {
        if (handle === 'w' || handle === 'nw' || handle === 'sw') {
          x -= (minW - width);
        }
        width = minW;
      }
      if (height < minH) {
        if (handle === 'n' || handle === 'nw' || handle === 'ne') {
          y -= (minH - height);
        }
        height = minH;
      }

      return { ...t, x, y, width, height };
    }

    if (obj.type === 'image') {
      const img = obj as ImageObject;
      let width = img.width;
      let height = img.height;
      let x = img.x;
      let y = img.y;

      switch (handle) {
        case 'se':
          width += deltaX;
          height += deltaY;
          break;
        case 'e':
          width += deltaX;
          break;
        case 's':
          height += deltaY;
          break;
        case 'ne':
          y += deltaY;
          width += deltaX;
          height -= deltaY;
          break;
        case 'n':
          y += deltaY;
          height -= deltaY;
          break;
        case 'nw':
          x += deltaX;
          y += deltaY;
          width -= deltaX;
          height -= deltaY;
          break;
        case 'w':
          x += deltaX;
          width -= deltaX;
          break;
        case 'sw':
          x += deltaX;
          width -= deltaX;
          height += deltaY;
          break;
      }

      const minSize = 20;
      if (width < minSize) {
        if (handle === 'w' || handle === 'nw' || handle === 'sw') {
          x -= (minSize - width);
        }
        width = minSize;
      }
      if (height < minSize) {
        if (handle === 'n' || handle === 'nw' || handle === 'ne') {
          y -= (minSize - height);
        }
        height = minSize;
      }

      return {
        ...img,
        x,
        y,
        width: Math.round(width),
        height: Math.round(height),
      };
    }

    if (obj.type === 'stroke') {
      const str = obj as StrokeObject;
      const b = str.bbox;
      const scaleX = b.width > 0 ? Math.max(0.1, (b.width + deltaX) / b.width) : 1;
      const scaleY = b.height > 0 ? Math.max(0.1, (b.height + deltaY) / b.height) : 1;
      const pts = str.points.map((p) => ({
        ...p,
        x: b.x + (p.x - b.x) * scaleX,
        y: b.y + (p.y - b.y) * scaleY,
      }));
      return {
        ...str,
        points: pts,
        bbox: this.computeBBox(pts, str.style.width),
      };
    }

    if (obj.type === 'group') {
      const g = obj as GroupObject;
      const oldW = Math.max(10, g.width);
      const oldH = Math.max(10, g.height);
      let newW = oldW;
      let newH = oldH;
      let newX = g.x;
      let newY = g.y;

      switch (handle) {
        case 'se':
          newW += deltaX;
          newH += deltaY;
          break;
        case 'e':
          newW += deltaX;
          break;
        case 's':
          newH += deltaY;
          break;
        case 'ne':
          newY += deltaY;
          newW += deltaX;
          newH -= deltaY;
          break;
        case 'n':
          newY += deltaY;
          newH -= deltaY;
          break;
        case 'nw':
          newX += deltaX;
          newY += deltaY;
          newW -= deltaX;
          newH -= deltaY;
          break;
        case 'w':
          newX += deltaX;
          newW -= deltaX;
          break;
        case 'sw':
          newX += deltaX;
          newW -= deltaX;
          newH += deltaY;
          break;
      }

      newW = Math.max(20, newW);
      newH = Math.max(20, newH);
      const scaleX = newW / oldW;
      const scaleY = newH / oldH;

      const updatedChildren: CanvasObject[] = g.objects.map((child) => {
        if (child.type === 'stroke') {
          const str = child as StrokeObject;
          const pts = str.points.map((p) => ({
            ...p,
            x: newX + (p.x - g.x) * scaleX,
            y: newY + (p.y - g.y) * scaleY,
          }));
          return {
            ...str,
            points: pts,
            bbox: this.computeBBox(pts, str.style.width),
          };
        }
        if (child.type === 'shape' || child.type === 'text' || child.type === 'image') {
          const c = child as ShapeObject | TextObject | ImageObject;
          return {
            ...c,
            x: newX + (c.x - g.x) * scaleX,
            y: newY + (c.y - g.y) * scaleY,
            width: Math.max(10, c.width * scaleX),
            height: Math.max(10, c.height * scaleY),
          } as CanvasObject;
        }
        return child;
      });

      const updatedBbox: BoundingBox = {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      };

      return {
        ...g,
        x: newX,
        y: newY,
        width: newW,
        height: newH,
        bbox: updatedBbox,
        objects: updatedChildren,
      };
    }

    return obj;
  }

  private renderDraggedObject(initial: CanvasObject, deltaX: number, deltaY: number): void {
    this.clearActiveCanvas();
    const updated = this.applyDeltaToObject(initial, deltaX, deltaY);
    this.renderObject(this.activeCtx, updated);
    this.drawSelectionOutline(this.activeCtx, this.getObjectBoundingBox(updated), updated);
  }

  private applyDeltaToObject(obj: CanvasObject, deltaX: number, deltaY: number): CanvasObject {
    if (obj.type === 'stroke') {
      const s = obj as StrokeObject;
      const updatedPts = s.points.map((p) => ({ ...p, x: p.x + deltaX, y: p.y + deltaY }));
      const updatedBbox: BoundingBox = {
        x: s.bbox.x + deltaX,
        y: s.bbox.y + deltaY,
        width: s.bbox.width,
        height: s.bbox.height,
      };
      return { ...s, points: updatedPts, bbox: updatedBbox };
    }
    if (obj.type === 'group') {
      const g = obj as GroupObject;
      const updatedObjects = g.objects.map((child) => this.applyDeltaToObject(child, deltaX, deltaY));
      const updatedBbox: BoundingBox = {
        x: g.bbox.x + deltaX,
        y: g.bbox.y + deltaY,
        width: g.bbox.width,
        height: g.bbox.height,
      };
      return {
        ...g,
        x: g.x + deltaX,
        y: g.y + deltaY,
        bbox: updatedBbox,
        objects: updatedObjects,
      };
    }
    if (obj.type === 'shape' || obj.type === 'text' || obj.type === 'image') {
      return { ...obj, x: obj.x + deltaX, y: obj.y + deltaY } as CanvasObject;
    }
    return obj;
  }

  private drawSelectionOutline(
    ctx: CanvasRenderingContext2D,
    bbox: BoundingBox,
    obj?: CanvasObject
  ): void {
    const s = this.zoom * this.devicePixelRatio;
    ctx.save();
    ctx.strokeStyle = '#0091ff';
    ctx.lineWidth = 2 * this.devicePixelRatio;
    ctx.setLineDash([5, 5]);

    // Linear shapes (Line, Arrow): draw endpoint handles
    if (
      obj &&
      obj.type === 'shape' &&
      ((obj as ShapeObject).shapeType === 'line' || (obj as ShapeObject).shapeType === 'arrow')
    ) {
      const sh = obj as ShapeObject;
      const p1 = { x: (sh.x + this.panX) * s, y: (sh.y + this.panY) * s };
      const p2 = { x: (sh.x + sh.width + this.panX) * s, y: (sh.y + sh.height + this.panY) * s };

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const handleRadius = 6 * this.devicePixelRatio;
      ctx.setLineDash([]);
      for (const pt of [p1, p2]) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, handleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0091ff';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * this.devicePixelRatio;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    const x = (bbox.x + this.panX) * s;
    const y = (bbox.y + this.panY) * s;
    const w = bbox.width * s;
    const h = bbox.height * s;

    // 1. Dual-tone high-contrast dashed bounding box rectangle visible on any background
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 2.5 * this.devicePixelRatio;
    ctx.setLineDash([5 * this.devicePixelRatio, 4 * this.devicePixelRatio]);
    ctx.strokeRect(x, y, w, h);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * this.devicePixelRatio;
    ctx.setLineDash([5 * this.devicePixelRatio, 4 * this.devicePixelRatio]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    // 2. Three Corner White L-Brackets (NW, SW, SE; NO bracket at NE to match reference image)
    const pad = 12 * this.devicePixelRatio;
    const armLen = Math.min(22 * this.devicePixelRatio, Math.min(w, h) * 0.35);
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5 * this.devicePixelRatio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 3 * this.devicePixelRatio;
    ctx.shadowOffsetY = 1 * this.devicePixelRatio;

    // NW (⌜)
    ctx.beginPath();
    ctx.moveTo(x - pad + armLen, y - pad);
    ctx.lineTo(x - pad, y - pad);
    ctx.lineTo(x - pad, y - pad + armLen);
    ctx.stroke();

    // SW (⌞)
    ctx.beginPath();
    ctx.moveTo(x - pad, y + h + pad - armLen);
    ctx.lineTo(x - pad, y + h + pad);
    ctx.lineTo(x - pad + armLen, y + h + pad);
    ctx.stroke();

    // SE (⌟)
    ctx.beginPath();
    ctx.moveTo(x + w + pad - armLen, y + h + pad);
    ctx.lineTo(x + w + pad, y + h + pad);
    ctx.lineTo(x + w + pad, y + h + pad - armLen);
    ctx.stroke();

    // 3. Four Midpoint Circular Edge Handles (●) with glossy metallic 3D sheen
    ctx.shadowBlur = 3 * this.devicePixelRatio;
    ctx.shadowOffsetY = 1 * this.devicePixelRatio;
    const handleRadius = 7.5 * this.devicePixelRatio;
    const midpoints = [
      { x: x + w / 2, y }, // North
      { x: x + w, y: y + h / 2 }, // East
      { x: x + w / 2, y: y + h }, // South
      { x, y: y + h / 2 }, // West
    ];

    for (const pt of midpoints) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        pt.x - 2 * this.devicePixelRatio,
        pt.y - 2 * this.devicePixelRatio,
        1,
        pt.x,
        pt.y,
        handleRadius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#e2e8f0');
      grad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.2 * this.devicePixelRatio;
      ctx.stroke();
    }

    // 4. Top-Right Rotate Circular Button (⟳) matching reference image
    const rotX = x + w + pad;
    const rotY = y - pad;
    const rotRadius = 14 * this.devicePixelRatio;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4 * this.devicePixelRatio;
    ctx.shadowOffsetY = 1.5 * this.devicePixelRatio;

    ctx.beginPath();
    ctx.arc(rotX, rotY, rotRadius, 0, Math.PI * 2);
    const rotGrad = ctx.createRadialGradient(
      rotX - 3 * this.devicePixelRatio,
      rotY - 3 * this.devicePixelRatio,
      1,
      rotX,
      rotY,
      rotRadius
    );
    rotGrad.addColorStop(0, '#ffffff');
    rotGrad.addColorStop(0.75, '#f8fafc');
    rotGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = rotGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.2 * this.devicePixelRatio;
    ctx.stroke();

    // Turn off shadow for crisp icon rendering
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw circular clockwise arrow symbol (⟳) matching reference image
    const arrowR = rotRadius * 0.52;
    const startAng = 0.35 * Math.PI;
    const endAng = 1.88 * Math.PI;

    ctx.beginPath();
    ctx.arc(rotX, rotY, arrowR, startAng, endAng, false);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4 * this.devicePixelRatio;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Triangular arrowhead at the end angle pointing clockwise along tangent
    const tipX = rotX + Math.cos(endAng) * arrowR;
    const tipY = rotY + Math.sin(endAng) * arrowR;
    const tanX = -Math.sin(endAng);
    const tanY = Math.cos(endAng);
    const headLen = 5.5 * this.devicePixelRatio;
    const headW = 4 * this.devicePixelRatio;
    const normX = -tanY;
    const normY = tanX;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * tanX + headW * normX, tipY - headLen * tanY + headW * normY);
    ctx.lineTo(tipX - headLen * tanX - headW * normX, tipY - headLen * tanY - headW * normY);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.restore();
  }

  // ─── Stroke Finalization ──────────────────────────────────────────────────

  private finalizeStroke(): void {
    if (!this.activeStroke) return;
    const stroke = this.activeStroke;
    this.activeStroke = null;
    this.clearActiveCanvas();

    if (stroke.points.length === 0) return;

    // Laser pen: ephemeral trail with rapid blink before disappearing.
    // NEVER pass to onStrokeComplete or docState!
    if (stroke.style.penType === 'laser') {
      this.laserTrails.push({
        id: stroke.id,
        points: stroke.points,
        style: { ...stroke.style },
        startTime: Date.now(),
        duration: 2500,
        blinkStartTime: 1400,
      });
      this.startLaserAnimation();
      return;
    }

    const bbox = this.computeBBox(stroke.points, stroke.style.width);
    const strokeObj: StrokeObject = {
      id: stroke.id,
      type: 'stroke',
      points: stroke.points,
      style: stroke.style,
      bbox,
      locked: false,
      layerId: stroke.layerId,
      createdAt: Date.now(),
    };

    // Immediately commit to local committedCtx and committedObjects
    this.renderObject(this.committedCtx, strokeObj);
    this.committedObjects.push(strokeObj);
    this.locallyCommittedIds.add(strokeObj.id);

    this.callbacks.onStrokeComplete?.(strokeObj);
  }

  // ─── Committed Objects Rendering ──────────────────────────────────────────

  public setSelectedObject(obj: CanvasObject | null): void {
    if (!obj) {
      this.selectedObjectId = null;
      this.selectedGroupObject = null;
      if (!this.activeStroke && !this.shapeOrigin) {
        this.clearActiveCanvas();
      }
    } else if (obj.type === 'group') {
      this.selectedGroupObject = obj as GroupObject;
      this.selectedObjectId = obj.id;
      const childMap = new Map((obj as GroupObject).objects.map((c) => [c.id, c]));
      this.committedObjects = this.committedObjects.map((c) => childMap.get(c.id) || c);
      this.requestActiveRender();
    } else {
      this.selectedObjectId = obj.id;
      this.selectedGroupObject = null;
      const idx = this.committedObjects.findIndex((c) => c.id === obj.id);
      if (idx >= 0) {
        this.committedObjects[idx] = obj;
      }
      this.requestActiveRender();
    }
  }

  public redrawCommitted(
    objects: CanvasObject[],
    selectedId?: string | null,
    selectedObj?: CanvasObject | null,
    forceRedraw = false
  ): void {
    if (selectedObj !== undefined) {
      if (selectedObj && selectedObj.type === 'group') {
        this.selectedGroupObject = selectedObj as GroupObject;
        this.selectedObjectId = selectedObj.id;
      } else if (selectedObj) {
        this.selectedObjectId = selectedObj.id;
        this.selectedGroupObject = null;
      } else {
        this.selectedObjectId = null;
        this.selectedGroupObject = null;
      }
    } else if (selectedId !== undefined) {
      this.selectedObjectId = selectedId;
      if (!selectedId) {
        this.selectedGroupObject = null;
      }
    }

    // High performance writing fast-path:
    // If incoming objects array contains strokes/shapes confirmed by the document store that
    // were ALREADY incrementally painted by DrawingEngine into committedCtx, do NOT clearRect!
    if (
      !forceRedraw &&
      !this.isDraggingObject &&
      !this.isResizingObject &&
      this.locallyCommittedIds.size > 0 &&
      objects.length >= this.committedObjects.length
    ) {
      const incomingLast = objects[objects.length - 1];
      if (incomingLast && this.locallyCommittedIds.has(incomingLast.id)) {
        for (const obj of objects) {
          this.locallyCommittedIds.delete(obj.id);
        }
        this.committedObjects = objects;
        this.updateSelectionOutlineIfActive();
        return;
      }
    }

    this.locallyCommittedIds.clear();
    this.committedObjects = [...objects];

    const { width, height } = this.committedCanvas;
    this.committedCtx.clearRect(0, 0, width, height);

    // Build a set of hidden IDs if we are actively dragging or resizing
    const hiddenIds = new Set<string>();
    if (this.isDraggingObject || this.isResizingObject) {
      if (this.selectedGroupObject) {
        for (const child of this.selectedGroupObject.objects) {
          hiddenIds.add(child.id);
        }
      }
      if (this.selectedObjectId) {
        hiddenIds.add(this.selectedObjectId);
      }
    }

    // Stable sort by layer order so imported-media (order 1) renders underneath drawing (order 2), shapes (order 3), text (order 4)
    const sortedObjects = [...objects].sort((a, b) => {
      const orderA = this.layersMap.get(a.layerId)?.order ?? 2;
      const orderB = this.layersMap.get(b.layerId)?.order ?? 2;
      return orderA - orderB;
    });

    for (const obj of sortedObjects) {
      if (hiddenIds.has(obj.id)) {
        continue;
      }
      const layer = this.layersMap.get(obj.layerId);
      if (layer && !layer.visible) {
        continue;
      }
      if (layer && layer.opacity !== undefined && layer.opacity < 1) {
        this.committedCtx.save();
        this.committedCtx.globalAlpha *= layer.opacity;
        this.renderObject(this.committedCtx, obj);
        this.committedCtx.restore();
      } else {
        this.renderObject(this.committedCtx, obj);
      }
    }

    this.updateSelectionOutlineIfActive();
  }

  private updateSelectionOutlineIfActive(): void {
    if (this.activeTool === 'select' && this.selectedObjectId && !this.isDraggingObject && !this.isResizingObject) {
      if (this.selectedGroupObject && this.selectedGroupObject.id === this.selectedObjectId) {
        this.clearActiveCanvas();
        this.drawSelectionOutline(
          this.activeCtx,
          this.getObjectBoundingBox(this.selectedGroupObject),
          this.selectedGroupObject
        );
      } else {
        const selected = this.committedObjects.find((o) => o.id === this.selectedObjectId);
        if (selected) {
          this.clearActiveCanvas();
          this.drawSelectionOutline(this.activeCtx, this.getObjectBoundingBox(selected), selected);
        }
      }
    }
  }

  private renderObject(ctx: CanvasRenderingContext2D, obj: CanvasObject): void {
    switch (obj.type) {
      case 'stroke':
        this.renderStroke(ctx, obj as StrokeObject);
        break;
      case 'shape':
        this.renderShape(ctx, obj as ShapeObject);
        break;
      case 'text':
        this.renderText(ctx, obj as TextObject);
        break;
      case 'image':
        this.renderImage(ctx, obj as ImageObject);
        break;
      case 'group':
        for (const child of (obj as GroupObject).objects) {
          this.renderObject(ctx, child);
        }
        break;
    }
  }

  private renderStroke(ctx: CanvasRenderingContext2D, stroke: StrokeObject): void {
    if (stroke.points.length === 0) return;
    this.drawStyledStroke(ctx, stroke);
  }

  private renderShape(ctx: CanvasRenderingContext2D, shape: ShapeObject): void {
    const s = this.zoom * this.devicePixelRatio;
    const x = (shape.x + this.panX) * s;
    const y = (shape.y + this.panY) * s;
    const w = shape.width * s;
    const h = shape.height * s;

    ctx.save();
    if (shape.rotation && shape.shapeType !== 'line' && shape.shapeType !== 'arrow' && shape.shapeType !== 'arc') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth * this.zoom * this.devicePixelRatio;
    ctx.fillStyle = shape.fillColor;
    ctx.globalAlpha = shape.fillOpacity;

    if (shape.strokeStyle === 'dashed') {
      ctx.setLineDash([8, 6]);
    } else if (shape.strokeStyle === 'dotted') {
      ctx.setLineDash([2, 4]);
    }

    switch (shape.shapeType) {
      case 'rect':
      case 'recognition':
        if (shape.fillOpacity > 0) ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = shape.strokeOpacity;
        ctx.strokeRect(x, y, w, h);
        break;

      case 'roundedRect':
        this.drawRoundedRect(ctx, x, y, w, h, 16 * this.zoom);
        break;

      case 'circle': {
        const radius = Math.min(Math.abs(w), Math.abs(h)) / 2;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
        if (shape.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = shape.strokeOpacity;
        ctx.stroke();
        break;
      }

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(
          x + w / 2,
          y + h / 2,
          Math.max(1, Math.abs(w / 2)),
          Math.max(1, Math.abs(h / 2)),
          0,
          0,
          Math.PI * 2
        );
        if (shape.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = shape.strokeOpacity;
        ctx.stroke();
        break;

      case 'line':
        ctx.globalAlpha = shape.strokeOpacity || 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
        break;

      case 'arrow':
        ctx.globalAlpha = shape.strokeOpacity || 1;
        ctx.fillStyle = shape.strokeColor;
        this.drawArrow(ctx, x, y, x + w, y + h);
        break;

      case 'arc':
        ctx.globalAlpha = shape.strokeOpacity || 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + w / 2, y - h * 0.5, x + w, y + h);
        ctx.stroke();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        if (shape.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = shape.strokeOpacity;
        ctx.stroke();
        break;

      case 'rightTriangle':
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        if (shape.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = shape.strokeOpacity;
        ctx.stroke();
        break;

      case 'parallelogram':
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w * 0.75, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        if (shape.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = shape.strokeOpacity;
        ctx.stroke();
        break;

      case 'trapezoid':
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y);
        ctx.lineTo(x + w * 0.8, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        if (shape.fillOpacity > 0) ctx.fill();
        ctx.globalAlpha = shape.strokeOpacity;
        ctx.stroke();
        break;

      case 'polygon':
        this.drawStar(ctx, x + w / 2, y + h / 2, 5, Math.abs(w / 2), Math.abs(w / 4));
        break;

      case 'polyline':
        ctx.globalAlpha = shape.strokeOpacity || 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
        break;

      case 'cartesianAxes':
        ctx.globalAlpha = 1;
        this.renderCartesianAxes(ctx, shape, x, y, w, h);
        break;

      case 'ruler':
        ctx.globalAlpha = 1;
        this.renderRuler(ctx, shape, x, y, w, h);
        break;

      case 'protractor':
        ctx.globalAlpha = 1;
        this.renderProtractor(ctx, shape, x, y, w, h);
        break;

      case 'compass':
        ctx.globalAlpha = 1;
        this.renderCompass(ctx, shape, x, y, w, h);
        break;
    }
    ctx.restore();
  }

  /**
   * 1. Cartesian Coordinate Board with Points, Grid Lines, Origin (0,0), Arrows & Numbered Ticks
   */
  private renderCartesianAxes(
    ctx: CanvasRenderingContext2D,
    shape: ShapeObject,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const strokeColor = shape.strokeColor || '#38bdf8';
    const cx = x + w / 2;
    const cy = y + h / 2;
    const dpr = this.devicePixelRatio;

    ctx.save();
    ctx.globalAlpha = 1;

    // 0. Frosted Slate Cartesian Board Panel Background
    const boardRadius = 14 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, boardRadius);
    ctx.fillStyle =
      shape.fillColor && shape.fillColor !== 'transparent'
        ? shape.fillColor
        : 'rgba(15, 23, 42, 0.92)';
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Board Header Title Badge
    const tagFont = Math.max(10, Math.round(12 * dpr));
    ctx.font = `600 ${tagFont}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('📈 Cartesian Coordinate Plane (X-Y)', x + 16 * dpr, y + 14 * dpr);

    // 1. Grid Mesh Lines (Subtle coordinate square grid)
    const steps = 5;
    const stepX = (w * 0.40) / steps;
    const stepY = (h * 0.40) / steps;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.20)';
    ctx.lineWidth = 1 * dpr;
    ctx.setLineDash([3 * dpr, 3 * dpr]);

    for (let i = -steps; i <= steps; i++) {
      if (i === 0) continue;
      // Vertical grid lines
      const gx = cx + i * stepX;
      ctx.beginPath();
      ctx.moveTo(gx, cy - steps * stepY);
      ctx.lineTo(gx, cy + steps * stepY);
      ctx.stroke();

      // Horizontal grid lines
      const gy = cy - i * stepY;
      ctx.beginPath();
      ctx.moveTo(cx - steps * stepX, gy);
      ctx.lineTo(cx + steps * stepX, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Coordinate Point Dots (at all grid intersections)
    ctx.fillStyle = '#38bdf8';
    for (let i = -steps; i <= steps; i++) {
      for (let j = -steps; j <= steps; j++) {
        if (i === 0 && j === 0) continue;
        const px = cx + i * stepX;
        const py = cy - j * stepY;
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Main Axes with Directional Arrowheads
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = 2.5 * dpr;

    const arrowSize = 10 * dpr;
    const xSpan = steps * stepX + 18 * dpr;
    const ySpan = steps * stepY + 18 * dpr;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(cx - xSpan, cy);
    ctx.lineTo(cx + xSpan, cy);
    ctx.stroke();

    // Arrowhead on +X
    ctx.beginPath();
    ctx.moveTo(cx + xSpan, cy);
    ctx.lineTo(cx + xSpan - arrowSize, cy - arrowSize * 0.45);
    ctx.lineTo(cx + xSpan - arrowSize, cy + arrowSize * 0.45);
    ctx.closePath();
    ctx.fill();

    // Arrowhead on -X
    ctx.beginPath();
    ctx.moveTo(cx - xSpan, cy);
    ctx.lineTo(cx - xSpan + arrowSize, cy - arrowSize * 0.45);
    ctx.lineTo(cx - xSpan + arrowSize, cy + arrowSize * 0.45);
    ctx.closePath();
    ctx.fill();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(cx, cy + ySpan);
    ctx.lineTo(cx, cy - ySpan);
    ctx.stroke();

    // Arrowhead on +Y
    ctx.beginPath();
    ctx.moveTo(cx, cy - ySpan);
    ctx.lineTo(cx - arrowSize * 0.45, cy - ySpan + arrowSize);
    ctx.lineTo(cx + arrowSize * 0.45, cy - ySpan + arrowSize);
    ctx.closePath();
    ctx.fill();

    // Arrowhead on -Y
    ctx.beginPath();
    ctx.moveTo(cx, cy + ySpan);
    ctx.lineTo(cx - arrowSize * 0.45, cy + ySpan - arrowSize);
    ctx.lineTo(cx + arrowSize * 0.45, cy + ySpan - arrowSize);
    ctx.closePath();
    ctx.fill();

    // 4. Numbered Ticks along X and Y
    const fontSize = Math.max(10, Math.round(11 * dpr));
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.8 * dpr;

    const tickHalf = 5 * dpr;

    // X axis ticks & numbers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -steps; i <= steps; i++) {
      if (i === 0) continue;
      const tx = cx + i * stepX;
      ctx.beginPath();
      ctx.moveTo(tx, cy - tickHalf);
      ctx.lineTo(tx, cy + tickHalf);
      ctx.stroke();

      ctx.fillText(String(i), tx, cy + tickHalf + 4 * dpr);
    }

    // Y axis ticks & numbers
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let j = -steps; j <= steps; j++) {
      if (j === 0) continue;
      const ty = cy - j * stepY;
      ctx.beginPath();
      ctx.moveTo(cx - tickHalf, ty);
      ctx.lineTo(cx + tickHalf, ty);
      ctx.stroke();

      ctx.fillText(String(j), cx - tickHalf - 5 * dpr, ty);
    }

    // 5. Origin (0,0) indicator
    ctx.beginPath();
    ctx.arc(cx, cy, 3.8 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('O(0,0)', cx - 8 * dpr, cy + 6 * dpr);

    // 6. Axis Labels "x" and "y"
    const labelFont = Math.max(13, Math.round(15 * dpr));
    ctx.font = `bold italic ${labelFont}px 'Cambria Math', Georgia, serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', cx + xSpan + 5 * dpr, cy);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('y', cx, cy - ySpan - 4 * dpr);

    ctx.restore();
  }

  /**
   * 3. Calibrated Smart Classroom Ruler with Centimeter & Millimeter units
   */
  private renderRuler(
    ctx: CanvasRenderingContext2D,
    shape: ShapeObject,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const s = this.zoom * this.devicePixelRatio;
    const rLen = Math.max(100, w);
    const rH = Math.max(40, h);
    const dpr = this.devicePixelRatio;

    ctx.save();
    ctx.globalAlpha = 1;

    // 1. Acrylic Translucent Ruler Body with Gloss Reflection
    const radius = 8 * s;
    ctx.beginPath();
    ctx.roundRect(x, y, rLen, rH, radius);
    ctx.fillStyle = 'rgba(248, 250, 252, 0.90)';
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Subtle top reflection shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(x + 4, y + 2, rLen - 8, 3 * dpr);

    // 2. Calibrated Centimeter and Millimeter Ticks
    const pxPerCm = 32 * s;
    const totalCm = Math.floor((rLen - 44 * s) / pxPerCm);
    const startX = x + 24 * s;

    // Unit Emblem at the start
    const unitFont = Math.max(10, Math.round(12 * s));
    ctx.font = `bold ${unitFont}px Inter, sans-serif`;
    ctx.fillStyle = '#0369a1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('cm', x + 12 * s, y + 22 * s);

    // Number font for 0, 1, 2, 3...
    const numFont = Math.max(10, Math.round(12 * s));
    ctx.font = `600 ${numFont}px Inter, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0f172a';

    const mmTickLen = 6 * dpr;
    const halfCmTickLen = 11 * dpr;
    const cmTickLen = 17 * dpr;

    for (let cm = 0; cm <= totalCm; cm++) {
      const cmX = startX + cm * pxPerCm;
      if (cmX > x + rLen - 10 * s) break;

      // Centimeter major tick
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(cmX, y);
      ctx.lineTo(cmX, y + cmTickLen);
      ctx.stroke();

      // Number label
      ctx.fillText(String(cm), cmX, y + cmTickLen + 9 * dpr);

      // Millimeter sub-ticks (1 to 9)
      if (cm < totalCm) {
        ctx.lineWidth = 0.8 * dpr;
        for (let mm = 1; mm <= 9; mm++) {
          const mmX = cmX + (mm * pxPerCm) / 10;
          if (mmX > x + rLen - 8 * s) break;
          const tLen = mm === 5 ? halfCmTickLen : mmTickLen;
          ctx.beginPath();
          ctx.moveTo(mmX, y);
          ctx.lineTo(mmX, y + tLen);
          ctx.stroke();
        }
      }
    }

    // Ruler model / brand watermark
    const brandFont = Math.max(9, Math.round(10 * s));
    ctx.font = `500 ${brandFont}px Inter, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(`SmartNoteAI • ${totalCm} cm`, x + rLen - 16 * s, y + rH - 12 * s);

    ctx.restore();
  }

  /**
   * 5. 180° Classroom Protractor Instrument
   */
  private renderProtractor(
    ctx: CanvasRenderingContext2D,
    shape: ShapeObject,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const s = this.zoom * this.devicePixelRatio;
    const dpr = this.devicePixelRatio;
    const radius = Math.min(w / 2, h);
    const cx = x + w / 2;
    const cy = y + radius; // baseline is at bottom of semicircle

    ctx.save();
    ctx.globalAlpha = 1;

    // 1. Semi-Circular Frosted Acrylic Protractor Body
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 0, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(224, 242, 254, 0.78)';
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Center cutout semicircle
    const innerRadius = radius * 0.32;
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, Math.PI, 0, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.6)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // Origin crosshair at center
    ctx.beginPath();
    ctx.moveTo(cx - 10 * dpr, cy);
    ctx.lineTo(cx + 10 * dpr, cy);
    ctx.moveTo(cx, cy - 10 * dpr);
    ctx.lineTo(cx, cy);
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 2.5 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#0369a1';
    ctx.fill();

    // 2. Dual Degree Scales (0..180 and 180..0)
    const tickFont = Math.max(8, Math.round(10 * s));
    ctx.font = `600 ${tickFont}px Inter, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const outerTickR = radius;
    const majorTickLen = 14 * dpr;
    const midTickLen = 9 * dpr;
    const minorTickLen = 5 * dpr;

    for (let deg = 0; deg <= 180; deg++) {
      const rad = Math.PI - (deg * Math.PI) / 180; // 0 on right, 180 on left
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const isMajor = deg % 10 === 0;
      const isMid = deg % 5 === 0 && !isMajor;
      const tLen = isMajor ? majorTickLen : isMid ? midTickLen : minorTickLen;

      // Tick line
      ctx.beginPath();
      ctx.moveTo(cx + outerTickR * cos, cy - outerTickR * sin);
      ctx.lineTo(cx + (outerTickR - tLen) * cos, cy - (outerTickR - tLen) * sin);
      ctx.strokeStyle = isMajor ? '#0f172a' : '#64748b';
      ctx.lineWidth = isMajor ? 1.4 * dpr : 0.8 * dpr;
      ctx.stroke();

      // Outer Scale numbers every 10 degrees (0 -> 180)
      if (isMajor && deg >= 10 && deg <= 170) {
        const textR = outerTickR - majorTickLen - 10 * dpr;
        ctx.fillStyle = '#0f172a';
        ctx.fillText(String(deg), cx + textR * cos, cy - textR * sin);

        // Inner Scale numbers every 10 degrees (180 -> 0)
        const innerTextR = outerTickR - majorTickLen - 22 * dpr;
        ctx.fillStyle = '#0284c7';
        ctx.fillText(String(180 - deg), cx + innerTextR * cos, cy - innerTextR * sin);
      }
    }

    // 3. Central Angle Demonstration Ray (showing 60 degrees)
    const demoAngleDeg = 60;
    const demoRad = Math.PI - (demoAngleDeg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (radius * 0.92) * Math.cos(demoRad), cy - (radius * 0.92) * Math.sin(demoRad));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Angle Arc
    const arcR = radius * 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, Math.PI, demoRad, true);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.font = `bold ${Math.max(10, Math.round(12 * s))}px Inter, sans-serif`;
    ctx.fillStyle = '#dc2626';
    ctx.fillText('60°', cx + arcR * 1.25 * Math.cos(Math.PI - (30 * Math.PI) / 180), cy - arcR * 1.25 * Math.sin(Math.PI - (30 * Math.PI) / 180));

    // Protractor Label
    ctx.font = `bold ${Math.max(10, Math.round(11 * s))}px Inter, sans-serif`;
    ctx.fillStyle = '#0369a1';
    ctx.fillText('180° Classroom Protractor', cx, cy - radius * 0.16);

    ctx.restore();
  }

  /**
   * 6. Geometric Compass Instrument
   */
  private renderCompass(
    ctx: CanvasRenderingContext2D,
    shape: ShapeObject,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const s = this.zoom * this.devicePixelRatio;
    const dpr = this.devicePixelRatio;
    const topX = x + w / 2;
    const topY = y + 16 * s;
    const needleX = x + 20 * s;
    const needleY = y + h - 10 * s;
    const pencilX = x + w - 20 * s;
    const pencilY = y + h - 10 * s;

    ctx.save();
    ctx.globalAlpha = 1;

    // 1. Swept Circle Arc drawn by compass
    const radiusDoc = Math.abs(pencilX - needleX);
    ctx.beginPath();
    ctx.arc(needleX, needleY, radiusDoc, -Math.PI * 0.4, 0.1, false);
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Calibrated Radius Dimension Line & Readout
    ctx.beginPath();
    ctx.moveTo(needleX, needleY);
    ctx.lineTo(pencilX, pencilY);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();

    const radiusCm = (radiusDoc / (32 * s)).toFixed(1);
    const midX = (needleX + pencilX) / 2;
    const midY = needleY - 8 * dpr;
    ctx.font = `bold ${Math.max(11, Math.round(13 * s))}px Inter, sans-serif`;
    ctx.fillStyle = '#0284c7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`r = ${radiusCm} cm`, midX, midY);

    // 3. Top Knurled Hinge Knob
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(topX, topY, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Central brass hinge screw
    ctx.beginPath();
    ctx.arc(topX, topY, 4 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    // 4. Left Leg (Steel Needle Leg)
    ctx.beginPath();
    ctx.moveTo(topX - 3 * dpr, topY);
    ctx.lineTo(needleX + 3 * dpr, needleY - 14 * dpr);
    ctx.lineTo(needleX, needleY);
    ctx.lineTo(needleX - 3 * dpr, needleY - 14 * dpr);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Needle point dot
    ctx.beginPath();
    ctx.arc(needleX, needleY, 2.5 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // 5. Right Leg (Pencil Holder & Graphite Tip)
    ctx.beginPath();
    ctx.moveTo(topX + 3 * dpr, topY);
    ctx.lineTo(pencilX + 6 * dpr, pencilY - 26 * dpr);
    ctx.lineTo(pencilX - 6 * dpr, pencilY - 26 * dpr);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Yellow wooden pencil inserted in clamp
    ctx.beginPath();
    ctx.moveTo(pencilX - 4 * dpr, pencilY - 28 * dpr);
    ctx.lineTo(pencilX + 4 * dpr, pencilY - 28 * dpr);
    ctx.lineTo(pencilX + 4 * dpr, pencilY - 8 * dpr);
    ctx.lineTo(pencilX, pencilY);
    ctx.lineTo(pencilX - 4 * dpr, pencilY - 8 * dpr);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // Lead tip
    ctx.beginPath();
    ctx.moveTo(pencilX - 2 * dpr, pencilY - 4 * dpr);
    ctx.lineTo(pencilX + 2 * dpr, pencilY - 4 * dpr);
    ctx.lineTo(pencilX, pencilY);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Snaps pointer to the straight top edge of any visible ruler if within 24px distance
   */
  private snapPointToRulerIfNear(docPt: Point): Point {
    for (const obj of this.committedObjects) {
      if (obj.type === 'shape' && (obj as ShapeObject).shapeType === 'ruler') {
        const r = obj as ShapeObject;
        const rw = r.width || 480;
        const rh = r.height || 76;
        const rot = ((r.rotation || 0) * Math.PI) / 180;

        const cx = r.x + rw / 2;
        const cy = r.y + rh / 2;

        const cos = Math.cos(-rot);
        const sin = Math.sin(-rot);
        const relX = docPt.x - cx;
        const relY = docPt.y - cy;
        const localX = relX * cos - relY * sin;
        const localY = relX * sin + relY * cos;

        const topEdgeLocalY = -rh / 2;
        const snapDist = 24 / this.zoom;

        if (
          Math.abs(localY - topEdgeLocalY) <= snapDist &&
          localX >= -rw / 2 - 12 &&
          localX <= rw / 2 + 12
        ) {
          const clampedX = Math.max(-rw / 2, Math.min(rw / 2, localX));
          const cosF = Math.cos(rot);
          const sinF = Math.sin(rot);
          const worldX = cx + clampedX * cosF - topEdgeLocalY * sinF;
          const worldY = cy + clampedX * sinF + topEdgeLocalY * cosF;

          return {
            ...docPt,
            x: worldX,
            y: worldY,
          };
        }
      }
    }
    return docPt;
  }


  private renderText(ctx: CanvasRenderingContext2D, text: TextObject): void {
    const s = this.zoom * this.devicePixelRatio;
    const x = (text.x + this.panX) * s;
    const y = (text.y + this.panY) * s;

    ctx.save();
    const tw = (text.width || 200) * s;
    const th = (text.height || 40) * s;
    if (text.rotation) {
      const cx = x + tw / 2;
      const cy = y + th / 2;
      ctx.translate(cx, cy);
      ctx.rotate((text.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    if (text.backgroundColor && text.backgroundColor !== 'transparent') {
      ctx.fillStyle = text.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(x - 6, y - 4, (text.width || 200) * s + 12, (text.height || 40) * s + 8, 6);
      ctx.fill();
    }

    // Render LaTeX Mathematical Formulas with high-fidelity vector rendering
    const isLatex = text.isLatex || isLatexSyntax(text.content);
    if (isLatex) {
      const fontSize = text.fontSize || 32;
      const measured = measureLatexSize(text.content, fontSize);
      const targetW = text.width || measured.width;
      const targetH = text.height || measured.height;

      const img = getCachedLatexImage(
        text.id,
        text.content,
        text.color || '#ffffff',
        fontSize,
        targetW,
        targetH,
        () => {
          this.requestActiveRender();
          this.requestCommittedRender();
        }
      );
      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        // Fit within tw and th strictly preserving natural aspect ratio (never distorts or stretches!)
        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawW = tw;
        let drawH = tw / imgAspect;

        if (drawH > th) {
          drawH = th;
          drawW = th * imgAspect;
        }

        const drawX = x + (tw - drawW) / 2;
        const drawY = y + (th - drawH) / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }
      ctx.restore();
      return;
    }

    ctx.font = `${text.fontStyle || 'normal'} ${text.fontWeight || 400} ${
      text.fontSize * this.zoom * this.devicePixelRatio
    }px ${text.fontFamily || 'Inter, sans-serif'}`;
    ctx.fillStyle = text.color || '#ffffff';
    ctx.textBaseline = 'top';

    const lines = text.content.split('\n');
    const lineHeight = text.fontSize * 1.35 * this.zoom * this.devicePixelRatio;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    ctx.restore();
  }

  private renderImage(ctx: CanvasRenderingContext2D, imgObj: ImageObject): void {
    if (!imgObj.dataUrl) return;

    const s = this.zoom * this.devicePixelRatio;
    const x = (imgObj.x + this.panX) * s;
    const y = (imgObj.y + this.panY) * s;
    const w = imgObj.width * s;
    const h = imgObj.height * s;

    let img = this.imageCache.get(imgObj.dataUrl);
    if (!img) {
      img = new Image();
      img.onload = () => {
        this.requestActiveRender();
        this.requestCommittedRender();
      };
      img.src = imgObj.dataUrl;
      this.imageCache.set(imgObj.dataUrl, img);
    }

    if (!img.complete || img.naturalWidth === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (imgObj.opacity !== undefined) {
      ctx.globalAlpha = imgObj.opacity;
    }

    if (imgObj.rotation) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((imgObj.rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }

    ctx.restore();
  }

  // ─── Drawing Primitives & Magic Effects ───────────────────────────────────

  private drawMagicSparks(ctx: CanvasRenderingContext2D, pts: Point[]): void {
    const s = this.zoom * this.devicePixelRatio;
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 6;
    for (let i = 0; i < pts.length; i += 4) {
      const p = pts[i];
      const px = (p.x + this.panX) * s;
      const py = (p.y + this.panY) * s;
      this.drawStar(ctx, px, py, 4, 6 * this.zoom, 2.5 * this.zoom);
    }
    ctx.restore();
  }

  /**
   * Unified Stroke Dispatcher
   * Routes to specialized variable-width calligraphy and pen pipelines,
   * guaranteeing identical appearance on both active canvas and committed canvas.
   */
  private drawStyledStroke(
    ctx: CanvasRenderingContext2D,
    stroke: StrokeObject | ActiveStroke
  ): void {
    const pts = stroke.points;
    if (pts.length === 0) return;
    const style = stroke.style;

    if (style.penType === 'calligraphy' || style.penType === 'brush') {
      this.drawCalligraphyBrushStroke(ctx, pts, style);
      return;
    }

    if (style.penType === 'normal') {
      this.drawPenStroke(ctx, pts, style);
      return;
    }

    this.applyStrokeStyle(ctx, style);
    if (pts.length === 1) {
      this.drawDot(ctx, pts[0], style);
      return;
    }

    ctx.beginPath();
    this.drawSmoothCurve(ctx, pts, style);
    ctx.stroke();

    if (style.penType === 'magic') {
      this.drawMagicSparks(ctx, pts);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  }

  /**
   * Paint Brush & Calligraphy Brush Engine
   * Generates a continuous anti-aliased variable-width ribbon envelope.
   * - XP-Pen Deco mini 7 stylus pressure directly modulates stroke width smoothly.
   * - When pressure is disabled in software or using a mouse:
   *   Follows classic calligraphy chisel/soft brush dynamics:
   *   Thick downstrokes and cross-strokes, ultra-thin hairlines on loops/upstrokes,
   *   with smooth organic swells on curves matching Hindi Devanagari and English cursive.
   */
  private drawCalligraphyBrushStroke(
    ctx: CanvasRenderingContext2D,
    rawPts: Point[],
    style: StrokeStyle
  ): void {
    if (rawPts.length === 0) return;
    const s = this.zoom * this.devicePixelRatio;
    const toScreen = (p: Point) => ({ x: (p.x + this.panX) * s, y: (p.y + this.panY) * s });

    // Single point tap: draw clean circular dot
    if (rawPts.length === 1) {
      const p0 = toScreen(rawPts[0]);
      const initialR = Math.max(1, (style.width * 1.25 * s) / 2);
      ctx.save();
      ctx.fillStyle = style.color;
      ctx.globalAlpha = style.opacity;
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, initialR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Filter duplicate / micro points in doc space
    const pts: Point[] = [rawPts[0]];
    for (let i = 1; i < rawPts.length; i++) {
      const p = rawPts[i];
      const prev = pts[pts.length - 1];
      if (distSq(p, prev) >= 0.25 || i === rawPts.length - 1) {
        pts.push(p);
      }
    }

    if (pts.length <= 1) {
      const p0 = toScreen(pts[0]);
      ctx.save();
      ctx.fillStyle = style.color;
      ctx.globalAlpha = style.opacity;
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, Math.max(1, (style.width * s) / 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Check stylus hardware pressure
    let hasHardwarePressure = false;
    if (style.pressureSensitive !== false) {
      const p0 = pts[0].pressure ?? 0.5;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i].pressure ?? 0.5;
        if (Math.abs(p - p0) > 0.05 || (p !== 0.5 && p > 0.05 && p < 0.95)) {
          hasHardwarePressure = true;
          break;
        }
      }
    }

    // Gaussian moving average smoothing along points to eliminate hand tremor
    const smoothed: { pt: Point; pressure: number }[] = [];
    const numPts = pts.length;
    for (let i = 0; i < numPts; i++) {
      let wx = 0, wy = 0, wp = 0, totalW = 0;
      for (let j = -2; j <= 2; j++) {
        const idx = Math.max(0, Math.min(numPts - 1, i + j));
        const kernel = [0.1, 0.25, 0.3, 0.25, 0.1][j + 2];
        wx += pts[idx].x * kernel;
        wy += pts[idx].y * kernel;
        wp += (pts[idx].pressure ?? 0.5) * kernel;
        totalW += kernel;
      }
      smoothed.push({
        pt: { x: wx / totalW, y: wy / totalW },
        pressure: wp / totalW,
      });
    }

    // Fine-grained sampling along midpoint quadratic Bezier splines
    interface SamplePoint {
      x: number;
      y: number;
      r: number;
    }
    const samples: SamplePoint[] = [];
    const nibAngle = Math.PI / 4; // 45° angle for calligraphy chisel dynamics

    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = i === 0 ? smoothed[0].pt : {
        x: (smoothed[i].pt.x + smoothed[i - 1].pt.x) / 2,
        y: (smoothed[i].pt.y + smoothed[i - 1].pt.y) / 2,
      };
      const p1 = smoothed[i].pt;
      const p2 = i === smoothed.length - 2 ? smoothed[smoothed.length - 1].pt : {
        x: (smoothed[i].pt.x + smoothed[i + 1].pt.x) / 2,
        y: (smoothed[i].pt.y + smoothed[i + 1].pt.y) / 2,
      };

      const segDist = Math.hypot(p2.x - p0.x, p2.y - p0.y);
      const steps = Math.max(2, Math.min(30, Math.ceil(segDist / 1.5)));

      const pr0 = smoothed[i].pressure;
      const pr1 = smoothed[Math.min(smoothed.length - 1, i + 1)].pressure;

      for (let sIdx = 0; sIdx < steps; sIdx++) {
        if (i > 0 && sIdx === 0) continue;
        const u = sIdx / steps;
        const oneMinusU = 1 - u;
        const x = oneMinusU * oneMinusU * p0.x + 2 * oneMinusU * u * p1.x + u * u * p2.x;
        const y = oneMinusU * oneMinusU * p0.y + 2 * oneMinusU * u * p1.y + u * u * p2.y;
        const dx = 2 * oneMinusU * (p1.x - p0.x) + 2 * u * (p2.x - p1.x);
        const dy = 2 * oneMinusU * (p1.y - p0.y) + 2 * u * (p2.y - p1.y);
        const pr = pr0 * (1 - u) + pr1 * u;

        const heading = Math.atan2(dy, dx);
        const angleDiff = Math.abs(Math.sin(heading - nibAngle));

        let widthDoc: number;
        if (hasHardwarePressure) {
          const pNorm = Math.min(1, Math.max(0.08, pr));
          const pressMod = 0.35 + 1.65 * Math.pow(pNorm, 1.1);
          const nibMod = 0.8 + 0.2 * angleDiff;
          widthDoc = style.width * pressMod * nibMod;
        } else {
          const calligMod = 0.45 + 1.25 * Math.pow(angleDiff, 1.2);
          widthDoc = style.width * calligMod;
        }

        const scrX = (x + this.panX) * s;
        const scrY = (y + this.panY) * s;
        const radiusScr = Math.max(0.6, (widthDoc * s) / 2);

        samples.push({ x: scrX, y: scrY, r: radiusScr });
      }
    }

    this.renderContinuousRibbon(ctx, samples, style.color, style.opacity);
  }

  /**
   * Pen / Hard Pen Drawing Engine
   * - If stylus pressure is active: modulates thickness smoothly (0.45x .. 1.5x)
   * - If pressure is disabled in software (or mouse): keeps completely fixed width
   */
  private drawPenStroke(
    ctx: CanvasRenderingContext2D,
    pts: Point[],
    style: StrokeStyle
  ): void {
    if (pts.length === 0) return;

    let hasHardwarePressure = false;
    if (style.pressureSensitive !== false) {
      const p0 = pts[0].pressure ?? 0.5;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i].pressure ?? 0.5;
        if (Math.abs(p - p0) > 0.06 || (p !== 0.5 && p > 0.06 && p < 0.94)) {
          hasHardwarePressure = true;
          break;
        }
      }
    }

    // Fixed width when pressure is disabled or mouse
    if (!hasHardwarePressure) {
      ctx.save();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width * this.zoom * this.devicePixelRatio;
      ctx.globalAlpha = style.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (pts.length === 1) {
        this.drawDot(ctx, pts[0], style);
      } else {
        ctx.beginPath();
        this.drawSmoothCurve(ctx, pts, style);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // Stylus pressure active on Pen: smoothly vary width with pressure
    this.drawPressureVariableStroke(ctx, pts, style, (p) => {
      const pClamped = Math.min(1, Math.max(0.08, p));
      return style.width * (0.45 + 1.15 * pClamped);
    });
  }

  /**
   * Generalized smooth solid capsule segment engine for pressure-variable strokes
   */
  private drawPressureVariableStroke(
    ctx: CanvasRenderingContext2D,
    rawPts: Point[],
    style: StrokeStyle,
    computeWidth: (pressure: number) => number
  ): void {
    if (rawPts.length === 0) return;
    const s = this.zoom * this.devicePixelRatio;
    const toScreen = (p: Point) => ({ x: (p.x + this.panX) * s, y: (p.y + this.panY) * s });

    if (rawPts.length === 1) {
      const p0 = toScreen(rawPts[0]);
      const w = computeWidth(rawPts[0].pressure ?? 0.5);
      ctx.save();
      ctx.fillStyle = style.color;
      ctx.globalAlpha = style.opacity;
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, Math.max(0.6, (w * s) / 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Filter duplicate points in doc space
    const pts: Point[] = [rawPts[0]];
    for (let i = 1; i < rawPts.length; i++) {
      const p = rawPts[i];
      const prev = pts[pts.length - 1];
      if (distSq(p, prev) >= 0.25 || i === rawPts.length - 1) {
        pts.push(p);
      }
    }

    if (pts.length <= 1) {
      this.drawDot(ctx, pts[0], style);
      return;
    }

    // Gaussian moving average smoothing
    const smoothed: { pt: Point; pressure: number }[] = [];
    const numPts = pts.length;
    for (let i = 0; i < numPts; i++) {
      let wx = 0, wy = 0, wp = 0, totalW = 0;
      for (let j = -2; j <= 2; j++) {
        const idx = Math.max(0, Math.min(numPts - 1, i + j));
        const kernel = [0.1, 0.25, 0.3, 0.25, 0.1][j + 2];
        wx += pts[idx].x * kernel;
        wy += pts[idx].y * kernel;
        wp += (pts[idx].pressure ?? 0.5) * kernel;
        totalW += kernel;
      }
      smoothed.push({
        pt: { x: wx / totalW, y: wy / totalW },
        pressure: wp / totalW,
      });
    }

    interface SamplePoint {
      x: number;
      y: number;
      r: number;
    }
    const samples: SamplePoint[] = [];

    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = i === 0 ? smoothed[0].pt : {
        x: (smoothed[i].pt.x + smoothed[i - 1].pt.x) / 2,
        y: (smoothed[i].pt.y + smoothed[i - 1].pt.y) / 2,
      };
      const p1 = smoothed[i].pt;
      const p2 = i === smoothed.length - 2 ? smoothed[smoothed.length - 1].pt : {
        x: (smoothed[i].pt.x + smoothed[i + 1].pt.x) / 2,
        y: (smoothed[i].pt.y + smoothed[i + 1].pt.y) / 2,
      };

      const segDist = Math.hypot(p2.x - p0.x, p2.y - p0.y);
      const steps = Math.max(2, Math.min(30, Math.ceil(segDist / 1.5)));

      const pr0 = smoothed[i].pressure;
      const pr1 = smoothed[Math.min(smoothed.length - 1, i + 1)].pressure;

      for (let sIdx = 0; sIdx < steps; sIdx++) {
        if (i > 0 && sIdx === 0) continue;
        const u = sIdx / steps;
        const oneMinusU = 1 - u;
        const x = oneMinusU * oneMinusU * p0.x + 2 * oneMinusU * u * p1.x + u * u * p2.x;
        const y = oneMinusU * oneMinusU * p0.y + 2 * oneMinusU * u * p1.y + u * u * p2.y;
        const pr = pr0 * (1 - u) + pr1 * u;
        const w = computeWidth(pr);

        const scrX = (x + this.panX) * s;
        const scrY = (y + this.panY) * s;
        const radiusScr = Math.max(0.6, (w * s) / 2);

        samples.push({ x: scrX, y: scrY, r: radiusScr });
      }
    }

    this.renderContinuousRibbon(ctx, samples, style.color, style.opacity);
  }

  /**
   * Continuous anti-aliased single-path ribbon rendering
   * Replaces thousands of fragmented arc/fill draw calls with a single hardware-accelerated pass.
   */
  private renderContinuousRibbon(
    ctx: CanvasRenderingContext2D,
    samples: { x: number; y: number; r: number }[],
    color: string,
    opacity: number
  ): void {
    if (samples.length === 0) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    if (samples.length === 1) {
      ctx.beginPath();
      ctx.arc(samples[0].x, samples[0].y, samples[0].r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const n = samples.length;
    const left: { x: number; y: number }[] = [];
    const right: { x: number; y: number }[] = [];

    const firstDx = samples[1].x - samples[0].x;
    const firstDy = samples[1].y - samples[0].y;
    const lastDx = samples[n - 1].x - samples[n - 2].x;
    const lastDy = samples[n - 1].y - samples[n - 2].y;

    for (let i = 0; i < n; i++) {
      let dx: number;
      let dy: number;
      if (i === 0) {
        dx = firstDx;
        dy = firstDy;
      } else if (i === n - 1) {
        dx = lastDx;
        dy = lastDy;
      } else {
        dx = samples[i + 1].x - samples[i - 1].x;
        dy = samples[i + 1].y - samples[i - 1].y;
      }
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const r = samples[i].r;

      left.push({ x: samples[i].x + nx * r, y: samples[i].y + ny * r });
      right.push({ x: samples[i].x - nx * r, y: samples[i].y - ny * r });
    }

    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);

    // Left border curve
    for (let i = 1; i < n; i++) {
      const midX = (left[i - 1].x + left[i].x) / 2;
      const midY = (left[i - 1].y + left[i].y) / 2;
      ctx.quadraticCurveTo(left[i - 1].x, left[i - 1].y, midX, midY);
    }
    ctx.lineTo(left[n - 1].x, left[n - 1].y);

    // End cap
    const endAngle = Math.atan2(lastDy, lastDx);
    ctx.arc(samples[n - 1].x, samples[n - 1].y, samples[n - 1].r, endAngle - Math.PI / 2, endAngle + Math.PI / 2, false);

    // Right border curve in reverse
    ctx.lineTo(right[n - 1].x, right[n - 1].y);
    for (let i = n - 2; i >= 0; i--) {
      const midX = (right[i + 1].x + right[i].x) / 2;
      const midY = (right[i + 1].y + right[i].y) / 2;
      ctx.quadraticCurveTo(right[i + 1].x, right[i + 1].y, midX, midY);
    }
    ctx.lineTo(right[0].x, right[0].y);

    // Start cap
    const startAngle = Math.atan2(firstDy, firstDx);
    ctx.arc(samples[0].x, samples[0].y, samples[0].r, startAngle + Math.PI / 2, startAngle + (3 * Math.PI) / 2, false);

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Ultra-Smooth Curve Interpolation (Midpoint Quadratic Bezier Splines)
   * Eliminates jagged polygonal steps and micro-jitter without overshoot oscillations.
   */
  private drawSmoothCurve(
    ctx: CanvasRenderingContext2D,
    rawPts: Point[],
    _style: StrokeStyle
  ): void {
    if (rawPts.length === 0) return;
    const s = this.zoom * this.devicePixelRatio;
    const toScreen = (p: Point) => ({ x: (p.x + this.panX) * s, y: (p.y + this.panY) * s });

    if (rawPts.length === 1) {
      const p0 = toScreen(rawPts[0]);
      ctx.arc(p0.x, p0.y, 0.5, 0, Math.PI * 2);
      return;
    }

    if (rawPts.length === 2) {
      const p0 = toScreen(rawPts[0]);
      const p1 = toScreen(rawPts[1]);
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      return;
    }

    // Apply moving average smoothing to eliminate hand tremor
    const pts: Point[] = [];
    pts.push(rawPts[0]);
    for (let i = 1; i < rawPts.length - 1; i++) {
      pts.push({
        x: rawPts[i - 1].x * 0.25 + rawPts[i].x * 0.5 + rawPts[i + 1].x * 0.25,
        y: rawPts[i - 1].y * 0.25 + rawPts[i].y * 0.5 + rawPts[i + 1].y * 0.25,
      });
    }
    pts.push(rawPts[rawPts.length - 1]);

    const p0 = toScreen(pts[0]);
    const p1 = toScreen(pts[1]);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);

    for (let i = 1; i < pts.length - 1; i++) {
      const pCurr = toScreen(pts[i]);
      const pNext = toScreen(pts[i + 1]);
      const midX = (pCurr.x + pNext.x) / 2;
      const midY = (pCurr.y + pNext.y) / 2;
      ctx.quadraticCurveTo(pCurr.x, pCurr.y, midX, midY);
    }

    const pLast = toScreen(pts[pts.length - 1]);
    ctx.lineTo(pLast.x, pLast.y);
  }

  private drawDot(ctx: CanvasRenderingContext2D, pt: Point, style: StrokeStyle): void {
    const s = this.zoom * this.devicePixelRatio;
    ctx.fillStyle = style.color;
    ctx.globalAlpha = style.opacity;
    ctx.beginPath();
    ctx.arc(
      (pt.x + this.panX) * s,
      (pt.y + this.panY) * s,
      (style.width * this.zoom * this.devicePixelRatio) / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  private applyStrokeStyle(ctx: CanvasRenderingContext2D, style: StrokeStyle): void {
    const dpr = this.devicePixelRatio;
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width * this.zoom * dpr;
    ctx.globalAlpha = style.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;

    switch (style.penType) {
      case 'highlighter':
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineWidth = style.width * 2.5 * this.zoom * dpr;
        ctx.globalAlpha = 0.45;
        break;
      case 'laser':
        ctx.strokeStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 12 * this.zoom * dpr;
        ctx.lineWidth = style.width * 1.4 * this.zoom * dpr;
        break;
      case 'magic':
        ctx.strokeStyle = '#ffd166';
        ctx.shadowColor = '#fb8500';
        ctx.shadowBlur = 8 * this.zoom * dpr;
        break;
      case 'calligraphy':
        ctx.lineWidth = style.width * 2.0 * this.zoom * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        break;
      case 'dashed':
        ctx.setLineDash([style.width * 4 * this.zoom, style.width * 2 * this.zoom]);
        break;
      case 'dotted':
        ctx.setLineDash([1, style.width * 3 * this.zoom]);
        ctx.lineCap = 'round';
        break;
      case 'fine':
        ctx.lineWidth = Math.max(0.5, style.width * 0.5 * this.zoom * dpr);
        break;
      case 'brush':
        ctx.lineWidth = style.width * 2.2 * this.zoom * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        break;
      case 'flatBrush':
        ctx.lineWidth = style.width * 2.8 * this.zoom * dpr;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'bevel';
        break;
      case 'pattern':
        ctx.lineWidth = style.width * 1.6 * this.zoom * dpr;
        ctx.setLineDash([style.width * 3 * this.zoom, style.width * 1.5 * this.zoom]);
        break;
      default:
        ctx.setLineDash([]);
        break;
    }
  }

  private computeBBox(points: Point[], strokeWidth: number): BoundingBox {
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const pad = Math.max(strokeWidth * 2.0, 12);
    return {
      x: minX - pad,
      y: minY - pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
  }

  public clearActiveCanvas(): void {
    const { width, height } = this.activeCanvas;
    this.activeCtx.clearRect(0, 0, width, height);
  }

  private getToolCursor(): string {
    switch (this.activeTool) {
      case 'pen':
      case 'highlighter':
      case 'shape':
      case 'line':
        return 'crosshair';
      case 'eraser':
        return 'cell';
      case 'pan':
        return 'grab';
      case 'text':
        return 'text';
      default:
        return 'default';
    }
  }

  private updateToolCursor(): void {
    this.activeCanvas.style.cursor = this.getToolCursor();
  }

  private eventToDocPoint(e: PointerEvent): Point {
    const rect = this.activeCanvas.getBoundingClientRect();
    const dpr = this.devicePixelRatio;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;
    let pressure = 0.5;
    if (typeof e.pressure === 'number' && e.pressure > 0) {
      pressure = e.pressure;
    } else if (e.pointerType === 'pen') {
      pressure = e.buttons > 0 ? 0.35 : 0.5;
    }
    return {
      x: screenX / (this.zoom * dpr) - this.panX,
      y: screenY / (this.zoom * dpr) - this.panY,
      pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
      timestamp: e.timeStamp,
    };
  }

  // ─── Public Setters ───────────────────────────────────────────────────────

  setCallbacks(callbacks: DrawingEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  setActiveTool(tool: ToolId): void {
    this.activeTool = tool;
    this.isPointerDown = false;
    this.isDraggingObject = false;
    this.draggedObjectInitial = null;
    this.isResizingObject = false;
    this.activeResizeHandle = null;
    this.resizeObjectInitial = null;
    this.isMarqueeSelecting = false;
    this.marqueeStartPt = null;
    this.isLassoSelecting = false;
    this.lassoPoints = [];
    this.activeStroke = null;
    this.shapeOrigin = null;
    this.recognitionPoints = [];
    this.eraseSession = null;
    this.clearActiveCanvas();
    if (tool !== 'select') {
      this.selectedObjectId = null;
      this.selectedGroupObject = null;
      this.callbacks.onSelectObject?.(null);
    }
    this.requestActiveRender();
    this.redrawCommitted(this.committedObjects);
    this.updateToolCursor();
  }

  setStyle(style: Partial<StrokeStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  setShapeStyle(style: Partial<ShapeStyle>): void {
    this.currentShapeStyle = { ...this.currentShapeStyle, ...style };
  }

  setEraserMode(mode: EraserMode): void {
    this.eraserMode = mode;
  }

  setEraserRadius(radius: number): void {
    this.eraserRadius = radius;
  }

  setCloneMode(enabled: boolean): void {
    this.cloneMode = enabled;
  }

  setZoomAndPan(zoom: number, panX: number, panY: number): void {
    this.zoom = zoom;
    this.panX = panX;
    this.panY = panY;
    this.redrawCommitted(this.committedObjects);
  }

  setLayerId(layerId: string): void {
    this.currentLayerId = layerId;
  }

  setLayers(layers: Layer[]): void {
    this.layers = layers;
    this.layersMap = new Map(layers.map((l) => [l.id, l]));
    this.redrawCommitted(this.committedObjects);
  }

  docToScreenPoint(pt: Point): Point {
    const s = this.zoom * this.devicePixelRatio;
    return {
      x: (pt.x + this.panX) * s,
      y: (pt.y + this.panY) * s,
    };
  }

  screenToDocPoint(pt: Point): Point {
    const s = this.zoom * this.devicePixelRatio;
    return {
      x: pt.x / s - this.panX,
      y: pt.y / s - this.panY,
    };
  }

  zoomIn(): void {
    const newZoom = Math.min(5.0, this.zoom * 1.15);
    this.setZoomAndPan(newZoom, this.panX, this.panY);
    this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
  }

  zoomOut(): void {
    const newZoom = Math.max(0.15, this.zoom / 1.15);
    this.setZoomAndPan(newZoom, this.panX, this.panY);
    this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
  }

  zoomActual(): void {
    this.setZoomAndPan(1.0, 0, 0);
    this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
  }

  fitToPage(containerW: number, containerH: number, pageW: number = 1920, pageH: number = 1080): void {
    const pad = 60;
    const scale = Math.min((containerW - pad) / pageW, (containerH - pad) / pageH);
    const targetZoom = Math.max(0.15, Math.min(4.0, scale));
    const targetPanX = (containerW / targetZoom - pageW) / 2;
    const targetPanY = (containerH / targetZoom - pageH) / 2;
    this.setZoomAndPan(targetZoom, targetPanX, targetPanY);
    this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
  }

  fitToContent(containerW: number, containerH: number): void {
    if (this.committedObjects.length === 0) {
      this.fitToPage(containerW, containerH);
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const obj of this.committedObjects) {
      const b = this.getObjectBoundingBox(obj);
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }
    const pad = 80;
    const contentW = Math.max(100, maxX - minX + pad * 2);
    const contentH = Math.max(100, maxY - minY + pad * 2);
    const scale = Math.min(containerW / contentW, containerH / contentH);
    const targetZoom = Math.max(0.15, Math.min(4.0, scale));
    const centerX = minX - pad + contentW / 2;
    const centerY = minY - pad + contentH / 2;
    const targetPanX = containerW / (2 * targetZoom) - centerX;
    const targetPanY = containerH / (2 * targetZoom) - centerY;
    this.setZoomAndPan(targetZoom, targetPanX, targetPanY);
    this.callbacks.onViewChange?.(this.zoom, this.panX, this.panY);
  }

  setDevicePixelRatio(dpr: number): void {
    this.devicePixelRatio = dpr;
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.devicePixelRatio = dpr;
    for (const canvas of [this.committedCanvas, this.activeCanvas]) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    this.committedCtx.imageSmoothingEnabled = true;
    this.committedCtx.imageSmoothingQuality = 'high';
    this.activeCtx.imageSmoothingEnabled = true;
    this.activeCtx.imageSmoothingQuality = 'high';
    this.redrawCommitted(this.committedObjects);
  }

  dispose(): void {
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);
    if (this.laserRaf) cancelAnimationFrame(this.laserRaf);
    const canvas = this.activeCanvas;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('wheel', this.handleWheel);
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this.handleWindowBlur);
      window.removeEventListener('focus', this.handleWindowFocus);
    }
  }
}

// ─── Math Utilities ──────────────────────────────────────────────────────────

function distSq(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

function distToSegmentSquared(p: Point, v: Point, w: Point): number {
  const l2 = distSq(v, w);
  if (l2 === 0) return distSq(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distSq(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y),
  });
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
