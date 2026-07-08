import { addDays, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CalendarDays, CalendarPlus2, CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Form, Link as RouterLink } from 'react-router';
import { Button } from '~/ui';
import { formatDateInputInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { getScheduleWeekNavigation } from '../_utils/schedule-toolbar.utils';

type ScheduleToolbarProps = {
  selectedWeekStart: Date;
  currentWeekStart: Date;
  earliestNavigableWeekStart: Date;
  latestNavigableWeekStart: Date;
};

export function ScheduleToolbar({
  selectedWeekStart,
  currentWeekStart,
  earliestNavigableWeekStart,
  latestNavigableWeekStart,
}: ScheduleToolbarProps) {
  const selectedWeekEnd = addDays(selectedWeekStart, 6);
  const currentWeekDate = formatDateInputInTimeZone(new Date());
  const navigation = getScheduleWeekNavigation({
    selectedWeekStart,
    currentWeekStart,
    earliestNavigableWeekStart,
    latestNavigableWeekStart,
  });
  const navigationButtonClass =
    'h-9 min-h-9 w-full min-w-0 rounded-lg px-2 text-xs justify-center lg:w-40 lg:shrink-0 lg:px-3';
  const inactiveNavigationButtonClass = 'text-text-secondary hover:bg-surface hover:text-text-primary';
  const activeNavigationButtonClass = 'bg-interactive text-text-inverse hover:bg-interactive-hover';

  return (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0 space-y-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Valgt uke</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-lg font-semibold text-text-primary">
              {format(selectedWeekStart, "'Uke' I", { locale: nb })}
            </span>
            <span className="text-sm font-medium text-text-secondary">
              {format(selectedWeekStart, 'd. MMM', { locale: nb })} -{' '}
              {format(selectedWeekEnd, 'd. MMM yyyy', { locale: nb })}
            </span>
          </div>
        </div>

        <Form method="get" className="w-full">
          <div
            className="grid w-full grid-cols-3 items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-sm lg:flex lg:gap-2 lg:overflow-x-auto"
            role="toolbar"
            aria-label="Ukenavigasjon"
          >
            <Button
              type="submit"
              name="date"
              value={navigation.previous.date}
              variant="ghost"
              size="sm"
              disabled={navigation.previous.disabled}
              active={navigation.previous.active}
              aria-current={navigation.previous.active ? 'date' : undefined}
              aria-label={navigation.previous.label}
              title={navigation.previous.label}
              className={`${navigationButtonClass} ${
                navigation.previous.active ? activeNavigationButtonClass : inactiveNavigationButtonClass
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="truncate">{navigation.previous.label}</span>
            </Button>

            <Button
              type="submit"
              name="date"
              value={currentWeekDate}
              variant="ghost"
              size="sm"
              active={navigation.current.active}
              aria-current={navigation.current.active ? 'date' : undefined}
              className={`${navigationButtonClass} ${
                navigation.current.active ? activeNavigationButtonClass : inactiveNavigationButtonClass
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="truncate">{navigation.current.label}</span>
            </Button>

            <Button
              type="submit"
              name="date"
              value={navigation.next.date}
              variant="ghost"
              size="sm"
              disabled={navigation.next.disabled}
              active={navigation.next.active}
              aria-current={navigation.next.active ? 'date' : undefined}
              aria-label={navigation.next.label}
              title={navigation.next.label}
              className={`${navigationButtonClass} ${
                navigation.next.active ? activeNavigationButtonClass : inactiveNavigationButtonClass
              }`}
            >
              <span className="truncate">{navigation.next.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Form>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end" aria-label="Opprett tid">
        <Button asChild variant="primary" size="md" className="h-10 rounded-lg">
          <RouterLink to={ROUTES_MAP['company.booking.schedule.availabilities'].href}>
            <CalendarPlus2 className="h-4 w-4" />
            Bookbar tid
          </RouterLink>
        </Button>
        <Button asChild variant="outline" size="md" className="h-10 rounded-lg bg-background">
          <RouterLink to={ROUTES_MAP['company.booking.schedule-unavailability.create'].href}>
            <CalendarX2 className="h-4 w-4" />
            Fravær/pause
          </RouterLink>
        </Button>
      </div>
    </div>
  );
}
