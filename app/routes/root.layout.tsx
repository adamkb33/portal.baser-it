import * as React from 'react';
import { Link, Outlet, data, isRouteErrorResponse, useLocation, useRouteError } from 'react-router';
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

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
import { BOOKING_THEME_TOKENS } from '~/lib/booking-theme';
import { Button } from '~/ui';

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

export default function RootLayout({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const keepMobileMenuOpenOnNextRouteChangeRef = React.useRef(false);
  const isBookingPublicRoute = location.pathname === '/booking/public' || location.pathname.startsWith('/booking/public/');
  const bookingThemeStyle = isBookingPublicRoute ? BOOKING_THEME_TOKENS[loaderData.bookingTheme] : undefined;

  const userNav = loaderData.userNavigation || undefined;
  const companyContext = loaderData.companyContext;
  const setUserNav: RootOutletContext['setUserNav'] = (_value) => undefined;
  const setCompanyContext: RootOutletContext['setCompanyContext'] = (_value) => undefined;

  const sidebarBranches = userNav?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSystemAdminSidebar = sidebarBranches.some((branch) => branch.id === 'system-admin');
  const hasSidebar = sidebarBranches.length > 0 && (Boolean(companyContext) || hasSystemAdminSidebar);
  const workspace = companyContext ? { name: companyContext.name ?? companyContext.orgNumber, subtitle: 'Selskap' } : null;

  React.useEffect(() => {
    if (keepMobileMenuOpenOnNextRouteChangeRef.current) {
      keepMobileMenuOpenOnNextRouteChangeRef.current = false;
      return;
    }

    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-surface text-text-primary" style={bookingThemeStyle}>
      <FlashMessageBanner message={loaderData.flashMessage} />

      {hasSidebar ? (
        <div className="lg:grid lg:min-h-screen lg:grid-cols-[var(--app-sidebar-width)_1fr]">
          <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-border bg-background px-4 py-5 lg:block">
            <Sidebar branches={sidebarBranches} workspace={workspace} />
          </aside>

          <MobileSidebar
            branches={sidebarBranches}
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            workspace={workspace}
            onNavigateWithinMenu={() => {
              keepMobileMenuOpenOnNextRouteChangeRef.current = true;
            }}
          />

          <div className="flex min-h-screen min-w-0 flex-col">
            <header className="sticky top-0 z-10 h-[var(--app-header-height)] shrink-0 border-b border-border bg-background/90 backdrop-blur">
              <div className="flex h-full w-full items-center px-4 lg:px-8">
                <Navbar
                  navRoutes={userNav}
                  companyContext={companyContext}
                  hasSidebar={hasSidebar}
                  onOpenSidebar={() => setMobileMenuOpen(true)}
                />
              </div>
            </header>

            <main className="min-w-0 flex-1 bg-surface px-3 pt-3 pb-[calc(0.75rem+6rem)] sm:px-4 lg:px-8 lg:py-8">
              <Outlet
                context={{
                  userNav,
                  setUserNav,
                  companyContext,
                  setCompanyContext,
                }}
              />
            </main>

            <footer className="mb-[calc(env(safe-area-inset-bottom)+5.5rem)] h-[var(--app-footer-height)] shrink-0 border-t border-border bg-background lg:mb-0">
              <Footer />
            </footer>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 h-[var(--app-header-height)] shrink-0 border-b border-border bg-background">
            <div className="mx-auto flex h-full w-full max-w-[var(--container-xl)] items-center px-[var(--app-shell-inline-padding)]">
              <Navbar
                navRoutes={userNav}
                companyContext={companyContext}
                hasSidebar={hasSidebar}
                onOpenSidebar={() => setMobileMenuOpen(true)}
              />
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-surface px-3 py-3 sm:px-4 lg:px-8 lg:py-8">
            <Outlet
              context={{
                userNav,
                setUserNav,
                companyContext,
                setCompanyContext,
              }}
            />
          </main>

          <footer className="h-[var(--app-footer-height)] shrink-0 border-t border-border bg-background">
            <Footer />
          </footer>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  logger.error('Route error boundary', { error });

  if (isRouteErrorResponse(error)) {
    const errorInfo = getRouteErrorInfo(error.status, error.statusText);
    return <ErrorPage {...errorInfo} />;
  }

  const message = error instanceof Error ? error.message : 'Ukjent feil';

  return (
    <ErrorPage
      eyebrow="Feil · Server"
      code="500"
      title="Noe gikk galt hos oss"
      description={message}
      status="500"
      reason="UNEXPECTED_ERROR"
      primaryAction="Prøv igjen"
      primaryActionKind="reload"
    />
  );
}

type ErrorPageProps = {
  eyebrow: string;
  code: string;
  title: string;
  description: string;
  status: string;
  reason: string;
  primaryAction: string;
  primaryActionKind: 'home' | 'reload';
};

function ErrorPage({
  eyebrow,
  code,
  title,
  description,
  status,
  reason,
  primaryAction,
  primaryActionKind,
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen bg-surface px-4 py-8 text-text-primary">
      <main className="m-auto w-full max-w-2xl">
        <section className="relative overflow-hidden rounded-lg border border-border bg-background px-6 py-8 text-center shadow-lg sm:px-10 sm:py-12">
          <div className="relative mx-auto mb-5 grid size-12 place-items-center rounded-[8px] border border-border bg-surface text-interactive">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>

          <span className="relative block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-text-disabled">
            {eyebrow}
          </span>
          <div className="relative mt-3 font-display text-7xl font-bold leading-none tracking-tight text-interactive sm:text-8xl">
            {code}
          </div>
          <h1 className="relative mt-5 font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {title}
          </h1>
          <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-text-secondary sm:text-base">
            {description}
          </p>

          <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {primaryActionKind === 'reload' ? (
              <Button type="button" onClick={() => window.location.reload()} className="min-h-11">
                <RefreshCw aria-hidden="true" />
                {primaryAction}
              </Button>
            ) : (
              <Button asChild className="min-h-11">
                <Link to="/">
                  <Home aria-hidden="true" />
                  {primaryAction}
                </Link>
              </Button>
            )}

            <Button type="button" variant="ghost" className="min-h-11" onClick={() => window.history.back()}>
              <ArrowLeft aria-hidden="true" />
              Gå tilbake
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to={ROUTES_MAP['auth.sign-in'].href}>Logg inn på nytt</Link>
            </Button>
          </div>

          <div className="relative mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-border-soft pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-disabled">
            <span>
              <strong className="text-text-secondary">Status</strong> {status}
            </span>
            <span>
              <strong className="text-text-secondary">Kode</strong> {reason}
            </span>
            <span>
              <strong className="text-text-secondary">Ref</strong> route-boundary
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function getRouteErrorInfo(status: number, statusText: string): ErrorPageProps {
  if (status === 404) {
    return {
      eyebrow: 'Feil · Ikke funnet',
      code: '404',
      title: 'Siden finnes ikke',
      description:
        'Lenken kan være utdatert, eller siden kan ha blitt flyttet eller slettet. Gå tilbake til forsiden for å finne riktig vei videre.',
      status: '404',
      reason: 'NOT_FOUND',
      primaryAction: 'Gå til forsiden',
      primaryActionKind: 'home',
    };
  }

  if (status >= 500) {
    return {
      eyebrow: 'Feil · Server',
      code: String(status),
      title: 'Noe gikk galt hos oss',
      description:
        'Vi klarte ikke å fullføre forespørselen akkurat nå. Prøv igjen om litt, eller gå tilbake til forsiden.',
      status: String(status),
      reason: statusText || 'SERVER_ERROR',
      primaryAction: 'Prøv igjen',
      primaryActionKind: 'reload',
    };
  }

  return {
    eyebrow: 'Feil · Forespørsel',
    code: String(status),
    title: 'Noe gikk galt',
    description: statusText || 'Forespørselen kunne ikke fullføres. Prøv igjen, eller gå tilbake til forsiden.',
    status: String(status),
    reason: statusText || 'ROUTE_ERROR',
    primaryAction: 'Gå til forsiden',
    primaryActionKind: 'home',
  };
}
