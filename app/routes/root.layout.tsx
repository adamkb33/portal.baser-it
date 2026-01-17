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
  const [userNav, setUserNav] = React.useState<UserNavigation | undefined>(undefined);
  const [companyContext, setCompanyContext] = React.useState<CompanySummaryDto | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setUserNav(loaderData.userNavigation || undefined);
    setCompanyContext(loaderData.companyContext);
  }, [loaderData]);

  const sidebarBranches = userNav?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSidebar = sidebarBranches.length > 0 && companyContext;

  return (
    <div className="min-h-screen flex flex-col">
      <FlashMessageBanner message={loaderData.flashMessage} />

      <header className="flex-shrink-0 h-20 border-b border-navbar-border bg-navbar-bg">
        <div className="h-full lg:grid lg:grid-cols-12">
          <div className="hidden lg:col-span-2 lg:block" />

          <nav className="lg:col-span-8 h-full">
            <div className="flex h-full items-center gap-3 px-2">
              {hasSidebar && (
                <Button
                  variant="ghost"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden h-10 w-10 flex items-center justify-center text-navbar-accent-foreground border-navbar-border"
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

          <div className="hidden lg:col-span-2 lg:block" />
        </div>
      </header>

      {/* Main — stretches between header and footer */}
      <main className="flex-1 min-h-0 bg-content-bg relative lg:grid lg:grid-cols-12">
        {/* Desktop Sidebar */}
        {hasSidebar ? (
          <aside className="hidden lg:block lg:col-span-2 border-r border-sidebar-border bg-sidebar-bg p-4">
            <Sidebar branches={sidebarBranches} />
          </aside>
        ) : (
          <aside className="hidden lg:block lg:col-span-2" />
        )}

        {/* Mobile Sidebar Overlay */}
        {hasSidebar && (
          <MobileSidebar branches={sidebarBranches} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        )}

        {/* Content — THIS is the scroll container */}
        <section className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 lg:col-span-8 bg-content-bg/70">
          <Outlet
            context={{
              userNav,
              setUserNav,
              companyContext,
              setCompanyContext,
            }}
          />
        </section>

        <div className="hidden lg:block lg:col-span-2" />
      </main>

      {/* Footer — fixed height */}
      <footer className="flex-shrink-0">
        <Footer />
      </footer>

      <DashWaveBackground />
    </div>
  );
}
