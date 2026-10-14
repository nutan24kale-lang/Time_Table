import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';

interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
  alt: string;
  number: string;
}

export const Carousel: React.FC = () => {
  const items: CarouselItem[] = [
    {
      id: 1,
      number: 'Phase 01',
      title: 'Better Time Management',
      description: 'A well-structured timetable helps students and teachers manage time effectively and stay productive.',
      image: '/images/carousel-1.jpg',
      alt: 'College student organizing academic study schedule with textbooks, planner, and desk clock',
    },
    {
      id: 2,
      number: 'Phase 02',
      title: 'Organized Academic Life',
      description: 'Timetables bring structure, reduce confusion, and ensure smooth academic activities.',
      image: '/images/carousel-2.jpg',
      alt: 'Neatly organized academic lecture calendar with checklist, notes tablet, and study gear',
    },
    {
      id: 3,
      number: 'Phase 03',
      title: 'Increased Productivity',
      description: 'Proper scheduling helps improve time management and the efficient use of academic resources.',
      image: '/images/carousel-3.jpg',
      alt: 'University students collaborating in modern study room with hourglass clock and productivity charts',
    },
    {
      id: 4,
      number: 'Phase 04',
      title: 'Conflict-Free Scheduling',
      description: 'Automated timetable generation helps prevent scheduling conflicts and supports uninterrupted learning.',
      image: '/images/carousel-4.jpg',
      alt: 'Faculty scheduling room displaying conflict-free weekly timetable and graph network matrix',
    },
  ];

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Exact 3000ms (3 seconds) interval auto-advancement with lifecycle cleanup
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, nextSlide]);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  return (
    <div
      className="carousel-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Academic Benefits Carousel"
      role="region"
    >
      <div className="carousel-header">
        <div className="carousel-heading">
          <Sparkles size={18} color="#16a34a" />
          <span>Academic Scheduling Benefits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="carousel-status-pill">
            {isPaused ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Pause size={10} /> Paused on hover
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Play size={10} /> Auto-Advancing (3s)
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="carousel-container">
        {/* On desktop, all 4 cards are shown side-by-side with active highlighted; on tablet/mobile it scrolls or highlights smoothly */}
        <div className="carousel-cards-grid">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`carousel-card-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="carousel-img-container">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="carousel-img"
                  loading="lazy"
                />
              </div>
              <div className="carousel-card-body">
                <div className="carousel-card-number">{item.number}</div>
                <h3 className="carousel-card-title">{item.title}</h3>
                <p className="carousel-card-desc">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Navigation Controls & Pagination Dots */}
      <div className="carousel-controls">
        <button
          className="carousel-nav-btn"
          onClick={prevSlide}
          aria-label="Previous Slide"
          title="Previous slide (Left Arrow)"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="carousel-dots">
          {items.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          className="carousel-nav-btn"
          onClick={nextSlide}
          aria-label="Next Slide"
          title="Next slide (Right Arrow)"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
