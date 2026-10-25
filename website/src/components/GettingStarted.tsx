import React from 'react';

export const GettingStarted: React.FC = () => {
  return (
    <section className="section" id="getting-started">
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Quick Setup</div>
          <h2 className="section-title">Get Started in Under Two Minutes</h2>
          <p className="section-subtitle">
            SmartNoteAI runs as a standalone native Windows desktop application. No accounts, cloud registrations, or setup fees required.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h4>Download Official Installer</h4>
            <p>
              Download the official Windows installer (<code>SmartNoteAI.Setup.0.1.0.exe</code>, ~103.8 MB) directly from our verified GitHub Releases page.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <a
                href="https://github.com/sgr-m/SmartNoteAI/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                <span>Go to GitHub Releases</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h4>Run the Setup Wizard</h4>
            <p>
              Double-click the installer and follow the standard NSIS wizard. Choose your preferred installation directory and create optional desktop shortcuts.
            </p>
            <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Standard per-user or machine-wide installation supported.
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h4>Connect Pen &amp; Start Teaching</h4>
            <p>
              Launch SmartNoteAI. Plug in your XP-Pen, Wacom, or Huion tablet—or use a touchscreen or mouse—and begin your lesson immediately on the infinite canvas.
            </p>
            <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
              &check; Automatically detects hardware stylus digitizers
            </div>
          </div>
        </div>

        {/* Windows Defender SmartScreen Notice Box */}
        <div className="smartscreen-alert">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '4px' }}>
              Note for Windows Defender SmartScreen:
            </strong>
            <p>
              As SmartNoteAI is a newly published independent open-source project without a costly enterprise signing certificate, Windows may show an <em>"Unrecognized app"</em> prompt upon initial launch. Click <strong>"More info"</strong> and then <strong>"Run anyway"</strong>. For security, you can verify that the SHA-256 hash of your downloaded installer matches the published checksum on the official GitHub Release page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
