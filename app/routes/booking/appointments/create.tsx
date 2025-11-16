import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
  type LoaderFunctionArgs,
} from 'react-router';
import type { ContactDto } from 'tmp/openapi/gen/base';
import type { AppointmentDto, ServiceDto, ServiceGroupDto, ScheduleDto } from 'tmp/openapi/gen/booking';
import {
  createBaseClient,
  type CreateAppointmentCompanyUserDto,
  type DailyScheduleDto,
  type GetCompanyUserScheduleDto,
} from '~/api/clients/base';
import { createBookingClient } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessToken, getAuthPayloadFromRequest } from '~/lib/auth.utils';

type ContactSlim = Pick<ContactDto, 'id' | 'companyId'>;

export type CombinedAppointment = AppointmentDto & {
  contact: ContactSlim | null;
};

export type GroupedService = Omit<ServiceDto, 'serviceGroupId'>;
export type GroupedServiceGroup = ServiceGroupDto & { services: GroupedService[] };

export type BookingAppointmentsLoaderData = {
  companyContacts: ContactDto[];
  companyGroupedServices: GroupedServiceGroup[];
  dailySchedules: DailyScheduleDto[];
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) return redirect('/');

    const identityClient2 = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });
    const companyContactsResponse =
      await identityClient2.CompanyUserContactControllerService.CompanyUserContactControllerService.getContacts({});
    const companyContacts = companyContactsResponse.data?.content ?? [];

    const bookingClient2 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const serviceGroupsResponse =
      await bookingClient2.ServiceGroupControllerService.ServiceGroupControllerService.getServiceGroups({});
    const serviceGroups = serviceGroupsResponse.data?.content ?? [];

    const bookingClient3 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const servicesResponse = await bookingClient3.ServiceControllerService.ServiceControllerService.getServices({});
    const services = servicesResponse.data?.content ?? [];

    const companyGroupedServices: GroupedServiceGroup[] = serviceGroups.map((group) => ({
      ...group,
      services: services.filter((s) => s.serviceGroupId === group.id).map(({ serviceGroupId, ...rest }) => rest),
    }));

    const bookingClient4 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const dailySchedulesResponse =
      await bookingClient4.DailyScheduleControllerService.DailyScheduleControllerService.getDailySchedules();
    const dailySchedules = dailySchedulesResponse.data ?? [];

    return data<BookingAppointmentsLoaderData>({
      companyContacts,
      companyGroupedServices,
      dailySchedules,
    });
  } catch (err: unknown) {
    console.error(err);
    const apiErr = err as ApiClientError;
    return data<BookingAppointmentsLoaderData>({
      companyContacts: [],
      companyGroupedServices: [],
      dailySchedules: [],
      error: apiErr?.body?.message ?? 'Unexpected error',
    });
  }
}

import { type ActionFunctionArgs } from 'react-router';

export type BookingAppointmentsActionData = {
  schedule?: ScheduleDto;
};

