import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { QrCode, Shield, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { membershipService } from '../../services/membershipService';

export default function CardPage() {
  const { user } = useAuthStore();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    membershipService
      .getStatus()
      .then((data) => {
        if (isMounted) setMembership(data);
      })
      .catch(() => {
        if (isMounted) setMembership(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isActive = membership?.is_active || user?.has_membership;
  const cardNumber =
    membership?.card_number ||
    (user?.referral_code ? `BC-${user.referral_code}` : `BC-${user?.id?.slice(-8).toUpperCase() || 'MEMBER'}`);

  const formattedExpiry = membership?.valid_till
    ? new Date(membership.valid_till).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : isActive
    ? 'Active Annual Pass'
    : 'Not Active';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <PageHeader
        title="Digital Membership Pass"
        description="Your official BIGCHAMP athletic credential. Present for store privileges, partner clinics, and sports dormitory access."
        backLink="/store"
        backText="Back to Store"
      />

      {loading ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary-900 mx-auto" />
          <p className="text-xs text-slate-500">Retrieving pass status...</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-6">
          {/* Digital Card Pass */}
          <div
            className={`rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-white transition-all ${
              isActive
                ? 'bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 border border-primary-800'
                : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 opacity-90'
            }`}
          >
            {/* Background shimmer */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-accent-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-500 text-white font-black text-sm flex items-center justify-center">
                  BC
                </div>
                <span className="font-extrabold text-xl tracking-tight font-display">
                  BIG<span className="text-accent-400">CHAMP</span>
                </span>
              </div>

              <div
                className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isActive ? (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Verified Pass</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Free Account</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Cardholder
                </p>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {user?.full_name || 'Valued Athlete'}
                </h3>
                <p className="text-xs font-mono text-accent-400 mt-1">{cardNumber}</p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Valid Till
                </p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{formattedExpiry}</p>
                {membership?.remaining_days > 0 && (
                  <p className="text-[10px] text-emerald-400 font-medium">
                    {membership.remaining_days} days remaining
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <Card className="p-8 text-center space-y-5">
            {isActive ? (
              <>
                <div className="w-52 h-52 mx-auto bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xl">
                  <QrCode className="w-32 h-32 text-slate-950" />
                  <span className="text-[11px] font-mono text-slate-800 mt-2 font-bold tracking-wider">
                    {cardNumber}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                    Dynamic Security QR
                  </h4>
                  <p className="text-xs text-slate-400">
                    Scan for immediate check-in at verified partner sports facilities.
                  </p>
                </div>
              </>
            ) : (
              <div className="py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white font-display">Digital Pass Not Active</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Activate your BIGCHAMP Digital Pass to unlock instant store discounts, dynamic QR check-ins, and weekly Cookey vouchers.
                  </p>
                </div>
                <Link to="/membership" className="inline-block pt-2">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Activate Membership Pass
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
