import type { BrregEnhetResponse } from '~/api/brreg/types';
import type { CompanySummaryDto } from '~/api/clients/types';
import { InfoCard } from '../../cards/info-card';
import { DataField } from '../../fields/data-field';

interface CompanyInfoSectionProps {
  brregData?: BrregEnhetResponse;
  companyContext?: CompanySummaryDto | null;
  className?: string;
}

export function CompanyInfoSection({ brregData, companyContext, className }: CompanyInfoSectionProps) {
  const { organisasjonsform, stiftelsesdato, registreringsdatoEnhetsregisteret, antallAnsatte } = brregData || {};
  const orgType = organisasjonsform?.beskrivelse ?? companyContext?.organizationType?.description;

  return (
    <InfoCard title="Selskaps informasjon" className={className}>
      <DataField label="Organisasjonsform" value={orgType} />
      {stiftelsesdato && <DataField label="Stiftelsesdato" value={stiftelsesdato} />}
      {registreringsdatoEnhetsregisteret && (
        <DataField label="Registrert i Enhetsregisteret" value={registreringsdatoEnhetsregisteret} />
      )}
      {antallAnsatte !== undefined && <DataField label="Antall ansatte" value={antallAnsatte} />}
    </InfoCard>
  );
}
