/**
 * Shell — Top-level application layout with bottom smartboard dock
 * Section 4.1 & 4.2 Main Sections & Presentation Workspace
 * Section 14 & 15: Milestone 4 — Presentations and desktop tools
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TitleBar } from './TitleBar';
import { Toolbar } from './Toolbar';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { PagePanel } from './PagePanel';
import { SlideGridViewModal } from './SlideGridViewModal';
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
import { AIChatSidePanel } from './aiChat/AIChatSidePanel';
import { WebBrowserModal } from './browser/WebBrowserModal';
import { VectorDiagramModal } from './vectorDiagram/VectorDiagramModal';
import type { TextObject, ImageObject } from '../../shared/types';
import { isLatexSyntax, isPureLatexFormula, measureLatexSize } from '../services/latexService';
import {
  DiagramType,
  detectDiagramType,
  renderDiagramToSvg,
  diagramSvgToDataUrl,
  isSupportedDiagramCode,
} from '../services/vectorDiagramService';
import { measureMarkdownSize } from '../services/markdownRenderService';
import { normalizeGeneratedHtml } from '../services/htmlRenderService';
import { detectTextFormatMode } from '../services/formatDetectionService';
import { createImageObject, sanitizeSvg } from '../services/documentImportService';
import { isTypingOrInputFocused } from '../utils/keyboardUtils';
import { enhanceSlideContent, enhanceSlideContentWithAI } from '../services/boardEnhanceService';
import { deserializeLesson } from '../store/documentStore';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../context/AppContext';
import './Shell.css';

export function Shell(): React.ReactElement {
  const { docState, docDispatch, setToastMessage, setSelectedObject, setActiveTool, toolState, commandSystem } = useAppContext();
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [showSlideGridView, setShowSlideGridView] = useState(false);

  // Slide Drawer width & interactive drag-to-resize (persisted in localStorage)
  const [pageDrawerWidth, setPageDrawerWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('smartboard_page_drawer_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 260 && parsed <= 850) {
          return parsed;
        }
      }
    } catch {}
    return 360;
  });

  const isResizingDrawer = useRef<boolean>(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const handleDrawerResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    isResizingDrawer.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = pageDrawerWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDrawerResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingDrawer.current) return;
    const deltaX = resizeStartX.current - e.clientX;
    const maxWidth = Math.min(850, Math.round(window.innerWidth * 0.7));
    const newWidth = Math.max(260, Math.min(maxWidth, resizeStartWidth.current + deltaX));
    setPageDrawerWidth(newWidth);
  };

  const handleDrawerResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingDrawer.current) return;
    isResizingDrawer.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try {
      localStorage.setItem('smartboard_page_drawer_width', String(pageDrawerWidth));
    } catch {}
  };

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
  const [showVectorDiagramModal, setShowVectorDiagramModal] = useState(false);
  const [vectorDiagramInitialCode, setVectorDiagramInitialCode] = useState<string | undefined>(undefined);
  const [browserInitialUrl, setBrowserInitialUrl] = useState<string | null>(null);
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

  // ─── Browser & AI Chat Assistant State & Callbacks ─────────────────────────
  const [showBrowser, setShowBrowser] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [askAiInitialQuery, setAskAiInitialQuery] = useState<string | null>(null);
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [aiEnhanceStepText, setAiEnhanceStepText] = useState('');
  const [chatWidth, setChatWidth] = useState<number>(() => {
    const maxAllowed = Math.floor(window.innerWidth * 0.40);
    const saved = parseInt(localStorage.getItem('smartboard_aichat_width') || '420', 10);
    return Math.max(320, Math.min(maxAllowed, isNaN(saved) ? 420 : saved));
  });

  const handleChatWidthChange = useCallback((newWidth: number) => {
    const maxAllowed = Math.floor(window.innerWidth * 0.40);
    const clamped = Math.max(320, Math.min(maxAllowed, newWidth));
    setChatWidth(clamped);
    try {
      localStorage.setItem('smartboard_aichat_width', String(clamped));
    } catch {}
  }, []);

  const handleToggleAIChat = useCallback(() => {
    setShowAIChat((prev) => !prev);
  }, []);

  const handleAskAI = useCallback((text: string) => {
    setShowAIChat(true);
    setAskAiInitialQuery(text);
  }, []);

  // Window event listener for canvas quick Ask AI buttons
  useEffect(() => {
    const onAskAiEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      if (customEvent.detail?.query) {
        handleAskAI(customEvent.detail.query);
      }
    };
    window.addEventListener('smartboard:ask-ai', onAskAiEvent);
    return () => {
      window.removeEventListener('smartboard:ask-ai', onAskAiEvent);
    };
  }, [handleAskAI]);

  // 1-Click AI Enhance Handler with Progressive Visual Feedback and Zero-Overlap Reflow
  const handleEnhanceSlide = useCallback(async () => {
    const pageIndex = docState.currentPageIndex;
    const page = docState.lesson?.pages[pageIndex];
    if (!page) return;

    if (!page.objects || page.objects.length === 0) {
      setToastMessage('No content on the current slide to enhance. Add or drag text onto the board first!');
      return;
    }

    const previousObjects = [...page.objects];
    const previousBackground = page.background ? { ...page.background } : undefined;

    setIsAiEnhancing(true);
    setAiEnhanceStepText('✨ Connecting to AI Presentation Designer...');

    try {
      const enhanceRes = await enhanceSlideContentWithAI({
        page,
        onStepProgress: (step) => {
          setAiEnhanceStepText(step.statusText);
          if (step.newBackground) {
            docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex, background: step.newBackground });
          }
          docDispatch({
            type: 'REORDER_OBJECTS',
            pageIndex,
            objects: step.objects,
          });
        },
      });

      if (!enhanceRes.success) {
        setToastMessage(enhanceRes.message);
        setIsAiEnhancing(false);
        setAiEnhanceStepText('');
        return;
      }

      // Progressive Generation execution with smooth step animation
      for (const step of enhanceRes.steps) {
        setAiEnhanceStepText(step.statusText);
        if (step.newBackground) {
          docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex, background: step.newBackground });
        }
        docDispatch({
          type: 'REORDER_OBJECTS',
          pageIndex,
          objects: step.objects,
        });
        await new Promise((r) => setTimeout(r, 220));
      }

      // Register a single unified command in commandSystem for seamless Ctrl+Z Undo
      commandSystem.execute({
        id: uuidv4(),
        description: 'AI Board Enhancement & Non-Overlapping Alignment',
        execute() {
          if (enhanceRes.newBackground) {
            docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex, background: enhanceRes.newBackground });
          }
          docDispatch({
            type: 'REORDER_OBJECTS',
            pageIndex,
            objects: enhanceRes.enhancedObjects,
          });
        },
        undo() {
          if (previousBackground) {
            docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex, background: previousBackground });
          }
          docDispatch({
            type: 'REORDER_OBJECTS',
            pageIndex,
            objects: previousObjects,
          });
        },
      });

      setAiEnhanceStepText('🎉 Slide Beautifully Enhanced & Aligned!');
      setToastMessage(enhanceRes.message);
    } catch (err) {
      console.error('AI Enhance Slide error:', err);
      setToastMessage('Failed to enhance slide. Please try again.');
    } finally {
      setTimeout(() => {
        setIsAiEnhancing(false);
        setAiEnhanceStepText('');
      }, 1200);
    }
  }, [docState.currentPageIndex, docState.lesson, docDispatch, commandSystem, setToastMessage]);

  // Window event listener for 1-Click AI Enhance
  useEffect(() => {
    const onEnhanceEvent = () => {
      handleEnhanceSlide();
    };
    window.addEventListener('smartboard:enhance-slide', onEnhanceEvent);
    return () => {
      window.removeEventListener('smartboard:enhance-slide', onEnhanceEvent);
    };
  }, [handleEnhanceSlide]);

  const handleInsertVectorDiagram = useCallback((svg: string, code: string, type: DiagramType) => {
    const pageIndex = docState.currentPageIndex;
    const page = docState.lesson?.pages[pageIndex];
    if (!page) return;

    const dataUrl = diagramSvgToDataUrl(svg);
    let width = 640;
    let height = 400;
    const vbMatch = svg.match(/viewBox="([^"]+)"/i);
    const wMatch = svg.match(/<svg[^>]*\bwidth="([\d.]+)"/i);
    const hMatch = svg.match(/<svg[^>]*\bheight="([\d.]+)"/i);
    if (wMatch && hMatch) {
      width = Math.max(120, Math.round(parseFloat(wMatch[1])));
      height = Math.max(80, Math.round(parseFloat(hMatch[1])));
    } else if (vbMatch) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        width = Math.max(120, Math.round(parts[2]));
        height = Math.max(80, Math.round(parts[3]));
      }
    }

    const canvasW = 1920;
    const canvasH = 1080;
    const posX = Math.max(60, Math.round((canvasW - width) / 2));
    const posY = Math.max(60, Math.round((canvasH - height) / 2));

    const newDiagramObj: ImageObject = {
      id: `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'image',
      x: posX,
      y: posY,
      width,
      height,
      rotation: 0,
      filePath: '',
      dataUrl,
      opacity: 1,
      locked: false,
      visible: true,
      layerId: 'objects',
      isDiagram: true,
      diagramCode: code,
      diagramType: type,
    };

    docDispatch({
      type: 'ADD_OBJECT',
      pageIndex,
      object: newDiagramObj,
    });
    setSelectedObject(newDiagramObj);
    setActiveTool('select');
    setToastMessage('Inserted vector diagram onto SmartBoard!');
  }, [docState.currentPageIndex, docState.lesson, docDispatch, setSelectedObject, setActiveTool, setToastMessage]);

  const handleInsertChatContentToBoard = useCallback((content: string, _title?: string, targetPos?: { x: number; y: number }, isFormulaHint?: boolean) => {
    const pageIndex = docState.currentPageIndex;
    const page = docState.lesson?.pages[pageIndex];
    if (!page) return;

    // Use exact clean content directly — NEVER prepend synthetic headings or duplicate titles!
    const rawContent = content.trim();
    const objectCount = page.objects.length;
    let posX = targetPos?.x ?? (100 + (objectCount % 6) * 40);
    let posY = targetPos?.y ?? (120 + (objectCount % 6) * 40);

    const canvasW = 1920;
    const canvasH = 1080;

    // Target an active unlocked layer ('objects' or 'drawing') so dropped elements are NEVER locked
    const unlockedLayerId =
      page.layers?.find((l) => !l.locked && (l.id === 'objects' || l.id === 'drawing'))?.id ||
      page.layers?.find((l) => !l.locked)?.id ||
      'objects';

    // 1. Check if this content is a Code-to-Vector diagram (Mermaid, Graph, Geometry, Circuit, Timing, Chart, TikZ)
    const trimmed = rawContent.trim();
    const isDiagramCode = isSupportedDiagramCode(trimmed);

    if (isDiagramCode) {
      const diagType = detectDiagramType(rawContent);
      renderDiagramToSvg(rawContent, diagType).then((res) => {
        const svg = res.svg;
        const dataUrl = diagramSvgToDataUrl(svg);
        const width = res.width || 640;
        const height = res.height || 400;

        const newDiagramObj: ImageObject = {
          id: `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'image',
          x: posX,
          y: posY,
          width,
          height,
          rotation: 0,
          filePath: '',
          dataUrl,
          opacity: 1,
          locked: false,
          visible: true,
          layerId: unlockedLayerId,
          isDiagram: true,
          diagramCode: rawContent,
          diagramType: diagType,
        };
        docDispatch({ type: 'ADD_OBJECT', pageIndex, object: newDiagramObj });
        setSelectedObject(newDiagramObj);
        setActiveTool('select');
        setToastMessage('Inserted vector diagram onto SmartBoard!');
      }).catch(err => {
        console.error('Failed to render dropped diagram:', err);
      });
      return;
    }

    // 2. Check if this segment is a pure LaTeX mathematical formula
    const isPure = isPureLatexFormula(rawContent);
    const isFormula =
      isPure &&
      (Boolean(isFormulaHint) ||
        (rawContent.startsWith('$$') && rawContent.endsWith('$$') && !rawContent.includes('\n\n')) ||
        (rawContent.startsWith('\\[') && rawContent.endsWith('\\]')) ||
        isPure);

    let cleanFormula = rawContent;
    if (isFormula) {
      cleanFormula = cleanFormula.replace(/^\$\$|\$\$$/g, '').replace(/^\\\[|\\\]$/g, '').trim();
    }

    let targetW: number;
    let targetH: number;

    if (isFormula) {
      const fontSize = 36;
      const measured = measureLatexSize(cleanFormula, fontSize);
      targetW = Math.max(180, Math.min(1600, measured.width + 40));
      targetH = Math.max(60, Math.min(600, measured.height + 24));
    } else {
      const fontSize = 36;
      const maxTextW = Math.max(480, canvasW - posX - 60);
      const measured = measureMarkdownSize(rawContent, fontSize, 'Inter, sans-serif', maxTextW);
      targetW = Math.min(maxTextW, measured.width);
      targetH = measured.height;
    }

    // Ensure element stays reasonably within bounds
    if (!targetPos) {
      if (posX + targetW > canvasW - 40) {
        posX = Math.max(40, canvasW - targetW - 40);
      }
      if (posY + targetH > canvasH - 40) {
        posY = Math.max(40, canvasH - targetH - 40);
      }
    } else {
      posX = Math.max(0, posX);
      posY = Math.max(0, posY);
    }

    const mode = isFormula
      ? { isHtml: false, isLatex: true, isMarkdown: false }
      : detectTextFormatMode(rawContent);
    const finalContent = isFormula
      ? cleanFormula
      : mode.isHtml
      ? normalizeGeneratedHtml(rawContent)
      : rawContent;

    const newTextObj: TextObject = {
      id: `ai-chat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'text',
      x: posX,
      y: posY,
      width: targetW,
      height: targetH,
      content: finalContent,
      fontFamily: isFormula ? "KaTeX_Main, 'Cambria Math', serif" : 'Inter, sans-serif',
      fontSize: 36,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: isFormula ? 'center' : 'left',
      color: '#ffffff',
      backgroundColor: 'transparent',
      opacity: 1,
      rotation: 0,
      preset: isFormula ? 'formula' : 'body',
      locked: false,
      visible: true,
      layerId: unlockedLayerId,
      isLatex: mode.isLatex,
      isHtml: mode.isHtml,
      isMarkdown: mode.isMarkdown,
    };

    docDispatch({
      type: 'ADD_OBJECT',
      pageIndex,
      object: newTextObj,
    });

    setSelectedObject(newTextObj);
    setActiveTool('select');
    setToastMessage(isFormula ? '📐 Math Formula placed on board!' : '✨ Lesson notes placed on board!');
  }, [docState.currentPageIndex, docState.lesson?.pages, docDispatch, setSelectedObject, setActiveTool, setToastMessage]);

  const handleInsertImageToBoard = useCallback((dataUrl: string, title?: string, targetPos?: { x: number; y: number }) => {
    const pageIndex = docState.currentPageIndex;
    const page = docState.lesson?.pages[pageIndex];
    if (!page) return;

    const img = new Image();
    img.onload = () => {
      const naturalW = img.width || 800;
      const naturalH = img.height || 600;
      const aspect = naturalW / naturalH;
      const maxW = 750;
      const maxH = 500;
      let displayW = maxW;
      let displayH = maxW / aspect;
      if (displayH > maxH) {
        displayH = maxH;
        displayW = maxH * aspect;
      }

      const posX = targetPos ? Math.max(0, Math.round(targetPos.x - displayW / 2)) : 180;
      const posY = targetPos ? Math.max(0, Math.round(targetPos.y - displayH / 2)) : 140;

      const imgObj = createImageObject(
        dataUrl,
        title || `Web_Capture_${Date.now()}.png`,
        posX,
        posY,
        Math.round(displayW),
        Math.round(displayH),
        naturalW,
        naturalH
      );

      docDispatch({
        type: 'ADD_OBJECT',
        pageIndex,
        object: imgObj,
      });

      setSelectedObject(imgObj);
      setActiveTool('select');
      setToastMessage('🌐 Web image inserted onto whiteboard slide!');
    };
    img.src = dataUrl;
  }, [docState.currentPageIndex, docState.lesson?.pages, docDispatch, setSelectedObject, setActiveTool, setToastMessage]);

  const handleInsertRemoteImageToBoard = useCallback(async (imageUrl: string, title?: string, targetPos?: { x: number; y: number }) => {
    const cleanUrl = (imageUrl || '').trim();
    if (!cleanUrl) return;
    if (cleanUrl.startsWith('data:image/')) {
      handleInsertImageToBoard(cleanUrl, title, targetPos);
      return;
    }

    setToastMessage('⬇️ Downloading image to SmartBoard...');
    try {
      if (window.electronAPI?.invoke) {
        const res = (await window.electronAPI.invoke('net:fetchImageAsDataUrl', cleanUrl)) as {
          success: boolean;
          dataUrl?: string;
          error?: string;
        };
        if (res?.success && res.dataUrl) {
          handleInsertImageToBoard(res.dataUrl, title, targetPos);
          return;
        }
        setToastMessage(`⚠️ Could not download image: ${res?.error || 'Remote server blocked fetch'}`);
        return;
      }
      handleInsertImageToBoard(cleanUrl, title, targetPos);
    } catch (err) {
      setToastMessage(`⚠️ Image download failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [handleInsertImageToBoard, setToastMessage]);

  const handleOpenUrlInBrowser = useCallback((url: string) => {
    if (!url || !url.trim()) return;
    setBrowserInitialUrl(url.trim());
    setShowBrowser(true);
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
      if (isTypingOrInputFocused(e)) return;

      if (e.key === 'Escape') {
        // Dismiss active presentation tool first
        if (activePresentationTool) {
          setActivePresentationTool(null);
          return;
        }
        if (showAIChat) {
          setShowAIChat(false);
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
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'B' || e.key === 'b') {
          e.preventDefault();
          setShowBrowser((prev) => !prev);
        } else if (e.key === 'C' || e.key === 'c' || e.key === 'A' || e.key === 'a') {
          e.preventDefault();
          handleToggleAIChat();
        }
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

    const unsubBrowser = window.electronAPI?.on('menu:tool:browser', () => {
      setShowBrowser((prev) => !prev);
    });

    const unsubAIChat = window.electronAPI?.on('menu:tool:aichat', () => {
      handleToggleAIChat();
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
        unsubBrowser?.();
        unsubAIChat?.();
        unsubDesktopInsert?.();
        unsubPresentationMode?.();
      };
    }, [
      isPresentationMode,
      showPagePanel,
      activePresentationTool,
      docState.currentPageIndex,
      docDispatch,
      setToastMessage,
      setSelectedObject,
      setActiveTool,
    ]);

  // Drag and drop from AI Chat or Windows File Explorer (Section 11 & 13)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only display file drop backdrop if OS files are dragged
    const hasFiles = Array.from(e.dataTransfer.types || []).includes('Files');
    if (hasFiles && !isDragOver) setIsDragOver(true);
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

    const getCanvasDropPoint = (): { x: number; y: number } => {
      const canvas = (document.querySelector('.active-canvas') ||
                      document.querySelector('.whiteboard-canvas') ||
                      document.querySelector('.whiteboard-canvas-wrapper')) as HTMLElement | null;
      if (!canvas) return { x: 180, y: 160 };
      const rect = canvas.getBoundingClientRect();
      const z = toolState?.zoom || 1;
      const px = toolState?.panX || 0;
      const py = toolState?.panY || 0;
      return {
        x: Math.round((e.clientX - rect.left) / z - px),
        y: Math.round((e.clientY - rect.top) / z - py),
      };
    };

    // 0. Check for dragged remote/web image from AI Chat or Web Browser
    const smartImageRaw = e.dataTransfer.getData('application/x-smartboard-image');
    if (smartImageRaw) {
      try {
        const parsed = JSON.parse(smartImageRaw);
        if (parsed?.imageUrl) {
          await handleInsertRemoteImageToBoard(parsed.imageUrl, parsed.title, getCanvasDropPoint());
          return;
        }
      } catch {
        // continue checking other payload formats
      }
    }

    // 1. Check for Drag-and-Drop from AI Teaching Assistant Chatbox
    const chatDataRaw = e.dataTransfer.getData('application/x-smartboard-chat');
    const plainText = e.dataTransfer.getData('text/plain');
    if (chatDataRaw || (plainText && e.dataTransfer.files.length === 0)) {
      let content = plainText;
      let title: string | undefined = undefined;
      let isFormulaHint = false;
      if (chatDataRaw) {
        try {
          const parsed = JSON.parse(chatDataRaw);
          if (parsed?.isImage && parsed?.imageUrl) {
            await handleInsertRemoteImageToBoard(parsed.imageUrl, parsed.title, getCanvasDropPoint());
            return;
          }
          content = parsed.text || content;
          title = parsed.title;
          isFormulaHint = Boolean(parsed.isFormula);
        } catch {
          // ignore
        }
      }
      // Also detect direct dragged image URLs or dragged <img src="https://...">
      const uriList = e.dataTransfer.getData('text/uri-list')?.trim();
      const htmlData = e.dataTransfer.getData('text/html') || '';
      const imgSrcMatch = htmlData.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
      const urlCandidate = uriList?.split('\n').find((u) => /^https?:\/\//i.test(u.trim())) || (/^https?:\/\/\S+\.(?:png|jpe?g|webp|gif|svg)(?:\?\S*)?$/i.test((content || '').trim()) ? content.trim() : '') || imgSrcMatch?.[1] || '';
      if (urlCandidate && !chatDataRaw) {
        await handleInsertRemoteImageToBoard(urlCandidate, title, getCanvasDropPoint());
        return;
      }

      if (content && content.trim()) {
        handleInsertChatContentToBoard(content, title, getCanvasDropPoint(), isFormulaHint);
        return;
      }
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const firstFile = files[0];
    const name = firstFile.name.toLowerCase();

    // 1. Native Lesson (.sbl)
    if (name.endsWith('.sbl')) {
      try {
        const text = await firstFile.text();
        const lesson = deserializeLesson(text);
        docDispatch({ type: 'LOAD_LESSON', lesson });
        const nativePath = (firstFile as File & { path?: string }).path;
        if (nativePath) {
          docDispatch({ type: 'SET_CLEAN', savedPath: nativePath });
        }
        commandSystem.clear();
        setToastMessage?.(`Opened lesson: ${lesson.meta?.title || firstFile.name}`);
        return;
      } catch (err) {
        console.error('Failed to open dropped .sbl lesson:', err);
        setToastMessage?.('Failed to open .sbl lesson file.');
        return;
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
        {/* Whiteboard Canvas fills the workspace (shrinks when chat is open, preserving aspect ratio) */}
        <div
          className={`shell-workspace ${showAIChat ? 'chat-open' : ''}`}
          style={{
            backgroundColor: docState.lesson.pages[docState.currentPageIndex]?.background?.color || '#1b4332',
            ...(showAIChat
              ? {
                  width: `calc(100% - ${chatWidth}px)`,
                  maxWidth: `calc(100% - ${chatWidth}px)`,
                  flex: `0 0 calc(100% - ${chatWidth}px)`,
                }
              : {}),
          }}
        >
          <WhiteboardCanvas onAskAI={handleAskAI} onEnhanceBoard={handleEnhanceSlide} />
          <CrashRecoveryBanner />

          {/* AI 1-Click Progressive Enhancement Live HUD Banner */}
          {isAiEnhancing && (
            <div className="canvas-ai-enhance-hud" role="status" aria-live="polite">
              <div className="enhance-hud-spinner" />
              <span className="enhance-hud-sparkle">✨</span>
              <span className="enhance-hud-text">{aiEnhanceStepText}</span>
            </div>
          )}

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
                right: pageDrawerWidth,
                bottom: 0,
                zIndex: 45,
                background: 'transparent',
              }}
            />
          )}

          {/* Slide-out Page Drawer with Draggable Left Handle */}
          {showPagePanel && (
            <div
              className="shell-slideout-drawer"
              style={{ width: `${pageDrawerWidth}px` }}
            >
              {/* Draggable resize handle on the left edge */}
              <div
                className="drawer-resize-handle"
                onPointerDown={handleDrawerResizeStart}
                onPointerMove={handleDrawerResizeMove}
                onPointerUp={handleDrawerResizeEnd}
                onPointerCancel={handleDrawerResizeEnd}
                title="Drag to resize page navigation menu"
                aria-label="Resize drawer"
                role="separator"
                aria-orientation="vertical"
              >
                <div className="drawer-resize-bar" />
              </div>

              <PagePanel
                onClose={() => setShowPagePanel(false)}
                onOpenTemplates={() => setShowPageTemplates(true)}
                onOpenMetadata={() => setShowLessonMetadata(true)}
                onOpenGridView={() => setShowSlideGridView(true)}
              />
            </div>
          )}

          {/* Floating Status Bar */}
          {!isPresentationMode && <StatusBar />}

          {/* Bottom Docked Toolbar (Reference Image 1) */}
          <Toolbar
            onTogglePagePanel={() => setShowPagePanel((p) => !p)}
            onOpenSlideGridView={() => setShowSlideGridView(true)}
            onOpenSubjectTools={() => setShowSubjectTools(true)}
            onOpenVectorDiagram={() => {
              setVectorDiagramInitialCode(undefined);
              setShowVectorDiagramModal(true);
            }}
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
            onToggleBrowser={() => setShowBrowser((prev) => !prev)}
            isBrowserOpen={showBrowser}
            onToggleAIChat={handleToggleAIChat}
            isAIChatOpen={showAIChat}
            onEnhanceSlide={handleEnhanceSlide}
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

        {/* AI Teaching Assistant Side-by-Side Chatbox (Docked on Right Side) */}
        {showAIChat && (
          <AIChatSidePanel
            isOpen={showAIChat}
            onClose={() => setShowAIChat(false)}
            onInsertToBoard={handleInsertChatContentToBoard}
            onInsertImageUrlToBoard={handleInsertRemoteImageToBoard}
            onOpenInBrowser={handleOpenUrlInBrowser}
            onOpenVectorStudio={(code) => {
              setVectorDiagramInitialCode(code);
              setShowVectorDiagramModal(true);
            }}
            currentTopic={docState.lesson?.meta?.title}
            currentSubject={docState.lesson?.meta?.subject}
            width={chatWidth}
            onWidthChange={handleChatWidthChange}
            initialQuery={askAiInitialQuery}
            onClearInitialQuery={() => setAskAiInitialQuery(null)}
            onEnhanceBoard={handleEnhanceSlide}
          />
        )}
      </div>

      {/* 4.2 Main Section Dialogs */}
      {showSubjectTools && <SubjectToolsModal onClose={() => setShowSubjectTools(false)} />}
      {showResourceLibrary && <ResourceLibraryModal onClose={() => setShowResourceLibrary(false)} />}
      {showActivities && <ClassroomActivitiesModal onClose={() => setShowActivities(false)} />}
      {showRecentLessons && <RecentLessonsModal onClose={() => setShowRecentLessons(false)} />}
      {showAIAssistant && (
        <AIAssistantModal
          onClose={() => setShowAIAssistant(false)}
        />
      )}
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
      {showVectorDiagramModal && (
        <VectorDiagramModal
          initialCode={vectorDiagramInitialCode}
          onClose={() => setShowVectorDiagramModal(false)}
          onInsert={handleInsertVectorDiagram}
        />
      )}

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

      {/* Large Slide Grid View Modal (Requirement 4) */}
      <SlideGridViewModal
        isOpen={showSlideGridView}
        onClose={() => setShowSlideGridView(false)}
      />

      {/* Educational Web Browser Modal */}
      <WebBrowserModal
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onInsertImageToBoard={handleInsertImageToBoard}
        initialUrl={browserInitialUrl}
        onClearInitialUrl={() => setBrowserInitialUrl(null)}
      />
    </div>
  );
}

