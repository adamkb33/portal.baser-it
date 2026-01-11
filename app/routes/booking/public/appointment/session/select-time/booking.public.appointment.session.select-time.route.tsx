import { useLoaderData, useSearchParams, useSubmit, useNavigation } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Zap, Check, X } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { ScheduleDto } from 'tmp/openapi/gen/booking';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { ROUTES_MAP } from '~/lib/route-tree';
import { formatCompactDate, formatFullDate, formatTime } from '~/lib/date.utils';
import { appointmentSessionSelectTimeAction } from './_features/appointment.session.select-time.loader';
import { appointmentSessionSelectTimeLoader } from './_features/appointment.session.select-time.action';
import { BookingContainer, BookingPageHeader, BookingButton } from '../../_components/booking-layout';

export type AppointmentsSelectTimeLoaderData = {
  session: AppointmentSessionDto;
  schedules: ScheduleDto[];
};

export const loader = appointmentSessionSelectTimeLoader;
export const action = appointmentSessionSelectTimeAction;

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

function groupSchedulesByWeek(schedules: ScheduleDto[]) {
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

function findScheduleWithTime(schedules: ScheduleDto[], startTime: string): string | null {
  for (const schedule of schedules) {
    if (schedule.timeSlots.some((slot) => slot.startTime === startTime)) {
      return schedule.date;
    }
  }
  return null;
}

function getWeekLabel(weekData: { weekNumber: number; year: number; startDate: Date }): string {
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

function getEarliestSlot(schedules: ScheduleDto[]): { date: string; time: string } | null {
  if (schedules.length === 0) return null;

  const firstSchedule = schedules[0];
  const firstSlot = firstSchedule.timeSlots[0];

  return firstSlot ? { date: firstSchedule.date, time: firstSlot.startTime } : null;
}

/* ========================================
   DATE BUTTON COMPONENT
   ======================================== */

interface DateButtonProps {
  schedule: ScheduleDto;
  isSelected: boolean;
  hasSelectedTime: boolean;
  onClick: () => void;
}

function DateButton({ schedule, isSelected, hasSelectedTime, onClick }: DateButtonProps) {
  const { day, date, month } = formatCompactDate(schedule.date);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base styles - mobile-first touch target
        'relative flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border-2 p-3 transition-all md:min-h-14',

        // Selected state
        isSelected && ['border-primary bg-primary text-primary-foreground', 'shadow-sm'],

        // Default state
        !isSelected && ['border-card-border bg-card text-card-text', 'hover:border-primary/50 hover:bg-card-hover-bg'],
      )}
    >
      {/* Date info */}
      <div className="flex items-center gap-3">
        {/* Day/Date */}
        <div className="flex flex-col items-start">
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
            )}
          >
            {day}
          </span>
          <span className="text-base font-bold md:text-lg">
            {date}. {month}
          </span>
        </div>

        {/* Selected indicator */}
        {hasSelectedTime && (
          <div
            className={cn(
              'flex size-6 items-center justify-center rounded-full',
              isSelected ? 'bg-primary-foreground' : 'bg-primary',
            )}
          >
            <Check className={cn('size-4', isSelected ? 'text-primary' : 'text-primary-foreground')} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Slot count badge */}
      <div
        className={cn(
          'flex flex-col items-end gap-0.5 rounded-lg px-2.5 py-1',
          isSelected ? 'bg-primary-foreground/20' : 'bg-muted',
        )}
      >
        <span className={cn('text-base font-bold', isSelected ? 'text-primary-foreground' : 'text-card-text')}>
          {schedule.timeSlots.length}
        </span>
        <span className={cn('text-xs', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          ledig
        </span>
      </div>
    </button>
  );
}

/* ========================================
   TIME SLOT BUTTON
   ======================================== */

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onClick: () => void;
}

