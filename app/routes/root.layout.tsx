import * as React from 'react';
import { Link, Outlet, data, isRouteErrorResponse, useLocation, useRouteError } from 'react-router';

import { Navbar } from '~/components/layout/navbar';
import { type UserNavigation, RoutePlaceMent } from '~/lib/routing/route-tree';
import { Sidebar } from './_components/sidebar';
import { MobileSidebar } from './_components/mobile-sidebar/mobile-sidebar';
import type { Route } from './+types/root.layout';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import { defaultResponse, refreshAndBuildResponse, buildResponseData } from './_features/root.loader';
import { getFlashMessage } from '../lib/flash-message.server';
import { FlashMessageBanner } from './_components/flash-message-banner';
import { Footer } from './_components/footer';
import type { CompanySummaryDto } from '~/api/generated/base';
import { logRouteError, logRouteStart, logRouteSuccess } from '~/lib/routing/route-log';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { SimpleShinyBackground } from './_components/backgrounds/simple-shiny.background';
import { EMBED_THEME_TOKENS } from '~/lib/embed-shell';

export async function loader(args: Route.LoaderArgs) {
  const { request } = args;
  let flashHeaders: HeadersInit | undefined;

  logRouteStart('loader', 'root.layout', args);

  try {
    const { message: flashMessage, headers: flashCookie } = await getFlashMessage(request);
    const { accessToken, refreshToken } = await authService.getTokensFromRequest(request);
    flashHeaders = flashCookie ? { 'Set-Cookie': flashCookie } : undefined;

    if (!accessToken && !refreshToken) {
      const response = await defaultResponse(flashMessage, request, flashHeaders);
      logRouteSuccess('loader', 'root.layout', args, { branch: 'no-tokens' });
      return response;
    }

    if (!accessToken && refreshToken) {
      const response = await refreshAndBuildResponse(request, refreshToken, flashMessage, flashHeaders);
      logRouteSuccess('loader', 'root.layout', args, { branch: 'refresh-only' });
      return response;
    }

    if (accessToken) {
      if (authService.isTokenExpired(accessToken)) {
        if (refreshToken) {
          const response = await refreshAndBuildResponse(request, refreshToken, flashMessage, flashHeaders);
          logRouteSuccess('loader', 'root.layout', args, { branch: 'expired-access-refresh' });
          return response;
        }

        const response = await defaultResponse(flashMessage, request, flashHeaders);
        logRouteSuccess('loader', 'root.layout', args, { branch: 'expired-access-no-refresh' });
        return response;
      }

      const body = await buildResponseData(request, accessToken, flashMessage);
      const response = data(body, { headers: flashHeaders });
      logRouteSuccess('loader', 'root.layout', args, { branch: 'access-token' });
      return response;
    }

    const response = await defaultResponse(flashMessage, request, flashHeaders);
    logRouteSuccess('loader', 'root.layout', args, { branch: 'fallback-default' });
    return response;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    logRouteError('loader', 'root.layout', args, error);
    logger.error('Root loader failed', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof AuthenticationError) {
      return await defaultResponse(null, request, flashHeaders);
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

function isEmbeddedRoutePath(pathname: string): boolean {
  return pathname === '/embed' || pathname.startsWith('/embed/');
}

export default function RootLayout({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const keepMobileMenuOpenOnNextRouteChangeRef = React.useRef(false);
  const isEmbedRoute = isEmbeddedRoutePath(location.pathname);
  const embedThemeStyle = isEmbedRoute ? EMBED_THEME_TOKENS[loaderData.embedTheme] : undefined;

  const userNav = loaderData.userNavigation || undefined;
  const companyContext = loaderData.companyContext;
  const setUserNav: RootOutletContext['setUserNav'] = (_value) => undefined;
  const setCompanyContext: RootOutletContext['setCompanyContext'] = (_value) => undefined;

  const sidebarBranches = userNav?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSystemAdminSidebar = sidebarBranches.some((branch) => branch.id === 'system-admin');
  const hasSidebar = sidebarBranches.length > 0 && (Boolean(companyContext) || hasSystemAdminSidebar);

  React.useEffect(() => {
    if (keepMobileMenuOpenOnNextRouteChangeRef.current) {
      keepMobileMenuOpenOnNextRouteChangeRef.current = false;
      return;
    }

    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    if (!isEmbedRoute || typeof document === 'undefined') return;

    const previousHtmlBackground = document.documentElement.style.background;
    const previousBodyBackground = document.body.style.background;

    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';

    return () => {
      document.documentElement.style.background = previousHtmlBackground;
      document.body.style.background = previousBodyBackground;
    };
  }, [isEmbedRoute]);

  if (isEmbedRoute) {
    return (
      <div data-embed-root className="bg-transparent text-text-primary" style={embedThemeStyle}>
        <FlashMessageBanner message={loaderData.flashMessage} />
        <Outlet
          context={{
            userNav,
            setUserNav,
            companyContext,
            setCompanyContext,
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-text-primary">
      <div className="pointer-events-none absolute inset-0 z-0">
        <SimpleShinyBackground />
      </div>
      <FlashMessageBanner message={loaderData.flashMessage} />

      <header className="relative z-10 h-[var(--app-header-height)] shrink-0 border-b border-border bg-surface/92 backdrop-blur-sm">
        <div className="mx-auto flex h-full w-full max-w-[var(--container-xl)] items-center px-[var(--app-shell-inline-padding)]">
          <Navbar
            navRoutes={userNav}
            companyContext={companyContext}
            hasSidebar={hasSidebar}
            onOpenSidebar={() => setMobileMenuOpen(true)}
          />
        </div>
      </header>

      <main className="relative z-10 flex flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-[var(--container-xl)] flex-1">
          {hasSidebar ? (
            <aside className="hidden w-[calc(var(--app-sidebar-width)+var(--app-shell-inline-padding))] shrink-0 border-r border-border bg-surface/88 backdrop-blur-sm lg:flex lg:flex-col">
              <div className="flex flex-1 p-6">
                <Sidebar branches={sidebarBranches} />
              </div>
            </aside>
          ) : null}

          {hasSidebar ? (
            <MobileSidebar
              branches={sidebarBranches}
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
              onNavigateWithinMenu={() => {
                keepMobileMenuOpenOnNextRouteChangeRef.current = true;
              }}
            />
          ) : null}

          <section
            className={
              hasSidebar
                ? 'min-w-0 flex-1 bg-background/72 px-3 pt-3 pb-[calc(0.75rem+6rem)] backdrop-blur-[2px] sm:px-4 lg:py-[var(--app-content-padding-block-desktop)]'
                : 'min-w-0 flex-1 bg-background/72 px-3 py-3 backdrop-blur-[2px] sm:px-4 lg:py-[var(--app-content-padding-block-desktop)]'
            }
          >
            <Outlet
              context={{
                userNav,
                setUserNav,
                companyContext,
                setCompanyContext,
              }}
            />
          </section>
        </div>
      </main>

      <footer
        className={
          hasSidebar
            ? 'relative z-10 mb-[calc(env(safe-area-inset-bottom)+5.5rem)] h-[var(--app-footer-height)] shrink-0 border-t border-border bg-surface/92 backdrop-blur-sm lg:mb-0'
            : 'relative z-10 h-[var(--app-footer-height)] shrink-0 border-t border-border bg-surface/92 backdrop-blur-sm'
        }
      >
        <Footer />
      </footer>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  logger.error('Route error boundary', { error });

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex flex-1 py-[var(--app-content-padding-block-mobile)] lg:py-[var(--app-content-padding-block-desktop)]">
          <section className="mx-auto w-full max-w-lg space-y-4 px-6">
            <h1 className="text-xl font-semibold">Noe gikk galt</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error.status} {error.statusText}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/" className="text-sm font-medium text-text-primary hover:underline">
                Gå til forsiden
              </Link>
              <Link
                to={ROUTES_MAP['auth.sign-in'].href}
                className="text-sm font-medium text-text-primary hover:underline"
              >
                Logg inn på nytt
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const message = error instanceof Error ? error.message : 'Ukjent feil';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 py-[var(--app-content-padding-block-mobile)] lg:py-[var(--app-content-padding-block-desktop)]">
        <section className="mx-auto w-full max-w-lg space-y-4 px-6">
          <h1 className="text-xl font-semibold">Noe gikk galt</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/" className="text-sm font-medium text-text-primary hover:underline">
              Gå til forsiden
            </Link>
            <Link
              to={ROUTES_MAP['auth.sign-in'].href}
              className="text-sm font-medium text-text-primary hover:underline"
            >
              Logg inn på nytt
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
