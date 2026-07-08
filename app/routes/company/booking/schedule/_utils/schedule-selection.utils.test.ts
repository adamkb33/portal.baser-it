import { describe, expect, it } from 'vitest';
import { getScheduleSelectionDestination, isWithinWorkHours, toSelectionDraft } from './schedule-selection.utils';

const dailySchedules = [{ dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '16:00' }];

describe('schedule selection utils', () => {
  it('detects selections inside working hours', () => {
    expect(isWithinWorkHours('WEDNESDAY', 9 * 60, 10 * 60, dailySchedules)).toBe(true);
    expect(isWithinWorkHours('WEDNESDAY', 7 * 60, 10 * 60, dailySchedules)).toBe(false);
    expect(isWithinWorkHours('THURSDAY', 9 * 60, 10 * 60, dailySchedules)).toBe(false);
  });

  it('creates unavailability URLs for selections inside working hours', () => {
    expect(
      getScheduleSelectionDestination({
        start: new Date('2026-07-08T09:00:00+02:00'),
        end: new Date('2026-07-08T10:00:00+02:00'),
        dailySchedules,
        scheduleDate: '2026-07-06',
      }),
    ).toBe(
      '/company/booking/schedule-unavailability/create?from=2026-07-08T09%3A00&to=2026-07-08T10%3A00&redirectTo=%2Fcompany%2Fbooking%2Fschedule%3Fdate%3D2026-07-06',
    );
  });

  it('creates availability URLs for selections outside working hours', () => {
    expect(
      getScheduleSelectionDestination({
        start: new Date('2026-07-08T17:00:00+02:00'),
        end: new Date('2026-07-08T18:00:00+02:00'),
        dailySchedules,
        scheduleDate: '2026-07-06',
      }),
    ).toBe(
      '/company/booking/schedule/availabilities?date=2026-07-08&startTime=17%3A00&endTime=18%3A00&redirectTo=%2Fcompany%2Fbooking%2Fschedule%3Fdate%3D2026-07-06',
    );
  });

  it('converts fullcalendar dates to selection drafts', () => {
    expect(toSelectionDraft(new Date('2026-07-08T09:00:00+02:00'), new Date('2026-07-08T10:00:00+02:00'))).toEqual({
      dayKey: '2026-07-08',
      dayOfWeek: 'WEDNESDAY',
      startMinute: 9 * 60,
      endMinute: 10 * 60,
    });
  });
});
