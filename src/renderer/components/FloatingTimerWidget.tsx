/**
 * FloatingTimerWidget — Always-on-top timer/stopwatch for presentations
 * Section 15: Additional tools
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FloatingTimerWidget.css';

interface FloatingTimerWidgetProps {
  onClose: () => void;
}

type TimerMode = 'countdown' | 'stopwatch';

export function FloatingTimerWidget({ onClose }: FloatingTimerWidgetProps): React.ReactElement {
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(300); // 5 min default
  const [elapsed, setElapsed] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [pos, setPos] = useState({ x: window.innerWidth - 280, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const intervalRef = useRef<number | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const tick = useCallback(() => {
    if (mode === 'countdown') {
      setSeconds((s) => {
        if (s <= 1) {
          setIsRunning(false);
          return 0;
        }
        return s - 1;
      });
    } else {
      setElapsed((e) => e + 1);
    }
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const reset = useCallback(() => {
    setIsRunning(false);
    if (mode === 'countdown') {
      setSeconds(inputMinutes * 60 + inputSeconds);
    } else {
      setElapsed(0);
    }
  }, [mode, inputMinutes, inputSeconds]);

  const fmt = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Dragging
  const onDragStart = (e: React.PointerEvent) => {
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 240, e.clientX - dragOffset.x)),
      y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
    });
  };
  const onDragEnd = () => setIsDragging(false);

  const displayValue = mode === 'countdown' ? seconds : elapsed;
  const isCountdownDone = mode === 'countdown' && seconds === 0;
  const countdownPct = mode === 'countdown'
    ? seconds / (inputMinutes * 60 + inputSeconds || 1)
    : 1;

  return (
    <div
      ref={widgetRef}
      className={`timer-widget ${isCountdownDone ? 'time-up' : ''}`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Drag handle */}
      <div
        className="timer-drag-handle"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <span className="timer-title">
          {mode === 'countdown' ? '⏱ Timer' : '⏱ Stopwatch'}
        </span>
        <button className="timer-close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      {/* Mode tabs */}
      <div className="timer-mode-tabs">
        <button
          className={`timer-tab ${mode === 'countdown' ? 'active' : ''}`}
          onClick={() => { setMode('countdown'); reset(); }}
        >
          Countdown
        </button>
        <button
          className={`timer-tab ${mode === 'stopwatch' ? 'active' : ''}`}
          onClick={() => { setMode('stopwatch'); reset(); }}
        >
          Stopwatch
        </button>
      </div>

      {/* Progress ring */}
      <div className="timer-display">
        <svg className="timer-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" className="timer-ring-bg" />
          <circle
            cx="60"
            cy="60"
            r="52"
            className="timer-ring-fill"
            style={{
              strokeDasharray: `${2 * Math.PI * 52}`,
              strokeDashoffset: `${2 * Math.PI * 52 * (1 - countdownPct)}`,
            }}
          />
        </svg>
        <div className="timer-time-text">
          <span className={`timer-digits ${isCountdownDone ? 'done' : ''}`}>{fmt(displayValue)}</span>
          {isCountdownDone && <span className="timer-done-label">⏰ Done!</span>}
        </div>
      </div>

      {/* Countdown preset input */}
      {mode === 'countdown' && (
        <div className="timer-input-row">
          <input
            type="number"
            min={0}
            max={99}
            value={inputMinutes}
            onChange={(e) => {
              const v = Number(e.target.value);
              setInputMinutes(v);
              if (!isRunning) setSeconds(v * 60 + inputSeconds);
            }}
            className="timer-input"
            title="Minutes"
          />
          <span className="timer-colon">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={inputSeconds}
            onChange={(e) => {
              const v = Number(e.target.value);
              setInputSeconds(v);
              if (!isRunning) setSeconds(inputMinutes * 60 + v);
            }}
            className="timer-input"
            title="Seconds"
          />
        </div>
      )}

      {/* Presets */}
      {mode === 'countdown' && (
        <div className="timer-presets">
          {[1, 2, 5, 10, 15].map((m) => (
            <button
              key={m}
              className="timer-preset-chip"
              onClick={() => {
                setInputMinutes(m);
                setInputSeconds(0);
                setSeconds(m * 60);
                setIsRunning(false);
              }}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="timer-actions">
        <button
          className={`timer-action-btn ${isRunning ? 'pause' : 'start'}`}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className="timer-action-btn reset" onClick={reset}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
