import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function MembershipPage() {
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="w-8 h-8 text-primary-900" />
        <h1 className="text-3xl font-bold text-slate-900">Digital Membership Card</h1>
      </div>
      <p className="text-slate-600 mb-6">
        ₹100 for 11 months validity with instant wallet cashback and partner privileges across India.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Card Benefits
          </h3>
          <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
            <li>10% joining cashback added to wallet</li>
            <li>QR code scanning at partner dormitories & physio clinics</li>
            <li>Member rates on store merchandise</li>
            <li>Defense personnel additional 10% discount</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
