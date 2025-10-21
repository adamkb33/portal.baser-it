import React, { type ReactNode } from 'react';

import { MobileMenu } from '~/components/layout/mobile-menu';
import { MobileNav } from '~/components/layout/mobile-nav';
import { Navbar } from '~/components/layout/navbar';
import { SidebarNav } from '~/components/layout/sidebar';
import { NavBreadcrumbs } from '~/components/layout/nav-breadcrums';
import { Access, type RouteBranch } from '~/lib/nav/route-tree';
import type { CompanySummaryDto } from '~/api/clients/types';

interface RootLayoutProps {
  children: ReactNode;
  routeTree: RouteBranch[] | undefined;
  companyContext: CompanySummaryDto | null | undefined;
}

export function RootLayout({ children, routeTree, companyContext }: RootLayoutProps) {
  const midNavbar = routeTree?.filter((route) => route.accessType == Access.PUBLIC);
  const rightNavbar = routeTree?.filter(
    (route) => route.accessType == Access.AUTHENTICATED || route.accessType == Access.NOT_AUTHENTICATED,
  );
  const sideBar = routeTree?.filter((route) => route.accessType == Access.ROLE);

  const mobileNav = [...(midNavbar ?? []), ...(rightNavbar ?? [])];
  const showSidebar = sideBar?.length ?? 0 > 0;

  return (
    <div className="h-screen min-h-dvh flex flex-col bg-white text-zinc-900">
      <header role="banner" className="h-16 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center gap-3">
          <Navbar mid={midNavbar} right={rightNavbar} companyContext={companyContext} />
          <MobileMenu items={mobileNav} />
        </div>
      </header>

      <main role="main" className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="relative mx-auto w-full max-w-[1200px] flex gap-4 px-4 py-6">
          {showSidebar ? (
            <aside className="hidden lg:block top-6 w-64 h-full">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                <SidebarNav items={sideBar} />
              </div>
            </aside>
          ) : null}
          <div className="flex flex-col w-full">
            <NavBreadcrumbs items={sideBar} />
            <div className="w-full ">{children}</div>
          </div>
        </div>
      </main>

      <footer role="contentinfo" className="hidden h-14 border-t bg-zinc-50 lg:block">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center text-sm text-zinc-600">
          <span>© 2025</span>
        </div>
      </footer>

      <MobileNav items={sideBar} />
    </div>
  );
}
