import { describe, it, expect } from 'vitest';
import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { buildRoutes } from '~/lib/navigation/routes-builder';
import { createNavigationModel } from '../navigation';
import type { NavItem, NavModel, RouteBranch, RouteTree } from '../functions';
import { ROUTES_SHAPE } from '~/lib/navigation/routes';
import { NAV_PLACEMENT_LIST, toHref } from '../functions';
import { canAccess, snapshotAuth } from '../audiences';

const DEFAULT_ORDER = 100;

const makePayload = (partial: Partial<AuthenticatedUserPayload> = {}): AuthenticatedUserPayload => ({
  id: 1,
  email: 'test@example.com',
  roles: [],
  companyRoles: [],
  ...partial,
});

describe('createNavigationModel (E2E)', () => {
  const ROUTES: RouteTree = buildRoutes(ROUTES_SHAPE);
  const buildModel = (payload: AuthenticatedUserPayload | null) =>
    createNavigationModel({ routes: ROUTES, payload, baseHref: '/' });
  const buildExpected = (payload: AuthenticatedUserPayload | null) =>
    createExpectedNavigationModel(ROUTES, payload, '/');

  it('guest navigation matches routes shape', () => {
    const model = buildModel(null);
    const expected = buildExpected(null);

    expect(model).toEqual(expected);
  });

  it('authenticated user navigation matches routes shape', () => {
    const payload = makePayload();
    const model = buildModel(payload);
    const expected = buildExpected(payload);

    expect(model).toEqual(expected);
  });

  it('employee navigation matches routes shape', () => {
    const payload = makePayload({ companyRoles: [{ companyId: 1, role: 'EMPLOYEE' }] });
    const model = buildModel(payload);
    const expected = buildExpected(payload);

    expect(model).toEqual(expected);
  });

  it('admin navigation matches routes shape', () => {
    const payload = makePayload({ companyRoles: [{ companyId: 1, role: 'ADMIN' }] });
    const model = buildModel(payload);
    const expected = buildExpected(payload);

    expect(model).toEqual(expected);
  });

  it('system admin without company role navigation matches routes shape', () => {
    const payload = makePayload({ roles: ['SYSTEM_ADMIN'] });
    const model = buildModel(payload);
    const expected = buildExpected(payload);

    expect(model).toEqual(expected);
  });
});

type ExpectedNavItem = Pick<NavItem, 'id' | 'label' | 'href' | 'icon' | 'children'>;

function createExpectedNavigationModel(
  routes: RouteTree,
  payload: AuthenticatedUserPayload | null,
  baseHref: string,
): NavModel {
  const snapshot = snapshotAuth(payload);

  const buckets = NAV_PLACEMENT_LIST.reduce((acc, placement) => {
    acc[placement] = [];
    return acc;
  }, {} as NavModel);

  const orderMap = new Map<string, number>();

  const visit = (node: RouteBranch, parent: ExpectedNavItem | null) => {
    const nav = node.$nav;
    const accessible = Boolean(nav) && canAccess(snapshot, node.$access);
    let current: ExpectedNavItem | null = null;

    if (accessible && nav) {
      current = {
        id: node.$id,
        label: node.label,
        href: toHref(node.route, baseHref),
        icon: nav.icon,
        children: [],
      };

      orderMap.set(node.$id, nav.order ?? DEFAULT_ORDER);
    }

    for (const child of Object.values(node.$children)) {
      visit(child, current);
    }

    if (current && nav) {
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(current);
      } else {
        buckets[nav.placement].push(current);
      }
    }
  };

  for (const branch of Object.values(routes.$children)) {
    visit(branch, null);
  }

  const sortItems = (items: ExpectedNavItem[]) => {
    items.sort((a, b) => {
      const oa = orderMap.get(a.id) ?? DEFAULT_ORDER;
      const ob = orderMap.get(b.id) ?? DEFAULT_ORDER;
      if (oa !== ob) return oa - ob;
      return a.label.localeCompare(b.label);
    });

    items.forEach((item) => {
      if (item.children?.length) {
        sortItems(item.children);
      }
    });
  };

  for (const placement of NAV_PLACEMENT_LIST) {
    sortItems(buckets[placement]);
  }

  return buckets;
}
