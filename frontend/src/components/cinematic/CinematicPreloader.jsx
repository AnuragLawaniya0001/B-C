import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Volume2, VolumeX } from 'lucide-react';

export function CinematicPreloader({ progress = 0, onComplete, onSkip }) {
  const [fadeout, setFadeout] = useState(false);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setFadeout(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#030712] flex flex-col items-center justify-center transition-opacity duration-700 ${
        fadeout ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Center Branding & Progress */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md space-y-6">
        {/* Animated Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-slate-950 font-black text-3xl shadow-2xl shadow-amber-500/30 animate-pulse">
            BC
          </div>
          <div className="absolute -inset-3 rounded-3xl border border-amber-500/20 animate-spin duration-[15000ms]" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider font-display">
            BIG<span className="text-amber-400">CHAMP</span>
          </h2>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-mono">
            Cinematic Experience &bull; Birth of a Legend
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-64 space-y-2">
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>LOADING ASSETS</span>
            <span className="text-amber-400 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Skip to Shopping option */}
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider font-mono pt-4 group cursor-pointer"
        >
          <span>Skip to Storefront</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default CinematicPreloader;

