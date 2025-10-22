import { type ReactNode } from 'react';

import { MobileMenu } from '~/components/layout/mobile-menu';
import { MobileNav } from '~/components/layout/mobile-nav';
import { Navbar } from '~/components/layout/navbar';
import { BrachCategory, type BranchGroup, type UserNavigation } from '~/lib/nav/route-tree';
import type { CompanySummaryDto } from '~/api/clients/types';

interface RootLayoutProps {
  children: ReactNode;
  routeTree: UserNavigation | undefined;
  companyContext: CompanySummaryDto | null | undefined;
}

export function RootLayout({ children, routeTree, companyContext }: RootLayoutProps) {
  return (
    <div className="h-screen min-h-dvh flex flex-col bg-white text-zinc-900">
      <header role="banner" className="h-16 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center gap-3">
          <Navbar navRoutes={routeTree?.NAVIGATION} companyContext={companyContext} />
        </div>
      </header>

      <main role="main" className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="relative mx-auto w-full max-w-[1200px] flex gap-4 px-4 py-6">
          <div className="w-full ">{children}</div>
        </div>
      </main>

      <footer role="contentinfo" className="hidden h-14 border-t bg-zinc-50 lg:block">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center text-sm text-zinc-600">
          <span>© 2025</span>
        </div>
      </footer>
    </div>
  );
}
