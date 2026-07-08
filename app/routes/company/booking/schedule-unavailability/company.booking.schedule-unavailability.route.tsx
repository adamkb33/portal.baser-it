import type { Route } from './+types/company.booking.schedule-unavailability.route';
import {
  CompanyUserScheduleUnavailabilityController,
  type ScheduleUnavailabilityGroupDto,
} from '~/api/generated/booking';
import { Form, NavLink, data, useNavigate, useNavigation, useSearchParams } from 'react-router';
import { CalendarOff, Clock, Plus, Trash2 } from 'lucide-react';
import { withAuth } from '~/api/utils/with-auth';
import { addDays, addMonths, format, isSameDay, startOfDay } from 'date-fns';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithSuccess } from '~/lib/flash-message.server';
import { formatDateBoundaryInTimeZone, formatDateInputInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Badge, Button, Card, CardContent, CardHead, CompanyPageTemplate, Text } from '~/ui';

function getRangeBounds(range: string, baseDate: Date) {
  if (range === 'prev6m') {
    return { start: addMonths(baseDate, -6), end: baseDate };
  }
  if (range === '30d') return { start: baseDate, end: addDays(baseDate, 30) };
  if (range === '90d') return { start: baseDate, end: addDays(baseDate, 90) };
  if (range === '12m') return { start: baseDate, end: addMonths(baseDate, 12) };
  return { start: baseDate, end: addMonths(baseDate, 6) };
}

function isPastInterval(endTime: string): boolean {
  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
}

