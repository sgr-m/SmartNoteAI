import React, { useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { Shell } from './components/Shell';
import { DesktopModeView } from './components/DesktopModeView';

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
    <AppProvider>
      {isOverlayMode ? <DesktopModeView /> : <Shell />}
    </AppProvider>
  );
}
