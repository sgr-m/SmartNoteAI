/**
 * WhiteboardCanvas — Interactive drawing, shape, eraser, selection, and text canvas surface
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DrawingEngine } from '../engine/DrawingEngine';
import {
  StrokeObject,
  ShapeObject,
  TextObject,
  ImageObject,
  CanvasObject,
  GroupObject,
  Point,
  BoundingBox,
} from '../../shared/types';
import { InlineTextEditor } from './InlineTextEditor';
import { AddToResourceLibraryModal } from './AddToResourceLibraryModal';
import { AngleConstructionModal } from './subjectModals/AngleConstructionModal';
import { CartesianPlaneModal } from './subjectModals/CartesianPlaneModal';
import { FunctionPlotterModal } from './subjectModals/FunctionPlotterModal';
import { NumberLineModal } from './subjectModals/NumberLineModal';
import { Geometry3DModal } from './subjectModals/Geometry3DModal';
import { ResistorModal } from './subjectModals/ResistorModal';
import { CircuitDiagramModal } from './subjectModals/CircuitDiagramModal';
import { ForceVectorModal } from './subjectModals/ForceVectorModal';
import { FreeBodyDiagramModal } from './subjectModals/FreeBodyDiagramModal';
import { MotionDiagramModal } from './subjectModals/MotionDiagramModal';
import { PeriodicTableModal } from './subjectModals/PeriodicTableModal';
import { ElementCardModal } from './subjectModals/ElementCardModal';
import { BohrModelModal } from './subjectModals/BohrModelModal';
import { LabApparatusModal } from './subjectModals/LabApparatusModal';
import { isLatexSyntax } from '../services/latexService';
import { isTypingOrInputFocused } from '../utils/keyboardUtils';
import { v4 as uuidv4 } from 'uuid';
import './WhiteboardCanvas.css';

export function WhiteboardCanvas(): React.ReactElement {
  const {
    docState,
    docDispatch,
    toolState,
    shapeStyle,
    commandSystem,
    selectedObject,
    setSelectedObject,
    deleteSelectedObject,
    clipboardObject,
    copyObject,
    pasteObject,
    canPaste,
    cloneMode,
    setCloneMode,
    moveObjectLayer,
    flipObject,
    rotateObject,
    setObjectColor,
    setObjectLineWidth,
    toastMessage,
    setToastMessage,
    setZoom,
    setPan,
    setActiveTool,
    reducedMotion,
    closeAllPopups,
    undo,
    redo,
  } = useAppContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const committedCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DrawingEngine | null>(null);
  const bgImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Text modal state
  const [textModalPos, setTextModalPos] = useState<Point | null>(null);
  const [editingTextObj, setEditingTextObj] = useState<TextObject | null>(null);
  const [showAddToResourceModal, setShowAddToResourceModal] = useState(false);
  const [resourceObjectToSave, setResourceObjectToSave] = useState<CanvasObject | null>(null);

  // Subject Shape Interactive Edit Modals
  const [editingAngleShape, setEditingAngleShape] = useState<ShapeObject | null>(null);
  const [editingCartesianShape, setEditingCartesianShape] = useState<ShapeObject | null>(null);
  const [editingFunctionShape, setEditingFunctionShape] = useState<ShapeObject | null>(null);
  const [editingNumberLineShape, setEditingNumberLineShape] = useState<ShapeObject | null>(null);
  const [editingGeometry3DShape, setEditingGeometry3DShape] = useState<ShapeObject | null>(null);
  const [editingResistorShape, setEditingResistorShape] = useState<ShapeObject | null>(null);
  const [editingCircuitShape, setEditingCircuitShape] = useState<ShapeObject | null>(null);
  const [editingForceVectorShape, setEditingForceVectorShape] = useState<ShapeObject | null>(null);
  const [editingResultantShape, setEditingResultantShape] = useState<ShapeObject | null>(null);
  const [editingFbdShape, setEditingFbdShape] = useState<ShapeObject | null>(null);
  const [editingMotionShape, setEditingMotionShape] = useState<ShapeObject | null>(null);
  const [editingPeriodicTableShape, setEditingPeriodicTableShape] = useState<ShapeObject | null>(null);
  const [editingElementCardShape, setEditingElementCardShape] = useState<ShapeObject | null>(null);
  const [editingBohrModelShape, setEditingBohrModelShape] = useState<ShapeObject | null>(null);
  const [editingLabApparatusShape, setEditingLabApparatusShape] = useState<ShapeObject | null>(null);

  // Vertical Selection Pill Active Flyout Menu
  const [activeFlyout, setActiveFlyout] = useState<'none' | 'palette' | 'layer' | 'more' | 'thickness' | 'imageFit'>('none');

  // Close flyouts on selection change
  useEffect(() => {
    setActiveFlyout('none');
  }, [selectedObject?.id]);

  const currentPageIndex = docState.currentPageIndex;
  const currentPage = docState.lesson.pages[currentPageIndex];

  // Dynamic refs to guarantee callbacks never close over stale page indices or page data
  const currentPageIndexRef = useRef(currentPageIndex);
  currentPageIndexRef.current = currentPageIndex;

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const selectedObjectRef = useRef(selectedObject);
  selectedObjectRef.current = selectedObject;

  // Slide Transitions (Section 10)
  const [activeTransitionClass, setActiveTransitionClass] = useState<string>('');
  const prevPageIndexRef = useRef<number>(currentPageIndex);

  useEffect(() => {
    if (prevPageIndexRef.current !== currentPageIndex) {
      prevPageIndexRef.current = currentPageIndex;
      const transType = currentPage?.transition?.type;
      if (transType && transType !== 'none' && !reducedMotion) {
        const cls = `canvas-trans-${transType}`;
        setActiveTransitionClass(cls);
        const dur = currentPage?.transition?.duration || 400;
        const timer = setTimeout(() => {
          setActiveTransitionClass('');
        }, dur);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPageIndex, currentPage?.transition, reducedMotion]);

  // ─── Callbacks for DrawingEngine ──────────────────────────────────────────

  const handleStrokeComplete = useCallback((stroke: StrokeObject) => {
    const pageIndex = currentPageIndexRef.current;
    commandSystem.execute({
      id: uuidv4(),
      description: 'Add stroke',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex, object: stroke });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: stroke.id });
      },
    });
  }, [commandSystem, docDispatch]);

  const handleShapeComplete = useCallback((shape: ShapeObject) => {
    const pageIndex = currentPageIndexRef.current;
    commandSystem.execute({
      id: uuidv4(),
      description: `Add ${shape.shapeType}`,
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex, object: shape });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: shape.id });
      },
    });
  }, [commandSystem, docDispatch]);

  const handleUpdateShape = useCallback((originalShape: ShapeObject, newProps: Partial<ShapeObject>) => {
    const pageIndex = currentPageIndexRef.current;
    const prev = originalShape;
    const updated: ShapeObject = {
      ...originalShape,
      ...newProps,
      params: {
        ...(originalShape.params || {}),
        ...(newProps.params || {}),
      },
    };

    commandSystem.execute({
      id: uuidv4(),
      description: `Update ${originalShape.shapeType}`,
      execute() {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
        setSelectedObject(updated);
      },
      undo() {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
        setSelectedObject(prev);
      },
    });
  }, [commandSystem, docDispatch, setSelectedObject]);

  // Section 6.1 Geometric Stroke Splitting & Batch Eraser Command
  const handleEraseBatchComplete = useCallback(
    (removedIds: string[], addedObjects: CanvasObject[], originalObjects: CanvasObject[]) => {
      if (removedIds.length === 0 && addedObjects.length === 0) return;
      const pageIndex = currentPageIndexRef.current;

      commandSystem.execute({
        id: uuidv4(),
        description: 'Erase stroke(s)',
        execute() {
          docDispatch({
            type: 'REPLACE_OBJECTS',
            pageIndex,
            removeIds: removedIds,
            newObjects: addedObjects,
          });
        },
        undo() {
          docDispatch({
            type: 'REPLACE_OBJECTS',
            pageIndex,
            removeIds: addedObjects.map((o) => o.id),
            newObjects: originalObjects,
          });
        },
      });
    },
    [commandSystem, docDispatch]
  );

  const handleSplitStroke = useCallback(
    (originalId: string, newStrokes: StrokeObject[]) => {
      const page = currentPageRef.current;
      if (!page) return;
      const pageIndex = currentPageIndexRef.current;
      const originalStroke = page.objects.find((o) => o.id === originalId);
      if (!originalStroke) return;

      commandSystem.execute({
        id: uuidv4(),
        description: 'Split stroke',
        execute() {
          docDispatch({
            type: 'REPLACE_OBJECTS',
            pageIndex,
            removeIds: [originalId],
            newObjects: newStrokes,
          });
        },
        undo() {
          docDispatch({
            type: 'REPLACE_OBJECTS',
            pageIndex,
            removeIds: newStrokes.map((s) => s.id),
            newObjects: [originalStroke],
          });
        },
      });
    },
    [commandSystem, docDispatch]
  );

  const handleEraseObjects = useCallback((objectIds: string[]) => {
    const page = currentPageRef.current;
    if (!page) return;
    const pageIndex = currentPageIndexRef.current;
    const deletedObjects = page.objects.filter((o) => objectIds.includes(o.id));
    if (deletedObjects.length === 0) return;

    commandSystem.execute({
      id: uuidv4(),
      description: `Erase ${deletedObjects.length} object(s)`,
      execute() {
        docDispatch({ type: 'REMOVE_OBJECTS', pageIndex, objectIds });
      },
      undo() {
        for (const obj of deletedObjects) {
          docDispatch({ type: 'ADD_OBJECT', pageIndex, object: obj });
        }
      },
    });
  }, [commandSystem, docDispatch]);

  const handleSelectObject = useCallback((obj: CanvasObject | null) => {
    setSelectedObject(obj);
  }, [setSelectedObject]);

  const handleUpdateObject = useCallback(
    (obj: CanvasObject, prevObjFromEngine?: CanvasObject) => {
      const page = currentPageRef.current;
      const pageIndex = currentPageIndexRef.current;
      if (!page) return;

      if (obj.type === 'group') {
        const grp = obj as GroupObject;
        const initialGroup =
          (prevObjFromEngine as GroupObject) ||
          (selectedObjectRef.current?.type === 'group' && selectedObjectRef.current.id === grp.id
            ? (selectedObjectRef.current as GroupObject)
            : null);
        const childIds = new Set(grp.objects.map((o) => o.id));
        const prevChildren = initialGroup?.objects
          ? JSON.parse(JSON.stringify(initialGroup.objects))
          : JSON.parse(JSON.stringify(page.objects.filter((o) => childIds.has(o.id))));
        const updatedChildren = JSON.parse(JSON.stringify(grp.objects));

        const prevGroup: GroupObject = initialGroup
          ? JSON.parse(JSON.stringify(initialGroup))
          : { ...grp, objects: prevChildren };
        const updatedGroup: GroupObject = JSON.parse(JSON.stringify(grp));

        const isRotate = (prevGroup.rotation || 0) !== (updatedGroup.rotation || 0);
        const desc = isRotate
          ? `Rotate ${updatedChildren.length} items`
          : `Move ${updatedChildren.length} items`;

        commandSystem.execute({
          id: uuidv4(),
          description: desc,
          execute() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: updatedChildren });
            setSelectedObject(updatedGroup);
          },
          undo() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: prevChildren });
            setSelectedObject(prevGroup);
          },
        });
        return;
      }

      const initialObj =
        prevObjFromEngine ||
        (selectedObjectRef.current?.id === obj.id ? selectedObjectRef.current : null) ||
        page.objects.find((o) => o.id === obj.id);

      if (!initialObj) return;

      const prevObj = JSON.parse(JSON.stringify(initialObj));
      const newObj = JSON.parse(JSON.stringify(obj));

      const isRotate = (prevObj.rotation || 0) !== (newObj.rotation || 0);
      const desc = isRotate ? `Rotate ${obj.type}` : `Move ${obj.type}`;

      commandSystem.execute({
        id: uuidv4(),
        description: desc,
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: newObj });
          setSelectedObject(newObj);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prevObj });
          setSelectedObject(prevObj);
        },
      });
    },
    [commandSystem, docDispatch, setSelectedObject]
  );

  const handleDuplicateClone = useCallback(
    (clone: CanvasObject) => {
      const pageIndex = currentPageIndexRef.current;
      docDispatch({ type: 'ADD_OBJECT', pageIndex, object: clone });
    },
    [docDispatch]
  );

  const handleViewChange = useCallback((zoom: number, panX: number, panY: number) => {
    setZoom(zoom);
    setPan(panX, panY);
  }, [setZoom, setPan]);

  const handleTextClick = useCallback((pos: Point) => {
    const page = currentPageRef.current;
    if (page) {
      // Check if clicking directly on an existing text object (search topmost first)
      const hitText = [...page.objects].reverse().find((obj) => {
        if (obj.type !== 'text') return false;
        const t = obj as TextObject;
        const tw = t.width || 200;
        const th = t.height || 40;
        return pos.x >= t.x && pos.x <= t.x + tw && pos.y >= t.y && pos.y <= t.y + th;
      }) as TextObject | undefined;

      if (hitText) {
        setSelectedObject(hitText);
        setTextModalPos({ x: hitText.x, y: hitText.y });
        setEditingTextObj(hitText);
        return;
      }
    }

    setTextModalPos(pos);
    setEditingTextObj(null);
  }, [setSelectedObject]);

  // ─── Background & Page Framing Rendering ──────────────────────────────────
  const drawBackground = useCallback((width: number, height: number) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.floor(width * dpr);
    const targetH = Math.floor(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const bg = currentPage?.background || { type: 'blank', color: '#1a1a2e' };
    const zoom = toolState.zoom;
    const panX = toolState.panX;
    const panY = toolState.panY;

    // 1. Fill canvas base color
    ctx.fillStyle = bg.color || '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Custom image background
    if (bg.type === 'image' && bg.imageUrl) {
      const cached = bgImageCacheRef.current.get(bg.imageUrl);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = cached.naturalWidth / cached.naturalHeight;

        let drawW = canvas.width;
        let drawH = canvas.height;
        let drawX = 0;
        let drawY = 0;

        // If aspect ratios differ (e.g. portrait A4 or 4:3 presentation on a 16:9 smartboard),
        // fit centered preserving exact aspect ratio so pages never stretch or distort!
        if (Math.abs(canvasAspect - imgAspect) > 0.05) {
          if (imgAspect > canvasAspect) {
            drawW = canvas.width;
            drawH = canvas.width / imgAspect;
            drawY = (canvas.height - drawH) / 2;
          } else {
            drawH = canvas.height;
            drawW = canvas.height * imgAspect;
            drawX = (canvas.width - drawW) / 2;
          }
        }

        ctx.drawImage(cached, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else if (!cached) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          bgImageCacheRef.current.set(bg.imageUrl!, img);
          drawBackground(width, height);
        };
        img.src = bg.imageUrl;
        bgImageCacheRef.current.set(bg.imageUrl, img);
      }
    }

    // 3. Grid / Ruled / Dotted patterns
    const baseGridSize = bg.gridSize || 32;
    const gridSize = baseGridSize * zoom * dpr;

    if (gridSize > 4) {
      const offsetX = ((panX * zoom * dpr) % gridSize + gridSize) % gridSize;
      const offsetY = ((panY * zoom * dpr) % gridSize + gridSize) % gridSize;

      if (bg.type === 'grid') {
        ctx.strokeStyle = bg.lineColor || 'rgba(108, 99, 255, 0.12)';
        ctx.lineWidth = 0.5 * dpr;
        for (let x = offsetX; x <= canvas.width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = offsetY; y <= canvas.height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
      } else if (bg.type === 'ruled') {
        ctx.strokeStyle = bg.lineColor || 'rgba(108, 99, 255, 0.12)';
        ctx.lineWidth = 0.5 * dpr;
        for (let y = offsetY; y <= canvas.height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        // Notebook vertical red margin line
        const marginScreenX = (120 + panX) * zoom * dpr;
        if (marginScreenX >= 0 && marginScreenX <= canvas.width) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(marginScreenX, 0);
          ctx.lineTo(marginScreenX, canvas.height);
          ctx.stroke();
        }
      } else if (bg.type === 'dotted') {
        ctx.fillStyle = bg.lineColor || 'rgba(108, 99, 255, 0.2)';
        for (let x = offsetX; x <= canvas.width; x += gridSize) {
          for (let y = offsetY; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 4. Page framing boundary: Only draw dashed sheet boundary for fixed print/paper sheet formats (A4 portrait/landscape, 4:3)
    // Fullscreen teaching board fills the entire display edge-to-edge without any framing borders or cropping!
    const isFixedPaperSheet =
      (currentPage?.width === 2480 && currentPage?.height === 3508) ||
      (currentPage?.width === 3508 && currentPage?.height === 2480) ||
      (currentPage?.width === 1600 && currentPage?.height === 1200);

    if (isFixedPaperSheet && currentPage && currentPage.width && currentPage.height) {
      const pageW = currentPage.width;
      const pageH = currentPage.height;
      const sX = (0 + panX) * zoom * dpr;
      const sY = (0 + panY) * zoom * dpr;
      const sW = pageW * zoom * dpr;
      const sH = pageH * zoom * dpr;

      ctx.save();
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.35)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeRect(sX, sY, sW, sH);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [currentPage, toolState.zoom, toolState.panX, toolState.panY]);

  // ─── Engine Initialization ────────────────────────────────────────────────

  useEffect(() => {
    const committed = committedCanvasRef.current;
    const active = activeCanvasRef.current;
    if (!committed || !active) return;

    if (!engineRef.current) {
      engineRef.current = new DrawingEngine({
        committedCanvas: committed,
        activeCanvas: active,
        callbacks: {
          onStrokeComplete: handleStrokeComplete,
          onShapeComplete: handleShapeComplete,
          onEraseObjects: handleEraseObjects,
          onSplitStroke: handleSplitStroke,
          onEraseBatchComplete: handleEraseBatchComplete,
          onSelectObject: handleSelectObject,
          onUpdateObject: handleUpdateObject,
          onDuplicateClone: handleDuplicateClone,
          onViewChange: handleViewChange,
          onTextClick: handleTextClick,
          onInteractionStart: () => {
            closeAllPopups();
            setActiveFlyout('none');
          },
        },
        initialStyle: toolState.penStyle,
        initialLayerId: 'drawing',
      });
    }

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []); // Mount only

  // Auto-minimize toolbar popups and selection menus as soon as user touches/clicks canvas to write or draw
  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const handleCanvasPointerDown = () => {
      closeAllPopups();
      setActiveFlyout('none');
      if (toolState.activeTool !== 'select' && selectedObjectRef.current) {
        setSelectedObject(null);
      }
    };
    canvas.addEventListener('pointerdown', handleCanvasPointerDown, { capture: true });
    return () => {
      canvas.removeEventListener('pointerdown', handleCanvasPointerDown, { capture: true });
    };
  }, [closeAllPopups, toolState.activeTool, setSelectedObject]);

  // Double-click on canvas: Immediately open text/formula object for editing
  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    const handleCanvasDoubleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const docX = clientX / toolState.zoom - toolState.panX;
      const docY = clientY / toolState.zoom - toolState.panY;

      const page = currentPageRef.current;
      if (!page) return;

      const hitText = [...page.objects].reverse().find((obj) => {
        if (obj.type !== 'text') return false;
        const t = obj as TextObject;
        const tw = t.width || 200;
        const th = t.height || 40;
        return docX >= t.x && docX <= t.x + tw && docY >= t.y && docY <= t.y + th;
      }) as TextObject | undefined;

      if (hitText) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedObject(hitText);
        setTextModalPos({ x: hitText.x, y: hitText.y });
        setEditingTextObj(hitText);
        return;
      }

      const hitShape = [...page.objects].reverse().find((obj) => {
        if (obj.type !== 'shape') return false;
        const s = obj as ShapeObject;
        const isSupportedCircuitComp =
          s.shapeType === 'circuitComponent' &&
          (s.params?.componentType === 'resistor' || s.params?.componentType === 'rheostat');
        const isSupportedPhysicsDiag =
          s.shapeType === 'physicsDiagram' &&
          (s.params?.diagramType === 'seriesCircuit' ||
            s.params?.diagramType === 'parallelCircuit' ||
            s.params?.diagramType === 'forceVector' ||
            s.params?.diagramType === 'resultantForce' ||
            s.params?.diagramType === 'freeBodyDiagram' ||
            s.params?.diagramType === 'motionDiagram');
        const isSupportedChem =
          s.shapeType === 'periodicElement' ||
          s.shapeType === 'atomicModel' ||
          s.shapeType === 'labApparatus';

        if (
          s.shapeType !== 'angleMeasurement' &&
          s.shapeType !== 'cartesianAxes' &&
          s.shapeType !== 'functionPlot' &&
          s.shapeType !== 'numberLine' &&
          s.shapeType !== 'geometry3D' &&
          !isSupportedCircuitComp &&
          !isSupportedPhysicsDiag &&
          !isSupportedChem
        ) {
          return false;
        }
        const sw = s.width || 120;
        const sh = s.height || 120;
        return docX >= s.x && docX <= s.x + sw && docY >= s.y && docY <= s.y + sh;
      }) as ShapeObject | undefined;

      if (hitShape) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedObject(hitShape);
        if (hitShape.shapeType === 'angleMeasurement') {
          setEditingAngleShape(hitShape);
        } else if (hitShape.shapeType === 'cartesianAxes') {
          setEditingCartesianShape(hitShape);
        } else if (hitShape.shapeType === 'functionPlot') {
          setEditingFunctionShape(hitShape);
        } else if (hitShape.shapeType === 'numberLine') {
          setEditingNumberLineShape(hitShape);
        } else if (hitShape.shapeType === 'geometry3D') {
          setEditingGeometry3DShape(hitShape);
        } else if (
          hitShape.shapeType === 'circuitComponent' &&
          (hitShape.params?.componentType === 'resistor' || hitShape.params?.componentType === 'rheostat')
        ) {
          setEditingResistorShape(hitShape);
        } else if (hitShape.shapeType === 'physicsDiagram') {
          const dt = hitShape.params?.diagramType;
          if (dt === 'seriesCircuit' || dt === 'parallelCircuit') {
            setEditingCircuitShape(hitShape);
          } else if (dt === 'forceVector') {
            setEditingForceVectorShape(hitShape);
          } else if (dt === 'resultantForce') {
            setEditingResultantShape(hitShape);
          } else if (dt === 'freeBodyDiagram') {
            setEditingFbdShape(hitShape);
          } else if (dt === 'motionDiagram') {
            setEditingMotionShape(hitShape);
          }
        } else if (hitShape.shapeType === 'periodicElement') {
          if (hitShape.params?.mode === 'table' || hitShape.params?.mode === 'overview') {
            setEditingPeriodicTableShape(hitShape);
          } else {
            setEditingElementCardShape(hitShape);
          }
        } else if (hitShape.shapeType === 'atomicModel') {
          setEditingBohrModelShape(hitShape);
        } else if (hitShape.shapeType === 'labApparatus') {
          setEditingLabApparatusShape(hitShape);
        }
      }
    };

    canvas.addEventListener('dblclick', handleCanvasDoubleClick);
    return () => {
      canvas.removeEventListener('dblclick', handleCanvasDoubleClick);
    };
  }, [toolState.zoom, toolState.panX, toolState.panY, setSelectedObject]);

  // Sync tools & settings to engine
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setActiveTool(toolState.activeTool);
  }, [toolState.activeTool]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setStyle(toolState.penStyle);
  }, [toolState.penStyle]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setShapeStyle(shapeStyle);
  }, [shapeStyle]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setEraserMode(toolState.eraserMode);
    engineRef.current.setEraserRadius(toolState.eraserSize);
  }, [toolState.eraserMode, toolState.eraserSize]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setCloneMode(cloneMode);
  }, [cloneMode]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setSelectedObject(selectedObject);
  }, [selectedObject]);

  useEffect(() => {
    if (!engineRef.current || !currentPage) return;
    engineRef.current.setLayers(currentPage.layers || []);
  }, [currentPage?.layers]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setZoomAndPan(toolState.zoom, toolState.panX, toolState.panY);
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      drawBackground(width, height);
    }
  }, [toolState.zoom, toolState.panX, toolState.panY, drawBackground]);

  // Keep engine callbacks synchronized
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setCallbacks({
      onStrokeComplete: handleStrokeComplete,
      onShapeComplete: handleShapeComplete,
      onEraseObjects: handleEraseObjects,
      onSplitStroke: handleSplitStroke,
      onEraseBatchComplete: handleEraseBatchComplete,
      onSelectObject: handleSelectObject,
      onUpdateObject: handleUpdateObject,
      onDuplicateClone: handleDuplicateClone,
      onViewChange: handleViewChange,
      onTextClick: handleTextClick,
      onInteractionStart: () => {
        closeAllPopups();
        setActiveFlyout('none');
      },
    });
  }, [
    handleStrokeComplete,
    handleShapeComplete,
    handleEraseObjects,
    handleSplitStroke,
    handleEraseBatchComplete,
    handleSelectObject,
    handleUpdateObject,
    handleDuplicateClone,
    handleViewChange,
    handleTextClick,
    closeAllPopups,
  ]);

  // When switching pages, clear selection and active canvas
  useEffect(() => {
    setSelectedObject(null);
    engineRef.current?.clearActiveCanvas();
  }, [currentPageIndex, setSelectedObject]);

  // Redraw committed canvas when page, objects, or selection changes
  useEffect(() => {
    if (!currentPage || !engineRef.current) return;
    engineRef.current.redrawCommitted(currentPage.objects, selectedObject?.id, selectedObject);
  }, [currentPageIndex, currentPage?.objects, selectedObject]);

  // Redraw background ONLY when background settings, page, or view changes (NOT on stroke additions!)
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      drawBackground(width, height);
    }
  }, [currentPageIndex, currentPage?.background, toolState.zoom, toolState.panX, toolState.panY, drawBackground]);

  // ─── Selected Object Manipulations (Delete, Duplicate, Lock) ──────────────

  const handleDeleteSelected = useCallback(() => {
    if (!selectedObject) return;
    const obj = selectedObject;
    const pageIndex = currentPageIndexRef.current;

    if (obj.type === 'group') {
      const grp = obj as GroupObject;
      const ids = grp.objects.map((o) => o.id);
      const objects = [...grp.objects];
      commandSystem.execute({
        id: uuidv4(),
        description: `Delete ${objects.length} items`,
        execute() {
          docDispatch({ type: 'REMOVE_OBJECTS', pageIndex, objectIds: ids });
          setSelectedObject(null);
        },
        undo() {
          docDispatch({ type: 'ADD_OBJECTS', pageIndex, objects });
          setSelectedObject(grp);
        },
      });
      return;
    }

    commandSystem.execute({
      id: uuidv4(),
      description: `Delete ${obj.type}`,
      execute() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: obj.id });
        setSelectedObject(null);
      },
      undo() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex, object: obj });
        setSelectedObject(obj);
      },
    });
  }, [selectedObject, commandSystem, docDispatch, setSelectedObject]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedObject) return;
    const pageIndex = currentPageIndexRef.current;

    if (selectedObject.type === 'group') {
      const grp = selectedObject as GroupObject;
      const newChildren: CanvasObject[] = grp.objects.map((child) => {
        const copy = JSON.parse(JSON.stringify(child)) as CanvasObject;
        copy.id = uuidv4();
        if (copy.type === 'stroke') {
          const s = copy as StrokeObject;
          s.points = s.points.map((p) => ({ ...p, x: p.x + 25, y: p.y + 25 }));
          s.bbox = { ...s.bbox, x: s.bbox.x + 25, y: s.bbox.y + 25 };
        } else {
          (copy as ShapeObject | TextObject).x += 25;
          (copy as ShapeObject | TextObject).y += 25;
        }
        return copy;
      });

      const newGrp: GroupObject = {
        ...grp,
        id: `group_${uuidv4()}`,
        x: grp.x + 25,
        y: grp.y + 25,
        bbox: { ...grp.bbox, x: grp.bbox.x + 25, y: grp.bbox.y + 25 },
        objects: newChildren,
      };

      const newIds = newChildren.map((o) => o.id);
      commandSystem.execute({
        id: uuidv4(),
        description: `Duplicate ${newChildren.length} items`,
        execute() {
          docDispatch({ type: 'ADD_OBJECTS', pageIndex, objects: newChildren });
          setSelectedObject(newGrp);
        },
        undo() {
          docDispatch({ type: 'REMOVE_OBJECTS', pageIndex, objectIds: newIds });
          setSelectedObject(selectedObject);
        },
      });
      return;
    }

    const copy = JSON.parse(JSON.stringify(selectedObject)) as CanvasObject;
    copy.id = uuidv4();
    if (copy.type === 'stroke') {
      const s = copy as StrokeObject;
      s.points = s.points.map((p) => ({ ...p, x: p.x + 25, y: p.y + 25 }));
      s.bbox = { ...s.bbox, x: s.bbox.x + 25, y: s.bbox.y + 25 };
    } else {
      (copy as ShapeObject | TextObject).x += 25;
      (copy as ShapeObject | TextObject).y += 25;
    }

    commandSystem.execute({
      id: uuidv4(),
      description: `Duplicate ${copy.type}`,
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex, object: copy });
        setSelectedObject(copy);
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: copy.id });
        setSelectedObject(selectedObject);
      },
    });
  }, [selectedObject, commandSystem, docDispatch, setSelectedObject]);

  const handleDragDuplicateDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!selectedObject) return;
      const pageIndex = currentPageIndexRef.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startX = (e.clientX - rect.left) / toolState.zoom - toolState.panX;
      const startY = (e.clientY - rect.top) / toolState.zoom - toolState.panY;
      let hasDragged = false;

      if (selectedObject.type === 'group') {
        const grp = selectedObject as GroupObject;
        const initialCopies: CanvasObject[] = grp.objects.map((child) => {
          const c = JSON.parse(JSON.stringify(child)) as CanvasObject;
          c.id = uuidv4();
          return c;
        });
        let currentCopies = initialCopies;
        let currentGrp: GroupObject = {
          ...grp,
          id: `group_${uuidv4()}`,
          objects: initialCopies,
        };

        docDispatch({ type: 'ADD_OBJECTS', pageIndex, objects: initialCopies });
        setSelectedObject(currentGrp);

        const onPointerMove = (moveEv: PointerEvent) => {
          hasDragged = true;
          const curX = (moveEv.clientX - rect.left) / toolState.zoom - toolState.panX;
          const curY = (moveEv.clientY - rect.top) / toolState.zoom - toolState.panY;
          const dx = curX - startX;
          const dy = curY - startY;

          currentCopies = initialCopies.map((child) => {
            if (child.type === 'stroke') {
              const str = child as StrokeObject;
              const pts = str.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
              return {
                ...str,
                points: pts,
                bbox: { ...str.bbox, x: str.bbox.x + dx, y: str.bbox.y + dy },
              };
            } else {
              return {
                ...child,
                x: (child as ShapeObject | TextObject).x + dx,
                y: (child as ShapeObject | TextObject).y + dy,
              } as CanvasObject;
            }
          });

          currentGrp = {
            ...grp,
            id: currentGrp.id,
            x: grp.x + dx,
            y: grp.y + dy,
            bbox: { ...grp.bbox, x: grp.bbox.x + dx, y: grp.bbox.y + dy },
            objects: currentCopies,
          };

          docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: currentCopies });
          setSelectedObject(currentGrp);
        };

        const onPointerUp = () => {
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);

          if (!hasDragged) {
            currentCopies = initialCopies.map((child) => {
              if (child.type === 'stroke') {
                const str = child as StrokeObject;
                const pts = str.points.map((p) => ({ ...p, x: p.x + 30, y: p.y + 30 }));
                return {
                  ...str,
                  points: pts,
                  bbox: { ...str.bbox, x: str.bbox.x + 30, y: str.bbox.y + 30 },
                };
              } else {
                return {
                  ...child,
                  x: (child as ShapeObject | TextObject).x + 30,
                  y: (child as ShapeObject | TextObject).y + 30,
                } as CanvasObject;
              }
            });
            currentGrp = {
              ...grp,
              id: currentGrp.id,
              x: grp.x + 30,
              y: grp.y + 30,
              bbox: { ...grp.bbox, x: grp.bbox.x + 30, y: grp.bbox.y + 30 },
              objects: currentCopies,
            };
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: currentCopies });
            setSelectedObject(currentGrp);
          }

          const finalObjs = currentCopies;
          const finalIds = finalObjs.map((o) => o.id);
          const finalGrp = currentGrp;
          commandSystem.execute({
            id: uuidv4(),
            description: `Duplicate ${finalObjs.length} items`,
            execute() {
              docDispatch({ type: 'ADD_OBJECTS', pageIndex, objects: finalObjs });
              setSelectedObject(finalGrp);
            },
            undo() {
              docDispatch({ type: 'REMOVE_OBJECTS', pageIndex, objectIds: finalIds });
              setSelectedObject(selectedObject);
            },
          });
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return;
      }

      const copy = JSON.parse(JSON.stringify(selectedObject)) as CanvasObject;
      copy.id = uuidv4();
      let currentCopy = copy;

      // Add to document
      docDispatch({ type: 'ADD_OBJECT', pageIndex, object: copy });
      setSelectedObject(copy);

      const onPointerMove = (moveEv: PointerEvent) => {
        hasDragged = true;
        const curX = (moveEv.clientX - rect.left) / toolState.zoom - toolState.panX;
        const curY = (moveEv.clientY - rect.top) / toolState.zoom - toolState.panY;
        const dx = curX - startX;
        const dy = curY - startY;

        if (copy.type === 'stroke') {
          const str = copy as StrokeObject;
          const pts = str.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
          currentCopy = {
            ...str,
            points: pts,
            bbox: { ...str.bbox, x: str.bbox.x + dx, y: str.bbox.y + dy },
          };
        } else {
          currentCopy = {
            ...copy,
            x: (copy as ShapeObject | TextObject).x + dx,
            y: (copy as ShapeObject | TextObject).y + dy,
          } as CanvasObject;
        }

        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: currentCopy });
        setSelectedObject(currentCopy);
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        if (!hasDragged) {
          // If clicked without dragging, place with +30 offset
          if (currentCopy.type === 'stroke') {
            const str = currentCopy as StrokeObject;
            const pts = str.points.map((p) => ({ ...p, x: p.x + 30, y: p.y + 30 }));
            currentCopy = {
              ...str,
              points: pts,
              bbox: { ...str.bbox, x: str.bbox.x + 30, y: str.bbox.y + 30 },
            };
          } else {
            currentCopy = {
              ...currentCopy,
              x: (currentCopy as ShapeObject | TextObject).x + 30,
              y: (currentCopy as ShapeObject | TextObject).y + 30,
            } as CanvasObject;
          }
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: currentCopy });
          setSelectedObject(currentCopy);
        }

        const finalObj = currentCopy;
        commandSystem.execute({
          id: uuidv4(),
          description: `Duplicate ${finalObj.type}`,
          execute() {
            docDispatch({ type: 'ADD_OBJECT', pageIndex, object: finalObj });
            setSelectedObject(finalObj);
          },
          undo() {
            docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: finalObj.id });
            setSelectedObject(selectedObject);
          },
        });
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [selectedObject, toolState.zoom, toolState.panX, toolState.panY, commandSystem, docDispatch, setSelectedObject]
  );

  const handleToggleLockSelected = useCallback(() => {
    if (!selectedObject) return;
    const pageIndex = currentPageIndexRef.current;
    const prev = selectedObject;
    const updated = { ...selectedObject, locked: !selectedObject.locked };

    commandSystem.execute({
      id: uuidv4(),
      description: updated.locked ? 'Lock object' : 'Unlock object',
      execute() {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
        setSelectedObject(updated);
      },
      undo() {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
        setSelectedObject(prev);
      },
    });
  }, [selectedObject, commandSystem, docDispatch, setSelectedObject]);

  // ─── Image Screen Fit & Sizing Actions ─────────────────────────────────────
  const handleImageFitAction = useCallback(
    (action: 'fit' | 'fill' | 'cover' | 'repeat' | 'center' | 'original' | 'background') => {
      if (!selectedObject || selectedObject.type !== 'image') return;
      const imgObj = selectedObject as ImageObject;
      const pageIndex = currentPageIndexRef.current;
      const page = currentPageRef.current;
      if (!page) return;

      const zoom = toolState.zoom || 1;
      const containerW = containerRef.current?.clientWidth || window.innerWidth;
      const containerH = containerRef.current?.clientHeight || window.innerHeight;
      const visibleW = containerW / zoom;
      const visibleH = containerH / zoom;

      // Document coordinates currently visible
      const startX = -toolState.panX;
      const startY = -toolState.panY;
      const screenW = visibleW;
      const screenH = visibleH;
      const prevObj = JSON.parse(JSON.stringify(imgObj)) as ImageObject;

      if (action === 'background') {
        const prevBg = JSON.parse(JSON.stringify(page.background || { type: 'blank', color: '#1a1a2e' }));
        const newBg = {
          type: 'image' as const,
          imageUrl: imgObj.dataUrl || imgObj.filePath,
          color: '#ffffff',
        };
        commandSystem.execute({
          id: uuidv4(),
          description: 'Set Image as Page Background',
          execute() {
            docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex, background: newBg });
            docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: imgObj.id });
            setSelectedObject(null);
            setToastMessage('Image set as page background');
          },
          undo() {
            docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex, background: prevBg });
            docDispatch({ type: 'ADD_OBJECT', pageIndex, object: prevObj });
            setSelectedObject(prevObj);
          },
        });
        setActiveFlyout('none');
        return;
      }

      if (action === 'repeat') {
        const tileW = Math.max(160, Math.min(320, imgObj.width));
        const tileH = Math.max(120, Math.min(240, (tileW / (imgObj.width || 1)) * (imgObj.height || 1)));
        const cols = Math.ceil(screenW / tileW);
        const rows = Math.ceil(screenH / tileH);
        const newObjects: CanvasObject[] = [];

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            newObjects.push({
              ...imgObj,
              id: r === 0 && c === 0 ? imgObj.id : uuidv4(),
              x: startX + c * tileW,
              y: startY + r * tileH,
              width: tileW,
              height: tileH,
              rotation: 0,
            });
          }
        }

        commandSystem.execute({
          id: uuidv4(),
          description: `Repeat / Tile image into ${newObjects.length} copies`,
          execute() {
            docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: imgObj.id });
            docDispatch({ type: 'ADD_OBJECTS', pageIndex, objects: newObjects });
            setSelectedObject(newObjects[0]);
            setToastMessage(`Tiled image into ${newObjects.length} copies`);
          },
          undo() {
            docDispatch({ type: 'REMOVE_OBJECTS', pageIndex, objectIds: newObjects.map((o) => o.id) });
            docDispatch({ type: 'ADD_OBJECT', pageIndex, object: prevObj });
            setSelectedObject(prevObj);
          },
        });
        setActiveFlyout('none');
        return;
      }

      let newX = imgObj.x;
      let newY = imgObj.y;
      let newW = imgObj.width;
      let newH = imgObj.height;

      const imgAspect = imgObj.width && imgObj.height ? imgObj.width / imgObj.height : 16 / 9;

      switch (action) {
        case 'fit': {
          const screenAspect = screenW / screenH;
          if (imgAspect > screenAspect) {
            newW = screenW;
            newH = screenW / imgAspect;
            newX = startX;
            newY = startY + (screenH - newH) / 2;
          } else {
            newH = screenH;
            newW = screenH * imgAspect;
            newX = startX + (screenW - newW) / 2;
            newY = startY;
          }
          break;
        }

        case 'fill': {
          newX = startX;
          newY = startY;
          newW = screenW;
          newH = screenH;
          break;
        }

        case 'cover': {
          const screenAspect = screenW / screenH;
          if (imgAspect > screenAspect) {
            newH = screenH;
            newW = screenH * imgAspect;
            newX = startX + (screenW - newW) / 2;
            newY = startY;
          } else {
            newW = screenW;
            newH = screenW / imgAspect;
            newX = startX;
            newY = startY + (screenH - newH) / 2;
          }
          break;
        }

        case 'center': {
          newX = startX + (screenW - imgObj.width) / 2;
          newY = startY + (screenH - imgObj.height) / 2;
          break;
        }

        case 'original': {
          const cached = bgImageCacheRef.current.get(imgObj.dataUrl || imgObj.filePath);
          let origW = (cached && cached.naturalWidth > 0) ? cached.naturalWidth : 800;
          let origH = (cached && cached.naturalHeight > 0) ? cached.naturalHeight : 800 / imgAspect;
          if (origW > screenW || origH > screenH) {
            const origScale = Math.min(screenW / origW, screenH / origH);
            origW = Math.round(origW * origScale);
            origH = Math.round(origH * origScale);
          }
          newW = origW;
          newH = origH;
          newX = startX + (screenW - newW) / 2;
          newY = startY + (screenH - newH) / 2;
          break;
        }
      }

      const updatedObj: ImageObject = {
        ...imgObj,
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
        rotation: 0,
      };

      commandSystem.execute({
        id: uuidv4(),
        description: `Fit Image: ${action}`,
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updatedObj });
          setSelectedObject(updatedObj);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prevObj });
          setSelectedObject(prevObj);
        },
      });

      setActiveFlyout('none');
    },
    [selectedObject, toolState.zoom, commandSystem, docDispatch, setSelectedObject, setToastMessage]
  );

  // Select All Objects on Current Page (Ctrl+A)
  const handleSelectAll = useCallback(() => {
    const page = currentPageRef.current;
    if (!page || !page.objects || page.objects.length === 0) return;

    // Filter unlocked objects from visible layers
    const selectable = page.objects.filter((o) => {
      if (o.locked) return false;
      const l = page.layers?.find((lay) => lay.id === o.layerId);
      if (l && (!l.visible || l.locked)) return false;
      return true;
    });

    if (selectable.length === 0) return;

    // Switch tool to 'select' so selection outline & action-strip are active
    setActiveTool('select');

    if (selectable.length === 1) {
      setSelectedObject(selectable[0]);
      if (engineRef.current) {
        engineRef.current.setSelectedObject(selectable[0]);
        engineRef.current.redrawCommitted(page.objects, selectable[0].id, selectable[0]);
      }
    } else {
      let grp: GroupObject;
      if (engineRef.current) {
        grp = engineRef.current.createGroupFromObjects(selectable);
      } else {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const obj of selectable) {
          const b = obj.type === 'stroke'
            ? (obj as StrokeObject).bbox
            : { x: (obj as any).x || 0, y: (obj as any).y || 0, width: (obj as any).width || 50, height: (obj as any).height || 50 };
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
        grp = {
          id: `group_${uuidv4()}`,
          type: 'group',
          objects: selectable,
          bbox,
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
          rotation: 0,
          locked: false,
          layerId: selectable[0]?.layerId || 'default',
        };
      }

      setSelectedObject(grp);
      if (engineRef.current) {
        engineRef.current.setSelectedObject(grp);
        engineRef.current.redrawCommitted(page.objects, grp.id, grp);
      }
    }
  }, [setActiveTool, setSelectedObject]);

  // Keyboard shortcut: Delete, Backspace, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+D, Ctrl+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingOrInputFocused(e)) return;

      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObject) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        if (selectedObject) {
          e.preventDefault();
          handleDuplicateSelected();
        }
      } else if (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey)) {
        if (selectedObject) {
          e.preventDefault();
          copyObject(selectedObject);
        }
      } else if (e.key.toLowerCase() === 'v' && (e.ctrlKey || e.metaKey)) {
        if (
          (e.target as HTMLElement)?.tagName === 'INPUT' ||
          (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
          (e.target as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        pasteObject();
      } else if (e.key.toLowerCase() === 'x' && (e.ctrlKey || e.metaKey)) {
        if (selectedObject) {
          e.preventDefault();
          copyObject(selectedObject);
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setActiveFlyout('none');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (
        (e.target as HTMLElement)?.tagName === 'INPUT' ||
        (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      pasteObject();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [
    selectedObject,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleSelectAll,
    copyObject,
    pasteObject,
    undo,
    redo,
  ]);

  // ─── Text Modal Save (Section 8) ──────────────────────────────────────────

  const handleSaveText = (textData: Partial<TextObject>) => {
    const pageIndex = currentPageIndexRef.current;

    if (editingTextObj) {
      const prev = editingTextObj;
      const updated: TextObject = {
        ...editingTextObj,
        ...textData,
      } as TextObject;

      commandSystem.execute({
        id: uuidv4(),
        description: 'Edit text',
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
          setSelectedObject(updated);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
          setSelectedObject(prev);
        },
      });
    } else if (textModalPos) {
      const isLatex = textData.isLatex ?? (textData.content ? isLatexSyntax(textData.content) : false);
      const newText: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: textModalPos.x,
        y: textModalPos.y,
        width: textData.width || (isLatex ? 200 : 200),
        height: textData.height || (isLatex ? 50 : 48),
        content: textData.content || '',
        fontFamily: textData.fontFamily || (isLatex ? "KaTeX_Main, 'Cambria Math', 'Times New Roman', serif" : 'Inter, sans-serif'),
        fontSize: textData.fontSize || (isLatex ? 32 : 20),
        fontWeight: textData.fontWeight || 400,
        fontStyle: textData.fontStyle || 'normal',
        textDecoration: textData.textDecoration || 'none',
        textAlign: textData.textAlign || 'left',
        color: textData.color || '#ffffff',
        backgroundColor: textData.backgroundColor || 'transparent',
        opacity: 1,
        rotation: 0,
        preset: textData.preset || (isLatex ? 'formula' : 'body'),
        isLatex,
        locked: false,
        layerId: 'objects',
      };

      commandSystem.execute({
        id: uuidv4(),
        description: 'Add text',
        execute() {
          docDispatch({ type: 'ADD_OBJECT', pageIndex, object: newText });
          setSelectedObject(newText);
        },
        undo() {
          docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: newText.id });
          setSelectedObject(null);
        },
      });
    }

    setTextModalPos(null);
    setEditingTextObj(null);
  };



  // ─── Resize Handling ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);
      if (width <= 0 || height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      engineRef.current?.setDevicePixelRatio(dpr);
      engineRef.current?.resize(width, height);
      drawBackground(width, height);
    };

    const handleFocusOrVisibility = () => {
      engineRef.current?.resetInteractions();
      handleResize();
      if (currentPageRef.current) {
        engineRef.current?.redrawCommitted(
          currentPageRef.current.objects,
          selectedObjectRef.current?.id,
          selectedObjectRef.current
        );
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      observer.disconnect();
    };
  }, [drawBackground]);

  // Compute screen coordinates for selected object contextual actions
  let selectedScreenBBox: { left: number; top: number; width: number; height: number } | null = null;
  let pillLeft = 0;
  let pillTop = 0;

  if (toolState.activeTool === 'select' && selectedObject) {
    const s = toolState.zoom;
    if (selectedObject.type === 'stroke') {
      const str = selectedObject as StrokeObject;
      let b = str.bbox;
      if (!b && str.points?.length) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of str.points) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        b = {
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
        };
      }
      if (b) {
        selectedScreenBBox = {
          left: (b.x + toolState.panX) * s,
          top: (b.y + toolState.panY) * s,
          width: b.width * s,
          height: b.height * s,
        };
      }
    } else if (selectedObject.type === 'group') {
      const grp = selectedObject as GroupObject;
      let b = grp.bbox;
      if (!b && grp.objects?.length) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const child of grp.objects) {
          const cb = child.type === 'stroke' ? (child as StrokeObject).bbox : (child as any);
          if (cb) {
            if (cb.x < minX) minX = cb.x;
            if (cb.y < minY) minY = cb.y;
            if (cb.x + cb.width > maxX) maxX = cb.x + cb.width;
            if (cb.y + cb.height > maxY) maxY = cb.y + cb.height;
          }
        }
        b = {
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
        };
      }
      if (b) {
        selectedScreenBBox = {
          left: (b.x + toolState.panX) * s,
          top: (b.y + toolState.panY) * s,
          width: b.width * s,
          height: b.height * s,
        };
      }
    } else {
      const obj = selectedObject as ShapeObject | TextObject;
      selectedScreenBBox = {
        left: (obj.x + toolState.panX) * s,
        top: (obj.y + toolState.panY) * s,
        width: Math.abs(obj.width || 100) * s,
        height: Math.abs(obj.height || 60) * s,
      };
    }

    if (selectedScreenBBox) {
      const containerW = containerRef.current?.clientWidth || window.innerWidth;
      const containerH = containerRef.current?.clientHeight || window.innerHeight;

      if (selectedScreenBBox.left + selectedScreenBBox.width + 60 <= containerW) {
        pillLeft = selectedScreenBBox.left + selectedScreenBBox.width + 18;
      } else {
        pillLeft = Math.max(12, selectedScreenBBox.left - 64);
      }
      pillTop = Math.max(16, Math.min(containerH - 340, selectedScreenBBox.top));
    }
  }

  return (
    <div
      className={`whiteboard-canvas-wrapper ${activeTransitionClass}`}
      ref={containerRef}
      style={{ cursor: 'default' }}
    >
      <canvas ref={bgCanvasRef} className="canvas-layer bg-canvas" aria-hidden="true" style={{ cursor: 'default' }} />
      <canvas ref={committedCanvasRef} className="canvas-layer committed-canvas" aria-hidden="true" style={{ cursor: 'default' }} />
      <canvas
        ref={activeCanvasRef}
        className="canvas-layer active-canvas"
        aria-label="Drawing surface"
        role="img"
        tabIndex={0}
        style={{
          touchAction: 'none',
          cursor:
            toolState.activeTool === 'eraser'
              ? 'cell'
              : toolState.activeTool === 'pan'
              ? 'grab'
              : toolState.activeTool === 'text'
              ? 'text'
              : toolState.activeTool === 'pen' ||
                toolState.activeTool === 'highlighter' ||
                toolState.activeTool === 'shape' ||
                toolState.activeTool === 'line'
              ? 'crosshair'
              : 'default',
        }}
      />

      {/* Quick "✏️ Edit Text/Formula" floating badge directly above selected text element */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'text' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onClick={(e) => {
            e.stopPropagation();
            const t = selectedObject as TextObject;
            setTextModalPos({ x: t.x, y: t.y });
            setEditingTextObj(t);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button className="quick-edit-btn" title="Edit text content (or double-click text)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Edit {(selectedObject as TextObject).isLatex ? 'Formula' : 'Text'}</span>
          </button>
        </div>
      )}

      {/* Quick "📐 Change Angle" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'angleMeasurement' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setEditingAngleShape(selectedObject as ShapeObject);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button className="quick-edit-btn" title="Change Angle Degree (or double-click)">
            <span>📐</span>
            <span>Change Angle ({(selectedObject as ShapeObject).params?.angle ?? 60}°)</span>
          </button>
        </div>
      )}

      {/* Quick "📊 Configure Axes" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'cartesianAxes' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setEditingCartesianShape(selectedObject as ShapeObject);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button className="quick-edit-btn" title="Configure X-Y Axes Range & Values (or double-click)">
            <span>📊</span>
            <span>Configure X-Y Axes [{(selectedObject as ShapeObject).params?.xMin ?? -10}..{(selectedObject as ShapeObject).params?.xMax ?? 10}]</span>
          </button>
        </div>
      )}

      {/* Quick "📈 Edit Function" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'functionPlot' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setEditingFunctionShape(selectedObject as ShapeObject);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button className="quick-edit-btn" title="Edit Function Equation (or double-click)">
            <span>📈</span>
            <span>Edit Function ({(selectedObject as ShapeObject).params?.equation || 'y = f(x)'})</span>
          </button>
        </div>
      )}

      {/* Quick "↔️ Configure Number Line" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'numberLine' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setEditingNumberLineShape(selectedObject as ShapeObject);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button className="quick-edit-btn" title="Configure Number Line Range & Values (or double-click)">
            <span>↔️</span>
            <span>Configure Range [{(selectedObject as ShapeObject).params?.min ?? -5}..{(selectedObject as ShapeObject).params?.max ?? 5}]</span>
          </button>
        </div>
      )}

      {/* Quick "🧊 Rotate 3D Solid" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'geometry3D' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Rotate 3D Solid on X, Y, Z Axes (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingGeometry3DShape(selectedObject as ShapeObject);
            }}
          >
            <span>🧊</span>
            <span>Rotate 3D {((selectedObject as ShapeObject).params?.solidType || 'Solid').toUpperCase()} (X:{(selectedObject as ShapeObject).params?.rotX ?? 28}°, Y:{(selectedObject as ShapeObject).params?.rotY ?? 35}°)</span>
          </button>
        </div>
      )}

      {/* Quick "⚡ Edit Resistor / Rheostat" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'circuitComponent' && ((selectedObject as ShapeObject).params?.componentType === 'resistor' || (selectedObject as ShapeObject).params?.componentType === 'rheostat') && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure Resistance Value & Multiplier (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingResistorShape(selectedObject as ShapeObject);
            }}
          >
            <span>⚡</span>
            <span>
              {(selectedObject as ShapeObject).params?.componentType === 'rheostat' ? 'Rheostat' : 'Resistor'}: {(selectedObject as ShapeObject).params?.resistance ?? 100} {(selectedObject as ShapeObject).params?.unit || 'Ω'}
            </span>
          </button>
        </div>
      )}

      {/* Quick "🔄 Configure Electrical Circuit" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'physicsDiagram' && ((selectedObject as ShapeObject).params?.diagramType === 'seriesCircuit' || (selectedObject as ShapeObject).params?.diagramType === 'parallelCircuit') && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure Electronic Components, Voltage & Ohm's Law (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingCircuitShape(selectedObject as ShapeObject);
            }}
          >
            <span>🔄</span>
            <span>
              {(selectedObject as ShapeObject).params?.diagramType === 'parallelCircuit' ? 'Parallel' : 'Series'} Circuit (V:{(selectedObject as ShapeObject).params?.voltage ?? 12}V, Req:{(selectedObject as ShapeObject).params?.resistance ?? 4}Ω, I:{(selectedObject as ShapeObject).params?.current ?? 3}A)
            </span>
          </button>
        </div>
      )}

      {/* Quick "↗️ Configure Force Vector" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'physicsDiagram' && (selectedObject as ShapeObject).params?.diagramType === 'forceVector' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure Force Vector Magnitude, Angle & Components (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingForceVectorShape(selectedObject as ShapeObject);
            }}
          >
            <span>↗️</span>
            <span>
              Force Vector: {(selectedObject as ShapeObject).params?.magnitude ?? 50} N ({(selectedObject as ShapeObject).params?.angle ?? 45}°)
            </span>
          </button>
        </div>
      )}

      {/* Quick "📐 Configure Resultant Force" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'physicsDiagram' && (selectedObject as ShapeObject).params?.diagramType === 'resultantForce' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure Vector Addition Forces (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingResultantShape(selectedObject as ShapeObject);
            }}
          >
            <span>📐</span>
            <span>
              Resultant Force: {(selectedObject as ShapeObject).params?.r ?? 50} N @ {(selectedObject as ShapeObject).params?.theta ?? 36.9}°
            </span>
          </button>
        </div>
      )}

      {/* Quick "📦 Configure Free Body Diagram" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'physicsDiagram' && (selectedObject as ShapeObject).params?.diagramType === 'freeBodyDiagram' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure Mass, Incline, Applied Force & Friction (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingFbdShape(selectedObject as ShapeObject);
            }}
          >
            <span>📦</span>
            <span>
              FBD: m={(selectedObject as ShapeObject).params?.mass ?? 5}kg{(selectedObject as ShapeObject).params?.inclineAngle ? ` @ ${(selectedObject as ShapeObject).params?.inclineAngle}°` : ''}, Fnet={(selectedObject as ShapeObject).params?.netForce ?? 0}N, a={(selectedObject as ShapeObject).params?.acceleration ?? 0}m/s²
            </span>
          </button>
        </div>
      )}

      {/* Quick "🎢 Configure Projectile Motion" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'physicsDiagram' && (selectedObject as ShapeObject).params?.diagramType === 'motionDiagram' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure Initial Velocity, Launch Angle & Gravity (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingMotionShape(selectedObject as ShapeObject);
            }}
          >
            <span>🎢</span>
            <span>
              Projectile: v0={(selectedObject as ShapeObject).params?.initialVelocity ?? 25}m/s, θ={(selectedObject as ShapeObject).params?.angle ?? 45}°, Range={(selectedObject as ShapeObject).params?.range ?? 0}m
            </span>
          </button>
        </div>
      )}

      {/* Quick "🧪 View / Edit Complete Periodic Table" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'periodicElement' && ((selectedObject as ShapeObject).params?.mode === 'table' || (selectedObject as ShapeObject).params?.mode === 'overview') && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Open Interactive Periodic Table Explorer (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingPeriodicTableShape(selectedObject as ShapeObject);
            }}
          >
            <span>🧪</span>
            <span>Periodic Table (118 Elements)</span>
          </button>
        </div>
      )}

      {/* Quick "📇 Select / Edit Element Card" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'periodicElement' && (selectedObject as ShapeObject).params?.mode !== 'table' && (selectedObject as ShapeObject).params?.mode !== 'overview' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Change Element on Card (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingElementCardShape(selectedObject as ShapeObject);
            }}
          >
            <span>📇</span>
            <span>
              Element Card: {(selectedObject as ShapeObject).params?.element?.name || 'Element'} ({(selectedObject as ShapeObject).params?.element?.symbol || 'C'}) · Z={(selectedObject as ShapeObject).params?.element?.number ?? 6}
            </span>
          </button>
        </div>
      )}

      {/* Quick "⚛️ Select / Edit Bohr Model Element" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'atomicModel' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Change Bohr Model Element (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingBohrModelShape(selectedObject as ShapeObject);
            }}
          >
            <span>⚛️</span>
            <span>
              Bohr Model: {(selectedObject as ShapeObject).params?.name || 'Atom'} ({(selectedObject as ShapeObject).params?.symbol || 'O'}) · Z={(selectedObject as ShapeObject).params?.atomicNumber ?? 8}
            </span>
          </button>
        </div>
      )}

      {/* Quick "⚗️ Configure Laboratory Apparatus" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'labApparatus' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure Laboratory Apparatus (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingLabApparatusShape(selectedObject as ShapeObject);
            }}
          >
            <span>⚗️</span>
            <span>
              {(selectedObject as ShapeObject).label || 'Laboratory Apparatus'}
            </span>
          </button>
        </div>
      )}

      {/* Vertical Floating Action Toolbar / Pill (Reference Images 1, 2, 3) */}
      {toolState.activeTool === 'select' && selectedObject && selectedScreenBBox && (
        <div
          className="selected-object-vertical-pill"
          style={{
            position: 'absolute',
            left: pillLeft,
            top: pillTop,
            zIndex: 120,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* 1. 🗑️ Delete */}
          <button
            className="sel-pill-btn delete-btn"
            onClick={handleDeleteSelected}
            title="Delete (Delete / Backspace)"
            aria-label="Delete"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>

          <div className="sel-pill-divider" />

          {/* 2. 🎨 Color Palette */}
          <button
            className={`sel-pill-btn ${activeFlyout === 'palette' ? 'active' : ''}`}
            onClick={() => setActiveFlyout((f) => (f === 'palette' ? 'none' : 'palette'))}
            title="Recolor element"
            aria-label="Color Palette"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </button>

          <div className="sel-pill-divider" />

          {/* 3. 📑 Layer Order (Reference Image 2) */}
          <button
            className={`sel-pill-btn ${activeFlyout === 'layer' ? 'active' : ''}`}
            onClick={() => setActiveFlyout((f) => (f === 'layer' ? 'none' : 'layer'))}
            title="Arrange Layers (Move to top, bottom, previous, next)"
            aria-label="Layer Order"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="5" x2="20" y2="5" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="19" x2="20" y2="19" />
              <polyline points="9 8 12 5 15 8" />
              <polyline points="9 16 12 19 15 16" />
            </svg>
          </button>

          <div className="sel-pill-divider" />

          {/* 4. ✏️ Edit Text & Font Properties */}
          {selectedObject.type === 'text' && (
            <>
              <button
                className="sel-pill-btn active-text-edit"
                onClick={() => {
                  const t = selectedObject as TextObject;
                  setTextModalPos({ x: t.x, y: t.y });
                  setEditingTextObj(t);
                }}
                title="Edit Text & Formula properties (Double-click text to edit)"
                aria-label="Text & Font Properties"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              <div className="sel-pill-divider" />
            </>
          )}

          {/* 4b. ⛶ Image Screen Fit / Stretch / Fill */}
          {selectedObject.type === 'image' && (
            <>
              <button
                className={`sel-pill-btn ${activeFlyout === 'imageFit' ? 'active' : ''}`}
                onClick={() => setActiveFlyout((f) => (f === 'imageFit' ? 'none' : 'imageFit'))}
                title="Fit to Screen, Fill / Stretch, Cover, Repeat, Center"
                aria-label="Image Screen Sizing"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
              <div className="sel-pill-divider" />
            </>
          )}

          {/* 5. 👥 Cloner / Infinite Clone Mode */}
          <button
            className={`sel-pill-btn ${cloneMode ? 'active-clone' : ''}`}
            onClick={() => {
              setCloneMode((c) => !c);
              setToastMessage(!cloneMode ? 'Clone Mode ON: Dragging spawns copies!' : 'Clone Mode OFF');
            }}
            title={cloneMode ? 'Clone Mode is ON: Dragging element spawns copies' : 'Turn ON Clone Mode'}
            aria-label="Infinite Clone Mode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.5" fill={cloneMode ? 'currentColor' : 'none'} />
              <circle cx="12" cy="4" r="1.5" fill="currentColor" />
              <circle cx="19" cy="8" r="1.5" fill="currentColor" />
              <circle cx="19" cy="16" r="1.5" fill="currentColor" />
              <circle cx="12" cy="20" r="1.5" fill="currentColor" />
              <circle cx="5" cy="16" r="1.5" fill="currentColor" />
              <circle cx="5" cy="8" r="1.5" fill="currentColor" />
            </svg>
          </button>

          <div className="sel-pill-divider" />

          {/* 6. ➡️ Drag-to-Duplicate Handle */}
          <button
            className="sel-pill-btn drag-duplicate-handle"
            onPointerDown={handleDragDuplicateDown}
            title="Drag to pull out a duplicate copy on this page, or click to copy"
            aria-label="Drag-to-Duplicate"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="11" height="14" rx="2" />
              <path d="M14 12h7m0 0l-3-3m3 3l-3 3" />
            </svg>
          </button>

          <div className="sel-pill-divider" />

          {/* 7. ☰ More Options (Reference Image 3) */}
          <button
            className={`sel-pill-btn ${activeFlyout === 'more' || activeFlyout === 'thickness' ? 'active' : ''}`}
            onClick={() => setActiveFlyout((f) => (f === 'more' ? 'none' : 'more'))}
            title="More Options"
            aria-label="More Options"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          {/* ─── Layer Order Menu (Reference Image 2) ─────────────────────── */}
          {activeFlyout === 'layer' && (
            <div className="sel-flyout-menu layer-flyout-menu" style={{ left: pillLeft < (selectedScreenBBox?.left || 0) ? -230 : 50 }}>
              <button
                className="flyout-item"
                onClick={() => {
                  moveObjectLayer(selectedObject.id, 'top');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="4" x2="21" y2="4" strokeWidth="2.5" />
                    <rect x="5" y="14" width="14" height="6" rx="1" />
                    <path d="M12 14V7m0 0l-3 3m3-3l3 3" />
                  </svg>
                </span>
                <span className="flyout-label">Move to the top layer</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => {
                  moveObjectLayer(selectedObject.id, 'bottom');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="20" x2="21" y2="20" strokeWidth="2.5" />
                    <rect x="5" y="4" width="14" height="6" rx="1" />
                    <path d="M12 10v7m0 0l-3-3m3 3l3-3" />
                  </svg>
                </span>
                <span className="flyout-label">Move to the bottom layer</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => {
                  moveObjectLayer(selectedObject.id, 'forward');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="11" width="16" height="5" rx="1" />
                    <path d="M12 11V4m0 0l-3 3m3-3l3 3" />
                  </svg>
                </span>
                <span className="flyout-label">Move to the previous layer</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => {
                  moveObjectLayer(selectedObject.id, 'backward');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="8" width="16" height="5" rx="1" />
                    <path d="M12 13v7m0 0l-3-3m3 3l3-3" />
                  </svg>
                </span>
                <span className="flyout-label">Move to the next layer</span>
              </button>
            </div>
          )}

          {/* ─── More Options Menu (Reference Image 3) ────────────────────── */}
          {activeFlyout === 'more' && (
            <div className="sel-flyout-menu more-flyout-menu" style={{ left: pillLeft < (selectedScreenBBox?.left || 0) ? -230 : 50 }}>
              {/* 1. Lock */}
              <button
                className="flyout-item"
                onClick={() => {
                  handleToggleLockSelected();
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">{selectedObject.locked ? '🔓' : '🔒'}</span>
                <span className="flyout-label">{selectedObject.locked ? 'Unlock' : 'Lock'}</span>
              </button>

              {/* 2. Line thickness */}
              <button
                className="flyout-item has-submenu"
                onClick={() => setActiveFlyout('thickness')}
              >
                <span className="flyout-icon">━</span>
                <span className="flyout-label">Line thickness</span>
                <span className="submenu-arrow">›</span>
              </button>

              {/* 3. Combine */}
              <button
                className="flyout-item"
                onClick={() => {
                  setToastMessage('Combined / Grouped');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="11" height="11" rx="2" />
                    <rect x="10" y="10" width="11" height="11" rx="2" />
                  </svg>
                </span>
                <span className="flyout-label">Combine</span>
              </button>

              {/* 4. Add to resource library */}
              <button
                className="flyout-item"
                onClick={() => {
                  setActiveFlyout('none');
                  setResourceObjectToSave(selectedObject);
                  setShowAddToResourceModal(true);
                }}
              >
                <span className="flyout-icon">🖼️</span>
                <span className="flyout-label">Add to resource library</span>
              </button>

              {/* 4b. Fit to Screen / Fill (for image) */}
              {selectedObject.type === 'image' && (
                <button
                  className="flyout-item has-submenu"
                  onClick={() => setActiveFlyout('imageFit')}
                >
                  <span className="flyout-icon">⛶</span>
                  <span className="flyout-label">Fit to Screen / Fill</span>
                  <span className="submenu-arrow">›</span>
                </button>
              )}

              {/* 5. Rotate 90° Clockwise */}
              <button
                className="flyout-item"
                onClick={() => {
                  rotateObject(selectedObject.id, 90);
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">⟳</span>
                <span className="flyout-label">Rotate 90°</span>
              </button>

              {/* 6. Mirror (Horizontal Flip) */}
              <button
                className="flyout-item"
                onClick={() => {
                  flipObject(selectedObject.id, 'horizontal');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">⇹</span>
                <span className="flyout-label">Mirror</span>
              </button>

              {/* 6. Flip (Vertical Flip) */}
              <button
                className="flyout-item"
                onClick={() => {
                  flipObject(selectedObject.id, 'vertical');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">⇳</span>
                <span className="flyout-label">Flip</span>
              </button>

              {/* 7. Copy */}
              <button
                className="flyout-item"
                onClick={() => {
                  copyObject(selectedObject);
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">📄</span>
                <span className="flyout-label">Copy</span>
              </button>

              {/* 8. Shear / Cut */}
              <button
                className="flyout-item"
                onClick={() => {
                  copyObject(selectedObject);
                  handleDeleteSelected();
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">✂️</span>
                <span className="flyout-label">Shear</span>
              </button>
            </div>
          )}

          {/* ─── Line Thickness Sub-Flyout ────────────────────────────────── */}
          {activeFlyout === 'thickness' && (
            <div className="sel-flyout-menu thickness-flyout-menu" style={{ left: pillLeft < (selectedScreenBBox?.left || 0) ? -200 : 50 }}>
              <div className="flyout-header-title">Line Thickness</div>
              {[2, 4, 6, 8, 12, 16, 24].map((w) => (
                <button
                  key={w}
                  className="flyout-thickness-row"
                  onClick={() => {
                    setObjectLineWidth(selectedObject.id, w);
                    setActiveFlyout('none');
                  }}
                >
                  <span className="thickness-bar" style={{ height: `${Math.min(10, Math.max(2, w))}px` }} />
                  <span className="thickness-label">{w}px</span>
                </button>
              ))}
            </div>
          )}

          {/* ─── Image Fit & Screen Sizing Flyout Menu ─────────────────────── */}
          {activeFlyout === 'imageFit' && selectedObject.type === 'image' && (
            <div className="sel-flyout-menu image-fit-flyout-menu" style={{ left: pillLeft < (selectedScreenBBox?.left || 0) ? -245 : 50 }}>
              <div className="flyout-header-title">Image Screen Sizing</div>

              <button
                className="flyout-item"
                onClick={() => handleImageFitAction('fit')}
                title="Fit to Screen: proportionally shrinks or grows image to fit inside screen boundaries"
              >
                <span className="flyout-icon">⛶</span>
                <span className="flyout-label">Fit to Screen (Contain)</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => handleImageFitAction('fill')}
                title="Fill Screen: stretches image to fill all 4 edges of the screen"
              >
                <span className="flyout-icon">⬛</span>
                <span className="flyout-label">Fill Screen (Stretch)</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => handleImageFitAction('cover')}
                title="Cover Screen: fills the entire screen while maintaining aspect ratio (crops if needed)"
              >
                <span className="flyout-icon">🔲</span>
                <span className="flyout-label">Cover Screen (Crop to Fit)</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => handleImageFitAction('repeat')}
                title="Repeat: tiles image across the entire screen in a neat grid"
              >
                <span className="flyout-icon">🔁</span>
                <span className="flyout-label">Repeat / Tile Screen</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => handleImageFitAction('center')}
                title="Center on Screen: moves image to the center of the board without resizing"
              >
                <span className="flyout-icon">🎯</span>
                <span className="flyout-label">Center on Screen</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => handleImageFitAction('background')}
                title="Set as Page Background: converts this image into the background of this page"
              >
                <span className="flyout-icon">🖼️</span>
                <span className="flyout-label">Set as Page Background</span>
              </button>

              <button
                className="flyout-item"
                onClick={() => handleImageFitAction('original')}
                title="Reset Size: restores natural 100% resolution dimensions"
              >
                <span className="flyout-icon">1:1</span>
                <span className="flyout-label">Reset Size (100% Original)</span>
              </button>
            </div>
          )}

          {/* ─── Color Palette Flyout ─────────────────────────────────────── */}
          {activeFlyout === 'palette' && (
            <div className="sel-flyout-menu palette-flyout-menu" style={{ left: pillLeft < (selectedScreenBBox?.left || 0) ? -190 : 50 }}>
              <div className="palette-grid">
                {[
                  '#ffffff',
                  '#ef4444',
                  '#f97316',
                  '#eab308',
                  '#22c55e',
                  '#06b6d4',
                  '#3b82f6',
                  '#8b5cf6',
                  '#ec4899',
                  '#111827',
                ].map((c) => (
                  <button
                    key={c}
                    className="palette-swatch-dot"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setObjectColor(selectedObject.id, c);
                      setActiveFlyout('none');
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Paste button when cross-page clipboard has content */}
      {canPaste && (
        <button
          className="canvas-floating-paste-btn"
          onClick={() => pasteObject()}
          title="Paste copied element to this page (Ctrl+V)"
        >
          <span>📋</span> Paste
        </button>
      )}

      {/* ─── Canvas Navigation Floating HUD (Section 9) ─── */}
      <div className="canvas-nav-hud" role="region" aria-label="Canvas Navigation">
        <button
          className="canvas-nav-btn"
          onClick={() => engineRef.current?.zoomOut()}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <span>−</span>
        </button>

        <button
          className="canvas-nav-btn zoom-level-btn"
          onClick={() => engineRef.current?.zoomActual()}
          title="Zoom: Click for Actual Size 100% (1:1)"
          aria-label="Reset Zoom"
        >
          <span>{Math.round(toolState.zoom * 100)}%</span>
        </button>

        <button
          className="canvas-nav-btn"
          onClick={() => engineRef.current?.zoomIn()}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <span>+</span>
        </button>

        <div className="canvas-nav-divider" />

        <button
          className="canvas-nav-btn"
          onClick={() => {
            const container = containerRef.current;
            if (container) {
              const { width, height } = container.getBoundingClientRect();
              engineRef.current?.fitToPage(width, height, currentPage?.width, currentPage?.height);
            }
          }}
          title="Fit Page to Window"
          aria-label="Fit Page"
        >
          <span>⛶</span>
        </button>

        <button
          className="canvas-nav-btn"
          onClick={() => {
            const container = containerRef.current;
            if (container) {
              const { width, height } = container.getBoundingClientRect();
              engineRef.current?.fitToContent(width, height);
            }
          }}
          title="Fit Content to Window"
          aria-label="Fit Content"
        >
          <span>🎯</span>
        </button>
      </div>

      {/* Canvas Toast Banner for User Feedback */}
      {toastMessage && (
        <div className="canvas-toast-banner" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Direct On-Board Text Typing & Right-Docked Typography Toolbar */}
      {(textModalPos || editingTextObj) && (
        <InlineTextEditor
          initialPoint={textModalPos || { x: editingTextObj?.x || 100, y: editingTextObj?.y || 100 }}
          initialText={editingTextObj}
          zoom={toolState.zoom}
          panX={toolState.panX}
          panY={toolState.panY}
          onSave={handleSaveText}
          onClose={() => {
            setTextModalPos(null);
            setEditingTextObj(null);
          }}
        />
      )}

      {/* Add To Resource Library Interactive Modal */}
      {showAddToResourceModal && resourceObjectToSave && (
        <AddToResourceLibraryModal
          objectToSave={resourceObjectToSave}
          onClose={() => {
            setShowAddToResourceModal(false);
            setResourceObjectToSave(null);
          }}
          onSaved={(name, cat, folder) => {
            setShowAddToResourceModal(false);
            setResourceObjectToSave(null);
            setToastMessage(
              `Saved "${name}" to Resource Library under ${cat}${folder ? ` / ${folder}` : ''}!`
            );
          }}
        />
      )}

      {/* Interactive Angle Construction Edit Modal */}
      {editingAngleShape && (
        <AngleConstructionModal
          existingShape={editingAngleShape}
          onClose={() => setEditingAngleShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingAngleShape, updated);
            setEditingAngleShape(null);
          }}
        />
      )}

      {/* Interactive Cartesian Plane Edit Modal */}
      {editingCartesianShape && (
        <CartesianPlaneModal
          existingShape={editingCartesianShape}
          onClose={() => setEditingCartesianShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingCartesianShape, updated);
            setEditingCartesianShape(null);
          }}
        />
      )}

      {/* Interactive Function Plotter Edit Modal */}
      {editingFunctionShape && (
        <FunctionPlotterModal
          existingShape={editingFunctionShape}
          onClose={() => setEditingFunctionShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingFunctionShape, updated);
            setEditingFunctionShape(null);
          }}
        />
      )}

      {/* Interactive Number Line Edit Modal */}
      {editingNumberLineShape && (
        <NumberLineModal
          existingShape={editingNumberLineShape}
          onClose={() => setEditingNumberLineShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingNumberLineShape, updated);
            setEditingNumberLineShape(null);
          }}
        />
      )}

      {/* Interactive 3D Geometry Solid & Coordinate Inspector Modal */}
      {editingGeometry3DShape && (
        <Geometry3DModal
          existingShape={editingGeometry3DShape}
          onClose={() => setEditingGeometry3DShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingGeometry3DShape, updated);
            setEditingGeometry3DShape(null);
          }}
        />
      )}

      {/* Interactive Resistor & Variable Rheostat Edit Modal */}
      {editingResistorShape && (
        <ResistorModal
          existingShape={editingResistorShape}
          defaultMode={editingResistorShape.params?.componentType === 'rheostat' ? 'rheostat' : 'resistor'}
          onClose={() => setEditingResistorShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingResistorShape, updated);
            setEditingResistorShape(null);
          }}
        />
      )}

      {/* Interactive Series & Parallel Circuit Diagram Builder Modal */}
      {editingCircuitShape && (
        <CircuitDiagramModal
          existingShape={editingCircuitShape}
          defaultMode={
            (editingCircuitShape.params?.diagramType as 'seriesCircuit' | 'parallelCircuit') ||
            'seriesCircuit'
          }
          onClose={() => setEditingCircuitShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingCircuitShape, updated);
            setEditingCircuitShape(null);
          }}
        />
      )}

      {/* Interactive Force Vector Modal */}
      {editingForceVectorShape && (
        <ForceVectorModal
          existingShape={editingForceVectorShape}
          defaultMode="forceVector"
          onClose={() => setEditingForceVectorShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingForceVectorShape, updated);
            setEditingForceVectorShape(null);
          }}
        />
      )}

      {/* Interactive Resultant Force Demonstration Modal */}
      {editingResultantShape && (
        <ForceVectorModal
          existingShape={editingResultantShape}
          defaultMode="resultantForce"
          onClose={() => setEditingResultantShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingResultantShape, updated);
            setEditingResultantShape(null);
          }}
        />
      )}

      {/* Interactive Free Body Diagram Modal */}
      {editingFbdShape && (
        <FreeBodyDiagramModal
          existingShape={editingFbdShape}
          onClose={() => setEditingFbdShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingFbdShape, updated);
            setEditingFbdShape(null);
          }}
        />
      )}

      {/* Interactive Kinematic Motion Diagram Modal */}
      {editingMotionShape && (
        <MotionDiagramModal
          existingShape={editingMotionShape}
          onClose={() => setEditingMotionShape(null)}
          onUpdateExisting={(updated) => {
            handleUpdateShape(editingMotionShape, updated);
            setEditingMotionShape(null);
          }}
        />
      )}

      {/* Interactive Periodic Table Modal */}
      {editingPeriodicTableShape && (
        <PeriodicTableModal
          existingShape={editingPeriodicTableShape}
          onClose={() => setEditingPeriodicTableShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingPeriodicTableShape, updated);
            setEditingPeriodicTableShape(null);
          }}
        />
      )}

      {/* Interactive Element Placard Card Modal */}
      {editingElementCardShape && (
        <ElementCardModal
          existingShape={editingElementCardShape}
          onClose={() => setEditingElementCardShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingElementCardShape, updated);
            setEditingElementCardShape(null);
          }}
        />
      )}

      {/* Interactive Bohr Atomic Model Modal */}
      {editingBohrModelShape && (
        <BohrModelModal
          existingShape={editingBohrModelShape}
          onClose={() => setEditingBohrModelShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingBohrModelShape, updated);
            setEditingBohrModelShape(null);
          }}
        />
      )}

      {/* Interactive Laboratory Apparatus Modal */}
      {editingLabApparatusShape && (
        <LabApparatusModal
          existingShape={editingLabApparatusShape}
          onClose={() => setEditingLabApparatusShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingLabApparatusShape, updated);
            setEditingLabApparatusShape(null);
          }}
        />
      )}

    </div>
  );
}
