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

import {
  Calendar,
  Users,
  Settings,
  Home,
  UserCircle,
  Building2,
  ClipboardList,
  Clock,
  FolderKanban,
  Briefcase,
  LogIn,
  LogOut,
  Key,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

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
  icon?: LucideIcon;
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
    icon: Key,
    children: [
      {
        id: 'auth.sign-in',
        href: '/auth/sign-in',
        label: 'Logg inn',
        category: BrachCategory.AUTH,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.NOT_AUTHENTICATED,
        icon: LogIn,
      },
      {
        id: 'auth.forgot-password',
        href: '/auth/forgot-password',
        label: 'Glemt passord',
        category: BrachCategory.AUTH,
        accessType: Access.NOT_AUTHENTICATED,
        icon: Key,
      },
      {
        id: 'auth.reset-password',
        href: '/auth/reset-password',
        label: 'Tilbakestill passord',
        category: BrachCategory.AUTH,
        accessType: Access.NOT_AUTHENTICATED,
        icon: Key,
      },
      {
        id: 'auth.accept-invite',
        href: '/auth/accept-invite',
        label: 'Aksepter invitasjon',
        category: BrachCategory.NONE,
        accessType: Access.NOT_AUTHENTICATED,
        icon: UserPlus,
      },
      {
        id: 'auth.sign-out',
        href: '/auth/sign-out',
        label: 'Logg ut',
        category: BrachCategory.AUTH,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
        icon: LogOut,
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
    icon: UserCircle,
    children: [
      {
        id: 'user.profile',
        href: '/user/profile',
        label: 'Min profil',
        category: BrachCategory.USER,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
        icon: UserCircle,
      },
      {
        id: 'user.company-context',
        href: '/user/company-context',
        label: 'Mine selskap',
        category: BrachCategory.USER,
        placement: RoutePlaceMent.NAVIGATION,
        accessType: Access.AUTHENTICATED,
        icon: Building2,
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
    icon: Building2,
    children: [
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
        id: 'company.admin',
        href: '/company/admin',
        label: 'Selskap administrasjon',
        category: BrachCategory.NONE,
        accessType: Access.AUTHENTICATED,
        companyRoles: [Roles.ADMIN],
        icon: Settings,
        children: [
          {
            id: 'company.admin.settings',
            href: '/company/admin/settings',
            hidden: true,
            label: 'Instillinger',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
            icon: Settings,
          },
          {
            id: 'company.admin.employees',
            href: '/company/admin/employees',
            label: 'Ansatte',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN],
            icon: Users,
          },
          {
            id: 'company.admin.contacts',
            href: '/company/admin/contacts',
            label: 'Kontakter',
            category: BrachCategory.COMPANY,
            accessType: Access.AUTHENTICATED,
            companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
            icon: Users,
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
        companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
        icon: Calendar,
        children: [
          {
            id: 'company.booking.profile',
            href: '/company/booking/profile',
            label: 'Min profil',
            category: BrachCategory.COMPANY,
            accessType: Access.PRODUCT,
            companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
            icon: UserCircle,
            children: [
              {
                id: 'company.booking.profile.daily-schedule',
                href: '/company/booking/profile/daily-schedule',
                label: 'Timeplan',
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [Roles.ADMIN, Roles.EMPLOYEE],
                icon: Clock,
              },
            ],
          },
          {
            id: 'company.booking.admin',
            href: '/company/booking/admin',
            label: 'Administrasjon',
            category: BrachCategory.COMPANY,
            accessType: Access.PRODUCT,
            companyRoles: [Roles.ADMIN],
            icon: Settings,
            children: [
              {
                id: 'company.booking.admin.settings',
                href: '/company/booking/admin/settings',
                label: 'Instillinger',
                hidden: true,
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [Roles.ADMIN],
                icon: Settings,
              },
              {
                id: 'company.booking.admin.service-groups',
                href: '/company/booking/admin/service-groups',
                label: 'Tjeneste grupper',
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [Roles.ADMIN],
                icon: FolderKanban,
                children: [
                  {
                    id: 'company.booking.admin.service-groups.services',
                    href: '/company/booking/admin/service-groups/services',
                    label: 'Tjenester',
                    category: BrachCategory.COMPANY,
                    accessType: Access.PRODUCT,
                    companyRoles: [Roles.ADMIN],
                    icon: Briefcase,
                  },
                ],
              },
              {
                id: 'company.booking.admin.appointments',
                href: '/company/booking/admin/appointments',
                label: 'Time bestillinger',
                category: BrachCategory.COMPANY,
                accessType: Access.PRODUCT,
                companyRoles: [Roles.ADMIN],
                icon: ClipboardList,
                children: [
                  {
                    id: 'company.booking.admin.appointments.create',
                    href: '/company/booking/admin/appointments/create',
                    label: 'Bestill ny time',
                    category: BrachCategory.COMPANY,
                    accessType: Access.PRODUCT,
                    companyRoles: [Roles.ADMIN],
                    icon: Calendar,
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
    icon: Calendar,
    children: [
      {
        id: 'booking.public',
        href: '/booking/public',
        label: 'Bestill time',
        category: BrachCategory.PUBLIC,
        accessType: Access.PUBLIC,
        icon: Calendar,
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
                    icon: Users,
                  },
                  {
                    id: 'booking.public.appointment.session.employee',
                    href: '/booking/public/appointment/session/employee',
                    label: 'Velg behandler',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    icon: UserCircle,
                  },
                  {
                    id: 'booking.public.appointment.session.select-services',
                    href: '/booking/public/appointment/session/select-services',
                    label: 'Velg tjenester',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    icon: Briefcase,
                  },
                  {
                    id: 'booking.public.appointment.session.select-time',
                    href: '/booking/public/appointment/session/select-time',
                    label: 'Velg tidspunkt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    icon: Clock,
                  },
                  {
                    id: 'booking.public.appointment.session.overview',
                    href: '/booking/public/appointment/session/overview',
                    label: 'Oversikt',
                    category: BrachCategory.NONE,
                    accessType: Access.PUBLIC,
                    hidden: true,
                    icon: ClipboardList,
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

export const createNavigation = (user?: AuthenticatedUserPayload | null): UserNavigation => {
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

      const routeParts = branch.id.split('.');
      let productName = '';

      if (routeParts.includes('booking')) {
        productName = 'BOOKING';
      } else if (routeParts.includes('event')) {
        productName = 'EVENT';
      } else if (routeParts.includes('timesheet')) {
        productName = 'TIMESHEET';
      }

      if (!productName) {
        return false;
      }

      const hasProduct = user.company.companyProducts.some((product) => product === productName);
      if (!hasProduct) {
        return false;
      }

      if (branch.companyRoles && branch.companyRoles.length > 0) {
        if (!branch.companyRoles.some((role) => user.company?.companyRoles.includes(role))) {
          return false;
        }
      }
    }

    return true;
  };

  const filterBranch = (branch: RouteBranch): RouteBranch[] => {
    // If branch doesn't have access, return empty array
    if (!hasAccess(branch)) {
      return [];
    }

    // Process children first
    const childBranches: RouteBranch[] = [];
    if (branch.children) {
      branch.children.forEach((child) => {
        childBranches.push(...filterBranch(child));
      });
    }

    // If this branch is hidden, only return its children
    if (branch.hidden) {
      return childBranches;
    }

    // Otherwise, return this branch with its filtered children
    return [
      {
        ...branch,
        children: childBranches.length > 0 ? childBranches : undefined,
      },
    ];
  };

  const filteredTree = ROUTE_TREE.flatMap((branch) => filterBranch(branch));

  const collectByPlacement = (branches: RouteBranch[]): RouteBranch[] => {
    const result: RouteBranch[] = [];

    const traverse = (branch: RouteBranch, parentHasPlacement = false) => {
      const hasPlacement = branch.placement !== undefined;

      // Only add this branch if it has a placement AND its parent doesn't have the same placement
      if (hasPlacement && !parentHasPlacement) {
        result.push(branch);
      }

      // Traverse children, passing down whether this branch has a placement
      if (branch.children) {
        branch.children.forEach((child) => traverse(child, hasPlacement));
      }
    };

    branches.forEach((branch) => traverse(branch, false));
    return result;
  };

  const placementBranches = collectByPlacement(filteredTree);

  // Initialize all placements
  const result: UserNavigation = {
    [RoutePlaceMent.NAVIGATION]: [],
    [RoutePlaceMent.SIDEBAR]: [],
    [RoutePlaceMent.FOOTER]: [],
  };

  // Populate with branches
  placementBranches.forEach((branch) => {
    if (branch.placement) {
      result[branch.placement].push(branch);
    }
  });

  return result;
};
