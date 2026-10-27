import React from 'react';
import { PackageOpen } from 'lucide-react';

export function EmptyState({
  title = 'No data available',
  description = 'There is currently nothing to display here.',
  icon: Icon = PackageOpen,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/60 backdrop-blur-md border border-dashed border-slate-800 rounded-2xl text-white">
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4 shadow-lg border border-amber-500/20">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-white font-display">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
