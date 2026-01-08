import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        'border-b border-accordion-border',
        'last:border-b-0',
        'data-[state=open]:border-accordion-open-border',
        'transition-colors duration-200',
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-start justify-between gap-4',
          'px-4 py-4',
          'text-left text-sm font-medium',

          // Colors
          'bg-accordion-trigger-bg text-accordion-trigger-text',

          // Hover state
          'hover:bg-accordion-trigger-hover-bg hover:text-accordion-trigger-hover-text',
          'transition-all duration-200',

          // Active state
          'active:bg-accordion-trigger-active-bg',

          // Focus state
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accordion-ring focus-visible:ring-offset-2',

          // Disabled state
          'disabled:pointer-events-none disabled:opacity-50',

          // Open state indicator
          'data-[state=open]:text-accordion-open-accent',
          'data-[state=open]:font-semibold',

          // Chevron rotation
          '[&[data-state=open]>svg]:rotate-180',
          '[&[data-state=open]>svg]:text-accordion-open-accent',

          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className={cn(
            'size-4 shrink-0 translate-y-0.5',
            'text-accordion-trigger-icon',
            'hover:text-accordion-trigger-icon-hover',
            'transition-all duration-200',
            'pointer-events-none',
          )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        'overflow-hidden text-sm',
        'data-[state=closed]:animate-accordion-up',
        'data-[state=open]:animate-accordion-down',
        'bg-accordion-content-bg text-accordion-content-text',
      )}
      {...props}
    >
      <div className={cn('px-4 pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
