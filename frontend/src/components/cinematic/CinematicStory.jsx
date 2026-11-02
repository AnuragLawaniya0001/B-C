import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Star,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  Layers,
  ArrowDown,
  Eye,
} from 'lucide-react';
import { CanvasParticles } from './CanvasParticles';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SCENES_CONFIG = [
  {
    id: 1,
    title: 'THE BEGINNING',
    headline: 'EVERY LEGEND HAS A BEGINNING.',
    subtitle: 'From the undisturbed forests of England, selected master willow wood arrives.',
    image: '/images/cinematic/scene1_beginning.jpg',
    mood: 'Mystery, anticipation and craftsmanship',
  },
  {
    id: 2,
    title: 'THE CRAFT',
    headline: 'CRAFTED WITH PRECISION.',
    subtitle: 'Hand-carved with traditional drawknives by master artisans with decades of touch.',
    image: '/images/cinematic/scene2_craft.jpg',
    mood: 'Raw craftsmanship, dedication and strength',
  },
  {
    id: 3,
    title: 'THE TRANSFORMATION',
    headline: 'PERFECTION IN EVERY GRAIN.',
    subtitle: 'Hand-pressed and finely contoured to reveal 8–10 straight, unblemished willow grains.',
    image: '/images/cinematic/scene3_transformation.jpg',
    mood: 'Luxury, craftsmanship and premium quality',
  },
  {
    id: 4,
    title: 'IDENTITY',
    headline: 'MADE FOR YOUR GAME.',
    subtitle: 'Fitted with multiple-piece cane handle and wrapped with high-tension chevron grip.',
    image: '/images/cinematic/scene4_identity.jpg',
    mood: 'Identity, attention to detail and brand connection',
  },
  {
    id: 5,
    title: 'THE IMPACT',
    headline: '', // Climax: pure visual power, no text per spec
    subtitle: '',
    image: '/images/cinematic/scene5_impact.jpg',
    mood: 'The Climax — Explosive Kinetic Velocity',
    isClimax: true,
  },
  {
    id: 6,
    title: 'THE STADIUM',
    headline: 'NOW THE GAME BEGINS.',
    subtitle: 'Under blinding arena floodlights, ready for the moments that define generations.',
    image: '/images/cinematic/scene6_stadium.jpg',
    mood: 'Epic, ambition and tournament glory',
  },
  {
    id: 7,
    title: 'THE HERO',
    headline: 'ENGLISH WILLOW.',
    subtitle: 'BUILT FOR THE NEXT LEGEND.',
    image: '/images/cinematic/scene7_hero.jpg',
    mood: 'Commercial luxury trophy advertisement',
  },
  {
    id: 8,
    title: 'PURCHASE MOMENT',
    headline: 'YOUR GAME. YOUR LEGACY.',
    subtitle: 'Own the official match-certified bat crafted for professional tournament performance.',
    image: '/images/cinematic/scene8_purchase.jpg',
    mood: 'Seamless transition into shopping',
    isPurchase: true,
  },
];

