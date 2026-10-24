import React from 'react';
import { Card } from '../components/ui/Card';

export default function PartnersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Offline Partners Directory</h1>
      <p className="text-slate-500 text-sm">Dormitories, athletic hostels, and sports physiotherapy clinics.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Partner directory and verification approvals coming soon.</p>
      </Card>
    </div>
  );
}
