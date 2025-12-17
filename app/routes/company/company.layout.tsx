import axios from 'axios';
import { data, Outlet, redirect, useOutletContext, type LoaderFunctionArgs } from 'react-router';
import { NavBreadcrumbs } from '~/components/layout/nav-breadcrums';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { RootOutletContext } from '~/root';
import type { CompanyIndexLoaderResponse } from './company.route';

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getAuthPayloadFromRequest(request);

  if (!auth) {
    return redirect('/');
  }
}

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="space-y-4">
      <NavBreadcrumbs items={context.userNav?.SIDEBAR} />

      <div className="border border-border bg-background p-2 sm:p-6 space-y-4">
        <Outlet context={context} />
      </div>
    </div>
  );
}
