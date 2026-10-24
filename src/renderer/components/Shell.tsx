/**
 * Shell — Top-level application layout with bottom smartboard dock
 * Section 4.1 & 4.2 Main Sections & Presentation Workspace
 */

import React, { useState, useEffect } from 'react';
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
import { createImageObject, sanitizeSvg } from '../services/documentImportService';
import { useAppContext } from '../context/AppContext';
import './Shell.css';

export function Shell(): React.ReactElement {
  const { docState, docDispatch, setToastMessage } = useAppContext();
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

  const togglePresentationMode = async (force?: boolean) => {
    const next = force !== undefined ? force : !isPresentationMode;
    setIsPresentationMode(next);
    if (window.electronAPI) {
      try {
        await window.electronAPI.invoke('window:setFullScreen', next);
      } catch (err) {
        console.error('Failed to set fullscreen via IPC:', err);
      }
    } else {
      if (next) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  // Keyboard and menu listeners for presentation mode and page panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubMenu?.();
    };
  }, [isPresentationMode, showPagePanel]);

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
                <h3>Drop files into SmartBoard Studio</h3>
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
          />
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
    </div>
  );
}
