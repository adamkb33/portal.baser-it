import { type RouteConfig, index, route } from '@react-router/dev/routes';
import { ROUTES } from './lib/routes';

export default [
  index('./routes/home.tsx'),

  route(ROUTES.AUTH.SIGN_IN, './routes/auth/sign-in.tsx'),
  route(ROUTES.AUTH.SIGN_OUT, './routes/auth/sign-out.tsx'),
  route(ROUTES.AUTH.ACCEPT_INVITE, './routes/auth/accept-invite.tsx'),

  route(ROUTES.ADMIN.DASHBOARD.ROUTE, './routes/admin/dashboard.tsx'),

  route(ROUTES.ADMIN.COMPANY.ROUTE, './routes/admin/company/_index.tsx'),
  route(ROUTES.ADMIN.COMPANY.SETTINGS, './routes/admin/company/settings.tsx'),
  route(ROUTES.ADMIN.COMPANY.EMPLOYEES, './routes/admin/company/employees.tsx'),
] satisfies RouteConfig;
