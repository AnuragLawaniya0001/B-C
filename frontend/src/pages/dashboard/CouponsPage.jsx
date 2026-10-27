import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Ticket,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  Percent,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import couponService from '../../services/couponService';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await couponService.getActiveCoupons();
        setCoupons(res.items || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load promotional offers.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <PageHeader
        title="Promotions & Discount Vouchers"
        description="Exclusive member discounts, seasonal offers, and coupon codes for Bigchamp store orders."
        backLink="/store"
      />

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Loading active offers...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="p-8 text-center space-y-3 bg-slate-900/80 border-white/10">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-white">Unable to load offers</h3>
          <p className="text-xs text-slate-400">{error}</p>
        </Card>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No active coupons currently"
          description="Check back soon for festival campaigns, member rewards, and seasonal sports gear vouchers."
          action={
            <Link to="/store">
              <Button variant="primary" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                Explore Store
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c) => {
            const isCopied = copiedCode === c.code;
            const minOrder = c.min_order_paise ? (c.min_order_paise / 100).toFixed(0) : 0;
            const maxCap = c.max_discount_paise ? (c.max_discount_paise / 100).toFixed(0) : null;
            const discountDisplay =
              c.discount_type === 'PERCENTAGE' || c.discount_type === 'PERCENT'
                ? `${c.discount_value}% OFF`
                : `₹${(c.discount_value / 100).toFixed(0)} OFF`;

            return (
              <Card
                key={c._id || c.code}
                className="overflow-hidden border border-white/10 bg-slate-900/80 hover:border-amber-500/40 backdrop-blur-xl transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Header Badge & Code */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-mono font-extrabold text-base text-white tracking-wider">
                          {c.code}
                        </h3>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">{c.name}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {discountDisplay}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {c.description || 'Applicable across sports apparel, gear, and training accessories.'}
                  </p>

                  {/* Terms & Rules */}
                  <div className="space-y-1.5 pt-3 border-t border-white/10 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Min Order:</span>
                      <span className="font-semibold text-slate-200">₹{minOrder}</span>
                    </div>
                    {maxCap && (
                      <div className="flex items-center justify-between">
                        <span>Max Discount Cap:</span>
                        <span className="font-semibold text-slate-200">₹{maxCap}</span>
                      </div>
                    )}
                    {c.end_date && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Valid Till:
                        </span>
                        <span className="font-medium text-slate-200">
                          {new Date(c.end_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-950/60 border-t border-white/10 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isCopied ? 'primary' : 'secondary'}
                    onClick={() => handleCopy(c.code)}
                    className={`flex-1 font-bold ${
                      isCopied ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                    leftIcon={isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {isCopied ? 'Copied!' : 'Copy Code'}
                  </Button>

                  <Link to="/store">
                    <Button size="sm" variant="primary" leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}>
                      Shop
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
