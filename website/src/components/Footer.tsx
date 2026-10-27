import React from 'react';
import logoImg from '../assets/logo.png';
import { useMetrics } from '../context/MetricsContext';

export const Footer: React.FC = () => {
  const { visitors, downloads } = useMetrics();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logoImg} alt="SmartNoteAI Logo" width="34" height="34" style={{ borderRadius: '6px' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: '#ffffff' }}>
                SmartNoteAI
              </span>
            </div>
            <p>
              High-performance, open-source interactive digital whiteboard and teaching software engineered for Windows 10 &amp; 11. Built for educators, STEM instructors, and tutors worldwide.
            </p>
          </div>

          <div className="footer-col">
            <h5>Product</h5>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#community-stats">Live Impact &amp; Metrics</a></li>
              <li><a href="#gallery">Application Tour</a></li>
              <li><a href="#getting-started">Installation Guide</a></li>
              <li><a href="#requirements">System Requirements</a></li>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/releases" target="_blank" rel="noopener noreferrer">Releases &amp; Checksums</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Community</h5>
            <ul>
              <li><a href="https://github.com/sgr-m/SmartNoteAI" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/issues" target="_blank" rel="noopener noreferrer">Issue Tracker</a></li>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing Guide</a></li>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Release Changelog</a></li>
              <li><a href="#donate">Voluntary Donations</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Legal &amp; Policy</h5>
            <ul>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">GNU GPLv3 License</a></li>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/blob/main/TRADEMARKS.md" target="_blank" rel="noopener noreferrer">Trademark Policy</a></li>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">Security Policy</a></li>
              <li><a href="https://github.com/sgr-m/SmartNoteAI/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer">Code of Conduct</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <div>
              &copy; 2026 Sagar Maindola. Released under the GNU General Public License v3.0.
            </div>
            <div className="footer-live-stats-pill">
              <span className="dot-green-pulse" aria-hidden="true"></span>
              <span><strong>{visitors.toLocaleString()}</strong> Website Visitors</span>
              <span className="pill-dot-sep">&bull;</span>
              <span><strong>{downloads.toLocaleString()}</strong> Downloads</span>
            </div>
          </div>

          <button className="footer-back-to-top" onClick={scrollToTop} aria-label="Scroll back to top">
            <span>Back to top</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

