import React, { useRef, useState } from 'react';

/**
 * Card3DTilt:
 * High-performance 3D card tilt component with real-time specular glass glare.
 * Inspired by luxury tech/athletic brand experiences.
 */
export function Card3DTilt({
  children,
  className = '',
  maxTilt = 10, // max rotation in degrees
  perspective = 1000,
  scale = 1.025,
  glare = true,
}) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0) scale3d(1, 1, 1)`,
    transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
  });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = x / rect.width;
    const percentY = y / rect.height;

    // Tilt range from -maxTilt to +maxTilt
    const rotateX = ((percentY - 0.5) * -2 * maxTilt).toFixed(2);
    const rotateY = ((percentX - 0.5) * 2 * maxTilt).toFixed(2);

    setStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(16px) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.08s ease-out',
    });

    if (glare) {
      setGlarePosition({
        x: (percentX * 100).toFixed(1),
        y: (percentY * 100).toFixed(1),
        opacity: 0.28,
      });
    }
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0) scale3d(1, 1, 1)`,
      transition: 'transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1)',
    });

    if (glare) {
      setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative will-change-transform transform-gpu ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {children}

      {/* Real-time Specular Glare Overlay */}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-inherit overflow-hidden transition-opacity duration-300"
          style={{
            borderRadius: 'inherit',
            opacity: glarePosition.opacity,
            background: `radial-gradient(circle 350px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.35), transparent 75%)`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default Card3DTilt;
