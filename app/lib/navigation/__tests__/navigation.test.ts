import { describe, it, expect } from 'vitest';
import { defaultMeta } from '../registry';
import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { buildRoutes } from '~/lib/routes-builder';
import { buildNavigationFromRoutes } from '../build';
import type { RouteTree } from '../functions';
import { ROUTES_SHAPE } from '~/lib/routes';

const makePayload = (partial: Partial<AuthenticatedUserPayload> = {}): AuthenticatedUserPayload => ({
  id: 1,
  email: 'test@example.com',
  roles: [],
  companyRoles: [],
  ...partial,
});

describe('buildNavigationFromRoutes (E2E)', () => {
  const ROUTES: RouteTree = buildRoutes(ROUTES_SHAPE);

  it('guest sees public items only', () => {
    const model = buildNavigationFromRoutes(ROUTES, null, defaultMeta, '/');

    // Header end should include Accept invite (public) and NOT Sign in (auth-only)
    const endIds = model.end.map((i) => i.id);
    expect(endIds).not.toContain('auth.signIn'); // <- changed: sign-in is auth-only
    expect(endIds).toContain('auth.acceptInvite');
    expect(endIds).not.toContain('auth.signOut');

    // Account empty
    expect(model.account.length).toBe(0);

    // Sidebar (admin) empty
    expect(model.sidebar.length).toBe(0);
  });

  it('authenticated (no roles) sees profile + sign out + sign in; no admin/employee', () => {
    const model = buildNavigationFromRoutes(ROUTES, makePayload(), defaultMeta, '/');

    // End: Logg ut present, Sign in present (auth-only)
    const endIds = model.end.map((i) => i.id);
    expect(endIds).toContain('auth.signOut');
    expect(endIds).toContain('auth.signIn'); // <- changed: sign-in appears for authenticated

    // Account: user.profile present
    const accountIds = model.account.map((i) => i.id);
    expect(accountIds).toContain('user.profile');
    expect(accountIds).not.toContain('employee.profile');

    // Sidebar: still empty
    expect(model.sidebar.length).toBe(0);
  });

  it('employee sees employee profile in account', () => {
    const model = buildNavigationFromRoutes(
      ROUTES,
      makePayload({ companyRoles: [{ companyId: 1, role: 'EMPLOYEE' }] }),
      defaultMeta,
      '/',
    );

    const accountIds = model.account.map((i) => i.id);
    expect(accountIds).toContain('user.profile');
    expect(accountIds).toContain('employee.profile'); // extra
    expect(model.sidebar.length).toBe(0);
  });

  it('admin (company ADMIN) sees sidebar admin items', () => {
    const model = buildNavigationFromRoutes(
      ROUTES,
      makePayload({ companyRoles: [{ companyId: 1, role: 'ADMIN' }] }),
      defaultMeta,
      '/',
    );

    const sidebarIds = model.sidebar.map((i) => i.id);
    expect(sidebarIds).toContain('admin.dashboard');
    expect(sidebarIds).toContain('admin.company');

    // And account contains user.profile
    const accountIds = model.account.map((i) => i.id);
    expect(accountIds).toContain('user.profile');
  });

  it('admin (SYSTEM_ADMIN) sees sidebar admin items', () => {
    const model = buildNavigationFromRoutes(ROUTES, makePayload({ roles: ['SYSTEM_ADMIN'] }), defaultMeta, '/');
    console.log(model, 'model');
    const sidebarIds = model.sidebar.map((i) => i.id);
    expect(sidebarIds).toContain('admin.dashboard');
    expect(sidebarIds).toContain('admin.company');
  });
});
