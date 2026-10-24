/**
 * TitleBar — custom window chrome with drag area, title, and window controls
 */

import React, { useState, useEffect } from 'react';
import './TitleBar.css';

interface TitleBarProps {
  title: string;
  isDirty: boolean;
}

export function TitleBar({ title, isDirty }: TitleBarProps): React.ReactElement {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.invoke('window:isMaximized').then((v) => setIsMaximized(v as boolean));
  }, []);

  const minimize = () => window.electronAPI?.invoke('window:minimize');
  const toggleMaximize = () => {
    window.electronAPI?.invoke('window:maximize').then(() => {
      window.electronAPI.invoke('window:isMaximized').then((v) => setIsMaximized(v as boolean));
    });
  };
  const close = () => window.electronAPI?.invoke('window:close');

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region">
        <div className="titlebar-logo">
          <span className="titlebar-logo-icon">⬡</span>
          <span className="titlebar-app-name">SmartBoard Studio</span>
        </div>
        <div className="titlebar-doc-title">
          <span>{title}</span>
          {isDirty && <span className="titlebar-dirty-dot" title="Unsaved changes" />}
        </div>
      </div>
      <div className="titlebar-controls">
        <button className="win-ctrl win-ctrl-min" onClick={minimize} title="Minimize">
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button className="win-ctrl win-ctrl-max" onClick={toggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/>
              <rect x="0" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0" y="0" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
        <button className="win-ctrl win-ctrl-close" onClick={close} title="Close">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
