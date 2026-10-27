import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PageHeader({ title, description, children, breadcrumbs, backLink = '/store', backText = 'Back to Store' }) {
  return (
    <div className="mb-8 pb-6 border-b border-white/10">
      <div className="flex items-center justify-between mb-4">
        {breadcrumbs ? (
          <div className="text-xs text-slate-400 font-medium">{breadcrumbs}</div>
        ) : (
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backText}</span>
          </Link>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-display">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
