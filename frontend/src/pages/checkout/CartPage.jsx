import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Tag,
  Check,
  AlertCircle,
  ShieldCheck,
  Percent,
  Info,
  Loader2,
  Package,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCartStore } from '../../store/cartStore';
import couponService from '../../services/couponService';
import api from '../../services/api';

export default function CartPage() {
  const { items, getTotal, getCount, updateQty, removeItem } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [businessRules, setBusinessRules] = useState(null);
  const [availableOffers, setAvailableOffers] = useState(null);

  const subtotalPaise = getTotal();

  useEffect(() => {
    async function fetchRulesAndOffers() {
      try {
        const [settingsRes, offersRes] = await Promise.allSettled([
          api.get('/settings/public'),
          api.get('/promotions/offers'),
        ]);
        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.business_rules) {
          setBusinessRules(settingsRes.value.data.business_rules);
        }
        if (offersRes.status === 'fulfilled') {
          setAvailableOffers(offersRes.value.data);
        }
      } catch (err) {
        // Fallback default
      }
    }
    fetchRulesAndOffers();
  }, []);

  // If cart items or quantities change, re-validate or adjust the applied coupon
  useEffect(() => {
    if (!appliedCoupon) return;

    if (items.length === 0) {
      setAppliedCoupon(null);
      setCouponError('');
      return;
    }

    const revalidate = async () => {
      try {
        const payload = {
          code: appliedCoupon.code,
          items: items.map((i) => ({
            product_id: i.productId,
            category: i.category,
            price_paise: i.price || 0,
            qty: i.qty || 1,
          })),
          subtotal_paise: subtotalPaise,
        };
        const res = await couponService.validateCoupon(payload);
        if (res.valid) {
          setAppliedCoupon({
            code: res.code,
            name: res.name,
            discount_type: res.discount_type,
            discount_paise: res.discount_paise,
            final_total_paise: res.final_total_paise,
            savings_text: res.savings_text,
          });
          setCouponError('');
        } else {
          setAppliedCoupon(null);
          setCouponError(res.reason || 'Coupon is no longer eligible for current cart items.');
        }
      } catch (err) {
        setAppliedCoupon(null);
        setCouponError(err.response?.data?.detail?.reason || err.response?.data?.detail || 'Coupon revalidation failed.');
      }
    };

    revalidate();
  }, [items, subtotalPaise]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const payload = {
        code: cleanCode,
        items: items.map((i) => ({
          product_id: i.productId,
          category: i.category,
          price_paise: i.price || 0,
          qty: i.qty || 1,
        })),
        subtotal_paise: subtotalPaise,
      };

      const res = await couponService.validateCoupon(payload);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          name: res.name,
          discount_type: res.discount_type,
          discount_paise: res.discount_paise,
          final_total_paise: res.final_total_paise,
          savings_text: res.savings_text,
        });
        setCouponCode('');
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(res.reason || 'Coupon code is invalid or not applicable.');
      }
    } catch (err) {
      setAppliedCoupon(null);
      const msg =
        err.response?.data?.detail?.reason ||
        err.response?.data?.detail ||
        'Unable to apply coupon. Please check code and try again.';
      setCouponError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplySpecificCode = async (code) => {
    setCouponCode(code);
    setCouponError('');
    setCouponLoading(true);
    try {
      const payload = {
        code: code,
        items: items.map((i) => ({
          product_id: i.productId,
          category: i.category,
          price_paise: i.price || 0,
          qty: i.qty || 1,
        })),
        subtotal_paise: subtotalPaise,
      };
      const res = await couponService.validateCoupon(payload);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          name: res.name,
          discount_type: res.discount_type,
          discount_paise: res.discount_paise,
          final_total_paise: res.final_total_paise,
          savings_text: res.savings_text,
        });
        setCouponCode('');
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(res.reason || 'Coupon code is not applicable for this cart.');
      }
    } catch (err) {
      setAppliedCoupon(null);
      const msg =
        err.response?.data?.detail?.reason ||
        err.response?.data?.detail ||
        'Unable to apply coupon.';
      setCouponError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const discountPaise = appliedCoupon ? appliedCoupon.discount_paise : 0;
  const standardDelivery = businessRules?.standard_delivery_charge_paise ?? 0;
  const freeThreshold = businessRules?.free_delivery_threshold_paise ?? 50000;
  const deliveryChargePaise = standardDelivery > 0 && subtotalPaise < freeThreshold ? standardDelivery : 0;
  const taxPercent = businessRules?.tax_percent ?? 0;
  const taxableAmount = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = taxPercent > 0 ? Math.round(taxableAmount * (taxPercent / 100)) : 0;
  const finalPayablePaise = Math.max(0, subtotalPaise - discountPaise + deliveryChargePaise + taxPaise);

  const minOrderValuePaise = businessRules?.min_order_value_paise ?? 0;
  const isBelowMinOrder = minOrderValuePaise > 0 && subtotalPaise < minOrderValuePaise;
  const maxItemsPerOrder = businessRules?.max_items_per_order ?? 50;
  const totalItemCount = items.reduce((sum, i) => sum + (i.qty || 1), 0);
  const exceedsMaxItems = totalItemCount > maxItemsPerOrder;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
        <p className="text-sm text-slate-600 mt-1">
          Review items, apply authoritative discount coupons, and verify your order total.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Explore our sports catalog and Cookey member specials to add items to your cart."
            action={
              <Link to="/store">
                <Button variant="primary" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                  Explore Store Catalog
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items Table / List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border border-slate-200">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">
                  Cart Items ({getCount()})
                </span>
                <Link to="/store" className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const unitPrice = (item.price || 0) / 100;
                  const itemTotal = (unitPrice * (item.qty || 1));

                  return (
                    <div key={item.productId} className="p-4 flex flex-col sm:flex-row items-center gap-4">
                      {/* Product Thumbnail */}
                      <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-8 h-8 text-slate-300" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                        {item.category && (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                        <p className="text-xs text-slate-600 mt-1">
                          ₹{unitPrice.toFixed(2)} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, (item.qty || 1) - 1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-xs font-bold text-slate-800 min-w-8 text-center">
                          {item.qty || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, (item.qty || 1) + 1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total & Remove */}
                      <div className="text-right shrink-0 min-w-[80px]">
                        <p className="font-extrabold text-slate-900 text-sm">
                          ₹{itemTotal.toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-semibold mt-1 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Member Protection & Trust Banner */}
            <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-100 flex items-center gap-3 text-xs text-primary-950">
              <ShieldCheck className="w-6 h-6 text-primary-700 shrink-0" />
              <div>
                <p className="font-bold">Authoritative Pricing & Member Benefits</p>
                <p className="text-primary-800 mt-0.5">
                  All coupon eligibility checks and discounts are computed authoritatively on the BIGCHAMP backend.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon Validation */}
          <div className="space-y-4">
            <Card className="p-6 space-y-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              {/* Coupon Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary-600" /> Apply Coupon / Voucher
                </label>

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 uppercase font-mono text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </form>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-extrabold text-xs text-emerald-900 uppercase">
                          {appliedCoupon.code}
                        </span>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {appliedCoupon.savings_text || appliedCoupon.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{couponError}</span>
                  </div>
                )}

                {/* Available Active Offers Quick-Apply */}
                {!appliedCoupon && availableOffers?.coupons?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Store Offers
                    </span>
                    {availableOffers.coupons.map((c) => (
                      <div
                        key={c.code}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-primary-900">{c.code}</span>
                          <span className="text-slate-500 ml-1.5 font-medium">
                            {c.discount_percent}% off (min ₹{c.min_order_rupees})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplySpecificCode(c.code)}
                          disabled={couponLoading}
                          className="text-[11px] font-bold text-accent-600 hover:text-accent-700 bg-white border border-accent-200 px-2 py-0.5 rounded shadow-2xs hover:bg-accent-50"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ₹{(subtotalPaise / 100).toFixed(2)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> Coupon Discount ({appliedCoupon.code})
                    </span>
                    <span>-₹{(discountPaise / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Standard Shipping</span>
                  {deliveryChargePaise === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    <span className="font-semibold text-slate-800">₹{(deliveryChargePaise / 100).toFixed(2)}</span>
                  )}
                </div>

                {taxPaise > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax / GST ({taxPercent}%)</span>
                    <span className="font-semibold text-slate-800">₹{(taxPaise / 100).toFixed(2)}</span>
                  </div>
                )}

                {isBelowMinOrder && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Minimum order subtotal is ₹{(minOrderValuePaise / 100).toFixed(2)} to checkout.</span>
                  </div>
                )}

                {exceedsMaxItems && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Cart has {totalItemCount} items, exceeding platform maximum of {maxItemsPerOrder}.</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-900 text-base">Estimated Payable</span>
                  <span className="font-extrabold text-2xl text-primary-950">
                    ₹{(finalPayablePaise / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Action */}
              <div className="pt-2">
                <Link
                  to={isBelowMinOrder || exceedsMaxItems ? '#' : (appliedCoupon ? `/checkout?coupon=${appliedCoupon.code}` : '/checkout')}
                  className="block"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={isBelowMinOrder || exceedsMaxItems}
                    className="w-full font-bold shadow-md shadow-primary-900/10"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>

              {/* Razorpay Sandbox Checkout Note */}
              <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 text-[11px] text-primary-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Secure Checkout:</strong> Bigchamp Razorpay Sandbox payment gateway is active for testing. Instant order confirmation upon successful payment.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
