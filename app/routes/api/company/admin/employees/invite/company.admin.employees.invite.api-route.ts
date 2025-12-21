import { redirect, type ActionFunctionArgs } from 'react-router';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { getUserSession } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const rolesJson = formData.get('roles');

  if (!email || !rolesJson) {
    return { error: 'Form data not provided' };
  }

  let roles;
  try {
    roles = JSON.parse(rolesJson.toString());
  } catch {
    return { error: 'Ugyldig rolledata' };
  }

  const { user, accessToken } = await getUserSession(request);
  if (!user || !user.company) {
    return redirect('/');
  }

  const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

  await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.inviteCompanyUser({
    requestBody: { email: email.toString(), roles },
  });

  return redirect(ROUTES_MAP['company.admin.employees'].href);
}
