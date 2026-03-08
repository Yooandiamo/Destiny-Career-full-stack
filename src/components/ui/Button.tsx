import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-soft active:bg-brand-600',
  secondary: 'bg-white text-slate-900 border border-slate-200 active:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 active:bg-slate-100',
  danger: 'bg-red-50 text-red-600 border border-red-100 active:bg-red-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  ...props
}: PropsWithChildren<ButtonProps>) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      transition={{ duration: 0.16 }}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? '处理中...' : children}
    </motion.button>
  );
};
