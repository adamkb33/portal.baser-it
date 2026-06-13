import { addWeeks, format, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, useFetcher, useNavigate } from 'react-router';
import type { Route } from './+types/company.booking.schedule.route';
import {
  Booking,
  CompanyUserAppointmentController,
  type AppointmentDto,
  type CompanyUserScheduleOverviewDto,
} from '~/api/generated/booking';
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
  KeyValueList,
  Notice,
  Text,
} from '~/ui';
import { getTotalDuration, getTotalPrice, getTotalServiceCount } from '../appointments/_utils/appointments.utils';
import type { PositionedItem, ScheduleItem, SelectionDraft, WorkWindow } from './_types/schedule.types';
import { toSafeScheduleDate, toWeekRange, toWeekStart, WEEKDAY } from './_utils/schedule-date.utils';
import { isWithinWorkHours, itemTone, toPositionedItems } from './_utils/schedule-layout.utils';
import {
  formatMinuteClock,
  isPastInterval,
  toLocalDateTime,
} from './_utils/schedule-time.utils';
import {
  computeBestViewportStartMinute,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  mergeMinuteWindows,
  MIN_VIEW_HOURS,
  toMinuteWindowFromItems,
  toMinuteWindowFromSchedules,
  VIEWPORT_MINUTES,
} from './_utils/schedule-window.utils';
import { ScheduleDesktopView } from './_components/schedule-desktop-view';
import { ScheduleMobileView } from './_components/schedule-mobile-view';
import { getDateKeyInZone } from './_utils/schedule-zone.utils';

const HOUR_ROW_HEIGHT_PX = 52;
const PAST_WEEK_NAVIGATION_LIMIT = 4;

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

    const overview: CompanyUserScheduleOverviewDto | undefined = response.data?.data;
    const dailySchedules = overview?.dailySchedules ?? [];
    const appointments = overview?.appointments ?? [];
    const unavailabilities = overview?.unavailabilities ?? [];
    const availabilities = overview?.availabilities ?? [];
    logger.info('[company.booking.schedule] Overview response', {
      profileId: overview?.profileId ?? null,
      dailySchedules: dailySchedules.length,
      appointments: appointments.length,
      unavailabilities: unavailabilities.length,
      availabilities: availabilities.length,
    });

    const items: ScheduleItem[] = [
      ...appointments.map((a) => ({
        id: `appointment-${a.id}`,
        startTime: a.startTime,
        endTime: a.endTime,
        kind: 'appointment' as const,
        appointmentId: a.id,
        text: a.noShow ? 'Avtale (ikke møtt)' : 'Avtale',
      })),
      ...unavailabilities.map((u, i) => ({
        id: `unavailability-${i}-${u.startTime}-${u.endTime}`,
        startTime: u.startTime,
        endTime: u.endTime,
        kind: 'unavailability' as const,
        text: 'Utilgjengelig',
      })),
      ...availabilities.map((a) => ({
        id: `availability-${a.id}`,
        availabilityId: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
        kind: 'availability' as const,
        text: 'Tilgjengelig',
      })),
    ];

    return {
      date,
      fromDateTime,
      toDateTime,
      items,
      dailySchedules,
      totalAppointments: appointments.length,
      totalUnavailabilities: unavailabilities.length,
      totalAvailabilities: availabilities.length,
      dailyScheduleDays: Array.from(new Set(dailySchedules.map((schedule) => schedule.dayOfWeek))),
      globalWorkWindow:
        dailySchedules.length > 0
          ? {
              startMinute: FULL_DAY_START_MINUTE,
              endMinute: FULL_DAY_END_MINUTE,
              label: '00:00 - 24:00',
            }
          : mergeMinuteWindows(toMinuteWindowFromSchedules(dailySchedules), toMinuteWindowFromItems(items)),
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
      items: [] as ScheduleItem[],
      dailySchedules: [] as Array<{ dayOfWeek: string; startTime: string; endTime: string }>,
      totalAppointments: 0,
      totalUnavailabilities: 0,
      totalAvailabilities: 0,
      dailyScheduleDays: [] as Array<
        'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
      >,
      globalWorkWindow: null as WorkWindow | null,
      error: message,
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'delete-availability') {
    const availabilityId = Number(formData.get('availabilityId'));
    if (!Number.isFinite(availabilityId) || availabilityId <= 0) {
      return redirectWithError(request, request.url, 'Ugyldig tilgjengelighet-id');
    }

    try {
      const availabilityResponse = await withAuth(request, async () =>
        Booking.getAvailability({ path: { id: availabilityId } }),
      );
      const availability = availabilityResponse.data?.data;
      if (!availability) {
        return redirectWithError(request, request.url, 'Fant ikke tilgjengelighet');
      }
      if (isPastInterval(availability.endTime)) {
        return redirectWithError(request, request.url, 'Tidligere tilgjengeligheter kan ikke slettes');
      }

      await withAuth(request, async () => Booking.deleteAvailability({ path: { id: availabilityId } }));
      return redirectWithSuccess(request, request.url, 'Tilgjengelighet slettet');
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke slette tilgjengelighet');
      return redirectWithError(request, request.url, message);
    }
  }

  if (intent !== 'appointment-details') {
    return { success: false as const, message: 'Ukjent handling' };
  }

  const appointmentId = Number(formData.get('appointmentId'));
  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    return { success: false as const, message: 'Ugyldig avtale-id' };
  }

  try {
    const response = await withAuth(request, async () =>
      CompanyUserAppointmentController.getAppointmentById({ query: { appointmentId } }),
    );

    return { success: true as const, appointment: response.data?.data ?? null };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente avtaledetaljer');
    return { success: false as const, message };
  }
}

