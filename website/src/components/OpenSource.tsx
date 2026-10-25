import React from 'react';

export const OpenSource: React.FC = () => {
  return (
    <section className="section" id="open-source" style={{ background: 'rgba(10, 15, 26, 0.6)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Free &amp; Open Code</div>
          <h2 className="section-title">Open Source. Built to Keep Improving.</h2>
          <p className="section-subtitle">
            SmartNoteAI believes in software freedom and absolute transparency. The entire application is released under the GNU General Public License v3.0 (GPLv3).
          </p>
        </div>

        <div className="grid grid-3">
          <div className="feature-card">
            <div className="feature-card-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h4>Inspect &amp; Audit the Code</h4>
            <p>
              Every single line of TypeScript, React, and Electron source code is public on GitHub. No obscured binaries, no telemetry trackers, and no hidden payloads.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <a
                href="https://github.com/sgr-m/SmartNoteAI"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                Browse Repository
              </a>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h4>Community-Driven Growth</h4>
            <p>
              Found a bug or need support for a specialized drawing tablet? Open an issue or suggest ideas directly to the maintainers on GitHub.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <a
                href="https://github.com/sgr-m/SmartNoteAI/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                Submit Issue or Request
              </a>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h4>GNU GPLv3 Copyleft Rights</h4>
            <p>
              Distributed derivatives must remain open source under GPLv3. Software freedoms and educator autonomy are permanently protected from proprietary lock-in.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <a
                href="https://github.com/sgr-m/SmartNoteAI/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                Read GNU GPLv3
              </a>
            </div>
          </div>
        </div>

        {/* Community Governance Links */}
        <div style={{ marginTop: '40px', padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <span style={{ color: 'var(--text-white)', fontWeight: 600 }}>
              Repository Governance &amp; Policies:
            </span>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <a href="https://github.com/sgr-m/SmartNoteAI/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                Contributing Guide
              </a>
              <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
              <a href="https://github.com/sgr-m/SmartNoteAI/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                Security Policy
              </a>
              <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
              <a href="https://github.com/sgr-m/SmartNoteAI/blob/main/TRADEMARKS.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                Trademark Policy
              </a>
              <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
              <a href="https://github.com/sgr-m/SmartNoteAI/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                Changelog
              </a>
            </div>
          </div>
          <p style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Disclaimer: SmartNoteAI is an independent, community-driven open-source project created by Sagar Maindola. It is not affiliated with, sponsored by, or endorsed by Microsoft, XP-Pen, Wacom, Huion, or other mentioned hardware manufacturers.
          </p>
        </div>
      </div>
    </section>
  );
};
