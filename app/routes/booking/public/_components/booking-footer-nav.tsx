import * as React from 'react';
import { cn } from '~/ui';

export interface BookingFooterNavProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

const gridClassByColumns: Record<NonNullable<BookingFooterNavProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

export function BookingFooterNav({ children, columns = 2, className, ...props }: BookingFooterNavProps) {
  return (
    <div className="w-full pt-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--space-sm))' }}>
      <div className="mx-auto w-full max-w-3xl md:max-w-5xl">
        <nav
          aria-label="Booking handlinger"
          className={cn(
            'rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-2 shadow-[var(--shadow-booking-floating)] md:p-2',
            className,
          )}
          {...props}
        >
          <div className={cn('grid w-full gap-2', gridClassByColumns[columns])}>{children}</div>
        </nav>
      </div>
    </div>
  );
}
