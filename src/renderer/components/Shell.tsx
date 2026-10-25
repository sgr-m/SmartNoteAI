/**
 * Shell — Top-level application layout with bottom smartboard dock
 * Section 4.1 & 4.2 Main Sections & Presentation Workspace
 * Section 14 & 15: Milestone 4 — Presentations and desktop tools
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './TitleBar';
import { Toolbar } from './Toolbar';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { PagePanel } from './PagePanel';
import { StatusBar } from './StatusBar';
import { SubjectToolsModal } from './SubjectToolsModal';
import { ResourceLibraryModal } from './ResourceLibraryModal';
import { ClassroomActivitiesModal } from './ClassroomActivitiesModal';
import { RecentLessonsModal } from './RecentLessonsModal';
import { AIAssistantModal } from './AIAssistantModal';
import { RecordingStudioModal } from './RecordingStudioModal';
import { SettingsModal } from './SettingsModal';
import { BackgroundModal } from './BackgroundModal';
import { LayersModal } from './LayersModal';
import { PageTemplatesModal } from './PageTemplatesModal';
import { LessonMetadataModal } from './LessonMetadataModal';
import { CrashRecoveryBanner } from './CrashRecoveryBanner';
import { DocumentImportModal } from './DocumentImportModal';
import { ExportModal } from './ExportModal';
// ─── Milestone 4 — Presentation Tools ──────────────────────────────────
import { SpotlightOverlay } from './SpotlightOverlay';
import { ScreenVeilOverlay } from './ScreenVeilOverlay';
import { MagnifierOverlay } from './MagnifierOverlay';
import { DesktopAnnotationOverlay } from './DesktopAnnotationOverlay';
import { FloatingTimerWidget } from './FloatingTimerWidget';
import { ScreenshotModal } from './ScreenshotModal';
import { AreaScreenshotOverlay } from './AreaScreenshotOverlay';
import type { PresentationTool } from './PresentationFloatingToolbar';
import { createImageObject, sanitizeSvg } from '../services/documentImportService';
import { useAppContext } from '../context/AppContext';
import './Shell.css';

export function Shell(): React.ReactElement {
  const { docState, docDispatch, setToastMessage, setSelectedObject, setActiveTool } = useAppContext();
  const [showPagePanel, setShowPagePanel] = useState(false);

  // Section 4.2 Main Modals
  const [showSubjectTools, setShowSubjectTools] = useState(false);
  const [showResourceLibrary, setShowResourceLibrary] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [showRecentLessons, setShowRecentLessons] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showRecordingStudio, setShowRecordingStudio] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [showPageTemplates, setShowPageTemplates] = useState(false);
  const [showLessonMetadata, setShowLessonMetadata] = useState(false);
  const [showDocumentImport, setShowDocumentImport] = useState(false);
  const [importInitialFile, setImportInitialFile] = useState<File | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Presentation Mode (Full-screen teaching)
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // ─── Milestone 4: Presentation Tools State ─────────────────────────────────────
  const [activePresentationTool, setActivePresentationTool] = useState<PresentationTool | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [showAreaScreenshot, setShowAreaScreenshot] = useState(false);
  const [initialScreenshotCapture, setInitialScreenshotCapture] = useState<string | null>(null);

  const deactivatePresentationTool = useCallback(() => {
    setActivePresentationTool(null);
  }, []);

  const activatePresentationTool = useCallback((tool: PresentationTool) => {
    setActivePresentationTool((prev) => (prev === tool ? null : tool));
  }, []);

  const handleDesktop = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.invoke('window:showDesktop', { isPresentationMode });
    } else {
      window.blur();
    }
  }, [isPresentationMode]);

  const handleReturnToBoard = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.invoke('window:restore');
    } else {
      window.focus();
    }
  }, []);

  const handleScreenshot = useCallback(() => {
    setShowScreenshotModal(true);
  }, []);


  const togglePresentationMode = async (force?: boolean) => {
    let next: boolean;
    if (force !== undefined) {
      next = force;
    } else if (window.electronAPI) {
      try {
        const isNativeFullScreen = Boolean(await window.electronAPI.invoke('window:isFullScreen'));
        // If native window is not fullscreen, ensure single click enters fullscreen
        if (!isNativeFullScreen) {
          next = true;
        } else {
          next = !isPresentationMode;
        }
      } catch {
        next = !isPresentationMode;
      }
    } else {
      next = !isPresentationMode;
    }

    if (window.electronAPI) {
      try {
        const actual = await window.electronAPI.invoke('window:setFullScreen', next);
        setIsPresentationMode(Boolean(actual));
      } catch (err) {
        console.error('Failed to set fullscreen via IPC:', err);
        setIsPresentationMode(next);
      }
    } else {
      if (next) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      setIsPresentationMode(next);
    }
  };

  // Keyboard and menu listeners for presentation mode and page panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Dismiss active presentation tool first
        if (activePresentationTool) {
          setActivePresentationTool(null);
          return;
        }
        if (showPagePanel) {
          setShowPagePanel(false);
        } else if (isPresentationMode) {
          togglePresentationMode(false);
        }
      } else if (e.key === 'F11' || e.key === 'F5') {
        e.preventDefault();
        togglePresentationMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const unsubMenu = window.electronAPI?.on('menu:view:presentation', () => {
      togglePresentationMode();
    });

    const unsubAnnotation = window.electronAPI?.on('menu:tool:desktopannotation', () => {
      setActivePresentationTool((prev) => prev === 'annotation' ? null : 'annotation');
    });

    const unsubSpotlight = window.electronAPI?.on('menu:tool:spotlight', () => {
      setActivePresentationTool((prev) => prev === 'spotlight' ? null : 'spotlight');
    });

    const unsubDesktopInsert = window.electronAPI?.on('desktop:doInsertImage', (...args: unknown[]) => {
      const dataUrl = args[0] as string;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const imgObj = createImageObject(dataUrl, `Desktop_Snip_${Date.now()}.png`, 160, 160, 800, 600, img.width || 800, img.height || 600);
        docDispatch({ type: 'ADD_OBJECT', pageIndex: docState.currentPageIndex, object: imgObj });
        setSelectedObject(imgObj);
        setActiveTool('select');
        setToastMessage?.('Inserted desktop screenshot onto current page!');
      };
      img.src = dataUrl;
    });

      const unsubPresentationMode = window.electronAPI?.on('window:setPresentationMode', (...args: unknown[]) => {
        const mode = args[0] as boolean;
        setIsPresentationMode(Boolean(mode));
      });

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        unsubMenu?.();
        unsubAnnotation?.();
        unsubSpotlight?.();
        unsubDesktopInsert?.();
        unsubPresentationMode?.();
      };
    }, [isPresentationMode, showPagePanel, activePresentationTool, docState.currentPageIndex, docDispatch, setToastMessage, setSelectedObject, setActiveTool]);

  // Drag and drop from Windows File Explorer (Section 11 & 13)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const firstFile = files[0];
    const name = firstFile.name.toLowerCase();

    // 1. Native Lesson (.sbl)
    if (name.endsWith('.sbl')) {
      try {
        const text = await firstFile.text();
        const lesson = JSON.parse(text);
        if (lesson.id && lesson.pages) {
          docDispatch({ type: 'LOAD_LESSON', lesson });
          setToastMessage?.(`Opened lesson: ${lesson.meta?.title || firstFile.name}`);
          return;
        }
      } catch (err) {
        console.error('Failed to open dropped .sbl lesson:', err);
      }
    }

    // 2. PDF or PowerPoint
    if (name.endsWith('.pdf') || name.endsWith('.pptx') || name.endsWith('.ppt')) {
      setImportInitialFile(firstFile);
      setShowDocumentImport(true);
      return;
    }

    // 3. Images (PNG, JPG, SVG, WebP, GIF)
    if (/\.(png|jpe?g|svg|webp|gif)$/i.test(name)) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const cleanDataUrl = name.endsWith('.svg') ? sanitizeSvg(dataUrl) : dataUrl;
        const img = new Image();
        img.onload = () => {
          const imgObj = createImageObject(
            cleanDataUrl,
            firstFile.name,
            200,
            200,
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
          setSelectedObject(imgObj);
          setActiveTool('select');
          setToastMessage?.(`Imported image: ${firstFile.name}`);
        };
        img.src = cleanDataUrl;
      };
      if (name.endsWith('.svg')) {
        reader.readAsText(firstFile);
      } else {
        reader.readAsDataURL(firstFile);
      }
      return;
    }

    // Default: Open Document Import Modal
    setImportInitialFile(firstFile);
    setShowDocumentImport(true);
  };

  return (
    <div
      className="shell"
      data-theme="dark"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isPresentationMode && (
        <TitleBar title={docState.lesson.meta.title} isDirty={docState.isDirty} />
      )}

      <div className="shell-body">
        {/* Whiteboard Canvas fills the entire workspace */}
        <div className="shell-workspace">
          <WhiteboardCanvas />
          <CrashRecoveryBanner />

          {/* Windows Explorer Drag & Drop Overlay */}
          {isDragOver && (
            <div className="shell-drag-overlay">
              <div className="shell-drag-dialog">
                <span className="drag-icon">📂</span>
                <h3>Drop files into SmartNoteAI</h3>
                <p>Supports PDFs, PowerPoint slides (.pptx), Images (PNG, JPG, SVG), and Lessons (.sbl)</p>
              </div>
            </div>
          )}

          {/* Backdrop click to close drawer when tapping on whiteboard */}
          {showPagePanel && (
            <div
              className="page-drawer-backdrop"
              onClick={() => setShowPagePanel(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 160,
                bottom: 0,
                zIndex: 45,
                background: 'transparent',
              }}
            />
          )}

          {/* Slide-out Page Drawer */}
          {showPagePanel && (
            <div className="shell-slideout-drawer">
              <PagePanel
                onClose={() => setShowPagePanel(false)}
                onOpenTemplates={() => setShowPageTemplates(true)}
                onOpenMetadata={() => setShowLessonMetadata(true)}
              />
            </div>
          )}

          {/* Floating Status Bar */}
          {!isPresentationMode && <StatusBar />}

          {/* Bottom Docked Toolbar (Reference Image 1) */}
          <Toolbar
            onTogglePagePanel={() => setShowPagePanel((p) => !p)}
            onOpenSubjectTools={() => setShowSubjectTools(true)}
            onOpenResourceLibrary={() => setShowResourceLibrary(true)}
            onOpenActivities={() => setShowActivities(true)}
            onTogglePresentationMode={() => togglePresentationMode()}
            onOpenSettings={() => setShowSettings(true)}
            onOpenRecentLessons={() => setShowRecentLessons(true)}
            onOpenAIAssistant={() => setShowAIAssistant(true)}
            onOpenRecordingStudio={() => setShowRecordingStudio(true)}
            onOpenBackgroundModal={() => setShowBackgroundModal(true)}
            onOpenLayersModal={() => setShowLayersModal(true)}
            onOpenDocumentImport={() => {
              setImportInitialFile(null);
              setShowDocumentImport(true);
            }}
            onOpenExport={() => setShowExportModal(true)}
            onActivatePresentationTool={activatePresentationTool}
            activePresentationTool={activePresentationTool}
            onToggleTimer={() => setShowTimer((t) => !t)}
            onScreenshot={handleScreenshot}
            onDesktop={handleDesktop}
            onReturnToBoard={handleReturnToBoard}
            isPresentationMode={isPresentationMode}
          />

          {/* ─── Milestone 4: Presentation Overlays ───────────────────────────── */}

          {/* Spotlight */}
          {activePresentationTool === 'spotlight' && (
            <SpotlightOverlay onClose={deactivatePresentationTool} />
          )}

          {/* Screen Veil */}
          {activePresentationTool === 'veil' && (
            <ScreenVeilOverlay onClose={deactivatePresentationTool} />
          )}

          {/* Magnifier */}
          {activePresentationTool === 'magnifier' && (
            <MagnifierOverlay onClose={deactivatePresentationTool} />
          )}

          {/* Desktop Annotation */}
          {activePresentationTool === 'annotation' && (
            <DesktopAnnotationOverlay onClose={deactivatePresentationTool} />
          )}

          {/* Floating Timer Widget */}
          {showTimer && (
            <FloatingTimerWidget onClose={() => setShowTimer(false)} />
          )}

        </div>
      </div>

      {/* 4.2 Main Section Dialogs */}
      {showSubjectTools && <SubjectToolsModal onClose={() => setShowSubjectTools(false)} />}
      {showResourceLibrary && <ResourceLibraryModal onClose={() => setShowResourceLibrary(false)} />}
      {showActivities && <ClassroomActivitiesModal onClose={() => setShowActivities(false)} />}
      {showRecentLessons && <RecentLessonsModal onClose={() => setShowRecentLessons(false)} />}
      {showAIAssistant && <AIAssistantModal onClose={() => setShowAIAssistant(false)} />}
      {showRecordingStudio && <RecordingStudioModal onClose={() => setShowRecordingStudio(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showBackgroundModal && <BackgroundModal onClose={() => setShowBackgroundModal(false)} />}
      {showLayersModal && <LayersModal onClose={() => setShowLayersModal(false)} />}
      {showPageTemplates && <PageTemplatesModal onClose={() => setShowPageTemplates(false)} />}
      {showLessonMetadata && <LessonMetadataModal onClose={() => setShowLessonMetadata(false)} />}
      {showDocumentImport && (
        <DocumentImportModal
          initialFile={importInitialFile}
          onClose={() => {
            setShowDocumentImport(false);
            setImportInitialFile(null);
          }}
        />
      )}
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}

      {/* Milestone 4: Interactive Area Snip Tool */}
      {showAreaScreenshot && (
        <AreaScreenshotOverlay
          onCapture={(croppedUrl) => {
            setShowAreaScreenshot(false);
            setInitialScreenshotCapture(croppedUrl);
            setShowScreenshotModal(true);
          }}
          onClose={() => setShowAreaScreenshot(false)}
        />
      )}

      {/* Milestone 4: Screenshot Modal */}
      {showScreenshotModal && (
        <ScreenshotModal
          initialCapture={initialScreenshotCapture}
          onClose={() => {
            setShowScreenshotModal(false);
            setInitialScreenshotCapture(null);
          }}
        />
      )}
    </div>
  );
}

