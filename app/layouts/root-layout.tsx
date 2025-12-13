import { type ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Navbar } from '~/components/layout/navbar';
import { NavLink, type NavItem } from '~/components/layout/nav-link';
import { type UserNavigation, type RouteBranch, RoutePlaceMent } from '~/lib/route-tree';
import type { CompanySummaryDto } from '~/api/clients/types';
import { Toaster } from 'sonner';

interface RootLayoutProps {
  children: ReactNode;
  routeTree: UserNavigation | undefined;
  companyContext: CompanySummaryDto | null | undefined;
}

type RenderRouteBranchProps = {
  routeBranch: RouteBranch;
};

const RenderRouteBranch = ({ routeBranch }: RenderRouteBranchProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = routeBranch.children && routeBranch.children.length > 0;

  if (!routeBranch.label) {
    return null;
  }

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

const filterHiddenBranches = (branch: RouteBranch): RouteBranch => {
  const filteredBranch = { ...branch };

  if (branch.children) {
    filteredBranch.children = branch.children.filter((child) => child.hidden !== true).map(filterHiddenBranches);
  }

  return filteredBranch;
};

export function RootLayout({ children, routeTree, companyContext }: RootLayoutProps) {
  // Get sidebar branches if user is authenticated and has company context
  const sidebarBranches = routeTree?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSidebar = sidebarBranches.length > 0 && companyContext;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-[1200px] flex-col border-x border-border">
        <header role="banner" className="border-b bg-background">
          <div className="flex h-16 w-full items-center gap-3 px-4">
            <Navbar navRoutes={routeTree} companyContext={companyContext} />
          </div>
        </header>

        <main role="main" className="flex-1 bg-muted">
          <div className="flex h-full">
            {/* Sidebar */}
            {hasSidebar && (
              <aside className="hidden md:block flex-shrink-0 w-64 p-4">
                <div className="flex flex-col gap-6">
                  {sidebarBranches.map(filterHiddenBranches).map((branch) => (
                    <RenderRouteBranch key={branch.id} routeBranch={branch} />
                  ))}
                </div>
              </aside>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col gap-4 px-4 py-6">
              <div className="w-full flex-1">{children}</div>
              <Toaster />
            </div>
          </div>
        </main>

        <footer
          role="contentinfo"
          className="flex h-12 items-center border-t border-border bg-background text-xs text-muted-foreground"
        >
          <div className="flex w-full items-center px-4">
            <span>© 2025</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
