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
            className="block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
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
              'w-full px-3.5 py-2 text-sm rounded-lg border bg-white transition-colors duration-150',
              'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              error
                ? 'border-red-400 text-red-900 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 text-slate-900 focus:border-primary-600 focus:ring-primary-100',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
