/**
 * Geography Resource Centre Modal
 * Stage 1: Centralized Navigation & Educational Resource Library
 * Provides rich multi-faceted filtering, search, inspector, themes, and whiteboard insertion.
 */

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  GEOGRAPHY_CATEGORIES,
  searchGeographyResources,
  getFavoriteResourceIds,
  toggleFavoriteResource,
  recordRecentResource,
} from '../../services/geography/geographyRegistry';
import {
  GeographyResource,
  GeoCategory,
  GeoClassLevel,
  GeoScope,
  GeoResourceType,
  GeoResourceState,
  createDefaultGeoResourceState,
} from '../../services/geography/types';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import {
  isMapCachedOffline,
  downloadMapForOffline,
  downloadAllEssentialMaps,
  getOfflineStorageSummary,
  syncAllMapsFromSources,
  getLastMapSyncTime,
  OFFICIAL_GOVT_SOURCES,
} from '../../services/geography/offlineMapService';
import {
  ALL_INDIAN_STATES_DATA,
  IndianStateInfo,
} from '../../services/geography/detailedMapData';
import './GeographyResourceCentreModal.css';

interface GeographyResourceCentreModalProps {
  onClose: () => void;
  onInsertResource?: (resource: GeographyResource) => void;
  onOpenAtlas?: () => void;
  onOpenGlobe?: () => void;
  onOpenGisLab?: () => void;
  onlyOutlineMaps?: boolean;
  initialCategory?: GeoCategory | 'all';
}

