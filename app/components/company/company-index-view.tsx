import type { BrregEnhetResponse } from '~/api/brreg/types';
import type { CompanySummaryDto } from '~/api/clients/types';
import { CompanyHeader } from './company-header';
import { CompanyStatusSection } from './brreg/company-status-section';
import { CompanyInfoSection } from './brreg/company-info-section';
import { RegistrationsSection } from './brreg/registration-section';
import { AddressSection } from './brreg/address-section';
import { IndustryCodesSection } from './brreg/industry-code-section';
import { ContactInfoSection } from './brreg/contact-info-section';
import { AccountingSection } from './brreg/accounting-section';
import { ProductAccessSection } from './company-products-section';

interface CompanyIndexViewProps {
  brregData?: BrregEnhetResponse;
  companyContext?: CompanySummaryDto | null;
}

export function CompanyIndexView({ brregData, companyContext }: CompanyIndexViewProps) {
  return (
    <div className="leading-tight text-sm">
      {/* Optional header if you want it at the top */}
      {/* <CompanyHeader brregData={brregData} companyContext={companyContext} /> */}

      {/* Status (compact) */}
      {brregData && (
        <div className="mb-2">
          <CompanyStatusSection brregData={brregData} />
        </div>
      )}

      {/* Dense grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 auto-rows-min">
        <CompanyInfoSection brregData={brregData} companyContext={companyContext} />
        <RegistrationsSection brregData={brregData} />

        {/* Group addresses together to save a grid cell and vertical space */}
        <div className="space-y-2">
          <AddressSection
            title="Forretningsadresse"
            brregAddress={brregData?.forretningsadresse}
            fallbackAddress={companyContext?.businessAddress}
          />
          <AddressSection
            title="Postadresse"
            brregAddress={brregData?.postadresse}
            fallbackAddress={companyContext?.postalAddress}
          />
        </div>

        {/* Group industry + contact */}
        <div className="space-y-2">
          <IndustryCodesSection brregData={brregData} />
          <ContactInfoSection brregData={brregData} />
        </div>

        <AccountingSection brregData={brregData} />
        <ProductAccessSection />
      </div>
    </div>
  );
}
