import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BiTLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'default' | 'stacked' | 'compact' | 'wordmark';
  animated?: boolean;
}

export default function BiTLogo({
  size = 'md',
  variant = 'default',
  animated = false,
  className,
  ...props
}: BiTLogoProps) {
  const sizeConfig = {
    xs: {
      text: 'text-xs',
      gap: 'gap-0.5',
      dot: 'w-0.5 h-0.5',
      letterSpacing: 'tracking-tight',
    },
    sm: {
      text: 'text-sm',
      gap: 'gap-1',
      dot: 'w-1 h-1',
      letterSpacing: 'tracking-tight',
    },
    md: {
      text: 'text-base',
      gap: 'gap-1',
      dot: 'w-1 h-1',
      letterSpacing: 'tracking-tight',
    },
    lg: {
      text: 'text-2xl',
      gap: 'gap-1.5',
      dot: 'w-1.5 h-1.5',
      letterSpacing: 'tracking-tighter',
    },
    xl: {
      text: 'text-4xl',
      gap: 'gap-2',
      dot: 'w-2 h-2',
      letterSpacing: 'tracking-tighter',
    },
    '2xl': {
      text: 'text-6xl',
      gap: 'gap-2.5',
      dot: 'w-2.5 h-2.5',
      letterSpacing: 'tracking-tighter',
    },
  }[size];

  // Default horizontal logo
  if (variant === 'default') {
    return (
      <span
        className={cn(
          'font-bold inline-flex items-center',
          sizeConfig.text,
          sizeConfig.gap,
          sizeConfig.letterSpacing,
          animated && 'transition-all duration-300 hover:gap-2',
          className,
        )}
        {...props}
      >
        {/* B - Primary accent */}
        <span
          className={cn(
            'text-primary relative',
            animated && 'transition-all duration-300 hover:scale-110 hover:-rotate-3',
          )}
        >
          B
        </span>

        {/* i - Secondary with dot accent */}
        <span
          className={cn(
            'relative inline-flex flex-col items-center',
            animated && 'transition-all duration-300 hover:scale-110',
          )}
        >
          {/* Dot above i */}
          <span
            className={cn(
              'rounded-full bg-accent absolute -top-1',
              sizeConfig.dot,
              animated && 'transition-all duration-500 hover:bg-primary',
            )}
            aria-hidden="true"
          />
          {/* i stem */}
          <span className="text-secondary">i</span>
        </span>

        {/* T - Primary accent */}
        <span
          className={cn(
            'text-primary relative',
            animated && 'transition-all duration-300 hover:scale-110 hover:rotate-3',
          )}
        >
          T
        </span>
      </span>
    );
  }

  // Stacked vertical logo (for narrow spaces)
  if (variant === 'stacked') {
    return (
      <span
        className={cn(
          'font-bold inline-flex flex-col items-center',
          sizeConfig.text,
          'gap-0',
          sizeConfig.letterSpacing,
          className,
        )}
        {...props}
      >
        <span className="text-primary leading-none">B</span>
        <span className="relative inline-flex flex-col items-center leading-none -my-1">
          <span className={cn('rounded-full bg-accent absolute -top-1', sizeConfig.dot)} aria-hidden="true" />
          <span className="text-secondary">i</span>
        </span>
        <span className="text-primary leading-none">T</span>
      </span>
    );
  }

  // Compact - tighter spacing for small spaces
  if (variant === 'compact') {
    return (
      <span
        className={cn('font-bold inline-flex items-center gap-0', sizeConfig.text, sizeConfig.letterSpacing, className)}
        {...props}
      >
        <span className="text-primary">B</span>
        <span className="text-secondary -mx-1">i</span>
        <span className="text-primary">T</span>
      </span>
    );
  }

  // Wordmark - with full name
  if (variant === 'wordmark') {
    return (
      <span className={cn('inline-flex items-center', sizeConfig.gap, className)} {...props}>
        {/* Logo part */}
        <span className={cn('font-bold inline-flex items-center gap-1', sizeConfig.text, sizeConfig.letterSpacing)}>
          <span className="text-primary">B</span>
          <span className="relative inline-flex flex-col items-center">
            <span className={cn('rounded-full bg-accent absolute -top-1', sizeConfig.dot)} aria-hidden="true" />
            <span className="text-secondary">i</span>
          </span>
          <span className="text-primary">T</span>
        </span>

        {/* Divider */}
        <span className="w-px h-4 bg-border" aria-hidden="true" />

        {/* Wordmark */}
        <span
          className={cn(
            'font-medium text-muted-foreground',
            size === 'xs' && 'text-xs',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg',
            size === '2xl' && 'text-2xl',
          )}
        >
          Booking i Trafikkstasjonen
        </span>
      </span>
    );
  }

  return null;
}

// Export convenience components
export function BiTLogoStacked(props: Omit<BiTLogoProps, 'variant'>) {
  return <BiTLogo variant="stacked" {...props} />;
}

export function BiTLogoCompact(props: Omit<BiTLogoProps, 'variant'>) {
  return <BiTLogo variant="compact" {...props} />;
}

export function BiTLogoWordmark(props: Omit<BiTLogoProps, 'variant'>) {
  return <BiTLogo variant="wordmark" {...props} />;
}
