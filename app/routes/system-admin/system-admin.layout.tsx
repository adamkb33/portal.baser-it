import { Outlet, redirect } from 'react-router';
import type { Route } from './+types/system-admin.layout';
import { authService } from '~/lib/auth-service';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { redirectWithError } from '~/lib/flash-message.server';
import { withAuth } from '~/api/utils/with-auth';
import { AuthController } from '~/api/generated/base';

export async function loader({ request }: Route.LoaderArgs) {
  let session: Awaited<ReturnType<typeof authService.getUserSession>>;

  try {
    session = await authService.getUserSession(request);
  } catch {
    throw redirect(ROUTES_MAP['auth.sign-in'].href);
  }

  let hasSystemAdminRole = false;
  try {
    const permissionsResponse = await withAuth(request, () => AuthController.getPermissions(), session.accessToken);
    hasSystemAdminRole = Boolean(permissionsResponse.data?.data?.flags?.canAccessSystemAdmin);
  } catch {
    hasSystemAdminRole = false;
  }

  if (!hasSystemAdminRole) {
    throw await redirectWithError(request, ROUTES_MAP['company'].href, 'Du har ikke tilgang til systemadministrasjon.');
  }

  return null;
}

export default function SystemAdminLayout() {
  return <Outlet />;
}
