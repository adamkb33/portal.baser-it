import { getDateKeyInZone } from './schedule-zone.utils';
import { minutesInTimeZone, parseHourMinute } from './schedule-time.utils';
import type { PositionedItem, ScheduleItem, Weekday } from '../_types/schedule.types';

export function toPositionedItems(items: ScheduleItem[], windowStart: number, windowEnd: number): PositionedItem[] {
  const duration = Math.max(1, windowEnd - windowStart);

  const byDay = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const dayKey = getDateKeyInZone(item.startTime);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey)?.push(item);
  }

  const result: PositionedItem[] = [];

  for (const [, dayItems] of byDay) {
    const normalized = dayItems
      .map((item) => {
        const start = minutesInTimeZone(item.startTime);
        const end = minutesInTimeZone(item.endTime);
        if (start == null || end == null) return null;

        const clampedStart = Math.max(windowStart, Math.min(windowEnd, start));
        const clampedEnd = Math.max(clampedStart + 1, Math.max(windowStart, Math.min(windowEnd, end)));

        return {
          item,
          startMinute: clampedStart,
          endMinute: clampedEnd,
        };
      })
      .filter((x): x is { item: ScheduleItem; startMinute: number; endMinute: number } => x !== null)
      .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);

    const laneEndMinutes: number[] = [];
    const enriched: Array<{ base: ScheduleItem; startMinute: number; endMinute: number; lane: number }> = [];

    for (const n of normalized) {
      let lane = laneEndMinutes.findIndex((endMinute) => n.startMinute >= endMinute);
      if (lane === -1) {
        lane = laneEndMinutes.length;
        laneEndMinutes.push(n.endMinute);
      } else {
        laneEndMinutes[lane] = n.endMinute;
      }

      enriched.push({
        base: n.item,
        startMinute: n.startMinute,
        endMinute: n.endMinute,
        lane,
      });
    }

    const laneCount = Math.max(1, laneEndMinutes.length);

    for (const e of enriched) {
      const top = ((e.startMinute - windowStart) / duration) * 100;
      const height = Math.max(1.2, ((e.endMinute - e.startMinute) / duration) * 100);

      result.push({
        ...e.base,
        startMinute: e.startMinute,
        endMinute: e.endMinute,
        top,
        height,
        lane: e.lane,
        laneCount,
      });
    }
  }

  return result;
}

export function itemTone(item: ScheduleItem) {
  if (item.kind === 'appointment') {
    return 'bg-surface-primary-strong text-text-primary';
  }
  if (item.kind === 'availability') {
    return 'bg-surface-secondary-strong text-text-primary';
  }
  return 'bg-surface-tertiary-strong text-text-primary';
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
