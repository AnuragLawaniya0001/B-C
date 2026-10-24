import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Cookie, Clock, Sparkles } from 'lucide-react';

export default function CookeyTrackerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cookey Tracker & Lucky Draw"
        description="Monitor your 7-day cooldown timer and track your active entries in the Bigchamp lucky draw."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-accent-500 text-white rounded-xl">
              <Cookie className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Purchase Cooldown</p>
              <h3 className="text-xl font-bold text-slate-900">Eligible Now</h3>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            You can purchase 1 Cookey unit every 7 days. Each purchase provides a ticket to the weekly lucky draw pool.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Lucky Draw Entries</p>
              <h3 className="text-xl font-bold text-slate-900">0 Active Tickets</h3>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Purchase a Cookey to enter this week&apos;s draw. Winners will be announced directly on the portal.
          </p>
        </Card>
      </div>
    </div>
  );
}
