import { cn } from '../lib/cn';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
}

const sizeClasses: Record<TextareaSize, string> = {
  sm: 'min-h-24 px-3 py-2 text-sm',
  md: 'min-h-28 px-4 py-3 text-base',
  lg: 'min-h-32 px-4 py-3 text-lg',
};

export function Textarea({ size = 'md', className, disabled, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full rounded-sm border border-border bg-background text-text-primary placeholder:text-text-secondary',
        'transition-colors motion-safe:duration-fast motion-safe:ease-default',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
        'resize-y',
        disabled && 'cursor-not-allowed bg-surface text-text-disabled',
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
