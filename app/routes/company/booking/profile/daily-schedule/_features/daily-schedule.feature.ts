import { data, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import type { DailyScheduleDto } from 'tmp/openapi/gen/booking';
import { createBookingClient, DayOfWeek } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessTokenFromRequest } from '~/lib/auth.utils';

export type BookingDailyScheduleLoaderArgs = {
  dailySchedules: DailyScheduleDto[];
};

export async function dailyScheduleLoader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessTokenFromRequest(request);
    if (!accessToken) {
      return redirect('/');
    }

    const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const response =
      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.getDailySchedules();

    if (!response.data) {
      return data({ dailySchedules: [] });
    }

    return data({ dailySchedules: response.data });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export async function dailyScheduleAction({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessTokenFromRequest(request);
  if (!accessToken) {
    return redirect('/');
  }

  const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  try {
    if (intent === 'create' || intent === 'update') {
      const id = formData.get('id') ? Number(formData.get('id')) : null;
      const dayOfWeek = formData.get('dayOfWeek') as DailyScheduleDto['dayOfWeek'];
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;

      const scheduleWithSeconds = {
        id: id ?? undefined,
        dayOfWeek,
        startTime: startTime.includes(':') && startTime.split(':').length === 2 ? `${startTime}:00` : startTime,
        endTime: endTime.includes(':') && endTime.split(':').length === 2 ? `${endTime}:00` : endTime,
      };

      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.createOrUpdateDailySchedules({
        requestBody: [scheduleWithSeconds],
      });

      return data({ success: true, message: id ? 'Arbeidstid oppdatert' : 'Arbeidstid lagret' });
    }

    if (intent === 'create-default') {
      const defaultSchedules = [
        { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00:00', endTime: '15:00:00' },
        { dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00:00', endTime: '16:00:00' },
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00:00', endTime: '17:00:00' },
        { dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00:00', endTime: '17:00:00' },
        { dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00:00', endTime: '17:00:00' },
      ];

      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.createOrUpdateDailySchedules({
        requestBody: defaultSchedules,
      });

      return data({ success: true, message: 'Standard arbeidstider lagret' });
    }

    if (intent === 'delete') {
      const id = Number(formData.get('id'));
      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.deleteDailySchedule({ id });
      return data({ success: true, message: 'Arbeidstid fjernet' });
    }

    return data({ success: false, message: 'Ugyldig handling' });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return data({ success: false, message: error.body?.message || 'En feil oppstod' }, { status: 400 });
  }
}
