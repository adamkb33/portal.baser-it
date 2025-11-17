import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import type { ServiceDto, ServiceGroupDto, ContactDto, DailyScheduleDto } from '~/api/clients/types';
import { getAccessToken } from '~/lib/auth.utils';
import { baseApi, bookingApi } from '~/lib/utils';

export type GroupedService = Omit<ServiceDto, 'serviceGroupId'>;
export type GroupedServiceGroup = ServiceGroupDto & { services: GroupedService[] };

export type BookingAppointmentsLoaderData = {
  companyContacts: ContactDto[];
  companyGroupedServices: GroupedServiceGroup[];
  dailySchedules: DailyScheduleDto[];
};

export async function companyUserGetAppointmentState({ request }: LoaderFunctionArgs) {
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
