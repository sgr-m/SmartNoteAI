import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import './LessonMetadataModal.css';

interface LessonMetadataModalProps {
  onClose: () => void;
}

export function LessonMetadataModal({ onClose }: LessonMetadataModalProps): React.ReactElement {
  const { docState, docDispatch, setToastMessage } = useAppContext();
  const meta = docState.lesson.meta;

  const [title, setTitle] = useState(meta.title || 'Untitled Lesson');
  const [subject, setSubject] = useState(meta.subject || '');
  const [author, setAuthor] = useState(meta.author || '');
  const [tagsInput, setTagsInput] = useState((meta.tags || []).join(', '));

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    docDispatch({
      type: 'SET_LESSON_META',
      meta: {
        title: title.trim() || 'Untitled Lesson',
        subject: subject.trim() || undefined,
        author: author.trim() || undefined,
        tags,
      },
    });

    setToastMessage?.('Lesson details saved');
    onClose();
  };

  const formattedDate = new Date(meta.updatedAt || meta.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="metadata-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Lesson Details">
        <div className="metadata-modal-header">
          <div className="metadata-title-group">
            <span className="metadata-icon">📋</span>
            <h3>Lesson Details & Metadata</h3>
          </div>
          <button className="metadata-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="metadata-form">
          <div className="form-group">
            <label htmlFor="meta-title">Lesson Title</label>
            <input
              id="meta-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grade 10 Trigonometry: Sine and Cosine Waves"
              className="metadata-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="meta-subject">Subject</label>
              <input
                id="meta-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Physics, Chemistry"
                className="metadata-input"
              />
            </div>

            <div className="form-group flex-1">
              <label htmlFor="meta-author">Teacher / Author</label>
              <input
                id="meta-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                className="metadata-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="meta-tags">Tags (separated by commas)</label>
            <input
              id="meta-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. trigonometry, triangles, graphs, exam-prep"
              className="metadata-input"
            />
          </div>

          <div className="metadata-stats-card">
            <div className="stat-pill">
              <span className="stat-label">Pages</span>
              <span className="stat-value">{docState.lesson.pages.length}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Version</span>
              <span className="stat-value">v{meta.version || 1}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Last Saved</span>
              <span className="stat-value">{formattedDate}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">File</span>
              <span className="stat-value file-path-val">{docState.savedPath || 'Unsaved draft'}</span>
            </div>
          </div>
        </div>

        <div className="metadata-modal-footer">
          <button className="metadata-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="metadata-save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
