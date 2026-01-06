import * as React from 'react';
import { Outlet, useLoaderData, useLocation } from 'react-router';
import { Menu } from 'lucide-react';

import { Navbar } from '~/components/layout/navbar';
import { type UserNavigation, RoutePlaceMent } from '~/lib/route-tree';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { Sidebar } from './_components/sidebar';
import { MobileSidebar } from './_components/mobile-sidebar';
import type { Route } from './+types/root.layout';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import { defaultResponse, refreshAndBuildResponse, buildResponseData } from './_features/root.loader';
import { getFlashMessage } from './company/_lib/flash-message.server';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { FlashMessageBanner } from './_components/flash-message-banner';
import { Button } from '~/components/ui/button';
import { Footer } from './_components/footer';
import { DashWaveBackground } from './_components/backgrounds/dash-wave-background';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const auth = await getAuthPayloadFromRequest(request);
    const { message: flashMessage } = await getFlashMessage(request);
    const { accessToken, refreshToken } = await authService.getTokensFromRequest(request);

    if (!accessToken && !refreshToken) {
      return await defaultResponse(flashMessage);
    }

    if (!accessToken && refreshToken) {
      return await refreshAndBuildResponse(request, refreshToken, flashMessage);
    }

    if (accessToken) {
      if (authService.isTokenExpired(accessToken)) {
        if (refreshToken) {
          return await refreshAndBuildResponse(request, refreshToken, flashMessage);
        }
        return await defaultResponse(flashMessage);
      }
      return await buildResponseData(request, accessToken, flashMessage);
    }

    return await defaultResponse(flashMessage);
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    logger.error('Root loader failed', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof AuthenticationError) {
      return await defaultResponse(null);
    }

    throw error;
  }
}

export type RootOutletContext = {
  userNav: UserNavigation;
  setUserNav: React.Dispatch<React.SetStateAction<UserNavigation | undefined>>;
  companyContext: CompanySummaryDto | null | undefined;
  setCompanyContext: React.Dispatch<React.SetStateAction<CompanySummaryDto | null | undefined>>;
};

export default function RootLayout({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const [userNav, setUserNav] = React.useState<UserNavigation | undefined>(undefined);
  const [companyContext, setCompanyContext] = React.useState<CompanySummaryDto | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setUserNav(loaderData.userNavigation || undefined);
    setCompanyContext(loaderData.companyContext);
  }, [loaderData]);

  const sidebarBranches = userNav?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSidebar = sidebarBranches.length > 0 && companyContext;
  const isRootPage = location.pathname === '/';

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-12">
      <FlashMessageBanner message={loaderData.flashMessage} />

      <header className="border-b border-navbar-border lg:col-span-12 lg:grid lg:grid-cols-12 bg-navbar-bg">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <nav className="border-b border-navbar-border lg:col-span-8 lg:border-b-0 h-20">
          <div className="flex h-full items-center gap-3 px-2">
            {hasSidebar && (
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-10 w-10 flex items-center justify-center text-navbar-text hover:bg-navbar-accent hover:text-primary rounded transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 flex items-center h-full">
              <Navbar navRoutes={userNav} companyContext={companyContext} />
            </div>
          </div>
        </nav>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </header>

      <main className="relative overflow-hidden bg-content-bg lg:col-span-12 lg:grid lg:grid-cols-12">
        {userNav?.SIDEBAR && userNav.SIDEBAR.length > 0 ? (
          <aside className="relative z-10 hidden border-r border-sidebar-border bg-sidebar-bg p-4 lg:col-span-2 lg:block">
            <Sidebar branches={userNav.SIDEBAR} />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-px w-full bg-sidebar-border/20" />
            </div>
          </aside>
        ) : (
          <aside className="relative z-10 hidden border-r border-content-border bg-transparent lg:col-span-2 lg:block" />
        )}

        {hasSidebar && (
          <MobileSidebar branches={sidebarBranches} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        )}

        <section className="relative z-10 overflow-auto border-r border-content-border p-2 sm:p-5 lg:col-span-8 bg-content-bg/70">
          <Outlet
            context={{
              userNav,
              setUserNav,
              companyContext,
              setCompanyContext,
            }}
          />
        </section>

        <div className="relative z-10 hidden lg:col-span-2 lg:block"></div>
      </main>

      <Footer />
      <DashWaveBackground />
    </div>
  );
}
