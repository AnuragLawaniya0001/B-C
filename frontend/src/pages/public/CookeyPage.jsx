import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Gift, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function CookeyPage() {
  const { getBusinessRules, fetchSettings } = useSettingsStore();
  const { isAuthenticated, user } = useAuthStore();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);

  const rules = getBusinessRules();
  const cookeyPrice = Math.round((rules.cookey_price_paise || 10000) / 100);
  const cooldownDays = rules.cookey_cooldown_days || 7;
  const maxPerWeek = rules.cookey_max_per_week || 1;
  const prizeAmount = Math.round((rules.lucky_draw_prize_paise || 50000) / 100);

  useEffect(() => {
    fetchSettings();
    if (isAuthenticated) {
      setLoading(true);
      api
        .get('/products/cookey/eligibility')
        .then((res) => setEligibility(res.data || res))
        .catch(() => setEligibility(null))
        .finally(() => setLoading(false));
    }
  }, [fetchSettings, isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold uppercase tracking-wider border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Member Special Privilege</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          BIGCHAMP Cookey Token Program
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          The Cookey is an exclusive token available to active BIGCHAMP digital passholders. Acquire weekly tokens, accumulate reward points, and participate in verified athletic gear drawings.
        </p>
      </div>

      {/* Privilege Status Card */}
      <Card className="p-6 sm:p-8 border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Token Price
            </span>
            <div className="text-3xl font-black text-slate-900 mt-0.5">
              ₹{cookeyPrice} <span className="text-xs font-normal text-slate-500">per token</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Purchase Cycle
            </span>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              Limit: {maxPerWeek} per week ({cooldownDays}-day cooldown)
            </div>
          </div>
        </div>

        {/* Member Eligibility Assessment */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Your Eligibility Status</h3>
          {!isAuthenticated ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Please sign in with your member account to evaluate weekly eligibility.</span>
              </div>
              <Link to="/login?redirect=/cookey">
                <Button size="sm" variant="outline">Sign In</Button>
              </Link>
            </div>
          ) : user?.has_membership ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active Member Passholder Verified</span>
              </div>
              <p className="text-emerald-800">
                {eligibility?.can_purchase
                  ? 'You are currently eligible to purchase this week’s Cookey token.'
                  : eligibility?.message || 'Weekly token cooldown is active.'}
              </p>
              <Link to="/store" className="inline-block pt-1">
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                  View in Store Catalog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Membership Required</span>
              </div>
              <p className="text-amber-800">
                Cookey tokens are exclusively reserved for verified BIGCHAMP Digital Passholders.
              </p>
              <Link to="/membership" className="inline-block pt-1">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Activate Membership
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Program Rules */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Rules & Operational Safeguards
          </h3>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary-900 font-bold">•</span>
              <span>Purchase is strictly restricted to one token per active member every {cooldownDays} days.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-900 font-bold">•</span>
              <span>All purchases are recorded authoritatively in the backend ledger.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-900 font-bold">•</span>
              <span>Lucky Draw distributions remain subject to verified regulatory approval.</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
