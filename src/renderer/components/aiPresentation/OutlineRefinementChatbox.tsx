/**
 * OutlineRefinementChatbox.tsx — Conversational Topic Refinement Chatbox
 * Phase 5: Pedagogical Chatbox Connected Directly to Slide Outline
 *
 * Provides real-time conversational topic refinement, enabling teachers to
 * request additions, modifications, solved examples, reordering, and removals.
 */

import React, { FC, useEffect, useRef, useState } from 'react';
import {
  AIProviderType,
  OutlineChatMessage,
  SlideOutlineItem,
  TeachingStyle,
} from '../../../shared/aiPresentationTypes';
import { outlineRefinementService } from '../../services/aiPresentation/outlineRefinementService';
import './OutlineRefinementChatbox.css';

export interface OutlineRefinementChatboxProps {
  topic: string;
  subject?: string;
  gradeLevel?: string;
  teachingStyle?: TeachingStyle;
  currentOutline: SlideOutlineItem[];
  onOutlineChange: (newOutline: SlideOutlineItem[], explanation?: string) => void;
  disabled?: boolean;
  provider?: AIProviderType;
  model?: string;
}

const DEFAULT_SUGGESTION_CHIPS = [
  'Add completing the square before quadratic formula',
  'Include at least two solved examples for every method',
  'Include geometrical interpretation of roots',
  'Remove real-life applications and add numerical practice',
  'Add an interactive quiz at the end',
];

export const OutlineRefinementChatbox: FC<OutlineRefinementChatboxProps> = ({
  topic,
  subject = 'General Science / Mathematics',
  gradeLevel = 'Grade 10',
  teachingStyle = 'interactive',
  currentOutline,
  onOutlineChange,
  disabled = false,
  provider,
  model,
}) => {
  const [messages, setMessages] = useState<OutlineChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I'm your AI Curriculum Refiner for "${topic || 'your lesson'}". Ask me to add topics, insert step-by-step solved examples, rearrange slides, or remove sections in real time.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Dynamic suggestion chips based on topic
  const getContextChips = () => {
    const lowerTopic = (topic || '').toLowerCase();
    if (lowerTopic.includes('quadratic')) {
      return DEFAULT_SUGGESTION_CHIPS;
    }
    return [
      `Add historical background before definitions`,
      `Include at least two solved worked examples`,
      `Add real-world applications & case studies`,
      `Add interactive quiz & diagnostic check at end`,
      `Make it more rigorous with step-by-step derivations`,
    ];
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing || disabled) return;

    setErrorMessage(null);
    setInputText('');

    const userMessage: OutlineChatMessage = {
      id: `msg-teacher-${Date.now()}`,
      sender: 'teacher',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const result = await outlineRefinementService.refineOutline(
        text,
        currentOutline,
        {
          topic: topic || 'Lesson',
          subject,
          gradeLevel,
          teachingStyle,
          provider,
          model,
        },
        [...messages, userMessage]
      );

      const assistantMessage: OutlineChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        sender: 'assistant',
        text: result.explanation,
        timestamp: Date.now(),
        changes: result.changes,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent modal of updated outline
      onOutlineChange(result.updatedOutline, result.explanation);
    } catch (err: any) {
      console.error('[OutlineRefinementChatbox] Refinement error:', err);
      setErrorMessage(err?.message || 'Failed to refine outline. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Chat reset. What modifications would you like to make to the "${topic || 'lesson'}" outline?`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="outline-chatbox-container">
      {/* Header */}
      <div className="outline-chatbox-header">
        <div className="outline-chatbox-title-area">
          <span className="outline-chatbox-spark-icon">✨</span>
          <div>
            <div className="outline-chatbox-title">AI Outline Refiner</div>
            <div className="outline-chatbox-subtitle">
              Refine topics, sequence, and pedagogical depth
            </div>
          </div>
        </div>
        <button
          type="button"
          className="outline-chatbox-btn-icon"
          onClick={handleClearChat}
          title="Clear chat history"
          disabled={disabled || isProcessing}
        >
          🔄
        </button>
      </div>

      {/* Message Stream */}
      <div className="outline-chatbox-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`outline-chatbox-bubble-wrap ${
              msg.sender === 'teacher' ? 'teacher' : 'assistant'
            }`}
          >
            <div className={`outline-chatbox-bubble ${msg.sender}`}>
              <div className="outline-chatbox-bubble-text">{msg.text}</div>

              {/* Change status badges for assistant messages */}
              {msg.changes && (
                <div className="outline-chatbox-changes">
                  {msg.changes.added && msg.changes.added.length > 0 && (
                    <div className="outline-chatbox-change-tag added">
                      <span>+ Added:</span> {msg.changes.added.join(', ')}
                    </div>
                  )}
                  {msg.changes.modified && msg.changes.modified.length > 0 && (
                    <div className="outline-chatbox-change-tag modified">
                      <span>✏️ Modified:</span> {msg.changes.modified.join(', ')}
                    </div>
                  )}
                  {msg.changes.removed && msg.changes.removed.length > 0 && (
                    <div className="outline-chatbox-change-tag removed">
                      <span>✕ Removed:</span> {msg.changes.removed.join(', ')}
                    </div>
                  )}
                  {msg.changes.reordered && (
                    <div className="outline-chatbox-change-tag reordered">
                      <span>⇅ Reordered slides</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="outline-chatbox-bubble-wrap assistant">
            <div className="outline-chatbox-bubble assistant loading">
              <span className="outline-chatbox-spinner" />
              <span>Analyzing curriculum sequence &amp; updating outline...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="outline-chatbox-error">
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* Quick Suggestion Chips */}
      <div className="outline-chatbox-chips-container">
        <div className="outline-chatbox-chips-label">Quick Suggestions:</div>
        <div className="outline-chatbox-chips-scroll">
          {getContextChips().map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="outline-chatbox-chip"
              onClick={() => handleSendMessage(chip)}
              disabled={disabled || isProcessing}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="outline-chatbox-input-bar">
        <input
          ref={inputRef}
          type="text"
          className="outline-chatbox-input"
          placeholder="e.g. Add completing the square before quadratic formula..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isProcessing}
        />
        <button
          type="button"
          className="outline-chatbox-send-btn"
          onClick={() => handleSendMessage()}
          disabled={disabled || isProcessing || !inputText.trim()}
          title="Send refinement instruction"
        >
          {isProcessing ? '⏳' : 'Send'}
        </button>
      </div>
    </div>
  );
};

