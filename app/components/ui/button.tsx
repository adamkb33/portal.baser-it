import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';

const buttonVariants = cva(
  [
    // D. Layout / Stacking (ATOMIC) - Horizontal row
    'inline-flex items-center justify-center',
    'gap-2', // spacing between icon + text
    'whitespace-nowrap', // prevent text wrap
    // Typography
    'text-sm', // small text per spec
    'font-medium', // medium weight
    // Accessibility & interaction
    'outline-none', // remove default outline
    'focus-visible:outline-ring/50', // focus ring per spec
    'disabled:pointer-events-none', // disable interactions
    'disabled:opacity-50', // visual disabled state
    // SVG handling
    '[&_svg]:pointer-events-none',
    '[&_svg:not([class*="size-"])]:size-4',
    '[&_svg]:shrink-0',
    'shrink-0',
    // Brutalist: NO rounded corners by default, NO transitions
    'rounded-none', // sharp corners
  ].join(' '),
  {
    variants: {
      variant: {
        // C. Buttons (ATOMIC) - Primary action
        default: [
          'bg-foreground', // near-black bg
          'text-background', // white text
          'border border-border', // near-black border
          'hover:bg-foreground/90', // subtle hover
        ].join(' '),

        // Destructive action
        destructive: [
          'bg-destructive', // red bg
          'text-background', // white text
          'border border-border', // near-black border
          'hover:bg-destructive/90', // subtle hover
          'focus-visible:outline-destructive/50', // destructive focus ring
        ].join(' '),

        // C. Buttons (ATOMIC) - Neutral / outline action
        outline: [
          'bg-background', // white bg
          'text-foreground', // near-black text
          'border border-border', // near-black border
          'hover:bg-muted', // light gray hover
        ].join(' '),

        // Secondary (light purple tint)
        secondary: [
          'bg-secondary', // light purple
          'text-secondary-foreground', // dark purple text
          'border border-border', // near-black border
          'hover:bg-secondary/80', // subtle hover
        ].join(' '),

        // Ghost (transparent)
        ghost: [
          'bg-transparent', // no background
          'text-foreground', // near-black text
          'border border-transparent', // no border
          'hover:bg-muted', // light gray hover
          'hover:border-border', // show border on hover
        ].join(' '),

        // C. Buttons (ATOMIC) - Muted text-only action (link-like)
        link: [
          'bg-transparent', // no background
          'text-muted-foreground', // muted text
          'underline-offset-2', // consistent offset
          'hover:underline', // underline on hover
          'border-none', // no border
          'px-0', // no horizontal padding
        ].join(' '),
      },
      size: {
        // C. Buttons (ATOMIC) - Standard button sizing
        default: [
          'px-3 py-2', // per spec
          'has-[>svg]:px-2.5', // adjust when icon present
        ].join(' '),

        sm: [
          'px-2.5 py-1.5', // smaller
          'text-xs', // smaller text
          'has-[>svg]:px-2', // adjust when icon present
        ].join(' '),

        lg: [
          'px-4 py-2.5', // larger
          'text-sm', // keep text small per brutalist
          'has-[>svg]:px-3.5', // adjust when icon present
        ].join(' '),

        icon: [
          'size-9', // square icon button
          'p-0', // no padding
        ].join(' '),

        'icon-sm': [
          'size-8', // smaller square
          'p-0',
        ].join(' '),

        'icon-lg': [
          'size-10', // larger square
          'p-0',
        ].join(' '),
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
