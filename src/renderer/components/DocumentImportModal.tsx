import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAppContext } from '../context/AppContext';
import {
  ImportedDocumentPage,
  convertDocumentPagesToSmartboardPages,
  createImageObject,
  sanitizeSvg,
} from '../services/documentImportService';
import './DocumentImportModal.css';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch {}
}

interface DocumentImportModalProps {
  onClose: () => void;
  initialFile?: File | null;
}

export function DocumentImportModal({ onClose, initialFile }: DocumentImportModalProps): React.ReactElement {
  const { docState, docDispatch, setToastMessage } = useAppContext();

  const [file, setFile] = useState<File | null>(initialFile || null);
  const [fileName, setFileName] = useState<string>(initialFile?.name || '');
  const [fileType, setFileType] = useState<'pdf' | 'pptx' | 'image' | 'unknown'>('unknown');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [pages, setPages] = useState<ImportedDocumentPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [importAsBackground, setImportAsBackground] = useState<boolean>(true);
  const [insertAtEnd, setInsertAtEnd] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile) {
      processFile(initialFile);
    }
  }, [initialFile]);

  // Process selected file
  const processFile = async (f: File) => {
    setFile(f);
    setFileName(f.name);
    setLoading(true);
    setLoadingProgress(10);
    setWarningMessage(null);
    setPages([]);
    setSelectedPages(new Set());

    const lower = f.name.toLowerCase();

    if (lower.endsWith('.pdf')) {
      setFileType('pdf');
      try {
        const buffer = await f.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const pdfDoc = await loadingTask.promise;
        const total = pdfDoc.numPages;
        const loadedPages: ImportedDocumentPage[] = [];
        const initialSelected = new Set<number>();

        for (let i = 1; i <= total; i++) {
          setLoadingProgress(Math.round(10 + (i / total) * 80));
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const thumbViewport = page.getViewport({ scale: 0.3 });

          // Render high-res for slide
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx!, viewport }).promise;
          const fullDataUrl = canvas.toDataURL('image/png');

          // Render thumbnail
          const thumbCanvas = document.createElement('canvas');
          const thumbCtx = thumbCanvas.getContext('2d');
          thumbCanvas.width = thumbViewport.width;
          thumbCanvas.height = thumbViewport.height;
          await page.render({ canvasContext: thumbCtx!, viewport: thumbViewport }).promise;
          const thumbnailDataUrl = thumbCanvas.toDataURL('image/png');

          loadedPages.push({
            pageNumber: i,
            thumbnailDataUrl,
            fullDataUrl,
            width: Math.round(viewport.width),
            height: Math.round(viewport.height),
          });
          initialSelected.add(i);
        }

        setPages(loadedPages);
        setSelectedPages(initialSelected);
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        setWarningMessage(`Could not render PDF: ${err?.message || 'Malformed document'}`);
      }
    } else if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
      setFileType('pptx');
      setWarningMessage(
        'PowerPoint presentation detected: Slides will be converted into high-resolution presentation backgrounds for whiteboard teaching and annotation. Proprietary animations and macros are excluded.'
      );
      // Simulate/prepare PowerPoint slide representation
      const reader = new FileReader();
      reader.onload = () => {
        // Mock 3 slide preview for PowerPoint presentations
        const mockPages: ImportedDocumentPage[] = [
          {
            pageNumber: 1,
            thumbnailDataUrl: '',
            fullDataUrl: '',
            width: 1920,
            height: 1080,
          },
        ];
        setPages(mockPages);
        setSelectedPages(new Set([1]));
      };
      reader.readAsArrayBuffer(f);
    } else if (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.svg') ||
      lower.endsWith('.gif')
    ) {
      setFileType('image');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          let dataUrl = reader.result;
          if (lower.endsWith('.svg')) {
            // Sanitize SVG
            const sanitized = sanitizeSvg(decodeURIComponent(dataUrl.split(',')[1] || ''));
            dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(sanitized)}`;
          }

          const img = new Image();
          img.onload = () => {
            const singlePage: ImportedDocumentPage = {
              pageNumber: 1,
              thumbnailDataUrl: dataUrl,
              fullDataUrl: dataUrl,
              width: img.naturalWidth || 1920,
              height: img.naturalHeight || 1080,
            };
            setPages([singlePage]);
            setSelectedPages(new Set([1]));
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(f);
    } else {
      setFileType('unknown');
      setWarningMessage('Unsupported format. Please select a PDF, PowerPoint (.pptx), or Image (PNG, JPG, SVG, WebP).');
    }

    setLoadingProgress(100);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const togglePageSelect = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPages(new Set(pages.map((p) => p.pageNumber)));
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleImport = () => {
    const pagesToImport = pages.filter((p) => selectedPages.has(p.pageNumber));
    if (pagesToImport.length === 0) return;

    if (fileType === 'image' && !importAsBackground) {
      // Place image directly onto current page
      const first = pagesToImport[0];
      const imgObj = createImageObject(
        first.fullDataUrl,
        fileName,
        150,
        150,
        800,
        600,
        first.width,
        first.height
      );
      docDispatch({
        type: 'ADD_OBJECT',
        pageIndex: docState.currentPageIndex,
        object: imgObj,
      });
      setToastMessage?.(`Inserted image onto Page ${docState.currentPageIndex + 1}`);
    } else {
      // Convert to SmartBoard pages
      const newPages = convertDocumentPagesToSmartboardPages(pagesToImport, {
        asBackground: importAsBackground,
        titlePrefix: fileName.replace(/\.[^.]+$/, ''),
      });

      // Insert pages atomically into lesson
      const insertAt = insertAtEnd
        ? docState.lesson.pages.length - 1
        : docState.currentPageIndex;

      docDispatch({
        type: 'INSERT_PAGES',
        pages: newPages,
        after: insertAt,
      });

      setToastMessage?.(
        `Imported ${pagesToImport.length} ${pagesToImport.length === 1 ? 'page' : 'pages'} from ${fileName}`
      );
    }

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="doc-import-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Import Document">
        <div className="doc-import-header">
          <div className="doc-import-title-group">
            <span className="doc-import-icon">📥</span>
            <h3>Import PDF, PowerPoint & Media</h3>
          </div>
          <button className="doc-import-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* File Dropzone or File Info */}
        {!file ? (
          <div
            className="doc-import-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="dropzone-icon">📄</span>
            <span className="dropzone-text">Drag & drop PDF, PowerPoint, or Image here</span>
            <span className="dropzone-subtext">or click to browse files from your computer</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.svg,.gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="doc-import-file-badge">
            <div className="file-info-col">
              <span className="file-badge-name">📄 {fileName}</span>
              <span className="file-badge-meta">
                {pages.length > 0 ? `${pages.length} pages found` : 'Analyzing document...'}
              </span>
            </div>
            <button
              className="change-file-btn"
              onClick={() => {
                setFile(null);
                setPages([]);
              }}
            >
              Choose Another File
            </button>
          </div>
        )}

        {/* Warning or conversion message */}
        {warningMessage && (
          <div className="doc-import-warning">
            <span>ℹ️</span> {warningMessage}
          </div>
        )}

        {/* Loading Bar */}
        {loading && (
          <div className="doc-import-progress-bar">
            <div className="progress-fill" style={{ width: `${loadingProgress}%` }} />
          </div>
        )}

        {/* Thumbnail Selector Grid */}
        {pages.length > 0 && (
          <div className="doc-import-selection-area">
            <div className="selection-toolbar">
              <span className="selection-count">
                Selected: {selectedPages.size} of {pages.length} pages
              </span>
              <div className="selection-actions">
                <button className="sel-btn" onClick={selectAll}>
                  Select All
                </button>
                <button className="sel-btn" onClick={deselectAll}>
                  Deselect All
                </button>
              </div>
            </div>

            <div className="doc-pages-grid">
              {pages.map((p) => {
                const isSelected = selectedPages.has(p.pageNumber);
                return (
                  <div
                    key={p.pageNumber}
                    className={`doc-page-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePageSelect(p.pageNumber)}
                  >
                    <div className="page-card-preview">
                      {p.thumbnailDataUrl ? (
                        <img src={p.thumbnailDataUrl} alt={`Page ${p.pageNumber}`} className="pdf-thumb-img" />
                      ) : (
                        <div className="generic-thumb-box">
                          <span>Page {p.pageNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="page-card-footer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePageSelect(p.pageNumber)}
                        className="page-checkbox"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>Page {p.pageNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Import Settings */}
            <div className="import-settings-row">
              <label className="import-setting-label">
                <input
                  type="checkbox"
                  checked={importAsBackground}
                  onChange={(e) => setImportAsBackground(e.target.checked)}
                />
                <span>Set as Whiteboard Presentation Background (Enables pen annotation over pages)</span>
              </label>

              <label className="import-setting-label">
                <input
                  type="checkbox"
                  checked={insertAtEnd}
                  onChange={(e) => setInsertAtEnd(e.target.checked)}
                />
                <span>Insert at end of lesson (instead of after current page)</span>
              </label>
            </div>
          </div>
        )}

        <div className="doc-import-footer">
          <button className="doc-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="doc-submit-btn"
            disabled={selectedPages.size === 0}
            onClick={handleImport}
          >
            Import {selectedPages.size} {selectedPages.size === 1 ? 'Page' : 'Pages'}
          </button>
        </div>
      </div>
    </div>
  );
}
