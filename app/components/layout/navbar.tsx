import { Link, useLocation, useResolvedPath, matchPath } from 'react-router';
import type { NavItem } from '~/lib/navigation/index';
import { NavLink } from './nav-link';

interface NavbarSections {
  start: NavItem[];
  middle: NavItem[];
  end: NavItem[];
}

interface NavbarProps {
  sections: NavbarSections;
  accountItems?: NavItem[];
  brandHref?: string;
}

export function Navbar({ sections, accountItems = [], brandHref = '/' }: NavbarProps) {
  const startLinks = sections.start;
  const middleLinks = sections.middle;
  const endLinks = sections.end;

  return (
    <nav className="flex flex-1 items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link to={brandHref} className="text-xl font-semibold">
          Logo
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          {startLinks.map((link) => (
            <NavLink key={link.id} link={link} />
          ))}
        </nav>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        {middleLinks.map((link) => (
          <NavLink key={link.id} link={link} />
        ))}
      </nav>

      <nav className="hidden md:flex items-center gap-4">
        {accountItems.map((link) => (
          <NavLink key={link.id} link={link} />
        ))}
        {endLinks.map((link) => (
          <NavLink key={link.id} link={link} variant="button" />
        ))}
      </nav>
    </nav>
  );
}