export async function action({ request }: ActionFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) return redirect('/');

    const authUser = await getAuthPayloadFromRequest(request);
    if (!authUser || !authUser.company) {
      return redirect('/');
    }

    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    if (intent === 'get-schedule') {
      const url = new URL(request.url);
      const date = url.searchParams.get('date');
      const serviceIdsParam = url.searchParams.get('serviceIds');

      const serviceIds = serviceIdsParam
        ? serviceIdsParam
            .split(',')
            .map((id) => Number(id))
            .filter((id) => !isNaN(id))
        : [];

      if (!date) {
        return data({ error: 'Missing date in query parameters' }, { status: 400 });
      }

      const bookingClient = createBookingClient({
        baseUrl: ENV.BOOKING_BASE_URL,
        token: accessToken,
      });

      const requestBody: GetCompanyUserScheduleDto = {
        userId: authUser.id,
        companyId: authUser.company.companyId,
        date,
        serviceIds,
      };

      const companyUserScheduleResponse =
        await bookingClient.CompanyUserScheduleControllerService.CompanyUserScheduleControllerService.getSchedule({
          requestBody,
        });

      return data<BookingAppointmentsActionData>({ schedule: companyUserScheduleResponse.data });
    }

    if (intent === 'create') {
      const url = new URL(request.url);

      const contactIdParam = url.searchParams.get('contactId');
      const date = url.searchParams.get('date');
      const serviceIdsParam = url.searchParams.get('serviceIds');
      const startTime = url.searchParams.get('startTime');

      if (!contactIdParam || !date || !serviceIdsParam || !startTime) {
        return data({ error: 'Missing required parameters' }, { status: 400 });
      }

      const contactId = Number(contactIdParam);
      if (Number.isNaN(contactId)) {
        return data({ error: 'Invalid contactId' }, { status: 400 });
      }

      const serviceIds = serviceIdsParam
        .split(',')
        .map((n) => Number(n))
        .filter((n) => !Number.isNaN(n));

      if (serviceIds.length === 0) {
        return data({ error: 'Invalid serviceIds' }, { status: 400 });
      }

      const requestBody: CreateAppointmentCompanyUserDto = {
        contactId,
        date,
        startTime,
        serviceIds,
      };

      console.log(requestBody);

      const bookingClient = createBookingClient({
        baseUrl: ENV.BOOKING_BASE_URL,
        token: accessToken,
      });

      await bookingClient.CompanyUserAppointmentControllerService.CompanyUserAppointmentControllerService.createAppointment(
        { requestBody },
      );

      return redirect('/booking/appointments');
    }

    return data({ error: 'Invalid intent' }, { status: 400 });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if ((error as ApiClientError)?.body?.message) {
      return data({ error: (error as ApiClientError).body.message }, { status: 400 });
    }
    throw error;
  }
}

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { ContactPicker } from '~/components/pickers/contact-picker';
import { ServicePicker } from '~/components/pickers/service-picker';
import { DatePicker } from '~/components/pickers/date-picker';
import TimeSlotPicker from '~/components/pickers/time-slot-picker';
import { Button } from '~/components/ui/button';

