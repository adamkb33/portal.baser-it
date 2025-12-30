// routes/company/contacts/company.contacts.route.tsx
import { data, redirect } from 'react-router';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { PageHeader } from '../../_components/page-header';
import type { Route } from './+types/company.admin.contacts.route';
import { ContactFormDialog } from './_components/contact.form-dialog';
import { ContactsTable } from './_components/contacts.table';
import { CompanyUserContactController } from '~/api/generated/identity';
import { withAuth } from '~/api/utils/with-auth';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '5');
    const sort = url.searchParams.get('sort') || 'id';

    const response = await withAuth(request, async () => {
      return await CompanyUserContactController.getContacts({
        query: {
          page,
          size,
          sort,
        },
      });
    });

    return data({
      contacts: response?.data?.data?.content || [],
      pagination: {
        page: response?.data?.data?.page || 0,
        size: response?.data?.data?.size || 20,
        totalElements: response?.data?.data?.totalElements || 0,
        totalPages: response?.data?.data?.totalPages || 0,
      },
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return { error: error?.message || 'Kunne ikke hente kontakter' } as any;
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
