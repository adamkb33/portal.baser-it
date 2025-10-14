import { buildRoutes } from './routes-builder';

export const ROUTES_SHAPE = {
  auth: {
    label: '_',
    signIn: { label: 'Logg inn' },
    signOut: { label: 'Logg inn' },
    acceptInvite: { label: 'Aksepter invitasjon' },
  },
  user: {
    label: 'Bruker',
    profile: { label: 'Min profil' },
  },
  employee: {
    label: 'Ansatt profil',
    profile: { label: 'Min ansatt profil' },
  },
  admin: {
    label: 'Admin',
    dashboard: { label: 'Dashbord' },
    company: {
      label: 'Mitt selskap',
      settings: { label: 'Instillinger' },
      employees: { label: 'Ansatte' },
    },
  },
} as const;

// user can be unauthenticated
// - sign inn, forgot password, create account

// user can be authenticated
// - sign out, profile...

// user can be authentiated and have a role of employee

// user can be authenticated and have a role of admin

export const ROUTES = buildRoutes(ROUTES_SHAPE);
export type Routes = typeof ROUTES;
