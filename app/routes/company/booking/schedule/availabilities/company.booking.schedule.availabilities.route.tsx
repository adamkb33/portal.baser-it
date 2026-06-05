import { addDays, addMonths, format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, CalendarPlus2, Plus, Trash2 } from 'lucide-react';
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
import { Button, Calendar, Card, CardContent, CardHeader, CardTitle, CompanyPageTemplate, Notice, Popover, PopoverContent, PopoverTrigger, Text } from '~/ui';

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
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente tilgjengeligheter');
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
        const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Ugyldig tilgjengelighet-id' });
        return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
      }

      const availabilityResponse = await withAuth(request, async () => Booking.getAvailability({ path: { id } }));
      const availability = availabilityResponse.data?.data;
      if (!availability) {
        const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Fant ikke tilgjengelighet' });
        return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
      }
      if (isPastInterval(availability.endTime)) {
        const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Tidligere tilgjengeligheter kan ikke slettes' });
        return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
      }

      await withAuth(request, async () => Booking.deleteAvailability({ path: { id } }));
      const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Tilgjengelighet slettet' });
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

    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Tilgjengelighet lagt til' });
    return redirect(redirectTo ?? request.url, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre tilgjengelighet');
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

  const rangeOptions = [
    { value: '30d', label: '30 dager' },
    { value: '90d', label: '90 dager' },
    { value: '6m', label: '6 måneder' },
    { value: '12m', label: '12 måneder' },
    { value: 'prev6m', label: 'Siste 6 måneder' },
  ];

  return (
    <CompanyPageTemplate
      title="Tilgjengeligheter"
      routeLinks={
        <NavLink
          to={ROUTES_MAP['company.booking.schedule'].href}
          className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
        >
          Tilbake til ukeplan
        </NavLink>
      }
    >
      {loaderData.error ? <Notice tone="emphasis" title="Kunne ikke hente tilgjengeligheter" message={loaderData.error} /> : null}

      <Card variant="default" size="sm" className="bg-surface">
        <CardHeader>
          <CardTitle>Legg til tilgjengelighet</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <input name="intent" type="hidden" value="create" />
            <input name="redirectTo" type="hidden" value={redirectTo} />
            <div>
              <input name="date" type="hidden" value={dateValue} />
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-9 w-full justify-between px-2 text-xs">
                    <span>{dateValue}</span>
                    <CalendarIcon className="h-3.5 w-3.5 text-text-secondary" />
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

            <StartEndTimeSelector
              startValue={startTime}
              endValue={endTime}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
              zIndex={60}
            />

            <Button type="submit" size="sm" className="h-9">
              <Plus className="h-4 w-4" />
              Legg til
            </Button>
          </Form>
        </CardContent>
      </Card>

      <Card variant="default" size="sm" className="bg-surface">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Registrerte tilgjengeligheter</CardTitle>
            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={loaderData.range === option.value ? 'secondary' : 'outline'}
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
          </div>
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Totalt: {loaderData.total}
          </Text>
        </CardHeader>
        <CardContent className="space-y-2">
          {loaderData.availabilities.length === 0 ? (
            <Notice tone="default" title="Ingen tilgjengeligheter" message="Ingen registrerte tidsrom i valgt periode." />
          ) : (
            loaderData.availabilities.map((item: ScheduleAvailabilityDto) => {
              const isPast = isPastInterval(item.endTime);
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CalendarPlus2 className="h-4 w-4 text-secondary" />
                      <Text as="p" variant="body-sm" className="font-medium">
                        {format(new Date(item.startTime), 'dd.MM.yyyy HH:mm')} - {format(new Date(item.endTime), 'HH:mm')}
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
                      title={isPast ? 'Tidligere tilgjengeligheter kan ikke slettes' : undefined}
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
