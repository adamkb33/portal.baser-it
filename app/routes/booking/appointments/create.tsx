import {
  data,
  redirect,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useEffect } from 'react';
import type { ContactDto } from 'tmp/openapi/gen/base';
import type { ServiceDto, ServiceGroupDto, ScheduleDto } from 'tmp/openapi/gen/booking';
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
import { ContactPicker } from '~/components/pickers/contact-picker';
import { ServicePicker } from '~/components/pickers/service-picker';
import { DatePicker } from '~/components/pickers/date-picker';
import TimeSlotPicker from '~/components/pickers/time-slot-picker';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';
import { baseApi, bookingApi } from '~/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';

// Types
export type GroupedService = Omit<ServiceDto, 'serviceGroupId'>;
export type GroupedServiceGroup = ServiceGroupDto & { services: GroupedService[] };

export type BookingAppointmentsLoaderData = {
  companyContacts: ContactDto[];
  companyGroupedServices: GroupedServiceGroup[];
  dailySchedules: DailyScheduleDto[];
};

export type BookingAppointmentsActionData = {
  schedule?: ScheduleDto;
  error?: string;
};

// Constants
const INTENT = {
  GET_SCHEDULE: 'get-schedule',
  CREATE: 'create',
} as const;

// Utilities
function parseSearchParams(searchParams: URLSearchParams) {
  const contactIdParam = searchParams.get('contactId');
  const serviceIdsParam = searchParams.get('serviceIds');
  const date = searchParams.get('date');
  const startTime = searchParams.get('startTime');

  return {
    contactId: contactIdParam ? Number(contactIdParam) : null,
    serviceIds: serviceIdsParam
      ? serviceIdsParam
          .split(',')
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n))
      : [],
    date: date ?? null,
    startTime: startTime ?? null,
  };
}

function validateAppointmentParams(params: ReturnType<typeof parseSearchParams>) {
  if (!params.contactId) return 'Contact is required';
  if (params.serviceIds.length === 0) return 'At least one service is required';
  if (!params.date) return 'Date is required';
  if (!params.startTime) return 'Time slot is required';
  return null;
}

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return redirect('/');

  try {
    const [companyContactsResponse, serviceGroupsResponse, servicesResponse, dailySchedulesResponse] =
      await Promise.all([
        await baseApi(accessToken).CompanyUserContactControllerService.CompanyUserContactControllerService.getContacts(
          {},
        ),
        await bookingApi(accessToken).ServiceGroupControllerService.ServiceGroupControllerService.getServiceGroups({}),
        await bookingApi(accessToken).ServiceControllerService.ServiceControllerService.getServices({}),
        await bookingApi(accessToken).DailyScheduleControllerService.DailyScheduleControllerService.getDailySchedules(),
      ]);

    const companyContacts = companyContactsResponse.data?.content ?? [];
    const serviceGroups = serviceGroupsResponse.data?.content ?? [];
    const services = servicesResponse.data?.content ?? [];
    const dailySchedules = dailySchedulesResponse.data ?? [];

    const companyGroupedServices: GroupedServiceGroup[] = serviceGroups.map((group) => ({
      ...group,
      services: services.filter((s) => s.serviceGroupId === group.id).map(({ serviceGroupId, ...rest }) => rest),
    }));

    return data<BookingAppointmentsLoaderData>({
      companyContacts,
      companyGroupedServices,
      dailySchedules,
    });
  } catch (err: unknown) {
    console.error('Loader error:', err);
    const apiErr = err as ApiClientError;
    throw new Response(apiErr?.body?.message ?? 'Failed to load appointment data', { status: 500 });
  }
}

