import { data, redirect, type ActionFunctionArgs } from 'react-router';

import { createBaseClient } from '~/api/clients/base';
import type { CreateContactDto, UpdateContactDto } from 'tmp/openapi/gen/base';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';

export type ContactsActionData = {
  success: boolean;
  message: string;
  contact: any | null;
};

export async function contactsAction({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return redirect('/');

  const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

  const form = await request.formData();
  const intent = (form.get('intent') as string) || '';
  const redirectTo = (form.get('redirectTo') as string | null) ?? null;
  const isSafeRedirect = (url: string) => url.startsWith('/') && !url.startsWith('//');

  const maybeRedirect = (id?: number | null) => {
    if (redirectTo && isSafeRedirect(redirectTo)) {
      const url = new URL(redirectTo, 'http://dummy');
      if (id) url.searchParams.set('contactId', String(id));
      return redirect(url.pathname + url.search);
    }
    return null;
  };

  try {
    if (intent === 'create') {
      const payload: CreateContactDto = {
        givenName: String(form.get('givenName') ?? ''),
        familyName: String(form.get('familyName') ?? ''),
        email: form.get('email') ? String(form.get('email')) : undefined,
        mobileNumber: form.get('mobileNumber') ? String(form.get('mobileNumber')) : undefined,
      };

      const res =
        await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.createContact({
          requestBody: payload,
        });

      const createdContact = res?.data ?? null;
      const r = maybeRedirect(createdContact?.id ?? null);
      if (r) return r;

      return data({ success: true, message: 'Kontakt opprettet', contact: createdContact });
    }

    if (intent === 'update') {
      const id = Number(form.get('id'));
      const payload: UpdateContactDto = {
        givenName: String(form.get('givenName') ?? ''),
        familyName: String(form.get('familyName') ?? ''),
        email: form.get('email') ? String(form.get('email')) : undefined,
        mobileNumber: form.get('mobileNumber') ? String(form.get('mobileNumber')) : undefined,
      };

      const res =
        await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.updateContact({
          id,
          requestBody: payload,
        });

      return data({ success: true, message: 'Kontakt oppdatert', contact: res?.data || null });
    }

    if (intent === 'delete') {
      const id = Number(form.get('id'));
      await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.deleteContact({ id });

      const r = maybeRedirect(null);
      if (r) return r;

      return data({ success: true, message: 'Kontakt slettet', contact: null });
    }

    return data({ success: false, message: 'Ugyldig handling' }, { status: 400 });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return data({ success: false, message: error.body?.message || 'En feil oppstod' }, { status: 400 });
  }
}