export default function CompanyBookingSchedulePage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const selectedWeekStart = toWeekStart(new Date(`${loaderData.date}T00:00:00`));
  const currentWeekStart = toWeekStart(new Date());
  const earliestNavigableWeekStart = addWeeks(currentWeekStart, -PAST_WEEK_NAVIGATION_LIMIT);
  const canGoToPreviousWeek = selectedWeekStart > earliestNavigableWeekStart;
  const isCurrentWeekView = selectedWeekStart.getTime() === currentWeekStart.getTime();
  const isFutureWeekView = selectedWeekStart > currentWeekStart;
  const prevDate = format(addWeeks(selectedWeekStart, -1), 'yyyy-MM-dd');
  const nextDate = format(addWeeks(selectedWeekStart, 1), 'yyyy-MM-dd');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [hoverState, setHoverState] = useState<{ dayKey: string; minute: number } | null>(null);
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);
  const [selectionCommitted, setSelectionCommitted] = useState<SelectionDraft | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [mobileDayKey, setMobileDayKey] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dayColumnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastAutoCenteredDateRef = useRef<string | null>(null);
  const detailsFetcher = useFetcher<typeof action>();

  const itemById = useMemo(() => new Map(loaderData.items.map((item) => [item.id, item])), [loaderData.items]);
  const selectedItemIsPast = selectedItem ? isPastInterval(selectedItem.endTime) : false;

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

  useEffect(() => {
    if (detailsFetcher.state !== 'idle' || !detailsFetcher.data) return;
    if (detailsFetcher.data.success) {
      setSelectedAppointment(detailsFetcher.data.appointment ?? null);
      setDetailsOpen(true);
    }
  }, [detailsFetcher.state, detailsFetcher.data]);

  const globalWindow = loaderData.globalWorkWindow;

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(new Date(`${loaderData.date}T00:00:00`), { weekStartsOn: 1 });
    const todayKey = formatInTimeZone(new Date(), DEFAULT_QUERY_TIMEZONE, 'yyyy-MM-dd');
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      const key = format(d, 'yyyy-MM-dd');
      const dayOfWeek = WEEKDAY[d.getDay()];
      return {
        date: d,
        key,
        dayOfWeek,
        label: format(d, 'EEE dd.MM', { locale: nb }),
        isToday: key === todayKey,
        isPast: key < todayKey,
      };
    });
  }, [loaderData.date]);

  const positioned = useMemo(() => {
    if (!globalWindow) return [];
    return toPositionedItems(loaderData.items, globalWindow.startMinute, globalWindow.endMinute);
  }, [loaderData.items, globalWindow]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, PositionedItem[]>();
    for (const i of positioned) {
      const dayKey = getDateKeyInZone(i.startTime);
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)?.push(i);
    }
    return map;
  }, [positioned]);

  const hourRows = useMemo(() => {
    if (!globalWindow) return [];
    const total = Math.max(1, globalWindow.endMinute - globalWindow.startMinute);
    const rows: Array<{ start: number; end: number; top: number; height: number }> = [];
    const startHour = Math.floor(globalWindow.startMinute / 60);
    const endHour = Math.ceil(globalWindow.endMinute / 60);
    for (let h = startHour; h < endHour; h += 1) {
      const start = h * 60;
      const end = (h + 1) * 60;
      const top = ((start - globalWindow.startMinute) / total) * 100;
      const height = ((end - start) / total) * 100;
      rows.push({ start, end, top, height });
    }
    return rows;
  }, [globalWindow]);
  const calendarBodyHeightPx = useMemo(
    () => Math.max(MIN_VIEW_HOURS * HOUR_ROW_HEIGHT_PX, hourRows.length * HOUR_ROW_HEIGHT_PX),
    [hourRows.length],
  );
  const initialViewportStartMinute = useMemo(
    () => computeBestViewportStartMinute(loaderData.dailySchedules, VIEWPORT_MINUTES),
    [loaderData.dailySchedules],
  );
  const hasWorkingHoursSelection = useMemo(() => {
    if (!selectionCommitted) return false;
    return isWithinWorkHours(
      selectionCommitted.dayOfWeek,
      Math.min(selectionCommitted.startMinute, selectionCommitted.endMinute),
      Math.max(selectionCommitted.startMinute, selectionCommitted.endMinute),
      loaderData.dailySchedules,
    );
  }, [loaderData.dailySchedules, selectionCommitted]);

  const onItemClick = (itemId: string) => {
    const clicked = itemById.get(itemId);
    if (!clicked) return;

    setSelectedItem(clicked);

    if (clicked.kind === 'appointment' && clicked.appointmentId) {
      const fd = new FormData();
      fd.append('intent', 'appointment-details');
      fd.append('appointmentId', String(clicked.appointmentId));
      detailsFetcher.submit(fd, { method: 'post' });
      return;
    }

    setSelectedAppointment(null);
    setDetailsOpen(true);
  };

  const getSelectionBounds = (selection: SelectionDraft) => {
    const startMinute = Math.min(selection.startMinute, selection.endMinute);
    const endMinute = Math.max(selection.startMinute, selection.endMinute);
    return { startMinute, endMinute };
  };

  const beginSelection = (dayKey: string, dayOfWeek: SelectionDraft['dayOfWeek'], minute: number) => {
    setSelectionCommitted(null);
    setIsSelecting(true);
    setSelectionDraft({ dayKey, dayOfWeek, startMinute: minute, endMinute: minute + 5 });
  };

  const updateSelection = (dayKey: string, minute: number) => {
    setSelectionDraft((current) => {
      if (!current || current.dayKey !== dayKey) return current;
      return { ...current, endMinute: minute };
    });
  };

  const commitSelection = () => {
    setIsSelecting(false);
    if (!selectionDraft) return;
    const { startMinute, endMinute } = getSelectionBounds(selectionDraft);
    if (endMinute - startMinute < 5) {
      setSelectionDraft(null);
      return;
    }
    setSelectionCommitted({ ...selectionDraft, startMinute, endMinute });
  };

  const goToUnavailability = () => {
    if (!selectionCommitted) return;
    const params = new URLSearchParams({
      from: toLocalDateTime(selectionCommitted.dayKey, selectionCommitted.startMinute),
      to: toLocalDateTime(selectionCommitted.dayKey, selectionCommitted.endMinute),
    });
    navigate(`${ROUTES_MAP['company.booking.schedule-unavailability.create'].href}?${params.toString()}`);
  };

  const goToAvailability = () => {
    if (!selectionCommitted) return;
    const params = new URLSearchParams({
      date: selectionCommitted.dayKey,
      startTime: formatMinuteClock(selectionCommitted.startMinute),
      endTime: formatMinuteClock(selectionCommitted.endMinute),
      redirectTo: `${ROUTES_MAP['company.booking.schedule'].href}?date=${loaderData.date}`,
    });
    navigate(`${ROUTES_MAP['company.booking.schedule.availabilities'].href}?${params.toString()}`);
  };

  const goToAvailabilityEdit = (availabilityId: number) => {
    const params = new URLSearchParams({ id: String(availabilityId) });
    navigate(`${ROUTES_MAP['company.booking.schedule.availabilities.edit'].href}?${params.toString()}`);
  };

  const goToUnavailabilityEdit = (item: ScheduleItem) => {
    const params = new URLSearchParams({
      from: item.startTime,
      to: item.endTime,
      redirectTo: `${ROUTES_MAP['company.booking.schedule'].href}?date=${loaderData.date}`,
    });
    navigate(`${ROUTES_MAP['company.booking.schedule-unavailability.create'].href}?${params.toString()}`);
  };

  const clearSelection = () => {
    setSelectionDraft(null);
    setSelectionCommitted(null);
  };

  useEffect(() => {
    if (!globalWindow || !scrollContainerRef.current) return;
    if (lastAutoCenteredDateRef.current === loaderData.date) return;
    const container = scrollContainerRef.current;
    const totalMinutes = Math.max(1, globalWindow.endMinute - globalWindow.startMinute);
    const minuteOffset = Math.max(0, initialViewportStartMinute - globalWindow.startMinute);
    const topRatio = minuteOffset / totalMinutes;
    container.scrollTop = topRatio * calendarBodyHeightPx;

    const todayColumn = weekDays.find((day) => day.isToday);
    if (!isMobileLayout && todayColumn) {
      const element = dayColumnRefs.current[todayColumn.key];
      if (element) {
        const targetLeft = Math.max(0, element.offsetLeft - container.clientWidth / 2 + element.clientWidth / 2);
        container.scrollLeft = targetLeft;
      }
    }

    lastAutoCenteredDateRef.current = loaderData.date;
  }, [loaderData.date, globalWindow, calendarBodyHeightPx, initialViewportStartMinute, weekDays, isMobileLayout]);

  const onMobileDayChange = useCallback((dayKey: string) => {
    setMobileDayKey(dayKey);
  }, []);

  const visibleDays = useMemo(() => {
    if (!isMobileLayout) return weekDays;
    const selected = weekDays.find((day) => day.key === mobileDayKey) ?? weekDays[0];
    return selected ? [selected] : [];
  }, [isMobileLayout, mobileDayKey, weekDays]);

  return (
    <CompanyPageTemplate
      className="app-route-shape-background"
      routeLinks={
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Form method="get" className="w-full lg:w-auto">
            <div className="grid w-full grid-cols-3 gap-1 rounded-2xl border border-border bg-surface p-1 shadow-sm lg:inline-grid lg:w-auto">
              <Button
                type="submit"
                name="date"
                value={prevDate}
                variant="ghost"
                size="md"
                disabled={!canGoToPreviousWeek}
                className="h-11 rounded-xl px-3 text-sm text-text-secondary hover:bg-background hover:text-text-primary disabled:hover:bg-transparent sm:h-12 lg:h-10"
              >
                <ChevronLeft className="h-4 w-4 md:hidden" />
                <span className="md:hidden">Forrige</span>
                <span className="hidden md:inline">Forrige uke</span>
              </Button>
              <Button
                type="submit"
                name="date"
                value={formatDateInputInTimeZone(new Date())}
                variant="ghost"
                size="md"
                className={`h-11 rounded-xl px-3 text-sm shadow-none sm:h-12 lg:h-10 ${
                  isCurrentWeekView
                    ? 'bg-background text-text-primary shadow-sm ring-1 ring-border/70 hover:bg-background'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                <CalendarDays className="h-4 w-4 md:hidden" />
                <span>Denne</span>
              </Button>
              <Button
                type="submit"
                name="date"
                value={nextDate}
                variant="ghost"
                size="md"
                className={`h-11 rounded-xl px-3 text-sm sm:h-12 lg:h-10 ${
                  isFutureWeekView
                    ? 'bg-background text-text-primary shadow-sm ring-1 ring-border/70 hover:bg-background'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                <span className="md:hidden">Neste</span>
                <span className="hidden md:inline">Neste uke</span>
                <ChevronRight className="h-4 w-4 md:hidden" />
              </Button>
            </div>
          </Form>
          <div className="flex w-full items-stretch gap-2 lg:w-auto lg:justify-end">
            {!isMobileLayout && selectionCommitted ? (
              <>
                {hasWorkingHoursSelection ? (
                  <Button
                    type="button"
                    size="md"
                    variant="outline"
                    className="h-11 flex-1 rounded-xl px-4 text-sm shadow-sm lg:flex-none lg:h-10"
                    onClick={goToUnavailability}
                  >
                    Legg til utilgjengelighet
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="md"
                    variant="secondary"
                    className="h-11 flex-1 rounded-xl bg-interactive text-text-inverse shadow-sm hover:bg-interactive-hover lg:flex-none lg:h-10"
                    onClick={goToAvailability}
                  >
                    Legg til tilgjengelighet
                  </Button>
                )}
                <Button
                  type="button"
                  size="md"
                  variant="ghost"
                  className="h-11 rounded-xl px-4 text-text-secondary hover:bg-surface hover:text-text-primary lg:h-10"
                  onClick={clearSelection}
                >
                  Nullstill
                </Button>
              </>
            ) : null}
          </div>
        </div>
      }
    >
      {isMobileLayout ? (
        <ScheduleMobileView
          weekDays={weekDays}
          initialDayKey={mobileDayKey}
          onDayChange={onMobileDayChange}
          onNavigate={(to) => navigate(to)}
        />
      ) : null}

      {loaderData.error ? (
        <Notice tone="emphasis" title="Kunne ikke hente kalenderoversikt" message={loaderData.error} />
      ) : null}

      {!loaderData.error && loaderData.dailySchedules.length === 0 ? (
        <Notice tone="default" title="Ingen timer her" message="Det er ingen arbeidstid satt for valgt uke." />
      ) : null}

      {!loaderData.error && loaderData.dailySchedules.length > 0 && globalWindow ? (
        <>
          <ScheduleDesktopView
            globalWindow={globalWindow}
            visibleDays={visibleDays}
            isMobileLayout={isMobileLayout}
            itemsByDay={itemsByDay}
            hourRows={hourRows}
            calendarBodyHeightPx={calendarBodyHeightPx}
            isSelecting={isSelecting}
            activePointerId={activePointerId}
            selectionDraft={selectionDraft}
            selectionCommitted={selectionCommitted}
            hoverState={hoverState}
            dailySchedules={loaderData.dailySchedules}
            scrollContainerRef={scrollContainerRef}
            dayColumnRefs={dayColumnRefs}
            setHoverState={setHoverState}
            setActivePointerId={setActivePointerId}
            beginSelection={beginSelection}
            updateSelection={updateSelection}
            commitSelection={commitSelection}
            getSelectionBounds={getSelectionBounds}
            onItemClick={onItemClick}
          />
          {isMobileLayout && selectionCommitted ? (
            <div className="sticky bottom-3 z-30 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
              <div className="mb-3 text-center text-sm font-semibold text-text-primary">
                {formatMinuteClock(selectionCommitted.startMinute)} - {formatMinuteClock(selectionCommitted.endMinute)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {hasWorkingHoursSelection ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl text-base shadow-sm"
                    onClick={goToUnavailability}
                  >
                    Legg til utilgjengelighet
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="h-12 rounded-xl bg-interactive text-base text-text-inverse shadow-sm hover:bg-interactive-hover"
                    onClick={goToAvailability}
                  >
                    Legg til tilgjengelighet
                  </Button>
                )}
                <Button type="button" size="lg" variant="ghost" className="h-12 rounded-xl px-4 text-base" onClick={clearSelection}>
                  Nullstill
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedItem(null);
            setSelectedAppointment(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Avtaledetaljer</DialogTitle>
            <DialogDescription>
              {selectedItem
                ? `${format(new Date(selectedItem.startTime), 'PPPp', { locale: nb })} - ${format(new Date(selectedItem.endTime), 'p', { locale: nb })}`
                : 'Detaljer for valgt kalenderhendelse'}
            </DialogDescription>
          </DialogHeader>

          {detailsFetcher.state !== 'idle' && selectedItem?.kind === 'appointment' ? (
            <Notice tone="default" title="Laster detaljer" message="Henter avtaleinformasjon..." />
          ) : null}

          {selectedAppointment ? (
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                    Kunde
                  </Text>
                  <Text as="p" variant="body-sm" className="mt-1 font-semibold">
                    {selectedAppointment.user?.givenName} {selectedAppointment.user?.familyName}
                  </Text>
                </div>
                <div className="space-y-2">
                  <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                    Oppsummering
                  </Text>
                  <KeyValueList
                    layout="compact"
                    items={[
                      { label: 'Tjenester', value: getTotalServiceCount(selectedAppointment) },
                      { label: 'Varighet', value: getTotalDuration(selectedAppointment) },
                      { label: 'Total pris', value: getTotalPrice(selectedAppointment) },
                    ]}
                  />
                </div>
              </div>
            </div>
          ) : selectedItem ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge>{selectedItem.kind === 'availability' ? 'Tilgjengelighet' : 'Utilgjengelighet'}</Badge>
              </div>
              <Text as="p" variant="body-sm" className="text-text-secondary">
                {selectedItem.text}
              </Text>
              {selectedItem.kind === 'availability' && selectedItem.availabilityId ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={selectedItemIsPast}
                    title={selectedItemIsPast ? 'Tidligere tilgjengeligheter kan ikke redigeres' : undefined}
                    onClick={() => goToAvailabilityEdit(selectedItem.availabilityId!)}
                  >
                    Rediger
                  </Button>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete-availability" />
                    <input type="hidden" name="availabilityId" value={selectedItem.availabilityId} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      disabled={selectedItemIsPast}
                      title={selectedItemIsPast ? 'Tidligere tilgjengeligheter kan ikke slettes' : undefined}
                      onClick={() => {
                        setDetailsOpen(false);
                        setSelectedItem(null);
                        setSelectedAppointment(null);
                      }}
                    >
                      Slett
                    </Button>
                  </Form>
                </div>
              ) : null}
              {selectedItem.kind === 'unavailability' ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={selectedItemIsPast}
                    title={selectedItemIsPast ? 'Tidligere fravær kan ikke redigeres' : undefined}
                    onClick={() => goToUnavailabilityEdit(selectedItem)}
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
