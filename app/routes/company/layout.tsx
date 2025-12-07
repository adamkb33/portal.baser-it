import { Outlet, useLoaderData, useOutletContext } from 'react-router';
import type { RootOutletContext } from '~/root';

import { companyLoader, type GetLayoutloaderData } from '~/routes/company/_features/company.loader';
import { CompanyRootLayout } from '~/layouts/company-root-layout';

export const loader = companyLoader;

export default function CompanyLayout() {
  const data = useLoaderData<GetLayoutloaderData>();

  const context = useOutletContext<RootOutletContext>();

  return (
    <CompanyRootLayout data={data}>
      <Outlet context={context} />
    </CompanyRootLayout>
  );
}
