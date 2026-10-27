import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Tag,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { useAuthStore } from '../../store/authStore';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order_number');
  const { user } = useAuthStore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderNumber));
  const [error, setError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payMessage, setPayMessage] = useState('');

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await orderService.getMyOrderDetail(orderNumber);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to retrieve order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const handlePayNow = async () => {
    if (!order || isPaying) return;
    setIsPaying(true);
    setPayMessage('');

    await paymentService.openRazorpayCheckout({
      order,
      user,
      onSuccess: async () => {
        setIsPaying(false);
        setPayMessage('Payment successful! Verifying order confirmation...');
        try {
          const freshData = await orderService.getMyOrderDetail(orderNumber);
          setOrder(freshData);
        } catch (_) {}
      },
      onError: (errMsg) => {
        setIsPaying(false);
        setPayMessage(`Payment could not be completed: ${errMsg}`);
      },
      onDismiss: () => {
        setIsPaying(false);
        setPayMessage('Payment window was closed. Your order remains in Pending Payment.');
      },
    });
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      {/* Top Hero Confirmation Card */}
      <Card className="p-8 text-center space-y-4 border border-emerald-200 bg-emerald-50/30">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          {order?.order_status === 'REQUIRES_RECONCILIATION' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" /> Payment Received — Reconciliation Underway
            </span>
          ) : order?.payment_status === 'PAID' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Payment Verified — Order Confirmed
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Order Placed — Pending Payment
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {order?.order_status === 'REQUIRES_RECONCILIATION'
              ? 'Payment Captured — Awaiting Reconciliation'
              : order?.payment_status === 'PAID'
              ? 'Payment Verified & Order Confirmed!'
              : 'Order Registered — Payment Pending'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            {order?.order_status === 'REQUIRES_RECONCILIATION'
              ? 'Your payment was successfully received. High concurrent demand exhausted product inventory before fulfillment. Your payment is protected while an administrator reconciles the order.'
              : order?.payment_status === 'PAID'
              ? 'Your payment was successfully verified via Razorpay sandbox. Inventory has been confirmed.'
              : 'Your order is registered in our database. Complete payment below to fulfill inventory and confirm dispatch.'}
          </p>
        </div>

        {orderNumber && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block font-mono text-sm font-extrabold text-slate-900 tracking-wider">
            Order Reference: <span className="text-primary-700">{orderNumber}</span>
          </div>
        )}
      </Card>

      {/* Interactive Pay Now Card for Unpaid Orders */}
      {order && order.payment_status !== 'PAID' && order.order_status !== 'REQUIRES_RECONCILIATION' && (
        <Card className="p-5 border-2 border-amber-300 bg-amber-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Complete Payment for Order #{order.order_number}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Amount Payable: <strong className="text-slate-900">₹{((order.final_payable_paise || 0) / 100).toFixed(2)}</strong>. Click below to launch Razorpay Test Mode checkout.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handlePayNow}
              disabled={isPaying}
              className="w-full sm:w-auto shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 shadow-md shadow-amber-900/10"
              rightIcon={isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            >
              {isPaying ? 'Opening Checkout...' : `Pay Now (₹${((order.final_payable_paise || 0) / 100).toFixed(2)})`}
            </Button>
          </div>
          {payMessage && (
            <p className="text-xs font-medium text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200">
              {payMessage}
            </p>
          )}
        </Card>
      )}

      {/* Razorpay Sandbox Mode Information Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Razorpay Sandbox Active (Test Mode)</p>
          <p className="mt-0.5 text-blue-800">
            Payment transactions in this environment use Razorpay Test Mode with server-side HMAC-SHA256 signature verification and idempotent recovery. No real money has been charged.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Fetching verified order invoice...</p>
        </Card>
      ) : order ? (
        <Card className="p-6 space-y-6 border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-600" /> Order Details & Pricing Snapshot
          </h2>

          {/* Purchased Items List */}
          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                  <p className="text-slate-500 mt-0.5">
                    Qty: {item.qty} &bull; Unit: ₹{(item.unit_price_paise / 100).toFixed(2)}
                    {item.is_member_price && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Member Special
                      </span>
                    )}
                  </p>
                </div>
                <span className="font-extrabold text-slate-900 text-sm">
                  ₹{(item.line_total_paise / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                ₹{(order.subtotal_paise / 100).toFixed(2)}
              </span>
            </div>

            {order.discount_paise > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Coupon Discount ({order.coupon_code})
                </span>
                <span>-₹{(order.discount_paise / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              <span className="text-emerald-700 font-bold uppercase">FREE</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm">
              <span className="font-extrabold text-slate-900">Total Payable Amount</span>
              <span className="font-extrabold text-xl text-primary-950">
                ₹{(order.final_payable_paise / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-600" /> Delivery Address
              </p>
              <p className="font-medium text-slate-900">{order.delivery_address.full_name} ({order.delivery_address.phone})</p>
              <p>{order.delivery_address.street_address}, {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pin_code}</p>
            </div>
          )}
        </Card>
      ) : null}

      {/* Bottom Navigation Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link to="/orders" className="flex-1">
          <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View in Order History
          </Button>
        </Link>
        <Link to="/store" className="flex-1">
          <Button variant="outline" className="w-full" leftIcon={<ShoppingBag className="w-4 h-4" />}>
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
