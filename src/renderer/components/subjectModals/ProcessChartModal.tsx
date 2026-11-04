/**
 * ProcessChartModal — Customizable Multi-Step Process Flow Chart Builder
 * Interactive teacher tool supporting Chevron, Numbered Cards, Circular Cycle, and Staged Pipelines
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  ProcessStep,
  ProcessChartStyle,
  DEFAULT_PROCESS_STEPS,
} from '../../services/subjectModules/commonResourcesModule';
import './SubjectModals.css';

interface ProcessChartModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const PROCESS_PRESETS: Record<string, { name: string; style: ProcessChartStyle; steps: ProcessStep[] }> = {
  scientificMethod: {
    name: 'Scientific Method (5 Steps)',
    style: 'chevron',
    steps: DEFAULT_PROCESS_STEPS,
  },
  engineeringDesign: {
    name: 'Engineering Design Loop (6 Steps)',
    style: 'cycle',
    steps: [
      { id: 'eng-1', stepNumber: 1, title: 'Define Problem', description: 'Identify criteria & constraints', color: '#38bdf8' },
      { id: 'eng-2', stepNumber: 2, title: 'Brainstorm Ideas', description: 'Explore multiple solutions', color: '#0ea5e9' },
      { id: 'eng-3', stepNumber: 3, title: 'Design & Prototype', description: 'Build working prototype model', color: '#10b981' },
      { id: 'eng-4', stepNumber: 4, title: 'Test & Evaluate', description: 'Run performance stress tests', color: '#f59e0b' },
      { id: 'eng-5', stepNumber: 5, title: 'Iterate & Refine', description: 'Improve based on user data', color: '#ec4899' },
      { id: 'eng-6', stepNumber: 6, title: 'Final Solution', description: 'Deploy and document product', color: '#8b5cf6' },
    ],
  },
  sdlc: {
    name: 'Software Dev Lifecycle (SDLC)',
    style: 'pipeline',
    steps: [
      { id: 'sdlc-1', stepNumber: 1, title: 'Requirements', description: 'User stories and specs', color: '#06b6d4' },
      { id: 'sdlc-2', stepNumber: 2, title: 'Architecture', description: 'System and database schemas', color: '#3b82f6' },
      { id: 'sdlc-3', stepNumber: 3, title: 'Implementation', description: 'Coding & unit testing', color: '#10b981' },
      { id: 'sdlc-4', stepNumber: 4, title: 'Verification', description: 'End-to-end integration tests', color: '#f59e0b' },
      { id: 'sdlc-5', stepNumber: 5, title: 'Deployment', description: 'Cloud release & monitoring', color: '#a855f7' },
    ],
  },
  waterCycle: {
    name: 'Water Hydrologic Cycle (4 Steps)',
    style: 'cycle',
    steps: [
      { id: 'wc-1', stepNumber: 1, title: 'Evaporation', description: 'Solar energy vaporizes surface water', color: '#38bdf8' },
      { id: 'wc-2', stepNumber: 2, title: 'Condensation', description: 'Vapor cools into cloud droplets', color: '#0ea5e9' },
      { id: 'wc-3', stepNumber: 3, title: 'Precipitation', description: 'Water falls as rain, snow, or hail', color: '#10b981' },
      { id: 'wc-4', stepNumber: 4, title: 'Collection / Runoff', description: 'Flows back into rivers and oceans', color: '#6366f1' },
    ],
  },
};

export function ProcessChartModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: ProcessChartModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  const [steps, setSteps] = useState<ProcessStep[]>(() => {
    if (existingShape?.params?.steps) {
      return JSON.parse(JSON.stringify(existingShape.params.steps));
    }
    return JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS));
  });

  const [style, setStyle] = useState<ProcessChartStyle>(() => {
    return (existingShape?.params?.style as ProcessChartStyle) || 'chevron';
  });

  const [activeStepIndex, setActiveStepIndex] = useState<number>(() => {
    return existingShape?.params?.activeStepIndex || 0;
  });

  const curStep = steps[activeStepIndex] || steps[0];

  const handleUpdateCurrentStep = (fields: Partial<ProcessStep>) => {
    setSteps((prev) => {
      const next = [...prev];
      if (next[activeStepIndex]) {
        next[activeStepIndex] = { ...next[activeStepIndex], ...fields };
      }
      return next;
    });
  };

  const handleAddStep = () => {
    const newStep: ProcessStep = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      title: `Step ${steps.length + 1}`,
      description: 'Describe this phase of the process.',
      color: '#38bdf8',
    };
    setSteps((prev) => [...prev, newStep]);
    setActiveStepIndex(steps.length);
  };

  const handleDeleteCurrentStep = () => {
    if (steps.length <= 1) return;
    setSteps((prev) => {
      const filtered = prev.filter((_, idx) => idx !== activeStepIndex);
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleMoveStep = (direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? activeStepIndex - 1 : activeStepIndex + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      const temp = next[activeStepIndex];
      next[activeStepIndex] = next[targetIdx];
      next[targetIdx] = temp;
      return next.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
    setActiveStepIndex(targetIdx);
  };

  const handleApplyPreset = (key: string) => {
    const preset = PROCESS_PRESETS[key];
    if (!preset) return;
    setSteps(JSON.parse(JSON.stringify(preset.steps)));
    setStyle(preset.style);
    setActiveStepIndex(0);
  };

  const handleSave = () => {
    const params = {
      steps,
      style,
      activeStepIndex,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        height: style === 'cycle' ? 440 : 260,
        label: curStep ? `Process: ${curStep.title}` : 'Process Chart',
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape(
      'processChart',
      190,
      150,
      740,
      style === 'cycle' ? 440 : 260,
      {
        params,
        label: `Process: ${steps[0]?.title || 'Flow Chart'}`,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
      }
    );

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      'Insert Process Flow Chart'
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
        {/* Header */}
        <div className="subject-submodal-header">
          <div className="subject-submodal-title">
            <span className="icon">🔄</span>
            <div>
              <h3>Process Flow Chart Builder</h3>
              <p>Design customizable sequential workflows, loops, and milestones with flexible steps</p>
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
            {/* Presets */}
            <div className="cs-control-group">
              <label>Curriculum Presets</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {Object.entries(PROCESS_PRESETS).map(([k, p]) => (
                  <button
                    key={k}
                    className="cs-action-btn-sm"
                    style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px' }}
                    onClick={() => handleApplyPreset(k)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Switcher */}
            <div className="cs-control-group">
              <label>Chart Flow Style</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {(['chevron', 'cards', 'cycle', 'pipeline'] as ProcessChartStyle[]).map((st) => (
                  <button
                    key={st}
                    className={`cs-action-btn-sm ${style === st ? 'active' : ''}`}
                    style={{ textTransform: 'capitalize', padding: '6px' }}
                    onClick={() => setStyle(st)}
                  >
                    {st === 'chevron' ? '▶ Chevron Flow' : st === 'cards' ? '🗂 Numbered Cards' : st === 'cycle' ? '⭕ Circular Cycle' : '📊 Staged Pipeline'}
                  </button>
                ))}
              </div>
            </div>

            {/* Steps List */}
            <div className="cs-control-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Process Steps ({steps.length})</label>
                <button className="cs-action-btn-sm primary" onClick={handleAddStep} style={{ padding: '2px 8px', fontSize: '11px' }}>
                  ➕ Add Step
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                {steps.map((st, idx) => (
                  <button
                    key={st.id}
                    className={`cs-action-btn-sm ${idx === activeStepIndex ? 'active' : ''}`}
                    style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px' }}
                    onClick={() => setActiveStepIndex(idx)}
                  >
                    <strong>Step {st.stepNumber}:</strong> {st.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Step Editor */}
            {curStep && (
              <div className="cs-control-group">
                <label>Edit Step {curStep.stepNumber}</label>
                <input
                  type="text"
                  className="cs-modal-input"
                  placeholder="Step title..."
                  value={curStep.title}
                  onChange={(e) => handleUpdateCurrentStep({ title: e.target.value })}
                />
                <textarea
                  className="cs-modal-input"
                  style={{ marginTop: '6px', height: '54px', resize: 'vertical' }}
                  placeholder="Step description / instructions..."
                  value={curStep.description}
                  onChange={(e) => handleUpdateCurrentStep({ description: e.target.value })}
                />

                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    className="cs-action-btn-sm"
                    disabled={activeStepIndex === 0}
                    onClick={() => handleMoveStep('left')}
                    title="Move step earlier"
                  >
                    ◀ Move Earlier
                  </button>
                  <button
                    className="cs-action-btn-sm"
                    disabled={activeStepIndex === steps.length - 1}
                    onClick={() => handleMoveStep('right')}
                    title="Move step later"
                  >
                    Move Later ▶
                  </button>
                  {steps.length > 1 && (
                    <button className="cs-action-btn-sm danger" onClick={handleDeleteCurrentStep}>
                      🗑
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Preview Panel */}
          <div className="cs-preview-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="cs-preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Interactive Process Preview</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="cs-action-btn-sm"
                  onClick={() => setActiveStepIndex((prev) => (prev - 1 + steps.length) % steps.length)}
                  title="Previous step"
                >
                  ◀ Prev
                </button>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold' }}>
                  Step {activeStepIndex + 1} / {steps.length}
                </span>
                <button
                  className="cs-action-btn-sm"
                  onClick={() => setActiveStepIndex((prev) => (prev + 1) % steps.length)}
                  title="Next step"
                >
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
              {/* Process Flow Preview Rendering */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                {steps.map((st, idx) => {
                  const isActive = idx === activeStepIndex;
                  return (
                    <div
                      key={st.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(14, 165, 233, 0.35)' : 'rgba(30, 41, 59, 0.85)',
                        border: isActive ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        maxWidth: '140px',
                        textAlign: 'center',
                        transform: isActive ? 'scale(1.06)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? '0 0 12px #38bdf8' : 'none',
                      }}
                      onClick={() => setActiveStepIndex(idx)}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: isActive ? '#38bdf8' : '#0ea5e9',
                          color: '#0f172a',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 6px auto',
                        }}
                      >
                        {st.stepNumber}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#f8fafc' }}>{st.title}</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>{st.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="cs-preview-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="subject-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button className="subject-insert-btn" onClick={handleSave}>
                {existingShape ? 'Update Process on Board' : 'Insert Process Flow Chart ↗'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

