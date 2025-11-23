import { type ReactNode } from 'react';

import { Navbar } from '~/components/layout/navbar';
import { type UserNavigation } from '~/lib/route-tree';
import type { CompanySummaryDto } from '~/api/clients/types';
import { Toaster } from 'sonner';

interface RootLayoutProps {
  children: ReactNode;
  routeTree: UserNavigation | undefined;
  companyContext: CompanySummaryDto | null | undefined;
}

export function RootLayout({ children, routeTree, companyContext }: RootLayoutProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-[1200px] flex-col border-x border-border">
        <header role="banner" className="border-b border-border bg-background">
          <div className="flex h-16 w-full items-center gap-3 px-4">
            <Navbar navRoutes={routeTree} companyContext={companyContext} />
          </div>
        </header>

        <main role="main" className="flex-1">
          <div className="flex h-full flex-col gap-4 px-4 py-6">
            <div className="w-full flex-1">{children}</div>
            <Toaster />
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
