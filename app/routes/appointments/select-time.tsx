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

export type AppointmentsSelectTimeLoaderData = {
  session: AppointmentSessionDto;
  schedules: ScheduleDto[];
  selectedStartTime?: string;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect('/appointments');
    }

    const schedulesResponse =
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSessionSchedules(
        {
          sessionId: session.sessionId,
        },
      );

    return data<AppointmentsSelectTimeLoaderData>({
      session,
      schedules: schedulesResponse.data || [],
      selectedStartTime: session.selectedStartTime,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect('/appointments');
    }

    const formData = await request.formData();
    const selectedStartTime = formData.get('selectedStartTime') as string;

    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.selectAppointmentSessionStartTime(
      {
        sessionId: session.sessionId,
        selectedStartTime,
      },
    );

    return redirect(`/appointments/select-time?time=${selectedStartTime}`);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

const DAYS_NO_SHORT = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const MONTHS_NO_SHORT = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

function formatCompactDate(dateString: string): { day: string; date: string; month: string } {
  const date = new Date(dateString);
  const dayName = DAYS_NO_SHORT[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_NO_SHORT[date.getMonth()];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate.getTime() === today.getTime()) {
    return { day: 'I dag', date: String(day), month };
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (compareDate.getTime() === tomorrow.getTime()) {
    return { day: 'I morgen', date: String(day), month };
  }

  return { day: dayName, date: String(day), month };
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const { day, date: dateNum, month } = formatCompactDate(dateString);
  return `${day} ${dateNum}. ${month}`;
}

function formatTimeOnly(dateTimeString: string): string {
  // Format: 2025-12-08T09:00:00 -> 09:00
  const timePart = dateTimeString.split('T')[1];
  return timePart ? timePart.substring(0, 5) : '';
}

export default function AppointmentsSelectTime() {
  const { schedules, session } = useLoaderData<AppointmentsSelectTimeLoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const urlSelectedTime = searchParams.get('time');

  // Set URL param only if session has selected time
  useEffect(() => {
    if (session.selectedStartTime && !urlSelectedTime) {
      setSearchParams({ time: session.selectedStartTime }, { replace: true });
    }
  }, [session.selectedStartTime, urlSelectedTime, setSearchParams]);

  // Pre-select date based on session time
  useEffect(() => {
    if (session.selectedStartTime && !selectedDate) {
      for (const schedule of schedules) {
        const matchingSlot = schedule.timeSlots.find((slot) => slot.startTime === session.selectedStartTime);
        if (matchingSlot) {
          setSelectedDate(schedule.date);
          break;
        }
      }
    }
  }, [session.selectedStartTime, schedules, selectedDate]);

  const selectedSchedule = schedules.find((s) => s.date === selectedDate);

  // Find confirmed date from selected time
  let confirmedDate = selectedDate;
  if (session.selectedStartTime && !confirmedDate) {
    for (const schedule of schedules) {
      const matchingSlot = schedule.timeSlots.find((slot) => slot.startTime === session.selectedStartTime);
      if (matchingSlot) {
        confirmedDate = schedule.date;
        break;
      }
    }
  }

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
          {urlSelectedTime
            ? 'Du har allerede valgt et tidspunkt. Du kan endre valget eller gå videre til oversikt.'
            : 'Velg først en dato, deretter et ledig tidspunkt for avtalen din'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Date selection - compact scrollable */}
        <div className="lg:col-span-1 border border-border bg-background p-3 space-y-3">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Velg dato</span>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {schedules.map((schedule) => {
              const isSelected = selectedDate === schedule.date;
              const availableSlots = schedule.timeSlots.length;
              const { day, date, month } = formatCompactDate(schedule.date);

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
                    <span className="text-[0.7rem] text-muted-foreground">{availableSlots}</span>
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

        {/* Time slot selection - scrollable */}
        <div className="lg:col-span-2 border border-border bg-background p-3 sm:p-4 space-y-3">
          {!selectedDate ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Velg en dato for å se ledige tidspunkt</p>
              </div>
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
                  {selectedSchedule?.timeSlots.map((slot, index) => {
                    const isSelected = urlSelectedTime === slot.startTime;

                    return (
                      <button
                        key={`${slot.startTime}-${index}`}
                        type="button"
                        onClick={() => handleTimeSelect(slot.startTime)}
                        className={`border px-2 py-2 text-sm font-medium rounded-none ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground'
                        }`}
                      >
                        {formatTimeOnly(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation section */}
      {session.selectedStartTime && (
        <div className="border border-border bg-background p-3 sm:p-4 space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Valgt tid</span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">{formatFullDate(session.selectedStartTime)}</span>
              <span className="text-sm text-foreground">kl. {formatTimeOnly(session.selectedStartTime)}</span>
            </div>
          </div>

          <Form method="get" action="/appointments/overview" className="border-t border-border pt-3">
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
