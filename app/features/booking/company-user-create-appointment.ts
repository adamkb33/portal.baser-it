import { redirect, data, type ActionFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import type { CreateAppointmentCompanyUserDto, GetCompanyUserScheduleDto, ScheduleDto } from '~/api/clients/types';
import { getAccessToken, getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { bookingApi } from '~/lib/utils';

export const COMPANY_USER_CREATE_APPOINTMENT_INTENT = {
  GET_SCHEDULE: 'get-schedule',
  CREATE: 'create',
} as const;

export type BookingAppointmentsActionData = {
  schedule?: ScheduleDto;
  error?: string;
};

export function parseSearchParams(searchParams: URLSearchParams) {
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

export function validateAppointmentParams(params: ReturnType<typeof parseSearchParams>) {
  if (!params.contactId) return 'Contact is required';
  if (params.serviceIds.length === 0) return 'At least one service is required';
  if (!params.date) return 'Date is required';
  if (!params.startTime) return 'Time slot is required';
  return null;
}

export async function companyUserCreateAppointment({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return redirect('/');

  const authUser = await getAuthPayloadFromRequest(request);
  if (!authUser || !authUser.company) {
    return redirect('/');
  }

  try {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    if (intent === COMPANY_USER_CREATE_APPOINTMENT_INTENT.GET_SCHEDULE) {
      const url = new URL(request.url);
      const params = parseSearchParams(url.searchParams);

      if (!params.date) {
        return data({ error: 'Missing date' }, { status: 400 });
      }

      if (params.serviceIds.length === 0) {
        return data({ error: 'Missing service IDs' }, { status: 400 });
      }

      const requestBody: GetCompanyUserScheduleDto = {
        userId: authUser.id,
        companyId: authUser.company.companyId,
        date: params.date,
        serviceIds: params.serviceIds,
      };

      const companyUserScheduleResponse = await bookingApi(
        accessToken,
      ).CompanyUserScheduleControllerService.CompanyUserScheduleControllerService.getSchedule({
        requestBody,
      });

      return data<BookingAppointmentsActionData>({ schedule: companyUserScheduleResponse.data });
    }

    if (intent === COMPANY_USER_CREATE_APPOINTMENT_INTENT.CREATE) {
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

      await bookingApi(
        accessToken,
      ).CompanyUserAppointmentControllerService.CompanyUserAppointmentControllerService.createAppointment1({
        requestBody,
      });

      return redirect('/booking/appointments');
    }

    return data({ error: 'Invalid intent' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Action error:', error);
    const apiErr = error as ApiClientError;
    return data({ error: apiErr?.body?.message ?? 'An unexpected error occurred' }, { status: 400 });
  }
}
