import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import { useMetrics } from '../context/MetricsContext';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { incrementDownloads } = useMetrics();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar-wrapper ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        <nav className="navbar" aria-label="Main Navigation">
          <a href="#" className="brand-logo" aria-label="SmartNoteAI Home">
            <img src={logoImg} alt="SmartNoteAI Logo" width="38" height="38" />
            <span className="brand-name">SmartNoteAI</span>
            <span className="brand-badge">v0.1.0</span>
          </a>

          <ul className="nav-links">
            <li><a href="#features" className="nav-link">Features</a></li>
            <li><a href="#community-stats" className="nav-link">Impact</a></li>
            <li><a href="#gallery" className="nav-link">Showcase</a></li>
            <li><a href="#getting-started" className="nav-link">Get Started</a></li>
            <li><a href="#requirements" className="nav-link">Requirements</a></li>
            <li><a href="#open-source" className="nav-link">Open Source</a></li>
            <li><a href="#donate" className="nav-link">Donate</a></li>
            <li><a href="#faq" className="nav-link">FAQ</a></li>
          </ul>

          <div className="nav-actions">
            <a
              href="https://github.com/sgr-m/SmartNoteAI/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              onClick={incrementDownloads}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download</span>
            </a>

            <button
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#community-stats" onClick={() => setMobileMenuOpen(false)}>Live Metrics &amp; Impact</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Showcase</a>
          <a href="#getting-started" onClick={() => setMobileMenuOpen(false)}>Get Started</a>
          <a href="#requirements" onClick={() => setMobileMenuOpen(false)}>System Requirements</a>
          <a href="#open-source" onClick={() => setMobileMenuOpen(false)}>Open Source</a>
          <a href="#donate" onClick={() => setMobileMenuOpen(false)}>Voluntary Support</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <a
            href="https://github.com/sgr-m/SmartNoteAI/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ marginTop: '12px', textAlign: 'center' }}
            onClick={() => {
              incrementDownloads();
              setMobileMenuOpen(false);
            }}
          >
            Download for Windows
          </a>
        </div>
      )}
    </header>
  );
};
