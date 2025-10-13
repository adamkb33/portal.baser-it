type NodeInput = {
  label?: string;
  [key: string]: NodeInput | string | undefined;
};

type NodeOutput<T extends NodeInput> = {
  label?: T['label'];
  route: string;
} & {
  [K in Exclude<keyof T, 'label'>]: T[K] extends NodeInput ? NodeOutput<T[K]> : T[K];
};

const toKebabCase = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

export function buildRoutes<T extends NodeInput>(tree: T, base = ''): NodeOutput<T> {
  const walk = (node: NodeInput, prefix: string): any => {
    const { label, ...rest } = node;
    const out: Record<string, any> = {};

    for (const key of Object.keys(rest)) {
      const value = rest[key];
      if (value && typeof value === 'object') {
        const segment = toKebabCase(key);
        const full = prefix ? `${prefix}/${segment}` : segment;
        out[key] = {
          label: (value as NodeInput).label,
          route: full,
          ...walk(value as NodeInput, full),
        };
      }
    }

    return out;
  };

  const ROOT_SEGMENT = base;
  const rootRoute = ROOT_SEGMENT;
  return {
    label: tree.label,
    route: rootRoute,
    ...walk(tree, rootRoute),
  } as NodeOutput<T>;
}

type RouteNode = { route?: unknown; [k: string]: unknown };
type RouteTuple = [path: string, moduleFile: string];

function isNode(v: unknown): v is RouteNode {
  return !!v && typeof v === 'object' && 'route' in (v as any) && typeof (v as any).route === 'string';
}

function hasChildNodes(node: RouteNode): boolean {
  return Object.keys(node).some((k) => k !== 'route' && isNode((node as any)[k]));
}

export function collectRouteTuples(
  routesConst: Record<string, unknown>,
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

  const walk = (obj: Record<string, unknown>) => {
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (!isNode(val)) continue;

      const path = val.route as string;
      const hasChildren = hasChildNodes(val);

      if (hasChildren) {
        tuples.push([path, `${baseDir}/${path}/${indexName}.${ext}`]);
      } else {
        tuples.push([path, `${baseDir}/${path}.${ext}`]);
      }

      for (const childKey of Object.keys(val)) {
        if (childKey === 'route') continue;
        const child = (val as any)[childKey];
        if (isNode(child)) {
          walk({ [childKey]: child });
        }
      }
    }
  };

  walk(routesConst);
  return tuples;
}
