import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Card({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  border = true,
  ...props
}) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadows = {
    none: 'shadow-none',
    sm: 'shadow-md shadow-black/40',
    md: 'shadow-xl shadow-black/60',
    lg: 'shadow-2xl shadow-black/80',
  };

  return (
    <div
      className={cn(
        'bg-[#060b16]/85 backdrop-blur-xl rounded-2xl text-slate-100 transition-all duration-200',
        border && 'border border-white/10 hover:border-white/20',
        paddings[padding],
        shadows[shadow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
