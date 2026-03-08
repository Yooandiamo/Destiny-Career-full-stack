import type { PropsWithChildren } from 'react';
import { cn } from '../utils/cn';

interface AppShellProps {
  className?: string;
}

export const AppShell = ({ children, className }: PropsWithChildren<AppShellProps>) => {
  return (
    <div className="min-h-dvh bg-surface px-0 text-slate-900">
      <div
        className={cn(
          'mx-auto min-h-dvh w-full max-w-lg bg-surface pb-[max(88px,env(safe-area-inset-bottom)+72px)]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
