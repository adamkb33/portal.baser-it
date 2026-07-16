import { Calendar } from 'lucide-react';
import type { ScheduleDto } from '~/api/generated/booking';
import { Panel as BookingSection } from '~/ui';
import { DateButton } from './date-button';
import { isSameSlotTime } from '../_utils/select-time-schedule';

type DateSelectorSectionProps = {
  schedules: ScheduleDto[];
  selectedDate: string | null;
  isCollapsed: boolean;
  displayTime: string | null;
  onSelectDate: (date: string) => void;
  onShowAllDates: () => void;
  variant?: 'mobile' | 'desktop';
};

export function DateSelectorSection({
  schedules,
  selectedDate,
  isCollapsed,
  displayTime,
  onSelectDate,
  onShowAllDates,
  variant = 'mobile',
}: DateSelectorSectionProps) {
  const isDesktop = variant === 'desktop';
  const visibleSchedules =
    isCollapsed && selectedDate ? schedules.filter((schedule) => schedule.date === selectedDate) : schedules;

  return (
    <BookingSection className={isDesktop ? 'lg:col-span-2' : undefined}>
      <div className={isDesktop ? 'mb-2 flex items-center gap-2' : 'flex items-center gap-2'}>
        <Calendar className={isDesktop ? 'size-5 text-booking-text-muted' : 'size-4 text-booking-text-muted'} />
        <h3 className={isDesktop ? 'text-base font-bold text-booking-text' : 'text-sm font-bold text-booking-text'}>
          Velg dato
        </h3>
        {selectedDate && isCollapsed && (
          <button
            type="button"
            onClick={onShowAllDates}
            className="ml-auto rounded-md border border-booking-action px-2.5 py-1 text-sm font-semibold text-booking-action transition-colors hover:bg-booking-surface-muted"
          >
            Endre dato
          </button>
        )}
      </div>

      {schedules.length === 0 ? (
        <div
          className={
            isDesktop
              ? 'flex min-h-56 items-center justify-center rounded-lg border-2 border-dashed border-booking-border bg-booking-surface-muted p-6 text-center'
              : 'rounded-lg border-2 border-dashed border-booking-border bg-booking-surface-muted p-6 text-center'
          }
        >
          <p className="text-sm text-booking-text-muted">Ingen ledige datoer denne uken</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSchedules.map((schedule) => (
            <DateButton
              key={schedule.date}
              schedule={schedule}
              isSelected={selectedDate === schedule.date}
              hasSelectedTime={schedule.timeSlots.some((slot) =>
                displayTime ? isSameSlotTime(slot.startTime, displayTime) : false,
              )}
              onClick={() => onSelectDate(schedule.date)}
              variant={isDesktop ? 'compact' : 'default'}
            />
          ))}
        </div>
      )}
    </BookingSection>
  );
}
