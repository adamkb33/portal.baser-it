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
import type { NavItem } from '~/lib/navigation/functions';
import type { RouteBranch } from '~/lib/nav/route-tree';

interface BreadcrumbsProps {
  items: RouteBranch[] | undefined;
  className?: string;
}

export function NavBreadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbTrail = React.useMemo(() => {
    const trail: NavItem[] = [];
    const currentPath = location.pathname;

    const findPath = (navItems: NavItem[], path: NavItem[] = []): boolean => {
      for (const item of navItems) {
        const currentTrail = [...path, item];

        // Check if this item matches the current location
        if (item.href === currentPath) {
          trail.push(...currentTrail);
          return true;
        }

        // Recursively search children
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
        {breadcrumbTrail.map((item, index) => (
          <React.Fragment key={item.id}>
            <BreadcrumbItem>
              {index === breadcrumbTrail.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <NavLink to={item.href}>{item.label}</NavLink>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbTrail.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
