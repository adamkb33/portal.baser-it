// app/routes/appointments.$companyId.tsx

import { data, redirect, useLoaderData, useNavigate, Outlet } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { AppointmentSessionDto, CompanyBookingInfoDto } from '~/api/clients/booking';
import { Accordion } from '~/components/ui/accordion';
import { BiTBusinessHero } from '~/components/heros/BiT-business.hero';
import { ShapesAngularOne } from '~/components/shapes/shapes';
import { BookingStep } from '~/components/booking/booking-step';
import { bookingApi } from '~/lib/utils';
import { AlertCircle } from 'lucide-react';
import { getOrCreateSession } from '~/lib/appointments.server';

const BASE_STEPS = [
  { key: 'contact', path: 'contact-form' },
  { key: 'services', path: 'contact-form/services' },
  { key: 'employee', path: 'contact-form/services/employee' },
  { key: 'time', path: 'contact-form/services/employee/time' },
  { key: 'overview', path: 'contact-form/services/employee/time/overview' },
] as const;

type StepKey = (typeof BASE_STEPS)[number]['key'];
type Step = { key: StepKey; path: string };

type LoaderData = {
  companyId: number;
  session: AppointmentSessionDto;
  currentStepIndex: number;
  currentStepKey: StepKey;
  steps: Step[];
  hasMultipleEmployees: boolean;
  hasNoEmployees: boolean;
};

export type AppointmentsOutletContext = {
  companyId: number;
  session: AppointmentSessionDto;
  steps: Step[];
  currentStepIndex: number;
};

function getStepsForCompany(employeeCount: number): Step[] {
  if (employeeCount === 1) {
    return BASE_STEPS.filter((step) => step.key !== 'employee');
  }
  return [...BASE_STEPS];
}

function getNextIncompleteStepIndex(
  session: AppointmentSessionDto,
  steps: Step[],
  hasMultipleEmployees: boolean,
): number {
  if (!session.contactId) return 0;
  if (!session.selectedServices?.length) return 1;

  if (hasMultipleEmployees && !session.selectedUserId) {
    return steps.findIndex((s) => s.key === 'employee');
  }

  if (!session.selectedStartTime) {
    return steps.findIndex((s) => s.key === 'time');
  }

  return steps.findIndex((s) => s.key === 'overview');
}

function getCurrentStepIndex(pathname: string, companyId: number, steps: Step[]): number | null {
  const prefix = `/appointments/${companyId}/`;
  if (!pathname.startsWith(prefix)) return null;

  const routePath = pathname.slice(prefix.length);

  for (let i = steps.length - 1; i >= 0; i--) {
    if (routePath.startsWith(steps[i].path)) {
      return i;
    }
  }

  return null;
}

