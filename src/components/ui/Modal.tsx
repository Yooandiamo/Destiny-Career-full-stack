import { AnimatePresence, motion } from 'framer-motion';
import { type PropsWithChildren, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  title?: string;
  open: boolean;
  onClose: () => void;
  className?: string;
  bodyClassName?: string;
  hideClose?: boolean;
}

export const Modal = ({
  title,
  open,
  onClose,
  className,
  bodyClassName,
  hideClose,
  children,
}: PropsWithChildren<ModalProps>) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ y: 28, opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0.85 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(event) => event.stopPropagation()}
            className={cn('w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl', className)}
          >
            {(title || !hideClose) && (
              <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </header>
            )}
            <section className={cn('max-h-[78vh] overflow-y-auto p-5', bodyClassName)}>{children}</section>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
