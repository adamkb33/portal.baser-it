import { Form, data } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { redirectWithError } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { BookingActionButton } from '~/routes/booking/public/_components/booking-action-button';
import { BookingCompanyBadge } from '~/routes/booking/public/_components/booking-company-badge';
import { BookingFooterNav } from '~/routes/booking/public/_components/booking-footer-nav';
import { BookingLink } from '~/routes/booking/public/_components/booking-link';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { redirect } from 'react-router';
import { useNavigation, useRevalidator } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { BookingStepTemplate, Panel as BookingSection, Stack } from '~/ui';
import { DateSelectorSection } from './_components/date-selector-section';
import { QuickBookButton } from './_components/quick-book-button';
import { TimeSlotsSection } from './_components/time-slots-section';
import { WeekNavigator } from './_components/week-navigator';
import { findScheduleWithTime, getEarliestSlot, groupSchedulesByWeek } from './_utils/select-time-schedule';
import type { Route } from './+types/booking.public.appointment.session.select-time.route';

const SCHEDULE_REFRESH_INTERVAL_MS = 30_000;
const ROUTE_ID = 'booking.public.appointment.session.select-time';

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'select-time' }, async () => {
    return selectTimeLoader({ request } as Route.LoaderArgs);
  });
}

async function selectTimeLoader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();
  const guardResult = await requireBookingSession(request);
  if (guardResult instanceof Response) {
    return guardResult;
  }
  const { session } = guardResult;

  if (!session.selectedProfileId) {
    return redirect(routes.employee);
  }

  if (!session.selectedServices?.length) {
    return redirect(routes.selectServices);
  }

  try {
    const [schedulesResponse, companySummary] = await Promise.all([
      withBookingBackendCall({ request, routeId: ROUTE_ID, step: 'select-time', call: 'get-schedules', session }, () =>
        PublicAppointmentSessionController.getAppointmentSessionSchedules({
          query: {
            sessionId: session.sessionId,
          },
        }),
      ),
      withBookingBackendCall(
        { request, routeId: ROUTE_ID, step: 'select-time', call: 'get-company-summary', session },
        () => getBookingCompanySummary(session.companyId),
      ),
    ]);
    const schedules = schedulesResponse.data?.data || [];

    return data({
      session,
      schedules,
      companySummary,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente tilgjengelige tider');
    return redirectWithError(request, routes.selectServices, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'select-time' }, async () => {
    return selectTimeAction({ request } as Route.ActionArgs);
  });
}

async function selectTimeAction({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();
  const guardResult = await requireBookingSession(request);
  if (guardResult instanceof Response) {
    return guardResult;
  }
  const { session } = guardResult;

  const formData = await request.formData();
  const startTime = formData.get('startTime') as string;

  if (!startTime) {
    return redirectWithError(request, routes.selectTime, 'Velg et tidspunkt for å fortsette');
  }

  try {
    const saveResponse = await withBookingBackendCall(
      {
        request,
        routeId: ROUTE_ID,
        step: 'select-time',
        call: 'submit-start-time',
        session,
        context: { startTime },
      },
      () =>
        PublicAppointmentSessionController.submitAppointmentSessionStartTime({
          query: {
            sessionId: session.sessionId,
            selectedStartTime: startTime,
          },
        }),
    );

    if (!saveResponse.data?.data?.selectedStartTime) {
      return redirectWithError(request, routes.selectTime, 'Kunne ikke lagre valgt tidspunkt');
    }

    return redirect(routes.selectTime);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre tidspunkt');
    return redirectWithError(request, routes.selectTime, message);
  }
}

export default function BookingSelectTimePage({ loaderData }: Route.ComponentProps) {
  const schedules = loaderData.schedules ?? [];
  const session = loaderData.session;
  const routes = getBookingRouteMap();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state === 'submitting';

  const weekGroups = useMemo(() => groupSchedulesByWeek(schedules), [schedules]);
  const earliestSlot = useMemo(() => getEarliestSlot(schedules), [schedules]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDateListCollapsed, setIsDateListCollapsed] = useState(false);

  const selectedStartTime = session.selectedStartTime ?? '';
  const displayTime = selectedStartTime || null;

  const currentWeek = weekGroups[selectedWeekIndex];
  const currentWeekSchedules = currentWeek?.schedules || [];
  const selectedSchedule = currentWeekSchedules.find((s) => s.date === selectedDate);

  useEffect(() => {
    if (displayTime && weekGroups.length > 0) {
      const scheduleDate = findScheduleWithTime(schedules, displayTime);
      const weekIndex = scheduleDate
        ? weekGroups.findIndex((wg) => wg.schedules.some((schedule) => schedule.date === scheduleDate))
        : -1;

      if (scheduleDate && weekIndex !== -1) {
        setSelectedWeekIndex(weekIndex);
        setSelectedDate(scheduleDate);
        setIsDateListCollapsed(true);
      }
    }
  }, [displayTime, schedules, weekGroups]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      if (navigation.state !== 'idle') {
        return;
      }

      if (revalidator.state !== 'idle') {
        return;
      }

      revalidator.revalidate();
    }, SCHEDULE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [navigation.state, revalidator]);

  const handlePrevWeek = () => {
    if (selectedWeekIndex > 0) {
      setSelectedWeekIndex(selectedWeekIndex - 1);
      setSelectedDate(null);
      setIsDateListCollapsed(false);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeekIndex < weekGroups.length - 1) {
      setSelectedWeekIndex(selectedWeekIndex + 1);
      setSelectedDate(null);
      setIsDateListCollapsed(false);
    }
  };

  const handleSelectWeek = (index: number) => {
    setSelectedWeekIndex(index);
    setSelectedDate(null);
    setIsDateListCollapsed(false);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setIsDateListCollapsed(true);
  };

  const timeSlots = selectedSchedule?.timeSlots ?? [];

  return (
    <BookingStepTemplate
      label="Velg tidspunkt"
      title="Hva er ett tidspunkt du ønsker?"
      description={displayTime ? 'Valgt tidspunkt kan endres' : 'Velg dato og klokkeslett for avtalen'}
      headerMeta={<BookingCompanyBadge company={loaderData.companySummary} />}
    >
      <Form method="post">
        <Stack space="xl">
          {earliestSlot && !displayTime && (
            <BookingSection>
              <QuickBookButton slot={earliestSlot} disabled={isSubmitting} />
            </BookingSection>
          )}

          <WeekNavigator
            weekGroups={weekGroups}
            selectedWeekIndex={selectedWeekIndex}
            onPreviousWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onSelectWeek={handleSelectWeek}
          />

          <div className="space-y-6 md:hidden">
            <DateSelectorSection
              schedules={currentWeekSchedules}
              selectedDate={selectedDate}
              isCollapsed={isDateListCollapsed}
              displayTime={displayTime}
              onSelectDate={handleSelectDate}
              onShowAllDates={() => setIsDateListCollapsed(false)}
            />
            <TimeSlotsSection
              selectedDate={selectedDate}
              timeSlots={timeSlots}
              displayTime={displayTime}
              isSubmitting={isSubmitting}
            />
          </div>

          <div className="hidden md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-5">
            <DateSelectorSection
              schedules={currentWeekSchedules}
              selectedDate={selectedDate}
              isCollapsed={isDateListCollapsed}
              displayTime={displayTime}
              onSelectDate={handleSelectDate}
              onShowAllDates={() => setIsDateListCollapsed(false)}
              variant="desktop"
            />
            <TimeSlotsSection
              selectedDate={selectedDate}
              timeSlots={timeSlots}
              displayTime={displayTime}
              isSubmitting={isSubmitting}
              variant="desktop"
            />
          </div>
        </Stack>
      </Form>
      <BookingFooterNav>
        <BookingLink to={routes.selectServices} variant="secondary" disabled={isSubmitting}>
          Tilbake
        </BookingLink>
        {selectedStartTime ? (
          <BookingLink to={routes.contact} variant="primary" disabled={isSubmitting}>
            <Check className="size-4" />
            Fortsett
          </BookingLink>
        ) : (
          <BookingActionButton type="button" variant="primary" disabled>
            <Check className="size-4" />
            Velg et tidspunkt
          </BookingActionButton>
        )}
      </BookingFooterNav>
    </BookingStepTemplate>
  );
}
