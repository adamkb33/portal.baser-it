import { useState, useEffect, useRef } from 'react';
import { Check, Mail, Phone, User, User2Icon } from 'lucide-react';
import type { UserDto } from '~/api/generated/booking';
import { Button, Input, Label, cn } from '~/ui';

type CustomerSelectorProps = {
  customers: UserDto[];
  selectedCustomerId: number | null;
  onSelectCustomer: (customer: UserDto | null) => void;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  initialSearch?: string;
};

export function CustomerSelector({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  pagination,
  onPageChange,
  onSearchChange,
  initialSearch = '',
}: CustomerSelectorProps) {
  const [searchFilter, setSearchFilter] = useState(initialSearch);
  const onSearchChangeRef = useRef(onSearchChange);
  const lastSubmittedSearchRef = useRef(initialSearch.trim());

  useEffect(() => {
    const normalizedInitialSearch = initialSearch.trim();
    if (normalizedInitialSearch === lastSubmittedSearchRef.current) return;

    // Only sync from URL/loader when it is an external state change.
    setSearchFilter(initialSearch);
    lastSubmittedSearchRef.current = normalizedInitialSearch;
  }, [initialSearch]);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    const normalizedSearch = searchFilter.trim();
    const timeoutId = setTimeout(() => {
      if (normalizedSearch === lastSubmittedSearchRef.current) return;
      lastSubmittedSearchRef.current = normalizedSearch;
      onSearchChangeRef.current(normalizedSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchFilter]);

  const formatName = (customer: UserDto) => {
    const parts = [customer.givenName, customer.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Ukjent';
  };

  const getInitials = (customer: UserDto) => {
    const first = customer.givenName?.charAt(0)?.toUpperCase() || '';
    const last = customer.familyName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  const canPreviousPage = pagination.page > 0;
  const canNextPage = pagination.page < pagination.totalPages - 1;

  return (
    <div className="space-y-3 md:space-y-4 p-2">
      <Label htmlFor="customer-search" className="flex items-center gap-2 px-1">
        <User2Icon className="h-4 w-4" />
        <span>Velg eksisterende kunde</span>
      </Label>
      <Input
        id="customer-search"
        placeholder="Søk kunde..."
        value={searchFilter}
        onChange={(e) => {
          setSearchFilter(e.target.value);
        }}
        className="h-11 text-sm md:h-10 md:text-sm"
      />

      <div className="h-96 overflow-y-auto rounded-lg border border-border bg-surface-variant-1 p-3 md:h-80 md:p-3">
        {customers.length === 0 ? (
          <div className="py-12 md:py-8 text-center">
            <User className="h-12 w-12 md:h-10 md:w-10 mx-auto text-muted-foreground/50 mb-3 md:mb-2" />
            <p className="text-sm md:text-xs text-muted-foreground">
              {searchFilter ? 'Ingen kunder funnet' : 'Ingen kunder'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-2">
            {customers.map((customer) => {
              const isSelected = customer.id === selectedCustomerId;
              return (
                <button
                  type="button"
                  key={customer.id}
                  className={cn(
                    'group min-h-24 w-full cursor-pointer rounded-md border border-border bg-background p-3 text-left transition-colors md:min-h-24 md:p-2',
                    'hover:bg-surface-variant-2',
                    'active:scale-95',
                    isSelected && 'bg-surface-variant-2 ring-1 ring-interactive/30',
                  )}
                  onClick={() => onSelectCustomer(isSelected ? null : customer)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-semibold text-xs',
                        isSelected
                          ? 'bg-interactive/15 text-interactive'
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                      )}
                    >
                      {getInitials(customer)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="truncate font-semibold text-xs">{formatName(customer)}</div>

                      <div className="min-h-9 space-y-0.5 md:min-h-8">
                        {customer.email ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        ) : null}
                        {customer.mobileNumber ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{customer.mobileNumber}</span>
                          </div>
                        ) : null}
                        {!customer.email && !customer.mobileNumber ? (
                          <div className="text-xs italic text-muted-foreground">
                            Ingen kontaktinformasjon
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        isSelected
                          ? 'border-interactive bg-interactive text-text-inverse'
                          : 'border-border bg-surface-variant-1 text-transparent',
                      )}
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t pt-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:pt-2">
        <div className="font-medium text-center md:text-left">
          Side {pagination.page + 1} av {pagination.totalPages}
          <span className="text-muted-foreground/70 ml-1">({pagination.totalElements} totalt)</span>
        </div>

        <div className="flex items-center gap-2 md:gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, pagination.page - 1))}
            disabled={!canPreviousPage}
            className="h-11 flex-1 md:h-8 md:flex-none"
          >
            Forrige
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(pagination.totalPages - 1, pagination.page + 1))}
            disabled={!canNextPage}
            className="h-11 flex-1 md:h-8 md:flex-none"
          >
            Neste
          </Button>
        </div>
      </div>
    </div>
  );
}
