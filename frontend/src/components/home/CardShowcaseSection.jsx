import React from 'react';
import { Link } from 'react-router-dom';
import { Check, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function CardShowcaseSection({ content }) {
  if (!content) return null;
  const features = content.features || [];

  return (
    <div className="py-8">
      <Card className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white p-8 sm:p-12 overflow-hidden relative border-0 shadow-2xl rounded-3xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> {content.subheading || 'Membership that pays for itself'}
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {content.heading || 'Your Bigchamp Digital Card'}
            </h2>

            <ul className="space-y-3 pt-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300 text-sm sm:text-base">
                  <div className="w-5 h-5 rounded-full bg-accent-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link to={content.cta_link || '/register'}>
                <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {content.cta_text || 'Get Your Card'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual Digital Card Mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm aspect-[1.58/1] rounded-2xl p-6 bg-gradient-to-tr from-accent-600 via-primary-600 to-indigo-700 shadow-2xl flex flex-col justify-between text-white border border-white/20 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-accent-200">BIGCHAMP ECOSYSTEM</span>
                  <p className="text-lg font-black tracking-wide">DIGITAL PASS</p>
                </div>
                <CreditCard className="w-8 h-8 text-white/80" />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-white/70 font-mono tracking-widest">CARD NO</p>
                <p className="text-lg font-mono font-bold tracking-widest">BC-2026-XXXX-7890</p>
              </div>

              <div className="flex justify-between items-end border-t border-white/20 pt-3 text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-white/70">FEE / VALIDITY</span>
                  <p className="font-bold">₹100 • 11 MONTHS</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CardShowcaseSection;
