import { type RouteConfig, index } from '@react-router/dev/routes';

import { ROUTE_TREE } from './lib/route-tree';
import { buildRoutesNested } from './lib/routes-builder';

console.log(JSON.stringify(buildRoutesNested(ROUTE_TREE)));

export default [index('./routes/home.tsx'), ...buildRoutesNested(ROUTE_TREE)] satisfies RouteConfig;
