import type { BusinessHoursInput, EventInput } from '@fullcalendar/core';
import type {
  CompanyUserScheduleOverviewDto,
  DailyScheduleDto,
  ScheduleAppointmentDto,
  ScheduleAvailabilityDto,
  ScheduleUnavailabilityDto,
} from '~/api/generated/booking';
import { formatInTimeZone } from 'date-fns-tz';
import { DEFAULT_QUERY_TIMEZONE } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { minutesInTimeZone, parseHourMinute } from './schedule-time.utils';

export type ScheduleCalendarEventKind = 'appointment' | 'availability' | 'unavailability';

export type ScheduleCalendarEventProps = {
  kind: ScheduleCalendarEventKind;
  appointmentId?: number;
  availabilityId?: number;
  cancelledAt?: string;
  noShow?: boolean;
};

export type ScheduleCalendarWindow = {
  slotMinTime: string;
  slotMaxTime: string;
  scrollTime: string;
};

const DEFAULT_SLOT_MINUTE = 6 * 60;
const DEFAULT_SLOT_MAX_MINUTE = 17 * 60;
const WINDOW_PADDING_MINUTES = 60;
const WINDOW_STEP_MINUTES = 30;
const MIN_WINDOW_MINUTES = 2 * 60;
const FULL_DAY_END_MINUTE = 24 * 60;

const WEEKDAY_TO_FULLCALENDAR_DAY: Record<DailyScheduleDto['dayOfWeek'], number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export function toCalendarEvents(overview: CompanyUserScheduleOverviewDto, now = new Date()): EventInput[] {
  return [
    ...overview.appointments.map((appointment) => toAppointmentEvent(appointment, now)),
    ...overview.unavailabilities.map(toUnavailabilityEvent),
  ];
}

export function toBusinessHours(
  dailySchedules: DailyScheduleDto[],
  availabilities: ScheduleAvailabilityDto[] = [],
  timezone = DEFAULT_QUERY_TIMEZONE,
): BusinessHoursInput {
  if (dailySchedules.length === 0 && availabilities.length === 0) {
    return false;
  }

  const recurringBusinessHours = dailySchedules.map((schedule) => ({
    daysOfWeek: [WEEKDAY_TO_FULLCALENDAR_DAY[schedule.dayOfWeek]],
    startTime: schedule.startTime,
    endTime: schedule.endTime,
  }));

  const availabilityBusinessHours = availabilities
    .map((availability) => toAvailabilityBusinessHour(availability, timezone))
    .filter((businessHour): businessHour is { daysOfWeek: number[]; startTime: string; endTime: string } =>
      Boolean(businessHour),
    );

  return [...recurringBusinessHours, ...availabilityBusinessHours];
}

export function getScheduleCalendarWindow(
  overview: Pick<
    CompanyUserScheduleOverviewDto,
    'dailySchedules' | 'appointments' | 'availabilities' | 'unavailabilities'
  >,
  timezone = DEFAULT_QUERY_TIMEZONE,
): ScheduleCalendarWindow {
  const windows = [
    ...overview.dailySchedules.map((schedule) => ({
      startMinute: hourMinuteToMinute(schedule.startTime),
      endMinute: hourMinuteToMinute(schedule.endTime),
    })),
    ...overview.appointments.map((appointment) => toDateTimeWindow(appointment, timezone)),
    ...overview.availabilities.map((availability) => toDateTimeWindow(availability, timezone)),
    ...overview.unavailabilities.map((unavailability) => toDateTimeWindow(unavailability, timezone)),
  ].filter((window): window is { startMinute: number; endMinute: number } => {
    return (
      window.startMinute != null &&
      window.endMinute != null &&
      Number.isFinite(window.startMinute) &&
      Number.isFinite(window.endMinute) &&
      window.endMinute > window.startMinute
    );
  });

  if (windows.length === 0) {
    return {
      slotMinTime: minuteToDurationString(DEFAULT_SLOT_MINUTE),
      slotMaxTime: minuteToDurationString(DEFAULT_SLOT_MAX_MINUTE),
      scrollTime: minuteToDurationString(DEFAULT_SLOT_MINUTE),
    };
  }

  const minMinute = Math.min(...windows.map((window) => window.startMinute));
  const maxMinute = Math.max(...windows.map((window) => window.endMinute));
  const slotMinMinute = Math.max(0, floorToStep(minMinute - WINDOW_PADDING_MINUTES, WINDOW_STEP_MINUTES));
  const paddedMaxMinute = Math.min(
    FULL_DAY_END_MINUTE,
    ceilToStep(maxMinute + WINDOW_PADDING_MINUTES, WINDOW_STEP_MINUTES),
  );
  const slotMaxMinute = Math.max(Math.min(FULL_DAY_END_MINUTE, slotMinMinute + MIN_WINDOW_MINUTES), paddedMaxMinute);

  return {
    slotMinTime: minuteToDurationString(slotMinMinute),
    slotMaxTime: minuteToDurationString(slotMaxMinute),
    scrollTime: minuteToDurationString(slotMinMinute),
  };
}

