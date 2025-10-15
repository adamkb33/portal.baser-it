import { CompanyRole } from '../../api/clients/types';

import { AudienceType, NAV_PLACEMENT, type RouteTree, type RoutesShape } from './functions';
import { buildRoutes } from './routes-builder';

export const ROUTES_SHAPE: RoutesShape = {
  auth: {
    label: 'Auth',
    children: {
      signIn: {
        label: 'Logg inn',
        access: { audience: AudienceType.NoAuth },
        nav: {
          placement: NAV_PLACEMENT.NavbarEnd,
          order: 80,
        },
      },
      signOut: {
        label: 'Logg ut',
        access: { audience: AudienceType.Auth },
        nav: {
          placement: NAV_PLACEMENT.NavbarEnd,
          order: 90,
        },
      },
      acceptInvite: {
        label: 'Aksepter invitasjon',
        nav: {
          placement: NAV_PLACEMENT.NavbarEnd,
          order: 95,
        },
      },
    },
  },
  user: {
    label: 'Bruker',
    children: {
      profile: {
        label: 'Min profil',
        access: { audience: AudienceType.Auth },
        nav: {
          placement: NAV_PLACEMENT.Account,
          order: 10,
        },
      },
    },
  },
  employee: {
    label: 'Ansatt profil',
    children: {
      profile: {
        label: 'Min ansatt profil',
        access: { audience: AudienceType.Role, companyRoles: [CompanyRole.EMPLOYEE] },
        nav: {
          placement: NAV_PLACEMENT.Account,
          order: 20,
        },
      },
    },
  },
  admin: {
    label: 'Admin',
    access: { audience: AudienceType.Role, companyRoles: [CompanyRole.ADMIN] },
    children: {
      dashboard: {
        label: 'Dashbord',
        access: { audience: AudienceType.Role, companyRoles: [CompanyRole.ADMIN] },
        nav: {
          placement: NAV_PLACEMENT.Sidebar,
          order: 10,
        },
      },
      company: {
        label: 'Mitt selskap',
        access: { audience: AudienceType.Role, companyRoles: [CompanyRole.ADMIN] },
        nav: {
          placement: NAV_PLACEMENT.Sidebar,
          order: 20,
        },
        children: {
          settings: {
            label: 'Instillinger',
            access: { audience: AudienceType.Role, companyRoles: [CompanyRole.ADMIN] },
            nav: {
              placement: NAV_PLACEMENT.Sidebar,
              order: 21,
            },
          },
          employees: {
            label: 'Ansatte',
            access: { audience: AudienceType.Role, companyRoles: [CompanyRole.ADMIN] },
            nav: {
              placement: NAV_PLACEMENT.Sidebar,
              order: 22,
            },
          },
          analytics: {
            label: 'Ansatte',
            access: { audience: AudienceType.Role, companyRoles: [CompanyRole.ADMIN] },
            nav: {
              placement: NAV_PLACEMENT.Sidebar,
              order: 22,
            },
          },
        },
      },
    },
  },
};

export const ROUTES: RouteTree = buildRoutes(ROUTES_SHAPE);
export type Routes = typeof ROUTES;
