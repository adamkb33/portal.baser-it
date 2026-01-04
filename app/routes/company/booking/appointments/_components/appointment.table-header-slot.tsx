import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Badge } from '~/components/ui/badge';
import { Calendar as CalendarIcon, X, Search, Check } from 'lucide-react';
import { Calendar } from '~/components/ui/calendar';
import { cn } from '~/lib/utils';
import { useNavigate, useSearchParams } from 'react-router';
import { type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import {
  AppointmentPaginationQuickFilter,
  AppointmentPaginationService,
} from '../_services/appointment.pagination-service';

export function AppointmentTableHeaderSlot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const paginationService = new AppointmentPaginationService(searchParams, navigate);

  const fromDateTime = searchParams.get('fromDateTime') || '';
  const toDateTime = searchParams.get('toDateTime') || '';
  const searchFilter = searchParams.get('search') || '';

  const fromDate = fromDateTime ? new Date(fromDateTime).toISOString().split('T')[0] : '';
  const fromTime = fromDateTime ? new Date(fromDateTime).toTimeString().slice(0, 5) : '';
  const toDate = toDateTime ? new Date(toDateTime).toISOString().split('T')[0] : '';
  const toTime = toDateTime ? new Date(toDateTime).toTimeString().slice(0, 5) : '';

  const [localFromDate, setLocalFromDate] = useState(fromDate);
  const [localFromTime, setLocalFromTime] = useState(fromTime);
  const [localToDate, setLocalToDate] = useState(toDate);
  const [localToTime, setLocalToTime] = useState(toTime);

  const hasActiveFilters = fromDate || toDate || searchFilter;
  const hasCustomDateFilter = (fromDate || toDate) && paginationService.getActiveQuickFilter() === null;

  const handleApplyDateFilters = () => {
    paginationService.applyDateFilters(localFromDate, localFromTime, localToDate, localToTime);
    setIsDatePickerOpen(false);
  };

  const handleClearFilters = () => {
    setLocalFromDate('');
    setLocalFromTime('');
    setLocalToDate('');
    setLocalToTime('');
    paginationService.handleClearFilters();
    setIsDatePickerOpen(false);
  };

  const activeQuickFilter = paginationService.getActiveQuickFilter();

  return (
    <div className="space-y-3 md:space-y-4 w-full">
      {/* Search */}
      <div className="relative max-w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Søk avtaler..."
          value={searchFilter}
          onChange={(e) => paginationService.handleSearchChange(e.target.value)}
          className="pl-9 pr-9 h-11 text-base md:h-10"
        />
        {searchFilter && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => paginationService.handleRemoveFilter('search')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <SegmentButton
          active={activeQuickFilter === AppointmentPaginationQuickFilter.UPCOMING}
          onClick={paginationService.handleUpcomingFilter}
        >
          Kommende
        </SegmentButton>
        <SegmentButton
          active={activeQuickFilter === AppointmentPaginationQuickFilter.TODAY}
          onClick={paginationService.handleTodayFilter}
        >
          I dag
        </SegmentButton>
        <SegmentButton
          active={activeQuickFilter === AppointmentPaginationQuickFilter.PAST}
          onClick={paginationService.handlePastFilter}
        >
          Tidligere
        </SegmentButton>
      </div>

      <div className="flex items-center gap-2">
        <SecondaryFilterButton
          active={activeQuickFilter === AppointmentPaginationQuickFilter.NEXT_7_DAYS}
          onClick={paginationService.handleNext7days}
        >
          Neste 7 dager
        </SecondaryFilterButton>
        <SecondaryFilterButton
          active={activeQuickFilter === AppointmentPaginationQuickFilter.NEXT_30_DAYS}
          onClick={paginationService.handleNext30Days}
        >
          Neste 30 dager
        </SecondaryFilterButton>

        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={hasCustomDateFilter ? 'default' : 'outline'}
              size="sm"
              className="h-8 md:h-9 gap-1.5 relative"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="text-xs">Periode</span>
              {hasCustomDateFilter && (
                <Badge className="h-4 w-4 p-0 flex items-center justify-center ml-0.5">
                  <Check className="h-2.5 w-2.5" />
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Velg periode</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-7 px-2 text-xs text-destructive"
                  >
                    Nullstill
                  </Button>
                )}
              </div>

              <Calendar
                mode="range"
                selected={{
                  from: localFromDate ? new Date(localFromDate) : undefined,
                  to: localToDate ? new Date(localToDate) : undefined,
                }}
                onSelect={(range: DateRange | undefined) => {
                  setLocalFromDate(range?.from ? format(range.from, 'yyyy-MM-dd') : '');
                  setLocalToDate(range?.to ? format(range.to, 'yyyy-MM-dd') : '');
                }}
                numberOfMonths={1}
                className="rounded-md border"
              />

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Fra tid</Label>
                  <Input
                    type="time"
                    value={localFromTime}
                    onChange={(e) => setLocalFromTime(e.target.value)}
                    className="text-sm h-9"
                    disabled={!localFromDate}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Til tid</Label>
                  <Input
                    type="time"
                    value={localToTime}
                    onChange={(e) => setLocalToTime(e.target.value)}
                    className="text-sm h-9"
                    disabled={!localToDate}
                  />
                </div>
              </div>

              <Button
                onClick={handleApplyDateFilters}
                className="w-full h-9 text-sm"
                disabled={!localFromDate && !localToDate}
              >
                Bruk filter
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            className="h-8 w-8 ml-auto text-destructive md:h-9"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Segmented Button for Mobile (iOS-style), regular buttons on desktop
function SegmentButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 text-xs font-medium rounded-md transition-all',
        'md:px-4 md:py-2 md:text-sm md:h-9',
        active
          ? 'bg-background text-foreground shadow-sm md:bg-primary md:text-primary-foreground md:shadow-none'
          : 'text-muted-foreground hover:text-foreground md:bg-background md:border md:border-border md:hover:bg-accent',
      )}
    >
      {children}
    </button>
  );
}

// Secondary Filter Chips
function SecondaryFilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? 'default' : 'outline'} size="sm" onClick={onClick} className="h-8 md:h-9 text-xs">
      {children}
    </Button>
  );
}
