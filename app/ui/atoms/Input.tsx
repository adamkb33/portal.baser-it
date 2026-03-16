import { cn } from '../lib/cn';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

export function Input({ size = 'md', className, disabled, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-sm border border-border bg-background text-text-primary placeholder:text-text-secondary',
        'transition-colors motion-safe:duration-fast motion-safe:ease-default',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
        disabled && 'cursor-not-allowed bg-gray-50 text-text-disabled',
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
