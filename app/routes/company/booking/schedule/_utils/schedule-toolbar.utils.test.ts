import { describe, expect, it } from 'vitest';
import { getRelativeWeekLabel, getScheduleWeekNavigation } from './schedule-toolbar.utils';

describe('schedule-toolbar utils', () => {
  it('labels next navigation progressively from the selected week', () => {
    const currentWeekStart = new Date('2026-07-06T00:00:00');
    const selectedWeekStart = new Date('2026-07-13T00:00:00');
    const earliestNavigableWeekStart = new Date('2026-06-08T00:00:00');
    const latestNavigableWeekStart = new Date('2026-08-03T00:00:00');

    const navigation = getScheduleWeekNavigation({
      selectedWeekStart,
      currentWeekStart,
      earliestNavigableWeekStart,
      latestNavigableWeekStart,
    });

    expect(navigation.next).toMatchObject({
      active: true,
      date: '2026-07-20',
      label: 'Neste 2 uker',
      disabled: false,
    });
    expect(navigation.current.active).toBe(false);
    expect(navigation.previous.active).toBe(false);
  });

  it('labels previous navigation progressively from the selected week', () => {
    const currentWeekStart = new Date('2026-07-06T00:00:00');
    const selectedWeekStart = new Date('2026-06-22T00:00:00');
    const earliestNavigableWeekStart = new Date('2026-06-08T00:00:00');
    const latestNavigableWeekStart = new Date('2026-08-03T00:00:00');

    const navigation = getScheduleWeekNavigation({
      selectedWeekStart,
      currentWeekStart,
      earliestNavigableWeekStart,
      latestNavigableWeekStart,
    });

    expect(navigation.previous).toMatchObject({
      active: true,
      date: '2026-06-15',
      label: 'Forrige 3 uker',
      disabled: false,
    });
    expect(navigation.next).toMatchObject({
      date: '2026-06-29',
      label: 'Forrige uke',
      disabled: false,
    });
    expect(navigation.current.active).toBe(false);
    expect(navigation.next.active).toBe(false);
  });

  it('marks current navigation active for the current week', () => {
    const currentWeekStart = new Date('2026-07-06T00:00:00');
    const earliestNavigableWeekStart = new Date('2026-06-08T00:00:00');
    const latestNavigableWeekStart = new Date('2026-08-03T00:00:00');

    const navigation = getScheduleWeekNavigation({
      selectedWeekStart: currentWeekStart,
      currentWeekStart,
      earliestNavigableWeekStart,
      latestNavigableWeekStart,
    });

    expect(navigation.previous.active).toBe(false);
    expect(navigation.current.active).toBe(true);
    expect(navigation.next.active).toBe(false);
  });

  it('disables previous and next navigation at the min and max boundaries', () => {
    const currentWeekStart = new Date('2026-07-06T00:00:00');
    const earliestNavigableWeekStart = new Date('2026-06-08T00:00:00');
    const latestNavigableWeekStart = new Date('2026-08-03T00:00:00');

    expect(
      getScheduleWeekNavigation({
        selectedWeekStart: earliestNavigableWeekStart,
        currentWeekStart,
        earliestNavigableWeekStart,
        latestNavigableWeekStart,
      }).previous.disabled,
    ).toBe(true);

    expect(
      getScheduleWeekNavigation({
        selectedWeekStart: latestNavigableWeekStart,
        currentWeekStart,
        earliestNavigableWeekStart,
        latestNavigableWeekStart,
      }).next.disabled,
    ).toBe(true);
  });

  it('labels relative week navigation clearly', () => {
    expect(getRelativeWeekLabel(-2, 'previous')).toBe('Forrige 2 uker');
    expect(getRelativeWeekLabel(-1, 'previous')).toBe('Forrige uke');
    expect(getRelativeWeekLabel(0, 'next')).toBe('Denne uken');
    expect(getRelativeWeekLabel(1, 'next')).toBe('Neste uke');
    expect(getRelativeWeekLabel(2, 'next')).toBe('Neste 2 uker');
    expect(getRelativeWeekLabel(3, 'next')).toBe('Neste 3 uker');
  });
});
