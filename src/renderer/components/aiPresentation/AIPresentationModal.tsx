/**
 * AIPresentationModal.tsx — Professional AI Presentation Generation Interface
 * Milestone 5: TASK-109
 * 
 * Provides an intuitive, teacher-friendly configuration and generation interface
 * supporting topic input, auto-subject detection, pedagogical tuning, visual theme swatches,
 * AI provider routing (OpenAI, Gemini, Ollama), encrypted credentials, live progress,
 * and cancellation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AIModelInfo,
  AIProviderType,
  CustomSlideMaster,
  OllamaStatusInfo,
  PresentationGenerationProgress,
  PresentationGenerationResult,
  PresentationTheme,
  PresentationThemeId,
  SlideLayoutType,
  SlideOutlineItem,
  TeachingDifficulty,
  TeachingStyle,
} from '../../../shared/aiPresentationTypes';
import { aiPresentationService } from '../../services/aiPresentation/aiPresentationService';
import { aiProviderManager } from '../../services/aiPresentation/aiProviderManager';
import { customSlideMasterService } from '../../services/aiPresentation/customSlideMasterService';
import {
  DEFAULT_GRADE_LEVEL,
  DEFAULT_LANGUAGE,
  DEFAULT_DIFFICULTY,
  DEFAULT_TEACHING_STYLE,
  DEFAULT_SLIDE_COUNT,
  detectSubjectFromTopic,
} from '../../services/aiPresentation/promptTemplates';
import {
  OPENAI_CURATED_MODELS,
  GEMINI_CURATED_MODELS,
  OLLAMA_RECOMMENDED_MODELS,
} from '../../services/aiPresentation/adapters';
import { SlideDeckPreview } from './SlideDeckPreview';
import { CustomSlideMasterEditor } from './CustomSlideMasterEditor';
import {
  getAllSlideTemplates,
  getSlideTemplateById,
} from '../../services/aiPresentation/slideTemplateCatalog';
import { TemplateThumbnail } from './SlideThumbnailRenderer';
import { OutlineRefinementChatbox } from './OutlineRefinementChatbox';
import { LiveGenerationWorkspace } from './LiveGenerationWorkspace';
import './AIPresentationModal.css';

export interface AIPresentationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (result: PresentationGenerationResult) => void;
  onOpenSettings?: () => void;
  initialTab?: ModalTab;
}

export function getDefaultOutlineForTopic(topic: string, subject?: string): SlideOutlineItem[] {
  const currentTopicLower = (topic || '').toLowerCase();
  if (/place value|place-value|base 10|base-10|number system/i.test(currentTopicLower)) {
    return [
      {
        title: 'Introduction to Place Value & The Base-10 System',
        actionGoal: 'Explain digits 0-9, powers of 10, and positional worth law',
        selected: true,
      },
      {
        title: 'The Place Value Chart & Period Structure',
        actionGoal: 'Break down Ones, Thousands, and Millions periods with comma conventions',
        selected: true,
      },
      {
        title: 'Standard Form, Expanded Form & Word Form',
        actionGoal: 'Show 3 ways to express numbers and how zero acts as a placeholder',
        selected: true,
      },
      {
        title: 'Place Value vs. Face Value Disambiguation',
        actionGoal: 'Contrast intrinsic digit value with column weight with calculation examples',
        selected: true,
      },
      {
        title: 'Worked Example: Comparing & Ordering Large Numbers',
        actionGoal: 'Provide step-by-step positional comparison protocol and practice problem',
        selected: true,
      },
      {
        title: 'Place Value Summary & Concept Mastery Quiz',
        actionGoal: 'Recap key takeaways with a formative classroom exit ticket challenge',
        selected: true,
      },
    ];
  } else if (currentTopicLower.includes('quadratic') || (!topic.trim() && subject === 'Mathematics')) {
    return [
      { title: 'Introduction to Quadratic Equations', actionGoal: 'Generate introduction, real-world hook, and standard definition', selected: true },
      { title: 'Standard Form', actionGoal: 'Explain general form ax² + bx + c = 0 and explain coefficients', selected: true },
      { title: 'Roots of a Quadratic Equation', actionGoal: 'Explain roots as parabola x-intercepts with graphical examples', selected: true },
      { title: 'Discriminant', actionGoal: 'Explain discriminant Δ = b² - 4ac and the 3 root topologies', selected: true },
      { title: 'Solving by Factorisation', actionGoal: 'Generate a step-by-step worked example', selected: true },
      { title: 'Quadratic Formula', actionGoal: 'Explain and derive the quadratic formula', selected: true },
    ];
  } else if (/python|variable|data type|programming|coding/i.test(currentTopicLower) || subject === 'Computer Science') {
    return [
      { title: 'Introduction to Python Variables & Memory Model', actionGoal: 'Explain variables as references, assignment syntax, and dynamic typing', selected: true },
      { title: 'Core Data Types: int, float, str, bool', actionGoal: 'Detailed breakdown with literal examples and type() inspection', selected: true },
      { title: 'Variable Naming Rules & PEP 8 Conventions', actionGoal: 'Valid vs invalid identifiers, keywords, and snake_case standards', selected: true },
      { title: 'Type Conversion (Casting) & Operations', actionGoal: 'Demonstrate int(), float(), str() conversions and common pitfalls', selected: true },
      { title: 'Hands-on Code Walkthrough & Output Prediction', actionGoal: 'Step-by-Step execution tracing and prediction challenge', selected: true },
      { title: 'Summary, Best Practices & Knowledge Check', actionGoal: 'Exit ticket questions and key programming takeaways', selected: true },
    ];
  } else {
    const safeTopic = topic.trim() || 'Classroom Lesson';
    return [
      { title: `Introduction to ${safeTopic}`, actionGoal: 'Generate introduction, core definition, and essential question', selected: true },
      { title: 'Core Principles & Key Concepts', actionGoal: 'Explain fundamental terminology and underlying mechanism', selected: true },
      { title: 'Step-by-Step Derivation & Analysis', actionGoal: 'Provide a structured mathematical or scientific explanation', selected: true },
      { title: 'Worked Example & Problem Solving', actionGoal: 'Walk through a complete solution step by step', selected: true },
      { title: 'Real-World Applications & Summary', actionGoal: 'Connect to practical applications and recap key takeaways', selected: true },
    ];
  }
}

export type ModalTab = 'content' | 'structure' | 'theme' | 'provider';

export function AIPresentationModal({
  isOpen = true,
  onClose,
  onSuccess,
  onOpenSettings,
  initialTab = 'content',
}: AIPresentationModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [previewResult, setPreviewResult] = useState<PresentationGenerationResult | null>(null);

  // ─── Section A: Presentation Content ─────────────────────────────────────────
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('General Education');
  const [isSubjectManual, setIsSubjectManual] = useState(false);
  const [gradeLevel, setGradeLevel] = useState(DEFAULT_GRADE_LEVEL);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [difficulty, setDifficulty] = useState<TeachingDifficulty>(DEFAULT_DIFFICULTY);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // ─── Section B: Presentation Structure ───────────────────────────────────────
  const [numberOfSlides, setNumberOfSlides] = useState(DEFAULT_SLIDE_COUNT);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>(DEFAULT_TEACHING_STYLE);
  const [learningObjectives, setLearningObjectives] = useState('');

  // ─── Section C: Visual Theme & Slide Master Templates ────────────────────────
  const [selectedThemeId, setSelectedThemeId] = useState<PresentationThemeId>('modern-academic');
  const [selectedTemplateId, setSelectedTemplateId] = useState<SlideLayoutType>('concept-explanation');
  const availableThemes: PresentationTheme[] = aiPresentationService.getAvailableThemes();
  const availableTemplates = useMemo(() => getAllSlideTemplates(), []);

  // Phase 2: Custom Slide Masters & Designer state
  const [customMasters, setCustomMasters] = useState<CustomSlideMaster[]>(() =>
    customSlideMasterService.getAllMasters()
  );
  const [selectedMasterId, setSelectedMasterId] = useState<string>('preset-standard-classroom');
  const [isMasterEditorOpen, setIsMasterEditorOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<CustomSlideMaster | null>(null);

  // Phase 2: Slide Outline Mode (Teacher-Defined Titles & AI Action)
  const [isOutlineMode, setIsOutlineMode] = useState(false);
  const [isOutlineCustomized, setIsOutlineCustomized] = useState(false);
  const [slideOutline, setSlideOutline] = useState<SlideOutlineItem[]>(() =>
    getDefaultOutlineForTopic('', 'General Education')
  );

  // ─── Section D: AI Provider & Models ─────────────────────────────────────────
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>(
    aiProviderManager.getActiveProvider()
  );
  const [selectedModel, setSelectedModel] = useState(
    aiProviderManager.getSelectedModel(selectedProvider)
  );
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState(
    aiProviderManager.getCustomEndpoint(selectedProvider)
  );
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusInfo | null>(null);
  const [ollamaModels, setOllamaModels] = useState<AIModelInfo[]>([]);
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{ success: boolean; message: string } | null>(null);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ─── Section E: Generation State & Progress ──────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLiveWorkspaceOpen, setIsLiveWorkspaceOpen] = useState(false);
  const [progress, setProgress] = useState<PresentationGenerationProgress | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Synchronize credentials and model list when provider changes
  useEffect(() => {
    let isMounted = true;

    async function loadProviderInfo() {
      if (selectedProvider === 'ollama') {
        try {
          const status = await aiProviderManager.checkOllamaStatus();
          if (isMounted) setOllamaStatus(status);
          const models = await aiProviderManager.getAvailableModels('ollama');
          if (isMounted && Array.isArray(models) && models.length > 0) {
            setOllamaModels(models);
            if (!models.some((m) => m.id === selectedModel)) {
              setSelectedModel(models[0].id);
            }
          }
        } catch {
          if (isMounted) {
            setOllamaStatus({
              status: 'unavailable',
              available: false,
              message: 'Ollama daemon offline',
              installedModels: [],
              selectedModelAvailable: false,
            });
          }
        }
      } else {
        try {
          const hasKey = await aiProviderManager.hasApiKey(selectedProvider);
          if (isMounted) setHasApiKey(hasKey);
        } catch {
          if (isMounted) setHasApiKey(false);
        }
      }
    }

    loadProviderInfo();
    return () => {
      isMounted = false;
    };
  }, [selectedProvider]);

  // Handle Escape key to cancel generation or close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isGenerating && abortController) {
          abortController.abort();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, abortController, onClose]);

  // Handle Topic Input with Auto-Subject Detection
  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    setValidationError(null);
    const cleanTopic = newTopic.trim();
    if (cleanTopic) {
      let currentSubject = subject;
      if (!isSubjectManual) {
        currentSubject = detectSubjectFromTopic(cleanTopic);
        setSubject(currentSubject);
      }
      if (!isOutlineCustomized) {
        const freshOutline = getDefaultOutlineForTopic(cleanTopic, currentSubject);
        setSlideOutline(freshOutline);
        setNumberOfSlides(freshOutline.length);
      }
    }
  };

  const handleAutoDetectSubject = () => {
    if (!topic.trim()) {
      setSubject('General Education');
      setIsSubjectManual(false);
      return;
    }
    const detected = detectSubjectFromTopic(topic.trim());
    setSubject(detected);
    setIsSubjectManual(false);
    const freshOutline = getDefaultOutlineForTopic(topic.trim(), detected);
    setSlideOutline(freshOutline);
    setNumberOfSlides(freshOutline.length);
    setIsOutlineCustomized(false);
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    setIsSubjectManual(true);
  };

  const handleSlideCountChange = (count: number) => {
    const clamped = Math.max(3, Math.min(15, count));
    setNumberOfSlides(clamped);
    setDurationMinutes(Math.max(15, clamped * 5));
  };

  const handleProviderChange = (provider: AIProviderType) => {
    setSelectedProvider(provider);
    setSelectedModel(aiProviderManager.getSelectedModel(provider));
    setCustomEndpoint(aiProviderManager.getCustomEndpoint(provider));
    setConnResult(null);
    setKeyFeedback(null);
  };

  // Quick Inline API Key Save
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      const res = await aiProviderManager.saveApiKey(selectedProvider, apiKeyInput.trim());
      if (res.success) {
        setApiKeyInput('');
        setHasApiKey(true);
        setKeyFeedback({
          type: 'success',
          message: `API key encrypted and safely stored for ${selectedProvider.toUpperCase()} via OS safeStorage.`,
        });
      } else {
        setKeyFeedback({ type: 'error', message: res.error || 'Failed to encrypt API key.' });
      }
    } catch (err: any) {
      setKeyFeedback({ type: 'error', message: err?.message || 'Error saving credentials.' });
    }
  };

  // Connection Test
  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnResult(null);
    try {
      const res = await aiProviderManager.testConnection(selectedProvider);
      if (res.success) {
        setConnResult({
          success: true,
          message: `Connection successful (${res.latencyMs || 0}ms). Verified ${res.models?.length || 0} models.`,
        });
        if (selectedProvider === 'ollama') {
          if (Array.isArray(res.models) && res.models.length > 0) {
            const mapped: AIModelInfo[] = res.models.map((id) => ({
              id,
              name: id,
              provider: 'ollama',
              isLocal: true,
            }));
            setOllamaModels(mapped);
            if (!mapped.some((m) => m.id === selectedModel)) {
              setSelectedModel(mapped[0].id);
            }
          } else {
            const models = await aiProviderManager.getAvailableModels('ollama');
            if (models.length > 0) {
              setOllamaModels(models);
              if (!models.some((m) => m.id === selectedModel)) {
                setSelectedModel(models[0].id);
              }
            }
          }
        }
      } else {
        setConnResult({
          success: false,
          message: res.error || 'Connection check failed. Verify API key or daemon endpoint.',
        });
      }
    } catch (err: any) {
      setConnResult({
        success: false,
        message: err?.message || 'Failed to reach AI provider.',
      });
    } finally {
      setTestingConn(false);
    }
  };

  // Phase 2: Slide Outline Management Handlers
  const handleAddOutlineSlide = () => {
    setIsOutlineCustomized(true);
    setSlideOutline((prev) => [
      ...prev,
      {
        title: `Slide ${prev.length + 1}`,
        actionGoal: 'Explain concept with classroom examples and formula',
      },
    ]);
  };

  const handleRemoveOutlineSlide = (index: number) => {
    if (slideOutline.length <= 1) return;
    setIsOutlineCustomized(true);
    setSlideOutline((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateOutlineSlide = (index: number, field: keyof SlideOutlineItem, value: any) => {
    setIsOutlineCustomized(true);
    setSlideOutline((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleToggleOutlineSelect = (index: number) => {
    setIsOutlineCustomized(true);
    setSlideOutline((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: item.selected === false ? true : false } : item
      )
    );
  };

  const handleMoveOutlineSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slideOutline.length) return;
    setIsOutlineCustomized(true);
    setSlideOutline((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleAutoSuggestOutline = () => {
    const fresh = getDefaultOutlineForTopic(topic.trim(), subject);
    setSlideOutline(fresh);
    setNumberOfSlides(fresh.length);
    setIsOutlineCustomized(false);
  };

  // Start Generation: Launches Phase 6 Live Progressive Generation Workspace
  const handleGenerate = async (forceFallback = false) => {
    if (!topic.trim()) {
      setValidationError('Please enter a presentation topic to begin.');
      setActiveTab('content');
      return;
    }

    setValidationError(null);
    setGenerationError(null);
    setIsLiveWorkspaceOpen(true);
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsGenerating(false);
  };

  // Selected Theme helper
  const currentTheme = availableThemes.find((t) => t.id === selectedThemeId) || availableThemes[0];

  // Phase 6: Live Progressive Presentation Workspace
  if (isLiveWorkspaceOpen) {
    const activeMaster = selectedMasterId ? customSlideMasterService.getMasterById(selectedMasterId) : undefined;
    const outlineForTopic =
      !isOutlineCustomized && topic.trim()
        ? getDefaultOutlineForTopic(topic.trim(), subject)
        : slideOutline;
    const effectiveOutline =
      outlineForTopic && outlineForTopic.length > 0
        ? outlineForTopic
        : getDefaultOutlineForTopic(topic.trim(), subject);

    return (
      <LiveGenerationWorkspace
        isOpen={true}
        topic={topic.trim()}
        subject={subject}
        gradeLevel={gradeLevel}
        language={language}
        difficulty={difficulty}
        teachingStyle={teachingStyle}
        themeId={activeMaster?.theme.id ? (activeMaster.theme.id as PresentationThemeId) : selectedThemeId}
        customMasterId={selectedMasterId || undefined}
        outline={effectiveOutline}
        provider={selectedProvider}
        model={selectedModel}
        onClose={() => {
          setIsLiveWorkspaceOpen(false);
          onClose();
        }}
        onBackToOutline={() => {
          setIsLiveWorkspaceOpen(false);
          setIsOutlineMode(true);
        }}
        onInserted={(pages) => {
          setIsLiveWorkspaceOpen(false);
          onSuccess?.({
            success: true,
            pages,
            themeUsed: currentTheme,
            durationMs: 0,
            warnings: [],
            source: 'ai',
          });
          onClose();
        }}
      />
    );
  }

  if (previewResult) {
    return (
      <SlideDeckPreview
        isOpen={true}
        presentationResult={previewResult}
        onClose={() => {
          setPreviewResult(null);
          onClose();
        }}
        onBackToGenerator={() => {
          setPreviewResult(null);
        }}
        onInserted={(_pages) => {
          setPreviewResult(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div
      className="ai-pres-overlay"
      onClick={() => {
        if (!isGenerating) onClose();
      }}
    >
      <div
        className="ai-pres-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-pres-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-pres-header">
          <div className="ai-pres-title-group">
            <div className="ai-pres-wand-icon" aria-hidden="true">
              🪄
            </div>
            <div>
              <h3 id="ai-pres-title">AI Teaching Presentation Generator</h3>
              <p>Generate professional 16:9 classroom slides with native editable text, shapes, and formulas</p>
            </div>
          </div>
          <button
            className="ai-pres-close-btn"
            onClick={onClose}
            disabled={isGenerating}
            title="Close generator (Esc)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="ai-pres-tabs" role="tablist">
          <button
            className={`ai-pres-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
            role="tab"
            aria-selected={activeTab === 'content'}
          >
            <span>📖</span> Content & Pedagogy
          </button>
          <button
            className={`ai-pres-tab ${activeTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('structure')}
            role="tab"
            aria-selected={activeTab === 'structure'}
          >
            <span>📐</span> Structure ({numberOfSlides} Slides)
          </button>
          <button
            className={`ai-pres-tab ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
            role="tab"
            aria-selected={activeTab === 'theme'}
          >
            <span>🎨</span> Theme &amp; Templates ({currentTheme.name})
          </button>
          <button
            className={`ai-pres-tab ${activeTab === 'provider' ? 'active' : ''}`}
            onClick={() => setActiveTab('provider')}
            role="tab"
            aria-selected={activeTab === 'provider'}
          >
            <span>⚙️</span> AI Provider ({selectedProvider.toUpperCase()})
          </button>
        </div>

        {/* Modal Body */}
        <div className="ai-pres-body">
          {/* TAB 1: Content & Pedagogy */}
          {activeTab === 'content' && (
            <div className="ai-pres-section-grid">
              {/* Topic Field (Required) */}
              <div className="ai-pres-field-full">
                <label className="ai-pres-label" htmlFor="pres-topic">
                  <span>Topic / Lesson Focus *</span>
                </label>
                <input
                  id="pres-topic"
                  type="text"
                  className="ai-pres-input"
                  placeholder="e.g., Photosynthesis & Cellular Energy, Newton's Third Law, French Revolution..."
                  value={topic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={isGenerating}
                  autoFocus
                />
                {validationError && (
                  <div className="ai-pres-banner error" style={{ marginTop: 6 }}>
                    ⚠️ {validationError}
                  </div>
                )}
              </div>

              {/* Subject Field */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="ai-pres-label" htmlFor="pres-subject" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Subject Discipline</span>
                    {!isSubjectManual && topic.trim() && <span className="badge-auto">Auto-Detected</span>}
                  </label>
                  <button
                    type="button"
                    className="ai-pres-btn"
                    style={{
                      fontSize: 11,
                      padding: '3px 9px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#93c5fd',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onClick={handleAutoDetectSubject}
                    title="Analyze lesson topic to auto-detect subject and recommended slide milestones"
                  >
                    <span>⚡</span> Auto-Detect Subject
                  </button>
                </div>
                <input
                  id="pres-subject"
                  type="text"
                  className="ai-pres-input"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Physics, Biology, Mathematics..."
                />
              </div>

              {/* Grade Level */}
              <div>
                <label className="ai-pres-label" htmlFor="pres-grade">
                  <span>Grade / Education Level</span>
                </label>
                <select
                  id="pres-grade"
                  className="ai-pres-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="Elementary (Grades 1-5)">Elementary School (Grades 1-5)</option>
                  <option value="Middle School (Grades 6-8)">Middle School (Grades 6-8)</option>
                  <option value="High School (Grades 9-10)">High School (Grades 9-10) — Default</option>
                  <option value="High School (Grades 11-12)">High School (Grades 11-12)</option>
                  <option value="College / Undergraduate">College / Undergraduate</option>
                  <option value="Advanced / Professional">Advanced / Professional</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="ai-pres-label" htmlFor="pres-language">
                  <span>Instructional Language</span>
                </label>
                <select
                  id="pres-language"
                  className="ai-pres-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Mandarin">Mandarin (中文)</option>
                  <option value="Arabic">Arabic (العربية)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                </select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="ai-pres-label" htmlFor="pres-difficulty">
                  <span>Difficulty Level</span>
                </label>
                <select
                  id="pres-difficulty"
                  className="ai-pres-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as TeachingDifficulty)}
                  disabled={isGenerating}
                >
                  <option value="introductory">Introductory (Basic Concepts & Terminology)</option>
                  <option value="intermediate">Intermediate (Standard Curriculum — Default)</option>
                  <option value="advanced">Advanced (Deep Mechanisms & Complex Problems)</option>
                </select>
              </div>

              {/* Additional Teaching Instructions */}
              <div className="ai-pres-field-full">
                <label className="ai-pres-label" htmlFor="pres-instructions">
                  <span>Additional Teacher Instructions (Optional)</span>
                </label>
                <textarea
                  id="pres-instructions"
                  className="ai-pres-textarea"
                  placeholder="e.g. Include student pair-share questions, emphasize SI units, provide step-by-step calculus proofs, or highlight common exam pitfalls."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  disabled={isGenerating}
                />
                <div className="ai-pres-hint">
                  The AI assistant will tailor lecture talking points and card content to these guidelines.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Structure & Pedagogy */}
          {activeTab === 'structure' && (
            <div>
              {/* Mode Toggle: Curriculum Flow vs Custom Slide Outline */}
              <div className="ai-pres-mode-toggle-bar">
                <div className="ai-pres-mode-toggle">
                  <button
                    type="button"
                    className={`ai-pres-mode-pill ${!isOutlineMode ? 'active' : ''}`}
                    onClick={() => setIsOutlineMode(false)}
                    disabled={isGenerating}
                  >
                    <span>📚</span> Curriculum Flow (Auto-Generated)
                  </button>
                  <button
                    type="button"
                    className={`ai-pres-mode-pill ${isOutlineMode ? 'active' : ''}`}
                    onClick={() => {
                      setIsOutlineMode(true);
                      if (slideOutline.length === 0) {
                        handleAutoSuggestOutline();
                      }
                    }}
                    disabled={isGenerating}
                  >
                    <span>✏️</span> Custom Slide Outline (Teacher-Defined Titles)
                  </button>
                </div>
              </div>

              {!isOutlineMode ? (
                <div className="ai-pres-section-grid">
                  {/* Number of Slides */}
                  <div className="ai-pres-field-full">
                    <label className="ai-pres-label" htmlFor="pres-slide-slider">
                      <span>Number of Slides (3 to 15)</span>
                      <span className="ai-pres-counter-badge">{numberOfSlides} Slides</span>
                    </label>
                    <div className="ai-pres-slider-row">
                      <span style={{ fontSize: 12, color: '#64748b' }}>3</span>
                      <input
                        id="pres-slide-slider"
                        type="range"
                        min="3"
                        max="15"
                        step="1"
                        className="ai-pres-slider"
                        value={numberOfSlides}
                        onChange={(e) => handleSlideCountChange(Number(e.target.value))}
                        disabled={isGenerating}
                      />
                      <span style={{ fontSize: 12, color: '#64748b' }}>15</span>
                    </div>
                    <div className="ai-pres-hint">
                      Standard recommended structure: 5 slides (Introduction, Terminology, Worked Example, Applications, Quiz).
                    </div>
                  </div>

                  {/* Target Duration */}
                  <div>
                    <label className="ai-pres-label" htmlFor="pres-duration">
                      <span>Target Class Duration (Minutes)</span>
                    </label>
                    <input
                      id="pres-duration"
                      type="number"
                      min="5"
                      max="180"
                      step="5"
                      className="ai-pres-input"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value)))}
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Teaching Style */}
                  <div>
                    <label className="ai-pres-label" htmlFor="pres-style">
                      <span>Pedagogical Teaching Style</span>
                    </label>
                    <select
                      id="pres-style"
                      className="ai-pres-select"
                      value={teachingStyle}
                      onChange={(e) => setTeachingStyle(e.target.value as TeachingStyle)}
                      disabled={isGenerating}
                    >
                      <option value="interactive">Interactive &amp; Discussion (Default)</option>
                      <option value="lecture">Direct Instruction / Formal Lecture</option>
                      <option value="socratic">Socratic Questioning &amp; Inquiry</option>
                      <option value="inquiry-based">Inquiry-Based Learning &amp; Discovery</option>
                      <option value="storytelling">Narrative Storytelling &amp; Case Studies</option>
                      <option value="exam-prep">Exam Preparation &amp; Problem Protocols</option>
                    </select>
                  </div>

                  {/* Learning Objectives */}
                  <div className="ai-pres-field-full">
                    <label className="ai-pres-label" htmlFor="pres-objectives">
                      <span>Specific Learning Objectives (Optional)</span>
                    </label>
                    <textarea
                      id="pres-objectives"
                      className="ai-pres-textarea"
                      placeholder="Enter learning goals separated by newlines, e.g.:&#10;• Understand the cellular anatomy of chloroplasts&#10;• Write the chemical formula for light reactions&#10;• Differentiate between C3 and C4 pathways"
                      value={learningObjectives}
                      onChange={(e) => setLearningObjectives(e.target.value)}
                      disabled={isGenerating}
                    />
                    <div className="ai-pres-hint">
                      Leave blank to allow the curriculum planner to generate Bloom’s taxonomy objectives automatically.
                    </div>
                  </div>
                </div>
              ) : (
                /* Outline Mode: Teacher-Defined Titles & Goals + Chat Refiner */
                <div className="ai-pres-outline-section">
                  <div className="ai-pres-outline-split-container">
                    {/* Left Column: Outline List */}
                    <div className="ai-pres-outline-list-panel">
                      <div className="ai-pres-outline-header">
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                            Define Slide Titles for AI Content Generation
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            AI will generate comprehensive classroom teaching content for each title using your selected master layout.
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ai-pres-btn secondary"
                          style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={handleAutoSuggestOutline}
                          disabled={isGenerating}
                          title="Auto-suggest sequential milestones for this topic"
                        >
                          <span>⚡</span> Auto-Suggest Outline
                        </button>
                      </div>

                      <div className="ai-pres-outline-list">
                        {slideOutline.map((item, index) => {
                          const isExcluded = item.selected === false;
                          return (
                            <div
                              key={item.id || index}
                              className={`ai-pres-outline-card ${isExcluded ? 'excluded' : ''} ${item.changeStatus || ''}`}
                            >
                              <div className="ai-pres-outline-card-top">
                                <div className="ai-pres-outline-top-left">
                                  <label
                                    className="ai-pres-outline-checkbox-label"
                                    title={isExcluded ? 'Click to include in presentation' : 'Click to exclude from presentation'}
                                  >
                                    <input
                                      type="checkbox"
                                      className="ai-pres-outline-checkbox"
                                      checked={!isExcluded}
                                      onChange={() => handleToggleOutlineSelect(index)}
                                      disabled={isGenerating}
                                    />
                                    <span className="ai-pres-outline-badge">
                                      Slide {index + 1}
                                    </span>
                                  </label>

                                  {item.changeStatus === 'added' && (
                                    <span className="ai-pres-status-badge added">+ Added</span>
                                  )}
                                  {item.changeStatus === 'modified' && (
                                    <span className="ai-pres-status-badge modified">✏️ Modified</span>
                                  )}
                                </div>

                                <div className="ai-pres-outline-actions">
                                  <button
                                    type="button"
                                    className="ai-pres-outline-btn"
                                    disabled={index === 0 || isGenerating}
                                    onClick={() => handleMoveOutlineSlide(index, 'up')}
                                    title="Move slide up"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    className="ai-pres-outline-btn"
                                    disabled={index === slideOutline.length - 1 || isGenerating}
                                    onClick={() => handleMoveOutlineSlide(index, 'down')}
                                    title="Move slide down"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    type="button"
                                    className="ai-pres-outline-btn delete"
                                    disabled={slideOutline.length <= 1 || isGenerating}
                                    onClick={() => handleRemoveOutlineSlide(index)}
                                    title="Remove slide"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>

                              <div className="ai-pres-outline-fields">
                                <div className="ai-pres-outline-field-row">
                                  <label className="ai-pres-outline-sublabel">Slide Title</label>
                                  <input
                                    type="text"
                                    className="ai-pres-input ai-pres-outline-input"
                                    value={item.title}
                                    placeholder="e.g. Introduction to Quadratic Equations"
                                    onChange={(e) => handleUpdateOutlineSlide(index, 'title', e.target.value)}
                                    disabled={isGenerating}
                                  />
                                </div>
                                <div className="ai-pres-outline-field-row">
                                  <label className="ai-pres-outline-sublabel">AI Action / Goal</label>
                                  <input
                                    type="text"
                                    className="ai-pres-input ai-pres-outline-input"
                                    style={{ fontSize: 12, color: '#94a3b8' }}
                                    value={item.actionGoal || ''}
                                    placeholder="e.g. Generate definition, standard form, and worked example"
                                    onChange={(e) => handleUpdateOutlineSlide(index, 'actionGoal', e.target.value)}
                                    disabled={isGenerating}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <button
                          type="button"
                          className="ai-pres-btn secondary"
                          style={{ fontSize: 12, padding: '6px 14px' }}
                          onClick={handleAddOutlineSlide}
                          disabled={slideOutline.length >= 15 || isGenerating}
                        >
                          + Add Slide
                        </button>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {slideOutline.filter((s) => s.selected !== false).length} of {slideOutline.length} Slides Selected ({slideOutline.filter((s) => s.selected !== false).length * 5} min estimated duration)
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Conversational Topic Refinement Chatbox */}
                    <div className="ai-pres-outline-chat-panel">
                      <OutlineRefinementChatbox
                        topic={topic}
                        subject={subject}
                        gradeLevel={gradeLevel}
                        teachingStyle={teachingStyle}
                        currentOutline={slideOutline}
                        onOutlineChange={(newOutline) => {
                          setSlideOutline(newOutline);
                        }}
                        disabled={isGenerating}
                        provider={selectedProvider}
                        model={selectedModel}
                      />
                    </div>
                  </div>

                  <div className="ai-pres-section-grid" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <label className="ai-pres-label" htmlFor="pres-style-outline">
                        <span>Pedagogical Teaching Style</span>
                      </label>
                      <select
                        id="pres-style-outline"
                        className="ai-pres-select"
                        value={teachingStyle}
                        onChange={(e) => setTeachingStyle(e.target.value as TeachingStyle)}
                        disabled={isGenerating}
                      >
                        <option value="interactive">Interactive &amp; Discussion (Default)</option>
                        <option value="lecture">Direct Instruction / Formal Lecture</option>
                        <option value="socratic">Socratic Questioning &amp; Inquiry</option>
                        <option value="inquiry-based">Inquiry-Based Learning &amp; Discovery</option>
                        <option value="storytelling">Narrative Storytelling &amp; Case Studies</option>
                        <option value="exam-prep">Exam Preparation &amp; Problem Protocols</option>
                      </select>
                    </div>

                    <div>
                      <label className="ai-pres-label" htmlFor="pres-duration-outline">
                        <span>Target Duration (Minutes)</span>
                      </label>
                      <input
                        id="pres-duration-outline"
                        type="number"
                        min="5"
                        max="180"
                        step="5"
                        className="ai-pres-input"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value)))}
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Visual Themes & Slide Master Templates */}
          {activeTab === 'theme' && (
            <div>
              {/* Phase 2: Reusable Slide Masters Section */}
              <div className="ai-pres-masters-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                      <span>📐</span> Reusable Slide Masters &amp; Custom Layouts
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Preserve teacher's exact layout, school branding, accent bars, and cards during AI generation.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ai-pres-btn primary"
                    style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => {
                      setEditingMaster(null);
                      setIsMasterEditorOpen(true);
                    }}
                    disabled={isGenerating}
                  >
                    <span>✨</span> Design Custom Master
                  </button>
                </div>

                <div className="ai-pres-masters-grid">
                  {customMasters.map((master) => {
                    const isSelected = master.id === selectedMasterId;
                    return (
                      <div
                        key={master.id}
                        className={`ai-pres-master-card ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedMasterId(master.id);
                          if (master.theme.id) {
                            setSelectedThemeId(master.theme.id as PresentationThemeId);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedMasterId(master.id);
                            if (master.theme.id) {
                              setSelectedThemeId(master.theme.id as PresentationThemeId);
                            }
                          }
                        }}
                      >
                        <div className="ai-pres-master-preview-box">
                          <TemplateThumbnail master={master} className="ai-pres-master-vector-thumb" />
                        </div>
                        <div className="ai-pres-master-meta">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="ai-pres-master-name">{master.name}</span>
                            {(master.decorations.brandingText || master.brandingText) && (
                              <span className="ai-pres-master-badge">
                                {master.decorations.brandingText || master.brandingText}
                              </span>
                            )}
                          </div>
                          <div className="ai-pres-master-desc">{master.description}</div>
                          <div className="ai-pres-master-footer">
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              {master.placeholders.length} placeholders • {master.isBuiltIn ?? master.isPreset ? 'Preset' : 'Custom'}
                            </span>
                            {!(master.isBuiltIn ?? master.isPreset) && (
                              <button
                                type="button"
                                className="ai-pres-master-edit-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMaster(master);
                                  setIsMasterEditorOpen(true);
                                }}
                                title="Edit this slide master"
                              >
                                ✏️ Edit
                              </button>
                            )}
                          </div>
                        </div>
                        {isSelected && <div className="ai-pres-theme-check">✓</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 12, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: 13, color: '#94a3b8' }}>
                Classroom themes calibrated for high-contrast projector display and readable typography:
              </div>
              <div className="ai-pres-themes-grid">
                {availableThemes.map((theme) => {
                  const isSelected = theme.id === selectedThemeId;
                  const activeTemplate = getSlideTemplateById(selectedTemplateId) || availableTemplates[0];
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`ai-pres-theme-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedThemeId(theme.id as PresentationThemeId)}
                      disabled={isGenerating}
                    >
                      {/* High-Fidelity Vector Slide Preview Box */}
                      <div
                        className="ai-pres-theme-preview-box"
                        style={{
                          backgroundColor: theme.backgroundColor,
                          color: theme.primaryText,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <TemplateThumbnail
                          template={activeTemplate}
                          theme={theme}
                          className="ai-pres-theme-vector-thumb"
                        />
                      </div>

                      {/* Theme Meta & Swatches */}
                      <div className="ai-pres-theme-meta">
                        <div className="ai-pres-theme-name">{theme.name}</div>
                        <div className="ai-pres-theme-desc">{theme.description}</div>
                        <div className="ai-pres-theme-swatches">
                          <span
                            className="ai-pres-swatch"
                            style={{ backgroundColor: theme.backgroundColor }}
                            title="Background"
                          />
                          <span
                            className="ai-pres-swatch"
                            style={{ backgroundColor: theme.cardBackground }}
                            title="Card Background"
                          />
                          <span
                            className="ai-pres-swatch"
                            style={{ backgroundColor: theme.primaryText }}
                            title="Primary Text"
                          />
                          <span
                            className="ai-pres-swatch"
                            style={{ backgroundColor: theme.accentColor }}
                            title="Accent"
                          />
                        </div>
                      </div>

                      {isSelected && <div className="ai-pres-theme-check">✓</div>}
                    </button>
                  );
                })}
              </div>

              {/* Master Slide Templates & Layouts Gallery */}
              <div className="ai-pres-templates-section" style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #334155' }}>
                <div className="ai-pres-templates-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                    <span>📐</span> Master Slide Templates &amp; Layout Archetypes
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Previewing in <strong>{currentTheme.name}</strong> theme
                  </span>
                </div>
                <div className="ai-pres-templates-grid">
                  {availableTemplates.map((tpl) => {
                    const isSelected = tpl.id === selectedTemplateId;
                    return (
                      <div
                        key={tpl.id}
                        className={`ai-pres-template-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedTemplateId(tpl.id as SlideLayoutType)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedTemplateId(tpl.id as SlideLayoutType);
                          }
                        }}
                      >
                        <div className="ai-pres-template-preview-wrapper">
                          <TemplateThumbnail template={tpl} theme={currentTheme} />
                        </div>
                        <div className="ai-pres-template-info">
                          <div className="ai-pres-template-name">{tpl.name}</div>
                          <div className="ai-pres-template-desc">{tpl.description}</div>
                          <div className="ai-pres-template-placeholders">
                            {tpl.placeholders.slice(0, 4).map((ph) => (
                              <span key={ph.id} className="ai-pres-ph-tag" title={ph.label}>
                                {ph.contentType}
                              </span>
                            ))}
                            {tpl.placeholders.length > 4 && (
                              <span className="ai-pres-ph-tag" style={{ opacity: 0.7 }}>
                                +{tpl.placeholders.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI Provider & Models */}
          {activeTab === 'provider' && (
            <div>
              {/* Provider Selector Tabs */}
              <div className="ai-pres-provider-selector">
                <button
                  type="button"
                  className={`ai-pres-provider-btn ${selectedProvider === 'openai' ? 'active' : ''}`}
                  onClick={() => handleProviderChange('openai')}
                  disabled={isGenerating}
                >
                  <div className="ai-pres-provider-name">
                    <span>⚡</span> OpenAI (Cloud)
                  </div>
                  <div className="ai-pres-provider-desc">GPT-4o, GPT-4o-mini & custom endpoints</div>
                </button>

                <button
                  type="button"
                  className={`ai-pres-provider-btn ${selectedProvider === 'gemini' ? 'active' : ''}`}
                  onClick={() => handleProviderChange('gemini')}
                  disabled={isGenerating}
                >
                  <div className="ai-pres-provider-name">
                    <span>✨</span> Google Gemini
                  </div>
                  <div className="ai-pres-provider-desc">Gemini 2.0 Flash & Gemini 1.5 Pro</div>
                </button>

                <button
                  type="button"
                  className={`ai-pres-provider-btn ${selectedProvider === 'ollama' ? 'active' : ''}`}
                  onClick={() => handleProviderChange('ollama')}
                  disabled={isGenerating}
                >
                  <div className="ai-pres-provider-name">
                    <span>🦙</span> Ollama (Offline)
                  </div>
                  <div className="ai-pres-provider-desc">100% Private local models (No API key)</div>
                </button>
              </div>

              {/* Status Badge */}
              <div>
                {selectedProvider === 'ollama' ? (
                  <div
                    className={`ai-pres-status-badge ${
                      ollamaStatus?.available ? 'configured' : 'offline'
                    }`}
                  >
                    <span>{ollamaStatus?.available ? '●' : '○'}</span>
                    {ollamaStatus?.available
                      ? `Ollama Daemon Online (${ollamaModels.length} models installed)`
                      : 'Ollama Daemon Offline (localhost:11434)'}
                  </div>
                ) : (
                  <div className={`ai-pres-status-badge ${hasApiKey ? 'configured' : 'warning'}`}>
                    <span>{hasApiKey ? '🔒' : '⚠️'}</span>
                    {hasApiKey
                      ? `${selectedProvider.toUpperCase()} API Key Configured (Encrypted)`
                      : `No ${selectedProvider.toUpperCase()} API Key Configured`}
                  </div>
                )}
              </div>

              {/* Model Selection */}
              <div className="ai-pres-section-grid" style={{ marginBottom: 16 }}>
                <div>
                  <label className="ai-pres-label" htmlFor="pres-model-select">
                    <span>Target Educational Model</span>
                  </label>
                  <select
                    id="pres-model-select"
                    className="ai-pres-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isGenerating}
                  >
                    {selectedProvider === 'openai' && (
                      <>
                        {OPENAI_CURATED_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.parameterSize ? `(${m.parameterSize})` : ''}
                          </option>
                        ))}
                      </>
                    )}
                    {selectedProvider === 'gemini' && (
                      <>
                        {GEMINI_CURATED_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.parameterSize ? `(${m.parameterSize})` : ''}
                          </option>
                        ))}
                      </>
                    )}
                    {selectedProvider === 'ollama' && (
                      <>
                        {ollamaModels.length > 0 ? (
                          <>
                            <optgroup label="Installed Local Models (Ready to Use)">
                              {ollamaModels.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name || m.id} {m.sizeFormatted ? `(${m.sizeFormatted})` : ''} — Installed
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Other Curated Models (Need Pulling in Terminal)">
                              {OLLAMA_RECOMMENDED_MODELS.filter(
                                (rm) => !ollamaModels.some((om) => om.id === rm.id || om.id.startsWith(rm.id.split(':')[0]))
                              ).map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} (Not Installed)
                                </option>
                              ))}
                            </optgroup>
                          </>
                        ) : (
                          <>
                            {OLLAMA_RECOMMENDED_MODELS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} {m.parameterSize ? `(${m.parameterSize})` : ''}
                              </option>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </select>
                </div>

                {/* Test Connection Button */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="ai-pres-btn-sm"
                    onClick={handleTestConnection}
                    disabled={testingConn || isGenerating}
                    style={{ height: 38 }}
                  >
                    {testingConn ? 'Testing Connection...' : '⚡ Test Connection'}
                  </button>
                </div>
              </div>

              {/* Inline API Key Entry for OpenAI/Gemini */}
              {selectedProvider !== 'ollama' && (
                <div>
                  <label className="ai-pres-label" htmlFor="pres-apikey-input">
                    <span>Update Encrypted API Key</span>
                  </label>
                  <div className="ai-pres-key-row">
                    <input
                      id="pres-apikey-input"
                      type="password"
                      className="ai-pres-input"
                      placeholder={
                        hasApiKey
                          ? '•••••••••••••••••••••••••••••••• (Key Configured)'
                          : `Enter ${selectedProvider.toUpperCase()} API key...`
                      }
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      className="ai-pres-btn-sm"
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput.trim() || isGenerating}
                    >
                      Save Key
                    </button>
                  </div>
                  <div className="ai-pres-hint">
                    API keys are encrypted using OS safeStorage (DPAPI on Windows) and never transmitted to third parties.
                  </div>
                </div>
              )}

              {/* Ollama Endpoint Configuration */}
              {selectedProvider === 'ollama' && (
                <div>
                  <label className="ai-pres-label" htmlFor="pres-ollama-endpoint">
                    <span>Local Ollama Endpoint</span>
                  </label>
                  <input
                    id="pres-ollama-endpoint"
                    type="text"
                    className="ai-pres-input"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="http://localhost:11434"
                    disabled={isGenerating}
                  />
                  <div className="ai-pres-hint">
                    Ollama runs locally on your machine. Ensure <code>ollama serve</code> is active in terminal.
                  </div>
                </div>
              )}

              {/* Connection or Key Feedback */}
              {connResult && (
                <div className={`ai-pres-banner ${connResult.success ? 'success' : 'error'}`}>
                  {connResult.success ? '✓' : '⚠️'} {connResult.message}
                </div>
              )}
              {keyFeedback && (
                <div className={`ai-pres-banner ${keyFeedback.type}`}>
                  {keyFeedback.type === 'success' ? '✓' : '⚠️'} {keyFeedback.message}
                </div>
              )}
            </div>
          )}

          {/* Progress Section (Visible during active generation) */}
          {isGenerating && progress && (
            <div className="ai-pres-progress-container">
              <div className="ai-pres-progress-header">
                <span className="ai-pres-progress-msg">
                  <span className="ai-pres-spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                  {progress.message}
                </span>
                <span className="ai-pres-progress-pct">{progress.progressPercent}%</span>
              </div>
              <div className="ai-pres-progress-bar-bg">
                <div
                  className="ai-pres-progress-bar-fill"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Failure Alert Banner */}
          {generationError && (
            <div className="ai-pres-banner error">
              <span>⚠️</span>
              <div style={{ flex: 1 }}>{generationError}</div>
              <button
                type="button"
                className="ai-pres-btn-sm"
                onClick={() => handleGenerate(true)}
                style={{ padding: '4px 10px', fontSize: 11 }}
              >
                Use Offline Template
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ai-pres-footer">
          {/* Summary Pills */}
          <div className="ai-pres-summary-pills">
            <span className="ai-pres-pill">{subject}</span>
            <span className="ai-pres-pill">{numberOfSlides} Slides</span>
            <span className="ai-pres-pill">{currentTheme.name}</span>
            <span className="ai-pres-pill">{selectedProvider.toUpperCase()}</span>
          </div>

          {/* Actions */}
          <div className="ai-pres-footer-actions">
            {isGenerating ? (
              <button
                type="button"
                className="ai-pres-btn danger"
                onClick={handleCancel}
                title="Cancel presentation generation"
              >
                Cancel Generation
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="ai-pres-btn secondary"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="ai-pres-btn secondary"
                  onClick={() => handleGenerate(true)}
                  title="Generate structured classroom slides without calling cloud AI"
                >
                  Template Deck (Offline)
                </button>
                <button
                  type="button"
                  className="ai-pres-btn primary"
                  onClick={() => handleGenerate(false)}
                  title="Generate classroom presentation with AI"
                >
                  <span>🪄</span> Generate Presentation
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Phase 2: Custom Slide Master Designer Modal */}
      {isMasterEditorOpen && (
        <CustomSlideMasterEditor
          isOpen={isMasterEditorOpen}
          initialMaster={editingMaster || undefined}
          onClose={() => {
            setIsMasterEditorOpen(false);
            setEditingMaster(null);
            setCustomMasters(customSlideMasterService.getAllMasters());
          }}
          onSave={(savedMaster) => {
            setSelectedMasterId(savedMaster.id);
            setCustomMasters(customSlideMasterService.getAllMasters());
            setIsMasterEditorOpen(false);
            setEditingMaster(null);
          }}
        />
      )}
    </div>
  );
}