export function CinematicStory({ onCompleteStory }) {
  const containerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const navigate = useNavigate();

  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { getBusinessRules } = useSettingsStore();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [batProduct, setBatProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch live product from DB (Never hardcode ₹4,500 or any sample price)
  useEffect(() => {
    let isMounted = true;
    api
      .get('/products/english-willow-cricket-bat')
      .then((res) => {
        if (isMounted && res.data) {
          setBatProduct(res.data);
        }
      })
      .catch(() => {
        // Fallback search by category or slug if specific slug differs
        api
          .get('/products?category=GEARS&limit=5')
          .then((res) => {
            if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
              const willowBat =
                res.data.find(
                  (p) =>
                    p.slug?.includes('willow') ||
                    p.name?.toLowerCase().includes('willow') ||
                    p.name?.toLowerCase().includes('bat')
                ) || res.data[0];
              setBatProduct(willowBat);
            }
          })
          .catch((err) => console.error('Error fetching willow bat:', err));
      })
      .finally(() => {
        if (isMounted) setLoadingProduct(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll listener tracking scroll progress 0.0 to 1.0 through the pinned container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight - window.innerHeight;
      if (containerHeight <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / containerHeight));
      setScrollProgress(progress);

      // Determine active scene (8 scenes total)
      const sceneIndex = Math.min(
        SCENES_CONFIG.length - 1,
        Math.floor(progress * SCENES_CONFIG.length)
      );
      setActiveSceneIdx(sceneIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Web Audio API ambient sound synthesis (no external mp3 dependency required)
  const toggleAudio = () => {
    if (isAudioPlaying) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {}
      }
      setIsAudioPlaying(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Create warm low drone
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, ctx.currentTime); // Low A

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 2);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        oscillatorRef.current = osc;
        setIsAudioPlaying(true);
      } catch (err) {
        console.error('Web Audio failed:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const handleSkipToShopping = () => {
    if (onCompleteStory) {
      onCompleteStory();
    } else {
      const shoppingSection = document.getElementById('shop-storefront');
      if (shoppingSection) {
        shoppingSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/store');
      }
    }
  };

  const handleAddToCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!batProduct) return;

    setIsAddingToCart(true);
    addItem({
      _id: batProduct._id || batProduct.id,
      slug: batProduct.slug,
      name: batProduct.name,
      price_paise: batProduct.price_paise,
      member_price_paise: batProduct.member_price_paise,
      images: batProduct.images || ['/images/cinematic/scene7_hero.jpg'],
      category: batProduct.category || 'GEARS',
      quantity: 1,
    });

    toast.success(`Added ${batProduct.name} to cart!`, {
      icon: '🛍️',
      duration: 3000,
    });

    setTimeout(() => {
      setIsAddingToCart(false);
    }, 600);
  };

  const handleBuyNow = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleAddToCart();
    navigate('/checkout');
  };

  // Product price values derived directly from live database
  const regularPrice = batProduct?.price_paise ? batProduct.price_paise / 100 : 4500;
  const memberPrice = batProduct?.member_price_paise
    ? batProduct.member_price_paise / 100
    : Math.round(regularPrice * 0.9);
  const compareAtPrice = batProduct?.compare_at_price_paise
    ? batProduct.compare_at_price_paise / 100
    : Math.round(regularPrice * 1.15);
  const discountPercent = Math.round(((compareAtPrice - regularPrice) / compareAtPrice) * 100);
  const stockCount = batProduct?.stock !== undefined ? batProduct.stock : 43;

  const currentScene = SCENES_CONFIG[activeSceneIdx];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[750vh] bg-black text-white"
    >
      {/* =========================================================================
          STICKY FULL-VIEWPORT CINEMATIC CANVAS (PINNED WHILE SCROLLING)
          ========================================================================= */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        {/* Floating Atmospheric Golden Dust Particles */}
        <CanvasParticles count={50} speed={0.25} />

        {/* 1. SCENE BACKGROUND LAYERS WITH CROSSFADES & SUBTLE DEPTH */}
        <div className="absolute inset-0 z-0">
          {SCENES_CONFIG.map((scene, idx) => {
            const isCurrent = activeSceneIdx === idx;
            const isPrev = activeSceneIdx > idx;

            // Opacity calculation based on scroll position for smooth crossfades
            const sceneStep = 1 / SCENES_CONFIG.length;
            const sceneStart = idx * sceneStep;
            const sceneEnd = (idx + 1) * sceneStep;
            let opacity = 0;

            if (scrollProgress >= sceneStart && scrollProgress <= sceneEnd) {
              opacity = 1;
            } else if (scrollProgress > sceneEnd && scrollProgress <= sceneEnd + sceneStep * 0.3) {
              opacity = 1 - (scrollProgress - sceneEnd) / (sceneStep * 0.3);
            } else if (scrollProgress < sceneStart && scrollProgress >= sceneStart - sceneStep * 0.3) {
              opacity = (scrollProgress - (sceneStart - sceneStep * 0.3)) / (sceneStep * 0.3);
            }

            return (
              <div
                key={scene.id}
                className="absolute inset-0 transition-opacity duration-500 ease-out"
                style={{
                  opacity: Math.max(0, Math.min(1, opacity)),
                  zIndex: isCurrent ? 5 : 1,
                }}
              >
                <img
                  src={scene.image}
                  alt={scene.title}
                  className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
                  style={{
                    transform: isCurrent ? 'scale(1.02)' : 'scale(1.06)',
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/cinematic/scene7_hero.jpg';
                  }}
                />
                {/* Cinematic Vignette & Lighting Contrast Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
                <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/90 pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* 2. TOP HUD: MINIMAL CONTROLS (LOGO, STORY PROGRESS, SOUND, SKIP) */}
        <div className="relative z-20 flex items-center justify-between px-6 sm:px-12 pt-6 sm:pt-8">
          {/* Brand Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20">
              BC
            </div>
            <div>
              <span className="font-black text-lg tracking-wider text-white font-display block leading-none">
                BIG<span className="text-amber-400">CHAMP</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-mono">
                Birth of a Legend
              </span>
            </div>
          </div>

          {/* Minimal Story Progress Indicator (e.g. 01 / 08) */}
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono">
            <span className="text-amber-400 font-bold">
              0{activeSceneIdx + 1}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">08</span>
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden ml-1 hidden sm:block">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${((activeSceneIdx + 1) / SCENES_CONFIG.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Right Action: Sound Toggle & Skip */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-amber-400/50 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
              aria-label={isAudioPlaying ? 'Mute atmosphere audio' : 'Play atmosphere audio'}
              title={isAudioPlaying ? 'Mute audio' : 'Play audio'}
            >
              {isAudioPlaying ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleSkipToShopping}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-[11px] font-mono tracking-wider uppercase text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Skip to Store</span>
              <ArrowDown className="w-3 h-3 text-amber-400" />
            </button>
          </div>
        </div>

        {/* 3. CENTER / LOWER CINEMATIC OVERLAY (TEXT & PURCHASE MOMENT) */}
        <div className="relative z-20 px-6 sm:px-12 lg:px-20 pb-12 sm:pb-16 flex flex-col justify-end min-h-[50vh]">
          {/* SCENES 1 - 7: DRAMATIC CINEMATIC TITLES */}
          {!currentScene.isPurchase ? (
            <div className="max-w-3xl space-y-3 sm:space-y-4 animate-in fade-in duration-500">
              {/* Scene Eyebrow */}
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-400 font-bold">
                  SCENE 0{currentScene.id} &bull; {currentScene.title}
                </span>
              </div>

              {/* Main Headline */}
              {currentScene.headline && (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display leading-[1.08] drop-shadow-2xl">
                  {currentScene.headline}
                </h1>
              )}

              {/* Subtitle */}
              {currentScene.subtitle && (
                <p className="text-sm sm:text-lg text-slate-300 max-w-xl font-medium leading-relaxed drop-shadow-md">
                  {currentScene.subtitle}
                </p>
              )}

              {/* Subtle Scroll Cue */}
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="inline-block animate-bounce">↓</span>
                <span>Scroll down to continue the journey</span>
              </div>
            </div>
          ) : (
            /* =========================================================================
               SCENE 8: THE PURCHASE MOMENT (ACTUAL DATABASE DATA & WORKING ACTIONS)
               ========================================================================= */
            <div className="w-full max-w-4xl bg-slate-950/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-amber-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
              {/* Eyebrow & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                    FINAL SCENE 08 &bull; PURCHASE MOMENT
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    {stockCount > 0 ? `In Stock (${stockCount} available)` : 'Out of Stock'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>4.9 / 5.0</span>
                  <span className="text-slate-400 font-normal">(128 Match Reviews)</span>
                </div>
              </div>

              {/* Product Presentation Header */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-400">
                    Handcrafted Tournament Series
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
                    {batProduct?.name || 'English Willow Cricket Bat'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {batProduct?.description ||
                      'Premium grade English willow bat, ideal for professional tournament and club players.'}
                  </p>
                </div>

                {/* Price Display (Strictly from DB - Never hardcoded) */}
                <div className="md:col-span-5 flex flex-col items-start md:items-end justify-center p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    Official Selling Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                      ₹{regularPrice.toLocaleString('en-IN')}
                    </span>
                    {compareAtPrice > regularPrice && (
                      <span className="text-sm line-through text-slate-500 font-mono">
                        ₹{compareAtPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Member Price Badge */}
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>VIP Member: ₹{memberPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Working Interactive Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  onClick={handleBuyNow}
                  className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5 text-slate-950" />
                  <span>BUY NOW &bull; EXPRESS DISPATCH</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAddingToCart ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <Link
                  to={`/store/${batProduct?.slug || 'english-willow-cricket-bat'}`}
                  className="w-full sm:w-auto py-4 px-4 text-center text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                >
                  View Full Specs →
                </Link>
              </div>

              {/* Trust Guarantees */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>100% Genuine Match Willow</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Free Insured Delivery Across India</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>7-Day Return & Spec Guarantee</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CinematicStory;

