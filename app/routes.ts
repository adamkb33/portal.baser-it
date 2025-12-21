import { type RouteConfig } from '@react-router/dev/routes';

import { API_ROUTES_TREE, ROUTE_TREE } from './lib/route-tree';
import { buildApiRoutes, buildRoutesNested } from './lib/routes-builder';

export default [...buildRoutesNested(ROUTE_TREE), ...buildApiRoutes(API_ROUTES_TREE)] satisfies RouteConfig;
