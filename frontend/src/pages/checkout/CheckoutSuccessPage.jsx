import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center shadow-md">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
        <p className="text-sm text-slate-600 mb-6">
          Thank you for your purchase. We are preparing your sports gear package.
        </p>
        <div className="space-y-3">
          <Link to="/dashboard/orders">
            <Button variant="primary" className="w-full">
              View Order in Dashboard
            </Button>
          </Link>
          <Link to="/store">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
