import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  QrCode,
  ArrowRight,
  History,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import membershipService from '../../services/membershipService';

export default function MembershipPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, fetchMe } = useAuthStore();

  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const settingsData = await membershipService.getSettings();
      setSettings(settingsData);

      if (isAuthenticated) {
        const [statusData, historyData] = await Promise.all([
          membershipService.getStatus(),
          membershipService.getHistory(0, 10),
        ]);
        setStatus(statusData);
        setHistory(historyData.items || []);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to load membership settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handlePurchaseOrRenew = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/membership');
      return;
    }

    setPurchasing(true);
    setFeedback(null);

    try {
      const idempotencyKey = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const purchaseRes = await membershipService.purchase(idempotencyKey);

      await membershipService.openMembershipCheckout({
        purchase: purchaseRes,
        user,
        onSuccess: async (verifyRes) => {
          setPurchasing(false);
          setFeedback({
            type: 'success',
            message: verifyRes.message || 'Membership activated successfully!',
          });
          await fetchMe();
          await loadData();
        },
        onError: (errMsg) => {
          setPurchasing(false);
          setFeedback({
            type: 'error',
            message: errMsg || 'Payment failed or was not completed.',
          });
        },
        onDismiss: () => {
          setPurchasing(false);
          setFeedback({
            type: 'info',
            message: 'Payment window was closed. You can retry anytime.',
          });
        },
      });
    } catch (err) {
      setPurchasing(false);
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.detail ||
          err.message ||
          'Failed to initiate membership payment. Please try again.',
      });
    }
  };

  const isCurrentlyActive = status?.is_active === true;
  const isExpired = status && !status.is_active && status.card_number;
  const priceInr = settings?.price_paise ? (settings.price_paise / 100).toFixed(2) : '100.00';
  const validityDays = settings?.validity_days || 334;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 text-white">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          <span>BigChamp Athlete Pass &bull; Nationwide Privilege</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-syne font-black text-white tracking-tight mt-3">
          {settings?.display_name || 'Bigchamp VIP Athlete Pass'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
          {settings?.description ||
            'Annual digital sports privilege pass with tournament stay privileges, gear discounts, and certified physio recovery access.'}
        </p>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
              : feedback.type === 'info'
              ? 'bg-blue-500/15 text-blue-200 border-blue-500/30'
              : 'bg-rose-500/15 text-rose-200 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : feedback.type === 'info' ? (
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#060b16]/80 border border-white/10">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm">Loading dynamic membership settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Digital Membership Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/25 via-[#10192e] to-slate-950 text-white p-7 shadow-2xl border-2 border-amber-400/60">
              <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-56">
                {/* Card Top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/assets/logo.png" alt="Bigchamp" className="h-7 w-auto drop-shadow-md" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">BIGCHAMP</p>
                      <p className="text-xs font-syne font-black text-amber-400 tracking-wide">DIGITAL PASS</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isCurrentlyActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isExpired
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-400 text-slate-950 font-black'
                    }`}
                  >
                    {isCurrentlyActive ? 'ACTIVE MEMBER' : isExpired ? 'EXPIRED' : '₹100 PASS'}
                  </span>
                </div>

                {/* Card Number */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Card Identifier</p>
                  <p className="text-lg font-mono font-bold tracking-widest text-slate-100">
                    {status?.card_number || 'BC-MEM-••••-••••'}
                  </p>
                </div>

                {/* Card Bottom */}
                <div className="flex items-end justify-between border-t border-white/10 pt-3">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Cardholder</p>
                    <p className="text-sm font-bold text-white truncate max-w-[170px]">
                      {user?.full_name || user?.name || 'Sports Champion'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-400">Valid Till</p>
                    <p className="text-xs font-bold text-emerald-400">
                      {status?.valid_till ? formatDate(status.valid_till) : `${validityDays} Days`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Status Pill */}
            {isCurrentlyActive && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" /> Remaining Validity
                  </span>
                  <span className="text-emerald-300 font-extrabold text-sm">{status.remaining_days} Days</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Valid from {formatDate(status.period_start)} to {formatDate(status.valid_till)}.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Dynamic Plan Details & Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 space-y-6 shadow-2xl">
              {/* Dynamic Pricing Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                    Authoritative Plan
                  </span>
                  <h3 className="text-2xl font-syne font-black text-white tracking-tight mt-0.5">
                    {settings?.display_name || 'BigChamp Athlete Club'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Validity: <strong className="text-slate-200">{validityDays} Days</strong> &bull; Renewal policy:{' '}
                    <span className="font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {settings?.renewal_policy || 'EXTEND_FROM_EXPIRY'}
                    </span>
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Configured Fee</p>
                  <p className="text-3xl font-syne font-black text-amber-400 tracking-tight">
                    ₹{priceInr}
                    <span className="text-xs font-semibold text-slate-400 ml-1">/ {validityDays} days</span>
                  </p>
                </div>
              </div>

              {/* Dynamic Benefits List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                  Configured Member Privileges
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {(settings?.benefits || [
                    'Extra 15% discount across BigChamp Sports Gear Store',
                    'Priority booking & subsidized rates at Athlete Dormitories',
                    'Certified Sports Physio & Rehabilitation clinic access',
                    'Instant ₹100 joining wallet cashback bonus',
                    'Dedicated helpline for tournament players & Armed Forces',
                  ]).map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Section */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                {!settings?.enabled ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" /> New Purchases Disabled
                    </p>
                    <p className="mt-1 text-slate-300">
                      Platform administration has temporarily paused new membership enrollments. Existing active memberships remain fully functional.
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handlePurchaseOrRenew}
                      disabled={purchasing}
                      className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-syne font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {isCurrentlyActive
                              ? `Renew VIP Pass for ₹${priceInr}`
                              : `Get Membership Pass (₹${priceInr})`}
                          </span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-400">
                      Live Authoritative Razorpay Payment &bull; Instant Dynamic Pass Activation
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
