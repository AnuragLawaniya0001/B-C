import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { QrCode, CheckCircle2, Users, IndianRupee } from 'lucide-react';

export default function PartnerDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partner Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Check-in counter for student dormitories and recovery clinics.</p>
        </div>
        <Link to="/scan">
          <Button variant="secondary" leftIcon={<QrCode className="w-4 h-4" />}>
            Open QR Scanner
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-primary-900">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary-900" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Verified Check-ins Today</p>
              <p className="text-xl font-bold text-slate-900">18</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Estimated Settlement</p>
              <p className="text-xl font-bold text-slate-900">₹4,500</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-accent-500">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-accent-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Defense Members Served</p>
              <p className="text-xl font-bold text-slate-900">5</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
