import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Tag,
  Check,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import orderService from '../../services/orderService';
import couponService from '../../services/couponService';
import paymentService from '../../services/paymentService';
import api from '../../services/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [address, setAddress] = useState({
    full_name: user?.name || '',
    phone: user?.mobile || '',
    street_address: '',
    city: '',
    state: '',
    pin_code: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') || '');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendingOrder, setPendingOrder] = useState(null);
  const [businessRules, setBusinessRules] = useState(null);
  const [idempotencyKey] = useState(
    () => `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    paymentService.loadRazorpayScript();
    async function fetchRules() {
      try {
        const res = await api.get('/settings/public');
        const data = res.data || res;
        if (data?.business_rules) {
          setBusinessRules(data.business_rules);
        }
      } catch (err) {
        // Fallback
      }
    }
    fetchRules();
  }, []);

  const subtotalPaise = getTotal();

  // Validate coupon if provided via query or entered
  const handleValidateCoupon = async (codeToValidate) => {
    const clean = (codeToValidate || couponCode).trim().toUpperCase();
    if (!clean) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const payload = {
        code: clean,
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
          discount_paise: res.discount_paise,
          savings_text: res.savings_text,
        });
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(res.reason || res.message || 'Coupon code not applicable');
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(
        err.response?.data?.detail?.reason ||
        err.response?.data?.detail ||
        'Failed to apply coupon'
      );
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    const initialCoupon = searchParams.get('coupon');
    if (initialCoupon && items.length > 0) {
      handleValidateCoupon(initialCoupon);
    }
  }, [items.length]);

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

  const validateForm = () => {
    const errors = {};
    if (!address.full_name.trim()) errors.full_name = 'Full name is required';
    if (!address.phone.trim() || address.phone.trim().length < 10)
      errors.phone = 'Valid 10-digit mobile number required';
    if (!address.street_address.trim()) errors.street_address = 'Street address is required';
    if (!address.city.trim()) errors.city = 'City is required';
    if (!address.state.trim()) errors.state = 'State is required';
    if (!address.pin_code.trim() || address.pin_code.trim().length < 4)
      errors.pin_code = 'Valid PIN code required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.productId || i.slug,
          qty: i.qty || 1,
        })),
        delivery_address: {
          full_name: address.full_name.trim(),
          phone: address.phone.trim(),
          street_address: address.street_address.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pin_code: address.pin_code.trim(),
        },
        coupon_code: appliedCoupon?.code || null,
        idempotency_key: idempotencyKey,
        notes: address.notes.trim() || null,
      };

      let order = pendingOrder;
      if (!order) {
        order = await orderService.createOrder(payload);
        setPendingOrder(order);
      }

      // Open Razorpay Checkout Modal
      await paymentService.openRazorpayCheckout({
        order,
        user,
        onSuccess: () => {
          clearCart();
          setIsSubmitting(false);
          navigate(`/checkout/success?order_number=${order.order_number}`);
        },
        onError: (errMsg) => {
          setIsSubmitting(false);
          setSubmitError(
            `Order #${order.order_number} is saved in Pending Payment, but payment could not be finalized: ${errMsg}`
          );
        },
        onDismiss: () => {
          setIsSubmitting(false);
          setSubmitError(
            `Payment window closed for Order #${order.order_number}. Your order is saved in Pending Payment. Click below to retry payment or view in Orders.`
          );
        },
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Failed to place order. Please review your cart and retry.';
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  const handleRetryPayment = async (orderToPay) => {
    const target = orderToPay || pendingOrder;
    if (!target) return;

    setIsSubmitting(true);
    setSubmitError('');

    await paymentService.openRazorpayCheckout({
      order: target,
      user,
      onSuccess: () => {
        clearCart();
        setIsSubmitting(false);
        navigate(`/checkout/success?order_number=${target.order_number}`);
      },
      onError: (errMsg) => {
        setIsSubmitting(false);
        setSubmitError(`Payment failed: ${errMsg}`);
      },
      onDismiss: () => {
        setIsSubmitting(false);
        setSubmitError(`Payment window closed. Order #${target.order_number} remains in Pending Payment.`);
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-primary-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Sign in to complete checkout</h2>
          <p className="text-xs text-slate-500">
            Please login or create your free Bigchamp account to save shipping addresses and access member discounts.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login?redirect=/checkout">
              <Button variant="primary" className="w-full">
                Login with Account
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="w-full">
                Create Free Account
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">
            Add sports equipment, apparel, or Cookey products before proceeding to checkout.
          </p>
          <div className="pt-2">
            <Link to="/store">
              <Button variant="primary">Explore Store</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/cart" className="hover:text-primary-700 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-slate-600 mt-1">
          Provide your shipping details and verify authoritative order totals.
        </p>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Unable to complete order</p>
            <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Delivery Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-5 border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-primary-700" />
              <h2 className="text-base font-bold text-slate-900">Shipping & Delivery Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Full Recipient Name *"
                  placeholder="e.g. Recipient Full Name"
                  value={address.full_name}
                  onChange={(e) => setAddress({ ...address, full_name: e.target.value })}
                />
                {formErrors.full_name && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.full_name}</p>
                )}
              </div>

              <div>
                <Input
                  label="Contact Phone / Mobile *"
                  placeholder="e.g. 9876543210"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                />
                {formErrors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <Input
                label="Street Address / Building / Flat *"
                placeholder="e.g. Flat 402, Shanti Heights, Shivaji Nagar"
                value={address.street_address}
                onChange={(e) => setAddress({ ...address, street_address: e.target.value })}
              />
              {formErrors.street_address && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.street_address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  label="City *"
                  placeholder="e.g. Pune"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
                {formErrors.city && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.city}</p>
                )}
              </div>

              <div>
                <Input
                  label="State *"
                  placeholder="e.g. Maharashtra"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                />
                {formErrors.state && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.state}</p>
                )}
              </div>

              <div>
                <Input
                  label="PIN Code *"
                  placeholder="e.g. 411001"
                  value={address.pin_code}
                  onChange={(e) => setAddress({ ...address, pin_code: e.target.value })}
                />
                {formErrors.pin_code && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.pin_code}</p>
                )}
              </div>
            </div>

            <div>
              <Input
                label="Delivery Instructions (Optional)"
                placeholder="e.g. Leave with security guard"
                value={address.notes}
                onChange={(e) => setAddress({ ...address, notes: e.target.value })}
              />
            </div>
          </Card>

          {/* Active Pending Order Banner if order already created */}
          {pendingOrder && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">
                    Existing Order Created: #{pendingOrder.order_number}
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    This order is safely registered in Pending Payment. To prevent duplicate orders, you can complete payment directly using Razorpay Sandbox.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleRetryPayment(pendingOrder)}
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Pay Now for #{pendingOrder.order_number}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/checkout/success?order_number=${pendingOrder.order_number}`)}
                >
                  View Order Details
                </Button>
              </div>
            </div>
          )}

          {/* Razorpay Test Mode Active Notice */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">Razorpay Sandbox Active (Test Mode)</p>
              <p className="text-blue-800 mt-0.5">
                Payments in this environment are authenticated via Razorpay Sandbox with server-authoritative pricing and cryptographic HMAC verification. Clicking "Confirm & Pay" will open the Razorpay payment interface with mock payment methods. No real money will be charged.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Authoritative Order Summary */}
        <div className="space-y-4">
          <Card className="p-6 space-y-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
              Order Items ({items.length})
            </h3>

            {/* Items Snapshot */}
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.productId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="pr-2 min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{i.name}</p>
                    <p className="text-slate-500">
                      Qty: {i.qty} &bull; ₹{((i.price || 0) / 100).toFixed(2)} each
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-900 shrink-0">
                    ₹{(((i.price || 0) * (i.qty || 1)) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Application Box */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-primary-600" /> Coupon / Voucher
              </label>

              {!appliedCoupon ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="COUPON CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 uppercase font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={couponLoading || !couponCode.trim()}
                    onClick={() => handleValidateCoupon(couponCode)}
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                    <span className="font-mono font-bold text-emerald-900">{appliedCoupon.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  ₹{(subtotalPaise / 100).toFixed(2)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{(discountPaise / 100).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Standard Delivery</span>
                {deliveryChargePaise === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase">FREE</span>
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
                  <span>Cart has {totalItemCount} items, exceeding platform limit of {maxItemsPerOrder}.</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900 text-sm">Payable Amount</span>
                <span className="font-extrabold text-xl text-primary-950">
                  ₹{(finalPayablePaise / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || isBelowMinOrder || exceedsMaxItems}
              className="w-full font-bold shadow-md shadow-primary-900/10"
              rightIcon={
                isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )
              }
            >
              {isSubmitting
                ? 'Processing Razorpay Checkout...'
                : pendingOrder
                ? `Pay Now for Order #${pendingOrder.order_number}`
                : 'Confirm & Pay with Razorpay'}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
