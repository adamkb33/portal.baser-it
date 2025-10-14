import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { snapshotAuth, visibleFor } from './audiences';
import type { NavModel, RegistryNode, Area, NavItem, RouteTree, AuthSnapshot } from './functions';
import { type RegistryMetaTable, defaultMeta, buildRegistryFromRoutes } from './registry';

function emptyModel(): NavModel {
  return { start: [], middle: [], end: [], account: [], sidebar: [] };
}

function groupByArea(nodes: RegistryNode[]): Record<Area, NavItem[]> {
  const grouped = emptyModel() as Record<Area, NavItem[]>;

  for (const n of nodes) {
    const item: NavItem = {
      id: n.id,
      label: n.label,
      href: n.href,
      iconKey: n.iconKey,
      children: n.children?.map((c) => ({ id: c.id, label: c.label, href: c.href })),
    };
    grouped[n.area].push(item);
  }

  return grouped;
}

function sortTopLevel(items: NavItem[], orderIndex: Record<string, number>) {
  items.sort((a, b) => {
    const oa = orderIndex[a.id] ?? 100;
    const ob = orderIndex[b.id] ?? 100;
    return oa === ob ? a.label.localeCompare(b.label) : oa - ob;
  });
}

function sortChildren(items: NavItem[]) {
  for (const it of items) {
    if (it.children?.length) {
      it.children = it.children.slice().sort((a, b) => a.label.localeCompare(b.label));
    }
  }
}

function makeOrderIndex(all: RegistryNode[]): Record<string, number> {
  const idx: Record<string, number> = {};
  for (const n of all) idx[n.id] = n.order ?? 100;
  return idx;
}

/**
 * Build a NavModel directly from the ROUTES tree produced by your buildRoutes(shape).
 * This keeps ROUTES as the single source of truth for hrefs/labels,
 * and uses a metadata table for audience/area/order/icon.
 *
 * @param routes   ROUTES (the object returned by buildRoutes(shape))
 * @param payload  decoded user payload (or null/undefined for guest)
 * @param meta     optional override for the default meta table
 * @param baseHref optional base path (default '/')
 */
export function buildNavigationFromRoutes(
  routes: RouteTree,
  payload?: AuthenticatedUserPayload | null,
  meta: RegistryMetaTable = defaultMeta,
  baseHref: string = '/',
): NavModel {
  // 1) Build a flat registry from the route tree + meta
  const registry = buildRegistryFromRoutes(routes, meta, baseHref);

  // 2) Snapshot auth and filter by audience
  const snap: AuthSnapshot = snapshotAuth(payload);
  const audienceFiltered = registry.filter((n) => visibleFor(n.audience, snap));

  // 3) Optionally prune empty groups (no href + no children)
  const kept = audienceFiltered.filter((n) => n.href || (n.children && n.children.length));

  // 4) Group into areas and sort
  const orderIndex = makeOrderIndex(registry);
  const grouped = groupByArea(kept);

  (Object.keys(grouped) as Array<keyof NavModel>).forEach((area) => {
    sortChildren(grouped[area]);
    sortTopLevel(grouped[area], orderIndex);
  });

  return grouped as NavModel;
}
