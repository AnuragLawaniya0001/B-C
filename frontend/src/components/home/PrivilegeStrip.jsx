import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export function PrivilegeStrip({ rules }) {
  const cardFee = Math.round((rules?.card_fee_paise || 10000) / 100);
  const cookeyPrice = Math.round((rules?.cookey_price_paise || 10000) / 100);
  const armyDiscount = rules?.army_extra_discount_percent || 10;
  const cashbackPercent = rules?.joining_cashback_percent || 10;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Cookey Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-3xl p-8 sm:p-10 border border-amber-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Weekly Privilege</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Cookey Token Program
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Active members can acquire a Cookey token for ₹{cookeyPrice} (limit 1 per week). Collect tokens, enter weekly prize draws, and redeem exclusive athletic merchandise.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/cookey">
              <Button
                variant="outline"
                className="w-full sm:w-auto font-bold border-amber-500/40 text-amber-900 hover:bg-amber-500 hover:text-white transition-colors"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Cookey Rules
              </Button>
            </Link>
          </div>
        </div>

        {/* Armed Forces Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white rounded-3xl p-8 sm:p-10 border border-emerald-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Honoring Our Heroes</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Armed Forces {armyDiscount}% Discount
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We proudly offer verified Indian Defense personnel, veterans, and military families an additional {armyDiscount}% discount across all sports equipment, bats, and activewear.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/army-offer">
              <Button
                variant="outline"
                className="w-full sm:w-auto font-bold border-emerald-500/40 text-emerald-900 hover:bg-emerald-600 hover:text-white transition-colors"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Verify Military Privilege
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
