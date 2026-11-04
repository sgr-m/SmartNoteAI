/**
 * Geography Atlas & Map Viewer Modal
 * Stage 3: Official Survey of India Maps Library & World Atlas Thematic Explorer
 *
 * Implements:
 * 1. Official Survey of India political, physical, outline maps, and educational toposheets
 * 2. Complete 28 States & 8 UTs directory with official capitals, areas, and SoI URLs
 * 3. World Atlas with 17 verified thematic layers (Natural Earth CC0 base)
 * 4. Interactive zoom, pan, search, location selection, and layer visibility toggles
 * 5. Geodesic distance measurement tool (Haversine formula in km, miles, and compass bearing)
 * 6. Direct insertion onto whiteboard canvas as persistent GeoResourceState objects
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  OFFICIAL_INDIA_MAPS,
  INDIA_ADMINISTRATIVE_UNITS,
  WORLD_THEMATIC_LAYERS,
  WORLD_FEATURE_ENTITIES,
  IndiaAdministrativeUnit,
  WorldEntityRecord,
} from '../../services/geography/atlasData';
import {
  GeoResourceState,
  createDefaultGeoResourceState,
  OfficialIndiaMapRecord,
  GeoLayerConfig,
} from '../../services/geography/types';
import { calculateGreatCircleDistance } from '../../services/geography/geodesicService';
import { renderGeographyShape } from '../../engine/geographyShapeRenderer';
import {
  isMapCachedOffline,
  downloadMapForOffline,
  downloadAllEssentialMaps,
  getOfflineStorageSummary,
} from '../../services/geography/offlineMapService';
import './GeographyAtlasModal.css';

interface GeographyAtlasModalProps {
  onClose: () => void;
  onInsertMap?: (shape: ShapeObject) => void;
  initialScope?: 'india' | 'world';
}

export function GeographyAtlasModal({
  onClose,
  onInsertMap,
  initialScope = 'india',
}: GeographyAtlasModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem, setToastMessage } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  // Active Main Tab: 'india' (Official SoI) or 'world' (World Atlas)
  const [activeTab, setActiveTab] = useState<'india' | 'world'>(initialScope);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Re-render trigger when map image assets finish background loading
  const [redrawNonce, setRedrawNonce] = useState(0);

  useEffect(() => {
    const handleSmartboardRedraw = () => {
      setRedrawNonce((n) => n + 1);
    };
    window.addEventListener('smartboard:redraw', handleSmartboardRedraw);
    return () => window.removeEventListener('smartboard:redraw', handleSmartboardRedraw);
  }, []);

  // Selected India Map or State
  const [selectedSoiMap, setSelectedSoiMap] = useState<OfficialIndiaMapRecord>(
    OFFICIAL_INDIA_MAPS[0]
  );
  const [selectedState, setSelectedState] = useState<IndiaAdministrativeUnit | null>(null);

  // Selected World Feature
  const [selectedWorldEntity, setSelectedWorldEntity] = useState<WorldEntityRecord | null>(
    WORLD_FEATURE_ENTITIES[0]
  );

  // Thematic Layers Toggle State
  const [activeLayers, setActiveLayers] = useState<GeoLayerConfig>({
    boundaries: true,
    states: true,
    capitals: true,
    relief: true,
    graticule: true,
    rivers: true,
    mountainRanges: false,
    deserts: false,
    grasslands: false,
    climaticRegions: false,
    vegetation: false,
    soilRegions: false,
    population: false,
    timeZones: false,
    tectonicPlates: false,
    earthquakes: false,
    volcanoes: false,
    oceanCurrents: false,
    tradeRoutes: false,
    labels: true,
    legend: true,
    distanceTool: false,
  });

  // Geodesic Distance Measurement Tool State
  const [isMeasuringDistance, setIsMeasuringDistance] = useState(false);
  const [measureOrigin, setMeasureOrigin] = useState<string>('country-in'); // New Delhi
  const [measureDest, setMeasureDest] = useState<string>('country-gb');   // London

  // Canvas preview ref
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Offline Map Storage State
  const [offlineStatus, setOfflineStatus] = useState(() => getOfflineStorageSummary());
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownloadEssentialMaps = async () => {
    setIsDownloadingOffline(true);
    setDownloadProgress(0);
    setToastMessage?.('Downloading essential Survey of India & Atlas maps for offline classroom use...');
    await downloadAllEssentialMaps((pct) => {
      setDownloadProgress(pct);
    });
    setOfflineStatus(getOfflineStorageSummary());
    setIsDownloadingOffline(false);
    setToastMessage?.('✓ All essential maps are cached and 100% ready for offline use!');
  };

  const handleDownloadCurrentMap = async (mapId: string) => {
    setIsDownloadingOffline(true);
    await downloadMapForOffline(mapId);
    setOfflineStatus(getOfflineStorageSummary());
    setIsDownloadingOffline(false);
    setToastMessage?.(`✓ ${selectedSoiMap.title} is now cached for offline use`);
  };

  const handleDownloadMapImage = () => {
    if (!previewCanvasRef.current) return;
    try {
      const dataUrl = previewCanvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${selectedSoiMap.id}_soi_map.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToastMessage?.(`Exported ${selectedSoiMap.title} PNG for offline use`);
    } catch (err) {
      console.warn('Failed to export map image:', err);
    }
  };

  const handleDownloadOfficialHdMap = () => {
    try {
      const isPhys = selectedSoiMap.id.includes('phys');
      const isOutline = selectedSoiMap.id.includes('outline');
      const fileName = isPhys
        ? 'soi_physical_map_india_en_official.jpg'
        : isOutline
        ? 'soi_outline_map_india.png'
        : 'soi_political_map_india_en_official.jpg';
      const a = document.createElement('a');
      a.href = `./assets/maps/${fileName}`;
      a.download = `${selectedSoiMap.id}_soi_official_master.${isOutline ? 'png' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToastMessage?.(`Downloaded official Survey of India Master HD Map (${selectedSoiMap.title})`);
    } catch (err) {
      console.warn('Failed to download official HD map:', err);
    }
  };

  // Filtered administrative units
  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return INDIA_ADMINISTRATIVE_UNITS;
    const q = searchQuery.toLowerCase();
    return INDIA_ADMINISTRATIVE_UNITS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.capital.toLowerCase().includes(q) ||
        u.region.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered world entities
  const filteredWorldEntities = useMemo(() => {
    if (!searchQuery.trim()) return WORLD_FEATURE_ENTITIES;
    const q = searchQuery.toLowerCase();
    return WORLD_FEATURE_ENTITIES.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Calculate Geodesic measurement result between selected origin and destination
  const measurementResult = useMemo(() => {
    const originEntity = WORLD_FEATURE_ENTITIES.find((e) => e.id === measureOrigin);
    const destEntity = WORLD_FEATURE_ENTITIES.find((e) => e.id === measureDest);
    if (!originEntity || !destEntity) return null;
    return {
      origin: originEntity,
      dest: destEntity,
      ...calculateGreatCircleDistance(originEntity.location, destEntity.location),
    };
  }, [measureOrigin, measureDest]);

  // Safe external URL opener
  const handleOpenExternalUrl = (url: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        (window as any).electronAPI.invoke('shell:openExternal', url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Toggle layer helper
  const handleToggleLayer = (key: keyof GeoLayerConfig) => {
    setActiveLayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Redraw preview canvas whenever tab, layers, or selection changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isWorld = activeTab === 'world';
    const hasSelectedState = !isWorld && selectedState !== null;
    const resourceId = isWorld
      ? 'world-political-atlas'
      : hasSelectedState
      ? selectedState.id
      : selectedSoiMap.id;
    const title = isWorld
      ? 'World Atlas & Thematic Explorer'
      : hasSelectedState
      ? `${selectedState.name} - Official State Map`
      : selectedSoiMap.title;

    const baseState = createDefaultGeoResourceState(resourceId, title);

    const renderState: GeoResourceState = {
      ...baseState,
      scope: isWorld ? 'world' : 'india',
      resourceType: isWorld ? 'thematic-layer' : 'interactive-map',
      title,
      attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India. All national borders strictly reflect Government of India sovereignty.',
      colorTheme: theme,
      layers: { ...activeLayers },
      selectedFeatureId: isWorld
        ? selectedWorldEntity?.id || null
        : hasSelectedState
        ? selectedState.id
        : null,
      measurement: isMeasuringDistance && measurementResult
        ? {
            startPoint: measurementResult.origin.location,
            endPoint: measurementResult.dest.location,
            distanceKm: measurementResult.distanceKm,
            distanceMiles: measurementResult.distanceMiles,
            distanceNauticalMiles: measurementResult.distanceNauticalMiles,
            bearingDegrees: measurementResult.initialBearingDegrees,
          }
        : undefined,
    };

    const dummyShape: ShapeObject = {
      id: 'preview-geo-map',
      type: 'shape',
      shapeType: isWorld ? 'geoThematicLayer' : 'geoMap',
      x: 0,
      y: 0,
      width: w,
      height: h,
      rotation: 0,
      fillColor: 'transparent',
      fillOpacity: 0,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'default',
      params: renderState,
    };

    renderGeographyShape(ctx, dummyShape, 0, 0, w, h, 1);
  }, [
    activeTab,
    theme,
    selectedSoiMap,
    selectedState,
    selectedWorldEntity,
    activeLayers,
    isMeasuringDistance,
    measurementResult,
    redrawNonce,
  ]);

  const handleDownloadAsset = (assetPath: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = assetPath;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToastMessage?.(`Downloading ${fileName} for offline classroom use`);
    } catch {
      setToastMessage?.('Download initiated');
    }
  };

  // Insert configured map onto whiteboard canvas
  const handleInsertOnBoard = () => {
    const isWorld = activeTab === 'world';
    const hasSelectedState = !isWorld && selectedState !== null;
    const resourceId = isWorld
      ? 'world-political-atlas'
      : hasSelectedState
      ? selectedState.id
      : selectedSoiMap.id;
    const title = isWorld
      ? 'World Atlas & Thematic Explorer'
      : hasSelectedState
      ? `${selectedState.name} - Official State Map`
      : selectedSoiMap.title;

    const baseState = createDefaultGeoResourceState(resourceId, title);

    const geoState: GeoResourceState = {
      ...baseState,
      scope: isWorld ? 'world' : 'india',
      resourceType: isWorld ? 'thematic-layer' : 'interactive-map',
      title,
      attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India. All sovereign boundaries strictly reflect Government of India delineation.',
      provider: 'Survey of India (Government of India)',
      sourceUrl: selectedSoiMap?.officialPortalUrl || 'https://surveyofindia.gov.in',
      layers: { ...activeLayers },
      selectedFeatureId: isWorld
        ? selectedWorldEntity?.id || null
        : hasSelectedState
        ? selectedState.id
        : null,
      measurement: isMeasuringDistance && measurementResult
        ? {
            startPoint: measurementResult.origin.location,
            endPoint: measurementResult.dest.location,
            distanceKm: measurementResult.distanceKm,
            distanceMiles: measurementResult.distanceMiles,
            distanceNauticalMiles: measurementResult.distanceNauticalMiles,
            bearingDegrees: measurementResult.initialBearingDegrees,
          }
        : undefined,
    };

    const shape = createShape(
      isWorld ? 'geoThematicLayer' : 'geoMap',
      160,
      120,
      820,
      520,
      {
        label: title,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'transparent',
        fillOpacity: 0,
        params: geoState,
      }
    );

    if (onInsertMap) {
      onInsertMap(shape);
      onClose();
      return;
    }

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      shape,
      `Insert Geography: ${shape.label}`
    );

    setToastMessage?.(`Inserted ${shape.label} on board`);
    onClose();
  };

  return (
    <div className="geo-atlas-overlay" onClick={onClose}>
      <div
        className={`geo-atlas-dialog ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="geo-atlas-header">
          <div className="geo-atlas-title-group">
            <span className="geo-atlas-logo-icon">🗺️</span>
            <div>
              <h2 className="geo-atlas-main-title">Geography Atlas & Map Viewer</h2>
              <p className="geo-atlas-subtitle">
                Official Survey of India Cartography, Educational Toposheets & Global Thematic Atlas
              </p>
            </div>
          </div>

          {/* Navigation Mode Segmented Tabs */}
          <div className="geo-atlas-nav-tabs">
            <button
              className={`geo-atlas-tab-btn ${activeTab === 'india' ? 'active' : ''}`}
              onClick={() => setActiveTab('india')}
            >
              <span>🇮🇳</span>
              <span>Official India Maps & Toposheets</span>
            </button>
            <button
              className={`geo-atlas-tab-btn ${activeTab === 'world' ? 'active' : ''}`}
              onClick={() => setActiveTab('world')}
            >
              <span>🌍</span>
              <span>World Atlas & Thematic Explorer</span>
            </button>
          </div>

          <div className="geo-atlas-header-actions">
            <button
              className="geo-atlas-btn-sm"
              onClick={handleDownloadEssentialMaps}
              disabled={isDownloadingOffline}
              style={{
                borderColor: offlineStatus.isFullyCached ? 'rgba(34, 197, 94, 0.5)' : 'rgba(245, 158, 11, 0.5)',
                color: offlineStatus.isFullyCached ? '#4ade80' : '#fbbf24',
                background: offlineStatus.isFullyCached ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title={offlineStatus.summaryText}
            >
              <span>{isDownloadingOffline ? '⏳' : offlineStatus.isFullyCached ? '✓' : '📥'}</span>
              <span>
                {isDownloadingOffline
                  ? `Downloading (${downloadProgress}%)`
                  : offlineStatus.isFullyCached
                  ? 'All Maps Offline Ready'
                  : 'Download Essential Maps'}
              </span>
            </button>
            <button
              className="geo-atlas-btn-sm"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title="Toggle Light / Dark Theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button className="geo-atlas-close-btn" onClick={onClose} title="Close Atlas Viewer">
              ✕
            </button>
          </div>
        </header>

        {/* Body Content */}
        <div className="geo-atlas-body">
          {/* Left Sidebar */}
          <aside className="geo-atlas-sidebar">
            {activeTab === 'india' ? (
              <>
                <div className="geo-atlas-sidebar-section-title">Official SoI Publications</div>
                <div className="geo-atlas-layer-checkbox-list">
                  {OFFICIAL_INDIA_MAPS.map((mapRec) => (
                    <div
                      key={mapRec.id}
                      className="geo-atlas-layer-item"
                      style={{
                        background:
                          selectedSoiMap.id === mapRec.id
                            ? 'rgba(56, 189, 248, 0.25)'
                            : undefined,
                        borderLeft:
                          selectedSoiMap.id === mapRec.id ? '3px solid #38bdf8' : undefined,
                      }}
                      onClick={() => {
                        setSelectedSoiMap(mapRec);
                        setSelectedState(null);
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>
                        {mapRec.category === 'educational-toposheet'
                          ? '📐'
                          : mapRec.category === 'physical'
                          ? '⛰️'
                          : mapRec.category === 'outline'
                          ? '✏️'
                          : '🇮🇳'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{mapRec.title}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Scale: {mapRec.scale} | {mapRec.edition}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="geo-atlas-sidebar-section-title" style={{ marginTop: '12px' }}>
                  28 States & 8 Union Territories
                </div>
                <input
                  type="text"
                  className="geo-atlas-search-input"
                  placeholder="Search states, capitals, regions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div
                  className="geo-atlas-layer-checkbox-list"
                  style={{ maxHeight: '240px', overflowY: 'auto' }}
                >
                  {filteredStates.map((unit) => (
                    <div
                      key={unit.id}
                      className="geo-atlas-layer-item"
                      style={{
                        background:
                          selectedState?.id === unit.id
                            ? 'rgba(245, 158, 11, 0.25)'
                            : undefined,
                        borderLeft:
                          selectedState?.id === unit.id ? '3px solid #f59e0b' : undefined,
                      }}
                      onClick={() => setSelectedState(unit)}
                    >
                      <span>{unit.type === 'ut' ? '🏛️' : '📍'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{unit.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Cap: {unit.capital} ({unit.region})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="geo-atlas-sidebar-section-title">World Thematic Layers (17)</div>
                <div
                  className="geo-atlas-layer-checkbox-list"
                  style={{ maxHeight: '340px', overflowY: 'auto' }}
                >
                  {WORLD_THEMATIC_LAYERS.map((layer) => (
                    <label key={layer.id} className="geo-atlas-layer-item">
                      <input
                        type="checkbox"
                        checked={!!activeLayers[layer.layerKey]}
                        onChange={() => handleToggleLayer(layer.layerKey)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{layer.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {layer.provider}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="geo-atlas-sidebar-section-title" style={{ marginTop: '12px' }}>
                  World Search & Geodesic Tool
                </div>
                <input
                  type="text"
                  className="geo-atlas-search-input"
                  placeholder="Search countries, rivers, peaks, canals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div
                  className="geo-atlas-layer-checkbox-list"
                  style={{ maxHeight: '160px', overflowY: 'auto' }}
                >
                  {filteredWorldEntities.map((ent) => (
                    <div
                      key={ent.id}
                      className="geo-atlas-layer-item"
                      style={{
                        background:
                          selectedWorldEntity?.id === ent.id
                            ? 'rgba(56, 189, 248, 0.25)'
                            : undefined,
                        borderLeft:
                          selectedWorldEntity?.id === ent.id ? '3px solid #38bdf8' : undefined,
                      }}
                      onClick={() => setSelectedWorldEntity(ent)}
                    >
                      <span>
                        {ent.type === 'mountain'
                          ? '▲'
                          : ent.type === 'river'
                          ? '〜'
                          : ent.type === 'volcano'
                          ? '🌋'
                          : ent.type === 'chokepoint'
                          ? '⚓'
                          : '🌐'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{ent.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{ent.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>

          {/* Center Stage: Interactive Vector Canvas */}
          <main className="geo-atlas-stage">
            <div className="geo-atlas-stage-canvas-wrap">
              <canvas
                ref={previewCanvasRef}
                width={800}
                height={520}
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  background: theme === 'dark' ? '#091322' : '#e0f2fe',
                }}
              />
            </div>
          </main>

          {/* Right Inspector Drawer */}
          <aside className="geo-atlas-inspector">
            <div className="geo-atlas-inspector-header">
              {activeTab === 'india'
                ? selectedState
                  ? '🏛️ State / UT Details'
                  : '📜 Map Provenance & Metadata'
                : '🌍 Geographic Feature Inspector'}
            </div>

            {activeTab === 'india' ? (
              selectedState ? (
                <div className="geo-atlas-info-card">
                  <span className="geo-atlas-card-badge">{selectedState.type.toUpperCase()}</span>
                  <div className="geo-atlas-card-title">{selectedState.name}</div>
                  <div className="geo-atlas-card-desc">{selectedState.description}</div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '6px' }}>
                    Capital: <strong>{selectedState.capital}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Geographic Region: {selectedState.region} India
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Area: {selectedState.areaSqKm.toLocaleString()} km²
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <button
                      className="geo-atlas-btn-sm"
                      style={{ color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.1)' }}
                      onClick={() => handleDownloadAsset(`./assets/maps/states/${selectedState.id}.svg`, `${selectedState.name}_State_Map.svg`)}
                    >
                      📥 Download State Map (SVG)
                    </button>
                    <button
                      className="geo-atlas-btn-sm"
                      style={{ color: '#38bdf8', borderColor: '#38bdf8' }}
                      onClick={() => handleOpenExternalUrl(selectedState.officialSoiMapUrl)}
                    >
                      🔗 Survey of India Portal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="geo-atlas-info-card">
                  <span className="geo-atlas-card-badge">{selectedSoiMap.category}</span>
                  <div className="geo-atlas-card-title">{selectedSoiMap.title}</div>
                  <div className="geo-atlas-card-desc">{selectedSoiMap.description}</div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '6px' }}>
                    Scale: <strong>{selectedSoiMap.scale}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Edition: {selectedSoiMap.edition} ({selectedSoiMap.publicationYear})
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Grid System: {selectedSoiMap.gridSystem || 'Lambert / WGS84'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Publisher: {selectedSoiMap.publisher}
                  </div>
                  {selectedSoiMap.conventionalSigns && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>
                        Conventional Signs & Symbols:
                      </div>
                      <ul style={{ fontSize: '10px', color: '#cbd5e1', paddingLeft: '16px', margin: '4px 0' }}>
                        {selectedSoiMap.conventionalSigns.map((cs, idx) => (
                          <li key={idx}>{cs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <button
                      className="geo-atlas-btn-sm"
                      style={{
                        color: isMapCachedOffline(selectedSoiMap.id) ? '#4ade80' : '#fbbf24',
                        borderColor: isMapCachedOffline(selectedSoiMap.id) ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)',
                        background: isMapCachedOffline(selectedSoiMap.id) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      }}
                      onClick={() => handleDownloadCurrentMap(selectedSoiMap.id)}
                      disabled={isDownloadingOffline}
                    >
                      {isMapCachedOffline(selectedSoiMap.id) ? '✓ 100% Offline Ready' : '📥 Download for Offline'}
                    </button>
                    <button
                      className="geo-atlas-btn-sm"
                      style={{ color: '#38bdf8', borderColor: '#38bdf8' }}
                      onClick={handleDownloadMapImage}
                      title="Export high-resolution map image (PNG) for classroom use"
                    >
                      💾 Export Map (PNG)
                    </button>
                    <button
                      className="geo-atlas-btn-sm"
                      style={{ color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.4)', background: 'rgba(236, 72, 153, 0.1)' }}
                      onClick={handleDownloadOfficialHdMap}
                      title="Download full authentic uncompressed Survey of India master map (5903px HD)"
                    >
                      🗺️ Official SoI Master (HD)
                    </button>
                    <button
                      className="geo-atlas-btn-sm"
                      style={{ color: '#94a3b8', borderColor: '#475569' }}
                      onClick={() => handleOpenExternalUrl(selectedSoiMap.officialPortalUrl)}
                    >
                      🔗 SoI Portal ↗
                    </button>
                  </div>
                </div>
              )
            ) : (
              <>
                {selectedWorldEntity && (
                  <div className="geo-atlas-info-card">
                    <span className="geo-atlas-card-badge">{selectedWorldEntity.category}</span>
                    <div className="geo-atlas-card-title">{selectedWorldEntity.name}</div>
                    <div className="geo-atlas-card-desc">{selectedWorldEntity.description}</div>
                    {selectedWorldEntity.statValue && (
                      <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '6px', fontFamily: 'monospace' }}>
                        {selectedWorldEntity.statValue}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                      Coordinates: {selectedWorldEntity.location[0]}° E, {selectedWorldEntity.location[1]}° N
                    </div>
                  </div>
                )}

                {/* Geodesic Distance Measurement Box */}
                <div className="geo-atlas-measurement-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>
                      📏 Geodesic Distance Tool
                    </span>
                    <input
                      type="checkbox"
                      checked={isMeasuringDistance}
                      onChange={(e) => setIsMeasuringDistance(e.target.checked)}
                      title="Toggle Geodesic Measurement Arc"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Origin:</label>
                    <select
                      className="geo-atlas-search-input"
                      value={measureOrigin}
                      onChange={(e) => setMeasureOrigin(e.target.value)}
                    >
                      {WORLD_FEATURE_ENTITIES.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>

                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Destination:</label>
                    <select
                      className="geo-atlas-search-input"
                      value={measureDest}
                      onChange={(e) => setMeasureDest(e.target.value)}
                    >
                      {WORLD_FEATURE_ENTITIES.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>

                    {measurementResult && (
                      <div style={{ marginTop: '8px' }}>
                        <div className="geo-atlas-distance-readout">
                          {measurementResult.distanceKm.toLocaleString()} km
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                          {measurementResult.distanceMiles.toLocaleString()} miles |{' '}
                          {measurementResult.distanceNauticalMiles.toLocaleString()} NM
                        </div>
                        <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                          Initial Heading: {measurementResult.initialBearingDegrees}°{' '}
                          {measurementResult.compassHeading}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>

        {/* Footer */}
        <footer className="geo-atlas-footer">
          <div className="geo-atlas-compliance-note">
            Based upon Survey of India map with the permission of the Surveyor General of India. All Indian political and international boundaries strictly comply with official Survey of India cartography and Government of India sovereign guidelines.
          </div>

          <button className="geo-atlas-insert-btn" onClick={handleInsertOnBoard}>
            <span>📥</span>
            <span>Insert on Whiteboard</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

