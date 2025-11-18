import { forwardRef } from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '~/components/ui/accordion';
import { CheckCircle2 } from 'lucide-react';
import { ShapesDiamondOne } from '~/components/shapes/shapes';

interface BookingStepProps {
  stepNumber: number;
  stepValue: string;
  title: string;
  description: string;
  isCompleted: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'final';
}

export const BookingStep = forwardRef<HTMLDivElement, BookingStepProps>(
  ({ stepNumber, stepValue, title, description, isCompleted, children, variant = 'default' }, ref) => {
    const isFinal = variant === 'final';

    return (
      <div ref={ref}>
        <AccordionItem
          value={stepValue}
          className={
            isFinal
              ? 'relative overflow-hidden rounded-md border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 shadow-[0_12px_40px_rgba(99,102,241,0.15)] backdrop-blur-sm transition-all hover:shadow-[0_12px_40px_rgba(99,102,241,0.2)]'
              : isCompleted
                ? 'rounded-md border border-emerald-200/50 bg-emerald-50/30 shadow-sm backdrop-blur-sm transition-all hover:shadow-md'
                : 'rounded-md border border-slate-200/70 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.12)]'
          }
        >
          {isFinal && <ShapesDiamondOne />}
          <AccordionTrigger
            className={`hover:no-underline ${
              isCompleted ? 'px-4 py-3 sm:px-5' : 'px-5 py-5 sm:px-7'
            } ${isFinal ? 'relative z-10' : ''}`}
          >
            <div className="text-left">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center rounded-md text-sm font-bold shadow-md transition-all ${
                    isCompleted
                      ? 'h-7 w-7 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30'
                      : isFinal
                        ? 'h-9 w-9 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'h-9 w-9 bg-slate-100 text-slate-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                </div>
                <div>
                  <h3 className={`font-bold text-slate-900 ${isCompleted ? 'text-sm' : 'text-base'}`}>{title}</h3>
                  {!isCompleted && (
                    <p className={`mt-1 text-xs ${isFinal ? 'text-slate-600' : 'text-slate-500'}`}>{description}</p>
                  )}
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent
            className={`border-t ${
              isCompleted
                ? 'border-emerald-100 px-4 pb-3 pt-3 sm:px-5'
                : isFinal
                  ? 'relative z-10 border-indigo-100 px-5 pb-6 pt-5 sm:px-7'
                  : 'border-slate-100 px-5 pb-5 pt-4 sm:px-7'
            }`}
          >
            {children}
          </AccordionContent>
        </AccordionItem>
      </div>
    );
  },
);

BookingStep.displayName = 'BookingStep';
