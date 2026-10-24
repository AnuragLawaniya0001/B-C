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
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl',
        border && 'border border-slate-200',
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
