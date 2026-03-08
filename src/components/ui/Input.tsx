import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  const inputId = id ?? props.name;

  return (
    <label htmlFor={inputId} className="flex w-full flex-col gap-1.5">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-sm transition-colors outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-300/30',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
};
