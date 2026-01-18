import { data, redirect, useLoaderData } from 'react-router';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { handleRouteError, type RouteData } from '~/lib/api-error';
import type { Route } from './+types/user.route';

export async function loader(args: Route.LoaderArgs) {
  try {
    const authPayload = await getAuthPayloadFromRequest(args.request);

    if (!authPayload) {
      return redirect('/');
    }

    return data<RouteData<{ user: typeof authPayload }>>({
      ok: true,
      user: authPayload,
    });
  } catch (error: any) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke hente bruker' });
  }
}

export default function UserRoute({ loaderData }: Route.ComponentProps) {
  const payload = loaderData.ok ? loaderData.user : loaderData.error.message;

  return <div>{JSON.stringify(payload ?? 'No user data found', null, 2)}</div>;
}
