import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, QrCode, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function DormitoryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-900 text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          <span>Affiliated Sports Accommodations</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          Partner Sports Dormitories & Hostels
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Affordable, secure hostel and dormitory accommodations for competing athletes, tournament squads, and training camps across major sports hubs in India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-900 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Member QR Check-in</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Active BIGCHAMP Digital Passholders enjoy subsidized daily and weekly stay rates at partner sports dormitories. Simply present your dynamic security QR code at the facility reception for immediate verification.
          </p>
          <Link to="/dashboard/card" className="inline-flex items-center gap-1 text-xs font-bold text-primary-900 hover:text-accent-600">
            View Your Digital Pass <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card className="p-6 space-y-4 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Facility Onboarding</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you a sports academy, hostel, or dormitory operator? Join the BIGCHAMP partner network to receive athlete bookings, automated QR verification, and regular settlements.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-1 text-xs font-bold text-accent-600 hover:text-accent-700">
            Partner Inquiries <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Verified Standards */}
      <Card className="p-6 sm:p-8 border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Partner Facility Standards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Athletic Nutrition</span>
            </div>
            <p>Hygienic athlete mess and high-protein dietary options available.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Proximity to Arenas</span>
            </div>
            <p>Located within 5 km of stadiums and major training facilities.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>24/7 Security</span>
            </div>
            <p>CCTV monitored, biometric access, and secure locker facilities.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