export function GeographyResourceCentreModal({
  onClose,
  onInsertResource,
  onOpenAtlas,
  onOpenGlobe,
  onOpenGisLab,
  onlyOutlineMaps = false,
  initialCategory,
}: GeographyResourceCentreModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem, setToastMessage } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  // Theme state: dark (default) or light
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Top-Level View: 'resources' | 'states'
  const [mainView, setMainView] = useState<'resources' | 'states'>('resources');

  // Multi-faceted Filter States for Resources
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GeoCategory | 'all'>(
    onlyOutlineMaps ? 'outline-maps' : (initialCategory || 'all')
  );
  const [selectedScope, setSelectedScope] = useState<GeoScope | 'all'>('all');
  const [selectedClassLevel, setSelectedClassLevel] = useState<GeoClassLevel | 'all'>('all');
  const [selectedType, setSelectedType] = useState<GeoResourceType | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [recentlyUsedOnly, setRecentlyUsedOnly] = useState(false);

  // State Maps View State (Requirement 7)
  const [stateSearch, setStateSearch] = useState('');
  const [selectedState, setSelectedState] = useState<IndianStateInfo | null>(ALL_INDIAN_STATES_DATA[0]);
  const [isUpdatingFromGovt, setIsUpdatingFromGovt] = useState(false);
  const [lastGovtUpdate, setLastGovtUpdate] = useState<string>('Survey of India Official Portal (Synchronized)');

  // Inspector Drawer State
  const [selectedResource, setSelectedResource] = useState<GeographyResource | null>(null);

  // Favorites state tracking
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteResourceIds());

  // Offline Map Storage State
  const [offlineStorage, setOfflineStorage] = useState(() => getOfflineStorageSummary());
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAllEssential = async () => {
    setIsDownloading(true);
    setToastMessage?.('Downloading all essential maps for 100% offline classroom use...');
    await downloadAllEssentialMaps();
    setOfflineStorage(getOfflineStorageSummary());
    setIsDownloading(false);
    setToastMessage?.('✓ All essential Survey of India & Atlas maps are cached offline!');
  };

  const handleDownloadSingleResource = async (resId: string) => {
    setIsDownloading(true);
    await downloadMapForOffline(resId);
    setOfflineStorage(getOfflineStorageSummary());
    setIsDownloading(false);
    setToastMessage?.('✓ Resource cached for 100% offline classroom use');
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    const results = searchGeographyResources({
      searchQuery,
      selectedCategory: onlyOutlineMaps ? 'outline-maps' : selectedCategory,
      selectedScope,
      selectedClassLevel,
      selectedType,
      favoritesOnly,
      recentlyUsedOnly,
    });
    if (onlyOutlineMaps) {
      return results.filter((r) => r.category === 'outline-maps');
    }
    return results;
  }, [
    searchQuery,
    selectedCategory,
    selectedScope,
    selectedClassLevel,
    selectedType,
    favoritesOnly,
    recentlyUsedOnly,
    onlyOutlineMaps,
    favoriteIds,
  ]);

  // Handle toggling favorite
  const handleToggleFavorite = (e: React.MouseEvent, resId: string) => {
    e.stopPropagation();
    toggleFavoriteResource(resId);
    setFavoriteIds(getFavoriteResourceIds());
  };

  // Safe external link opener
  const handleOpenSourceUrl = (url: string) => {
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

  // Handle inserting resource onto whiteboard
  const handleInsertResource = (resource: GeographyResource) => {
    recordRecentResource(resource.id);

    if (onInsertResource) {
      onInsertResource(resource);
      onClose();
      return;
    }

    // Determine shape configuration according to resource type & scope
    let shapeType = 'geoMap';
    if (resource.resourceType === '3d-globe') {
      shapeType = 'geoGlobe';
    } else if (resource.resourceType === 'thematic-layer' || resource.scope === 'world') {
      shapeType = 'geoThematicLayer';
    }

    const defaultState = createDefaultGeoResourceState(resource.id, resource.name);
    const isCurrents = resource.id === 'geo-ocean-currents-circulation' || resource.name.toLowerCase().includes('current');
    const isTectonics = resource.id === 'geo-plate-tectonics-boundaries' || resource.name.toLowerCase().includes('tectonic');

    const geoState: GeoResourceState = {
      ...defaultState,
      resourceType: resource.resourceType,
      provider: resource.provider,
      attribution: resource.licenseAndAttribution,
      sourceUrl: resource.sourceUrl,
      scope: resource.scope,
      title: resource.name,
      layers: {
        ...defaultState.layers,
        oceanCurrents: isCurrents,
        tectonicPlates: isTectonics,
      },
    };

    const shape = createShape(shapeType as any, 180, 140, 740, 480, {
      label: resource.name,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
      params: geoState,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      shape,
      `Insert Geography Resource: ${resource.name}`
    );

    setToastMessage?.(`Inserted ${resource.name} on board`);
    onClose();
  };

  // ─── State Maps Handlers (Requirement 7) ──────────────────────────────────
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return ALL_INDIAN_STATES_DATA;
    const q = stateSearch.toLowerCase();
    return ALL_INDIAN_STATES_DATA.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.capital.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  const handleUpdateFromGovtPortal = async () => {
    setIsUpdatingFromGovt(true);
    setToastMessage?.('Connecting to Survey of India (https://surveyofindia.gov.in) & indiamaps.gov.in...');
    const result = await syncAllMapsFromSources((pct, msg) => {
      setToastMessage?.(`[${pct}%] ${msg}`);
    });
    setIsUpdatingFromGovt(false);
    setLastGovtUpdate(`Verified with Survey of India at ${result.lastSyncTime}`);
    setToastMessage?.(
      `✓ All ${result.totalUpdated} maps refreshed and verified from official Survey of India & Bhuvan sources!`
    );
  };

  const handleInsertStateMap = (st: IndianStateInfo) => {
    const defaultState = createDefaultGeoResourceState(st.id, `${st.name} (Official State Map)`);
    const geoState: GeoResourceState = {
      ...defaultState,
      resourceType: 'interactive-map',
      provider: 'Survey of India',
      attribution: '© Survey of India, Government of India. Official State Boundary.',
      sourceUrl: st.officialPortal,
      scope: 'india',
      title: `${st.name} (Official State Map)`,
      selectedFeatureId: st.id,
    };

    const shape = createShape('geoMap' as any, 180, 140, 740, 480, {
      label: `${st.name} Map`,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
      params: geoState,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      shape,
      `Insert State Map: ${st.name}`
    );

    setToastMessage?.(`Inserted ${st.name} Map on board`);
    onClose();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedScope !== 'all' ||
    selectedClassLevel !== 'all' ||
    selectedType !== 'all' ||
    favoritesOnly ||
    recentlyUsedOnly;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedScope('all');
    setSelectedClassLevel('all');
    setSelectedType('all');
    setFavoritesOnly(false);
    setRecentlyUsedOnly(false);
  };

  return (
    <div className="geo-modal-overlay" onClick={onClose}>
      <div
        className={`geo-modal-container geo-theme-${theme}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <header className="geo-header">
          <div className="geo-header-title-group">
            <span className="geo-header-icon">{onlyOutlineMaps ? '✏️' : '🌍'}</span>
            <div>
              <h2>
                {onlyOutlineMaps ? 'India Outline Maps' : 'Geography Resource Centre'}
                <span className="geo-header-badge">
                  {onlyOutlineMaps ? 'Classroom Drawing & Worksheets' : 'Survey of India Standard'}
                </span>
              </h2>
              <p>
                {onlyOutlineMaps
                  ? 'Official Survey of India blank and annotated outline maps for classroom practice, map pointing, and exams'
                  : 'Curriculum maps, 3D Earth, topography, satellite remote sensing & activities'}
              </p>
            </div>
          </div>

          <div className="geo-header-controls">
            {!onlyOutlineMaps && onOpenAtlas && (
              <button
                className="geo-btn-secondary"
                title="Launch Survey of India & World Atlas Thematic Explorer"
                onClick={onOpenAtlas}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🗺️</span>
                <span>Open Atlas Explorer</span>
              </button>
            )}
            {!onlyOutlineMaps && onOpenGisLab && (
              <button
                className="geo-btn-secondary"
                title="Launch GIS, Satellite Imagery & Thematic Map Laboratory (ISRO Bhuvan, LULC, Drainage, Soil & Floods)"
                onClick={onOpenGisLab}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  border: '1px solid rgba(14, 165, 233, 0.4)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🛰️</span>
                <span>GIS Thematic Lab</span>
              </button>
            )}
            {!onlyOutlineMaps && (
              <button
                className="geo-btn-secondary"
                title="One-click update and refresh all maps from official Survey of India & Bhuvan sources"
                onClick={handleUpdateFromGovtPortal}
                disabled={isUpdatingFromGovt}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{isUpdatingFromGovt ? '⏳' : '🔄'}</span>
                <span>{isUpdatingFromGovt ? 'Updating All Maps...' : 'Update All Maps (One-Click)'}</span>
              </button>
            )}
            {!onlyOutlineMaps && (
              <button
                className="geo-btn-secondary"
                title={offlineStorage.summaryText}
                onClick={handleDownloadAllEssential}
                disabled={isDownloading}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: offlineStorage.isFullyCached ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: offlineStorage.isFullyCached ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  color: offlineStorage.isFullyCached ? '#4ade80' : '#fbbf24',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{isDownloading ? '⏳' : offlineStorage.isFullyCached ? '✓' : '📥'}</span>
                <span>
                  {isDownloading
                    ? 'Downloading...'
                    : offlineStorage.isFullyCached
                    ? 'Offline Maps Ready'
                    : 'Download Offline Maps'}
                </span>
              </button>
            )}
            <button
              className="geo-btn-theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className="geo-btn-close"
              title={onlyOutlineMaps ? 'Close India Outline Maps' : 'Close Geography Resource Centre'}
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {/* ─── Navigation Tabs: Resources & State Maps ─── */}
        {!onlyOutlineMaps && (
          <div className="geo-main-nav-tabs">
            <button
              className={`geo-main-nav-tab ${mainView === 'resources' ? 'active' : ''}`}
              onClick={() => setMainView('resources')}
            >
              <span>📚 Curriculum Resources</span>
            </button>
            <button
              className={`geo-main-nav-tab ${mainView === 'states' ? 'active' : ''}`}
              onClick={() => setMainView('states')}
            >
              <span>🗺️ State Maps of India (28 States & 8 UTs)</span>
            </button>
          </div>
        )}

        {/* ─── Body Layout ─────────────────────────────────────────────────── */}
        {mainView === 'resources' && (
          <div className={`geo-body ${onlyOutlineMaps ? 'geo-outline-only' : ''}`}>
          {/* Sidebar: Core Categories */}
          {!onlyOutlineMaps && (
            <aside className="geo-sidebar">
              <div className="geo-sidebar-title">Categories</div>
              <nav className="geo-sidebar-nav">
                <button
                  className={`geo-nav-item ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <div className="geo-nav-item-left">
                    <span className="geo-nav-icon">🌟</span>
                    <span>All Categories</span>
                  </div>
                </button>

                {GEOGRAPHY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`geo-nav-item ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    title={cat.description}
                  >
                    <div className="geo-nav-item-left">
                      <span className="geo-nav-icon">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </aside>
          )}

          {/* Main Area: Toolbar + Grid + Inspector */}
          <main className="geo-content">
            {/* Toolbar: Search & Multi-Filters */}
            {!onlyOutlineMaps && (
              <div className="geo-toolbar">
                <div className="geo-search-row">
                  <div className="geo-search-box">
                    <span className="geo-search-icon">🔍</span>
                    <input
                      type="text"
                      className="geo-search-input"
                      placeholder="Search resources by topic, place, author, or curriculum keyword (e.g. Himalayas, SoI Toposheet, Rivers)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="geo-search-clear"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear Search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="geo-quick-filters">
                    <button
                      className={`geo-toggle-pill ${favoritesOnly ? 'active' : ''}`}
                      onClick={() => {
                        setFavoritesOnly((f) => !f);
                        setRecentlyUsedOnly(false);
                      }}
                    >
                      ⭐ Favorites ({favoriteIds.length})
                    </button>
                    <button
                      className={`geo-toggle-pill ${recentlyUsedOnly ? 'active' : ''}`}
                      onClick={() => {
                        setRecentlyUsedOnly((r) => !r);
                        setFavoritesOnly(false);
                      }}
                    >
                      🕒 Recently Used
                    </button>
                  </div>
                </div>

                {/* Secondary Dropdown Selectors */}
                <div className="geo-filter-row">
                  {/* Scope */}
                  <div className="geo-select-wrap">
                    <span className="geo-select-label">Scope:</span>
                    <select
                      className="geo-select"
                      value={selectedScope}
                      onChange={(e) => setSelectedScope(e.target.value as any)}
                    >
                      <option value="all">All Scopes</option>
                      <option value="india">🇮🇳 India</option>
                      <option value="world">🌍 World</option>
                      <option value="regional">🏔️ Regional</option>
                    </select>
                  </div>

                  {/* Class Level */}
                  <div className="geo-select-wrap">
                    <span className="geo-select-label">Classes:</span>
                    <select
                      className="geo-select"
                      value={selectedClassLevel}
                      onChange={(e) => setSelectedClassLevel(e.target.value as any)}
                    >
                      <option value="all">All Class Levels</option>
                      <option value="primary">Primary (Classes 1–5)</option>
                      <option value="middle">Middle (Classes 6–8)</option>
                      <option value="secondary">Secondary (Classes 9–10)</option>
                      <option value="senior-secondary">Senior Secondary (Classes 11–12)</option>
                      <option value="higher-ed">Higher Education</option>
                    </select>
                  </div>

                  {/* Resource Type */}
                  <div className="geo-select-wrap">
                    <span className="geo-select-label">Type:</span>
                    <select
                      className="geo-select"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as any)}
                    >
                      <option value="all">All Resource Types</option>
                      <option value="interactive-map">Interactive Map</option>
                      <option value="thematic-layer">Thematic Layer</option>
                      <option value="3d-globe">3D Globe</option>
                      <option value="topographic-sheet">Topographic Sheet</option>
                      <option value="satellite-mosaic">Satellite Imagery</option>
                      <option value="activity-worksheet">Classroom Activity</option>
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <button className="geo-btn-reset-filters" onClick={handleResetFilters}>
                      ↺ Reset Filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Split View: Cards Grid + Inspector Drawer */}
            <div className="geo-main-view">
              <div className="geo-cards-scroll">
                <div className="geo-results-meta">
                  Showing {filteredResources.length} educational resource{filteredResources.length === 1 ? '' : 's'}
                </div>

                {filteredResources.length > 0 ? (
                  <div className="geo-cards-grid">
                    {filteredResources.map((res) => {
                      const isFav = favoriteIds.includes(res.id);
                      const isSelected = selectedResource?.id === res.id;
                      return (
                        <div
                          key={res.id}
                          className={`geo-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedResource(res)}
                        >
                          <div className="geo-card-top">
                            <div className="geo-card-icon-scope">
                              <span className="geo-card-icon">{res.previewInfo.thumbnailIcon || '🗺️'}</span>
                              <span className={`geo-badge-scope ${res.scope}`}>
                                {res.scope === 'india' ? '🇮🇳 India' : res.scope === 'world' ? '🌍 World' : '🏔️ Regional'}
                              </span>
                            </div>

                            <div className="geo-card-actions">
                              <button
                                className={`geo-btn-fav ${isFav ? 'active' : ''}`}
                                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                onClick={(e) => handleToggleFavorite(e, res.id)}
                              >
                                {isFav ? '★' : '☆'}
                              </button>
                            </div>
                          </div>

                          <h4>{res.name}</h4>
                          <p>{res.description}</p>

                          <div className="geo-card-footer">
                            <span className="geo-card-provider" title={res.provider}>
                              {res.provider}
                            </span>
                            <span
                              className={`geo-card-status ${
                                res.availabilityStatus === 'available'
                                  ? 'available'
                                  : res.availabilityStatus === 'external-portal'
                                  ? 'external'
                                  : 'planned'
                              }`}
                            >
                              {res.availabilityStatus === 'available'
                                ? '✓ Available'
                                : res.availabilityStatus === 'external-portal'
                                ? '↗ Portal'
                                : 'Planned'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="geo-empty-state">
                    <span className="geo-empty-icon">🔍</span>
                    <h3>No matching resources found</h3>
                    <p>Try adjusting your search query, scope, or clearing selected category filters.</p>
                    <button className="geo-btn-secondary" onClick={handleResetFilters}>
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Right Inspector Drawer */}
              <aside className="geo-inspector">
                {selectedResource ? (
                  <>
                    <div className="geo-inspector-header">
                      <div>
                        <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>
                          {selectedResource.previewInfo.thumbnailIcon || '🗺️'}
                        </span>
                        <h3>{selectedResource.name}</h3>
                      </div>
                      <button
                        className={`geo-btn-fav ${favoriteIds.includes(selectedResource.id) ? 'active' : ''}`}
                        style={{ fontSize: '20px' }}
                        title={
                          favoriteIds.includes(selectedResource.id)
                            ? 'Remove from favorites'
                            : 'Add to favorites'
                        }
                        onClick={(e) => handleToggleFavorite(e, selectedResource.id)}
                      >
                        {favoriteIds.includes(selectedResource.id) ? '★' : '☆'}
                      </button>
                    </div>

                    <p className="geo-inspector-desc">{selectedResource.description}</p>

                    {/* Educational Purpose */}
                    <div className="geo-inspector-section">
                      <h5>Educational Purpose</h5>
                      <p>{selectedResource.educationalPurpose}</p>
                    </div>

                    {/* Suitable Class Levels */}
                    <div className="geo-inspector-section">
                      <h5>Target Curriculum Level</h5>
                      <div className="geo-pills-row">
                        {selectedResource.suitableClasses.map((cl) => (
                          <span key={cl} className="geo-pill-tag">
                            {cl === 'primary'
                              ? 'Primary (1–5)'
                              : cl === 'middle'
                              ? 'Middle (6–8)'
                              : cl === 'secondary'
                              ? 'Secondary (9–10)'
                              : cl === 'senior-secondary'
                              ? 'Senior Sec. (11–12)'
                              : 'Higher Ed'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Authoritative Provider */}
                    <div className="geo-inspector-section">
                      <h5>Authoritative Provider</h5>
                      <p style={{ fontWeight: 600 }}>{selectedResource.provider}</p>
                    </div>

                    {/* Survey of India Notice for Indian territory */}
                    {selectedResource.scope === 'india' && (
                      <div className="geo-inspector-section">
                        <div className="geo-soi-notice">
                          <strong>🇮🇳 National Cartographic Compliance:</strong>
                          <div style={{ marginTop: '4px', fontSize: '11px' }}>
                            Based strictly upon official Survey of India boundary specifications. Includes complete Union Territories of J&K and Ladakh.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verified Source URL */}
                    <div className="geo-inspector-section">
                      <h5>Verified Source Reference</h5>
                      <a
                        href={selectedResource.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="geo-source-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenSourceUrl(selectedResource.sourceUrl);
                        }}
                      >
                        {selectedResource.sourceUrl} ↗
                      </a>
                    </div>

                    {/* Licensing & Attribution */}
                    <div className="geo-inspector-section">
                      <h5>Licence & Attribution</h5>
                      <p style={{ fontSize: '12px', color: 'var(--geo-text-muted)' }}>
                        {selectedResource.licenseAndAttribution}
                      </p>
                    </div>

                    {/* Interaction Capabilities */}
                    <div className="geo-inspector-section">
                      <h5>Interactive Capabilities</h5>
                      <div className="geo-pills-row">
                        {selectedResource.interactionCapabilities.map((cap) => (
                          <span key={cap} className="geo-pill-tag">
                            ✓ {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="geo-inspector-actions">
                      <button
                        className="geo-btn-primary"
                        onClick={() => handleInsertResource(selectedResource)}
                      >
                        ➕ Insert on Whiteboard
                      </button>
                      {onOpenGlobe && selectedResource.resourceType === '3d-globe' && (
                        <button
                          className="geo-btn-secondary"
                          onClick={() => {
                            onClose();
                            onOpenGlobe();
                          }}
                          style={{
                            borderColor: 'rgba(56, 189, 248, 0.4)',
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                          }}
                        >
                          🌐 Open in 3D Globe Lab
                        </button>
                      )}
                      {selectedResource.scope === 'india' && (
                        <button
                          className="geo-btn-secondary"
                          onClick={() => {
                            const isPhys = selectedResource.id.includes('phys');
                            const fileName = isPhys ? 'soi_physical_map_india_en_official.jpg' : 'soi_political_map_india_en_official.jpg';
                            const a = document.createElement('a');
                            a.href = `./assets/maps/${fileName}`;
                            a.download = `${selectedResource.id}_soi_official_master.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setToastMessage?.(`Downloaded official Survey of India HD Master (${selectedResource.name})`);
                          }}
                          style={{ borderColor: 'rgba(236, 72, 153, 0.4)', color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }}
                        >
                          🗺️ Download SoI Master (HD)
                        </button>
                      )}
                      <button
                        className="geo-btn-secondary"
                        onClick={() => handleDownloadSingleResource(selectedResource.id)}
                        disabled={isDownloading}
                        style={{
                          borderColor: isMapCachedOffline(selectedResource.id)
                            ? 'rgba(34, 197, 94, 0.4)'
                            : 'rgba(245, 158, 11, 0.4)',
                          color: isMapCachedOffline(selectedResource.id) ? '#4ade80' : '#fbbf24',
                          background: isMapCachedOffline(selectedResource.id)
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)',
                        }}
                      >
                        {isMapCachedOffline(selectedResource.id)
                          ? '✓ 100% Offline Ready'
                          : '📥 Download for Offline Use'}
                      </button>
                      <button
                        className="geo-btn-secondary"
                        onClick={(e) => handleToggleFavorite(e, selectedResource.id)}
                      >
                        {favoriteIds.includes(selectedResource.id)
                          ? '★ Saved in Favorites'
                          : '☆ Add to Favorites'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="geo-inspector-empty">
                    <span>🗺️</span>
                    <h4 style={{ margin: '0 0 6px', color: 'var(--geo-text-primary)' }}>
                      Resource Inspector
                    </h4>
                    <p style={{ fontSize: '12.5px', maxWidth: '240px' }}>
                      Select any map or curriculum resource from the library to inspect metadata, educational purpose, and legal licensing.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </main>
        </div>
        )}

        {/* ─── State Maps View (Requirement 7) ─────────────────────────────────── */}
        {mainView === 'states' && (
          <div className="geo-body" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Top Toolbar */}
            <div className="geo-sub-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '480px' }}>
                <div className="geo-search-box" style={{ flex: 1 }}>
                  <span className="geo-search-icon">🔍</span>
                  <input
                    type="text"
                    className="geo-search-input"
                    placeholder="Search states, UTs, capitals (e.g. Uttar Pradesh, Maharashtra, Leh)..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                  />
                  {stateSearch && (
                    <button className="geo-search-clear" onClick={() => setStateSearch('')}>✕</button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--geo-text-secondary)' }}>
                  {lastGovtUpdate}
                </span>
                <button
                  className="geo-btn-secondary"
                  onClick={handleUpdateFromGovtPortal}
                  disabled={isUpdatingFromGovt}
                  title="Refresh state boundaries and download latest map updates from official Survey of India portal"
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                  }}
                >
                  <span>{isUpdatingFromGovt ? '⏳' : '🔄'}</span>
                  <span>{isUpdatingFromGovt ? 'Updating from Govt Portal...' : 'Update from Govt. Portal'}</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="geo-states-grid">
                {filteredStates.map((st) => {
                  const isSel = selectedState?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      className={`geo-state-card ${isSel ? 'selected' : ''}`}
                      onClick={() => setSelectedState(st)}
                    >
                      <div className="geo-state-thumb">
                        <img src={st.assetPath} alt={st.name} loading="lazy" />
                      </div>
                      <div className="geo-state-header">
                        <span className="geo-state-name">{st.name}</span>
                        <span className="geo-state-code">{st.code}</span>
                      </div>
                      <div className="geo-state-meta">
                        <span>★ Capital: {st.capital.split('/')[0]}</span>
                        <span>🏛️ {st.districts} Districts • {st.isUT ? 'Union Territory' : 'State'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* State Inspector Drawer */}
              {selectedState && (
                <aside className="geo-inspector" style={{ width: '360px', borderLeft: '1px solid var(--geo-border)' }}>
                  <div className="geo-inspector-header">
                    <span className="geo-inspector-badge">Survey of India Verified</span>
                    <h3>{selectedState.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--geo-text-secondary)' }}>
                      {selectedState.isUT ? 'Union Territory' : 'State of India'} • Code: {selectedState.code}
                    </p>
                  </div>

                  <div className="geo-state-thumb" style={{ height: '200px', margin: '14px 16px', background: 'rgba(0,0,0,0.3)' }}>
                    <img src={selectedState.assetPath} alt={selectedState.name} style={{ maxHeight: '95%', maxWidth: '95%' }} />
                  </div>

                  <div className="geo-inspector-section">
                    <h5>Official Administrative Metadata</h5>
                    <div className="geo-meta-grid">
                      <div className="geo-meta-item">
                        <span className="geo-meta-label">Capital City</span>
                        <span className="geo-meta-val">★ {selectedState.capital}</span>
                      </div>
                      <div className="geo-meta-item">
                        <span className="geo-meta-label">Total Districts</span>
                        <span className="geo-meta-val">{selectedState.districts}</span>
                      </div>
                      <div className="geo-meta-item">
                        <span className="geo-meta-label">Geographical Area</span>
                        <span className="geo-meta-val">{selectedState.areaKm2.toLocaleString('en-IN')} km²</span>
                      </div>
                      <div className="geo-meta-item">
                        <span className="geo-meta-label">Zone / Region</span>
                        <span className="geo-meta-val">{selectedState.region} India</span>
                      </div>
                    </div>
                  </div>

                  <div className="geo-inspector-section">
                    <h5>Official Portal & Licensing</h5>
                    <p className="geo-attribution-text">
                      © Survey of India / Digital Census of India. Strictly adheres to official national borders.
                    </p>
                    <button
                      className="geo-btn-secondary"
                      onClick={() => handleOpenSourceUrl(selectedState.officialPortal || 'https://surveyofindia.gov.in')}
                      style={{ fontSize: '11px', padding: '6px 12px', width: '100%', justifyContent: 'center', marginTop: '6px' }}
                    >
                      🔗 Open Official State Portal ({selectedState.officialPortal ? new URL(selectedState.officialPortal).hostname : 'surveyofindia.gov.in'})
                    </button>
                  </div>

                  <div className="geo-inspector-actions" style={{ marginTop: 'auto', padding: '16px' }}>
                    <button
                      className="geo-btn-primary"
                      onClick={() => handleInsertStateMap(selectedState)}
                    >
                      📥 Insert on Board
                    </button>
                    <button
                      className="geo-btn-secondary"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = selectedState.assetPath;
                        a.download = `${selectedState.id}_soi_official_map.svg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setToastMessage?.(`Downloaded official SVG map of ${selectedState.name}`);
                      }}
                    >
                      ⬇ Download Official SVG
                    </button>
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

