import { formatInTimeZone } from 'date-fns-tz';
import { DEFAULT_QUERY_TIMEZONE } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import type { SelectionDraft, Weekday } from '../_types/schedule.types';
import { parseHourMinute } from './schedule-time.utils';

const ISO_DAY_TO_WEEKDAY: Record<number, Weekday> = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  7: 'SUNDAY',
};

type ScheduleSelectionDestinationArgs = {
  start: Date;
  end: Date;
  dailySchedules: Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
  scheduleDate: string;
  timezone?: string;
};

export function getScheduleSelectionDestination({
  start,
  end,
  dailySchedules,
  scheduleDate,
  timezone = DEFAULT_QUERY_TIMEZONE,
}: ScheduleSelectionDestinationArgs): string {
  const dayKey = formatInTimeZone(start, timezone, 'yyyy-MM-dd');
  const startMinute = getMinuteInTimeZone(start, timezone);
  const endMinute = getMinuteInTimeZone(end, timezone);
  const dayOfWeek = getWeekdayInTimeZone(start, timezone);
  const redirectTo = `${ROUTES_MAP['company.booking.schedule'].href}?date=${scheduleDate}`;

  if (isWithinWorkHours(dayOfWeek, startMinute, endMinute, dailySchedules)) {
    const params = new URLSearchParams({
      from: formatLocalDateTimeParam(start, timezone),
      to: formatLocalDateTimeParam(end, timezone),
      redirectTo,
    });
    return `${ROUTES_MAP['company.booking.schedule-unavailability.create'].href}?${params.toString()}`;
  }

  const params = new URLSearchParams({
    date: dayKey,
    startTime: formatInTimeZone(start, timezone, 'HH:mm'),
    endTime: formatInTimeZone(end, timezone, 'HH:mm'),
    redirectTo,
  });
  return `${ROUTES_MAP['company.booking.schedule.availabilities'].href}?${params.toString()}`;
}

export function isWithinWorkHours(
  dayOfWeek: Weekday,
  startMinute: number,
  endMinute: number,
  dailySchedules: Array<{ dayOfWeek: string; startTime: string; endTime: string }>,
): boolean {
  const daySchedules = dailySchedules.filter((schedule) => schedule.dayOfWeek === dayOfWeek);
  if (daySchedules.length === 0) return false;

  return daySchedules.some((schedule) => {
    const start = parseHourMinute(schedule.startTime);
    const end = parseHourMinute(schedule.endTime);
    if (!start || !end) return false;
    const rangeStart = start.hour * 60 + start.minute;
    const rangeEnd = end.hour * 60 + end.minute;
    return startMinute >= rangeStart && endMinute <= rangeEnd;
  });
}

export function toSelectionDraft(start: Date, end: Date, timezone = DEFAULT_QUERY_TIMEZONE): SelectionDraft {
  return {
    dayKey: formatInTimeZone(start, timezone, 'yyyy-MM-dd'),
    dayOfWeek: getWeekdayInTimeZone(start, timezone),
    startMinute: getMinuteInTimeZone(start, timezone),
    endMinute: getMinuteInTimeZone(end, timezone),
  };
}

function getWeekdayInTimeZone(date: Date, timezone: string): Weekday {
  const isoDay = Number(formatInTimeZone(date, timezone, 'i'));
  return ISO_DAY_TO_WEEKDAY[isoDay] ?? 'MONDAY';
}

function getMinuteInTimeZone(date: Date, timezone: string): number {
  const hour = Number(formatInTimeZone(date, timezone, 'HH'));
  const minute = Number(formatInTimeZone(date, timezone, 'mm'));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 0;
  }
  return hour * 60 + minute;
}

function formatLocalDateTimeParam(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm");
}
