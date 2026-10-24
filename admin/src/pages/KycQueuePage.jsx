import React from 'react';
import { Card } from '../components/ui/Card';

export default function KycQueuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">KYC Verification Queue</h1>
      <p className="text-slate-500 text-sm">Review uploaded ID documents and defense credentials for approval.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Pending verification applications queue table coming soon.</p>
      </Card>
    </div>
  );
}
