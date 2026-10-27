import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global reactive scroll velocity store for 3D physics
export const scrollPhysics = {
  velocity: 0,
  progress: 0,
  currentY: 0,
};

/**
 * useLenisScroll:
 * Synchronizes Lenis inertial smooth scroll with GSAP ScrollTrigger ticker.
 * Provides the rock-solid foundation for high-end 60/120fps continuous 3D scroll animations.
 */
export function useLenisScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      scrollPhysics.velocity = e.velocity || 0;
      scrollPhysics.currentY = e.scroll || 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollPhysics.progress = maxScroll > 0 ? e.scroll / maxScroll : 0;
    });

    // Drive Lenis through GSAP ticker for sub-pixel frame accuracy
    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
}
