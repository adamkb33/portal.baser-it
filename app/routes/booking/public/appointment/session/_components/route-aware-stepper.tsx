import { useLocation } from 'react-router';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { ProgressSteps } from '~/ui';
import { getEnhancedStepStatus, calculateProgress } from '../_utils/step-navigation';

interface RouteAwareStepperProps {
  session: AppointmentSessionDto;
}

export function RouteAwareStepper({ session }: RouteAwareStepperProps) {
  const location = useLocation();
  const steps = getEnhancedStepStatus(session, location.pathname);
  const progress = calculateProgress(steps);
  const progressSteps = steps.map((step) => ({
    id: step.id,
    label: step.name,
    status: (step.isCurrent ? 'current' : step.isComplete ? 'complete' : 'upcoming') as
      | 'current'
      | 'complete'
      | 'upcoming',
  }));

  return (
    <div className="hidden md:block">
      <ProgressSteps steps={progressSteps} />
    </div>
  );
}
