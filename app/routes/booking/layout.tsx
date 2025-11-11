import { Outlet, useLoaderData, useOutletContext } from 'react-router';
import type { RootOutletContext } from '~/root';

import { getLayoutloader, type GetLayoutloaderData } from '~/features/company/get-layout';
import { CompanyRootLayout } from '~/layouts/company-root-layout';

export const loader = getLayoutloader;

export default function BookingLayout() {
  const data = useLoaderData<GetLayoutloaderData>();

  const context = useOutletContext<RootOutletContext>();

  return (
    <CompanyRootLayout data={data}>
      <Outlet context={context} />
    </CompanyRootLayout>
  );
}
