import { type RouteConfig, index, route } from '@react-router/dev/routes';

import { ROUTE_TREE } from './lib/nav/route-tree';
import { buildRoutesFlat } from './lib/routes-builder';

export default [index('./routes/home.tsx'), ...buildRoutesFlat(ROUTE_TREE)] satisfies RouteConfig;
