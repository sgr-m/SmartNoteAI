import React, { useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { Shell } from './components/Shell';
import { DesktopModeView } from './components/DesktopModeView';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SmartNoteAI Crash ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('smartboard_crash_recovery_v1');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: '#0d0d1a',
            color: '#e8e8f5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '24px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: '#1a1a3e',
              border: '1px solid #3a3a6a',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '560px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0', color: '#ff5252' }}>
              SmartNoteAI Encountered an Unexpected Issue
            </h2>
            <p style={{ fontSize: '14px', color: '#a0a0c8', lineHeight: 1.5, marginBottom: '20px' }}>
              Your lesson data is preserved in auto-save. Click below to reload the whiteboard interface.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  background: '#0f0f23',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#ff8a80',
                  overflowX: 'auto',
                  marginBottom: '20px',
                  textAlign: 'left',
                  maxHeight: '120px',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: '#6c63ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reload SmartBoard
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: '#a0a0c8',
                  border: '1px solid #3a3a6a',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Start Clean Session
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App(): React.ReactElement {
  const isOverlayMode =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('overlay') === 'desktop' ||
      new URLSearchParams(window.location.search).get('overlay') === 'annotation' ||
      window.location.hash.includes('overlay=desktop') ||
      window.location.hash.includes('overlay=annotation'));

  useEffect(() => {
    if (isOverlayMode) {
      document.documentElement.classList.add('desktop-transparent-mode');
      document.body.classList.add('desktop-transparent-mode');
      document.documentElement.style.setProperty('background', 'transparent', 'important');
      document.documentElement.style.setProperty('background-color', 'transparent', 'important');
      document.body.style.setProperty('background', 'transparent', 'important');
      document.body.style.setProperty('background-color', 'transparent', 'important');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.add('desktop-transparent-mode');
        rootEl.style.setProperty('background', 'transparent', 'important');
        rootEl.style.setProperty('background-color', 'transparent', 'important');
      }
    }
  }, [isOverlayMode]);

  return (
    <ErrorBoundary>
      <AppProvider>
        {isOverlayMode ? <DesktopModeView /> : <Shell />}
      </AppProvider>
    </ErrorBoundary>
  );
}
