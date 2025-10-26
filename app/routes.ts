import { type RouteConfig, index } from '@react-router/dev/routes';

import { ROUTE_TREE } from './lib/nav/route-tree';
import { buildRoutesNested } from './lib/routes-builder';

export default [index('./routes/home.tsx'), ...buildRoutesNested(ROUTE_TREE)] satisfies RouteConfig;
