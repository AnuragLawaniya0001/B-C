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
    sm: 'shadow-md',
    md: 'shadow-xl',
    lg: 'shadow-2xl',
  };

  return (
    <div
      className={cn(
        'bg-slate-900/80 backdrop-blur-xl rounded-2xl text-slate-100',
        border && 'border border-white/10',
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

export default Card;
