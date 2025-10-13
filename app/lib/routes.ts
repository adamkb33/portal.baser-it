import { CompanyRoleAssignmentDto } from '~/api/clients/identity';
import type { CreateUserRequestDto } from '~/api/clients/identity';
import { buildRoutes } from './routes-builder';

const shape = {
  auth: {
    label: '_',
    signIn: { label: 'Logg inn' },
    signOut: { label: 'Logg inn' },
    acceptInvite: { label: 'Aksepter invitasjon' },
  },
  user: {
    requires: [CreateUserRequestDto.role.ADMIN],

    label: 'Bruker',
    profile: { label: 'Min profil' },
  },
  admin: {
    requires: [CompanyRoleAssignmentDto.role.ADMIN],
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
