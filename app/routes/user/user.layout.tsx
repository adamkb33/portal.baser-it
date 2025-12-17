import { Outlet, redirect, type LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';

// TODO: Check if user has company context

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const authPayload = await getAuthPayloadFromRequest(request);

    if (!authPayload) {
      return redirect('/');
    }
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function UserLayout() {
  return <Outlet />;
}
