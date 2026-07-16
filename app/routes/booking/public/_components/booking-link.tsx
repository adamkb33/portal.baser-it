import * as React from 'react';
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
  fullWidth?: boolean;
}

export const BookingLink = React.forwardRef<HTMLAnchorElement, BookingLinkProps>(function BookingLink(
  { variant = 'primary', size = 'md', disabled = false, fullWidth = false, className, children, onClick, ...props },
  ref,
) {
  return (
    <Link
      ref={ref}
      aria-disabled={disabled}
      onClick={(event) => {
        if (disabled) {
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
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
});
