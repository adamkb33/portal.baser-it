import {
  type Area,
  type Audience,
  type RouteTree,
  type RouteNode,
  isRouteNode,
  toHref,
  hasChildNodes,
  type RegistryNode,
} from './functions';

export type RegistryMeta = {
  area: Area;
  audience: Audience;
  order?: number;
  iconKey?: string;
};

export type RegistryMetaTable = Record<string, RegistryMeta>;

function makeDotId(stack: string[], key: string) {
  return [...stack, key].join('.');
}

export function buildRegistryFromRoutes(
  routes: RouteTree,
  meta: RegistryMetaTable,
  baseHref: string = '/',
): RegistryNode[] {
  const out: RegistryNode[] = [];

  const walk = (node: RouteNode, stack: string[]) => {
    const keys = Object.keys(node).filter((k) => k !== 'route' && k !== 'label');

    for (const key of keys) {
      const value = (node as any)[key];
      if (!isRouteNode(value)) continue;

      const dotId = makeDotId(stack, key);
      const m = meta[dotId];

      // Does this node have structural children?
      const nodeHasChildren = hasChildNodes(value);

      if (!m) {
        // ✅ No metadata: treat as a structural group.
        // Recurse so children can still be registered if they have meta.
        walk(value, [...stack, key]);
        continue;
      }

      // Build the registry node since it has meta (it's a real menu item)
      const reg: RegistryNode = {
        id: dotId,
        label: (value as any).label ?? key,
        href: value.route ? toHref(String(value.route), baseHref) : undefined,
        area: m.area,
        audience: m.audience,
        order: m.order,
        iconKey: m.iconKey,
      };

      if (nodeHasChildren) {
        const childKeys = Object.keys(value).filter((k) => k !== 'route' && k !== 'label');
        const children: { id: string; label: string; href?: string; order?: number }[] = [];

        for (const ck of childKeys) {
          const cn = (value as any)[ck];
          if (!isRouteNode(cn)) continue;

          const childDotId = `${dotId}.${ck}`;
          const cm = meta[childDotId]; // optional child meta for ordering

          children.push({
            id: childDotId,
            label: (cn as any).label ?? ck,
            href: cn.route ? toHref(String(cn.route), baseHref) : undefined,
            order: cm?.order,
          });
        }

        if (children.length) {
          children.sort((a, b) => {
            const oa = a.order ?? 100;
            const ob = b.order ?? 100;
            return oa === ob ? a.label.localeCompare(b.label) : oa - ob;
          });
          (reg as any).children = children;
        }
      }

      out.push(reg);

      // Recurse to register deeper descendants too (they may have their own meta)
      walk(value, [...stack, key]);
    }
  };

  if (isRouteNode(routes as any)) {
    walk(routes as any, []);
  } else {
    const rootKeys = Object.keys(routes);
    for (const key of rootKeys) {
      const maybeNode = (routes as any)[key];
      if (isRouteNode(maybeNode)) {
        walk(maybeNode, [key]);
      }
    }
  }

  return out;
}

export const defaultMeta: RegistryMetaTable = {
  'auth.signIn': { area: 'end', audience: 'auth', order: 90 },
  'auth.signOut': { area: 'end', audience: 'auth', order: 90 },
  'auth.acceptInvite': { area: 'end', audience: 'public', order: 95 },

  'user.profile': { area: 'account', audience: 'auth', order: 10 },
  'employee.profile': { area: 'account', audience: 'employee', order: 20 },

  'admin.dashboard': { area: 'sidebar', audience: 'admin', order: 10, iconKey: 'layout-dashboard' },
  'admin.company': { area: 'sidebar', audience: 'admin', order: 20, iconKey: 'building-2' },
  'admin.company.settings': { area: 'sidebar', audience: 'admin', order: 21 },
  'admin.company.employees': { area: 'sidebar', audience: 'admin', order: 22 },
};
