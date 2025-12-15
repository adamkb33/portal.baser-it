import { Outlet, useOutletContext } from 'react-router';
import { NavBreadcrumbs } from '~/components/layout/nav-breadcrums';
import type { RootOutletContext } from '~/root';

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="space-y-4">
      <NavBreadcrumbs items={context.userNav?.SIDEBAR} />

      <div className="border border-border bg-background p-4 sm:p-5 rounded-none">
        <Outlet context={context} />
      </div>
    </div>
  );
}
