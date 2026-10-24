import React from 'react';

export function PageHeader({ title, description, children, breadcrumbs }) {
  return (
    <div className="mb-6 pb-5 border-b border-slate-200">
      {breadcrumbs && <div className="mb-2 text-xs text-slate-500">{breadcrumbs}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </div>
  );
}
