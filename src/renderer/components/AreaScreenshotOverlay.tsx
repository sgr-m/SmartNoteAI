/**
 * AreaScreenshotOverlay — Interactive rectangle selection for partial screen capture
 * Section 14 & 15: Screenshot capture & region selection
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AreaScreenshotOverlay.css';

interface AreaScreenshotOverlayProps {
  onCapture: (croppedDataUrl: string) => void;
  onClose: () => void;
  /** Pre-captured full display / board image data URL */
  sourceImage?: string | null;
}

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function AreaScreenshotOverlay({
  onCapture,
  onClose,
  sourceImage,
}: AreaScreenshotOverlayProps): React.ReactElement {
  const [fullDataUrl, setFullDataUrl] = useState<string | null>(sourceImage || null);
  const [isCapturingSource, setIsCapturingSource] = useState(!sourceImage);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Capture full screen on mount if sourceImage wasn't provided
  useEffect(() => {
    if (sourceImage) return;

    let mounted = true;
    (async () => {
      setIsCapturingSource(true);
      try {
        let url: string | null = null;
        if (window.electronAPI) {
          url = (await window.electronAPI.invoke('screenshot:captureScreen')) as string | null;
        }

        if (!url) {
          // Fallback: merge all visible whiteboard canvases
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
              try { ctx.drawImage(c, 0, 0); } catch { /* ignore */ }
            });
            url = merged.toDataURL('image/png');
          } else if (window.electronAPI) {
            url = (await window.electronAPI.invoke('screenshot:captureWindow')) as string | null;
          }
        }

        if (mounted && url) {
          setFullDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to capture initial source screen for area crop:', err);
      } finally {
        if (mounted) setIsCapturingSource(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sourceImage]);

  // Cancel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    setSelection({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !selection) return;
    setSelection((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
  };

  const cropImage = useCallback(
    (box: SelectionBox) => {
      if (!fullDataUrl) {
        onClose();
        return;
      }

      const x = Math.min(box.startX, box.currentX);
      const y = Math.min(box.startY, box.currentY);
      const width = Math.abs(box.currentX - box.startX);
      const height = Math.abs(box.currentY - box.startY);

      if (width < 12 || height < 12) {
        // Selection too small, cancel
        setSelection(null);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const scaleX = img.naturalWidth / window.innerWidth;
        const scaleY = img.naturalHeight / window.innerHeight;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width * scaleX;
        cropCanvas.height = height * scaleY;

        const ctx = cropCanvas.getContext('2d');
        if (!ctx) {
          onClose();
          return;
        }

        ctx.drawImage(
          img,
          x * scaleX,
          y * scaleY,
          width * scaleX,
          height * scaleY,
          0,
          0,
          cropCanvas.width,
          cropCanvas.height
        );

        const croppedUrl = cropCanvas.toDataURL('image/png');
        onCapture(croppedUrl);
      };
      img.src = fullDataUrl;
    },
    [fullDataUrl, onCapture, onClose]
  );

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (selection) {
      cropImage(selection);
    }
  };

  // Compute selection coordinates for rendering
  let boxStyle: React.CSSProperties | null = null;
  let width = 0;
  let height = 0;

  if (selection) {
    const x = Math.min(selection.startX, selection.currentX);
    const y = Math.min(selection.startY, selection.currentY);
    width = Math.abs(selection.currentX - selection.startX);
    height = Math.abs(selection.currentY - selection.startY);

    boxStyle = {
      left: x,
      top: y,
      width,
      height,
    };
  }

  return (
    <div
      ref={containerRef}
      className="area-screenshot-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Dimmed backdrop */}
      <div className="area-screenshot-veil" />

      {/* Guide hint at top */}
      <div className="area-screenshot-hint">
        <span>📐 Drag to select screenshot area &bull; Press <b>Esc</b> to cancel</span>
        <button className="area-screenshot-cancel-btn" onClick={onClose} title="Cancel (Esc)">
          ✕ Cancel
        </button>
      </div>

      {/* Selected rectangular region */}
      {boxStyle && (
        <div className="area-screenshot-box" style={boxStyle}>
          {/* Animated border guides */}
          <div className="area-box-border" />

          {/* Size badge */}
          <div className="area-size-badge">
            {width} &times; {height} px
          </div>
        </div>
      )}

      {isCapturingSource && (
        <div className="area-screenshot-loading">
          <div className="area-spinner" />
          <span>Preparing screen capture...</span>
        </div>
      )}
    </div>
  );
}
