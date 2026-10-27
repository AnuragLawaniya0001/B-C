import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, QrCode, Stethoscope, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function PhysioPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" />
          <span>Sports Healthcare & Rehab</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          Sports Physiotherapy & Recovery Clinics
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Certified sports injury prevention, athletic rehabilitation, and physical therapy through BIGCHAMP's affiliated healthcare provider network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Member Concessions</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Active BIGCHAMP passholders receive priority consultation appointments and preferential rates on sports physical therapy, post-match recovery sessions, and biomechanical posture assessments.
          </p>
          <Link to="/membership" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">
            Check Membership Benefits <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card className="p-6 space-y-4 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-900 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Clinic Verification</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Visiting an affiliated clinic? Present your signed BIGCHAMP QR pass on your mobile device at reception for instant eligibility check and privilege redemption.
          </p>
          <Link to="/dashboard/card" className="inline-flex items-center gap-1 text-xs font-bold text-primary-900 hover:text-accent-600">
            Open Digital Pass <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Services Breakdown */}
      <Card className="p-6 sm:p-8 border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Core Athletic Care Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Injury Rehabilitation</span>
            </div>
            <p>Targeted therapy for ACL, rotator cuff, ankle sprains, and tendonitis.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Recovery & Cryo</span>
            </div>
            <p>Pneumatic compression boots, localized cryotherapy, and deep tissue release.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Return-to-Play Testing</span>
            </div>
            <p>Objective strength, agility, and load tolerance criteria before competition.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
