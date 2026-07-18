import { Check } from 'lucide-react';
import type { ScheduleDto } from '~/api/generated/booking';
import { cn } from '~/ui';
import { formatCompactDate } from '~/lib/date.utils';

type DateButtonProps = {
  schedule: ScheduleDto;
  isSelected: boolean;
  hasSelectedTime: boolean;
  onClick: () => void;
  variant?: 'default' | 'compact';
};

export function DateButton({ schedule, isSelected, hasSelectedTime, onClick, variant = 'default' }: DateButtonProps) {
  const { day, date, month } = formatCompactDate(schedule.date);
  const isCompact = variant === 'compact';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full items-center justify-between gap-3 rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-selected)] transition-all',
        isCompact ? 'min-h-11 px-3 py-2' : 'min-h-16 p-3 md:min-h-14',
        isSelected && [
          'border-booking-action bg-booking-action text-booking-action-contrast',
          'shadow-[var(--shadow-booking-card)]',
        ],
        !isSelected && [
          'border-booking-border bg-booking-surface text-booking-text',
          'hover:border-booking-action/50 hover:bg-booking-surface-muted',
        ],
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-start">
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isSelected ? 'text-booking-action-contrast/80' : 'text-booking-text-muted',
            )}
          >
            {day}
          </span>
          <span className={cn('font-bold', isCompact ? 'text-sm' : 'text-base md:text-lg')}>
            {date}. {month}
          </span>
        </div>

        {hasSelectedTime && (
          <div
            className={cn(
              'flex size-6 items-center justify-center rounded-[var(--radius-booking-badge)]',
              isSelected ? 'bg-booking-action-contrast' : 'bg-booking-action',
            )}
          >
            <Check
              className={cn('size-4', isSelected ? 'text-booking-action' : 'text-booking-action-contrast')}
              strokeWidth={3}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className={cn('text-xs', isSelected ? 'text-booking-action-contrast/80' : 'text-booking-text-muted')}>
          ledig
        </span>
        <span
          className={cn(
            'flex items-center justify-center rounded-full font-bold',
            isCompact ? 'size-8 text-sm' : 'size-10 text-base',
            isSelected ? 'bg-booking-action-contrast/20' : 'bg-booking-surface-muted',
            isSelected ? 'text-booking-action-contrast' : 'text-booking-text',
          )}
        >
          {schedule.timeSlots.length}
        </span>
      </div>
    </button>
  );
}
