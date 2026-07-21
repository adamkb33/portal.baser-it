import { Link, NavLink } from 'react-router';
import { useLocation } from 'react-router';
import type { UserNavigation } from '~/lib/routing/route-tree';
import { BrachCategory, ROUTES_MAP, RoutePlaceMent } from '~/lib/routing/route-tree';
import type { CompanySummaryDto } from '~/api/generated/base';
import { Loader2, Menu, User } from 'lucide-react';
import PTLLogo from '../logos/PTL.logo';
import { NavbarNotificationBell } from './navbar-notification-bell';
import { buildCrumbs } from '~/lib/routing/breadcrumbs';
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
  userProfile?: {
    givenName?: string;
    familyName?: string;
    email?: string;
    mobileNumber?: string;
  } | null;
  companyContext: CompanySummaryDto | null | undefined;
  hasSidebar?: boolean;
  onOpenSidebar?: () => void;
};

export function Navbar({ navRoutes, userProfile, companyContext, hasSidebar = false, onOpenSidebar }: NavbarProps) {
  const location = useLocation();
  const navigationBranches = navRoutes?.[RoutePlaceMent.NAVIGATION] || [];
  const sidebarBranches = navRoutes?.[RoutePlaceMent.SIDEBAR] || [];
  const crumbs = buildCrumbs(sidebarBranches, location.pathname);
  const userBranches = navigationBranches.filter((branch) => branch.category === BrachCategory.USER);
  const authBranches = navigationBranches.filter((branch) => branch.category === BrachCategory.AUTH);
  const profileHref = userBranches.find((branch) => branch.id === 'user.profile')?.href;
  const canAccessNotifications = !!companyContext && hasBranch(sidebarBranches, 'company.notifications');
  const isLoggedInCompanyUser = !!companyContext;
  const bookingSessionPath = ROUTES_MAP['booking.public.appointment.session'].href;
  const isInBookingSession =
    location.pathname === bookingSessionPath || location.pathname.startsWith(`${bookingSessionPath}/`);

  return (
    <div className="flex h-full w-full min-w-0 items-center justify-between gap-3">
      <section className="flex min-w-0 flex-1 items-center">
        {hasSidebar ? (
          <div className="flex min-w-0 items-center gap-2">
            {onOpenSidebar ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onOpenSidebar}
                className="h-9 w-9 shrink-0 rounded-[var(--radius-control)] lg:hidden"
                aria-label="Åpne navigasjon"
              >
                <Menu className="h-4 w-4" />
              </Button>
            ) : null}
            <Breadcrumbs crumbs={crumbs} />
          </div>
        ) : (
          <Link to="/" className="flex h-full shrink-0 items-center text-xl font-semibold">
            <PTLLogo size="lg" />
          </Link>
        )}
      </section>

      <section className="flex w-max shrink-0 items-center justify-end gap-2">
        {canAccessNotifications ? <NavbarNotificationBell /> : null}

        {!isLoggedInCompanyUser && !isInBookingSession && (
          <NavLink
            to={ROUTES_MAP['booking.public.appointment'].href}
            end
            className={({ isPending }) => (isPending ? 'pointer-events-none opacity-70' : undefined)}
          >
            {({ isPending }) => (
              <Button variant="primary" className="h-11">
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

        {userBranches.length > 0 ? (
          <div className="md:hidden">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Brukermeny"
                  className="h-11 w-11 rounded-[var(--radius-control)]"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[220px] p-2">
                <UserMenuHeader userProfile={userProfile} profileHref={profileHref} />
                <DropdownMenuSeparator />
                {userBranches.length > 0 ? (
                  <>
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
                        <Link to={link.href} className="cursor-pointer text-sm font-medium text-text-secondary">
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:hidden">
            {authBranches.map((link) => (
              <Button key={link.id} asChild variant="ghost" className="h-11 px-3 text-interactive">
                <Link to={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        )}

        {userBranches.length > 0 ? (
          <div className="hidden md:flex">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="User menu"
                  className="h-11 w-11 rounded-[var(--radius-control)]"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[180px]">
                <UserMenuHeader userProfile={userProfile} profileHref={profileHref} />
                <DropdownMenuSeparator />
                {userBranches.map((link) => (
                  <DropdownMenuItem key={link.id} asChild>
                    <Link to={link.href} className="cursor-pointer">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {authBranches.length > 0 ? <DropdownMenuSeparator /> : null}
                {authBranches.map((link) => (
                  <DropdownMenuItem key={link.id} asChild>
                    <Link to={link.href} className="cursor-pointer text-text-secondary">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        {userBranches.length === 0 ? (
          <div className="hidden items-center gap-2 md:flex">
            {authBranches.map((link) => (
              <Link
                key={link.id}
                to={link.href}
                className="rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-200 hover:bg-surface hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function UserMenuHeader({
  userProfile,
  profileHref,
}: {
  userProfile: NavbarProps['userProfile'];
  profileHref?: string;
}) {
  const fullName = [userProfile?.givenName, userProfile?.familyName].filter(Boolean).join(' ');
  const mobileNumber = userProfile?.mobileNumber?.replace(/^\+47\s*/, '');
  const initials =
    [userProfile?.givenName, userProfile?.familyName]
      .filter(Boolean)
      .map((part) => part?.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    userProfile?.email?.slice(0, 2).toUpperCase() ||
    'K';

  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-interactive text-sm font-bold text-text-inverse">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">{fullName || 'Din konto'}</p>
        {userProfile?.email ? <p className="truncate text-xs text-text-secondary">{userProfile.email}</p> : null}
        {mobileNumber ? <p className="truncate text-xs text-text-secondary">{mobileNumber}</p> : null}
      </div>
    </>
  );

  if (profileHref) {
    return (
      <Link
        to={profileHref}
        className="flex min-w-0 items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex min-w-0 items-center gap-3 px-2 py-2">{content}</div>;
}

function Breadcrumbs({ crumbs }: { crumbs: Array<{ label: string; href: string }> }) {
  if (crumbs.length === 0) {
    return <span className="truncate text-sm font-semibold text-text-primary">Oversikt</span>;
  }

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm text-text-secondary" aria-label="Brødsmuler">
      {crumbs.map((crumb, index) => {
        const isCurrent = index === crumbs.length - 1;

        return (
          <span key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? <span className="text-text-disabled">/</span> : null}
            {isCurrent ? (
              <span className="truncate font-semibold text-text-primary">{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className="truncate hover:text-text-primary">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
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
