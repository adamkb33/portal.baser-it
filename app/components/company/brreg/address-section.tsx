import type { BrregEnhetResponse } from '~/api/brreg/types';
import type { CompanySummaryDto } from '~/api/clients/types';
import { InfoCard } from '../../cards/info-card';

interface AddressSectionProps {
  title: string;
  brregAddress?: BrregEnhetResponse['forretningsadresse'] | BrregEnhetResponse['postadresse'];
  fallbackAddress?: CompanySummaryDto['businessAddress'] | CompanySummaryDto['postalAddress'];
  className?: string;
}

export function AddressSection({ title, brregAddress, fallbackAddress, className }: AddressSectionProps) {
  if (!brregAddress && !fallbackAddress) {
    return null;
  }

  return (
    <InfoCard title={title} className={className}>
      <address className="not-italic text-gray-900">
        {brregAddress?.adresse?.map((line, idx) => <div key={idx}>{line}</div>) || (
          <div>{fallbackAddress?.addressLines}</div>
        )}
        <div>
          {brregAddress?.postnummer || fallbackAddress?.postalCode} {brregAddress?.poststed || fallbackAddress?.city}
        </div>
        {brregAddress?.kommune && <div className="text-sm text-gray-600 mt-1">{brregAddress.kommune}</div>}
      </address>
    </InfoCard>
  );
}
