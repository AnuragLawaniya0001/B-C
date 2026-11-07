import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const STORE_BANNERS = [
  {
    id: 'cricket',
    image: '/assets/banners/banner_cricket.jpg',
    badge: 'CHAMPIONSHIP SERIES',
    badgeStyle: 'bg-amber-400 text-slate-950 font-black',
    titlePrefix: 'ENGLISH WILLOW.',
    titleHighlight: 'MATCH GRADE.',
    description:
      'Certified Grade 1 English Willow bats tested for tournament punch and sweet-spot balance. Complete with official four-piece leather balls and professional batting armor.',
    category: 'GEARS',
    ctaPrimary: 'Shop Cricket Gear',
    ctaSecondary: 'Browse All Gear',
    perks: ['Grade 1 English Willow', 'Official Match Balls', 'Coach-Approved Balance'],
    accentColor: 'from-amber-400 via-amber-300 to-amber-500',
    linkPath: '/catalogue?category=GEARS',
  },
  {
    id: 'shoes',
    image: '/assets/banners/banner_shoes.jpg',
    badge: 'PRO VELOCITY 2026',
    badgeStyle: 'bg-cyan-400 text-slate-950 font-black',
    titlePrefix: 'KINETIC SPRINT &',
    titleHighlight: 'TRACK SPIKES.',
    description:
      'Engineered with carbon-infused traction plates and reinforced heel counters for explosive acceleration on track, turf, and championship field.',
    category: 'APPAREL',
    ctaPrimary: 'Explore Athletic Shoes',
    ctaSecondary: 'Browse Footwear',
    perks: ['Traction Grip Spikes', 'Featherlight FlyMesh', 'Shock Absorption Plates'],
    accentColor: 'from-cyan-400 via-sky-300 to-blue-500',
    linkPath: '/catalogue?category=APPAREL',
  },
  {
    id: 'apparel',
    image: '/assets/banners/banner_apparel.jpg',
    badge: 'ALL-WEATHER PERFORMANCE',
    badgeStyle: 'bg-indigo-400 text-slate-950 font-black',
    titlePrefix: 'DRYFIT ATHLETIC',
    titleHighlight: 'STADIUM WEAR.',
    description:
      'Breathable, moisture-wicking team jerseys, ergonomic compression base layers, and wind-shielding training tracksuits built for extreme stamina drills.',
    category: 'APPAREL',
    ctaPrimary: 'Shop Performance Wear',
    ctaSecondary: 'Browse Apparel',
    perks: ['Breathable DryFit Knit', 'Anti-Chafe Flatlock Seams', 'Thermal Wind-Shielding'],
    accentColor: 'from-indigo-400 via-cyan-300 to-sky-400',
    linkPath: '/catalogue?category=APPAREL',
  },
  {
    id: 'fitness',
    image: '/assets/banners/banner_fitness.jpg',
    badge: 'STRENGTH & CONDITIONING',
    badgeStyle: 'bg-emerald-400 text-slate-950 font-black',
    titlePrefix: 'ATHLETE RECOVERY &',
    titleHighlight: 'FITNESS ARSENAL.',
    description:
      'Cast iron hexagonal dumbbells, high-density textured recovery mats, and steel bearing speed ropes designed to push your athletic conditioning to the max.',
    category: 'FITNESS',
    ctaPrimary: 'Shop Gym Gear',
    ctaSecondary: 'Browse Fitness',
    perks: ['Hex Cast Iron Dumbbells', 'High-Density Non-Slip Mat', 'Bearing Speed Ropes'],
    accentColor: 'from-emerald-400 via-teal-300 to-cyan-400',
    linkPath: '/catalogue?category=FITNESS',
  },
];

