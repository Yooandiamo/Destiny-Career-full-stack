import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card = ({ children, className, elevated = true, ...props }: PropsWithChildren<CardProps>) => {
  return (
    <article
      className={cn(
        'rounded-3xl border border-white/70 bg-white p-4',
        elevated && 'shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </article>
  );
};
