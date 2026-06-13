import type { Route } from './+types/company.booking.schedule-unavailability.route';
import { CompanyUserScheduleUnavailabilityController, type ScheduleUnavailabilityDto } from '~/api/generated/booking';
import { NavLink, data, useNavigate, useSearchParams } from 'react-router';
import { CalendarOff, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { withAuth } from '~/api/utils/with-auth';
import { addDays, addMonths, format, isSameDay, startOfDay } from 'date-fns';
import { resolveErrorPayload } from '~/lib/api-error';
import { formatDateBoundaryInTimeZone, formatDateInputInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, Card, CardContent, CardHead, CompanyPageTemplate, KeyValueList, KpiCard, Text } from '~/ui';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const timezone = 'Europe/Oslo';
    const url = new URL(request.url);
    const range = url.searchParams.get('range') ?? '6m';
    const today = startOfDay(new Date());
    const isPastRange = range === 'prev6m';
    const rangeStartDate = isPastRange ? addMonths(today, -6) : today;
    const rangeEndDate = isPastRange
      ? today
      : range === '30d'
        ? addDays(today, 30)
        : range === '90d'
          ? addDays(today, 90)
          : range === '12m'
            ? addMonths(today, 12)
            : addMonths(today, 6);
    const fromDateTime = formatDateBoundaryInTimeZone(
      formatDateInputInTimeZone(rangeStartDate, timezone),
      'start',
      timezone,
    );
    const toDateTime = formatDateBoundaryInTimeZone(formatDateInputInTimeZone(rangeEndDate, timezone), 'end', timezone);

    const getResponse = await withAuth(request, async () =>
      CompanyUserScheduleUnavailabilityController.companyUserGetUnavailabilityRanges({
        query: {
          fromDateTime,
          toDateTime,
        },
      }),
    );

    return data({
      schedules: getResponse.data?.data ?? [],
      error: null as string | null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente fravær');
    return data({ schedules: [], error: message }, { status: status ?? 400 });
  }
}

export default function CompanyBookingScheduleUnavailabilityRoute({ loaderData }: Route.ComponentProps) {
  const { schedules, error } = loaderData;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState(searchParams.get('range') ?? '6m');
  const today = startOfDay(new Date());

  const formatDate = (value: Date | string) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };
  const formatTime = (dateString: string) => format(new Date(dateString), 'HH:mm');
  const formatDateTimeRange = (start: string, end: string) => {
    if (isSameDay(new Date(start), new Date(end))) {
      return `${formatDate(start)} ${formatTime(start)}–${formatTime(end)}`;
    }
    return `${formatDate(start)} ${formatTime(start)} – ${formatDate(end)} ${formatTime(end)}`;
  };
  const isWholeDay = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (
      isSameDay(startDate, endDate) && format(startDate, 'HH:mm') === '00:00' && format(endDate, 'HH:mm') === '23:59'
    );
  };

  const totalRanges = schedules?.length ?? 0;
  const wholeDayRanges = schedules?.filter((range) => isWholeDay(range.startTime, range.endTime)).length ?? 0;
  const partialRanges = Math.max(totalRanges - wholeDayRanges, 0);
  const visibleSchedules = schedules?.slice(0, 5) ?? [];
  const rangeOptions = [
    { value: '30d', label: '30 dager', tone: 'future' },
    { value: '90d', label: '90 dager', tone: 'future' },
    { value: '6m', label: '6 måneder', tone: 'future' },
    { value: '12m', label: '12 måneder', tone: 'future' },
    { value: 'prev6m', label: 'Siste 6 måneder', tone: 'past' },
  ];
  const getRangeDates = (range: string, baseDate: Date) => {
    if (range === 'prev6m') {
      return { start: addMonths(baseDate, -6), end: baseDate };
    }
    if (range === '30d') return { start: baseDate, end: addDays(baseDate, 30) };
    if (range === '90d') return { start: baseDate, end: addDays(baseDate, 90) };
    if (range === '12m') return { start: baseDate, end: addMonths(baseDate, 12) };
    return { start: baseDate, end: addMonths(baseDate, 6) };
  };
  const { start: rangeStartDate, end: rangeEndDate } = getRangeDates(selectedRange, today);
  const futureOptions = rangeOptions.filter((option) => option.tone === 'future');
  const pastOptions = rangeOptions.filter((option) => option.tone === 'past');

  return (
    <CompanyPageTemplate
      title="Mitt fravik"
      description="Planlegg fravær og pauser i samme kompakte booking-layout som resten av domenet."
      routeLinks={
        <>
          <Button asChild variant="outline" size="sm">
            <NavLink to={ROUTES_MAP['company.booking'].href}>Oversikt</NavLink>
          </Button>
          <Button asChild variant="outline" size="sm">
            <NavLink to={ROUTES_MAP['company.booking.profile'].href}>Bookingprofil</NavLink>
          </Button>
        </>
      }
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard label="Totalt" value={totalRanges} icon={<CalendarOff className="h-5 w-5" />} tone="primary" />
          <KpiCard label="Heldag" value={wholeDayRanges} icon={<CalendarOff className="h-5 w-5" />} tone="success" />
          <KpiCard
            label="Med klokkeslett"
            value={partialRanges}
            icon={<CalendarOff className="h-5 w-5" />}
            tone="info"
          />
        </div>
      }
    >
      <Card variant="default">
        <CardHead
          heading="Registrert fravær"
          action={
            <Button asChild size="sm">
              <NavLink to={ROUTES_MAP['company.booking.schedule-unavailability.create'].href}>
                <Plus className="h-4 w-4" />
                Legg til fravær
              </NavLink>
            </Button>
          }
        >
          <Text as="p" variant="body-sm" className="text-text-secondary">
            De neste fraværsperiodene dine.
          </Text>
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Periode</span>
              <span>
                {formatDate(rangeStartDate)} – {formatDate(rangeEndDate)}
              </span>
            </div>
            <KeyValueList
              layout="compact"
              items={[
                { label: 'Totalt', value: totalRanges },
                { label: 'Heldag', value: wholeDayRanges },
                { label: 'Med klokkeslett', value: partialRanges },
              ]}
            />
            <div className="space-y-2 border-t border-border pt-3">
              <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">Fremover</div>
              <div className="flex flex-wrap gap-2">
                {futureOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={selectedRange === option.value ? 'primary' : 'outline'}
                    onClick={() => {
                      setSelectedRange(option.value);
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set('range', option.value);
                      navigate({ search: `?${nextParams.toString()}` });
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">Tidligere</div>
              <div className="flex flex-wrap gap-2">
                {pastOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={selectedRange === option.value ? 'secondary' : 'outline'}
                    className={selectedRange === option.value ? 'bg-surface text-text-primary' : undefined}
                    onClick={() => {
                      setSelectedRange(option.value);
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set('range', option.value);
                      navigate({ search: `?${nextParams.toString()}` });
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Viser {visibleSchedules.length} av {totalRanges}
              </div>
            </div>
          </div>
        </CardHead>
        <CardContent className="space-y-2">
          {visibleSchedules.length > 0 ? (
            visibleSchedules.map((schedule: ScheduleUnavailabilityDto) => (
              <div
                key={`${schedule.profileId}-${schedule.startTime}-${schedule.endTime}`}
                className="flex items-center gap-3 rounded-md bg-background p-3"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <CalendarOff className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {formatDateTimeRange(schedule.startTime, schedule.endTime)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background">
                <CalendarOff className="h-6 w-6 text-text-secondary" />
              </div>
              <p className="text-sm text-text-secondary">{error || 'Ingen fraværsperioder registrert'}</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <NavLink to={ROUTES_MAP['company.booking.schedule-unavailability.create'].href}>
                  <Plus className="h-4 w-4" />
                  Legg til fravær
                </NavLink>
              </Button>
            </div>
          )}
          {schedules && schedules.length > 5 ? (
            <Button variant="ghost" size="sm" className="w-full">
              Vis alle ({schedules.length})
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </CompanyPageTemplate>
  );
}