export async function loader({ request }: Route.LoaderArgs) {
  const timezone = 'Europe/Oslo';
  const url = new URL(request.url);
  const range = url.searchParams.get('range') ?? '6m';
  const today = startOfDay(new Date());
  const { start, end } = getRangeBounds(range, today);

  try {
    const fromDateTime = formatDateBoundaryInTimeZone(formatDateInputInTimeZone(start, timezone), 'start', timezone);
    const toDateTime = formatDateBoundaryInTimeZone(formatDateInputInTimeZone(end, timezone), 'end', timezone);

    const getResponse = await withAuth(request, async () =>
      CompanyUserScheduleUnavailabilityController.companyUserGetGroupedUnavailabilityRanges({
        query: {
          fromDateTime,
          toDateTime,
        },
      }),
    );

    return data({
      range,
      groups: getResponse.data?.data ?? [],
      error: null as string | null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente fravær');
    return data({ range, groups: [] as ScheduleUnavailabilityGroupDto[], error: message }, { status: status ?? 400 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? '');

  if (intent !== 'delete') {
    return redirectWithError(request, request.url, 'Ukjent handling');
  }

  const ids = String(formData.get('ids') ?? '')
    .split(',')
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (ids.length === 0) {
    return redirectWithError(request, request.url, 'Fant ingen fraværsperioder å slette');
  }

  try {
    await withAuth(request, async () =>
      CompanyUserScheduleUnavailabilityController.companyUserDeleteUnavailabilityRanges({
        body: { ids },
      }),
    );

    return redirectWithSuccess(request, request.url, ids.length === 1 ? 'Fravær slettet' : 'Fraværsperiode slettet');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke slette fravær');
    return redirectWithError(request, request.url, message);
  }
}

export default function CompanyBookingScheduleUnavailabilityRoute({ loaderData }: Route.ComponentProps) {
  const { groups, error } = loaderData;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const selectedRange = loaderData.range ?? searchParams.get('range') ?? '6m';
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
  const formatDateTimeRange = (start: string, end: string, wholeDay: boolean) => {
    if (wholeDay) {
      if (isSameDay(new Date(start), new Date(end))) {
        return formatDate(start);
      }
      return `${formatDate(start)} – ${formatDate(end)}`;
    }

    if (isSameDay(new Date(start), new Date(end))) {
      return `${formatDate(start)} ${formatTime(start)}–${formatTime(end)}`;
    }
    return `${formatDate(start)} ${formatTime(start)} – ${formatDate(end)} ${formatTime(end)}`;
  };
  const isWholeDay = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return format(startDate, 'HH:mm') === '00:00' && ['00:00', '23:59'].includes(format(endDate, 'HH:mm'));
  };

  const groupedSchedules = groups;
  const totalRanges = groupedSchedules.length;
  const wholeDayRanges = groupedSchedules.filter((group) =>
    group.blockedSlots.every((slot) => isWholeDay(slot.startTime, slot.endTime)),
  ).length;
  const partialRanges = Math.max(totalRanges - wholeDayRanges, 0);
  const rangeOptions = [
    { value: '30d', label: '30 dager' },
    { value: '90d', label: '90 dager' },
    { value: '6m', label: '6 måneder' },
    { value: '12m', label: '12 måneder' },
    { value: 'prev6m', label: 'Siste 6 måneder' },
  ];
  const { start: rangeStartDate, end: rangeEndDate } = getRangeBounds(selectedRange, today);
  const deletingIds = navigation.state === 'submitting' ? String(navigation.formData?.get('ids') ?? '') : null;

  return (
    <CompanyPageTemplate
      title="Fravær og pauser"
      description="Blokker tid i kalenderen når du ikke kan ta imot bookinger."
      routeLinks={
        <Button asChild variant="outline" size="sm">
          <NavLink to={ROUTES_MAP['company.booking.schedule'].href}>Tilbake til ukeplan</NavLink>
        </Button>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="md">
            {totalRanges} perioder
          </Badge>
          <Badge variant="success" size="md">
            {wholeDayRanges} heldag
          </Badge>
          <Badge variant="info" size="md">
            {partialRanges} med klokkeslett
          </Badge>
        </div>
      }
    >
      <Card variant="default" size="sm">
        <CardHead
          heading="Planlagt fravær"
          action={
            <Button asChild size="sm">
              <NavLink to={ROUTES_MAP['company.booking.schedule-unavailability.create'].href}>
                <Plus className="h-4 w-4" />
                Legg til pause/fravær
              </NavLink>
            </Button>
          }
        >
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Perioder som blokkerer bookinger i kalenderen.
          </Text>
          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface-variant-1 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Text as="p" variant="label" className="text-text-primary">
                Periode
              </Text>
              <Text as="p" variant="body-sm" className="text-text-secondary">
                {formatDate(rangeStartDate)} – {formatDate(rangeEndDate)}
              </Text>
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={selectedRange === option.value ? 'primary' : 'ghost'}
                  className="h-8 rounded-md px-3 text-xs"
                  onClick={() => {
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
        </CardHead>
        <CardContent className="space-y-3">
          {groupedSchedules.length > 0 ? (
            groupedSchedules.map((schedule) => {
              const isWholeDayRange = schedule.blockedSlots.every((slot) => isWholeDay(slot.startTime, slot.endTime));
              const isPast = isPastInterval(schedule.to);
              const idsValue = schedule.ids.join(',');
              const isDeleting = deletingIds === idsValue;
              const blockedSlotCount = schedule.blockedSlots.length;

              return (
                <div
                  key={schedule.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
                      {isWholeDayRange ? <CalendarOff className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <Text as="p" variant="label" className="truncate text-text-primary">
                        {formatDateTimeRange(schedule.from, schedule.to, isWholeDayRange)}
                      </Text>
                      <Text as="p" variant="body-sm" className="text-text-secondary">
                        {isWholeDayRange
                          ? blockedSlotCount > 1
                            ? `${blockedSlotCount} dager er blokkert`
                            : 'Hele dagen er blokkert'
                          : blockedSlotCount > 1
                            ? `${blockedSlotCount} arbeidsdager er blokkert i perioden`
                            : 'Bookinger er blokkert i dette tidsrommet'}
                      </Text>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant={isWholeDayRange ? 'warning' : 'info'} size="sm">
                      {isWholeDayRange ? 'Heldag' : 'Tidsrom'}
                    </Badge>
                    {isPast ? (
                      <Badge variant="muted" size="sm">
                        Tidligere
                      </Badge>
                    ) : null}
                    <Form method="post">
                      <input name="intent" type="hidden" value="delete" />
                      <input name="ids" type="hidden" value={idsValue} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        disabled={isPast || isDeleting}
                        loading={isDeleting}
                        title={isPast ? 'Tidligere fravær kan ikke slettes' : undefined}
                      >
                        <Trash2 className="h-4 w-4" />
                        Slett
                      </Button>
                    </Form>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface-variant-1 p-4">
              <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-background text-text-secondary">
                <CalendarOff className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Text as="p" variant="label" className="text-text-primary">
                  {error || 'Ingen fravær eller pauser'}
                </Text>
                <Text as="p" variant="body-sm" className="mt-1 text-text-secondary">
                  Legg inn tid du ikke kan ta imot bookinger, så blir kalenderen blokkert automatisk.
                </Text>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <NavLink to={ROUTES_MAP['company.booking.schedule-unavailability.create'].href}>
                    <Plus className="h-4 w-4" />
                    Legg til pause/fravær
                  </NavLink>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </CompanyPageTemplate>
  );
}
