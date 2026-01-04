import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Badge } from '~/components/ui/badge';
import { Calendar, X, Search, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useNavigate, useSearchParams } from 'react-router';
import { AppointmentPaginationService } from '../_services/appointment.pagination-service';

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
  const hasCustomDateFilter = (fromDate || toDate) && paginationService.getActiveQuickFilter(fromDate, toDate) === null;
  const activeFilterCount = [fromDate, toDate, searchFilter].filter(Boolean).length;

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

  const activeQuickFilter = paginationService.getActiveQuickFilter(fromDate, toDate);

  return (
    <div className="space-y-3 md:space-y-4 w-full">
      {/* Search */}
      <div className="relative max-w-full md:max-w-md">
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

      {/* Segmented Control - Primary Filters */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-lg md:inline-flex md:w-auto md:gap-2 md:p-0 md:bg-transparent">
        <SegmentButton active={activeQuickFilter === 'upcoming'} onClick={paginationService.handleUpcomingFilter}>
          Kommende
        </SegmentButton>
        <SegmentButton active={activeQuickFilter === 'today'} onClick={paginationService.handleTodayFilter}>
          I dag
        </SegmentButton>
        <SegmentButton active={activeQuickFilter === 'past'} onClick={paginationService.handlePastFilter}>
          Tidligere
        </SegmentButton>
      </div>

      {/* Secondary Filters Row */}
      <div className="flex items-center gap-2">
        <SecondaryFilterButton active={activeQuickFilter === 'week'} onClick={paginationService.handleNext7days}>
          Neste 7 dager
        </SecondaryFilterButton>
        <SecondaryFilterButton active={activeQuickFilter === 'month'} onClick={paginationService.handleNext30Days}>
          Neste 30 dager
        </SecondaryFilterButton>

        {/* Date Range Popover */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={hasCustomDateFilter ? 'default' : 'outline'}
              size="sm"
              className="h-8 md:h-9 gap-1.5 relative"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Periode</span>
              {hasCustomDateFilter && (
                <Badge className="h-4 w-4 p-0 flex items-center justify-center ml-0.5">
                  <Check className="h-2.5 w-2.5" />
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
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

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Fra</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={localFromDate}
                      onChange={(e) => setLocalFromDate(e.target.value)}
                      className="flex-1 text-sm h-9"
                    />
                    <Input
                      type="time"
                      value={localFromTime}
                      onChange={(e) => setLocalFromTime(e.target.value)}
                      className="w-20 text-sm h-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Til</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={localToDate}
                      onChange={(e) => setLocalToDate(e.target.value)}
                      className="flex-1 text-sm h-9"
                    />
                    <Input
                      type="time"
                      value={localToTime}
                      onChange={(e) => setLocalToTime(e.target.value)}
                      className="w-20 text-sm h-9"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleApplyDateFilters} className="w-full h-9 text-sm">
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

      {/* Active Filter Summary - Fixed Height Always */}
      {/* <div className="h-14 md:h-11">
        {hasActiveFilters ? (
          <div className="flex items-center gap-2 p-2 md:px-3 rounded-lg bg-primary/5 md:bg-muted/30 border border-primary/20 md:border-border h-full">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary md:text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-[10px] md:text-xs font-medium text-primary md:text-muted-foreground uppercase md:normal-case tracking-wide md:tracking-normal mb-1 md:mb-0 md:inline md:mr-2 shrink-0">
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filtre'}
                <span className="hidden md:inline">:</span>
              </p>
              <div className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide md:inline-flex">
                {searchFilter && (
                  <FilterTag onRemove={() => paginationService.handleRemoveFilter('search')}>
                    Søk: {searchFilter.slice(0, 15)}
                    {searchFilter.length > 15 && '...'}
                  </FilterTag>
                )}
                {fromDate && (
                  <FilterTag onRemove={() => paginationService.handleRemoveFilter('fromDate')}>
                    Fra: {fromDate} {fromTime && `kl. ${fromTime}`}
                  </FilterTag>
                )}
                {toDate && (
                  <FilterTag onRemove={() => paginationService.handleRemoveFilter('toDate')}>
                    Til: {toDate} {toTime && `kl. ${toTime}`}
                  </FilterTag>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full" /> // Empty spacer to maintain height
        )}
      </div> */}
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

// Compact Filter Tags
function FilterTag({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2 pr-0.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-medium whitespace-nowrap shrink-0">
      {children}
      <button onClick={onRemove} className="h-5 w-5 rounded hover:bg-primary/20 flex items-center justify-center">
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}
