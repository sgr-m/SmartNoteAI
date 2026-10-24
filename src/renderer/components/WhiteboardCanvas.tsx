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
  CanvasObject,
  GroupObject,
  Point,
} from '../../shared/types';
import { TextModal } from './TextModal';
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

  // Vertical Selection Pill Active Flyout Menu
  const [activeFlyout, setActiveFlyout] = useState<'none' | 'palette' | 'layer' | 'more' | 'thickness'>('none');

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

  const handleUpdateObject = useCallback((obj: CanvasObject) => {
    const page = currentPageRef.current;
    const pageIndex = currentPageIndexRef.current;
    if (!page) return;

    if (obj.type === 'group') {
      const grp = obj as GroupObject;
      const childIds = new Set(grp.objects.map((o) => o.id));
      const prevChildren = page.objects.filter((o) => childIds.has(o.id));
      const updatedChildren = grp.objects;

      commandSystem.execute({
        id: uuidv4(),
        description: `Move ${updatedChildren.length} items`,
        execute() {
          docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: updatedChildren });
          setSelectedObject(grp);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: prevChildren });
          setSelectedObject({ ...grp, objects: prevChildren });
        },
      });
      return;
    }

    const prevObj = page.objects.find((o) => o.id === obj.id);
    if (!prevObj) return;

    commandSystem.execute({
      id: uuidv4(),
      description: `Move ${obj.type}`,
      execute() {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: obj });
      },
      undo() {
        docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prevObj });
      },
    });
  }, [commandSystem, docDispatch, setSelectedObject]);

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
    setTextModalPos(pos);
    setEditingTextObj(null);
  }, []);

  // ─── Background & Page Framing Rendering ──────────────────────────────────
  const drawBackground = useCallback((width: number, height: number) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

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
        // Stretch to full screen canvas (0, 0, canvas.width, canvas.height)
        // Fixed at (0, 0) so hand tool dragging moves content without moving the background image!
        ctx.drawImage(cached, 0, 0, canvas.width, canvas.height);
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
      if (toolState.activeTool !== 'select') {
        setSelectedObject(null);
      }
    };
    canvas.addEventListener('pointerdown', handleCanvasPointerDown, { capture: true });
    return () => {
      canvas.removeEventListener('pointerdown', handleCanvasPointerDown, { capture: true });
    };
  }, [closeAllPopups, toolState.activeTool, setSelectedObject]);

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

  // Redraw committed canvas and background when page, objects, or selection changes
  useEffect(() => {
    if (!currentPage || !engineRef.current) return;
    engineRef.current.redrawCommitted(currentPage.objects, selectedObject?.id, selectedObject);
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      drawBackground(width, height);
    }
  }, [currentPageIndex, currentPage, currentPage?.objects, currentPage?.background, selectedObject, drawBackground]);

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

  // Keyboard shortcut: Delete, Backspace, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, handleDeleteSelected, handleDuplicateSelected, copyObject, pasteObject]);

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
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
        },
      });
    } else if (textModalPos) {
      const newText: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: textModalPos.x,
        y: textModalPos.y,
        width: textData.width || 200,
        height: textData.height || 48,
        content: textData.content || '',
        fontFamily: textData.fontFamily || 'Inter, sans-serif',
        fontSize: textData.fontSize || 20,
        fontWeight: textData.fontWeight || 400,
        fontStyle: textData.fontStyle || 'normal',
        textDecoration: textData.textDecoration || 'none',
        textAlign: textData.textAlign || 'left',
        color: textData.color || '#ffffff',
        backgroundColor: textData.backgroundColor || 'transparent',
        opacity: 1,
        rotation: 0,
        preset: textData.preset || 'body',
        locked: false,
        layerId: 'objects',
      };

      commandSystem.execute({
        id: uuidv4(),
        description: 'Add text',
        execute() {
          docDispatch({ type: 'ADD_OBJECT', pageIndex, object: newText });
        },
        undo() {
          docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: newText.id });
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
      const dpr = window.devicePixelRatio || 1;
      engineRef.current?.setDevicePixelRatio(dpr);
      engineRef.current?.resize(width, height);
      drawBackground(width, height);
    };

    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
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

      if (selectedScreenBBox.left + selectedScreenBBox.width + 56 <= containerW) {
        pillLeft = selectedScreenBBox.left + selectedScreenBBox.width + 12;
      } else {
        pillLeft = Math.max(12, selectedScreenBBox.left - 52);
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
              : 'default',
        }}
      />

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

          {/* 4. 🔤 Text / Font Properties */}
          <button
            className="sel-pill-btn"
            onClick={() => {
              if (selectedObject.type === 'text') {
                const t = selectedObject as TextObject;
                setTextModalPos({ x: t.x, y: t.y });
                setEditingTextObj(t);
              } else {
                setToastMessage('Text tool: Convert or style text elements');
              }
            }}
            title={selectedObject.type === 'text' ? 'Edit Text & Font properties' : 'Text tool'}
            aria-label="Text & Font Properties"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 20 12 4 20 20" />
              <line x1="7" y1="14" x2="17" y2="14" />
              <path d="M18 16l3 3-3 3" />
            </svg>
          </button>

          <div className="sel-pill-divider" />

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
                  setToastMessage('Saved to Resource Library!');
                  setActiveFlyout('none');
                }}
              >
                <span className="flyout-icon">🖼️</span>
                <span className="flyout-label">Add to resource library</span>
              </button>

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

        <button
          className={`canvas-nav-btn ${toolState.activeTool === 'pan' ? 'active-pan' : ''}`}
          onClick={() => setActiveTool(toolState.activeTool === 'pan' ? 'pen' : 'pan')}
          title="Toggle Pan & Roam (or hold Middle Click / Space)"
          aria-label="Pan Tool"
        >
          <span>✋</span>
        </button>
      </div>

      {/* Canvas Toast Banner for User Feedback */}
      {toastMessage && (
        <div className="canvas-toast-banner" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section 8: Location-Based Text Modal */}
      {(textModalPos || editingTextObj) && (
        <TextModal
          initialPoint={textModalPos || { x: editingTextObj?.x || 100, y: editingTextObj?.y || 100 }}
          initialText={editingTextObj}
          onSave={handleSaveText}
          onClose={() => {
            setTextModalPos(null);
            setEditingTextObj(null);
          }}
        />
      )}

    </div>
  );
}
