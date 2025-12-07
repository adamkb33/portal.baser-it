import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'gap-2',
    'whitespace-nowrap',
    'text-sm',
    'font-medium',
    'outline-none',
    'focus-visible:outline-ring/50',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    '[&_svg]:pointer-events-none',
    '[&_svg:not([class*="size-"])]:size-4',
    '[&_svg]:shrink-0',
    'shrink-0',
    'rounded-none',
  ].join(' '),

  {
    variants: {
      variant: {
        default: ['bg-foreground', 'text-background', 'border border-border', 'hover:bg-foreground/90'].join(' '),
        primary: ['bg-primary', 'text-primary-foreground', 'border border-border', 'hover:bg-primary/90'].join(' '),
        destructive: [
          'bg-destructive',
          'text-background',
          'border border-border',
          'hover:bg-destructive/90',
          'focus-visible:outline-destructive/50',
        ].join(' '),
        outline: ['bg-background', 'text-foreground', 'border border-border', 'hover:bg-muted'].join(' '),
        secondary: ['bg-secondary', 'text-secondary-foreground', 'border border-border', 'hover:bg-secondary/80'].join(
          ' ',
        ),

        ghost: [
          'bg-transparent',
          'text-foreground',
          'border border-transparent',
          'hover:bg-muted',
          'hover:border-border',
        ].join(' '),

        link: [
          'bg-transparent',
          'text-muted-foreground',
          'underline-offset-2',
          'hover:underline',
          'border-none',
          'px-0',
        ].join(' '),
      },
      size: {
        default: ['px-3 py-2', 'has-[>svg]:px-2.5'].join(' '),
        sm: ['px-2.5 py-1.5', 'text-xs', 'has-[>svg]:px-2'].join(' '),
        lg: ['px-4 py-2.5', 'text-sm', 'has-[>svg]:px-3.5'].join(' '),
        icon: ['size-9', 'p-0'].join(' '),
        'icon-sm': ['size-8', 'p-0'].join(' '),
        'icon-lg': ['size-10', 'p-0'].join(' '),
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
