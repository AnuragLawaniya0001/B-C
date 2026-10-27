import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Coins,
  History,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import walletService from '../../services/walletService';

export default function WalletPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedTxn, setCopiedTxn] = useState(null);

  const fetchWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await walletService.getMyWallet();
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(text);
    setTimeout(() => setCopiedTxn(null), 2000);
  };

  const wallet = summary?.wallet;
  const balanceRupees = wallet ? (wallet.balance_paise / 100).toFixed(2) : '0.00';
  const creditedRupees = summary ? (summary.total_credited_paise / 100).toFixed(2) : '0.00';
  const debitedRupees = summary ? (summary.total_debited_paise / 100).toFixed(2) : '0.00';
  const transactions = summary?.recent_transactions || [];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Digital Wallet & Ledger"
          description="View your verified wallet balance, audit ledger, and promotional cashback records."
          backLink="/store"
          backText="Back to Store"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchWallet}
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {/* Phase 3B Foundation Disclosure Alert */}
      <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-300">Phase 3B Foundation Wallet Architecture</p>
          <p className="text-amber-200/80 mt-0.5">
            This wallet is backed by an append-only, immutable transaction ledger. Real money deposits, automated joining rewards, payment gateways, and checkout deductions are currently disabled until future authorized phases.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading verified wallet balance...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-slate-800">Unable to load wallet</h3>
          <p className="text-xs text-slate-500">{error}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase opacity-90">
                  Available Balance
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 uppercase tracking-wider backdrop-blur-sm">
                  {wallet?.status || 'ACTIVE'}
                </span>
              </div>

              <div>
                <h2 className="text-4xl font-extrabold tracking-tight">₹{balanceRupees}</h2>
                <p className="text-xs opacity-80 mt-1 font-mono">Currency: {wallet?.currency || 'INR'}</p>
              </div>

              <div className="pt-3 border-t border-white/20 text-[11px] opacity-90 flex justify-between">
                <span>Account Verified</span>
                <span>Integer Paise Precision</span>
              </div>
            </Card>

            {/* Quick Stats Card */}
            <Card className="p-4 border border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Lifetime Credited</span>
                <span className="font-bold text-emerald-600">+₹{creditedRupees}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Lifetime Debited</span>
                <span className="font-bold text-rose-400">-₹{debitedRupees}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Total Transactions</span>
                <span className="font-bold text-white">{summary?.total_transactions || 0}</span>
              </div>
            </Card>
          </div>

          {/* Transaction Ledger Table */}
          <Card className="p-6 md:col-span-2 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider font-display">
                  Append-Only Transaction Ledger
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Latest {transactions.length} records
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Coins className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-white">No transactions recorded yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Transactions will appear here when administrative adjustments or authorized rewards are posted.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {transactions.map((txn) => {
                  const isCredit = txn.direction === 'CREDIT';
                  const amtRupees = (txn.amount_paise / 100).toFixed(2);
                  const isCopied = copiedTxn === txn.transaction_id;
                  const dateStr = new Date(txn.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={txn.id || txn.transaction_id} className="py-3 flex items-center justify-between text-xs hover:bg-white/5 px-2 rounded-xl transition-colors">
                      <div className="flex items-start gap-3 min-w-0 pr-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isCredit
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{txn.reason}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="font-mono text-slate-400 inline-flex items-center gap-1">
                              {txn.transaction_id}
                              <button
                                type="button"
                                onClick={() => handleCopy(txn.transaction_id)}
                                className="hover:text-amber-400 cursor-pointer"
                                title="Copy ID"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </span>
                            <span>&bull;</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-extrabold text-sm ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₹{amtRupees}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                          Bal: ₹{(txn.balance_after_paise / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
