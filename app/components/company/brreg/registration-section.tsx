import type { BrregEnhetResponse } from '~/api/brreg/types';
import { InfoCard } from '../../cards/info-card';
import { StatusBadge } from './status-badge';
import { DataField } from '../../fields/data-field';

interface RegistrationsSectionProps {
  brregData?: BrregEnhetResponse;
  className?: string;
}

export function RegistrationsSection({ brregData, className }: RegistrationsSectionProps) {
  if (!brregData) {
    return null;
  }

  return (
    <InfoCard title="Registreringer" className={className}>
      <dl className="space-y-3">
        <StatusBadge label="MVA-registeret" isActive={brregData.registrertIMvaregisteret ?? false} />
        <StatusBadge label="Foretaksregisteret" isActive={brregData.registrertIForetaksregisteret ?? false} />
        <StatusBadge label="Stiftelsesregisteret" isActive={brregData.registrertIStiftelsesregisteret ?? false} />
        {brregData.sisteInnsendteAarsregnskap && (
          <DataField
            label="Siste innsendte årsregnskap"
            value={brregData.sisteInnsendteAarsregnskap}
            className="font-semibold"
          />
        )}
      </dl>
    </InfoCard>
  );
}
