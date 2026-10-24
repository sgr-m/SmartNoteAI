/**
 * RecentLessonsModal — Home and Recent Lessons Dashboard (Section 4.2 #1)
 */

import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { LessonMeta } from '../../shared/types';
import './RecentLessonsModal.css';

interface RecentLessonsModalProps {
  onClose: () => void;
}

export function RecentLessonsModal({ onClose }: RecentLessonsModalProps): React.ReactElement {
  const { newLesson, openLesson, docDispatch } = useAppContext();
  const [recentList, setRecentList] = useState<LessonMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI
        .invoke('db:getRecentLessons')
        .then((res) => {
          setRecentList((res as LessonMeta[]) || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleOpenMeta = async (meta: LessonMeta) => {
    if (meta.filePath && window.electronAPI) {
      try {
        const lesson = await window.electronAPI.invoke('file:open', meta.filePath);
        if (lesson) {
          docDispatch({ type: 'LOAD_LESSON', lesson: lesson as any });
          docDispatch({ type: 'SET_SAVE_PATH', path: meta.filePath });
          onClose();
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      }
    }
  };

  return (
    <div className="recent-modal-overlay" onClick={onClose}>
      <div className="recent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="recent-modal-header">
          <div className="recent-title-group">
            <span className="recent-icon">🏠</span>
            <div>
              <h3>Home & Recent Lessons</h3>
              <p>Quickly resume your saved lessons or start fresh</p>
            </div>
          </div>
          <button className="recent-close" onClick={onClose}>✕</button>
        </div>

        {/* Action bar: New & Open from Disk */}
        <div className="recent-actions-bar">
          <button
            className="btn btn-primary"
            onClick={() => {
              newLesson();
              onClose();
            }}
          >
            ➕ New Blank Lesson
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              openLesson();
              onClose();
            }}
          >
            📂 Browse / Open File (.sbl)
          </button>
        </div>

        {/* Recents list */}
        <div className="recent-list-container">
          {loading ? (
            <div className="recent-empty-state">Loading recent lessons...</div>
          ) : recentList.length === 0 ? (
            <div className="recent-empty-state">
              <span style={{ fontSize: 36 }}>📝</span>
              <p>No recently opened lessons found.</p>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Lessons you save will automatically appear here for quick access.
              </span>
            </div>
          ) : (
            <div className="recent-grid">
              {recentList.map((meta) => (
                <div
                  key={meta.id}
                  className="recent-lesson-card"
                  onClick={() => handleOpenMeta(meta)}
                >
                  <div className="recent-card-thumbnail">
                    <span style={{ fontSize: 32 }}>📄</span>
                  </div>
                  <div className="recent-card-info">
                    <h4>{meta.title}</h4>
                    <p>{new Date(meta.updatedAt).toLocaleDateString()} at {new Date(meta.updatedAt).toLocaleTimeString()}</p>
                    {meta.filePath && (
                      <span className="recent-filepath" title={meta.filePath}>
                        {meta.filePath}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
