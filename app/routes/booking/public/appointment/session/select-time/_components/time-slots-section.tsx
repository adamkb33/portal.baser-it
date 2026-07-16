import type * as React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import type { ScheduleDto } from '~/api/generated/booking';
import { formatFullDate } from '~/lib/date.utils';
import { cn, Panel as BookingSection } from '~/ui';
import { isSameSlotTime } from '../_utils/select-time-schedule';
import { TimeSlotButton } from './time-slot-button';

type TimeSlotsSectionProps = {
  selectedDate: string | null;
  groupedHours: string[];
  groupedTimeSlots: Record<string, ScheduleDto['timeSlots']>;
  displayTime: string | null;
  isSubmitting: boolean;
  variant?: 'mobile' | 'desktop';
  showMoreTimeHint?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
};

export function TimeSlotsSection({
  selectedDate,
  groupedHours,
  groupedTimeSlots,
  displayTime,
  isSubmitting,
  variant = 'mobile',
  showMoreTimeHint = false,
  scrollRef,
}: TimeSlotsSectionProps) {
  if (variant === 'desktop') {
    return (
      <BookingSection className="lg:col-span-3">
        {!selectedDate ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3">
            <Clock className="size-12 text-booking-text-muted opacity-50" />
            <p className="text-sm font-medium text-booking-text">Velg en dato først</p>
            <p className="max-w-xs text-center text-xs text-booking-text-muted">
              Velg en dato fra listen til venstre for å se ledige tider
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-booking-border pb-2">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-booking-text-muted" />
                <div>
                  <h3 className="text-base font-bold text-booking-text">Ledige tider</h3>
                  <p className="text-sm text-booking-text-muted">{formatFullDate(selectedDate)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {groupedHours.map((hour) => (
                <HourColumn
                  key={hour}
                  hour={hour}
                  slots={groupedTimeSlots[hour]}
                  displayTime={displayTime}
                  isSubmitting={isSubmitting}
                  className="min-w-44"
                />
              ))}
            </div>
          </>
        )}
      </BookingSection>
    );
  }

  if (!selectedDate) {
    return null;
  }

  return (
    <BookingSection>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-booking-text-muted" />
            <h3 className="text-sm font-bold text-booking-text">Velg tid</h3>
          </div>
          <p className="text-xs text-booking-text-muted">{formatFullDate(selectedDate)}</p>
        </div>

        <div className="relative">
          {showMoreTimeHint && (
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-center',
                'bg-gradient-to-l from-booking-surface-raised/100 to-transparent font-semibold uppercase tracking-wider',
              )}
              aria-hidden="true"
            >
              <ChevronRight className="size-4 text-booking-action animate-bounce-right" />
            </div>
          )}
          <div ref={scrollRef} className="overflow-x-auto pb-2 pr-8">
            <div className="flex gap-3">
              {groupedHours.map((hour) => (
                <HourColumn
                  key={hour}
                  hour={hour}
                  slots={groupedTimeSlots[hour]}
                  displayTime={displayTime}
                  isSubmitting={isSubmitting}
                  className="min-w-40"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </BookingSection>
  );
}

type HourColumnProps = {
  hour: string;
  slots: ScheduleDto['timeSlots'];
  displayTime: string | null;
  isSubmitting: boolean;
  className?: string;
};

function HourColumn({ hour, slots, displayTime, isSubmitting, className }: HourColumnProps) {
  return (
    <div className={cn('shrink-0', className)}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-booking-text-muted">{hour}</div>
      <div className="grid grid-cols-2 gap-2 p-1">
        {slots.map((slot) => (
          <TimeSlotButton
            key={slot.startTime}
            time={slot.startTime}
            isSelected={displayTime ? isSameSlotTime(displayTime, slot.startTime) : false}
            disabled={isSubmitting}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
