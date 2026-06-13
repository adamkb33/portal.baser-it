import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

export function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn('w-full space-y-2.5', className)}
      {...props}
    />
  );
}

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        'overflow-hidden rounded-[var(--radius-card)] border border-border bg-background text-text-primary shadow-[var(--shadow-card)]',
        'transition-[border-color,box-shadow] data-[state=open]:border-interactive/25 data-[state=open]:shadow-[var(--shadow-panel)]',
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group flex flex-1 items-start justify-between gap-3 px-4 py-3.5 text-left',
          'bg-background text-sm font-medium text-text-primary transition-colors',
          'hover:bg-surface-variant-1 data-[state=open]:bg-surface-primary-subtle',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive',
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <ChevronDown
        className={cn(
          'mt-0.5 size-4 shrink-0 text-text-secondary transition-[color,transform] duration-150',
          'group-hover:text-interactive group-data-[state=open]:text-interactive',
          'group-data-[state=open]:rotate-180',
        )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        'overflow-hidden bg-surface-variant-1 text-sm text-text-primary',
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className,
      )}
      {...props}
    >
      <div className="border-t border-border/80 px-4 pb-4 pt-4">{children}</div>
    </AccordionPrimitive.Content>
  );
}
