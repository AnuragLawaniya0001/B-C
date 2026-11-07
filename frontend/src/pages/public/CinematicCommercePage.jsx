import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StoreHeroCarousel } from '../../components/store/StoreHeroCarousel';
import { SportsMarquee } from '../../components/home/SportsMarquee';
import { SportsCategoriesSection } from '../../components/home/SportsCategoriesSection';
import { FeaturedProductsSection } from '../../components/home/FeaturedProductsSection';
import { VipPassSection } from '../../components/home/VipPassSection';
import { TrustPillarsSection } from '../../components/home/TrustPillarsSection';
import { CinematicHeader } from '../../components/navigation/CinematicHeader';
import { CinematicFooter } from '../../components/navigation/CinematicFooter';
import { useLenisScroll } from '../../hooks/useLenisScroll';

export function CinematicCommercePage() {
  // Butter-smooth inertial scrolling
  useLenisScroll();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // If URL has search or category filters, redirect directly to catalog
  useEffect(() => {
    if (searchParams.get('category') || searchParams.get('search') || searchParams.get('sort')) {
      navigate(`/catalogue?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-400 selection:text-slate-950 overflow-x-hidden">
      {/* ── 1. SINGLE UNIFIED MASTER COMMERCE HEADER ──
          Clean, elegant, fixed navigation (Store, Categories, Stays, Medical, Offers, Membership) */}
      <CinematicHeader />

      {/* ── 2. HERO: FULL-VIEWPORT MASTER SPORTS PHOTO CAROUSEL (4 Auto-Rotating Commercial Banners) ──
          100% edge-to-edge, full width, zero border, zero margin, cinematic sports photography */}
      <StoreHeroCarousel />

      {/* ── 3. STOREFRONT MERCHANDISING SECTIONS (ORIGINAL LAYOUT & STYLING) ── */}
      <div id="shop-storefront" className="relative z-30 w-full bg-slate-950">
        {/* Section A: Horizontal Sports Marquee */}
        <SportsMarquee />

        {/* Section B: Sports Categories Grid */}
        <SportsCategoriesSection />

        {/* Section C: Featured Tournament Products Grid */}
        <FeaturedProductsSection />

        {/* Section D: VIP Athlete Pass Experience */}
        <VipPassSection />

        {/* Section E: Single Clean Trust Pillars Ribbon */}
        <TrustPillarsSection />

        {/* Section F: Minimal Luxury Footer */}
        <CinematicFooter />
      </div>
    </div>
  );
}

export default CinematicCommercePage;
