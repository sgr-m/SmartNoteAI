import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'katex/dist/katex.min.css';
import './styles/global.css';

// Immediate desktop overlay transparency setup before DOM paint
const isOverlay =
  typeof window !== 'undefined' &&
  (window.location.search.includes('overlay=desktop') ||
    window.location.search.includes('overlay=annotation') ||
    window.location.hash.includes('overlay=desktop') ||
    window.location.hash.includes('overlay=annotation'));

if (isOverlay) {
  document.documentElement.classList.add('desktop-transparent-mode');
  document.documentElement.style.setProperty('background', 'transparent', 'important');
  document.documentElement.style.setProperty('background-color', 'transparent', 'important');
  document.documentElement.style.setProperty('pointer-events', 'none', 'important');
  if (document.body) {
    document.body.classList.add('desktop-transparent-mode');
    document.body.style.setProperty('background', 'transparent', 'important');
    document.body.style.setProperty('background-color', 'transparent', 'important');
    document.body.style.setProperty('pointer-events', 'none', 'important');
  }
}

// Expose types for global window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
      once: (channel: string, listener: (...args: unknown[]) => void) => void;
      platform: string;
      versions: { electron: string; node: string; chrome: string };
    };
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
