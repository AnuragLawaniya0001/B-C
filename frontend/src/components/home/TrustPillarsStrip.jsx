import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Award } from 'lucide-react';

export function TrustPillarsStrip({ sectionConfig, rules }) {
  const freeShippingThreshold = Math.round((rules?.free_delivery_threshold_paise || 50000) / 100);

  const pillars = [
    {
      icon: Truck,
      title: 'Free Insured Delivery',
      description: `On all athletic equipment orders above ₹${freeShippingThreshold}`,
    },
    {
      icon: Award,
      title: '100% Authentic Gear',
      description: 'Match-grade tested bats, balls, and certified training apparel',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Checkout Integrity',
      description: 'HMAC signature-verified payments and backend price integrity',
    },
    {
      icon: RefreshCw,
      title: '7-Day Easy Exchange',
      description: 'Hassle-free sizing exchanges for athletes across India',
    },
  ];

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="bg-slate-900/60 backdrop-blur-xl text-white rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} data-scroll-card className="scroll-card flex items-start gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white font-display tracking-tight group-hover:text-amber-400 transition-colors">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TrustPillarsStrip;
