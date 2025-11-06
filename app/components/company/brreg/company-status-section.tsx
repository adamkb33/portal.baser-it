import type { BrregEnhetResponse } from '~/api/brreg/types';
import { AlertBanner } from '../../banners/alert-banner';

interface CompanyStatusSectionProps {
  brregData: BrregEnhetResponse | undefined;
}

export function CompanyStatusSection({ brregData }: CompanyStatusSectionProps) {
  const hasAlerts = brregData?.konkurs || brregData?.underAvvikling;

  if (!hasAlerts) {
    return null;
  }

  return (
    <div className="space-y-2">
      {brregData.konkurs && (
        <AlertBanner
          variant="error"
          title="⚠️ Selskapet er konkurs"
          description={brregData.konkursdato ? `Konkursdato: ${brregData.konkursdato}` : undefined}
        />
      )}
      {brregData.underAvvikling && (
        <AlertBanner
          variant="warning"
          title="Selskapet er under avvikling"
          description={brregData.underAvviklingDato ? `Dato: ${brregData.underAvviklingDato}` : undefined}
        />
      )}
    </div>
  );
}
