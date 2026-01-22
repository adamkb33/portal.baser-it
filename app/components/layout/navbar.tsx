import { Link, NavLink } from 'react-router';
import type { UserNavigation } from '~/lib/route-tree';
import { RoutePlaceMent, BrachCategory, ROUTES_MAP } from '~/lib/route-tree';
import type { CompanySummaryDto } from '~/api/generated/identity';
import CompanyHeader from './company-header';
import { Loader2, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import BiTLogo from '../logos/BiT.logo';

export type NavbarProps = {
  navRoutes: UserNavigation | undefined;
  companyContext: CompanySummaryDto | null | undefined;
};

export function Navbar({ navRoutes, companyContext }: NavbarProps) {
  const navigationBranches = navRoutes?.[RoutePlaceMent.NAVIGATION] || [];
  const userBranches = navigationBranches.filter((branch) => branch.category === BrachCategory.USER);
  const authBranches = navigationBranches.filter((branch) => branch.category === BrachCategory.AUTH);

  return (
    <div className="flex h-full items-center justify-between w-full">
      <div className="flex h-full items-center gap-6">
        <Link to="/" className="flex items-center h-full text-xl font-semibold">
          <BiTLogo size="xl" onDark />
        </Link>
        <CompanyHeader company={companyContext} />
      </div>

      <div className="flex items-center gap-4 h-full">
        <NavLink
          to={ROUTES_MAP['booking.public.appointment'].href}
          end
          className={({ isPending }) => (isPending ? 'pointer-events-none opacity-70' : undefined)}
        >
          {({ isPending }) => (
            <Button className="h-10 rounded border border-button-primary-border bg-button-primary-bg px-4 text-sm font-semibold text-button-primary-text transition-all duration-200 hover:bg-button-primary-hover-bg hover:text-button-primary-hover-text">
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

        <div className="hidden md:flex">
          {userBranches.length > 0 && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="User menu"
                  className="h-10 w-10 rounded border border-navbar-border bg-navbar-icon-bg text-navbar-text hover:bg-navbar-accent hover:border-primary hover:text-primary transition-all duration-200"
                >
                  <User className="h-5 w-5" />
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
          )}
        </div>

        {authBranches.map((link) => (
          <Link
            key={link.id}
            to={link.href}
            className="px-3 py-2 text-sm font-medium text-navbar-text-muted hover:text-navbar-text hover:bg-navbar-accent rounded transition-all duration-200"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
