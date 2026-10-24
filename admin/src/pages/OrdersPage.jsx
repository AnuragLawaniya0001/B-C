import React from 'react';
import { Card } from '../components/ui/Card';

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Orders Management</h1>
      <p className="text-slate-500 text-sm">Fulfill orders, track shipping, and manage returns.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Orders overview table and processing tools coming soon.</p>
      </Card>
    </div>
  );
}
