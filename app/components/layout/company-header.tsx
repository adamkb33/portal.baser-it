import { Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { ROUTES_MAP } from '~/lib/route-tree';
import { cn } from '@/lib/utils';

type CompanyHeaderProps = {
  company?: CompanySummaryDto | null;
  className?: string;
};

export default function CompanyHeader({ company, className }: CompanyHeaderProps) {
  if (company === null) {
    return null;
  }

  if (company === undefined) {
    return (
      <Link
        to={ROUTES_MAP['user.company-context'].href}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 border-l-2 border-border',
          'hover:border-primary hover:bg-accent/10 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
          className,
        )}
      >
        <div className="hidden md:flex h-10 w-10 items-center justify-center rounded bg-muted shrink-0 transition-colors duration-200 group-hover:bg-accent/20">
          <Building2 className="h-5 w-5 text-primary" />
        </div>

        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
          Logg inn i ditt selskap
        </span>

        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </Link>
    );
  }

  return (
    <Link
      to={ROUTES_MAP['company'].href}
      className={cn(
        'group flex items-center gap-3 px-4 py-3 border-l-2 border-secondary/30',
        'hover:border-primary hover:bg-accent/10 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
        className,
      )}
    >
      <div className="md:hidden flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary font-bold text-base shrink-0 uppercase transition-all duration-200 group-hover:bg-primary/20 group-hover:scale-105">
        {company.name?.charAt(0) || 'B'}
      </div>

      <div className="hidden md:flex h-10 w-10 items-center justify-center rounded bg-secondary/15 shrink-0 transition-all duration-200 group-hover:bg-secondary/25 group-hover:scale-105">
        <Building2 className="h-5 w-5 text-secondary" />
      </div>

      <div className="hidden md:flex flex-col min-w-0 gap-0.5">
        <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
          {company.name}
        </div>

        <div className="text-xs font-medium text-muted-foreground">Org. {company.orgNumber}</div>
      </div>

      <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
    </Link>
  );
}
