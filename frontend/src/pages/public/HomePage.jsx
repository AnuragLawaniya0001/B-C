import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Shield, Sparkles, Building2, Stethoscope, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { usePage } from '../../hooks/usePage';
import { useSettings } from '../../hooks/useSettings';
import { useBanners } from '../../hooks/useBanners';

// Dynamic Section Subcomponents
import { HeroSection } from '../../components/home/HeroSection';
import { BenefitsSection } from '../../components/home/BenefitsSection';
import { CardShowcaseSection } from '../../components/home/CardShowcaseSection';
import { FeaturedProductsSection } from '../../components/home/FeaturedProductsSection';
import { CookeyBannerSection } from '../../components/home/CookeyBannerSection';
import { ArmyBannerSection } from '../../components/home/ArmyBannerSection';
import { HowItWorksSection } from '../../components/home/HowItWorksSection';

export default function HomePage() {
  const page = usePage('homepage');
  const rules = useSettings('business_rules');
  const { data: banners } = useBanners('homepage_top');

  const cardFee = rules?.card_fee_paise ? rules.card_fee_paise / 100 : 100;
  const hasDynamicSections = page?.sections && Array.isArray(page.sections) && page.sections.length > 0;

  return (
    <div className="min-h-[80vh] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Promotional Banners Slot */}
      {banners && banners.length > 0 && (
        <div className="space-y-3">
          {banners.map((b) => (
            <div
              key={b._id || b.id || b.title}
              className="p-4 bg-gradient-to-r from-accent-600 via-primary-700 to-primary-800 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent-200">SPECIAL OFFER</span>
                <h4 className="text-sm sm:text-base font-bold">{b.title}</h4>
              </div>
              {b.link && (
                <Link to={b.link}>
                  <Button variant="secondary" size="sm" className="bg-white text-slate-900 border-0 font-bold shrink-0">
                    Explore Offer
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Sections Rendering from MongoDB pages collection */}
      {hasDynamicSections ? (
        <div className="space-y-14">
          {page.sections
            .filter((s) => s.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section) => {
              switch (section.type) {
                case 'hero':
                  return <HeroSection key={section.id} content={section.content} />;
                case 'benefits':
                  return <BenefitsSection key={section.id} content={section.content} />;
                case 'card_showcase':
                  return <CardShowcaseSection key={section.id} content={section.content} />;
                case 'featured_products':
                  return <FeaturedProductsSection key={section.id} content={section.content} />;
                case 'cookey_banner':
                  return <CookeyBannerSection key={section.id} content={section.content} />;
                case 'army_banner':
                  return <ArmyBannerSection key={section.id} content={section.content} />;
                case 'how_it_works':
                  return <HowItWorksSection key={section.id} content={section.content} />;
                default:
                  return null;
              }
            })}
        </div>
      ) : (
        /* Fallback when CMS content is empty */
        <div className="space-y-8">
          <div className="p-4 rounded-xl border border-dashed border-primary-300 bg-primary-50/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary-100 text-primary-700 shrink-0 mt-0.5">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-900">
                Dynamic CMS Connected &bull; Configure content in admin panel
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                This page is hooked to <code className="bg-primary-100/80 px-1 py-0.5 rounded text-[11px] font-mono">usePage(&apos;homepage&apos;)</code>. Live sections will automatically render here once seeded or edited in the <Link to="http://localhost:3001/pages" className="text-primary-700 font-semibold underline">Admin Panel</Link>.
              </p>
            </div>
          </div>

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> India&apos;s Sports & Defense Ecosystem
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bigchamp Homepage
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Welcome to Bigchamp. One digital membership card granting ₹{cardFee} cashback, dormitory stays, specialized physiotherapy, authentic sports gear, and the exclusive Cookey product.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/store">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Store
                </Button>
              </Link>
              <Link to="/membership">
                <Button variant="secondary" size="lg">
                  Get Digital Card (₹{cardFee})
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            <Card className="hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Defense Privilege</h3>
              <p className="text-xs text-slate-500">
                Exclusive 10% extra benefit for Armed Forces, Veterans & Police personnel.
              </p>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Dormitory Network</h3>
              <p className="text-xs text-slate-500">
                Comfortable, secure offline hostel stays for athletes and students.
              </p>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Physio Clinics</h3>
              <p className="text-xs text-slate-500">
                Specialized sports injury recovery and physical therapy partner clinics.
              </p>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Cookey Rewards</h3>
              <p className="text-xs text-slate-500">
                Signature ₹100 product with periodic lucky draw rewards every 7 days.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
