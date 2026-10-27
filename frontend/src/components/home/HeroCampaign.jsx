import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Flame,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  Award,
  Truck,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function HeroCampaign({ sectionConfig, rules }) {
  const freeShippingThreshold = Math.round((rules?.free_delivery_threshold_paise || 50000) / 100);

  // Dynamic values driven strictly by admin backend section configuration
  const headline = sectionConfig?.title || 'Gear Up Like a Champion.';
  const subtitle =
    sectionConfig?.subtitle ||
    'Discover match-tested sports equipment, certified athletic gear, and professional training apparel crafted for champions across India.';
  const primaryCtaText = sectionConfig?.cta_text || sectionConfig?.cta_label || 'Shop Store Catalog';
  const primaryCtaLink = sectionConfig?.cta_link || '/store';

  // Video and Poster determination
  const isVideo = sectionConfig?.media_type === 'video';
  const mediaUrl =
    sectionConfig?.media_url ||
    'https://res.cloudinary.com/ibq3zgu8/video/upload/v1793031763/bigchamp/media/videos/bigchamp_hero_campaign.mp4';
  const posterUrl =
    sectionConfig?.poster_url ||
    'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031762/bigchamp/media/images/hero_campaign_banner_1793006420241.jpg';

  // Playback & Animation Refs
  const videoRef = useRef(null);
  const heroSectionRef = useRef(null);
  const mediaContainerRef = useRef(null);
  const contentRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  // Cinematic GSAP ScrollTrigger Transition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Keep video full-bleed flush without shrink margins or borders
      if (mediaContainerRef.current) {
        gsap.to(mediaContainerRef.current, {
          opacity: 0.85,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      }

      // Smooth initial landing entrance
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, y: 35, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'power3.out', delay: 0.1 }
        );

        // Editorial copy and buttons glide up on scroll with subtle depth
        gsap.to(contentRef.current, {
          y: -45,
          opacity: 0.85,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      }
    }, heroSectionRef);

    return () => ctx.revert();
  }, []);

  // Respect OS reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Ensure video element plays reliably and handles autoplay/mute properly
  useEffect(() => {
    if (videoRef.current && isVideo && !videoFailed) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Hero campaign video autoplay notice:', err);
        });
      }
    }
  }, [mediaUrl, isVideo, videoFailed]);

  return (
    <section ref={heroSectionRef} className="relative min-h-[700px] sm:min-h-[760px] lg:min-h-[820px] flex items-center bg-slate-950 text-white overflow-hidden pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-24">
      {/* Background Media Container (HTML5 H.264 Video or High-Res Poster) */}
      <div ref={mediaContainerRef} className="absolute inset-0 z-0 overflow-hidden transform-gpu will-change-transform">
        {isVideo && !videoFailed ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            poster={posterUrl}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            onError={() => {
              console.warn('Video playback encountered an error, displaying poster fallback.');
              setVideoFailed(true);
            }}
            className="w-full h-full object-cover object-[65%_center] lg:object-[68%_center] scale-105 transition-opacity duration-1000 filter brightness-[1.08] contrast-[1.14] saturate-[1.28]"
          />
        ) : (
          <img
            src={posterUrl}
            alt={headline}
            className="w-full h-full object-cover object-[65%_center] lg:object-[68%_center] opacity-85 scale-105 transition-transform duration-1000 filter brightness-[1.08] contrast-[1.14] saturate-[1.28]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031788/bigchamp/images/hero_main.jpg';
            }}
          />
        )}

        {/* Cinematic Multi-layered Gradients tuned for video visibility and text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/30 to-slate-950/85 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/50 to-slate-950/10 lg:to-transparent pointer-events-none" />

        {/* Dynamic Athletic Color Glows to make sports colors pop */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-1/3 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Video Controls Bar (Accessible & Unobtrusive) */}
        {isVideo && !videoFailed && (
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2.5 bg-slate-950/75 hover:bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs transition-all shadow-xl">
            <button
              onClick={togglePlay}
              className="p-1 rounded-full hover:bg-white/20 text-slate-200 hover:text-accent-400 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause video' : 'Play video'}
              aria-label={isPlaying ? 'Pause video campaign' : 'Play video campaign'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-accent-400" /> : <Play className="w-3.5 h-3.5 text-accent-400" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-1 rounded-full hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute video' : 'Mute video'}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-300" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <div className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-300 font-mono tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HD Video
            </span>
          </div>
        )}
      </div>

      <div ref={contentRef} className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10 transform-gpu will-change-transform">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Main Column: Value Prop & Editorial Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-accent-400 shadow-sm">
              <Flame className="w-4 h-4 text-accent-400" />
              <span className="tracking-wide uppercase font-bold text-[11px]">
                Premier Indian Sports & Athletic Storefront
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] font-display text-white">
              {headline.includes('Champion') ? (
                <>
                  Gear Up Like a{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-accent-500 to-amber-300">
                    Champion
                  </span>
                  .
                </>
              ) : (
                headline
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to={primaryCtaLink}>
                <Button
                  size="lg"
                  className="bg-accent-500 hover:bg-accent-600 text-white font-bold shadow-lg shadow-accent-500/30 px-8 py-3.5 text-sm sm:text-base rounded-xl transition-all hover:scale-105 active:scale-95"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {primaryCtaText}
                </Button>
              </Link>

              <Link to="/offers">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/25 text-white hover:bg-white/20 backdrop-blur-md px-6 py-3.5 text-sm sm:text-base rounded-xl transition-all"
                >
                  View Active Offers
                </Button>
              </Link>
            </div>

            {/* Quick Trust Highlights */}
            <div className="pt-8 border-t border-white/15 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 text-left">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white font-display">100%</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Authentic Gear</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-accent-400 font-display">Fast</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Pan-India Dispatch</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white font-display">HMAC</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Verified Safe</p>
              </div>
            </div>
          </div>

          {/* Right Column: Product Merchandising Spotlight (Ultra-sleek Glassmorphism so video shines through) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-950/50 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 relative overflow-hidden group transition-all duration-300">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-accent-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent-400 bg-accent-500/10 px-3 py-1 rounded-full border border-accent-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Tournament Standard
                </span>
                <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/15">
                  Pro Equipment
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-white font-display">
                  Certified Match Gear
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Precision-balanced English willow bats, hand-stitched tournament cricket balls, and velocity footwear built for competitive Indian athletes.
                </p>
              </div>

              <div className="space-y-2 pt-2.5 border-t border-white/15 text-xs text-slate-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Handcrafted Grade 1 English Willow & tested leather balls</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Free insured shipping on orders above ₹{freeShippingThreshold}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>7-day easy size exchange on all training apparel</span>
                </div>
              </div>

              <Link to="/store" className="block pt-1.5">
                <Button className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 text-sm rounded-xl shadow-lg shadow-accent-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Explore Pro Catalogue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
