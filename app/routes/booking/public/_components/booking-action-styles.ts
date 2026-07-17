export type BookingActionVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inline';

export type BookingActionSize = 'sm' | 'md';

export const bookingActionBaseClass =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-booking-control)] border-[length:var(--border-booking-control)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action';

export const bookingActionVariantClass: Record<BookingActionVariant, string> = {
  primary:
    'border-booking-action bg-booking-action text-booking-action-contrast shadow-sm hover:bg-booking-action-hover',
  secondary: 'border-booking-action bg-transparent text-booking-action hover:bg-booking-action-muted',
  outline: 'border-booking-border bg-transparent text-booking-text hover:bg-booking-surface-muted',
  ghost: 'border-transparent bg-transparent text-booking-text hover:bg-booking-surface-muted',
  inline:
    'min-h-0 justify-start rounded-none border-transparent bg-transparent p-0 text-booking-action underline-offset-4 hover:text-booking-action-hover hover:underline',
};

export const bookingActionSizeClass: Record<BookingActionSize, string> = {
  sm: 'min-h-10 px-3 py-1.5 text-xs md:text-sm',
  md: 'min-h-12 px-2 py-0 text-xs md:min-h-12 md:px-3 md:text-sm',
};
