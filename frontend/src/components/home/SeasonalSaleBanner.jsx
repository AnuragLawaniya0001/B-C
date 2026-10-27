import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Tag, ShieldCheck, Truck, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card3DTilt } from '../3d/Card3DTilt';

export function SeasonalSaleBanner({ sectionConfig, rules }) {
  const freeShippingThreshold = Math.round((rules?.free_delivery_threshold_paise || 50000) / 100);
  const memberDiscount = rules?.default_member_discount_percent || 10;

  const title = sectionConfig?.title || 'The Champion Festival Sale.';
  const subtitle = sectionConfig?.subtitle || 'UP TO 30% OFF SELECT TOURNAMENT GEAR';
  const ctaText = sectionConfig?.cta_text || sectionConfig?.cta_label || 'Shop Sale Collection';
  const ctaLink = sectionConfig?.cta_link || '/catalogue?category=GEARS';

  const isVideo = sectionConfig?.media_type === 'video';
  const mediaUrl =
    sectionConfig?.media_url ||
    'https://res.cloudinary.com/ibq3zgu8/video/upload/v1793031765/bigchamp/media/videos/bigchamp_seasonal_campaign.mp4';
  const posterUrl =
    sectionConfig?.poster_url ||
    'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031742/bigchamp/media/images/campaign_seasonal_sale_1793006596470.jpg';

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

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
    if (videoRef.current && isVideo && !videoError) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Seasonal video autoplay error:', err);
        });
      }
    }
  }, [mediaUrl, isVideo, videoError]);

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-10 perspective-1400">
      <Card3DTilt maxTilt={4} scale={1.01} data-scroll-card className="scroll-card rounded-2xl overflow-hidden">
        <div className="relative rounded-2xl overflow-hidden text-white min-h-[460px] sm:min-h-[520px] flex items-center">
        {/* Background Media */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {isVideo && !videoError ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              poster={posterUrl}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              onError={() => setVideoError(true)}
              data-scroll-image
              className="scroll-image w-full h-full object-cover object-[70%_center] lg:object-[75%_center] scale-105 transition-opacity duration-1000 filter brightness-[1.08] contrast-[1.14] saturate-[1.25]"
            />
          ) : (
            <img
              src={posterUrl}
              alt={title}
              data-scroll-image
              className="scroll-image w-full h-full object-cover object-[70%_center] lg:object-[75%_center] opacity-85 scale-105 transition-transform duration-1000 filter brightness-[1.08] contrast-[1.14] saturate-[1.25]"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://res.cloudinary.com/ibq3zgu8/image/upload/v1793031771/bigchamp/images/sale_banner.jpg';
              }}
            />
          )}

          {/* Cinematic Gradient Overlays with dynamic contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/60 to-slate-950/15 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Video Controls Bar */}
          {isVideo && !videoError && (
            <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2.5 bg-slate-950/75 hover:bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs shadow-xl transition-all">
              <button
                onClick={togglePlay}
                className="p-1 rounded-full hover:bg-white/20 text-slate-200 hover:text-accent-400 transition-colors"
                title={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-accent-400" /> : <Play className="w-3.5 h-3.5 text-accent-400" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-1 rounded-full hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                title={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-300" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <div className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-300 font-mono tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Campaign HD
              </span>
            </div>
          )}
        </div>

        <div className="relative z-10 p-8 sm:p-14 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-500/20 border border-accent-500/30 text-accent-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>Seasonal Campaign • Verified Stock</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight font-display">
              {title}
            </h2>
            <p className="text-accent-400 font-extrabold text-lg sm:text-xl font-display">
              {subtitle}
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-lg">
            Equip your training season with certified cricket bats, match balls, and compression apparel. Free insured shipping on all orders over ₹{freeShippingThreshold}.
          </p>

          {/* Perks Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <Truck className="w-4 h-4 text-accent-400" />
              <span>Free Delivery Above ₹{freeShippingThreshold}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Extra {memberDiscount}% Member Savings</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to={ctaLink}>
              <Button
                size="lg"
                className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 shadow-lg shadow-accent-500/30"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {ctaText}
              </Button>
            </Link>

            <Link to="/offers">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm px-6"
              >
                Explore Active Offers
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </Card3DTilt>
    </section>
  );
}
