import axios from 'axios';
import { data, redirect, useLoaderData, useOutletContext, type LoaderFunctionArgs } from 'react-router';
import type { BrregEnhetResponse } from '~/api/brreg/types';
import { AccountingSection } from '~/components/company/brreg/accounting-section';
import { AddressSection } from '~/components/company/brreg/address-section';
import { CompanyInfoSection } from '~/components/company/brreg/company-info-section';
import { CompanyStatusSection } from '~/components/company/brreg/company-status-section';
import { RegistrationsSection } from '~/components/company/brreg/registration-section';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import { PageHeader } from './_components/page-header';
import { PublicCompanyController } from '~/api/generated/identity';
import type { RootOutletContext } from '../root.layout';

export type CompanyIndexLoaderResponse = {
  brregResponse?: BrregEnhetResponse;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getAuthPayloadFromRequest(request);

  if (!auth || !auth.companyId) {
    return redirect(ROUTES_MAP['user.company-context'].href);
  }

  const company = await PublicCompanyController.publicGetCompanyById({
    path: {
      companyId: auth?.companyId ?? 0,
    },
  });

  if (!company.data?.data?.orgNumber) {
    throw new Error('Company org number is missing');
  }

  const brregResponse = await axios.get(
    `https://data.brreg.no/enhetsregisteret/api/enheter/${company.data?.data?.orgNumber}`,
  );

  return data<CompanyIndexLoaderResponse>({
    brregResponse: brregResponse.data,
  });
}

export default function CompanyIndex() {
  const loaderData = useLoaderData<CompanyIndexLoaderResponse>();
  const { companyContext } = useOutletContext<RootOutletContext>();

  return (
    <div className="flex flex-col gap-2">
      <CompanyStatusSection brregData={loaderData.brregResponse} />

      <div className="flex justify-between gap-2">
        <CompanyInfoSection brregData={loaderData.brregResponse} companyContext={companyContext} className="flex-1" />
        <RegistrationsSection brregData={loaderData.brregResponse} className="flex-1" />
      </div>

      <div className="flex gap-2">
        <AddressSection
          title="Forretningsadresse"
          brregAddress={loaderData.brregResponse?.forretningsadresse}
          fallbackAddress={companyContext?.businessAddress}
          className="max-w-1/2 flex-1"
        />
        <AccountingSection brregData={loaderData.brregResponse} className="max-w-1/2 flex-1" />
      </div>
    </div>
  );
}
