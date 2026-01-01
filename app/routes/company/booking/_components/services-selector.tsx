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
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Søk tjeneste…"
            value={searchFilter}
            onChange={(e) => {
              const value = e.target.value;
              setSearchFilter(value);
              handleSearchChange(value);
            }}
            className="h-8 text-sm pl-8"
          />
        </div>
      </div>

      <div className="space-y-2 h-[350px] overflow-y-auto p-4 border">
        {totalServices === 0 ? (
          <div className="py-8 text-center">
            <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchFilter ? 'Ingen tjenester funnet' : 'Ingen tjenester'}
            </p>
          </div>
        ) : (
          serviceGroups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              {/* Service Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="font-bold text-xs uppercase tracking-wide text-foreground/80">{group.name}</div>
                  <div className="text-[10px] text-muted-foreground">({group.services.length})</div>
                </div>
                {expandedGroups.has(group.id) ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {/* Services in Group */}
              {expandedGroups.has(group.id) && (
                <div className="space-y-1.5 pl-2">
                  {group.services.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          'relative group cursor-pointer rounded border p-2 transition-all',
                          'hover:shadow-sm hover:border-primary/50',
                          isSelected && 'border-primary bg-primary/5 shadow-sm',
                        )}
                        onClick={() => handleToggleService(service.id)}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          {/* Checkbox indicator */}
                          <div
                            className={cn(
                              'flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30 group-hover:border-primary/50',
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            {/* Service name */}
                            <div className="font-semibold text-xs">{service.name}</div>

                            {/* Service details */}
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-2.5 w-2.5 flex-shrink-0" />
                                <span>{formatPrice(service.price)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
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

      {selectedServiceIds.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t">
          <div className="font-medium">
            {selectedServiceIds.length} tjeneste{selectedServiceIds.length !== 1 ? 'r' : ''} valgt
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px]"
            onClick={() => selectedServiceIds.forEach((id) => onDeselectService(id))}
          >
            Fjern alle
          </Button>
        </div>
      )}
    </div>
  );
}
