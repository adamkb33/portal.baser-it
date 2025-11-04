import { Link } from 'react-router';
import { NavLink } from './nav-link';
import type { BrachCategory, BranchGroup } from '~/lib/route-tree';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import CompanyHeader from './company-header';
import { User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import BiTLogo from '../logos/BiT.logo';

export type NavbarProps = {
  navRoutes: Record<BrachCategory, BranchGroup> | undefined;
  companyContext: CompanySummaryDto | null | undefined;
};

export function Navbar({ navRoutes, companyContext }: NavbarProps) {
  return (
    <nav className="flex flex-1 items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-semibold">
          <BiTLogo />
        </Link>

        <CompanyHeader company={companyContext} />
      </div>

      <nav className="hidden md:flex items-center gap-4">
        {navRoutes?.USER?.branches?.length && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="User menu">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              {navRoutes.USER.branches.map((link) => (
                <DropdownMenuItem key={link.id} asChild>
                  <Link to={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {navRoutes?.AUTH?.branches?.map((link) => (
          <NavLink key={link.id} link={link} />
        ))}
      </nav>
    </nav>
  );
}
