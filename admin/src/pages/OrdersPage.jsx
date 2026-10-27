import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  AlertCircle,
  Eye,
  X,
  MapPin,
  Tag,
  Copy,
  Check,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';

const ORDER_STATUS_MAP = {
  PENDING_PAYMENT: { label: 'Pending Payment', variant: 'warning', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'info', icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', variant: 'info', icon: Package },
  PACKED: { label: 'Packed', variant: 'info', icon: Package },
  SHIPPED: { label: 'Shipped', variant: 'purple', icon: Truck },
  DELIVERED: { label: 'Delivered', variant: 'success', icon: CheckCircle2 },
  RETURN_REQUESTED: { label: 'Return Requested', variant: 'warning', icon: AlertCircle },
  RETURN_APPROVED: { label: 'Return Approved', variant: 'info', icon: CheckCircle2 },
  RETURN_REJECTED: { label: 'Return Rejected', variant: 'danger', icon: AlertCircle },
  RETURNED: { label: 'Returned', variant: 'info', icon: Package },
  REFUND_PENDING: { label: 'Refund Pending', variant: 'warning', icon: Clock },
  REFUNDED: { label: 'Refunded', variant: 'neutral', icon: CheckCircle2 },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', variant: 'info', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', variant: 'danger', icon: AlertCircle },
};

