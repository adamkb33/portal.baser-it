// routes/company/contacts/tables/contacts.table.tsx
import { useState } from 'react';
import { useSubmit, useNavigate, useSearchParams } from 'react-router';
import type { ContactDto } from 'tmp/openapi/gen/base';
import { Button } from '~/components/ui/button';
import { TableCell, TableRow } from '~/components/ui/table';
import { Pen } from 'lucide-react';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { ServerPaginatedTable } from '~/components/table/server-side-paginated.data-table';
import { ContactFormDialog } from './contact.form-dialog';

type ContactsTableProps = {
  contacts: ContactDto[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export function ContactsTable({ contacts, pagination }: ContactsTableProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const [editingContact, setEditingContact] = useState<ContactDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null);

  const formatName = (contact: ContactDto) => {
    const parts = [contact.givenName, contact.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  const openDeleteDialog = (id: number) => {
    setDeletingContactId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingContactId) return;

    const fd = new FormData();
    fd.append('intent', 'delete');
    fd.append('id', String(deletingContactId));

    submit(fd, { method: 'post', action: API_ROUTES_MAP['company.admin.contacts.delete'].url });

    setIsDeleteDialogOpen(false);
    setDeletingContactId(null);
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

  return (
    <>
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
                <Button variant="outline" size="sm" onClick={() => setEditingContact(contact)}>
                  <Pen className="h-4 w-4" />
                  <span className="sr-only">Rediger</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  disabled={contact.id == null}
                  onClick={() => contact.id && openDeleteDialog(contact.id)}
                >
                  Slett
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {editingContact && <ContactFormDialog contact={editingContact} />}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Slett kontakt?"
        description="Er du sikker på at du vil slette denne kontakten? Denne handlingen kan ikke angres."
      />
    </>
  );
}
