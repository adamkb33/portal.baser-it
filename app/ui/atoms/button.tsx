import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-interactive text-text-inverse hover:bg-interactive-hover',
  secondary: 'border border-interactive text-interactive hover:bg-surface',
  outline: 'border border-border bg-background text-text-primary hover:bg-surface',
  ghost: 'text-interactive hover:bg-surface',
  destructive: 'border border-flash-error-border bg-flash-error-bg text-flash-error-text hover:bg-flash-error-border',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm font-medium',
  md: 'h-10 px-4 text-base font-medium',
  lg: 'h-12 px-5 text-lg font-medium',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    asChild = false,
    className,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-medium transition-colors motion-safe:duration-fast motion-safe:ease-default',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
        variantClasses[variant],
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        fullWidth && 'w-full',
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border border-current border-r-transparent" /> : null}
      {children}
    </Component>
  );
});
