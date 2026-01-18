import type { CompanyRoles } from '~/api/clients/types';

export const COMPANY_ROLE_LABELS: Record<CompanyRoles, string> = {
  ADMIN: 'Administrator',
  EMPLOYEE: 'Ansatt',
} as const;

export function getCompanyRoleLabel(role: CompanyRoles): string {
  return COMPANY_ROLE_LABELS[role];
}
