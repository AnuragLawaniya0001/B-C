import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function ArmyOfferPage() {
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-8 h-8 text-primary-900" />
        <h1 className="text-3xl font-bold text-slate-900">Army & Defense Special Offer</h1>
      </div>
      <p className="text-slate-600 mb-6">
        Bigchamp proudly supports India&apos;s Armed Forces, Veterans, and Para-Military personnel with an extra 10% discount across our entire platform.
      </p>
      <Card className="p-6 border-primary-200 bg-primary-50/50">
        <h3 className="font-semibold text-primary-900 mb-1">Defense Verification</h3>
        <p className="text-sm text-slate-600">
          Upload your service ID or defense credentials during registration to automatically unlock extra defense benefits.
        </p>
      </Card>
    </div>
  );
}
