import { useFetcher, useNavigate, useSearchParams } from 'react-router';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import { PageHeader } from '../../../_components/page-header';
import type { Route } from './+types/company.booking.admin.service-groups.route';
import { CompanyUserServiceGroupController, type ServiceGroupDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const search = url.searchParams.get('search') || '';

    const response = await withAuth(request, async () => {
      return CompanyUserServiceGroupController.getServiceGroups({
        query: {
          page,
          size,
          ...(search && { search }),
        },
      });
    });

    const apiResponse = response.data;
    const pageData = apiResponse?.data;

    return {
      serviceGroups: pageData?.content || [],
      pagination: {
        page: pageData?.page ?? 0,
        size: pageData?.size ?? size,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 1,
      },
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjenestegrupper');
    return {
      serviceGroups: [],
      pagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      },
      error: message,
    };
  }
}

type FormData = {
  id?: number;
  name: string;
};

export default function BookingServiceGroups({ loaderData }: Route.ComponentProps) {
  const { serviceGroups, pagination } = loaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingServiceGroup, setEditingServiceGroup] = useState<FormData | null>(null);
  const [deletingServiceGroupId, setDeletingServiceGroupId] = useState<number | null>(null);
  const [filter, setFilter] = useState(searchParams.get('search') || '');

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

  const handleFilterChange = (value: string) => {
    setFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
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
    <div className="container mx-auto py-6">
      <PageHeader
        title="Tjenestegrupper"
        description="Organiser og administrer tjenester i logiske grupper. Gjør det enkelt for kunder å finne riktige tjenester."
        actions={<Button onClick={handleAdd}>Ny tjenestegruppe</Button>}
      />

      <ServerPaginatedTable<ServiceGroupDto>
        items={serviceGroups}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowKey={(serviceGroup, index) => serviceGroup.id ?? `group-${index}`}
        columns={[
          { header: 'ID' },
          { header: 'Navn', className: 'font-medium' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        headerSlot={
          <Input
            placeholder="Søk på navn..."
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="max-w-sm"
          />
        }
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
