import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      type = 'button',
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#02050b] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black hover:brightness-110 focus:ring-amber-400 shadow-md shadow-amber-500/20 border-0',
      secondary:
        'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 focus:ring-amber-400',
      outline:
        'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/30 focus:ring-white/20',
      danger:
        'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 focus:ring-rose-500',
      ghost:
        'text-slate-400 hover:text-white hover:bg-white/5 focus:ring-white/10',
      gold:
        'btn-gold',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
