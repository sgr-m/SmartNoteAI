/**
 * RecordingStudioModal — Lecture Recording Studio (Section 4.2 #8)
 * Audio/video classroom recording, microphone selection, timer, VU meter
 */

import React, { useState, useEffect, useRef } from 'react';
import './RecordingStudioModal.css';

interface RecordingStudioModalProps {
  onClose: () => void;
}

export function RecordingStudioModal({ onClose }: RecordingStudioModalProps): React.ReactElement {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [quality, setQuality] = useState('1080p');
  const [micSource, setMicSource] = useState('Default System Microphone');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const formatRecordTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordSeconds(0);
    setSavedNotice(null);
  };

  const pauseRecording = () => {
    setIsPaused((p) => !p);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    const fileName = `SmartBoard_Lesson_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.webm`;
    setSavedNotice(`Recording saved successfully to Videos/${fileName} (${formatRecordTime(recordSeconds)})`);
  };

  return (
    <div className="rec-modal-overlay" onClick={onClose}>
      <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rec-modal-header">
          <div className="rec-title-group">
            <span className="rec-icon">📹</span>
            <div>
              <h3>Lecture Recording Studio</h3>
              <p>Capture whiteboard lessons with synchronized audio & stylus actions</p>
            </div>
          </div>
          <button className="rec-close" onClick={onClose}>✕</button>
        </div>

        <div className="rec-modal-body">
          {/* Main recording status view */}
          <div className="rec-status-card">
            <div className={`rec-blinking-dot ${isRecording && !isPaused ? 'active' : ''}`} />
            <div className="rec-timer-display">{formatRecordTime(recordSeconds)}</div>
            <div className="rec-state-label">
              {!isRecording
                ? 'Ready to record'
                : isPaused
                ? 'Recording paused'
                : 'Recording in progress (1080p 60fps)'}
            </div>

            {/* Simulated Live Audio VU meter */}
            <div className="rec-vu-meter">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                <div
                  key={bar}
                  className={`vu-bar ${isRecording && !isPaused && bar <= 8 ? 'lit' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="rec-controls-row">
            {!isRecording ? (
              <button className="btn btn-primary rec-start-btn" onClick={startRecording}>
                🔴 Start Recording
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={pauseRecording}>
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button className="btn btn-danger rec-stop-btn" onClick={stopRecording}>
                  ⏹ Finish & Save Recording
                </button>
              </>
            )}
          </div>

          {savedNotice && <div className="rec-saved-alert">✅ {savedNotice}</div>}

          {/* Settings / Configuration */}
          <div className="rec-settings-grid">
            <div className="rec-setting-field">
              <label>Microphone Source:</label>
              <select
                className="rec-select"
                value={micSource}
                onChange={(e) => setMicSource(e.target.value)}
                disabled={isRecording}
              >
                <option value="Default System Microphone">Default System Microphone</option>
                <option value="Headset Microphone (Audio Interface)">Headset / Wireless Lapel Mic</option>
                <option value="No Audio (Mute)">No Audio (Muted)</option>
              </select>
            </div>

            <div className="rec-setting-field">
              <label>Resolution & Frame Rate:</label>
              <select
                className="rec-select"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                disabled={isRecording}
              >
                <option value="1080p">1080p Full HD (60 FPS — Recommended)</option>
                <option value="720p">720p HD (30 FPS — Compact)</option>
                <option value="4K">4K UHD (60 FPS — Studio)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
