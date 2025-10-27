import { data, Outlet, redirect, useLoaderData, useOutletContext, type LoaderFunctionArgs } from 'react-router';
import { NavLink, type NavItem } from '~/components/layout/nav-link';
import { BreadcrumbList } from '~/components/ui/breadcrumb';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { Access, ROUTE_TREE, type RouteBranch } from '~/lib/nav/route-tree';
import type { RootOutletContext } from '~/root';

export type CompanyLoaderData = { userBranches: RouteBranch[] | undefined };

export async function loader({ request }: LoaderFunctionArgs) {
  const authPayload = await getAuthPayloadFromRequest(request);

  if (!authPayload || authPayload.companyRoles.length === 0) {
    return redirect('/');
  }

  const roleAccessBranches = ROUTE_TREE.filter((branch) => branch.accessType === Access.ROLE);
  const userRoles = authPayload.companyRoles.flatMap((cr) => cr.roles);
  const userBranches = roleAccessBranches.filter((branch) =>
    branch?.companyRoles?.some((role) => userRoles.includes(role)),
  );

  return data({ userBranches }, { status: 200 });
}

export type RenderRouteBranchProps = {
  routeBanch: RouteBranch;
};

export const RenderRouteBranch = ({ routeBanch }: RenderRouteBranchProps) => {
  const navItem: NavItem = {
    href: routeBanch.href,
    label: routeBanch.label,
  };

  return (
    <div key={routeBanch.id} className="flex flex-col">
      <NavLink link={navItem} />
      {routeBanch.children && (
        <div className="pl-4 mt-1 flex flex-col gap-1">
          {routeBanch.children.map((childBranch) => (
            <RenderRouteBranch routeBanch={childBranch} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Company() {
  const data = useLoaderData<CompanyLoaderData>();

  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="relative flex h-full gap-4">
      <aside className="hidden md:block absolute -left-68 top-0 h-full flex-shrink-0 border rounded-sm p-4 transition-all duration-300 z-10 w-64 bg-white">
        <div className="flex flex-col gap-2">
          {data.userBranches?.map((branch) => (
            <RenderRouteBranch key={branch.id} routeBanch={branch} />
          ))}
        </div>
      </aside>

      <div className="flex-1 border rounded-sm p-4 transition-all duration-300 ml-0 bg-white">
        <BreadcrumbList />
        <Outlet context={context} />
      </div>
    </div>
  );
}
