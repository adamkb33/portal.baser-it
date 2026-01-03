import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { Badge } from '~/components/ui/badge';
import { SlidersHorizontal, X, Search, Calendar } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useNavigate, useSearchParams } from 'react-router';
import { AppointmentPaginationService } from '../_services/appointment.pagination-service';

export function AppointmentTableHeaderSlot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const paginationService = new AppointmentPaginationService(searchParams, navigate);

  // Derive everything from URL
  const fromDateTime = searchParams.get('fromDateTime') || '';
  const toDateTime = searchParams.get('toDateTime') || '';
  const searchFilter = searchParams.get('search') || '';

  const fromDate = fromDateTime ? new Date(fromDateTime).toISOString().split('T')[0] : '';
  const fromTime = fromDateTime ? new Date(fromDateTime).toTimeString().slice(0, 5) : '';
  const toDate = toDateTime ? new Date(toDateTime).toISOString().split('T')[0] : '';
  const toTime = toDateTime ? new Date(toDateTime).toTimeString().slice(0, 5) : '';

  // Local state for form inputs (before applying)
  const [localFromDate, setLocalFromDate] = useState(fromDate);
  const [localFromTime, setLocalFromTime] = useState(fromTime);
  const [localToDate, setLocalToDate] = useState(toDate);
  const [localToTime, setLocalToTime] = useState(toTime);

  const hasActiveFilters = fromDate || toDate || searchFilter;
  const activeFilterCount = [fromDate, toDate, searchFilter].filter(Boolean).length;

  const handleApplyDateFilters = () => {
    paginationService.applyDateFilters(localFromDate, localFromTime, localToDate, localToTime);
    setIsAdvancedOpen(false);
  };

  const handleClearFilters = () => {
    setLocalFromDate('');
    setLocalFromTime('');
    setLocalToDate('');
    setLocalToTime('');
    paginationService.handleClearFilters();
    setIsAdvancedOpen(false);
  };

  const activeQuickFilter = paginationService.getActiveQuickFilter(fromDate, toDate);

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="md:hidden space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Søk avtaler..."
            value={searchFilter}
            onChange={(e) => paginationService.handleSearchChange(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
          {searchFilter && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => paginationService.handleRemoveFilter('search')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex flex-wrap gap-2">
              <FilterButton onClick={paginationService.handleUpcomingFilter} active={activeQuickFilter === 'upcoming'}>
                Kommende
              </FilterButton>
              <FilterButton onClick={paginationService.handleTodayFilter} active={activeQuickFilter === 'today'}>
                I dag
              </FilterButton>
              <FilterButton onClick={paginationService.handleThisWeekFilter} active={activeQuickFilter === 'week'}>
                Uke
              </FilterButton>
              <FilterButton onClick={paginationService.handleThisMonthFilter} active={activeQuickFilter === 'month'}>
                Måned
              </FilterButton>
              <FilterButton onClick={paginationService.handlePastFilter} active={activeQuickFilter === 'past'}>
                Tidligere
              </FilterButton>
            </div>
          </div>

          <Sheet open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'shrink-0 h-9 w-9 p-0 relative',
                  activeQuickFilter === null && hasActiveFilters && 'border-primary bg-primary/5',
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeQuickFilter === null && activeFilterCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
              <SheetHeader className="px-4 py-4 border-b shrink-0 bg-background">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-base">Avanserte filtre</SheetTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-8 text-xs text-destructive"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Nullstill
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Fra</Label>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      type="date"
                      value={localFromDate}
                      onChange={(e) => setLocalFromDate(e.target.value)}
                      className="text-sm h-11"
                    />
                    <Input
                      type="time"
                      value={localFromTime}
                      onChange={(e) => setLocalFromTime(e.target.value)}
                      className="text-sm h-11 w-24"
                      placeholder="00:00"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Til</Label>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      type="date"
                      value={localToDate}
                      onChange={(e) => setLocalToDate(e.target.value)}
                      className="text-sm h-11"
                    />
                    <Input
                      type="time"
                      value={localToTime}
                      onChange={(e) => setLocalToTime(e.target.value)}
                      className="text-sm h-11 w-24"
                      placeholder="23:59"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aktive filtre</p>
                    <div className="space-y-1.5">
                      {fromDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fra:</span>
                          <span className="font-medium">
                            {fromDate} {fromTime && `kl. ${fromTime}`}
                          </span>
                        </div>
                      )}
                      {toDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Til:</span>
                          <span className="font-medium">
                            {toDate} {toTime && `kl. ${toTime}`}
                          </span>
                        </div>
                      )}
                      {searchFilter && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Søk:</span>
                          <span className="font-medium truncate max-w-[180px]">{searchFilter}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 p-4 border-t bg-background space-y-2 safe-area-inset-bottom">
                <Button onClick={handleApplyDateFilters} className="w-full h-12 text-base font-semibold">
                  Bruk filtre
                  {activeFilterCount > 0 && ` (${activeFilterCount})`}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {activeQuickFilter === null && hasActiveFilters && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {searchFilter && (
              <ActiveFilterChip onRemove={() => paginationService.handleRemoveFilter('search')}>
                Søk: {searchFilter.slice(0, 15)}
                {searchFilter.length > 15 && '...'}
              </ActiveFilterChip>
            )}
            {fromDate && (
              <ActiveFilterChip onRemove={() => paginationService.handleRemoveFilter('fromDate')}>
                Fra: {fromDate}
              </ActiveFilterChip>
            )}
            {toDate && (
              <ActiveFilterChip onRemove={() => paginationService.handleRemoveFilter('toDate')}>
                Til: {toDate}
              </ActiveFilterChip>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Søk på tjenestenavn eller gruppe…"
            value={searchFilter}
            onChange={(e) => paginationService.handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeQuickFilter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={paginationService.handleUpcomingFilter}
            className="h-8"
          >
            Kommende
          </Button>
          <Button
            variant={activeQuickFilter === 'past' ? 'default' : 'outline'}
            size="sm"
            onClick={paginationService.handlePastFilter}
            className="h-8"
          >
            Tidligere
          </Button>
          <Button
            variant={activeQuickFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={paginationService.handleTodayFilter}
            className="h-8"
          >
            I dag
          </Button>
          <Button
            variant={activeQuickFilter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={paginationService.handleThisWeekFilter}
            className="h-8"
          >
            Denne uken
          </Button>
          <Button
            variant={activeQuickFilter === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={paginationService.handleThisMonthFilter}
            className="h-8"
          >
            Denne måneden
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 text-destructive">
              <X className="h-4 w-4 mr-1.5" />
              Nullstill filtre
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fromDate" className="text-xs text-muted-foreground">
              Fra dato
            </Label>
            <Input
              id="fromDate"
              type="date"
              value={localFromDate}
              onChange={(e) => setLocalFromDate(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fromTime" className="text-xs text-muted-foreground">
              Fra tid
            </Label>
            <Input
              id="fromTime"
              type="time"
              value={localFromTime}
              onChange={(e) => setLocalFromTime(e.target.value)}
              className="w-[100px] h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="toDate" className="text-xs text-muted-foreground">
              Til dato
            </Label>
            <Input
              id="toDate"
              type="date"
              value={localToDate}
              onChange={(e) => setLocalToDate(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="toTime" className="text-xs text-muted-foreground">
              Til tid
            </Label>
            <Input
              id="toTime"
              type="time"
              value={localToTime}
              onChange={(e) => setLocalToTime(e.target.value)}
              className="w-[100px] h-9"
            />
          </div>

          <Button onClick={handleApplyDateFilters} size="sm" className="h-9">
            Bruk filtre
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  children,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Button variant={active ? 'default' : 'muted'} size="sm" onClick={onClick} className="whitespace-nowrap shrink-0">
      {children}
    </Button>
  );
}

function ActiveFilterChip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary pl-3 pr-1 py-1 text-xs font-medium whitespace-nowrap shrink-0">
      <span className="truncate max-w-[120px]">{children}</span>
      <button
        onClick={onRemove}
        className="h-6 w-6 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors"
        aria-label="Fjern filter"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
