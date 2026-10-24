import React from 'react';
import { Card } from '../components/ui/Card';

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Check-in History & Settlement Logs</h1>
      <p className="text-slate-500 text-sm">Past customer visits, verified digital card scans, and transaction records.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Historical check-in logs table and CSV export coming soon.</p>
      </Card>
    </div>
  );
}
