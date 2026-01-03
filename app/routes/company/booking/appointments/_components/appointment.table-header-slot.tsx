import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { Badge } from '~/components/ui/badge';
import { SlidersHorizontal, X, Search, Calendar } from 'lucide-react';
import { cn } from '~/lib/utils';

type AppointmentTableHeaderSlotProps = {
  searchFilter: string;
  onSearchChange: (value: string) => void;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  onFromDateChange: (value: string) => void;
  onFromTimeChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onToTimeChange: (value: string) => void;
  onApplyDateFilters: () => void;
  onUpcomingFilter: () => void;
  onPastFilter: () => void;
  onTodayFilter: () => void;
  onThisWeekFilter: () => void;
  onThisMonthFilter: () => void;
  onClearFilters: () => void;
  onRemoveFilter: (filterType: 'search' | 'fromDate' | 'toDate') => void;
};

export function AppointmentTableHeaderSlot({
  searchFilter,
  onSearchChange,
  fromDate,
  fromTime,
  toDate,
  toTime,
  onFromDateChange,
  onFromTimeChange,
  onToDateChange,
  onToTimeChange,
  onApplyDateFilters,
  onUpcomingFilter,
  onPastFilter,
  onTodayFilter,
  onThisWeekFilter,
  onThisMonthFilter,
  onClearFilters,
  onRemoveFilter,
}: AppointmentTableHeaderSlotProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const hasActiveFilters = fromDate || toDate || searchFilter;
  const activeFilterCount = [fromDate, toDate, searchFilter].filter(Boolean).length;

  const getActiveQuickFilter = () => {
    if (!fromDate && !toDate) return 'upcoming';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (fromDate && !toDate) {
      const fromDt = new Date(fromDate);
      if (Math.abs(fromDt.getTime() - now.getTime()) < 5000) {
        return 'upcoming';
      }
    }

    if (!fromDate && toDate) {
      const toDt = new Date(toDate);
      if (Math.abs(toDt.getTime() - now.getTime()) < 5000) {
        return 'past';
      }
    }

    if (fromDate && toDate) {
      const fromDt = new Date(fromDate);
      const toDt = new Date(toDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (fromDt.getDate() === today.getDate() && toDt.getDate() === tomorrow.getDate() - 1) {
        return 'today';
      }

      const weekStart = new Date(now);
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      weekStart.setDate(now.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      if (fromDt.getTime() === weekStart.getTime() && Math.abs(toDt.getTime() - weekEnd.getTime()) < 86400000) {
        return 'week';
      }

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      if (fromDt.getTime() === monthStart.getTime() && Math.abs(toDt.getTime() - monthEnd.getTime()) < 86400000) {
        return 'month';
      }
    }

    return null;
  };

  const activeQuickFilter = getActiveQuickFilter();

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="md:hidden space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Søk avtaler..."
            value={searchFilter}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
          {searchFilter && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => onRemoveFilter('search')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex flex-wrap gap-2">
              <FilterButton onClick={onUpcomingFilter} active={activeQuickFilter === 'upcoming'}>
                Kommende
              </FilterButton>
              <FilterButton onClick={onTodayFilter} active={activeQuickFilter === 'today'}>
                I dag
              </FilterButton>
              <FilterButton onClick={onThisWeekFilter} active={activeQuickFilter === 'week'}>
                Uke
              </FilterButton>
              <FilterButton onClick={onThisMonthFilter} active={activeQuickFilter === 'month'}>
                Måned
              </FilterButton>
              <FilterButton onClick={onPastFilter} active={activeQuickFilter === 'past'}>
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
                      onClick={() => {
                        onClearFilters();
                        setIsAdvancedOpen(false);
                      }}
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
                      value={fromDate}
                      onChange={(e) => onFromDateChange(e.target.value)}
                      className="text-sm h-11"
                    />
                    <Input
                      type="time"
                      value={fromTime}
                      onChange={(e) => onFromTimeChange(e.target.value)}
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
                      value={toDate}
                      onChange={(e) => onToDateChange(e.target.value)}
                      className="text-sm h-11"
                    />
                    <Input
                      type="time"
                      value={toTime}
                      onChange={(e) => onToTimeChange(e.target.value)}
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
                <Button
                  onClick={() => {
                    onApplyDateFilters();
                    setIsAdvancedOpen(false);
                  }}
                  className="w-full h-12 text-base font-semibold"
                >
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
              <ActiveFilterChip onRemove={() => onRemoveFilter('search')}>
                Søk: {searchFilter.slice(0, 15)}
                {searchFilter.length > 15 && '...'}
              </ActiveFilterChip>
            )}
            {fromDate && (
              <ActiveFilterChip onRemove={() => onRemoveFilter('fromDate')}>Fra: {fromDate}</ActiveFilterChip>
            )}
            {toDate && <ActiveFilterChip onRemove={() => onRemoveFilter('toDate')}>Til: {toDate}</ActiveFilterChip>}
          </div>
        )}
      </div>

      <div className="hidden md:block space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Søk på tjenestenavn eller gruppe…"
            value={searchFilter}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeQuickFilter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={onUpcomingFilter}
            className="h-8"
          >
            Kommende
          </Button>
          <Button
            variant={activeQuickFilter === 'past' ? 'default' : 'outline'}
            size="sm"
            onClick={onPastFilter}
            className="h-8"
          >
            Tidligere
          </Button>
          <Button
            variant={activeQuickFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={onTodayFilter}
            className="h-8"
          >
            I dag
          </Button>
          <Button
            variant={activeQuickFilter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={onThisWeekFilter}
            className="h-8"
          >
            Denne uken
          </Button>
          <Button
            variant={activeQuickFilter === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={onThisMonthFilter}
            className="h-8"
          >
            Denne måneden
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 text-destructive">
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
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
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
              value={fromTime}
              onChange={(e) => onFromTimeChange(e.target.value)}
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
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
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
              value={toTime}
              onChange={(e) => onToTimeChange(e.target.value)}
              className="w-[100px] h-9"
            />
          </div>

          <Button onClick={onApplyDateFilters} size="sm" className="h-9">
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
