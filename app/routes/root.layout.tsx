import * as React from 'react';
import { Link, Outlet, data, isRouteErrorResponse, useLocation, useRouteError } from 'react-router';

import { Navbar } from '~/components/layout/navbar';
import { type UserNavigation, RoutePlaceMent } from '~/lib/route-tree';
import { Sidebar } from './_components/sidebar';
import { MobileSidebar } from './_components/mobile-sidebar/mobile-sidebar';
import type { Route } from './+types/root.layout';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import { defaultResponse, refreshAndBuildResponse, buildResponseData } from './_features/root.loader';
import { getFlashMessage } from '../lib/flash-message.server';
import { FlashMessageBanner } from './_components/flash-message-banner';
import { Footer } from './_components/footer';
import { AppShellBackground } from './_components/backgrounds/app-shell-background';
import type { CompanySummaryDto } from '~/api/generated/base';
import { logRouteError, logRouteStart, logRouteSuccess } from '~/lib/route-log';
import { ROUTES_MAP } from '~/lib/route-tree';
import { type EmbedThemeKey } from '~/lib/embed-shell';
import { SimpleShinyBackground } from './_components/backgrounds/simple-shiny.background';

function resolveParentOrigin(): string | null {
  if (typeof document === 'undefined') return null;
  const referrer = document.referrer;
  if (!referrer) return null;
  try {
    return new URL(referrer).origin;
  } catch {
    return null;
  }
}

function postEmbedMessage(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (window.parent === window) return;

  const targetOrigin = resolveParentOrigin() ?? '*';
  window.parent.postMessage(payload, targetOrigin);
}

function deriveBookingStep(pathname: string): string | null {
  if (!pathname.startsWith('/booking/public')) return null;
  if (pathname.includes('/session/contact')) return 'contact';
  if (pathname.includes('/session/employee')) return 'employee';
  if (pathname.includes('/session/select-services')) return 'select-services';
  if (pathname.includes('/session/select-time')) return 'select-time';
  if (pathname.includes('/session/overview')) return 'overview';
  if (pathname.includes('/appointment/success')) return 'success';
  if (pathname.includes('/appointment/cancel')) return 'cancel';
  return 'entry';
}

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
  embedMode: boolean;
  embedTheme: EmbedThemeKey;
  isEmbeddedRequest: boolean;
};

export default function RootLayout({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLElement | null>(null);
  const hasSentReadyRef = React.useRef(false);
  const lastHeightRef = React.useRef(0);
  const keepMobileMenuOpenOnNextRouteChangeRef = React.useRef(false);
  const isEmbedMode = loaderData.embedMode === true;
  const embedTheme = (loaderData.embedTheme ?? 'pitell') as EmbedThemeKey;
  const isEmbeddedRequest = loaderData.isEmbeddedRequest === true;
  const isEmbeddedRuntime = typeof window !== 'undefined' && window.parent !== window;
  const isEmbedded = isEmbeddedRequest || isEmbeddedRuntime;
  const userNav = loaderData.userNavigation || undefined;
  const companyContext = loaderData.companyContext;
  const setUserNav: RootOutletContext['setUserNav'] = (_value) => undefined;
  const setCompanyContext: RootOutletContext['setCompanyContext'] = (_value) => undefined;

  const sidebarBranches = userNav?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSystemAdminSidebar = sidebarBranches.some((branch) => branch.id === 'system-admin');
  const hasSidebar = sidebarBranches.length > 0 && (Boolean(companyContext) || hasSystemAdminSidebar);
  const isBookingPublicPath = location.pathname.startsWith('/booking/public');
  const useEmbedShell = isEmbedMode && isEmbedded && isBookingPublicPath;

  React.useEffect(() => {
    if (!useEmbedShell) return;
    if (hasSentReadyRef.current) return;
    hasSentReadyRef.current = true;
    postEmbedMessage({ type: 'embed:ready', mode: 'booking-public' });
  }, [useEmbedShell]);

  React.useEffect(() => {
    if (!useEmbedShell) return;
    const step = deriveBookingStep(location.pathname);
    if (!step) return;

    postEmbedMessage({
      type: 'embed:step-changed',
      step,
      path: `${location.pathname}${location.search}`,
    });
  }, [location.pathname, location.search, useEmbedShell]);

  React.useEffect(() => {
    if (!useEmbedShell || typeof window === 'undefined') return;
    const node = contentRef.current;
    if (!node) return;

    const publishHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      if (nextHeight <= 0 || nextHeight === lastHeightRef.current) return;
      lastHeightRef.current = nextHeight;
      postEmbedMessage({ type: 'embed:resize', height: nextHeight });
    };

    const observer = new ResizeObserver(() => publishHeight());
    observer.observe(node);
    publishHeight();

    return () => {
      observer.disconnect();
    };
  }, [location.pathname, location.search, useEmbedShell]);

  React.useEffect(() => {
    if (keepMobileMenuOpenOnNextRouteChangeRef.current) {
      keepMobileMenuOpenOnNextRouteChangeRef.current = false;
      return;
    }

    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  if (useEmbedShell) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-text-primary">
        <FlashMessageBanner message={loaderData.flashMessage} />
        <main className="flex flex-1">
          <div className="mx-auto flex min-h-full w-full max-w-[var(--container-xl)] flex-1">
            <section
              ref={contentRef}
              className="min-w-0 flex-1 bg-background py-[var(--app-content-padding-block-mobile)] px-4 lg:py-[var(--app-content-padding-block-desktop)]"
            >
              <Outlet
                context={{
                  userNav,
                  setUserNav,
                  companyContext,
                  setCompanyContext,
                  embedMode: isEmbedMode,
                  embedTheme,
                  isEmbeddedRequest: isEmbedded,
                }}
              />
            </section>
          </div>
        </main>
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
                embedMode: isEmbedMode,
                embedTheme,
                isEmbeddedRequest: isEmbedded,
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
