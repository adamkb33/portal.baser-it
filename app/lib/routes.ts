// routes.ts
import { route } from './utils';
const auth = route('auth');
const user = route('user');
const admin = route('admin');
const company = route(`${admin.route}/company`);
const dashboard = route(`${admin.route}/dashboard`);

export const ROUTES = {
  AUTH: {
    ...auth.group({
      SIGN_IN: 'sign-in',
      SIGN_OUT: 'sign-out',
      ACCEPT_INVITE: 'accept-invite',
    }),
  },
  USER: {
    ...user.group({
      PROFILE: 'profile',
    }),
  },
  ADMIN: {
    DASHBOARD: {
      ROUTE: dashboard.route,
    },
    COMPANY: {
      ROUTE: company.route,
      ...company.group({
        SETTINGS: 'settings',
        EMPLOYEES: 'employees',
      }),
    },
  },
} as const;

export type Routes = typeof ROUTES;
