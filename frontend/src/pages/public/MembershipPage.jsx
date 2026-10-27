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
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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
        message: err.response?.data?.detail || 'Failed to initiate membership purchase.',
      });
    }
  };

  const priceInr = settings?.price_paise ? (settings.price_paise / 100).toFixed(2) : '100.00';
  const validityDays = settings?.validity_days || 334;
  const isCurrentlyActive = status?.is_active === true;
  const isExpired = status?.status === 'EXPIRED';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary-800 uppercase tracking-wider bg-primary-50 px-3 py-1 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dynamic Membership System &bull; Live Platform Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
          {settings?.display_name || 'Bigchamp Digital Membership Card'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
          {settings?.description ||
            'Annual digital sports privilege pass with partner benefits, store discounts, and athletic community privileges.'}
        </p>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedback.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'info' ? (
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <Card className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-sm">Loading dynamic membership settings...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Digital Membership Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-primary-950 to-emerald-950 text-white p-6 shadow-2xl border border-slate-800">
              {/* Background Glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-56">
                {/* Card Top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-accent-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">BIGCHAMP</p>
                      <p className="text-xs font-bold text-white tracking-wide">DIGITAL PASS</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isCurrentlyActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isExpired
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-white/10 text-slate-300 border border-white/20'
                    }`}
                  >
                    {isCurrentlyActive ? 'ACTIVE MEMBER' : isExpired ? 'EXPIRED' : 'FREE ACCOUNT'}
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
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" /> Remaining Validity
                  </span>
                  <span className="text-emerald-700 font-extrabold text-sm">{status.remaining_days} Days</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Valid from {formatDate(status.period_start)} to {formatDate(status.valid_till)}.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Dynamic Plan Details & Action */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 sm:p-8 space-y-6 border border-slate-200">
              {/* Dynamic Pricing Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs uppercase font-bold text-primary-700 tracking-wider">
                    Authoritative Plan
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {settings?.display_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Validity: <strong className="text-slate-800">{validityDays} Days</strong> &bull; Renewal policy:{' '}
                    <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">
                      {settings?.renewal_policy}
                    </span>
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Configured Fee</p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    ₹{priceInr}
                    <span className="text-xs font-semibold text-slate-500 ml-1">/ {validityDays} days</span>
                  </p>
                </div>
              </div>

              {/* Dynamic Benefits List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-slate-700 tracking-wider">
                  Configured Member Privileges
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {(settings?.benefits || []).map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {!settings?.enabled ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> New Purchases Disabled
                    </p>
                    <p className="mt-1">
                      Platform administration has temporarily paused new membership enrollments. Existing active memberships remain fully functional.
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full font-bold shadow-md shadow-primary-900/10 justify-center text-base"
                      onClick={handlePurchaseOrRenew}
                      disabled={purchasing || (status && !status.can_renew)}
                      leftIcon={purchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    >
                      {purchasing
                        ? 'Opening Razorpay Checkout...'
                        : isCurrentlyActive
                        ? `Renew Membership (₹${priceInr})`
                        : isExpired
                        ? `Renew Expired Membership (₹${priceInr})`
                        : `Get Membership Card (₹${priceInr})`}
                    </Button>

                    {status && !status.can_renew && (
                      <p className="text-xs text-amber-700 font-medium text-center">
                        {status.renewal_message}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400 text-center">
                      Authoritative pricing loaded live from MongoDB &bull; Secured with Razorpay Test Mode
                    </p>
                  </>
                )}
              </div>
            </Card>

            {/* Customer Periods & Purchase History Toggle */}
            {isAuthenticated && history.length > 0 && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary-600" /> Membership Periods & Purchase History ({history.length})
                  </span>
                  <span className="text-xs text-primary-700 font-semibold">
                    {showHistory ? 'Hide History' : 'View History'}
                  </span>
                </button>

                {showHistory && (
                  <Card className="p-4 overflow-hidden border border-slate-200">
                    <div className="divide-y divide-slate-100">
                      {history.map((h) => (
                        <div key={h.purchase_id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{h.purchase_id}</span>
                            <p className="text-slate-500 text-[11px]">
                              {formatDate(h.period_start || h.created_at)} &rarr; {formatDate(h.period_end)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">₹{(h.amount_paise / 100).toFixed(2)}</span>
                            <span
                              className={`block text-[10px] font-bold uppercase ${
                                h.status === 'PAID' ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {h.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
