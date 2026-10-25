import React, { useEffect, useRef } from 'react';
import { GalleryItem } from '../data/galleryData';

interface LightboxProps {
  item: GalleryItem;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  item,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the close button when opened
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      } else if (e.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling while open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${item.title}`}
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeButtonRef}
          className="lightbox-close"
          onClick={onClose}
          aria-label="Close image viewer"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button
          className="lightbox-nav-btn lightbox-prev"
          onClick={onPrev}
          aria-label="Previous screenshot"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="lightbox-image-container">
          <img src={item.src} alt={item.alt} />
        </div>

        <button
          className="lightbox-nav-btn lightbox-next"
          onClick={onNext}
          aria-label="Next screenshot"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="lightbox-meta">
          <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            Screenshot {currentIndex + 1} of {totalCount} &bull; Native {item.resolution}
          </div>
          <h3 className="lightbox-title">{item.title}</h3>
          <p className="lightbox-desc">{item.description}</p>
        </div>
      </div>
    </div>
  );
};
