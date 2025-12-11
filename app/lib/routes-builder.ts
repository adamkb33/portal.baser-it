import type { RouteConfigEntry } from '@react-router/dev/routes';
import type { RouteBranch } from './route-tree';

export const buildRoutesNested = (routeTree: RouteBranch[], parentPath = ''): RouteConfigEntry[] => {
  const routes: RouteConfigEntry[] = [];

  for (const branch of routeTree) {
    const segments = branch.id.split('.');
    const folderPath = segments.join('/');
    const fileName = branch.id;

    const path = branch.href;
    const hasChildren = !!branch.children && branch.children.length > 0;
    const absolutePath = parentPath ? `${parentPath}/${branch.href}`.replace(/\/+/g, '/') : branch.href;

    routes.push({
      path,
      file: `routes/${folderPath}/${fileName}.layout.tsx`,
      children: [
        {
          index: true,
          file: `routes/${folderPath}/${fileName}.route.tsx`,
        },
        ...(hasChildren ? buildRoutesNested(branch.children as RouteBranch[], absolutePath) : []),
      ],
    });
  }

  return routes;
};
