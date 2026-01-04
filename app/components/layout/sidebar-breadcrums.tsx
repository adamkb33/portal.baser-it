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
import type { RouteBranch } from '~/lib/route-tree';

interface BreadcrumbsProps {
  items: RouteBranch[] | undefined;
  className?: string;
}

export function SidebarBreadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbTrail = React.useMemo(() => {
    const trail: RouteBranch[] = [];
    const currentPath = location.pathname;

    const findPath = (navItems: RouteBranch[], path: RouteBranch[] = []): boolean => {
      for (const item of navItems) {
        const currentTrail = [...path, item];

        if (item.href === currentPath) {
          trail.push(...currentTrail);
          return true;
        }

        if (item.children && item.children.length > 0) {
          if (findPath(item.children, currentTrail)) {
            return true;
          }
        }
      }
      return false;
    };

    findPath(items ?? []);
    return trail;
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
