import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'gap-2',
    'whitespace-nowrap',
    'text-sm md:text-sm',
    'font-medium',
    'outline-none',
    'transition-all duration-200',
    'active:scale-[0.98]',
    'focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    '[&_svg]:pointer-events-none',
    '[&_svg:not([class*="size-"])]:size-4',
    '[&_svg]:shrink-0',
    'shrink-0',
    'rounded-sm',
  ].join(' '),

  {
    variants: {
      variant: {
        default: [
          'bg-primary',
          'text-primary-foreground',
          'border border-primary',
          'shadow-sm',
          'hover:bg-primary/90',
          'hover:shadow-md',
          'active:bg-primary/80',
          'active:shadow-sm',
        ].join(' '),

        secondary: [
          'bg-secondary',
          'text-secondary-foreground',
          'border border-secondary',
          'shadow-sm',
          'hover:bg-secondary/90',
          'hover:shadow-md',
          'active:bg-secondary/80',
          'active:shadow-sm',
        ].join(' '),

        accent: [
          'bg-accent',
          'text-accent-foreground',
          'border border-accent',
          'shadow-sm',
          'hover:bg-accent/90',
          'hover:shadow-md',
          'active:bg-accent/80',
          'active:shadow-sm',
        ].join(' '),

        destructive: [
          'bg-destructive',
          'text-primary-foreground',
          'border border-destructive',
          'shadow-sm',
          'hover:bg-destructive/90',
          'hover:shadow-md',
          'active:bg-destructive/80',
          'active:shadow-sm',
          'focus-visible:ring-destructive/40',
        ].join(' '),

        outline: [
          'bg-background',
          'text-foreground',
          'border border-border',
          'shadow-xs',
          'hover:bg-muted',
          'hover:border-muted-foreground/20',
          'hover:shadow-sm',
          'active:bg-muted/80',
          'active:shadow-xs',
        ].join(' '),

        ghost: [
          'bg-transparent',
          'text-foreground',
          'border border-transparent',
          'hover:bg-muted',
          'hover:text-foreground',
          'hover:shadow-xs',
          'active:bg-muted/80',
        ].join(' '),

        link: [
          'bg-transparent',
          'text-muted-foreground',
          'underline-offset-2',
          'hover:underline',
          'hover:text-foreground',
          'active:text-foreground/80',
          'border-none',
          'px-0',
          'shadow-none',
        ].join(' '),

        muted: [
          'bg-muted',
          'text-muted-foreground',
          'border border-border',
          'shadow-xs',
          'hover:bg-muted/80',
          'hover:text-foreground',
          'hover:shadow-sm',
          'active:bg-muted/60',
          'active:shadow-xs',
        ].join(' '),
      },

      size: {
        default: ['h-11 px-4 py-3', 'md:h-10 md:px-4 md:py-2.5', 'has-[>svg]:px-3 md:has-[>svg]:px-3.5'].join(' '),

        sm: ['h-10 px-3 py-2.5', 'text-xs', 'md:h-9 md:px-3 md:py-2', 'has-[>svg]:px-2.5 md:has-[>svg]:px-2.5'].join(
          ' ',
        ),

        lg: ['h-12 px-5 py-3.5', 'text-base', 'md:h-11 md:px-6 md:py-3', 'has-[>svg]:px-4 md:has-[>svg]:px-5'].join(
          ' ',
        ),

        icon: ['size-11', 'p-0', 'md:size-10'].join(' '),

        'icon-sm': ['size-10', 'p-0', 'md:size-9'].join(' '),

        'icon-lg': ['size-12', 'p-0', 'md:size-11'].join(' '),
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
