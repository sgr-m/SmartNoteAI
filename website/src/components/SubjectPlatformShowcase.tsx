import React, { useState, useEffect } from 'react';
import { subjectSlides, additionalSubjects } from '../data/featuresData';

export const SubjectPlatformShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPausedByHover, setIsPausedByHover] = useState(false);

  const activeSlide = subjectSlides[activeIndex];

  useEffect(() => {
    if (!isAutoPlaying || isPausedByHover) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % subjectSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, isPausedByHover]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + subjectSlides.length) % subjectSlides.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % subjectSlides.length);
  };

  const handleSelectSlide = (idx: number) => {
    setIsAutoPlaying(false);
    setActiveIndex(idx);
  };

  return (
    <section className="section subject-platform-section" id="subjects">
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Curriculum Modules &amp; Instruments</div>
          <h2 className="section-title">
            Subject Teaching Platform Across <span className="text-gradient">7 Disciplines</span>
          </h2>
          <p className="section-subtitle">
            Browse real captures of SmartNoteAI&rsquo;s built-in Subject Teaching Platform—featuring interactive geometry instruments, circuit builders, code tracers, periodic models, logic gates, and official Survey of India geography tools.
          </p>
        </div>

        {/* Interactive Slideshow Selector Tabs */}
        <div className="subject-tabs-bar" role="tablist" aria-label="Subject Teaching Platform Modules">
          {subjectSlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              className={`subject-tab-btn ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => handleSelectSlide(idx)}
            >
              <span>{slide.subject}</span>
            </button>
          ))}

          <button
            type="button"
            className="subject-autoplay-btn"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
            title={isAutoPlaying ? 'Pause automatic slide cycling' : 'Resume automatic slide cycling'}
          >
            {isAutoPlaying ? 'Pause' : 'Autoplay'}
          </button>
        </div>

        {/* Main Interactive Slideshow Card */}
        <div
          className="subject-carousel-shell"
          onMouseEnter={() => setIsPausedByHover(true)}
          onMouseLeave={() => setIsPausedByHover(false)}
        >
          <div className="subject-carousel-media">
            <img
              key={activeSlide.id}
              src={activeSlide.image}
              alt={activeSlide.imageAlt}
              className="subject-carousel-img"
              loading="lazy"
            />

            <button
              type="button"
              className="carousel-nav-btn carousel-nav-prev"
              onClick={handlePrev}
              aria-label="Previous subject slide"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              className="carousel-nav-btn carousel-nav-next"
              onClick={handleNext}
              aria-label="Next subject slide"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div className="carousel-counter-pill">
              0{activeIndex + 1} / 0{subjectSlides.length} &bull; {activeSlide.subject}
            </div>
          </div>

          <div className="subject-carousel-info">
            <div className="subject-info-kicker">{activeSlide.badge}</div>
            <h3>{activeSlide.subject}: {activeSlide.headline}</h3>
            <p>{activeSlide.description}</p>

            <div className="subject-tools-heading">Included Interactive Modules &amp; Instruments:</div>
            <div className="subject-tools-chips">
              {activeSlide.tools.map((tool) => (
                <span key={tool} className="subject-tool-chip">
                  {tool}
                </span>
              ))}
            </div>

            <div className="carousel-dots-row">
              {subjectSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`carousel-dot ${idx === activeIndex ? 'active' : ''}`}
                  onClick={() => handleSelectSlide(idx)}
                  aria-label={`View ${slide.subject} screenshot`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Additional Subject Modules Grid (Chemistry, Digital Logic & Flowcharts, General Teaching) */}
        <div className="additional-subjects-grid">
          {additionalSubjects.map((mod) => (
            <div key={mod.id} className="feature-card">
              <h4 style={{ marginBottom: '6px' }}>{mod.subject}</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--accent-cyan)', marginBottom: '14px' }}>
                {mod.tagline}
              </p>
              <ul className="ai-card-bullets">
                {mod.tools.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

