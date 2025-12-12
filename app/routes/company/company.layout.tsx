import { Outlet, useOutletContext } from 'react-router';
import type { RootOutletContext } from '~/root';
import { RoutePlaceMent } from '~/lib/route-tree';

import { CompanyRootLayout } from '~/layouts/company-root-layout';

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  const sidebarBranches = context.userNav?.[RoutePlaceMent.SIDEBAR] || [];

  return (
    <CompanyRootLayout data={{ userBranches: sidebarBranches }}>
      <Outlet context={context} />
    </CompanyRootLayout>
  );
}
