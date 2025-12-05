import {
  type LoaderFunctionArgs,
  redirect,
  data,
  Form,
  useLoaderData,
  type ActionFunctionArgs,
  useSearchParams,
  useSubmit,
} from 'react-router';
import { useState, useEffect } from 'react';
import type { ScheduleDto } from 'tmp/openapi/gen/booking';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import { formatCompactDate, formatFullDate, formatTime } from '~/lib/date.utils';

export type AppointmentsSelectTimeLoaderData = {
  session: AppointmentSessionDto;
  schedules: ScheduleDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
  }

  try {
    const schedulesResponse =
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSessionSchedules(
        {
          sessionId: session.sessionId,
        },
      );

    return data<AppointmentsSelectTimeLoaderData>({
      session,
      schedules: schedulesResponse.data || [],
    });
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    if ((error as ApiClientError).body) {
      return { error: (error as ApiClientError).body.message };
    }
    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  if (!session) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
  }

  const formData = await request.formData();
  const selectedStartTime = formData.get('selectedStartTime') as string;

  try {
    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.selectAppointmentSessionStartTime(
      {
        sessionId: session.sessionId,
        selectedStartTime,
      },
    );

    return redirect(`${ROUTES_MAP['booking.public.appointment.select-time'].href}?time=${selectedStartTime}`);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    if ((error as ApiClientError).body) {
      return { error: (error as ApiClientError).body.message };
    }
    throw error;
  }
}

function findScheduleWithTime(schedules: ScheduleDto[], startTime: string): string | null {
  for (const schedule of schedules) {
    if (schedule.timeSlots.some((slot) => slot.startTime === startTime)) {
      return schedule.date;
    }
  }
  return null;
}

export default function AppointmentsSelectTime() {
  const { schedules, session } = useLoaderData<AppointmentsSelectTimeLoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const urlSelectedTime = searchParams.get('time');
  const selectedTime = urlSelectedTime || session.selectedStartTime;

  const selectedSchedule = schedules.find((s) => s.date === selectedDate);

  useEffect(() => {
    if (session.selectedStartTime && !urlSelectedTime) {
      setSearchParams({ time: session.selectedStartTime }, { replace: true });
    }

    if (selectedTime && !selectedDate) {
      const scheduleDate = findScheduleWithTime(schedules, selectedTime);
      if (scheduleDate) {
        setSelectedDate(scheduleDate);
      }
    }
  }, [session.selectedStartTime, urlSelectedTime, selectedTime, selectedDate, schedules, setSearchParams]);

  const handleTimeSelect = (startTime: string) => {
    const formData = new FormData();
    formData.set('selectedStartTime', startTime);
    submit(formData, { method: 'post' });
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-4">
        <h1 className="text-base font-semibold text-foreground">Velg tidspunkt</h1>
        <p className="text-[0.7rem] text-muted-foreground mt-1">
          {selectedTime
            ? 'Du har allerede valgt et tidspunkt. Du kan endre valget eller gå videre til oversikt.'
            : 'Velg først en dato, deretter et ledig tidspunkt for avtalen din'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 border border-border bg-background p-3 space-y-3">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Velg dato</span>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {schedules.map((schedule) => {
              const { day, date, month } = formatCompactDate(schedule.date);
              const isSelected = selectedDate === schedule.date;

              return (
                <button
                  key={schedule.date}
                  type="button"
                  onClick={() => setSelectedDate(schedule.date)}
                  className={`w-full border text-left px-2.5 py-2 rounded-none ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">{day}</span>
                      <span className="text-sm font-semibold">
                        {date}. {month}
                      </span>
                    </div>
                    <span className="text-[0.7rem] text-muted-foreground">{schedule.timeSlots.length}</span>
                  </div>
                </button>
              );
            })}

            {schedules.length === 0 && (
              <div className="border border-border bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Ingen ledige datoer</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 border border-border bg-background p-3 sm:p-4 space-y-3">
          {!selectedDate ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <p className="text-sm text-muted-foreground">Velg en dato for å se ledige tidspunkt</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border pb-2">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Ledige tider
                </span>
                <p className="text-sm text-foreground mt-1">{formatFullDate(selectedDate)}</p>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {selectedSchedule?.timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.startTime;

                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => handleTimeSelect(slot.startTime)}
                        className={`border px-2 py-2 text-sm font-medium rounded-none ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground'
                        }`}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedTime && (
        <div className="border border-border bg-background p-3 sm:p-4 space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Valgt tid</span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">{formatFullDate(selectedTime)}</span>
              <span className="text-sm text-foreground">kl. {formatTime(selectedTime)}</span>
            </div>
          </div>

          <Form
            method="get"
            action={ROUTES_MAP['booking.public.appointment.overview'].href}
            className="border-t border-border pt-3"
          >
            <button
              type="submit"
              className="w-full border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none"
            >
              Gå til oversikt
            </button>
          </Form>
        </div>
      )}
    </div>
  );
}
