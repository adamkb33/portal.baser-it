import type { AuthenticatedUserPayload } from '~/api/clients/types';

import { canAccess, snapshotAuth } from './audiences';
import {
  NAV_PLACEMENT_LIST,
  type AuthSnapshot,
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

export class NavigationBuilder {
  private readonly routes: RouteTree;
  private readonly baseHref: string;
  private readonly snapshot: AuthSnapshot;

  constructor({ routes = ROUTES, payload = null, baseHref = '/' }: NavigationBuildOptions = {}) {
    this.routes = routes;
    this.baseHref = baseHref;
    this.snapshot = snapshotAuth(payload);
  }

  buildModel(): NavModel {
    const entries = this.collectEntries();

    const model = NavigationBuilder.createEmptyModel();
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
      NavigationBuilder.sortItems(model[placement], orderMap);
    }

    return model;
  }

  buildSections(): NavigationSections {
    const model = this.buildModel();

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

  private collectEntries(): NavEntry[] {
    const entries: NavEntry[] = [];

    for (const branch of Object.values(this.routes.$children)) {
      this.visit(branch, entries);
    }

    return entries;
  }

  private visit(node: RouteBranch, entries: NavEntry[]) {
    if (node.$nav && canAccess(node.$access, this.snapshot)) {
      entries.push({
        id: node.$id,
        parentId: NavigationBuilder.parentIdOf(node.$id),
        placement: node.$nav.placement,
        order: node.$nav.order ?? DEFAULT_ORDER,
        item: {
          id: node.$id,
          label: node.label,
          href: toHref(node.route, this.baseHref),
          icon: node.$nav.icon,
          children: [],
        },
      });
    }

    for (const child of Object.values(node.$children)) {
      this.visit(child, entries);
    }
  }

  private static createEmptyModel(): NavModel {
    return NAV_PLACEMENT_LIST.reduce(
      (acc, placement) => {
        acc[placement] = [];
        return acc;
      },
      {} as NavModel,
    );
  }

  private static parentIdOf(id: string) {
    return id.includes('.') ? id.split('.').slice(0, -1).join('.') : null;
  }

  private static sortItems(items: NavItem[], orderMap: Map<string, number>) {
    items.sort((a, b) => {
      const oa = orderMap.get(a.id) ?? DEFAULT_ORDER;
      const ob = orderMap.get(b.id) ?? DEFAULT_ORDER;
      if (oa !== ob) return oa - ob;
      return a.label.localeCompare(b.label);
    });

    for (const item of items) {
      if (item.children?.length) {
        NavigationBuilder.sortItems(item.children, orderMap);
      }
    }
  }
}

export function createNavigationModel(options?: NavigationBuildOptions): NavModel {
  return new NavigationBuilder(options).buildModel();
}

export function createNavigationSections(options?: NavigationBuildOptions): NavigationSections {
  return new NavigationBuilder(options).buildSections();
}
