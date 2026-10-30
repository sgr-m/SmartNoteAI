/**
 * Laboratory Apparatus Interactive Modal (Section 16.3)
 * Full interactive configuration for Laboratory Beaker, Erlenmeyer Flask,
 * Bunsen Burner, and Test Tube Rack with live SVG/Canvas preview, gravity leveling,
 * multi-flame stages, reaction effervescence, and whiteboard placement.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

export type ApparatusMode = 'beaker' | 'flask' | 'bunsenBurner' | 'testTubeRack';

interface LabApparatusModalProps {
  defaultMode?: ApparatusMode;
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Water (Blue)', color: 'rgba(56, 189, 248, 0.55)' },
  { name: 'Copper Sulfate (Cyan)', color: 'rgba(14, 165, 233, 0.7)' },
  { name: 'Permanganate (Purple)', color: 'rgba(168, 85, 247, 0.65)' },
  { name: 'Iron Chloride (Amber)', color: 'rgba(245, 158, 11, 0.65)' },
  { name: 'Phenolphthalein (Pink)', color: 'rgba(236, 72, 153, 0.65)' },
  { name: 'Nickel Sulfate (Green)', color: 'rgba(16, 185, 129, 0.65)' },
  { name: 'Acid Indicator (Red)', color: 'rgba(244, 63, 94, 0.65)' },
  { name: 'Transparent Liquid', color: 'rgba(226, 232, 240, 0.35)' },
];

export function LabApparatusModal({
  defaultMode = 'beaker',
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: LabApparatusModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [activeMode, setActiveMode] = useState<ApparatusMode>(() => {
    if (existingShape?.params?.apparatusType) {
      const t = existingShape.params.apparatusType;
      if (t === 'testTube') return 'testTubeRack';
      return t as ApparatusMode;
    }
    return defaultMode;
  });

  // Beaker State
  const [beakerLevel, setBeakerLevel] = useState<number>(existingShape?.params?.liquidLevel ?? 0.65);
  const [beakerColor, setBeakerColor] = useState<string>(existingShape?.params?.liquidColor || 'rgba(56, 189, 248, 0.55)');
  const [beakerLabel, setBeakerLabel] = useState<string>(existingShape?.params?.solutionName || 'Glass Beaker (250 mL)');
  const [beakerTilt, setBeakerTilt] = useState<number>(existingShape?.rotation || 0);

  // Flask State
  const [flaskLevel, setFlaskLevel] = useState<number>(existingShape?.params?.liquidLevel ?? 0.55);
  const [flaskColor, setFlaskColor] = useState<string>(existingShape?.params?.liquidColor || 'rgba(168, 85, 247, 0.65)');
  const [flaskLabel, setFlaskLabel] = useState<string>(existingShape?.params?.solutionName || 'Erlenmeyer Flask (250 mL)');
  const [hasStopper, setHasStopper] = useState<boolean>(existingShape?.params?.hasStopper ?? false);
  const [isBubbling, setIsBubbling] = useState<boolean>(existingShape?.params?.isBubbling ?? true);
  const [hasStirrer, setHasStirrer] = useState<boolean>(existingShape?.params?.hasStirrer ?? false);

  // Bunsen Burner State
  const [hasFlame, setHasFlame] = useState<boolean>(existingShape?.params?.hasFlame !== false);
  const [flameType, setFlameType] = useState<'safety' | 'gentle' | 'roaring'>(
    existingShape?.params?.flameType || 'roaring'
  );

  // Test Tube Rack State
  const [tubeCount, setTubeCount] = useState<number>(existingShape?.params?.count ?? 4);
  const [tubesBubbling, setTubesBubbling] = useState<boolean>(true);
  const [tubesStoppers, setTubesStoppers] = useState<boolean>(false);

  const currentPageIndex = docState.currentPageIndex;

  const handleSave = () => {
    let params: Record<string, unknown> = {};
    let w = 200;
    let h = 260;
    let label = '';
    let rotation = 0;

    if (activeMode === 'beaker') {
      w = 200;
      h = 260;
      label = beakerLabel;
      rotation = beakerTilt;
      params = {
        apparatusType: 'beaker',
        liquidLevel: beakerLevel,
        liquidColor: beakerColor,
        solutionName: beakerLabel,
      };
    } else if (activeMode === 'flask') {
      w = 210;
      h = 280;
      label = flaskLabel;
      params = {
        apparatusType: 'flask',
        liquidLevel: flaskLevel,
        liquidColor: flaskColor,
        solutionName: flaskLabel,
        hasStopper,
        isBubbling,
        hasStirrer,
      };
    } else if (activeMode === 'bunsenBurner') {
      w = 170;
      h = 290;
      label = flameType === 'safety' ? 'Bunsen Burner (Safety Flame)' : 'Bunsen Burner (Roaring Blue Flame)';
      params = {
        apparatusType: 'bunsenBurner',
        hasFlame,
        flameType,
      };
    } else if (activeMode === 'testTubeRack') {
      w = 340;
      h = 240;
      label = `Classroom Test Tube Rack (${tubeCount} Tubes)`;
      params = {
        apparatusType: 'testTubeRack',
        count: tubeCount,
        bubbles: tubesBubbling,
        stoppers: Array(tubeCount).fill(tubesStoppers),
      };
    }

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        width: w,
        height: h,
        label,
        rotation,
        params: {
          ...existingShape.params,
          ...params,
        },
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const apparatus = createShape('labApparatus', 250, 180, w, h, {
      params,
      rotation,
      strokeColor: '#94a3b8',
      strokeWidth: 2,
      label,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      apparatus,
      `Insert ${label}`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card resistor-modal"
        style={{ maxWidth: 880, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header" style={{ padding: '12px 20px', flexShrink: 0 }}>
          <div className="submodal-title">
            <span>⚗️</span>
            <div>
              <h3>{existingShape ? 'Edit Laboratory Apparatus' : 'Laboratory Glassware & Apparatus'}</h3>
              <p>Configure realistic gravity-level beakers, titration flasks, Bunsen burners, and test tube stations</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{
                background: '#0284c7',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
              onClick={handleSave}
            >
              ⚗️ {existingShape ? 'Update Apparatus' : 'Place on Board 🚀'}
            </button>
            <button className="submodal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Apparatus Mode Selector Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}>
          <button
            className={`preset-pill ${activeMode === 'beaker' ? 'active' : ''}`}
            onClick={() => setActiveMode('beaker')}
          >
            🧪 Laboratory Beaker (Gravity Level)
          </button>
          <button
            className={`preset-pill ${activeMode === 'flask' ? 'active' : ''}`}
            onClick={() => setActiveMode('flask')}
          >
            ⚗️ Erlenmeyer Flask (Titration)
          </button>
          <button
            className={`preset-pill ${activeMode === 'bunsenBurner' ? 'active' : ''}`}
            onClick={() => setActiveMode('bunsenBurner')}
          >
            🔥 Bunsen Burner (Interactive Flame)
          </button>
          <button
            className={`preset-pill ${activeMode === 'testTubeRack' ? 'active' : ''}`}
            onClick={() => setActiveMode('testTubeRack')}
          >
            🧪 Test Tube Rack (Multi-Tube)
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: '380px', maxHeight: '520px', background: '#0b1120' }}>
          {/* Controls Column */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            {activeMode === 'beaker' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Liquid Volume Level:</span>
                    <span style={{ color: '#38bdf8' }}>{Math.round(beakerLevel * 250)} mL ({Math.round(beakerLevel * 100)}%)</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={beakerLevel}
                    onChange={(e) => setBeakerLevel(parseFloat(e.target.value))}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gravity Pour Tilt Test:</span>
                    <span style={{ color: beakerTilt !== 0 ? '#f59e0b' : '#94a3b8' }}>{beakerTilt}° {beakerTilt > 25 ? '(Pouring!)' : ''}</span>
                  </label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="5"
                    value={beakerTilt}
                    onChange={(e) => setBeakerTilt(parseInt(e.target.value, 10))}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Notice how liquid surface remains horizontal with gravity as beaker tilts!
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Solution Chemical / Name:</label>
                  <input
                    type="text"
                    value={beakerLabel}
                    onChange={(e) => setBeakerLabel(e.target.value)}
                    className="periodic-search-input"
                    style={{ marginTop: '6px', width: '100%' }}
                    placeholder="e.g. 0.5 M CuSO4, H2O (250 mL)"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px', display: 'block' }}>
                    Liquid Color Presets:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => setBeakerColor(p.color)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          background: beakerColor === p.color ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                          border: `1px solid ${beakerColor === p.color ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#e2e8f0',
                          fontSize: '11px',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, border: '1px solid #fff' }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'flask' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Liquid Fill Level:</span>
                    <span style={{ color: '#c084fc' }}>{Math.round(flaskLevel * 250)} mL ({Math.round(flaskLevel * 100)}%)</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.85"
                    step="0.05"
                    value={flaskLevel}
                    onChange={(e) => setFlaskLevel(parseFloat(e.target.value))}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Solution Label:</label>
                  <input
                    type="text"
                    value={flaskLabel}
                    onChange={(e) => setFlaskLabel(e.target.value)}
                    className="periodic-search-input"
                    style={{ marginTop: '6px', width: '100%' }}
                    placeholder="e.g. 0.1 M NaOH Titrant, Acid + Indicator"
                  />
                </div>

                {/* Modern Features Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Modern Interactive Features
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasStopper}
                      onChange={(e) => setHasStopper(e.target.checked)}
                    />
                    <span>Rubber Stopper with Glass Delivery Tube</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isBubbling}
                      onChange={(e) => setIsBubbling(e.target.checked)}
                    />
                    <span>Active Reaction Effervescence (Bubbles)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasStirrer}
                      onChange={(e) => setHasStirrer(e.target.checked)}
                    />
                    <span>Magnetic Stir Bar with Rotational Vortex</span>
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px', display: 'block' }}>
                    Liquid Color Presets:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => setFlaskColor(p.color)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          background: flaskColor === p.color ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                          border: `1px solid ${flaskColor === p.color ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#e2e8f0',
                          fontSize: '11px',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, border: '1px solid #fff' }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'bunsenBurner' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Flame Power:</span>
                  <button
                    className={`btn ${hasFlame ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ background: hasFlame ? '#ea580c' : 'rgba(100, 116, 139, 0.5)', padding: '6px 14px' }}
                    onClick={() => setHasFlame(!hasFlame)}
                  >
                    {hasFlame ? '🔥 Flame ON' : '⚪ Flame OFF'}
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px', display: 'block' }}>
                    Air Hole Collar & Flame Mode:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => { setFlameType('safety'); setHasFlame(true); }}
                      style={{
                        padding: '10px 14px',
                        background: flameType === 'safety' && hasFlame ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                        border: `1.5px solid ${flameType === 'safety' && hasFlame ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px',
                        textAlign: 'left',
                        color: '#f8fafc',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '13px' }}>🟡 Safety Flame (~300°C)</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Air hole closed. Highly visible luminous yellow flame for safety when not heating.</div>
                    </button>

                    <button
                      onClick={() => { setFlameType('gentle'); setHasFlame(true); }}
                      style={{
                        padding: '10px 14px',
                        background: flameType === 'gentle' && hasFlame ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                        border: `1.5px solid ${flameType === 'gentle' && hasFlame ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px',
                        textAlign: 'left',
                        color: '#f8fafc',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px' }}>🔵 Gentle Blue Flame (~700°C)</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Air hole half open. Semi-luminous steady blue heating flame.</div>
                    </button>

                    <button
                      onClick={() => { setFlameType('roaring'); setHasFlame(true); }}
                      style={{
                        padding: '10px 14px',
                        background: flameType === 'roaring' && hasFlame ? 'rgba(2, 132, 199, 0.3)' : 'rgba(30, 41, 59, 0.8)',
                        border: `1.5px solid ${flameType === 'roaring' && hasFlame ? '#0284c7' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px',
                        textAlign: 'left',
                        color: '#f8fafc',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#67e8f9', fontSize: '13px' }}>⚡ Roaring Non-Luminous Flame (~1400°C)</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Air hole fully open. Dual-cone combustion with intense inner turquoise reduction cone.</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'testTubeRack' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Number of Test Tubes:</span>
                    <span style={{ color: '#38bdf8' }}>{tubeCount} Tubes</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {[3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        className={`preset-pill ${tubeCount === num ? 'active' : ''}`}
                        onClick={() => setTubeCount(num)}
                      >
                        {num} Tubes
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Classroom Features
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tubesBubbling}
                      onChange={(e) => setTubesBubbling(e.target.checked)}
                    />
                    <span>Active Reaction Effervescence (Bubbles in Tubes)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tubesStoppers}
                      onChange={(e) => setTubesStoppers(e.target.checked)}
                    />
                    <span>Cork Stoppers on Tubes</span>
                  </label>
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(56, 189, 248, 0.08)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  💡 <b>Classroom Solution Colors:</b> Includes Copper Sulfate (Cyan), Potassium Permanganate (Purple), Iron Chloride (Amber), Phenolphthalein (Pink), and Nickel Sulfate (Green) with authentic chemical labels.
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Placard */}
          <div style={{ width: '320px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
            {/* Top Action */}
            <button
              className="btn btn-primary"
              style={{
                width: '100%',
                background: '#0284c7',
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                border: '1px solid #38bdf8',
              }}
              onClick={handleSave}
            >
              ⚗️ {existingShape ? 'Update Apparatus' : 'Place on Board 🚀'}
            </button>

            {/* Visual Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              margin: '12px 0',
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
                Apparatus Ready
              </div>
              <div style={{ fontSize: '42px', margin: '8px 0' }}>
                {activeMode === 'beaker' && '🧪'}
                {activeMode === 'flask' && '⚗️'}
                {activeMode === 'bunsenBurner' && (hasFlame ? (flameType === 'safety' ? '🟡' : '🔥') : '⚪')}
                {activeMode === 'testTubeRack' && '🧪'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                {activeMode === 'beaker' && beakerLabel}
                {activeMode === 'flask' && flaskLabel}
                {activeMode === 'bunsenBurner' && (hasFlame ? `Bunsen Burner (${flameType.toUpperCase()})` : 'Bunsen Burner (Off)')}
                {activeMode === 'testTubeRack' && `Test Tube Rack (${tubeCount} Tubes)`}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
                {activeMode === 'beaker' && `Volume: ${Math.round(beakerLevel * 250)} mL · Tilt: ${beakerTilt}°`}
                {activeMode === 'flask' && `Volume: ${Math.round(flaskLevel * 250)} mL ${hasStopper ? '· Stoppered' : ''}`}
                {activeMode === 'bunsenBurner' && (hasFlame ? (flameType === 'safety' ? '300°C · Air Closed' : flameType === 'gentle' ? '700°C · Half Air' : '1400°C · Full Air') : 'Gas Valve Closed')}
                {activeMode === 'testTubeRack' && `${tubeCount} Tubes with chemical solutions`}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1.5, background: '#0284c7' }} onClick={handleSave}>
                Place on Board 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
