import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Ticket } from 'lucide-react';

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Discount Coupons"
        description="Exclusive vouchers for gear purchases and partner services."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-dashed border-2 border-primary-200 bg-primary-50/40">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary-900" />
            <div>
              <p className="font-bold text-slate-800">WELCOME10</p>
              <p className="text-xs text-slate-500">10% off on your first store order</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
