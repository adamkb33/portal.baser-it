// app/routes/api/company/booking/profile/daily-schedule/create-bulk.api-route.ts
import { type ActionFunctionArgs } from 'react-router';
import { DailyScheduleController } from '~/api/generated/booking';
import { redirectWithSuccess, redirectWithError } from '~/routes/company/_lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { withAuth } from '~/api/utils/with-auth';
import type { DayOfWeek } from '~/routes/company/booking/profile/daily-schedule/types/daily-schedule.types';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const days = (formData.get('days') as string).split(',') as DayOfWeek[];

    const startTimeWithSeconds =
      startTime.includes(':') && startTime.split(':').length === 2 ? `${startTime}:00` : startTime;
    const endTimeWithSeconds = endTime.includes(':') && endTime.split(':').length === 2 ? `${endTime}:00` : endTime;

    const bulkSchedules = days.map((day) => ({
      dayOfWeek: day,
      startTime: startTimeWithSeconds,
      endTime: endTimeWithSeconds,
    }));

    await withAuth(request, async () => {
      await DailyScheduleController.createOrUpdateDailySchedules({
        body: bulkSchedules,
      });
    });

    return redirectWithSuccess(
      request,
      ROUTES_MAP['company.booking.profile.daily-schedule'].href,
      'Standard arbeidstider lagret',
    );
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    return redirectWithError(
      request,
      ROUTES_MAP['company.booking.profile.daily-schedule'].href,
      error?.message || 'Kunne ikke lagre standard arbeidstider',
    );
  }
}
