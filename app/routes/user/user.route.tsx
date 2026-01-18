import { data, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
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
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as unknown as { body?: { message?: string } }) {
      return data({ error: error.body.message });
    }

    throw error;
  }
}

export default function UserRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const payload = 'user' in loaderData ? loaderData.user : 'No user data found';

  return <div>{JSON.stringify(payload, null, 2)}</div>;
}
