import type { BrregEnhetResponse } from '~/api/brreg/types';
import { InfoCard } from '../../cards/info-card';

interface AccountingSectionProps {
  brregData?: BrregEnhetResponse;
}

export function AccountingSection({ brregData }: AccountingSectionProps) {
  if (!brregData) {
    return null;
  }

  return (
    <div className="space-y-2">
      {!brregData.sisteInnsendteAarsregnskap && <p className="text-orange-600">⚠️ Ingen årsregnskap registrert</p>}
      {brregData.sisteInnsendteAarsregnskap && (
        <p className="text-green-700">✓ Siste innsendte årsregnskap: {brregData.sisteInnsendteAarsregnskap}</p>
      )}
      {brregData.fravalgRevisjonDato && (
        <p className="text-gray-700">Fravalg av revisjon: {brregData.fravalgRevisjonDato}</p>
      )}
    </div>
  );
}
