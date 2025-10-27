// ~/features/company/api/invite-employee.server.ts
import { redirect, type ActionFunctionArgs } from 'react-router';
import type { CompanySummaryDto } from 'tmp/openapi/gen/identity';
import { createIdentityClient, type InviteEmployeeDto } from '~/api/clients/identity';
import { ENV } from '~/api/config/env';
import { accessTokenCookie, companyContextCookie } from '~/features/auth/api/cookies.server';
import type { ApiClientError } from '~/api/clients/http';

export async function inviteEmployee({ request }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const companyContext = await companyContextCookie.parse(cookieHeader);

  if (!accessToken || !companyContext) {
    return { error: 'Unauthorized', status: 401 };
  }

  const formData = await request.formData();
  const payload = Object.fromEntries(formData) as Record<string, string>;
  console.log(formData, companyContext);

  let roles;
  try {
    roles = JSON.parse(payload.roles);
  } catch {
    return {
      error: 'Ugyldig rolledata',
      values: {
        givenName: payload.givenName,
        familyName: payload.familyName,
        email: payload.email,
      },
    };
  }

  const inviteData: InviteEmployeeDto = {
    givenName: payload.givenName,
    familyName: payload.familyName,
    email: payload.email,
    roles,
  };

  try {
    const identityApi = createIdentityClient({
      baseUrl: ENV.IDENTITY_BASE_URL,
      token: accessToken,
    });

    const response = await identityApi.AdminCompanyControllerService.AdminCompanyControllerService.inviteEmployee({
      companyId: companyContext,
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
