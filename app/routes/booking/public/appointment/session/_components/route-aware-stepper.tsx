import { useLocation, Link } from 'react-router';
import { Check } from 'lucide-react';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { cn } from '@/lib/utils';
import { getEnhancedStepStatus, calculateProgress } from '../_utils/step-navigation';

interface RouteAwareStepperProps {
  session: AppointmentSessionDto;
}

export function RouteAwareStepper({ session }: RouteAwareStepperProps) {
  const location = useLocation();
  const steps = getEnhancedStepStatus(session, location.pathname);
  const progress = calculateProgress(steps);

  const currentStep = steps.find((s) => s.isCurrent);
  const currentStepLabel = currentStep?.name ?? '';

  return (
    <>
      {/* ========================================
          DESKTOP - Compact Flow
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
        <div className="px-4 py-3 lg:px-5">
          <ol className="flex items-center" aria-label="Fremdrift">
            {steps.map((step, index) => {
              const circle = (
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    step.isCurrent && 'bg-primary border-primary text-primary-foreground',
                    step.isComplete && !step.isCurrent && 'bg-foreground border-foreground text-background',
                    !step.isCurrent && !step.isComplete && 'border-muted-foreground/30 text-muted-foreground',
                    !step.isAccessible && 'opacity-50',
                  )}
                  aria-current={step.isCurrent ? 'step' : undefined}
                >
                  {step.isComplete ? <Check className="size-4" strokeWidth={2.5} /> : <span>{step.order}</span>}
                </div>
              );

              return (
                <li key={step.id} className="flex items-center flex-1 min-w-0">
                  {index > 0 && (
                    <div
                      className={cn(
                        'h-px flex-1 transition-colors',
                        steps[index - 1].isComplete ? 'bg-foreground' : 'bg-muted-foreground/30',
                      )}
                      aria-hidden="true"
                    />
                  )}

                  {step.isAccessible && !step.isCurrent ? (
                    <Link to={step.routePath} className="shrink-0" aria-label={step.name}>
                      {circle}
                    </Link>
                  ) : (
                    <div className="shrink-0" aria-label={step.name}>
                      {circle}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Steg {progress.currentNumber} av {progress.total}
            </span>
            <span className="font-medium text-card-text">{currentStepLabel}</span>
          </div>
        </div>
      </div>
    </>
  );
}
