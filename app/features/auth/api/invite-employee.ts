// ~/features/company/api/invite-employee.server.ts
import { redirect, type ActionFunctionArgs } from 'react-router';
import { createBaseClient, type InviteCompanyUserDto } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { accessTokenCookie } from '~/features/auth/api/cookies.server';
import type { ApiClientError } from '~/api/clients/http';
import { getCompanyContextSession } from '~/lib/auth.utils';

export async function inviteEmployee({ request }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const companyContext = await getCompanyContextSession(request);

  if (!accessToken || !companyContext) {
    return { error: 'Unauthorized', status: 401 };
  }

  const formData = await request.formData();
  const payload = Object.fromEntries(formData) as Record<string, string>;

  let roles;
  try {
    roles = JSON.parse(payload.roles);
  } catch {
    return {
      error: 'Ugyldig rolledata',
      values: {
        email: payload.email,
      },
    };
  }

  const inviteData: InviteCompanyUserDto = {
    email: payload.email,
    roles,
  };

  try {
    const baseApi = createBaseClient({
      baseUrl: ENV.BASE_SERVICE_BASE_URL,
      token: accessToken,
    });

    const response = await baseApi.AdminCompanyControllerService.AdminCompanyControllerService.inviteEmployee({
      companyId: companyContext.companyId,
      requestBody: inviteData,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to invite employee');
    }

    return redirect('/company/employees');
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return {
        error: error.body?.message || 'Kunne ikke sende invitasjon. Vennligst prøv igjen.',
        values: inviteData,
      };
    }

    return {
      error: 'En uventet feil oppstod. Vennligst prøv igjen.',
      values: inviteData,
    };
  }
}
