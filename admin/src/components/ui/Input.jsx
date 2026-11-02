import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      type = 'text',
      className,
      disabled = false,
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-300"
          >
            {label}
            {required && <span className="text-amber-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            disabled={disabled}
            className={cn(
              'w-full px-3.5 py-2.5 text-sm rounded-xl border bg-[#050b14]/90 text-white placeholder-slate-500 transition-all duration-150',
              'focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25',
              'disabled:bg-slate-900/50 disabled:text-slate-500 disabled:cursor-not-allowed',
              error
                ? 'border-red-400 text-red-200 focus:border-red-500 focus:ring-red-400/20'
                : 'border-white/15 hover:border-white/25',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-slate-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
