import type { BrregEnhetResponse } from '~/api/brreg/types';
import { InfoCard } from '../../cards/info-card';

interface ContactInfoSectionProps {
  brregData?: BrregEnhetResponse;
}

export function ContactInfoSection({ brregData }: ContactInfoSectionProps) {
  const hasContactInfo = brregData?.hjemmeside || brregData?.epostadresse || brregData?.telefon;

  if (!hasContactInfo) {
    return null;
  }

  return (
    <InfoCard title="Kontaktinformasjon" className="md:col-span-2">
      <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {brregData.hjemmeside && (
          <div>
            <dt className="text-sm font-medium text-gray-600 mb-1">Hjemmeside</dt>
            <dd>
              <a
                href={`https://${brregData.hjemmeside}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {brregData.hjemmeside}
              </a>
            </dd>
          </div>
        )}
        {brregData.epostadresse && (
          <div>
            <dt className="text-sm font-medium text-gray-600 mb-1">E-post</dt>
            <dd>
              <a href={`mailto:${brregData.epostadresse}`} className="text-blue-600 hover:underline">
                {brregData.epostadresse}
              </a>
            </dd>
          </div>
        )}
        {brregData.telefon && (
          <div>
            <dt className="text-sm font-medium text-gray-600 mb-1">Telefon</dt>
            <dd className="text-gray-900">{brregData.telefon}</dd>
          </div>
        )}
      </dl>
    </InfoCard>
  );
}
