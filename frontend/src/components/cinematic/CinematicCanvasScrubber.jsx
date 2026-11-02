import React, { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TOTAL_FRAMES = 240;

// Scene boundaries mapped to the master video cuts
const SCENES = [
  { id: 1, title: 'THE ORIGIN', headline: 'EVERY LEGEND HAS A BEGINNING.', sub: 'Raw, hand-selected cleft of English Willow bathed in single golden light.', start: 0, end: 22, keyframe: '/media/cinematic/keyframes/scene_1.jpg' },
  { id: 2, title: 'THE CRAFTSMANSHIP', headline: 'CRAFTED WITH PRECISION.', sub: 'Drawknives and chisels carve razor-thin willow ribbons in slow-motion artisan dedication.', start: 23, end: 46, keyframe: '/media/cinematic/keyframes/scene_2.jpg' },
  { id: 3, title: 'THE TRANSFORMATION', headline: 'PERFECTION IN EVERY GRAIN.', sub: 'Polished blade face reveals straight, flawless natural willow growth grains.', start: 47, end: 70, keyframe: '/media/cinematic/keyframes/scene_3.jpg' },
  { id: 4, title: 'THE IDENTITY', headline: 'MADE FOR YOUR GAME.', sub: 'Multi-piece cane handle with premium chevron grip and metallic gold BIGCHAMP branding.', start: 71, end: 95, keyframe: '/media/cinematic/keyframes/scene_4.jpg' },
  { id: 5, title: 'THE IMPACT', headline: '', sub: '', isClimax: true, start: 96, end: 122, keyframe: '/media/cinematic/keyframes/scene_5.jpg' },
  { id: 6, title: 'THE STADIUM', headline: 'NOW THE GAME BEGINS.', sub: 'Blinding arena floodlights power up as the green championship pitch awaits.', start: 123, end: 151, keyframe: '/media/cinematic/keyframes/scene_6.jpg' },
  { id: 7, title: 'THE HERO', headline: 'ENGLISH WILLOW.', sub: 'BUILT FOR THE NEXT LEGEND.', start: 152, end: 200, keyframe: '/media/cinematic/keyframes/scene_7.jpg' },
  { id: 8, title: 'PURCHASE MOMENT', headline: 'YOUR GAME. YOUR LEGACY.', sub: 'Own the official match-certified bat crafted for professional tournament performance.', start: 201, end: 239, isPurchase: true, keyframe: '/media/cinematic/keyframes/scene_8.jpg' },
];

export function CinematicCanvasScrubber({ onSkip, product, onSceneChange, onStoryActiveChange }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesCanvasRef = useRef(null);
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Frame Cache & Scrubber State
  const framesCacheRef = useRef(new Map());
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const isMobileRef = useRef(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // ── 1. Progressive Intelligent Frame Preloader ──
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    isMobileRef.current = isMobile;
    const folder = isMobile ? '/media/cinematic/mobile' : '/media/cinematic/desktop';

    // Step A: Priority 1 — Load 8 scene keyframes first
    SCENES.forEach((sc) => {
      const idx = sc.start;
      const img = new Image();
      img.src = `${folder}/frame_${String(idx).padStart(3, '0')}.webp`;
      img.onload = () => {
        framesCacheRef.current.set(idx, img);
        setLoadedCount((c) => c + 1);
        if (idx === 0) setIsReady(true);
      };
    });

    // Step B: Progressive Background Loader — Fetch all 240 frames in non-blocking batches
    let currentIdx = 0;
    const batchSize = 10;
    let cancelled = false;

    const loadNextBatch = () => {
      if (cancelled || currentIdx >= TOTAL_FRAMES) return;
      const promises = [];
      const end = Math.min(currentIdx + batchSize, TOTAL_FRAMES);

      for (let i = currentIdx; i < end; i++) {
        if (!framesCacheRef.current.has(i)) {
          const p = new Promise((resolve) => {
            const img = new Image();
            img.src = `${folder}/frame_${String(i).padStart(3, '0')}.webp`;
            img.onload = () => {
              framesCacheRef.current.set(i, img);
              setLoadedCount((c) => c + 1);
              resolve();
            };
            img.onerror = () => {
              resolve();
            };
          });
          promises.push(p);
        }
      }

      currentIdx = end;
      Promise.all(promises).then(() => {
        if (!cancelled && currentIdx < TOTAL_FRAMES) {
          setTimeout(loadNextBatch, 25);
        }
      });
    };

    loadNextBatch();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── 2. High-Precision Scroll Tracker ──
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      scrollProgressRef.current = progress;
      setScrollProgress(progress);

      // Target frame 0 to 239
      const targetFrame = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));
      targetFrameRef.current = targetFrame;

      // Determine active scene
      const foundIdx = SCENES.findIndex((s) => targetFrame >= s.start && targetFrame <= s.end);
      if (foundIdx !== -1) {
        setActiveSceneIdx(foundIdx);
        if (onSceneChange) {
          onSceneChange({ id: SCENES[foundIdx].id, title: SCENES[foundIdx].title });
        }
      }

      if (onStoryActiveChange) {
        onStoryActiveChange(progress < 0.98);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onSceneChange, onStoryActiveChange]);

  // ── 3. Interactive 3D Parallax Tilt ──
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── 4. Main 60-120 FPS RAF Canvas Render Loop ──
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Particle Cloud Setup
    const pCanvas = particlesCanvasRef.current;
    const pCtx = pCanvas ? pCanvas.getContext('2d') : null;
    const particleCount = isMobileRef.current ? 40 : 80;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (canvas.width || 1280),
      y: Math.random() * (canvas.height || 720),
      size: Math.random() * 2 + 0.8,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.5 - 0.2,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const render = () => {
      animId = requestAnimationFrame(render);

      // Smooth frame interpolation (Lerp for cinematic film feel)
      const target = targetFrameRef.current;
      currentFrameRef.current += (target - currentFrameRef.current) * 0.22;
      const frameToDraw = Math.round(currentFrameRef.current);

      // Smooth mouse tilt
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      // Handle Canvas Sizing
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        if (pCanvas) {
          pCanvas.width = displayWidth * dpr;
          pCanvas.height = displayHeight * dpr;
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Fetch Frame from Cache with Intelligent Fallback (Zero Blank Space)
      let img = framesCacheRef.current.get(frameToDraw);
      if (!img) {
        // Find nearest available cached frame
        for (let offset = 1; offset < 20; offset++) {
          if (framesCacheRef.current.has(frameToDraw - offset)) {
            img = framesCacheRef.current.get(frameToDraw - offset);
            break;
          } else if (framesCacheRef.current.has(frameToDraw + offset)) {
            img = framesCacheRef.current.get(frameToDraw + offset);
            break;
          }
        }
      }

      if (img && img.complete && img.naturalWidth > 0) {
        // Draw frame with object-fit: cover aspect calculation
        const cw = displayWidth;
        const ch = displayHeight;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const imgRatio = iw / ih;
        const canvasRatio = cw / ch;

        let renderW, renderH, offsetX, offsetY;
        if (canvasRatio > imgRatio) {
          renderW = cw;
          renderH = cw / imgRatio;
          offsetX = 0;
          offsetY = (ch - renderH) / 2;
        } else {
          renderH = ch;
          renderW = ch * imgRatio;
          offsetX = (cw - renderW) / 2;
          offsetY = 0;
        }

        // Apply subtle 3D parallax drift to footage based on mouse cursor
        const parallaxX = mouseRef.current.x * 12;
        const parallaxY = mouseRef.current.y * 8;

        ctx.drawImage(img, offsetX + parallaxX, offsetY + parallaxY, renderW, renderH);

        // Volumetric Golden Spotlight Vignette & Cinematic Tone Mapping
        const grad = ctx.createRadialGradient(
          cw / 2, ch / 2, Math.min(cw, ch) * 0.2,
          cw / 2, ch / 2, Math.max(cw, ch) * 0.75
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.7, 'rgba(2, 6, 23, 0.35)');
        grad.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      } else {
        // Fallback smooth dark backdrop while initial frame loads
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }

      ctx.restore();

      // Render Floating Atmospheric Gold Dust Particles
      if (pCtx) {
        pCtx.save();
        pCtx.scale(dpr, dpr);
        pCtx.clearRect(0, 0, displayWidth, displayHeight);

        particles.forEach((p) => {
          p.x += p.vx + mouseRef.current.x * 0.4;
          p.y += p.vy;

          if (p.y < 0) p.y = displayHeight;
          if (p.x < 0) p.x = displayWidth;
          if (p.x > displayWidth) p.x = 0;

          pCtx.beginPath();
          pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          pCtx.fillStyle = `rgba(245, 158, 11, ${p.alpha * (0.4 + scrollProgressRef.current * 0.6)})`;
          pCtx.shadowColor = '#f59e0b';
          pCtx.shadowBlur = 6;
          pCtx.fill();
        });

        pCtx.restore();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Shopping handlers
  const handleBuyNow = () => {
    if (!product) return;
    addItem({
      _id: product._id || product.id,
      slug: product.slug,
      name: product.name,
      price_paise: product.price_paise,
      member_price_paise: product.member_price_paise,
      images: product.images || ['/media/cinematic/keyframes/scene_8.jpg'],
      category: product.category || 'GEARS',
      quantity: 1,
    });
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!product) return;
    setIsAdding(true);
    addItem({
      _id: product._id || product.id,
      slug: product.slug,
      name: product.name,
      price_paise: product.price_paise,
      member_price_paise: product.member_price_paise,
      images: product.images || ['/media/cinematic/keyframes/scene_8.jpg'],
      category: product.category || 'GEARS',
      quantity: 1,
    });
    toast.success(`Added ${product.name} to cart!`, { icon: '🛍️' });
    setTimeout(() => setIsAdding(false), 600);
  };

  const regularPrice = product?.price_paise ? product.price_paise / 100 : 4500;
  const memberPrice = product?.member_price_paise ? product.member_price_paise / 100 : Math.round(regularPrice * 0.9);
  const compareAtPrice = product?.compare_at_price_paise ? product.compare_at_price_paise / 100 : Math.round(regularPrice * 1.15);
  const stockCount = product?.stock !== undefined ? product.stock : 43;

  const currentScene = SCENES[activeSceneIdx] || SCENES[0];

  return (
    <div ref={containerRef} className="relative w-full h-[450vh] bg-slate-950 text-white select-none">
      {/* ── STICKY PINNED 4D CANVAS VIEWPORT (0 BLANK AREA, FIXED 100VH) ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-end">
        {/* Layer 1 & 2: Master Frame-by-Frame Scrub Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0 cursor-grab active:cursor-grabbing"
        />

        {/* Layer 3: Atmospheric Golden Particles Canvas */}
        <canvas
          ref={particlesCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* ── LOWER OVERLAY (SCENES 1-7 TYPOGRAPHY OR SCENE 8 PURCHASE CARD) ── */}
        <div className="relative z-30 px-6 sm:px-12 lg:px-20 pb-12 sm:pb-16 pointer-events-none">
          {!currentScene.isPurchase ? (
            <div className="max-w-2xl bg-slate-950/75 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-3 sm:space-y-4 animate-in fade-in duration-300 pointer-events-auto">
              {currentScene.headline && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-400/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>SCENE 0{currentScene.id} &bull; {currentScene.title}</span>
                </div>
              )}

              {currentScene.headline && (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display leading-[1.08] drop-shadow-2xl">
                  {currentScene.headline}
                </h1>
              )}

              {currentScene.sub && (
                <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed drop-shadow-md max-w-lg">
                  {currentScene.sub}
                </p>
              )}

              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-cyan-400/80">
                <span className="animate-bounce">↓</span>
                <span>Scroll down to control the frame-by-frame transformation</span>
              </div>
            </div>
          ) : (
            /* ── SCENE 8 PURCHASE MOMENT (LIVE DATA FROM DATABASE) ── */
            <div className="w-full max-w-xl bg-slate-950/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-500 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="px-3 py-1 rounded-full bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                  SCENE 08 &bull; PURCHASE MOMENT
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {stockCount > 0 ? `In Stock (${stockCount} Available)` : 'Backorder'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400 block font-bold">
                  Match-Certified Handcrafted Series
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                  {product?.name || 'English Willow Cricket Bat'}
                </h2>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {product?.description || 'Premium grade English willow bat, ideal for professional tournament and club players.'}
                </p>
              </div>

              {/* Dynamic Live Price Derived from DB */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Selling Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                      ₹{regularPrice.toLocaleString('en-IN')}
                    </span>
                    {compareAtPrice > regularPrice && (
                      <span className="text-xs line-through text-slate-500 font-mono">
                        ₹{compareAtPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold text-right">
                  <div className="text-[9px] text-slate-400 uppercase">VIP Pass Price</div>
                  <span>₹{memberPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Functioning Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-950" />
                  <span>BUY NOW &bull; EXPRESS DISPATCH</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAdding ? <Check className="w-4 h-4 text-emerald-400" /> : <ShoppingBag className="w-4 h-4 text-cyan-400" />}
                  <span>{isAdding ? 'Added' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => navigate(`/store/${product?.slug || 'english-willow-cricket-bat'}`)}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                  title="View Complete Product Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Trust Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[10px] text-slate-400 text-center font-mono">
                <div>100% Genuine Willow</div>
                <div>Free Delivery &gt; ₹500</div>
                <div>7-Day Exchange</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CinematicCanvasScrubber;
