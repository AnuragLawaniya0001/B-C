import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function HeroSection({ content = {} }) {
  const title = content?.title || 'India ka Pehla Sports, Student & Defense Ecosystem';
  const subtitle =
    content?.subtitle ||
    '₹100 Digital Card → Unlock Dormitory Stays, Physio Clinics, Sports Gears & More';
  const primaryCtaText = content?.primary_cta_text || 'Join Free Now';
  const primaryCtaLink = content?.primary_cta_link || '/register';
  const secondaryCtaText = content?.secondary_cta_text || 'Digital Card (₹100)';
  const secondaryCtaLink = content?.secondary_cta_link || '/membership';

  return (
    <div className="text-center space-y-6 max-w-4xl mx-auto py-8">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-100 text-accent-800 text-xs font-bold tracking-wide">
        <Sparkles className="w-3.5 h-3.5" /> India&apos;s Sports & Defense Ecosystem
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
        {title}
      </h1>

      <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Link to={primaryCtaLink}>
          <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            {primaryCtaText}
          </Button>
        </Link>
        <Link to={secondaryCtaLink}>
          <Button variant="secondary" size="lg">
            {secondaryCtaText}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default HeroSection;
