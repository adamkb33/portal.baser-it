import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';

export type ButtonVariant =
  // neutral / brand
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  // filled status (template btn--success/warning/danger/info)
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  // tinted "soft" tones (template btn--soft-*)
  | 'soft-primary'
  | 'soft-success'
  | 'soft-warning'
  | 'soft-danger'
  | 'soft-info'
  // colored outline tones (template btn--outline-*)
  | 'outline-primary'
  | 'outline-success'
  | 'outline-danger';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** Pressed/selected state (template `.is-active`). */
  active?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  // neutral / brand
  primary: 'bg-interactive text-text-inverse shadow-sm hover:bg-interactive-hover',
  secondary: 'bg-surface-variant-2 border-border text-text-primary hover:bg-surface-variant-1 hover:border-text-disabled',
  outline: 'border-border bg-background text-text-primary hover:border-text-disabled hover:shadow-sm',
  ghost: 'text-interactive hover:bg-surface',
  destructive: 'bg-danger text-text-inverse hover:brightness-95',
  // filled status
  success: 'bg-success text-text-inverse hover:brightness-95',
  warning: 'bg-warning text-text-inverse hover:brightness-95',
  danger: 'bg-danger text-text-inverse hover:brightness-95',
  info: 'bg-info text-text-inverse hover:brightness-95',
  // soft tones
  'soft-primary': 'bg-blue-50 text-interactive hover:brightness-95',
  'soft-success': 'bg-success-soft text-success hover:brightness-95',
  'soft-warning': 'bg-warning-soft text-warning hover:brightness-95',
  'soft-danger': 'bg-danger-soft text-danger hover:brightness-95',
  'soft-info': 'bg-info-soft text-info hover:brightness-95',
  // colored outline
  'outline-primary': 'border-interactive bg-transparent text-interactive hover:bg-blue-50',
  'outline-success': 'border-success bg-transparent text-success hover:bg-success-soft',
  'outline-danger': 'border-danger bg-transparent text-danger hover:bg-danger-soft',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    active = false,
    asChild = false,
    className,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot : 'button';
  const buttonClassName = cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] border border-transparent font-semibold',
    'transition-[color,background-color,border-color,box-shadow,filter] motion-safe:duration-fast motion-safe:ease-default',
    'focus-visible:outline-none focus-visible:ring-[length:var(--border-focus-ring)] focus-visible:ring-interactive',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    variantClasses[variant],
    active && 'bg-blue-50 text-interactive',
    (disabled || loading) && 'cursor-not-allowed opacity-50',
    fullWidth && 'w-full',
    sizeClasses[size],
    className,
  );

  if (asChild) {
    return (
      <Slot
        ref={ref}
        data-active={active || undefined}
        className={buttonClassName}
        aria-busy={loading}
        aria-pressed={active || undefined}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <Component
      ref={ref}
      data-active={active || undefined}
      className={buttonClassName}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-pressed={active || undefined}
      {...props}
    >
      {loading ? (
        <span className="inline-block size-3 animate-spin rounded-full border border-current border-r-transparent" />
      ) : null}
      {children}
    </Component>
  );
});
