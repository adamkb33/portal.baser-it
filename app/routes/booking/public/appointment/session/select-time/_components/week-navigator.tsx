import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '~/ui';
import { Panel as BookingSection } from '~/ui';
import type { SelectTimeWeekGroup } from '../_utils/select-time-schedule';
import { getWeekLabel } from '../_utils/select-time-schedule';

type WeekNavigatorProps = {
  weekGroups: SelectTimeWeekGroup[];
  selectedWeekIndex: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onSelectWeek: (index: number) => void;
};

export function WeekNavigator({
  weekGroups,
  selectedWeekIndex,
  onPreviousWeek,
  onNextWeek,
  onSelectWeek,
}: WeekNavigatorProps) {
  if (weekGroups.length <= 1) {
    return null;
  }

  const currentWeek = weekGroups[selectedWeekIndex];
  const totalSlots = currentWeek.schedules.reduce((sum, schedule) => sum + schedule.timeSlots.length, 0);

  return (
    <BookingSection className="p-0">
      <div className="flex items-center border-b border-booking-border">
        <button
          type="button"
          onClick={onPreviousWeek}
          disabled={selectedWeekIndex === 0}
          className="flex size-12 items-center justify-center border-r border-booking-border transition-colors hover:bg-booking-surface-muted disabled:cursor-not-allowed disabled:opacity-30 md:size-14"
          aria-label="Forrige uke"
        >
          <ChevronLeft className="size-5 md:size-6" />
        </button>

        <div className="flex-1 py-3 text-center">
          <p className="text-sm font-bold text-booking-text md:text-base">{getWeekLabel(currentWeek)}</p>
          <p className="mt-0.5 text-xs text-booking-text-muted">{totalSlots} ledige tider</p>
        </div>

        <button
          type="button"
          onClick={onNextWeek}
          disabled={selectedWeekIndex === weekGroups.length - 1}
          className="flex size-12 items-center justify-center border-l border-booking-border transition-colors hover:bg-booking-surface-muted disabled:cursor-not-allowed disabled:opacity-30 md:size-14"
          aria-label="Neste uke"
        >
          <ChevronRight className="size-5 md:size-6" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto p-2 md:overflow-visible">
        {weekGroups.map((week, index) => {
          const weekLabel = getWeekLabel(week);
          const isActive = index === selectedWeekIndex;

          return (
            <button
              key={week.key}
              type="button"
              onClick={() => onSelectWeek(index)}
              className={cn(
                'min-h-11 shrink-0 rounded px-3 py-2 text-xs font-semibold transition-all md:text-sm md:flex-1',
                'min-w-[140px] md:min-w-0',
                isActive && 'bg-booking-action text-booking-action-contrast shadow-sm',
                !isActive && 'bg-booking-surface-muted text-booking-text-muted hover:bg-booking-surface',
              )}
              aria-label={`Gå til ${weekLabel}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="block truncate">{weekLabel}</span>
            </button>
          );
        })}
      </div>
    </BookingSection>
  );
}
