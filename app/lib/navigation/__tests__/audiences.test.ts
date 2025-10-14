import { describe, it, expect } from 'vitest';
import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { snapshotAuth } from '../audiences';

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
    expect(snap).toEqual({ isAuthenticated: false, isAdmin: false, isEmployee: false });
  });

  it('authenticated, no roles => auth true; admin/employee false', () => {
    const snap = snapshotAuth(makePayload());
    expect(snap).toEqual({ isAuthenticated: true, isAdmin: false, isEmployee: false });
  });

  it('employee via companyRoles => employee true', () => {
    const snap = snapshotAuth(makePayload({ companyRoles: [{ companyId: 123, role: 'EMPLOYEE' }] }));
    expect(snap).toEqual({ isAuthenticated: true, isAdmin: false, isEmployee: true });
  });

  it('admin via companyRoles => admin true (and employee true by default rule)', () => {
    const snap = snapshotAuth(makePayload({ companyRoles: [{ companyId: 123, role: 'ADMIN' }] }));
    expect(snap).toEqual({ isAuthenticated: true, isAdmin: true, isEmployee: true });
  });

  it('SYSTEM_ADMIN => admin true (and employee true by default rule)', () => {
    const snap = snapshotAuth(makePayload({ roles: ['SYSTEM_ADMIN'] }));
    expect(snap).toEqual({ isAuthenticated: true, isAdmin: true, isEmployee: true });
  });
});
