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

    routes.push({
      path: branch.href,
      file,
    });

    if (branch.children) {
      routes.push(...buildRoutesFlat(branch.children, branch.href));
    }
  }

  return routes;
};
