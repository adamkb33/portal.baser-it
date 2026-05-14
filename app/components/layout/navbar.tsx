import { Link, NavLink } from 'react-router';
import { useLocation } from 'react-router';
import type { UserNavigation } from '~/lib/route-tree';
import { BrachCategory, ROUTES_MAP, RoutePlaceMent } from '~/lib/route-tree';
import type { CompanySummaryDto } from '~/api/generated/base';
import CompanyHeader from './company-header';
import { Loader2, Settings, User } from 'lucide-react';
import PTLLogo from '../logos/PTL.logo';
import { NavbarNotificationBell } from './navbar-notification-bell';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/ui';

export type NavbarProps = {
  navRoutes: UserNavigation | undefined;
  companyContext: CompanySummaryDto | null | undefined;
  hasSidebar?: boolean;
  onOpenSidebar?: () => void;
};

export function Navbar({ navRoutes, companyContext }: NavbarProps) {
  const location = useLocation();
  const navigationBranches = navRoutes?.[RoutePlaceMent.NAVIGATION] || [];
  const sidebarBranches = navRoutes?.[RoutePlaceMent.SIDEBAR] || [];
  const userBranches = navigationBranches.filter((branch) => branch.category === BrachCategory.USER);
  const authBranches = navigationBranches.filter((branch) => branch.category === BrachCategory.AUTH);
  const hasMobileMenuLinks = userBranches.length > 0 || authBranches.length > 0;
  const canAccessCompanyContext = navigationBranches.some((branch) => branch.id === 'user.company-context');
  const canAccessSystemAdmin = hasBranch(sidebarBranches, 'system-admin');
  const canAccessNotifications = !!companyContext && hasBranch(sidebarBranches, 'company.notifications');
  const isLoggedInCompanyUser = !!companyContext;
  const showCompanyHeader = companyContext !== null || canAccessCompanyContext;
  const showSystemAdminHeader = canAccessSystemAdmin && !location.pathname.startsWith('/system-admin');

  return (
    <div className="flex h-full w-full items-stretch">
      <section className="flex w-max shrink-0 items-center justify-start pr-3 lg:w-[var(--app-sidebar-width)] md:pr-4">
        <Link to="/" className="flex h-full shrink-0 items-center text-xl font-semibold">
          <PTLLogo size="xl" onDark />
        </Link>
      </section>

      <section className="flex min-w-0 flex-1 items-center">
        {showCompanyHeader ? (
          <CompanyHeader
            company={companyContext}
            canAccessCompanyContext={canAccessCompanyContext}
            className="min-w-0 w-full max-w-none"
          />
        ) : null}

        {showSystemAdminHeader ? (
          <Link
            to={ROUTES_MAP['system-admin'].href}
            className="group ml-2 flex min-w-0 items-center gap-2 border-l border-navbar-border py-2 pr-0 pl-2 transition-all duration-200 hover:border-primary hover:bg-navbar-accent focus:outline-none focus:ring-2 focus:ring-navbar-ring focus:ring-inset md:ml-3 md:gap-3 md:border-l-2 md:px-4 md:py-3"
          >
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded bg-navbar-icon-bg transition-colors duration-200 group-hover:bg-navbar-accent md:flex">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-navbar-text transition-colors duration-200 group-hover:text-primary">
              Gå til systemadmin
            </span>
          </Link>
        ) : null}
      </section>

      <section className="flex w-max shrink-0 items-center justify-end gap-2 md:gap-4">
        {!isLoggedInCompanyUser && (
          <NavLink
            to={ROUTES_MAP['booking.public.appointment'].href}
            end
            className={({ isPending }) => (isPending ? 'pointer-events-none opacity-70' : undefined)}
          >
            {({ isPending }) => (
              <Button className="h-11 rounded-md border border-button-primary-border bg-button-primary-bg px-4 text-sm font-semibold text-button-primary-text transition-all duration-200 hover:bg-button-primary-hover-bg hover:text-button-primary-hover-text">
                <span className="relative inline-flex items-center justify-center">
                  <span className={isPending ? 'opacity-60' : undefined}>Bestill time</span>
                  {isPending && (
                    <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                      <Loader2 className="size-4 animate-spin" />
                    </span>
                  )}
                </span>
              </Button>
            )}
          </NavLink>
        )}

        {canAccessNotifications ? <NavbarNotificationBell /> : null}

        {hasMobileMenuLinks ? (
          <div className="md:hidden">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Brukermeny"
                  className="h-11 w-11 rounded-xl border border-navbar-border/35 bg-navbar-accent/35 text-navbar-text shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-navbar-accent hover:text-primary"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-current transition-colors">
                    <User className="h-5 w-5" />
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[220px] p-2">
                {userBranches.length > 0 ? (
                  <>
                    <DropdownMenuLabel>Konto</DropdownMenuLabel>
                    {userBranches.map((link) => (
                      <DropdownMenuItem key={link.id} asChild className="min-h-11 rounded-lg px-3 py-3">
                        <Link to={link.href} className="cursor-pointer text-sm font-medium">
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : null}

                {userBranches.length > 0 && authBranches.length > 0 ? <DropdownMenuSeparator /> : null}

                {authBranches.length > 0 ? (
                  <>
                    {userBranches.length === 0 ? <DropdownMenuLabel>Konto</DropdownMenuLabel> : null}
                    {authBranches.map((link) => (
                      <DropdownMenuItem key={link.id} asChild className="min-h-11 rounded-lg px-3 py-3">
                        <Link to={link.href} className="cursor-pointer text-sm font-medium text-navbar-text-muted">
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        {userBranches.length > 0 ? (
          <div className="hidden md:flex">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="User menu"
                  className="h-11 w-11 rounded-xl border border-navbar-border/35 bg-navbar-accent/35 text-navbar-text shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-navbar-accent hover:text-primary"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-current transition-colors">
                    <User className="h-5 w-5" />
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[180px]">
                {userBranches.map((link) => (
                  <DropdownMenuItem key={link.id} asChild>
                    <Link to={link.href} className="cursor-pointer">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        <div className="hidden md:flex items-center gap-2">
          {authBranches.map((link) => (
            <Link
              key={link.id}
              to={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-navbar-text-muted transition-all duration-200 hover:bg-navbar-accent hover:text-navbar-text"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function hasBranch(branches: UserNavigation[typeof RoutePlaceMent.SIDEBAR], id: string): boolean {
  for (const branch of branches) {
    if (branch.id === id) {
      return true;
    }

    if (branch.children && hasBranch(branch.children, id)) {
      return true;
    }
  }

  return false;
}
