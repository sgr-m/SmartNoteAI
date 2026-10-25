import React from 'react';
import { primaryFeatures, secondaryFeatures } from '../data/featuresData';

export const FeatureShowcase: React.FC = () => {
  const renderSecondaryIcon = (icon: string) => {
    switch (icon) {
      case 'shapes':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 22 22 22" />
            <circle cx="12" cy="14" r="4" />
          </svg>
        );
      case 'ruler':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.3 8.7l-6-6a1 1 0 0 0-1.4 0l-11.2 11.2a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0l11.2-11.2a1 1 0 0 0 0-1.4z" />
            <line x1="7.5" y1="10.5" x2="9.5" y2="8.5" />
            <line x1="10.5" y1="13.5" x2="13.5" y2="10.5" />
            <line x1="13.5" y1="16.5" x2="15.5" y2="14.5" />
          </svg>
        );
      case 'spotlight':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        );
      case 'pdf':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'library':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'shield':
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
    }
  };

  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Core Capabilities</div>
          <h2 className="section-title">Engineered for the Modern STEM Classroom</h2>
          <p className="section-subtitle">
            SmartNoteAI solves the latency, subscription locks, and internet dependency of traditional boards. 
            Here is how each capability transforms your teaching workflow.
          </p>
        </div>

        {/* Primary Alternating Split Features */}
        <div className="feature-splits-container">
          {primaryFeatures.map((feat) => (
            <div
              key={feat.id}
              className={`feature-split ${feat.reverse ? 'reverse' : ''}`}
            >
              <div className="feature-copy">
                <span className="section-kicker" style={{ marginBottom: '12px' }}>
                  {feat.kicker}
                </span>
                <h3>{feat.title}</h3>
                <p>{feat.description}</p>

                <ul className="feature-checklist">
                  {feat.highlights.map((h, i) => (
                    <li key={i}>
                      <span className="checklist-bullet" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="feature-media">
                <img
                  src={feat.image}
                  alt={feat.imageAlt}
                  width="1200"
                  height="675"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Secondary 3-Column Feature Cards */}
        <div className="feature-grid-cards">
          {secondaryFeatures.map((card) => (
            <div key={card.id} className="feature-card">
              <div className="feature-card-icon" aria-hidden="true">
                {renderSecondaryIcon(card.icon)}
              </div>
              <h4>{card.title}</h4>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
