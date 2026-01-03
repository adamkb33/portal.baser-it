import { matchPath, useLocation, useResolvedPath, NavLink as ReactRouterNavLink } from 'react-router';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '~/lib/utils';

import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  label?: string;
  icon?: LucideIcon;
};
type MatchMode = 'exact' | 'prefix';
type Variant = 'link' | 'button' | 'pill' | 'underline';

interface NavLinkProps extends Omit<ComponentPropsWithoutRef<typeof ReactRouterNavLink>, 'to' | 'children'> {
  link: NavItem;
  variant?: Variant;
  matchMode?: MatchMode;
  activeClassName?: string;
  showActiveIndicator?: boolean;
}

export function NavLink({
  link,
  variant = 'link',
  matchMode = 'exact',
  className,
  activeClassName,
  showActiveIndicator = false,
  ...props
}: NavLinkProps) {
  const location = useLocation();
  const resolved = useResolvedPath(link.href);

  const isActive = !!matchPath({ path: resolved.pathname, end: matchMode === 'exact' }, location.pathname);

  const baseStyles = cn(
    'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-40',
  );

  const variantStyles = {
    link: cn(
      'text-muted-foreground hover:text-primary',
      'hover:scale-105',
      isActive && (activeClassName || 'text-primary font-semibold'),
    ),

    button: cn(
      'rounded-lg border px-4 py-2.5 min-h-[40px]',
      'shadow-sm hover:shadow-md',
      isActive
        ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
        : 'bg-background text-foreground border-border hover:bg-accent/10 hover:text-primary hover:border-primary/30 hover:scale-[1.02]',
      'active:scale-[0.98]',
    ),

    pill: cn(
      'rounded-full px-4 py-2 min-h-[36px]',
      isActive
        ? 'bg-primary/10 text-primary font-semibold shadow-sm'
        : 'bg-muted/50 text-muted-foreground hover:bg-accent/15 hover:text-primary hover:scale-105',
      'active:scale-[0.98]',
    ),

    underline: cn(
      'relative pb-1 text-muted-foreground hover:text-primary',

      'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
      'after:bg-primary after:transition-all after:duration-200',
      isActive
        ? 'text-primary font-semibold after:opacity-100 after:scale-x-100'
        : 'after:opacity-0 after:scale-x-0 hover:after:opacity-50 hover:after:scale-x-100',
    ),
  }[variant];

  const renderIcon = () => {
    if (!link.icon) {
      return null;
    }

    const IconComponent = link.icon;

    if (typeof IconComponent !== 'function' && typeof IconComponent !== 'object') {
      console.error('Icon is not a valid component:', IconComponent);
      return null;
    }

    try {
      return (
        <span
          className={cn('flex-shrink-0 transition-all duration-200', isActive && variant !== 'link' && 'scale-110')}
        >
          <IconComponent className="w-4 h-4" />
        </span>
      );
    } catch (error) {
      console.error('Error rendering icon:', error, IconComponent);
      return null;
    }
  };

  return (
    <ReactRouterNavLink
      to={link.href}
      className={cn(baseStyles, variantStyles, className)}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {renderIcon()}

      <span className="truncate">{link.label}</span>

      {showActiveIndicator && isActive && (
        <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary shadow-sm" aria-hidden="true" />
      )}
    </ReactRouterNavLink>
  );
}

export function NavLinkButton(props: Omit<NavLinkProps, 'variant'>) {
  return <NavLink variant="button" {...props} />;
}

export function NavLinkPill(props: Omit<NavLinkProps, 'variant'>) {
  return <NavLink variant="pill" {...props} />;
}

export function NavLinkUnderline(props: Omit<NavLinkProps, 'variant'>) {
  return <NavLink variant="underline" {...props} />;
}

interface NavGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function NavGroup({ children, className, orientation = 'horizontal' }: NavGroupProps) {
  return (
    <nav
      className={cn('flex gap-1', orientation === 'vertical' ? 'flex-col' : 'flex-row items-center', className)}
      role="navigation"
    >
      {children}
    </nav>
  );
}
