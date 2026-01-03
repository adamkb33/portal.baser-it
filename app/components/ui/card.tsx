import * as React from 'react';
import { cn } from '~/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground border border-border/60',

        'flex flex-col gap-3 md:gap-5 lg:gap-6',
        'p-4 md:p-5 lg:p-6',

        'rounded-lg md:rounded-xl',

        'shadow-xs hover:shadow-sm transition-shadow duration-200',

        'relative overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-background/40 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity',

        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header',

        'grid auto-rows-min grid-rows-[auto_auto] items-start',
        'gap-1.5 md:gap-2',

        'has-data-[slot=card-action]:grid-cols-[1fr_auto]',

        '[.border-b]:pb-3 [.border-b]:md:pb-4 [.border-b]:lg:pb-6',
        '[.border-b]:mb-3 [.border-b]:md:mb-4 [.border-b]:lg:mb-6',
        '[.border-b]:border-border/40',

        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-base md:text-lg lg:text-xl',
        'font-semibold leading-tight',

        'text-foreground tracking-tight',

        'transition-colors duration-200',
        'group-hover:text-primary',

        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        'text-xs md:text-sm lg:text-base',
        'leading-relaxed',

        'text-muted-foreground',

        'line-clamp-2 md:line-clamp-3',

        className,
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1',
        'self-start justify-self-end',
        '[&_button]:min-h-[44px] [&_button]:min-w-[44px]',
        '[&_button]:md:min-h-[40px] [&_button]:md:min-w-[40px]',
        '-mt-1 -mr-1',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-content" className={cn('space-y-2 md:space-y-3', 'relative z-10', className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex flex-wrap items-center gap-2 md:gap-3',

        '[.border-t]:pt-3 [.border-t]:md:pt-4 [.border-t]:lg:pt-6',
        '[.border-t]:mt-3 [.border-t]:md:mt-4 [.border-t]:lg:mt-6',
        '[.border-t]:border-border/40',

        '[&_button]:w-full [&_button]:sm:w-auto',

        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
