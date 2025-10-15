import { CompanyRole } from '../../../api/clients/types';
import { describe, it, expect } from 'vitest';
import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { canAccess, snapshotAuth } from '../audiences';
import { AudienceType, type RouteAccess } from '../functions';

const makePayload = (partial: Partial<AuthenticatedUserPayload> = {}): AuthenticatedUserPayload => ({
  id: 1,
  email: 'test@example.com',
  roles: [],
  companyRoles: [],
  ...partial,
});

describe('snapshotAuth', () => {
  it('guest => all false', () => {
    const snap = snapshotAuth(null);
    expect(snap).toEqual({
      isAuthenticated: false,
      companyRoles: new Set(),
    });
  });

  it('authenticated, no roles => auth true; admin/employee false', () => {
    const snap = snapshotAuth(makePayload());
    expect(snap).toEqual({
      isAuthenticated: true,
      companyRoles: new Set(),
    });
  });

  it('employee via companyRoles => employee true', () => {
    const snap = snapshotAuth(makePayload({ companyRoles: [{ companyId: 123, role: 'EMPLOYEE' }] }));
    expect(snap).toEqual({
      isAuthenticated: true,
      companyRoles: new Set([CompanyRole.EMPLOYEE]),
    });
  });

  it('admin via companyRoles => admin true (and employee true by default rule)', () => {
    const snap = snapshotAuth(makePayload({ companyRoles: [{ companyId: 123, role: 'ADMIN' }] }));
    expect(snap).toEqual({
      isAuthenticated: true,
      companyRoles: new Set([CompanyRole.ADMIN]),
    });
  });
});

describe('canAccess', () => {
  const snapGuest = snapshotAuth(null);
  const snapUser = snapshotAuth(makePayload());
  const snapEmployee = snapshotAuth(makePayload({ companyRoles: [{ companyId: 1, role: CompanyRole.EMPLOYEE }] }));
  const snapAdmin = snapshotAuth(makePayload({ companyRoles: [{ companyId: 1, role: CompanyRole.ADMIN }] }));

  it('public routes are always accessible', () => {
    const access: RouteAccess = { audience: AudienceType.Public };
    expect(canAccess(snapGuest, access)).toBe(true);
    expect(canAccess(snapUser, access)).toBe(true);
  });

  it('auth routes require authentication', () => {
    const access: RouteAccess = { audience: AudienceType.Auth };
    expect(canAccess(snapGuest, access)).toBe(false);
    expect(canAccess(snapUser, access)).toBe(true);
  });

  it('employee routes require matching company role', () => {
    const access: RouteAccess = { audience: AudienceType.Role, companyRoles: [CompanyRole.EMPLOYEE] };
    expect(canAccess(snapUser, access)).toBe(false);
    expect(canAccess(snapEmployee, access)).toBe(true);
  });

  it('admin routes require admin company role', () => {
    const access: RouteAccess = { audience: AudienceType.Role, companyRoles: [CompanyRole.ADMIN] };
    expect(canAccess(snapUser, access)).toBe(false);
    expect(canAccess(snapAdmin, access)).toBe(true);
  });
});
