import * as React from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, type LinksFunction } from 'react-router';
import { Menu } from 'lucide-react';
import { Toaster } from 'sonner';

import './app.css';
import { Navbar } from './components/layout/navbar';
import { type UserNavigation, RoutePlaceMent } from './lib/route-tree';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { Sidebar } from './routes/_components/sidebar';
import { MobileSidebar } from './routes/_components/mobile-sidebar';
import type { Route } from './+types/root';
import { OpenAPI } from './api/clients/http';
import { ENV } from './api/config/env';
import { authService, AuthenticationError } from './lib/auth-service';
import { logger } from './lib/logger';
import { defaultResponse, refreshAndBuildResponse, buildResponseData } from './routes/_features/root.loader';
import { getFlashMessage } from './routes/company/_lib/flash-message.server';
import { FlashMessageBanner } from './routes/company/_components/flash-message-banner';
import { BottomNav } from './routes/_components/bottom-nav';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { message: flashMessage } = await getFlashMessage(request);
    OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;
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

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-12">
      <header className="border-b border-border bg-background lg:col-span-12 lg:grid lg:grid-cols-12">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <FlashMessageBanner message={flashMessage} />

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

      <main className="relative bg-primary/5 lg:col-span-12 lg:grid lg:grid-cols-12 overflow-hidden">
        {/* Confident minimalist geometric background - inspired by Suprematism */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* STRONG VERTICAL ANCHORS - Stability & Confidence */}
          <div className="absolute left-[15%] top-0 h-full w-px bg-border/8" />
          <div className="absolute left-[35%] top-0 h-full w-px bg-border/6" />
          <div className="absolute right-[25%] top-0 h-full w-px bg-border/8" />

          {/* HORIZONTAL FOUNDATION LINES - Grounding */}
          <div className="absolute left-0 top-[30%] h-px w-full bg-border/8" />
          <div className="absolute left-0 bottom-[35%] h-px w-full bg-border/6" />

          {/* BOLD ASCENDING WEDGE - Progress & Forward Motion (top right) */}
          <div className="absolute -right-24 top-[15%] h-[400px] w-[400px]" style={{ transform: 'rotate(45deg)' }}>
            <div
              className="h-full w-full border-2 border-primary/12"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
          </div>

          {/* SOLID SQUARE - Foundation & Strength (left side) */}
          <div className="absolute left-[8%] top-[40%] h-48 w-48 border border-border/10 bg-foreground/4" />

          {/* CLEAN CIRCLE - Wholeness & Clarity (bottom right) */}
          <div className="absolute right-[12%] bottom-[20%] h-56 w-56 rounded-full border border-border/10" />

          {/* PRECISION GRID ACCENT - Order & Control (top left) */}
          <div
            className="absolute left-[5%] top-[12%] h-32 w-32 border border-border/8"
            style={{
              backgroundImage: `linear-gradient(to right, oklch(0.16 0 0 / 0.06) 1px, transparent 1px),
                                linear-gradient(to bottom, oklch(0.16 0 0 / 0.06) 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
            }}
          />

          {/* SHARP ACCENT WEDGE - Direction & Purpose (bottom left) */}
          <div
            className="absolute left-[20%] bottom-[15%] h-24 w-40 border border-primary/15"
            style={{ clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' }}
          />

          {/* ELEVATED RECTANGLE - Achievement (center right) */}
          <div className="absolute right-[18%] top-[50%] h-16 w-64 rotate-[8deg] border border-border/8 bg-primary/5" />
        </div>

        {userNav?.SIDEBAR && userNav.SIDEBAR.length > 0 ? (
          <aside className="relative z-10 hidden border-r border-border bg-muted p-4 lg:col-span-2 lg:block">
            <Sidebar branches={userNav.SIDEBAR} />
          </aside>
        ) : (
          <aside className="relative z-10 hidden border-r p-4 lg:col-span-2 lg:block" />
        )}

        {hasSidebar && (
          <MobileSidebar branches={sidebarBranches} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        )}

        <section className="relative z-10 overflow-auto p-4 sm:p-5 lg:col-span-8 border-r">
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
