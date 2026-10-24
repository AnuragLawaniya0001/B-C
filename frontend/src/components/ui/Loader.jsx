import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Loader({ size = 'md', className, text }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-4 gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary-900', sizes[size])} />
      {text && <p className="text-xs text-slate-500 font-medium">{text}</p>}
    </div>
  );
}
