import { useEffect, useState } from 'react';
import { CalendarPlus2, CalendarX2 } from 'lucide-react';
import { Button } from '~/ui';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import type { ScheduleWeekDay } from '../_types/schedule.types';

type Props = {
  weekDays: ScheduleWeekDay[];
  initialDayKey?: string | null;
  onDayChange: (dayKey: string) => void;
  onNavigate: (to: string) => void;
};

export function ScheduleMobileView({ weekDays, initialDayKey, onDayChange, onNavigate }: Props) {
  const [mobileDayKey, setMobileDayKey] = useState<string | null>(initialDayKey ?? null);

  useEffect(() => {
    if (weekDays.length === 0) return;
    const today = weekDays.find((day) => day.isToday) ?? weekDays[0];
    setMobileDayKey((prev) => (prev && weekDays.some((day) => day.key === prev) ? prev : today.key));
  }, [weekDays]);

  useEffect(() => {
    if (!mobileDayKey) return;
    onDayChange(mobileDayKey);
  }, [mobileDayKey, onDayChange]);

  return (
    <section className="p-3 shadow-sm md:hidden" aria-label="Mobil kalendernavigasjon">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Dager i valgt uke">
        {weekDays.map((day) => {
          const isSelected = mobileDayKey === day.key;
          const [weekday, date] = splitDayLabel(day.label);

          return (
            <Button
              key={`mobile-day-${day.key}`}
              type="button"
              size="sm"
              variant="outline"
              data-selected={isSelected}
              data-accent={day.isToday}
              aria-pressed={isSelected}
              onClick={() => setMobileDayKey(day.key)}
              className={`h-16 min-w-16 flex-col whitespace-nowrap rounded-2xl px-3 shadow-sm ${
                isSelected
                  ? 'border-interactive bg-background text-text-primary ring-2 ring-interactive/20'
                  : day.isToday
                    ? 'border-primary/40 bg-surface-primary-subtle text-primary'
                    : 'bg-background text-text-secondary'
              }`}
            >
              <span className="text-xs font-semibold uppercase leading-tight">{weekday}</span>
              <span className="text-sm font-semibold leading-tight">{date}</span>
            </Button>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2" aria-label="Opprett kalenderhendelse">
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="h-12 rounded-xl bg-interactive text-sm text-text-inverse shadow-sm hover:bg-interactive-hover"
          onClick={() => onNavigate(ROUTES_MAP['company.booking.schedule.availabilities'].href)}
        >
          <CalendarPlus2 className="h-4 w-4" />
          Bookbar tid
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-xl bg-background text-sm shadow-sm"
          onClick={() => onNavigate(ROUTES_MAP['company.booking.schedule-unavailability.create'].href)}
        >
          <CalendarX2 className="h-4 w-4" />
          Fravær/pause
        </Button>
      </div>
    </section>
  );
}

function splitDayLabel(label: string) {
  const [weekday = label, date = ''] = label.split(' ');
  return [weekday.replace('.', ''), date] as const;
}
