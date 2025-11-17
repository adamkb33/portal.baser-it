import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import type { CompanyUserDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { baseApi, bookingApi } from '~/lib/utils';

export type AppointmentsLoaderData = {
  compnayUsers: CompanyUserDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const companyId = Number(url.searchParams.get('companyId'));

  if (!url.searchParams.get('companyId') || isNaN(companyId)) {
    return redirect('/');
  }

  try {
    // Gjør et sjekk i førsten om selskapet har tjeneste grupper og en tjeneste, har en ansatt med en daily schedule
    // kall is is Booking ready

    const companyUserDailySchedulesResponse =
      await bookingApi().PublicCompanyControllerService.PublicCompanyControllerService.getCompanyBookingInfo({
        companyId,
      });

    if (!companyUserDailySchedulesResponse.data) {
      return data<AppointmentsLoaderData>({
        compnayUsers: [],
      });
    }

    const companyUserIds = companyUserDailySchedulesResponse.data.companyUser.map((r) => r.userId);
    const companyUsersResponse =
      await baseApi().PublicCompanyControllerService.PublicCompanyControllerService.getCompanyUsersByIds({
        requestBody: {
          companyId: companyId,
          userIds: companyUserIds,
        },
      });

    console.log(companyUsersResponse);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function Appointments() {
  return (
    <div className="flex">
      <div className="flex-2 border">Appointment steps</div>
      <div className="flex-1 border">Company hero marketing</div>
    </div>
  );
}
