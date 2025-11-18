import { data, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import type { PublicCompanyUserDto, ContactDto } from 'tmp/openapi/gen/base';
import type { GroupedServiceGroupsDto, ScheduleDto } from 'tmp/openapi/gen/booking';
import type { DailyScheduleDto } from '~/api/clients/base';
import type { ApiClientError } from '~/api/clients/http';
import { baseApi, bookingApi } from '~/lib/utils';

type CompanyUserWithEmail = {
  userId: number;
  email: string;
  dailySchedules: DailyScheduleDto[];
  services: GroupedServiceGroupsDto[];
};

export type AppointmentsLoaderData = {
  companyUsers: CompanyUserWithEmail[];
};

export type AppointmentsActionData = {
  contact?: ContactDto;
  schedule?: ScheduleDto;
  error?: string;
};

export const APPOINTMENTS_INTENT = {
  GET_OR_CREATE_CONTACT: 'get-or-create-contact',
  GET_SCHEDULE: 'get-schedule',
  CREATE_APPOINTMENT: 'create-appointment',
} as const;

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

export async function createAppointmentloader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const companyId = Number(url.searchParams.get('companyId'));

  if (!url.searchParams.get('companyId') || isNaN(companyId)) {
    return redirect('/');
  }

  try {
    const companyBookingInfoDto =
      await bookingApi().PublicCompanyControllerService.PublicCompanyControllerService.getCompanyBookingInfo({
        companyId,
      });

    if (!companyBookingInfoDto.data) {
      return data<AppointmentsLoaderData>({
        companyUsers: [],
      });
    }

    const companyUserIds = companyBookingInfoDto.data.companyUser.map((r) => r.userId);
    const companyUsersResponse =
      await baseApi().PublicCompanyControllerService.PublicCompanyControllerService.getCompanyUsersByIds({
        requestBody: {
          companyId: companyId,
          userIds: companyUserIds,
        },
      });

    const usersMap = new Map<number, PublicCompanyUserDto>();
    (companyUsersResponse.data || []).forEach((user) => {
      usersMap.set(user.userId, user);
    });

    const companyUsers: CompanyUserWithEmail[] = companyBookingInfoDto.data.companyUser.map((cu) => ({
      userId: cu.userId,
      email: usersMap.get(cu.userId)?.email || '',
      dailySchedules: cu.dailySchedules,
      services: cu.services,
    }));

    return data<AppointmentsLoaderData>({
      companyUsers,
    });
  } catch (error: unknown) {
    console.error(JSON.stringify(error, null, 2));
    const apiErr = error as ApiClientError;
    return data({ error: apiErr?.body?.message ?? 'An unexpected error occurred' }, { status: 400 });
  }
}

export async function createAppointmentAction({ request }: ActionFunctionArgs) {
  try {
    const url = new URL(request.url);
    const companyId = Number(url.searchParams.get('companyId'));
    const userId = Number(url.searchParams.get('userId'));
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    if (!companyId || isNaN(companyId)) {
      return data({ error: 'Invalid company ID' }, { status: 400 });
    }

    if (!userId || isNaN(userId)) {
      return data({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (intent === APPOINTMENTS_INTENT.GET_OR_CREATE_CONTACT) {
      const requestBody = {
        companyId,
        givenName: formData.get('givenName') as string,
        familyName: formData.get('familyName') as string,
        email: formData.get('email') ? { id: 0, value: formData.get('email') as string } : undefined,
        mobileNumberDto: formData.get('mobileNumber')
          ? { id: 0, value: formData.get('mobileNumber') as string }
          : undefined,
      };

      const contactResponse =
        await baseApi().PublicCompanyControllerService.PublicCompanyControllerService.getOrCreateContact({
          requestBody,
        });

      if (contactResponse.data) {
        const next = new URLSearchParams(url.searchParams);
        next.set('contactId', String(contactResponse.data.id));
        return redirect(`/appointments?${next.toString()}`);
      }

      return data({ error: 'Failed to create contact' }, { status: 400 });
    }

    if (intent === APPOINTMENTS_INTENT.GET_SCHEDULE) {
      const params = parseSearchParams(url.searchParams);

      if (!params.date) {
        return data({ error: 'Missing date' }, { status: 400 });
      }

      if (params.serviceIds.length === 0) {
        return data({ error: 'Missing service IDs' }, { status: 400 });
      }

      const scheduleResponse =
        await bookingApi().PublicCompanyControllerService.PublicCompanyControllerService.getPublicCompanyUserSchedule({
          requestBody: {
            userId,
            date: params.date,
            serviceIds: params.serviceIds,
            companyId: companyId,
          },
        });

      return data<AppointmentsActionData>({ schedule: scheduleResponse.data });
    }

    if (intent === APPOINTMENTS_INTENT.CREATE_APPOINTMENT) {
      const params = parseSearchParams(url.searchParams);

      if (!params.contactId) return data({ error: 'Contact is required' }, { status: 400 });
      if (params.serviceIds.length === 0) return data({ error: 'At least one service is required' }, { status: 400 });
      if (!params.date) return data({ error: 'Date is required' }, { status: 400 });
      if (!params.startTime) return data({ error: 'Time slot is required' }, { status: 400 });

      const requestBody = {
        userId,
        companyId,
        contactId: params.contactId,
        date: params.date,
        startTime: params.startTime,
        serviceIds: params.serviceIds,
      };

      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.createAppointment({
        requestBody,
      });

      return redirect(`/appointments/success?companyId=${companyId}`);
    }

    return data({ error: 'Invalid intent' }, { status: 400 });
  } catch (error: unknown) {
    console.error(JSON.stringify(error, null, 2));
    const apiErr = error as ApiClientError;
    return data({ error: apiErr?.body?.message ?? 'An unexpected error occurred' }, { status: 400 });
  }
}
