import type { RouteConfigEntry } from '@react-router/dev/routes';
import type { ApiRoute, RouteBranch } from './route-tree';

export const buildRoutesNested = (routeTree: RouteBranch[], parentPath = ''): RouteConfigEntry[] => {
  const routes: RouteConfigEntry[] = [];

  for (const branch of routeTree) {
    const segments = branch.id.split('.');
    const folderPath = segments.join('/');
    const fileName = branch.id;

    const path = branch.href;
    const hasChildren = !!branch.children && branch.children.length > 0;
    const absolutePath = parentPath ? `${parentPath}/${branch.href}`.replace(/\/+/g, '/') : branch.href;

    const childRoutes = hasChildren ? buildRoutesNested(branch.children as RouteBranch[], absolutePath) : [];

    if (branch.excludeLayout) {
      routes.push({
        path,
        file: `routes/${folderPath}/${fileName}.route.tsx`,
        ...(childRoutes.length > 0 && { children: childRoutes }),
      });
      continue;
    }

    routes.push({
      path,
      file: `routes/${folderPath}/${fileName}.layout.tsx`,
      children: [
        {
          index: true,
          file: `routes/${folderPath}/${fileName}.route.tsx`,
        },
        ...childRoutes,
      ],
    });
  }

  return routes;
};

export const buildApiRoutes = (apiTree: ApiRoute[], parentPath = ''): RouteConfigEntry[] => {
  const routes: RouteConfigEntry[] = [];

  for (const branch of apiTree) {
    const segments = branch.id.split('.');
    const folderPath = segments.join('/');
    const fileName = branch.id;

    const path = branch.url.replace(parentPath, '').replace(/^\//, '');
    const hasChildren = !!branch.children && branch.children.length > 0;

    routes.push({
      path,
      file: `routes/api/${folderPath}/${fileName}.api-route.ts`,
      ...(hasChildren && {
        children: buildApiRoutes(branch.children!, branch.url),
      }),
    });
  }

  return routes;
};
