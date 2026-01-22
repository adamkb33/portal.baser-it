import { useEffect, useRef, useState } from 'react';
import { Calendar } from '~/components/ui/calendar';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Clock, CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { ScheduleDto, ScheduleTimeSlot } from '~/api/generated/booking';

type DateTimeSelectorProps = {
  schedules: ScheduleDto[];
  selectedDateTime: Date | null;
  onSelectDateTime: (dateTime: Date) => void;
};

export function DateTimeSelector({ schedules, selectedDateTime, onSelectDateTime }: DateTimeSelectorProps) {
  const hasInitializedDefault = useRef(false);
  const findNearestAvailableDate = (items: ScheduleDto[]): Date | null => {
    const now = new Date();
    const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const upcomingDates = items
      .map((schedule) => {
        const scheduleDate = new Date(`${schedule.date}T00:00:00`);
        if (Number.isNaN(scheduleDate.getTime())) return null;
        if (schedule.timeSlots.length === 0) return null;

        const isToday = scheduleDate.getTime() === todayKey;
        if (isToday) {
          const hasFutureSlot = schedule.timeSlots.some((slot) => new Date(slot.startTime) >= now);
          return hasFutureSlot ? scheduleDate : null;
        }

        return scheduleDate >= new Date(todayKey) ? scheduleDate : null;
      })
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime());

    return upcomingDates[0] ?? null;
  };

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    selectedDateTime ? new Date(selectedDateTime.toDateString()) : findNearestAvailableDate(schedules),
  );
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(selectedDate ?? undefined);

  useEffect(() => {
    if (selectedDate) {
      setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDateTime) {
      setSelectedDate(new Date(selectedDateTime.toDateString()));
      hasInitializedDefault.current = true;
      return;
    }

    if (!hasInitializedDefault.current) {
      setSelectedDate((current) => current ?? findNearestAvailableDate(schedules));
      hasInitializedDefault.current = true;
    }
  }, [selectedDateTime, schedules]);

  const getScheduleForDate = (date: Date): ScheduleDto | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return schedules.find((schedule) => schedule.date === dateStr);
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    const schedule = getScheduleForDate(date);
    return !schedule || schedule.timeSlots.length === 0;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  const handleTimeSlotSelect = (slot: ScheduleTimeSlot) => {
    if (!selectedDate) return;
    const dateTime = new Date(slot.startTime);
    onSelectDateTime(dateTime);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Oslo',
    }).format(date);
  };

  const formatTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Oslo',
    });
  };

  const currentSchedule = selectedDate ? getScheduleForDate(selectedDate) : null;
  const availableTimeSlots = currentSchedule?.timeSlots || [];

  return (
    <div className="space-y-3 md:space-y-4 rounded-md p-2">
      {/* Date Selector */}
      <div className="space-y-3">
        <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium px-1">
          <CalendarIcon className="h-4 w-4" />
          <span>Velg dato</span>
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" id="date" className="w-full justify-between font-normal h-12 md:h-10">
              <span className="text-sm md:text-sm">{selectedDate ? formatDate(selectedDate) : 'Velg dato'}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slot Selector */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium px-1">
          <Clock className="h-4 w-4" />
          <span>Velg tid</span>
        </Label>
        <div className="border rounded-lg p-3 md:p-4 h-[320px] md:h-[250px] overflow-y-auto">
          {!selectedDate ? (
            <div className="py-12 md:py-8 text-center">
              <Clock className="h-12 w-12 md:h-10 md:w-10 mx-auto text-muted-foreground/50 mb-3 md:mb-2" />
              <p className="text-sm md:text-xs text-muted-foreground">Velg en dato først</p>
            </div>
          ) : availableTimeSlots.length === 0 ? (
            <div className="py-12 md:py-8 text-center">
              <Clock className="h-12 w-12 md:h-10 md:w-10 mx-auto text-muted-foreground/50 mb-3 md:mb-2" />
              <p className="text-sm md:text-xs text-muted-foreground">Ingen ledige tider</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-2">
              {availableTimeSlots.map((slot, index) => {
                const slotStart = new Date(slot.startTime);
                const isSelected = selectedDateTime && slotStart.getTime() === selectedDateTime.getTime();

                return (
                  <Button
                    key={index}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-11 md:h-9 text-sm md:text-xs font-medium',
                      'active:scale-95 transition-transform',
                      isSelected && 'shadow-sm',
                    )}
                    onClick={() => handleTimeSlotSelect(slot)}
                  >
                    {formatTime(slot.startTime)}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        {selectedDateTime && (
          <p className="text-xs text-muted-foreground px-1">Valgt tid: {formatTime(selectedDateTime)}</p>
        )}
      </div>
    </div>
  );
}
