import React, { useState } from 'react';
import { galleryItems, GalleryItem } from '../data/galleryData';
import { Lightbox } from './Lightbox';

export const Gallery: React.FC = () => {
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setActiveItemIndex(index);
  };

  const closeLightbox = () => {
    setActiveItemIndex(null);
  };

  const handlePrev = () => {
    if (activeItemIndex !== null) {
      setActiveItemIndex((activeItemIndex - 1 + galleryItems.length) % galleryItems.length);
    }
  };

  const handleNext = () => {
    if (activeItemIndex !== null) {
      setActiveItemIndex((activeItemIndex + 1) % galleryItems.length);
    }
  };

  return (
    <section className="section" id="gallery">
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Visual Tour</div>
          <h2 className="section-title">See SmartNoteAI in Action</h2>
          <p className="section-subtitle">
            Explore authentic, unedited captures of the actual desktop application in real teaching scenarios. Click any capture to view in full resolution.
          </p>
        </div>

        <div className="gallery-grid">
          {galleryItems.map((item, index) => (
            <div
              key={item.id}
              className="gallery-card"
              onClick={() => openLightbox(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(index);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View full resolution of ${item.title}`}
            >
              <div className="gallery-thumb-wrapper">
                <img
                  src={item.src}
                  alt={item.alt}
                  width="600"
                  height="338"
                  loading="lazy"
                  style={{ objectFit: item.fitMode || 'cover' }}
                />
                <div className="gallery-overlay-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span>{item.category}</span>
                </div>
              </div>

              <div className="gallery-card-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeItemIndex !== null && (
        <Lightbox
          item={galleryItems[activeItemIndex]}
          currentIndex={activeItemIndex}
          totalCount={galleryItems.length}
          onClose={closeLightbox}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </section>
  );
};
