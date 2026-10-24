import React from 'react';
import { useAppContext } from '../context/AppContext';
import './CrashRecoveryBanner.css';

export function CrashRecoveryBanner(): React.ReactElement | null {
  const { crashRecoveryDraft, restoreCrashRecoveryDraft, discardCrashRecoveryDraft } = useAppContext();

  if (!crashRecoveryDraft) return null;

  const dateStr = new Date(crashRecoveryDraft.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const title = crashRecoveryDraft.lesson.meta.title || 'Untitled Lesson';
  const pageCount = crashRecoveryDraft.lesson.pages.length;

  return (
    <div className="crash-recovery-banner" role="alert">
      <div className="recovery-content">
        <span className="recovery-icon">⚠️</span>
        <div className="recovery-text-group">
          <span className="recovery-title">Unsaved Lesson Recovered</span>
          <span className="recovery-subtitle">
            "{title}" with {pageCount} {pageCount === 1 ? 'page' : 'pages'} (saved at {dateStr}). Would you like to restore it?
          </span>
        </div>
      </div>

      <div className="recovery-actions">
        <button className="recovery-restore-btn" onClick={restoreCrashRecoveryDraft}>
          Restore Lesson
        </button>
        <button className="recovery-discard-btn" onClick={discardCrashRecoveryDraft}>
          Discard
        </button>
      </div>
    </div>
  );
}
