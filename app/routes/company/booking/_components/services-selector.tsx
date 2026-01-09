import { useState, useEffect } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Check, Clock, DollarSign, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { GroupedServiceGroupDto } from '~/api/generated/booking';

type ServiceSelectorProps = {
  serviceGroups: GroupedServiceGroupDto[];
  selectedServiceIds: number[];
  onSelectService: (serviceId: number) => void;
  onDeselectService: (serviceId: number) => void;
  onSearchChange: (search: string) => void;
  initialSearch?: string;
};

export function ServicesSelector({
  serviceGroups,
  selectedServiceIds,
  onSelectService,
  onDeselectService,
  onSearchChange,
  initialSearch = '',
}: ServiceSelectorProps) {
  const [searchFilter, setSearchFilter] = useState(initialSearch);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSearchFilter(initialSearch);
  }, [initialSearch]);

  // Auto-expand all groups on mount and when search changes
  useEffect(() => {
    if (serviceGroups.length > 0) {
      setExpandedGroups(new Set(serviceGroups.map((g) => g.id)));
    }
  }, [serviceGroups]);

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}t ${mins}m`;
    if (hours > 0) return `${hours}t`;
    return `${mins}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleToggleService = (serviceId: number) => {
    if (selectedServiceIds.includes(serviceId)) {
      onDeselectService(serviceId);
    } else {
      onSelectService(serviceId);
    }
  };

  const totalServices = serviceGroups?.reduce((acc, group) => acc + group.services.length, 0);

  return (
    <div className="space-y-3 md:space-y-2">
      {/* Search - Touch-friendly */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Søk tjeneste…"
            value={searchFilter}
            onChange={(e) => {
              const value = e.target.value;
              setSearchFilter(value);
              handleSearchChange(value);
            }}
            className="h-11 text-sm md:h-10 md:text-base"
          />
        </div>
      </div>

      {/* Service List - Responsive height */}
      <div className="space-y-2.5 md:space-y-2 h-[450px] md:h-[350px] overflow-y-auto p-3 md:p-4 border rounded-lg">
        {totalServices === 0 ? (
          <div className="py-12 md:py-8 text-center">
            <DollarSign className="h-12 w-12 md:h-10 md:w-10 mx-auto text-muted-foreground/50 mb-3 md:mb-2" />
            <p className="text-sm md:text-xs text-muted-foreground">
              {searchFilter ? 'Ingen tjenester funnet' : 'Ingen tjenester'}
            </p>
          </div>
        ) : (
          serviceGroups.map((group) => (
            <div key={group.id} className="space-y-2 md:space-y-1.5">
              {/* Group Header - Touch target */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-3 md:p-2 hover:bg-muted/50 rounded-lg transition-colors min-h-[44px] md:min-h-0"
              >
                <div className="flex items-center gap-2.5 md:gap-2">
                  <div className="font-bold text-sm md:text-xs uppercase tracking-wide text-foreground/80">
                    {group.name}
                  </div>
                  <div className="text-xs md:text-[10px] text-muted-foreground">({group.services.length})</div>
                </div>
                {expandedGroups.has(group.id) ? (
                  <ChevronUp className="h-4 w-4 md:h-3.5 md:w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 md:h-3.5 md:w-3.5 text-muted-foreground" />
                )}
              </button>

              {/* Services in Group */}
              {expandedGroups.has(group.id) && (
                <div className="space-y-2 md:space-y-1.5 pl-2 md:pl-2">
                  {group.services.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          'relative group cursor-pointer rounded-lg border p-3 md:p-2 transition-all',
                          'hover:shadow-sm hover:border-primary/50',
                          'active:scale-[0.98]', // Mobile tap feedback
                          isSelected && 'border-primary bg-primary/5 shadow-sm',
                        )}
                        onClick={() => handleToggleService(service.id)}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 md:-top-1.5 md:-right-1.5 bg-primary text-primary-foreground rounded-full p-1 md:p-0.5">
                            <Check className="h-3 w-3 md:h-2.5 md:w-2.5" />
                          </div>
                        )}

                        <div className="flex items-start gap-3 md:gap-2">
                          {/* Checkbox - Touch-friendly */}
                          <div
                            className={cn(
                              'flex-shrink-0 h-5 w-5 md:h-4 md:w-4 rounded border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30 group-hover:border-primary/50',
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 md:h-2.5 md:w-2.5 text-primary-foreground" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1 md:space-y-0.5">
                            {/* Service name - Readable */}
                            <div className="font-semibold text-sm md:text-xs">{service.name}</div>

                            {/* Service details - Minimum 14px mobile */}
                            <div className="flex items-center gap-3 md:gap-3 text-xs md:text-[10px] text-muted-foreground">
                              <div className="flex items-center gap-1.5 md:gap-1">
                                <DollarSign className="h-3.5 w-3.5 md:h-2.5 md:w-2.5 flex-shrink-0" />
                                <span>{formatPrice(service.price)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 md:gap-1">
                                <Clock className="h-3.5 w-3.5 md:h-2.5 md:w-2.5 flex-shrink-0" />
                                <span>{formatDuration(service.duration)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer - Mobile stacks */}
      {selectedServiceIds.length > 0 && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs md:text-[10px] text-muted-foreground pt-3 md:pt-1.5 border-t">
          <div className="font-medium text-center md:text-left">
            {selectedServiceIds.length} tjeneste{selectedServiceIds.length !== 1 ? 'r' : ''} valgt
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full md:w-auto h-11 md:h-7 text-sm md:text-[10px]"
            onClick={() => selectedServiceIds.forEach((id) => onDeselectService(id))}
          >
            Fjern alle
          </Button>
        </div>
      )}
    </div>
  );
}
