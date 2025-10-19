import { Link } from 'react-router';
import { NavLink } from './nav-link';
import type { RouteBranch } from '~/lib/nav/route-tree';

export type NavbarProps = {
  mid: RouteBranch[] | undefined;
  right: RouteBranch[] | undefined;
};

export function Navbar({ mid, right }: NavbarProps) {
  return (
    <nav className="flex flex-1 items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-semibold">
          Logo
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        {mid?.map((link) => (
          <NavLink key={link.id} link={link} />
        ))}
      </nav>

      <nav className="hidden md:flex items-center gap-4">
        {right?.map((link) => (
          <NavLink key={link.id} link={link} variant="button" />
        ))}
      </nav>
    </nav>
  );
}
