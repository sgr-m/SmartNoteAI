import React from 'react';
import { aiCapabilities, aiShowcaseImage } from '../data/featuresData';

export const AIShowcase: React.FC = () => {
  const providers = [
    'Google Gemini',
    'Ollama (100% Offline)',
    'DeepSeek AI',
    'Groq Cloud',
    'Kimi (Moonshot)',
    'OpenAI',
    'Custom Endpoint',
  ];

  return (
    <section className="section ai-showcase-section" id="ai-studio">
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Intelligent Teaching Co-Pilot</div>
          <h2 className="section-title">
            AI Teaching Studio. <span className="text-gradient">Drag, Enhance &amp; Solve Live.</span>
          </h2>
          <p className="section-subtitle">
            Generate structured lesson cards, KaTeX equations, practice questions, and vector flowcharts right beside your board—then drag and drop onto any canvas position or enhance entire slides in one click.
          </p>
        </div>

        {/* Live Video Demo Frame */}
        <div className="video-showcase-wrapper">
          <div className="window-frame">
            <div className="window-header">
              <div className="window-dots">
                <span className="window-dot dot-red"></span>
                <span className="window-dot dot-yellow"></span>
                <span className="window-dot dot-green"></span>
              </div>
              <div className="window-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>SmartNoteAI Video Walkthrough &bull; AI Generation &amp; Drag-and-Drop Insertion</span>
              </div>
              <span className="video-live-pill">MP4 Demo</span>
            </div>

            <div className="video-player-container">
              <video
                className="demo-video-player"
                controls
                playsInline
                preload="metadata"
                poster={aiShowcaseImage}
                aria-label="SmartNoteAI demo video showing AI lesson generation and drag-and-drop insertion onto the whiteboard"
              >
                <source src="./videos/ai-generation-drag-drop.mp4" type="video/mp4" />
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          </div>

          <p className="video-caption-note">
            Watch the actual desktop workflow: generating structured lesson cards in the AI Teaching Assistant, previewing Mermaid flowcharts, and dragging sections, formulas, and tables straight onto the whiteboard canvas.
          </p>
        </div>

        {/* AI Teaching Assistant Split Spotlight */}
        <div className="feature-split" style={{ marginTop: '64px' }}>
          <div className="feature-copy">
            <span className="section-kicker" style={{ marginBottom: '12px' }}>
              Docked AI Panel + Canvas Sync
            </span>
            <h3>AI Chat Cards Meet Precision Whiteboard Formatting</h3>
            <p>
              Ask a concept question, toggle <strong>Web</strong> search, or hit a quick prompt. SmartNoteAI breaks the output into draggable modular cards—even rendering complex KaTeX formulas, styled comparison tables, and editable Mermaid vector flowcharts right inside chat before you drop them onto the slide.
            </p>

            <ul className="feature-checklist">
              <li>
                <span className="checklist-bullet" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span><strong>Drag &amp; Drop or + Insert:</strong> Place individual SECTION, EXPLANATION, FORMULA, or TABLE cards anywhere without clutter</span>
              </li>
              <li>
                <span className="checklist-bullet" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span><strong>1-Click ✨ Enhance:</strong> Format individual textboxes or auto-design &amp; align an entire board slide cleanly</span>
              </li>
              <li>
                <span className="checklist-bullet" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span><strong>Contextual ✨ Ask AI:</strong> Click Ask AI on any selected board note to solve, simplify, or elaborate immediately</span>
              </li>
            </ul>

            <div className="ai-provider-pills" aria-label="Supported AI Providers">
              {providers.map((provider) => (
                <span key={provider} className="ai-provider-pill">
                  {provider}
                </span>
              ))}
            </div>
          </div>

          <div className="feature-media">
            <img
              src={aiShowcaseImage}
              alt="SmartNoteAI Teaching Assistant panel displaying Vector Diagram preview, Section, Explanation, Formula, and Practice cards beside KaTeX equations and structured table on the chalkboard"
              width="1024"
              height="579"
              loading="lazy"
            />
          </div>
        </div>

        {/* 6 AI Capability Cards */}
        <div className="feature-grid-cards">
          {aiCapabilities.map((cap) => (
            <div key={cap.id} className="feature-card ai-feature-card">
              <div className="ai-card-badge">{cap.badge}</div>
              <h4>{cap.title}</h4>
              <p style={{ marginBottom: '16px' }}>{cap.description}</p>
              <ul className="ai-card-bullets">
                {cap.highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

