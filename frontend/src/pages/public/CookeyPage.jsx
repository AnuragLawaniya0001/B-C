import React from 'react';
import { Cookie, Gift } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function CookeyPage() {
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Cookie className="w-8 h-8 text-accent-500" />
        <h1 className="text-3xl font-bold text-slate-900">Exclusive &ldquo;Cookey&rdquo; Experience</h1>
      </div>
      <p className="text-slate-600 mb-6">
        ₹100 signature product featuring 7-day cooldown purchase cycles and exciting Lucky Draw rewards.
      </p>
      <Card className="p-6 border-accent-200 bg-accent-50/50">
        <div className="flex items-center gap-2 text-accent-700 font-semibold mb-2">
          <Gift className="w-5 h-5" /> Lucky Draw Entry Included
        </div>
        <p className="text-sm text-slate-600">
          Every verified Cookey purchase automatically enters the weekly lucky draw pool. Stay tuned for live rules and draw schedule in the next phase.
        </p>
      </Card>
    </div>
  );
}
