import React from 'react';
import { Card } from '../components/ui/Card';
import { Users, FileCheck2, ShoppingBag, Trophy } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform metrics, quick actions, and system health status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary-900">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-900" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Members</p>
              <p className="text-xl font-bold text-slate-900">1,248</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <FileCheck2 className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending KYC</p>
              <p className="text-xl font-bold text-slate-900">14</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Orders Today</p>
              <p className="text-xl font-bold text-slate-900">32</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-accent-500">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-accent-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Draw Pool</p>
              <p className="text-xl font-bold text-slate-900">₹84,500</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
