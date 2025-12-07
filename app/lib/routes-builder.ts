import type { RouteConfigEntry } from '@react-router/dev/routes';
import type { RouteBranch } from './route-tree';

export const buildRoutesNested = (routeTree: RouteBranch[], parentPath = ''): RouteConfigEntry[] => {
  const routes: RouteConfigEntry[] = [];

  for (const branch of routeTree) {
    const fileName = branch.id.replace(/\./g, '/');

    const absolutePath = parentPath ? `${parentPath}/${branch.href}`.replace(/\/+/g, '/') : branch.href;

    const path = branch.href;

    const hasChildren = !!branch.children && branch.children.length > 0;

    routes.push({
      path,
      file: `routes/${fileName}/layout.tsx`,
      children: [
        {
          index: true,
          file: `routes/${fileName}/_index.tsx`,
        },
        ...(hasChildren ? buildRoutesNested(branch.children as RouteBranch[], absolutePath) : []),
      ],
    });
  }

  return routes;
};