// Action
export async function action({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return redirect('/');

  const authUser = await getAuthPayloadFromRequest(request);
  if (!authUser || !authUser.company) {
    return redirect('/');
  }

  try {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    if (intent === INTENT.GET_SCHEDULE) {
      const url = new URL(request.url);
      const params = parseSearchParams(url.searchParams);

      if (!params.date) {
        return data({ error: 'Missing date' }, { status: 400 });
      }

      if (params.serviceIds.length === 0) {
        return data({ error: 'Missing service IDs' }, { status: 400 });
      }

      const bookingClient = createBookingClient({
        baseUrl: ENV.BOOKING_BASE_URL,
        token: accessToken,
      });

      const requestBody: GetCompanyUserScheduleDto = {
        userId: authUser.id,
        companyId: authUser.company.companyId,
        date: params.date,
        serviceIds: params.serviceIds,
      };

      const companyUserScheduleResponse =
        await bookingClient.CompanyUserScheduleControllerService.CompanyUserScheduleControllerService.getSchedule({
          requestBody,
        });

      return data<BookingAppointmentsActionData>({ schedule: companyUserScheduleResponse.data });
    }

    if (intent === INTENT.CREATE) {
      const url = new URL(request.url);
      const params = parseSearchParams(url.searchParams);

      const validationError = validateAppointmentParams(params);
      if (validationError) {
        return data({ error: validationError }, { status: 400 });
      }

      const requestBody: CreateAppointmentCompanyUserDto = {
        contactId: params.contactId!,
        date: params.date!,
        startTime: params.startTime!,
        serviceIds: params.serviceIds,
      };

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
  } catch (error: unknown) {
    console.error('Action error:', error);
    const apiErr = error as ApiClientError;
    return data({ error: apiErr?.body?.message ?? 'An unexpected error occurred' }, { status: 400 });
  }
}

// Component
export default function BookingAppointmentsCreate() {
  const { companyContacts, companyGroupedServices, dailySchedules } = useLoaderData<BookingAppointmentsLoaderData>();

  const [searchParams, setSearchParams] = useSearchParams();
  const scheduleFetcher = useFetcher<BookingAppointmentsActionData>();
  const navigation = useNavigation();

  // Parse URL params as single source of truth
  const { contactId, serviceIds, date, startTime } = parseSearchParams(searchParams);

  // Derived state
  const schedule = scheduleFetcher.data?.schedule;
  const scheduleError = scheduleFetcher.data?.error;
  const isLoadingSchedule = scheduleFetcher.state !== 'idle';
  const isSubmitting = navigation.state === 'submitting';
  const canSubmit = validateAppointmentParams({ contactId, serviceIds, date, startTime }) === null;
  const allowedDays = new Set(dailySchedules.map((s) => s.dayOfWeek.toString()));

  // Determine active accordion step
  const activeStep = !contactId
    ? 'step-1'
    : serviceIds.length === 0
      ? 'step-2'
      : !date
        ? 'step-3'
        : !startTime
          ? 'step-4'
          : '';

  // Get selected service names
  const selectedServiceNames = serviceIds
    .map((id) => {
      for (const group of companyGroupedServices) {
        const service = group.services.find((s) => s.id === id);
        if (service) return service.name;
      }
      return null;
    })
    .filter(Boolean);

  // Auto-fetch schedule when dependencies change
  useEffect(() => {
    if (contactId && serviceIds.length > 0 && date) {
      const params = new URLSearchParams({
        contactId: String(contactId),
        serviceIds: serviceIds.join(','),
        date,
      });

      const formData = new FormData();
      formData.append('intent', INTENT.GET_SCHEDULE);

      scheduleFetcher.submit(formData, {
        method: 'post',
        action: `/booking/appointments/create?${params}`,
      });
    }
  }, [contactId, serviceIds.join(','), date]);

  // Event handlers
  const handleContactChange = (id: number | null) => {
    const next = new URLSearchParams();
    if (id) next.set('contactId', String(id));
    setSearchParams(next, { replace: true });
  };

  const handleServicesChange = (ids: number[]) => {
    const next = new URLSearchParams(searchParams);
    if (ids.length > 0) {
      next.set('serviceIds', ids.join(','));
    } else {
      next.delete('serviceIds');
      next.delete('date');
      next.delete('startTime');
    }
    setSearchParams(next, { replace: true });
  };

  const handleDateChange = (isoDate: string) => {
    const next = new URLSearchParams(searchParams);
    if (isoDate) {
      next.set('date', isoDate);
    } else {
      next.delete('date');
    }
    next.delete('startTime');
    setSearchParams(next, { replace: true });
  };

  const handleTimeSlotChange = (slot: string) => {
    const next = new URLSearchParams(searchParams);
    if (slot) {
      next.set('startTime', slot);
    } else {
      next.delete('startTime');
    }
    setSearchParams(next, { replace: true });
  };

  const handleCreate = () => {
    const formData = new FormData();
    formData.append('intent', INTENT.CREATE);

    scheduleFetcher.submit(formData, {
      method: 'post',
      action: `/booking/appointments/create?${searchParams}`,
    });
  };

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
        {scheduleError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {scheduleError}
          </div>
        )}

        {/* Steps container with Accordion */}
        <Accordion type="single" value={activeStep} className="space-y-4">
          {/* Step 1: Contact */}
          <AccordionItem value="step-1" className="rounded-md border border-slate-200 bg-white shadow-sm">
            <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      contactId ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {contactId ? '✓' : '1'}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-slate-900">Oppgi personopplysninger</h3>
                    <p className="text-xs text-slate-500">
                      {contactId
                        ? (() => {
                            const contact = companyContacts.find((c) => c.id === contactId);
                            if (!contact) return 'Valgt';
                            const parts = [];
                            if (contact.givenName || contact.familyName) {
                              parts.push(`${contact.givenName || ''} ${contact.familyName || ''}`.trim());
                            }
                            if (contact.email?.email) parts.push(contact.email.email);
                            if (contact.mobileNumberDto?.mobileNumber) parts.push(contact.mobileNumberDto.mobileNumber);
                            return parts.join(' • ');
                          })()
                        : 'Velg kunden du vil opprette en avtale for'}
                    </p>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 sm:px-6">
              <ContactPicker contacts={companyContacts} value={contactId} onChange={handleContactChange} />
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Services */}
          {contactId && (
            <AccordionItem value="step-2" className="rounded-md border border-slate-200 bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        serviceIds.length > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {serviceIds.length > 0 ? '✓' : '2'}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-slate-900">Velg tjenester</h3>
                      <p className="text-xs text-slate-500">
                        {serviceIds.length > 0
                          ? selectedServiceNames.join(', ')
                          : 'Du kan velge én eller flere tjenester som inngår i avtalen'}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 sm:px-6">
                <ServicePicker
                  groupedServices={companyGroupedServices}
                  selectedServiceIds={serviceIds}
                  onChange={handleServicesChange}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Step 3: Date */}
          {contactId && serviceIds.length > 0 && (
            <AccordionItem value="step-3" className="rounded-md border border-slate-200 bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        date ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {date ? '✓' : '3'}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-slate-900">Velg dato</h3>
                      <p className="text-xs text-slate-500">
                        {date
                          ? new Date(date).toLocaleDateString('nb-NO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Kun dager hvor bedriften har åpningstid vil være tilgjengelige'}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 sm:px-6">
                <DatePicker
                  selectedDate={date ?? undefined}
                  onChange={handleDateChange}
                  isDateAllowed={(dateObj) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (dateObj < today) return false;

                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                    return allowedDays.has(dayName);
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Step 4: Time slot */}
          {contactId && serviceIds.length > 0 && date && (
            <AccordionItem value="step-4" className="rounded-md border border-slate-200 bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        startTime ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {startTime ? '✓' : '4'}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-slate-900">Velg tidspunkt</h3>
                      <p className="text-xs text-slate-500">
                        {startTime
                          ? `Valgt tid: ${startTime}`
                          : 'Velg et ledig tidspunkt basert på kundens og bedriftens tilgjengelighet'}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 sm:px-6">
                {isLoadingSchedule ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Laster ledige tider...
                  </div>
                ) : schedule ? (
                  <TimeSlotPicker schedule={schedule} selectedTimeSlot={startTime} onChange={handleTimeSlotChange} />
                ) : (
                  <div className="py-4 text-sm text-slate-500">Ingen ledige tider funnet</div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Action bar */}
        <div className="flex items-center justify-end">
          <Button
            className="rounded-full px-6 shadow-sm transition-shadow hover:shadow-md"
            onClick={handleCreate}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oppretter...
              </>
            ) : (
              'Fullfør reservering'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
