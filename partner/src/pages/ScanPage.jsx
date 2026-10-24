import React from 'react';
import { Card } from '../components/ui/Card';
import { QrCode } from 'lucide-react';

export default function ScanPage() {
  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Member QR Scanner</h1>
        <p className="text-slate-500 text-sm mt-1">Scan member digital card for attendance & benefit verification.</p>
      </div>

      <Card className="p-8 border-dashed border-2 border-slate-300 bg-white">
        <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <QrCode className="w-12 h-12 text-slate-600" />
        </div>
        <h3 className="font-semibold text-slate-800">QR scanner coming soon</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
          Hardware camera access, signed token decryption, and instant ledger check-in will be enabled in the partner features phase.
        </p>
      </Card>
    </div>
  );
}
