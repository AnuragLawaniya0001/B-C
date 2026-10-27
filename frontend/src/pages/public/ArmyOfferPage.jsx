import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

export default function ArmyOfferPage() {
  const { getBusinessRules, fetchSettings } = useSettingsStore();
  const { isAuthenticated, user } = useAuthStore();
  const rules = getBusinessRules();
  const armyDiscount = rules.army_extra_discount_percent || 10;

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isArmyVerified = user?.is_army && user?.army_verified;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold uppercase tracking-wider border border-emerald-200">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Honoring Armed Forces & Veterans</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          Indian Armed Forces Privilege Program
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          BIGCHAMP proudly honors active personnel, veterans, and defense dependents of the Indian Armed Forces and Para-Military with an extra {armyDiscount}% discount across all sports gear, equipment, and apparel.
        </p>
      </div>

      {/* Main Benefit Showcase */}
      <Card className="p-6 sm:p-8 border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Exclusive Defense Discount
            </span>
            <div className="text-3xl font-black text-slate-900 mt-0.5">
              +{armyDiscount}% Extra Off <span className="text-xs font-normal text-slate-500">applied at checkout</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Eligibility
            </span>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              Army • Navy • Air Force • Para-Military
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Verification Status</h3>
          {!isAuthenticated ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-4">
              <span>Sign in to verify your defense status and activate your extra {armyDiscount}% discount.</span>
              <Link to="/login?redirect=/army-offer">
                <Button size="sm" variant="outline">Sign In</Button>
              </Link>
            </div>
          ) : isArmyVerified ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Defense Credentials Verified</span>
              </div>
              <p className="text-emerald-800">
                Your account is verified for the {armyDiscount}% Armed Forces discount. Savings will automatically apply during checkout.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">Defense Verification Pending</p>
              <p>
                To prevent misuse, defense discounts require verified service documentation. Submit your official credentials through our verified KYC channel or contact our verification desk.
              </p>
              <Link to="/register/kyc" className="inline-block pt-1">
                <Button size="sm" variant="outline">
                  Submit Verification Documents
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <span className="font-bold text-slate-900 block">1. Register Account</span>
              <p>Sign up with your mobile number or defense email address.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <span className="font-bold text-slate-900 block">2. Verify Credentials</span>
              <p>Submit your service identity through our encrypted upload desk.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <span className="font-bold text-slate-900 block">3. Enjoy Savings</span>
              <p>Get an extra {armyDiscount}% off automatically calculated at checkout.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
