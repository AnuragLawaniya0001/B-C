import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Cookie, Clock, Sparkles } from 'lucide-react';

export default function CookeyTrackerPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <PageHeader
        title="Cookey Tracker & Lucky Draw"
        description="Monitor your 7-day cooldown timer and track your active entries in the Bigchamp lucky draw."
        backLink="/store"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-900/80 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <Cookie className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Purchase Cooldown</p>
              <h3 className="text-xl font-bold text-white">Eligible Now</h3>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            You can purchase 1 Cookey unit every 7 days. Each purchase provides a ticket to the weekly lucky draw pool.
          </p>
        </Card>

        <Card className="p-6 bg-slate-900/80 border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lucky Draw Entries</p>
              <h3 className="text-xl font-bold text-white">0 Active Tickets</h3>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Purchase a Cookey to enter this week&apos;s draw. Winners will be announced directly on the portal.
          </p>
        </Card>
      </div>
    </div>
  );
}
