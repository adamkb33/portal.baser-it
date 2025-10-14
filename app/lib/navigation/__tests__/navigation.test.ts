import { describe, it, expect } from 'vitest';
import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { buildRoutes } from '~/lib/navigation/routes-builder';
import { createNavigationModel } from '../navigation';
import type { RouteTree } from '../functions';
import { ROUTES_SHAPE } from '~/lib/navigation/routes';

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

  it('guest sees public items only', () => {
    const model = buildModel(null);

    const endIds = model.navbar_end.map((i) => i.id);
    expect(endIds).toContain('auth.acceptInvite');
    expect(endIds).not.toContain('auth.signIn');
    expect(endIds).not.toContain('auth.signOut');

    // Account empty
    expect(model.account.length).toBe(0);

    // Sidebar (admin) empty
    expect(model.sidebar.length).toBe(0);
  });

  it('authenticated (no roles) sees profile + sign out + sign in; no admin/employee', () => {
    const model = buildModel(makePayload());

    const endIds = model.navbar_end.map((i) => i.id);
    expect(endIds).toContain('auth.signOut');
    expect(endIds).toContain('auth.signIn');
    expect(endIds).toContain('auth.acceptInvite');

    const accountIds = model.account.map((i) => i.id);
    expect(accountIds).toContain('user.profile');
    expect(accountIds).not.toContain('employee.profile');

    // Sidebar: still empty
    expect(model.sidebar.length).toBe(0);
  });

  it('employee sees employee profile in account', () => {
    const model = buildModel(makePayload({ companyRoles: [{ companyId: 1, role: 'EMPLOYEE' }] }));

    const accountIds = model.account.map((i) => i.id);
    expect(accountIds).toContain('user.profile');
    expect(accountIds).toContain('employee.profile'); // extra
    expect(model.sidebar.length).toBe(0);
  });

  it('admin (company ADMIN) sees sidebar admin items', () => {
    const model = buildModel(makePayload({ companyRoles: [{ companyId: 1, role: 'ADMIN' }] }));

    const sidebarIds = model.sidebar.map((i) => i.id);
    expect(sidebarIds).toContain('admin.dashboard');
    expect(sidebarIds).toContain('admin.company');

    // And account contains user.profile
    const accountIds = model.account.map((i) => i.id);
    expect(accountIds).toContain('user.profile');
  });

  it('system admin without company role does not see company admin items', () => {
    const model = buildModel(makePayload({ roles: ['SYSTEM_ADMIN'] }));
    expect(model.sidebar.length).toBe(0);
  });
});
