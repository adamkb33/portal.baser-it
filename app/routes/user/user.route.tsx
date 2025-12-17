import { data, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import type { ApiClientError } from '~/api/clients/http';

export type ProfileLoaderData = {
  user: AuthenticatedUserPayload;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const authPayload = await getAuthPayloadFromRequest(request);

    if (!authPayload) {
      return redirect('/');
    }

    return data<ProfileLoaderData>({
      user: authPayload,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function Profile() {
  const data = useLoaderData<ProfileLoaderData>();

  return <div>{JSON.stringify(data.user, null, 2)}</div>;
}
