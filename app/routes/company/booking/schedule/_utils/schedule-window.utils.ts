import { formatMinuteClock, minutesInTimeZone, parseHourMinute } from './schedule-time.utils';
import type { WorkWindow } from '../_types/schedule.types';

export const FULL_DAY_START_MINUTE = 0;
export const FULL_DAY_END_MINUTE = 24 * 60;
export const DEFAULT_VIEW_START_MINUTE = 6 * 60;
export const DEFAULT_VIEW_END_MINUTE = 17 * 60;
export const VIEWPORT_MINUTES = DEFAULT_VIEW_END_MINUTE - DEFAULT_VIEW_START_MINUTE;
export const MIN_VIEW_HOURS = VIEWPORT_MINUTES / 60;

export function toMinuteWindowFromSchedules(
  schedules: Array<{ startTime: string; endTime: string }>,
): WorkWindow | null {
  if (schedules.length === 0) return null;

  let minStart = 24 * 60;
  let maxEnd = 0;

  for (const s of schedules) {
    const start = parseHourMinute(s.startTime);
    const end = parseHourMinute(s.endTime);
    if (!start || !end) continue;
    minStart = Math.min(minStart, start.hour * 60 + start.minute);
    maxEnd = Math.max(maxEnd, end.hour * 60 + end.minute);
  }

  if (minStart >= maxEnd) return null;

  return {
    startMinute: minStart,
    endMinute: maxEnd,
    label: `${formatMinuteClock(minStart)} - ${formatMinuteClock(maxEnd)}`,
  };
}

export function toMinuteWindowFromItems(items: Array<{ startTime: string; endTime: string }>): WorkWindow | null {
  if (items.length === 0) return null;

  let minStart = 24 * 60;
  let maxEnd = 0;

  for (const item of items) {
    const start = minutesInTimeZone(item.startTime);
    const end = minutesInTimeZone(item.endTime);
    if (start == null || end == null) continue;
    minStart = Math.min(minStart, start);
    maxEnd = Math.max(maxEnd, end);
  }

  if (minStart >= maxEnd) return null;

  return {
    startMinute: minStart,
    endMinute: maxEnd,
    label: `${formatMinuteClock(minStart)} - ${formatMinuteClock(maxEnd)}`,
  };
}

export function mergeMinuteWindows(base: WorkWindow | null, extension: WorkWindow | null): WorkWindow | null {
  if (!base && !extension) return null;
  if (!base) return extension;
  if (!extension) return base;

  const startMinute = Math.min(base.startMinute, extension.startMinute);
  const endMinute = Math.max(base.endMinute, extension.endMinute);

  return {
    startMinute,
    endMinute,
    label: `${formatMinuteClock(startMinute)} - ${formatMinuteClock(endMinute)}`,
  };
}

export function computeBestViewportStartMinute(
  schedules: Array<{ startTime: string; endTime: string }>,
  viewportMinutes: number,
): number {
  if (schedules.length === 0) return DEFAULT_VIEW_START_MINUTE;

  let weightedMidpointSum = 0;
  let weightSum = 0;

  for (const schedule of schedules) {
    const start = parseHourMinute(schedule.startTime);
    const end = parseHourMinute(schedule.endTime);
    if (!start || !end) continue;

    const startMinute = start.hour * 60 + start.minute;
    const endMinute = end.hour * 60 + end.minute;
    const duration = Math.max(0, endMinute - startMinute);
    if (duration <= 0) continue;

    const midpoint = startMinute + duration / 2;
    weightedMidpointSum += midpoint * duration;
    weightSum += duration;
  }

  if (weightSum <= 0) return DEFAULT_VIEW_START_MINUTE;

  const centerMinute = weightedMidpointSum / weightSum;
  const idealStart = centerMinute - viewportMinutes / 2;
  const maxStart = FULL_DAY_END_MINUTE - viewportMinutes;
  return Math.max(FULL_DAY_START_MINUTE, Math.min(maxStart, idealStart));
}

export function buildHourTicks(startMinute: number, endMinute: number): number[] {
  const startHour = Math.floor(startMinute / 60);
  const endHour = Math.ceil(endMinute / 60);
  const ticks: number[] = [];
  for (let h = startHour; h <= endHour; h += 1) ticks.push(h * 60);
  return ticks;
}
