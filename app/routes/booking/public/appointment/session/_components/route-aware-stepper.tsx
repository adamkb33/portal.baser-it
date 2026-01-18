import { useLocation, Link } from 'react-router';
import { ChevronRight, Check } from 'lucide-react';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { cn } from '@/lib/utils';
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

  return (
    <>
      {/* ========================================
          DESKTOP - Horizontal Flow
          ======================================== */}
      <div className="hidden md:block bg-card border border-card-border rounded-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
            role="progressbar"
            aria-valuenow={progress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Steps Row */}
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              const StepContent = (
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    'border-2',

                    // Current
                    step.isCurrent && ['bg-primary/5 border-primary', 'shadow-sm'],

                    // Complete
                    step.isComplete && !step.isCurrent && ['bg-muted border-card-border'],

                    // Future accessible
                    !step.isCurrent &&
                      !step.isComplete &&
                      step.isAccessible && [
                        'border-card-border hover:border-primary/50',
                        'hover:bg-muted/50 cursor-pointer',
                      ],

                    // Inaccessible
                    !step.isAccessible && [
                      'border-button-disabled-border bg-button-disabled-bg',
                      'opacity-50 cursor-not-allowed',
                    ],
                  )}
                >
                  {/* Step Number Circle */}
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      'border-2 transition-colors',

                      step.isCurrent && 'bg-primary border-primary text-primary-foreground',
                      step.isComplete && !step.isCurrent && 'bg-foreground border-foreground text-background',
                      !step.isCurrent && !step.isComplete && 'border-muted-foreground/30 text-muted-foreground',
                    )}
                  >
                    {step.isComplete ? (
                      <Check className="size-5" strokeWidth={2.5} />
                    ) : (
                      <span className="text-sm font-bold">{step.order}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        step.isCurrent && 'text-card-text',
                        step.isComplete && !step.isCurrent && 'text-muted-foreground',
                        !step.isCurrent && !step.isComplete && 'text-muted-foreground',
                      )}
                    >
                      {step.name}
                    </p>

                    {/* Description only for current step on desktop */}
                    {step.isCurrent && step.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{step.description}</p>
                    )}
                  </div>
                </div>
              );

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {step.isAccessible && !step.isCurrent ? (
                    <Link to={step.routePath} className="flex-1 transition-opacity hover:opacity-90">
                      {StepContent}
                    </Link>
                  ) : (
                    <div className="flex-1">{StepContent}</div>
                  )}

                  {/* Connector */}
                  {!isLast && (
                    <ChevronRight
                      className={cn(
                        'size-5 mx-2 shrink-0 transition-colors',
                        step.isComplete ? 'text-foreground' : 'text-muted-foreground/30',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Next Step Action - Only if validation passes */}
          {nextStep && validation.canProceed && currentStep && (
            <div className="mt-4 pt-4 border-t border-card-header-border">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Klar for neste steg
                  </p>
                  <p className="text-sm text-card-text mt-0.5">{nextStep.name}</p>
                </div>

                <Link
                  to={nextStep.routePath}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  Fortsett
                  <ChevronRight className="inline-block size-4 ml-1" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
