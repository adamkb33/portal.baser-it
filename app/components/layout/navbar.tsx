import { Link } from 'react-router';
import { NavLink } from './nav-link';
import type { UserNavigation } from '~/lib/route-tree';
import { RoutePlaceMent, BrachCategory } from '~/lib/route-tree';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
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
          <BiTLogo size={'xl'} />
        </Link>
        <CompanyHeader company={companyContext} />
      </div>

      <div className="flex items-center gap-4 h-full">
        <div className="hidden md:flex">
          {userBranches.length > 0 && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="User menu" className="h-10 w-10 rounded">
                  <User className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                {userBranches.map((link) => (
                  <DropdownMenuItem key={link.id} asChild>
                    <Link to={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {authBranches.map((link) => (
          <NavLink key={link.id} link={link} />
        ))}
      </div>
    </div>
  );
}
