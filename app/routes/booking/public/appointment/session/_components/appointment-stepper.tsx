import { ChevronRight, Check } from 'lucide-react';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { cn } from '~/lib/utils';

export function AppointmentStepper({ session }: { session: AppointmentSessionDto }) {
  const steps = session.steps || [];
  const currentStepIndex = steps.findIndex((s) => !s.isComplete);
  const activeIndex = currentStepIndex === -1 ? steps.length - 1 : currentStepIndex;
  const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;

  return (
    <>
      <div className="border border-border bg-background p-4 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center border-2 border-primary bg-background text-xs font-medium text-foreground">
              {steps[activeIndex]?.order}
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Steg {steps[activeIndex]?.order} av {steps.length}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{steps[activeIndex]?.name}</h3>
            </div>
          </div>

          {nextStep && (
            <div className="flex items-center gap-2 opacity-40">
              <ChevronRight className="size-4 text-muted-foreground" />
              <div className="flex size-6 items-center justify-center border border-border bg-muted text-[0.65rem] font-medium text-muted-foreground">
                {nextStep.order}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 h-1 border-t border-border bg-muted">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden border border-border bg-background p-4 md:block">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const isComplete = step.isComplete;
            const isCurrent = index === activeIndex;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center gap-2 border border-border px-3 py-2',
                    isComplete && 'bg-muted',
                    isCurrent && 'border-2 border-primary bg-background',
                    !isCurrent && !isComplete && 'bg-background opacity-60',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center border border-border text-xs font-medium',
                      isComplete && 'bg-foreground text-background',
                      isCurrent && 'border-primary bg-background text-foreground',
                      !isCurrent && !isComplete && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isComplete ? <Check className="size-3" /> : step.order}
                  </div>

                  <span
                    className={cn(
                      'text-xs font-medium',
                      isComplete && 'text-muted-foreground',
                      isCurrent && 'text-foreground',
                      !isCurrent && !isComplete && 'text-muted-foreground',
                    )}
                  >
                    {step.name}
                  </span>

                  {isCurrent && (
                    <span className="ml-1 border border-primary bg-primary px-1.5 py-0.5 text-[0.65rem] font-medium leading-none text-primary-foreground">
                      NÅ
                    </span>
                  )}
                </div>

                {!isLast && (
                  <ChevronRight
                    className={cn('mx-1 size-4 shrink-0', isComplete ? 'text-foreground' : 'text-border')}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
