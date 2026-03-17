import * as React from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker';
import { Button } from '../atoms/button';
import { cn } from '../lib/cn';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background p-3',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-primary hover:bg-surface aria-disabled:opacity-50',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-primary hover:bg-surface aria-disabled:opacity-50',
          defaultClassNames.button_next,
        ),
        month_caption: cn('flex h-8 w-full items-center justify-center px-8', defaultClassNames.month_caption),
        dropdowns: cn(
          'flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn('rounded-sm border border-border bg-background', defaultClassNames.dropdown_root),
        dropdown: cn('absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex h-8 items-center gap-1 rounded-sm pl-2 pr-1 text-sm',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 rounded-sm text-[0.8rem] font-normal text-text-secondary',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-8 select-none', defaultClassNames.week_number_header),
        week_number: cn('text-[0.8rem] text-text-secondary', defaultClassNames.week_number),
        day: cn(
          'relative aspect-square h-full w-full p-0 text-center',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-sm'
            : '[&:first-child[data-selected=true]_button]:rounded-l-sm',
          defaultClassNames.day,
        ),
        range_start: cn('rounded-l-sm bg-surface', defaultClassNames.range_start),
        range_middle: cn('rounded-none bg-surface', defaultClassNames.range_middle),
        range_end: cn('rounded-r-sm bg-surface', defaultClassNames.range_end),
        today: cn('rounded-sm bg-surface text-text-primary', defaultClassNames.today),
        outside: cn('text-text-secondary opacity-60', defaultClassNames.outside),
        disabled: cn('text-text-disabled opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />;
          }

          if (orientation === 'right') {
            return <ChevronRightIcon className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />;
          }

          return <ChevronDownIcon className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekNumberProps }) => (
          <td {...weekNumberProps}>
            <div className="flex h-8 w-8 items-center justify-center text-center">{children}</div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'h-9 w-9 min-w-9 rounded-sm text-sm font-normal',
        'data-[selected-single=true]:bg-interactive data-[selected-single=true]:text-text-inverse',
        'data-[range-start=true]:bg-interactive data-[range-start=true]:text-text-inverse',
        'data-[range-end=true]:bg-interactive data-[range-end=true]:text-text-inverse',
        'data-[range-middle=true]:bg-surface data-[range-middle=true]:text-text-primary',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}
