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

export enum RoutePlaceMent {
  NAVIGATION = 'NAVIGATION',
  SIDEBAR = 'SIDEBAR',
  FOOTER = 'FOOTER',
}

export type RouteBranch = {
  id: string;
  href: string;
  label?: string;
  accessType?: Access;
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
    hidden: true,
    children: [
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
        id: 'auth.sign-out',
        href: '/auth/sign-out',
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
    hidden: true,
    children: [
      {
        id: 'user.profile',
        href: '/user/profile',
        label: 'Min profil',
        category: BrachCategory.USER,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
      },
      {
        id: 'user.company-context',
        href: '/user/company-context',
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
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'company.employees.edit',
            href: '/company/employees/edit',
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
        href: '/booking/public',
        label: 'Bestill time',
        category: BrachCategory.PUBLIC,
        accessType: Access.PUBLIC,
        children: [
          {
            id: 'booking.public.appointment',
            href: '/booking/public/appointment',
            category: BrachCategory.PUBLIC,
            accessType: Access.NOT_AUTHENTICATED,
            children: [
              {
                id: 'booking.public.appointment.session',
                href: '/booking/public/appointment/session',
                category: BrachCategory.PUBLIC,
                accessType: Access.NOT_AUTHENTICATED,
                children: [
                  {
                    id: 'booking.public.appointment.session.contact',
                    href: '/booking/public/appointment/session/contact',
                    label: 'Kontaktinformasjon',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.employee',
                    href: '/booking/public/appointment/session/employee',
                    label: 'Velg behandler',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.select-services',
                    href: '/booking/public/appointment/session/select-services',
                    label: 'Velg tjenester',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.select-time',
                    href: '/booking/public/appointment/session/select-time',
                    label: 'Velg tidspunkt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                  {
                    id: 'booking.public.appointment.session.overview',
                    href: '/booking/public/appointment/session/overview',
                    label: 'Oversikt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                  },
                ],
              },
              {
                id: 'booking.public.appointment.success',
                href: '/booking/public/appointment/success',
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
        href: '/booking/admin',
        label: 'Booking administrasjon',
        category: BrachCategory.COMPANY,
        placement: RoutePlaceMent.SIDEBAR,
        accessType: Access.PRODUCT,
        companyRoles: [Roles.ADMIN],
        children: [
          {
            id: 'booking.admin.settings',
            href: '/booking/admin/settings',
            label: 'Instillinger',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'booking.admin.service-groups',
            href: '/booking/admin/service-groups',
            label: 'Tjeneste grupper',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'booking.admin.services',
            href: '/booking/admin/services',
            label: 'Tjenester',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
          },
          {
            id: 'booking.admin.appointments',
            href: '/booking/admin/appointments',
            label: 'Time bestilling',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
            children: [
              {
                id: 'booking.admin.appointments.create',
                href: '/booking/admin/appointments/create',
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
        href: '/booking/company-user',
        label: 'Min profil',
        category: BrachCategory.COMPANY,
        placement: RoutePlaceMent.SIDEBAR,
        accessType: Access.PRODUCT,
        companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
        children: [
          {
            id: 'booking.company-user.profile',
            href: '/booking/company-user/profile',
            label: 'Profil',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
            children: [
              {
                id: 'booking.company-user.profile.daily-schedule',
                href: '/booking/company-user/profile/daily-schedule',
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

export const ROUTES_MAP: Record<string, { id: string; href: string }> = (() => {
  const map: Record<string, { id: string; href: string }> = {};

  const flattenBranch = (branch: RouteBranch): void => {
    map[branch.id] = {
      id: branch.id,
      href: branch.href,
    };

    if (branch.children) {
      branch.children.forEach((child) => flattenBranch(child));
    }
  };

  ROUTE_TREE.forEach((branch) => flattenBranch(branch));
  return map;
})();

export type UserNavigation = Record<RoutePlaceMent, RouteBranch[]>;

export const createNavigation = (user?: AuthenticatedUserPayload | null): UserNavigation => {
  const flattenBranches = (branches: RouteBranch[]): RouteBranch[] => {
    const result: RouteBranch[] = [];

    const flatten = (branch: RouteBranch): void => {
      result.push(branch);

      if (branch.children) {
        branch.children.forEach((child) => flatten(child));
      }
    };

    branches.forEach((branch) => flatten(branch));
    return result;
  };

  const hasAccess = (branch: RouteBranch): boolean => {
    // Public routes are always accessible
    if (branch.accessType === Access.PUBLIC) {
      return true;
    }

    // Not authenticated routes only for logged out users
    if (branch.accessType === Access.NOT_AUTHENTICATED) {
      return !user;
    }

    // All other access types require authentication
    if (!user) {
      return false;
    }

    // Check user roles if specified
    if (branch.userRoles && branch.userRoles.length > 0) {
      if (!branch.userRoles.some((role) => user.roles.includes(role))) {
        return false;
      }
    }

    // Check company roles if specified
    if (branch.companyRoles && branch.companyRoles.length > 0) {
      if (!user.company) {
        return false;
      }
      if (!branch.companyRoles.some((role) => user.company?.companyRoles.includes(role))) {
        return false;
      }
    }

    // Check product access
    if (branch.accessType === Access.PRODUCT) {
      if (!user.company) {
        return false;
      }
      // Assuming route id prefix matches product name (e.g., 'booking.*' needs BOOKING product)
      const productPrefix = branch.id.split('.')[0].toUpperCase();
      const hasProduct = user.company.companyProducts.some((product) => product === productPrefix);
      if (!hasProduct) {
        return false;
      }
    }

    return true;
  };

  const flattenedBranches = flattenBranches(ROUTE_TREE);
  const filteredBranches = flattenedBranches.filter(hasAccess);

  return filteredBranches.reduce((acc, branch) => {
    if (branch.placement && !branch.hidden) {
      if (!acc[branch.placement]) {
        acc[branch.placement] = [];
      }
      acc[branch.placement].push(branch);
    }
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
