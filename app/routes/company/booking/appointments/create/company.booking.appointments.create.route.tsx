import { CompanyUserContactController } from '~/api/generated/identity';
import { withAuth } from '~/api/utils/with-auth';
import type { Route } from './+types/company.booking.appointments.create.route';
import {
  CompanyUserAppointmentController,
  CompanyUserBookingProfileController,
  CompanyUserScheduleController,
} from '~/api/generated/booking/sdk.gen';
import { AppointmentBookingWizard } from './_components/appointment-create.wizard';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const contactPage = parseInt(url.searchParams.get('contact-page') || '0', 10);
    const contactSize = parseInt(url.searchParams.get('contact-size') || '5', 10);
    const contactSearch = url.searchParams.get('contact-search') || '';
    const serviceSearch = url.searchParams.get('service-search') || '';

    const sessionParam = url.searchParams.get('appointment-session') || '';
    const serviceIdsMatch = sessionParam.match(/service_ids:(\d+(?:,\d+)*)/);
    const selectedServiceIds = serviceIdsMatch ? serviceIdsMatch[1].split(',').map(Number) : [];

    const apiResponses = await withAuth(request, async () => {
      const contactsResponse = await CompanyUserContactController.getContacts({
        query: {
          page: contactPage,
          size: contactSize,
          sort: 'familyName,asc',
          ...(contactSearch && { search: contactSearch }),
        },
      });

      const bookingProfileResponse = await CompanyUserBookingProfileController.getBookingProfile();

      let scheduleResponse = null;
      if (selectedServiceIds.length > 0) {
        scheduleResponse = await CompanyUserScheduleController.getSchedule({
          body: {
            selectedServiceIds,
          },
        });
      }

      return {
        contactsResponse,
        bookingProfileResponse,
        scheduleResponse,
      };
    });

    const contactsResponse = apiResponses.contactsResponse.data?.data;
    const bookingProfileResponse = apiResponses.bookingProfileResponse.data;
    const scheduleResponse = apiResponses.scheduleResponse?.data?.data;

    return {
      contacts: contactsResponse?.content || [],
      contactPagination: {
        page: contactsResponse?.page ?? 0,
        size: contactsResponse?.size ?? contactSize,
        totalElements: contactsResponse?.totalElements ?? 0,
        totalPages: contactsResponse?.totalPages ?? 1,
      },
      bookingProfile: bookingProfileResponse,
      schedules: scheduleResponse || [],
      contactSearch,
      serviceSearch,
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente data');
    return {
      contacts: [],
      contactPagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      },
      bookingProfile: null,
      schedules: [],
      contactSearch: '',
      serviceSearch: '',
      error: message,
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData();
    const contactId = Number(formData.get('contactId'));
    const serviceIds = formData.get('serviceIds')?.toString().split(',').map(Number) || [];
    const startTime = formData.get('startTime')?.toString() || '';

    const response = await withAuth(request, async () => {
      return await CompanyUserAppointmentController.companyUserCreateAppointment({
        body: {
          contactId,
          serviceIds,
          startTime,
        },
      });
    });

    return { success: true, data: response.data };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke opprette avtale');
    return { error: message };
  }
}

export default function CompanyBookingAppointmentsCreatePage(componentProps: Route.ComponentProps) {
  return <AppointmentBookingWizard componentProps={componentProps} />;
}
