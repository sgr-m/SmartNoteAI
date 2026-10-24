/**
 * ResourceLibraryModal — Comprehensive Educational Resource Library
 * Milestone 3, Section 13
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  ResourceLibraryService,
  SavedResource,
  ResourceCategory,
  BUILTIN_CATEGORIES,
  STARTER_RESOURCES,
  UserFolder,
} from '../services/resourceLibraryService';
import { exportSelectedObjectsAsImage } from '../services/documentExportService';
import { CanvasObject, StrokeObject } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import './ResourceLibraryModal.css';

interface ResourceLibraryModalProps {
  onClose: () => void;
}

export function ResourceLibraryModal({ onClose }: ResourceLibraryModalProps): React.ReactElement {
  const { docDispatch, docState, selectedObject, commandSystem, setToastMessage } = useAppContext();

  const [resources, setResources] = useState<SavedResource[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all' | 'favorites'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Save Selection Form State
  const [showSaveSelectionForm, setShowSaveSelectionForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveCategory, setSaveCategory] = useState<ResourceCategory>('user-collections');
  const [saveTags, setSaveTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resources and user folders on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setResources(ResourceLibraryService.getResources());
    setFolders(ResourceLibraryService.getUserFolders());
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ResourceLibraryService.toggleFavorite(id);
    loadData();
  };

  const handleDeleteResource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved resource?')) {
      ResourceLibraryService.deleteResource(id);
      loadData();
      setToastMessage?.('Resource deleted from library');
    }
  };

  // Insert objects onto canvas
  const handleInsertObjects = (objects: CanvasObject[], title: string) => {
    const currentPageIndex = docState.currentPageIndex;

    // Clone objects with fresh IDs to prevent ID collisions
    const clonedObjects = objects.map((obj) => {
      if (obj.type === 'stroke') {
        const s = obj as StrokeObject;
        return {
          ...s,
          id: uuidv4(),
          points: (s.points || []).map((p) => ({ ...p, x: p.x + 40, y: p.y + 40 })),
          bbox: s.bbox
            ? {
                x: s.bbox.x + 40,
                y: s.bbox.y + 40,
                width: s.bbox.width,
                height: s.bbox.height,
              }
            : { x: 40, y: 40, width: 100, height: 100 },
        };
      }
      return {
        ...obj,
        id: uuidv4(),
        x: (obj as any).x !== undefined ? (obj as any).x + 40 : undefined,
        y: (obj as any).y !== undefined ? (obj as any).y + 40 : undefined,
      };
    });

    commandSystem.execute({
      id: uuidv4(),
      description: `Insert ${title} from Resource Library`,
      execute() {
        for (const obj of clonedObjects) {
          docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: obj });
        }
      },
      undo() {
        docDispatch({
          type: 'REMOVE_OBJECTS',
          pageIndex: currentPageIndex,
          objectIds: clonedObjects.map((o) => o.id),
        });
      },
    });

    setToastMessage?.(`Inserted ${title} onto slide`);
    onClose();
  };

  // Save selected canvas object as reusable resource
  const handleSaveSelectedObject = async () => {
    if (!selectedObject) return;
    if (!saveName.trim()) {
      alert('Please enter a name for the resource.');
      return;
    }

    setIsSaving(true);
    try {
      const objectsToSave = selectedObject.type === 'group'
        ? (selectedObject as any).children || [selectedObject]
        : [selectedObject];

      // Generate thumbnail
      let thumbUrl = await exportSelectedObjectsAsImage(objectsToSave, 1);
      if (!thumbUrl) {
        thumbUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%2338bdf8"/></svg>';
      }

      const tags = saveTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      ResourceLibraryService.saveResource({
        name: saveName.trim(),
        description: saveDescription.trim() || 'Custom user saved resource',
        category: saveCategory,
        tags,
        favorite: false,
        thumbnailUrl: thumbUrl,
        objects: objectsToSave,
      });

      setShowSaveSelectionForm(false);
      setSaveName('');
      setSaveDescription('');
      setSaveTags('');
      loadData();
      setToastMessage?.('Successfully saved resource to library!');
    } catch (err: any) {
      console.error('Failed to save resource:', err);
      alert(`Could not save resource: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Create folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    ResourceLibraryService.createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowFolderModal(false);
    loadData();
  };

  // Export collection package (.sbr)
  const handleExportCollection = () => {
    const pkgJson = ResourceLibraryService.exportCollectionPackage(resources);
    const blob = new Blob([pkgJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartBoard_Resources_${Date.now()}.sbr`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage?.('Exported resource collection package (.sbr)');
  };

  // Import collection package (.sbr)
  const handleImportCollectionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const count = ResourceLibraryService.importCollectionPackage(reader.result as string);
      loadData();
      setToastMessage?.(`Imported ${count} new resources into library`);
    };
    reader.readAsText(file);
  };

  // Filter logic
  const filtered = resources.filter((item) => {
    // If a specific custom folder is selected, filter by folder ID or collection name
    if (selectedFolderId) {
      const folder = folders.find((f) => f.id === selectedFolderId);
      if (folder) {
        const matchesFolderId = item.folderId === folder.id;
        const matchesFolderName =
          item.collectionName?.trim().toLowerCase() === folder.name.trim().toLowerCase();
        if (!matchesFolderId && !matchesFolderName) return false;
      }
    }

    if (selectedCategory === 'favorites') {
      if (!item.favorite) return false;
    } else if (selectedCategory !== 'all') {
      if (item.category !== selectedCategory) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.collectionName && item.collectionName.toLowerCase().includes(q)) ||
      item.tags.some((t) => t.includes(q))
    );
  });

  return (
    <div className="res-lib-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="res-lib-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="res-lib-header">
          <div className="res-lib-title-group">
            <span className="res-lib-icon">📚</span>
            <div>
              <h3>Teaching Resource Library</h3>
              <p>Milestone 3, Section 13 — Windows Folder & Reusable Asset System</p>
            </div>
          </div>
          <div className="res-lib-header-actions">
            <button className="btn-pkg-action" onClick={handleExportCollection} title="Export collection package (.sbr)">
              📤 Export Package
            </button>
            <button
              className="btn-pkg-action"
              onClick={() => fileInputRef.current?.click()}
              title="Import collection package (.sbr)"
            >
              📥 Import Package
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".sbr,.json"
              onChange={handleImportCollectionFile}
            />
            <button className="res-lib-close" onClick={onClose} aria-label="Close dialog">✕</button>
          </div>
        </div>

        {/* Directory Integration Location Banner */}
        <div className="res-lib-location-bar">
          <span className="location-icon">📁</span>
          <span className="location-text">
            <strong>Resource Location:</strong> Documents\SmartboardStudio\Resources
          </span>
          <span className="location-status">✓ Synced with Windows File System</span>
        </div>

        {/* Save Selected Object Banner */}
        {selectedObject && !showSaveSelectionForm && (
          <div className="save-selection-banner">
            <div className="save-selection-info">
              <span className="sparkle-icon">✨</span>
              <span>An object is currently selected on the canvas. Save it as a reusable resource!</span>
            </div>
            <button className="btn-save-selection" onClick={() => setShowSaveSelectionForm(true)}>
              Save Selection as Resource
            </button>
          </div>
        )}

        {/* Save Selection Form */}
        {showSaveSelectionForm && (
          <div className="save-selection-form-panel">
            <h4>Save Selected Canvas Object to Library</h4>
            <div className="save-form-grid">
              <div>
                <label className="save-form-label">Resource Name *</label>
                <input
                  type="text"
                  className="save-form-input"
                  placeholder="e.g., Quadratic Formula Box"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>

              <div>
                <label className="save-form-label">Category</label>
                <select
                  className="save-form-input"
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value as any)}
                >
                  {BUILTIN_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div className="save-form-full">
                <label className="save-form-label">Description</label>
                <input
                  type="text"
                  className="save-form-input"
                  placeholder="e.g., Standard formula layout with variables"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                />
              </div>

              <div className="save-form-full">
                <label className="save-form-label">Tags (comma separated)</label>
                <input
                  type="text"
                  className="save-form-input"
                  placeholder="e.g., math, algebra, formulas"
                  value={saveTags}
                  onChange={(e) => setSaveTags(e.target.value)}
                />
              </div>
            </div>

            <div className="save-form-actions">
              <button className="btn-secondary" onClick={() => setShowSaveSelectionForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveSelectedObject}
                disabled={isSaving || !saveName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save to Resource Library'}
              </button>
            </div>
          </div>
        )}

        {/* Content Layout: Categories Sidebar + Resource Grid */}
        <div className="res-lib-body-layout">
          {/* Left Categories Sidebar */}
          <div className="res-lib-sidebar">
            <div className="sidebar-section-title">Categories</div>

            <button
              className={`sidebar-cat-btn ${selectedCategory === 'all' && !selectedFolderId ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('all');
                setSelectedFolderId(null);
              }}
            >
              <span>🌐</span> All Resources
            </button>

            <button
              className={`sidebar-cat-btn ${selectedCategory === 'favorites' && !selectedFolderId ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('favorites');
                setSelectedFolderId(null);
              }}
            >
              <span>⭐</span> Favorites
            </button>

            <div className="sidebar-divider" />

            {BUILTIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`sidebar-cat-btn ${selectedCategory === cat.id && !selectedFolderId ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedFolderId(null);
                }}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}

            <div className="sidebar-divider" />
            <div className="sidebar-folder-header">
              <span>My Folders</span>
              <button className="btn-add-folder" onClick={() => setShowFolderModal(true)} title="Create Folder">
                +
              </button>
            </div>

            {folders.map((f) => {
              const count = resources.filter(
                (r) => r.folderId === f.id || r.collectionName?.toLowerCase() === f.name.toLowerCase()
              ).length;
              return (
                <div
                  key={f.id}
                  className={`folder-item-chip ${selectedFolderId === f.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFolderId(f.id);
                    setSelectedCategory('all');
                  }}
                >
                  <span>📁 {f.name}</span>
                  <span className="folder-item-count">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Right Main Grid */}
          <div className="res-lib-main">
            {/* Search and filters */}
            <div className="res-search-bar">
              <input
                type="text"
                className="res-search-input"
                placeholder="Search templates, STEM diagrams, and tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="res-count-badge">{filtered.length} items</span>
            </div>

            {/* Grid */}
            <div className="res-cards-grid">
              {filtered.map((item) => {
                const isCustom = STARTER_RESOURCES.every((s) => s.id !== item.id);
                return (
                  <div
                    key={item.id}
                    className="res-card-item"
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(item.objects));
                    }}
                    onClick={() => handleInsertObjects(item.objects, item.name)}
                  >
                    <div className="res-card-thumb-container">
                      {item.thumbnailUrl.startsWith('data:') ? (
                        <img src={item.thumbnailUrl} alt={item.name} className="res-thumb-image" />
                      ) : (
                        <div className="res-thumb-placeholder">📄</div>
                      )}
                      <button
                        className={`res-favorite-btn ${item.favorite ? 'active' : ''}`}
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        ★
                      </button>
                      {isCustom && (
                        <button
                          className="res-delete-btn"
                          onClick={(e) => handleDeleteResource(item.id, e)}
                          title="Delete resource"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="res-card-details">
                      <h4 className="res-card-name" title={item.name}>{item.name}</h4>
                      <p className="res-card-desc">{item.description}</p>
                      <div className="res-card-footer">
                        <span className="res-category-tag">{item.category}</span>
                        {item.collectionName && (
                          <span className="res-folder-tag" title={`Folder: ${item.collectionName}`}>
                            📁 {item.collectionName}
                          </span>
                        )}
                        <button
                          className="btn-insert-now"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertObjects(item.objects, item.name);
                          }}
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="res-empty-state">
                <span className="empty-icon">🔍</span>
                <h4>No resources found</h4>
                <p>Try searching with another keyword or save your canvas objects as new resources.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Folder Modal */}
        {showFolderModal && (
          <div className="folder-modal-backdrop" onClick={() => setShowFolderModal(false)}>
            <div className="folder-modal-box" onClick={(e) => e.stopPropagation()}>
              <h4>Create Resource Folder</h4>
              <input
                type="text"
                className="folder-name-input"
                placeholder="Folder name (e.g. Geometry Unit 2)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className="folder-modal-actions">
                <button className="btn-secondary" onClick={() => setShowFolderModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleCreateFolder}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
