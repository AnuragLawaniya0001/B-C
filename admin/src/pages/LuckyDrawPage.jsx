import React from 'react';
import { Card } from '../components/ui/Card';

export default function LuckyDrawPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Lucky Draw Management</h1>
      <p className="text-slate-500 text-sm">Configure prize pools, schedule automated draws, and publish winners.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Lucky draw execution panel and algorithm auditor coming soon.</p>
      </Card>
    </div>
  );
}
