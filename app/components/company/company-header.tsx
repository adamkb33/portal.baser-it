import type { BrregEnhetResponse } from '~/api/brreg/types';
import type { CompanySummaryDto } from '~/api/clients/types';

interface CompanyHeaderProps {
  brregData?: BrregEnhetResponse;
  companyContext?: CompanySummaryDto | null;
}

export function CompanyHeader({ brregData, companyContext }: CompanyHeaderProps) {
  const name = brregData?.navn ?? companyContext?.name ?? 'Ukjent selskap';
  const orgNr = brregData?.organisasjonsnummer ?? companyContext?.orgNumber;

  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
      {orgNr && <p className="text-sm text-gray-600">Org.nr: {orgNr}</p>}
    </header>
  );
}
