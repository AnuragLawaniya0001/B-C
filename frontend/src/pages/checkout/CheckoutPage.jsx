import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
      <p className="text-slate-600 mb-8">Shipping address and payment method.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Delivery Address</h3>
            <Input label="Full Name" placeholder="e.g. Rahul Sharma" />
            <Input label="Street Address" placeholder="Apartment, Street name" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" placeholder="e.g. Pune" />
              <Input label="PIN Code" placeholder="e.g. 411001" />
            </div>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Order Summary</h3>
            <div className="text-sm space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="text-emerald-600">FREE</span>
              </div>
            </div>
            <Link to="/checkout/success">
              <Button variant="secondary" className="w-full mt-4">
                Place Order (Demo)
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
