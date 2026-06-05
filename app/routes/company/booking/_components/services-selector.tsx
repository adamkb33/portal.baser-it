import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, DollarSign, Search } from 'lucide-react';
import type { GroupedServiceGroupDto } from '~/api/generated/booking';
import { Button, Input, Text, cn } from '~/ui';

type ServiceSelectorProps = {
  serviceGroups: GroupedServiceGroupDto[];
  selectedServiceIds: number[];
  onSelectService: (serviceId: number) => void;
  onDeselectService: (serviceId: number) => void;
  onSearchChange: (search: string) => void;
  initialSearch?: string;
  compact?: boolean;
};

export function ServicesSelector({
  serviceGroups,
  selectedServiceIds,
  onSelectService,
  onDeselectService,
  onSearchChange,
  initialSearch = '',
  compact = false,
}: ServiceSelectorProps) {
  const [searchFilter, setSearchFilter] = useState(initialSearch);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSearchFilter(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (serviceGroups.length > 0) {
      setExpandedGroups(new Set(serviceGroups.map((group) => group.id)));
    }
  }, [serviceGroups]);

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    const timeoutId = setTimeout(() => onSearchChange(value), 300);
    return () => clearTimeout(timeoutId);
  };

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleToggleService = (serviceId: number) => {
    if (selectedServiceIds.includes(serviceId)) {
      onDeselectService(serviceId);
      return;
    }
    onSelectService(serviceId);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}t ${mins}m`;
    if (hours > 0) return `${hours}t`;
    return `${mins}m`;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const totalServices = serviceGroups.reduce((sum, group) => sum + group.services.length, 0);
  const visibleServiceIds = serviceGroups.flatMap((group) => group.services.map((service) => service.id));
  const selectedVisibleServiceIds = visibleServiceIds.filter((serviceId) => selectedServiceIds.includes(serviceId));
  const allVisibleSelected =
    visibleServiceIds.length > 0 && selectedVisibleServiceIds.length === visibleServiceIds.length;

  const handleSelectAll = () => {
    visibleServiceIds.forEach((serviceId) => {
      if (!selectedServiceIds.includes(serviceId)) {
        onSelectService(serviceId);
      }
    });
  };

  const handleClearAll = () => {
    selectedServiceIds.forEach((serviceId) => onDeselectService(serviceId));
  };

  return (
    <div className={cn('space-y-2', compact ? 'p-0' : 'p-2')}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
        <Input
          id="service-search"
          placeholder="Søk tjeneste"
          value={searchFilter}
          onChange={(event) => {
            const value = event.target.value;
            setSearchFilter(value);
            handleSearchChange(value);
          }}
          className={cn('pl-9', compact ? 'h-9 text-sm' : 'h-10 text-sm')}
        />
      </div>

      <div
        className={cn(
          'rounded-md border border-border bg-surface-variant-1',
          compact ? 'max-h-[300px] overflow-y-auto p-2' : 'max-h-[360px] overflow-y-auto p-3',
        )}
      >
        {totalServices === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
            <DollarSign className="h-5 w-5 text-text-secondary" />
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {searchFilter ? 'Ingen tjenester funnet' : 'Ingen tjenester tilgjengelig'}
            </Text>
          </div>
        ) : (
          <div className="space-y-2">
            {serviceGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-sm bg-surface-variant-2 text-left transition-colors hover:bg-surface-variant-3',
                    compact ? 'px-2 py-1.5' : 'px-3 py-2',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Text as="span" variant="label" className="text-text-primary">
                      {group.name}
                    </Text>
                    <Text as="span" variant="body-sm" className="text-text-secondary">
                      {group.services.length}
                    </Text>
                  </div>
                  {expandedGroups.has(group.id) ? (
                    <ChevronUp className="h-3.5 w-3.5 text-text-secondary" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
                  )}
                </button>

                {expandedGroups.has(group.id) ? (
                  <div className="space-y-1 pl-2">
                    {group.services.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleToggleService(service.id)}
                          className={cn(
                            'flex w-full items-start gap-2 rounded-sm border text-left transition-colors',
                            compact ? 'px-2 py-1.5' : 'px-3 py-2',
                            isSelected
                              ? 'border-border bg-surface-variant-2 text-text-primary'
                              : 'border-border bg-background text-text-primary hover:bg-surface-variant-2',
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 flex shrink-0 items-center justify-center rounded-sm border',
                              compact ? 'h-4 w-4' : 'h-4 w-4',
                              isSelected
                                ? 'border-interactive bg-interactive text-text-inverse'
                                : 'border-border bg-background text-text-secondary',
                            )}
                          >
                            {isSelected ? <Check className="h-3 w-3" /> : null}
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <Text as="p" variant="body-sm" className="text-text-primary">
                              {service.name}
                            </Text>
                            <div className="flex items-center gap-3 text-text-secondary">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <Text as="span" variant="body-sm" className="text-text-secondary">
                                  {formatPrice(service.price)}
                                </Text>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <Text as="span" variant="body-sm" className="text-text-secondary">
                                  {formatDuration(service.duration)}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {totalServices > 0 ? (
        <div className="flex items-center justify-between border-t border-border pt-2">
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {selectedVisibleServiceIds.length} valgt
          </Text>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(compact ? 'h-7 px-2 text-xs' : 'h-8 px-2 text-xs')}
              onClick={handleSelectAll}
              disabled={allVisibleSelected}
            >
              Velg alle
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(compact ? 'h-7 px-2 text-xs' : 'h-8 px-2 text-xs')}
              onClick={handleClearAll}
              disabled={selectedServiceIds.length === 0}
            >
              Fjern alle
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
