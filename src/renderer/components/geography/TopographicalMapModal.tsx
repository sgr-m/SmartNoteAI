/**
 * Interactive Topographical Map Viewer Modal
 * Stage 4: Topographical Maps Subsystem
 *
 * Implements:
 * 1. Survey of India Educational Map Series (Sheet 45 D/7, 45 D/10, 53 E/4)
 * 2. Interactive Pan, Zoom, Full-Screen, and Map Reset
 * 3. Conventional Signs & Symbols learning panel with CBSE/ICSE curriculum tips
 * 4. National Topographical Grid Reference demonstrator (4-figure & 6-figure GR)
 * 5. Scale & Measurement laboratory (Representative Fraction 1:50,000, 2 cm = 1 km, bearings)
 * 6. Area measurement tool (km² and hectares)
 * 7. Seamless insertion onto Whiteboard as persistent geoTopoProfile shape
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  SOI_TOPO_SHEETS,
  SHEET_45D7_LANDMARKS,
  TopoSheetDefinition,
  TopoFeatureLandmark,
  computeGridReference,
  gridToGeoCoordinates,
  calculateMapAndGroundDistance,
  calculateAreaFromGridUnits,
  getScaleExplanation,
} from '../../services/geography/topoService';
import {
  SO_TOPOGRAPHICAL_SYMBOLS,
  TopoSymbolRecord,
} from '../../services/geography/topoSymbols';
import {
  GeoResourceState,
  createDefaultGeoResourceState,
} from '../../services/geography/types';
import {
  isMapCachedOffline,
  downloadMapForOffline,
} from '../../services/geography/offlineMapService';
import { renderGeographyShape } from '../../engine/geographyShapeRenderer';
import './TopographicalMapModal.css';

interface TopographicalMapModalProps {
  onClose: () => void;
  onInsertShape?: (shape: ShapeObject) => void;
  initialSheetId?: string;
}

export function TopographicalMapModal({
  onClose,
  onInsertShape,
  initialSheetId = 'soi-topo-45d7',
}: TopographicalMapModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem, setToastMessage } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  // Selected Topographical Sheet
  const [selectedSheetId, setSelectedSheetId] = useState<string>(initialSheetId);
  const currentSheet = useMemo(
    () => SOI_TOPO_SHEETS.find((s) => s.id === selectedSheetId) || SOI_TOPO_SHEETS[0],
    [selectedSheetId]
  );

  // Active Tool Mode in Sidebar
  const [activeTab, setActiveTab] = useState<
    'symbols' | 'gridRef' | 'measure' | 'scale' | 'layers'
  >('symbols');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Selected Landmark / Feature
  const [selectedLandmark, setSelectedLandmark] = useState<TopoFeatureLandmark | null>(
    SHEET_45D7_LANDMARKS[0]
  );

  // Selected Conventional Symbol
  const [selectedSymbol, setSelectedSymbol] = useState<TopoSymbolRecord | null>(
    SO_TOPOGRAPHICAL_SYMBOLS[0]
  );
  const [symbolCategoryFilter, setSymbolCategoryFilter] = useState<string>('all');
  const [symbolSearchQuery, setSymbolSearchQuery] = useState<string>('');

  // Layer Visibility
  const [layerConfig, setLayerConfig] = useState({
    contours: true,
    gridLines: true,
    drainage: true,
    transport: true,
    settlements: true,
    spotHeights: true,
    vegetation: true,
  });

  // Canvas Camera (Pan & Zoom)
  const [zoomLevel, setZoomLevel] = useState<number>(1.25);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cursor Hover Coordinates (Projected Grid & Geo)
  const [hoverCoord, setHoverCoord] = useState<{
    easting: number;
    northing: number;
    fourFig: string;
    sixFig: string;
    dmsLat: string;
    dmsLon: string;
    elev: number;
  }>({
    easting: 87.4,
    northing: 95.8,
    fourFig: '8795',
    sixFig: '874958',
    dmsLat: '24° 42\' 15" N',
    dmsLon: '72° 44\' 20" E',
    elev: 1722,
  });

  // Measurement State (Points A & B)
  const [measurePointA, setMeasurePointA] = useState<{ easting: number; northing: number } | null>({
    easting: 84.0,
    northing: 91.0, // Mount Abu town
  });
  const [measurePointB, setMeasurePointB] = useState<{ easting: number; northing: number } | null>({
    easting: 87.4,
    northing: 95.8, // Guru Shikhar
  });
  const [measurementSettingPoint, setMeasurementSettingPoint] = useState<'A' | 'B' | null>(null);

  // Area Measurement Grid Selection (Width & Height in km)
  const [areaWidthKm, setAreaWidthKm] = useState<number>(2);
  const [areaHeightKm, setAreaHeightKm] = useState<number>(2);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filtered Conventional Symbols
  const filteredSymbols = useMemo(() => {
    return SO_TOPOGRAPHICAL_SYMBOLS.filter((sym) => {
      const matchCat = symbolCategoryFilter === 'all' || sym.category === symbolCategoryFilter;
      const matchQuery =
        symbolSearchQuery === '' ||
        sym.name.toLowerCase().includes(symbolSearchQuery.toLowerCase()) ||
        sym.meaning.toLowerCase().includes(symbolSearchQuery.toLowerCase()) ||
        sym.curriculumSignificance.toLowerCase().includes(symbolSearchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [symbolCategoryFilter, symbolSearchQuery]);

  // Measurement Result Calculation
  const measurementResult = useMemo(() => {
    if (!measurePointA || !measurePointB) return null;
    return calculateMapAndGroundDistance(measurePointA, measurePointB, currentSheet.scaleRF);
  }, [measurePointA, measurePointB, currentSheet.scaleRF]);

  // Area Result Calculation
  const areaResult = useMemo(() => {
    return calculateAreaFromGridUnits(areaWidthKm, areaHeightKm, currentSheet.scaleRF);
  }, [areaWidthKm, areaHeightKm, currentSheet.scaleRF]);

  // Scale Explanation
  const scaleExplanation = useMemo(() => {
    return getScaleExplanation(currentSheet.scaleRF);
  }, [currentSheet.scaleRF]);

  // Redraw Canvas Viewport
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Synthetic shape for rendering through geographyShapeRenderer
    const syntheticShape: ShapeObject = {
      id: 'topo-modal-preview',
      type: 'shape',
      shapeType: 'geoTopoProfile',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      fillColor: theme === 'dark' ? '#091322' : '#f8fafc',
      fillOpacity: 1,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
      label: currentSheet.title,
      params: {
        ...createDefaultGeoResourceState(selectedSheetId, currentSheet.title),
        resourceId: selectedSheetId,
        resourceType: 'topographic-sheet',
        zoomLevel,
        panOffset,
        selectedFeatureId: selectedLandmark?.id || null,
        layers: {
          boundaries: true,
          states: false,
          capitals: false,
          relief: true,
          graticule: false,
          contours: layerConfig.contours,
          gridLines: layerConfig.gridLines,
          drainage: layerConfig.drainage,
          transport: layerConfig.transport,
          settlements: layerConfig.settlements,
          spotHeights: layerConfig.spotHeights,
          vegetationForest: layerConfig.vegetation,
          legend: false,
        },
      },
    };

    renderGeographyShape(ctx, syntheticShape, 0, 0, width, height, 1);

    // If measurement tool is active, draw measurement ruler overlay on canvas
    if (measurePointA && measurePointB && activeTab === 'measure') {
      const mapMargin = 16;
      const mapWidth = width - mapMargin * 2;
      const mapHeight = height - mapMargin * 2;
      const baseScale = Math.min(mapWidth / 1000, mapHeight / 1000) * zoomLevel;
      const originX = mapMargin + (mapWidth - 1000 * baseScale) / 2 + panOffset.x * (width / 800);
      const originY = mapMargin + (mapHeight - 1000 * baseScale) / 2 + panOffset.y * (height / 600);

      const ptToScreen = (pt: { easting: number; northing: number }) => {
        const nx = ((pt.easting - 80) / 15) * 1000;
        const ny = ((102 - pt.northing) / 17) * 1000;
        return [originX + nx * baseScale, originY + ny * baseScale];
      };

      const sA = ptToScreen(measurePointA);
      const sB = ptToScreen(measurePointB);

      ctx.save();
      // Draw dashed red measurement line
      ctx.beginPath();
      ctx.moveTo(sA[0], sA[1]);
      ctx.lineTo(sB[0], sB[1]);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point A pin
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(sA[0], sA[1], 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('A', sA[0] - 4, sA[1] - 8);

      // Point B pin
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(sB[0], sB[1], 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('B', sB[0] - 4, sB[1] - 8);

      // Midpoint measurement readout tag
      if (measurementResult) {
        const midX = (sA[0] + sB[0]) / 2;
        const midY = (sA[1] + sB[1]) / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.fillRect(midX - 70, midY - 22, 140, 24);
        ctx.strokeRect(midX - 70, midY - 22, 140, 24);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(
          `${measurementResult.groundDistanceKm} km | ${measurementResult.forwardBearingDegrees}°`,
          midX - 60,
          midY - 6
        );
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    renderCanvas();
    const handleSmartboardRedraw = () => {
      renderCanvas();
    };
    window.addEventListener('smartboard:redraw', handleSmartboardRedraw);
    return () => window.removeEventListener('smartboard:redraw', handleSmartboardRedraw);
  }, [
    zoomLevel,
    panOffset,
    selectedLandmark,
    layerConfig,
    theme,
    currentSheet,
    measurePointA,
    measurePointB,
    activeTab,
  ]);

  const handleDownloadSheetFile = () => {
    try {
      const sheetFileMap: Record<string, string> = {
        'soi-topo-45d7': 'soi_topo_sheet_45d7_official.jpg',
        'soi-topo-45d10': 'soi_topo_sheet_45d10_official.jpg',
        'soi-topo-45f3': 'soi_topo_sheet_45f3_official.jpg',
        'soi-topo-53b7': 'soi_topo_sheet_53b7_official.jpg',
        'soi-topo-53e16': 'soi_topo_sheet_53e16_official.jpg',
        'soi-topo-56d11': 'soi_topo_sheet_56d11_official.jpg',
        'soi-topo-63k12': 'soi_topo_sheet_63k12_official.jpg',
        'soi-topo-64p13': 'soi_topo_sheet_64p13_official.jpg',
      };
      const fileName = sheetFileMap[selectedSheetId] || (
        selectedSheetId.includes('45d10') ? 'soi_topo_sheet_45d10_official.jpg' :
        selectedSheetId.includes('45f3') ? 'soi_topo_sheet_45f3_official.jpg' :
        selectedSheetId.includes('53b7') ? 'soi_topo_sheet_53b7_official.jpg' :
        selectedSheetId.includes('53e16') ? 'soi_topo_sheet_53e16_official.jpg' :
        selectedSheetId.includes('56d11') ? 'soi_topo_sheet_56d11_official.jpg' :
        selectedSheetId.includes('63k12') ? 'soi_topo_sheet_63k12_official.jpg' :
        selectedSheetId.includes('64p13') ? 'soi_topo_sheet_64p13_official.jpg' :
        'soi_topo_sheet_45d7_official.jpg'
      );
      const a = document.createElement('a');
      a.href = `./assets/maps/${fileName}`;
      a.download = `${currentSheet.sheetNumber.replace(/[\s\/]+/g, '_')}_SoI_Official_Toposheet.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToastMessage?.(`Exporting Survey of India ${currentSheet.title} Ultra-HD Toposheet`);
    } catch (err) {
      console.warn('Failed to download toposheet file:', err);
    }
  };

  // Pointer event handlers for Pan & Measurement
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (activeTab === 'measure' && measurementSettingPoint) {
      // Set measurement point
      const mapMargin = 16;
      const mapWidth = canvas.width - mapMargin * 2;
      const mapHeight = canvas.height - mapMargin * 2;
      const baseScale = Math.min(mapWidth / 1000, mapHeight / 1000) * zoomLevel;
      const originX = mapMargin + (mapWidth - 1000 * baseScale) / 2 + panOffset.x * (canvas.width / 800);
      const originY = mapMargin + (mapHeight - 1000 * baseScale) / 2 + panOffset.y * (canvas.height / 600);

      const normX = (mouseX - originX) / baseScale;
      const normY = (mouseY - originY) / baseScale;

      const easting = Math.round((80 + (normX / 1000) * 15) * 10) / 10;
      const northing = Math.round((102 - (normY / 1000) * 17) * 10) / 10;

      if (measurementSettingPoint === 'A') {
        setMeasurePointA({ easting, northing });
        setMeasurementSettingPoint('B');
      } else {
        setMeasurePointB({ easting, northing });
        setMeasurementSettingPoint(null);
      }
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate hover coordinates in map space
    const mapMargin = 16;
    const mapWidth = canvas.width - mapMargin * 2;
    const mapHeight = canvas.height - mapMargin * 2;
    const baseScale = Math.min(mapWidth / 1000, mapHeight / 1000) * zoomLevel;
    const originX = mapMargin + (mapWidth - 1000 * baseScale) / 2 + panOffset.x * (canvas.width / 800);
    const originY = mapMargin + (mapHeight - 1000 * baseScale) / 2 + panOffset.y * (canvas.height / 600);

    const normX = (mouseX - originX) / baseScale;
    const normY = (mouseY - originY) / baseScale;

    const easting = Math.max(80, Math.min(95, 80 + (normX / 1000) * 15));
    const northing = Math.max(85, Math.min(102, 102 - (normY / 1000) * 17));

    const gr = computeGridReference(easting, northing);
    const geo = gridToGeoCoordinates(easting, northing, currentSheet);

    // Approximate elevation interpolation around Mount Abu center (87, 95)
    const distToPeak = Math.hypot(easting - 87.4, northing - 95.8);
    const elev = Math.max(340, Math.round(1722 - distToPeak * 220));

    setHoverCoord({
      easting: Math.round(easting * 10) / 10,
      northing: Math.round(northing * 10) / 10,
      fourFig: gr.fourFigure,
      sixFig: gr.sixFigure,
      dmsLat: geo.dmsLat,
      dmsLon: geo.dmsLon,
      elev,
    });

    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomLevel((z) => Math.max(0.6, Math.min(6.0, z * factor)));
  };

  // Insertion onto Whiteboard
  const handleInsertOnBoard = () => {
    const geoState: GeoResourceState = {
      ...createDefaultGeoResourceState(currentSheet.id, currentSheet.title),
      resourceType: 'topographic-sheet',
      sheetNumber: currentSheet.sheetNumber,
      contourInterval: currentSheet.contourIntervalMeters,
      scaleRF: currentSheet.scaleRF,
      provider: currentSheet.publisher,
      attribution: currentSheet.attribution,
      zoomLevel,
      panOffset,
      layers: {
        boundaries: true,
        states: false,
        capitals: false,
        relief: true,
        graticule: false,
        contours: layerConfig.contours,
        gridLines: layerConfig.gridLines,
        drainage: layerConfig.drainage,
        transport: layerConfig.transport,
        settlements: layerConfig.settlements,
        spotHeights: layerConfig.spotHeights,
        vegetationForest: layerConfig.vegetation,
        legend: true,
      },
      selectedFeatureId: selectedLandmark?.id || null,
    };

    const shape = createShape('geoTopoProfile', 160, 120, 840, 520, {
      label: currentSheet.title,
      strokeColor: '#f59e0b',
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
        `Insert Topographical Sheet ${currentSheet.sheetNumber}`
      );
    }

    setToastMessage?.(`Inserted ${currentSheet.sheetNumber} (${currentSheet.title}) on whiteboard`);
    onClose();
  };

  return (
    <div className="topo-modal-overlay" onClick={onClose}>
      <div
        className={`topo-modal-container ${isFullscreen ? 'fullscreen' : ''} ${
          theme === 'light' ? 'theme-light' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="topo-header">
          <div className="topo-header-left">
            <span className="topo-header-icon">📐</span>
            <div>
              <h2 className="topo-header-title">
                <span>Topographical Map Viewer</span>
                <span className="topo-sheet-badge">Survey of India</span>
              </h2>
              <p className="topo-header-sub">
                1:50,000 Open Series Maps • 20m Contours • National Topographical Grid (CBSE/ICSE)
              </p>
            </div>
          </div>

          <div className="topo-header-controls">
            {/* Sheet Selector */}
            <select
              className="topo-sheet-select"
              value={selectedSheetId}
              onChange={(e) => setSelectedSheetId(e.target.value)}
              title="Select Survey of India Topographical Sheet"
            >
              {SOI_TOPO_SHEETS.map((sheet) => (
                <option key={sheet.id} value={sheet.id}>
                  Sheet {sheet.sheetNumber}: {sheet.title}
                </option>
              ))}
            </select>

            {/* Export Toposheet SVG */}
            <button
              className="topo-btn-icon"
              title="Download high-resolution Survey of India Open Series Map SVG Sheet"
              onClick={handleDownloadSheetFile}
              style={{
                width: 'auto',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>⬇</span>
              <span>Export SVG</span>
            </button>

            {/* Offline Cache Status & Download */}
            <button
              className="topo-btn-icon"
              title={
                isMapCachedOffline(selectedSheetId)
                  ? 'Toposheet cached for 100% offline classroom use'
                  : 'Download toposheet for offline use'
              }
              onClick={async () => {
                await downloadMapForOffline(selectedSheetId);
                setToastMessage?.(`✓ ${currentSheet.title} cached for offline use`);
              }}
              style={{
                width: 'auto',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: isMapCachedOffline(selectedSheetId) ? '#4ade80' : '#fbbf24',
                borderColor: isMapCachedOffline(selectedSheetId)
                  ? 'rgba(34, 197, 94, 0.4)'
                  : 'rgba(245, 158, 11, 0.4)',
                background: isMapCachedOffline(selectedSheetId)
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{isMapCachedOffline(selectedSheetId) ? '✓' : '📥'}</span>
              <span>{isMapCachedOffline(selectedSheetId) ? 'Offline Ready' : 'Download Offline'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              className="topo-btn-icon"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Fullscreen Toggle */}
            <button
              className="topo-btn-icon"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
              onClick={() => setIsFullscreen((f) => !f)}
            >
              {isFullscreen ? '🗗' : '⛶'}
            </button>

            {/* Insert on Board Button */}
            <button
              className="topo-btn-insert"
              title="Insert Topographical Sheet into Whiteboard"
              onClick={handleInsertOnBoard}
            >
              <span>📥</span>
              <span>Insert on Board</span>
            </button>

            {/* Close */}
            <button className="topo-btn-icon" title="Close Topographical Viewer" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        {/* ── Main Body ── */}
        <div className="topo-body">
          {/* Left Sidebar: Pedagogy & Tool Panels */}
          <aside className="topo-sidebar">
            {/* Mode Tab Bar */}
            <nav className="topo-tab-bar">
              <button
                className={`topo-tab-btn ${activeTab === 'symbols' ? 'active' : ''}`}
                onClick={() => setActiveTab('symbols')}
              >
                <span>🛕</span>
                <span>Symbols</span>
              </button>
              <button
                className={`topo-tab-btn ${activeTab === 'gridRef' ? 'active' : ''}`}
                onClick={() => setActiveTab('gridRef')}
              >
                <span>🌐</span>
                <span>Grid Ref</span>
              </button>
              <button
                className={`topo-tab-btn ${activeTab === 'measure' ? 'active' : ''}`}
                onClick={() => setActiveTab('measure')}
              >
                <span>📏</span>
                <span>Measure</span>
              </button>
              <button
                className={`topo-tab-btn ${activeTab === 'scale' ? 'active' : ''}`}
                onClick={() => setActiveTab('scale')}
              >
                <span>📐</span>
                <span>Scale</span>
              </button>
              <button
                className={`topo-tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
                onClick={() => setActiveTab('layers')}
              >
                <span>🥞</span>
                <span>Layers</span>
              </button>
            </nav>

            {/* Tab 1: Conventional Signs & Symbols */}
            {activeTab === 'symbols' && (
              <div className="topo-tab-content">
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Search symbols (e.g. temple, well, road)..."
                    value={symbolSearchQuery}
                    onChange={(e) => setSymbolSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'inherit',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '10px' }}>
                  {['all', 'roads', 'settlements', 'water', 'relief', 'vegetation'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSymbolCategoryFilter(cat)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        borderRadius: '4px',
                        background: symbolCategoryFilter === cat ? '#0284c7' : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: symbolCategoryFilter === cat ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ maxHeight: 'calc(100% - 80px)', overflowY: 'auto' }}>
                  {filteredSymbols.map((sym) => (
                    <div
                      key={sym.id}
                      className={`topo-symbol-card ${selectedSymbol?.id === sym.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSymbol(sym)}
                    >
                      <div className="topo-symbol-header">
                        <span className="topo-symbol-name" style={{ color: sym.color }}>
                          <span className="topo-symbol-glyph">{sym.symbolGlyph}</span>
                          <span>{sym.name}</span>
                        </span>
                      </div>
                      <p className="topo-symbol-meaning">{sym.meaning}</p>
                      <div className="topo-symbol-exam">
                        <strong>Exam Tip:</strong> {sym.curriculumSignificance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Grid Reference Demonstration */}
            {activeTab === 'gridRef' && (
              <div className="topo-tab-content">
                <div className="topo-gr-box">
                  <div className="topo-gr-title">📍 Cursor Location Grid Reference</div>
                  <div className="topo-gr-value">{hoverCoord.sixFig}</div>
                  <div className="topo-gr-guide">
                    <strong>4-Figure GR:</strong> <span style={{ color: '#38bdf8' }}>{hoverCoord.fourFig}</span> (Square identification)
                    <br />
                    <strong>6-Figure GR:</strong> <span style={{ color: '#c084fc' }}>{hoverCoord.sixFig}</span> (100m point precision)
                  </div>
                </div>

                <div style={{ background: 'rgba(30,41,59,0.5)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '13px', color: '#f8fafc' }}>
                    Eastings & Northings Rule
                  </h4>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    • <strong>Eastings:</strong> Vertical grid lines numbered from <em>West to East</em> (e.g. {hoverCoord.easting}).
                    <br />
                    • <strong>Northings:</strong> Horizontal grid lines numbered from <em>South to North</em> (e.g. {hoverCoord.northing}).
                    <br />
                    • <strong>Classroom Mnemonic:</strong> "Walk into the house (Eastings), then climb up the stairs (Northings)!"
                  </p>
                </div>

                <div className="topo-gr-box">
                  <div className="topo-gr-title">🗺️ Landmark Grid Reference Index</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {SHEET_45D7_LANDMARKS.slice(0, 5).map((lm) => (
                      <div
                        key={lm.id}
                        style={{
                          padding: '6px 8px',
                          background: selectedLandmark?.id === lm.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.2)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedLandmark(lm)}
                      >
                        <span>{lm.name}</span>
                        <strong style={{ color: '#38bdf8' }}>{lm.sixFigureGR}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Distance, Bearing & Area Measurement */}
            {activeTab === 'measure' && (
              <div className="topo-tab-content">
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#94a3b8' }}>
                    Pick Points on Map:
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setMeasurementSettingPoint('A')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '6px',
                        background: measurementSettingPoint === 'A' ? '#0284c7' : 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {measurePointA ? `Point A: ${computeGridReference(measurePointA.easting, measurePointA.northing).sixFigure}` : 'Click to Set Point A'}
                    </button>
                    <button
                      onClick={() => setMeasurementSettingPoint('B')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '6px',
                        background: measurementSettingPoint === 'B' ? '#dc2626' : 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {measurePointB ? `Point B: ${computeGridReference(measurePointB.easting, measurePointB.northing).sixFigure}` : 'Click to Set Point B'}
                    </button>
                  </div>
                </div>

                {measurementResult && (
                  <div className="topo-measure-card">
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#38bdf8', marginBottom: '8px' }}>
                      📏 Straight-Line Distance
                    </div>
                    <div className="topo-measure-row">
                      <span className="topo-measure-label">Ground Distance:</span>
                      <span className="topo-measure-val">{measurementResult.groundDistanceKm} km ({measurementResult.groundDistanceMeters} m)</span>
                    </div>
                    <div className="topo-measure-row">
                      <span className="topo-measure-label">Map Distance (1:50k):</span>
                      <span className="topo-measure-val">{measurementResult.mapDistanceCm} cm</span>
                    </div>
                    <div className="topo-measure-row">
                      <span className="topo-measure-label">Forward Bearing:</span>
                      <span className="topo-measure-val">{measurementResult.forwardBearingDegrees}° ({measurementResult.compassDirection})</span>
                    </div>
                  </div>
                )}

                <div className="topo-measure-card">
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#a855f7', marginBottom: '8px' }}>
                    📐 Area Measurement
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      Width (km):
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={areaWidthKm}
                        onChange={(e) => setAreaWidthKm(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '45px', marginLeft: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '2px 4px', borderRadius: '4px' }}
                      />
                    </label>
                    <label style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      Height (km):
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={areaHeightKm}
                        onChange={(e) => setAreaHeightKm(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '45px', marginLeft: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '2px 4px', borderRadius: '4px' }}
                      />
                    </label>
                  </div>
                  <div className="topo-measure-row">
                    <span className="topo-measure-label">Measured Area:</span>
                    <span className="topo-measure-val">{areaResult.areaSqKm} km²</span>
                  </div>
                  <div className="topo-measure-row">
                    <span className="topo-measure-label">Hectares:</span>
                    <span className="topo-measure-val">{areaResult.areaHectares} ha</span>
                  </div>
                  <div className="topo-measure-row">
                    <span className="topo-measure-label">Grid Squares:</span>
                    <span className="topo-measure-val">{areaResult.gridSquaresCount} (1km x 1km)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Scale & Mathematical Demonstration */}
            {activeTab === 'scale' && (
              <div className="topo-tab-content">
                <div style={{ background: 'rgba(30,41,59,0.5)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '13px', color: '#fbbf24' }}>
                    1. Representative Fraction (R.F.)
                  </h4>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', marginBottom: '4px' }}>
                    {scaleExplanation.rf}
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>
                    1 unit on the map represents 50,000 identical units on the ground.
                  </p>
                </div>

                <div style={{ background: 'rgba(30,41,59,0.5)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '13px', color: '#38bdf8' }}>
                    2. Statement Scale
                  </h4>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                    {scaleExplanation.statementScale}
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>
                    {scaleExplanation.groundPerCm}
                  </p>
                </div>

                <div style={{ background: 'rgba(30,41,59,0.5)', padding: '12px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '13px', color: '#4ade80' }}>
                    3. Graphical Linear Scale
                  </h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {scaleExplanation.linearScaleDescription}
                    <br />
                    Allows direct measurement using a strip of paper or divider dividers without mathematical calculation.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 5: Layer Visibility Toggles */}
            {activeTab === 'layers' && (
              <div className="topo-tab-content">
                <label className="topo-layer-item">
                  <input
                    type="checkbox"
                    checked={layerConfig.contours}
                    onChange={(e) => setLayerConfig({ ...layerConfig, contours: e.target.checked })}
                  />
                  <span>⛰️ 20m Contours & 100m Index Contours</span>
                </label>

                <label className="topo-layer-item">
                  <input
                    type="checkbox"
                    checked={layerConfig.gridLines}
                    onChange={(e) => setLayerConfig({ ...layerConfig, gridLines: e.target.checked })}
                  />
                  <span>🌐 National Topographical Grid (1km x 1km)</span>
                </label>

                <label className="topo-layer-item">
                  <input
                    type="checkbox"
                    checked={layerConfig.drainage}
                    onChange={(e) => setLayerConfig({ ...layerConfig, drainage: e.target.checked })}
                  />
                  <span>💧 Drainage (Nakki Lake, Streams, Wells)</span>
                </label>

                <label className="topo-layer-item">
                  <input
                    type="checkbox"
                    checked={layerConfig.transport}
                    onChange={(e) => setLayerConfig({ ...layerConfig, transport: e.target.checked })}
                  />
                  <span>🛣️ Transport (Metalled Roads, Cart Tracks)</span>
                </label>

                <label className="topo-layer-item">
                  <input
                    type="checkbox"
                    checked={layerConfig.settlements}
                    onChange={(e) => setLayerConfig({ ...layerConfig, settlements: e.target.checked })}
                  />
                  <span>🏠 Settlements, Temples & Public Buildings</span>
                </label>

                <label className="topo-layer-item">
                  <input
                    type="checkbox"
                    checked={layerConfig.spotHeights}
                    onChange={(e) => setLayerConfig({ ...layerConfig, spotHeights: e.target.checked })}
                  />
                  <span>▲ Triangulation Summits & Spot Heights</span>
                </label>
              </div>
            )}
          </aside>

          {/* Main Topographical Map Viewport */}
          <main className="topo-viewport-area">
            {/* Real-time Cursor Position HUD */}
            <div className="topo-hud">
              <div className="topo-hud-main">
                <span>📍 6-Figure GR: {hoverCoord.sixFig}</span>
                <span style={{ color: '#cbd5e1', fontWeight: 400 }}>| 4-Fig: {hoverCoord.fourFig}</span>
              </div>
              <div className="topo-hud-sub">
                E: {hoverCoord.easting} | N: {hoverCoord.northing} • Elev: ~{hoverCoord.elev}m
              </div>
              <div className="topo-hud-scale">
                {hoverCoord.dmsLat}, {hoverCoord.dmsLon} • RF 1:50,000 (2 cm = 1 km)
              </div>
            </div>

            {/* Canvas Viewport */}
            <canvas
              ref={canvasRef}
              className={`topo-canvas ${activeTab === 'measure' && measurementSettingPoint ? 'measuring' : ''}`}
              width={960}
              height={700}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            />

            {/* Viewport Floating Zoom & Pan Controls */}
            <div className="topo-viewport-controls">
              <button
                className="topo-ctrl-btn"
                title="Zoom In"
                onClick={() => setZoomLevel((z) => Math.min(6.0, z * 1.25))}
              >
                +
              </button>
              <button
                className="topo-ctrl-btn"
                title="Zoom Out"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z * 0.8))}
              >
                -
              </button>
              <button
                className="topo-ctrl-btn"
                title="Reset View to Default Extent"
                onClick={() => {
                  setZoomLevel(1.25);
                  setPanOffset({ x: 0, y: 0 });
                }}
              >
                ↺
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