export function StoreHeroCarousel({ onSelectCategory }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const timerRef = useRef(null);

  const totalSlides = STORE_BANNERS.length;

  const nextSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-rotation every 3 seconds (brisk commercial transitions, paused on hover)
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide, isPaused, currentIdx]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  const activeBanner = STORE_BANNERS[currentIdx];

  const handleCtaClick = (category, linkPath) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  return (
    <div
      className="relative w-full h-[600px] sm:h-[680px] md:h-[760px] lg:h-[840px] overflow-hidden bg-slate-950 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Full-Bleed Edge-to-Edge Slide Images (Crossfade Stack) ── */}
      <div className="absolute inset-0 w-full h-full">
        {STORE_BANNERS.map((banner, idx) => {
          const isActive = idx === currentIdx;
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Photography with Slow Cinematic Zoom */}
              <img
                src={banner.image}
                alt={banner.titlePrefix}
                className={`w-full h-full object-cover object-center sm:object-right transition-transform duration-[7000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Multi-layered Gradients for 100% Crisp Text Readability */}
              {/* Left-to-right deep dark vignette */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 via-45% to-slate-950/25 sm:via-55%" />
              {/* Bottom fade into page content */}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              {/* Top fade behind navbar */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent" />
            </div>
          );
        })}
      </div>

      {/* ── Active Slide Content Overlay (Full-Width with Max Container for Content Align) ── */}
      <div className="relative z-20 h-full w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col justify-between pt-24 sm:pt-28 md:pt-36 pb-12 sm:pb-16">
        {/* Top Meta Strip: Category Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs sm:text-sm font-mono uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-lg ${activeBanner.badgeStyle}`}
            >
              {activeBanner.badge}
            </span>
            <span className="hidden sm:inline-flex items-center gap-2 text-xs text-slate-300 font-mono tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Championship Season 2026 &bull; Verified Grade</span>
            </span>
          </div>
        </div>

        {/* Center: Big Bold Athletic Typography & CTAs */}
        <div className="max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-6">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight font-display leading-[1.05] uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,1)]">
            <span className="block">{activeBanner.titlePrefix}</span>
            <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${activeBanner.accentColor}`}>
              {activeBanner.titleHighlight}
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed font-sans max-w-xl sm:max-w-2xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            {activeBanner.description}
          </p>

          {/* Athlete Perks Strip */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
            {activeBanner.perks.map((perk, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Link
              to={activeBanner.linkPath}
              onClick={() => handleCtaClick(activeBanner.category, activeBanner.linkPath)}
              className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{activeBanner.ctaPrimary}</span>
            </Link>

            <a
              href="#shop-storefront"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider backdrop-blur-xl border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{activeBanner.ctaSecondary}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom Bar: Full-Width Segmented Progress Bars & Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {/* 4 Interactive Progress Segments */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
            {STORE_BANNERS.map((banner, idx) => {
              const isActive = idx === currentIdx;
              return (
                <button
                  key={banner.id}
                  onClick={() => setCurrentIdx(idx)}
                  className="relative flex-1 h-2 rounded-full bg-white/20 hover:bg-white/40 overflow-hidden transition-colors cursor-pointer group/bar"
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {isActive ? (
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="h-full w-0 group-hover/bar:w-full bg-white/40 transition-all duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Live Inventory Status Indicator */}
          <div className="hidden md:flex items-center gap-2.5 text-xs font-mono text-slate-300 bg-slate-950/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Equipment Active &bull; Pan-India Fast Delivery</span>
          </div>
        </div>
      </div>

      {/* ── Left / Right Full-Height Arrow Navigation Buttons ── */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-cyan-400 text-white hover:text-slate-950 backdrop-blur-xl border border-white/20 hover:border-cyan-400 flex items-center justify-center transition-all duration-200 shadow-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 cursor-pointer"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-cyan-400 text-white hover:text-slate-950 backdrop-blur-xl border border-white/20 hover:border-cyan-400 flex items-center justify-center transition-all duration-200 shadow-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 cursor-pointer"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>
    </div>
  );
}

export default StoreHeroCarousel;
