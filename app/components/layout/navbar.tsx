import { Link } from 'react-router';
import type { UserNavigation } from '~/lib/route-tree';
import { RoutePlaceMent, BrachCategory } from '~/lib/route-tree';
import type { CompanySummaryDto } from '~/api/generated/identity';
import CompanyHeader from './company-header';
import { User } from 'lucide-react';
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
