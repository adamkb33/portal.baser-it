import type { BrregEnhetResponse } from '~/api/brreg/types';
import { InfoCard } from '../../cards/info-card';

interface AccountingSectionProps {
  brregData?: BrregEnhetResponse;
  className?: string;
}

export function AccountingSection({ brregData, className }: AccountingSectionProps) {
  if (!brregData) {
    return null;
  }

  return (
    <InfoCard title="Regnskap" className={className}>
      {!brregData.sisteInnsendteAarsregnskap && <p className="text-orange-600">⚠️ Ingen årsregnskap registrert</p>}
      {brregData.sisteInnsendteAarsregnskap && (
        <p className="text-green-700">✓ Siste innsendte årsregnskap: {brregData.sisteInnsendteAarsregnskap}</p>
      )}
      {brregData.fravalgRevisjonDato && (
        <p className="text-gray-700">Fravalg av revisjon: {brregData.fravalgRevisjonDato}</p>
      )}
    </InfoCard>
  );
}
