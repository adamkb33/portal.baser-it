import { Building2 } from 'lucide-react';
import type { CompanySummaryDto } from '~/api/generated/base';
import { cn } from '~/ui';

type BookingCompanyBadgeProps = {
  company?: CompanySummaryDto | null;
  className?: string;
};

export function BookingCompanyBadge({ company, className }: BookingCompanyBadgeProps) {
  const companyName = company?.name?.trim() || (company?.orgNumber ? `Org.nr ${company.orgNumber}` : null);

  if (!companyName) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-[var(--radius-booking-badge)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-subtle px-3 py-1.5 text-xs font-medium text-booking-text-muted shadow-[var(--shadow-booking-card)]',
        className,
      )}
      aria-label={`Booking hos ${companyName}`}
    >
      <Building2 className="size-3.5 shrink-0 text-booking-action" aria-hidden="true" />
      <span className="min-w-0 truncate">
        Hos <span className="text-booking-text">{companyName}</span>
      </span>
    </div>
  );
}
