import type { ReactNode } from 'react';

interface BookingPageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  className?: string;
}

export function BookingPageHeader({ label, title, description, meta, className = '' }: BookingPageHeaderProps) {
  return (
    <div className={`border-b border-border pb-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          {label && (
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
          )}
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
          {description && <p className="text-[0.7rem] text-muted-foreground mt-1">{description}</p>}
        </div>
        {meta && <div className="flex-shrink-0">{meta}</div>}
      </div>
    </div>
  );
}

interface BookingSectionProps {
  label?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted';
}

export function BookingSection({ label, title, children, className = '', variant = 'default' }: BookingSectionProps) {
  const baseClasses = 'border border-border p-4 sm:p-5 space-y-4';
  const variantClasses = variant === 'muted' ? 'bg-muted' : 'bg-background';

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      {(label || title) && (
        <div className="border-b border-border pb-3">
          {label && (
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
          )}
          {title && <h2 className="text-sm font-semibold text-foreground mt-1">{title}</h2>}
        </div>
      )}
      {children}
    </div>
  );
}

interface BookingContainerProps {
  children: ReactNode;
  className?: string;
  withShadow?: boolean;
}

export function BookingContainer({ children, className = '' }: BookingContainerProps) {
  return <div className={`space-y-5 shadow-[8px_8px_0px_0px_rgb(120,40,180)] ${className}`}>{children}</div>;
}

interface BookingGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}

export function BookingGrid({ children, cols = 2, className = '' }: BookingGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[cols];

  return <div className={`grid ${colsClass} gap-4 ${className}`}>{children}</div>;
}

interface BookingMetaProps {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}

export function BookingMeta({ items, className = '' }: BookingMetaProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-baseline gap-2">
          <span className="text-[0.7rem] text-muted-foreground min-w-20">{item.label}:</span>
          <span className="text-sm text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

interface BookingStepListProps {
  steps: Array<{ title: string; description: string }>;
  className?: string;
}

export function BookingStepList({ steps, className = '' }: BookingStepListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="border border-border bg-background px-2 py-0.5 text-[0.7rem] font-medium">{index + 1}</div>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{step.title}</p>
            <p className="text-[0.7rem] text-muted-foreground">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface BookingButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function BookingButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}: BookingButtonProps) {
  const baseClasses =
    'border border-border font-medium rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-foreground text-background hover:bg-foreground/90',
    outline: 'bg-background text-foreground hover:bg-muted',
    text: 'bg-transparent text-muted-foreground hover:text-foreground px-0 border-0 hover:underline underline-offset-2',
  }[variant];

  const sizeClasses = {
    sm: variant === 'text' ? 'text-[0.7rem]' : 'px-2.5 py-1.5 text-[0.7rem]',
    md: variant === 'text' ? 'text-xs' : 'px-3 py-2 text-xs',
    lg: variant === 'text' ? 'text-sm' : 'px-4 py-2.5 text-sm',
  }[size];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}
