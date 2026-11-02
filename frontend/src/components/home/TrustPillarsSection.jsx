import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function TrustPillarsSection() {
  const { getBusinessRules } = useSettingsStore();
  const rules = getBusinessRules();

  const freeShippingThreshold = Math.round((rules.free_delivery_threshold_paise || 50000) / 100);
  const returnWindowDays = rules.return_window_days || 7;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-b border-white/10 my-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {/* Pillar 1 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">100% Genuine Gear</h4>
            <p className="text-xs text-slate-400 mt-0.5">Coach-tested match willow & balls.</p>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">Free Insured Delivery</h4>
            <p className="text-xs text-slate-400 mt-0.5">On orders above ₹{freeShippingThreshold} in India.</p>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">{returnWindowDays}-Day Easy Exchange</h4>
            <p className="text-xs text-slate-400 mt-0.5">Size & spec replacement guarantee.</p>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">Dedicated Gear Support</h4>
            <p className="text-xs text-slate-400 mt-0.5">Specialist athlete consultation.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustPillarsSection;

