import React, { useEffect, useState } from 'react';

/**
 * ScrollProgress3D:
 * Sleek 3D glowing kinetic scroll-indicator bar anchored to the top of the viewport.
 */
export function ScrollProgress3D() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(1, Math.max(0, window.scrollY / totalHeight));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (scrollProgress <= 0.005) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.85)] transition-transform duration-75 ease-out origin-left"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />
    </div>
  );
}

export default ScrollProgress3D;
