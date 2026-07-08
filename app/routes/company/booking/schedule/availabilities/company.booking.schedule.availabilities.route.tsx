import { addDays, addMonths, format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, CalendarPlus2, Clock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Form, NavLink, data, redirect, useNavigate, useSearchParams } from 'react-router';
import type { Route } from './+types/company.booking.schedule.availabilities.route';
import { Booking, type ScheduleAvailabilityDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { StartEndTimeSelector } from '~/components/pickers/start-end-time-selector';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { formatDateBoundaryInTimeZone, formatLocalDateTimeInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardHead,
  CompanyPageTemplate,
  Label,
  Notice,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '~/ui';

function getRangeBounds(range: string, baseDate: Date) {
  const start = range === 'prev6m' ? addMonths(baseDate, -6) : baseDate;
  const end =
    range === 'prev6m'
      ? baseDate
      : range === '30d'
        ? addDays(baseDate, 30)
        : range === '90d'
          ? addDays(baseDate, 90)
          : range === '12m'
            ? addMonths(baseDate, 12)
            : addMonths(baseDate, 6);

  return { start, end };
}

function isPastInterval(endTime: string): boolean {
  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
}

function resolveRedirectTo(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  return value;
}

function toTimeMinutes(value: string): number | null {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function getDurationLabel(startTime: string, endTime: string): string {
  const start = toTimeMinutes(startTime);
  const end = toTimeMinutes(endTime);
  if (start == null || end == null || end <= start) return 'Velg gyldig tidsrom';

  const duration = end - start;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} t`;
  return `${hours} t ${minutes} min`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const timezone = 'Europe/Oslo';
  const url = new URL(request.url);
  const range = url.searchParams.get('range') ?? '6m';
  const today = startOfDay(new Date());
  const { start, end } = getRangeBounds(range, today);

  try {
    const response = await withAuth(request, async () =>
      Booking.getAvailabilities({
        query: {
          page: 0,
          size: 200,
          fromDateTime: formatDateBoundaryInTimeZone(format(start, 'yyyy-MM-dd'), 'start', timezone),
          toDateTime: formatDateBoundaryInTimeZone(format(end, 'yyyy-MM-dd'), 'end', timezone),
        },
      }),
    );

    return data({
      range,
      availabilities: response.data?.data?.content ?? [],
      total: response.data?.data?.totalElements ?? 0,
      error: null as string | null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente bookbar tid');
    return data({ range, availabilities: [], total: 0, error: message }, { status: status ?? 400 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'create');
  const timezone = 'Europe/Oslo';
  const redirectTo = resolveRedirectTo(String(formData.get('redirectTo') ?? ''));

  try {
    if (intent === 'delete') {
      const id = Number(formData.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Ugyldig tidsrom-id' });
        return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
      }

      const availabilityResponse = await withAuth(request, async () => Booking.getAvailability({ path: { id } }));
      const availability = availabilityResponse.data?.data;
      if (!availability) {
        const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Fant ikke tidsrommet' });
        return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
      }
      if (isPastInterval(availability.endTime)) {
        const flashCookie = await setFlashMessage(request, {
          type: 'error',
          text: 'Tidligere bookbar tid kan ikke slettes',
        });
        return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
      }

      await withAuth(request, async () => Booking.deleteAvailability({ path: { id } }));
      const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Bookbar tid slettet' });
      return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
    }

    const date = String(formData.get('date') ?? '');
    const startTime = String(formData.get('startTime') ?? '');
    const endTime = String(formData.get('endTime') ?? '');

    if (!date || !startTime || !endTime) {
      const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Velg dato, start og slutt' });
      return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
    }

    if (startTime >= endTime) {
      const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Sluttid må være etter starttid' });
      return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
    }

    await withAuth(request, async () =>
      Booking.createAvailabilities({
        body: [
          {
            from: formatLocalDateTimeInTimeZone(date, startTime, timezone),
            to: formatLocalDateTimeInTimeZone(date, endTime, timezone),
          },
        ],
      }),
    );

    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Bookbar tid lagt til' });
    return redirect(redirectTo ?? request.url, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre bookbar tid');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyBookingScheduleAvailabilitiesPage({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefillDate = searchParams.get('date') ?? format(new Date(), 'yyyy-MM-dd');
  const prefillStart = searchParams.get('startTime') ?? '15:00';
  const prefillEnd = searchParams.get('endTime') ?? '19:00';
  const redirectTo = searchParams.get('redirectTo') ?? '';
  const [dateValue, setDateValue] = useState(prefillDate);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [startTime, setStartTime] = useState(prefillStart);
  const [endTime, setEndTime] = useState(prefillEnd);
  const durationLabel = getDurationLabel(startTime, endTime);

  const rangeOptions = [
    { value: '30d', label: '30 dager' },
    { value: '90d', label: '90 dager' },
    { value: '6m', label: '6 måneder' },
    { value: '12m', label: '12 måneder' },
    { value: 'prev6m', label: 'Siste 6 måneder' },
  ];

  return (
    <CompanyPageTemplate
      title="Bookbar tid"
      routeLinks={
        <Button asChild variant="outline" size="sm">
          <NavLink to={ROUTES_MAP['company.booking.schedule'].href}>Tilbake til ukeplan</NavLink>
        </Button>
      }
    >
      {loaderData.error ? (
        <Notice tone="emphasis" title="Kunne ikke hente bookbar tid" message={loaderData.error} />
      ) : null}

      <Card variant="default" size="sm" className="overflow-visible">
        <CardHead
          eyebrow="Ny bookbar tid"
          heading="Legg til tid"
          className="items-start"
          action={
            <div className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm font-semibold text-success">
              {durationLabel}
            </div>
          }
        >
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Opprett et tidsrom kundene kan bestille.
          </Text>
        </CardHead>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input name="intent" type="hidden" value="create" />
            <input name="redirectTo" type="hidden" value={redirectTo} />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(13rem,0.8fr)_minmax(22rem,1.2fr)] xl:items-end">
              <div className="space-y-1.5">
                <Label>Dato</Label>
                <input name="date" type="hidden" value={dateValue} />
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full justify-between rounded-lg border-border bg-background px-3 text-sm"
                    >
                      <span className="font-medium">{format(new Date(`${dateValue}T00:00:00`), 'dd.MM.yyyy')}</span>
                      <CalendarIcon className="h-4 w-4 text-text-secondary" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(`${dateValue}T00:00:00`)}
                      onSelect={(next) => {
                        if (!next) return;
                        setDateValue(format(next, 'yyyy-MM-dd'));
                        setIsDateOpen(false);
                      }}
                      hidden={{ before: startOfDay(new Date()) }}
                      numberOfMonths={1}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label>Tidspunkt</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <StartEndTimeSelector
                    startValue={startTime}
                    endValue={endTime}
                    onStartChange={setStartTime}
                    onEndChange={setEndTime}
                    startPlaceholder="Fra"
                    endPlaceholder="Til"
                    zIndex={80}
                    endPanelAlign="end"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-variant-1 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
                <Clock className="h-4 w-4 shrink-0 text-success" />
                <span className="truncate">
                  {format(new Date(`${dateValue}T00:00:00`), 'dd.MM.yyyy')} kl. {startTime} - {endTime}
                </span>
              </div>
              <Button type="submit" size="md" className="h-11 rounded-lg sm:min-w-36">
                <Plus className="h-4 w-4" />
                Legg til
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card variant="default" size="sm" className="overflow-hidden">
        <CardHead
          heading="Planlagt bookbar tid"
          action={
            <div className="flex max-w-full flex-wrap gap-1 rounded-lg border border-border bg-surface-variant-1 p-1">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={loaderData.range === option.value ? 'primary' : 'ghost'}
                  className="h-8 rounded-md px-3 text-xs"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('range', option.value);
                    navigate({ search: `?${next.toString()}` });
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          }
        >
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {loaderData.total} tidsrom i valgt periode.
          </Text>
        </CardHead>
        <CardContent className="space-y-2">
          {loaderData.availabilities.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface-variant-1 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
                <CalendarPlus2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <Text as="p" variant="body" className="font-semibold">
                  Ingen bookbar tid
                </Text>
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  Ingen registrerte tidsrom i valgt periode.
                </Text>
              </div>
            </div>
          ) : (
            loaderData.availabilities.map((item: ScheduleAvailabilityDto) => {
              const isPast = isPastInterval(item.endTime);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
                        <CalendarPlus2 className="h-4 w-4" />
                      </div>
                      <Text as="p" variant="body-sm" className="font-medium">
                        {format(new Date(item.startTime), 'dd.MM.yyyy HH:mm')} -{' '}
                        {format(new Date(item.endTime), 'HH:mm')}
                      </Text>
                    </div>
                  </div>
                  <Form method="post">
                    <input name="intent" type="hidden" value="delete" />
                    <input name="id" type="hidden" value={item.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      disabled={isPast}
                      title={isPast ? 'Tidligere bookbar tid kan ikke slettes' : undefined}
                    >
                      <Trash2 className="h-4 w-4" />
                      Slett
                    </Button>
                  </Form>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </CompanyPageTemplate>
  );
}
