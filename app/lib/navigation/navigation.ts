import type { AuthenticatedUserPayload } from '~/api/clients/types';

import { canAccess, snapshotAuth } from './audiences';
import {
  NAV_PLACEMENT_LIST,
  type NavItem,
  type NavModel,
  type NavPlacement,
  type RouteBranch,
  type RouteTree,
  toHref,
} from './functions';
import { ROUTES } from './routes';

const DEFAULT_ORDER = 100;

type NavEntry = {
  id: string;
  parentId: string | null;
  placement: NavPlacement;
  order: number;
  item: NavItem;
};

export interface NavigationBuildOptions {
  routes?: RouteTree;
  payload?: AuthenticatedUserPayload | null;
  baseHref?: string;
}

export interface NavigationSections {
  navbar: {
    start: NavItem[];
    middle: NavItem[];
    end: NavItem[];
  };
  account: NavItem[];
  sidebar: NavItem[];
}

export function createNavigationModel(options: NavigationBuildOptions = {}): NavModel {
  const routes = options.routes ?? ROUTES;
  const payload = options.payload ?? null;
  const baseHref = options.baseHref ?? '/';

  const entries = collectEntries(routes, payload, baseHref);

  return buildModel(entries);
}

export function createNavigationSections(options: NavigationBuildOptions = {}): NavigationSections {
  const model = createNavigationModel(options);

  return {
    navbar: {
      start: model.navbar_start,
      middle: model.navbar_middle,
      end: model.navbar_end,
    },
    account: model.account,
    sidebar: model.sidebar,
  };
}

function collectEntries(routes: RouteTree, payload: AuthenticatedUserPayload | null, baseHref: string): NavEntry[] {
  const snap = snapshotAuth(payload);
  const entries: NavEntry[] = [];

  const visit = (node: RouteBranch) => {
    if (node.$nav && canAccess(node.$access, snap)) {
      entries.push({
        id: node.$id,
        parentId: parentIdOf(node.$id),
        placement: node.$nav.placement,
        order: node.$nav.order ?? DEFAULT_ORDER,
        item: {
          id: node.$id,
          label: node.label,
          href: toHref(node.route, baseHref),
          icon: node.$nav.icon,
          children: [],
        },
      });
    }

    for (const child of Object.values(node.$children)) {
      visit(child);
    }
  };

  for (const branch of Object.values(routes.$children)) {
    visit(branch);
  }

  return entries;
}

function buildModel(entries: NavEntry[]): NavModel {
  const model = createEmptyModel();
  const items = new Map<string, NavItem>();
  const orderMap = new Map<string, number>();

  for (const entry of entries) {
    items.set(entry.id, entry.item);
    orderMap.set(entry.id, entry.order);
  }

  for (const entry of entries) {
    if (!entry.parentId) continue;
    const parent = items.get(entry.parentId);
    const child = items.get(entry.id);
    if (parent && child) {
      parent.children = parent.children ?? [];
      parent.children.push(child);
    }
  }

  for (const entry of entries) {
    const item = items.get(entry.id);
    if (!item) continue;
    model[entry.placement].push(item);
  }

  for (const placement of NAV_PLACEMENT_LIST) {
    sortNavItems(model[placement], orderMap);
  }

  return model;
}

const createEmptyModel = (): NavModel =>
  NAV_PLACEMENT_LIST.reduce(
    (acc, placement) => {
      acc[placement] = [];
      return acc;
    },
    {} as NavModel,
  );

const parentIdOf = (id: string) => (id.includes('.') ? id.split('.').slice(0, -1).join('.') : null);

const sortNavItems = (items: NavItem[], orderMap: Map<string, number>) => {
  items.sort((a, b) => {
    const oa = orderMap.get(a.id) ?? DEFAULT_ORDER;
    const ob = orderMap.get(b.id) ?? DEFAULT_ORDER;
    if (oa !== ob) return oa - ob;
    return a.label.localeCompare(b.label);
  });

  for (const item of items) {
    if (item.children?.length) {
      sortNavItems(item.children, orderMap);
    }
  }
};
