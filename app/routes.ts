import { type RouteConfig, index, route } from '@react-router/dev/routes';
import { ROUTES } from './lib/navigation/routes';
import { collectRouteTuples } from './lib/navigation/routes-builder';

const tuples = collectRouteTuples(ROUTES, {
  baseDir: './routes',
  ext: 'tsx',
  indexName: '_index',
});

export default [
  index('./routes/home.tsx'),

  ...tuples.map(([path, moduleFile]) => route(path, moduleFile)),
] satisfies RouteConfig;
