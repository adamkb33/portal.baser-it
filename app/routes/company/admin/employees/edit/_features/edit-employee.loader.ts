import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import type { CompanyUserDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { ROUTES_MAP } from '~/lib/route-tree';
import { getUserSession } from '~/lib/auth.utils';

export type CompanyEmployeesEditLoaderData = {
  user: CompanyUserDto;
};

export async function editEmployeeLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return redirect(ROUTES_MAP['company.admin.employees.overview'].href);
  }

  try {
    const { user, accessToken: accesstoken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseApi = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });

    const response = await baseApi.CompanyUserControllerService.CompanyUserControllerService.getCompanyUser({
      companyId: user.company.companyId,
      userId: parseInt(userId),
    });

    if (!response.data) {
      return redirect(ROUTES_MAP['company.admin.employees.overview'].href);
    }

    return data<CompanyEmployeesEditLoaderData>({
      user: response.data,
    });
  } catch (error: any) {
    console.error(error);
    if (error as ApiClientError) {
      return redirect(ROUTES_MAP['company.admin.employees.overview'].href);
    }

    throw error;
  }
}
