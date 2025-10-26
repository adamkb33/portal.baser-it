import type { RouteConfigEntry } from '@react-router/dev/routes';
import type { RouteBranch } from './nav/route-tree';

export const buildRoutesNested = (routeTree: RouteBranch[]): RouteConfigEntry[] => {
  const routes: RouteConfigEntry[] = [];

  for (const branch of routeTree) {
    const hasChildren = !!branch.children && branch.children.length > 0;
    const fileName = branch.id.replace(/\./g, '/');

    const fileNameParts = fileName.split('/');
    const fileEnd = hasChildren ? `/${fileNameParts[fileNameParts.length - 1]}.tsx` : '.tsx';
    const file = 'routes/' + fileName + fileEnd;

    if (hasChildren) {
      routes.push({
        path: branch.href,
        file,
        children: buildRoutesNested(branch.children as RouteBranch[]),
      });
    } else {
      routes.push({
        path: branch.href,
        file,
      });
    }
  }

  return routes;
};
