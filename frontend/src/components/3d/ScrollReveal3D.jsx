import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollReveal3D:
 * Orchestrates modern, cinematic 3D scroll animations across the storefront.
 * Staggers headers, cards, and images with physical depth, velocity curves,
 * and smooth settling transitions as the user scrolls down the page.
 */
export function ScrollReveal3D({
  children,
  className = '',
  intensity = 8, // degrees of X-axis tilt
  depth = 30, // px of Z-axis displacement
  delay = 0,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Find marked animation targets inside the section
      const header = el.querySelector('.scroll-header');
      const cards = el.querySelectorAll('.scroll-card, [data-scroll-card]');
      const images = el.querySelectorAll('.scroll-image, [data-scroll-image]');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none none',
        },
      });

      // 1. Smooth Header Reveal (Tag, Title, Description)
      if (header) {
        tl.fromTo(
          header,
          {
            opacity: 0,
            y: 35,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
          }
        );
      }

      // 2. Cascading 3D Cards Stagger (Category Cards, Product Cards, Editorial Cards)
      if (cards.length > 0) {
        tl.fromTo(
          cards,
          {
            opacity: 0,
            y: 55,
            scale: 0.94,
            rotateX: intensity,
            z: -depth,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            z: 0,
            duration: 0.92,
            stagger: 0.09,
            ease: 'power3.out',
          },
          header ? '-=0.5' : 0
        );
      }

      // 3. Media Image Smooth Settle (starts slightly enlarged, settles seamlessly)
      if (images.length > 0) {
        tl.fromTo(
          images,
          {
            scale: 1.14,
          },
          {
            scale: 1.0,
            duration: 1.15,
            stagger: 0.08,
            ease: 'power2.out',
          },
          header ? '-=0.7' : 0
        );
      }

      // Fallback: If no sub-elements were marked, animate the container itself
      if (!header && cards.length === 0) {
        tl.fromTo(
          el,
          {
            opacity: 0,
            rotateX: intensity,
            z: -depth,
            y: 50,
            scale: 0.96,
          },
          {
            opacity: 1,
            rotateX: 0,
            z: 0,
            y: 0,
            scale: 1,
            duration: 1.0,
            delay: delay,
            ease: 'power3.out',
          }
        );
      }
    }, containerRef);

    // Refresh ScrollTrigger calculations after initial paint
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [intensity, depth, delay, children]);

  return (
    <div
      ref={containerRef}
      className={`will-change-transform transform-gpu ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1400px',
      }}
    >
      {children}
    </div>
  );
}

export default ScrollReveal3D;
