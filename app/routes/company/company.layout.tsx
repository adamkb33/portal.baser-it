import { Outlet, useOutletContext } from 'react-router';
import { NavBreadcrumbs } from '~/components/layout/nav-breadcrums';
import type { RootOutletContext } from '~/root';

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <NavBreadcrumbs items={context.userNav?.SIDEBAR} />
      <Outlet context={context} />
    </div>
  );
}
