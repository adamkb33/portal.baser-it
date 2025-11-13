import { data, redirect, useLoaderData, useSearchParams, type LoaderFunctionArgs } from 'react-router';
import type { ContactDto } from 'tmp/openapi/gen/base';
import type { AppointmentDto, ServiceDto, ServiceGroupDto, DailyScheduleDto } from 'tmp/openapi/gen/booking';
import { createBaseClient, type GetContactsByIdsDto } from '~/api/clients/base';
import { createBookingClient } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';

type ContactSlim = Pick<ContactDto, 'id' | 'companyId'>;

export type CombinedAppointment = AppointmentDto & {
  contact: ContactSlim | null;
};

export type GroupedService = Omit<ServiceDto, 'serviceGroupId'>;
export type GroupedServiceGroup = ServiceGroupDto & { services: GroupedService[] };

export type BookingAppointmentsLoaderData = {
  appointments: CombinedAppointment[];
  companyContacts: ContactDto[];
  companyGroupedServices: GroupedServiceGroup[];
  dailySchedules: DailyScheduleDto[];
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) return redirect('/');

    const bookingClient1 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const appointmentsResponse =
      await bookingClient1.CompanyUserAppointmentControllerService.CompanyUserAppointmentControllerService.getAppointments();
    const appointments = appointmentsResponse.data ?? [];

    let combined: CombinedAppointment[] = [];
    if (appointments.length > 0) {
      const contactIds: GetContactsByIdsDto = {
        contactIds: Array.from(new Set(appointments.map((a) => a.contactId))),
      };
      const identityClient1 = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });
      const appointmentContactsResponse =
        await identityClient1.CompanyUserContactControllerService.CompanyUserContactControllerService.getContactsByIds({
          requestBody: contactIds,
        });
      const appointmentContacts = appointmentContactsResponse.data ?? [];
      const byId = new Map<number, ContactSlim>(
        appointmentContacts.map((c) => [c.id, { id: c.id, companyId: c.companyId }]),
      );
      combined = appointments.map((appt) => ({ ...appt, contact: byId.get(appt.contactId) ?? null }));
    }

    const identityClient2 = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });
    const companyContactsResponse =
      await identityClient2.CompanyUserContactControllerService.CompanyUserContactControllerService.getContacts();
    const companyContacts = companyContactsResponse.data ?? [];

    const bookingClient2 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const serviceGroupsResponse =
      await bookingClient2.ServiceGroupControllerService.ServiceGroupControllerService.getServiceGroups();
    const serviceGroups = serviceGroupsResponse.data ?? [];

    const bookingClient3 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const servicesResponse = await bookingClient3.ServiceControllerService.ServiceControllerService.getServices();
    const services = servicesResponse.data ?? [];

    const companyGroupedServices: GroupedServiceGroup[] = serviceGroups.map((group) => ({
      ...group,
      services: services.filter((s) => s.serviceGroupId === group.id).map(({ serviceGroupId, ...rest }) => rest),
    }));

    const bookingClient4 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const dailySchedulesResponse =
      await bookingClient4.DailyScheduleControllerService.DailyScheduleControllerService.getDailySchedules();
    const dailySchedules = dailySchedulesResponse.data ?? [];

    return data<BookingAppointmentsLoaderData>({
      appointments: combined,
      companyContacts,
      companyGroupedServices,
      dailySchedules,
    });
  } catch (err: unknown) {
    console.error(err);
    const apiErr = err as ApiClientError;
    return data<BookingAppointmentsLoaderData>({
      appointments: [],
      companyContacts: [],
      companyGroupedServices: [],
      dailySchedules: [],
      error: apiErr?.body?.message ?? 'Unexpected error',
    });
  }
}

import { type ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  try {
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

// routes/booking.appointments.tsx (component part)
import { useEffect, useState } from 'react';
import { ContactPicker } from '~/components/pickers/contact-picker';
import { ServicePicker } from '~/components/pickers/service-picker';
import { DatePicker } from '~/components/pickers/date-picker';

export default function BookingAppointments() {
  const { companyContacts, companyGroupedServices, dailySchedules } = useLoaderData<BookingAppointmentsLoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();

  // contact
  const contactIdParam = searchParams.get('contactId');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    contactIdParam ? Number(contactIdParam) : null,
  );

  // services
  const serviceIdsParam = searchParams.get('serviceIds');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(
    serviceIdsParam ? serviceIdsParam.split(',').map(Number) : [],
  );

  // date
  const dateParam = searchParams.get('date'); // ISO YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string | null>(dateParam ?? null);

  const handleContactChange = (id: number | null) => {
    setSelectedContactId(id);

    const next = new URLSearchParams(searchParams);
    if (id) {
      next.set('contactId', String(id));
    } else {
      next.delete('contactId');
      next.delete('serviceIds');
      next.delete('serviceGroupIds');
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
      const groupIds = companyGroupedServices
        .filter((g) => g.services.some((s) => ids.includes(s.id)))
        .map((g) => g.id);
      next.set('serviceGroupIds', groupIds.join(','));
    } else {
      next.delete('serviceIds');
      next.delete('serviceGroupIds');
      next.delete('date'); // optional: also clear date if no services
      setSelectedDate(null);
    }
    setSearchParams(next, { replace: true });
  };

  const handleDateChange = (isoDate: string) => {
    setSelectedDate(isoDate);
    const next = new URLSearchParams(searchParams);
    if (isoDate) next.set('date', isoDate);
    else next.delete('date');
    setSearchParams(next, { replace: true });
  };

  // keep state synced with URL (back/forward nav, manual edits)
  useEffect(() => {
    const cid = searchParams.get('contactId');
    const newContactId = cid ? Number(cid) : null;
    if (newContactId !== selectedContactId) setSelectedContactId(newContactId);

    const sids = searchParams.get('serviceIds');
    const newServiceIds = sids ? sids.split(',').map(Number) : [];
    if (newServiceIds.join(',') !== selectedServiceIds.join(',')) {
      setSelectedServiceIds(newServiceIds);
    }

    const dp = searchParams.get('date') ?? null;
    if (dp !== selectedDate) setSelectedDate(dp);
  }, [searchParams]);

  const allowedDays = new Set(dailySchedules.map((s) => s.dayOfWeek.toString()));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium">Oppi person opplysninger</h3>
        <ContactPicker contacts={companyContacts} value={selectedContactId} onChange={handleContactChange} />
      </div>

      {selectedContactId && (
        <div>
          <h3 className="text-base font-medium">Velg tjenester</h3>
          <ServicePicker
            groupedServices={companyGroupedServices}
            selectedServiceIds={selectedServiceIds} // ← from props as requested
            onChange={handleServicesChange}
          />
        </div>
      )}

      {selectedContactId && selectedServiceIds.length > 0 && (
        <div>
          <h3 className="text-base font-medium">Velg dato</h3>
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
    </div>
  );
}
