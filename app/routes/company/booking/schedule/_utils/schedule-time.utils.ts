import { formatInTimeZone } from 'date-fns-tz';
import { DEFAULT_QUERY_TIMEZONE } from '~/lib/query';

export function parseHourMinute(value: string): { hour: number; minute: number } | null {
  const [rawHour, rawMinute] = value.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour, minute };
}

export function minutesInTimeZone(dateTime: string, timezone = DEFAULT_QUERY_TIMEZONE): number | null {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return null;
  const hh = Number(formatInTimeZone(date, timezone, 'HH'));
  const mm = Number(formatInTimeZone(date, timezone, 'mm'));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

export function currentMinuteInTimeZone(timezone = DEFAULT_QUERY_TIMEZONE): number {
  const now = new Date();
  const hh = Number(formatInTimeZone(now, timezone, 'HH'));
  const mm = Number(formatInTimeZone(now, timezone, 'mm'));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  return hh * 60 + mm;
}

export function minuteLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  return `${String(h).padStart(2, '0')}:00`;
}

export function formatMinuteClock(minute: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, minute));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function snapMinute(minute: number, step = 5): number {
  return Math.round(minute / step) * step;
}

export function minuteFromPointer(clientY: number, rect: DOMRect, windowStart: number, windowEnd: number): number {
  const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)));
  const minute = windowStart + ratio * (windowEnd - windowStart);
  return snapMinute(minute);
}

export function toLocalDateTime(dayKey: string, minute: number): string {
  return `${dayKey}T${formatMinuteClock(minute)}`;
}

export function isPastInterval(endTime: string): boolean {
  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
}
