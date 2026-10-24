import React from 'react';
import { Card } from '../ui/Card';

export function HowItWorksSection({ content }) {
  if (!content) return null;
  const steps = content.steps || [];

  return (
    <div className="space-y-8 py-8">
      {content.heading && (
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {content.heading}
          </h2>
        </div>
      )}

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
