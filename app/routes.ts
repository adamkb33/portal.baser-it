import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';
import { API_ROUTES_TREE, ROUTE_TREE } from './lib/routing/route-tree';
import { buildApiRoutes, buildRoutesNested } from './lib/routing/routes-builder';

type BuiltRouteForLog = {
  path?: string;
  index?: boolean;
  file?: string;
  children?: BuiltRouteForLog[];
};

function joinRoutePath(parentPath: string, routePath?: string) {
  if (!routePath) {
    return parentPath || '/';
  }

  return `/${[parentPath, routePath].join('/')}`.replace(/\/+/g, '/');
}

function flattenRoutesForLog(routes: BuiltRouteForLog[], parentPath = ''): Array<{ path: string; file?: string }> {
  return routes.flatMap((route) => {
    const path = route.index ? parentPath || '/' : joinRoutePath(parentPath, route.path);
    const current = [{ path, file: route.file }];
    const children = route.children?.length ? flattenRoutesForLog(route.children, path) : [];
    return [...current, ...children];
  });
}

function logRoutesBuilderOutput(pageRoutes: BuiltRouteForLog[], apiRoutes: BuiltRouteForLog[]) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const flattenedPageRoutes = flattenRoutesForLog(pageRoutes);
  const flattenedApiRoutes = flattenRoutesForLog(apiRoutes);
  const bookingRoutes = flattenedPageRoutes.filter((route) => route.path.startsWith('/booking'));
  const suspiciousRoutes = flattenedPageRoutes.filter((route) => route.path.includes('/booking/booking'));

  console.info(
    '[routes-builder:startup]',
    JSON.stringify(
      {
        pageRouteCount: flattenedPageRoutes.length,
        apiRouteCount: flattenedApiRoutes.length,
        bookingRoutes,
        suspiciousRoutes,
        pageRoutes,
        apiRoutes,
      },
      null,
      2,
    ),
  );
}

const pageRoutes = buildRoutesNested(ROUTE_TREE);
const apiRoutes = buildApiRoutes(API_ROUTES_TREE);

logRoutesBuilderOutput(pageRoutes, apiRoutes);

export default [
  layout('routes/root.layout.tsx', [index('routes/root.route.tsx'), ...pageRoutes]),
  // Design-system reference page (Phase 2). Standalone, no auth layout.
  route('styleguide', 'routes/styleguide.tsx'),
  ...apiRoutes,
] satisfies RouteConfig;
