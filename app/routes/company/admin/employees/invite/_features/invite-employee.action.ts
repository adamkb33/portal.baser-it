// ~/features/company/api/invite-employee.server.ts
import { data, redirect, type ActionFunctionArgs } from 'react-router';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import type { ApiClientError } from '~/api/clients/http';
import { getUserSession } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';

export async function inviteEmployee({ request }: ActionFunctionArgs) {
  const { accessToken, user } = await getUserSession(request);

  if (!accessToken || !user?.company) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const email = String(formData.get('email'));
  const rolesJson = String(formData.get('roles'));

  let roles;
  try {
    roles = JSON.parse(rolesJson);
  } catch {
    return data(
      {
        error: 'Ugyldig rolledata',
        values: { email, roles: [] },
      },
      { status: 400 },
    );
  }

  try {
    const baseApi = createBaseClient({
      baseUrl: ENV.BASE_SERVICE_BASE_URL,
      token: accessToken,
    });

    await baseApi.AdminCompanyControllerService.AdminCompanyControllerService.inviteEmployee({
      requestBody: { email, roles },
    });

    return redirect(ROUTES_MAP['company.admin.employees'].href);
  } catch (error: any) {
    if (error as ApiClientError) {
      console.error(error);
      return data(
        {
          error: error.body?.message || 'Kunne ikke sende invitasjon. Vennligst prøv igjen.',
          values: { email, roles },
        },
        { status: 400 },
      );
    }

    // Unexpected errors - throw to ErrorBoundary
    throw error;
  }
}
