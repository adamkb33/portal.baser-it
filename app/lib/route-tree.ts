import type { AuthenticatedUserPayload } from '@/api/clients/base';
import { Roles, UserRole } from '../api/clients/types';

export enum Access {
  PUBLIC = 'PUBLIC',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  ROLE = 'ROLE',
  PRODUCT = 'PRODUCT',
}

export enum BrachCategory {
  PUBLIC = 'PUBLIC',
  AUTH = 'AUTH',
  NONE = 'NONE',
  COMPANY = 'COMPANY',
  USER = 'USER',
}

export interface BranchGroup {
  label: string;
  branches: RouteBranch[];
}

export enum RoutePlaceMent {
  NAVIGATION = 'NAVIGATION',
  SIDEBAR = 'SIDEBAR',
  FOOTER = 'FOOTER',
}

export type RouteBranch = {
  id: string;
  href: string;
  label: string;
  accessType: Access;
  placement?: RoutePlaceMent;
  hidden?: boolean;
  category: BrachCategory;
  userRoles?: UserRole[];
  companyRoles?: Roles[];
  children?: RouteBranch[];
};

export const ROUTE_TREE: RouteBranch[] = [
  {
    id: 'appointments',
    href: '/appointments',
    label: 'Bestill time',
    category: BrachCategory.PUBLIC,
    placement: RoutePlaceMent.NAVIGATION,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.sign-in',
    href: '/auth/sign-in',
    label: 'Logg inn',
    category: BrachCategory.AUTH,
    placement: RoutePlaceMent.NAVIGATION,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.forgot-password',
    href: '/auth/forgot-password',
    label: 'Glemt passord',
    category: BrachCategory.AUTH,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.reset-password',
    href: '/auth/reset-password',
    label: 'Tilbakestill passord',
    category: BrachCategory.AUTH,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.accept-invite',
    href: '/auth/accept-invite',
    label: 'Aksepter invitasjon',
    category: BrachCategory.NONE,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.accept-invite-existing',
    href: '/auth/accept-invite/existing',
    label: 'Aksepter invitasjon',
    category: BrachCategory.NONE,
    accessType: Access.NOT_AUTHENTICATED,
  },
  {
    id: 'auth.sign-out',
    href: '/auth/sign-out',
    label: 'Logg ut',
    category: BrachCategory.AUTH,
    placement: RoutePlaceMent.NAVIGATION,
    accessType: Access.AUTHENTICATED,
  },
  {
    id: 'profile',
    href: '/profile',
    label: 'Min profil',
    category: BrachCategory.USER,
    placement: RoutePlaceMent.NAVIGATION,
    accessType: Access.AUTHENTICATED,
  },
  {
    id: 'company-context',
    href: '/company-context',
    label: 'Mine selskap',
    category: BrachCategory.USER,
    placement: RoutePlaceMent.NAVIGATION,
    accessType: Access.AUTHENTICATED,
    companyRoles: [Roles.EMPLOYEE, Roles.ADMIN],
  },
  {
    id: 'company',
    href: '/company',
    label: 'Mitt selskap',
    category: BrachCategory.COMPANY,
    placement: RoutePlaceMent.SIDEBAR,
    accessType: Access.ROLE,
    companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
    children: [
      {
        id: 'company.settings',
        href: '/company/settings',
        label: 'Instillinger',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
      },
      {
        id: 'company.request-role-delete',
        href: '/company/request-role-delete',
        label: 'Etterspørsel om å slette rolle',
        category: BrachCategory.NONE,
        hidden: true,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
      },
      {
        id: 'company.contacts',
        href: '/company/contacts',
        label: 'Kontakter',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
      },
      {
        id: 'company.employees',
        href: '/company/employees',
        label: 'Ansatte',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
        children: [
          {
            id: 'company.employees.invite',
            href: '/company/employees/invite',
            label: 'Inviter',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
          },
          {
            id: 'company.employees.edit',
            href: '/company/employees/edit',
            label: 'Endre',
            category: BrachCategory.COMPANY,
            hidden: true,
            accessType: Access.AUTHENTICATED,
          },
        ],
      },
    ],
  },
  {
    id: 'booking',
    href: '/booking',
    label: 'BiT Booking',
    category: BrachCategory.COMPANY,
    placement: RoutePlaceMent.SIDEBAR,
    accessType: Access.PRODUCT,
    companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
    children: [
      {
        id: 'booking.settings',
        href: '/booking/settings',
        label: 'Instillinger',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
      },
      {
        id: 'booking.daily-schedule',
        href: '/booking/daily-schedule',
        label: 'Timeplan',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
      },
      {
        id: 'booking.service-groups',
        href: '/booking/service-groups',
        label: 'Tjeneste grupper',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
      },
      {
        id: 'booking.services',
        href: '/booking/services',
        label: 'Tjenester',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
      },
      {
        id: 'booking.appointments',
        href: '/booking/appointments',
        label: 'Time bestilling',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
        children: [
          {
            id: 'booking.appointments.create',
            href: '/booking/appointments/create',
            label: 'Bestill ny time',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
        ],
      },
    ],
  },
];

export const ROUTES_MAP: Record<string, RouteBranch> = ROUTE_TREE.reduce(
  (acc, branch) => {
    const flattenBranch = (b: RouteBranch): void => {
      acc[b.id] = b;
      if (b.children) {
        b.children.forEach(flattenBranch);
      }
    };

    flattenBranch(branch);
    return acc;
  },
  {} as Record<string, RouteBranch>,
);

export type UserNavigation = Record<BrachCategory, BranchGroup>;

export const createNavigation = (user?: AuthenticatedUserPayload | null): UserNavigation => {
  let filteredBranches: RouteBranch[];

  if (!user) {
    filteredBranches = ROUTE_TREE.filter(
      (branch) => branch.accessType === Access.NOT_AUTHENTICATED || branch.accessType === Access.PUBLIC,
    );
  } else {
    filteredBranches = ROUTE_TREE.filter((route) => route.accessType === Access.AUTHENTICATED);
  }

  return filteredBranches.reduce((acc, branch) => {
    if (!branch.placement) return acc;

    if (!acc[branch.category]) {
      acc[branch.category] = {
        label: getCategoryLabel(branch.category),
        branches: [],
      };
    }

    acc[branch.category].branches.push(branch);
    return acc;
  }, {} as UserNavigation);
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
