import type { AppointmentSessionDto } from '~/api/clients/types';

/**
 * Booking Step Configuration
 * Maps route patterns to step definitions based on the route tree structure
 */
export interface BookingStep {
  id: string;
  routeId: string; // From your ROUTE_TREE
  routePath: string;
  order: number;
  name: string;
  description?: string;
  isRequired: boolean;
}

/**
 * Step definitions matching your route tree structure
 */
export const BOOKING_STEPS: BookingStep[] = [
  {
    id: 'contact',
    routeId: 'booking.public.appointment.session.contact',
    routePath: 'contact',
    order: 1,
    name: 'Kontaktinformasjon',
    description: 'Oppgi dine kontaktopplysninger',
    isRequired: true,
  },
  {
    id: 'employee',
    routeId: 'booking.public.appointment.session.employee',
    routePath: 'employee',
    order: 2,
    name: 'Velg behandler',
    description: 'Velg ønsket behandler',
    isRequired: true,
  },
  {
    id: 'select-services',
    routeId: 'booking.public.appointment.session.select-services',
    routePath: 'select-services',
    order: 3,
    name: 'Velg tjenester',
    description: 'Velg tjenester du ønsker',
    isRequired: true,
  },
  {
    id: 'select-time',
    routeId: 'booking.public.appointment.session.select-time',
    routePath: 'select-time',
    order: 4,
    name: 'Velg tidspunkt',
    description: 'Velg dato og tid for avtalen',
    isRequired: true,
  },
  {
    id: 'overview',
    routeId: 'booking.public.appointment.session.overview',
    routePath: 'overview',
    order: 5,
    name: 'Oversikt',
    description: 'Bekreft din timebestilling',
    isRequired: true,
  },
];

/**
 * Enhanced step status with navigation logic
 */
export interface EnhancedStepStatus extends BookingStep {
  isComplete: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
  isOptional: boolean;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

/**
 * Determines step status based on session data and current location
 */
export function getEnhancedStepStatus(session: AppointmentSessionDto, currentPathname: string): EnhancedStepStatus[] {
  const sessionSteps = session.steps || [];

  // Extract the current route segment (e.g., "contact" from "/booking/public/appointment/session/contact")
  const currentRouteSegment = currentPathname.split('/').pop() || '';

  return BOOKING_STEPS.map((step, stepIndex) => {
    const sessionStep = sessionSteps.find((s) => s.order === step.order);
    const isComplete = sessionStep?.isComplete || false;
    const isCurrent = currentRouteSegment === step.routePath;

    // Navigation logic
    const completedSteps = sessionSteps.filter((s) => s.isComplete).length;
    const isAccessible = stepIndex <= completedSteps || isCurrent;
    const canNavigateBack = stepIndex < completedSteps || (isCurrent && stepIndex > 0);
    const canNavigateForward = isComplete && stepIndex < BOOKING_STEPS.length - 1;

    return {
      ...step,
      isComplete,
      isCurrent,
      isAccessible,
      isOptional: !step.isRequired,
      canNavigateBack,
      canNavigateForward,
    };
  });
}

/**
 * Get the next available step
 */
export function getNextStep(steps: EnhancedStepStatus[]): EnhancedStepStatus | null {
  const currentStepIndex = steps.findIndex((s) => s.isCurrent);
  const nextStepIndex = currentStepIndex + 1;

  if (nextStepIndex < steps.length) {
    return steps[nextStepIndex];
  }

  return null;
}

/**
 * Get the previous step
 */
export function getPreviousStep(steps: EnhancedStepStatus[]): EnhancedStepStatus | null {
  const currentStepIndex = steps.findIndex((s) => s.isCurrent);
  const prevStepIndex = currentStepIndex - 1;

  if (prevStepIndex >= 0) {
    return steps[prevStepIndex];
  }

  return null;
}

/**
 * Calculate overall progress percentage
 */
export function calculateProgress(steps: EnhancedStepStatus[]): {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  currentStepNumber: number;
} {
  const completedSteps = steps.filter((s) => s.isComplete).length;
  const currentStepIndex = steps.findIndex((s) => s.isCurrent);
  const currentStepNumber = currentStepIndex + 1;

  return {
    completedSteps,
    totalSteps: steps.length,
    percentage: Math.round((completedSteps / steps.length) * 100),
    currentStepNumber,
  };
}

export function canProceedToNextStep(
  currentStep: EnhancedStepStatus,
  session: AppointmentSessionDto,
): { canProceed: boolean } {
  switch (currentStep.id) {
    case 'contact':
      if (!session.contactId) {
        return { canProceed: false };
      }
      break;

    case 'employee':
      if (!session.selectedProfileId) {
        return { canProceed: false };
      }
      break;

    case 'select-services':
      if (!session.selectedServices || session.selectedServices.length === 0) {
        return { canProceed: false };
      }
      break;

    case 'select-time':
      if (!session.selectedStartTime) {
        return { canProceed: false };
      }
      break;
  }

  return { canProceed: true };
}
