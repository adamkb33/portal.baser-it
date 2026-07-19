import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '~/ui';
import {
  bookingActionBaseClass,
  bookingActionSizeClass,
  bookingActionVariantClass,
  type BookingActionSize,
  type BookingActionVariant,
} from './booking-action-styles';

export interface BookingLinkProps extends LinkProps {
  variant?: BookingActionVariant;
  size?: BookingActionSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const BookingLink = React.forwardRef<HTMLAnchorElement, BookingLinkProps>(function BookingLink(
  {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    className,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <Link
      ref={ref}
      aria-disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      className={cn(
        bookingActionBaseClass,
        bookingActionVariantClass[variant],
        bookingActionSizeClass[size],
        fullWidth && 'w-full',
        isDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />}
      {children}
    </Link>
  );
});
