import type { RouteConfigEntry } from '@react-router/dev/routes';
import type { RouteBranch } from './nav/route-tree';

export const buildRoutesFlat = (
  routeTree: RouteBranch[],
  parentPath = '',
  routesPath = 'routes/',
): RouteConfigEntry[] => {
  const routes: RouteConfigEntry[] = [];

  for (const branch of routeTree) {
    const hasChildren = !!branch.children;
    const file = routesPath + branch.id.replace(/\./g, '/') + (hasChildren ? '/_index.tsx' : '.tsx');

    const fullPath = `${parentPath.replace(/\/$/, '')}/${branch.href.replace(/^\//, '')}`.replace(/\/+/g, '/');

    routes.push({
      path: fullPath === '/' ? undefined : fullPath,
      file,
    });

    if (branch.children) {
      routes.push(...buildRoutesFlat(branch.children, fullPath));
    }
  }

  return routes;
};
