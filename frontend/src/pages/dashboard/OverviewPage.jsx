import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  CreditCard,
  Wallet,
  Cookie,
  ShoppingBag,
  ArrowRight,
  Shield,
  Clock,
  Building,
  Activity,
  Award,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/shared/PageHeader';
import { useAuthStore } from '../../store/authStore';

export default function OverviewPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const hasMembership = user?.has_membership === true;

  const handleGetCardClick = () => {
    toast('Membership Card purchase is launching in Prompt #6!', {
      icon: '💎',
    });
    navigate('/membership');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hi, {user?.full_name || 'Champion'}
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Welcome to your Bigchamp account hub. Track your sports orders and privileges.
          </p>
        </div>

        <div>
          {hasMembership ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs">
              <span>💎</span> Active Member
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              Free Account
            </span>
          )}
        </div>
      </div>

      {/* NON-MEMBER FREE USER UPSELL BANNER */}
      {!hasMembership ? (
        <div className="rounded-2xl bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-primary-800 relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/20 text-accent-400 border border-accent-500/30 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Platform Privileges</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              💎 Unlock Full Access with ₹100 Membership Card
            </h2>
            <p className="text-sm text-slate-300 mt-2 mb-6">
              As a free user, you can browse and buy sports products. Upgrade to a 334-day Bigchamp card to unlock athlete stays, physio clinics, weekly lucky draws, and wallet cashback!
            </p>

            {/* Privilege Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <span className="text-accent-400 text-base font-bold">✓</span>
                <span>Dormitory athlete stays across Indian cities</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <span className="text-accent-400 text-base font-bold">✓</span>
                <span>Priority physio rehab clinic access</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <span className="text-accent-400 text-base font-bold">✓</span>
                <span>Exclusive Cookey product (weekly ₹500 lucky draw)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <span className="text-accent-400 text-base font-bold">✓</span>
                <span>₹10 instant cashback + digital wallet</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <span className="text-accent-400 text-base font-bold">✓</span>
                <span>10% extra discount for Army / Defense personnel</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <span className="text-accent-400 text-base font-bold">✓</span>
                <span>Digital QR Card for partner check-in</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleGetCardClick}
              className="font-bold text-sm shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Membership Card — ₹100
            </Button>
          </div>
        </div>
      ) : (
        /* MEMBER ACTIVE WIDGETS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-primary-900">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary-900" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Card Status</p>
                <p className="text-lg font-bold text-slate-900">Active Member</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Wallet Balance</p>
                <p className="text-lg font-bold text-slate-900">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-accent-500">
            <div className="flex items-center gap-3">
              <Cookie className="w-8 h-8 text-accent-500" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Cookey Status</p>
                <p className="text-lg font-bold text-slate-900">Eligible</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-sky-600">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-sky-600" />
              <div>
                <p className="text-xs text-slate-500 font-medium">My Orders</p>
                <p className="text-lg font-bold text-slate-900">0 Active</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/store"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-600 transition-all hover:shadow-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-900 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Browse Store</h3>
          <p className="text-xs text-slate-500 mt-1">
            Shop cricket bats, jerseys, footballs, and premium sports gear.
          </p>
        </Link>

        <Link
          to="/dashboard/orders"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-600 transition-all hover:shadow-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-900 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">My Orders</h3>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time shipment updates, invoices, and purchase history.
          </p>
        </Link>

        <Link
          to="/dashboard/profile"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-600 transition-all hover:shadow-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-900 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Profile & Settings</h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal contact details, security, and addresses.
          </p>
        </Link>
      </div>
    </div>
  );
}
