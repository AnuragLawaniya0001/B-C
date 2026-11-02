import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, QrCode, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DormitoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-white">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Affiliated Sports Accommodations</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-syne font-black text-white tracking-tight">
          Partner Sports Dormitories &amp; Hostels
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Affordable, secure hostel and dormitory accommodations for competing athletes, tournament squads, and training camps across major sports hubs in India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-7 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-syne font-bold text-lg text-white">Member QR Check-in</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Active BIGCHAMP Digital Passholders enjoy subsidized daily and weekly stay rates at partner sports dormitories. Simply present your dynamic security QR code at the facility reception for immediate verification.
          </p>
          <Link to="/membership" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
            <span>View Your Digital Pass</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-7 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-syne font-bold text-lg text-white">Facility Onboarding</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Are you a sports academy, hostel, or dormitory operator? Join the BIGCHAMP partner network to receive athlete bookings, automated QR verification, and regular settlements.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors">
            <span>Partner Inquiries</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Verified Standards */}
      <div className="p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 space-y-6 shadow-xl">
        <h3 className="font-syne font-bold text-lg text-white">Partner Facility Standards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-300">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Athletic Nutrition</span>
            </div>
            <p className="text-slate-400 text-xs">Hygienic athlete mess and high-protein dietary options available.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Proximity to Arenas</span>
            </div>
            <p className="text-slate-400 text-xs">Located within 5 km of stadiums and major SAI selection facilities.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>24/7 Security</span>
            </div>
            <p className="text-slate-400 text-xs">CCTV monitored, biometric access, and secure gear locker rooms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
