import React from 'react';
import { Card } from '../components/ui/Card';

export default function ProductsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Products Catalog</h1>
      <p className="text-slate-500 text-sm">Manage gear inventory, apparel variants, and pricing rules.</p>
      <Card className="p-6">
        <p className="text-sm text-slate-600">Product inventory management catalog coming soon.</p>
      </Card>
    </div>
  );
}
