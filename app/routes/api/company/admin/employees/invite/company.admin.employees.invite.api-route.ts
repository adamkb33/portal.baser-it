// routes/api/company/admin/employees/invite.api-route.ts
import { redirect, type ActionFunctionArgs } from 'react-router';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { getUserSession } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { ApiClientError } from '~/api/clients/http';
import { redirectWithError, redirectWithSuccess } from '~/routes/company/_lib/flash-message.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const email = formData.get('email');
    const rolesJson = formData.get('roles');

    if (!email || !rolesJson) {
      return redirectWithError(request, ROUTES_MAP['company.admin.employees'].href, 'Manglende skjemadata');
    }

    let roles;
    try {
      roles = JSON.parse(rolesJson.toString());
    } catch {
      return redirectWithError(request, ROUTES_MAP['company.admin.employees'].href, 'Ugyldig rolledata');
    }

    const { user, accessToken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

    await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.inviteCompanyUser({
      requestBody: { email: email.toString(), roles },
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.admin.employees'].href, 'Invitasjon sendt');
  } catch (error: any) {
    console.error(error);
    const errorMessage = (error as ApiClientError)?.body?.message || 'Kunne ikke invitere bruker';
    return redirectWithError(request, ROUTES_MAP['company.admin.employees'].href, errorMessage);
  }
}
