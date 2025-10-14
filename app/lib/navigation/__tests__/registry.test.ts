import { describe, it, expect } from 'vitest';
import { buildRegistryFromRoutes, defaultMeta } from '../registry';
import { buildRoutes } from '~/lib/routes-builder';
import type { RouteTree } from '../functions';
import { ROUTES_SHAPE } from '~/lib/routes';

describe('buildRegistryFromRoutes', () => {
  const ROUTES: RouteTree = buildRoutes(ROUTES_SHAPE);

  it('creates entries for known meta ids and hrefs start with "/"', () => {
    const registry = buildRegistryFromRoutes(ROUTES, defaultMeta, '/');

    const ids = registry.map((r) => r.id);
    expect(ids).toContain('auth.signIn');
    expect(ids).toContain('auth.signOut');
    expect(ids).toContain('user.profile');
    expect(ids).toContain('employee.profile');
    expect(ids).toContain('admin.dashboard');
    expect(ids).toContain('admin.company');

    const signIn = registry.find((r) => r.id === 'auth.signIn')!;
    expect(signIn.href).toBe('/auth/sign-in');

    const adminCompany = registry.find((r) => r.id === 'admin.company')!;
    expect(adminCompany.href).toBe('/admin/company');

    expect(adminCompany.children?.map((c) => c.id)).toEqual(
      expect.arrayContaining(['admin.company.settings', 'admin.company.employees']),
    );
    expect(adminCompany.children?.every((c) => c.href?.startsWith('/'))).toBe(true);
  });

  it('does NOT throw when a *group* node lacks metadata; children still build if they have meta', () => {
    const metaWithoutGroup = { ...defaultMeta };
    delete (metaWithoutGroup as any)['admin.company']; // remove group meta

    // should not throw
    const registry = buildRegistryFromRoutes(ROUTES, metaWithoutGroup, '/');

    const ids = registry.map((r) => r.id);

    // parent group missing from registry
    expect(ids).not.toContain('admin.company');

    // descendants still present because they have their own meta
    expect(ids).toContain('admin.company.settings');
    expect(ids).toContain('admin.company.employees');

    // other admin entries unaffected
    expect(ids).toContain('admin.dashboard');
  });
});
