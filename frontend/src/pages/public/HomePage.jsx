import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSettingsStore } from '../../store/settingsStore';
import { HeroCampaign } from '../../components/home/HeroCampaign';
import { CategoryPillsStrip } from '../../components/home/CategoryPillsStrip';
import { CuratedProductTabs } from '../../components/home/CuratedProductTabs';
import { EditorialShowcase } from '../../components/home/EditorialShowcase';
import { SeasonalSaleBanner } from '../../components/home/SeasonalSaleBanner';
import { TrustPillarsStrip } from '../../components/home/TrustPillarsStrip';
import { AthleteTestimonials } from '../../components/home/AthleteTestimonials';
import { CommunityPhotoGrid } from '../../components/home/CommunityPhotoGrid';
import { ScrollReveal3D } from '../../components/3d/ScrollReveal3D';

export default function HomePage() {
  const { getBusinessRules, fetchSettings } = useSettingsStore();
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const rules = getBusinessRules();

  useEffect(() => {
    fetchSettings();

    const loadStorefrontData = async () => {
      setLoading(true);
      try {
        const [sectionsRes, catsRes, prodsRes] = await Promise.allSettled([
          api.get('/storefront/sections'),
          api.get('/categories'),
          api.get('/products?active=true&limit=100'),
        ]);

        if (sectionsRes.status === 'fulfilled' && Array.isArray(sectionsRes.value.data)) {
          setSections(sectionsRes.value.data.filter((s) => s.is_active !== false));
        }
        if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value.data)) {
          setCategories(catsRes.value.data.filter((c) => c.active !== false));
        }
        if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value.data)) {
          setProducts(prodsRes.value.data);
        }
      } catch (err) {
        console.error('Error fetching storefront data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStorefrontData();
  }, [fetchSettings]);

  // Map section_type to component with context-aware 3D scroll animations
  const renderSection = (section) => {
    switch (section.section_type) {
      case 'hero_campaign':
        return (
          <HeroCampaign
            key={section.section_id}
            sectionConfig={section}
            rules={rules}
          />
        );
      case 'collections_strip':
        return (
          <ScrollReveal3D key={section.section_id} intensity={6} depth={25}>
            <CategoryPillsStrip
              sectionConfig={section}
              categories={categories}
            />
          </ScrollReveal3D>
        );
      case 'curated_products':
        return (
          <ScrollReveal3D key={section.section_id} intensity={7} depth={30}>
            <CuratedProductTabs
              sectionConfig={section}
              products={products}
              loading={loading}
            />
          </ScrollReveal3D>
        );
      case 'editorial_showcase':
        return (
          <ScrollReveal3D key={section.section_id} intensity={8} depth={35}>
            <EditorialShowcase
              sectionConfig={section}
            />
          </ScrollReveal3D>
        );
      case 'seasonal_sale_banner':
        return (
          <ScrollReveal3D key={section.section_id} intensity={9} depth={40}>
            <SeasonalSaleBanner
              sectionConfig={section}
              rules={rules}
            />
          </ScrollReveal3D>
        );
      case 'trust_pillars':
        return (
          <ScrollReveal3D key={section.section_id} intensity={5} depth={20}>
            <TrustPillarsStrip
              sectionConfig={section}
              rules={rules}
            />
          </ScrollReveal3D>
        );
      case 'athlete_testimonials':
        return (
          <ScrollReveal3D key={section.section_id} intensity={6} depth={25}>
            <AthleteTestimonials
              sectionConfig={section}
            />
          </ScrollReveal3D>
        );
      case 'community_feed':
        return (
          <ScrollReveal3D key={section.section_id} intensity={7} depth={30}>
            <CommunityPhotoGrid
              sectionConfig={section}
            />
          </ScrollReveal3D>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-12 sm:space-y-20 pb-28 perspective-1400 overflow-x-hidden">
      {sections.length > 0 ? (
        // Dynamic admin-driven section rendering with 3D scroll physics
        sections.map((section) => renderSection(section))
      ) : (
        // High-performance fallback if backend sections are empty or loading
        <>
          <HeroCampaign rules={rules} />
          <ScrollReveal3D intensity={6} depth={25}>
            <CategoryPillsStrip categories={categories} />
          </ScrollReveal3D>
          <ScrollReveal3D intensity={7} depth={30}>
            <CuratedProductTabs products={products} loading={loading} />
          </ScrollReveal3D>
          <ScrollReveal3D intensity={8} depth={35}>
            <EditorialShowcase />
          </ScrollReveal3D>
          <ScrollReveal3D intensity={9} depth={40}>
            <SeasonalSaleBanner rules={rules} />
          </ScrollReveal3D>
          <ScrollReveal3D intensity={5} depth={20}>
            <TrustPillarsStrip rules={rules} />
          </ScrollReveal3D>
          <ScrollReveal3D intensity={6} depth={25}>
            <AthleteTestimonials />
          </ScrollReveal3D>
          <ScrollReveal3D intensity={7} depth={30}>
            <CommunityPhotoGrid />
          </ScrollReveal3D>
        </>
      )}
    </div>
  );
}
