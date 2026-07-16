import * as React from 'react';
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
}

export const BookingActionButton = React.forwardRef<HTMLButtonElement, BookingActionButtonProps>(
  function BookingActionButton(
    { variant = 'primary', size = 'md', fullWidth = false, className, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          bookingActionBaseClass,
          bookingActionVariantClass[variant],
          bookingActionSizeClass[size],
          fullWidth && 'w-full',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
