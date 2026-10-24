import React from 'react';
import { Card } from '../components/ui/Card';

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Registered Users & Members</h1>
      <p className="text-slate-500 text-sm">Manage student athletes, regular members, and defense accounts.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">User listing table with search, role filters, and status coming soon.</p>
      </Card>
    </div>
  );
}
