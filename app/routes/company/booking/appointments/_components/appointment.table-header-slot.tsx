import { useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { format } from 'date-fns';
import { Calendar, type CalendarDateRange } from '~/ui';
import { toDateInputFromOffsetDateTime } from '~/lib/query';
import {
  AppointmentPaginationQuickFilter,
  AppointmentPaginationService,
} from '../_services/appointment.pagination-service';
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '~/ui';

export function AppointmentTableHeaderSlot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const paginationService = useMemo(
    () => new AppointmentPaginationService(searchParams, navigate),
    [searchParams, navigate],
  );

  const fromDateTime = searchParams.get('fromDateTime') || '';
  const toDateTime = searchParams.get('toDateTime') || '';
  const searchFilter = searchParams.get('search') || '';

  const fromDate = toDateInputFromOffsetDateTime(fromDateTime);
  const toDate = toDateInputFromOffsetDateTime(toDateTime);

  const [localFromDate, setLocalFromDate] = useState(fromDate);
  const [localToDate, setLocalToDate] = useState(toDate);
  const [localSearchFilter, setLocalSearchFilter] = useState(searchFilter);
  const lastSubmittedSearchRef = useRef(searchFilter.trim());

  useEffect(() => {
    setLocalFromDate(fromDate);
    setLocalToDate(toDate);
  }, [fromDate, toDate]);

  useEffect(() => {
    const normalizedSearchFilter = searchFilter.trim();
    if (normalizedSearchFilter === lastSubmittedSearchRef.current) return;

    setLocalSearchFilter(searchFilter);
    lastSubmittedSearchRef.current = normalizedSearchFilter;
  }, [searchFilter]);

  useEffect(() => {
    const normalizedSearch = localSearchFilter.trim();
    const timeoutId = setTimeout(() => {
      if (normalizedSearch === lastSubmittedSearchRef.current) return;
      lastSubmittedSearchRef.current = normalizedSearch;
      paginationService.handleSearchChange(normalizedSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchFilter, paginationService]);

  const activeQuickFilter = paginationService.getActiveQuickFilter();
  const hasDateFilter = Boolean(fromDate || toDate);
  const hasAnyFilters = Boolean(searchFilter || hasDateFilter);
  const filledFilterButtonClass = 'bg-chip-surface hover:bg-chip-surface-hover border-border';
  const activeFilledFilterButtonClass = 'bg-chip-surface-active hover:bg-chip-surface-active-hover border-border';

  const handleApplyDateFilters = () => {
    paginationService.applyDateFilters(localFromDate, localToDate);
    setIsFilterPopoverOpen(false);
  };

  const handleRemoveSearchFilter = () => {
    lastSubmittedSearchRef.current = '';
    setLocalSearchFilter('');
    paginationService.handleRemoveFilter('search');
  };

  const handleClearFilters = () => {
    lastSubmittedSearchRef.current = '';
    setLocalSearchFilter('');
    paginationService.handleClearFilters();
    setIsFilterPopoverOpen(false);
  };

  const handleQuickFilterClick = (filter: AppointmentPaginationQuickFilter) => {
    switch (filter) {
      case AppointmentPaginationQuickFilter.UPCOMING:
        paginationService.handleUpcomingFilter();
        break;
      case AppointmentPaginationQuickFilter.TODAY:
        paginationService.handleTodayFilter();
        break;
      case AppointmentPaginationQuickFilter.PAST:
        paginationService.handlePastFilter();
        break;
      case AppointmentPaginationQuickFilter.NEXT_7_DAYS:
        paginationService.handleNext7days();
        setIsFilterPopoverOpen(false);
        break;
      case AppointmentPaginationQuickFilter.NEXT_30_DAYS:
        paginationService.handleNext30Days();
        setIsFilterPopoverOpen(false);
        break;
    }
  };

  return (
    <div className="w-full space-y-3 rounded-lg border border-border bg-surface-accent-subtle p-2.5 md:space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk avtaler..."
            value={localSearchFilter}
            onChange={(e) => setLocalSearchFilter(e.target.value)}
            className="h-11 border-border bg-surface-variant-1 pl-9 pr-9 text-base md:h-10"
          />
          {localSearchFilter && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={handleRemoveSearchFilter}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
            <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={hasDateFilter ? 'secondary' : 'outline'}
                  size="sm"
                  className={`h-9 gap-1.5 ${hasDateFilter ? activeFilledFilterButtonClass : filledFilterButtonClass}`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filtrer
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-w-sm border-border bg-surface-variant-1 p-0" align="end">
                <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <Text as="p" variant="label">
                    Hurtigfiltre
                  </Text>
                  {hasAnyFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-7 border border-border bg-chip-surface px-2 text-xs text-destructive hover:bg-chip-surface-hover"
                    >
                      Nullstill alle
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={activeQuickFilter === AppointmentPaginationQuickFilter.NEXT_7_DAYS ? 'secondary' : 'outline'}
                    onClick={() => handleQuickFilterClick(AppointmentPaginationQuickFilter.NEXT_7_DAYS)}
                    className={`h-8 ${
                      activeQuickFilter === AppointmentPaginationQuickFilter.NEXT_7_DAYS
                        ? activeFilledFilterButtonClass
                        : filledFilterButtonClass
                    }`}
                  >
                    Neste 7 dager
                  </Button>
                  <Button
                    size="sm"
                    variant={activeQuickFilter === AppointmentPaginationQuickFilter.NEXT_30_DAYS ? 'secondary' : 'outline'}
                    onClick={() => handleQuickFilterClick(AppointmentPaginationQuickFilter.NEXT_30_DAYS)}
                    className={`h-8 ${
                      activeQuickFilter === AppointmentPaginationQuickFilter.NEXT_30_DAYS
                        ? activeFilledFilterButtonClass
                        : filledFilterButtonClass
                    }`}
                  >
                    Neste 30 dager
                  </Button>
                </div>

                <div className="space-y-2">
                  <Text as="p" variant="label">
                    Egendefinert periode
                  </Text>
                  <Calendar
                    mode="range"
                    selected={{
                      from: localFromDate ? new Date(localFromDate) : undefined,
                      to: localToDate ? new Date(localToDate) : undefined,
                    }}
                    onSelect={(range: CalendarDateRange | undefined) => {
                      setLocalFromDate(range?.from ? format(range.from, 'yyyy-MM-dd') : '');
                      setLocalToDate(range?.to ? format(range.to, 'yyyy-MM-dd') : '');
                    }}
                    numberOfMonths={1}
                    className="rounded-md border border-border bg-surface-variant-2"
                  />
                  <Button
                    onClick={handleApplyDateFilters}
                    className="h-9 w-full border border-border bg-chip-surface-active text-sm text-text-primary hover:bg-chip-surface-active-hover"
                    disabled={!localFromDate && !localToDate}
                  >
                    Bruk periode
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeQuickFilter === AppointmentPaginationQuickFilter.UPCOMING ? 'secondary' : 'outline'}
          onClick={() => handleQuickFilterClick(AppointmentPaginationQuickFilter.UPCOMING)}
          className={`h-9 rounded-full ${
            activeQuickFilter === AppointmentPaginationQuickFilter.UPCOMING
              ? activeFilledFilterButtonClass
              : filledFilterButtonClass
          }`}
        >
          Kommende
        </Button>
        <Button
          size="sm"
          variant={activeQuickFilter === AppointmentPaginationQuickFilter.TODAY ? 'secondary' : 'outline'}
          onClick={() => handleQuickFilterClick(AppointmentPaginationQuickFilter.TODAY)}
          className={`h-9 rounded-full ${
            activeQuickFilter === AppointmentPaginationQuickFilter.TODAY
              ? activeFilledFilterButtonClass
              : filledFilterButtonClass
          }`}
        >
          I dag
        </Button>
        <Button
          size="sm"
          variant={activeQuickFilter === AppointmentPaginationQuickFilter.PAST ? 'secondary' : 'outline'}
          onClick={() => handleQuickFilterClick(AppointmentPaginationQuickFilter.PAST)}
          className={`h-9 rounded-full ${
            activeQuickFilter === AppointmentPaginationQuickFilter.PAST
              ? activeFilledFilterButtonClass
              : filledFilterButtonClass
          }`}
        >
          Fullførte
        </Button>
      </div>
    </div>
  );
}
