import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Sparkles, ShoppingBag, CreditCard, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function RegisterSuccessPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 py-10 relative z-10">
      <div className="w-full max-w-[480px] p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.1)] text-white relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Celebration Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4 border border-emerald-500/40">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h1 className="font-syne font-black text-2xl sm:text-3xl text-white tracking-tight">
          Welcome to BigChamp! 🎉
        </h1>
        <p className="font-syne font-bold text-amber-400 mt-1 text-base">
          {user?.full_name || 'Champion'}
        </p>
        <p className="text-xs text-slate-300 mt-1">
          Your athlete account is ready. You can now shop directly for match gear and tournament stays.
        </p>

        {/* Free Account Capabilities */}
        <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Account Privileges Active
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Browse complete verified sports catalog &amp; apparel</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Place orders with direct online checkout &amp; free shipping above ₹500</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Access order tracking and personal dashboard</span>
          </div>
        </div>

        {/* Membership Upgrade Box */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/40 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Recommended</span>
            </span>
            <span className="font-syne font-black text-amber-400 text-sm">₹100 / 11 Months</span>
          </div>

          <h3 className="font-syne font-bold text-white text-sm">
            Unlock VIP Athlete Pass Privileges
          </h3>
          <p className="text-[11px] text-slate-300 mt-0.5 mb-3">
            Instant ₹100 wallet cashback, 15% store discounts, and discounted tournament hostel stays.
          </p>

          <Link
            to="/membership"
            className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-syne font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Get VIP Pass Now (₹100)</span>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            to="/store"
            className="flex-1 py-3 px-5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-syne font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Enter Sports Store</span>
          </Link>

          <Link
            to="/dashboard"
            className="flex-1 py-3 px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-syne font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <span>My Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
