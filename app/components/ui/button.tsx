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
    'focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:bg-button-disabled-bg',
    'disabled:text-button-disabled-text',
    'disabled:border-button-disabled-border',
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
          'bg-button-primary-bg',
          'text-button-primary-text',
          'border-2 border-button-primary-border',
          'shadow-sm',
          'hover:bg-button-primary-hover-bg',
          'hover:text-button-primary-hover-text',
          'hover:border-button-primary-hover-border',
          'hover:shadow-md',
          'active:bg-button-primary-active-bg',
          'active:shadow-sm',
          'focus-visible:ring-button-primary-ring',
        ].join(' '),

        secondary: [
          'bg-button-secondary-bg',
          'text-button-secondary-text',
          'border-2 border-button-secondary-border',
          'shadow-sm',
          'hover:bg-button-secondary-hover-bg',
          'hover:text-button-secondary-hover-text',
          'hover:border-button-secondary-hover-border',
          'hover:shadow-md',
          'active:bg-button-secondary-active-bg',
          'active:shadow-sm',
          'focus-visible:ring-button-secondary-ring',
        ].join(' '),

        accent: [
          'bg-accent',
          'text-accent-foreground',
          'border-2 border-accent',
          'shadow-sm',
          'hover:bg-accent/90',
          'hover:shadow-md',
          'active:bg-accent/80',
          'active:shadow-sm',
          'focus-visible:ring-accent',
        ].join(' '),

        destructive: [
          'bg-button-destructive-bg',
          'text-button-destructive-text',
          'border-2 border-button-destructive-border',
          'shadow-sm',
          'hover:bg-button-destructive-hover-bg',
          'hover:text-button-destructive-hover-text',
          'hover:border-button-destructive-hover-border',
          'hover:shadow-md',
          'active:bg-button-destructive-active-bg',
          'active:shadow-sm',
          'focus-visible:ring-button-destructive-ring',
        ].join(' '),

        outline: [
          'bg-button-outline-bg',
          'text-button-outline-text',
          'border-2 border-button-outline-border',
          'shadow-xs',
          'hover:bg-button-outline-hover-bg',
          'hover:text-button-outline-hover-text',
          'hover:border-button-outline-hover-border',
          'hover:shadow-sm',
          'active:bg-button-outline-active-bg',
          'active:shadow-xs',
          'focus-visible:ring-button-outline-ring',
        ].join(' '),

        ghost: [
          'bg-button-ghost-bg',
          'text-button-ghost-text',
          'border-2 border-button-ghost-border',
          'hover:bg-button-ghost-hover-bg',
          'hover:text-button-ghost-hover-text',
          'hover:shadow-xs',
          'active:bg-button-ghost-active-bg',
          'focus-visible:ring-button-ghost-ring',
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
          'focus-visible:ring-primary',
        ].join(' '),

        muted: [
          'bg-muted',
          'text-muted-foreground',
          'border-2 border-border',
          'shadow-xs',
          'hover:bg-muted/80',
          'hover:text-foreground',
          'hover:shadow-sm',
          'active:bg-muted/60',
          'active:shadow-xs',
          'focus-visible:ring-primary',
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
