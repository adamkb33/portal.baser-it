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
    <>
      <div className="fixed inset-0 opacity-20 flex items-center justify-center overflow-hidden z-0">
        <BackgroundSvg className="w-full h-full object-cover" />
      </div>
      <div className="relative h-screen min-h-dvh flex flex-col bg-transparent text-zinc-900 z-10">
        <header
          role="banner"
          className="h-16 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
        >
          <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center gap-3">
            <Navbar navRoutes={routeTree?.NAVIGATION} companyContext={companyContext} />
          </div>
        </header>

        <main role="main" className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <div className="relative mx-auto w-full max-w-[1200px] flex gap-4 px-4 py-6">
            <div className="w-full">{children}</div>
          </div>
        </main>

        <footer role="contentinfo" className="hidden h-14 border-t bg-zinc-50 lg:block">
          <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center text-sm text-zinc-600">
            <span>© 2025</span>
          </div>
        </footer>
      </div>
    </>
  );
}

const BackgroundSvg = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    id="visual"
    width="1920"
    height="1080"
    version="1.1"
    viewBox="0 0 1920 1080"
    className="{className}"
    {...props}
  >
    <path
      fill="#702963"
      d="M2367.678 493.379c180 112.5 346.2 306.3 366.6 520.4s-105.1 448.6-285.1 598.5c-180 149.8-414.5 215-639.1 205.1s-439.3-94.9-560.7-244.7c-121.3-149.9-149.3-364.6-145.5-575.5 3.8-211 39.3-418.2 160.6-530.7s328.5-130.3 529-123.6c200.4 6.7 394.2 38 574.2 150.5"
    ></path>
  </svg>
);
