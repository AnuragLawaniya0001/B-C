import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Truck,
  RefreshCw,
  ShoppingBag,
  Percent,
  Clock,
  ShieldCheck,
  Layers,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import couponService from '../../services/couponService';
import { Button } from '../../components/ui/Button';

export default function OffersPage() {
  const [coupons, setCoupons] = useState([]);
  const [shipping, setShipping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        // Fetch authoritative promotions and active coupons
        const res = await api.get('/promotions/offers');
        const data = res.data || res;

        if (data?.coupons && data.coupons.length > 0) {
          setCoupons(data.coupons);
        } else {
          // Fallback to direct active coupons endpoint
          const directCoupons = await couponService.getActiveCoupons();
          if (Array.isArray(directCoupons)) {
            setCoupons(directCoupons.map((c) => ({
              ...c,
              min_order_rupees: c.min_order_paise ? Math.round(c.min_order_paise / 100) : 0,
              max_discount_rupees: c.max_discount_paise ? Math.round(c.max_discount_paise / 100) : null,
              discount_display:
                c.discount_type === 'PERCENTAGE' || c.discount_type === 'PERCENT'
                  ? `${c.discount_value}% OFF`
                  : `₹${Math.round((c.discount_value || 0) / 100)} OFF`,
            })));
          }
        }

        if (data?.shipping) {
          setShipping(data.shipping);
        }
      } catch (err) {
        console.error('Failed to load active promotions:', err);
        try {
          // Attempt fallback
          const directCoupons = await couponService.getActiveCoupons();
          if (Array.isArray(directCoupons)) {
            setCoupons(directCoupons.map((c) => ({
              ...c,
              min_order_rupees: c.min_order_paise ? Math.round(c.min_order_paise / 100) : 0,
              max_discount_rupees: c.max_discount_paise ? Math.round(c.max_discount_paise / 100) : null,
              discount_display:
                c.discount_type === 'PERCENTAGE' || c.discount_type === 'PERCENT'
                  ? `${c.discount_value}% OFF`
                  : `₹${Math.round((c.discount_value || 0) / 100)} OFF`,
            })));
          }
        } catch (fbErr) {
          console.error('Fallback coupon load failed:', fbErr);
        }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Active Store Offers & Discounts</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
          Exclusive Offers & Coupons
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          All offers and discount codes below are configured live by the Bigchamp store team. Apply any code at checkout or in your cart to instantly deduct savings from your order.
        </p>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
            <p className="text-sm text-slate-400">Loading active offers from server...</p>
          </div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <Tag className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Active Offers Right Now</h3>
          <p className="text-sm text-slate-400">
            Check back soon! New season discounts and festive promotional coupon codes will be published here.
          </p>
          <Link to="/store" className="inline-block pt-2">
            <Button variant="primary" leftIcon={<ShoppingBag className="w-4 h-4" />}>
              Explore Store
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Active Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {coupons.map((coupon) => {
              const isCopied = copiedCode === coupon.code;
              const discountDisplay =
                coupon.discount_display ||
                (coupon.discount_type === 'PERCENTAGE' || coupon.discount_type === 'PERCENT'
                  ? `${coupon.discount_value}% OFF`
                  : `₹${coupon.discount_value ? (coupon.discount_value / 100).toFixed(0) : 0} OFF`);

              const minOrderRupees =
                coupon.min_order_rupees !== undefined
                  ? coupon.min_order_rupees
                  : coupon.min_order_paise
                  ? Math.round(coupon.min_order_paise / 100)
                  : 0;

              const maxDiscountRupees =
                coupon.max_discount_rupees !== undefined
                  ? coupon.max_discount_rupees
                  : coupon.max_discount_paise
                  ? Math.round(coupon.max_discount_paise / 100)
                  : null;

              const hasCategories =
                Array.isArray(coupon.applicable_categories) && coupon.applicable_categories.length > 0;

              return (
                <div
                  key={coupon.id || coupon.code}
                  className="relative group bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-amber-400/40 transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between shadow-xl overflow-hidden"
                >
                  {/* Subtle luxury glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

                  <div className="space-y-4">
                    {/* Header Row: Badge & Type */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                            Verified Promo Offer
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-display line-clamp-1">
                            {coupon.name || coupon.code}
                          </h3>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        {discountDisplay}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                      {coupon.description || 'Applicable across sports apparel, performance gear, and training gear.'}
                    </p>

                    {/* Limits & Rules Table */}
                    <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Minimum Order:</span>
                        <span className="font-semibold text-slate-200">
                          {minOrderRupees > 0 ? `₹${minOrderRupees}` : 'No Minimum'}
                        </span>
                      </div>

                      {maxDiscountRupees && (
                        <div className="flex items-center justify-between">
                          <span>Max Discount Cap:</span>
                          <span className="font-semibold text-slate-200">₹{maxDiscountRupees}</span>
                        </div>
                      )}

                      {hasCategories && (
                        <div className="flex items-center justify-between">
                          <span>Applicable Categories:</span>
                          <span className="font-semibold text-amber-300">
                            {coupon.applicable_categories.join(', ')}
                          </span>
                        </div>
                      )}

                      {coupon.end_date && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Valid Till:
                          </span>
                          <span className="font-medium text-slate-200">
                            {new Date(coupon.end_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions: Code & Copy / Shop */}
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-3 bg-slate-950/70 border border-white/10 rounded-2xl p-2.5">
                      <div className="px-2 font-mono font-black text-base sm:text-lg text-amber-400 tracking-wider">
                        {coupon.code}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/store?coupon=${coupon.code}`} className="flex-1">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs font-bold"
                          rightIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                        >
                          Shop Now
                        </Button>
                      </Link>

                      <Link to={`/cart?coupon=${coupon.code}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/15 text-white hover:bg-white/10 text-xs font-bold"
                        >
                          Apply
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Incentive Banner */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base sm:text-lg">
                  Free Express Delivery on Orders Over ₹
                  {shipping?.free_delivery_threshold_rupees || 500}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Fast, 100% insured delivery across India. Standard delivery is ₹
                  {shipping?.standard_delivery_fee_rupees || 40}. Discounts and delivery waivers are automatically calculated at checkout.
                </p>
              </div>
            </div>

            <Link to="/store" className="shrink-0 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Browse Store Gear
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
