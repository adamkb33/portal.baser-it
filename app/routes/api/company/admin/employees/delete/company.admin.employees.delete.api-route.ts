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

    if (!userId) {
      return redirectWithError(request, ROUTES_MAP['company.admin.employees'].href, 'Bruker-ID mangler');
    }

    const { user, accessToken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

    await baseClient.AdminCompanyUserControllerService.AdminCompanyUserControllerService.deleteCompanyUser({
      userId: Number(userId),
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.admin.employees'].href, 'Ansatt fjernet');
  } catch (error: any) {
    console.error(error);
    const errorMessage = (error as ApiClientError)?.body?.message || 'Kunne ikke fjerne ansatt';
    return redirectWithError(request, ROUTES_MAP['company.admin.employees'].href, errorMessage);
  }
}
