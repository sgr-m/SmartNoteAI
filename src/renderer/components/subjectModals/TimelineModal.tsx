/**
 * TimelineModal — Customizable Animated Timeline Builder
 * Interactive teacher tool supporting horizontal and vertical timelines with image card uploads
 */

import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import { TimelineEvent, DEFAULT_TIMELINE_EVENTS } from '../../services/subjectModules/commonResourcesModule';
import './SubjectModals.css';

interface TimelineModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

export function TimelineModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: TimelineModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    if (existingShape?.params?.events) {
      return JSON.parse(JSON.stringify(existingShape.params.events));
    }
    return JSON.parse(JSON.stringify(DEFAULT_TIMELINE_EVENTS));
  });

  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>(() => {
    return existingShape?.params?.orientation || 'horizontal';
  });

  const [activeEventIndex, setActiveEventIndex] = useState<number>(() => {
    return existingShape?.params?.activeEventIndex || 0;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const curEvent = events[activeEventIndex] || events[0];

  const handleUpdateCurrentEvent = (fields: Partial<TimelineEvent>) => {
    setEvents((prev) => {
      const next = [...prev];
      if (next[activeEventIndex]) {
        next[activeEventIndex] = { ...next[activeEventIndex], ...fields };
      }
      return next;
    });
  };

  const handleAddEvent = () => {
    const newEvt: TimelineEvent = {
      id: `evt-${Date.now()}`,
      dateOrEra: `Event ${events.length + 1}`,
      title: 'New Milestone Title',
      description: 'Describe what occurred during this milestone.',
      color: '#38bdf8',
    };
    setEvents((prev) => [...prev, newEvt]);
    setActiveEventIndex(events.length);
  };

  const handleDeleteCurrentEvent = () => {
    if (events.length <= 1) return;
    setEvents((prev) => prev.filter((_, idx) => idx !== activeEventIndex));
    setActiveEventIndex((prev) => Math.max(0, prev - 1));
  };

  // Image upload via File Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateCurrentEvent({ imageDataUrl: reader.result });
      }
    };
    reader.onerror = () => {
      setImageError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Image paste from Clipboard
  const handlePasteFromClipboard = async () => {
    setImageError(null);
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                handleUpdateCurrentEvent({ imageDataUrl: reader.result });
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      setImageError('No image found in clipboard.');
    } catch {
      setImageError('Clipboard image access denied. Please use "Select from Computer".');
    }
  };

  const handleRemoveImage = () => {
    handleUpdateCurrentEvent({ imageDataUrl: undefined });
  };

  const handleNextEvent = () => {
    setActiveEventIndex((prev) => (prev + 1) % events.length);
  };

  const handlePrevEvent = () => {
    setActiveEventIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleSave = () => {
    const params = {
      events,
      orientation,
      activeEventIndex,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        width: orientation === 'horizontal' ? 760 : 480,
        height: orientation === 'horizontal' ? 360 : 540,
        label: curEvent ? `Timeline: ${curEvent.title}` : 'Timeline',
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape(
      'timeline',
      180,
      140,
      orientation === 'horizontal' ? 760 : 480,
      orientation === 'horizontal' ? 360 : 540,
      {
        params,
        label: `Timeline: ${events[0]?.title || 'Milestones'}`,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
      }
    );

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      'Insert Animated Timeline'
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-container wide" onClick={(e) => e.stopPropagation()}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Header */}
        <div className="subject-submodal-header">
          <div className="subject-submodal-title">
            <span className="icon">⏳</span>
            <div>
              <h3>Interactive & Animated Timeline Builder</h3>
              <p>Construct chronological event flows with images, animated navigation, and vertical/horizontal layout</p>
            </div>
          </div>
          <button className="subject-submodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="subject-submodal-body two-col">
          {/* Left Controls */}
          <div className="cs-left-panel">
            {/* Orientation */}
            <div className="cs-control-group">
              <label>Timeline Layout Orientation</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`cs-action-btn-sm ${orientation === 'horizontal' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '6px' }}
                  onClick={() => setOrientation('horizontal')}
                >
                  ↔ Horizontal Timeline
                </button>
                <button
                  className={`cs-action-btn-sm ${orientation === 'vertical' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '6px' }}
                  onClick={() => setOrientation('vertical')}
                >
                  ↕ Vertical Timeline
                </button>
              </div>
            </div>

            {/* Event List */}
            <div className="cs-control-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Timeline Events ({events.length})</label>
                <button className="cs-action-btn-sm primary" onClick={handleAddEvent} style={{ padding: '2px 8px', fontSize: '11px' }}>
                  ➕ Add Event
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                {events.map((evt, idx) => (
                  <button
                    key={evt.id}
                    className={`cs-action-btn-sm ${idx === activeEventIndex ? 'active' : ''}`}
                    style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px' }}
                    onClick={() => setActiveEventIndex(idx)}
                  >
                    <strong>{evt.dateOrEra}:</strong> {evt.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Event Editor */}
            {curEvent && (
              <div className="cs-control-group">
                <label>Edit Active Event ({curEvent.dateOrEra})</label>
                <input
                  type="text"
                  className="cs-modal-input"
                  placeholder="Date or Era (e.g. 1969, Phase 1)..."
                  value={curEvent.dateOrEra}
                  onChange={(e) => handleUpdateCurrentEvent({ dateOrEra: e.target.value })}
                />
                <input
                  type="text"
                  className="cs-modal-input"
                  style={{ marginTop: '6px' }}
                  placeholder="Milestone title..."
                  value={curEvent.title}
                  onChange={(e) => handleUpdateCurrentEvent({ title: e.target.value })}
                />
                <textarea
                  className="cs-modal-input"
                  style={{ marginTop: '6px', height: '54px', resize: 'vertical' }}
                  placeholder="Event description / lecture notes..."
                  value={curEvent.description}
                  onChange={(e) => handleUpdateCurrentEvent({ description: e.target.value })}
                />

                {/* Image Section */}
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>Event Card Image</label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button
                      className="cs-action-btn-sm"
                      style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                      onClick={handlePasteFromClipboard}
                      title="Paste image from clipboard"
                    >
                      📋 Paste Clipboard
                    </button>
                    <button
                      className="cs-action-btn-sm"
                      style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Select image from your computer"
                    >
                      📁 From Computer
                    </button>
                  </div>

                  {curEvent.imageDataUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '4px' }}>
                      <img src={curEvent.imageDataUrl} alt="Thumbnail" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#34d399', flex: 1 }}>Image Attached ✓</span>
                      <button className="cs-action-btn-sm danger" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={handleRemoveImage}>
                        Remove
                      </button>
                    </div>
                  )}

                  {imageError && (
                    <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>{imageError}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  {events.length > 1 && (
                    <button className="cs-action-btn-sm danger" onClick={handleDeleteCurrentEvent} style={{ flex: 1 }}>
                      🗑 Delete Event
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Preview */}
          <div className="cs-preview-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="cs-preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Animated Timeline Preview</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="cs-action-btn-sm" onClick={handlePrevEvent} title="Previous event">
                  ◀ Prev
                </button>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold' }}>
                  {activeEventIndex + 1} / {events.length}
                </span>
                <button className="cs-action-btn-sm" onClick={handleNextEvent} title="Next event">
                  Next ▶
                </button>
              </div>
            </div>

            <div
              className="cs-preview-canvas-container"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#090d16',
                borderRadius: '8px',
                padding: '16px',
                overflow: 'auto',
              }}
            >
              {orientation === 'horizontal' ? (
                /* Horizontal Preview Track */
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
                    {/* Axis Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '10px',
                        right: '10px',
                        height: '3px',
                        background: '#0284c7',
                        zIndex: 1,
                      }}
                    />

                    {events.map((evt, idx) => {
                      const isActive = idx === activeEventIndex;
                      return (
                        <div
                          key={evt.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 2,
                            cursor: 'pointer',
                          }}
                          onClick={() => setActiveEventIndex(idx)}
                        >
                          {/* Top Card (for alternating look) */}
                          <div
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: isActive ? 'rgba(14, 165, 233, 0.35)' : 'rgba(30, 41, 59, 0.85)',
                              border: isActive ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                              color: '#ffffff',
                              fontSize: '11px',
                              maxWidth: '120px',
                              textAlign: 'center',
                              marginBottom: '8px',
                              boxShadow: isActive ? '0 0 12px #38bdf8' : 'none',
                              transform: isActive ? 'scale(1.08)' : 'scale(1)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', color: isActive ? '#38bdf8' : '#cbd5e1' }}>{evt.dateOrEra}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{evt.title}</div>
                            {evt.imageDataUrl && (
                              <img src={evt.imageDataUrl} alt="Thumbnail" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px' }} />
                            )}
                          </div>

                          {/* Node circle on axis */}
                          <div
                            style={{
                              width: isActive ? '18px' : '12px',
                              height: isActive ? '18px' : '12px',
                              borderRadius: '50%',
                              background: isActive ? '#38bdf8' : '#0f172a',
                              border: `2px solid ${isActive ? '#ffffff' : '#0284c7'}`,
                              transition: 'all 0.2s ease',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Vertical Preview Track */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px' }}>
                  {events.map((evt, idx) => {
                    const isActive = idx === activeEventIndex;
                    return (
                      <div
                        key={evt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isActive ? 'rgba(14, 165, 233, 0.3)' : 'rgba(30, 41, 59, 0.85)',
                          border: isActive ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                          cursor: 'pointer',
                          transform: isActive ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => setActiveEventIndex(idx)}
                      >
                        <div style={{ fontWeight: 'bold', color: isActive ? '#38bdf8' : '#94a3b8', minWidth: '55px', fontSize: '12px' }}>
                          {evt.dateOrEra}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>{evt.title}</div>
                          <div style={{ color: '#cbd5e1', fontSize: '10px' }}>{evt.description}</div>
                        </div>
                        {evt.imageDataUrl && (
                          <img src={evt.imageDataUrl} alt="Thumbnail" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="cs-preview-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="subject-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button className="subject-insert-btn" onClick={handleSave}>
                {existingShape ? 'Update Timeline on Board' : 'Insert Animated Timeline ↗'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

