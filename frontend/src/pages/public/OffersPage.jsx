import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Truck,
  Award,
  Cookie,
  RefreshCw,
  Gift,
} from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';

export default function OffersPage() {
  const [offersData, setOffersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/promotions/offers');
        setOffersData(res.data || res);
      } catch (err) {
        console.error('Failed to load active promotions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const coupons = offersData?.coupons || [];
  const membership = offersData?.membership;
  const cookey = offersData?.cookey;
  const defense = offersData?.defense;
  const shipping = offersData?.shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-50 text-accent-700 text-xs font-bold uppercase tracking-wider border border-accent-200">
          <Sparkles className="w-4 h-4 text-accent-500" />
          <span>Verified Athlete Rewards & Promotions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
          Active Offers & Exclusive Rewards.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Enjoy genuine discounts, member privileges, and verified defense honors. All calculations are backend-authoritative and applied securely during checkout.
        </p>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
          <p className="text-sm">Retrieving active campaign offers from server...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* 1. Active Coupons Strip */}
          {coupons.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-accent-500" />
                <h2 className="text-xl font-black text-slate-900">Featured Discount Codes</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coupons.map((coupon, idx) => (
                  <div
                    key={idx}
                    className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-primary-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-black uppercase tracking-wider">
                          {coupon.discount_percent}% OFF
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Min. Order ₹{coupon.min_order_rupees}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-white font-display">
                        {coupon.description || 'Festive Savings Discount'}
                      </h3>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Max savings up to ₹{coupon.max_discount_rupees} per order. Valid across cricket gear, fitness accessories, and match apparel.
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                      <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 font-mono font-bold text-lg text-accent-300">
                        {coupon.code}
                      </div>

                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                          copiedCode === coupon.code
                            ? 'bg-emerald-600 text-white'
                            : 'bg-accent-500 hover:bg-accent-600 text-white'
                        }`}
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="w-4 h-4" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Structured Programs & Benefits Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900">Member Privileges & Community Programs</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Membership Card */}
              {membership && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{membership.title}</h3>
                      <p className="text-2xl font-black text-amber-600 mt-1">₹{membership.card_fee_rupees}</p>
                      <p className="text-xs text-slate-500 font-medium">Valid for {membership.validity_days} days</p>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{membership.joining_cashback_percent}% instant joining cashback</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Exclusive member pricing across all gear</span>
                      </li>
                    </ul>
                  </div>

                  <Link to="/membership" className="mt-6 block">
                    <Button variant="outline" size="md" className="w-full text-xs font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Explore Membership
                    </Button>
                  </Link>
                </div>
              )}

              {/* Cookey Pass Card */}
              {cookey && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      <Cookie className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{cookey.title}</h3>
                      <p className="text-2xl font-black text-orange-600 mt-1">₹{cookey.price_rupees}</p>
                      <p className="text-xs text-slate-500 font-medium">Weekly pass redemption</p>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Weekly athletic gear prize draws</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Direct token redemption at checkout</span>
                      </li>
                    </ul>
                  </div>

                  <Link to="/cookey" className="mt-6 block">
                    <Button variant="outline" size="md" className="w-full text-xs font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Get Cookey Tokens
                    </Button>
                  </Link>
                </div>
              )}

              {/* Armed Forces Card */}
              {defense && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{defense.title}</h3>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{defense.discount_percent}% Extra OFF</p>
                      <p className="text-xs text-slate-500 font-medium">For Defense, Veterans & Police</p>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Honoring Indian Armed Forces personnel</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Stackable with active cart discounts</span>
                      </li>
                    </ul>
                  </div>

                  <Link to="/army-offer" className="mt-6 block">
                    <Button variant="outline" size="md" className="w-full text-xs font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      View Armed Forces Offer
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 3. Free Delivery Banner */}
          {shipping && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 text-accent-600 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Free Express Delivery on Orders Over ₹{shipping.free_delivery_threshold_rupees}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard delivery is ₹{shipping.standard_delivery_fee_rupees}. Automatically calculated by backend order verification.
                  </p>
                </div>
              </div>

              <Link to="/catalogue">
                <Button variant="primary" size="sm" className="bg-primary-950 text-white hover:bg-primary-900 shrink-0">
                  Shop Store Catalog
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
