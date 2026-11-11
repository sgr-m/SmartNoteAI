/**
 * WebBrowserModal.tsx — In-App Educational Web Browser
 * Allows teachers to search Google, Google Images, Bing, DuckDuckGo, Wikipedia, PhET,
 * browse across multiple tabs ("Open Link in New Tab" instead of spawning new windows),
 * and capture either full pages or user-selected rectangular regions directly onto SmartNoteAI.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  SEARCH_ENGINES,
  SearchEngine,
  BrowserTab,
  RegionRect,
  createBrowserTab,
  resolveBrowserNavigationUrl,
  deriveTabTitleFromUrl,
  normalizeSelectionRect,
  cropCapturedImageByViewportRegion,
} from './browserUtils';
import './WebBrowserModal.css';

export interface WebBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImageToBoard: (dataUrl: string, title?: string) => void;
  initialUrl?: string | null;
  onClearInitialUrl?: () => void;
}

interface WebviewTabPaneProps {
  tab: BrowserTab;
  isActive: boolean;
  onUpdateTab: (tabId: string, patch: Partial<BrowserTab>) => void;
  onOpenInNewTab: (url: string) => void;
  registerWebview: (tabId: string, node: any | null) => void;
}

function WebviewTabPane({
  tab,
  isActive,
  onUpdateTab,
  onOpenInNewTab,
  registerWebview,
}: WebviewTabPaneProps): React.ReactElement {
  const localRef = useRef<any>(null);

  const setRef = useCallback(
    (node: any | null) => {
      localRef.current = node;
      registerWebview(tab.id, node);
    },
    [registerWebview, tab.id]
  );

  useEffect(() => {
    const webview = localRef.current;
    if (!webview) return;

    const handleDidStartLoading = () => {
      onUpdateTab(tab.id, { isLoading: true });
    };

    const handleDidStopLoading = () => {
      try {
        const nextUrl = webview.getURL?.() || tab.url;
        const pageTitle = webview.getTitle?.() || '';
        onUpdateTab(tab.id, {
          isLoading: false,
          canGoBack: Boolean(webview.canGoBack?.()),
          canGoForward: Boolean(webview.canGoForward?.()),
          url: nextUrl,
          urlInput: nextUrl,
          title: deriveTabTitleFromUrl(nextUrl, pageTitle),
        });
      } catch {
        onUpdateTab(tab.id, { isLoading: false });
      }
    };

    const handleDidNavigate = (e: any) => {
      if (e?.url) {
        onUpdateTab(tab.id, {
          url: e.url,
          urlInput: e.url,
          canGoBack: Boolean(webview.canGoBack?.()),
          canGoForward: Boolean(webview.canGoForward?.()),
        });
      }
    };

    const handleTitleUpdate = (e: any) => {
      if (e?.title) {
        onUpdateTab(tab.id, {
          title: deriveTabTitleFromUrl(tab.url, e.title),
        });
      }
    };

    const handleNewWindow = (e: any) => {
      if (typeof e?.preventDefault === 'function') {
        e.preventDefault();
      }
      if (e?.url && e.url !== 'about:blank') {
        onOpenInNewTab(e.url);
      }
    };

    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigate);
    webview.addEventListener('page-title-updated', handleTitleUpdate);
    webview.addEventListener('new-window', handleNewWindow);

    return () => {
      try {
        webview.removeEventListener('did-start-loading', handleDidStartLoading);
        webview.removeEventListener('did-stop-loading', handleDidStopLoading);
        webview.removeEventListener('did-navigate', handleDidNavigate);
        webview.removeEventListener('did-navigate-in-page', handleDidNavigate);
        webview.removeEventListener('page-title-updated', handleTitleUpdate);
        webview.removeEventListener('new-window', handleNewWindow);
      } catch {
        // ignore detached webview errors
      }
    };
  }, [tab.id, onUpdateTab, onOpenInNewTab]);

  return (
    <div
      className={`browser-tab-pane ${isActive ? 'active' : 'hidden'}`}
      aria-hidden={!isActive}
    >
      {React.createElement('webview', {
        ref: setRef,
        src: tab.initialUrl,
        className: 'browser-guest-webview',
        allowpopups: 'true',
        webpreferences: 'contextIsolation=false',
      })}
    </div>
  );
}

export function WebBrowserModal({
  isOpen,
  onClose,
  onInsertImageToBoard,
  initialUrl,
  onClearInitialUrl,
}: WebBrowserModalProps): React.ReactElement | null {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [
    createBrowserTab(uuidv4(), undefined, SEARCH_ENGINES[0]),
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Interactive area capture state
  const [isRegionSelecting, setIsRegionSelecting] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<RegionRect | null>(null);

  const webviewMapRef = useRef<Map<string, any>>(new Map());
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const omniboxInputRef = useRef<HTMLInputElement | null>(null);
  const lastOpenedRef = useRef<{ url: string; ts: number }>({ url: '', ts: 0 });

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeEngine = SEARCH_ENGINES.find((e) => e.id === activeTab?.engineId) || SEARCH_ENGINES[0];

  const registerWebview = useCallback((tabId: string, node: any | null) => {
    if (node) {
      webviewMapRef.current.set(tabId, node);
    } else {
      webviewMapRef.current.delete(tabId);
    }
  }, []);

  const updateTab = useCallback((tabId: string, patch: Partial<BrowserTab>) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab))
    );
  }, []);

  const openUrlInNewTab = useCallback((rawUrl?: string, engine?: SearchEngine, focusOmnibox = false) => {
    const cleanUrl = rawUrl?.trim();
    if (cleanUrl) {
      const now = Date.now();
      if (lastOpenedRef.current.url === cleanUrl && now - lastOpenedRef.current.ts < 350) {
        return;
      }
      lastOpenedRef.current = { url: cleanUrl, ts: now };
    }

    const chosenEngine = engine || SEARCH_ENGINES[0];
    const newTab = createBrowserTab(uuidv4(), cleanUrl, chosenEngine);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setIsRegionSelecting(false);
    setDragStart(null);
    setSelectionRect(null);

    if (focusOmnibox) {
      setTimeout(() => {
        omniboxInputRef.current?.focus();
        omniboxInputRef.current?.select();
      }, 40);
    }
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.findIndex((t) => t.id === tabId);
        const filtered = prev.filter((t) => t.id !== tabId);
        if (tabId === activeTabId && filtered.length > 0) {
          const nextTab = filtered[Math.min(idx, filtered.length - 1)];
          setActiveTabId(nextTab.id);
        }
        return filtered;
      });
    },
    [activeTabId]
  );

  // Listen for Main process new-tab redirects (target="_blank", window.open, middle-click, "Open Link in New Tab")
  useEffect(() => {
    if (!isOpen) return;
    const unsub = window.electronAPI?.on?.('browser:open-in-new-tab', (url: unknown) => {
      if (typeof url === 'string' && url.trim() && url !== 'about:blank') {
        openUrlInNewTab(url);
      }
    });
    return () => {
      unsub?.();
    };
  }, [isOpen, openUrlInNewTab]);

  // Open an initial URL programmatically (e.g. "Open in Browser" from AI Chatbox)
  useEffect(() => {
    if (!isOpen || !initialUrl || !initialUrl.trim()) return;
    const targetUrl = initialUrl.trim();
    const existingHomeTab = tabs.length === 1 && tabs[0].url === SEARCH_ENGINES[0].homeUrl ? tabs[0] : null;
    if (existingHomeTab) {
      updateTab(existingHomeTab.id, {
        url: targetUrl,
        urlInput: targetUrl,
        title: deriveTabTitleFromUrl(targetUrl, ''),
      });
      const wv = webviewMapRef.current.get(existingHomeTab.id);
      if (wv && typeof wv.loadURL === 'function') {
        wv.loadURL(targetUrl);
      }
    } else {
      openUrlInNewTab(targetUrl);
    }
    onClearInitialUrl?.();
  }, [isOpen, initialUrl, tabs, updateTab, openUrlInNewTab, onClearInitialUrl]);

  // Keyboard shortcuts inside WebBrowserModal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        openUrlInNewTab(undefined, activeEngine, true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        if (tabs.length > 1 && activeTab) {
          e.preventDefault();
          closeTab(activeTab.id);
        }
        return;
      }
      if (e.key === 'Escape' && isRegionSelecting) {
        e.preventDefault();
        e.stopPropagation();
        setIsRegionSelecting(false);
        setDragStart(null);
        setSelectionRect(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isRegionSelecting, tabs.length, activeTab, activeEngine, openUrlInNewTab, closeTab]);

  const navigateTo = useCallback(
    (destinationUrl: string, overrideEngine?: SearchEngine) => {
      if (!activeTab) return;
      const engine = overrideEngine || activeEngine;
      const finalUrl = resolveBrowserNavigationUrl(destinationUrl, engine);

      updateTab(activeTab.id, {
        url: finalUrl,
        urlInput: finalUrl,
        engineId: engine.id,
      });

      const webview = webviewMapRef.current.get(activeTab.id);
      if (webview && typeof webview.loadURL === 'function') {
        webview.loadURL(finalUrl);
      }
    },
    [activeTab, activeEngine, updateTab]
  );

  const handleSelectEngine = (e: React.MouseEvent, engine: SearchEngine) => {
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      openUrlInNewTab(engine.homeUrl, engine);
      return;
    }
    navigateTo(engine.homeUrl, engine);
  };

  const handleGoBack = () => {
    if (!activeTab) return;
    const webview = webviewMapRef.current.get(activeTab.id);
    if (webview && webview.canGoBack?.()) {
      webview.goBack();
    }
  };

  const handleGoForward = () => {
    if (!activeTab) return;
    const webview = webviewMapRef.current.get(activeTab.id);
    if (webview && webview.canGoForward?.()) {
      webview.goForward();
    }
  };

  const handleReload = () => {
    if (!activeTab) return;
    const webview = webviewMapRef.current.get(activeTab.id);
    if (!webview) return;
    if (activeTab.isLoading && typeof webview.stop === 'function') {
      webview.stop();
    } else if (typeof webview.reload === 'function') {
      webview.reload();
    }
  };

  const handleGoHome = () => {
    navigateTo(activeEngine.homeUrl);
  };

  const handleCapturePageToBoard = async () => {
    if (!activeTab) return;
    const webview = webviewMapRef.current.get(activeTab.id);
    if (!webview) return;

    setIsRegionSelecting(false);
    setDragStart(null);
    setSelectionRect(null);

    try {
      setCopiedStatus('Capturing...');
      let dataUrl: string | null = null;

      if (typeof webview.capturePage === 'function') {
        const image = await webview.capturePage();
        dataUrl = image.toDataURL();
      }

      if (dataUrl) {
        onInsertImageToBoard(dataUrl, `Web Clip — ${activeTab.title || activeEngine.name}`);
        setCopiedStatus('✓ Captured to Board!');
        setTimeout(() => setCopiedStatus(null), 2500);
      } else {
        setCopiedStatus('Capture unavailable');
        setTimeout(() => setCopiedStatus(null), 2000);
      }
    } catch (err) {
      console.error('Failed to capture web page:', err);
      setCopiedStatus('Error capturing');
      setTimeout(() => setCopiedStatus(null), 2000);
    }
  };

  const handleToggleRegionCapture = () => {
    if (isRegionSelecting) {
      setIsRegionSelecting(false);
      setDragStart(null);
      setSelectionRect(null);
      return;
    }
    setCopiedStatus(null);
    setDragStart(null);
    setSelectionRect(null);
    setIsRegionSelecting(true);
  };

  const handleRegionPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRegionSelecting || e.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const pt = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore synthetic event capture failures
    }
    setDragStart(pt);
    setSelectionRect({ x: Math.round(pt.x), y: Math.round(pt.y), width: 0, height: 0 });
  };

  const handleRegionPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRegionSelecting || !dragStart) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const pt = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
    setSelectionRect(normalizeSelectionRect(dragStart, pt, { width: bounds.width, height: bounds.height }));
  };

  const handleRegionPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRegionSelecting || !dragStart || !activeTab) return;
    const viewport = viewportRef.current;
    const bounds = viewport?.getBoundingClientRect();
    const endPt = bounds ? { x: e.clientX - bounds.left, y: e.clientY - bounds.top } : dragStart;
    const finalRect = bounds
      ? normalizeSelectionRect(dragStart, endPt, { width: bounds.width, height: bounds.height })
      : selectionRect;

    setDragStart(null);
    setSelectionRect(null);
    setIsRegionSelecting(false);

    if (!finalRect || finalRect.width < 10 || finalRect.height < 10 || !bounds) {
      return;
    }

    const webview = webviewMapRef.current.get(activeTab.id);
    if (!webview || typeof webview.capturePage !== 'function') {
      setCopiedStatus('Capture unavailable');
      setTimeout(() => setCopiedStatus(null), 2000);
      return;
    }

    try {
      setCopiedStatus('Capturing area...');
      // Allow two animation frames so overlay dims/borders disappear completely before screenshot
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

      const image = await webview.capturePage();
      const rawDataUrl = image?.toDataURL?.();
      if (!rawDataUrl) {
        setCopiedStatus('Capture failed');
        setTimeout(() => setCopiedStatus(null), 2000);
        return;
      }

      const croppedDataUrl = await cropCapturedImageByViewportRegion(
        rawDataUrl,
        finalRect,
        { width: bounds.width, height: bounds.height }
      );
      onInsertImageToBoard(
        croppedDataUrl,
        `Web Area Clip — ${activeTab.title || activeEngine.name}`
      );
      setCopiedStatus('✓ Area Captured!');
      setTimeout(() => setCopiedStatus(null), 2500);
    } catch (err) {
      console.error('Failed to capture browser region:', err);
      setCopiedStatus('Error capturing area');
      setTimeout(() => setCopiedStatus(null), 2000);
    }
  };

  if (!isOpen || !activeTab) return null;

  return (
    <div className="web-browser-overlay" role="dialog" aria-modal="true" aria-label="Web Browser">
      <div className={`web-browser-window ${isMaximized ? 'maximized' : ''}`}>
        {/* Top Header Bar */}
        <div className="web-browser-titlebar">
          <div className="web-browser-title-group">
            <span className="web-browser-icon">🌐</span>
            <span className="web-browser-title">Educational Web Browser</span>
            <span className="web-browser-engine-badge">{activeEngine.name}</span>
          </div>

          {/* Quick Engine Pills */}
          <div className="web-browser-engine-tabs">
            {SEARCH_ENGINES.map((eng) => (
              <button
                key={eng.id}
                type="button"
                className={`engine-tab-btn ${activeEngine.id === eng.id ? 'active' : ''}`}
                onClick={(e) => handleSelectEngine(e, eng)}
                onAuxClick={(e) => {
                  if (e.button === 1) handleSelectEngine(e, eng);
                }}
                title={`Open ${eng.name} (Ctrl+Click to open in new tab)`}
              >
                <span className="engine-tab-icon">{eng.icon}</span>
                <span className="engine-tab-label">{eng.name}</span>
              </button>
            ))}
          </div>

          <div className="web-browser-window-controls">
            <button
              type="button"
              className="browser-win-btn"
              onClick={() => setIsMaximized((prev) => !prev)}
              title={isMaximized ? 'Restore Window' : 'Maximize Window'}
            >
              {isMaximized ? '❐' : '🗖'}
            </button>
            <button
              type="button"
              className="browser-win-btn close"
              onClick={onClose}
              title="Close Browser (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Multi-Tab Strip */}
        <div className="web-browser-tabs-bar" role="tablist" aria-label="Browser Tabs">
          <div className="browser-tabs-list">
            {tabs.map((tab) => {
              const isTabActive = tab.id === activeTab.id;
              const tabEngine = SEARCH_ENGINES.find((e) => e.id === tab.engineId);
              return (
                <div
                  key={tab.id}
                  role="tab"
                  aria-selected={isTabActive}
                  className={`browser-tab-item ${isTabActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setIsRegionSelecting(false);
                    setSelectionRect(null);
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1 && tabs.length > 1) {
                      e.preventDefault();
                      closeTab(tab.id);
                    }
                  }}
                  title={tab.url}
                >
                  <span className="browser-tab-favicon">
                    {tab.isLoading ? '⟳' : tabEngine?.icon || '🌐'}
                  </span>
                  <span className="browser-tab-title">{tab.title || 'New Tab'}</span>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      className="browser-tab-close"
                      aria-label={`Close ${tab.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      title="Close Tab (Ctrl+W)"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="browser-new-tab-btn"
              onClick={() => openUrlInNewTab(undefined, activeEngine, true)}
              title="New Tab (Ctrl+T)"
              aria-label="Open New Tab"
            >
              +
            </button>
          </div>
        </div>

        {/* Navigation & Address Bar */}
        <div className="web-browser-nav-bar">
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleGoBack}
            disabled={!activeTab.canGoBack}
            title="Back"
          >
            ◀
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleGoForward}
            disabled={!activeTab.canGoForward}
            title="Forward"
          >
            ▶
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleReload}
            title={activeTab.isLoading ? 'Stop' : 'Reload'}
          >
            {activeTab.isLoading ? '✕' : '⟳'}
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleGoHome}
            title={`Homepage (${activeEngine.name})`}
          >
            🏠
          </button>

          {/* Omnibox URL / Search input */}
          <form
            className="browser-omnibox-form"
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(activeTab.urlInput);
            }}
          >
            <span className="omnibox-icon">{activeEngine.icon}</span>
            <input
              ref={omniboxInputRef}
              type="text"
              className="browser-omnibox-input"
              value={activeTab.urlInput}
              onChange={(e) => updateTab(activeTab.id, { urlInput: e.target.value })}
              placeholder="Search Google or enter website address (e.g. wikipedia.org)..."
            />
            {activeTab.isLoading && <span className="omnibox-spinner" />}
          </form>

          {/* Action: Interactive Area Capture to SmartBoard */}
          <button
            type="button"
            className={`browser-capture-btn area ${isRegionSelecting ? 'selecting' : ''}`}
            onClick={handleToggleRegionCapture}
            title="Select a rectangular portion of the webpage and insert onto whiteboard"
          >
            {isRegionSelecting ? '✕ Cancel Area' : '✂️ Capture Area'}
          </button>

          {/* Action: Full Page Capture to SmartBoard */}
          <button
            type="button"
            className="browser-capture-btn"
            onClick={handleCapturePageToBoard}
            title="Capture entire visible webpage and place onto active whiteboard slide"
          >
            {copiedStatus ? copiedStatus : '📷 Capture Full'}
          </button>
        </div>

        {/* Classroom Tip Banner */}
        <div className="web-browser-tip-banner">
          <span>
            💡 <strong>Tip:</strong> Right-click or middle-click any link to <strong>"Open Link in New Tab"</strong> • Click <strong>✂️ Capture Area</strong> to drag-select a specific diagram onto your board!
          </span>
        </div>

        {/* Webview Content Surface */}
        <div className="web-browser-viewport" ref={viewportRef}>
          {tabs.map((tab) => (
            <WebviewTabPane
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTab.id}
              onUpdateTab={updateTab}
              onOpenInNewTab={openUrlInNewTab}
              registerWebview={registerWebview}
            />
          ))}

          {/* Interactive Portion Screenshot Selection Overlay */}
          {isRegionSelecting && (
            <div
              className="browser-region-overlay"
              onPointerDown={handleRegionPointerDown}
              onPointerMove={handleRegionPointerMove}
              onPointerUp={handleRegionPointerUp}
            >
              <div className="browser-region-instruction" onPointerDown={(e) => e.stopPropagation()}>
                <span>✂️ Drag across any portion of the page to capture onto your SmartBoard</span>
                <button
                  type="button"
                  className="browser-region-cancel-btn"
                  onClick={handleToggleRegionCapture}
                >
                  Cancel (Esc)
                </button>
              </div>

              {selectionRect && selectionRect.width > 0 && selectionRect.height > 0 && (
                <div
                  className="browser-region-selection-box"
                  style={{
                    left: `${selectionRect.x}px`,
                    top: `${selectionRect.y}px`,
                    width: `${selectionRect.width}px`,
                    height: `${selectionRect.height}px`,
                  }}
                >
                  <span className="browser-region-dims">
                    {selectionRect.width} × {selectionRect.height} px
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
