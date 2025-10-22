import type { ComponentType } from 'react';
import type { AuthenticatedUserPayload } from '@/api/clients/identity';
import { CompanyRole, UserRole } from '../../api/clients/types';

export enum Access {
  PUBLIC = 'PUBLIC',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  ROLE = 'ROLE',
}

export enum BrachCategory {
  AUTH = 'AUTH',
  COMPANY = 'COMPANY',
  USER = 'USER',
}

export interface BranchGroup {
  label: string;
  branches: RouteBranch[];
}

export type RouteBranch = {
  id: string;
  href: string;
  label: string;
  accessType: Access;
  category: BrachCategory;
  icon?: ComponentType<{ className?: string }>;
  userRoles?: UserRole[];
  companyRoles?: CompanyRole[];
  children?: RouteBranch[];
};

export const ROUTE_TREE: RouteBranch[] = [
  {
    id: 'auth.sign-in',
    href: 'auth/sign-in',
    label: 'Logg inn',
    category: BrachCategory.AUTH,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.forgot-password',
    href: 'auth/forgot-password',
    label: 'Glemt passord',
    category: BrachCategory.AUTH,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.sign-out',
    href: 'auth/sign-out',
    label: 'Logg ut',
    category: BrachCategory.AUTH,
    accessType: Access.AUTHENTICATED,
  },
  {
    id: 'profile',
    href: 'profile',
    label: 'Min profil',
    category: BrachCategory.USER,
    accessType: Access.AUTHENTICATED,
  },
  {
    id: 'company-context',
    href: 'companies',
    label: 'Mine selskap',
    category: BrachCategory.USER,
    accessType: Access.AUTHENTICATED,
    companyRoles: [CompanyRole.EMPLOYEE, CompanyRole.ADMIN],
  },
  {
    id: 'company',
    href: 'company',
    label: 'Mitt selskap',
    category: BrachCategory.AUTH,
    accessType: Access.ROLE,
    companyRoles: [CompanyRole.ADMIN],
    children: [
      {
        id: 'company.settings',
        href: 'company/settings',
        label: 'Instillinger',
        category: BrachCategory.AUTH,
        accessType: Access.NOT_AUTHENTICATED,
        children: [
          {
            id: 'company.settings.employees',
            href: 'company/settings/employees',
            label: 'Ansatt instillinger',
            category: BrachCategory.AUTH,
            accessType: Access.NOT_AUTHENTICATED,
          },
        ],
      },
    ],
  },
];

export const createNavigation = (
  user?: AuthenticatedUserPayload | null,
  companyContext?: any | null,
): Record<BrachCategory, BranchGroup> => {
  let filteredBranches: RouteBranch[];

  if (!user) {
    filteredBranches = ROUTE_TREE.filter(
      (branch) => branch.accessType === Access.NOT_AUTHENTICATED || branch.accessType === Access.PUBLIC,
    );
  } else if (!companyContext) {
    filteredBranches = ROUTE_TREE.filter((route) => route.accessType === Access.AUTHENTICATED);
  } else {
    const userCompanyRoles = user.companyRoles.flatMap((c) => c.companyRole) as CompanyRole[];
    const userRoles = user.roles;

    const seen = new Set<string>();

    filteredBranches = ROUTE_TREE.filter((branch) => {
      if (seen.has(branch.id)) return false;

      const isAuthenticated = branch.accessType === Access.AUTHENTICATED;
      const hasCompanyRole = branch.companyRoles?.some((role) => userCompanyRoles.includes(role)) ?? false;
      const hasUserRole = branch.userRoles?.some((role) => userRoles.includes(role)) ?? false;

      const shouldInclude = isAuthenticated || hasCompanyRole || hasUserRole;

      if (shouldInclude) {
        seen.add(branch.id);
        return true;
      }

      return false;
    });
  }

  return filteredBranches.reduce(
    (acc, branch) => {
      if (!acc[branch.category]) {
        acc[branch.category] = {
          label: getCategoryLabel(branch.category),
          branches: [],
        };
      }
      acc[branch.category].branches.push(branch);
      return acc;
    },
    {} as Record<BrachCategory, BranchGroup>,
  );
};

const getCategoryLabel = (category: BrachCategory): string => {
  switch (category) {
    case BrachCategory.AUTH:
      return 'Autentisering';
    case BrachCategory.COMPANY:
      return 'Selskap';
    case BrachCategory.USER:
      return 'Bruker';
    default:
      return category;
  }
};
