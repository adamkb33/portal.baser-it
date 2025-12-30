import { Outlet, redirect, useOutletContext, type LoaderFunctionArgs } from 'react-router';
import { NavBreadcrumbs } from '~/components/layout/nav-breadcrums';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import type { RootOutletContext } from '~/root';

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getAuthPayloadFromRequest(request);
  console.log(auth);

  if (!auth) {
    return redirect('/');
  }
}

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="space-y-4">
      <NavBreadcrumbs items={context.userNav?.SIDEBAR} />

      <Outlet context={context} />
    </div>
  );
}
