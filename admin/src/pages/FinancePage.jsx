import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Wallet,
  Coins,
  Search,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Copy,
  Check,
  Loader2,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import api from '../services/api';

export default function FinancePage() {
  const [wallets, setWallets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Ledger Inspection Modal
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectSummary, setInspectSummary] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  // Adjustment Modal
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    direction: 'CREDIT',
    amount_rupees: '',
    reason: '',
    notes: '',
  });
  const [adjustLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedTxn, setCopiedTxn] = useState(null);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.wallet_status = statusFilter;

      const res = await api.get('/wallet/admin/wallets', { params });
      const data = res.data || res;
      setWallets(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load wallets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWallets();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(text);
    setTimeout(() => setCopiedTxn(null), 2000);
  };

  const [recovering, setRecovering] = useState(false);

  const openInspectModal = async (walletItem) => {
    setInspectUser(walletItem);
    setIsInspectOpen(true);
    setInspectLoading(true);
    setReconciliation(null);
    try {
      const [sumRes, reconRes] = await Promise.all([
        api.get(`/wallet/admin/wallets/${walletItem.wallet.user_id}`),
        api.get(`/wallet/admin/reconcile/${walletItem.wallet.user_id}`),
      ]);
      setInspectSummary(sumRes.data || sumRes);
      setReconciliation(reconRes.data || reconRes);
    } catch (err) {
      console.error('Failed to inspect wallet', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleRunRecovery = async () => {
    if (!inspectUser) return;
    setRecovering(true);
    try {
      await api.post('/wallet/admin/recover', {
        user_id: inspectUser.wallet.user_id,
        notes: 'Admin manual recovery triggered from drawer',
      });
      // Re-inspect
      await openInspectModal(inspectUser);
      fetchWallets();
    } catch (err) {
      console.error('Failed to run recovery', err);
    } finally {
      setRecovering(false);
    }
  };

  const openAdjustModal = (walletItem) => {
    setAdjustTarget(walletItem);
    setAdjustForm({
      direction: 'CREDIT',
      amount_rupees: '',
      reason: '',
      notes: '',
    });
    setFeedback(null);
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const amt = parseFloat(adjustForm.amount_rupees);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid amount greater than 0' });
      return;
    }

    if (!adjustForm.reason.trim()) {
      setFeedback({ type: 'error', message: 'Mandatory adjustment reason is required' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    try {
      const payload = {
        user_id: adjustTarget.wallet.user_id,
        direction: adjustForm.direction,
        amount_rupees: amt,
        reason: adjustForm.reason.trim(),
        notes: adjustForm.notes.trim() || undefined,
        idempotency_key: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      await api.post('/wallet/admin/adjust', payload);
      setFeedback({
        type: 'success',
        message: `Successfully posted ${adjustForm.direction} adjustment of ₹${amt.toFixed(2)}`,
      });

      // Refresh list
      fetchWallets();
      setTimeout(() => {
        setIsAdjustOpen(false);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to execute adjustment';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Aggregated KPI Stats
  const totalLiabilityPaise = wallets.reduce((acc, w) => acc + (w.wallet.balance_paise || 0), 0);
  const totalLiabilityRupees = (totalLiabilityPaise / 100).toFixed(2);
  const activeCount = wallets.filter((w) => w.wallet.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance & Wallets</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Customer wallet balances, append-only transaction ledgers, controlled balance adjustments, and audit reconciliation.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchWallets}
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Wallets
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Tracked Customer Wallets</p>
              <p className="text-xl font-extrabold text-slate-900">{total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">Total Customer Balances</p>
              <p className="text-xl font-extrabold text-emerald-950">₹{totalLiabilityRupees}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-blue-200 bg-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700">Active Wallets</p>
              <p className="text-xl font-extrabold text-blue-900">{activeCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Customer Name, Email, Mobile, or User ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Wallet Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </Card>

      {/* Wallets Table */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Available Balance</th>
                <th className="py-3 px-4">Wallet Status</th>
                <th className="py-3 px-4">Ledger Transactions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
                    Loading customer wallets...
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No customer wallets found.
                  </td>
                </tr>
              ) : (
                wallets.map((item) => {
                  const balRupees = (item.wallet.balance_paise / 100).toFixed(2);
                  const statusVariant =
                    item.wallet.status === 'ACTIVE'
                      ? 'success'
                      : item.wallet.status === 'LOCKED'
                      ? 'warning'
                      : 'danger';

                  return (
                    <tr key={item.wallet.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            {item.customer_name}
                            {item.is_member && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded">
                                Member
                              </span>
                            )}
                          </p>
                          <p className="text-slate-400 text-[11px]">{item.customer_email || item.customer_mobile || 'No contact'}</p>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {item.wallet.user_id}
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 font-extrabold text-sm text-slate-900">
                        ₹{balRupees}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={statusVariant}>{item.wallet.status}</Badge>
                      </td>

                      {/* Transactions Count */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.transaction_count} entries
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openInspectModal(item)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Ledger
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openAdjustModal(item)}
                          leftIcon={<Coins className="w-3.5 h-3.5" />}
                        >
                          Adjust
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

      {/* Inspect Ledger & Reconciliation Modal */}
      {isInspectOpen && inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-white shadow-2xl animate-in fade-in-50">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Wallet Ledger: {inspectUser.customer_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  User ID: {inspectUser.wallet.user_id} &bull; Currency: {inspectUser.wallet.currency}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsInspectOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {inspectLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
                  Loading ledger and reconciling balances...
                </div>
              ) : (
                <>
                  {/* Reconciliation Banner */}
                  {reconciliation && (
                    <div
                      className={`p-4 rounded-xl text-xs border flex items-start gap-3 ${
                        reconciliation.is_reconciled
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      {reconciliation.is_reconciled ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-bold text-sm">
                          <span>
                            {reconciliation.is_reconciled
                              ? 'Ledger Fully Reconciled'
                              : 'Reconciliation Discrepancy Detected'}
                          </span>
                          <span>
                            Current Balance: ₹{(reconciliation.wallet_balance_paise / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1">
                          Calculated from {reconciliation.total_transactions} ledger transactions:
                          Credits = ₹{(reconciliation.ledger_credits_paise / 100).toFixed(2)} &bull;
                          Debits = ₹{(reconciliation.ledger_debits_paise / 100).toFixed(2)} &bull;
                          Net = ₹{(reconciliation.ledger_calculated_balance_paise / 100).toFixed(2)}
                        </p>

                        {(!reconciliation.is_reconciled || (reconciliation.pending_operations_count > 0)) && (
                          <div className="mt-3 pt-3 border-t border-rose-200 flex items-center justify-between">
                            <span className="text-rose-700 font-medium">
                              {reconciliation.pending_operations_count > 0
                                ? `${reconciliation.pending_operations_count} interrupted operation(s) pending recovery.`
                                : `Discrepancy of ₹${(reconciliation.discrepancy_paise / 100).toFixed(2)} detected.`}
                            </span>
                            <button
                              type="button"
                              onClick={handleRunRecovery}
                              disabled={recovering}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                            >
                              {recovering ? 'Recovering...' : 'Run Authoritative Recovery'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transactions List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Transaction Ledger Entries
                    </h4>

                    {(!inspectSummary?.recent_transactions ||
                      inspectSummary.recent_transactions.length === 0) ? (
                      <p className="text-xs text-slate-400 py-6 text-center italic">
                        No transactions recorded for this wallet.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                        {inspectSummary.recent_transactions.map((tx) => {
                          const isCredit = tx.direction === 'CREDIT';
                          const isCopied = copiedTxn === tx.transaction_id;

                          return (
                            <div key={tx.id || tx.transaction_id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                    isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{tx.reason}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                    <span className="font-mono text-slate-500 inline-flex items-center gap-1">
                                      {tx.transaction_id}
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(tx.transaction_id)}
                                        className="hover:text-slate-700"
                                      >
                                        {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    </span>
                                    <span>&bull;</span>
                                    <span>{new Date(tx.created_at).toLocaleString('en-IN')}</span>
                                    <span>&bull;</span>
                                    <span>By: {tx.actor} ({tx.actor_id || 'System'})</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p
                                  className={`font-extrabold text-sm ${
                                    isCredit ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {isCredit ? '+' : '-'}₹{(tx.amount_paise / 100).toFixed(2)}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Before: ₹{(tx.balance_before_paise / 100).toFixed(2)} &rarr; After: ₹{(tx.balance_after_paise / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Controlled Balance Adjustment Modal */}
      {isAdjustOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg overflow-hidden bg-white shadow-2xl animate-in fade-in-50">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manual Balance Adjustment
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: {adjustTarget.customer_name} (Current: ₹{(adjustTarget.wallet.balance_paise / 100).toFixed(2)})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 ${
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

              {/* Direction Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Adjustment Direction *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, direction: 'CREDIT' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustForm.direction === 'CREDIT'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" /> Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, direction: 'DEBIT' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustForm.direction === 'DEBIT'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" /> Debit (-)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Amount in INR (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 50.00"
                  value={adjustForm.amount_rupees}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount_rupees: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                  required
                />
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved goodwill credit for support ticket #4812"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Operational Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Optional Internal Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Additional context or authorization references"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Audit Warning */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Immutable Audit:</strong> This operation writes an append-only transaction ledger entry tagged with your administrator identity. Debits cannot exceed available balance.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsAdjustOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={adjustLoading || !adjustForm.amount_rupees || !adjustForm.reason}
                  leftIcon={adjustLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                >
                  {adjustLoading ? 'Executing...' : 'Confirm Adjustment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
