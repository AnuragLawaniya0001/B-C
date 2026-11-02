import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export function CinematicIntroOverlay({ onSkip }) {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPast(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col justify-center items-center px-6 pointer-events-none select-none transition-all duration-700 ${
        scrolledPast ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Center Hero Intro Narrative Card with Frosted Backplate */}
      <div className="text-center space-y-4 max-w-xl pointer-events-auto bg-slate-950/70 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-400/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest shadow-xl shadow-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Cinematic Interactive Experience</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-display uppercase leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
          Birth of a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">Legend</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-200 font-medium tracking-wide max-w-md mx-auto leading-relaxed drop-shadow">
          Every champion has a beginning. Scroll to take control of time and witness the craft of English Willow.
        </p>

        {/* Scroll cue with animated bouncing pill */}
        <div className="pt-2 flex flex-col items-center gap-2 text-slate-400 text-xs font-mono tracking-widest uppercase">
          <span className="text-cyan-400 font-bold animate-pulse text-[11px]">
            Scroll Down to Control
          </span>
          <div className="w-6 h-10 rounded-full border-2 border-cyan-400/50 flex items-start justify-center p-1 shadow-lg shadow-cyan-500/20">
            <div className="w-1.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CinematicIntroOverlay;
