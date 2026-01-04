import { Outlet, redirect, useOutletContext, type LoaderFunctionArgs } from 'react-router';
import { SidebarBreadcrumbs } from '~/components/layout/sidebar-breadcrums';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import type { RootOutletContext } from '~/root';

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getAuthPayloadFromRequest(request);

  if (!auth) {
    return redirect('/');
  }
}

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 md:px-6 md:py-4">
          <SidebarBreadcrumbs items={context.userNav?.SIDEBAR} />
        </div>
      </header>

      <main className="flex-1 container mx-auto p-2 md:px-6 md:py-6 lg:py-8">
        <Outlet context={context} />
      </main>
    </div>
  );
}
