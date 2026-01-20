import { data, redirect } from 'react-router';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { resolveErrorPayload } from '~/lib/api-error';
import type { Route } from './+types/user.route';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const authPayload = await getAuthPayloadFromRequest(request);

    if (!authPayload) {
      return redirect('/');
    }

    return data({
      user: authPayload,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente bruker');
    return data(
      {
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export default function UserRoute({ loaderData }: Route.ComponentProps) {
  const payload = 'user' in loaderData ? loaderData.user : loaderData.error;

  return <div>{JSON.stringify(payload, null, 2)}</div>;
}
