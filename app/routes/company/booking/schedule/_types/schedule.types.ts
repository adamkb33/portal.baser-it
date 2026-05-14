export type Weekday = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export type ScheduleItem = {
  id: string;
  startTime: string;
  endTime: string;
  kind: 'appointment' | 'availability' | 'unavailability';
  appointmentId?: number;
  availabilityId?: number;
  text: string;
};

export type WorkWindow = {
  startMinute: number;
  endMinute: number;
  label: string;
};

export type PositionedItem = ScheduleItem & {
  startMinute: number;
  endMinute: number;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
};

export type SelectionDraft = {
  dayKey: string;
  dayOfWeek: Weekday;
  startMinute: number;
  endMinute: number;
};

export type ScheduleWeekDay = {
  date: Date;
  key: string;
  dayOfWeek: Weekday;
  label: string;
  isToday: boolean;
  isPast: boolean;
};
