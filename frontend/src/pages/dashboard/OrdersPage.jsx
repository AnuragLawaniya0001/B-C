import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag,
  Loader2,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    order: null,
    reason: '',
    loading: false,
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderService.getMyOrders();
      setOrders(res.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retrieve order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (id) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handlePayOrder = async (orderToPay) => {
    await paymentService.openRazorpayCheckout({
      order: orderToPay,
      user,
      onSuccess: async () => {
        toast.success('Payment verified successfully!');
        fetchOrders();
      },
      onError: (errMsg) => {
        toast.error(`Payment failed: ${errMsg}`);
      },
    });
  };

  const openActionModal = (type, order) => {
    setModalState({
      isOpen: true,
      type,
      order,
      reason: type === 'CANCEL' ? 'Changed my mind' : 'Item size or fit issue',
      loading: false,
    });
  };

  const handleModalSubmit = async () => {
    if (!modalState.order) return;
    setModalState((prev) => ({ ...prev, loading: true }));

    try {
      if (modalState.type === 'CANCEL') {
        await orderService.cancelOrder(modalState.order.order_number, modalState.reason);
        toast.success(`Order #${modalState.order.order_number} cancelled successfully.`);
      } else if (modalState.type === 'RETURN') {
        await orderService.requestReturn(modalState.order.order_number, {
          reason: modalState.reason,
          items: modalState.order.items.map((it) => ({ product_id: it.product_id, qty: it.qty })),
        });
        toast.success(`Return request submitted for Order #${modalState.order.order_number}.`);
      }
      setModalState({ isOpen: false, type: null, order: null, reason: '', loading: false });
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Operation failed';
      toast.error(msg);
      setModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancelOrder = (order) => {
    openActionModal('CANCEL', order);
  };

  const handleReturnOrder = (order) => {
    openActionModal('RETURN', order);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Payment
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 inline-flex items-center gap-1">
            <Package className="w-3 h-3" /> Processing
          </span>
        );
      case 'PACKED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 inline-flex items-center gap-1">
            <Package className="w-3 h-3" /> Packed & Ready
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 inline-flex items-center gap-1">
            <Truck className="w-3 h-3" /> Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'RETURN_REQUESTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Return Requested
          </span>
        );
      case 'RETURN_APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Return Approved
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Refunded
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-white/10">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <PageHeader
        title="My Orders & Shipments"
        description="Track your gear shipments, verify authoritative invoices, and review order status."
        backLink="/store"
        backText="Back to Store"
      />

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Loading your orders...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-white">Unable to load orders</h3>
          <p className="text-xs text-slate-400">{error}</p>
        </Card>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders placed yet"
          description="Browse our sports store catalog and Cookey member specials to place your first order."
          action={
            <Link to="/store">
              <Button variant="primary" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                Explore Store Catalog
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const itemsCount = order.items.reduce((acc, i) => acc + (i.qty || 1), 0);
            const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card
                key={order.id}
                className="overflow-hidden border border-white/10 transition-shadow hover:shadow-xl"
              >
                {/* Header Summary Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/70 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-sm text-white tracking-wider">
                        {order.order_number}
                      </span>
                      {getStatusBadge(order.order_status)}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Placed on {dateStr}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-left md:text-right">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Total Amount ({itemsCount} items)
                      </p>
                      <p className="text-base font-extrabold text-amber-400 font-display">
                        ₹{(order.final_payable_paise / 100).toFixed(2)}
                      </p>
                    </div>

                    {order.order_status === 'PENDING_PAYMENT' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePayOrder(order)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                      >
                        Pay Now
                      </Button>
                    )}

                    {['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'].includes(order.order_status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOrder(order)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold"
                      >
                        Cancel
                      </Button>
                    )}

                    {order.order_status === 'DELIVERED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturnOrder(order)}
                        className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs font-semibold"
                      >
                        Request Return
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleExpand(order.id)}
                      rightIcon={
                        isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </div>

                {/* Tracking Banner if Shipped or Delivered */}
                {order.tracking && (
                  <div className="bg-purple-50/70 border-t border-purple-100 px-5 py-2.5 flex items-center justify-between text-xs text-purple-900">
                    <span className="flex items-center gap-2 font-medium">
                      <Truck className="w-4 h-4 text-purple-600" />
                      Shipped via <span className="font-bold">{order.tracking.carrier}</span> &bull; AWB: <span className="font-mono font-bold">{order.tracking.tracking_number}</span>
                    </span>
                    {order.tracking.tracking_url && (
                      <a
                        href={order.tracking.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-purple-700 underline hover:text-purple-900"
                      >
                        Track Shipment &rarr;
                      </a>
                    )}
                  </div>
                )}

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-5 space-y-5 bg-slate-950/90 text-slate-200">
                    {/* Item List */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Ordered Items
                      </h4>
                      <div className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-white/5">
                            <div>
                              <p className="font-bold text-white">{it.name}</p>
                              <p className="text-slate-400 mt-0.5">
                                Qty: {it.qty} &bull; Unit: ₹{(it.unit_price_paise / 100).toFixed(2)}
                                {it.is_member_price && (
                                  <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                    Member Discount
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="font-extrabold text-white">
                              ₹{(it.line_total_paise / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Breakdown & Shipping Address Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-white/10 text-xs">
                      {/* Shipping Address */}
                      <div className="space-y-1.5">
                        <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" /> Delivery Address
                        </span>
                        <p className="font-bold text-white">
                          {order.delivery_address?.full_name} ({order.delivery_address?.phone})
                        </p>
                        <p className="text-slate-300">
                          {order.delivery_address?.street_address}, {order.delivery_address?.city}, {order.delivery_address?.state} - {order.delivery_address?.pin_code}
                        </p>
                        {order.delivery_address?.notes && (
                          <p className="text-slate-400 italic mt-1">
                            Note: {order.delivery_address?.notes}
                          </p>
                        )}
                      </div>

                      {/* Pricing Breakdown */}
                      <div className="space-y-1.5 bg-slate-900/80 p-4 rounded-xl border border-white/10">
                        <div className="flex justify-between text-slate-300">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-white">
                            ₹{(order.subtotal_paise / 100).toFixed(2)}
                          </span>
                        </div>
                        {order.discount_paise > 0 && (
                          <div className="flex justify-between text-emerald-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" /> Coupon ({order.coupon_code}):
                            </span>
                            <span>-₹{(order.discount_paise / 100).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-300">
                          <span>Delivery:</span>
                          <span className="text-emerald-400 font-bold uppercase">FREE</span>
                        </div>
                        <div className="pt-2 border-t border-white/10 flex justify-between font-extrabold text-white text-sm">
                          <span>Total Amount:</span>
                          <span className="text-amber-400 font-display">
                            ₹{(order.final_payable_paise / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Accessible Action Modal (Cancel / Return) */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() =>
          !modalState.loading &&
          setModalState({ isOpen: false, type: null, order: null, reason: '', loading: false })
        }
        title={
          modalState.type === 'CANCEL'
            ? `Cancel Order #${modalState.order?.order_number}`
            : `Request Return for Order #${modalState.order?.order_number}`
        }
        description={
          modalState.type === 'CANCEL'
            ? 'Are you sure you want to cancel this order? If paid, refunds will be credited to your BIGCHAMP wallet.'
            : 'Please provide details for the return request. Our operations team will process pickup.'
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Reason for {modalState.type === 'CANCEL' ? 'cancellation' : 'return'}:
            </label>
            <textarea
              rows={3}
              value={modalState.reason}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Please describe reason..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={modalState.loading}
              onClick={() =>
                setModalState({ isOpen: false, type: null, order: null, reason: '', loading: false })
              }
            >
              Close
            </Button>
            <Button
              variant={modalState.type === 'CANCEL' ? 'danger' : 'primary'}
              size="sm"
              isLoading={modalState.loading}
              disabled={modalState.loading || !modalState.reason.trim()}
              onClick={handleModalSubmit}
            >
              {modalState.type === 'CANCEL' ? 'Confirm Cancellation' : 'Submit Return'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
