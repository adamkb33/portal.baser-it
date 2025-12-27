// routes/company/contacts/company.contacts.route.tsx
import { useSubmit, useNavigate, useSearchParams, data, redirect } from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ContactDto } from 'tmp/openapi/gen/base';

import { Button } from '~/components/ui/button';
import { ServerPaginatedTable } from '~/components/table/server-side-paginated.data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import { Pen } from 'lucide-react';

import { contactsAction } from './_features/company.contacts.action';
import { ContactFormSchema, type ContactFormData, type FieldErrors } from './_schemas/contact.form.schema';
import { PageHeader } from '../../_components/page-header';
import type { Route } from './+types/company.admin.contacts.route';
import { createBaseClient } from '~/api/clients/base';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessTokenFromRequest } from '~/lib/auth.utils';
import { API_ROUTES_MAP } from '~/lib/route-tree';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactFormData | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [filter, setFilter] = useState('');

  if ('error' in loaderData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-500">{loaderData.error}</p>
      </div>
    );
  }

  const { contacts, pagination } = loaderData;

  const openCreate = () => {
    setEditingContact({ givenName: '', familyName: '', email: '', mobileNumber: '' });
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (contact: ContactDto) => {
    setEditingContact({
      id: contact.id,
      givenName: contact.givenName ?? '',
      familyName: contact.familyName ?? '',
      email: contact.email?.value ?? '',
      mobileNumber: contact.mobileNumber?.value ?? '',
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const requestDelete = (id: number) => {
    setDeletingContactId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingContactId) return;

    const fd = new FormData();
    fd.append('intent', 'delete');
    fd.append('id', String(deletingContactId));

    submit(fd, { method: 'post', action: API_ROUTES_MAP['company.admin.contacts.delete'].url });

    setIsDeleteDialogOpen(false);
    setDeletingContactId(null);
  };

  const handleFieldChange = (name: keyof ContactFormData, value: any) => {
    if (!editingContact) return;
    setEditingContact({ ...editingContact, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateClient = (values: ContactFormData): FieldErrors => {
    const parsed = ContactFormSchema.safeParse(values);
    if (parsed.success) return {};
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0] as keyof ContactFormData | undefined;
      if (path) fieldErrors[path] = issue.message;
    }
    return fieldErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    const nextErrors = validateClient(editingContact);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const fd = new FormData();

    if (editingContact.id) fd.append('id', String(editingContact.id));
    fd.append('givenName', (editingContact.givenName || '').trim());
    fd.append('familyName', (editingContact.familyName || '').trim());
    if (editingContact.email) fd.append('email', editingContact.email.trim());
    if (editingContact.mobileNumber) fd.append('mobileNumber', editingContact.mobileNumber.trim());

    if (editingContact.id) {
      submit(fd, { method: 'post', action: API_ROUTES_MAP['company.admin.contacts.update'].url });
    } else {
      submit(fd, { method: 'post', action: API_ROUTES_MAP['company.admin.contacts.create'].url });
    }

    setIsDialogOpen(false);
    setEditingContact(null);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('size', newSize.toString());
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const formatName = (contact: ContactDto) => {
    const parts = [contact.givenName, contact.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  return (
    <>
      <PageHeader
        title="Kontakter"
        description="Administrer kontaktpersoner og detaljer. Hold oversikt over viktige kontakter for ditt selskap."
        actions={<Button onClick={openCreate}>Ny kontakt</Button>}
      />

      <div className="flex items-center py-2">
        <Input
          placeholder="Filtrer på navn, e-post eller mobil…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <ServerPaginatedTable<ContactDto>
        items={contacts}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowKey={(contact) => contact.id?.toString() ?? contact.email?.value ?? ''}
        columns={[
          { header: 'Navn' },
          { header: 'E-post' },
          { header: 'Mobil' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        renderRow={(contact) => (
          <TableRow>
            <TableCell className="font-medium">{formatName(contact)}</TableCell>
            <TableCell>{contact.email?.value || '—'}</TableCell>
            <TableCell>{contact.mobileNumber?.value || '—'}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(contact)}>
                  <Pen className="h-4 w-4" />
                  <span className="sr-only">Rediger</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  disabled={contact.id == null}
                  onClick={() => contact.id && requestDelete(contact.id)}
                >
                  Slett
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {editingContact && (
        <FormDialog<ContactFormData>
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title={editingContact.id ? 'Rediger kontakt' : 'Ny kontakt'}
          formData={editingContact}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          fields={[
            {
              name: 'givenName',
              label: 'Fornavn',
              type: 'text',
              placeholder: 'Skriv inn fornavn',
              required: true,
              error: errors.givenName,
            },
            {
              name: 'familyName',
              label: 'Etternavn',
              type: 'text',
              placeholder: 'Skriv inn etternavn',
              required: true,
              error: errors.familyName,
            },
            {
              name: 'email',
              label: 'E‑post',
              type: 'email',
              placeholder: 'fornavn@firma.no',
              error: errors.email,
            },
            {
              name: 'mobileNumber',
              label: 'Mobil',
              type: 'text',
              placeholder: 'Eks: +4741234567',
              description: 'Valgfritt. Bruk tall, ev. med + og landskode.',
              error: errors.mobileNumber,
            },
          ]}
          actions={[
            {
              label: 'Avbryt',
              variant: 'outline',
              onClick: () => {
                setIsDialogOpen(false);
                setEditingContact(null);
              },
            },
            { label: 'Lagre', type: 'submit', variant: 'default', onClick: () => {} },
          ]}
        />
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Slett kontakt?"
        description="Er du sikker på at du vil slette denne kontakten? Denne handlingen kan ikke angres."
      />
    </>
  );
}
