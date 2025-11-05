import type { BrregEnhetResponse } from '~/api/brreg/types';
import type { CompanySummaryDto } from '~/api/clients/types';
import { InfoCard } from '../../cards/info-card';
import { DataField } from '../../fields/data-field';

interface CompanyInfoSectionProps {
  brregData?: BrregEnhetResponse;
  companyContext?: CompanySummaryDto | null;
}

export function CompanyInfoSection({ brregData, companyContext }: CompanyInfoSectionProps) {
  const { organisasjonsform, stiftelsesdato, registreringsdatoEnhetsregisteret, antallAnsatte } = brregData || {};
  const orgType = organisasjonsform?.beskrivelse ?? companyContext?.organizationType?.description;

  return (
    <InfoCard title="Selskapsinfo">
      <dl className="space-y-1 text-sm">
        <DataField label="Organisasjonsform" value={orgType} />
        {stiftelsesdato && <DataField label="Stiftelsesdato" value={stiftelsesdato} />}
        {registreringsdatoEnhetsregisteret && (
          <DataField label="Registrert i Enhetsregisteret" value={registreringsdatoEnhetsregisteret} />
        )}
        {antallAnsatte !== undefined && (
          <div>
            <dt className="text-xs font-medium text-gray-600">Antall ansatte</dt>
            <dd className="text-xs text-gray-900 font-semibold">{antallAnsatte}</dd>
          </div>
        )}
      </dl>
    </InfoCard>
  );
}
