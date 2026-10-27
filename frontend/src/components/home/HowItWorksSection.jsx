import React from 'react';
import { Card } from '../ui/Card';

const defaultSteps = [
  {
    number: '1',
    title: 'Free Registration',
    desc: 'Sign up with your mobile number or email in under 30 seconds to start browsing the ecosystem.',
  },
  {
    number: '2',
    title: 'Activate ₹100 Card',
    desc: 'Optional 11-month digital membership card unlocking wallet cashback and premium benefits.',
  },
  {
    number: '3',
    title: 'Book Stays & Physio',
    desc: 'Enjoy verified sports dormitories and partner physiotherapy clinics across India.',
  },
  {
    number: '4',
    title: 'Weekly Lucky Draw',
    desc: 'Participate in the exclusive Cookey draw every 7 days for cash prizes and wallet rewards.',
  },
];

export function HowItWorksSection({ content = {} }) {
  const heading = content?.heading || 'How Bigchamp Works';
  const steps = content?.steps && content.steps.length > 0 ? content.steps : defaultSteps;

  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {heading}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <Card key={idx} className="p-6 relative space-y-3 hover:shadow-md transition-shadow border-slate-200">
            <div className="w-10 h-10 rounded-full bg-accent-500 text-slate-950 font-black text-base flex items-center justify-center">
              {step.number || idx + 1}
            </div>
            <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default HowItWorksSection;
