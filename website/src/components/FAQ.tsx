import React, { useState } from 'react';
import { faqItems } from '../data/faqData';

export const FAQ: React.FC = () => {
  const [openIds, setOpenIds] = useState<string[]>(['what-is', 'offline-capability']);

  const toggleItem = (id: string) => {
    if (openIds.includes(id)) {
      setOpenIds(openIds.filter((item) => item !== id));
    } else {
      setOpenIds([...openIds, id]);
    }
  };

  return (
    <section className="section" id="faq">
      <div className="container container-narrow">
        <div className="section-header">
          <div className="section-kicker">Questions &amp; Answers</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about SmartNoteAI, platform compatibility, stylus support, and open-source licensing.
          </p>
        </div>

        <div className="faq-list">
          {faqItems.map((item) => {
            const isOpen = openIds.includes(item.id);
            const contentId = `faq-answer-${item.id}`;
            const buttonId = `faq-btn-${item.id}`;

            return (
              <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <h3>
                  <button
                    id={buttonId}
                    className="faq-question-btn"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                  >
                    <span>{item.question}</span>
                    <svg
                      className="faq-chevron"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={contentId}
                    className="faq-answer"
                    role="region"
                    aria-labelledby={buttonId}
                  >
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
