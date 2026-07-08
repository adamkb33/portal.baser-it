import { describe, expect, it } from 'vitest';
import type { CompanyUserScheduleOverviewDto, DailyScheduleDto } from '~/api/generated/booking';
import {
  getAppointmentDetailHref,
  getScheduleCalendarWindow,
  minuteToDurationString,
  toBusinessHours,
  toCalendarEvents,
} from './fullcalendar-adapter';

function createDailySchedule(overrides: Partial<DailyScheduleDto> = {}): DailyScheduleDto {
  return {
    id: 1,
    dayOfWeek: 'MONDAY',
    startTime: '08:00',
    endTime: '16:00',
    ...overrides,
  };
}

function createOverview(overrides: Partial<CompanyUserScheduleOverviewDto> = {}): CompanyUserScheduleOverviewDto {
  return {
    profileId: 10,
    dailySchedules: [],
    appointments: [],
    availabilities: [],
    unavailabilities: [],
    ...overrides,
  };
}

describe('fullcalendar adapter', () => {
  it('maps appointments, cancelled appointments, and no-show appointments', () => {
    const events = toCalendarEvents(
      createOverview({
        appointments: [
          {
            id: 1,
            profileId: 10,
            userId: 20,
            startTime: '2026-07-08T10:00:00+02:00',
            endTime: '2026-07-08T10:30:00+02:00',
            noShow: false,
          },
          {
            id: 2,
            profileId: 10,
            userId: 21,
            startTime: '2026-07-08T11:00:00+02:00',
            endTime: '2026-07-08T11:30:00+02:00',
            cancelledAt: '2026-07-07T12:00:00+02:00',
            noShow: true,
          },
        ],
      }),
      new Date('2026-07-08T10:45:00+02:00'),
    );

    expect(events[0]).toMatchObject({
      id: 'appointment-1',
      title: 'Avtale',
      start: '2026-07-08T10:00:00+02:00',
      end: '2026-07-08T10:30:00+02:00',
      classNames: ['schedule-event', 'schedule-event-appointment', 'schedule-event-past'],
      extendedProps: {
        kind: 'appointment',
        appointmentId: 1,
        noShow: false,
      },
    });
    expect(events[1]).toMatchObject({
      id: 'appointment-2',
      title: 'Avtale (ikke møtt)',
      classNames: [
        'schedule-event',
        'schedule-event-appointment',
        'schedule-event-upcoming',
        'schedule-event-cancelled',
        'schedule-event-no-show',
      ],
      extendedProps: {
        kind: 'appointment',
        appointmentId: 2,
        cancelledAt: '2026-07-07T12:00:00+02:00',
        noShow: true,
      },
    });
  });

  it('uses availability for business hours instead of rendering it as its own event', () => {
    const events = toCalendarEvents(
      createOverview({
        availabilities: [
          {
            id: 3,
            profileId: 10,
            startTime: '2026-07-08T17:00:00+02:00',
            endTime: '2026-07-08T19:00:00+02:00',
          },
        ],
        unavailabilities: [
          {
            id: 7,
            profileId: 10,
            startTime: '2026-07-08T12:00:00+02:00',
            endTime: '2026-07-08T13:00:00+02:00',
          },
        ],
      }),
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 'unavailability-10-2026-07-08T12:00:00+02:00-2026-07-08T13:00:00+02:00',
      title: 'Fravær/pause',
      classNames: ['schedule-event', 'schedule-event-unavailability'],
      extendedProps: {
        kind: 'unavailability',
      },
    });
  });

  it('maps daily schedules to FullCalendar business hours', () => {
    expect(
      toBusinessHours(
        [
          createDailySchedule({ id: 1, dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '14:00' }),
          createDailySchedule({ id: 2, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '16:00' }),
          createDailySchedule({ id: 3, dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '13:00' }),
        ],
        [
          {
            id: 4,
            profileId: 10,
            startTime: '2026-07-08T17:00:00+02:00',
            endTime: '2026-07-08T19:00:00+02:00',
          },
        ],
      ),
    ).toEqual([
      { daysOfWeek: [0], startTime: '10:00', endTime: '14:00' },
      { daysOfWeek: [1], startTime: '08:00', endTime: '16:00' },
      { daysOfWeek: [6], startTime: '09:00', endTime: '13:00' },
      { daysOfWeek: [3], startTime: '17:00', endTime: '19:00' },
    ]);
  });

  it('returns false business hours when daily schedules are empty', () => {
    expect(toBusinessHours([])).toBe(false);
  });

  it('calculates a dynamic visible window from daily schedules', () => {
    expect(
      getScheduleCalendarWindow(
        createOverview({
          dailySchedules: [createDailySchedule({ startTime: '08:00', endTime: '16:00' })],
        }),
      ),
    ).toEqual({
      slotMinTime: '07:00:00',
      slotMaxTime: '17:00:00',
      scrollTime: '07:00:00',
    });
  });

  it('calculates a dynamic visible window from events when schedules are empty', () => {
    expect(
      getScheduleCalendarWindow(
        createOverview({
          appointments: [
            {
              id: 1,
              profileId: 10,
              userId: 20,
              startTime: '2026-07-08T10:00:00+02:00',
              endTime: '2026-07-08T11:00:00+02:00',
              noShow: false,
            },
          ],
        }),
      ),
    ).toEqual({
      slotMinTime: '09:00:00',
      slotMaxTime: '12:00:00',
      scrollTime: '09:00:00',
    });
  });

  it('uses a safe default visible window for empty calendars', () => {
    expect(getScheduleCalendarWindow(createOverview())).toEqual({
      slotMinTime: '06:00:00',
      slotMaxTime: '17:00:00',
      scrollTime: '06:00:00',
    });
  });

  it('formats fullcalendar duration strings up to 24 hours', () => {
    expect(minuteToDurationString(0)).toBe('00:00:00');
    expect(minuteToDurationString(90)).toBe('01:30:00');
    expect(minuteToDurationString(24 * 60)).toBe('24:00:00');
  });

  it('builds appointment detail links', () => {
    expect(getAppointmentDetailHref(123)).toBe('/company/booking/appointments/123');
  });
});
