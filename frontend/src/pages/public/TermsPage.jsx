import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-primary-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">Terms of Service</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-900 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500">Last updated: October 2026 • BIGCHAMP Sports & Wellness Pvt Ltd</p>
      </div>

      <Card className="p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the BIGCHAMP storefront, mobile application, or any associated digital services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue using our platform immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Platform Accounts & Registration</h2>
          <p>
            Users may register for free customer accounts or activate a paid BIGCHAMP Digital Membership Pass. All customer identifiers (email and mobile numbers) must be verified via OTP. You are responsible for safeguarding your login credentials and session tokens.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Store Catalog & Authoritative Pricing</h2>
          <p>
            All prices, discounts, delivery fees, and taxes displayed on the storefront are subject to backend authoritative validation upon checkout. BIGCHAMP reserves the right to correct pricing errors before payment capture. Orders are confirmed only upon successful Razorpay payment verification or approved COD/wallet authorization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Digital Membership & Cookey Program</h2>
          <p>
            BIGCHAMP Digital Membership is valid for the duration specified at the time of purchase (standard: 334 days). Membership passes and Cookey participation are personal to the verified account holder and are non-transferable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
          </p>
        </section>
      </Card>
    </div>
  );
}
