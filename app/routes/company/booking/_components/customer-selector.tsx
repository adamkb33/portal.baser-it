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
  const hasMountedRef = useRef(false);

  useEffect(() => {
    setSearchFilter(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeoutId = setTimeout(() => {
      onSearchChangeRef.current(searchFilter.trim());
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

      <div className="space-y-2 md:space-y-1.5 h-[450px] md:h-[350px] overflow-y-auto rounded-lg border border-border bg-primary p-3 md:p-4">
        {customers.length === 0 ? (
          <div className="py-12 md:py-8 text-center">
            <User className="h-12 w-12 md:h-10 md:w-10 mx-auto text-muted-foreground/50 mb-3 md:mb-2" />
            <p className="text-sm md:text-xs text-muted-foreground">
              {searchFilter ? 'Ingen kunder funnet' : 'Ingen kunder'}
            </p>
          </div>
        ) : (
          customers.map((customer) => {
            const isSelected = customer.id === selectedCustomerId;
            return (
              <button
                type="button"
                key={customer.id}
                className={cn(
                  'group cursor-pointer rounded-md border border-border bg-background p-3 transition-colors md:p-2.5',
                  'hover:bg-surface',
                  'active:scale-[0.98]',
                  isSelected && 'bg-surface ring-1 ring-interactive/30',
                )}
                onClick={() => onSelectCustomer(isSelected ? null : customer)}
              >
                <div className="flex items-start justify-between gap-3 md:gap-2.5">
                  <div
                    className={cn(
                      'flex-shrink-0 h-10 w-10 md:h-8 md:w-8 rounded-full flex items-center justify-center font-semibold text-sm md:text-xs',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                    )}
                  >
                    {getInitials(customer)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 md:space-y-0.5">
                    <div className="font-semibold text-sm md:text-xs truncate">{formatName(customer)}</div>

                    <div className="space-y-1 md:space-y-0.5">
                      {customer.email ? (
                        <div className="flex items-center gap-2 md:gap-1.5 text-xs md:text-[10px] text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 md:h-2.5 md:w-2.5 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      ) : null}
                      {customer.mobileNumber ? (
                        <div className="flex items-center gap-2 md:gap-1.5 text-xs md:text-[10px] text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 md:h-2.5 md:w-2.5 flex-shrink-0" />
                          <span className="truncate">{customer.mobileNumber}</span>
                        </div>
                      ) : null}
                      {!customer.email && !customer.mobileNumber ? (
                        <div className="text-xs md:text-[10px] text-muted-foreground italic">
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
                        : 'border-border bg-background text-transparent',
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs md:text-[10px] text-muted-foreground pt-3 md:pt-1.5 border-t">
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
