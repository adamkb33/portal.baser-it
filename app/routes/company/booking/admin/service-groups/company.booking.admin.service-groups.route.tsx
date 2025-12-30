import { useFetcher } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ServiceGroupDto } from '~/api/clients/types';
import { Button } from '~/components/ui/button';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import { PageHeader } from '../../../_components/page-header';
import type { Route } from './+types/company.booking.admin.service-groups.route';
import { ServiceGroupController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { API_ROUTES_MAP } from '~/lib/route-tree';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const response = await withAuth(request, async () => {
      return ServiceGroupController.getServiceGroups();
    });

    return {
      serviceGroups: response.data?.data?.content || [],
    };
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    return {
      serviceGroups: [],
      error: error?.message || 'Kunne ikke hente tjenestegrupper',
    };
  }
}

type FormData = {
  id?: number;
  name: string;
};

export default function BookingServiceGroups({ loaderData }: Route.ComponentProps) {
  const { serviceGroups } = loaderData;
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingServiceGroup, setEditingServiceGroup] = useState<FormData | null>(null);
  const [deletingServiceGroupId, setDeletingServiceGroupId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

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
    formData.append('id', String(deletingServiceGroupId));

    fetcher.submit(formData, {
      method: 'post',
      action: API_ROUTES_MAP['company.booking.admin.service-groups.delete'].url,
    });

    setIsDeleteDialogOpen(false);
    setDeletingServiceGroupId(null);
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
    if (editingServiceGroup.id) {
      formData.append('id', String(editingServiceGroup.id));
    }
    formData.append('name', editingServiceGroup.name);

    const action = editingServiceGroup.id
      ? API_ROUTES_MAP['company.booking.admin.service-groups.update'].url
      : API_ROUTES_MAP['company.booking.admin.service-groups.create'].url;

    fetcher.submit(formData, {
      method: 'post',
      action,
    });

    setIsDialogOpen(false);
    setEditingServiceGroup(null);
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Tjenestegrupper"
        description="Organiser og administrer tjenester i logiske grupper. Gjør det enkelt for kunder å finne riktige tjenester."
        actions={<Button onClick={handleAdd}>Ny tjenestegruppe</Button>}
      />

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
