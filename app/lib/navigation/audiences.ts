import { CompanyRole, type AuthenticatedUserPayload } from '../../api/clients/types';
import { type AuthSnapshot, type RouteAccess, AudienceType } from './functions';

export const snapshotAuth = (payload?: AuthenticatedUserPayload | null): AuthSnapshot => {
  const companyRoles = new Set<CompanyRole>((payload?.companyRoles ?? []).map((cr) => cr.role));

  return {
    isAuthenticated: !!payload,
    companyRoles,
  };
};

const hasAnyCompanyRole = (snap: AuthSnapshot, roles: readonly CompanyRole[]) =>
  roles.some((role) => snap.companyRoles.has(role));

export const canAccess = (snap: AuthSnapshot, access?: RouteAccess): boolean => {
  if (access === undefined) {
    return false;
  }

  switch (access.audience) {
    case AudienceType.Public:
      return true;
    case AudienceType.Auth:
      return snap.isAuthenticated;
    case AudienceType.Role:
      return snap.isAuthenticated && hasAnyCompanyRole(snap, access.companyRoles);
    case AudienceType.NoAuth:
      return !snap.isAuthenticated;
    default:
      return false;
  }
};
