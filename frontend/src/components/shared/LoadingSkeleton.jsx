import React from 'react';

export function LoadingSkeleton({ count = 3, className = 'h-24' }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-slate-200 animate-pulse rounded-xl w-full ${className}`}
        />
      ))}
    </div>
  );
}
