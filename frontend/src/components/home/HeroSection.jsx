import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function HeroSection({ content }) {
  if (!content) return null;

  return (
    <div className="text-center space-y-6 max-w-4xl mx-auto py-8">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-100 text-accent-800 text-xs font-bold tracking-wide">
        <Sparkles className="w-3.5 h-3.5" /> India&apos;s Sports & Defense Ecosystem
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
        {content.title || 'India ka Pehla Sports, Student & Defense Ecosystem'}
      </h1>

      <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
        {content.subtitle || '₹100 Digital Card → Unlock Dormitory Stays, Physio Clinics, Sports Gears & More'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        {content.primary_cta_text && (
          <Link to={content.primary_cta_link || '/register'}>
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {content.primary_cta_text}
            </Button>
          </Link>
        )}
        {content.secondary_cta_text && (
          <Link to={content.secondary_cta_link || '/membership'}>
            <Button variant="secondary" size="lg">
              {content.secondary_cta_text}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default HeroSection;
