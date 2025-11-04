import { data, Outlet, redirect, useLoaderData, useOutletContext, type LoaderFunctionArgs } from 'react-router';
import { NavBreadcrumbs } from '~/components/layout/nav-breadcrums';
import { NavLink, type NavItem } from '~/components/layout/nav-link';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { Access, ROUTE_TREE, type RouteBranch } from '~/lib/route-tree';
import type { RootOutletContext } from '~/root';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export type CompanyLoaderData = { userBranches: RouteBranch[] | undefined };

export async function loader({ request }: LoaderFunctionArgs) {
  const authPayload = await getAuthPayloadFromRequest(request);

  if (!authPayload || authPayload.companyRoles.length === 0) {
    return redirect('/');
  }

  const roleAccessBranches = ROUTE_TREE.filter((branch) => branch.accessType === Access.ROLE);
  const userRoles = authPayload.companyRoles.flatMap((cr) => cr.roles);

  const userBranches = roleAccessBranches
    .filter((branch) => branch?.companyRoles?.some((role) => userRoles.includes(role)))
    .filter((branch) => branch.hidden !== true);

  return data({ userBranches }, { status: 200 });
}

const filterHiddenBranches = (branch: RouteBranch): RouteBranch => {
  const filteredBranch = { ...branch };

  if (branch.children) {
    filteredBranch.children = branch.children.filter((child) => child.hidden !== true).map(filterHiddenBranches);
  }

  return filteredBranch;
};

export type RenderRouteBranchProps = {
  routeBranch: RouteBranch;
};

export const RenderRouteBranch = ({ routeBranch }: RenderRouteBranchProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = routeBranch.children && routeBranch.children.length > 0;

  const navItem: NavItem = {
    href: routeBranch.href,
    label: routeBranch.label,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault(); // Prevent navigation if there are children
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center bg-white border p-2 cursor-pointer hover:bg-gray-50" onClick={handleClick}>
        <NavLink className="text-stone-600 flex-1" link={navItem} />
        {hasChildren && (
          <span className="ml-2 transition-transform duration-200">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </div>

      {/* Children with slide-down animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {hasChildren && (
          <div className="ml-4 mt-1 space-y-1">
            {routeBranch.children!.map((child) => (
              <RenderRouteBranch key={child.id} routeBranch={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function CompanyLayout() {
  const data = useLoaderData<CompanyLoaderData>();

  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="relative flex h-full gap-4">
      <aside className="hidden md:block absolute -left-68 top-0 flex-shrink-0 rounded-sm transition-all duration-300 z-10 w-64">
        <div className="flex flex-col gap-6">
          {data.userBranches?.map(filterHiddenBranches).map((branch) => (
            <RenderRouteBranch key={branch.id} routeBranch={branch} />
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col gap-4 border rounded-sm p-4 transition-all duration-300 ml-0 bg-white">
        <NavBreadcrumbs items={data.userBranches} />
        <Outlet context={context} />
      </div>
    </div>
  );
}
