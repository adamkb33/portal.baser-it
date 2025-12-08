import { useLocation, Link } from 'react-router';
import { ChevronRight, Check, AlertCircle } from 'lucide-react';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { cn } from '~/lib/utils';
import {
  getEnhancedStepStatus,
  getNextStep,
  calculateProgress,
  canProceedToNextStep,
  type EnhancedStepStatus,
} from '../_utils/step-navigation';

interface RouteAwareStepperProps {
  session: AppointmentSessionDto;
}

export function RouteAwareStepper({ session }: RouteAwareStepperProps) {
  const location = useLocation();
  const steps = getEnhancedStepStatus(session, location.pathname);
  const progress = calculateProgress(steps);

  const currentStep = steps.find((s) => s.isCurrent);
  const nextStep = getNextStep(steps);

  const validation = currentStep ? canProceedToNextStep(currentStep, session) : { canProceed: true };

  const StepContent = ({ step, index }: { step: EnhancedStepStatus; index: number }) => {
    const isLast = index === steps.length - 1;

    const stepElement = (
      <div
        className={cn(
          'flex items-center gap-2 border border-border px-3 py-2 transition-colors',
          step.isComplete && 'bg-muted',
          step.isCurrent && 'border-2 border-primary bg-background',
          !step.isCurrent && !step.isComplete && 'bg-background opacity-60',
          step.isAccessible && !step.isCurrent && 'hover:bg-muted cursor-pointer',
          !step.isAccessible && 'opacity-40 cursor-not-allowed',
        )}
      >
        <div
          className={cn(
            'flex size-6 shrink-0 items-center justify-center border border-border text-xs font-medium',
            step.isComplete && 'bg-foreground text-background',
            step.isCurrent && 'border-primary bg-background text-foreground',
            !step.isCurrent && !step.isComplete && 'bg-muted text-muted-foreground',
          )}
        >
          {step.isComplete ? <Check className="size-3" /> : step.order}
        </div>

        <span
          className={cn(
            'text-xs font-medium',
            step.isComplete && 'text-muted-foreground',
            step.isCurrent && 'text-foreground',
            !step.isCurrent && !step.isComplete && 'text-muted-foreground',
          )}
        >
          {step.name}
        </span>

        {step.isCurrent && (
          <span className="ml-1 border border-primary bg-primary px-1.5 py-0.5 text-[0.65rem] font-medium leading-none text-primary-foreground">
            NÅ
          </span>
        )}
      </div>
    );

    return (
      <div className="flex items-center">
        {step.isAccessible && !step.isCurrent ? (
          <Link to={step.routePath} className="transition-opacity hover:opacity-80">
            {stepElement}
          </Link>
        ) : (
          stepElement
        )}

        {!isLast && (
          <ChevronRight className={cn('mx-1 size-4 shrink-0', step.isComplete ? 'text-foreground' : 'text-border')} />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile */}
      <div className="border border-border bg-background p-4 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center border-2 border-primary bg-background text-xs font-medium text-foreground">
              {currentStep?.order}
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Steg {currentStep?.order} av {steps.length}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{currentStep?.name}</h3>
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
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* Mobile Navigation Dots */}
        <div className="mt-3 flex justify-center gap-1">
          {steps.map((step) => (
            <Link
              key={step.id}
              to={step.isAccessible ? step.routePath : '#'}
              className={cn(
                'w-2 h-2 border border-border transition-colors',
                step.isCurrent && 'bg-primary',
                step.isComplete && 'bg-foreground',
                !step.isCurrent && !step.isComplete && 'bg-muted',
                step.isAccessible && 'cursor-pointer hover:bg-primary/50',
                !step.isAccessible && 'opacity-30 cursor-not-allowed pointer-events-none',
              )}
              aria-label={`${step.name} - ${step.isComplete ? 'Fullført' : step.isCurrent ? 'Pågående' : 'Ikke startet'}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden border border-border bg-background p-4 sm:p-5 md:block">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <StepContent key={step.id} step={step} index={index} />
          ))}
        </div>

        {/* Desktop Step Description */}
        {currentStep && (
          <div className="mt-4 border-t border-border pt-3 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Pågående steg
                </span>
                <p className="text-sm font-semibold text-foreground mt-1">{currentStep.name}</p>
                {currentStep.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{currentStep.description}</p>
                )}
              </div>
            </div>

            {/* Next Step Preview */}
            {nextStep && validation.canProceed && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Neste steg:</span>
                <Link to={nextStep.routePath} className="font-medium text-primary hover:underline">
                  {nextStep.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
