import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, QrCode, Stethoscope, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PhysioPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-white">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span>Sports Healthcare &amp; Rehab</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-syne font-black text-white tracking-tight">
          Sports Physiotherapy &amp; Recovery Clinics
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Certified sports injury prevention, athletic rehabilitation, and physical therapy through BIGCHAMP's affiliated healthcare provider network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-7 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h3 className="font-syne font-bold text-lg text-white">Member Concessions</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Active BIGCHAMP passholders receive priority consultation appointments and preferential rates on sports physical therapy, post-match recovery sessions, and biomechanical posture assessments.
          </p>
          <Link to="/membership" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
            <span>Check Membership Benefits</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-7 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-syne font-bold text-lg text-white">Clinic Verification</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Visiting an affiliated clinic? Present your signed BIGCHAMP QR pass on your mobile device at reception for instant eligibility check and privilege redemption.
          </p>
          <Link to="/membership" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
            <span>Open Digital Pass</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Services Breakdown */}
      <div className="p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 space-y-6 shadow-xl">
        <h3 className="font-syne font-bold text-lg text-white">Core Athletic Care Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-300">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Injury Rehabilitation</span>
            </div>
            <p className="text-slate-400 text-xs">Targeted therapy for ACL, rotator cuff, ankle sprains, and tendonitis.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Recovery &amp; Cryo</span>
            </div>
            <p className="text-slate-400 text-xs">Pneumatic compression boots, localized cryotherapy, and deep tissue release.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Return-to-Play Testing</span>
            </div>
            <p className="text-slate-400 text-xs">Objective strength, agility, and load tolerance criteria before competition.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
