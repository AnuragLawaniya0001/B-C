import React from 'react';
import { PackageOpen } from 'lucide-react';

export function EmptyState({
  title = 'No data available',
  description = 'There is currently nothing to display here.',
  icon: Icon = PackageOpen,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
