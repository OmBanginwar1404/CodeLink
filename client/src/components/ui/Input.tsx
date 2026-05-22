import React, { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white/60 dark:bg-zinc-950/50 border rounded-lg py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 
              focus:outline-none focus:ring-2 transition-all backdrop-blur-sm
              ${Icon ? 'pl-10 pr-4' : 'px-4'}
              ${error 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
