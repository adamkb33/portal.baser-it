// routes/company/contacts/company.contacts.route.tsx
import { data, redirect } from 'react-router';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { PageHeader } from '../../_components/page-header';
import type { Route } from './+types/company.admin.contacts.route';
import { createBaseClient } from '~/api/clients/base';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessTokenFromRequest } from '~/lib/auth.utils';
import { ContactFormDialog } from './_components/contact.form-dialog';
import { ContactsTable } from './_components/contacts.table';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const accessToken = await getAccessTokenFromRequest(request);
    if (!accessToken) return redirect('/');

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '5');
    const sort = url.searchParams.get('sort') || 'id';

    const baseClient = createBaseClient({
      baseUrl: ENV.BASE_SERVICE_BASE_URL,
      token: accessToken,
    });

    const response =
      await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.getContacts({
        page,
        size,
        sort,
      });

    return data({
      contacts: response?.data?.content || [],
      pagination: {
        page: response?.data?.page || 0,
        size: response?.data?.size || 20,
        totalElements: response?.data?.totalElements || 0,
        totalPages: response?.data?.totalPages || 0,
      },
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body?.message } as any;
    }
    throw error;
  }
}

export default function CompanyContactsRoute({ loaderData }: Route.ComponentProps) {
  const [filter, setFilter] = useState('');

  if ('error' in loaderData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-500">{loaderData.error}</p>
      </div>
    );
  }

  const { contacts, pagination } = loaderData;

  return (
    <>
      <PageHeader
        title="Kontakter"
        description="Administrer kontaktpersoner og detaljer. Hold oversikt over viktige kontakter for ditt selskap."
        actions={<ContactFormDialog trigger={<Button>Ny kontakt</Button>} />}
      />

      <div className="flex items-center py-2">
        <Input
          placeholder="Filtrer på navn, e-post eller mobil…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <ContactsTable contacts={contacts} pagination={pagination} />
    </>
  );
}
