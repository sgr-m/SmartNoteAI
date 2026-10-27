import React from 'react';
import { useMetrics } from '../context/MetricsContext';
import { AnimatedCounter } from './AnimatedCounter';

export const FinalCTA: React.FC = () => {
  const { visitors, downloads, incrementDownloads } = useMetrics();

  return (
    <section className="section" style={{ paddingBottom: '120px' }}>
      <div className="container">
        <div className="cta-box">
          <div className="cta-live-pill">
            <span className="dot-green-pulse"></span>
            <span>
              <strong><AnimatedCounter value={downloads} /></strong> Downloads &bull;{' '}
              <strong><AnimatedCounter value={visitors} /></strong> Website Visitors
            </span>
          </div>

          <h2>Make Your Next Lesson More Visual.</h2>
          <p>
            Explore an open-source digital whiteboard engineered for the way you teach. 
            Enjoy fluid stylus inking, offline LaTeX, and distraction-free classroom presentation.
          </p>

          <div className="hero-cta-group" style={{ marginBottom: 0 }}>
            <a
              href="https://github.com/sgr-m/SmartNoteAI/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
              onClick={incrementDownloads}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.751" />
              </svg>
              <span>Download for Windows</span>
            </a>

            <a
              href="https://github.com/sgr-m/SmartNoteAI"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>View Source Code</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
