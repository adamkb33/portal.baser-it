import type { AuthenticatedUserPayload } from '~/api/clients/types';
import type { Audience, AuthSnapshot } from './functions';

const hasSystemAdmin = (p: AuthenticatedUserPayload) => Array.isArray(p.roles) && p.roles.includes('SYSTEM_ADMIN');

const hasCompanyRole = (p: AuthenticatedUserPayload, role: 'ADMIN' | 'EMPLOYEE') =>
  Array.isArray(p.companyRoles) && p.companyRoles.some((cr) => cr.role === role);

export const snapshotAuth = (payload?: AuthenticatedUserPayload | null): AuthSnapshot => {
  const isAuthenticated = !!payload;
  const isAdmin = !!payload && (hasSystemAdmin(payload) || hasCompanyRole(payload, 'ADMIN'));
  const isEmployee = !!payload && (isAdmin || hasCompanyRole(payload, 'EMPLOYEE')); // toggle if admin ≠ employee in your app

  return { isAuthenticated, isAdmin, isEmployee };
};

export const visibleFor = (audience: Audience, snap: AuthSnapshot): boolean => {
  switch (audience) {
    case 'public':
      return true;
    case 'auth':
      return snap.isAuthenticated;
    case 'employee':
      return snap.isEmployee;
    case 'admin':
      return snap.isAdmin;
    default:
      return false as never;
  }
};
