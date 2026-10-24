import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Wallet, ArrowDownLeft } from 'lucide-react';

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet & Cashback"
        description="View your cashback balance, transaction history, and wallet credits."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">Total Balance</p>
              <h2 className="text-3xl font-extrabold text-emerald-950">₹10.00</h2>
            </div>
          </div>
          <p className="text-xs text-emerald-700">
            Available for use at checkout or partner check-in.
          </p>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-4">Recent Transactions</h3>
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Joining Card Cashback (10%)</p>
                  <p className="text-xs text-slate-400">Card Activation Reward</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600">+₹10.00</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
