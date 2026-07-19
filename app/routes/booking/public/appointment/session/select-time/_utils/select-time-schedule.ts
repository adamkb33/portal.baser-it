import type { ScheduleDto } from '~/api/generated/booking';
import { formatTime } from '~/lib/date.utils';

export type SelectTimeWeekGroup = {
  key: string;
  weekNumber: number;
  year: number;
  schedules: ScheduleDto[];
  startDate: Date;
};

export function groupSchedulesByWeek(schedules: ScheduleDto[]): SelectTimeWeekGroup[] {
  const weeks = new Map<
    string,
    {
      weekNumber: number;
      year: number;
      schedules: ScheduleDto[];
      startDate: Date;
    }
  >();

  schedules.forEach((schedule) => {
    const date = new Date(schedule.date);
    const weekNumber = getWeekNumber(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${weekNumber}`;

    if (!weeks.has(weekKey)) {
      const startOfWeek = getStartOfWeek(date);
      weeks.set(weekKey, { weekNumber, year, schedules: [], startDate: startOfWeek });
    }
    weeks.get(weekKey)!.schedules.push(schedule);
  });

  return Array.from(weeks.entries())
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function isSameSlotTime(a: string, b: string): boolean {
  const aTime = parseDateTime(a);
  const bTime = parseDateTime(b);
  if (aTime !== null && bTime !== null) {
    return aTime === bTime;
  }
  return a === b;
}

export function findScheduleWithTime(schedules: ScheduleDto[], startTime: string): string | null {
  for (const schedule of schedules) {
    if (schedule.timeSlots.some((slot) => isSameSlotTime(slot.startTime, startTime))) {
      return schedule.date;
    }
  }
  return null;
}

export function getWeekLabel(weekData: { weekNumber: number; year: number; startDate: Date }): string {
  const today = new Date();
  const currentWeek = getWeekNumber(today);
  const currentYear = today.getFullYear();

  if (weekData.year === currentYear) {
    if (weekData.weekNumber === currentWeek) return 'Denne uken';
    if (weekData.weekNumber === currentWeek + 1) return 'Neste uke';
  }

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
  const month = monthNames[weekData.startDate.getMonth()];
  const day = weekData.startDate.getDate();

  return `Uke ${weekData.weekNumber} (${day}. ${month})`;
}

export function getEarliestSlot(schedules: ScheduleDto[]): { date: string; time: string } | null {
  if (schedules.length === 0) return null;

  const firstSchedule = schedules[0];
  const firstSlot = firstSchedule.timeSlots[0];

  return firstSlot ? { date: firstSchedule.date, time: firstSlot.startTime } : null;
}

export function groupTimeSlotsByHour(timeSlots: ScheduleDto['timeSlots']) {
  return timeSlots.reduce<Record<string, ScheduleDto['timeSlots']>>((groups, slot) => {
    const hourLabel = formatTime(slot.startTime).split(':')[0] + ':00';
    if (!groups[hourLabel]) {
      groups[hourLabel] = [];
    }
    groups[hourLabel].push(slot);
    return groups;
  }, {});
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function parseDateTime(value: string): number | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}
