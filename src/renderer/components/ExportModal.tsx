import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  exportLessonToPdf,
  exportPageAsImage,
  exportSelectedObjectsAsImage,
  exportNativeLesson,
  exportLessonToCsv,
  PdfExportOptions,
} from '../services/documentExportService';
import './ExportModal.css';

interface ExportModalProps {
  onClose: () => void;
}

type ExportTab = 'pdf' | 'image' | 'lesson' | 'csv';

export function ExportModal({ onClose }: ExportModalProps): React.ReactElement {
  const { docState, selectedObject, setToastMessage } = useAppContext();
  const [activeTab, setActiveTab] = useState<ExportTab>('pdf');

  // PDF Export State
  const [pageScope, setPageScope] = useState<'current' | 'all' | 'custom'>('all');
  const [selectedPageIndices, setSelectedPageIndices] = useState<Set<number>>(
    new Set(docState.lesson.pages.map((_, i) => i))
  );
  const [paperSize, setPaperSize] = useState<'16:9' | '4:3' | 'a4' | 'letter'>('16:9');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);
  const [highResolution, setHighResolution] = useState<boolean>(true);
  const [addPagination, setAddPagination] = useState<boolean>(true);
  const [marginsMm, setMarginsMm] = useState<number>(0);

  // Image Export State
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [imageScope, setImageScope] = useState<'current' | 'selection'>('current');
  const [imageScale, setImageScale] = useState<number>(2);

  // Progress & Feedback
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const togglePageSelect = (index: number) => {
    setSelectedPageIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        if (next.size > 1) next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadText = (text: string, filename: string, mimeType: string) => {
    const blob = new Blob([text], { type: mimeType });
    downloadBlob(blob, filename);
  };

  // 1. Export PDF Handler
  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportProgress(5);
    setErrorMessage(null);

    try {
      const pdfOptions: PdfExportOptions = {
        pages: pageScope,
        pageIndices:
          pageScope === 'current'
            ? [docState.currentPageIndex]
            : pageScope === 'custom'
            ? Array.from(selectedPageIndices)
            : undefined,
        paperSize,
        orientation,
        marginsMm,
        includeBackground,
        highResolution,
        addPagination,
      };

      const blob = await exportLessonToPdf(docState.lesson, pdfOptions, (pct) => {
        setExportProgress(pct);
      });

      const title = docState.lesson.meta?.title?.trim() || 'SmartBoard_Lesson';
      const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadBlob(blob, `${cleanTitle}.pdf`);

      setToastMessage?.('PDF exported successfully!');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setErrorMessage(`Failed to export PDF: ${err?.message || 'Unknown error'}`);
      setIsExporting(false);
    }
  };

  // 2. Export Image Handler
  const handleExportImage = async () => {
    setIsExporting(true);
    setExportProgress(20);
    setErrorMessage(null);

    try {
      const currentPage = docState.lesson.pages[docState.currentPageIndex];
      const title = docState.lesson.meta?.title?.trim() || 'SmartBoard_Lesson';
      const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');

      if (imageScope === 'selection') {
        // Selection export
        if (!selectedObject) {
          throw new Error('No canvas object is currently selected. Select an object first or choose "Current Slide".');
        }
        const objectsToExport = selectedObject.type === 'group'
          ? (selectedObject as any).children || [selectedObject]
          : [selectedObject];
        const dataUrl = await exportSelectedObjectsAsImage(objectsToExport, imageScale);
        if (!dataUrl) throw new Error('Could not render selected objects.');

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${cleanTitle}_selection.${imageFormat}`;
        a.click();
      } else {
        // Current Page export
        const dataUrl = await exportPageAsImage(currentPage, imageFormat, {
          scale: imageScale,
          includeBackground,
        });

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${cleanTitle}_page_${docState.currentPageIndex + 1}.${imageFormat}`;
        a.click();
      }

      setExportProgress(100);
      setToastMessage?.(`Image exported successfully (${imageFormat.toUpperCase()})`);
      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      console.error('Image export error:', err);
      setErrorMessage(err?.message || 'Failed to export image.');
      setIsExporting(false);
    }
  };

  // 3. Export Native Lesson (.sbl)
  const handleExportLesson = () => {
    try {
      const json = exportNativeLesson(docState.lesson);
      const title = docState.lesson.meta?.title?.trim() || 'SmartBoard_Lesson';
      const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadText(json, `${cleanTitle}.sbl`, 'application/json');
      setToastMessage?.('Native editable lesson (.sbl) exported!');
      onClose();
    } catch (err: any) {
      setErrorMessage(`Failed to export lesson: ${err?.message}`);
    }
  };

  // 4. Export CSV Report
  const handleExportCsv = () => {
    try {
      const csv = exportLessonToCsv(docState.lesson);
      const title = docState.lesson.meta?.title?.trim() || 'SmartBoard_Lesson';
      const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadText(csv, `${cleanTitle}_structure.csv`, 'text/csv');
      setToastMessage?.('Lesson structure CSV exported!');
      onClose();
    } catch (err: any) {
      setErrorMessage(`Failed to export CSV: ${err?.message}`);
    }
  };

  return (
    <div className="export-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="export-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="export-modal-header">
          <div className="export-header-title">
            <span className="export-header-icon">📤</span>
            <div>
              <h3>Export Lesson & Resources</h3>
              <p className="export-header-sub">Milestone 3, Section 12 — Printable PDF, High-Res Images & Native Formats</p>
            </div>
          </div>
          <button className="export-close-btn" onClick={onClose} aria-label="Close export dialog">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="export-tabs-row">
          <button
            className={`export-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdf')}
          >
            📑 PDF Document
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            🌄 Image (PNG / JPEG)
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'lesson' ? 'active' : ''}`}
            onClick={() => setActiveTab('lesson')}
          >
            💾 Native Lesson (.sbl)
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
            onClick={() => setActiveTab('csv')}
          >
            📊 CSV Data
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="export-error-banner">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Tab 1: PDF Export */}
        {activeTab === 'pdf' && (
          <div className="export-body-content">
            <div className="export-section">
              <label className="export-section-title">Pages to Export</label>
              <div className="export-choice-group">
                <label className="export-radio-item">
                  <input
                    type="radio"
                    name="pageScope"
                    checked={pageScope === 'current'}
                    onChange={() => setPageScope('current')}
                  />
                  <span>Current Page (Slide {docState.currentPageIndex + 1})</span>
                </label>
                <label className="export-radio-item">
                  <input
                    type="radio"
                    name="pageScope"
                    checked={pageScope === 'all'}
                    onChange={() => setPageScope('all')}
                  />
                  <span>All Pages ({docState.lesson.pages.length} slides)</span>
                </label>
                <label className="export-radio-item">
                  <input
                    type="radio"
                    name="pageScope"
                    checked={pageScope === 'custom'}
                    onChange={() => setPageScope('custom')}
                  />
                  <span>Custom Selection</span>
                </label>
              </div>

              {pageScope === 'custom' && (
                <div className="export-page-selector-grid">
                  {docState.lesson.pages.map((p, idx) => {
                    const isSelected = selectedPageIndices.has(idx);
                    return (
                      <div
                        key={p.id}
                        className={`export-page-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => togglePageSelect(idx)}
                      >
                        <input type="checkbox" checked={isSelected} readOnly />
                        <span>Slide {idx + 1}: {p.title || 'Untitled'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="export-grid-2col">
              <div className="export-section">
                <label className="export-section-title">Paper Size</label>
                <select
                  className="export-select"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                >
                  <option value="16:9">16:9 Widescreen (Presentation Default)</option>
                  <option value="4:3">4:3 Standard Slide</option>
                  <option value="a4">A4 Printable Sheet (297 x 210 mm)</option>
                  <option value="letter">US Letter (Printable)</option>
                </select>
              </div>

              <div className="export-section">
                <label className="export-section-title">Orientation</label>
                <div className="export-pill-toggle">
                  <button
                    className={`export-pill-btn ${orientation === 'landscape' ? 'active' : ''}`}
                    onClick={() => setOrientation('landscape')}
                  >
                    Landscape
                  </button>
                  <button
                    className={`export-pill-btn ${orientation === 'portrait' ? 'active' : ''}`}
                    onClick={() => setOrientation('portrait')}
                  >
                    Portrait
                  </button>
                </div>
              </div>
            </div>

            <div className="export-section">
              <label className="export-section-title">Print & Visual Options</label>
              <div className="export-checkbox-list">
                <label className="export-check-item">
                  <input
                    type="checkbox"
                    checked={includeBackground}
                    onChange={(e) => setIncludeBackground(e.target.checked)}
                  />
                  <span>Include Slide Backgrounds (Grids, Ruled, Dark Themes & Images)</span>
                </label>
                <label className="export-check-item">
                  <input
                    type="checkbox"
                    checked={highResolution}
                    onChange={(e) => setHighResolution(e.target.checked)}
                  />
                  <span>High-Resolution Graphics (300 DPI vector-crisp rendering)</span>
                </label>
                <label className="export-check-item">
                  <input
                    type="checkbox"
                    checked={addPagination}
                    onChange={(e) => setAddPagination(e.target.checked)}
                  />
                  <span>Add Slide Numbers & Footer Pagination ("Slide X of Y")</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Image Export */}
        {activeTab === 'image' && (
          <div className="export-body-content">
            <div className="export-section">
              <label className="export-section-title">Export Scope</label>
              <div className="export-choice-group">
                <label className="export-radio-item">
                  <input
                    type="radio"
                    name="imageScope"
                    checked={imageScope === 'current'}
                    onChange={() => setImageScope('current')}
                  />
                  <span>Current Slide (Page {docState.currentPageIndex + 1})</span>
                </label>
                <label className="export-radio-item">
                  <input
                    type="radio"
                    name="imageScope"
                    checked={imageScope === 'selection'}
                    onChange={() => setImageScope('selection')}
                  />
                  <span>Selected Canvas Objects Only (Cropped PNG)</span>
                </label>
              </div>
            </div>

            <div className="export-grid-2col">
              <div className="export-section">
                <label className="export-section-title">Format</label>
                <div className="export-pill-toggle">
                  <button
                    className={`export-pill-btn ${imageFormat === 'png' ? 'active' : ''}`}
                    onClick={() => setImageFormat('png')}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    className={`export-pill-btn ${imageFormat === 'jpeg' ? 'active' : ''}`}
                    onClick={() => setImageFormat('jpeg')}
                  >
                    JPEG (High Quality)
                  </button>
                </div>
              </div>

              <div className="export-section">
                <label className="export-section-title">Resolution Scale</label>
                <div className="export-pill-toggle">
                  <button
                    className={`export-pill-btn ${imageScale === 1 ? 'active' : ''}`}
                    onClick={() => setImageScale(1)}
                  >
                    1x (Standard)
                  </button>
                  <button
                    className={`export-pill-btn ${imageScale === 2 ? 'active' : ''}`}
                    onClick={() => setImageScale(2)}
                  >
                    2x (High-Res / 4K)
                  </button>
                </div>
              </div>
            </div>

            <div className="export-section">
              <label className="export-check-item">
                <input
                  type="checkbox"
                  checked={includeBackground}
                  onChange={(e) => setIncludeBackground(e.target.checked)}
                />
                <span>Include Background in Image Export</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Native Lesson (.sbl) */}
        {activeTab === 'lesson' && (
          <div className="export-body-content">
            <div className="export-info-box">
              <div className="info-box-icon">💾</div>
              <div className="info-box-content">
                <h4>Native Editable SmartBoard Lesson (.sbl)</h4>
                <p>
                  Saves the entire lesson including all slides, vector strokes, editable shapes, text layers,
                  backgrounds, transitions, and metadata in a documented, versioned native format.
                </p>
                <p>Re-opening this file preserves full object interactivity and editing.</p>
              </div>
            </div>
            <div className="lesson-stats-card">
              <div><strong>Lesson Title:</strong> {docState.lesson.meta.title}</div>
              <div><strong>Subject:</strong> {docState.lesson.meta.subject || 'General'}</div>
              <div><strong>Total Slides:</strong> {docState.lesson.pages.length}</div>
              <div><strong>Schema Version:</strong> 1.0 (SmartBoard Native Format)</div>
            </div>
          </div>
        )}

        {/* Tab 4: CSV Data */}
        {activeTab === 'csv' && (
          <div className="export-body-content">
            <div className="export-info-box">
              <div className="info-box-icon">📊</div>
              <div className="info-box-content">
                <h4>Structured CSV Summary Report</h4>
                <p>
                  Exports slide indexes, titles, dimensions, background types, object counts, and text contents into a
                  structured CSV spreadsheet for lesson inventory and administrative tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isExporting && (
          <div className="export-progress-row">
            <div className="export-progress-track">
              <div className="export-progress-bar" style={{ width: `${exportProgress}%` }} />
            </div>
            <span className="export-progress-text">{exportProgress}%</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="export-modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>

          {activeTab === 'pdf' && (
            <button className="btn btn-primary export-action-btn" onClick={handleExportPdf} disabled={isExporting}>
              {isExporting ? 'Generating PDF...' : 'Export PDF Document'}
            </button>
          )}

          {activeTab === 'image' && (
            <button className="btn btn-primary export-action-btn" onClick={handleExportImage} disabled={isExporting}>
              {isExporting ? 'Exporting Image...' : `Export ${imageFormat.toUpperCase()} Image`}
            </button>
          )}

          {activeTab === 'lesson' && (
            <button className="btn btn-primary export-action-btn" onClick={handleExportLesson}>
              Download .sbl Lesson File
            </button>
          )}

          {activeTab === 'csv' && (
            <button className="btn btn-primary export-action-btn" onClick={handleExportCsv}>
              Download CSV Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
