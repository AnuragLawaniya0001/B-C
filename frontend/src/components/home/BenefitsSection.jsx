import React from 'react';
import { Home, Activity, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';

const iconMap = {
  home: Home,
  activity: Activity,
  'shopping-bag': ShoppingBag,
};

const defaultBenefits = [
  {
    icon: 'home',
    title: 'Dormitory Network',
    desc: 'Affordable, secure offline hostel stays for sports athletes, traveling students, and defense candidates across India.',
  },
  {
    icon: 'activity',
    title: 'Physiotherapy Clinics',
    desc: 'Specialized sports injury recovery, physical therapy consultations, and posture care at certified partner clinics.',
  },
  {
    icon: 'shopping-bag',
    title: 'Sports Gear & Apparel',
    desc: 'Authentic athletic gear, training apparel, and sports essentials with verified member-only discounts.',
  },
];

export function BenefitsSection({ content = {} }) {
  const heading = content?.heading || 'Everything You Need in One Unified Ecosystem';
  const items = content?.items && content.items.length > 0 ? content.items : defaultBenefits;

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {heading}
        </h2>
      </div>

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
