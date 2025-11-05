import axios from 'axios';
import { data, redirect, useLoaderData, useOutletContext, type LoaderFunctionArgs } from 'react-router';
import type { BrregEnhetResponse } from '~/api/brreg/types';
import { CompanyIndexView } from '~/components/company/company-index-view';
import { getCompanyContextSession } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { RootOutletContext } from '~/root';

export type CompanyIndexLoaderResponse = {
  brregResponse?: BrregEnhetResponse;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const companyContext = await getCompanyContextSession(request);
  if (!companyContext) {
    return redirect(ROUTES_MAP['company-context'].href);
  }

  const brregResponse = await axios.get(
    `https://data.brreg.no/enhetsregisteret/api/enheter/${companyContext.orgNumber}`,
  );

  return data<CompanyIndexLoaderResponse>({
    brregResponse: brregResponse.data,
  });
}

export default function CompanyIndex() {
  const loaderData = useLoaderData<CompanyIndexLoaderResponse>();
  console.log(loaderData);
  const { companyContext } = useOutletContext<RootOutletContext>();

  console.log(companyContext);

  return (
    <>
      <CompanyIndexView brregData={loaderData.brregResponse} />
      <div>Hvordan skal det se ut her?</div>
      <div>Oppsummering på selskapet</div>
      <div>bregg informasjon</div>
      <div>ting som mangler for regnskap</div>
      <div>Hvor mange ansatte selskapet har</div>
      <div>Hvilke produkter de har tilgang til: BOOKING?</div>
      <div></div>
    </>
  );
}
