import type { ComponentType } from 'react';
import type { AuthenticatedUserPayload } from '@/api/clients/identity';
import { CompanyRole, UserRole } from '../../api/clients/types';

export enum Access {
  PUBLIC = 'PUBLIC',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  ROLE = 'ROLE',
}

export type RouteBranch = {
  id: string;
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  accessType: Access;
  userRoles?: UserRole[];
  companyRoles?: CompanyRole[];
  children?: RouteBranch[];
};

export const ROUTE_TREE: RouteBranch[] = [
  {
    id: 'auth.sign-in',
    href: 'auth/sign-in',
    label: 'Logg inn',
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.forgot-password',
    href: 'auth/forgot-password',
    label: 'Glemt passord',
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'profile',
    href: 'profile',
    label: 'Min profil',
    accessType: Access.AUTHENTICATED,
  },
  {
    id: 'company-context',
    href: 'companies',
    label: 'Mine selskap',
    accessType: Access.AUTHENTICATED,
    companyRoles: [CompanyRole.EMPLOYEE, CompanyRole.ADMIN],
  },
  {
    id: 'company',
    href: 'company',
    label: 'Mitt selskap',
    accessType: Access.ROLE,
    companyRoles: [CompanyRole.ADMIN],
    children: [
      {
        id: 'company.settings',
        href: 'company/settings',
        label: 'Instillinger',
        accessType: Access.NOT_AUTHENTICATED,
        children: [
          {
            id: 'company.settings.employees',
            href: 'company/settings/employees',
            label: 'Ansatt instillinger',
            accessType: Access.NOT_AUTHENTICATED,
          },
        ],
      },
    ],
  },
];

export const createNavigation = (user?: AuthenticatedUserPayload | null, companyContext?: any | null) => {
  if (!user) {
    return ROUTE_TREE.filter(
      (branch) => branch.accessType == Access.NOT_AUTHENTICATED || branch.accessType == Access.PUBLIC,
    );
  }

  const authenticatedRoutes = ROUTE_TREE.filter((route) => route.accessType == Access.AUTHENTICATED);

  if (companyContext) {
    const userCompanyRoles = user.companyRoles.flatMap((c) => c.companyRole) as CompanyRole[];
    const userRoles = user.roles;

    const branchWithCompanyRoles = ROUTE_TREE.filter((branch) =>
      branch.companyRoles?.map((role) => userCompanyRoles.includes(role)),
    );

    const branchesWithUserRole = ROUTE_TREE.filter((branch) =>
      branch.userRoles?.map((role) => userRoles.includes(role)),
    );

    return [...authenticatedRoutes, ...branchWithCompanyRoles, ...branchesWithUserRole];
  }

  return [...authenticatedRoutes];
};
