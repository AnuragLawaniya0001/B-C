import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function CookeyBannerSection({ content = {} }) {
  const heading = content?.heading || 'Cookey — Members Only';
  const subheading = content?.subheading || '₹100 • 1 per week per member';
  const desc =
    content?.desc ||
    'Buy Cookey and enter the weekly lucky draw. Winner gets cash wallet rewards!';
  const ctaText = content?.cta_text || 'Buy Cookey';
  const ctaLink = content?.cta_link || '/cookey';

  return (
    <div className="py-6">
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> {subheading}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {heading}
          </h2>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            {desc}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <Cookie className="w-9 h-9" />
          </div>
          <Link to={ctaLink}>
            <Button variant="secondary" size="lg" className="bg-white text-orange-950 hover:bg-slate-50 border-0 font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {ctaText}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CookeyBannerSection;
