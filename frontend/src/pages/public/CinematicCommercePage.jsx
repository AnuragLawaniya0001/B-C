import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CinematicCanvasScrubber } from '../../components/cinematic/CinematicCanvasScrubber';
import { CinematicIntroOverlay } from '../../components/cinematic/CinematicIntroOverlay';
import { SportsMarquee } from '../../components/home/SportsMarquee';
import { SportsCategoriesSection } from '../../components/home/SportsCategoriesSection';
import { FeaturedProductsSection } from '../../components/home/FeaturedProductsSection';
import { VipPassSection } from '../../components/home/VipPassSection';
import { TrustPillarsSection } from '../../components/home/TrustPillarsSection';
import { CinematicHeader } from '../../components/navigation/CinematicHeader';
import { CinematicFooter } from '../../components/navigation/CinematicFooter';
import { useLenisScroll } from '../../hooks/useLenisScroll';
import api from '../../services/api';

export function CinematicCommercePage() {
  // Butter-smooth inertial scrolling
  useLenisScroll();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [batProduct, setBatProduct] = useState(null);
  const [, setActiveScene] = useState({ id: 1, title: 'THE ORIGIN' });
  const [, setIsStoryActive] = useState(true);

  // If URL has search or category filters, redirect directly to catalog
  useEffect(() => {
    if (searchParams.get('category') || searchParams.get('search') || searchParams.get('sort')) {
      navigate(`/catalogue?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Fetch live Willow Bat product from MongoDB (Never hardcode ₹4,500)
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
          .catch((err) => console.error('Error fetching bat product:', err));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSkipStory = useCallback(() => {
    const storeSection = document.getElementById('shop-storefront');
    if (storeSection) {
      storeSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-400 selection:text-slate-950">
      {/* ── 1. SINGLE UNIFIED MASTER COMMERCE HEADER ──
          Clean, elegant, fixed navigation (Products, Categories, Deals, VIP Pass, Search, Cart, Account) */}
      <CinematicHeader />

      {/* ── 2. HERO: CINEMATIC PRE-STORY INTRO OVERLAY ── */}
      <CinematicIntroOverlay
        onSkip={handleSkipStory}
      />

      {/* ── 3. HERO: 8-SCENE MASTER 4D FRAME-BY-FRAME CANVAS SCRUBBER ── */}
      <CinematicCanvasScrubber
        product={batProduct}
        onSceneChange={setActiveScene}
        onStoryActiveChange={setIsStoryActive}
        onSkip={handleSkipStory}
      />

      {/* ── 4. POST-STORY STOREFRONT SECTION ── */}
      <div id="shop-storefront" className="relative z-30 bg-slate-950">
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
