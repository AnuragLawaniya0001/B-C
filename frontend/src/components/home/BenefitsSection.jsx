import React from 'react';
import { Home, Activity, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';

const iconMap = {
  home: Home,
  activity: Activity,
  'shopping-bag': ShoppingBag,
};

export function BenefitsSection({ content }) {
  if (!content) return null;
  const items = content.items || [];

  return (
    <div className="space-y-6 pt-4">
      {content.heading && (
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {content.heading}
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => {
          const Icon = iconMap[item.icon] || ShieldCheck;
          return (
            <Card key={idx} className="p-6 hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-primary-300">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-800 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default BenefitsSection;
