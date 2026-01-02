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

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  USER = 'USER',
  COMPANY_USER = 'COMPANY_USER',
}

export enum CompanyRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

import type { AuthenticatedUserPayload, CompanyDto, CompanyUserDto } from '~/api/generated/identity';
import type { IconName } from './route-icon-map';

export type RouteBranch = {
  id: string;
  href: string;
  label?: string;
  accessType?: Access;
  placement?: RoutePlaceMent;
  hidden?: boolean;
  category: BrachCategory;
  userRoles?: UserRole[];
  companyRoles?: CompanyRole[];
  iconName?: IconName;
  children?: RouteBranch[];
};

export const ROUTE_TREE: RouteBranch[] = [
  {
    id: 'auth',
    href: '/auth',
    label: 'Autentisering',
    category: BrachCategory.AUTH,
    accessType: Access.PUBLIC,
    hidden: true,
    iconName: 'Key',
    children: [
      {
        id: 'auth.sign-in',
        href: '/auth/sign-in',
        label: 'Logg inn',
        category: BrachCategory.AUTH,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.NOT_AUTHENTICATED,
        iconName: 'LogIn',
      },
      {
        id: 'auth.forgot-password',
        href: '/auth/forgot-password',
        label: 'Glemt passord',
        category: BrachCategory.AUTH,
        accessType: Access.NOT_AUTHENTICATED,
        iconName: 'Key',
      },
      {
        id: 'auth.reset-password',
        href: '/auth/reset-password',
        label: 'Tilbakestill passord',
        category: BrachCategory.AUTH,
        accessType: Access.NOT_AUTHENTICATED,
        iconName: 'Key',
      },
      {
        id: 'auth.accept-invite',
        href: '/auth/accept-invite',
        label: 'Aksepter invitasjon',
        category: BrachCategory.NONE,
        accessType: Access.NOT_AUTHENTICATED,
        iconName: 'UserPlus',
      },
      {
        id: 'auth.sign-out',
        href: '/auth/sign-out',
        label: 'Logg ut',
        category: BrachCategory.AUTH,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
        iconName: 'LogOut',
      },
    ],
  },
  {
    id: 'user',
    href: '/user',
    label: 'Bruker',
    category: BrachCategory.USER,
    accessType: Access.PUBLIC,
    hidden: true,
    iconName: 'UserCircle',
    children: [
      {
        id: 'user.profile',
        href: '/user/profile',
        label: 'Min profil',
        category: BrachCategory.USER,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
        iconName: 'UserCircle',
      },
      {
        id: 'user.company-context',
        href: '/user/company-context',
        label: 'Mine selskap',
        category: BrachCategory.USER,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
        iconName: 'Building2',
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
    companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
    iconName: 'Building2',
    children: [
      {
        id: 'company.request-role-delete',
        href: '/company/request-role-delete',
        label: 'Etterspørsel om å slette rolle',
        category: BrachCategory.NONE,
        hidden: true,
        accessType: Access.ROLE,
        companyRoles: [CompanyRole.ADMIN],
      },
      {
        id: 'company.admin',
        href: '/company/admin',
        label: 'Selskap administrasjon',
        category: BrachCategory.NONE,
        accessType: Access.ROLE,
        companyRoles: [CompanyRole.ADMIN],
        iconName: 'Settings',
        children: [
          {
            id: 'company.admin.settings',
            href: '/company/admin/settings',
            hidden: true,
            label: 'Instillinger',
            category: BrachCategory.COMPANY,
            accessType: Access.ROLE,
            companyRoles: [CompanyRole.ADMIN],
            iconName: 'Settings',
          },
          {
            id: 'company.admin.employees',
            href: '/company/admin/employees',
            label: 'Ansatte',
            category: BrachCategory.COMPANY,
            accessType: Access.ROLE,
            companyRoles: [CompanyRole.ADMIN],
            iconName: 'Users',
          },
          {
            id: 'company.admin.contacts',
            href: '/company/admin/contacts',
            label: 'Kontakter',
            category: BrachCategory.COMPANY,
            accessType: Access.ROLE,
            companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
            iconName: 'Users',
          },
        ],
      },
      {
        id: 'company.booking',
        href: '/company/booking',
        label: 'Booking',
        category: BrachCategory.COMPANY,
        placement: RoutePlaceMent.SIDEBAR,
        accessType: Access.PRODUCT,
        companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
        iconName: 'Calendar',
        children: [
          {
            id: 'company.booking.profile',
            href: '/company/booking/profile',
            label: 'Min profil',
            category: BrachCategory.COMPANY,
            accessType: Access.PRODUCT,
            companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
            iconName: 'UserCircle',
            children: [
              {
                id: 'company.booking.profile.daily-schedule',
                href: '/company/booking/profile/daily-schedule',
                label: 'Timeplan',
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
                iconName: 'Clock',
              },
            ],
          },
          {
            id: 'company.booking.appointments',
            href: '/company/booking/appointments',
            label: 'Time bestillinger',
            category: BrachCategory.COMPANY,
            accessType: Access.PRODUCT,
            companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
            iconName: 'ClipboardList',
            children: [
              {
                id: 'company.booking.appointments.create',
                href: '/company/booking/appointments/create',
                label: 'Bestill ny time',
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
                iconName: 'Calendar',
              },
            ],
          },
          {
            id: 'company.booking.admin',
            href: '/company/booking/admin',
            label: 'Administrasjon',
            category: BrachCategory.COMPANY,
            accessType: Access.PRODUCT,
            companyRoles: [CompanyRole.ADMIN],
            iconName: 'Settings',
            children: [
              {
                id: 'company.booking.admin.settings',
                href: '/company/booking/admin/settings',
                label: 'Instillinger',
                hidden: true,
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [CompanyRole.ADMIN],
                iconName: 'Settings',
              },
              {
                id: 'company.booking.admin.service-groups',
                href: '/company/booking/admin/service-groups',
                label: 'Tjeneste grupper',
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [CompanyRole.ADMIN],
                iconName: 'FolderKanban',
                children: [
                  {
                    id: 'company.booking.admin.service-groups.services',
                    href: '/company/booking/admin/service-groups/services',
                    label: 'Tjenester',
                    category: BrachCategory.COMPANY,
                    accessType: Access.PRODUCT,
                    companyRoles: [CompanyRole.ADMIN],
                    iconName: 'Briefcase',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'booking',
    href: '/booking',
    label: 'BiT Booking',
    category: BrachCategory.PUBLIC,
    accessType: Access.PUBLIC,
    iconName: 'Calendar',
    children: [
      {
        id: 'booking.public',
        href: '/booking/public',
        label: 'Bestill time',
        category: BrachCategory.PUBLIC,
        accessType: Access.PUBLIC,
        iconName: 'Calendar',
        children: [
          {
            id: 'booking.public.appointment',
            href: '/booking/public/appointment',
            category: BrachCategory.PUBLIC,
            accessType: Access.PUBLIC,
            children: [
              {
                id: 'booking.public.appointment.session',
                href: '/booking/public/appointment/session',
                category: BrachCategory.PUBLIC,
                accessType: Access.PUBLIC,
                children: [
                  {
                    id: 'booking.public.appointment.session.contact',
                    href: '/booking/public/appointment/session/contact',
                    label: 'Kontaktinformasjon',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    iconName: 'Users',
                  },
                  {
                    id: 'booking.public.appointment.session.employee',
                    href: '/booking/public/appointment/session/employee',
                    label: 'Velg behandler',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    iconName: 'UserCircle',
                  },
                  {
                    id: 'booking.public.appointment.session.select-services',
                    href: '/booking/public/appointment/session/select-services',
                    label: 'Velg tjenester',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    iconName: 'Briefcase',
                  },
                  {
                    id: 'booking.public.appointment.session.select-time',
                    href: '/booking/public/appointment/session/select-time',
                    label: 'Velg tidspunkt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    iconName: 'Clock',
                  },
                  {
                    id: 'booking.public.appointment.session.overview',
                    href: '/booking/public/appointment/session/overview',
                    label: 'Oversikt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    iconName: 'ClipboardList',
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
    ],
  },
];

export type ApiRoute = {
  id: string;
  url: string;
  children?: ApiRoute[];
};

export const API_ROUTES_TREE = [
  {
    id: 'company',
    url: '/company',
    children: [
      {
        id: 'company.admin',
        url: '/company/admin',
        children: [
          {
            id: 'company.admin.employees',
            url: '/company/admin/employees',
            children: [
              {
                id: 'company.admin.employees.edit',
                url: '/company/admin/employees/edit',
              },
              {
                id: 'company.admin.employees.delete',
                url: '/company/admin/employees/delete',
              },
              {
                id: 'company.admin.employees.invite',
                url: '/company/admin/employees/invite',
              },
              {
                id: 'company.admin.employees.cancel-invite',
                url: '/company/admin/employees/cancel-invite',
              },
            ],
          },
          {
            id: 'company.admin.contacts',
            url: '/company/admin/contacts',
            children: [
              {
                id: 'company.admin.contacts.create',
                url: '/company/admin/contacts/create',
              },
              {
                id: 'company.admin.contacts.update',
                url: '/company/admin/contacts/update',
              },
              {
                id: 'company.admin.contacts.delete',
                url: '/company/admin/contacts/delete',
              },
            ],
          },
        ],
      },
      {
        id: 'company.booking',
        url: '/company/booking',
        children: [
          {
            id: 'company.booking.profile',
            url: '/company/booking/profile',
            children: [
              {
                id: 'company.booking.profile.create-or-update',
                url: '/company/booking/profile/create-or-update',
              },
              {
                id: 'company.booking.profile.daily-schedule',
                url: '/company/booking/profile/daily-schedule',
                children: [
                  {
                    id: 'company.booking.profile.daily-schedule.create-or-update',
                    url: '/company/booking/profile/daily-schedule/create-or-update',
                  },
                  {
                    id: 'company.booking.profile.daily-schedule.create-bulk',
                    url: '/company/booking/profile/daily-schedule/create-bulk',
                  },
                  {
                    id: 'company.booking.profile.daily-schedule.delete',
                    url: '/company/booking/profile/daily-schedule/delete',
                  },
                ],
              },
            ],
          },
          {
            id: 'company.booking.admin',
            url: '/company/booking/admin',
            children: [
              {
                id: 'company.booking.admin.service-groups',
                url: '/company/booking/admin/service-groups',
                children: [
                  {
                    id: 'company.booking.admin.service-groups.create',
                    url: '/company/booking/admin/service-groups/create',
                  },
                  {
                    id: 'company.booking.admin.service-groups.update',
                    url: '/company/booking/admin/service-groups/update',
                  },
                  {
                    id: 'company.booking.admin.service-groups.delete',
                    url: '/company/booking/admin/service-groups/delete',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
export const API_ROUTES_MAP: Record<string, { id: string; url: string }> = (() => {
  const map: Record<string, { id: string; url: string }> = {};

  const flattenBranch = (branch: ApiRoute): void => {
    map[branch.id] = {
      id: branch.id,
      url: branch.url,
    };

    if (branch.children) {
      branch.children.forEach((child) => flattenBranch(child));
    }
  };

  API_ROUTES_TREE.forEach((branch) => flattenBranch(branch));
  return map;
})();

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

const extractProductFromRoute = (routeId: string): 'BOOKING' | 'EVENT' | 'TIMESHEET' | null => {
  const routeParts = routeId.split('.');
  if (routeParts.includes('booking')) return 'BOOKING';
  if (routeParts.includes('event')) return 'EVENT';
  if (routeParts.includes('timesheet')) return 'TIMESHEET';
  return null;
};

const hasUserRole = (user: CompanyUserDto, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.some((role) => user.userRoles.includes(role));
};

const hasCompanyRole = (user: CompanyUserDto, requiredRoles: CompanyRole[]): boolean => {
  return requiredRoles.some((role) => user.companyRoles.includes(role));
};

export const createNavigation = (
  authPayload?: AuthenticatedUserPayload | null,
  user?: CompanyUserDto | null,
  company?: CompanyDto | null,
): UserNavigation => {
  const hasAccess = (branch: RouteBranch): boolean => {
    // Level 0: PUBLIC - always allow
    if (branch.accessType === Access.PUBLIC) {
      return true;
    }

    // Level 1: NOT_AUTHENTICATED - only if no auth
    if (branch.accessType === Access.NOT_AUTHENTICATED) {
      return !authPayload;
    }

    // Level 2: AUTHENTICATED - requires valid JWT
    if (!authPayload) {
      return false;
    }

    if (branch.accessType === Access.AUTHENTICATED) {
      return true;
    }

    // Level 3: ROLE - requires company membership + role checks
    if (!user || !company) {
      return false;
    }

    // Check user roles (system-level)
    if (branch.userRoles?.length && !hasUserRole(user, branch.userRoles)) {
      return false;
    }

    // Check company roles
    if (branch.companyRoles?.length && !hasCompanyRole(user, branch.companyRoles)) {
      return false;
    }

    if (branch.accessType === Access.ROLE) {
      return true;
    }

    // Level 4: PRODUCT - requires company + product + role checks
    if (branch.accessType === Access.PRODUCT) {
      const product = extractProductFromRoute(branch.id);
      if (!product || !company.products.includes(product)) {
        return false;
      }

      // Product routes may also have role requirements
      if (branch.companyRoles?.length && !hasCompanyRole(user, branch.companyRoles)) {
        return false;
      }

      return true;
    }

    // Default allow if no specific access type
    return true;
  };

  const filterBranch = (branch: RouteBranch): RouteBranch[] => {
    if (!hasAccess(branch)) {
      return [];
    }

    const childBranches: RouteBranch[] = [];
    if (branch.children) {
      branch.children.forEach((child) => {
        childBranches.push(...filterBranch(child));
      });
    }

    if (branch.hidden) {
      return childBranches;
    }

    const filteredBranch: RouteBranch = {
      id: branch.id,
      href: branch.href,
      label: branch.label,
      accessType: branch.accessType,
      placement: branch.placement,
      hidden: branch.hidden,
      category: branch.category,
      userRoles: branch.userRoles,
      companyRoles: branch.companyRoles,
      iconName: branch.iconName,
      children: childBranches.length > 0 ? childBranches : undefined,
    };

    return [filteredBranch];
  };

  const filteredTree = ROUTE_TREE.flatMap((branch) => filterBranch(branch));

  const collectByPlacement = (branches: RouteBranch[]): RouteBranch[] => {
    const result: RouteBranch[] = [];

    const traverse = (branch: RouteBranch, parentHasPlacement = false) => {
      const hasPlacement = branch.placement !== undefined;

      if (hasPlacement && !parentHasPlacement) {
        result.push(branch);
      }

      if (branch.children) {
        branch.children.forEach((child) => traverse(child, hasPlacement));
      }
    };

    branches.forEach((branch) => traverse(branch, false));
    return result;
  };

  const placementBranches = collectByPlacement(filteredTree);

  const result: UserNavigation = {
    [RoutePlaceMent.NAVIGATION]: [],
    [RoutePlaceMent.SIDEBAR]: [],
    [RoutePlaceMent.FOOTER]: [],
  };

  placementBranches.forEach((branch) => {
    if (branch.placement) {
      result[branch.placement].push(branch);
    }
  });

  return result;
};
