import React from 'react';
import { useMetrics } from '../context/MetricsContext';
import { AnimatedCounter } from './AnimatedCounter';

export const CommunityStats: React.FC = () => {
  const { visitors, downloads, isLive, incrementDownloads } = useMetrics();

  return (
    <section className="section community-stats-section" id="community-stats">
      <div className="container">
        <div className="section-header text-center">
          <div className="metrics-kicker-badge">
            <span className="live-pulse-indicator" aria-hidden="true">
              <span className="live-pulse-dot"></span>
              <span className="live-pulse-ring"></span>
            </span>
            <span>Real-Time Community Impact</span>
          </div>

          <h2 className="section-title">
            Built for Teaching. <span className="text-gradient">Adopted Globally.</span>
          </h2>
          <p className="section-subtitle">
            Transparent, real-time statistics tracking website visits, Windows software installations, and growing educator adoption worldwide.
          </p>
        </div>

        {/* 4-Column Stats Grid */}
        <div className="metrics-cards-grid">
          {/* Card 1: Total Downloads */}
          <div className="metric-card metric-card-primary">
            <div className="metric-card-glow" aria-hidden="true"></div>
            <div className="metric-header">
              <div className="metric-icon-box metric-icon-download">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span className="metric-status-badge badge-cyan">
                {isLive ? 'Live Sync' : 'Verified'}
              </span>
            </div>

            <div className="metric-number-wrapper">
              <AnimatedCounter value={downloads} className="metric-number text-gradient" />
            </div>

            <h3 className="metric-title">Total Software Downloads</h3>
            <p className="metric-desc">
              Direct installer downloads and official GitHub release packages delivered to Windows 10 &amp; 11 PCs.
            </p>

            <div className="metric-footer">
              <span className="metric-subtag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.751" />
                </svg>
                SmartNoteAI.Setup.0.1.0.exe
              </span>
            </div>
          </div>

          {/* Card 2: Total Website Visitors */}
          <div className="metric-card metric-card-visitors">
            <div className="metric-card-glow" aria-hidden="true"></div>
            <div className="metric-header">
              <div className="metric-icon-box metric-icon-visitors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="metric-status-badge badge-emerald">
                <span className="dot-green-pulse"></span>
                Active Traffic
              </span>
            </div>

            <div className="metric-number-wrapper">
              <AnimatedCounter value={visitors} className="metric-number text-emerald" />
            </div>

            <h3 className="metric-title">Total Website Visitors</h3>
            <p className="metric-desc">
              Teachers, STEM lecturers, students, and tutors visiting this website to explore open-source digital teaching tools.
            </p>

            <div className="metric-footer">
              <span className="metric-subtag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Unique Web Sessions
              </span>
            </div>
          </div>

          {/* Card 3: 100% Free & Open Source */}
          <div className="metric-card">
            <div className="metric-card-glow" aria-hidden="true"></div>
            <div className="metric-header">
              <div className="metric-icon-box metric-icon-license">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <span className="metric-status-badge badge-blue">
                GPLv3
              </span>
            </div>

            <div className="metric-number-wrapper">
              <span className="metric-number text-white">100% Free</span>
            </div>

            <h3 className="metric-title">Open Source Freedom</h3>
            <p className="metric-desc">
              Released under GNU GPLv3. Guaranteed free forever with zero subscriptions, license keys, or paywalled classroom features.
            </p>

            <div className="metric-footer">
              <a
                href="https://github.com/sgr-m/SmartNoteAI"
                target="_blank"
                rel="noopener noreferrer"
                className="metric-link"
              >
                Inspect GitHub Repository &rarr;
              </a>
            </div>
          </div>

          {/* Card 4: 100% Offline-First Architecture */}
          <div className="metric-card">
            <div className="metric-card-glow" aria-hidden="true"></div>
            <div className="metric-header">
              <div className="metric-icon-box metric-icon-privacy">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                  <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                  <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                  <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
              <span className="metric-status-badge badge-purple">
                Offline
              </span>
            </div>

            <div className="metric-number-wrapper">
              <span className="metric-number text-white">0 ms Cloud</span>
            </div>

            <h3 className="metric-title">Zero Telemetry &amp; Privacy</h3>
            <p className="metric-desc">
              Zero student data collected. Works completely offline with bundled KaTeX math rendering, local PDF import, and hardware inking.
            </p>

            <div className="metric-footer">
              <span className="metric-subtag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                100% Local File Storage
              </span>
            </div>
          </div>
        </div>

        {/* Live CTA Action Bar */}
        <div className="metrics-action-banner">
          <div className="metrics-action-info">
            <div className="metrics-action-headline">
              Ready to enhance your digital teaching experience?
            </div>
            <div className="metrics-action-caption">
              Join educators worldwide. Download the installer directly or inspect the complete source on GitHub.
            </div>
          </div>

          <div className="metrics-action-buttons">
            <a
              href="https://github.com/sgr-m/SmartNoteAI/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              onClick={incrementDownloads}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.751" />
              </svg>
              <span>Download for Windows</span>
            </a>

            <a
              href="https://github.com/sgr-m/SmartNoteAI"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
