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
  label?: string;
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
    id: 'auth',
    href: '/auth',
    label: 'Autentisering',
    category: BrachCategory.AUTH,
    accessType: Access.NOT_AUTHENTICATED,
    hidden: true,
    children: [
      {
        id: 'auth.sign-in',
        href: 'sign-in',
        label: 'Logg inn',
        category: BrachCategory.AUTH,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.NOT_AUTHENTICATED,
      },
      {
        id: 'auth.forgot-password',
        href: 'forgot-password',
        label: 'Glemt passord',
        category: BrachCategory.AUTH,
        accessType: Access.NOT_AUTHENTICATED,
      },
      {
        id: 'auth.reset-password',
        href: 'reset-password',
        label: 'Tilbakestill passord',
        category: BrachCategory.AUTH,
        accessType: Access.NOT_AUTHENTICATED,
      },
      {
        id: 'auth.accept-invite',
        href: 'accept-invite',
        label: 'Aksepter invitasjon',
        category: BrachCategory.NONE,
        accessType: Access.NOT_AUTHENTICATED,
      },
      {
        id: 'auth.sign-out',
        href: 'sign-out',
        label: 'Logg ut',
        category: BrachCategory.AUTH,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
      },
    ],
  },
  {
    id: 'user',
    href: '/user',
    label: 'Bruker',
    category: BrachCategory.USER,
    accessType: Access.AUTHENTICATED,
    hidden: true,
    children: [
      {
        id: 'user.profile',
        href: 'profile',
        label: 'Min profil',
        category: BrachCategory.USER,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
      },
      {
        id: 'user.company-context',
        href: 'company-context',
        label: 'Mine selskap',
        category: BrachCategory.USER,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.EMPLOYEE, Roles.ADMIN],
      },
    ],
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
        href: 'settings',
        label: 'Instillinger',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
      },
      {
        id: 'company.request-role-delete',
        href: 'request-role-delete',
        label: 'Etterspørsel om å slette rolle',
        category: BrachCategory.NONE,
        hidden: true,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
      },
      {
        id: 'company.contacts',
        href: 'contacts',
        label: 'Kontakter',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
      },
      {
        id: 'company.employees',
        href: 'employees',
        label: 'Ansatte',
        category: BrachCategory.COMPANY,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
        children: [
          {
            id: 'company.employees.invite',
            href: 'invite',
            label: 'Inviter',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'company.employees.edit',
            href: 'edit',
            label: 'Endre',
            category: BrachCategory.COMPANY,
            hidden: true,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
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
    accessType: Access.PUBLIC,
    children: [
      {
        id: 'booking.public',
        href: 'public',
        label: 'Bestill time',
        category: BrachCategory.PUBLIC,
        accessType: Access.PUBLIC,
        children: [
          {
            id: 'booking.public.appointment',
            href: 'appointment',
            category: BrachCategory.PUBLIC,
            accessType: Access.NOT_AUTHENTICATED,
            children: [
              {
                id: 'booking.public.appointment.session',
                href: 'session',
                category: BrachCategory.PUBLIC,
                accessType: Access.NOT_AUTHENTICATED,
                children: [
                  {
                    id: 'booking.public.appointment.session.contact',
                    href: 'contact',
                    label: 'Kontaktinformasjon',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.employee',
                    href: 'employee',
                    label: 'Velg behandler',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.select-services',
                    href: 'select-services',
                    label: 'Velg tjenester',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.select-time',
                    href: 'select-time',
                    label: 'Velg tidspunkt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.overview',
                    href: 'overview',
                    label: 'Oversikt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                ],
              },
              {
                id: 'booking.public.appointment.success',
                href: 'success',
                category: BrachCategory.NONE,
                accessType: Access.PUBLIC,
                hidden: true,
              },
            ],
          },
        ],
      },
      {
        id: 'booking.admin',
        href: 'admin',
        label: 'Booking administrasjon',
        category: BrachCategory.COMPANY,
        placement: RoutePlaceMent.SIDEBAR,
        accessType: Access.PRODUCT,
        companyRoles: [Roles.ADMIN],
        children: [
          {
            id: 'booking.admin.settings',
            href: 'settings',
            label: 'Instillinger',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'booking.admin.service-groups',
            href: 'service-groups',
            label: 'Tjeneste grupper',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'booking.admin.services',
            href: 'services',
            label: 'Tjenester',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'booking.admin.appointments',
            href: 'appointments',
            label: 'Time bestilling',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
            children: [
              {
                id: 'booking.admin.appointments.create',
                href: 'create',
                label: 'Bestill ny time',
                category: BrachCategory.COMPANY,
                accessType: Access.AUTHENTICATED,
                companyRoles: [Roles.ADMIN],
              },
            ],
          },
        ],
      },
      {
        id: 'booking.company-user',
        href: 'company-user',
        label: 'Min profil',
        category: BrachCategory.COMPANY,
        placement: RoutePlaceMent.SIDEBAR,
        accessType: Access.PRODUCT,
        companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
        children: [
          {
            id: 'booking.company-user.profile',
            href: 'profile',
            label: 'Profil',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
            children: [
              {
                id: 'booking.company-user.profile.daily-schedule',
                href: 'daily-schedule',
                label: 'Timeplan',
                category: BrachCategory.COMPANY,
                accessType: Access.AUTHENTICATED,
                companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const ROUTES_MAP: Record<
  string,
  {
    id: string;
    href: string;
  }
> = (() => {
  const map: Record<
    string,
    {
      id: string;
      href: string;
    }
  > = {};

  const flattenBranch = (branch: RouteBranch, parentPath = ''): void => {
    const absolutePath = parentPath ? `${parentPath}/${branch.href}`.replace(/\/+/g, '/') : branch.href;

    map[branch.id] = {
      id: branch.id,
      href: absolutePath,
    };

    if (branch.children) {
      branch.children.forEach((child) => flattenBranch(child, absolutePath));
    }
  };

  ROUTE_TREE.forEach((branch) => flattenBranch(branch));
  return map;
})();

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
