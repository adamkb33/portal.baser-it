import { CompanyRole, type AuthenticatedUserPayload } from '../../api/clients/types';

import type { AuthSnapshot, RouteAccess } from './functions';

export const snapshotAuth = (payload?: AuthenticatedUserPayload | null): AuthSnapshot => {
  const companyRoles = new Set<CompanyRole>((payload?.companyRoles ?? []).map((cr) => cr.role));

  return {
    isAuthenticated: !!payload,
    companyRoles,
  };
};

const hasAnyCompanyRole = (snap: AuthSnapshot, roles: readonly CompanyRole[]) =>
  roles.some((role) => snap.companyRoles.has(role));

export const canAccess = (access: RouteAccess, snap: AuthSnapshot): boolean => {
  switch (access.audience) {
    case 'public':
      return true;
    case 'auth':
      return snap.isAuthenticated;
    case 'role':
      return snap.isAuthenticated && hasAnyCompanyRole(snap, access.companyRoles);
    default:
      return false;
  }
};
