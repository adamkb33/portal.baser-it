import type { RouteConfigEntry } from '@react-router/dev/routes';
import type { RouteBranch } from './nav/route-tree';

export const buildRoutesNested = (routeTree: RouteBranch[]): RouteConfigEntry[] => {
  const routes: RouteConfigEntry[] = [];

  for (const branch of routeTree) {
    const hasChildren = !!branch.children && branch.children.length > 0;
    const fileName = branch.id.replace(/\./g, '/');

    if (hasChildren) {
      // Parent layout route with children
      routes.push({
        path: branch.href,
        file: `routes/${fileName}/layout.tsx`, // Layout component
        children: [
          // Index route for the parent path itself
          {
            index: true,
            file: `routes/${fileName}/_index.tsx`,
          },
          // Nested children routes
          ...buildRoutesNested(branch.children as RouteBranch[]),
        ],
      });
    } else {
      routes.push({
        path: branch.href,
        file: `routes/${fileName}.tsx`,
      });
    }
  }

  return routes;
};
