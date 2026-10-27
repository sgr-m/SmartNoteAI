import React, { useState } from 'react';
import upiQrImg from '../assets/images/upi-qr-code.png';

export const Donation: React.FC = () => {
  const [copiedUpi, setCopiedUpi] = useState(false);

  const upiId = 'sagar-maindola@ybl';
  const recipientName = 'Sagar Maindola';
  const paypalUrlPlaceholder = 'PAYPAL_DONATION_URL';

  const isUpiConfigured = Boolean(upiId);
  const isPaypalConfigured = paypalUrlPlaceholder !== 'PAYPAL_DONATION_URL' && Boolean(paypalUrlPlaceholder);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
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
          <div className="donation-card donation-card-featured">
            <div className="donation-card-header">
              <span className="donation-flag-icon" role="img" aria-label="India flag">🇮🇳</span>
              <div>
                <h4>UPI Contribution</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>For users in India &bull; Zero transaction fee</div>
              </div>
            </div>

            <p>
              Support directly via standard UPI apps including <strong>PhonePe, Google Pay, Paytm, BHIM, or CRED</strong>.
            </p>

            {/* High-Contrast Scannable QR Code */}
            <div className="upi-qr-wrapper">
              <div className="upi-qr-box">
                <img
                  src={upiQrImg}
                  alt="Sagar Maindola PhonePe UPI QR Code"
                  className="upi-qr-image"
                  width="190"
                  height="190"
                  loading="lazy"
                />
              </div>
              <div className="upi-qr-meta">
                <span className="upi-qr-badge">PhonePe &bull; GPay &bull; Paytm &bull; BHIM</span>
                <span className="upi-qr-instruction">Scan with any UPI camera or payment app</span>
              </div>
            </div>

            {/* Copyable UPI ID Box */}
            <div className="copy-box">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  UPI ID (VPA):
                </div>
                <code>{upiId}</code>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCopyUpi}
                  aria-label="Copy UPI ID to clipboard"
                >
                  {copiedUpi ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Instant UPI Trigger */}
            <div className="upi-mobile-action">
              <a
                href={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipientName)}&cu=INR`}
                className="btn btn-primary btn-sm upi-pay-btn"
                title="Tap to open your default UPI payment app"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                <span>Open in UPI App (Mobile)</span>
              </a>
            </div>

            <div className="donation-notice-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Verified Recipient: <strong>{recipientName}</strong> (Project Maintainer)</span>
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
              Support project infrastructure and ongoing open-source development securely through verified PayPal donation.
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
              <span>{isPaypalConfigured ? 'Verified PayPal Merchant' : 'PayPal URL can be configured anytime'}</span>
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
