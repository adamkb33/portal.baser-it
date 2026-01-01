import { useState } from 'react';
import { Calendar } from '~/components/ui/calendar';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Clock, CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { ScheduleDto, ScheduleTimeSlot } from '~/api/generated/booking';

type DateTimeSelectorProps = {
  schedules: ScheduleDto[];
  selectedDateTime: Date | null;
  onSelectDateTime: (dateTime: Date) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (from: Date, to: Date) => void;
};

export function DateTimeSelector({
  schedules,
  selectedDateTime,
  onSelectDateTime,
  dateRange,
  onDateRangeChange,
}: DateTimeSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    selectedDateTime ? new Date(selectedDateTime.toDateString()) : null,
  );

  const getScheduleForDate = (date: Date): ScheduleDto | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find((schedule) => schedule.date === dateStr);
  };

  const isDateDisabled = (date: Date): boolean => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Disable dates outside range
    if (date < dateRange.from || date > dateRange.to) return true;

    // Disable if no schedule for this date
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

    // Parse the startTime from the slot (LocalDateTime format)
    const dateTime = new Date(slot.startTime);
    onSelectDateTime(dateTime);
  };

  const handlePreviousWeek = () => {
    const newFrom = new Date(dateRange.from);
    const newTo = new Date(dateRange.to);
    newFrom.setDate(newFrom.getDate() - 7);
    newTo.setDate(newTo.getDate() - 7);

    // Don't go before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newFrom < today) {
      return;
    }

    onDateRangeChange(newFrom, newTo);
  };

  const handleNextWeek = () => {
    const newFrom = new Date(dateRange.from);
    const newTo = new Date(dateRange.to);
    newFrom.setDate(newFrom.getDate() + 7);
    newTo.setDate(newTo.getDate() + 7);
    onDateRangeChange(newFrom, newTo);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentSchedule = selectedDate ? getScheduleForDate(selectedDate) : null;
  const availableTimeSlots = currentSchedule?.timeSlots || [];

  const canGoPrevious = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const previousWeek = new Date(dateRange.from);
    previousWeek.setDate(previousWeek.getDate() - 7);
    return previousWeek >= today;
  };

  return (
    <div className="space-y-4">
      {/* Date Range Navigation */}
      <div className="flex items-center justify-between border-b pb-2">
        <Button variant="ghost" size="sm" onClick={handlePreviousWeek} disabled={!canGoPrevious()} className="h-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-xs text-muted-foreground">
          {dateRange.from.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })} -{' '}
          {dateRange.to.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <Button variant="ghost" size="sm" onClick={handleNextWeek} className="h-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date Selector with Popover */}
      <div className="space-y-3">
        <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium px-1">
          <CalendarIcon className="h-4 w-4" />
          <span>Velg dato</span>
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" id="date" className="w-full justify-between font-normal h-10">
              <span className="text-sm">{selectedDate ? formatDate(selectedDate) : 'Velg dato'}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
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
        <div className="border rounded-md p-4 h-[210px] overflow-y-auto">
          {!selectedDate ? (
            <div className="py-8 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">Velg en dato først</p>
            </div>
          ) : availableTimeSlots.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">Ingen ledige tider</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableTimeSlots.map((slot, index) => {
                const slotStart = new Date(slot.startTime);
                const isSelected = selectedDateTime && slotStart.getTime() === selectedDateTime.getTime();

                return (
                  <Button
                    key={index}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={cn('h-9 text-xs font-medium', isSelected && 'shadow-sm')}
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
          <p className="text-xs text-muted-foreground px-1">Valgt tid: {formatTime(selectedDateTime.toISOString())}</p>
        )}
      </div>
    </div>
  );
}
