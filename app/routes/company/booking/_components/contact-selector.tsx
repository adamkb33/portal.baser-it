import { useState, useEffect } from 'react';
import type { ContactDto } from 'tmp/openapi/gen/base';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Check, ChevronLeft, ChevronRight, Mail, Phone, Plus, User } from 'lucide-react';
import { cn } from '~/lib/utils';
import { ContactFormDialog } from '../../admin/contacts/_components/contact.form-dialog';

type ContactSelectorProps = {
  contacts: ContactDto[];
  selectedContactId: number | null;
  onSelectContact: (contact: ContactDto) => void;
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

export function ContactSelector({
  contacts,
  selectedContactId,
  onSelectContact,
  pagination,
  onPageChange,
  onSearchChange,
  initialSearch = '',
}: ContactSelectorProps) {
  const [searchFilter, setSearchFilter] = useState(initialSearch);

  useEffect(() => {
    setSearchFilter(initialSearch);
  }, [initialSearch]);

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const formatName = (contact: ContactDto) => {
    const parts = [contact.givenName, contact.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Ukjent';
  };

  const getInitials = (contact: ContactDto) => {
    const first = contact.givenName?.charAt(0)?.toUpperCase() || '';
    const last = contact.familyName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  const canPreviousPage = pagination.page > 0;
  const canNextPage = pagination.page < pagination.totalPages - 1;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Søk kontakt…"
          value={searchFilter}
          onChange={(e) => {
            const value = e.target.value;
            setSearchFilter(value);
            handleSearchChange(value);
          }}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5 h-[350px] overflow-y-auto p-4 border">
        {contacts.length === 0 ? (
          <div className="py-8 text-center">
            <User className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchFilter ? 'Ingen kontakter funnet' : 'Ingen kontakter'}
            </p>
          </div>
        ) : (
          contacts.map((contact) => {
            const isSelected = contact.id === selectedContactId;
            return (
              <div
                key={contact.id}
                className={cn(
                  'relative group cursor-pointer rounded border p-2 transition-all',
                  'hover:shadow-sm hover:border-primary/50',
                  isSelected && 'border-primary bg-primary/5 shadow-sm',
                )}
                onClick={() => onSelectContact(contact)}
              >
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}

                <div className="flex items-start gap-2">
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                    )}
                  >
                    {getInitials(contact)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    {/* Name */}
                    <div className="font-semibold text-xs truncate">{formatName(contact)}</div>

                    {/* Contact details */}
                    <div className="space-y-0.5">
                      {contact.email?.value && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Mail className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{contact.email.value}</span>
                        </div>
                      )}
                      {contact.mobileNumber?.value && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{contact.mobileNumber.value}</span>
                        </div>
                      )}
                      {!contact.email?.value && !contact.mobileNumber?.value && (
                        <div className="text-[10px] text-muted-foreground italic">Ingen kontaktinfo</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t">
        <ContactFormDialog
          trigger={
            <Button variant="outline" size="sm" className="h-8 px-2">
              Legg til kontakt
            </Button>
          }
        />
        <div className="font-medium">
          Side {pagination.page + 1} av {pagination.totalPages}
          <span className="text-muted-foreground/70 ml-1">({pagination.totalElements} totalt)</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!canPreviousPage}
          >
            Forrige side
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={!canNextPage}>
            Neste side
          </Button>
        </div>
      </div>
    </div>
  );
}