function getStepMeta(stepKey: StepKey, session: AppointmentSessionDto) {
  switch (stepKey) {
    case 'contact':
      return {
        title: 'Oppgi kontaktopplysninger',
        description: session.contactId
          ? 'Kontaktopplysninger lagret'
          : 'Vi trenger dine kontaktopplysninger for å bekrefte avtalen',
      };
    case 'services': {
      const count = session.selectedServices?.length ?? 0;
      return {
        title: 'Velg tjenester',
        description:
          count > 0
            ? `${count} tjeneste${count > 1 ? 'r' : ''} valgt`
            : 'Du kan velge én eller flere tjenester som inngår i avtalen',
      };
    }
    case 'employee':
      return {
        title: 'Velg ansatt',
        description: session.selectedUserId ? 'Ansatt valgt' : 'Velg hvem som skal utføre timen',
      };
    case 'time':
      return {
        title: 'Velg tidspunkt',
        description: session.selectedStartTime ? 'Tidspunkt valgt' : 'Velg et tidspunkt som passer for deg',
      };
    case 'overview':
      return {
        title: 'Bekreft og fullfør',
        description: 'Se over detaljene før du bekrefter bestillingen',
      };
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const companyIdParam = params.companyId;
  const companyId = Number(companyIdParam);

  if (!companyIdParam || Number.isNaN(companyId)) {
    throw redirect('/');
  }

  let session: AppointmentSessionDto;
  let setCookieHeader: string;
  let bookingInfo: CompanyBookingInfoDto | undefined;

  try {
    const [sessionResult, bookingInfoResult] = await Promise.all([
      getOrCreateSession(request, companyId),
      bookingApi().PublicCompanyControllerService.PublicCompanyControllerService.getCompanyBookingInfo({ companyId }),
    ]);

    session = sessionResult.session;
    setCookieHeader = sessionResult.setCookieHeader;
    bookingInfo = bookingInfoResult?.data;
  } catch {
    throw redirect('/');
  }

  const employeeCount = bookingInfo?.companyUser?.length ?? 0;
  const hasNoEmployees = employeeCount === 0;
  const hasMultipleEmployees = employeeCount > 1;

  if (hasNoEmployees) {
    return data<LoaderData>(
      {
        companyId,
        session,
        currentStepIndex: 0,
        currentStepKey: 'contact',
        steps: [],
        hasMultipleEmployees: false,
        hasNoEmployees: true,
      },
      {
        headers: { 'Set-Cookie': setCookieHeader },
      },
    );
  }

  if (employeeCount === 1 && !session.selectedUserId && bookingInfo?.companyUser?.[0]) {
    const singleEmployee = bookingInfo.companyUser[0];

    if (singleEmployee.userId) {
      try {
        await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.selectAppointmentSessionCompanyUser(
          {
            requestBody: {
              sessionId: session.sessionId,
              selectedCompanyUserId: singleEmployee.userId,
            },
          },
        );
        session.selectedUserId = singleEmployee.userId;
      } catch {}
    }
  }

  const steps = getStepsForCompany(employeeCount);
  const url = new URL(request.url);
  const nextStepIndex = getNextIncompleteStepIndex(session, steps, hasMultipleEmployees);
  const currentStepIndex = getCurrentStepIndex(url.pathname, companyId, steps);

  if (currentStepIndex === null || currentStepIndex === -1) {
    const nextStepPath = `/appointments/${companyId}/${steps[nextStepIndex].path}`;
    throw redirect(nextStepPath, {
      headers: { 'Set-Cookie': setCookieHeader },
    });
  }

  if (!hasMultipleEmployees && steps[currentStepIndex].key === 'employee') {
    const timeStepIndex = steps.findIndex((s) => s.key === 'time');
    if (timeStepIndex !== -1) {
      throw redirect(`/appointments/${companyId}/${steps[timeStepIndex].path}`, {
        headers: { 'Set-Cookie': setCookieHeader },
      });
    }
  }

  if (currentStepIndex > nextStepIndex) {
    const nextStepPath = `/appointments/${companyId}/${steps[nextStepIndex].path}`;
    throw redirect(nextStepPath, {
      headers: { 'Set-Cookie': setCookieHeader },
    });
  }

  return data<LoaderData>(
    {
      companyId,
      session,
      currentStepIndex,
      currentStepKey: steps[currentStepIndex].key,
      steps,
      hasMultipleEmployees,
      hasNoEmployees: false,
    },
    {
      headers: { 'Set-Cookie': setCookieHeader },
    },
  );
}

export default function AppointmentsLayout() {
  const { companyId, session, currentStepIndex, currentStepKey, steps, hasNoEmployees } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Build context for child routes
  const outletContext: AppointmentsOutletContext = {
    companyId,
    session,
    steps,
    currentStepIndex,
  };

  if (hasNoEmployees) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-2">
          <div className="border border-border bg-background p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 shrink-0 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Ingen ansatte tilgjengelig</h2>
                <p className="text-sm text-muted-foreground">
                  Dette selskapet har ingen ansatte tilgjengelig for booking for øyeblikket. Vennligst kontakt selskapet
                  direkte for å avtale time.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <BiTBusinessHero />
        </div>
      </div>
    );
  }

  const nextIncompleteIndex = getNextIncompleteStepIndex(
    session,
    steps,
    steps.some((s) => s.key === 'employee'),
  );

  const handleStepClick = (stepKey: string) => {
    const step = steps.find((s) => s.key === stepKey);
    if (!step) return;

    const targetPath = `/appointments/${companyId}/${step.path}`;
    navigate(targetPath);
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex-2 space-y-5">
        <div className="relative border border-border bg-background px-4 py-4 sm:px-6 sm:py-5">
          <ShapesAngularOne />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bestilling</p>
              <h1 className="text-2xl font-semibold text-foreground">Book time</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Oppgi kontaktopplysninger, velg tjenester, velg ansatt og tidspunkt.
              </p>
            </div>
            <div className="flex items-center border border-border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground">
              Steg {currentStepIndex + 1} av {steps.length}
            </div>
          </div>
        </div>

        <Accordion
          type="single"
          value={currentStepKey}
          onValueChange={handleStepClick}
          className="space-y-3"
          collapsible
        >
          {steps.map((step, index) => {
            const { title, description } = getStepMeta(step.key, session);
            const isCompleted = index < nextIncompleteIndex;
            const isActive = index === currentStepIndex;
            const isFinalStep = index === steps.length - 1;

            return (
              <BookingStep
                key={step.key}
                stepNumber={index + 1}
                stepValue={step.key}
                title={title}
                description={description}
                isCompleted={isCompleted}
                isActive={isActive}
                isFinalStep={isFinalStep}
              >
                {/* Render Outlet only in active step, pass context */}
                {isActive && <Outlet context={outletContext} />}
              </BookingStep>
            );
          })}
        </Accordion>
      </div>

      <div className="flex-1">
        <BiTBusinessHero />
      </div>
    </div>
  );
}
