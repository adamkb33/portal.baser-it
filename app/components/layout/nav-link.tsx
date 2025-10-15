import { matchPath, useLocation, useResolvedPath, NavLink as ReactRouterNavLink } from 'react-router';

type NavItem = { href: string; label: string };
type MatchMode = 'exact' | 'prefix';

export function NavLink({
  link,
  variant,
  matchMode = 'exact',
}: {
  link: NavItem;
  variant?: 'link' | 'button';
  matchMode?: MatchMode;
}) {
  const location = useLocation();
  console.log(location.pathname);
  console.log(link.href.split('/').at(-1));
  console.log(location.pathname.split('/').at(-1));

  const resolved = useResolvedPath(link.href);

  const isActive = !!matchPath({ path: resolved.pathname, end: matchMode === 'exact' }, location.pathname);

  const base = 'text-sm transition-colors';
  const variantClasses =
    variant === 'button' ? 'rounded-md border border-zinc-200 px-3 py-1.5 hover:bg-zinc-100' : 'hover:text-primary';

  return (
    <ReactRouterNavLink
      to={link.href}
      className={[base, variantClasses, isActive ? 'text-primary font-medium' : ''].filter(Boolean).join(' ')}
    >
      {link.label}
    </ReactRouterNavLink>
  );
}
