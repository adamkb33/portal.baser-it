import { useFetcher, useNavigate, useSearchParams } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { fileToBase64 } from '~/lib/file.utils';
import { withAuth } from '~/api/utils/with-auth';
import { ServiceController, CompanyUserServiceGroupController, type ServiceGroupDto, type ServiceDto } from '~/api/generated/booking';
import { redirectWithInfo } from '~/routes/company/_lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { Route } from './+types/company.booking.admin.service-groups.services.route';
import { servicesActions } from './_features/services.feature';
import { ImagesField, type ImageField } from '~/routes/company/_components/images-field';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const search = url.searchParams.get('search') || '';

    const [serviceGroupsResponse, servicesResponse] = await withAuth(request, async () => {
      return Promise.all([
        CompanyUserServiceGroupController.getServiceGroups({
          query: {
            page: 0,
            size: 1000,
          },
        }),
        ServiceController.getServices({
          query: {
            page,
            size,
            ...(search && { search }),
          },
        }),
      ]);
    });

    const serviceGroups = serviceGroupsResponse.data?.data?.content || [];

    if (serviceGroups.length === 0) {
      return redirectWithInfo(
        request,
        ROUTES_MAP['company.booking.admin.service-groups'].href,
        'Du må opprette en tjenestegruppe før du kan legge til tjenester.',
      );
    }

    const apiResponse = servicesResponse.data;
    const pageData = apiResponse?.data;

    return {
      serviceGroups,
      services: pageData?.content || [],
      pagination: {
        page: pageData?.page ?? 0,
        size: pageData?.size ?? size,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 1,
      },
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjenester');
    return {
      serviceGroups: [],
      services: [],
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

export const action = servicesActions;

type ServiceFormData = {
  id?: number;
  name: string;
  serviceGroupId: number;
  price: number;
  duration: number;
  images: ImageField[];
};

export default function BookingAdminServices({ loaderData }: Route.ComponentProps) {
  const { serviceGroups, services, pagination } = loaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceFormData | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [filter, setFilter] = useState(searchParams.get('search') || '');

  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) return;

    if (fetcher.data.success) {
      toast.success(fetcher.data.message ?? 'Handling fullført');
      setIsDialogOpen(false);
      setEditingService(null);
      setIsDeleteDialogOpen(false);
      setDeletingServiceId(null);
    } else if (fetcher.data.message) {
      toast.error(fetcher.data.message);
    }
  }, [fetcher.state, fetcher.data]);

  const groupNameById = useMemo(
    () =>
      new Map(
        serviceGroups
          .filter((group): group is ServiceGroupDto & { id: number } => typeof group.id === 'number')
          .map((group) => [group.id, group.name] as const),
      ),
    [serviceGroups],
  );

  const handleAdd = () => {
    setEditingService({
      name: '',
      serviceGroupId: serviceGroups[0]?.id || 0,
      price: 0,
      duration: 30,
      images: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (service: ServiceDto) => {
    setEditingService({
      id: service.id,
      name: service.name,
      serviceGroupId: service.serviceGroupId,
      price: service.price,
      duration: service.duration,
      images:
        service.images?.map((img) => ({
          id: img.id,
          file: null,
          label: img.label ?? '',
          previewUrl: img.url,
        })) ?? [],
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingServiceId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingServiceId) return;

    const fd = new FormData();
    fd.append('intent', 'delete');
    fd.append('id', String(deletingServiceId));

    fetcher.submit(fd, { method: 'post' });
  };

  const handleFieldChange = (name: keyof ServiceFormData, value: any) => {
    if (!editingService) return;

    if (name === 'serviceGroupId' || name === 'price' || name === 'duration') {
      setEditingService({ ...editingService, [name]: Number(value) });
      return;
    }

    setEditingService({ ...editingService, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const fd = new FormData();
    fd.append('intent', editingService.id ? 'update' : 'create');
    if (editingService.id) {
      fd.append('id', String(editingService.id));
    }
    fd.append('name', editingService.name);
    fd.append('serviceGroupId', String(editingService.serviceGroupId));
    fd.append('price', String(editingService.price));
    fd.append('duration', String(editingService.duration));

    // Append delete image IDs (from images marked as pendingDeletion)
    const imagesToDelete = editingService.images.filter((img) => img.pendingDeletion && img.id).map((img) => img.id!);

    if (imagesToDelete.length > 0) {
      for (const imgId of imagesToDelete) {
        fd.append('deleteImageIds', String(imgId));
      }
    }

    // Only append new images (those with a file selected and not pending deletion)
    const imagesToUpload = editingService.images.filter((img) => img.file && !img.pendingDeletion);

    if (imagesToUpload.length > 0) {
      let uploadIndex = 0;
      for (const img of imagesToUpload) {
        const base64 = await fileToBase64(img.file!);

        fd.append(`images[${uploadIndex}][fileName]`, img.file!.name);
        fd.append(`images[${uploadIndex}][contentType]`, img.file!.type || 'application/octet-stream');
        fd.append(`images[${uploadIndex}][label]`, img.label ?? '');
        fd.append(`images[${uploadIndex}][data]`, base64);

        uploadIndex++;
      }
    }

    fetcher
      .submit(fd, { method: 'post' })
      .catch((error) => {
        toast.error('Noe gikk galt ved innsending av skjemaet.');
        console.error(error);
      })
      .finally(() => {
        setIsDialogOpen(false);
        setEditingService(null);
      });
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

  const getServiceGroupName = (serviceGroupId: number) => groupNameById.get(serviceGroupId) || 'Ukjent';

  const formatNok = (value?: number) => {
    const amount = Number(value ?? 0);
    return amount.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' });
  };

  const handleImagesChange = (images: ImageField[]) => {
    if (editingService) {
      setEditingService({ ...editingService, images });
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Tjenester</h1>
        <Button onClick={handleAdd}>Ny tjeneste</Button>
      </div>

      <ServerPaginatedTable<ServiceDto>
        items={services}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowKey={(service, index) => service.id ?? `${service.name}-${index}`}
        columns={[
          { header: 'Navn', className: 'font-medium' },
          { header: 'Tjenestegruppe' },
          { header: 'Pris' },
          { header: 'Varighet' },
          { header: 'Antall bilder' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        headerSlot={
          <Input
            placeholder="Søk på navn eller tjenestegruppe…"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="max-w-sm"
          />
        }
        renderRow={(service) => (
          <TableRow>
            <TableCell className="font-medium">{service.name}</TableCell>
            <TableCell>{getServiceGroupName(service.serviceGroupId)}</TableCell>
            <TableCell>{formatNok(service.price)}</TableCell>
            <TableCell>{service.duration} min</TableCell>
            <TableCell className="flex items-center">
              {service.images && service.images.length > 0 ? (
                <Badge variant="default" className="flex items-center justify-center">
                  {service.images?.length}
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center justify-center">
                  Ingen
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                  Rediger
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => handleDeleteClick(service.id!)}
                  disabled={fetcher.state !== 'idle' && deletingServiceId === service.id}
                >
                  Slett
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {editingService && (
        <FormDialog<ServiceFormData>
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title={editingService.id ? 'Rediger tjeneste' : 'Ny tjeneste'}
          formData={editingService}
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
            {
              name: 'serviceGroupId',
              label: 'Tjenestegruppe',
              type: 'select',
              required: true,
              options: serviceGroups.map((sg) => ({
                label: sg.name,
                value: sg.id,
              })),
            },
            {
              name: 'price',
              label: 'Pris (kr)',
              type: 'number',
              placeholder: '0',
              required: true,
            },
            {
              name: 'duration',
              label: 'Varighet (minutter)',
              type: 'number',
              placeholder: '30',
              required: true,
            },
            {
              name: 'images',
              label: 'Bilder',
              render: () => <ImagesField images={editingService.images} onChange={handleImagesChange} />,
            },
          ]}
          actions={[
            {
              label: 'Avbryt',
              variant: 'outline',
              onClick: () => {
                setIsDialogOpen(false);
                setEditingService(null);
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
        title="Slett tjeneste?"
        description="Er du sikker på at du vil slette denne tjenesten? Denne handlingen kan ikke angres."
      />
    </div>
  );
}
