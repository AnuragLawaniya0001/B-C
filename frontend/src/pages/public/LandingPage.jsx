import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import toast from 'react-hot-toast';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
  Building2,
  Activity,
  CreditCard,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  Phone,
  ChevronDown,
  Plus,
  Minus,
  Check,
  Star,
  Compass,
  Trophy,
  Truck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';

const TOTAL_FRAMES = 240;

const CHAPTERS = [
  'PROLOGUE · BORN TO WIN',
  'CHAPTER I · THE ATHLETE PATHWAY',
  'CHAPTER II · STUDENT & ACADEMY',
  'CHAPTER III · MATCH PERFORMANCE',
  'CHAPTER IV · ARMED FORCES HONOR',
  'CHAPTER V · THE UNIFIED ECOSYSTEM',
  'CHAPTER VI · ALL-ACCESS VIP PASS',
  'CHAPTER VII · FREQUENTLY ASKED QUESTIONS',
  'EPILOGUE · START YOUR JOURNEY',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { items } = useCartStore();
  const { getBusinessRules, getSiteContact, fetchSettings } = useSettingsStore();

  const rules = getBusinessRules();
  const siteContact = getSiteContact();
  const cartCount = items.reduce((total, item) => total + (item.qty || item.quantity || 1), 0);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const grainRef = useRef(null);
  const flareRef = useRef(null);
  const progressBarRef = useRef(null);
  const hudTextRef = useRef(null);
  const lenisRef = useRef(null);

  const [activeChapter, setActiveChapter] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactInput, setContactInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // References for animation loop
  const framesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollMetricsRef = useRef({ progress: 0, velocity: 0 });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Film Grain Animation
  useEffect(() => {
    const gc = grainRef.current;
    if (!gc) return;
    const gx = gc.getContext('2d');
    if (!gx) return;

    const id = gx.createImageData(200, 200);
    const interval = setInterval(() => {
      const d = id.data;
      const len = d.length;
      for (let i = 0; i < len; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      gx.putImageData(id, 0, 0);
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // 2. Interactive Parallax & Flashlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      const m = mouseRef.current;
      m.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      m.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (flareRef.current) {
        flareRef.current.style.setProperty('--x', `${e.clientX}px`);
        flareRef.current.style.setProperty('--y', `${e.clientY}px`);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        const m = mouseRef.current;
        m.targetX = (t.clientX / window.innerWidth - 0.5) * 2;
        m.targetY = (t.clientY / window.innerHeight - 0.5) * 2;
        if (flareRef.current) {
          flareRef.current.style.setProperty('--x', `${t.clientX}px`);
          flareRef.current.style.setProperty('--y', `${t.clientY}px`);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // 3. Lenis Smooth Inertial Scroll Engine
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateMetrics = (scrollY, velocity) => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
      scrollMetricsRef.current.progress = progress;
      scrollMetricsRef.current.velocity = velocity || 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progress * 100}%`;
      }
    };

    let lenis = null;
    if (!prefersReduced) {
      try {
        lenis = new Lenis({
          duration: 1.25,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.95,
          touchMultiplier: 1.4,
        });

        lenis.on('scroll', (e) => {
          updateMetrics(e.scroll, e.velocity);
        });
        lenisRef.current = lenis;
      } catch (err) {
        console.warn('Lenis initialization fallback:', err);
      }
    }

    const fallbackScroll = () => {
      updateMetrics(window.scrollY || window.pageYOffset, 0);
    };

    if (!lenis) {
      window.addEventListener('scroll', fallbackScroll, { passive: true });
    }

    return () => {
      if (lenis) {
        lenis.destroy();
        lenisRef.current = null;
      } else {
        window.removeEventListener('scroll', fallbackScroll);
      }
    };
  }, []);

  // 4. Preload 240 High-Definition Frames
  useEffect(() => {
    const frames = [];
    let count = 0;

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const img = new Image();
      const num = ('00' + f).slice(-3);
      img.src = `/assets/frames/frame_${num}.webp`;
      img.onload = () => {
        count++;
        setLoadedCount(count);
        if (count >= 12) {
          setIsPreloaded(true);
        }
      };
      img.onerror = () => {
        count++;
        setLoadedCount(count);
      };
      frames.push(img);
    }
    framesRef.current = frames;

    return () => {
      framesRef.current = [];
    };
  }, []);

  // 5. Canvas Animation & Scrubber Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();

    let animationFrameId = null;

    const renderCanvasFrame = (frameIndex) => {
      const frames = framesRef.current;
      if (!frames || frames.length === 0) return;

      const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIndex)));
      let img = frames[idx];
      if (!img || !img.complete || img.naturalWidth === 0) {
        img = frames[0];
      }
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;

      const m = mouseRef.current;
      const nx = (cw - nw) / 2 + m.x * cw * 0.015;
      const ny = (ch - nh) / 2 + m.y * ch * 0.012;

      ctx.drawImage(img, nx, ny, nw, nh);
    };

    const renderTick = (now) => {
      animationFrameId = requestAnimationFrame(renderTick);

      if (lenisRef.current) {
        lenisRef.current.raf(now);
      }

      // Mouse parallax smoothing
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.08;
      m.y += (m.targetY - m.y) * 0.08;

      // Map scroll progress to target frame [0, 239]
      targetFrameRef.current = scrollMetricsRef.current.progress * (TOTAL_FRAMES - 1);

      // Silky frame smoothing lerp
      currentFrameRef.current += (targetFrameRef.current - currentFrameRef.current) * 0.18;

      renderCanvasFrame(currentFrameRef.current);
    };

    animationFrameId = requestAnimationFrame(renderTick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // 6. Section Intersection Observer for Telemetry HUD
  useEffect(() => {
    const secs = document.querySelectorAll('section[data-i]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
            const idx = parseInt(entry.target.dataset.i, 10);
            if (!isNaN(idx)) {
              setActiveChapter(idx);
              if (hudTextRef.current && CHAPTERS[idx]) {
                hudTextRef.current.textContent = CHAPTERS[idx];
              }
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    secs.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, []);

  // Smooth Scroll Helper
  const scrollToSection = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(id);
    if (!target) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.3, offset: -50 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Lead Generation Submit
  const handleLeadSubmit = (e) => {
    e.preventDefault();
    if (!contactInput.trim()) {
      toast.error('Please enter a valid mobile number or email address.');
      return;
    }
    setIsSubmitted(true);
    toast.success('Welcome to the BIGCHAMP Network! Our athletic advisory team will connect with you within 24 hours.', {
      duration: 5000,
    });
    setContactInput('');
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Real match-grade products for Performance Showcase
  const showcaseProducts = [
    {
      id: 1,
      title: 'English Willow Bat Grade 1',
      subtitle: 'Match Grade Pro Willow · Hand Crafted',
      price: '₹4,499',
      mrp: '₹7,999',
      image: '/uploads/products/prod_bb5773fb3301.jpg',
      badge: 'Match Grade',
      link: '/store?search=bat',
    },
    {
      id: 2,
      title: 'FIFA Pro Match Football',
      subtitle: 'Size 5 High-Traction Official Match Ball',
      price: '₹1,299',
      mrp: '₹2,499',
      image: '/uploads/products/prod_615e0bf0fe1b.jpg',
      badge: 'FIFA Certified',
      link: '/store?search=football',
    },
    {
      id: 3,
      title: 'Pro Velocity Running Shoes',
      subtitle: 'Sprint Track Spike & Trail Cushion',
      price: '₹2,199',
      mrp: '₹3,999',
      image: '/uploads/products/prod_04d47c2d2d11.jpg',
      badge: 'High Traction',
      link: '/store?search=shoes',
    },
    {
      id: 4,
      title: 'Carbon Pro Badminton Racket',
      subtitle: 'Lightweight Graphite · High String Tension',
      price: '₹1,899',
      mrp: '₹3,299',
      image: '/uploads/products/prod_5c6a0e7b3536.jpg',
      badge: 'Tournament Pro',
      link: '/store?search=racket',
    },
  ];

  return (
    <div className="landing-root bg-[#030712] text-[#f8fafc] font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* ── Brand Styling System: Obsidian Carbon + Liquid Chrome + Electric Cyan ── */}
      <style>{`
        :root {
          --brand-cyan: #00f0ff;
          --brand-cyan-glow: rgba(0, 240, 255, 0.45);
          --brand-cyan-deep: #0284c7;
          --brand-chrome-top: #ffffff;
          --brand-chrome-mid: #cbd5e1;
          --brand-chrome-dark: #64748b;
          --dark-base: #030712;
          --panel-glass: rgba(6, 11, 23, 0.84);
          --font-display: 'Syne', system-ui, -apple-system, sans-serif;
          --font-body: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .font-syne {
          font-family: var(--font-display);
        }

        /* 3D Cinematic Viewport */
        #viewport3D {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        #canvasFrame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        #bgVideo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -1;
          filter: brightness(0.7) contrast(1.1);
        }

        /* Atmospheric Scrim & Contrast Overlays: Prevents any background bright spots from washing out text */
        .fx-vig {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(circle at 50% 50%, rgba(3, 7, 18, 0.35) 20%, rgba(3, 7, 18, 0.75) 65%, rgba(2, 6, 23, 0.95) 100%);
        }

        .fx-shade {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(3, 7, 18, 0.88) 0%, rgba(3, 7, 18, 0.25) 20%, rgba(3, 7, 18, 0.45) 80%, rgba(2, 6, 23, 0.92) 100%);
        }

        #fl {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          mix-blend-mode: screen;
          background: radial-gradient(circle at var(--x, 70%) var(--y, 30%), rgba(0, 240, 255, 0.08), transparent 30%);
          transition: background 0.12s ease-out;
        }

        #gr {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          width: 100%;
          height: 100%;
          opacity: 0.03;
          mix-blend-mode: overlay;
        }

        /* 2.39:1 Hollywood Letterbox Film Bars */
        .bar {
          position: fixed;
          left: 0;
          right: 0;
          height: clamp(12px, 1.8vh, 22px);
          background: #000;
          z-index: 25;
          pointer-events: none;
        }
        .bar.t { top: 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
        .bar.b { bottom: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); }

        /* Telemetry HUD - Placed at Bottom-Left */
        #hud {
          position: fixed;
          bottom: clamp(20px, 3vh, 32px);
          left: 3vw;
          z-index: 35;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 700;
          color: #fff;
          background: rgba(6, 11, 23, 0.88);
          backdrop-filter: blur(16px);
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(0, 240, 255, 0.25);
          pointer-events: none;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 240, 255, 0.15);
        }

        #hud .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--brand-cyan);
          box-shadow: 0 0 10px var(--brand-cyan);
          animation: pulseDot 2s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }

        /* Bottom Progress Line */
        #progressBar {
          position: fixed;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 0%;
          background: linear-gradient(90deg, #0284c7, var(--brand-cyan), #ffffff);
          z-index: 100;
          transition: width 0.05s linear;
          box-shadow: 0 0 14px var(--brand-cyan);
        }

        /* Typography */
        .k-tag {
          letter-spacing: 0.22em;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .heading-hero {
          font-family: var(--font-display);
          line-height: 0.94;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          font-weight: 900;
          font-size: clamp(48px, 8vw, 108px);
          text-shadow: 0 4px 35px rgba(0, 0, 0, 0.95);
        }

        .heading-section {
          font-family: var(--font-display);
          line-height: 1.04;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          font-weight: 900;
          font-size: clamp(32px, 5vw, 64px);
          text-shadow: 0 4px 30px rgba(0, 0, 0, 0.95);
        }

        /* Liquid Chrome Metallic Text (Matches Silver Winged Logo) */
        .g-chrome {
          background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 45%, #94a3b8 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          display: inline-block;
          filter: drop-shadow(0 2px 16px rgba(255, 255, 255, 0.45));
        }

        /* Electric Cyan Gradient Accent */
        .g-cyan {
          background: linear-gradient(135deg, #a5f3fc 0%, #22d3ee 50%, #0284c7 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          display: inline-block;
          filter: drop-shadow(0 2px 18px rgba(6, 182, 212, 0.6));
        }

        /* Electric Emerald / Defense Gradient */
        .g-defense {
          background: linear-gradient(135deg, #a7f3d0 0%, #10b981 50%, #047857 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          display: inline-block;
          filter: drop-shadow(0 2px 16px rgba(16, 185, 129, 0.6));
        }

        /* High-Performance Action Buttons (Electric Cyan & Chrome) */
        .btn-cyan {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 9999px;
          font-family: var(--font-display);
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-size: 11px;
          background: linear-gradient(135deg, #00f0ff, #38bdf8, #0284c7);
          color: #030712;
          border: 0;
          cursor: pointer;
          transition: transform 0.25s, box-shadow 0.25s, filter 0.25s;
          box-shadow: 0 4px 24px rgba(0, 240, 255, 0.35);
        }
        .btn-cyan:hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 240, 255, 0.55);
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 26px;
          border-radius: 9999px;
          font-family: var(--font-display);
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-size: 11px;
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(14px);
          cursor: pointer;
          transition: transform 0.25s, background 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #38bdf8;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(56, 189, 248, 0.25);
        }

        /* Glass Tile Backplates: High contrast against video light */
        .glass-tile {
          background: rgba(6, 11, 23, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
        }
        .glass-tile:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 240, 255, 0.45);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 240, 255, 0.15);
        }

        /* Staggered Reveal Animation */
        .rv {
          opacity: 0;
          transform: translateY(24px);
          filter: blur(5px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        section.on .rv {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        /* Section Ambient Backing: Guarantees 100% text readability */
        .section-backplate {
          background: radial-gradient(circle at 50% 50%, rgba(4, 8, 18, 0.9) 0%, rgba(3, 7, 18, 0.7) 65%, transparent 100%);
          border-radius: 32px;
          padding: 2.5rem 1.5rem;
        }

        /* Smooth Anchor Scroll Margin */
        section {
          scroll-margin-top: 90px;
        }

        @media(max-width: 900px) {
          #hud { display: none; }
        }
      `}</style>

      {/* 1. Cinematic Background Viewport (Canvas Frame Scrubber) */}
      <div id="viewport3D">
        <canvas ref={canvasRef} id="canvasFrame" />
        <video
          ref={videoRef}
          id="bgVideo"
          src="/gemini_generated_video_51bd0262.mp4"
          muted
          playsInline
          autoPlay
          loop
          style={{ opacity: isPreloaded ? 0.3 : 0.8, transition: 'opacity 0.8s ease' }}
        />
      </div>

      {/* Atmospheric Contrast Overlays */}
      <div className="fx-vig" />
      <div className="fx-shade" />
      <div ref={flareRef} id="fl" />
      <canvas ref={grainRef} id="gr" width="200" height="200" />

      {/* Hollywood Letterbox Bars */}
      <div className="bar t" />
      <div className="bar b" />

      {/* Telemetry HUD (Bottom Left) */}
      <div id="hud">
        <span className="dot" />
        <span ref={hudTextRef}>PROLOGUE · BORN TO WIN</span>
        <span className="text-[10px] text-cyan-300 font-mono tracking-normal ml-2 opacity-95">
          [{Math.round(scrollMetricsRef.current.progress * 100)}%]
        </span>
      </div>

      {/* Top Scroll Progress Line */}
      <div ref={progressBarRef} id="progressBar" />

      {/* Frame Preloader Indicator */}
      {!isPreloaded && (
        <div className="fixed bottom-12 right-6 z-40 bg-slate-950/95 border border-cyan-500/40 px-4 py-2 rounded-full backdrop-blur-xl flex items-center gap-3 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
            Loading Engine ({Math.min(100, Math.round((loadedCount / 30) * 100))}%)
          </span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: NAVBAR
          Integrated Brand Emblem + Forward-Slanted Metallic Brand Wordmark
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 sm:py-4">
        <nav
          className={`max-w-6xl mx-auto rounded-full px-5 py-2.5 transition-all duration-300 flex items-center justify-between gap-4 border ${isScrolled
              ? 'bg-[#030712]/95 backdrop-blur-2xl border-cyan-500/25 shadow-2xl shadow-cyan-950/20'
              : 'bg-[#030712]/80 backdrop-blur-xl border-white/10 shadow-lg'
            }`}
        >
          {/* Brand Logo & Aerodynamic Wordmark (Following Actual Brand Identity) */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/assets/logo_emblem.png"
              alt="Bigchamp Winged Crest"
              className="h-9 sm:h-10 w-auto filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-syne font-black italic text-xl sm:text-2xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-none drop-shadow">
                BIGCHAMP
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] uppercase text-cyan-400 font-bold mt-1">
                Born to Win
              </span>
            </div>
          </Link>

          {/* Center 5 Links (Store, Hostels, Physio, Membership, Contact) */}
          <ul className="hidden md:flex items-center gap-6 lg:gap-8 list-none text-xs tracking-[1.5px] uppercase font-bold text-slate-300 shrink-0">
            <li>
              <Link
                to="/store"
                className="text-cyan-400 hover:text-white transition-colors flex items-center gap-1.5 font-extrabold"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Store</span>
              </Link>
            </li>
            <li>
              <Link to="/dormitory" className="hover:text-cyan-400 transition-colors">
                Hostels
              </Link>
            </li>
            <li>
              <Link to="/physio" className="hover:text-cyan-400 transition-colors">
                Physio
              </Link>
            </li>
            <li>
              <Link to="/membership" className="hover:text-cyan-400 transition-colors">
                Membership
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-cyan-400 transition-colors">
                Contact
              </Link>
            </li>
          </ul>

          {/* Action Hub (Live Cart, Cyan Join Pass CTA, Auth, Mobile Toggle) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Live Cart Pill */}
            <Link
              to="/cart"
              className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-all flex items-center justify-center group"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[10px] flex items-center justify-center px-1 shadow-md shadow-cyan-500/50 animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Exactly One Action Button: Join ₹100 Pass (Hidden on mobile) */}
            <Link
              to="/membership"
              className="btn-cyan hidden sm:inline-flex text-[11px] py-2 px-4 sm:px-5"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-950" />
              <span>Join ₹100 Pass</span>
            </Link>

            {/* User Auth Portal */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:scale-105 transition-transform"
                title="Go to Dashboard"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center font-black text-[10px]">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <span className="hidden xl:inline text-[11px]">{user?.full_name?.split(' ')[0] || 'User'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors hidden lg:inline"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Glass Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#030712]/98 backdrop-blur-2xl flex flex-col p-8 pt-24 animate-in fade-in duration-200">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col gap-5 text-center text-base font-syne font-black uppercase tracking-widest text-slate-200">
            <Link
              to="/store"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-cyan-400 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Official Sports Store</span>
            </Link>
            <Link
              to="/dormitory"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Athlete Hostels
            </Link>
            <Link
              to="/physio"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Sports Physio
            </Link>
            <Link
              to="/membership"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-cyan-400"
            >
              ₹100 VIP Athlete Pass
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Contact Us
            </Link>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/10">
            <Link
              to="/membership"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-cyan inline-flex w-full text-center"
            >
              Join ₹100 Pass 🎖️
            </Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-wider"
            >
              {isAuthenticated ? 'My Dashboard' : 'Sign In / Register'}
            </Link>
          </div>
        </div>
      )}

      {/* Main Narrative Chapters Track */}
      <main className="relative z-10 pointer-events-none">
        {/* =====================================================================
            SECTION 2: HERO
            ===================================================================== */}
        <section
          id="top"
          data-i="0"
          className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-28 pb-16 pointer-events-auto relative on"
        >
          <div className="max-w-4xl mx-auto text-center rv section-backplate">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold uppercase tracking-widest mb-5 backdrop-blur-md shadow-lg shadow-black/40">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>India's First Integrated Athlete Ecosystem</span>
            </div>

            {/* Massive Heading: Metallic Chrome + Cyan */}
            <h1 className="heading-hero mb-4">
              <span className="g-chrome">BORN TO </span>
              <span className="g-cyan">WIN.</span>
            </h1>

            {/* Subtitle with High Contrast Guarantee */}
            <p className="text-base sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-8 drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] font-medium">
              The complete sports performance platform. Uniting tournament-grade equipment, verified athlete accommodations, certified recovery clinics, and all-access memberships in one destination.
            </p>

            {/* Two Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/store" className="btn-cyan inline-flex text-xs sm:text-sm px-8 py-3.5">
                <ShoppingBag className="w-4 h-4 text-slate-950" />
                <span>Shop Sports Gear</span>
              </Link>

              <a
                href="#pathway"
                onClick={(e) => scrollToSection(e, '#pathway')}
                className="btn-outline text-xs sm:text-sm px-7 py-3.5"
              >
                <span>Explore the Platform</span>
                <ChevronDown className="w-4 h-4 text-cyan-400" />
              </a>
            </div>

            {/* Persona Quick-Jump Chips */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10 pt-6 border-t border-white/10 max-w-md mx-auto">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mr-1">
                Explore Pathways:
              </span>
              <a
                href="#student"
                onClick={(e) => scrollToSection(e, '#student')}
                className="px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-200 text-xs font-bold hover:bg-sky-500/30 transition-all flex items-center gap-1.5 backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Student Athletes</span>
              </a>
              <a
                href="#competitors"
                onClick={(e) => scrollToSection(e, '#competitors')}
                className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Championship Arena</span>
              </a>
              <a
                href="#defense"
                onClick={(e) => scrollToSection(e, '#defense')}
                className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Armed Forces</span>
              </a>
            </div>

            {/* Subtle Scroll Indicator */}
            <div className="mt-8 flex flex-col items-center gap-1 text-[11px] uppercase tracking-widest text-slate-300 animate-bounce">
              <span>Scroll to Explore</span>
              <ChevronDown className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 3: NUMBERS STRIP
            ===================================================================== */}
        <section className="px-4 py-6 pointer-events-auto relative">
          <div className="max-w-6xl mx-auto glass-tile px-6 py-4 flex flex-wrap items-center justify-around gap-6 text-center shadow-xl border-cyan-500/20">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <div className="font-syne font-bold text-sm text-white">Tournament Match Gear</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">100% Coach-Approved Quality</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <div className="font-syne font-bold text-sm text-white">Free Standard Shipping</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">On Orders Above ₹500</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <div className="font-syne font-bold text-sm text-white">Verified Athlete Hostels</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Near Major Stadiums &amp; SAI Hubs</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <div className="font-syne font-bold text-sm text-white">Sports Physio Clinics</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Certified Injury Rehabilitation</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <div className="font-syne font-bold text-sm text-white">₹100 Athlete Pass</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">11 Months Nationwide Access</div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 4: THE ATHLETE PATHWAY
            ===================================================================== */}
        <section
          id="pathway"
          data-i="1"
          className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4 py-20 pointer-events-auto relative"
        >
          <span id="safar" className="absolute -top-24 pointer-events-none" />

          <div className="max-w-5xl mx-auto w-full rv section-backplate">
            <span className="k-tag text-cyan-400 mx-auto">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Structured Athlete Progression</span>
            </span>

            <h2 className="heading-section mb-3">
              EVERY CHAMPION'S JOURNEY <span className="g-cyan">STARTS WITH PURPOSE.</span>
            </h2>

            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-12 drop-shadow-md">
              From a student discovering passion on school grounds, to an elite competitor commanding the arena, to defense personnel maintaining peak tactical readiness — BIGCHAMP provides dedicated athletic infrastructure at every milestone.
            </p>

            {/* Connected Journey Stepper */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <a
                href="#student"
                onClick={(e) => scrollToSection(e, '#student')}
                className="glass-tile p-6 text-left group border-sky-500/30 hover:border-sky-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400">
                    Stage 01
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                </div>
                <h3 className="font-syne font-bold text-xl text-white mb-2 group-hover:text-sky-300 transition-colors">
                  Student &amp; Academy
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Grassroots development, selection trial subsidies, and verified budget dormitory accommodations.
                </p>
                <span className="text-xs font-bold text-sky-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Student Pathway &rarr;
                </span>
              </a>

              {/* Step 2 */}
              <a
                href="#competitors"
                onClick={(e) => scrollToSection(e, '#competitors')}
                className="glass-tile p-6 text-left group border-cyan-500/30 hover:border-cyan-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                    Stage 02
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
                </div>
                <h3 className="font-syne font-bold text-xl text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  Arena &amp; Tournament
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Professional match-certified equipment, high-traction footwear, and sports injury recovery clinics.
                </p>
                <span className="text-xs font-bold text-cyan-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Championship Gear &rarr;
                </span>
              </a>

              {/* Step 3 */}
              <a
                href="#defense"
                onClick={(e) => scrollToSection(e, '#defense')}
                className="glass-tile p-6 text-left group border-emerald-500/30 hover:border-emerald-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                    Stage 03
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                </div>
                <h3 className="font-syne font-bold text-xl text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  Armed Forces &amp; Defense
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Tactical endurance gear, transit accommodations for duty transfers, and an exclusive 10% defense privilege.
                </p>
                <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Defense Privileges &rarr;
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 5: ACT 1 - STUDENT
            ===================================================================== */}
        <section
          id="student"
          data-i="2"
          className="min-h-screen flex flex-col justify-center px-4 py-20 pointer-events-auto relative"
        >
          <div className="max-w-6xl mx-auto w-full rv section-backplate">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Story & Benefits */}
              <div className="lg:col-span-7">
                <span className="k-tag text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Phase I · Grassroots &amp; Aspiration</span>
                </span>

                <h2 className="heading-section mb-3">
                  STUDENT ATHLETES.<br />
                  <span className="g-cyan">TOMORROW'S CHAMPIONS.</span>
                </h2>

                <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6 drop-shadow-md">
                  High ambitions should never be compromised by financial barriers. BIGCHAMP equips emerging student athletes with tournament-grade equipment, selection trial subsidies, and safe hostel accommodations without excessive costs.
                </p>

                {/* Big Highlight: Screen's biggest number */}
                <div className="p-4 sm:p-5 rounded-2xl glass-tile border-cyan-500/40 flex items-baseline gap-4 mb-6">
                  <span className="font-syne font-black text-5xl sm:text-6xl text-cyan-300 leading-none drop-shadow-[0_2px_15px_rgba(0,240,255,0.5)]">
                    ₹100
                  </span>
                  <div>
                    <div className="font-syne font-bold text-white text-base">Digital Athlete Pass</div>
                    <div className="text-xs text-slate-300">11 Months Nationwide Validity + Instant ₹100 Wallet Credit</div>
                  </div>
                </div>

                {/* 3 Benefits with Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  <div className="p-3.5 rounded-xl glass-tile border-white/10">
                    <Trophy className="w-4 h-4 text-sky-400 mb-2" />
                    <div className="font-bold text-xs text-white mb-0.5">Trial &amp; Selection Subsidies</div>
                    <div className="text-[11px] text-slate-300">Direct concessions for stadium, state, and SAI trials</div>
                  </div>
                  <div className="p-3.5 rounded-xl glass-tile border-white/10">
                    <Building2 className="w-4 h-4 text-sky-400 mb-2" />
                    <div className="font-bold text-xs text-white mb-0.5">Budget Dormitory Stays</div>
                    <div className="text-[11px] text-slate-300">Safe, verified beds near premier sports hubs</div>
                  </div>
                  <div className="p-3.5 rounded-xl glass-tile border-white/10">
                    <CreditCard className="w-4 h-4 text-sky-400 mb-2" />
                    <div className="font-bold text-xs text-white mb-0.5">100% Wallet Credit</div>
                    <div className="text-[11px] text-slate-300">₹100 fee returned instantly for sports gear savings</div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link to="/membership" className="btn-cyan inline-flex">
                    <CreditCard className="w-3.5 h-3.5 text-slate-950" />
                    <span>Claim ₹100 Athlete Pass</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </Link>
                  <Link to="/dormitory" className="btn-outline">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>View Accommodations</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Pass Mockup Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-3xl p-7 bg-gradient-to-br from-slate-950/95 via-[#061224]/90 to-slate-950/95 border border-cyan-500/40 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Pass Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <img src="/assets/logo_emblem.png" alt="Bigchamp" className="h-7 w-auto" />
                      <span className="font-syne font-black italic text-sm text-white tracking-wider">BIGCHAMP</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                      Student Pass
                    </span>
                  </div>

                  {/* Pass Chip & Hologram graphic */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-9 rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 shadow-md flex items-center justify-center border border-white/40">
                      <div className="w-9 h-6 border border-slate-400/50 rounded-sm grid grid-cols-2 gap-0.5 opacity-80" />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-slate-400 tracking-widest">Valid Thru</div>
                      <div className="font-mono text-xs text-cyan-300 font-bold">11 MONTHS</div>
                    </div>
                  </div>

                  {/* QR Graphic & Price */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Official Price</div>
                      <div className="font-syne font-black text-2xl text-cyan-300">₹100</div>
                    </div>
                    <div className="w-14 h-14 bg-white/10 rounded-xl border border-white/20 p-1 flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center text-cyan-400 font-mono text-[9px] font-black text-center leading-tight">
                        QR PASS
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-300">
                    <span>Includes ₹100 Cashback</span>
                    <span className="text-emerald-400 font-bold">● Active Digital ID</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 6: ACT 2 - MATCH PERFORMANCE
            ===================================================================== */}
        <section
          id="competitors"
          data-i="3"
          className="min-h-screen flex flex-col justify-center px-4 py-20 pointer-events-auto relative"
        >
          <span id="khiladi" className="absolute -top-24 pointer-events-none" />

          <div className="max-w-6xl mx-auto w-full rv section-backplate">
            {/* Header */}
            <div className="max-w-2xl mb-8">
              <span className="k-tag text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Phase II · The Competitive Arena</span>
              </span>

              <h2 className="heading-section mb-2">
                MATCH PLAY.<br />
                <span className="g-chrome">ZERO COMPROMISE.</span>
              </h2>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
                When stepping into the competitive arena, your equipment must deliver uncompromising precision. Tournament-certified cricket willow, match balls, and performance apparel tested by top coaches.
              </p>
            </div>

            {/* Badges Strip */}
            <div className="flex flex-wrap gap-2.5 mb-8">
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>Match-Grade Certified</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Sports Physio Approved</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>7-Day Hassle-Free Exchange</span>
              </span>
            </div>

            {/* Product Showcase Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {showcaseProducts.map((p) => (
                <div
                  key={p.id}
                  className="glass-tile p-4 flex flex-col justify-between group border-white/10 hover:border-cyan-400/40"
                >
                  <div>
                    {/* Image Box */}
                    <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-900/70 mb-3.5 relative flex items-center justify-center p-2 border border-white/5">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/logo_clean.png';
                        }}
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                        {p.badge}
                      </span>
                    </div>

                    <h4 className="font-syne font-bold text-sm text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-1 mb-3">
                      {p.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-syne font-bold text-cyan-300 text-base">{p.price}</span>
                      <span className="text-[10px] text-slate-400 line-through ml-1.5">{p.mrp}</span>
                    </div>
                    <Link
                      to={p.link}
                      className="p-1.5 rounded-full bg-cyan-500/15 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 transition-colors"
                      title="View Product"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/store" className="btn-cyan inline-flex">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
                <span>Explore Sports Gear</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </Link>
              <Link to="/physio" className="btn-outline">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Book Sports Physio</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 7: ACT 3 - ARMED FORCES HONOR
            ===================================================================== */}
        <section
          id="defense"
          data-i="4"
          className="min-h-screen flex flex-col justify-center items-center px-4 py-20 pointer-events-auto relative"
        >
          <span id="jawan" className="absolute -top-24 pointer-events-none" />

          <div className="max-w-4xl mx-auto w-full text-center rv section-backplate">
            <span className="k-tag text-emerald-400 mx-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Phase III · Armed Forces Honor</span>
            </span>

            <h2 className="heading-section mb-3">
              ARMED FORCES.<br />
              <span className="g-defense">UNYIELDING VALOR.</span>
            </h2>

            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8 drop-shadow-md">
              A dedicated salute to the guardians of our nation. Exclusive privileges on tactical training equipment, clean transit stays during duty transfers, and priority athletic support.
            </p>

            {/* Highlight: 10% Extra Defense Privilege */}
            <div className="max-w-xl mx-auto p-5 rounded-2xl glass-tile border-emerald-500/40 mb-8 shadow-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-5 h-5 text-emerald-400" />
                <span className="font-syne font-black text-2xl sm:text-3xl text-emerald-300">
                  10% Exclusive Defense Privilege
                </span>
              </div>
              <p className="text-xs text-slate-200 max-w-md mx-auto">
                Applied automatically across all tactical endurance gear, verified transit dormitory stays, and family sports wellness orders.
              </p>
            </div>

            {/* 3 Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="p-4 rounded-xl glass-tile border-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="font-syne font-bold text-sm text-white mb-1">Tactical Training Gear</h4>
                <p className="text-xs text-slate-300">
                  High-durability endurance footwear, weighted vests, tactical hydration packs, and heavy-duty grip gear.
                </p>
              </div>

              <div className="p-4 rounded-xl glass-tile border-emerald-500/20">
                <Building2 className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="font-syne font-bold text-sm text-white mb-1">Transit Dormitory Stays</h4>
                <p className="text-xs text-slate-300">
                  Secure, verified dormitory accommodations located near key transit junctions and defense bases during transfers.
                </p>
              </div>

              <div className="p-4 rounded-xl glass-tile border-emerald-500/20">
                <Phone className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="font-syne font-bold text-sm text-white mb-1">24x7 Priority Support</h4>
                <p className="text-xs text-slate-300">
                  Dedicated customer priority assistance line for armed forces personnel, veterans, and military academy recruits.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/store" className="btn-cyan inline-flex">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                <span>Shop Defense Gear</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </Link>
              <Link to="/dormitory" className="btn-outline">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transit Hostels</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 8: ECOSYSTEM (BENTO GRID)
            ===================================================================== */}
        <section
          id="ecosystem"
          data-i="5"
          className="min-h-screen flex flex-col justify-center px-4 py-20 pointer-events-auto relative"
        >
          <div className="max-w-6xl mx-auto w-full rv section-backplate">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="k-tag text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Comprehensive Athletic Architecture</span>
              </span>

              <h2 className="heading-section mb-2">
                THE BIGCHAMP <span className="g-cyan">ECOSYSTEM</span>
              </h2>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
                Everything an athlete requires to train, compete, recover, and travel — unified under one trusted roof.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Pillar 1: Large Featured Card */}
              <div className="glass-tile lg:col-span-2 p-6 sm:p-7 flex flex-col justify-between group border-cyan-500/25">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🛒
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                      Flagship Store
                    </span>
                  </div>
                  <h3 className="font-syne font-bold text-xl sm:text-2xl text-white mb-2 tracking-tight">
                    Sports Gear &amp; Equipment
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                    Handcrafted English Willow cricket bats, FIFA-grade footballs, athletic sprint spikes, badminton rackets, and high-compression wear. 100% authentic, directly from certified manufacturers with Free Shipping above ₹500.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">7-Day Hassle-Free Exchange</span>
                  <Link
                    to="/store"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                  >
                    <span>Explore Store &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Pillar 2: Athlete Dormitories */}
              <div className="glass-tile p-6 flex flex-col justify-between group border-sky-500/25">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🏨
                    </div>
                    <span className="px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                      Accommodations
                    </span>
                  </div>
                  <h3 className="font-syne font-bold text-lg sm:text-xl text-white mb-2 tracking-tight">
                    Athlete Accommodations
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    Affordable, secure hostel stays located within minutes of major sports complexes, stadiums, and SAI selection trials across India.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Near Selection Arenas</span>
                  <Link
                    to="/dormitory"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                  >
                    <span>View Hostels &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Pillar 3: Sports Physio Clinics */}
              <div className="glass-tile p-6 flex flex-col justify-between group border-purple-500/25">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      💪
                    </div>
                    <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                      Recovery
                    </span>
                  </div>
                  <h3 className="font-syne font-bold text-lg sm:text-xl text-white mb-2 tracking-tight">
                    Sports Physio Clinics
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    Post-match recovery sessions, biomechanical posture assessments, and injury prevention programs with certified sports specialists.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Certified Specialists</span>
                  <Link
                    to="/physio"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                  >
                    <span>Book Physio &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Pillar 4: Cookey Nutrition */}
              <div className="glass-tile p-6 flex flex-col justify-between group border-emerald-500/25">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🍪
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      Nutrition
                    </span>
                  </div>
                  <h3 className="font-syne font-bold text-lg sm:text-xl text-white mb-2 tracking-tight">
                    Cookey Sports Nutrition
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    Coach-approved high-protein athlete diets, custom macronutrient tracking, and weekly gear draws for sports kits and equipment.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Diet &amp; Gear Drops</span>
                  <Link
                    to="/cookey"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                  >
                    <span>Explore Cookey &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Pillar 5: VIP Membership Pass */}
              <div className="glass-tile p-6 md:col-span-2 lg:col-span-1 flex flex-col justify-between group border-cyan-500/35 bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-slate-950/90">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🎖️
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                      All-Access
                    </span>
                  </div>
                  <h3 className="font-syne font-bold text-lg sm:text-xl text-white mb-2 tracking-tight">
                    VIP Membership Pass (₹100)
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    Single digital identity pass unlocking 11 months validity, instant joining wallet cashback, 15% store discounts, and dormitory privileges.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-cyan-300 font-bold">₹100 / 11 Months</span>
                  <Link
                    to="/membership"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                  >
                    <span>Get Pass &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 9: MEMBERSHIP SPOTLIGHT
            ===================================================================== */}
        <section
          id="membership"
          data-i="6"
          className="min-h-screen flex flex-col justify-center px-4 py-20 pointer-events-auto relative"
        >
          <div className="max-w-5xl mx-auto w-full rv section-backplate">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: 3 Steps & Benefits */}
              <div className="lg:col-span-7">
                <span className="k-tag text-cyan-400">
                  <Star className="w-3.5 h-3.5 text-cyan-400" />
                  <span>The All-Access Key</span>
                </span>

                <h2 className="heading-section mb-3">
                  BIGCHAMP VIP <span className="g-cyan">ATHLETE PASS</span>
                </h2>

                <p className="text-slate-200 text-sm leading-relaxed mb-6 drop-shadow-md">
                  A comprehensive ₹100 annual membership unlocking privileged rates across the entire BIGCHAMP sports network for 11 full months.
                </p>

                {/* 3 Simple Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3.5 rounded-xl glass-tile border-white/10">
                    <div className="font-mono text-cyan-400 font-bold text-xs mb-1">01. ENTER MOBILE</div>
                    <div className="text-[11px] text-slate-300">10-second instant sign-up</div>
                  </div>
                  <div className="p-3.5 rounded-xl glass-tile border-white/10">
                    <div className="font-mono text-cyan-400 font-bold text-xs mb-1">02. RECEIVE PASS</div>
                    <div className="text-[11px] text-slate-300">Instant dynamic QR card</div>
                  </div>
                  <div className="p-3.5 rounded-xl glass-tile border-white/10">
                    <div className="font-mono text-cyan-400 font-bold text-xs mb-1">03. ENJOY PRIVILEGES</div>
                    <div className="text-[11px] text-slate-300">Store, dorms &amp; physio</div>
                  </div>
                </div>

                {/* Benefits Checklist */}
                <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Extra 15% storewide discount on all sports equipment and apparel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Up to 20% savings on verified athlete dormitory reservations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Instant ₹100 wallet cashback credited directly upon activation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Priority access to limited edition equipment drops and athlete draws</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Free nationwide standard delivery on all orders above ₹500</span>
                  </li>
                </ul>

                <Link to="/membership" className="btn-cyan inline-flex text-xs sm:text-sm py-3 px-8">
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>Get VIP Pass Now (₹100)</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>
              </div>

              {/* Right Column: Glowing VIP Card Spotlight */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-3xl p-7 bg-gradient-to-br from-cyan-950/60 via-[#071328] to-slate-950 border-2 border-cyan-400/80 shadow-[0_0_50px_rgba(0,240,255,0.25)] relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2.5">
                      <img src="/assets/logo_emblem.png" alt="Bigchamp" className="h-8 w-auto drop-shadow-md" />
                      <span className="font-syne font-black italic text-sm text-white tracking-wider">BIGCHAMP VIP</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      ₹100 PASS
                    </span>
                  </div>

                  <div className="mb-8">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80 mb-1">
                      Athlete Privilege Identity
                    </div>
                    <div className="font-syne font-black text-2xl text-white tracking-wide">
                      ALL-ACCESS PASS
                    </div>
                    <div className="text-xs text-slate-300 mt-1">11 Months Nationwide Validity</div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-cyan-500/25">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Wallet Bonus</div>
                      <div className="font-syne font-bold text-cyan-300 text-lg">₹100 Cashback</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold">
                      VERIFIED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 10: FAQ ACCORDION
            ===================================================================== */}
        <section
          id="faq"
          data-i="7"
          className="min-h-[75vh] flex flex-col justify-center px-4 py-20 pointer-events-auto relative"
        >
          <div className="max-w-4xl mx-auto w-full rv section-backplate">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="k-tag text-cyan-400 mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clear &amp; Direct Answers</span>
              </span>
              <h2 className="heading-section mb-2">
                FREQUENTLY ASKED <span className="g-cyan">QUESTIONS</span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Essential information regarding pass activation, defense privileges, hostel reservations, and equipment guarantees.
              </p>
            </div>

            {/* Accordion Questions */}
            <div className="space-y-3">
              {[
                {
                  q: 'How does the BIGCHAMP ₹100 Digital Athlete Pass work and what is its validity?',
                  a: 'The Athlete Pass is an annual membership valid for 11 months across India for just ₹100. Upon activation, ₹100 is credited immediately back to your wallet as cashback, unlocking an additional 15% storewide discount on athletic equipment and preferential rates on partner hostels.',
                },
                {
                  q: 'How do Indian Armed Forces and defense personnel activate the 10% Defense Privilege?',
                  a: 'Defense personnel can select the Defense Privilege option during checkout or verify credentials via WhatsApp customer support. An additional 10% discount is applied instantly to tactical equipment, endurance gear, and transit dormitory bookings without administrative delay.',
                },
                {
                  q: 'Where are the athlete dormitories located and how can I book a bed?',
                  a: 'Our verified dormitories are situated in primary sports hubs near SAI training grounds, state academies, and major stadiums hosting national trials. You can check availability, view verified room photos, and book stays directly from the Hostels section.',
                },
                {
                  q: 'How can I schedule an appointment with BIGCHAMP Sports Physio clinics?',
                  a: 'Navigate to our Physio section to select your athletic discipline, injury rehabilitation requirement, or recovery goals. We provide both virtual telehealth consultations and in-person assessments with licensed sports physiotherapists.',
                },
                {
                  q: 'What are the shipping timelines and the 7-day exchange guarantee?',
                  a: 'All merchandise orders above ₹500 qualify for free nationwide shipping, with standard metro orders arriving in 2-4 business days. We provide a 7-day hassle-free replacement on all equipment if sizes, weights, or performance specifications do not match your requirements.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl glass-tile border-white/10 overflow-hidden transition-colors hover:border-cyan-500/50"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-syne font-bold text-sm sm:text-base text-white cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span className="p-1 rounded-full bg-white/10 text-cyan-400 shrink-0">
                      {openFaq === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 11: FINAL FULL-WIDTH CTA
            ===================================================================== */}
        <section
          id="join"
          data-i="8"
          className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4 py-20 pointer-events-auto relative"
        >
          <div className="max-w-4xl mx-auto w-full glass-tile p-8 sm:p-14 text-center rv border-cyan-500/35 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Join Over 50,000+ Athletes, Students &amp; Warriors</span>
            </div>

            <h2 className="heading-section mb-3">
              BEGIN YOUR <span className="g-cyan">CHAMPIONSHIP JOURNEY.</span>
            </h2>

            <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8 drop-shadow-md">
              Enter your WhatsApp number or email address below — our athletic advisory team will connect with you within 24 hours to help elevate your game.
            </p>

            {/* Interactive Lead Generation Form */}
            <form
              onSubmit={handleLeadSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto mb-5"
            >
              <input
                type="text"
                placeholder="WhatsApp Number or Email Address"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                className="w-full px-5 py-3.5 rounded-full bg-[#060b17]/90 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all text-xs backdrop-blur-xl"
              />
              <button
                type="submit"
                className="btn-cyan inline-flex w-full sm:w-auto shrink-0 py-3.5 px-8"
              >
                {isSubmitted ? '✓ Welcome!' : 'Join Now'}
              </button>
            </form>

            <p className="text-[11px] text-slate-400 mb-6">
              Response within 24 hours. Zero spam guarantee.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-5 text-xs text-slate-300 border-t border-white/10">
              <Link to="/store" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-bold">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sports Store</span>
              </Link>
              <span className="opacity-30">&bull;</span>
              <Link to="/membership" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-bold">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>₹100 Pass</span>
              </Link>
              <span className="opacity-30">&bull;</span>
              <Link to="/register" className="hover:text-white transition-colors">
                Register Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          SECTION 12: CINEMATIC MODERN FOOTER
          ========================================================================= */}
      <footer className="relative z-20 py-12 px-6 text-slate-400 text-xs border-t border-white/10 bg-[#02050b]/95 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Brand & Promise */}
          <div className="text-left">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/assets/logo_emblem.png"
                alt="Bigchamp Winged Crest"
                className="h-8 w-auto filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
              />
              <span className="font-syne font-black italic text-xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                BIGCHAMP
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4 max-w-sm">
              Born to Win. India's premier integrated athletic, student, and defense ecosystem. Certified tournament equipment, athlete dormitories, and specialized sports physiotherapy.
            </p>
            <div className="text-[11px] text-slate-400">
              Support Helpline: <a href={`mailto:${siteContact.email}`} className="text-cyan-400 hover:underline">{siteContact.email}</a>
            </div>
          </div>

          {/* Column 2: Ecosystem & Services */}
          <div className="text-left">
            <h4 className="font-syne font-bold text-white uppercase tracking-wider text-xs mb-3">
              The Ecosystem
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/store" className="hover:text-cyan-400 transition-colors font-medium">
                  Official Sports Gear Store
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-cyan-400 transition-colors font-medium">
                  ₹100 VIP Athlete Pass
                </Link>
              </li>
              <li>
                <Link to="/dormitory" className="hover:text-cyan-400 transition-colors">
                  Athlete Dormitories &amp; Hostels
                </Link>
              </li>
              <li>
                <Link to="/physio" className="hover:text-cyan-400 transition-colors">
                  Sports Physio Rehabilitation
                </Link>
              </li>
              <li>
                <Link to="/cookey" className="hover:text-cyan-400 transition-colors">
                  Cookey Nutrition &amp; Draws
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="text-left">
            <h4 className="font-syne font-bold text-white uppercase tracking-wider text-xs mb-3">
              Trust &amp; Governance
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Customer Care
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white transition-colors">
                  Free Shipping Above ₹500 Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors">
                  7-Day Hassle-Free Exchange
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>&copy; {new Date().getFullYear()} BIGCHAMP Sports Private Limited. All Rights Reserved.</div>
          <div className="text-slate-400">
            Engineered with Precision for Athletes Across India
          </div>
        </div>
      </footer>
    </div>
  );
}
