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
import { CodeEditorModal } from './subjectModals/CodeEditorModal';
import { PseudocodeModal } from './subjectModals/PseudocodeModal';
import { FlowchartBuilderModal } from './subjectModals/FlowchartBuilderModal';
import { TraceTableModal } from './subjectModals/TraceTableModal';
import { CallStackModal } from './subjectModals/CallStackModal';
import { MemoryLayoutModal } from './subjectModals/MemoryLayoutModal';
import { LinkedListModal } from './subjectModals/LinkedListModal';
import { TreeGraphModal } from './subjectModals/TreeGraphModal';
import { SortingSearchingModal, generateSimulationSteps, AlgorithmType } from './subjectModals/SortingSearchingModal';
import { DatabaseTableModal } from './subjectModals/DatabaseTableModal';
import { CpuArchModal } from './subjectModals/CpuArchModal';
import { InstructionCycleModal } from './subjectModals/InstructionCycleModal';
import { NetworkTopologyModal } from './subjectModals/NetworkTopologyModal';
import { LogicGateModal } from './subjectModals/LogicGateModal';
import { DigitalCircuitModal } from './subjectModals/DigitalCircuitModal';
import { TruthTableModal } from './subjectModals/TruthTableModal';
import { KarnaughMapModal } from './subjectModals/KarnaughMapModal';
import { HierarchyChartModal } from './subjectModals/HierarchyChartModal';
import { MindmapModal } from './subjectModals/MindmapModal';
import { TimelineModal } from './subjectModals/TimelineModal';
import { ProcessChartModal } from './subjectModals/ProcessChartModal';
import {
  HierarchyNode,
  HierarchyTheme,
  HierarchyStyle,
  DEFAULT_HIERARCHY_TREE,
  MindmapNode,
  DEFAULT_MINDMAP,
  TimelineEvent,
  DEFAULT_TIMELINE_EVENTS,
  ProcessStep,
  DEFAULT_PROCESS_STEPS,
  ProcessChartStyle,
} from '../services/subjectModules/commonResourcesModule';
import {
  evaluateMux,
  evaluateAdder,
  evaluateFlipFlopNextState,
  evaluateCounter,
} from '../services/subjectModules/digitalLogicModule';
import { isLatexSyntax } from '../services/latexService';
import { isTypingOrInputFocused } from '../utils/keyboardUtils';
import { isGeoShapeType, GeoAnnotationItem } from '../services/geography/types';
import { getGeoMapTransform } from '../engine/geographyShapeRenderer';
import { GeographyResourceCentreModal } from './geography/GeographyResourceCentreModal';
import { GeographyAtlasModal } from './geography/GeographyAtlasModal';
import { Globe3DModal } from './geography/Globe3DModal';
import { GisThematicModal } from './geography/GisThematicModal';
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
    setPenStyle,
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
  const [editingCodeShape, setEditingCodeShape] = useState<ShapeObject | null>(null);
  const [editingPseudocodeShape, setEditingPseudocodeShape] = useState<ShapeObject | null>(null);
  const [editingFlowchartShape, setEditingFlowchartShape] = useState<ShapeObject | null>(null);
  const [editingTraceTableShape, setEditingTraceTableShape] = useState<ShapeObject | null>(null);
  const [editingCallStackShape, setEditingCallStackShape] = useState<ShapeObject | null>(null);
  const [editingMemoryShape, setEditingMemoryShape] = useState<ShapeObject | null>(null);
  const [editingLinkedListShape, setEditingLinkedListShape] = useState<ShapeObject | null>(null);
  const [editingTreeGraphShape, setEditingTreeGraphShape] = useState<ShapeObject | null>(null);
  const [editingSortingShape, setEditingSortingShape] = useState<ShapeObject | null>(null);
  const [editingDatabaseTableShape, setEditingDatabaseTableShape] = useState<ShapeObject | null>(null);
  const [editingCpuArchShape, setEditingCpuArchShape] = useState<ShapeObject | null>(null);
  const [editingInstructionCycleShape, setEditingInstructionCycleShape] = useState<ShapeObject | null>(null);
  const [editingNetworkTopologyShape, setEditingNetworkTopologyShape] = useState<ShapeObject | null>(null);
  const [editingLogicGateShape, setEditingLogicGateShape] = useState<ShapeObject | null>(null);
  const [editingDigitalCircuitShape, setEditingDigitalCircuitShape] = useState<ShapeObject | null>(null);
  const [editingTruthTableShape, setEditingTruthTableShape] = useState<ShapeObject | null>(null);
  const [editingKarnaughMapShape, setEditingKarnaughMapShape] = useState<ShapeObject | null>(null);
  const [editingHierarchyShape, setEditingHierarchyShape] = useState<ShapeObject | null>(null);
  const [editingMindmapShape, setEditingMindmapShape] = useState<ShapeObject | null>(null);
  const [editingTimelineShape, setEditingTimelineShape] = useState<ShapeObject | null>(null);
  const [editingProcessShape, setEditingProcessShape] = useState<ShapeObject | null>(null);
  const [showGeoResourceModal, setShowGeoResourceModal] = useState(false);
  const [showGeoAtlasModal, setShowGeoAtlasModal] = useState(false);
  const [showGlobeModal, setShowGlobeModal] = useState(false);
  const [showGisModal, setShowGisModal] = useState(false);

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
    const page = currentPageRef.current;

    // Check if stroke was drawn over an active geography map in 'annotate' mode
    const targetGeoMap = (page?.objects || []).find((o) => {
      if (o.type !== 'shape' || !isGeoShapeType((o as ShapeObject).shapeType)) return false;
      const s = o as ShapeObject;
      if (s.params?.interactionMode !== 'annotate') return false;
      // Check if stroke bbox intersects map bbox
      return !(
        stroke.bbox.x + stroke.bbox.width < s.x ||
        stroke.bbox.x > s.x + s.width ||
        stroke.bbox.y + stroke.bbox.height < s.y ||
        stroke.bbox.y > s.y + s.height
      );
    }) as ShapeObject | undefined;

    if (targetGeoMap) {
      // Anchoring stroke to map coordinate space [0..1000, 0..1000]
      const transform = getGeoMapTransform(targetGeoMap);
      const normPoints = stroke.points.map(
        (pt) => [transform.screenToNormX(pt.x), transform.screenToNormY(pt.y)] as [number, number]
      );

      // Normalized stroke width so that line thickness scales relatively with zoom in / zoom out
      const normWidth = (stroke.style.width || 4) / (transform.baseScale || 1);

      const newAnnotation: GeoAnnotationItem = {
        id: stroke.id,
        type: stroke.style.penType === 'highlighter' ? 'highlighter' : 'pen',
        points: normPoints,
        color: stroke.style.color,
        width: normWidth,
        opacity: stroke.style.penType === 'highlighter' ? 0.45 : 1.0,
      };

      const currentAnnotations = targetGeoMap.params?.annotations || [];
      const updatedAnnotations = [...currentAnnotations, newAnnotation];
      const updatedMap: ShapeObject = {
        ...targetGeoMap,
        params: {
          ...targetGeoMap.params,
          annotations: updatedAnnotations,
        },
      };

      commandSystem.execute({
        id: uuidv4(),
        description: 'Annotate map',
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updatedMap });
          engineRef.current?.removeCommittedObject(stroke.id);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: targetGeoMap });
        },
      });

      // Immediately remove loose canvas stroke from DrawingEngine
      engineRef.current?.removeCommittedObject(stroke.id);
      return;
    }

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
  // PROTECTED: If user clicks and drags inside ANY textbox/input, dragging out to the board area does not steal focus or dismiss menus
  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    let isDragFromInput = false;

    const handleWindowPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextInput =
        target &&
        (target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' &&
            !['range', 'color', 'checkbox', 'radio', 'button', 'submit'].includes(
              (target as HTMLInputElement).type?.toLowerCase()
            )) ||
          target.isContentEditable ||
          target.getAttribute?.('contenteditable') === 'true' ||
          target.closest?.(
            'textarea, [contenteditable="true"], .inline-text-editor-box, .board-typography-sidebar, .smartboard-text-modal'
          ));
      isDragFromInput = Boolean(isTextInput);
    };

    const handleWindowPointerUp = () => {
      isDragFromInput = false;
    };

    const handleWindowClickCapture = (e: MouseEvent) => {
      if (isDragFromInput) {
        e.stopPropagation();
      }
    };

    const handleCanvasPointerDown = (e: PointerEvent) => {
      if (isDragFromInput) {
        return;
      }
      closeAllPopups();
      setActiveFlyout('none');

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl !== canvas && typeof activeEl.blur === 'function') {
        activeEl.blur();
      }

      if (toolState.activeTool !== 'select' && selectedObjectRef.current) {
        setSelectedObject(null);
      }
    };

    window.addEventListener('pointerdown', handleWindowPointerDown, { capture: true });
    window.addEventListener('pointerup', handleWindowPointerUp, { capture: true });
    window.addEventListener('click', handleWindowClickCapture, { capture: true });
    canvas.addEventListener('pointerdown', handleCanvasPointerDown, { capture: true });

    return () => {
      window.removeEventListener('pointerdown', handleWindowPointerDown, { capture: true });
      window.removeEventListener('pointerup', handleWindowPointerUp, { capture: true });
      window.removeEventListener('click', handleWindowClickCapture, { capture: true });
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
        const isSupportedCsDiag =
          s.shapeType === 'csDiagram' &&
          (s.params?.diagramType === 'codeBlock' ||
            s.params?.diagramType === 'pseudocode' ||
            s.params?.diagramType === 'flowchart');
        const isSupportedCommon =
          s.shapeType === 'hierarchyChart' ||
          s.shapeType === 'mindmap' ||
          s.shapeType === 'timeline' ||
          s.shapeType === 'processChart';
        const isSupportedGeo = isGeoShapeType(s.shapeType);

        if (
          s.shapeType !== 'angleMeasurement' &&
          s.shapeType !== 'cartesianAxes' &&
          s.shapeType !== 'functionPlot' &&
          s.shapeType !== 'numberLine' &&
          s.shapeType !== 'geometry3D' &&
          !isSupportedCircuitComp &&
          !isSupportedPhysicsDiag &&
          !isSupportedChem &&
          !isSupportedCsDiag &&
          !isSupportedCommon &&
          !isSupportedGeo
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
        } else if (hitShape.shapeType === 'logicGate') {
          if (hitShape.params?.blockType) {
            setEditingDigitalCircuitShape(hitShape);
          } else {
            setEditingLogicGateShape(hitShape);
          }
        } else if (hitShape.shapeType === 'truthTable') {
          setEditingTruthTableShape(hitShape);
        } else if (hitShape.shapeType === 'karnaughMap') {
          setEditingKarnaughMapShape(hitShape);
        } else if (hitShape.shapeType === 'labApparatus') {
          setEditingLabApparatusShape(hitShape);
        } else if (hitShape.shapeType === 'csDiagram') {
          const dt = hitShape.params?.diagramType;
          if (dt === 'codeBlock') {
            setEditingCodeShape(hitShape);
          } else if (dt === 'pseudocode') {
            setEditingPseudocodeShape(hitShape);
          } else if (dt === 'flowchart') {
            setEditingFlowchartShape(hitShape);
          } else if (dt === 'traceTable') {
            setEditingTraceTableShape(hitShape);
          } else if (dt === 'callStack') {
            setEditingCallStackShape(hitShape);
          } else if (dt === 'memoryLayout') {
            setEditingMemoryShape(hitShape);
          } else if (dt === 'linkedList') {
            setEditingLinkedListShape(hitShape);
          } else if (dt === 'binaryTree' || dt === 'graph' || dt === 'treeGraph') {
            setEditingTreeGraphShape(hitShape);
          } else if (dt === 'sortingArray' || dt === 'sortingSearching') {
            setEditingSortingShape(hitShape);
          } else if (dt === 'databaseTable') {
            setEditingDatabaseTableShape(hitShape);
          } else if (dt === 'cpuArchitecture') {
            setEditingCpuArchShape(hitShape);
          } else if (dt === 'instructionCycle') {
            setEditingInstructionCycleShape(hitShape);
          } else if (dt === 'networkTopology') {
            setEditingNetworkTopologyShape(hitShape);
          }
        } else if (hitShape.shapeType === 'hierarchyChart') {
          setEditingHierarchyShape(hitShape);
        } else if (hitShape.shapeType === 'mindmap') {
          setEditingMindmapShape(hitShape);
        } else if (hitShape.shapeType === 'timeline') {
          setEditingTimelineShape(hitShape);
        } else if (hitShape.shapeType === 'processChart') {
          setEditingProcessShape(hitShape);
        } else if (hitShape.shapeType === 'geoGlobe' || (isGeoShapeType(hitShape.shapeType) && hitShape.params?.resourceType === '3d-globe')) {
          setShowGlobeModal(true);
        } else if (hitShape.params?.resourceType === 'gis-viewer' || hitShape.params?.gisState) {
          setShowGisModal(true);
        } else if (isGeoShapeType(hitShape.shapeType)) {
          setShowGeoResourceModal(true);
        }
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      if (toolState.activeTool !== 'select') return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const docX = clientX / toolState.zoom - toolState.panX;
      const docY = clientY / toolState.zoom - toolState.panY;

      const page = currentPageRef.current;
      if (!page) return;

      // 1. Mindmap Click: react & respond to node clicks on board
      const hitMindmap = [...page.objects].reverse().find((obj) => {
        if (obj.type !== 'shape' || (obj as ShapeObject).shapeType !== 'mindmap') return false;
        const s = obj as ShapeObject;
        const sw = s.width || 720;
        const sh = s.height || 460;
        return docX >= s.x && docX <= s.x + sw && docY >= s.y && docY <= s.y + sh;
      }) as ShapeObject | undefined;

      if (hitMindmap) {
        const root = JSON.parse(JSON.stringify(hitMindmap.params?.root || DEFAULT_MINDMAP));
        const mx = hitMindmap.x;
        const my = hitMindmap.y;
        const mw = hitMindmap.width || 720;
        const mh = hitMindmap.height || 460;
        const cx = mx + mw / 2;
        const cy = my + 50 + (mh - 50) / 2;

        if (Math.abs(docX - cx) <= 80 && Math.abs(docY - cy) <= 26) {
          handleUpdateShape(hitMindmap, {
            ...hitMindmap,
            params: { ...hitMindmap.params, selectedNodeId: root.id },
          });
          return;
        }

        const children = root.children || [];
        const rightChildren = children.filter((_: any, i: number) => i % 2 === 0);
        const leftChildren = children.filter((_: any, i: number) => i % 2 === 1);
        let toggledNode: any = null;

        const checkSide = (nodes: any[], isRight: boolean) => {
          if (nodes.length === 0 || toggledNode) return;
          const targetX = isRight ? cx + mw * 0.28 : cx - mw * 0.28;
          const totalSpanY = Math.min(mh - 110, nodes.length * 75);
          const startY = cy - totalSpanY / 2;
          const stepY = nodes.length > 1 ? totalSpanY / (nodes.length - 1) : 0;

          nodes.forEach((node: any, idx: number) => {
            if (toggledNode) return;
            const nodeY = nodes.length === 1 ? cy : startY + idx * stepY;
            const cardW = 120;
            const cardH = 34;
            const cardX = isRight ? targetX : targetX - cardW;
            const cardY = nodeY - cardH / 2;

            if (docX >= cardX - 15 && docX <= cardX + cardW + 25 && docY >= cardY - 8 && docY <= cardY + cardH + 8) {
              if (node.children && node.children.length > 0) {
                node.collapsed = !node.collapsed;
              }
              toggledNode = node;
            }
          });
        };

        checkSide(rightChildren, true);
        checkSide(leftChildren, false);

        if (toggledNode) {
          handleUpdateShape(hitMindmap, {
            ...hitMindmap,
            params: { ...hitMindmap.params, root, selectedNodeId: toggledNode.id },
          });
          return;
        }
      }

      // 2. Timeline Click: jump to clicked milestone card
      const hitTimeline = [...page.objects].reverse().find((obj) => {
        if (obj.type !== 'shape' || (obj as ShapeObject).shapeType !== 'timeline') return false;
        const s = obj as ShapeObject;
        const sw = s.width || 760;
        const sh = s.height || 360;
        return docX >= s.x && docX <= s.x + sw && docY >= s.y && docY <= s.y + sh;
      }) as ShapeObject | undefined;

      if (hitTimeline) {
        const events: any[] = hitTimeline.params?.events || [];
        const orientation = hitTimeline.params?.orientation || 'horizontal';
        const tx = hitTimeline.x;
        const ty = hitTimeline.y;
        const tw = hitTimeline.width || 760;
        const th = hitTimeline.height || 360;

        if (orientation === 'horizontal') {
          const startX = tx + 36;
          const endX = tx + tw - 36;
          const stepX = events.length > 1 ? (endX - startX) / (events.length - 1) : 0;
          for (let i = 0; i < events.length; i++) {
            const evtX = events.length === 1 ? tx + tw / 2 : startX + i * stepX;
            if (Math.abs(docX - evtX) <= 65) {
              handleUpdateShape(hitTimeline, {
                ...hitTimeline,
                params: { ...hitTimeline.params, activeEventIndex: i },
              });
              return;
            }
          }
        } else {
          const startY = ty + 70;
          const endY = ty + th - 30;
          const stepY = events.length > 1 ? (endY - startY) / (events.length - 1) : 0;
          for (let i = 0; i < events.length; i++) {
            const evtY = events.length === 1 ? ty + th / 2 : startY + i * stepY;
            if (Math.abs(docY - evtY) <= 45) {
              handleUpdateShape(hitTimeline, {
                ...hitTimeline,
                params: { ...hitTimeline.params, activeEventIndex: i },
              });
              return;
            }
          }
        }
      }

      // 3. Process Chart Click: jump to clicked process step
      const hitProcess = [...page.objects].reverse().find((obj) => {
        if (obj.type !== 'shape' || (obj as ShapeObject).shapeType !== 'processChart') return false;
        const s = obj as ShapeObject;
        const sw = s.width || 740;
        const sh = s.height || 260;
        return docX >= s.x && docX <= s.x + sw && docY >= s.y && docY <= s.y + sh;
      }) as ShapeObject | undefined;

      if (hitProcess) {
        const steps: any[] = hitProcess.params?.steps || [];
        const px = hitProcess.x;
        const pw = hitProcess.width || 740;
        const stepW = (pw - 32) / (steps.length || 1);
        const relX = docX - (px + 16);
        if (relX >= 0 && relX <= pw - 32) {
          const clickedStepIdx = Math.min(steps.length - 1, Math.max(0, Math.floor(relX / stepW)));
          handleUpdateShape(hitProcess, {
            ...hitProcess,
            params: { ...hitProcess.params, activeStepIndex: clickedStepIdx },
          });
          return;
        }
      }
    };

    canvas.addEventListener('dblclick', handleCanvasDoubleClick);
    canvas.addEventListener('click', handleCanvasClick);
    return () => {
      canvas.removeEventListener('dblclick', handleCanvasDoubleClick);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [toolState.zoom, toolState.panX, toolState.panY, toolState.activeTool, setSelectedObject, handleUpdateShape]);

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
    if (selectedObject.locked) {
      setToastMessage?.('Element is locked. Unlock it to delete.');
      return;
    }
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
    const page = currentPageRef.current;
    if (!page) return;
    const prev = selectedObject;
    const willLock = !selectedObject.locked;

    if (willLock) {
      // When locking an element: mark it locked, set to bottom layer ('background'), and move to bottom of objects stack
      // so any active drawing draws OVER it, not in the back of it!
      const updated = {
        ...selectedObject,
        locked: true,
        layerId: 'background',
      };
      const otherObjects = page.objects.filter((o) => o.id !== selectedObject.id);
      const reorderedObjects = [updated, ...otherObjects];

      commandSystem.execute({
        id: uuidv4(),
        description: 'Lock and move to bottom layer',
        execute() {
          docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: reorderedObjects });
          setSelectedObject(updated);
        },
        undo() {
          docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: page.objects });
          setSelectedObject(prev);
        },
      });
    } else {
      const restoredLayerId =
        prev.type === 'stroke' ? 'drawing' : prev.type === 'image' ? 'imported-media' : 'objects';
      const updated = {
        ...selectedObject,
        locked: false,
        layerId: restoredLayerId,
      };

      commandSystem.execute({
        id: uuidv4(),
        description: 'Unlock element',
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
          setSelectedObject(updated);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
          setSelectedObject(prev);
        },
      });
    }
  }, [selectedObject, commandSystem, docDispatch, setSelectedObject]);

  const handleUnlockSelectedObject = useCallback(() => {
    if (!selectedObject) return;
    const pageIndex = currentPageIndexRef.current;
    const page = currentPageRef.current;
    if (!page) return;

    const restoredLayerId =
      selectedObject.layerId === 'background'
        ? selectedObject.type === 'stroke'
          ? 'drawing'
          : selectedObject.type === 'image'
          ? 'imported-media'
          : 'objects'
        : selectedObject.layerId;

    const prev = selectedObject;
    const updated = { ...selectedObject, locked: false, layerId: restoredLayerId };
    commandSystem.execute({
      id: uuidv4(),
      description: 'Unlock element',
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

  const handleUnlockCanvas = useCallback(() => {
    const pageIndex = currentPageIndexRef.current;
    const page = currentPageRef.current;
    if (!page) return;

    // 1. Unlock all locked layers on the current page
    if (page.layers) {
      page.layers.forEach((l) => {
        if (l.locked) {
          docDispatch({ type: 'SET_LAYER_LOCKED', pageIndex, layerId: l.id, locked: false });
        }
      });
    }

    // 2. Unlock all locked objects and restore layerId if it was pushed to background
    let modified = false;
    const updatedObjects = (page.objects || []).map((o) => {
      if (o.locked) {
        modified = true;
        const restoredLayerId =
          o.layerId === 'background'
            ? o.type === 'stroke'
              ? 'drawing'
              : o.type === 'image'
              ? 'imported-media'
              : 'objects'
            : o.layerId;
        return { ...o, locked: false, layerId: restoredLayerId };
      }
      return o;
    });

    if (modified) {
      docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: updatedObjects });
    }

    if (selectedObject?.locked) {
      setSelectedObject({ ...selectedObject, locked: false });
    }
  }, [docDispatch, selectedObject, setSelectedObject]);

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

    const handleSmartboardRedraw = () => {
      if (currentPageRef.current && engineRef.current) {
        engineRef.current.redrawCommitted(
          currentPageRef.current.objects,
          selectedObjectRef.current?.id,
          selectedObjectRef.current
        );
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);
    window.addEventListener('smartboard:redraw', handleSmartboardRedraw);

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
      window.removeEventListener('smartboard:redraw', handleSmartboardRedraw);
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
      const pillW = 48;
      const pillH = 340;

      if (selectedScreenBBox.left + selectedScreenBBox.width + 60 <= containerW) {
        pillLeft = selectedScreenBBox.left + selectedScreenBBox.width + 18;
      } else if (selectedScreenBBox.left - 64 >= 12) {
        pillLeft = selectedScreenBBox.left - 64;
      } else {
        pillLeft = Math.max(12, Math.min(containerW - pillW - 12, selectedScreenBBox.left + 12));
      }
      pillLeft = Math.max(12, Math.min(containerW - pillW - 12, pillLeft));
      // Top margin clearance (min 68px) ensures the top canvas menu bar never overlaps the Delete button
      pillTop = Math.max(68, Math.min(containerH - pillH - 16, selectedScreenBBox.top));
    }
  }

  // Dynamic flyout positioning helper ensuring 100% on-screen visibility (Requirement 1)
  const getFlyoutStyle = (menuW: number, menuH: number, triggerOffsetTop: number = 0) => {
    const containerW = containerRef.current?.clientWidth || window.innerWidth;
    const containerH = containerRef.current?.clientHeight || window.innerHeight;

    let targetScreenX: number;
    if (pillLeft + 48 + menuW <= containerW - 8) {
      targetScreenX = pillLeft + 48;
    } else if (pillLeft - menuW - 8 >= 8) {
      targetScreenX = pillLeft - menuW - 8;
    } else {
      targetScreenX = Math.max(8, Math.min(containerW - menuW - 8, pillLeft + 48));
    }
    const localLeft = targetScreenX - pillLeft;

    const idealScreenY = pillTop + triggerOffsetTop;
    const targetScreenY = Math.max(8, Math.min(containerH - menuH - 8, idealScreenY));
    const localTop = targetScreenY - pillTop;

    return {
      left: localLeft,
      top: localTop,
      maxHeight: Math.min(menuH, Math.max(160, containerH - 24)),
      overflowY: 'auto' as const,
    };
  };

  // Check if current page has any locked layers (isolated from single object locks)
  const hasLockedLayers = (currentPage?.layers || []).some((l) => l.locked);
  const isCanvasOrLayerLocked = hasLockedLayers;
  const isSelectedObjectLocked = Boolean(
    selectedObject?.locked ||
    (currentPage?.layers || []).find((l) => l.id === selectedObject?.layerId)?.locked
  );

  // Find if any geography map on the board is in 'annotate' mode (Requirement 4 & 5)
  const activeAnnotatingMap = (currentPage?.objects || []).find(
    (o) =>
      o.type === 'shape' &&
      isGeoShapeType((o as ShapeObject).shapeType) &&
      (o as ShapeObject).params?.interactionMode === 'annotate'
  ) as ShapeObject | undefined;

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
        tabIndex={-1}
        onFocus={() => {
          closeAllPopups();
          setActiveFlyout('none');
        }}
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

      {/* Floating Canvas / Layer / Object Lock Indicator & Unlock Button at Top-Right (Requirement 4) */}
      {toolState.activeTool === 'select' && (isCanvasOrLayerLocked || isSelectedObjectLocked) && (
        <div
          className="canvas-lock-indicator-badge"
          style={{
            position: 'absolute',
            top: 14,
            right: 18,
            zIndex: 130,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="canvas-unlock-btn"
            onClick={isSelectedObjectLocked && !isCanvasOrLayerLocked ? handleUnlockSelectedObject : handleUnlockCanvas}
            title={isSelectedObjectLocked ? 'Element is locked. Click to unlock' : 'Canvas or layer is locked. Click to unlock'}
            style={{
              padding: '6px 9px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            <span className="lock-icon">🔒</span>
          </button>
        </div>
      )}

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

      {/* Quick "💻 / 📝 / 🔀 Configure Computer Science Diagram" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'csDiagram' && selectedScreenBBox && (
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
            title="Edit Code / Pseudocode / Flowchart (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const dt = s.params?.diagramType;
              if (dt === 'pseudocode') setEditingPseudocodeShape(s);
              else if (dt === 'flowchart') setEditingFlowchartShape(s);
              else if (dt === 'traceTable') setEditingTraceTableShape(s);
              else if (dt === 'callStack') setEditingCallStackShape(s);
              else if (dt === 'memoryLayout') setEditingMemoryShape(s);
              else if (dt === 'linkedList') setEditingLinkedListShape(s);
              else if (dt === 'binaryTree' || dt === 'graph' || dt === 'treeGraph') setEditingTreeGraphShape(s);
              else if (dt === 'sortingArray' || dt === 'sortingSearching') setEditingSortingShape(s);
              else if (dt === 'databaseTable') setEditingDatabaseTableShape(s);
              else if (dt === 'cpuArchitecture') setEditingCpuArchShape(s);
              else if (dt === 'instructionCycle') setEditingInstructionCycleShape(s);
              else if (dt === 'networkTopology') setEditingNetworkTopologyShape(s);
              else setEditingCodeShape(s);
            }}
          >
            <span>
              {(selectedObject as ShapeObject).params?.diagramType === 'pseudocode'
                ? '📝'
                : (selectedObject as ShapeObject).params?.diagramType === 'flowchart'
                ? '🔀'
                : (selectedObject as ShapeObject).params?.diagramType === 'traceTable'
                ? '📊'
                : (selectedObject as ShapeObject).params?.diagramType === 'callStack'
                ? '📚'
                : (selectedObject as ShapeObject).params?.diagramType === 'memoryLayout'
                ? '🧠'
                : (selectedObject as ShapeObject).params?.diagramType === 'linkedList'
                ? '🔗'
                : (selectedObject as ShapeObject).params?.diagramType === 'binaryTree' || (selectedObject as ShapeObject).params?.diagramType === 'graph'
                ? '🌳'
                : (selectedObject as ShapeObject).params?.diagramType === 'sortingArray'
                ? '📶'
                : (selectedObject as ShapeObject).params?.diagramType === 'databaseTable'
                ? '🗄️'
                : (selectedObject as ShapeObject).params?.diagramType === 'cpuArchitecture'
                ? '🖥️'
                : (selectedObject as ShapeObject).params?.diagramType === 'instructionCycle'
                ? '🔁'
                : (selectedObject as ShapeObject).params?.diagramType === 'networkTopology'
                ? '🌐'
                : '💻'}
            </span>
            <span>
              {(selectedObject as ShapeObject).label || 'Edit Computer Science Diagram'}
            </span>
          </button>

          {/* Interactive In-Place Step Controls for Sorting Demonstration */}
          {((selectedObject as ShapeObject).params?.diagramType === 'sortingArray' ||
            (selectedObject as ShapeObject).params?.diagramType === 'sortingSearching') && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(15, 23, 42, 0.95)',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                color: '#fbbf24',
                fontSize: '12px',
                fontWeight: 600,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="cs-action-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const s = selectedObject as ShapeObject;
                  const algo: AlgorithmType = (s.params?.algorithm as AlgorithmType) || 'bubbleSort';
                  const rawArr: number[] = s.params?.array || [14, 33, 27, 10, 35, 19, 42, 44];
                  const targetVal: number = s.params?.targetVal ?? 35;
                  const steps = generateSimulationSteps(algo, rawArr, targetVal);
                  if (steps.length > 0) {
                    const step = steps[0];
                    handleUpdateShape(s, {
                      ...s,
                      params: { ...s.params, stepIndex: 0, array: step.array, activeIndices: step.activeIndices, sortedIndices: step.sortedIndices, pointers: step.pointers, statusText: step.statusText },
                      label: `${s.params?.title || 'Sorting'} (Step 1/${steps.length})`,
                    });
                  }
                }}
                title="Reset to Step 1"
                style={{ padding: '2px 6px', fontSize: '11px' }}
              >
                ⏮
              </button>
              <button
                className="cs-action-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const s = selectedObject as ShapeObject;
                  const algo: AlgorithmType = (s.params?.algorithm as AlgorithmType) || 'bubbleSort';
                  const rawArr: number[] = s.params?.array || [14, 33, 27, 10, 35, 19, 42, 44];
                  const targetVal: number = s.params?.targetVal ?? 35;
                  const steps = generateSimulationSteps(algo, rawArr, targetVal);
                  const cur = s.params?.stepIndex ?? 0;
                  const prevIdx = Math.max(0, cur - 1);
                  if (steps[prevIdx]) {
                    const step = steps[prevIdx];
                    handleUpdateShape(s, {
                      ...s,
                      params: { ...s.params, stepIndex: prevIdx, array: step.array, activeIndices: step.activeIndices, sortedIndices: step.sortedIndices, pointers: step.pointers, statusText: step.statusText },
                      label: `${s.params?.title || 'Sorting'} (Step ${prevIdx + 1}/${steps.length})`,
                    });
                  }
                }}
                title="Previous Step"
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                ◀ Prev
              </button>
              <span style={{ minWidth: '60px', textAlign: 'center', fontSize: '11px', color: '#e2e8f0' }}>
                Step {((selectedObject as ShapeObject).params?.stepIndex ?? 0) + 1}
              </span>
              <button
                className="cs-action-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const s = selectedObject as ShapeObject;
                  const algo: AlgorithmType = (s.params?.algorithm as AlgorithmType) || 'bubbleSort';
                  const rawArr: number[] = s.params?.array || [14, 33, 27, 10, 35, 19, 42, 44];
                  const targetVal: number = s.params?.targetVal ?? 35;
                  const steps = generateSimulationSteps(algo, rawArr, targetVal);
                  const cur = s.params?.stepIndex ?? 0;
                  const nextIdx = Math.min(steps.length - 1, cur + 1);
                  if (steps[nextIdx]) {
                    const step = steps[nextIdx];
                    handleUpdateShape(s, {
                      ...s,
                      params: { ...s.params, stepIndex: nextIdx, array: step.array, activeIndices: step.activeIndices, sortedIndices: step.sortedIndices, pointers: step.pointers, statusText: step.statusText },
                      label: `${s.params?.title || 'Sorting'} (Step ${nextIdx + 1}/${steps.length})`,
                    });
                  }
                }}
                title="Next Step"
                style={{ padding: '2px 8px', fontSize: '11px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}
              >
                Next ▶
              </button>
              <button
                className="cs-action-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const s = selectedObject as ShapeObject;
                  const algo: AlgorithmType = (s.params?.algorithm as AlgorithmType) || 'bubbleSort';
                  const rawArr: number[] = s.params?.array || [14, 33, 27, 10, 35, 19, 42, 44];
                  const targetVal: number = s.params?.targetVal ?? 35;
                  const steps = generateSimulationSteps(algo, rawArr, targetVal);
                  const lastIdx = steps.length - 1;
                  if (steps[lastIdx]) {
                    const step = steps[lastIdx];
                    handleUpdateShape(s, {
                      ...s,
                      params: { ...s.params, stepIndex: lastIdx, array: step.array, activeIndices: step.activeIndices, sortedIndices: step.sortedIndices, pointers: step.pointers, statusText: step.statusText },
                      label: `${s.params?.title || 'Sorting'} (Step ${lastIdx + 1}/${steps.length})`,
                    });
                  }
                }}
                title="Final Sorted Step"
                style={{ padding: '2px 6px', fontSize: '11px' }}
              >
                ⏭
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Interactive Logic Gate on-board controls (Swap gate without changing inputs or styling) */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'logicGate' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 46),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '4px 8px',
            borderRadius: '8px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Gate Type Quick Swap Buttons */}
          {!((selectedObject as ShapeObject).params?.blockType) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'] as const).map((g) => {
                const s = selectedObject as ShapeObject;
                const cur = (s.params?.gateType || 'AND').toUpperCase();
                const isActive = cur === g;
                return (
                  <button
                    key={g}
                    className="cs-action-btn-sm"
                    style={{
                      padding: '2px 7px',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#38bdf8' : '#cbd5e1',
                      border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title={`Swap to ${g} Gate`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const prev = s;
                      const newInputs = g === 'NOT' ? 1 : Math.max(2, s.params?.inputs || 2);
                      const updated: ShapeObject = {
                        ...s,
                        params: {
                          ...s.params,
                          gateType: g,
                          inputs: newInputs,
                        },
                        label: `${g} Gate`,
                      };
                      handleUpdateShape(prev, updated);
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          )}

          {/* Label Toggle Button */}
          <button
            className="cs-action-btn-sm"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              background: ((selectedObject as ShapeObject).params?.showLabels ?? true) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: ((selectedObject as ShapeObject).params?.showLabels ?? true) ? '#34d399' : '#f87171',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Toggle input/output pin labels on gate"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const curShow = s.params?.showLabels ?? true;
              handleUpdateShape(s, {
                ...s,
                params: {
                  ...s.params,
                  showLabels: !curShow,
                },
              });
            }}
          >
            Labels: {((selectedObject as ShapeObject).params?.showLabels ?? true) ? 'ON' : 'OFF'}
          </button>

          {/* Font Size Selector */}
          <select
            className="cs-modal-select"
            value={(selectedObject as ShapeObject).params?.fontSize || 14}
            style={{ padding: '2px 4px', fontSize: '11px', height: '24px', width: '60px' }}
            title="Font Size"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              handleUpdateShape(s, {
                ...s,
                params: {
                  ...s.params,
                  fontSize: Number(e.target.value),
                },
              });
            }}
          >
            {[11, 12, 14, 16, 18, 20, 24].map((sz) => (
              <option key={sz} value={sz}>{sz}px</option>
            ))}
          </select>

          {/* Digital Circuit Blocks Quick Toolbar (MUX, Adders, Flip-Flops, Counter) */}
          {(selectedObject as ShapeObject).params?.blockType && (() => {
            const s = selectedObject as ShapeObject;
            const bt = s.params?.blockType as string;

            // 1. MUX Block (N:1 MUX)
            if (bt === 'MUX' || bt.startsWith('MUX')) {
              const curSize = Number(s.params?.muxSize) || 4;
              const inputs = (Array.isArray(s.params?.inputValues) ? s.params.inputValues : [0, 1, 0, 1]) as number[];
              const curSel = Math.min(curSize - 1, Number(s.params?.selectedChannel) || 0);
              const outputVal = evaluateMux(curSize, inputs, curSel).outputValue;

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {/* Size Switchers */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[2, 4, 8, 16].map((sz) => (
                      <button
                        key={sz}
                        className="cs-action-btn-sm"
                        style={{
                          padding: '2px 5px',
                          fontSize: '11px',
                          fontWeight: curSize === sz ? 700 : 500,
                          background: curSize === sz ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                          color: curSize === sz ? '#38bdf8' : '#cbd5e1',
                          border: curSize === sz ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        title={`Set to ${sz}:1 MUX`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newInputs = Array.from({ length: sz }, (_, i) => inputs[i] ?? (i % 2 === 1 ? 1 : 0));
                          const newSel = Math.min(sz - 1, curSel);
                          handleUpdateShape(s, {
                            ...s,
                            params: {
                              ...s.params,
                              muxSize: sz,
                              inputValues: newInputs,
                              selectedChannel: newSel,
                            },
                            label: `${sz}:1 Multiplexer`,
                          });
                        }}
                      >
                        {sz}:1
                      </button>
                    ))}
                  </div>

                  {/* Channel Stepper: [ ◀ S=1 ▶ ] */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '4px' }}>
                    <button
                      className="cs-action-btn-sm"
                      style={{ padding: '1px 5px', fontSize: '11px', cursor: 'pointer' }}
                      title="Previous select channel"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextSel = (curSel - 1 + curSize) % curSize;
                        handleUpdateShape(s, {
                          ...s,
                          params: { ...s.params, selectedChannel: nextSel },
                        });
                      }}
                    >
                      ◀
                    </button>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#10b981', fontWeight: 700, padding: '0 2px' }}>
                      S={curSel} (D{curSel}={inputs[curSel] ?? 0})
                    </span>
                    <button
                      className="cs-action-btn-sm"
                      style={{ padding: '1px 5px', fontSize: '11px', cursor: 'pointer' }}
                      title="Next select channel"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextSel = (curSel + 1) % curSize;
                        handleUpdateShape(s, {
                          ...s,
                          params: { ...s.params, selectedChannel: nextSel },
                        });
                      }}
                    >
                      ▶
                    </button>
                  </div>

                  {/* Toggle Current Channel Input Bit */}
                  <button
                    className="cs-action-btn-sm"
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      background: (inputs[curSel] ?? 0) === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                      color: (inputs[curSel] ?? 0) === 1 ? '#34d399' : '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title={`Toggle bit value for D${curSel}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newInputs = [...inputs];
                      while (newInputs.length < curSize) newInputs.push(0);
                      newInputs[curSel] = (newInputs[curSel] === 1 ? 0 : 1);
                      handleUpdateShape(s, {
                        ...s,
                        params: { ...s.params, inputValues: newInputs },
                      });
                    }}
                  >
                    D{curSel}: {inputs[curSel] ?? 0} ⇄ {(inputs[curSel] ?? 0) === 1 ? 0 : 1}
                  </button>

                  {/* Live Out Badge */}
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700, padding: '1px 5px', background: 'rgba(56,189,248,0.15)', borderRadius: '4px' }}>
                    Y = {outputVal}
                  </span>
                </div>
              );
            }

            // 2. Arithmetic Adders (Half Adder / Full Adder)
            if (bt === 'HalfAdder' || bt === 'FullAdder') {
              const isFull = bt === 'FullAdder';
              const inA = (s.params?.inputA ?? 1) & 1;
              const inB = (s.params?.inputB ?? 1) & 1;
              const inCin = (s.params?.inputCin ?? 0) & 1;
              const evalRes = evaluateAdder(isFull, inA, inB, inCin);

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {/* Mode Toggle: HA vs FA */}
                  <button
                    className="cs-action-btn-sm"
                    style={{
                      padding: '2px 7px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      border: '1px solid #38bdf8',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title="Switch between Half Adder and Full Adder"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextType = isFull ? 'HalfAdder' : 'FullAdder';
                      handleUpdateShape(s, {
                        ...s,
                        params: { ...s.params, blockType: nextType },
                        label: nextType === 'FullAdder' ? 'Full Adder (FA)' : 'Half Adder (HA)',
                      });
                    }}
                  >
                    {isFull ? 'Full Adder (FA)' : 'Half Adder (HA)'}
                  </button>

                  {/* Input A bit toggle */}
                  <button
                    className="cs-action-btn-sm"
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      background: inA === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                      color: inA === 1 ? '#34d399' : '#f87171',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title="Toggle input A (0 / 1)"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateShape(s, {
                        ...s,
                        params: { ...s.params, inputA: 1 - inA },
                      });
                    }}
                  >
                    A={inA}
                  </button>

                  {/* Input B bit toggle */}
                  <button
                    className="cs-action-btn-sm"
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      background: inB === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                      color: inB === 1 ? '#34d399' : '#f87171',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title="Toggle input B (0 / 1)"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateShape(s, {
                        ...s,
                        params: { ...s.params, inputB: 1 - inB },
                      });
                    }}
                  >
                    B={inB}
                  </button>

                  {/* Input Cin bit toggle (for FA) */}
                  {isFull && (
                    <button
                      className="cs-action-btn-sm"
                      style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        background: inCin === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                        color: inCin === 1 ? '#34d399' : '#f87171',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      title="Toggle Carry-In (0 / 1)"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateShape(s, {
                          ...s,
                          params: { ...s.params, inputCin: 1 - inCin },
                        });
                      }}
                    >
                      Cin={inCin}
                    </button>
                  )}

                  {/* Live Results Badge */}
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#10b981', fontWeight: 700, padding: '1px 6px', background: 'rgba(16,185,129,0.15)', borderRadius: '4px' }}>
                    Σ={evalRes.sum} {isFull ? `Cout=${evalRes.cout}` : `Carry=${evalRes.cout}`}
                  </span>
                </div>
              );
            }

            // 3. Clocked Flip-Flop
            if (bt === 'FlipFlop') {
              const ffType = (s.params?.ffType || 'D') as 'D' | 'JK' | 'T' | 'SR';
              const curQ = (s.params?.stateQ ?? 0) & 1;
              const inD = (s.params?.inputD ?? 1) & 1;
              const inJ = (s.params?.inputJ ?? 1) & 1;
              const inK = (s.params?.inputK ?? 0) & 1;
              const inT = (s.params?.inputT ?? 1) & 1;
              const inS = (s.params?.inputS ?? 1) & 1;
              const inR = (s.params?.inputR ?? 0) & 1;

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {/* Flip-Flop Type Selector */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {(['D', 'JK', 'T', 'SR'] as const).map((t) => (
                      <button
                        key={t}
                        className="cs-action-btn-sm"
                        style={{
                          padding: '2px 5px',
                          fontSize: '11px',
                          fontWeight: ffType === t ? 700 : 500,
                          background: ffType === t ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                          color: ffType === t ? '#38bdf8' : '#cbd5e1',
                          border: ffType === t ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        title={`Switch to ${t} Flip-Flop`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(s, {
                            ...s,
                            params: { ...s.params, ffType: t },
                            label: `${t} Flip-Flop`,
                          });
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Input toggles according to ffType */}
                  {ffType === 'D' && (
                    <button
                      className="cs-action-btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                      title="Toggle D input"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateShape(s, { ...s, params: { ...s.params, inputD: 1 - inD } });
                      }}
                    >
                      D={inD}
                    </button>
                  )}
                  {ffType === 'JK' && (
                    <>
                      <button
                        className="cs-action-btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                        title="Toggle J input"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(s, { ...s, params: { ...s.params, inputJ: 1 - inJ } });
                        }}
                      >
                        J={inJ}
                      </button>
                      <button
                        className="cs-action-btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                        title="Toggle K input"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(s, { ...s, params: { ...s.params, inputK: 1 - inK } });
                        }}
                      >
                        K={inK}
                      </button>
                    </>
                  )}
                  {ffType === 'T' && (
                    <button
                      className="cs-action-btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                      title="Toggle T input"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateShape(s, { ...s, params: { ...s.params, inputT: 1 - inT } });
                      }}
                    >
                      T={inT}
                    </button>
                  )}
                  {ffType === 'SR' && (
                    <>
                      <button
                        className="cs-action-btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                        title="Toggle S input"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(s, { ...s, params: { ...s.params, inputS: 1 - inS } });
                        }}
                      >
                        S={inS}
                      </button>
                      <button
                        className="cs-action-btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                        title="Toggle R input"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateShape(s, { ...s, params: { ...s.params, inputR: 1 - inR } });
                        }}
                      >
                        R={inR}
                      </button>
                    </>
                  )}

                  {/* ⚡ CLK Pulse Button */}
                  <button
                    className="cs-action-btn-sm cs-action-btn-primary"
                    style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 800 }}
                    title="Trigger Clock Pulse (CLK)"
                    onClick={(e) => {
                      e.stopPropagation();
                      const res = evaluateFlipFlopNextState(ffType, curQ, {
                        d: inD,
                        j: inJ,
                        k: inK,
                        t: inT,
                        s: inS,
                        r: inR,
                      });
                      handleUpdateShape(s, {
                        ...s,
                        params: {
                          ...s.params,
                          stateQ: res.nextQ,
                          stateQbar: 1 - res.nextQ,
                          mode: res.mode,
                        },
                      });
                    }}
                  >
                    ⚡ CLK
                  </button>

                  {/* Live Q and Qbar state */}
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#10b981', fontWeight: 700, padding: '1px 6px', background: 'rgba(16,185,129,0.15)', borderRadius: '4px' }}>
                    Q={curQ} Q̄={1 - curQ}
                  </span>
                </div>
              );
            }

            // 4. 4-Bit Binary Counter
            if (bt === 'Counter4' || bt === 'BinaryCounter') {
              const curCount = Number(s.params?.countValue) || 0;

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {/* Count Up (+1) */}
                  <button
                    className="cs-action-btn-sm cs-action-btn-primary"
                    style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 800 }}
                    title="Clock Pulse: Increment Counter (+1)"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextVal = evaluateCounter(curCount, 'inc', 15);
                      handleUpdateShape(s, {
                        ...s,
                        params: { ...s.params, countValue: nextVal },
                      });
                    }}
                  >
                    ⚡ CLK (+1)
                  </button>

                  {/* Count Down (-1) */}
                  <button
                    className="cs-action-btn-sm"
                    style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                    title="Decrement Counter (-1)"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextVal = evaluateCounter(curCount, 'dec', 15);
                      handleUpdateShape(s, {
                        ...s,
                        params: { ...s.params, countValue: nextVal },
                      });
                    }}
                  >
                    ◀ -1
                  </button>

                  {/* Reset (0) */}
                  <button
                    className="cs-action-btn-sm"
                    style={{ padding: '2px 6px', fontSize: '11px', color: '#f87171', cursor: 'pointer' }}
                    title="Reset Counter to 0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateShape(s, {
                        ...s,
                        params: { ...s.params, countValue: 0 },
                      });
                    }}
                  >
                    ↺ RST
                  </button>

                  {/* Live Count & Binary Display */}
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700, padding: '1px 6px', background: 'rgba(56,189,248,0.15)', borderRadius: '4px' }}>
                    {curCount}/15 [ {((curCount >> 3) & 1)} {((curCount >> 2) & 1)} {((curCount >> 1) & 1)} {(curCount & 1)} ]
                  </span>
                </div>
              );
            }

            return null;
          })()}

          {/* Full Designer Dialog Button */}
          <button
            className="quick-edit-btn"
            style={{ padding: '2px 8px', fontSize: '11px' }}
            title={
              (selectedObject as ShapeObject).params?.blockType
                ? 'Open Digital Circuit Designer (or double-click)'
                : 'Open Logic Gate & Circuit Designer (or double-click)'
            }
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              if (s.params?.blockType) {
                setEditingDigitalCircuitShape(s);
              } else {
                setEditingLogicGateShape(s);
              }
            }}
          >
            ⚡ Configure
          </button>
        </div>
      )}

      {/* Quick "📋 Configure Truth Table" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'truthTable' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '4px 8px',
            borderRadius: '8px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure N-Bits & Outputs (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTruthTableShape(selectedObject as ShapeObject);
            }}
          >
            <span>📋</span>
            <span>{(selectedObject as ShapeObject).label || 'Configure Truth Table'}</span>
          </button>

          <select
            className="cs-modal-select"
            value={(selectedObject as ShapeObject).params?.fontSize || 13}
            style={{ padding: '2px 4px', fontSize: '11px', height: '24px', width: '60px' }}
            title="Font Size"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              handleUpdateShape(s, {
                ...s,
                params: {
                  ...s.params,
                  fontSize: Number(e.target.value),
                },
              });
            }}
          >
            {[11, 12, 13, 14, 16, 18, 20, 24].map((sz) => (
              <option key={sz} value={sz}>{sz}px</option>
            ))}
          </select>
        </div>
      )}

      {/* Quick "🔲 Configure Karnaugh Map" floating badge */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'karnaughMap' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 44),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '4px 8px',
            borderRadius: '8px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Configure K-Map Variables, SOP/POS & Cells (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingKarnaughMapShape(selectedObject as ShapeObject);
            }}
          >
            <span>🔲</span>
            <span>{(selectedObject as ShapeObject).label || 'Configure Karnaugh Map'}</span>
          </button>

          <select
            className="cs-modal-select"
            value={(selectedObject as ShapeObject).params?.fontSize || 14}
            style={{ padding: '2px 4px', fontSize: '11px', height: '24px', width: '60px' }}
            title="Font Size"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              handleUpdateShape(s, {
                ...s,
                params: {
                  ...s.params,
                  fontSize: Number(e.target.value),
                },
              });
            }}
          >
            {[11, 12, 14, 16, 18, 20, 24].map((sz) => (
              <option key={sz} value={sz}>{sz}px</option>
            ))}
          </select>
        </div>
      )}

      {/* 🏛️ Quick Hierarchy Chart floating toolbar */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'hierarchyChart' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 46),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '4px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Edit Hierarchy Chart in Designer (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingHierarchyShape(selectedObject as ShapeObject);
            }}
          >
            <span>🏛️</span>
            <span>{(selectedObject as ShapeObject).label || 'Hierarchy Chart'}</span>
          </button>

          {/* Quick Theme Switcher */}
          <button
            className="cs-action-btn-sm"
            title="Cycle Color Theme (Ocean, Emerald, Sunset, Purple, Monochrome)"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const themes: HierarchyTheme[] = ['ocean', 'emerald', 'sunset', 'purple', 'monochrome'];
              const curTheme: HierarchyTheme = s.params?.theme || 'ocean';
              const nextTheme = themes[(themes.indexOf(curTheme) + 1) % themes.length];
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, theme: nextTheme },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '4px', cursor: 'pointer' }}
          >
            🎨 Theme: {(selectedObject as ShapeObject).params?.theme || 'ocean'}
          </button>

          {/* Quick Style Switcher */}
          <button
            className="cs-action-btn-sm"
            title="Cycle Box Style (Rounded, Sharp, Pill, Flat)"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const styles: HierarchyStyle[] = ['rounded', 'sharp', 'pill', 'flat'];
              const curStyle: HierarchyStyle = s.params?.style || 'rounded';
              const nextStyle = styles[(styles.indexOf(curStyle) + 1) % styles.length];
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, style: nextStyle },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '4px', cursor: 'pointer' }}
          >
            📐 {(selectedObject as ShapeObject).params?.style || 'rounded'}
          </button>

          {/* Quick Font Size Adjuster */}
          <button
            className="cs-action-btn-sm"
            title="Decrease Font Size"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const curFont = s.params?.fontSize || 14;
              const nextFont = Math.max(10, curFont - 1);
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, fontSize: nextFont },
              });
            }}
            style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
          >
            A-
          </button>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {((selectedObject as ShapeObject).params?.fontSize || 14)}px
          </span>
          <button
            className="cs-action-btn-sm"
            title="Increase Font Size"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const curFont = s.params?.fontSize || 14;
              const nextFont = Math.min(24, curFont + 1);
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, fontSize: nextFont },
              });
            }}
            style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
          >
            A+
          </button>

          {/* Quick Add Child Node on-board */}
          <button
            className="cs-action-btn-sm"
            title="Add New Child Node to Hierarchy"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const tree = JSON.parse(JSON.stringify(s.params?.tree || DEFAULT_HIERARCHY_TREE));
              const newChild: HierarchyNode = {
                id: `node-${Date.now()}`,
                label: 'New Child Node',
                role: 'Sub-unit',
              };
              if (!tree.children) tree.children = [];
              tree.children.push(newChild);
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, tree },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            ➕ Add Node
          </button>
        </div>
      )}

      {/* 🧠 Quick Interactive Mindmap floating toolbar */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'mindmap' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 46),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '4px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(129, 140, 248, 0.4)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Open Mindmap Tree Editor (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingMindmapShape(selectedObject as ShapeObject);
            }}
          >
            <span>🧠</span>
            <span>{(selectedObject as ShapeObject).label || 'Mindmap'}</span>
          </button>

          {/* Toggle Expand / Collapse of active branch */}
          <button
            className="cs-action-btn-sm"
            title="Expand / Collapse Branches"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const root = JSON.parse(JSON.stringify(s.params?.root || DEFAULT_MINDMAP));
              const selId = s.params?.selectedNodeId || root.id;
              if (selId === root.id) {
                const anyCollapsed = root.children?.some((c: any) => c.collapsed);
                root.children?.forEach((c: any) => {
                  c.collapsed = !anyCollapsed;
                });
              } else {
                const toggleInTree = (n: any): boolean => {
                  if (n.id === selId) {
                    n.collapsed = !n.collapsed;
                    return true;
                  }
                  if (n.children) {
                    for (const c of n.children) {
                      if (toggleInTree(c)) return true;
                    }
                  }
                  return false;
                };
                toggleInTree(root);
              }
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, root },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#c084fc', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
          >
            👁️ Toggle Branch
          </button>

          {/* Quick Add Idea on-board */}
          <button
            className="cs-action-btn-sm"
            title="Add Idea to Mindmap on board"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const root = JSON.parse(JSON.stringify(s.params?.root || DEFAULT_MINDMAP));
              const selId = s.params?.selectedNodeId || root.id;
              const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
              const rndColor = colors[Math.floor(Math.random() * colors.length)];
              const newIdea: MindmapNode = {
                id: `idea-${Date.now()}`,
                text: `New Idea ${(root.children?.length || 0) + 1}`,
                color: rndColor,
                icon: '💡',
              };
              if (selId === root.id) {
                if (!root.children) root.children = [];
                root.children.push(newIdea);
              } else {
                const addInTree = (n: any): boolean => {
                  if (n.id === selId) {
                    if (!n.children) n.children = [];
                    n.children.push(newIdea);
                    n.collapsed = false;
                    return true;
                  }
                  if (n.children) {
                    for (const c of n.children) {
                      if (addInTree(c)) return true;
                    }
                  }
                  return false;
                };
                if (!addInTree(root)) {
                  if (!root.children) root.children = [];
                  root.children.push(newIdea);
                }
              }
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, root, selectedNodeId: newIdea.id },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#818cf8', background: 'rgba(129, 140, 248, 0.2)', border: '1px solid rgba(129, 140, 248, 0.4)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            ➕ Add Idea
          </button>

          {/* Cycle Branch Highlights */}
          <button
            className="cs-action-btn-sm"
            title="Select & Highlight Next Node"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const root = s.params?.root || DEFAULT_MINDMAP;
              const allIds: string[] = [root.id];
              const collectIds = (n: any) => {
                if (n.children) {
                  for (const c of n.children) {
                    allIds.push(c.id);
                    collectIds(c);
                  }
                }
              };
              collectIds(root);
              const curId = s.params?.selectedNodeId || root.id;
              const nextId = allIds[(allIds.indexOf(curId) + 1) % allIds.length];
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, selectedNodeId: nextId },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
          >
            ⚡ Next Node ▶
          </button>
        </div>
      )}

      {/* ⏳ Quick Animated Timeline floating toolbar */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'timeline' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 46),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '4px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(2, 132, 199, 0.5)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Edit Events, Images & Dates in Timeline Designer (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTimelineShape(selectedObject as ShapeObject);
            }}
          >
            <span>⏳</span>
            <span>{(selectedObject as ShapeObject).label || 'Timeline'}</span>
          </button>

          {/* Stepper Navigation: Left / Right Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              className="cs-action-btn-sm"
              title="Previous Event (Animated Transition)"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                const events: any[] = s.params?.events || [];
                const cur = s.params?.activeEventIndex || 0;
                const prevIdx = (cur - 1 + events.length) % events.length;
                handleUpdateShape(s, {
                  ...s,
                  params: { ...s.params, activeEventIndex: prevIdx },
                });
              }}
              style={{ padding: '3px 8px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
            >
              ◀ Prev
            </button>
            <span style={{ fontSize: '11px', color: '#e2e8f0', minWidth: '45px', textAlign: 'center' }}>
              {((selectedObject as ShapeObject).params?.activeEventIndex || 0) + 1} / {((selectedObject as ShapeObject).params?.events?.length || 1)}
            </span>
            <button
              className="cs-action-btn-sm"
              title="Next Event (Animated Transition)"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                const events: any[] = s.params?.events || [];
                const cur = s.params?.activeEventIndex || 0;
                const nextIdx = (cur + 1) % events.length;
                handleUpdateShape(s, {
                  ...s,
                  params: { ...s.params, activeEventIndex: nextIdx },
                });
              }}
              style={{ padding: '3px 8px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Next ▶
            </button>
          </div>

          {/* Layout Orientation Switcher */}
          <button
            className="cs-action-btn-sm"
            title="Switch Between Horizontal & Vertical Layouts"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const curOri = s.params?.orientation || 'horizontal';
              const nextOri = curOri === 'horizontal' ? 'vertical' : 'horizontal';
              handleUpdateShape(s, {
                ...s,
                width: nextOri === 'horizontal' ? 760 : 480,
                height: nextOri === 'horizontal' ? 360 : 540,
                params: { ...s.params, orientation: nextOri },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
          >
            {((selectedObject as ShapeObject).params?.orientation || 'horizontal') === 'horizontal' ? '↔ Horizontal' : '↕ Vertical'}
          </button>

          {/* Quick Add Event on-board */}
          <button
            className="cs-action-btn-sm"
            title="Add New Milestone Event"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const events: TimelineEvent[] = JSON.parse(JSON.stringify(s.params?.events || DEFAULT_TIMELINE_EVENTS));
              const newEvt: TimelineEvent = {
                id: `evt-${Date.now()}`,
                dateOrEra: `${2024 + events.length}`,
                title: `New Event ${events.length + 1}`,
                description: 'Description of key milestone or historical discovery.',
                color: '#38bdf8',
              };
              events.push(newEvt);
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, events, activeEventIndex: events.length - 1 },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            ➕ Add Event
          </button>
        </div>
      )}

      {/* 🔄 Quick Process Flow Chart floating toolbar */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && (selectedObject as ShapeObject).shapeType === 'processChart' && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 46),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '4px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="quick-edit-btn"
            title="Edit Steps, Styles & Details in Process Chart Designer (or double-click)"
            onClick={(e) => {
              e.stopPropagation();
              setEditingProcessShape(selectedObject as ShapeObject);
            }}
          >
            <span>🔄</span>
            <span>{(selectedObject as ShapeObject).label || 'Process Chart'}</span>
          </button>

          {/* Stepper Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              className="cs-action-btn-sm"
              title="Previous Step"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                const steps: any[] = s.params?.steps || [];
                const cur = s.params?.activeStepIndex || 0;
                const prevIdx = (cur - 1 + steps.length) % steps.length;
                handleUpdateShape(s, {
                  ...s,
                  params: { ...s.params, activeStepIndex: prevIdx },
                });
              }}
              style={{ padding: '3px 8px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
            >
              ◀ Prev
            </button>
            <span style={{ fontSize: '11px', color: '#e2e8f0', minWidth: '45px', textAlign: 'center' }}>
              {((selectedObject as ShapeObject).params?.activeStepIndex || 0) + 1} / {((selectedObject as ShapeObject).params?.steps?.length || 1)}
            </span>
            <button
              className="cs-action-btn-sm"
              title="Next Step"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                const steps: any[] = s.params?.steps || [];
                const cur = s.params?.activeStepIndex || 0;
                const nextIdx = (cur + 1) % steps.length;
                handleUpdateShape(s, {
                  ...s,
                  params: { ...s.params, activeStepIndex: nextIdx },
                });
              }}
              style={{ padding: '3px 8px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Next ▶
            </button>
          </div>

          {/* Quick Style Switcher */}
          <button
            className="cs-action-btn-sm"
            title="Cycle Process Chart Style (Chevron, Numbered Cards, Circular Cycle, Staged Pipeline)"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const styles: ProcessChartStyle[] = ['chevron', 'cards', 'cycle', 'pipeline'];
              const curStyle: ProcessChartStyle = s.params?.style || 'chevron';
              const nextStyle = styles[(styles.indexOf(curStyle) + 1) % styles.length];
              handleUpdateShape(s, {
                ...s,
                height: nextStyle === 'cycle' ? 440 : 260,
                params: { ...s.params, style: nextStyle },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
          >
            🎨 Style: {(selectedObject as ShapeObject).params?.style || 'chevron'}
          </button>

          {/* Quick Add Step on-board */}
          <button
            className="cs-action-btn-sm"
            title="Add Next Step to Process"
            onClick={(e) => {
              e.stopPropagation();
              const s = selectedObject as ShapeObject;
              const steps: ProcessStep[] = JSON.parse(JSON.stringify(s.params?.steps || DEFAULT_PROCESS_STEPS));
              const colors = ['#38bdf8', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
              const nextNum = steps.length + 1;
              const newStep: ProcessStep = {
                id: `step-${Date.now()}`,
                stepNumber: nextNum,
                title: `Step ${nextNum}: Action`,
                description: 'Procedure details and execution rules.',
                color: colors[(nextNum - 1) % colors.length],
              };
              steps.push(newStep);
              handleUpdateShape(s, {
                ...s,
                params: { ...s.params, steps, activeStepIndex: steps.length - 1 },
              });
            }}
            style={{ padding: '3px 8px', fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            ➕ Add Step
          </button>
        </div>
      )}

      {/* 📽️ Presentation Mode Exit HUD Overlay (when any Geography resource is in presentation mode) */}
      {(() => {
        const presObj = currentPage?.objects.find(
          (o) =>
            o.type === 'shape' &&
            isGeoShapeType((o as ShapeObject).shapeType) &&
            (o as ShapeObject).params?.interactionMode === 'presentation'
        ) as ShapeObject | undefined;
        if (!presObj) return null;
        return (
          <div
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              zIndex: 150,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.95)',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '2px solid #a855f7',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>
              📽️ Presentation Mode: {presObj.label || 'Geography Map'}
            </span>
            <button
              onClick={() => {
                const saved = presObj.params?.savedBoundsBeforePresentation;
                handleUpdateShape(presObj, {
                  x: saved?.x ?? 180,
                  y: saved?.y ?? 140,
                  width: saved?.width ?? 740,
                  height: saved?.height ?? 480,
                  params: {
                    ...presObj.params,
                    interactionMode: 'select',
                    savedBoundsBeforePresentation: undefined,
                  },
                });
                setToastMessage?.('Exited Presentation Mode');
              }}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Exit Presentation Mode
            </button>
          </div>
        );
      })()}

      {/* 🗺️ Interactive Geography Whiteboard Object Floating Control Toolbar */}
      {toolState.activeTool === 'select' && selectedObject && selectedObject.type === 'shape' && isGeoShapeType((selectedObject as ShapeObject).shapeType) && selectedScreenBBox && (
        <div
          className="selected-text-quick-edit-pill geo-floating-toolbar"
          style={{
            position: 'absolute',
            left: Math.max(12, selectedScreenBBox.left),
            top: Math.max(12, selectedScreenBBox.top - 50),
            zIndex: 122,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.96)',
            padding: '5px 10px',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* If map is locked, show locked badge */}
          {isSelectedObjectLocked && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: '2px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Map is locked on canvas"
            >
              🔒 Map Locked
            </span>
          )}

          {/* If map is NOT locked, allow opening Centre, Atlas, and 3D Globe */}
          {!isSelectedObjectLocked && (
            <>
              <button
                className="quick-edit-btn"
                title="Open Geography Resource Centre (or double-click map)"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGeoResourceModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <span>🗺️</span>
                <span>{(selectedObject as ShapeObject).label || 'Geography Map'}</span>
              </button>

              <button
                className="cs-action-btn-sm"
                title="Open Survey of India Maps & World Atlas Explorer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGeoAtlasModal(true);
                }}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.16)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🇮🇳🌍 Atlas</span>
              </button>

              <button
                className="cs-action-btn-sm"
                title="Open Interactive 3D Earth & Globe Laboratory"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGlobeModal(true);
                }}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.16)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🌐 3D Globe</span>
              </button>
            </>
          )}

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Four Interaction Modes: Select, Interact, Annotate, Present */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
            {/* Mode 1: Select & Move */}
            <button
              title="Selection Mode: Move, Resize, Rotate & Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                handleUpdateShape(s, {
                  ...s,
                  params: { ...s.params, interactionMode: 'select' },
                });
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: (selectedObject as ShapeObject).params?.interactionMode === 'select' || !(selectedObject as ShapeObject).params?.interactionMode ? 700 : 400,
                color: (selectedObject as ShapeObject).params?.interactionMode === 'select' || !(selectedObject as ShapeObject).params?.interactionMode ? '#ffffff' : '#94a3b8',
                background: (selectedObject as ShapeObject).params?.interactionMode === 'select' || !(selectedObject as ShapeObject).params?.interactionMode ? '#0284c7' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              👆 Select
            </button>

            {/* Mode 2: Interactive Pan / Zoom / Click */}
            <button
              title="Interaction Mode: Pan map camera, scroll zoom, and click features"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                handleUpdateShape(s, {
                  ...s,
                  params: { ...s.params, interactionMode: 'interact' },
                });
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: (selectedObject as ShapeObject).params?.interactionMode === 'interact' ? 700 : 400,
                color: (selectedObject as ShapeObject).params?.interactionMode === 'interact' ? '#ffffff' : '#94a3b8',
                background: (selectedObject as ShapeObject).params?.interactionMode === 'interact' ? '#0284c7' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🧭 Interact
            </button>

            {/* Mode 3: Annotate */}
            <button
              title="Annotation Mode: Draw notes and highlights directly above the map"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                handleUpdateShape(s, {
                  ...s,
                  params: { ...s.params, interactionMode: 'annotate' },
                });
                setActiveTool('pen');
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: (selectedObject as ShapeObject).params?.interactionMode === 'annotate' ? 700 : 400,
                color: (selectedObject as ShapeObject).params?.interactionMode === 'annotate' ? '#ffffff' : '#94a3b8',
                background: (selectedObject as ShapeObject).params?.interactionMode === 'annotate' ? '#d97706' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ✍️ Annotate
            </button>

            {/* Mode 4: Presentation */}
            <button
              title="Presentation Mode: Expand map across classroom display for immersive lecture"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                const canvasW = containerRef.current?.clientWidth || 1920;
                const canvasH = containerRef.current?.clientHeight || 1080;
                handleUpdateShape(s, {
                  ...s,
                  x: 30,
                  y: 30,
                  width: Math.max(800, canvasW - 60),
                  height: Math.max(500, canvasH - 60),
                  params: {
                    ...s.params,
                    interactionMode: 'presentation',
                    savedBoundsBeforePresentation: {
                      x: s.x,
                      y: s.y,
                      width: s.width,
                      height: s.height,
                    },
                  },
                });
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: (selectedObject as ShapeObject).params?.interactionMode === 'presentation' ? 700 : 400,
                color: (selectedObject as ShapeObject).params?.interactionMode === 'presentation' ? '#ffffff' : '#94a3b8',
                background: (selectedObject as ShapeObject).params?.interactionMode === 'presentation' ? '#7c3aed' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              📽️ Present
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Camera Controls: Zoom In & Zoom Out (switches to interactive mode per Requirement 3) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              className="cs-action-btn-sm"
              title="Zoom In (switches to Interactive mode to pan and explore with stylus)"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                const cur = s.params?.zoomLevel || 1.0;
                handleUpdateShape(s, {
                  ...s,
                  params: {
                    ...s.params,
                    zoomLevel: Math.min(6.0, cur * 1.25),
                    interactionMode: 'interact',
                  },
                });
                setActiveTool('select');
              }}
              style={{ padding: '3px 7px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '4px', cursor: 'pointer' }}
            >
              🔍 +
            </button>
            <button
              className="cs-action-btn-sm"
              title="Zoom Out (switches to Interactive mode to pan and explore with stylus)"
              onClick={(e) => {
                e.stopPropagation();
                const s = selectedObject as ShapeObject;
                const cur = s.params?.zoomLevel || 1.0;
                handleUpdateShape(s, {
                  ...s,
                  params: {
                    ...s.params,
                    zoomLevel: Math.max(0.5, cur * 0.8),
                    interactionMode: 'interact',
                  },
                });
                setActiveTool('select');
              }}
              style={{ padding: '3px 7px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '4px', cursor: 'pointer' }}
            >
              🔍 -
            </button>
            {!isSelectedObjectLocked && (
              <button
                className="cs-action-btn-sm"
                title="Reset Viewport Pan and Zoom"
                onClick={(e) => {
                  e.stopPropagation();
                  const s = selectedObject as ShapeObject;
                  handleUpdateShape(s, {
                    ...s,
                    params: { ...s.params, zoomLevel: 1.0, panOffset: { x: 0, y: 0 } },
                  });
                }}
                style={{ padding: '3px 7px', fontSize: '11px', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✍️ Persistent Floating Map Annotate & Interaction Mode Bar (Requirements 1, 2, 4, 5, 8) */}
      {activeAnnotatingMap && (
        <div
          className="map-annotation-mode-bar"
          style={{
            position: 'absolute',
            left: Math.max(12, Math.min((containerRef.current?.clientWidth || window.innerWidth) - 620, (activeAnnotatingMap.x + toolState.panX) * toolState.zoom)),
            top: Math.max(12, Math.min((containerRef.current?.clientHeight || window.innerHeight) - 70, (activeAnnotatingMap.y + toolState.panY) * toolState.zoom - 52)),
            zIndex: 126,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Map Title / Badge */}
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🗺️</span>
            <span>{activeAnnotatingMap.label || 'Map'}: Annotating</span>
          </span>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Mode Switchers: Select, Interact, Annotate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              title="Switch to Select Mode (Move / Resize)"
              onClick={() => {
                handleUpdateShape(activeAnnotatingMap, {
                  ...activeAnnotatingMap,
                  params: { ...activeAnnotatingMap.params, interactionMode: 'select' },
                });
                setActiveTool('select');
                setSelectedObject(activeAnnotatingMap);
              }}
              style={{
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#cbd5e1',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              👆 Select
            </button>

            <button
              title="Switch to Interact Mode (Pan map camera & zoom)"
              onClick={() => {
                handleUpdateShape(activeAnnotatingMap, {
                  ...activeAnnotatingMap,
                  params: { ...activeAnnotatingMap.params, interactionMode: 'interact' },
                });
                setActiveTool('select');
                setSelectedObject(activeAnnotatingMap);
              }}
              style={{
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              🧭 Interact
            </button>

            <button
              title="Annotate Mode (Drawing over map)"
              onClick={() => {
                setActiveTool('pen');
              }}
              style={{
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                background: '#d97706',
                border: '1px solid #f59e0b',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              ✍️ Annotate
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Tools: Pen, Highlighter, Eraser */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              title="Whiteboard Fine Pen"
              onClick={() => {
                setPenStyle({ penType: 'normal' });
                setActiveTool('pen');
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: toolState.activeTool === 'pen' && toolState.penStyle?.penType !== 'highlighter' ? 700 : 500,
                color: toolState.activeTool === 'pen' && toolState.penStyle?.penType !== 'highlighter' ? '#ffffff' : '#94a3b8',
                background: toolState.activeTool === 'pen' && toolState.penStyle?.penType !== 'highlighter' ? '#0284c7' : 'transparent',
                border: '1px solid ' + (toolState.activeTool === 'pen' && toolState.penStyle?.penType !== 'highlighter' ? '#38bdf8' : 'rgba(255,255,255,0.1)'),
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🖊️ Pen
            </button>

            <button
              title="Translucent Map Highlighter"
              onClick={() => {
                setPenStyle({ penType: 'highlighter' });
                setActiveTool('highlighter');
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: toolState.activeTool === 'highlighter' || toolState.penStyle?.penType === 'highlighter' ? 700 : 500,
                color: toolState.activeTool === 'highlighter' || toolState.penStyle?.penType === 'highlighter' ? '#ffffff' : '#94a3b8',
                background: toolState.activeTool === 'highlighter' || toolState.penStyle?.penType === 'highlighter' ? '#0284c7' : 'transparent',
                border: '1px solid ' + (toolState.activeTool === 'highlighter' || toolState.penStyle?.penType === 'highlighter' ? '#38bdf8' : 'rgba(255,255,255,0.1)'),
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🖍️ Highlighter
            </button>

            <button
              title="Eraser: Erase annotations on map"
              onClick={() => {
                setActiveTool('eraser');
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: toolState.activeTool === 'eraser' ? 700 : 500,
                color: toolState.activeTool === 'eraser' ? '#ffffff' : '#cbd5e1',
                background: toolState.activeTool === 'eraser' ? '#dc2626' : 'transparent',
                border: '1px solid ' + (toolState.activeTool === 'eraser' ? '#f87171' : 'rgba(255,255,255,0.1)'),
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🧹 Eraser
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Relative Pen Thickness Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginRight: '2px' }}>Size:</span>
            {[2, 4, 8, 14].map((sz) => (
              <button
                key={sz}
                title={`${sz}px Thickness (scales relatively with zoom in/out)`}
                onClick={() => {
                  setPenStyle({ width: sz });
                  if (toolState.activeTool !== 'pen' && toolState.activeTool !== 'highlighter') {
                    setActiveTool('pen');
                  }
                }}
                style={{
                  padding: '2px 5px',
                  fontSize: '10px',
                  fontWeight: toolState.penStyle?.width === sz ? 700 : 500,
                  color: toolState.penStyle?.width === sz ? '#ffffff' : '#cbd5e1',
                  background: toolState.penStyle?.width === sz ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid ' + (toolState.penStyle?.width === sz ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'),
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {sz}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Quick Color Swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {['#ffffff', '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a855f7'].map((col) => (
              <button
                key={col}
                title={`Pen Color: ${col}`}
                onClick={() => {
                  setPenStyle({ color: col });
                  if (toolState.activeTool !== 'pen' && toolState.activeTool !== 'highlighter') {
                    setActiveTool('pen');
                  }
                }}
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: col,
                  border: toolState.penStyle?.color === col ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.5)',
                  boxShadow: toolState.penStyle?.color === col ? '0 0 5px #ffffff' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Zoom In & Zoom Out (Switches to Interactive Mode per Requirement 3) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              title="Zoom In (switches to Interactive mode to pan with stylus)"
              onClick={() => {
                const cur = activeAnnotatingMap.params?.zoomLevel || 1.0;
                handleUpdateShape(activeAnnotatingMap, {
                  ...activeAnnotatingMap,
                  params: {
                    ...activeAnnotatingMap.params,
                    zoomLevel: Math.min(6.0, cur * 1.25),
                    interactionMode: 'interact',
                  },
                });
                setActiveTool('select');
              }}
              style={{ padding: '2px 6px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '4px', cursor: 'pointer' }}
            >
              🔍+
            </button>
            <button
              title="Zoom Out (switches to Interactive mode to pan with stylus)"
              onClick={() => {
                const cur = activeAnnotatingMap.params?.zoomLevel || 1.0;
                handleUpdateShape(activeAnnotatingMap, {
                  ...activeAnnotatingMap,
                  params: {
                    ...activeAnnotatingMap.params,
                    zoomLevel: Math.max(0.5, cur * 0.8),
                    interactionMode: 'interact',
                  },
                });
                setActiveTool('select');
              }}
              style={{ padding: '2px 6px', fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '4px', cursor: 'pointer' }}
            >
              🔍-
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Clear Annotations */}
          <button
            title="Clear all annotations drawn on this map"
            onClick={() => {
              handleUpdateShape(activeAnnotatingMap, {
                ...activeAnnotatingMap,
                params: { ...activeAnnotatingMap.params, annotations: [] },
              });
            }}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#f87171',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🧹 Clear
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
            className={`sel-pill-btn delete-btn ${selectedObject.locked ? 'disabled' : ''}`}
            onClick={selectedObject.locked ? undefined : handleDeleteSelected}
            title={selectedObject.locked ? 'Locked element cannot be deleted' : 'Delete (Delete / Backspace)'}
            style={{ opacity: selectedObject.locked ? 0.35 : 1, cursor: selectedObject.locked ? 'not-allowed' : 'pointer' }}
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
            <div className="sel-flyout-menu layer-flyout-menu" style={getFlyoutStyle(230, 220, 80)}>
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
            <div className="sel-flyout-menu more-flyout-menu" style={getFlyoutStyle(240, 380, 180)}>
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
            <div className="sel-flyout-menu thickness-flyout-menu" style={getFlyoutStyle(210, 280, 180)}>
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
            <div className="sel-flyout-menu image-fit-flyout-menu" style={getFlyoutStyle(255, 290, 120)}>
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
            <div className="sel-flyout-menu palette-flyout-menu" style={getFlyoutStyle(200, 220, 40)}>
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

      {/* Interactive Code Editor Modal */}
      {editingCodeShape && (
        <CodeEditorModal
          existingShape={editingCodeShape}
          onClose={() => setEditingCodeShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingCodeShape, updated);
            setEditingCodeShape(null);
          }}
        />
      )}

      {/* Interactive Standardized Pseudocode Modal */}
      {editingPseudocodeShape && (
        <PseudocodeModal
          existingShape={editingPseudocodeShape}
          onClose={() => setEditingPseudocodeShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingPseudocodeShape, updated);
            setEditingPseudocodeShape(null);
          }}
        />
      )}

      {/* Interactive Flowchart Builder Modal */}
      {editingFlowchartShape && (
        <FlowchartBuilderModal
          existingShape={editingFlowchartShape}
          onClose={() => setEditingFlowchartShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingFlowchartShape, updated);
            setEditingFlowchartShape(null);
          }}
        />
      )}

      {/* Interactive Algorithm Trace Table Modal */}
      {editingTraceTableShape && (
        <TraceTableModal
          existingShape={editingTraceTableShape}
          onClose={() => setEditingTraceTableShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingTraceTableShape, updated);
            setEditingTraceTableShape(null);
          }}
        />
      )}

      {/* Interactive Call Stack Diagram Modal */}
      {editingCallStackShape && (
        <CallStackModal
          existingShape={editingCallStackShape}
          onClose={() => setEditingCallStackShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingCallStackShape, updated);
            setEditingCallStackShape(null);
          }}
        />
      )}

      {/* Interactive Memory Layout & Pointer Modal */}
      {editingMemoryShape && (
        <MemoryLayoutModal
          existingShape={editingMemoryShape}
          onClose={() => setEditingMemoryShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingMemoryShape, updated);
            setEditingMemoryShape(null);
          }}
        />
      )}

      {/* Interactive Linked List Diagram Modal */}
      {editingLinkedListShape && (
        <LinkedListModal
          existingShape={editingLinkedListShape}
          onClose={() => setEditingLinkedListShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingLinkedListShape, updated);
            setEditingLinkedListShape(null);
          }}
        />
      )}

      {/* Interactive Binary Tree & Graph Modal */}
      {editingTreeGraphShape && (
        <TreeGraphModal
          existingShape={editingTreeGraphShape}
          onClose={() => setEditingTreeGraphShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingTreeGraphShape, updated);
            setEditingTreeGraphShape(null);
          }}
        />
      )}

      {/* Interactive Sorting / Searching Demo Modal */}
      {editingSortingShape && (
        <SortingSearchingModal
          existingShape={editingSortingShape}
          onClose={() => setEditingSortingShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingSortingShape, updated);
            setEditingSortingShape(null);
          }}
        />
      )}

      {/* Interactive Database Table & Schema Modal */}
      {editingDatabaseTableShape && (
        <DatabaseTableModal
          existingShape={editingDatabaseTableShape}
          onClose={() => setEditingDatabaseTableShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingDatabaseTableShape, updated);
            setEditingDatabaseTableShape(null);
          }}
        />
      )}

      {/* Interactive CPU & Architecture Modal */}
      {editingCpuArchShape && (
        <CpuArchModal
          existingShape={editingCpuArchShape}
          onClose={() => setEditingCpuArchShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingCpuArchShape, updated);
            setEditingCpuArchShape(null);
          }}
        />
      )}

      {/* Interactive Instruction Cycle Modal */}
      {editingInstructionCycleShape && (
        <InstructionCycleModal
          existingShape={editingInstructionCycleShape}
          onClose={() => setEditingInstructionCycleShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingInstructionCycleShape, updated);
            setEditingInstructionCycleShape(null);
          }}
        />
      )}

      
      {/* Interactive Logic Gate Modal */}
      {editingLogicGateShape && (
        <LogicGateModal
          existingShape={editingLogicGateShape}
          onClose={() => setEditingLogicGateShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingLogicGateShape, updated);
            setEditingLogicGateShape(null);
          }}
        />
      )}

      {/* Interactive Digital Circuit Modal (MUX, Adders, Flip-Flops, Counter) */}
      {editingDigitalCircuitShape && (
        <DigitalCircuitModal
          existingShape={editingDigitalCircuitShape}
          onClose={() => setEditingDigitalCircuitShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingDigitalCircuitShape, updated);
            setEditingDigitalCircuitShape(null);
          }}
        />
      )}

      {/* Interactive Truth Table Modal */}
      {editingTruthTableShape && (
        <TruthTableModal
          existingShape={editingTruthTableShape}
          onClose={() => setEditingTruthTableShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingTruthTableShape, updated);
            setEditingTruthTableShape(null);
          }}
        />
      )}

      {/* Interactive Karnaugh Map Modal */}
      {editingKarnaughMapShape && (
        <KarnaughMapModal
          existingShape={editingKarnaughMapShape}
          onClose={() => setEditingKarnaughMapShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingKarnaughMapShape, updated);
            setEditingKarnaughMapShape(null);
          }}
        />
      )}

      {/* Interactive Network Topology Modal */}
      {editingNetworkTopologyShape && (
        <NetworkTopologyModal
          existingShape={editingNetworkTopologyShape}
          onClose={() => setEditingNetworkTopologyShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingNetworkTopologyShape, updated);
            setEditingNetworkTopologyShape(null);
          }}
        />
      )}

      {/* 🏛️ Interactive Custom Hierarchy Chart Modal */}
      {editingHierarchyShape && (
        <HierarchyChartModal
          existingShape={editingHierarchyShape}
          onClose={() => setEditingHierarchyShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingHierarchyShape, updated);
            setEditingHierarchyShape(null);
          }}
        />
      )}

      {/* 🧠 Interactive Mindmap Modal */}
      {editingMindmapShape && (
        <MindmapModal
          existingShape={editingMindmapShape}
          onClose={() => setEditingMindmapShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingMindmapShape, updated);
            setEditingMindmapShape(null);
          }}
        />
      )}

      {/* ⏳ Interactive Animated Timeline Modal */}
      {editingTimelineShape && (
        <TimelineModal
          existingShape={editingTimelineShape}
          onClose={() => setEditingTimelineShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingTimelineShape, updated);
            setEditingTimelineShape(null);
          }}
        />
      )}

      {/* 🔄 Interactive Process Flow Chart Modal */}
      {editingProcessShape && (
        <ProcessChartModal
          existingShape={editingProcessShape}
          onClose={() => setEditingProcessShape(null)}
          onUpdateShape={(updated) => {
            handleUpdateShape(editingProcessShape, updated);
            setEditingProcessShape(null);
          }}
        />
      )}

      {/* 🌍 Geography Resource Centre Modal */}
      {showGeoResourceModal && (
        <GeographyResourceCentreModal
          onClose={() => setShowGeoResourceModal(false)}
          onOpenAtlas={() => {
            setShowGeoResourceModal(false);
            setShowGeoAtlasModal(true);
          }}
          onOpenGlobe={() => {
            setShowGeoResourceModal(false);
            setShowGlobeModal(true);
          }}
          onOpenGisLab={() => {
            setShowGeoResourceModal(false);
            setShowGisModal(true);
          }}
        />
      )}

      {/* 🗺️ Geography Atlas & Thematic Explorer Modal */}
      {showGeoAtlasModal && (
        <GeographyAtlasModal
          onClose={() => setShowGeoAtlasModal(false)}
        />
      )}

      {/* 🌐 Interactive 3D Earth and Globe Laboratory Modal (Stage 6) */}
      {showGlobeModal && (
        <Globe3DModal
          onClose={() => setShowGlobeModal(false)}
        />
      )}

      {/* 🛰️ GIS, Satellite Imagery & Thematic Map Laboratory Modal (Stage 7) */}
      {showGisModal && (
        <GisThematicModal
          onClose={() => setShowGisModal(false)}
        />
      )}

    </div>
  );
}
