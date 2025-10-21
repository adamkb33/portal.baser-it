import { Building2 } from 'lucide-react';
import type { CompanySummaryDto } from 'tmp/openapi/gen/identity';

type CompanyHeaderProps = {
  company?: CompanySummaryDto | null;
};

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  if (!company) return null;

  return (
    <div className="flex items-center gap-2 pl-4 md:pl-6 border-l">
      {/* Mobile: Just the first letter */}
      <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 font-semibold text-sm shrink-0">
        {company.name.charAt(0).toUpperCase()}
      </div>

      {/* Desktop: Full info with icon */}
      <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 shrink-0">
        <Building2 className="h-4 w-4" />
      </div>
      <div className="hidden md:block min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">{company.name}</div>
        <div className="text-xs text-slate-500">Org. {company.orgNumber}</div>
      </div>
    </div>
  );
}
