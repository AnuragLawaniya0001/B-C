import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSettingsStore } from '../../store/settingsStore';

export default function ShippingPolicyPage() {
  const { getBusinessRules } = useSettingsStore();
  const rules = getBusinessRules();
  const freeThreshold = Math.round((rules.free_delivery_threshold_paise || 50000) / 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-primary-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">Shipping & Delivery</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-900 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" />
          <span>Nationwide Logistics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs text-slate-500">Last updated: October 2026 • BIGCHAMP Express Logistics</p>
      </div>

      <Card className="p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Delivery Coverage & Timelines</h2>
          <p>
            We ship certified sports gear and apparel across all serviceable pin codes in India. Metro orders are delivered within 2–4 business days, while non-metro and regional deliveries take 4–7 business days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Shipping Charges & Free Delivery</h2>
          <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 text-primary-950 font-semibold text-xs sm:text-sm">
            🚚 Free standard delivery is automatically applied on all orders of ₹{freeThreshold} or more.
          </div>
          <p>
            For orders below ₹{freeThreshold}, a standard nominal delivery charge is calculated dynamically during checkout based on weight and destination.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Real-Time Tracking</h2>
          <p>
            Once an order is dispatched, a tracking AWB number is updated on your Customer Dashboard (`/dashboard/orders`) and sent via SMS/email notification.
          </p>
        </section>
      </Card>
    </div>
  );
}
