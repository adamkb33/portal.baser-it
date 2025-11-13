// app/routes/company.contacts.tsx
import {
  data,
  redirect,
  useLoaderData,
  useSubmit,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { createBaseClient } from '~/api/clients/base';
import type { ApiClientError } from '~/api/clients/http';
import type { ContactDto, CreateContactDto, UpdateContactDto } from 'tmp/openapi/gen/base';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';

import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/table/data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';

/* ================================
 * Loader
 * ================================ */

export type CompanyContactsLoaderData = {
  contacts: ContactDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) return redirect('/');

    const baseClient = createBaseClient({
      baseUrl: ENV.BASE_SERVICE_BASE_URL,
      token: accessToken,
    });

    const response =
      await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.getContacts();

    return data<CompanyContactsLoaderData>({ contacts: response?.data || [] });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body?.message } as any;
    }
    throw error;
  }
}

/* ================================
 * Action (create / update / delete)
 * NOTE: No Zod here — per request, validation is client-only
 * ================================ */

export type ContactsActionData = {
  success: boolean;
  message: string;
  contact: ContactDto | null;
};

export async function action({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return redirect('/');

  const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

  const form = await request.formData();
  const intent = (form.get('intent') as string) || '';
  const redirectTo = (form.get('redirectTo') as string | null) ?? null;
  const isSafeRedirect = (url: string) => url.startsWith('/') && !url.startsWith('//');

  const maybeRedirect = (id?: number | null) => {
    if (redirectTo && isSafeRedirect(redirectTo)) {
      const url = new URL(redirectTo, 'http://dummy'); // base needed only to use URL API
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

      // assuming API returns the created contact; if not, re-fetch by some id it returns
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

/* ================================
 * Client-only Zod validation
 * ================================ */

const ContactFormSchema = z.object({
  givenName: z.string().min(1, 'Fornavn er påkrevd').max(100, 'Maks 100 tegn'),
  familyName: z.string().min(1, 'Etternavn er påkrevd').max(100, 'Maks 100 tegn'),
  email: z.string().trim().email('Ugyldig e‑postadresse').optional().or(z.literal('')),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^$|^\+?\d{6,15}$/u, 'Ugyldig mobilnummer') // allow empty or 6–15 digits, optional +
    .optional()
    .or(z.literal('')),
});

/* ================================
 * Component
 * ================================ */

type ContactFormData = {
  id?: number;
  givenName: string;
  familyName: string;
  email?: string;
  mobileNumber?: string;
};

type ContactRow = Omit<ContactDto, 'email' | 'mobileNumberDto'> & {
  contactEmail?: string;
  contactMobileNumber?: string;
};

type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

export default function CompanyContactsRoute() {
  const { contacts } = useLoaderData<CompanyContactsLoaderData>();
  const submit = useSubmit();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactFormData | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

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
      email: contact.email?.email ?? '',
      mobileNumber: contact.mobileNumberDto?.mobileNumber ?? '',
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

    submit(fd, { method: 'post' });
    toast.success('Kontakten ble slettet');

    setIsDeleteDialogOpen(false);
    setDeletingContactId(null);
  };

  const handleFieldChange = (name: keyof ContactFormData, value: any) => {
    if (!editingContact) return;
    setEditingContact({ ...editingContact, [name]: value });
    // clear error for the specific field on change
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

    // Client-side validation only (per request)
    const nextErrors = validateClient(editingContact);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const fd = new FormData();
    fd.append('intent', editingContact.id ? 'update' : 'create');
    if (editingContact.id) fd.append('id', String(editingContact.id));
    fd.append('givenName', (editingContact.givenName || '').trim());
    fd.append('familyName', (editingContact.familyName || '').trim());
    if (editingContact.email) fd.append('email', editingContact.email.trim());
    if (editingContact.mobileNumber) fd.append('mobileNumber', editingContact.mobileNumber.trim());

    submit(fd, { method: 'post' });

    setIsDialogOpen(false);
    setEditingContact(null);

    toast.success(editingContact.id ? 'Kontakt oppdatert' : 'Kontakt opprettet');
  };

  const contactRows: ContactRow[] = contacts.map((c) => ({
    ...c,
    contactEmail: c.email?.email ?? '',
    contactMobileNumber: c.mobileNumberDto?.mobileNumber ?? '',
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-end items-center mb-6">
        <Button onClick={openCreate}>Ny kontakt</Button>
      </div>

      <DataTable<ContactRow>
        data={contactRows}
        getRowKey={(row) => row.id}
        columns={[
          { header: 'ID', accessor: 'id' as any },
          { header: 'Fornavn', accessor: 'givenName' as any, className: 'font-medium' },
          { header: 'Etternavn', accessor: 'familyName' as any },
          { header: 'E-post', accessor: 'contactEmail' as any },
          { header: 'Mobil', accessor: 'contactMobileNumber' as any },
        ]}
        actions={[
          { label: 'Rediger', onClick: (row) => openEdit(row), variant: 'outline' },
          { label: 'Slett', onClick: (row) => requestDelete(row.id), variant: 'destructive' },
        ]}
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
    </div>
  );
}
