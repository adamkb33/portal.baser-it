import type { RouteBranch, RouteDefinition, RouteTree, RoutesShape } from './functions';

const toSegment = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

function buildRouteBranch(
  definition: RouteDefinition,
  key: string,
  parentRoute: string,
  path: string[],
): RouteBranch {
  const segment = toSegment(key);
  const route = parentRoute ? `${parentRoute}/${segment}` : segment;
  const id = [...path].join('.');

  const childEntries = definition.children ?? {};
  const builtChildren: Record<string, RouteBranch> = {};

  for (const [childKey, childDef] of Object.entries(childEntries)) {
    builtChildren[childKey] = buildRouteBranch(childDef, childKey, route, [...path, childKey]);
  }

  const branch: RouteBranch = {
    $id: id,
    label: definition.label,
    route,
    $access: definition.access,
    $nav: definition.nav,
    $children: builtChildren,
  };

  Object.assign(branch, builtChildren);

  return branch;
}

export function buildRoutes(shape: RoutesShape, base = ''): RouteTree {
  const children: Record<string, RouteBranch> = {};

  for (const [key, definition] of Object.entries(shape)) {
    children[key] = buildRouteBranch(definition, key, base, [key]);
  }

  const root: RouteTree = {
    route: base,
    $children: children,
  };

  Object.assign(root, children);

  return root;
}

type RouteTuple = [path: string, moduleFile: string];

const hasChildren = (branch: RouteBranch) => Object.keys(branch.$children).length > 0;

export function collectRouteTuples(
  routesConst: RouteTree,
  options?: {
    baseDir?: string;
    ext?: string;
    indexName?: string;
  },
): RouteTuple[] {
  const baseDir = options?.baseDir ?? './routes';
  const ext = options?.ext ?? 'tsx';
  const indexName = options?.indexName ?? '_index';

  const tuples: RouteTuple[] = [];

  const walk = (branch: RouteBranch) => {
    const path = branch.route;
    if (path) {
      if (hasChildren(branch)) {
        tuples.push([path, `${baseDir}/${path}/${indexName}.${ext}`]);
      } else {
        tuples.push([path, `${baseDir}/${path}.${ext}`]);
      }
    }

    for (const child of Object.values(branch.$children)) {
      walk(child);
    }
  };

  for (const child of Object.values(routesConst.$children)) {
    walk(child);
  }

  return tuples;
}

export { toSegment };
