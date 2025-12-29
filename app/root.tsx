import * as React from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, type LinksFunction } from 'react-router';
import { Menu } from 'lucide-react';
import { toast, Toaster } from 'sonner';

import './app.css';
import { Navbar } from './components/layout/navbar';
import { type UserNavigation, RoutePlaceMent } from './lib/route-tree';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { Sidebar } from './routes/_components/sidebar';
import { MobileSidebar } from './routes/_components/mobile-sidebar';
import type { Route } from './+types/root';
import { authService, AuthenticationError } from './lib/auth-service';
import { logger } from './lib/logger';
import { defaultResponse, refreshAndBuildResponse, buildResponseData } from './routes/_features/root.loader';
import { getFlashMessage } from './routes/company/_lib/flash-message.server';
import { getAuthPayloadFromRequest } from './lib/auth.utils';

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

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export type RootOutletContext = {
  userNav: UserNavigation;
  setUserNav: React.Dispatch<React.SetStateAction<UserNavigation | undefined>>;
  companyContext: CompanySummaryDto | null | undefined;
  setCompanyContext: React.Dispatch<React.SetStateAction<CompanySummaryDto | null | undefined>>;
};

export default function App({ loaderData }: Route.ComponentProps) {
  const [userNav, setUserNav] = React.useState<UserNavigation | undefined>(undefined);
  const [companyContext, setCompanyContext] = React.useState<CompanySummaryDto | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [flashMessage, setFlashMessage] = React.useState(loaderData.flashMessage);
  const data = loaderData;

  React.useEffect(() => {
    setUserNav(data.userNavigation || undefined);
    setCompanyContext(data.companyContext);
  }, [data]);

  React.useEffect(() => {
    setFlashMessage(data.flashMessage);
  }, [loaderData.flashMessage]);

  const sidebarBranches = userNav?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSidebar = sidebarBranches.length > 0 && companyContext;

  React.useEffect(() => {
    if ('flashMessage' in loaderData && loaderData.flashMessage) {
      const { type, text } = loaderData.flashMessage;

      switch (type) {
        case 'success':
          toast.success(text);
          break;
        case 'error':
          toast.error(text);
          break;
        case 'info':
          toast.info(text);
          break;
        case 'warning':
          toast.warning(text);
          break;
      }
    }
  }, [loaderData]);

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-12">
      <header className="border-b border-border bg-background lg:col-span-12 lg:grid lg:grid-cols-12">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <nav className="border-b p-2 border-border lg:col-span-8 lg:border-b-0">
          <div className="flex items-center gap-3">
            {hasSidebar && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="flex-1">
              <Navbar navRoutes={userNav} companyContext={companyContext} />
            </div>
          </div>
        </nav>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </header>

      <main className="relative overflow-hidden bg-background lg:col-span-12 lg:grid lg:grid-cols-12">
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          aria-hidden="true"
          style={{
            backgroundImage: `
        linear-gradient(to right, currentColor 1px, transparent 1px),
        linear-gradient(to bottom, currentColor 1px, transparent 1px)
      `,
            backgroundSize: '20px 20px',
          }}
        />

        {userNav?.SIDEBAR && userNav.SIDEBAR.length > 0 ? (
          <aside className="relative z-10 hidden border-r border-border bg-background p-4 lg:col-span-2 lg:block">
            <div className="mb-5 border-b border-border pb-3">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Navigasjon</span>
            </div>
            <Sidebar branches={userNav.SIDEBAR} />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-px w-full bg-border/20" />
            </div>
          </aside>
        ) : (
          <aside className="relative z-10 hidden border-r border-border bg-transparent lg:col-span-2 lg:block" />
        )}

        {hasSidebar && (
          <MobileSidebar branches={sidebarBranches} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        )}

        <section className="relative z-10 overflow-auto border-r border-border p-4 sm:p-5 lg:col-span-8 bg-background/70">
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

      <footer className="border-t border-border bg-muted lg:col-span-12 lg:grid lg:grid-cols-12">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <section className="p-2 lg:col-span-8">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Footer</span>
          <p className="mt-2 text-[0.7rem] text-muted-foreground">Footer content goes here</p>
        </section>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </footer>

      <Toaster />
    </div>
  );
}