function TimeSlotButton({ time, isSelected, onClick }: TimeSlotButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Touch-friendly: 48px height on mobile
        'flex min-h-12 items-center justify-center rounded-lg border-2 px-4 py-3 font-bold transition-all md:min-h-11',

        // Selected state
        isSelected && [
          'border-primary bg-primary text-primary-foreground',
          'shadow-sm ring-2 ring-primary/20 ring-offset-2',
        ],

        // Default state
        !isSelected && [
          'border-card-border bg-card text-card-text',
          'hover:border-primary/50 hover:bg-card-hover-bg',
          'active:scale-95',
        ],
      )}
    >
      <span className="text-sm md:text-base">{formatTime(time)}</span>
    </button>
  );
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function BookingPublicAppointmentSessionSelectTimeRoute() {
  const { schedules, session } = useLoaderData<AppointmentsSelectTimeLoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const weekGroups = useMemo(() => groupSchedulesByWeek(schedules), [schedules]);
  const earliestSlot = useMemo(() => getEarliestSlot(schedules), [schedules]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const urlSelectedTime = searchParams.get('time');
  const persistedTime = urlSelectedTime || session.selectedStartTime;
  const displayTime = selectedTime || persistedTime;

  const currentWeek = weekGroups[selectedWeekIndex];
  const currentWeekSchedules = currentWeek?.schedules || [];
  const selectedSchedule = currentWeekSchedules.find((s) => s.date === selectedDate);

  // Initialize: find week with selected time or default to first week
  useEffect(() => {
    if (session.selectedStartTime && !urlSelectedTime) {
      setSearchParams({ time: session.selectedStartTime }, { replace: true });
    }

    if (persistedTime && weekGroups.length > 0) {
      const scheduleDate = findScheduleWithTime(schedules, persistedTime);
      if (scheduleDate) {
        const weekIndex = weekGroups.findIndex((wg) => wg.schedules.some((s) => s.date === scheduleDate));
        if (weekIndex !== -1) {
          setSelectedWeekIndex(weekIndex);
          setSelectedDate(scheduleDate);
        }
      }
    }
  }, [session.selectedStartTime, urlSelectedTime, persistedTime, schedules, weekGroups, setSearchParams]);

  const handleTimeSelect = (startTime: string) => {
    setSelectedTime(startTime);
  };

  const handleQuickBook = () => {
    if (earliestSlot) {
      setSelectedTime(earliestSlot.time);
      const scheduleDate = findScheduleWithTime(schedules, earliestSlot.time);
      if (scheduleDate) {
        const weekIndex = weekGroups.findIndex((wg) => wg.schedules.some((s) => s.date === scheduleDate));
        if (weekIndex !== -1) {
          setSelectedWeekIndex(weekIndex);
          setSelectedDate(scheduleDate);
        }
      }
    }
  };

  const handleSubmit = () => {
    if (selectedTime) {
      const formData = new FormData();
      formData.set('selectedStartTime', selectedTime);
      submit(formData, { method: 'post' });
    } else {
      submit(null, {
        method: 'get',
        action: ROUTES_MAP['booking.public.appointment.session.overview'].href,
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedTime(null);
    setSelectedDate(null);
  };

  const handlePrevWeek = () => {
    if (selectedWeekIndex > 0) {
      setSelectedWeekIndex(selectedWeekIndex - 1);
      setSelectedDate(null);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeekIndex < weekGroups.length - 1) {
      setSelectedWeekIndex(selectedWeekIndex + 1);
      setSelectedDate(null);
    }
  };

  const totalSlots = currentWeekSchedules.reduce((sum, s) => sum + s.timeSlots.length, 0);

  return (
    <>
      <BookingContainer>
        {/* ========================================
            PAGE HEADER
            ======================================== */}
        <BookingPageHeader
          title="Velg tidspunkt"
          description={displayTime ? 'Valgt tidspunkt kan endres' : 'Velg dato og klokkeslett for avtalen'}
        />

        {/* ========================================
            QUICK BOOK - First available slot
            ======================================== */}
        {earliestSlot && !displayTime && (
          <button
            type="button"
            onClick={handleQuickBook}
            className="flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4 transition-colors hover:border-primary hover:bg-primary/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary">
                <Zap className="size-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-card-text md:text-base">Raskeste tiden</p>
                <p className="text-xs text-muted-foreground md:text-sm">
                  {formatFullDate(earliestSlot.date)} kl. {formatTime(earliestSlot.time)}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-primary">Velg →</span>
          </button>
        )}

        {/* ========================================
            WEEK NAVIGATOR
            ======================================== */}
        {weekGroups.length > 1 && (
          <div className="rounded-lg border border-card-border bg-card">
            {/* Navigation controls */}
            <div className="flex items-center border-b border-card-border">
              <button
                type="button"
                onClick={handlePrevWeek}
                disabled={selectedWeekIndex === 0}
                className="flex size-12 items-center justify-center border-r border-card-border transition-colors hover:bg-card-hover-bg disabled:cursor-not-allowed disabled:opacity-30 md:size-14"
                aria-label="Forrige uke"
              >
                <ChevronLeft className="size-5 md:size-6" />
              </button>

              <div className="flex-1 py-3 text-center">
                <p className="text-sm font-bold text-card-text md:text-base">{getWeekLabel(currentWeek)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{totalSlots} ledige tider</p>
              </div>

              <button
                type="button"
                onClick={handleNextWeek}
                disabled={selectedWeekIndex === weekGroups.length - 1}
                className="flex size-12 items-center justify-center border-l border-card-border transition-colors hover:bg-card-hover-bg disabled:cursor-not-allowed disabled:opacity-30 md:size-14"
                aria-label="Neste uke"
              >
                <ChevronRight className="size-5 md:size-6" />
              </button>
            </div>

            {/* Week indicator - Touch-friendly tabs */}
            {weekGroups.length > 1 && (
              <div className="flex gap-1 p-2">
                {weekGroups.map((week, index) => {
                  const weekLabel = getWeekLabel(week);
                  const isActive = index === selectedWeekIndex;

                  return (
                    <button
                      key={week.key}
                      type="button"
                      onClick={() => {
                        setSelectedWeekIndex(index);
                        setSelectedDate(null);
                      }}
                      className={cn(
                        // Touch-friendly: 44px height
                        'flex-1 min-h-11 rounded px-3 py-2 text-xs font-semibold transition-all md:text-sm',
                        isActive && 'bg-primary text-primary-foreground shadow-sm',
                        !isActive && 'bg-muted text-muted-foreground hover:bg-muted/70',
                      )}
                      aria-label={`Gå til ${weekLabel}`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="block truncate">{weekLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================
            MOBILE: STACKED LAYOUT
            ======================================== */}
        <div className="space-y-4 md:hidden">
          {/* Date selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-card-text">Velg dato</h3>
            </div>

            {currentWeekSchedules.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-card-border bg-card-accent/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">Ingen ledige datoer denne uken</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentWeekSchedules.map((schedule) => (
                  <DateButton
                    key={schedule.date}
                    schedule={schedule}
                    isSelected={selectedDate === schedule.date}
                    hasSelectedTime={schedule.timeSlots.some((slot) => slot.startTime === displayTime)}
                    onClick={() => setSelectedDate(schedule.date)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Time slots */}
          {selectedSchedule && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold text-card-text">Velg tid</h3>
                </div>
                <p className="text-xs text-muted-foreground">{formatFullDate(selectedDate!)}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {selectedSchedule.timeSlots.map((slot) => (
                  <TimeSlotButton
                    key={slot.startTime}
                    time={slot.startTime}
                    isSelected={displayTime === slot.startTime}
                    onClick={() => handleTimeSelect(slot.startTime)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================
            DESKTOP: SIDE-BY-SIDE LAYOUT
            ======================================== */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-5">
          {/* Date selector */}
          <div className="rounded-lg border border-card-border bg-card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="size-5 text-muted-foreground" />
              <h3 className="text-base font-bold text-card-text">Velg dato</h3>
            </div>

            {currentWeekSchedules.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-card-border bg-card-accent/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">Ingen ledige datoer denne uken</p>
              </div>
            ) : (
              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {currentWeekSchedules.map((schedule) => (
                  <DateButton
                    key={schedule.date}
                    schedule={schedule}
                    isSelected={selectedDate === schedule.date}
                    hasSelectedTime={schedule.timeSlots.some((slot) => slot.startTime === displayTime)}
                    onClick={() => setSelectedDate(schedule.date)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Time slots */}
          <div className="rounded-lg border border-card-border bg-card p-4 lg:col-span-3">
            {!selectedDate ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
                <Clock className="size-12 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium text-card-text">Velg en dato først</p>
                <p className="max-w-xs text-center text-xs text-muted-foreground">
                  Velg en dato fra listen til venstre for å se ledige tider
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-card-border pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-muted-foreground" />
                    <div>
                      <h3 className="text-base font-bold text-card-text">Ledige tider</h3>
                      <p className="text-sm text-muted-foreground">{formatFullDate(selectedDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="max-h-[440px] overflow-y-auto">
                  <div className="grid grid-cols-4 gap-3 lg:grid-cols-5">
                    {selectedSchedule?.timeSlots.map((slot) => (
                      <TimeSlotButton
                        key={slot.startTime}
                        time={slot.startTime}
                        isSelected={displayTime === slot.startTime}
                        onClick={() => handleTimeSelect(slot.startTime)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </BookingContainer>

      {/* ========================================
          STICKY BOTTOM CTA - Mobile only
          ======================================== */}
      {displayTime && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-card-border bg-background shadow-2xl md:hidden">
          <div className="p-4">
            {/* Summary */}
            <div className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-primary/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Check className="size-5 text-primary-foreground" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Valgt tidspunkt</p>
                  <p className="text-sm font-bold text-card-text">{formatFullDate(displayTime)}</p>
                  <p className="text-sm font-semibold text-primary">kl. {formatTime(displayTime)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearSelection}
                className="rounded-full p-2 transition-colors hover:bg-destructive/10"
                aria-label="Fjern valg"
              >
                <X className="size-4 text-destructive" />
              </button>
            </div>

            {/* Continue button */}
            <BookingButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Gå til oversikt →
            </BookingButton>
          </div>
        </div>
      )}

      {/* ========================================
          DESKTOP STICKY CTA
          ======================================== */}
      {displayTime && (
        <div className="sticky bottom-4 hidden rounded-lg border border-primary bg-primary p-4 text-primary-foreground shadow-lg md:block">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/20">
                <Check className="size-6 text-primary-foreground" strokeWidth={3} />
              </div>
              <div>
                <p className="text-xs font-medium opacity-80">Valgt tidspunkt</p>
                <p className="text-base font-bold">
                  {formatFullDate(displayTime)} kl. {formatTime(displayTime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearSelection}
                className="flex items-center gap-2 rounded-lg bg-primary-foreground/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/30"
              >
                <X className="size-4" />
                Fjern
              </button>

              <BookingButton
                variant="secondary"
                size="md"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Gå til oversikt →
              </BookingButton>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for mobile sticky CTA */}
      {displayTime && <div className="h-32 md:hidden" aria-hidden="true" />}
    </>
  );
}
