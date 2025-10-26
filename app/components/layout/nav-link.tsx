import { matchPath, useLocation, useResolvedPath, NavLink as ReactRouterNavLink } from 'react-router';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '~/lib/utils';

export type NavItem = { href: string; label: string };
type MatchMode = 'exact' | 'prefix';

interface NavLinkProps extends Omit<ComponentPropsWithoutRef<typeof ReactRouterNavLink>, 'to' | 'children'> {
  link: NavItem;
  variant?: 'link' | 'button';
  matchMode?: MatchMode;
  activeClassName?: string;
}

export function NavLink({
  link,
  variant,
  matchMode = 'exact',
  className,
  activeClassName = 'text-primary font-medium',
  ...props
}: NavLinkProps) {
  const location = useLocation();
  const resolved = useResolvedPath(link.href);

  const isActive = !!matchPath({ path: resolved.pathname, end: matchMode === 'exact' }, location.pathname);

  const base = 'text-sm transition-colors';
  const variantClasses =
    variant === 'button' ? 'rounded-md border border-zinc-200 px-3 py-1.5 hover:bg-zinc-100' : 'hover:text-primary';

  return (
    <ReactRouterNavLink
      to={link.href}
      className={cn(base, variantClasses, isActive && activeClassName, className)}
      {...props}
    >
      {link.label}
    </ReactRouterNavLink>
  );
}
