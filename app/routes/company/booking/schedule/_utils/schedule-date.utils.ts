import { endOfWeek, format, startOfWeek } from 'date-fns';
import type { Weekday } from '../_types/schedule.types';

export const WEEKDAY: Record<number, Weekday> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

export function toWeekRange(date: string) {
  const selected = new Date(`${date}T00:00:00`);
  const start = startOfWeek(selected, { weekStartsOn: 1 });
  const end = endOfWeek(selected, { weekStartsOn: 1 });
  return { fromDate: format(start, 'yyyy-MM-dd'), toDate: format(end, 'yyyy-MM-dd') };
}

export function toWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function toSafeScheduleDate(rawDate: string | null): string {
  const today = new Date();
  const currentWeekStart = toWeekStart(today);
  const parsed = rawDate ? new Date(`${rawDate}T00:00:00`) : today;
  const requestedWeekStart = Number.isNaN(parsed.getTime()) ? currentWeekStart : toWeekStart(parsed);
  const clamped = requestedWeekStart < currentWeekStart ? currentWeekStart : requestedWeekStart;
  return format(clamped, 'yyyy-MM-dd');
}
