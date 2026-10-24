import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Package } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Orders"
        description="Track your gear shipments, delivery updates, and purchase invoices."
      />
      <EmptyState
        icon={Package}
        title="No orders placed yet"
        description="Browse our sports store and activewear collection to place your first order."
      />
    </div>
  );
}
