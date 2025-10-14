import { buildRoutes } from './routes-builder';

const shape = {
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

export const ROUTES = buildRoutes(shape);
export type Routes = typeof ROUTES;
