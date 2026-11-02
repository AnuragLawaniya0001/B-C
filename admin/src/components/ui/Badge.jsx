import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) {
  const variants = {
    default: 'bg-white/10 text-slate-200 border-white/15',
    primary: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider uppercase font-bold',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border backdrop-blur-sm',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
