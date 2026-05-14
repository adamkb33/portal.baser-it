import { Form, NavLink, data, redirect } from 'react-router';
import type { Route } from './+types/company.booking.schedule.availabilities.edit.route';
import { Booking } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { formatLocalDateTimeInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/route-tree';
import { Button, Card, CardContent, CardHeader, CardTitle, CompanyPageTemplate, Notice, Text } from '~/ui';
import { StartEndTimeSelector } from '~/components/pickers/start-end-time-selector';
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '~/ui';
import { Popover, PopoverContent, PopoverTrigger } from '~/ui';
import { Calendar as CalendarIcon } from 'lucide-react';

function isPastInterval(endTime: string): boolean {
  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));

  if (!Number.isFinite(id) || id <= 0) {
    const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Ugyldig tilgjengelighet-id' });
    return redirect(ROUTES_MAP['company.booking.schedule.availabilities'].href, { headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    const response = await withAuth(request, async () => Booking.getAvailability({ path: { id } }));
    const availability = response.data?.data;

    if (!availability) {
      throw new Error('Fant ikke tilgjengelighet');
    }
    if (isPastInterval(availability.endTime)) {
      const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Tidligere tilgjengeligheter kan ikke redigeres' });
      return redirect(ROUTES_MAP['company.booking.schedule'].href, { headers: { 'Set-Cookie': flashCookie } });
    }

    return data({ availability, error: null as string | null });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente tilgjengelighet');
    return data({ availability: null, error: message }, { status: status ?? 400 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const timezone = 'Europe/Oslo';
  const id = Number(formData.get('id'));
  const date = String(formData.get('date') ?? '');
  const startTime = String(formData.get('startTime') ?? '');
  const endTime = String(formData.get('endTime') ?? '');

  if (!Number.isFinite(id) || id <= 0 || !date || !startTime || !endTime) {
    const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Ugyldige felt' });
    return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
  }

  if (startTime >= endTime) {
    const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Sluttid må være etter starttid' });
    return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    const availabilityResponse = await withAuth(request, async () => Booking.getAvailability({ path: { id } }));
    const availability = availabilityResponse.data?.data;
    if (!availability) {
      const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Fant ikke tilgjengelighet' });
      return redirect(ROUTES_MAP['company.booking.schedule'].href, { headers: { 'Set-Cookie': flashCookie } });
    }
    if (isPastInterval(availability.endTime)) {
      const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Tidligere tilgjengeligheter kan ikke redigeres' });
      return redirect(ROUTES_MAP['company.booking.schedule'].href, { headers: { 'Set-Cookie': flashCookie } });
    }

    await withAuth(request, async () =>
      Booking.updateAvailability({
        path: { id },
        body: {
          startTime: formatLocalDateTimeInTimeZone(date, startTime, timezone),
          endTime: formatLocalDateTimeInTimeZone(date, endTime, timezone),
        },
      }),
    );

    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Tilgjengelighet oppdatert' });
    return redirect(ROUTES_MAP['company.booking.schedule'].href, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke oppdatere tilgjengelighet');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return redirect(request.url, { headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyBookingScheduleAvailabilitiesEditPage({ loaderData }: Route.ComponentProps) {
  const availability = loaderData.availability;
  const [startTime, setStartTime] = useState(availability ? format(new Date(availability.startTime), 'HH:mm') : '15:00');
  const [endTime, setEndTime] = useState(availability ? format(new Date(availability.endTime), 'HH:mm') : '19:00');
  const [dateValue, setDateValue] = useState(
    availability ? format(new Date(availability.startTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  );
  const [isDateOpen, setIsDateOpen] = useState(false);

  return (
    <CompanyPageTemplate
      title="Rediger tilgjengelighet"
      routeLinks={
        <NavLink
          to={ROUTES_MAP['company.booking.schedule'].href}
          className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
        >
          Tilbake til ukeplan
        </NavLink>
      }
    >
      {loaderData.error ? <Notice tone="emphasis" title="Kunne ikke hente tilgjengelighet" message={loaderData.error} /> : null}

      {availability ? (
        <Card variant="default" size="sm" className="bg-surface">
          <CardHeader>
            <CardTitle>Oppdater intervall</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_170px_170px_auto]">
              <input type="hidden" name="id" value={availability.id} />
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
                Oppdater
              </Button>
            </Form>

            <Text as="p" variant="body-sm" className="mt-3 text-text-secondary">
              ID vises ikke i UI. Endringen brukes kun på valgt tidsintervall.
            </Text>
          </CardContent>
        </Card>
      ) : null}
    </CompanyPageTemplate>
  );
}
