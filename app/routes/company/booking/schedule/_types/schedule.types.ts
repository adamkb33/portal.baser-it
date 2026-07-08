export type Weekday = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

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
