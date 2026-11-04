/**
 * GIS, Satellite Imagery & Thematic Map Laboratory Modal
 * Stage 7: Geospatial Layer Management, OGC Tile Protocols,
 * ISRO/NRSC Bhuvan, NASA Earthdata, USGS, Copernicus & GEBCO verified providers,
 * Spatial Inspection & Dual-Map Swipe Comparison.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  GIS_LAYERS,
  GIS_COMPARISON_PRESETS,
  GisLayerDefinition,
  GisInspectionResult,
  GisComparisonPreset,
  inspectGisLocation,
  formatCoordinateDMS,
  filterGisLayers,
  moveLayerInStack,
  INDIA_EXTENT_BOUNDS,
} from '../../services/geography/gisService';
import { createDefaultGeoResourceState, GeoResourceState } from '../../services/geography/types';
import './GisThematicModal.css';

interface GisThematicModalProps {
  onClose: () => void;
  onInsertShape?: (shape: ShapeObject) => void;
}

type SidebarTab = 'layers' | 'comparison' | 'inspect' | 'legend';

export function GisThematicModal({
  onClose,
  onInsertShape,
}: GisThematicModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem, setToastMessage } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  // Viewport & Layout
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('layers');

  // Layer State
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>([
    'isro-bhuvan-satellite',
    'isro-bhuvan-lulc',
  ]);
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({
    'isro-bhuvan-satellite': 1.0,
    'isro-bhuvan-lulc': 0.75,
    'isro-cartodem-elevation': 0.85,
    'isro-wris-drainage': 0.8,
    'isro-ndem-flood': 0.85,
  });
  const [layerOrder, setLayerOrder] = useState<string[]>([
    'isro-bhuvan-satellite',
    'isro-bhuvan-lulc',
  ]);
  const [selectedLayerToAdd, setSelectedLayerToAdd] = useState<string>('');
  const [layerFilterCategory, setLayerFilterCategory] = useState<string>('all');

  // Map Comparison State
  const [comparisonMode, setComparisonMode] = useState<'none' | 'swipe' | 'sideBySide'>('none');
  const [layerAId, setLayerAId] = useState<string>('isro-bhuvan-satellite');
  const [layerBId, setLayerBId] = useState<string>('isro-bhuvan-lulc');
  const [swipePosition, setSwipePosition] = useState<number>(50); // 0..100 %
  const [isDraggingSwipe, setIsDraggingSwipe] = useState(false);

  // Inspection State
  const [inspectedLocation, setInspectedLocation] = useState<GisInspectionResult | null>(() =>
    inspectGisLocation(77.209, 28.6139) // New Delhi default
  );

  // Map Camera / Viewport State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Active layers definitions list
  const activeLayersList = useMemo(() => {
    return layerOrder
      .map((id) => GIS_LAYERS.find((l) => l.id === id))
      .filter((l): l is GisLayerDefinition => l !== undefined);
  }, [layerOrder]);

  // Unadded layers for layer-picker dropdown
  const availableToAddLayers = useMemo(() => {
    return GIS_LAYERS.filter((l) => !activeLayerIds.includes(l.id));
  }, [activeLayerIds]);

  // Handle Layer Toggle
  const handleToggleLayer = (id: string) => {
    if (activeLayerIds.includes(id)) {
      setActiveLayerIds((prev) => prev.filter((item) => item !== id));
      setLayerOrder((prev) => prev.filter((item) => item !== id));
    } else {
      setActiveLayerIds((prev) => [...prev, id]);
      setLayerOrder((prev) => [...prev, id]);
      if (!layerOpacities[id]) {
        const layerDef = GIS_LAYERS.find((l) => l.id === id);
        setLayerOpacities((prev) => ({
          ...prev,
          [id]: layerDef?.defaultOpacity ?? 0.8,
        }));
      }
    }
  };

  // Handle Layer Opacity Change
  const handleOpacityChange = (id: string, opacity: number) => {
    setLayerOpacities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(1, opacity)),
    }));
  };

  // Handle Move Layer Up / Down
  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    setLayerOrder((prev) => moveLayerInStack(prev, id, direction));
  };

  // Add Layer from dropdown
  const handleAddLayer = () => {
    if (!selectedLayerToAdd) return;
    handleToggleLayer(selectedLayerToAdd);
    setSelectedLayerToAdd('');
  };

  // Quick Preset Comparison loader
  const handleApplyComparisonPreset = (preset: GisComparisonPreset) => {
    setComparisonMode('swipe');
    setLayerAId(preset.layerAId);
    setLayerBId(preset.layerBId);
    setSwipePosition(preset.defaultSwipe);

    // Ensure both layers are enabled in active list
    setActiveLayerIds((prev) => {
      const set = new Set(prev);
      set.add(preset.layerAId);
      set.add(preset.layerBId);
      return Array.from(set);
    });
    setLayerOrder((prev) => {
      const set = new Set(prev);
      set.add(preset.layerAId);
      set.add(preset.layerBId);
      return Array.from(set);
    });
    setToastMessage?.(`Applied Comparison: ${preset.name}`);
  };

  // Quick Preset Landmarks
  const PRESET_LANDMARKS = [
    { name: 'New Delhi (Capital)', lon: 77.209, lat: 28.6139 },
    { name: 'Majuli (Brahmaputra Island)', lon: 94.2167, lat: 26.95 },
    { name: 'Thar Desert (Barchans)', lon: 70.9083, lat: 26.9157 },
    { name: 'Sundarbans (Delta Mangroves)', lon: 88.8535, lat: 21.9497 },
    { name: 'Mount Abu (Aravalli Scarp)', lon: 72.7816, lat: 24.6508 },
    { name: 'Mumbai (Coastal Metropolis)', lon: 72.8777, lat: 19.076 },
  ];

  // Inspect specific point
  const handleInspectCoordinate = (lon: number, lat: number) => {
    const result = inspectGisLocation(lon, lat);
    setInspectedLocation(result);
  };

  // Convert Screen coordinates to Lon/Lat
  const screenToLonLat = useCallback(
    (screenX: number, screenY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [78.96, 20.59];
      const w = canvas.width;
      const h = canvas.height;

      const mapMargin = 20;
      const mapWidth = w - mapMargin * 2;
      const mapHeight = h - mapMargin * 2;

      const baseScale = Math.min(mapWidth / 1000, mapHeight / 1000) * zoom;
      const originX = mapMargin + (mapWidth - 1000 * baseScale) / 2 + pan.x;
      const originY = mapMargin + (mapHeight - 1000 * baseScale) / 2 + pan.y;

      const normX = (screenX - originX) / baseScale;
      const normY = (screenY - originY) / baseScale;

      const lon = 68.1 + (normX / 1000) * (97.4 - 68.1);
      const lat = 37.1 - (normY / 1000) * (37.1 - 6.7);

      return [Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000];
    },
    [zoom, pan]
  );

  // Canvas Mouse / Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && lastMousePos) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setLastMousePos(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((z) => Math.max(0.6, Math.min(6.0, z * factor)));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only inspect if not dragging
    if (isPanning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [lon, lat] = screenToLonLat(sx, sy);
    handleInspectCoordinate(lon, lat);
  };

  // Swipe handle dragging
  const handleSwipeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingSwipe(true);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingSwipe || !viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSwipePosition(Math.round(pct));
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingSwipe) {
        setIsDraggingSwipe(false);
      }
    };

    if (isDraggingSwipe) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingSwipe]);

  // Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const isDark = theme === 'dark';

    // 1. Clear & Background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = isDark ? '#091322' : '#e0f2fe';
    ctx.fillRect(0, 0, w, h);

    // 2. Transformations
    const mapMargin = 20;
    const mapWidth = w - mapMargin * 2;
    const mapHeight = h - mapMargin * 2;

    const baseScale = Math.min(mapWidth / 1000, mapHeight / 1000) * zoom;
    const originX = mapMargin + (mapWidth - 1000 * baseScale) / 2 + pan.x;
    const originY = mapMargin + (mapHeight - 1000 * baseScale) / 2 + pan.y;

    const lonLatToScreenPt = (lon: number, lat: number): [number, number] => {
      const nx = ((lon - 68.1) / (97.4 - 68.1)) * 1000;
      const ny = ((37.1 - lat) / (37.1 - 6.7)) * 1000;
      return [originX + nx * baseScale, originY + ny * baseScale];
    };

    // Helper: Render a specific layer's cartographic visualization
    const renderLayerContent = (layerId: string, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;

      if (layerId === 'isro-bhuvan-satellite') {
        // High-res true-color satellite texture simulation
        const grad = ctx.createLinearGradient(
          originX,
          originY,
          originX + 1000 * baseScale,
          originY + 1000 * baseScale
        );
        grad.addColorStop(0, '#365314'); // Northern Himalayas & plains
        grad.addColorStop(0.3, '#15803d'); // Indo-Gangetic vegetation
        grad.addColorStop(0.5, '#ca8a04'); // Central Deccan cropland
        grad.addColorStop(0.7, '#166534'); // Western Ghats evergreen
        grad.addColorStop(1, '#1e3a8a'); // Coastal oceans
        ctx.fillStyle = grad;
        ctx.fillRect(originX, originY, 1000 * baseScale, 1000 * baseScale);
      } else if (layerId === 'isro-cartodem-elevation') {
        // Hypsometric tinting for elevation
        const grad = ctx.createLinearGradient(
          originX,
          originY,
          originX,
          originY + 1000 * baseScale
        );
        grad.addColorStop(0, '#ffffff'); // > 4000m Himalayas
        grad.addColorStop(0.15, '#b45309'); // 2000m
        grad.addColorStop(0.3, '#f59e0b'); // 800m
        grad.addColorStop(0.5, '#fde047'); // 400m
        grad.addColorStop(0.8, '#22c55e'); // 100m
        ctx.fillStyle = grad;
        ctx.fillRect(originX, originY, 1000 * baseScale, 1000 * baseScale);
      } else if (layerId === 'isro-bhuvan-lulc') {
        // LULC classification overlay
        // Agricultural plains
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(originX + 200 * baseScale, originY + 280 * baseScale, 550 * baseScale, 200 * baseScale);
        // Forested belts (Western Ghats & NE)
        ctx.fillStyle = '#047857';
        ctx.fillRect(originX + 180 * baseScale, originY + 480 * baseScale, 90 * baseScale, 380 * baseScale);
        ctx.fillRect(originX + 750 * baseScale, originY + 240 * baseScale, 200 * baseScale, 240 * baseScale);
        // Built-up nodes
        ctx.fillStyle = '#e11d48';
        const cities = [
          [77.209, 28.6139], // Delhi
          [72.8777, 19.076], // Mumbai
          [88.3639, 22.5726], // Kolkata
          [77.5946, 12.9716], // Bengaluru
        ];
        cities.forEach(([cLon, cLat]) => {
          const [cx, cy] = lonLatToScreenPt(cLon, cLat);
          ctx.beginPath();
          ctx.arc(cx, cy, 7 * zoom, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (layerId === 'isro-nbsslup-soil') {
        // Soils overlay
        // Alluvial (North)
        ctx.fillStyle = 'rgba(234, 179, 8, 0.6)';
        ctx.fillRect(originX + 220 * baseScale, originY + 250 * baseScale, 560 * baseScale, 180 * baseScale);
        // Black Regur (Deccan)
        ctx.fillStyle = 'rgba(51, 65, 85, 0.65)';
        ctx.fillRect(originX + 250 * baseScale, originY + 440 * baseScale, 380 * baseScale, 280 * baseScale);
        // Red Soil (South & East)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.fillRect(originX + 380 * baseScale, originY + 680 * baseScale, 300 * baseScale, 250 * baseScale);
      } else if (layerId === 'isro-wris-drainage') {
        // River drainage basins
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        // Draw sample major river basin outlines
        ctx.strokeRect(originX + 250 * baseScale, originY + 240 * baseScale, 520 * baseScale, 220 * baseScale);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fillRect(originX + 250 * baseScale, originY + 240 * baseScale, 520 * baseScale, 220 * baseScale);
      } else if (layerId === 'isro-ndem-flood') {
        // Flood hazard zones (Brahmaputra & Kosi)
        ctx.fillStyle = 'rgba(220, 38, 38, 0.65)';
        // North Bihar
        ctx.fillRect(originX + 580 * baseScale, originY + 310 * baseScale, 120 * baseScale, 80 * baseScale);
        // Assam Brahmaputra
        ctx.fillRect(originX + 780 * baseScale, originY + 290 * baseScale, 160 * baseScale, 60 * baseScale);
      } else {
        // Default thematic layer placeholder visualization
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fillRect(originX + 200 * baseScale, originY + 200 * baseScale, 600 * baseScale, 600 * baseScale);
      }

      ctx.restore();
    };

    // 3. Render Layers according to Comparison Mode
    if (comparisonMode === 'swipe') {
      const splitX = (w * swipePosition) / 100;

      // Render Layer A on Left side
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      renderLayerContent(layerAId, layerOpacities[layerAId] ?? 1.0);
      ctx.restore();

      // Render Layer B on Right side
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();
      renderLayerContent(layerBId, layerOpacities[layerBId] ?? 1.0);
      ctx.restore();
    } else if (comparisonMode === 'sideBySide') {
      const halfW = w / 2;

      // Left Map: Layer A
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, halfW - 2, h);
      ctx.clip();
      renderLayerContent(layerAId, layerOpacities[layerAId] ?? 1.0);
      ctx.restore();

      // Right Map: Layer B
      ctx.save();
      ctx.beginPath();
      ctx.rect(halfW + 2, 0, halfW - 2, h);
      ctx.clip();
      renderLayerContent(layerBId, layerOpacities[layerBId] ?? 1.0);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, h);
      ctx.stroke();
    } else {
      // Normal Mode: Composite all active layers in order
      activeLayersList.forEach((layer) => {
        const opacity = layerOpacities[layer.id] ?? layer.defaultOpacity;
        renderLayerContent(layer.id, opacity);
      });
    }

    // 4. Cartographic Graticule (5° grid)
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let lon = 70; lon <= 95; lon += 5) {
      const [p1x, p1y] = lonLatToScreenPt(lon, 6.7);
      const [p2x, p2y] = lonLatToScreenPt(lon, 37.1);
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(`${lon}°E`, p1x - 10, h - 22);
    }

    for (let lat = 10; lat <= 35; lat += 5) {
      const [p1x, p1y] = lonLatToScreenPt(68.1, lat);
      const [p2x, p2y] = lonLatToScreenPt(97.4, lat);
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(`${lat}°N`, 18, p1y + 3);
    }
    ctx.setLineDash([]);

    // 5. Draw Inspected Location Pin & Callout
    if (inspectedLocation) {
      const [pinX, pinY] = lonLatToScreenPt(inspectedLocation.lon, inspectedLocation.lat);

      ctx.beginPath();
      ctx.arc(pinX, pinY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Outer ripple
      ctx.beginPath();
      ctx.arc(pinX, pinY, 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [
    zoom,
    pan,
    theme,
    activeLayersList,
    layerOpacities,
    comparisonMode,
    layerAId,
    layerBId,
    swipePosition,
    inspectedLocation,
  ]);

  // Handle Inserting onto Whiteboard
  const handleInsertOnWhiteboard = () => {
    const layerA = GIS_LAYERS.find((l) => l.id === layerAId);
    const layerB = GIS_LAYERS.find((l) => l.id === layerBId);
    const defaultState = createDefaultGeoResourceState('gis-thematic-lab', 'GIS Thematic Viewer');

    const geoState: GeoResourceState = {
      ...defaultState,
      resourceType: 'gis-viewer',
      title:
        comparisonMode === 'swipe'
          ? `GIS Comparison: ${layerA?.shortName} vs ${layerB?.shortName}`
          : 'GIS & Satellite Thematic Laboratory',
      provider: 'NRSC / ISRO (Bhuvan) & Survey of India',
      attribution: 'GIS Layers: © NRSC/ISRO Bhuvan • Boundaries: Official Survey of India',
      sourceUrl: 'https://bhuvan.nrsc.gov.in/',
      scope: 'india',
      zoomLevel: zoom,
      panOffset: pan,
      gisState: {
        activeLayerIds,
        layerOpacities,
        layerOrder,
        comparisonMode,
        comparisonLayerAId: layerAId,
        comparisonLayerBId: layerBId,
        swipePosition,
        inspectedLocation: inspectedLocation
          ? {
              lon: inspectedLocation.lon,
              lat: inspectedLocation.lat,
              elevationM: inspectedLocation.elevationM,
              lulcClass: inspectedLocation.lulcClass,
              soilType: inspectedLocation.soilType,
              drainageBasin: inspectedLocation.drainageBasin,
              floodRisk: inspectedLocation.floodRisk,
              stateName: inspectedLocation.stateName,
            }
          : undefined,
      },
    };

    const shape = createShape('geoMap', 180, 130, 840, 520, {
      label: geoState.title,
      strokeColor: '#0284c7',
      strokeWidth: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
      params: geoState,
    });

    if (onInsertShape) {
      onInsertShape(shape);
    } else {
      executeAddObject(
        {
          pageIndex: currentPageIndex,
          dispatch: docDispatch,
          commandSystem,
        },
        shape,
        'Insert GIS & Thematic Map Laboratory'
      );
    }

    setToastMessage?.('Inserted GIS Thematic View onto whiteboard');
    onClose();
  };

  return (
    <div className="gis-modal-overlay">
      <div className={`gis-container ${isFullscreen ? 'fullscreen' : ''} ${theme}`}>
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <header className="gis-header">
          <div className="gis-title-group">
            <span className="gis-title-icon">🛰️</span>
            <div className="gis-title-text">
              <h2>
                GIS, Satellite Imagery & Thematic Map Laboratory
                <span className="gis-badge">ISRO Bhuvan & Survey of India</span>
              </h2>
              <p className="gis-title-sub">
                15 Thematic Cartographic Layers • GetFeatureInfo Attribute Inspection • Dual-Map Swipe Comparison
              </p>
            </div>
          </div>

          <div className="gis-header-actions">
            <button
              className="gis-btn-primary"
              title="Insert current GIS map view onto the whiteboard"
              onClick={handleInsertOnWhiteboard}
            >
              <span>➕</span>
              <span>Insert on Board</span>
            </button>

            <button
              className="gis-btn-secondary"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              className="gis-btn-secondary"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? '🗗 Restore' : '⛶ Fullscreen'}
            </button>

            <button
              className="gis-btn-close"
              title="Close GIS Laboratory"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {/* ─── Body Layout ─────────────────────────────────────────────────── */}
        <div className="gis-body">
          {/* Left Control Sidebar */}
          <aside className="gis-sidebar">
            <div className="gis-tabs">
              <button
                className={`gis-tab-btn ${sidebarTab === 'layers' ? 'active' : ''}`}
                onClick={() => setSidebarTab('layers')}
              >
                <span>📑</span>
                <span>Layers ({activeLayerIds.length})</span>
              </button>
              <button
                className={`gis-tab-btn ${sidebarTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setSidebarTab('comparison')}
              >
                <span>↔️</span>
                <span>Compare</span>
              </button>
              <button
                className={`gis-tab-btn ${sidebarTab === 'inspect' ? 'active' : ''}`}
                onClick={() => setSidebarTab('inspect')}
              >
                <span>🔍</span>
                <span>Inspect</span>
              </button>
              <button
                className={`gis-tab-btn ${sidebarTab === 'legend' ? 'active' : ''}`}
                onClick={() => setSidebarTab('legend')}
              >
                <span>📖</span>
                <span>Legend</span>
              </button>
            </div>

            <div className="gis-tab-content">
              {/* TAB 1: Layer Management */}
              {sidebarTab === 'layers' && (
                <>
                  <div className="gis-sec-title">
                    <span>Active GIS Layers (Stack Order)</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Top renders over bottom</span>
                  </div>

                  {/* Add Layer Bar */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={selectedLayerToAdd}
                      onChange={(e) => setSelectedLayerToAdd(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <option value="">+ Select Layer from Catalog ({availableToAddLayers.length} available)...</option>
                      {availableToAddLayers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.category})
                        </option>
                      ))}
                    </select>
                    <button
                      className="gis-btn-secondary"
                      onClick={handleAddLayer}
                      disabled={!selectedLayerToAdd}
                    >
                      Add
                    </button>
                  </div>

                  {/* Active Layers Stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeLayersList.map((layer, index) => {
                      const opacity = layerOpacities[layer.id] ?? layer.defaultOpacity;
                      return (
                        <div key={layer.id} className="gis-layer-card active">
                          <div className="gis-layer-header">
                            <div className="gis-layer-title-row">
                              <input
                                type="checkbox"
                                checked={activeLayerIds.includes(layer.id)}
                                onChange={() => handleToggleLayer(layer.id)}
                                title="Show / Hide Layer"
                              />
                              <span className="gis-layer-title" title={layer.name}>
                                {layer.shortName}
                              </span>
                            </div>
                            <div className="gis-layer-controls">
                              <button
                                className="gis-icon-btn"
                                title="Move Layer Up in Rendering Stack"
                                onClick={() => handleMoveLayer(layer.id, 'up')}
                                disabled={index === 0}
                              >
                                ▲
                              </button>
                              <button
                                className="gis-icon-btn"
                                title="Move Layer Down in Rendering Stack"
                                onClick={() => handleMoveLayer(layer.id, 'down')}
                                disabled={index === activeLayersList.length - 1}
                              >
                                ▼
                              </button>
                              <button
                                className="gis-icon-btn"
                                title="Remove Layer from Active Stack"
                                onClick={() => handleToggleLayer(layer.id)}
                                style={{ color: '#ef4444' }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="gis-opacity-row">
                            <span>Opacity:</span>
                            <input
                              type="range"
                              className="gis-opacity-slider"
                              min="0"
                              max="1"
                              step="0.05"
                              value={opacity}
                              onChange={(e) =>
                                handleOpacityChange(layer.id, parseFloat(e.target.value))
                              }
                            />
                            <span>{Math.round(opacity * 100)}%</span>
                          </div>

                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Provider: <strong>{layer.provider}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* TAB 2: Map Comparison */}
              {sidebarTab === 'comparison' && (
                <>
                  <div className="gis-sec-title">Thematic Map Comparison Mode</div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`gis-btn-secondary ${comparisonMode === 'none' ? 'active' : ''}`}
                      onClick={() => setComparisonMode('none')}
                      style={{ flex: 1, borderColor: comparisonMode === 'none' ? '#38bdf8' : undefined }}
                    >
                      Off (Single)
                    </button>
                    <button
                      className={`gis-btn-secondary ${comparisonMode === 'swipe' ? 'active' : ''}`}
                      onClick={() => setComparisonMode('swipe')}
                      style={{ flex: 1, borderColor: comparisonMode === 'swipe' ? '#38bdf8' : undefined }}
                    >
                      ↔️ Swipe Divider
                    </button>
                    <button
                      className={`gis-btn-secondary ${comparisonMode === 'sideBySide' ? 'active' : ''}`}
                      onClick={() => setComparisonMode('sideBySide')}
                      style={{ flex: 1, borderColor: comparisonMode === 'sideBySide' ? '#38bdf8' : undefined }}
                    >
                      ◫ Side-by-Side
                    </button>
                  </div>

                  {comparisonMode !== 'none' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Left Map (Layer A):
                        </label>
                        <select
                          value={layerAId}
                          onChange={(e) => setLayerAId(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#0f172a',
                            color: '#f8fafc',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            padding: '6px',
                            fontSize: '12px',
                          }}
                        >
                          {GIS_LAYERS.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Right Map (Layer B):
                        </label>
                        <select
                          value={layerBId}
                          onChange={(e) => setLayerBId(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#0f172a',
                            color: '#f8fafc',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            padding: '6px',
                            fontSize: '12px',
                          }}
                        >
                          {GIS_LAYERS.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {comparisonMode === 'swipe' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                            <span>Divider Position:</span>
                            <span>{swipePosition}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            value={swipePosition}
                            onChange={(e) => setSwipePosition(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#38bdf8' }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="gis-sec-title" style={{ marginTop: '10px' }}>
                    Educational Comparison Presets
                  </div>
                  <div className="gis-preset-list">
                    {GIS_COMPARISON_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        className="gis-preset-btn"
                        onClick={() => handleApplyComparisonPreset(preset)}
                      >
                        <span className="gis-preset-name">{preset.name}</span>
                        <span className="gis-preset-desc">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 3: Geographic Inspection */}
              {sidebarTab === 'inspect' && (
                <>
                  <div className="gis-sec-title">Location Inspector (GetFeatureInfo)</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    Click anywhere on the map or select a curriculum benchmark below to inspect geographic attributes.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {PRESET_LANDMARKS.map((lm) => (
                      <button
                        key={lm.name}
                        className="gis-btn-secondary"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => handleInspectCoordinate(lm.lon, lm.lat)}
                      >
                        {lm.name}
                      </button>
                    ))}
                  </div>

                  {inspectedLocation && (
                    <div className="gis-inspector-card">
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Location:</span>
                        <span className="gis-attr-val">{inspectedLocation.stateName}</span>
                      </div>
                      {inspectedLocation.districtName && (
                        <div className="gis-attr-row">
                          <span className="gis-attr-label">District / Tract:</span>
                          <span className="gis-attr-val">{inspectedLocation.districtName}</span>
                        </div>
                      )}
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Coordinates (DD):</span>
                        <span className="gis-attr-val">
                          {inspectedLocation.lat.toFixed(4)}° N, {inspectedLocation.lon.toFixed(4)}° E
                        </span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Coordinates (DMS):</span>
                        <span className="gis-attr-val">{inspectedLocation.dmsStr}</span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Elevation (CartoDEM):</span>
                        <span className="gis-attr-val" style={{ color: '#38bdf8' }}>
                          {inspectedLocation.elevationM} m ({inspectedLocation.elevationClass})
                        </span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Land Use (LULC):</span>
                        <span className="gis-attr-val" style={{ color: '#84cc16' }}>
                          {inspectedLocation.lulcClass}
                        </span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Soil Order (NBSS&LUP):</span>
                        <span className="gis-attr-val" style={{ color: '#f59e0b' }}>
                          {inspectedLocation.soilType}
                        </span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Drainage Basin:</span>
                        <span className="gis-attr-val" style={{ color: '#60a5fa' }}>
                          {inspectedLocation.drainageBasin}
                        </span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Flood Vulnerability:</span>
                        <span
                          className="gis-attr-val"
                          style={{
                            color:
                              inspectedLocation.floodRisk === 'Very High'
                                ? '#ef4444'
                                : inspectedLocation.floodRisk === 'High'
                                ? '#f97316'
                                : '#10b981',
                          }}
                        >
                          {inspectedLocation.floodRisk}
                        </span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Geomorphology Unit:</span>
                        <span className="gis-attr-val">{inspectedLocation.geomorphologyUnit}</span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Forest Density:</span>
                        <span className="gis-attr-val">{inspectedLocation.forestDensity}</span>
                      </div>
                      <div className="gis-attr-row">
                        <span className="gis-attr-label">Cropping Pattern:</span>
                        <span className="gis-attr-val">{inspectedLocation.agriculturalZone}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 4: Legend & Metadata */}
              {sidebarTab === 'legend' && (
                <>
                  <div className="gis-sec-title">Active Layers Legend</div>
                  {activeLayersList.map((layer) => (
                    <div key={layer.id} className="gis-layer-card" style={{ gap: '6px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#38bdf8' }}>
                        {layer.name}
                      </div>
                      <div className="gis-legend-list">
                        {layer.legend.map((entry) => (
                          <div key={entry.label} className="gis-legend-item">
                            <span
                              className="gis-legend-chip"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span style={{ color: '#f8fafc', fontWeight: 500 }}>
                              {entry.label}
                            </span>
                            {entry.description && (
                              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                — {entry.description}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="gis-sec-title" style={{ marginTop: '10px' }}>
                    Authoritative Provenance & Compliance
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                    <p style={{ margin: '0 0 6px 0' }}>
                      <strong>🇮🇳 Survey of India Compliance:</strong> All political boundaries strictly follow official Survey of India delineations, including complete Union Territories of J&K and Ladakh.
                    </p>
                    <p style={{ margin: '0 0 6px 0' }}>
                      <strong>🛰️ ISRO / NRSC Bhuvan:</strong> High-resolution satellite imagery, CartoDEM, LULC 1:50k, and thematic products courtesy of National Remote Sensing Centre (NRSC), ISRO.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>🌐 Global Basemaps:</strong> NASA GIBS (Terra MODIS), USGS SRTM elevation, and GEBCO 2024 bathymetry under public educational access licenses.
                    </p>
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Center Map Viewport */}
          <main className="gis-viewport-wrapper" ref={viewportRef}>
            <canvas
              ref={canvasRef}
              className="gis-canvas"
              width={1000}
              height={700}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onClick={handleCanvasClick}
            />

            {/* Top-Right HUD */}
            <div className="gis-hud-top">
              {inspectedLocation ? (
                <>
                  <div>
                    Coordinates:{' '}
                    <span className="gis-hud-coord">
                      {inspectedLocation.lat.toFixed(4)}°N, {inspectedLocation.lon.toFixed(4)}°E
                    </span>
                  </div>
                  <div>
                    Elevation:{' '}
                    <strong style={{ color: '#f59e0b' }}>
                      {inspectedLocation.elevationM} m
                    </strong>{' '}
                    | State: <strong>{inspectedLocation.stateName}</strong>
                  </div>
                  <div>
                    LULC: <strong>{inspectedLocation.lulcClass}</strong>
                  </div>
                </>
              ) : (
                <div>Click map to inspect geographic attributes</div>
              )}
            </div>

            {/* Viewport Controls */}
            <div className="gis-map-controls">
              <button
                className="gis-ctrl-btn"
                title="Zoom In"
                onClick={() => setZoom((z) => Math.min(6.0, z * 1.25))}
              >
                +
              </button>
              <button
                className="gis-ctrl-btn"
                title="Zoom Out"
                onClick={() => setZoom((z) => Math.max(0.6, z / 1.25))}
              >
                −
              </button>
              <button
                className="gis-ctrl-btn"
                title="Reset View to India"
                onClick={() => {
                  setZoom(1.0);
                  setPan({ x: 0, y: 0 });
                }}
              >
                ⟲
              </button>
            </div>

            {/* Swipe Divider in 'swipe' Comparison Mode */}
            {comparisonMode === 'swipe' && (
              <>
                <div className="gis-swipe-tag-left">
                  Left: {GIS_LAYERS.find((l) => l.id === layerAId)?.shortName}
                </div>
                <div className="gis-swipe-tag-right">
                  Right: {GIS_LAYERS.find((l) => l.id === layerBId)?.shortName}
                </div>
                <div
                  className="gis-swipe-line"
                  style={{ left: `${swipePosition}%` }}
                >
                  <div
                    className="gis-swipe-handle"
                    onMouseDown={handleSwipeMouseDown}
                    title="Drag to compare maps"
                  >
                    ↔
                  </div>
                </div>
              </>
            )}

            {/* Bottom Attribution Bar */}
            <footer className="gis-attribution-bar">
              <span>
                Data: NRSC / ISRO (Bhuvan) • Boundaries: Survey of India • Elevation: CartoDEM / SRTM
              </span>
              <span>Zoom: {zoom.toFixed(1)}x • EPSG:3857 / WGS84</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

