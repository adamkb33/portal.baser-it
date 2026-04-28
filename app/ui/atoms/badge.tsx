import { cn } from '../lib/cn';

export type BadgeVariant = 'primary' | 'secondary' | 'ghost' | 'default' | 'outline' | 'destructive';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-interactive text-text-inverse',
  secondary: 'border border-interactive text-interactive bg-surface',
  ghost: 'text-text-secondary',
  default: 'bg-interactive text-text-inverse',
  outline: 'border border-border bg-background text-text-primary',
  destructive: 'bg-destructive text-text-inverse',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-xs font-medium',
  md: 'px-3 py-1.5 text-sm font-medium',
};

export function Badge({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn('inline-flex items-center justify-center rounded-full', variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
