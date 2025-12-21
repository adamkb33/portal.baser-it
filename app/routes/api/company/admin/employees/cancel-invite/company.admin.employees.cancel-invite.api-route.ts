import { redirect, type ActionFunctionArgs } from 'react-router';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { getUserSession } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const tokenId = formData.get('id');

  if (!tokenId) {
    return { error: 'Invite token not provided' };
  }

  const { user, accessToken } = await getUserSession(request);
  if (!user || !user.company) {
    return redirect('/');
  }

  const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

  await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.cancelCompanyUserInvite({
    inviteTokenId: Number(tokenId),
  });

  return redirect(ROUTES_MAP['company.admin.employees'].href);
}
