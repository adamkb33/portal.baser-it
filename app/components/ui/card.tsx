import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const cardVariants = cva(
  ['flex flex-col', 'rounded-lg md:rounded-xl', 'relative overflow-hidden', 'transition-all duration-200'],
  {
    variants: {
      variant: {
        default: [
          'bg-card-bg text-card-text',
          'border border-card-border',
          'shadow-xs hover:shadow-sm',
          'hover:bg-card-hover-bg hover:border-card-hover-border',
        ],
        elevated: [
          'bg-card-elevated-bg text-card-elevated-text',
          'border border-card-elevated-border',
          'shadow-md hover:shadow-lg',
        ],
        flat: ['bg-card-flat-bg text-card-flat-text', 'border border-card-flat-border', 'hover:bg-card-flat-hover-bg'],
        bordered: [
          'bg-card-bordered-bg text-card-bordered-text',
          'border-2 border-card-bordered-border',
          'hover:border-card-bordered-hover-border',
        ],
        interactive: [
          'bg-card-interactive-bg text-card-interactive-text',
          'border border-card-interactive-border',
          'hover:bg-card-interactive-hover-bg hover:border-card-interactive-hover-border',
          'active:bg-card-interactive-active-bg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card-interactive-ring focus-visible:ring-offset-2',
          'cursor-pointer',
        ],
        ghost: [
          'bg-card-ghost-bg text-card-ghost-text',
          'border border-card-ghost-border',
          'hover:bg-card-ghost-hover-bg hover:border-card-ghost-hover-border',
        ],
        muted: [
          'bg-card-muted-bg text-card-muted-text',
          'border border-card-muted-border',
          'hover:bg-card-muted-hover-bg',
        ],
        accent: [
          'bg-card-accent-bg text-card-accent-text',
          'border border-card-accent-border',
          'hover:bg-card-accent-hover-bg',
        ],
      },
      size: {
        sm: ['gap-2 md:gap-3', 'p-3 md:p-4'],
        md: ['gap-3 md:gap-5 lg:gap-6', 'p-4 md:p-5 lg:p-6'],
        lg: ['gap-4 md:gap-6 lg:gap-8', 'p-6 md:p-8 lg:p-10'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const cardHeaderVariants = cva(
  [
    '@container/card-header',
    'relative z-10',
    'grid auto-rows-min grid-rows-[auto_auto] items-start',
    'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
  ],
  {
    variants: {
      size: {
        sm: ['gap-1 md:gap-1.5', '[.border-b]:pb-2 [.border-b]:md:pb-3', '[.border-b]:mb-2 [.border-b]:md:mb-3'],
        md: [
          'gap-1.5 md:gap-2',
          '[.border-b]:pb-3 [.border-b]:md:pb-4 [.border-b]:lg:pb-6',
          '[.border-b]:mb-3 [.border-b]:md:mb-4 [.border-b]:lg:mb-6',
        ],
        lg: [
          'gap-2 md:gap-3',
          '[.border-b]:pb-4 [.border-b]:md:pb-5 [.border-b]:lg:pb-7',
          '[.border-b]:mb-4 [.border-b]:md:mb-5 [.border-b]:lg:mb-7',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const cardTitleVariants = cva(
  [
    'font-semibold leading-tight',
    'text-card-header-text tracking-tight',
    'transition-colors duration-200',
    'group-hover:text-card-header-text',
  ],
  {
    variants: {
      size: {
        sm: ['text-sm md:text-base'],
        md: ['text-base md:text-lg lg:text-xl'],
        lg: ['text-lg md:text-xl lg:text-2xl'],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const cardDescriptionVariants = cva(['leading-relaxed', 'text-card-text-muted', 'line-clamp-2 md:line-clamp-3'], {
  variants: {
    size: {
      sm: ['text-xs md:text-sm'],
      md: ['text-xs md:text-sm lg:text-base'],
      lg: ['text-sm md:text-base lg:text-lg'],
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const cardContentVariants = cva(['relative z-10'], {
  variants: {
    size: {
      sm: ['space-y-1.5 md:space-y-2'],
      md: ['space-y-2 md:space-y-3'],
      lg: ['space-y-3 md:space-y-4'],
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const cardFooterVariants = cva(
  [
    'relative z-10',
    'flex flex-wrap items-center gap-2 md:gap-3',
    '[&_button]:w-full [&_button]:sm:w-auto',
  ],
  {
    variants: {
      size: {
        sm: ['[.border-t]:pt-2 [.border-t]:md:pt-3', '[.border-t]:mt-2 [.border-t]:md:mt-3'],
        md: [
          '[.border-t]:pt-3 [.border-t]:md:pt-4 [.border-t]:lg:pt-6',
          '[.border-t]:mt-3 [.border-t]:md:mt-4 [.border-t]:lg:mt-6',
        ],
        lg: [
          '[.border-t]:pt-4 [.border-t]:md:pt-5 [.border-t]:lg:pt-7',
          '[.border-t]:mt-4 [.border-t]:md:mt-5 [.border-t]:lg:mt-7',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

// Context for size prop
type CardContextValue = {
  size: 'sm' | 'md' | 'lg';
};

const CardContext = React.createContext<CardContextValue>({ size: 'md' });

export interface CardProps extends React.ComponentProps<'div'>, VariantProps<typeof cardVariants> {}

function Card({ className, variant, size = 'md', ...props }: CardProps) {
  return (
    <CardContext.Provider value={{ size: size ?? 'md' }}>
      <div data-slot="card" className={cn(cardVariants({ variant, size }), 'bg-card-bg', className)} {...props} />
    </CardContext.Provider>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const { size } = React.useContext(CardContext);

  return (
    <div
      data-slot="card-header"
      className={cn(cardHeaderVariants({ size }), '[.border-b]:border-card-header-border', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  const { size } = React.useContext(CardContext);

  return <div data-slot="card-title" className={cn(cardTitleVariants({ size }), className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  const { size } = React.useContext(CardContext);

  return <div data-slot="card-description" className={cn(cardDescriptionVariants({ size }), className)} {...props} />;
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
  const { size } = React.useContext(CardContext);

  return <div data-slot="card-content" className={cn(cardContentVariants({ size }), className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const { size } = React.useContext(CardContext);

  return (
    <div
      data-slot="card-footer"
      className={cn(cardFooterVariants({ size }), '[.border-t]:border-card-footer-border', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
