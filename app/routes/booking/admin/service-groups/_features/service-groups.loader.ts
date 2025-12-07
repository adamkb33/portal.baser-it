import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import { createBookingClient } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import type { ServiceGroupDto } from '~/api/clients/types';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';

export type BookingServiceGroupsLoaderData = {
  serviceGroups: ServiceGroupDto[];
};

export async function serviceGroupsLoader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) {
      return redirect('/');
    }

    const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const response = await bookingClient.ServiceGroupControllerService.ServiceGroupControllerService.getServiceGroups(
      {},
    );
    return data<BookingServiceGroupsLoaderData>({ serviceGroups: response.data?.content || [] });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}