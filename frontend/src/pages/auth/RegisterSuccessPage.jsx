import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Sparkles, ShoppingBag, CreditCard, ArrowRight, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

export default function RegisterSuccessPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleGetCardClick = () => {
    toast('Membership Card purchase is launching in Prompt #6!', {
      icon: '💎',
    });
    navigate('/membership');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <Card className="w-full max-w-[500px] p-6 sm:p-8 shadow-xl border-slate-200 bg-white text-center">
        {/* Celebration Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to Bigchamp! 🎉
        </h1>
        <p className="text-base font-semibold text-primary-900 mt-1">
          {user?.full_name || 'Champion'}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your free account is ready. You can now shop directly for gears and apparel.
        </p>

        {/* Free Account Capabilities */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Free Account Privileges Active
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Browse complete verified sports catalog & apparel</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Place orders with direct online or card checkout</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Access order tracking and personal dashboard</span>
          </div>
        </div>

        {/* Optional Membership Upsell Card */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-primary-950 to-primary-900 text-white text-left shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-500 text-white text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optional Upgrade</span>
            </span>
            <span className="text-sm font-bold text-accent-400">₹100 / Year</span>
          </div>

          <h3 className="text-base font-bold text-white">
            Unlock Full Access with Bigchamp Card
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 mb-3">
            Get athlete dormitory stays, physio clinics, and cashback wallet.
          </p>

          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-center gap-2">
              <span className="text-accent-400">•</span>
              <span>Dormitory athlete stays across Indian cities</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-400">•</span>
              <span>Priority physio rehab clinic bookings</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-400">•</span>
              <span>Cookey product with weekly ₹500 lucky draw</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-400">•</span>
              <span>₹10 instant cashback wallet + 10% Army discount</span>
            </li>
          </ul>

          <button
            type="button"
            onClick={handleGetCardClick}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>Get Membership Card (₹100)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/store" className="flex-1">
            <Button
              variant="primary"
              className="w-full"
              leftIcon={<ShoppingBag className="w-4 h-4" />}
            >
              Continue Shopping
            </Button>
          </Link>
          <Link to="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
