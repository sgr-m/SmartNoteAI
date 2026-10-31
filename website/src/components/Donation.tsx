import React, { useState, useEffect, useRef } from 'react';
import upiQrImg from '../assets/images/upi-qr-code.png';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_CLIENT_ID = 'BAAFt5DdWH9svJUU1mYhp6aDqbq5F0BWjwA822VNE00rYUmTR7awWLlX8U3V5rQZpziNDHoFdF88JHMAm8';
const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export const Donation: React.FC = () => {
  const [copiedUpi, setCopiedUpi] = useState(false);

  // UPI configuration
  const upiId = 'sagar-maindola@ybl';
  const recipientName = 'Sagar Maindola';

  // PayPal donation amount states
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(10);
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [sdkLoading, setSdkLoading] = useState<boolean>(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(10);
  const [transactionId, setTransactionId] = useState<string>('');

  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRenderedRef = useRef<boolean>(false);

  // Calculate the effective numeric amount (minimum $1.00)
  const numericAmount = parseFloat(customAmount);
  const effectiveAmount = isNaN(numericAmount) || numericAmount < 1 ? 1 : numericAmount;

  // Amount ref so createOrder always accesses the newest value without re-rendering the buttons iframe
  const amountRef = useRef<number>(effectiveAmount);
  useEffect(() => {
    amountRef.current = effectiveAmount;
  }, [effectiveAmount]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Preset click handler
  const handleSelectPreset = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount(String(amount));
    setSdkError(null);
  };

  // Custom amount change handler
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset('custom');
    setCustomAmount(e.target.value);
    setSdkError(null);
  };

  // Load and initialize PayPal Buttons SDK
  useEffect(() => {
    let isMounted = true;

    const renderPayPalButtons = () => {
      if (!isMounted || !paypalContainerRef.current || !window.paypal?.Buttons) {
        return;
      }

      // Clear container before rendering
      paypalContainerRef.current.innerHTML = '';

      try {
        window.paypal
          .Buttons({
            style: {
              shape: 'rect',
              layout: 'vertical',
              color: 'gold',
              label: 'donate',
            },
            createOrder: (_data: any, actions: any) => {
              const currentVal = amountRef.current;
              const formattedVal = Math.max(1, currentVal).toFixed(2);

              return actions.order.create({
                purchase_units: [
                  {
                    description: 'Voluntary Donation to SmartNoteAI Development',
                    amount: {
                      currency_code: 'USD',
                      value: formattedVal,
                    },
                  },
                ],
              });
            },
            onApprove: async (_data: any, actions: any) => {
              try {
                const orderData = await actions.order.capture();
                if (!isMounted) return;

                const name = orderData.payer?.name?.given_name || 'Generous Supporter';
                const txId =
                  orderData.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
                  orderData.id ||
                  '';
                const capturedAmount =
                  parseFloat(orderData.purchase_units?.[0]?.amount?.value) || amountRef.current;

                setDonorName(name);
                setPaidAmount(capturedAmount);
                setTransactionId(txId);
                setPaymentSuccess(true);
                setSdkError(null);
              } catch (err: any) {
                console.error('PayPal Capture Error:', err);
                if (isMounted) {
                  setSdkError('Payment could not be completed. Please try again.');
                }
              }
            },
            onError: (err: any) => {
              console.error('PayPal SDK Error:', err);
              if (isMounted) {
                setSdkError('Could not initiate PayPal Checkout. Please check your network or try again.');
              }
            },
          })
          .render(paypalContainerRef.current);

        buttonsRenderedRef.current = true;
        setSdkLoading(false);
      } catch (err) {
        console.error('Failed to render PayPal Buttons:', err);
        if (isMounted) {
          setSdkLoading(false);
          setSdkError('Unable to load PayPal button interface.');
        }
      }
    };

    // Check if PayPal SDK is already present
    if (window.paypal?.Buttons) {
      renderPayPalButtons();
      return;
    }

    // Otherwise, load script dynamically
    const existingScript = document.getElementById('paypal-sdk-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'paypal-sdk-script';
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons&enable-funding=venmo,paylater,card`;
      script.async = true;
      script.onload = () => {
        if (isMounted) renderPayPalButtons();
      };
      script.onerror = () => {
        if (isMounted) {
          setSdkLoading(false);
          setSdkError('Failed to load PayPal secure payment library. Ad-blocker may be active.');
        }
      };
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener('load', renderPayPalButtons);
    }

    return () => {
      isMounted = false;
    };
  }, []);

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

            {/* Scannable QR Code */}
            <div className="upi-qr-wrapper">
              <div className="upi-qr-box">
                <img
                  src={upiQrImg}
                  alt="Sagar Maindola PhonePe UPI QR Code"
                  className="upi-qr-image"
                  width="180"
                  height="180"
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
          <div className="donation-card donation-card-paypal">
            <div className="donation-card-header">
              <span className="donation-flag-icon" role="img" aria-label="Globe">🌐</span>
              <div>
                <h4>PayPal Contribution</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  International Support &bull; Cards, PayPal & Venmo
                </div>
              </div>
            </div>

            <p>
              Support project maintenance and continuous development. Choose or enter any amount you wish to contribute:
            </p>

            {/* Amount Selection Section */}
            {!paymentSuccess && (
              <div className="donation-amount-section">
                <div className="donation-amount-header">
                  <label className="donation-amount-label">Select Contribution Amount (USD):</label>
                </div>

                {/* Preset Chips */}
                <div className="donation-preset-grid">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`donation-preset-btn ${selectedPreset === amt ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(amt)}
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`donation-preset-btn ${selectedPreset === 'custom' ? 'active' : ''}`}
                    onClick={() => setSelectedPreset('custom')}
                  >
                    Custom
                  </button>
                </div>

                {/* Custom Amount Input Field */}
                <div className="donation-custom-input-box">
                  <span className="donation-input-prefix">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={customAmount}
                    onChange={handleCustomChange}
                    placeholder="Enter custom amount"
                    className="donation-amount-field"
                    aria-label="Donation amount in USD"
                  />
                  <span className="donation-input-suffix">USD</span>
                </div>

                {/* Amount Confirmation Banner */}
                <div className="donation-amount-badge">
                  <span>Donating:</span>
                  <strong>${effectiveAmount.toFixed(2)} USD</strong>
                </div>
              </div>
            )}

            {/* PayPal Button / Success State Container */}
            <div className="paypal-checkout-wrapper">
              {paymentSuccess ? (
                <div className="paypal-success-card">
                  <div className="paypal-success-icon">✓</div>
                  <h4>Thank You for Your Generous Support!</h4>
                  <p>
                    Your contribution of <strong>${paidAmount.toFixed(2)} USD</strong> has been received with gratitude.
                    {donorName ? ` Thank you, ${donorName}!` : ''}
                  </p>
                  {transactionId && (
                    <div className="paypal-transaction-id">
                      <span>Transaction ID:</span> <code>{transactionId}</code>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '14px' }}
                    onClick={() => {
                      setPaymentSuccess(false);
                      setTransactionId('');
                    }}
                  >
                    Make Another Contribution
                  </button>
                </div>
              ) : (
                <div className="paypal-interactive-box">
                  {sdkLoading && (
                    <div className="paypal-loading-indicator">
                      <div className="paypal-spinner" />
                      <span>Loading secure PayPal checkout...</span>
                    </div>
                  )}

                  {sdkError && (
                    <div className="paypal-error-card">
                      <span>⚠️ {sdkError}</span>
                    </div>
                  )}

                  {/* PayPal SDK mounts buttons here */}
                  <div
                    id="paypal-button-container"
                    ref={paypalContainerRef}
                    style={{ minHeight: '100px', display: sdkLoading ? 'none' : 'block' }}
                  />
                </div>
              )}
            </div>

            <div className="donation-notice-pill" style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Encrypted &bull; Instant Delivery &bull; Safe Checkout</span>
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
