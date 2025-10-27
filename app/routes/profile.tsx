import { data, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { accessTokenCookie } from '~/features/auth/api/cookies.server';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';

export type ProfileLoaderData = {
  user: AuthenticatedUserPayload;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const authPayload = await getAuthPayloadFromRequest(request);
  if (!authPayload) {
    return redirect('/');
  }
  return data<ProfileLoaderData>({
    user: authPayload,
  });
}

export default function Profile() {
  const data = useLoaderData<ProfileLoaderData>();

  return <div>{JSON.stringify(data.user, null, 2)}</div>;
}
