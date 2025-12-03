import { useFetcher, useLoaderData } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ServiceDto, ServiceGroupDto } from 'tmp/openapi/gen/booking';
import { Button } from '~/components/ui/button';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import type { FormFieldRenderProps } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { getServicesLoader, servicesActions } from '~/features/booking/company-user-services';
import { X } from 'lucide-react';
import { fileToBase64 } from '~/lib/file.utils';

export type BookingServicesLoaderData = {
  serviceGroups: ServiceGroupDto[];
  services: ServiceDto[];
};

export const loader = getServicesLoader;
export const action = servicesActions;

type ServiceImage = {
  id?: number; // backend id for existing images
  file: File | null;
  label: string;
  previewUrl?: string;
};

type ServiceFormData = {
  id?: number;
  name: string;
  serviceGroupId: number;
  price: number;
  duration: number;
  images: ServiceImage[];
  deleteImageIds: number[];
};

export default function BookingServices() {
  const { serviceGroups, services } = useLoaderData<BookingServicesLoaderData>();
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceFormData | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

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

  const filteredItems = useMemo(() => {
    if (!filter) return services;
    const query = filter.toLowerCase();

    return services.filter((service) => {
      const name = service.name?.toLowerCase() ?? '';
      const groupName = groupNameById.get(service.serviceGroupId)?.toLowerCase() ?? '';
      const price = String(service.price ?? '');
      const duration = String(service.duration ?? '');
      return name.includes(query) || groupName.includes(query) || price.includes(query) || duration.includes(query);
    });
  }, [services, filter, groupNameById]);

  const handleAdd = () => {
    setEditingService({
      name: '',
      serviceGroupId: serviceGroups[0]?.id || 0,
      price: 0,
      duration: 30,
      images: [],
      deleteImageIds: [],
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
      deleteImageIds: [],
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

    if (editingService.deleteImageIds && editingService.deleteImageIds.length > 0) {
      for (const imgId of editingService.deleteImageIds) {
        fd.append('deleteImageIds', String(imgId));
      }
    }

    if (editingService.images && editingService.images.length > 0) {
      for (let index = 0; index < editingService.images.length; index++) {
        const img = editingService.images[index];
        if (!img.file) continue;

        const base64 = await fileToBase64(img.file);

        fd.append(`images[${index}][fileName]`, img.file.name);
        fd.append(`images[${index}][contentType]`, img.file.type || 'application/octet-stream');
        fd.append(`images[${index}][label]`, img.label ?? '');
        fd.append(`images[${index}][data]`, base64);
      }
    }

    fetcher.submit(fd, { method: 'post' });
  };

  const getServiceGroupName = (serviceGroupId: number) => groupNameById.get(serviceGroupId) || 'Ukjent';

  const formatNok = (value?: number) => {
    const amount = Number(value ?? 0);
    return amount.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' });
  };

  const renderImagesField = ({ value, onChange }: FormFieldRenderProps<ServiceFormData>) => {
    const images = (value as ServiceImage[] | undefined) ?? [];

    const updateImageAt = (index: number, patch: Partial<ServiceImage>) => {
      const next = images.map((img, i) => (i === index ? { ...img, ...patch } : img));
      onChange(next);
    };

    const addImage = () => {
      onChange([
        ...images,
        {
          id: undefined,
          file: null,
          label: '',
          previewUrl: undefined,
        },
      ]);
    };

    const removeImage = (index: number) => {
      const imageToRemove = images[index];
      const next = images.filter((_, i) => i !== index);
      onChange(next);

      // Existing image (has id) => mark for delete so backend actually removes it
      if (editingService && imageToRemove?.id) {
        setEditingService({
          ...editingService,
          deleteImageIds: [...(editingService.deleteImageIds ?? []), imageToRemove.id],
        });
      }
    };

    const handleFileChange = (index: number, file: File | null) => {
      if (!file) {
        // clear new file + preview
        updateImageAt(index, { file: null, previewUrl: undefined });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      updateImageAt(index, { file, previewUrl });
    };

    return (
      <div className="space-y-4">
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img, index) => (
              <div
                key={img.id ?? index}
                className="group relative overflow-hidden rounded-md border border-slate-200 bg-slate-50"
              >
                {/* X = remove */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">Fjern bilde</span>
                </button>

                {/* Preview */}
                {img.previewUrl ? (
                  <img
                    src={img.previewUrl}
                    alt={img.label || 'Forhåndsvisning av bilde'}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center text-xs text-slate-400">
                    Ingen bilde valgt
                  </div>
                )}

                {/* File + label */}
                <div className="space-y-2 border-t border-slate-200 bg-white p-2.5">
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-8 cursor-pointer text-xs"
                    onChange={(e) => handleFileChange(index, e.target.files?.[0] ?? null)}
                  />
                  <Input
                    type="text"
                    placeholder="Bildetekst / label"
                    value={img.label}
                    onChange={(e) => updateImageAt(index, { label: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" onClick={addImage} className="h-9 border-dashed text-xs font-medium">
          + Legg til bilde
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Tjenester</h1>
        <Button onClick={handleAdd}>Ny tjeneste</Button>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrer på navn, gruppe, pris eller varighet…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <PaginatedTable<ServiceDto>
        items={filteredItems}
        getRowKey={(service, index) => service.id ?? `${service.name}-${index}`}
        columns={[
          { header: 'Navn', className: 'font-medium' },
          { header: 'Tjenestegruppe' },
          { header: 'Pris' },
          { header: 'Varighet' },
          { header: 'Antall bilder' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
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
              render: renderImagesField,
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
