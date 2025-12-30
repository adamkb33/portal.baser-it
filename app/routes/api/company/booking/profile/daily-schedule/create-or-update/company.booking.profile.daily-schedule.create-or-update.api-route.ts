// app/routes/api/company/booking/profile/daily-schedule/create-or-update.api-route.ts
import { type ActionFunctionArgs } from 'react-router';
import { DailyScheduleController } from '~/api/generated/booking';
import { redirectWithSuccess, redirectWithError } from '~/routes/company/_lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { withAuth } from '~/api/utils/with-auth';
import type { DayOfWeek } from '~/routes/company/booking/profile/daily-schedule/types/daily-schedule.types';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') ? Number(formData.get('id')) : null;
    const dayOfWeek = formData.get('dayOfWeek') as DayOfWeek;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    const scheduleWithSeconds = {
      id: id ?? undefined,
      dayOfWeek,
      startTime: startTime.includes(':') && startTime.split(':').length === 2 ? `${startTime}:00` : startTime,
      endTime: endTime.includes(':') && endTime.split(':').length === 2 ? `${endTime}:00` : endTime,
    };

    await withAuth(request, async () => {
      await DailyScheduleController.createOrUpdateDailySchedules({
        body: [scheduleWithSeconds],
      });
    });

    return redirectWithSuccess(
      request,
      ROUTES_MAP['company.booking.profile.daily-schedule'].href,
      id ? 'Arbeidstid oppdatert' : 'Arbeidstid lagret',
    );
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    return redirectWithError(
      request,
      ROUTES_MAP['company.booking.profile.daily-schedule'].href,
      error?.message || 'Kunne ikke lagre arbeidstid',
    );
  }
}
