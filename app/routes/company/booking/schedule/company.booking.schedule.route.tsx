import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, useNavigate } from 'react-router';
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type { Route } from './+types/company.booking.schedule.route';
import { Booking, type CompanyUserScheduleOverviewDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { logger } from '~/lib/logger';
import { DEFAULT_QUERY_TIMEZONE, formatDateBoundaryInTimeZone, formatDateInputInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { redirectWithError, redirectWithSuccess } from '~/lib/flash-message.server';
import {
  Badge,
  Button,
  CompanyPageTemplate,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Notice,
  Text,
} from '~/ui';
import { ScheduleCalendar } from './_components/schedule-calendar';
import { ScheduleMobileView } from './_components/schedule-mobile-view';
import { ScheduleToolbar } from './_components/schedule-toolbar';
import type { ScheduleWeekDay } from './_types/schedule.types';
import {
  getEarliestScheduleWeekStart,
  getLatestScheduleWeekStart,
  toSafeScheduleDate,
  toWeekRange,
  toWeekStart,
  WEEKDAY,
} from './_utils/schedule-date.utils';
import {
  getAppointmentDetailHref,
  getScheduleCalendarWindow,
  toBusinessHours,
  toCalendarEvents,
  type ScheduleCalendarEventProps,
} from './_utils/fullcalendar-adapter';
import { getScheduleSelectionDestination } from './_utils/schedule-selection.utils';
import { isPastInterval } from './_utils/schedule-time.utils';

type SelectedScheduleEvent = {
  kind: 'availability' | 'unavailability';
  title: string;
  startTime: string;
  endTime: string;
  availabilityId?: number;
};

function createEmptyOverview(): CompanyUserScheduleOverviewDto {
  return {
    profileId: 0,
    dailySchedules: [],
    appointments: [],
    unavailabilities: [],
    availabilities: [],
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const date = toSafeScheduleDate(url.searchParams.get('date'));
  const range = toWeekRange(date);
  const fromDateTime = formatDateBoundaryInTimeZone(range.fromDate, 'start');
  const toDateTime = formatDateBoundaryInTimeZone(range.toDate, 'end');

  logger.info('[company.booking.schedule] Loader request', {
    date,
    fromDate: range.fromDate,
    toDate: range.toDate,
    fromDateTime,
    toDateTime,
    timezone: DEFAULT_QUERY_TIMEZONE,
  });

  try {
    const response = await withAuth(request, async () =>
      Booking.getScheduleOverview({ query: { fromDateTime, toDateTime } }),
    );

    const overview = response.data?.data ?? createEmptyOverview();

    logger.info('[company.booking.schedule] Overview response', {
      profileId: overview.profileId,
      dailySchedules: overview.dailySchedules.length,
      appointments: overview.appointments.length,
      unavailabilities: overview.unavailabilities.length,
      availabilities: overview.availabilities.length,
    });

    return {
      date,
      fromDateTime,
      toDateTime,
      overview,
      error: null as string | null,
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente kalenderoversikt');
    logger.error('[company.booking.schedule] Overview request failed', {
      date,
      fromDateTime,
      toDateTime,
      error,
    });

    return {
      date,
      fromDateTime,
      toDateTime,
      overview: createEmptyOverview(),
      error: message,
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent !== 'delete-availability') {
    return { success: false as const, message: 'Ukjent handling' };
  }

  const availabilityId = Number(formData.get('availabilityId'));
  if (!Number.isFinite(availabilityId) || availabilityId <= 0) {
    return redirectWithError(request, request.url, 'Ugyldig tidsrom-id');
  }

  try {
    const availabilityResponse = await withAuth(request, async () =>
      Booking.getAvailability({ path: { id: availabilityId } }),
    );
    const availability = availabilityResponse.data?.data;
    if (!availability) {
      return redirectWithError(request, request.url, 'Fant ikke tidsrommet');
    }
    if (isPastInterval(availability.endTime)) {
      return redirectWithError(request, request.url, 'Tidligere bookbar tid kan ikke slettes');
    }

    await withAuth(request, async () => Booking.deleteAvailability({ path: { id: availabilityId } }));
    return redirectWithSuccess(request, request.url, 'Bookbar tid slettet');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke slette bookbar tid');
    return redirectWithError(request, request.url, message);
  }
}

export default function CompanyBookingSchedulePage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { overview } = loaderData;
  const selectedWeekStart = toWeekStart(new Date(`${loaderData.date}T00:00:00`));
  const currentWeekStart = toWeekStart(new Date());
  const earliestNavigableWeekStart = getEarliestScheduleWeekStart();
  const latestNavigableWeekStart = getLatestScheduleWeekStart();
  const validRangeStart = format(earliestNavigableWeekStart, 'yyyy-MM-dd');
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [mobileDayKey, setMobileDayKey] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SelectedScheduleEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pointerQuery = window.matchMedia('(pointer: coarse)');
    const widthQuery = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobileLayout(pointerQuery.matches || widthQuery.matches);
    apply();
    pointerQuery.addEventListener('change', apply);
    widthQuery.addEventListener('change', apply);
    return () => {
      pointerQuery.removeEventListener('change', apply);
      widthQuery.removeEventListener('change', apply);
    };
  }, []);

  const weekDays = useMemo<ScheduleWeekDay[]>(() => {
    const weekStart = toWeekStart(new Date(`${loaderData.date}T00:00:00`));
    const todayKey = formatDateInputInTimeZone(new Date());
    return Array.from({ length: 7 }).map((_, idx) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + idx);
      const key = format(dayDate, 'yyyy-MM-dd');
      return {
        date: dayDate,
        key,
        dayOfWeek: WEEKDAY[dayDate.getDay()],
        label: format(dayDate, 'EEE dd.MM', { locale: nb }),
        isToday: key === todayKey,
        isPast: key < todayKey,
      };
    });
  }, [loaderData.date]);

  const calendarEvents = useMemo(() => toCalendarEvents(overview), [overview]);
  const businessHours = useMemo(() => toBusinessHours(overview.dailySchedules), [overview.dailySchedules]);
  const calendarWindow = useMemo(() => getScheduleCalendarWindow(overview), [overview]);

  const handleVisibleDateChange = useCallback(
    (nextDate: string) => {
      const nextWeekDate = toSafeScheduleDate(nextDate);
      if (nextWeekDate === loaderData.date) {
        return;
      }
      navigate(`${ROUTES_MAP['company.booking.schedule'].href}?date=${nextWeekDate}`);
    },
    [loaderData.date, navigate],
  );

  const handleEventClick = useCallback(
    (eventClick: EventClickArg) => {
      const props = eventClick.event.extendedProps as ScheduleCalendarEventProps;

      if (props.kind === 'appointment' && props.appointmentId) {
        navigate(getAppointmentDetailHref(props.appointmentId));
        return;
      }

      if (props.kind === 'availability' || props.kind === 'unavailability') {
        setSelectedEvent({
          kind: props.kind,
          title: eventClick.event.title,
          startTime: eventClick.event.startStr,
          endTime: eventClick.event.endStr || eventClick.event.startStr,
          availabilityId: props.availabilityId,
        });
      }
    },
    [navigate],
  );

  const handleRangeSelect = useCallback(
    (selection: DateSelectArg) => {
      if (selection.start.getTime() < Date.now()) {
        selection.view.calendar.unselect();
        return;
      }

      const destination = getScheduleSelectionDestination({
        start: selection.start,
        end: selection.end,
        dailySchedules: overview.dailySchedules,
        scheduleDate: loaderData.date,
      });

      selection.view.calendar.unselect();
      navigate(destination);
    },
    [loaderData.date, navigate, overview.dailySchedules],
  );

  const goToAvailabilityEdit = (availabilityId: number) => {
    const params = new URLSearchParams({ id: String(availabilityId) });
    navigate(`${ROUTES_MAP['company.booking.schedule.availabilities.edit'].href}?${params.toString()}`);
  };

  const goToUnavailabilityEdit = (event: SelectedScheduleEvent) => {
    const params = new URLSearchParams({
      from: event.startTime,
      to: event.endTime,
      redirectTo: `${ROUTES_MAP['company.booking.schedule'].href}?date=${loaderData.date}`,
    });
    navigate(`${ROUTES_MAP['company.booking.schedule-unavailability.create'].href}?${params.toString()}`);
  };

  const selectedEventIsPast = selectedEvent ? isPastInterval(selectedEvent.endTime) : false;

  return (
    <CompanyPageTemplate
      className="app-route-shape-background"
      title="Kalenderoversikt"
      description="Ukevisning for avtaler, bookbar tid og fravær."
      routeLinks={
        <ScheduleToolbar
          selectedWeekStart={selectedWeekStart}
          currentWeekStart={currentWeekStart}
          earliestNavigableWeekStart={earliestNavigableWeekStart}
          latestNavigableWeekStart={latestNavigableWeekStart}
        />
      }
    >
      {isMobileLayout ? (
        <ScheduleMobileView
          weekDays={weekDays}
          initialDayKey={mobileDayKey}
          onDayChange={setMobileDayKey}
          onNavigate={(to) => navigate(to)}
        />
      ) : null}

      {loaderData.error ? (
        <Notice tone="emphasis" title="Kunne ikke hente kalenderoversikt" message={loaderData.error} />
      ) : null}

      <ScheduleCalendar
        date={loaderData.date}
        events={calendarEvents}
        businessHours={businessHours}
        slotMinTime={calendarWindow.slotMinTime}
        slotMaxTime={calendarWindow.slotMaxTime}
        scrollTime={calendarWindow.scrollTime}
        validRangeStart={validRangeStart}
        isMobileLayout={isMobileLayout}
        mobileDayKey={mobileDayKey}
        onVisibleDateChange={handleVisibleDateChange}
        onEventClick={handleEventClick}
        onRangeSelect={handleRangeSelect}
      />

      <Dialog open={selectedEvent != null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title ?? 'Kalenderhendelse'}</DialogTitle>
            <DialogDescription>
              {selectedEvent
                ? `${format(new Date(selectedEvent.startTime), 'PPPp', { locale: nb })} - ${format(
                    new Date(selectedEvent.endTime),
                    'p',
                    { locale: nb },
                  )}`
                : 'Detaljer for valgt kalenderhendelse'}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{selectedEvent.kind === 'availability' ? 'Bookbar tid' : 'Fravær/pause'}</Badge>
                {selectedEventIsPast ? <Badge variant="outline">Tidligere</Badge> : null}
              </div>
              <Text as="p" variant="body-sm" className="text-text-secondary">
                {selectedEventIsPast
                  ? 'Tidligere hendelser kan vises, men ikke redigeres.'
                  : 'Velg en handling for denne kalenderhendelsen.'}
              </Text>

              {selectedEvent.kind === 'availability' && selectedEvent.availabilityId ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={selectedEventIsPast}
                    title={selectedEventIsPast ? 'Tidligere bookbar tid kan ikke redigeres' : undefined}
                    onClick={() => goToAvailabilityEdit(selectedEvent.availabilityId!)}
                  >
                    Rediger
                  </Button>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete-availability" />
                    <input type="hidden" name="availabilityId" value={selectedEvent.availabilityId} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      disabled={selectedEventIsPast}
                      title={selectedEventIsPast ? 'Tidligere bookbar tid kan ikke slettes' : undefined}
                      onClick={() => setSelectedEvent(null)}
                    >
                      Slett
                    </Button>
                  </Form>
                </div>
              ) : null}

              {selectedEvent.kind === 'unavailability' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={selectedEventIsPast}
                    title={selectedEventIsPast ? 'Tidligere fravær kan ikke redigeres' : undefined}
                    onClick={() => goToUnavailabilityEdit(selectedEvent)}
                  >
                    Rediger
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </CompanyPageTemplate>
  );
}
