// app/components/booking/booking-step.tsx

import { AccordionItem, AccordionTrigger, AccordionContent } from '~/components/ui/accordion';
import { CheckCircle2 } from 'lucide-react';
import { ShapesDiamondOne } from '~/components/shapes/shapes';
import { cn } from '~/lib/utils';

interface BookingStepProps {
  stepNumber: number;
  stepValue: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  isFinalStep?: boolean;
  children: React.ReactNode;
}

export function BookingStep({
  stepNumber,
  stepValue,
  title,
  description,
  isCompleted,
  isFinalStep = false,
  children,
}: BookingStepProps) {
  return (
    <AccordionItem
      value={stepValue}
      className={cn(
        'relative rounded-none border-2 bg-background shadow-[4px_4px_0_0_rgba(0,0,0,0.9)] transition-transform duration-150 hover:-translate-y-[1px]',
        isFinalStep && 'border-foreground/80',
        isCompleted && !isFinalStep && 'border-emerald-500/80',
        !isCompleted && !isFinalStep && 'border-foreground/40',
      )}
    >
      {/* Background decoration for final step */}
      {isFinalStep && (
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <ShapesDiamondOne />
        </div>
      )}

      {/* Trigger */}
      <AccordionTrigger className={cn('px-5 py-5 hover:no-underline sm:px-7', isFinalStep && 'relative z-10')}>
        <div className="flex items-center gap-4 text-left">
          {/* Step number/checkmark badge */}
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-none border-2 border-foreground/80 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,0.9)]',
              isCompleted ? 'bg-foreground text-background' : 'bg-background text-foreground',
            )}
          >
            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
          </div>

          {/* Step title and description */}
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={cn(
                'font-semibold uppercase tracking-wider',
                isCompleted ? 'text-xs text-muted-foreground' : 'text-xs text-foreground sm:text-sm',
              )}
            >
              {title}
            </h3>

            <p
              className={cn(
                'text-xs uppercase tracking-wider',
                isFinalStep ? 'text-foreground/70' : 'text-muted-foreground',
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </AccordionTrigger>

      {/* Content */}
      <AccordionContent
        className={cn(
          'border-t-2 bg-background text-sm sm:text-base',
          'px-5 pb-5 pt-4 sm:px-7',
          isFinalStep && 'relative z-10 border-foreground/80',
          isCompleted && !isFinalStep && 'border-emerald-200',
          !isCompleted && !isFinalStep && 'border-foreground/20',
        )}
      >
        <div className="border border-dashed border-foreground/30 p-3 sm:p-4">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
