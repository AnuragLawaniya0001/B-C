import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function MembershipPayPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Activate Membership</h1>
        <p className="text-sm text-slate-500 mb-6">
          Step 5: Pay ₹100 for your 11-month Bigchamp digital membership card.
        </p>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Membership Card Fee:</span>
            <span className="font-semibold text-slate-800">₹100</span>
          </div>
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Wallet Cashback (10%):</span>
            <span className="font-semibold">+ ₹10</span>
          </div>
        </div>

        <Link to="/register/success">
          <Button variant="secondary" className="w-full">
            Pay ₹100 & Activate Card
          </Button>
        </Link>
      </Card>
    </div>
  );
}
