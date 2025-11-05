import type { BrregEnhetResponse } from '~/api/brreg/types';
import { InfoCard } from '../../cards/info-card';

interface IndustryCodesSectionProps {
  brregData?: BrregEnhetResponse;
}

export function IndustryCodesSection({ brregData }: IndustryCodesSectionProps) {
  if (!brregData?.naeringskode1) {
    return null;
  }

  return (
    <InfoCard title="Næringskoder" className="md:col-span-2">
      <div className="space-y-2">
        {brregData.naeringskode1 && (
          <div>
            <span className="font-medium">{brregData.naeringskode1.kode}</span>
            <span className="text-gray-600"> - {brregData.naeringskode1.beskrivelse}</span>
          </div>
        )}
        {brregData.naeringskode2 && (
          <div>
            <span className="font-medium">{brregData.naeringskode2.kode}</span>
            <span className="text-gray-600"> - {brregData.naeringskode2.beskrivelse}</span>
          </div>
        )}
        {brregData.naeringskode3 && (
          <div>
            <span className="font-medium">{brregData.naeringskode3.kode}</span>
            <span className="text-gray-600"> - {brregData.naeringskode3.beskrivelse}</span>
          </div>
        )}
        {brregData.hjelpeenhetskode && (
          <div className="text-sm text-gray-600 mt-2">
            {brregData.hjelpeenhetskode.beskrivelse} (Yter tjenester til eget konsern)
          </div>
        )}
      </div>
    </InfoCard>
  );
}
