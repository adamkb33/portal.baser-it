import React from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ROUTE_TREE, type RouteBranch } from '~/lib/route-tree';

interface BreadcrumbsProps {
  items: RouteBranch[] | undefined;
  className?: string;
}

export function SidebarBreadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbTrail = React.useMemo(() => {
    const currentPath = location.pathname;

    const findPath = (navItems: RouteBranch[], path: RouteBranch[] = []): RouteBranch[] | null => {
      for (const item of navItems) {
        const currentTrail = [...path, item];

        if (item.href === currentPath) {
          return currentTrail;
        }

        if (item.children && item.children.length > 0) {
          const childPath = findPath(item.children, currentTrail);
          if (childPath) {
            return childPath;
          }
        }
      }
      return null;
    };

    const visibleTrail = findPath(items ?? []);
    if (visibleTrail) {
      return visibleTrail;
    }

    // Fallback for hidden detail routes that are intentionally removed from nav trees.
    return findPath(ROUTE_TREE) ?? [];
  }, [items, location.pathname]);

  if (breadcrumbTrail.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbTrail.map((item, index) => {
          const isLast = index === breadcrumbTrail.length - 1;

          return (
            <React.Fragment key={item.id}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <NavLink to={item.href}>{item.label}</NavLink>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
