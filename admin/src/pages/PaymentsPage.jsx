import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  CreditCard,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  ArrowRight,
  User,
  ShoppingBag,
} from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG = {
  SUCCESS: { label: 'Captured / Paid', variant: 'success', icon: CheckCircle2 },
  ATTEMPTED: { label: 'Attempted / Pending', variant: 'warning', icon: Clock },
  INITIATED: { label: 'Initiated', variant: 'info', icon: Clock },
  FAILED: { label: 'Failed', variant: 'danger', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', variant: 'default', icon: X },
  REQUIRES_RECONCILIATION: { label: 'Reconciliation Required', variant: 'warning', icon: AlertCircle },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Drawer State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/payments/admin/payments', { params });
      const data = res.data || res;
      setPayments(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const [recovering, setRecovering] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState(null);

  const handleRecover = async (paymentId) => {
    setRecovering(true);
    setRecoverMsg(null);
    try {
      const res = await api.post('/payments/admin/recover', {
        payment_id_or_operation_id: paymentId,
        notes: 'Admin manual recovery from payments dashboard',
      });
      const data = res.data || res;
      setRecoverMsg({ type: 'success', text: data.message || 'Recovery completed successfully.' });
      fetchPayments();
      const pRes = await api.get(`/payments/admin/payments/${paymentId}`);
      setSelectedPayment(pRes.data || pRes);
    } catch (err) {
      setRecoverMsg({ type: 'error', text: err.response?.data?.detail || 'Recovery failed.' });
    } finally {
      setRecovering(false);
    }
  };

  const openDrawer = (payment) => {
    setSelectedPayment(payment);
    setRecoverMsg(null);
    setIsDrawerOpen(true);
  };

  // Aggregated KPIs
  const totalVolumePaise = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + (p.amount_paise || 0), 0);
  const totalVolumeRupees = (totalVolumePaise / 100).toFixed(2);
  const successCount = payments.filter((p) => p.status === 'SUCCESS').length;
  const failedCount = payments.filter((p) => p.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Razorpay sandbox payment attempts, cryptographic verifications, webhook reconciliation, and immutable audit logs.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Records
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary-600 bg-white shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Captured Volume</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalVolumeRupees}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Successful test sandbox volume</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 bg-white shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Successful Payments</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{successCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Verified via signature or webhook</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-600 bg-white shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Failed / Cancelled</p>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{failedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rejected or expired attempts</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600 bg-white shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Provider</p>
          <p className="text-xl font-extrabold text-blue-900 mt-1 flex items-center gap-1.5">
            <CreditCard className="w-5 h-5 text-blue-600" /> Razorpay Test
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5 font-medium">HMAC-SHA256 Sandbox Active</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Payment ID, Order Number, Provider Order/Payment ID, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="SUCCESS">Success / Captured</option>
              <option value="ATTEMPTED">Attempted / Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <Button type="submit" variant="primary" className="text-xs px-4">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Payment Records Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-xs font-medium">Loading payment records...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Payment Records Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Payments initiated via the checkout flow or simulated in test mode will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment Reference</th>
                  <th className="py-3 px-4">Order Reference</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Provider Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] || { label: p.status, variant: 'default', icon: Clock };
                  const Icon = cfg.icon;
                  return (
                    <tr key={p.id || p.payment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.payment_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-primary-700">
                          {p.order_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.customer_name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{p.customer_email || '—'}</div>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        ₹{((p.amount_paise || 0) / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>Ord: {p.provider_order_id}</div>
                        {p.provider_payment_id && (
                          <div className="text-emerald-700 font-semibold">Pay: {p.provider_payment_id}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit">
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(p.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDrawer(p)}
                          className="text-xs h-7 px-2.5 hover:bg-slate-200/60"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-out Inspection Drawer */}
      {isDrawerOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in-50">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary-600" /> Payment Audit & Verification
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Reference: {selectedPayment.payment_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Payment Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Current Payment State:</span>
                  <Badge
                    variant={STATUS_CONFIG[selectedPayment.status]?.variant || 'default'}
                    className="text-xs px-2.5 py-0.5"
                  >
                    {STATUS_CONFIG[selectedPayment.status]?.label || selectedPayment.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-600">Captured Amount:</span>
                  <span className="text-base font-extrabold text-slate-900">
                    ₹{((selectedPayment.amount_paise || 0) / 100).toFixed(2)} INR
                  </span>
                </div>

                {/* Durable Recovery Action */}
                <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                  {recoverMsg && (
                    <div className={`p-2 rounded text-[11px] font-medium ${recoverMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                      {recoverMsg.text}
                    </div>
                  )}
                  {selectedPayment.status !== 'SUCCESS' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecover(selectedPayment.payment_id)}
                      disabled={recovering}
                      className="w-full text-xs flex items-center justify-center gap-1.5"
                    >
                      {recovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-primary-600" />}
                      Execute Durable Recovery Protocol
                    </Button>
                  )}
                </div>
              </div>

              {/* Order & Customer Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Associated Order Reference
                </h4>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Number:</span>
                    <span className="font-bold font-mono text-primary-700">{selectedPayment.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer Name:</span>
                    <span className="text-slate-900">{selectedPayment.customer_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer Email:</span>
                    <span className="text-slate-900">{selectedPayment.customer_email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Gateway Technical References */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Razorpay Provider Identifiers
                </h4>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">RAZORPAY ORDER ID</span>
                    <span className="text-slate-800 font-bold">{selectedPayment.provider_order_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">RAZORPAY PAYMENT ID</span>
                    <span className="text-emerald-700 font-bold">
                      {selectedPayment.provider_payment_id || 'Not captured yet'}
                    </span>
                  </div>
                  {selectedPayment.verified_at && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">VERIFIED TIMESTAMP</span>
                      <span className="text-slate-700">
                        {new Date(selectedPayment.verified_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {selectedPayment.failure_reason && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded font-sans">
                      <span className="font-bold">Failure Reason:</span> {selectedPayment.failure_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Immutable Audit Log */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  State Transition Audit Trail
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {(selectedPayment.audit_history || []).map((entry, idx) => (
                    <div key={idx} className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{entry.status}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(entry.changed_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{entry.notes}</p>
                      <p className="text-[10px] text-slate-400">Actor: {entry.changed_by}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
