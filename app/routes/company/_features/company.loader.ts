import { type LoaderFunctionArgs, redirect, data } from 'react-router';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { ROUTE_TREE, Access, type RouteBranch } from '~/lib/route-tree';

export type GetLayoutloaderData = { userBranches: RouteBranch[] | undefined };

export async function companyLoader({ request }: LoaderFunctionArgs) {
  const authPayload = await getAuthPayloadFromRequest(request);

  if (!authPayload || authPayload.company?.companyRoles.length === 0) {
    return redirect('/');
  }

  const userRoles = authPayload.company?.companyRoles;

  const userBranches = ROUTE_TREE.filter((branch) => {
    if (branch.accessType === Access.PRODUCT) return true;

    if (branch.accessType === Access.ROLE) {
      return !branch.hidden && branch.companyRoles?.some((role) => userRoles?.includes(role));
    }

    return false;
  });

  return data({ userBranches }, { status: 200 });
}
