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
      className={cn('w-full space-y-2', className)}
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
        'overflow-hidden rounded-md border border-border bg-surface',
        'data-[state=open]:bg-surface',
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
          'group flex flex-1 items-start justify-between gap-3 px-3 py-3 text-left',
          'text-sm font-medium text-text-primary transition-colors',
          'bg-surface hover:bg-background',
          'data-[state=open]:bg-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <ChevronDown
          className={cn(
            'mt-0.5 size-4 shrink-0 text-text-secondary transition-transform duration-150',
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
        'overflow-hidden text-sm text-text-primary',
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className,
      )}
      {...props}
    >
      <div className="border-t border-border px-3 pb-3 pt-3">{children}</div>
    </AccordionPrimitive.Content>
  );
}
