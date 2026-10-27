import React from 'react';
import { Star, ShieldCheck, Quote } from 'lucide-react';
import { Card3DTilt } from '../3d/Card3DTilt';

export function AthleteTestimonials() {
  const reviews = [
    {
      name: 'Rashi Kumawat',
      sport: 'State Badminton Champion',
      city: 'Jaipur, Rajasthan',
      rating: 5,
      comment:
        'The Carbon Pro racket balance and tension retention is tournament grade. Arrived safely packed with genuine brand authenticity verification.',
      verified: 'Verified Athlete Purchaser',
    },
    {
      name: 'Capt. Vikram Rawat',
      sport: 'Armed Forces Sports Cell',
      city: 'Pune, Maharashtra',
      rating: 5,
      comment:
        'Supreme craftsmanship on the English willow cricket bat. The Armed Forces privilege discount was verified seamlessly. Highly recommended for club athletes.',
      verified: 'Verified Defense Personnel',
    },
    {
      name: 'Ananya Sen',
      sport: 'Marathon & Endurance Runner',
      city: 'Bengaluru, Karnataka',
      rating: 5,
      comment:
        'The Pro Velocity running shoes provide responsive cushioning without overheating. The 10% instant member wallet cashback was credited right after checkout.',
      verified: 'Verified Member Passholder',
    },
  ];

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-12">
      {/* Editorial Title */}
      <div className="scroll-header flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-500 block">
            VERIFIED ENDORSEMENTS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display mt-1">
            Love From Our Athletes
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md">
          Athletes, club competitors, and defense sports academies across India rely on BIGCHAMP.
        </p>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {reviews.map((rev, idx) => (
          <Card3DTilt key={idx} maxTilt={6} scale={1.02} glare={true} data-scroll-card className="scroll-card rounded-2xl overflow-hidden">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 flex flex-col justify-between space-y-6 relative transition-all duration-300 h-full">
              <div className="space-y-4">
                {/* Star Rating & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-slate-700" />
                </div>

                {/* Review Text */}
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-white text-base font-display">
                    {rev.name}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {rev.verified}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {rev.sport} • {rev.city}
                </p>
              </div>
            </div>
          </Card3DTilt>
        ))}
      </div>
    </section>
  );
}

export default AthleteTestimonials;
