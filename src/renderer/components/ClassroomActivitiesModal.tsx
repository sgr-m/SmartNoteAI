/**
 * ClassroomActivitiesModal — Interactive classroom activities (Section 4.2 #7)
 * Random Student Picker, Countdown Timer, Stopwatch, Dice Roller, Poll Buzzer
 */

import React, { useState, useEffect, useRef } from 'react';
import './ClassroomActivitiesModal.css';

interface ClassroomActivitiesModalProps {
  onClose: () => void;
}

type ActivityTab = 'picker' | 'timer' | 'dice';

export function ClassroomActivitiesModal({ onClose }: ClassroomActivitiesModalProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<ActivityTab>('picker');

  // Random Student Picker State
  const [studentInput, setStudentInput] = useState('Alex\nBenjamin\nChloe\nDaniel\nEmma\nFelix\nGrace\nHarper');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [isRunning, setIsRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Dice State
  const [diceCount, setDiceCount] = useState(2);
  const [diceValues, setDiceValues] = useState<number[]>([3, 5]);
  const [isRolling, setIsRolling] = useState(false);

  // ─── Timer Logic ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─── Picker Logic ────────────────────────────────────────────────────────

  const spinPicker = () => {
    const names = studentInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand = names[Math.floor(Math.random() * names.length)];
      setSelectedStudent(rand);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 70);
  };

  // ─── Dice Logic ──────────────────────────────────────────────────────────

  const rollDice = () => {
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const newVals = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(newVals);
      count++;
      if (count > 12) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  return (
    <div className="classroom-modal-overlay" onClick={onClose}>
      <div className="classroom-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="classroom-header">
          <div className="classroom-title-group">
            <span className="classroom-icon">🎯</span>
            <div>
              <h3>Classroom Activities & Widgets</h3>
              <p>Engagement tools for interactive lessons</p>
            </div>
          </div>
          <button className="classroom-close" onClick={onClose}>✕</button>
        </div>

        {/* Tab Selection */}
        <div className="classroom-tabs">
          <button
            className={`classroom-tab-btn ${activeTab === 'picker' ? 'active' : ''}`}
            onClick={() => setActiveTab('picker')}
          >
            🎲 Random Student Picker
          </button>
          <button
            className={`classroom-tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            ⏱️ Classroom Timer
          </button>
          <button
            className={`classroom-tab-btn ${activeTab === 'dice' ? 'active' : ''}`}
            onClick={() => setActiveTab('dice')}
          >
            🎲 Dice Roller
          </button>
        </div>

        {/* Body */}
        <div className="classroom-body">
          {activeTab === 'picker' && (
            <div className="picker-container">
              <div className="picker-display-card">
                <div className={`selected-name-box ${isSpinning ? 'spinning' : ''}`}>
                  {selectedStudent ? (
                    <span className="selected-name-text">🌟 {selectedStudent} 🌟</span>
                  ) : (
                    <span className="picker-placeholder">Click Pick Student to select</span>
                  )}
                </div>
                <button
                  className="btn btn-primary pick-btn"
                  onClick={spinPicker}
                  disabled={isSpinning}
                >
                  {isSpinning ? 'Selecting...' : '🎯 Pick Random Student'}
                </button>
              </div>

              <div className="picker-names-column">
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Class Roster (One name per line):
                </label>
                <textarea
                  className="roster-textarea"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  rows={8}
                />
              </div>
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="timer-container">
              <div className="timer-clock-display">
                <span className={`timer-clock-text ${timerSeconds === 0 ? 'time-up' : ''}`}>
                  {formatTime(timerSeconds)}
                </span>
                {timerSeconds === 0 && <div className="time-up-banner">🔔 Time is Up!</div>}
              </div>

              <div className="timer-controls-row">
                <button
                  className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ minWidth: 100, fontSize: 16 }}
                  onClick={() => setIsRunning(!isRunning)}
                >
                  {isRunning ? '⏸ Pause' : '▶ Start'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 16 }}
                  onClick={() => {
                    setIsRunning(false);
                    setTimerSeconds(300);
                  }}
                >
                  🔄 Reset
                </button>
              </div>

              <div className="timer-preset-row">
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Presets:</span>
                {[60, 180, 300, 600, 900].map((sec) => (
                  <button
                    key={sec}
                    className="preset-time-chip"
                    onClick={() => {
                      setIsRunning(false);
                      setTimerSeconds(sec);
                    }}
                  >
                    {sec / 60}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dice' && (
            <div className="dice-container">
              <div className="dice-row">
                {diceValues.map((val, idx) => (
                  <div key={idx} className={`dice-cube ${isRolling ? 'rolling' : ''}`}>
                    {val === 1 && '⚀'}
                    {val === 2 && '⚁'}
                    {val === 3 && '⚂'}
                    {val === 4 && '⚃'}
                    {val === 5 && '⚄'}
                    {val === 6 && '⚅'}
                  </div>
                ))}
              </div>

              <div className="dice-sum-badge">
                Sum: <b>{diceValues.reduce((a, b) => a + b, 0)}</b>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Dice count:</span>
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      className={`preset-time-chip ${diceCount === n ? 'active' : ''}`}
                      onClick={() => {
                        setDiceCount(n);
                        setDiceValues(Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1));
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={rollDice}
                  disabled={isRolling}
                  style={{ minWidth: 120 }}
                >
                  {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
