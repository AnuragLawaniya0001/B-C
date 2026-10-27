import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function ArmyBannerSection({ content = {} }) {
  const heading = content?.heading || 'Defense Personnel — Extra 10% Off';
  const desc =
    content?.desc ||
    'Verified Army & Defense personnel get an additional 10% discount on all purchases, services, and bookings.';
  const ctaText = content?.cta_text || 'Learn More';
  const ctaLink = content?.cta_link || '/army-offer';

  return (
    <div className="py-6">
      <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start gap-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-primary-800/80 border border-primary-500/30 flex items-center justify-center text-primary-300 shrink-0 mt-1">
            <Shield className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-400">Honoring Our Forces</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {heading}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {desc}
            </p>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <Link to={ctaLink}>
            <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {ctaText}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ArmyBannerSection;
