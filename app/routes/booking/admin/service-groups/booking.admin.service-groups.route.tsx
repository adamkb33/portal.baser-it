import { useFetcher, useLoaderData } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ServiceGroupDto } from '~/api/clients/types';
import { Button } from '~/components/ui/button';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';

import { serviceGroupsLoader, type BookingServiceGroupsLoaderData } from './_features/service-groups.loader';
import { serviceGroupsAction } from './_features/service-groups.action';

export const loader = serviceGroupsLoader;
export const action = serviceGroupsAction;

type FormData = {
  id?: number;
  name: string;
};

export default function BookingServiceGroups() {
  const { serviceGroups } = useLoaderData<BookingServiceGroupsLoaderData>();
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingServiceGroup, setEditingServiceGroup] = useState<FormData | null>(null);
  const [deletingServiceGroupId, setDeletingServiceGroupId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) return;

    if (fetcher.data.success) {
      toast.success(fetcher.data.message ?? 'Handling fullført');
      setIsDialogOpen(false);
      setEditingServiceGroup(null);
      setIsDeleteDialogOpen(false);
      setDeletingServiceGroupId(null);
    } else if (fetcher.data.message) {
      toast.error(fetcher.data.message);
    }
  }, [fetcher.state, fetcher.data]);

  const filteredGroups = useMemo(() => {
    if (!filter) return serviceGroups;
    const query = filter.toLowerCase();

    return serviceGroups.filter((group) => {
      const name = group.name?.toLowerCase() ?? '';
      const id = String(group.id ?? '');
      return name.includes(query) || id.includes(query);
    });
  }, [serviceGroups, filter]);

  const handleAdd = () => {
    setEditingServiceGroup({ name: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (serviceGroup: ServiceGroupDto) => {
    setEditingServiceGroup({
      id: serviceGroup.id,
      name: serviceGroup.name,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingServiceGroupId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingServiceGroupId) return;

    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', String(deletingServiceGroupId));

    fetcher.submit(formData, { method: 'post' });
  };

  const handleFieldChange = (name: keyof FormData, value: any) => {
    if (editingServiceGroup) {
      setEditingServiceGroup({ ...editingServiceGroup, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceGroup) return;

    const formData = new FormData();
    formData.append('intent', editingServiceGroup.id ? 'update' : 'create');
    if (editingServiceGroup.id) {
      formData.append('id', String(editingServiceGroup.id));
    }
    formData.append('name', editingServiceGroup.name);

    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-xl font-semibold">Tjenestegrupper</h1>
        <Button onClick={handleAdd}>Ny tjenestegruppe</Button>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrer på navn eller ID…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <PaginatedTable<ServiceGroupDto>
        items={filteredGroups}
        getRowKey={(serviceGroup, index) => serviceGroup.id ?? `group-${index}`}
        columns={[
          { header: 'ID' },
          { header: 'Navn', className: 'font-medium' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        renderRow={(serviceGroup) => (
          <TableRow>
            <TableCell>{serviceGroup.id}</TableCell>
            <TableCell className="font-medium">{serviceGroup.name}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(serviceGroup)}>
                  Rediger
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => handleDeleteClick(serviceGroup.id!)}
                  disabled={fetcher.state !== 'idle' && deletingServiceGroupId === serviceGroup.id}
                >
                  Slett
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {editingServiceGroup && (
        <FormDialog<FormData>
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title={editingServiceGroup.id ? 'Rediger tjenestegruppe' : 'Ny tjenestegruppe'}
          formData={editingServiceGroup}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          fields={[
            {
              name: 'name',
              label: 'Navn',
              type: 'text',
              placeholder: 'Skriv inn navn',
              required: true,
            },
          ]}
          actions={[
            {
              label: 'Avbryt',
              variant: 'outline',
              onClick: () => {
                setIsDialogOpen(false);
                setEditingServiceGroup(null);
              },
            },
            {
              label: 'Lagre',
              type: 'submit',
              variant: 'default',
              onClick: () => {},
            },
          ]}
        />
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Slett tjenestegruppe?"
        description="Er du sikker på at du vil slette denne tjenestegruppen? Denne handlingen kan ikke angres."
      />
    </div>
  );
}
