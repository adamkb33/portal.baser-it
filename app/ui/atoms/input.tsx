import * as React from 'react';
import { cn } from '../lib/cn';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  /** Leading icon rendered inside the field (template `.input-icon`). */
  startIcon?: React.ReactNode;
  /** Invalid styling (template `.is-invalid`). */
  invalid?: boolean;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', startIcon, invalid = false, className, disabled, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full rounded-[var(--radius-field)] border border-border bg-background text-text-primary placeholder:text-text-disabled',
        'transition-[color,border-color,box-shadow,background-color] motion-safe:duration-base motion-safe:ease-default',
        'focus-visible:outline-none focus-visible:border-interactive focus-visible:ring-[3px] focus-visible:ring-blue-50',
        invalid && 'border-danger focus-visible:border-danger focus-visible:ring-danger-soft',
        disabled && 'cursor-not-allowed bg-surface-variant-2 text-text-disabled',
        startIcon && 'pl-9',
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );

  if (!startIcon) return input;

  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-disabled [&_svg]:size-full">
        {startIcon}
      </span>
      {input}
    </div>
  );
});
