import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '~/ui';
import {
  bookingActionBaseClass,
  bookingActionSizeClass,
  bookingActionVariantClass,
  type BookingActionSize,
  type BookingActionVariant,
} from './booking-action-styles';

export interface BookingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BookingActionVariant;
  size?: BookingActionSize;
  fullWidth?: boolean;
  loading?: boolean;
}

export const BookingActionButton = React.forwardRef<HTMLButtonElement, BookingActionButtonProps>(
  function BookingActionButton(
    { variant = 'primary', size = 'md', fullWidth = false, className, disabled, loading = false, children, ...props },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          bookingActionBaseClass,
          bookingActionVariantClass[variant],
          bookingActionSizeClass[size],
          fullWidth && 'w-full',
          isDisabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
