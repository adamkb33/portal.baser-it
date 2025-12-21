// routes/api/company/admin/employees/edit.api-route.ts
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
    const userId = formData.get('userId');
    const rolesToUpdate = formData.get('roles');

    if (!userId || !rolesToUpdate) {
      return redirectWithError(request, ROUTES_MAP['company.admin.employees'].href, 'Manglende skjemadata');
    }

    const { user, accessToken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

    await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.editCompanyUser({
      companyId: user.company.companyId,
      userId: parseInt(userId.toString()),
      requestBody: {
        roles: rolesToUpdate.toString().split(',') as any[],
      },
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.admin.employees'].href, 'Ansattinformasjon oppdatert');
  } catch (error: any) {
    console.error(error);
    const errorMessage = (error as ApiClientError)?.body?.message || 'Kunne ikke oppdatere ansatt';
    return redirectWithError(request, ROUTES_MAP['company.admin.employees'].href, errorMessage);
  }
}
