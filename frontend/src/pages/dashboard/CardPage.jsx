import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { QrCode, Shield } from 'lucide-react';

export default function CardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Digital Membership Card"
        description="Present this dynamic QR code at partner dormitories and physio clinics for immediate verification."
      />

      <div className="max-w-md mx-auto">
        {/* Digital Card Preview */}
        <div className="bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <span className="font-black text-xl tracking-wider">
              BIG<span className="text-accent-500">CHAMP</span>
            </span>
            <div className="flex items-center gap-1 text-xs bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-accent-400" />
              <span>Verified Member</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Cardholder</p>
              <h3 className="text-lg font-bold">Rahul Sharma</h3>
              <p className="text-xs font-mono text-slate-300 mt-1">ID: BC-82749102</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Valid Till</p>
              <p className="text-sm font-semibold">Sep 2027 (11 Mo)</p>
            </div>
          </div>
        </div>

        {/* QR Code Stub */}
        <Card className="mt-6 p-6 text-center">
          <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2">
            <QrCode className="w-16 h-16 text-slate-500" />
            <span className="text-xs">Dynamic Signed QR</span>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Security payload updates automatically. Do not share screenshots.
          </p>
        </Card>
      </div>
    </div>
  );
}
