import { data, redirect, type ActionFunctionArgs } from 'react-router';
import { createBookingClient } from '~/api/clients/booking';
import { ENV } from '~/api/config/env';
import { getAccessTokenFromRequest } from '~/lib/auth.utils';

export async function serviceGroupsAction({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessTokenFromRequest(request);
  if (!accessToken) {
    return redirect('/');
  }

  const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  try {
    if (intent === 'create') {
      const name = formData.get('name') as string;
      await bookingClient.ServiceGroupControllerService.ServiceGroupControllerService.createServiceGroup({
        requestBody: {
          name,
        },
      });
      return data({ success: true, message: 'Tjenestegruppe opprettet' });
    }

    if (intent === 'update') {
      const id = Number(formData.get('id'));
      const name = formData.get('name') as string;
      await bookingClient.ServiceGroupControllerService.ServiceGroupControllerService.updateServiceGroup({
        id,
        requestBody: {
          id,
          name,
        },
      });
      return data({ success: true, message: 'Tjenestegruppe oppdatert' });
    }

    if (intent === 'delete') {
      const id = Number(formData.get('id'));
      await bookingClient.ServiceGroupControllerService.ServiceGroupControllerService.deleteServiceGroup({ id: id });
      return data({ success: true, message: 'Tjenestegruppe slettet' });
    }

    return data({ success: false, message: 'Ugyldig handling' });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return data({ success: false, message: error.body?.message || 'En feil oppstod' }, { status: 400 });
  }
}
