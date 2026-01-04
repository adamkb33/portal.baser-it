import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BiTLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'default' | 'stacked' | 'compact' | 'wordmark';
  animated?: boolean;
  onDark?: boolean; // For navbar/dark backgrounds
}

export default function BiTLogo({
  size = 'md',
  variant = 'default',
  animated = false,
  onDark = false,
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

  // Color configuration based on context
  const colorConfig = onDark
    ? {
        primary: 'text-navbar-text',
        secondary: 'text-primary',
        dot: 'bg-accent',
        muted: 'text-navbar-text-muted',
      }
    : {
        primary: 'text-primary',
        secondary: 'text-secondary',
        dot: 'bg-accent',
        muted: 'text-muted-foreground',
      };

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
            colorConfig.primary,
            'relative',
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
              'rounded-full absolute -top-1',
              colorConfig.dot,
              sizeConfig.dot,
              animated && 'transition-all duration-500 hover:bg-primary',
            )}
            aria-hidden="true"
          />
          {/* i stem */}
          <span className={colorConfig.secondary}>i</span>
        </span>

        {/* T - Primary accent */}
        <span
          className={cn(
            colorConfig.primary,
            'relative',
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
        <span className={cn(colorConfig.primary, 'leading-none')}>B</span>
        <span className="relative inline-flex flex-col items-center leading-none -my-1">
          <span className={cn('rounded-full absolute -top-1', colorConfig.dot, sizeConfig.dot)} aria-hidden="true" />
          <span className={colorConfig.secondary}>i</span>
        </span>
        <span className={cn(colorConfig.primary, 'leading-none')}>T</span>
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
        <span className={colorConfig.primary}>B</span>
        <span className={cn(colorConfig.secondary, '-mx-1')}>i</span>
        <span className={colorConfig.primary}>T</span>
      </span>
    );
  }

  // Wordmark - with full name
  if (variant === 'wordmark') {
    return (
      <span className={cn('inline-flex items-center', sizeConfig.gap, className)} {...props}>
        {/* Logo part */}
        <span className={cn('font-bold inline-flex items-center gap-1', sizeConfig.text, sizeConfig.letterSpacing)}>
          <span className={colorConfig.primary}>B</span>
          <span className="relative inline-flex flex-col items-center">
            <span className={cn('rounded-full absolute -top-1', colorConfig.dot, sizeConfig.dot)} aria-hidden="true" />
            <span className={colorConfig.secondary}>i</span>
          </span>
          <span className={colorConfig.primary}>T</span>
        </span>

        {/* Divider */}
        <span className={cn('w-px h-4', onDark ? 'bg-navbar-border' : 'bg-border')} aria-hidden="true" />

        {/* Wordmark */}
        <span
          className={cn(
            'font-medium',
            colorConfig.muted,
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
