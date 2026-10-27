import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-primary-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">Refund & Cancellation</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>7-Day Return Guarantee</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          Refund & Cancellation Policy
        </h1>
        <p className="text-xs text-slate-500">Last updated: October 2026 • BIGCHAMP Customer Assurance</p>
      </div>

      <Card className="p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Order Cancellations</h2>
          <p>
            Customers may cancel any order before it enters the "SHIPPED" status directly from their Customer Dashboard (`/dashboard/orders`). Once cancelled, payments are refunded immediately to the customer's BIGCHAMP wallet or returned to the original payment source within 5–7 business days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. 7-Day Returns & Replacements</h2>
          <p>
            We offer a 7-day hassle-free return and replacement policy on all sports equipment, gear, and apparel, subject to the following conditions:
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Item must be unused with original tags, packaging, and accessories intact.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Manufacturing defects or shipping damages are replaced at zero cost.</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Non-Returnable Items</h2>
          <p>
            Digital Membership Passes, promotional Cookey tokens, customized jerseys, and intimate athletic supporters cannot be returned once activated or opened, except in verified cases of technical error.
          </p>
        </section>
      </Card>
    </div>
  );
}
