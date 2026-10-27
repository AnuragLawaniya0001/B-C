import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-primary-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">Privacy Policy</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-900 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500">Last updated: October 2026 • BIGCHAMP Sports & Wellness Pvt Ltd</p>
      </div>

      <Card className="p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to deliver sports equipment and athletic memberships, including:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
            <li>Contact details: verified mobile number, email address, and legal name.</li>
            <li>Delivery information: shipping addresses, contact numbers, and delivery instructions.</li>
            <li>Transaction history: order records, coupon redemptions, and wallet ledger entries.</li>
            <li>Device & session data: IP addresses, browser agents, and secure authentication tokens.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. How We Protect Payment Information</h2>
          <p>
            BIGCHAMP does not store debit card, credit card, or net banking numbers on our servers. All digital payments are processed through Razorpay's PCI-DSS compliant infrastructure with server-side HMAC-SHA256 signature verification.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Data Sharing & Third Parties</h2>
          <p>
            We share delivery information strictly with authorized logistics partners to fulfill orders. We do not sell, rent, or lease customer data to third-party advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Customer Rights & Data Requests</h2>
          <p>
            You can access, update, or request the deletion of your account information at any time through your Customer Account Portal or by contacting our Data Protection Officer at privacy@bigchamp.in.
          </p>
        </section>
      </Card>
    </div>
  );
}