export default function BookingAppointmentsCreate() {
  const { companyContacts, companyGroupedServices, dailySchedules, error } =
    useLoaderData<BookingAppointmentsLoaderData>();
  const actionData = useActionData<BookingAppointmentsActionData>();
  const userSchedule = actionData?.schedule;

  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const location = useLocation();

  const [schedule, setSchedule] = useState<ScheduleDto | null>(null);

  useEffect(() => {
    if (userSchedule) {
      setSchedule(userSchedule);
    }
  }, [userSchedule]);

  const contactIdParam = searchParams.get('contactId');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    contactIdParam ? Number(contactIdParam) : null,
  );

  const serviceIdsParam = searchParams.get('serviceIds');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(
    serviceIdsParam
      ? serviceIdsParam
          .split(',')
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n))
      : [],
  );

  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(dateParam ?? null);

  const slotParam = searchParams.get('startTime');
  const [selectedStartTime, setSelectedStartTime] = useState<string | undefined>(slotParam ?? undefined);

  const handleContactChange = (id: number | null) => {
    setSelectedContactId(id);

    const next = new URLSearchParams(searchParams);
    if (id) {
      next.set('contactId', String(id));
    } else {
      next.delete('contactId');
      next.delete('serviceIds');
      next.delete('date');
      setSelectedServiceIds([]);
      setSelectedDate(null);
    }
    setSearchParams(next, { replace: true });
  };

  const handleServicesChange = (ids: number[]) => {
    setSelectedServiceIds(ids);

    const next = new URLSearchParams(searchParams);
    if (ids.length > 0) {
      next.set('serviceIds', ids.join(','));
    } else {
      next.delete('serviceIds');
      next.delete('date');
      setSelectedDate(null);
    }
    setSearchParams(next, { replace: true });
  };

  const handleDateChange = (isoDate: string) => {
    setSelectedDate(isoDate);

    const next = new URLSearchParams(searchParams);
    if (isoDate) next.set('date', isoDate);
    else next.delete('date');
    next.delete('startTime');
    setSelectedStartTime(undefined);

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const cid = searchParams.get('contactId');
    const newContactId = cid ? Number(cid) : null;
    if (newContactId !== selectedContactId) setSelectedContactId(newContactId);

    const sids = searchParams.get('serviceIds');
    const newServiceIds = sids
      ? sids
          .split(',')
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n))
      : [];

    if (newServiceIds.join(',') !== selectedServiceIds.join(',')) {
      setSelectedServiceIds(newServiceIds);
    }

    const dp = searchParams.get('date') ?? null;
    if (dp !== selectedDate) setSelectedDate(dp);
  }, [searchParams]);

  useEffect(() => {
    if (selectedContactId && selectedServiceIds.length > 0 && selectedDate) {
      const next = new URLSearchParams(searchParams);
      next.set('contactId', String(selectedContactId));
      next.set('serviceIds', selectedServiceIds.join(','));
      next.set('date', selectedDate);

      setSearchParams(next, { replace: true });

      const fd = new FormData();
      fd.append('intent', 'get-schedule');

      const actionUrl = `${location.pathname}?${next.toString()}`;

      submit(fd, { method: 'post', action: actionUrl });
    }
  }, [selectedContactId, selectedServiceIds, selectedDate]);

  useEffect(() => {
    const p = searchParams.get('startTime') ?? undefined;
    if (p !== selectedStartTime) setSelectedStartTime(p);
  }, [searchParams]);

  const handleTimeSlotChange = (key: string) => {
    setSelectedStartTime(key);
    const next = new URLSearchParams(searchParams);
    if (key) next.set('startTime', key);
    else next.delete('startTime');
    setSearchParams(next, { replace: true });
  };

  const handleCreate = () => {
    const fd = new FormData();
    fd.append('intent', 'create');

    const actionUrl = `${location.pathname}?${searchParams.toString()}`;
    submit(fd, { method: 'post', action: actionUrl });
  };

  const allowedDays = new Set(dailySchedules.map((s) => s.dayOfWeek.toString()));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header card */}
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-md font-semibold tracking-tight text-slate-900">Ny avtale</h1>
            <p className="mt-1 text-sm text-slate-500">
              Velg kunde, tjenester, dato og tidspunkt for å opprette en ny avtale.
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Steps container */}
        <div className="space-y-4">
          {/* Step 1: Contact */}
          <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Steg 1</p>
                <h3 className="text-base font-medium text-slate-900">Oppgi personopplysninger</h3>
                <p className="text-xs text-slate-500">Velg kunden du vil opprette en avtale for.</p>
              </div>
            </div>

            <ContactPicker contacts={companyContacts} value={selectedContactId} onChange={handleContactChange} />
          </div>

          {/* Step 2: Services */}
          {selectedContactId && (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Steg 2</p>
                  <h3 className="text-base font-medium text-slate-900">Velg tjenester</h3>
                  <p className="text-xs text-slate-500">Du kan velge én eller flere tjenester som inngår i avtalen.</p>
                </div>
              </div>

              <ServicePicker
                groupedServices={companyGroupedServices}
                selectedServiceIds={selectedServiceIds}
                onChange={handleServicesChange}
              />
            </div>
          )}

          {/* Step 3: Date */}
          {selectedContactId && selectedServiceIds.length > 0 && (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Steg 3</p>
                  <h3 className="text-base font-medium text-slate-900">Velg dato</h3>
                  <p className="text-xs text-slate-500">
                    Kun dager hvor bedriften har åpningstid vil være tilgjengelige.
                  </p>
                </div>
              </div>

              <DatePicker
                selectedDate={selectedDate ?? undefined}
                onChange={handleDateChange}
                isDateAllowed={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return false;

                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                  return allowedDays.has(dayName);
                }}
              />
            </div>
          )}

          {/* Step 4: Time slot */}
          {schedule && (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Steg 4</p>
                  <h3 className="text-base font-medium text-slate-900">Velg tidspunkt</h3>
                  <p className="text-xs text-slate-500">
                    Velg et ledig tidspunkt basert på kundens og bedriftens tilgjengelighet.
                  </p>
                </div>
              </div>

              <TimeSlotPicker
                schedule={schedule}
                selectedTimeSlot={selectedStartTime}
                onChange={handleTimeSlotChange}
              />
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-end">
          <Button
            className="rounded-full px-6 shadow-sm hover:shadow-md transition-shadow"
            onClick={handleCreate}
            disabled={!selectedContactId || !selectedServiceIds.length || !selectedDate || !selectedStartTime}
          >
            Fullfør reservering
          </Button>
        </div>
      </div>
    </div>
  );
}
