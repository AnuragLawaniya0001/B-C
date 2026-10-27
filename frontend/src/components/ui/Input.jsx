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
            className="block text-sm font-semibold text-slate-200"
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
              'w-full px-4 py-2.5 text-sm rounded-xl border bg-slate-950/80 text-white transition-all duration-150',
              'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400',
              'disabled:bg-slate-900/50 disabled:text-slate-500 disabled:cursor-not-allowed',
              error
                ? 'border-red-500 text-red-200 focus:border-red-500 focus:ring-red-500/20'
                : 'border-white/15 hover:border-white/30',
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

export default Input;
