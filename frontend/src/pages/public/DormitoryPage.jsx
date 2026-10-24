import React from 'react';
import { Building2 } from 'lucide-react';

export default function DormitoryPage() {
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-8 h-8 text-primary-900" />
        <h1 className="text-3xl font-bold text-slate-900">Partner Dormitory Stays</h1>
      </div>
      <p className="text-slate-600">
        Affordable, secure hostel and dormitory accommodations for athletes, tournament participants, and students.
      </p>
    </div>
  );
}
