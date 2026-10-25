import React, { useState } from 'react';

export const Donation: React.FC = () => {
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Verified repository configuration placeholders:
  // Maintainer can update these constants with live production credentials when ready.
  const upiIdPlaceholder = 'UPI_ID';
  const paypalUrlPlaceholder = 'PAYPAL_DONATION_URL';

  const isUpiConfigured = upiIdPlaceholder !== 'UPI_ID' && Boolean(upiIdPlaceholder);
  const isPaypalConfigured = paypalUrlPlaceholder !== 'PAYPAL_DONATION_URL' && Boolean(paypalUrlPlaceholder);

  const handleCopyUpi = () => {
    if (isUpiConfigured) {
      navigator.clipboard.writeText(upiIdPlaceholder);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  return (
    <section className="section" id="donate">
      <div className="container container-narrow">
        <div className="section-header">
          <div className="section-kicker">Voluntary Support</div>
          <h2 className="section-title">Help Keep SmartNoteAI Growing</h2>
          <p className="section-subtitle">
            If SmartNoteAI makes your teaching easier, consider supporting its continued development. Every voluntary contribution helps fund maintenance, bug fixes, testing, and future improvements.
          </p>
        </div>

        <div className="donation-grid">
          {/* UPI Donation Card (India) */}
          <div className="donation-card">
            <div className="donation-card-header">
              <span className="donation-flag-icon" role="img" aria-label="India flag">🇮🇳</span>
              <div>
                <h4>UPI Contribution</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>For users in India</div>
              </div>
            </div>

            <p>
              Support via standard UPI apps including Google Pay, PhonePe, Paytm, BHIM, or CRED.
            </p>

            <div className="copy-box">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  UPI ID:
                </div>
                <code>{isUpiConfigured ? upiIdPlaceholder : 'UPI_ID (Configuration Pending)'}</code>
              </div>

              {isUpiConfigured ? (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCopyUpi}
                  aria-label="Copy UPI ID to clipboard"
                >
                  {copiedUpi ? 'Copied!' : 'Copy'}
                </button>
              ) : (
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  Pending Setup
                </span>
              )}
            </div>

            <div className="donation-notice-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>{isUpiConfigured ? 'Recipient: Sagar Maindola' : 'Official UPI ID to be supplied by maintainer'}</span>
            </div>
          </div>

          {/* PayPal Donation Card (International) */}
          <div className="donation-card">
            <div className="donation-card-header">
              <span className="donation-flag-icon" role="img" aria-label="Globe">🌐</span>
              <div>
                <h4>PayPal Contribution</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>International Support</div>
              </div>
            </div>

            <p>
              Support project infrastructure and ongoing development securely through verified PayPal donation.
            </p>

            <div style={{ marginTop: 'auto', marginBottom: '20px' }}>
              {isPaypalConfigured ? (
                <a
                  href={paypalUrlPlaceholder}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Donate via PayPal
                </a>
              ) : (
                <button
                  className="btn btn-secondary"
                  disabled
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    opacity: 0.65,
                    cursor: 'not-allowed',
                  }}
                >
                  PayPal Link: Coming Soon
                </button>
              )}
            </div>

            <div className="donation-notice-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>{isPaypalConfigured ? 'Verified PayPal Merchant' : 'PayPal URL to be supplied by maintainer'}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '36px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          Donations are 100% voluntary and never required. SmartNoteAI is completely free software under GNU GPLv3.
        </div>
      </div>
    </section>
  );
};
