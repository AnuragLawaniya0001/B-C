import React from 'react';
import { Card } from '../components/ui/Card';

export default function CookeyBuyersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Cookey Buyers & Purchases</h1>
      <p className="text-slate-500 text-sm">Monitor ₹100 Cookey purchases, cooldown timestamps, and buyer eligibility.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Cookey transaction logs and cooldown tracking table coming soon.</p>
      </Card>
    </div>
  );
}
