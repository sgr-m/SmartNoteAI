import React from 'react';
import { geographyFeatures, geographyShowcaseImage } from '../data/featuresData';

export const GeographyCentreShowcase: React.FC = () => {
  return (
    <section className="section geography-section" id="geography">
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Survey of India Standard</div>
          <h2 className="section-title">
            Geography Resource Centre &amp; <span className="text-gradient">3D Earth Lab</span>
          </h2>
          <p className="section-subtitle">
            Built with official <strong>Survey of India</strong> cartographic boundaries, featuring the Latest 2026 Political Map of India (28 States &amp; 8 UTs), 1:50,000 Open Series Toposheets, World &amp; River Maps, Interactive 3D Globe, GIS Thematic Lab, and One-Click Offline Sync.
          </p>
        </div>

        {/* Featured Full-Width Window Showcase */}
        <div className="geo-window-wrapper">
          <div className="window-frame">
            <div className="window-header">
              <div className="window-dots">
                <span className="window-dot dot-red"></span>
                <span className="window-dot dot-yellow"></span>
                <span className="window-dot dot-green"></span>
              </div>
              <div className="window-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>Geography Resource Centre &bull; SURVEY OF INDIA STANDARD &bull; Offline Maps Ready</span>
              </div>
              <span className="geo-verified-pill">
                <a
                  href="https://surveyofindia.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  surveyofindia.gov.in &#8599;
                </a>
              </span>
            </div>

            <img
              src={geographyShowcaseImage}
              alt="SmartNoteAI Geography Resource Centre showing Survey of India Official Political Map of India 2026, 28 States & 8 UTs, Topographical Maps 1:50,000, World Atlas, 3D Globe with Solar Day/Night Terminator, Atlas Explorer, and GIS Thematic Lab"
              className="window-screenshot"
              width="1024"
              height="673"
              loading="lazy"
            />
          </div>
        </div>

        {/* 6 Detailed Geography Feature Cards */}
        <div className="feature-grid-cards" style={{ marginTop: '48px' }}>
          {geographyFeatures.map((feat) => (
            <div key={feat.id} className="feature-card ai-feature-card">
              <div className="ai-card-badge">{feat.tag}</div>
              <h4>{feat.title}</h4>
              <p style={{ marginBottom: '16px' }}>{feat.description}</p>
              <ul className="ai-card-bullets">
                {feat.items.map((item, idx) => (
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

