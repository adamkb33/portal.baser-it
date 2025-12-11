import { useLoaderData, useSearchParams, useSubmit } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import type { ScheduleDto } from 'tmp/openapi/gen/booking';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { ROUTES_MAP } from '~/lib/route-tree';
import { formatCompactDate, formatFullDate, formatTime } from '~/lib/date.utils';
import { appointmentSessionSelectTimeAction } from './_features/appointment.session.select-time.loader';
import { appointmentSessionSelectTimeLoader } from './_features/appointment.session.select-time.action';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { BookingContainer, BookingPageHeader } from '../../_components/booking-layout';

export type AppointmentsSelectTimeLoaderData = {
  session: AppointmentSessionDto;
  schedules: ScheduleDto[];
};

export const loader = appointmentSessionSelectTimeLoader;
export const action = appointmentSessionSelectTimeAction;

// Helper: Group schedules by week
function groupSchedulesByWeek(schedules: ScheduleDto[]) {
  const weeks = new Map<string, { weekNumber: number; year: number; schedules: ScheduleDto[]; startDate: Date }>();

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

export default function BookingPublicAppointmentSessionSelectTimeRoute() {
  const { schedules, session } = useLoaderData<AppointmentsSelectTimeLoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  const weekGroups = useMemo(() => groupSchedulesByWeek(schedules), [schedules]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [accordionValue, setAccordionValue] = useState<string>('');

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
        // Find which week this date belongs to
        const weekIndex = weekGroups.findIndex((wg) => wg.schedules.some((s) => s.date === scheduleDate));
        if (weekIndex !== -1) {
          setSelectedWeekIndex(weekIndex);
          setSelectedDate(scheduleDate);
          setAccordionValue(scheduleDate);
        }
      }
    }
  }, [session.selectedStartTime, urlSelectedTime, persistedTime, schedules, weekGroups, setSearchParams]);

  const handleTimeSelect = (startTime: string) => {
    setSelectedTime(startTime);
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

  const handlePrevWeek = () => {
    if (selectedWeekIndex > 0) {
      setSelectedWeekIndex(selectedWeekIndex - 1);
      setSelectedDate(null);
      setAccordionValue('');
    }
  };

  const handleNextWeek = () => {
    if (selectedWeekIndex < weekGroups.length - 1) {
      setSelectedWeekIndex(selectedWeekIndex + 1);
      setSelectedDate(null);
      setAccordionValue('');
    }
  };

  const totalSlots = currentWeekSchedules.reduce((sum, s) => sum + s.timeSlots.length, 0);

  return (
    <BookingContainer>
      {/* Header */}
      <BookingPageHeader
        title="Velg tidspunkt"
        description={displayTime ? 'Valgt tidspunkt kan endres' : 'Velg dato og klokkeslett'}
        meta={
          weekGroups.length > 0 && (
            <div className="flex items-center gap-1 border border-border bg-muted px-2 py-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-[0.7rem] font-medium text-muted-foreground">{schedules.length} dager</span>
            </div>
          )
        }
      />

      {/* Week Navigator - Mobile & Desktop */}
      {weekGroups.length > 1 && (
        <div className="border-b border-border bg-background">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handlePrevWeek}
              disabled={selectedWeekIndex === 0}
              className="border-r border-border p-3 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Forrige uke"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>

            <div className="flex-1 px-4 py-2.5 text-center">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {getWeekLabel(currentWeek)}
              </div>
              <div className="text-[0.7rem] text-muted-foreground mt-0.5">{totalSlots} ledige tider</div>
            </div>

            <button
              type="button"
              onClick={handleNextWeek}
              disabled={selectedWeekIndex === weekGroups.length - 1}
              className="border-l border-border p-3 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Neste uke"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Week indicator dots */}
          <div className="flex justify-center gap-1 pb-2">
            {weekGroups.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelectedWeekIndex(index);
                  setSelectedDate(null);
                  setAccordionValue('');
                }}
                className={`w-1.5 h-1.5 border border-border transition-colors ${
                  index === selectedWeekIndex ? 'bg-primary' : 'bg-muted'
                }`}
                aria-label={`Gå til uke ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="md:overflow-visible">
        {/* Mobile Accordion */}
        <div className="md:hidden">
          <div className="max-h-[70vh] overflow-y-auto bg-background">
            {currentWeekSchedules.length === 0 ? (
              <div className="border-t border-border bg-muted p-6 text-center">
                <p className="text-xs font-medium text-muted-foreground">Ingen ledige datoer denne uken</p>
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                value={accordionValue}
                onValueChange={(value) => {
                  setAccordionValue(value);
                  setSelectedDate(value || null);
                }}
              >
                {currentWeekSchedules.map((schedule) => {
                  const { day, date, month } = formatCompactDate(schedule.date);
                  const isSelected = selectedDate === schedule.date;
                  const hasSelectedTime = schedule.timeSlots.some((slot) => slot.startTime === displayTime);

                  return (
                    <AccordionItem
                      key={schedule.date}
                      value={schedule.date}
                      className="border-b border-border last:border-b-0"
                    >
                      <AccordionTrigger
                        className={`px-3 py-3 hover:no-underline rounded-none ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-start">
                              <span className="text-[0.65rem] font-medium uppercase tracking-[0.12em] opacity-80">
                                {day}
                              </span>
                              <span className="text-sm font-semibold">
                                {date}. {month}
                              </span>
                            </div>
                            {hasSelectedTime && (
                              <div className="w-1.5 h-1.5 bg-primary-foreground border border-primary-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span
                              className={`text-[0.7rem] font-semibold ${
                                isSelected ? 'text-primary-foreground' : 'text-foreground'
                              }`}
                            >
                              {schedule.timeSlots.length}
                            </span>
                            <span
                              className={`text-[0.65rem] ${
                                isSelected ? 'text-primary-foreground opacity-80' : 'text-muted-foreground'
                              }`}
                            >
                              ledig
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 pt-2 bg-muted">
                        <div className="grid grid-cols-4 gap-1.5">
                          {schedule.timeSlots.map((slot) => {
                            const isTimeSelected = displayTime === slot.startTime;

                            return (
                              <button
                                key={slot.startTime}
                                type="button"
                                onClick={() => handleTimeSelect(slot.startTime)}
                                className={`border px-2 py-2 text-xs font-semibold rounded-none transition-colors ${
                                  isTimeSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background text-foreground active:bg-muted'
                                }`}
                              >
                                {formatTime(slot.startTime)}
                              </button>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-5 md:gap-4 md:p-4">
          <div className="col-span-2 border border-border bg-background p-4 space-y-3">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Velg dato</span>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {currentWeekSchedules.length === 0 ? (
                <div className="border border-border bg-muted p-4 text-center">
                  <p className="text-xs text-muted-foreground">Ingen ledige datoer</p>
                </div>
              ) : (
                currentWeekSchedules.map((schedule) => {
                  const { day, date, month } = formatCompactDate(schedule.date);
                  const isSelected = selectedDate === schedule.date;
                  const hasSelectedTime = schedule.timeSlots.some((slot) => slot.startTime === displayTime);

                  return (
                    <button
                      key={schedule.date}
                      type="button"
                      onClick={() => setSelectedDate(schedule.date)}
                      className={`w-full border text-left px-3 py-2.5 rounded-none transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.65rem] font-medium uppercase tracking-[0.12em] opacity-80">
                              {day}
                            </span>
                            <span className="text-sm font-semibold">
                              {date}. {month}
                            </span>
                          </div>
                          {hasSelectedTime && (
                            <div
                              className={`w-1.5 h-1.5 border ${
                                isSelected
                                  ? 'bg-primary-foreground border-primary-foreground'
                                  : 'bg-primary border-primary'
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[0.7rem] font-medium ${
                            isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {schedule.timeSlots.length} ledig
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="col-span-3 border border-border bg-background p-4 space-y-3">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[480px] space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Ingen dato valgt
                </span>
                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                  Velg en dato fra listen til venstre
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-border pb-3">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Ledige tider
                  </span>
                  <p className="text-sm font-medium text-foreground mt-1">{formatFullDate(selectedDate)}</p>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
                    {selectedSchedule?.timeSlots.map((slot) => {
                      const isTimeSelected = displayTime === slot.startTime;

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => handleTimeSelect(slot.startTime)}
                          className={`border px-2 py-2.5 text-xs font-semibold rounded-none transition-colors ${
                            isTimeSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground hover:bg-muted'
                          }`}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Selected Time Footer */}
      {displayTime && (
        <div className="border-t border-border bg-primary text-primary-foreground p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.12em] opacity-80">Valgt tidspunkt</span>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold">{formatFullDate(displayTime)}</span>
                <span className="text-sm font-medium">kl. {formatTime(displayTime)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="border border-primary-foreground bg-primary-foreground text-primary px-4 py-2.5 text-xs font-medium rounded-none sm:min-w-[160px] active:opacity-90"
            >
              Gå til oversikt →
            </button>
          </div>
        </div>
      )}
    </BookingContainer>
  );
}
