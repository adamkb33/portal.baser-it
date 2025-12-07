import { data, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getAccessToken } from '~/lib/auth.utils';
import { baseApi, bookingApi } from '~/lib/utils';
import type { BookingProfileDto } from 'tmp/openapi/gen/booking';
import type { UserDto } from '~/api/clients/types';

export type BookingProfileLoaderData = {
  user?: UserDto;
  bookingProfile?: BookingProfileDto;
  services?: Array<{ id: number; name: string }>;
  error?: string;
};

export async function profileLoader({ request }: LoaderFunctionArgs) {
  try {
    const accesToken = await getAccessToken(request);
    if (!accesToken) {
      return redirect('/');
    }

    const userResponse = await baseApi(accesToken).UserControllerService.UserControllerService.getAuthenticatedUser();

    const bookingProfileResponse =
      await bookingApi(accesToken).BookingProfileControllerService.BookingProfileControllerService.getBookingProfile();

    const servicesResponse = await bookingApi(accesToken).ServiceControllerService.ServiceControllerService.getServices(
      {},
    );

    return data<BookingProfileLoaderData>({
      user: userResponse.data as UserDto,
      bookingProfile: bookingProfileResponse,
      services: servicesResponse.data?.content.map((s: any) => ({ id: s.id, name: s.name })) ?? [],
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    const apiError = error as ApiClientError;

    if (apiError?.body?.message) {
      return data<BookingProfileLoaderData>({
        error: apiError.body.message,
      });
    }

    throw error;
  }
}

const actions = {
  GET_OR_CREATE_BOOKING_PROFILE: 'GET_OR_CREATE_BOOKING_PROFILE',
};

export async function profileAction({ request }: ActionFunctionArgs) {
  try {
    const accesToken = await getAccessToken(request);
    if (!accesToken) {
      return redirect('/');
    }

    const formData = await request.formData();
    const actionType = formData.get('actionType');
    console.log(actionType);

    if (actionType === actions.GET_OR_CREATE_BOOKING_PROFILE) {
      const description = formData.get('description') as string;
      const services = formData.getAll('services[]').map(Number);

      const imageFileName = formData.get('image[fileName]') as string | null;
      const imageContentType = formData.get('image[contentType]') as string | null;
      const imageData = formData.get('image[data]') as string | null;

      const payload: any = {
        description: description || undefined,
        services,
      };

      if (imageFileName && imageContentType && imageData) {
        payload.image = {
          fileName: imageFileName,
          label: imageFileName,
          contentType: imageContentType,
          data: imageData,
        };
      }

      await bookingApi(
        accesToken,
      ).BookingProfileControllerService.BookingProfileControllerService.createOrUpdateProfile({
        requestBody: payload,
      });

      return data({ success: true, message: 'Bookingprofil lagret' });
    }
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export { actions };