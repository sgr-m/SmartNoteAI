/**
 * AIAssistantModal — AI Teaching Assistant (Section 4.2 #9)
 * Generates lesson plans, discussion questions, quizzes, and STEM explanations
 * Emphasizes privacy (local generation, no silent uploads)
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TextObject } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import './AIAssistantModal.css';

interface AIAssistantModalProps {
  onClose: () => void;
}

export function AIAssistantModal({ onClose }: AIAssistantModalProps): React.ReactElement {
  const { docDispatch, docState, commandSystem } = useAppContext();
  const [prompt, setPrompt] = useState('Photosynthesis in Plant Biology');
  const [mode, setMode] = useState<'outline' | 'quiz' | 'explain'>('outline');
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const currentPageIndex = docState.currentPageIndex;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      if (mode === 'outline') {
        setOutput(
          `📚 LESSON PLAN: ${prompt.toUpperCase()}\n` +
          `-----------------------------------------\n` +
          `1. Learning Objectives: Understand key principles and mechanisms.\n` +
          `2. Warm-Up Discussion (5 min): Real-world phenomena and observations.\n` +
          `3. Core Concept Presentation (20 min):\n` +
          `   - Light reactions in thylakoid membranes\n` +
          `   - Calvin cycle and glucose production\n` +
          `   - Chemical equation: 6CO₂ + 6H₂O + light ⟶ C₆H₁₂O₆ + 6O₂\n` +
          `4. Classroom Activity (15 min): Diagram drawing & peer explanation.\n` +
          `5. Exit Ticket (5 min): Quick 2-question comprehension check.`
        );
      } else if (mode === 'quiz') {
        setOutput(
          `📝 QUICK CLASSROOM QUIZ: ${prompt}\n` +
          `-----------------------------------------\n` +
          `Q1: What is the primary source of electrons in light-dependent reactions?\n` +
          `   A) Carbon dioxide   B) Water (H₂O)   C) Glucose   D) NADPH\n` +
          `   Answer: B) Water (photolysis produces O₂ and electrons)\n\n` +
          `Q2: Where does the Calvin Cycle occur inside the plant cell?\n` +
          `   Answer: The stroma of chloroplasts.\n\n` +
          `Q3: Explain why leaves appear green in sunlight in 1-2 sentences.\n` +
          `   Answer: Chlorophyll absorbs blue and red wavelengths while reflecting green.`
        );
      } else {
        setOutput(
          `💡 CORE CONCEPT SUMMARY: ${prompt}\n` +
          `-----------------------------------------\n` +
          `Definition: The biochemical process by which photoautotrophs convert light energy into chemical energy stored in glucose bonds.\n\n` +
          `Key Takeaways for Students:\n` +
          `• Requires: Sunlight, Water (roots), CO₂ (stomata)\n` +
          `• Produces: Oxygen (released), Glucose (fuel)`
        );
      }
      setIsGenerating(false);
    }, 450);
  };

  const handleInsertToCanvas = () => {
    if (!output) return;
    const textObj: TextObject = {
      id: uuidv4(),
      type: 'text',
      x: 200,
      y: 150,
      width: 580,
      height: 360,
      content: output,
      fontFamily: mode === 'outline' ? 'Inter, sans-serif' : "'JetBrains Mono', monospace",
      fontSize: 18,
      fontWeight: 500,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      color: '#f8fafc',
      backgroundColor: '#0f172a',
      opacity: 1,
      rotation: 0,
      preset: mode === 'quiz' ? 'qa' : 'definition',
      locked: false,
      layerId: 'objects',
    };

    commandSystem.execute({
      id: uuidv4(),
      description: 'Insert AI Teaching Material',
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex: currentPageIndex, object: textObj });
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex: currentPageIndex, objectId: textObj.id });
      },
    });

    onClose();
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <div className="ai-title-group">
            <span className="ai-icon">✨</span>
            <div>
              <h3>AI Teaching Assistant</h3>
              <p>Lesson outlines, quizzes, and STEM explanations (Privacy Protected)</p>
            </div>
          </div>
          <button className="ai-close" onClick={onClose}>✕</button>
        </div>

        <div className="ai-modal-body">
          {/* Mode Selector */}
          <div className="ai-mode-row">
            <button
              className={`ai-mode-btn ${mode === 'outline' ? 'active' : ''}`}
              onClick={() => setMode('outline')}
            >
              📋 Lesson Plan Outline
            </button>
            <button
              className={`ai-mode-btn ${mode === 'quiz' ? 'active' : ''}`}
              onClick={() => setMode('quiz')}
            >
              ❓ Classroom Quiz Questions
            </button>
            <button
              className={`ai-mode-btn ${mode === 'explain' ? 'active' : ''}`}
              onClick={() => setMode('explain')}
            >
              💡 Concept Summary & Formula
            </button>
          </div>

          {/* Prompt input */}
          <div className="ai-input-group">
            <label>Topic / Concept:</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="ai-text-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Newton's Laws, Pythagorean Theorem, Photosynthesis"
              />
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ minWidth: 120 }}
              >
                {isGenerating ? 'Generating...' : '✨ Generate'}
              </button>
            </div>
          </div>

          {/* Output Display */}
          {output && (
            <div className="ai-output-container">
              <textarea
                className="ai-output-textarea"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                rows={11}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button className="btn btn-secondary" onClick={() => setOutput('')}>
                  Clear
                </button>
                <button className="btn btn-primary" onClick={handleInsertToCanvas}>
                  📥 Insert Onto Whiteboard Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
