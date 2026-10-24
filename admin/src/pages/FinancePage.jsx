import React from 'react';
import { Card } from '../components/ui/Card';

export default function FinancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Finance & Wallets</h1>
      <p className="text-slate-500 text-sm">Revenue reconciliation, card memberships, and partner payout settlements.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Financial ledgers, cashback liabilities, and settlement schedules coming soon.</p>
      </Card>
    </div>
  );
}
