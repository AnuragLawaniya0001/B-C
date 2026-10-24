import React from 'react';
import { Stethoscope } from 'lucide-react';

export default function PhysioPage() {
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Stethoscope className="w-8 h-8 text-primary-900" />
        <h1 className="text-3xl font-bold text-slate-900">Physiotherapy & Recovery Clinics</h1>
      </div>
      <p className="text-slate-600">
        Certified sports injury clinics offering discounted assessments, rehab, and recovery sessions for Bigchamp members.
      </p>
    </div>
  );
}
