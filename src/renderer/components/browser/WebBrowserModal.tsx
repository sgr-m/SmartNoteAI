/**
 * WebBrowserModal.tsx — In-App Educational Web Browser
 * Allows teachers to search Google, Google Images, Bing, DuckDuckGo, Wikipedia,
 * and copy/capture diagrams and images directly to the SmartBoard.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './WebBrowserModal.css';

export interface WebBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImageToBoard: (dataUrl: string, title?: string) => void;
}

interface SearchEngine {
  id: string;
  name: string;
  icon: string;
  homeUrl: string;
  searchUrl: (query: string) => string;
}

const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    homeUrl: 'https://www.google.com',
    searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'google-images',
    name: 'Google Images',
    icon: '🖼️',
    homeUrl: 'https://www.google.com/imghp?hl=en',
    searchUrl: (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    icon: '🦆',
    homeUrl: 'https://duckduckgo.com',
    searchUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'bing',
    name: 'Bing',
    icon: '🅱️',
    homeUrl: 'https://www.bing.com',
    searchUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    icon: '📖',
    homeUrl: 'https://www.wikipedia.org',
    searchUrl: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  },
  {
    id: 'phet',
    name: 'PhET Sims',
    icon: '🔬',
    homeUrl: 'https://phet.colorado.edu/en/simulations/filter?type=html',
    searchUrl: (q) => `https://phet.colorado.edu/en/search?q=${encodeURIComponent(q)}`,
  },
];

export function WebBrowserModal({
  isOpen,
  onClose,
  onInsertImageToBoard,
}: WebBrowserModalProps): React.ReactElement | null {
  const [activeEngine, setActiveEngine] = useState<SearchEngine>(SEARCH_ENGINES[0]);
  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState<string>('https://www.google.com');
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const webviewRef = useRef<any>(null);

  // Sync navigation states from electron <webview>
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDidStartLoading = () => setIsLoading(true);
    const handleDidStopLoading = () => {
      setIsLoading(false);
      try {
        setCanGoBack(webview.canGoBack());
        setCanGoForward(webview.canGoForward());
        const targetUrl = webview.getURL();
        if (targetUrl) {
          setCurrentUrl(targetUrl);
          setUrlInput(targetUrl);
        }
      } catch {
        // ignore
      }
    };

    const handleDidNavigate = (e: any) => {
      if (e?.url) {
        setCurrentUrl(e.url);
        setUrlInput(e.url);
      }
    };

    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigate);

    return () => {
      try {
        webview.removeEventListener('did-start-loading', handleDidStartLoading);
        webview.removeEventListener('did-stop-loading', handleDidStopLoading);
        webview.removeEventListener('did-navigate', handleDidNavigate);
        webview.removeEventListener('did-navigate-in-page', handleDidNavigate);
      } catch {
        // ignore
      }
    };
  }, [isOpen]);

  const navigateTo = useCallback((destinationUrl: string) => {
    let finalUrl = destinationUrl.trim();
    if (!finalUrl) return;

    // Check if input looks like a URL
    const hasProtocol = /^https?:\/\//i.test(finalUrl);
    const looksLikeDomain = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(finalUrl);

    if (!hasProtocol && looksLikeDomain) {
      finalUrl = `https://${finalUrl}`;
    } else if (!hasProtocol) {
      // Search query using active engine
      finalUrl = activeEngine.searchUrl(finalUrl);
    }

    setCurrentUrl(finalUrl);
    setUrlInput(finalUrl);

    const webview = webviewRef.current;
    if (webview && typeof webview.loadURL === 'function') {
      webview.loadURL(finalUrl);
    }
  }, [activeEngine]);

  const handleSelectEngine = (engine: SearchEngine) => {
    setActiveEngine(engine);
    navigateTo(engine.homeUrl);
  };

  const handleGoBack = () => {
    const webview = webviewRef.current;
    if (webview && webview.canGoBack?.()) {
      webview.goBack();
    }
  };

  const handleGoForward = () => {
    const webview = webviewRef.current;
    if (webview && webview.canGoForward?.()) {
      webview.goForward();
    }
  };

  const handleReload = () => {
    const webview = webviewRef.current;
    if (webview && webview.reload?.()) {
      webview.reload();
    }
  };

  const handleGoHome = () => {
    navigateTo(activeEngine.homeUrl);
  };

  const handleCapturePageToBoard = async () => {
    const webview = webviewRef.current;
    if (!webview) return;

    try {
      setCopiedStatus('Capturing...');
      let dataUrl: string | null = null;

      if (typeof webview.capturePage === 'function') {
        const image = await webview.capturePage();
        dataUrl = image.toDataURL();
      }

      if (dataUrl) {
        onInsertImageToBoard(dataUrl, `Web Clip — ${activeEngine.name}`);
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

  if (!isOpen) return null;

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

          {/* Quick Engine Tabs */}
          <div className="web-browser-engine-tabs">
            {SEARCH_ENGINES.map((eng) => (
              <button
                key={eng.id}
                type="button"
                className={`engine-tab-btn ${activeEngine.id === eng.id ? 'active' : ''}`}
                onClick={() => handleSelectEngine(eng)}
                title={`Open ${eng.name}`}
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

        {/* Navigation & Address Bar */}
        <div className="web-browser-nav-bar">
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleGoBack}
            disabled={!canGoBack}
            title="Back"
          >
            ◀
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleGoForward}
            disabled={!canGoForward}
            title="Forward"
          >
            ▶
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleReload}
            title={isLoading ? 'Stop' : 'Reload'}
          >
            {isLoading ? '✕' : '⟳'}
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleGoHome}
            title="Homepage (Google)"
          >
            🏠
          </button>

          {/* Omnibox URL / Search input */}
          <form
            className="browser-omnibox-form"
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(urlInput);
            }}
          >
            <span className="omnibox-icon">{activeEngine.icon}</span>
            <input
              type="text"
              className="browser-omnibox-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search Google or enter website address (e.g. wikipedia.org)..."
            />
            {isLoading && <span className="omnibox-spinner" />}
          </form>

          {/* Action: Capture / Paste to SmartBoard */}
          <button
            type="button"
            className="browser-capture-btn"
            onClick={handleCapturePageToBoard}
            title="Capture current view and place directly onto active whiteboard slide"
          >
            {copiedStatus ? copiedStatus : '📷 Capture to Board'}
          </button>
        </div>

        {/* Classroom Tip Banner */}
        <div className="web-browser-tip-banner">
          <span>💡 <strong>Tip for Teachers:</strong> You can right-click any image in Google Images, choose <strong>"Copy Image"</strong>, and paste directly onto your whiteboard with <strong>Ctrl+V</strong>!</span>
        </div>

        {/* Webview Content Surface */}
        <div className="web-browser-viewport">
          {/* Electron <webview> renders arbitrary web pages without iframe framing limitations */}
          {React.createElement('webview', {
            ref: webviewRef,
            src: currentUrl,
            className: 'browser-guest-webview',
            allowpopups: 'true',
            webpreferences: 'contextIsolation=false',
          })}
        </div>
      </div>
    </div>
  );
}

