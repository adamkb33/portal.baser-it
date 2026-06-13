import { Form, Link } from 'react-router';
import type { RefObject } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Button,
  Calendar,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type CalendarDateRange,
} from '~/ui';
import type { NotificationReadFilter } from '../_utils/query';

type Props = {
  formRef: RefObject<HTMLFormElement | null>;
  fromDate: string;
  toDate: string;
  dateRange: CalendarDateRange | undefined;
  readFilter: NotificationReadFilter;
  pageSize: number;
  resetHref: string;
  onRangeSelect: (range: CalendarDateRange | undefined) => void;
  onReadFilterChange: (value: NotificationReadFilter) => void;
};

export function NotificationsFilterCard({
  formRef,
  fromDate,
  toDate,
  dateRange,
  readFilter,
  pageSize,
  resetHref,
  onRangeSelect,
  onReadFilterChange,
}: Props) {
  return (
    <Form ref={formRef} method="get" className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div className="grid gap-3 md:grid-cols-2 xl:min-w-[28rem]">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dato</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className="h-10 w-full justify-between rounded-sm border border-border bg-background px-3 text-left text-sm font-normal text-text-primary shadow-none"
              >
                <span className={!fromDate ? 'text-text-secondary' : undefined}>
                  {fromDate ? (toDate ? `${fromDate} - ${toDate}` : `${fromDate} -`) : 'Velg fra- og til-dato'}
                </span>
                <CalendarIcon className="h-4 w-4 text-text-secondary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden border-border bg-overlay-surface p-0 text-text-primary" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onRangeSelect}
                numberOfMonths={1}
                className="bg-overlay-surface"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
          <Select value={readFilter} onValueChange={(value) => onReadFilterChange(value as NotificationReadFilter)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Velg status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="unread">Uleste</SelectItem>
              <SelectItem value="read">Leste</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <input type="hidden" name="fromDate" value={fromDate} />
      <input type="hidden" name="toDate" value={toDate} />
      <input type="hidden" name="read" value={readFilter} />
      <input type="hidden" name="page" value="0" />
      <input type="hidden" name="size" value={pageSize} />

      <div className="flex items-center gap-2 xl:pb-0.5">
        <Button asChild variant="ghost" size="sm">
          <Link to={resetHref}>Nullstill filtre</Link>
        </Button>
      </div>
    </Form>
  );
}
