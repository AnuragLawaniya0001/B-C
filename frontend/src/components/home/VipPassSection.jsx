import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, ArrowRight, Zap, QrCode, CheckCircle2 } from 'lucide-react';
import { Card3DTilt } from '../3d/Card3DTilt';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

export function VipPassSection() {
  const { settings, fetchSettings, getBusinessRules } = useSettingsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const rules = getBusinessRules();
  const membershipSettings = settings?.membership_settings || {};

  const price = membershipSettings.price_paise
    ? Math.round(membershipSettings.price_paise / 100)
    : Math.round((rules.card_fee_paise || 10000) / 100);

  const validityDays = membershipSettings.validity_days || rules.card_validity_days || 334;
  const discountPercent = rules.default_member_discount_percent || 15;
  const displayName = membershipSettings.display_name || 'BIGCHAMP Athlete Club';

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/30 border border-cyan-500/30 p-8 sm:p-14 overflow-hidden shadow-2xl">
        {/* Cyan Ambient Glow */}
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Description & Benefits */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP Athlete Pass &bull; Exclusive Membership</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display leading-[1.08]">
                Unlock Flat {discountPercent}% Off on Every Order.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Elevate your sporting journey with the official {displayName}. Enjoy guaranteed member discounts, priority drops, subsidized sports dormitories, and match privileges.
              </p>
            </div>

            {/* Dynamic Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Flat {discountPercent}% Store Discount</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Applied automatically to every item in your cart.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <Truck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Free Insured Delivery</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">No minimum order threshold for active passholders.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Priority Equipment Drops</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Early access to limited willow runs and gear.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Dormitory & Physio Perks</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Subsidized tournament stay and sports therapy.</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/membership"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
              >
                <span>JOIN VIP CLUB &bull; ₹{price} / {validityDays} DAYS</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>

              <span className="text-xs text-slate-400 font-mono">
                Instant digital card activation upon checkout
              </span>
            </div>
          </div>

          {/* Right Column: 3D Glowing Digital Member Card */}
          <div className="lg:col-span-5 flex justify-center">
            <Card3DTilt maxTilt={10} scale={1.03} glare={true} className="w-full max-w-sm rounded-3xl">
              <div className="relative rounded-3xl p-7 bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 border-cyan-400/40 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col justify-between min-h-[260px]">
                {/* Cyan Sheen Background */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

                {/* Card Top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/logo_emblem.png"
                      alt="Bigchamp Winged Crest"
                      className="h-8 w-auto filter drop-shadow-[0_2px_10px_rgba(0,240,255,0.4)] shrink-0"
                    />
                    <div>
                      <span className="font-extrabold text-white text-base tracking-wider font-display block leading-none italic">
                        BIGCHAMP
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-mono font-bold">
                        ATHLETE PASS
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-black tracking-wider uppercase">
                    VIP PASS
                  </span>
                </div>

                {/* Card Center: Dynamic Passholder Info */}
                <div className="py-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">
                    PASSHOLDER NAME
                  </span>
                  <div className="font-black text-white text-lg font-display tracking-wide">
                    {user?.full_name ? user.full_name.toUpperCase() : 'CHAMPION ATHLETE'}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">
                    ID: BC-{user?._id ? user._id.slice(-8).toUpperCase() : 'PASS-2026-PRO'}
                  </div>
                </div>

                {/* Card Bottom */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500 block">VALIDITY</span>
                    <span className="text-white font-bold">{validityDays} DAYS</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">STORE DISCOUNT</span>
                    <span className="text-cyan-400 font-bold">{discountPercent}% FLAT</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-cyan-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card3DTilt>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VipPassSection;
