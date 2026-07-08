import { addWeeks, format } from 'date-fns';

export type ScheduleWeekNavigationOption = {
  active: boolean;
  date: string;
  disabled: boolean;
  label: string;
};

export function getScheduleWeekNavigation({
  selectedWeekStart,
  currentWeekStart,
  earliestNavigableWeekStart,
  latestNavigableWeekStart,
}: {
  selectedWeekStart: Date;
  currentWeekStart: Date;
  earliestNavigableWeekStart: Date;
  latestNavigableWeekStart: Date;
}): {
  previous: ScheduleWeekNavigationOption;
  current: ScheduleWeekNavigationOption;
  next: ScheduleWeekNavigationOption;
} {
  const previousWeekStart = addWeeks(selectedWeekStart, -1);
  const nextWeekStart = addWeeks(selectedWeekStart, 1);
  const previousOffset = getRelativeWeekOffset(previousWeekStart, currentWeekStart);
  const selectedOffset = getRelativeWeekOffset(selectedWeekStart, currentWeekStart);
  const nextOffset = getRelativeWeekOffset(nextWeekStart, currentWeekStart);

  return {
    previous: {
      active: selectedOffset < 0,
      date: format(previousWeekStart, 'yyyy-MM-dd'),
      disabled: previousWeekStart < earliestNavigableWeekStart,
      label: getRelativeWeekLabel(previousOffset, 'previous'),
    },
    current: {
      active: selectedOffset === 0,
      date: format(currentWeekStart, 'yyyy-MM-dd'),
      disabled: false,
      label: 'Denne uken',
    },
    next: {
      active: selectedOffset > 0,
      date: format(nextWeekStart, 'yyyy-MM-dd'),
      disabled: nextWeekStart > latestNavigableWeekStart,
      label: getRelativeWeekLabel(nextOffset, 'next'),
    },
  };
}

export function getRelativeWeekLabel(offset: number, direction: 'previous' | 'next'): string {
  if (offset === 0) return 'Denne uken';
  if (offset === -1) return 'Forrige uke';
  if (offset === 1) return 'Neste uke';
  if (offset < 0) return `Forrige ${Math.abs(offset)} uker`;
  if (direction === 'next') return `Neste ${offset} uker`;
  return `Om ${offset} uker`;
}

function getRelativeWeekOffset(weekStart: Date, currentWeekStart: Date): number {
  const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.round((weekStart.getTime() - currentWeekStart.getTime()) / millisecondsPerWeek);
}
