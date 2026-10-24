/**
 * ScreenshotModal — Capture, preview, save, insert onto board, and copy to clipboard
 * Section 14 & 15: Screenshot capture & region selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { createImageObject } from '../services/documentImportService';
import { AreaScreenshotOverlay } from './AreaScreenshotOverlay';
import './ScreenshotModal.css';

interface ScreenshotModalProps {
  onClose: () => void;
  initialCapture?: string | null;
  /** Custom handler for inserting into board (used in desktop mode) */
  onInsertCustom?: (dataUrl: string) => void;
}

type CaptureMode = 'board' | 'fullscreen' | 'area';

export function ScreenshotModal({
  onClose,
  initialCapture,
  onInsertCustom,
}: ScreenshotModalProps): React.ReactElement {
  // App context might be absent if rendered in desktop overlay window
  const appContext = useAppContext?.();
  const docState = appContext?.docState;
  const docDispatch = appContext?.docDispatch;
  const setToastMessage = appContext?.setToastMessage;

  const [captureMode, setCaptureMode] = useState<CaptureMode>(initialCapture ? 'area' : 'board');
  const [dataUrl, setDataUrl] = useState<string | null>(initialCapture || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showAreaOverlay, setShowAreaOverlay] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'copied' | 'inserted' | 'error'>('idle');

  const capture = useCallback(async (mode: CaptureMode = captureMode) => {
    if (mode === 'area') {
      setShowAreaOverlay(true);
      return;
    }

    setIsCapturing(true);
    try {
      let url: string | null = null;
      if (mode === 'fullscreen' && window.electronAPI) {
        url = (await window.electronAPI.invoke('screenshot:captureScreen')) as string | null;
      }

      if (!url) {
        // Board mode or fallback: Merge visible whiteboard canvas layers
        const canvases = Array.from(
          document.querySelectorAll<HTMLCanvasElement>('.whiteboard-canvas-wrapper canvas')
        );

        if (canvases.length > 0) {
          const first = canvases[0];
          const merged = document.createElement('canvas');
          merged.width = first.width;
          merged.height = first.height;
          const ctx = merged.getContext('2d')!;

          canvases.forEach((c) => {
            try {
              ctx.drawImage(c, 0, 0);
            } catch {
              // Ignore tainted canvas if any
            }
          });

          url = merged.toDataURL('image/png');
        } else if (window.electronAPI) {
          url = (await window.electronAPI.invoke('screenshot:captureWindow')) as string | null;
        }
      }

      setDataUrl(url);
    } catch (err) {
      console.error('Screenshot capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [captureMode]);

  useEffect(() => {
    if (!initialCapture) {
      capture('board');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAreaCaptureComplete = (croppedUrl: string) => {
    setDataUrl(croppedUrl);
    setCaptureMode('area');
    setShowAreaOverlay(false);
  };

  const handleSave = useCallback(async () => {
    if (!dataUrl) return;
    setSaveStatus('saving');
    try {
      if (window.electronAPI) {
        const result = (await window.electronAPI.invoke('file:saveDialog', {
          title: 'Save Screenshot',
          defaultPath: `smartboard_screenshot_${Date.now()}.png`,
          filters: [{ name: 'PNG Image (*.png)', extensions: ['png'] }],
        })) as { filePath?: string } | null;

        if (result?.filePath) {
          await window.electronAPI.invoke('file:writeBinary', result.filePath, dataUrl);
          setSaveStatus('saved');
          setToastMessage?.(`Saved screenshot to ${result.filePath}`);
          setTimeout(() => setSaveStatus('idle'), 2200);
        } else {
          setSaveStatus('idle');
        }
      } else {
        // Web browser download fallback
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `smartboard_screenshot_${Date.now()}.png`;
        a.click();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2200);
      }
    } catch (err) {
      console.error('Save screenshot error:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [dataUrl, setToastMessage]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!dataUrl) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('clipboard:writeImage', dataUrl);
      }
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch {
        // Native electron IPC already handled it
      }
      setSaveStatus('copied');
      setToastMessage?.('Screenshot copied to clipboard!');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [dataUrl, setToastMessage]);

  const handleInsertOnBoard = useCallback(() => {
    if (!dataUrl) return;

    if (onInsertCustom) {
      onInsertCustom(dataUrl);
      setSaveStatus('inserted');
      setTimeout(onClose, 700);
      return;
    }

    if (window.electronAPI) {
      window.electronAPI.invoke('desktop:insertImage', dataUrl).catch(() => {});
    }

    if (docDispatch && docState) {
      const img = new Image();
      img.onload = () => {
        const imgObj = createImageObject(
          dataUrl,
          `Screenshot_${Date.now()}.png`,
          150,
          150,
          800,
          600,
          img.width || 800,
          img.height || 600
        );
        docDispatch({
          type: 'ADD_OBJECT',
          pageIndex: docState.currentPageIndex,
          object: imgObj,
        });
        setSaveStatus('inserted');
        setToastMessage?.('Inserted screenshot onto active whiteboard page!');
        setTimeout(onClose, 700);
      };
      img.src = dataUrl;
    } else {
      setSaveStatus('inserted');
      setTimeout(onClose, 700);
    }
  }, [dataUrl, onInsertCustom, docDispatch, docState, setToastMessage, onClose]);

  return (
    <>
      {showAreaOverlay && (
        <AreaScreenshotOverlay
          onCapture={handleAreaCaptureComplete}
          onClose={() => setShowAreaOverlay(false)}
        />
      )}

      <div className="screenshot-overlay" onClick={onClose}>
        <div className="screenshot-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="screenshot-header">
            <div className="screenshot-header-title">
              <span style={{ fontSize: 20 }}>📸</span>
              <h3>Screenshot Capture</h3>
            </div>
            <button className="screenshot-close" onClick={onClose} title="Close (Esc)">✕</button>
          </div>

          {/* Mode selector */}
          <div className="screenshot-mode-row">
            <button
              className={`screenshot-mode-btn ${captureMode === 'board' ? 'active' : ''}`}
              onClick={() => {
                setCaptureMode('board');
                capture('board');
              }}
            >
              🎨 Whiteboard Canvas
            </button>

            <button
              className={`screenshot-mode-btn ${captureMode === 'fullscreen' ? 'active' : ''}`}
              onClick={() => {
                setCaptureMode('fullscreen');
                capture('fullscreen');
              }}
            >
              🖥️ Full Display Screen
            </button>

            <button
              className={`screenshot-mode-btn ${captureMode === 'area' ? 'active' : ''}`}
              onClick={() => {
                setCaptureMode('area');
                setShowAreaOverlay(true);
              }}
              title="Click and drag to select a specific rectangular area"
            >
              📐 Select Specific Area
            </button>

            <button
              className="screenshot-capture-btn"
              onClick={() => capture(captureMode)}
              disabled={isCapturing}
            >
              {isCapturing ? '⏳ Capturing...' : '🔄 Retake'}
            </button>
          </div>

          {/* Preview image */}
          <div className="screenshot-preview-container">
            {isCapturing && (
              <div className="screenshot-loading">
                <div className="screenshot-spinner" />
                <span>Capturing image...</span>
              </div>
            )}
            {!isCapturing && dataUrl && (
              <img src={dataUrl} alt="Screenshot Preview" className="screenshot-img" />
            )}
            {!isCapturing && !dataUrl && (
              <div className="screenshot-empty">
                <span>⚠️ Could not capture screen image</span>
                <button className="screenshot-retry-btn" onClick={() => capture(captureMode)}>
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="screenshot-footer">
            <div className="screenshot-status-msg">
              {saveStatus === 'saving' && '💾 Saving to disk...'}
              {saveStatus === 'saved' && '✅ Saved successfully!'}
              {saveStatus === 'copied' && '📋 Copied to clipboard!'}
              {saveStatus === 'inserted' && '📌 Added to current whiteboard page!'}
              {saveStatus === 'error' && '❌ Operation failed. Please try again.'}
            </div>

            <div className="screenshot-action-btns">
              <button
                className="screenshot-btn"
                onClick={handleCopyToClipboard}
                disabled={!dataUrl || isCapturing}
                title="Copy to Windows Clipboard"
              >
                📋 Copy
              </button>
              <button
                className="screenshot-btn screenshot-btn-secondary"
                onClick={handleInsertOnBoard}
                disabled={!dataUrl || isCapturing}
                title="Insert image directly onto the whiteboard page"
              >
                📌 Insert on Board
              </button>
              <button
                className="screenshot-btn screenshot-btn-primary"
                onClick={handleSave}
                disabled={!dataUrl || isCapturing}
                title="Save PNG image file"
              >
                💾 Save PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
