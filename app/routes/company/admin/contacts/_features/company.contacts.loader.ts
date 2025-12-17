import { data, redirect, type LoaderFunctionArgs } from 'react-router';

import { createBaseClient } from '~/api/clients/base';
import type { ApiClientError } from '~/api/clients/http';
import type { ContactDto } from 'tmp/openapi/gen/base';
import { ENV } from '~/api/config/env';
import { getAccessTokenFromRequest } from '~/lib/auth.utils';

export type CompanyContactsLoaderData = {
  contacts: ContactDto[];
};

export async function contactsLoader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessTokenFromRequest(request);
    if (!accessToken) return redirect('/');

    const baseClient = createBaseClient({
      baseUrl: ENV.BASE_SERVICE_BASE_URL,
      token: accessToken,
    });

    const response =
      await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.getContacts({});

    return data<CompanyContactsLoaderData>({ contacts: response?.data?.content || [] });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body?.message } as any;
    }
    throw error;
  }
}