export function getAppointmentDetailHref(appointmentId: number): string {
  return ROUTES_MAP['company.booking.appointments.detail'].href.replace(':appointmentId', String(appointmentId));
}

export function minuteToDurationString(minute: number): string {
  const bounded = Math.max(0, Math.min(FULL_DAY_END_MINUTE, minute));
  const hours = Math.floor(bounded / 60);
  const minutes = bounded % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function toAppointmentEvent(appointment: ScheduleAppointmentDto, now: Date): EventInput {
  const appointmentEnd = new Date(appointment.endTime);
  const isPastAppointment = Number.isFinite(appointmentEnd.getTime()) && appointmentEnd < now;
  const classNames = [
    'schedule-event',
    'schedule-event-appointment',
    isPastAppointment ? 'schedule-event-past' : 'schedule-event-upcoming',
    appointment.cancelledAt ? 'schedule-event-cancelled' : null,
    appointment.noShow ? 'schedule-event-no-show' : null,
  ].filter((className): className is string => Boolean(className));

  return {
    id: `appointment-${appointment.id}`,
    title: appointment.noShow ? 'Avtale (ikke møtt)' : 'Avtale',
    start: appointment.startTime,
    end: appointment.endTime,
    classNames,
    extendedProps: {
      kind: 'appointment',
      appointmentId: appointment.id,
      cancelledAt: appointment.cancelledAt,
      noShow: appointment.noShow,
    } satisfies ScheduleCalendarEventProps,
  };
}

function toUnavailabilityEvent(unavailability: ScheduleUnavailabilityDto): EventInput {
  return {
    id: `unavailability-${unavailability.profileId}-${unavailability.startTime}-${unavailability.endTime}`,
    title: 'Fravær/pause',
    start: unavailability.startTime,
    end: unavailability.endTime,
    classNames: ['schedule-event', 'schedule-event-unavailability'],
    extendedProps: {
      kind: 'unavailability',
    } satisfies ScheduleCalendarEventProps,
  };
}

function hourMinuteToMinute(value: string): number | null {
  const parsed = parseHourMinute(value);
  if (!parsed) {
    return null;
  }

  return parsed.hour * 60 + parsed.minute;
}

function toDateTimeWindow(
  value: Pick<ScheduleAppointmentDto | ScheduleAvailabilityDto | ScheduleUnavailabilityDto, 'startTime' | 'endTime'>,
  timezone: string,
): { startMinute: number | null; endMinute: number | null } {
  return {
    startMinute: minutesInTimeZone(value.startTime, timezone),
    endMinute: minutesInTimeZone(value.endTime, timezone),
  };
}

function toAvailabilityBusinessHour(
  availability: ScheduleAvailabilityDto,
  timezone: string,
): { daysOfWeek: number[]; startTime: string; endTime: string } | null {
  const startMinute = minutesInTimeZone(availability.startTime, timezone);
  const endMinute = minutesInTimeZone(availability.endTime, timezone);
  if (startMinute == null || endMinute == null || endMinute <= startMinute) {
    return null;
  }

  const isoDayOfWeek = Number(formatInTimeZone(availability.startTime, timezone, 'i'));
  if (!Number.isFinite(isoDayOfWeek)) {
    return null;
  }

  return {
    daysOfWeek: [isoDayOfWeek % 7],
    startTime: formatInTimeZone(availability.startTime, timezone, 'HH:mm'),
    endTime: formatInTimeZone(availability.endTime, timezone, 'HH:mm'),
  };
}

function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}
