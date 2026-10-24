/**
 * AddToResourceLibraryModal — Dialog to save selected whiteboard drawing/objects to Resource Library
 * Prompts user for:
 * 1. Resource Name
 * 2. Subject / Educational Category (Math, Physics, Chemistry, CS, Diagrams, etc.)
 * 3. Destination Folder (Existing Custom Folder or Create New Custom Folder)
 * 4. Description and Tags
 * Displays a live rendered preview thumbnail of the selected drawing.
 */

import React, { useState, useEffect } from 'react';
import {
  CanvasObject,
  GroupObject,
  ShapeObject,
  TextObject,
} from '../../shared/types';
import {
  ResourceLibraryService,
  BUILTIN_CATEGORIES,
  ResourceCategory,
  UserFolder,
} from '../services/resourceLibraryService';
import { exportSelectedObjectsAsImage } from '../services/documentExportService';
import './AddToResourceLibraryModal.css';

interface AddToResourceLibraryModalProps {
  objectToSave: CanvasObject;
  onClose: () => void;
  onSaved: (resourceName: string, category: string, folderName?: string) => void;
}

export function AddToResourceLibraryModal({
  objectToSave,
  onClose,
  onSaved,
}: AddToResourceLibraryModalProps): React.ReactElement {
  // Extract all constituent objects (flattening groups if user marquee-selected or combined)
  const extractObjects = (obj: CanvasObject): CanvasObject[] => {
    if (obj.type === 'group' && (obj as GroupObject).objects) {
      return (obj as GroupObject).objects;
    }
    return [obj];
  };

  const objectsToSave = extractObjects(objectToSave);

  // Guess default name based on content
  const getDefaultName = (): string => {
    if (objectToSave.type === 'text') {
      const text = (objectToSave as TextObject).content?.trim();
      return text ? text.slice(0, 32) : 'Text Formula';
    }
    if (objectToSave.type === 'shape') {
      const shape = objectToSave as ShapeObject;
      if (shape.shapeType === 'cartesianAxes') return 'Cartesian Coordinate Board';
      if (shape.shapeType === 'ruler') return 'Calibrated Ruler';
      if (shape.shapeType === 'protractor') return '180° Protractor';
      if (shape.shapeType === 'compass') return 'Geometric Compass';
      return `${shape.shapeType.charAt(0).toUpperCase() + shape.shapeType.slice(1)} Shape`;
    }
    if (objectToSave.type === 'group') {
      return 'STEM Diagram / Circuit';
    }
    return 'Whiteboard Drawing';
  };

  // Form State
  const [name, setName] = useState(getDefaultName());
  const [category, setCategory] = useState<ResourceCategory>('computer-science');
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [folderOption, setFolderOption] = useState<'none' | 'existing' | 'new'>('existing');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load existing folders and generate thumbnail preview on mount
  useEffect(() => {
    const userFolders = ResourceLibraryService.getUserFolders();
    setFolders(userFolders);
    if (userFolders.length > 0) {
      setSelectedFolderId(userFolders[0].id);
    } else {
      setFolderOption('new');
      setNewFolderName('My Collection');
    }

    // Generate live thumbnail preview of selected object(s)
    let isCancelled = false;
    exportSelectedObjectsAsImage(objectsToSave, 2)
      .then((dataUrl) => {
        if (!isCancelled) {
          setThumbnailUrl(dataUrl);
          setIsGeneratingThumb(false);
        }
      })
      .catch((err) => {
        console.warn('Could not generate selection thumbnail:', err);
        if (!isCancelled) {
          setIsGeneratingThumb(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a name for your resource.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      let finalFolderId: string | undefined = undefined;
      let finalFolderName: string | undefined = undefined;

      if (folderOption === 'new' && newFolderName.trim()) {
        const created = ResourceLibraryService.createFolder(newFolderName.trim());
        finalFolderId = created.id;
        finalFolderName = created.name;
      } else if (folderOption === 'existing' && selectedFolderId) {
        const found = folders.find((f) => f.id === selectedFolderId);
        if (found) {
          finalFolderId = found.id;
          finalFolderName = found.name;
        }
      }

      const parsedTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const saved = ResourceLibraryService.saveResource({
        name: trimmedName,
        description: description.trim() || `Saved ${trimmedName} resource`,
        category,
        collectionName: finalFolderName,
        folderId: finalFolderId,
        tags: parsedTags,
        favorite: false,
        thumbnailUrl:
          thumbnailUrl ||
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%2338bdf8"/></svg>',
        objects: objectsToSave,
      });

      onSaved(saved.name, category, finalFolderName);
    } catch (err: any) {
      console.error('Failed to save resource:', err);
      setErrorMessage(err?.message || 'Failed to save resource to library');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="add-res-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="add-res-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="add-res-header">
          <div className="add-res-title-group">
            <span className="add-res-icon">🖼️</span>
            <div>
              <h3>Add to Resource Library</h3>
              <p>Save drawing to your subject collections & custom folders</p>
            </div>
          </div>
          <button className="add-res-close" onClick={onClose} title="Cancel">✕</button>
        </div>

        {/* Live Preview Container */}
        <div className="add-res-preview-box">
          {isGeneratingThumb ? (
            <div className="add-res-preview-loading">
              <span className="spinner">⏳</span> Generating preview...
            </div>
          ) : thumbnailUrl ? (
            <img src={thumbnailUrl} alt="Selected Drawing Preview" className="add-res-preview-img" />
          ) : (
            <div className="add-res-preview-fallback">
              <span>📐</span>
              <p>Selected whiteboard object ready to save</p>
            </div>
          )}
        </div>

        {errorMessage && <div className="add-res-error-banner">{errorMessage}</div>}

        {/* Form Body */}
        <div className="add-res-form">
          {/* 1. Resource Name */}
          <div className="add-res-field">
            <label className="add-res-label">
              Resource Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="add-res-input"
              placeholder="e.g., XOR & AND Logic Circuit"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              autoFocus
            />
          </div>

          {/* 2. Subject / Category */}
          <div className="add-res-field">
            <label className="add-res-label">
              Subject / Category <span className="required">*</span>
            </label>
            <select
              className="add-res-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
            >
              {BUILTIN_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Destination Custom Folder */}
          <div className="add-res-field">
            <label className="add-res-label">Save in Custom Folder / Collection</label>
            <div className="add-res-folder-options">
              <label className="folder-radio-label">
                <input
                  type="radio"
                  name="folderOpt"
                  checked={folderOption === 'existing'}
                  onChange={() => setFolderOption('existing')}
                />
                Existing Folder
              </label>
              <label className="folder-radio-label">
                <input
                  type="radio"
                  name="folderOpt"
                  checked={folderOption === 'new'}
                  onChange={() => setFolderOption('new')}
                />
                + Create New Folder
              </label>
              <label className="folder-radio-label">
                <input
                  type="radio"
                  name="folderOpt"
                  checked={folderOption === 'none'}
                  onChange={() => setFolderOption('none')}
                />
                No specific folder
              </label>
            </div>

            {folderOption === 'existing' && (
              <select
                className="add-res-select"
                style={{ marginTop: 8 }}
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
              >
                {folders.length === 0 && <option value="">No folders yet (select create new)</option>}
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            )}

            {folderOption === 'new' && (
              <input
                type="text"
                className="add-res-input"
                style={{ marginTop: 8 }}
                placeholder="Enter new folder name (e.g., Logic Circuits, Class 10 Physics)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            )}
          </div>

          {/* 4. Description */}
          <div className="add-res-field">
            <label className="add-res-label">Description (Optional)</label>
            <input
              type="text"
              className="add-res-input"
              placeholder="e.g., Half adder logic circuit with Sum & Carry out"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 5. Tags */}
          <div className="add-res-field">
            <label className="add-res-label">Tags (comma-separated, optional)</label>
            <input
              type="text"
              className="add-res-input"
              placeholder="e.g., logic, circuit, boolean, gates"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="add-res-footer">
          <button className="add-res-btn-cancel" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button
            className="add-res-btn-save"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? 'Saving to Library...' : '💾 Add to Resource Library'}
          </button>
        </div>
      </div>
    </div>
  );
}