const VALID_TRANSITIONS = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'PACKED', 'CANCELLED'],
  PROCESSING: ['PACKED', 'SHIPPED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
  RETURN_APPROVED: ['RETURNED', 'REFUND_PENDING', 'REFUNDED'],
  RETURN_REJECTED: [],
  RETURNED: ['REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED'],
  PARTIALLY_REFUNDED: ['REFUNDED'],
  REFUNDED: [],
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.order_status = statusFilter;
      if (paymentFilter !== 'ALL') params.payment_status = paymentFilter;

      const res = await api.get('/orders', { params });
      const data = res.data || res;
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    const current = order.order_status;
    const allowed = VALID_TRANSITIONS[current] || [];
    setTargetStatus(allowed.length > 0 ? allowed[0] : '');
    setStatusNotes('');
    setFeedback(null);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !targetStatus) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.patch(`/orders/${selectedOrder.id || selectedOrder.order_number}/status`, {
        status: targetStatus,
        notes: statusNotes.trim() || undefined,
      });

      const updated = res.data || res;
      setSelectedOrder(updated);
      setFeedback({ type: 'success', message: `Order status transitioned to ${targetStatus} successfully!` });

      // Refresh table list
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update order status';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Calculations
  const pendingCount = orders.filter((o) => o.order_status === 'PENDING_PAYMENT').length;
  const confirmedCount = orders.filter((o) => o.order_status === 'CONFIRMED').length;
  const processingCount = orders.filter((o) => ['PROCESSING', 'SHIPPED'].includes(o.order_status)).length;
  const deliveredCount = orders.filter((o) => o.order_status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track customer orders, manage shipments, inspect authoritative invoices, and record state transitions.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchOrders}
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Orders
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Orders</p>
              <p className="text-xl font-extrabold text-slate-900">{total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700">Pending Payment</p>
              <p className="text-xl font-extrabold text-amber-900">{pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-blue-200 bg-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700">Confirmed / In-Transit</p>
              <p className="text-xl font-extrabold text-blue-900">{confirmedCount + processingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">Delivered</p>
              <p className="text-xl font-extrabold text-emerald-900">{deliveredCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order #, Customer Name, Email, or Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const itemsCount = o.items.reduce((acc, it) => acc + (it.qty || 1), 0);
                  const isCopied = copiedCode === o.order_number;
                  const dateStr = new Date(o.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const statusConfig = ORDER_STATUS_MAP[o.order_status] || {
                    label: o.order_status,
                    variant: 'secondary',
                  };

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{o.order_number}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(o.order_number)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Order Number"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500">{dateStr}</td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            {o.customer_name}
                            {o.is_member && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded">
                                Member
                              </span>
                            )}
                          </p>
                          <p className="text-slate-400 text-[11px]">{o.customer_email || o.customer_mobile}</p>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{itemsCount} items</span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ₹{(o.final_payable_paise / 100).toFixed(2)}
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {o.payment_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openOrderDetail(o)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail & Status Transition Modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-white shadow-2xl animate-in fade-in-50">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    {selectedOrder.order_number}
                  </h3>
                  <Badge variant={ORDER_STATUS_MAP[selectedOrder.order_status]?.variant || 'secondary'}>
                    {ORDER_STATUS_MAP[selectedOrder.order_status]?.label || selectedOrder.order_status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Customer & Shipping Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {/* Customer */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary-600" /> Customer Information
                  </p>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedOrder.customer_name}
                    {selectedOrder.is_member && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded">
                        Active Member
                      </span>
                    )}
                  </p>
                  {selectedOrder.customer_email && (
                    <p className="text-slate-600 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {selectedOrder.customer_email}
                    </p>
                  )}
                  {selectedOrder.customer_mobile && (
                    <p className="text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {selectedOrder.customer_mobile}
                    </p>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" /> Delivery Address
                  </p>
                  <p className="font-medium text-slate-900">
                    {selectedOrder.delivery_address?.street_address}
                  </p>
                  <p className="text-slate-600">
                    {selectedOrder.delivery_address?.city}, {selectedOrder.delivery_address?.state} - {selectedOrder.delivery_address?.pin_code}
                  </p>
                  {selectedOrder.delivery_address?.notes && (
                    <p className="text-slate-500 italic mt-1">
                      Note: {selectedOrder.delivery_address?.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Itemized Order Snapshot
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-900">{it.name}</p>
                        <p className="text-slate-500 mt-0.5">
                          Category: <span className="uppercase">{it.category}</span> &bull; Qty: {it.qty} &bull; Unit: ₹{(it.unit_price_paise / 100).toFixed(2)}
                          {it.is_member_price && (
                            <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded">
                              Member Special Applied
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        ₹{(it.line_total_paise / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Authoritative Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedOrder.subtotal_paise / 100).toFixed(2)}
                  </span>
                </div>

                {selectedOrder.discount_paise > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Coupon Discount ({selectedOrder.coupon_code}):
                    </span>
                    <span>-₹{(selectedOrder.discount_paise / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Standard Delivery:</span>
                  <span className="text-emerald-700 font-bold uppercase">FREE</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-extrabold text-sm text-slate-900">
                  <span>Final Payable Amount:</span>
                  <span className="text-xl text-primary-950">
                    ₹{(selectedOrder.final_payable_paise / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status Transition Action Section */}
              <div className="p-4 rounded-xl border border-primary-200 bg-primary-50/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary-700" /> Administrative Status Transition
                </h4>

                {VALID_TRANSITIONS[selectedOrder.order_status]?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    This order is in a terminal state ({selectedOrder.order_status}) and cannot be transitioned further.
                  </p>
                ) : (
                  <form onSubmit={handleUpdateStatus} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Target Lifecycle Status
                        </label>
                        <select
                          value={targetStatus}
                          onChange={(e) => setTargetStatus(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-primary-500"
                        >
                          {(VALID_TRANSITIONS[selectedOrder.order_status] || []).map((st) => (
                            <option key={st} value={st}>
                              {ORDER_STATUS_MAP[st]?.label || st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Operational Notes / Reason
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dispatched via Bluedart AWB# 123456"
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={actionLoading || !targetStatus}
                      leftIcon={actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      {actionLoading ? 'Updating Status...' : 'Apply Status Transition'}
                    </Button>
                  </form>
                )}
              </div>

              {/* Status Audit History */}
              {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Status History & Audit Trail
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {selectedOrder.status_history.map((h, idx) => (
                      <div key={idx} className="p-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{h.status}</span>
                            {h.previous_status && (
                              <span className="text-[10px] text-slate-400">
                                (from {h.previous_status})
                              </span>
                            )}
                          </div>
                          {h.notes && <p className="text-slate-600 mt-0.5">{h.notes}</p>}
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <p>{new Date(h.changed_at).toLocaleString('en-IN')}</p>
                          <p className="text-slate-500 font-medium">{h.changed_by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
