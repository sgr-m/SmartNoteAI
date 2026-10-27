import React from 'react';
import heroWhiteboard from '../assets/images/hero-whiteboard.png';
import { useMetrics } from '../context/MetricsContext';
import { AnimatedCounter } from './AnimatedCounter';

export const Hero: React.FC = () => {
  const { visitors, downloads, isLive, incrementDownloads } = useMetrics();

  return (
    <section className="hero-section" id="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge-pill">
            <span className="dot" aria-hidden="true"></span>
            <span>Windows 10 & 11 (64-bit) &bull; Official Release v0.1.0</span>
          </div>

          <h1 className="hero-title">
            Your Ideas. Your Canvas.<br />
            <span className="text-gradient">Your Classroom.</span>
          </h1>

          <p className="hero-description">
            An open-source digital whiteboard built for teaching, mathematics, computer science, and STEM. 
            Write naturally, explain complex concepts, annotate your desktop, and create lessons—all from your Windows PC.
          </p>

          <div className="hero-cta-group">
            <a
              href="https://github.com/sgr-m/SmartNoteAI/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
              onClick={incrementDownloads}
            >
              {/* Windows Icon */}
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
              {/* GitHub Octocat Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Explore on GitHub</span>
            </a>
          </div>

          {/* Real-Time Adoption Counters Ribbon */}
          <div className="hero-stats-ribbon">
            <a href="#community-stats" className="hero-stat-pill" title="View software download metrics">
              <span className="hero-stat-icon hero-stat-icon-cyan">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
              <span className="hero-stat-value">
                <AnimatedCounter value={downloads} />
              </span>
              <span className="hero-stat-label">Total Downloads</span>
            </a>

            <span className="hero-stat-divider" aria-hidden="true">&bull;</span>

            <a href="#community-stats" className="hero-stat-pill" title="View live website visitors">
              <span className="hero-stat-indicator">
                <span className="hero-stat-dot"></span>
                <span className="hero-stat-ping"></span>
              </span>
              <span className="hero-stat-value">
                <AnimatedCounter value={visitors} />
              </span>
              <span className="hero-stat-label">Website Visitors</span>
            </a>

            <span className="hero-stat-divider" aria-hidden="true">&bull;</span>

            <div className="hero-stat-pill">
              <span className="hero-stat-tag">
                {isLive ? 'Live Tracked' : 'Verified GPLv3'}
              </span>
            </div>
          </div>

          <div className="hero-meta">
            <span className="hero-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Windows 10 / 11 (64-bit)
            </span>
            <span>&bull;</span>
            <span className="hero-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              SmartNoteAI.Setup.0.1.0.exe (~103.8 MB)
            </span>
            <span>&bull;</span>
            <span className="hero-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              GPLv3 Open Source
            </span>
          </div>
        </div>

        {/* Real Application Window Preview Frame */}
        <div className="hero-preview-wrapper">
          <div className="window-frame">
            <div className="window-header">
              <div className="window-dots">
                <span className="window-dot dot-red"></span>
                <span className="window-dot dot-yellow"></span>
                <span className="window-dot dot-green"></span>
              </div>
              <div className="window-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                </svg>
                <span>SmartNoteAI — Digital Whiteboard &bull; Mathematics & STEM Lecture</span>
              </div>
            </div>

            <img
              src={heroWhiteboard}
              alt="SmartNoteAI digital whiteboard application interface with handwritten algebra notes, formulas, and floating dock"
              className="window-screenshot"
              width="1962"
              height="1080"
              loading="eager"
            />
          </div>

          <div className="preview-floating-tag">
            <div className="tag-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
            <div className="tag-text">
              <h4>XP-Pen &amp; Wacom Digitizers Active</h4>
              <p>Hardware pressure curve &bull; 100% Offline KaTeX math rendering</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
