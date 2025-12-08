import { redirect, type ActionFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { createBaseClient, Roles, type EditCompanyUserDto } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { getUserSession } from '~/lib/auth.utils';

export async function editEmployeeAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId');
    const rolesToUpdate = formData.get('roles');

    if (!userId || !rolesToUpdate) {
      return { error: 'Form data not provided' };
    }

    const { user, accessToken: accesstoken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });
    const payload: EditCompanyUserDto = {
      roles: rolesToUpdate.toString().split(',').flat() as Roles[],
    };

    await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.editCompanyUser({
      companyId: user.company.companyId,
      userId: parseInt(userId.toString()),
      requestBody: payload,
    });

    return redirect('/company/employees/overview');
  } catch (error: any) {
    console.error(error);
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}
