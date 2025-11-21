import {
  data,
  redirect,
  useFetcher,
  useLoaderData,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ServiceDto, ServiceGroupDto } from 'tmp/openapi/gen/booking';
import { createBookingClient } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';
import { Button } from '~/components/ui/button';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import type { FormFieldRenderProps } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import axios from 'axios';

export type BookingServicesLoaderData = {
  serviceGroups: ServiceGroupDto[];
  services: ServiceDto[];
};

const extractList = <T,>(payload: unknown): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray((payload as any).content)) return (payload as any).content as T[];
  if (Array.isArray((payload as any).items)) return (payload as any).items as T[];
  return [];
};

type ExtractedImage = {
  file: Blob;
  label: string;
};

const uploadServiceImages = async (args: { serviceId: number; images: ExtractedImage[]; accessToken: string }) => {
  const { serviceId, images, accessToken } = args;
  if (images.length === 0) return;

  const formData = new FormData();

  images.forEach((img) => {
    formData.append('files', img.file);
    formData.append('labels', img.label ?? '');
  });

  // Build headers. In Node, axios may need getHeaders() if available (form-data lib).
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  // If FormData has getHeaders (Node form-data), merge them
  const anyFormData = formData as any;
  if (typeof anyFormData.getHeaders === 'function') {
    Object.assign(headers, anyFormData.getHeaders());
  }

  await axios.post(`${ENV.BOOKING_BASE_URL}/company-user/service-images/${serviceId}/images/bulk`, formData, {
    headers,
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) {
      return redirect('/');
    }
    const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const serviceGroupsResponse =
      await bookingClient.ServiceGroupControllerService.ServiceGroupControllerService.getServiceGroups({});
    const bookingClient2 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const servicesResponse = await bookingClient2.ServiceControllerService.ServiceControllerService.getServices({});

    return data<BookingServicesLoaderData>({
      serviceGroups: extractList<ServiceGroupDto>(serviceGroupsResponse?.data),
      services: extractList<ServiceDto>(servicesResponse?.data),
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

// 🔹 Helper: extract images + labels from FormData
const extractImagesFromFormData = (fd: FormData) => {
  const byIndex: Record<
    string,
    {
      file?: File;
      label?: string;
    }
  > = {};

  for (const [key, value] of fd.entries()) {
    const fileMatch = key.match(/^images\[(\d+)]\[file]$/);
    const labelMatch = key.match(/^images\[(\d+)]\[label]$/);

    if (fileMatch) {
      const index = fileMatch[1];
      if (!byIndex[index]) byIndex[index] = {};

      byIndex[index].file = value as File;
    }

    if (labelMatch) {
      const index = labelMatch[1];
      if (!byIndex[index]) byIndex[index] = {};
      byIndex[index].label = String(value);
    }
  }

  const images = Object.keys(byIndex)
    .sort((a, b) => Number(a) - Number(b))
    .map((index) => ({
      file: byIndex[index].file!,
      label: byIndex[index].label ?? '',
    }))
    .filter((img) => img.file);

  return images;
};

export async function action({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) {
    return redirect('/');
  }

  const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  try {
    if (intent === 'create') {
      const name = formData.get('name') as string;
      const serviceGroupId = Number(formData.get('serviceGroupId'));
      const price = Number(formData.get('price'));
      const duration = Number(formData.get('duration'));

      const images = extractImagesFromFormData(formData);

      const serviceResponse = await bookingClient.ServiceControllerService.ServiceControllerService.createService({
        requestBody: {
          name,
          serviceGroupId,
          price,
          duration,
        },
      });

      const createdService = serviceResponse.data as { id?: number } | null | undefined;
      const serviceId = createdService?.id;

      if (!serviceId) {
        return data({ success: false, message: 'En feil oppstod' }, { status: 400 });
      }

      // ⬇️ Axios multipart upload
      await uploadServiceImages({
        serviceId,
        images,
        accessToken,
      });

      return data({ success: true, message: 'Tjeneste opprettet' });
    }

    if (intent === 'update') {
      const id = Number(formData.get('id'));
      const name = formData.get('name') as string;
      const serviceGroupId = Number(formData.get('serviceGroupId'));
      const price = Number(formData.get('price'));
      const duration = Number(formData.get('duration'));

      const images = extractImagesFromFormData(formData);

      await bookingClient.ServiceControllerService.ServiceControllerService.updateService({
        id,
        requestBody: {
          id,
          name,
          serviceGroupId,
          price,
          duration,
        },
      });

      // ⬇️ Axios multipart upload for new images
      await uploadServiceImages({
        serviceId: id,
        images,
        accessToken,
      });

      return data({ success: true, message: 'Tjeneste oppdatert' });
    }

    if (intent === 'delete') {
      const id = Number(formData.get('id'));
      await bookingClient.ServiceControllerService.ServiceControllerService.deleteService({ id });
      return data({ success: true, message: 'Tjeneste slettet' });
    }

    return data({ success: false, message: 'Ugyldig handling' });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return data({ success: false, message: error.body?.message || 'En feil oppstod' }, { status: 400 });
  }
}

// Avoid name clash with global FormData
type ServiceImage = {
  file: File | null;
  label: string;
};

type ServiceFormData = {
  id?: number;
  name: string;
  serviceGroupId: number;
  price: number;
  duration: number;
  images: ServiceImage[];
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
    if (fetcher.state !== 'idle' || !fetcher.data) {
      return;
    }

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

  const groupNameById = useMemo(() => {
    return new Map(
      serviceGroups
        .filter((group): group is ServiceGroupDto & { id: number } => typeof group.id === 'number')
        .map((group) => [group.id, group.name] as const),
    );
  }, [serviceGroups]);

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
      images: [], // you'd load existing images here if API provides them
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

  const handleSubmit = (e: React.FormEvent) => {
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

    // Append images with labels
    if (editingService.images && editingService.images.length > 0) {
      editingService.images.forEach((img, index) => {
        if (img.file) {
          fd.append(`images[${index}][file]`, img.file);
        }
        fd.append(`images[${index}][label]`, img.label ?? '');
      });
    }

    fetcher.submit(fd, { method: 'post' });
  };

  const getServiceGroupName = (serviceGroupId: number) => {
    return groupNameById.get(serviceGroupId) || 'Ukjent';
  };

  const formatNok = (value?: number) => {
    const amount = Number(value ?? 0);
    return amount.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' });
  };

  // Custom renderer for images field
  const renderImagesField = ({ value, onChange }: FormFieldRenderProps<ServiceFormData>) => {
    const images = (value as ServiceImage[] | undefined) ?? [];

    const updateImageAt = (index: number, patch: Partial<ServiceImage>) => {
      const next = images.map((img, i) => (i === index ? { ...img, ...patch } : img));
      onChange(next);
    };

    const addImage = () => {
      onChange([...images, { file: null, label: '' }]);
    };

    const removeImage = (index: number) => {
      onChange(images.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-3">
        {images.map((img, index) => (
          <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => updateImageAt(index, { file: e.target.files?.[0] ?? null })}
            />
            <Input
              type="text"
              placeholder="Skriv bildetekst / label"
              value={img.label}
              onChange={(e) => updateImageAt(index, { label: e.target.value })}
            />
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
                Fjern
              </Button>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addImage}>
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
          { header: 'Handlinger', className: 'text-right' },
        ]}
        renderRow={(service) => (
          <TableRow>
            <TableCell className="font-medium">{service.name}</TableCell>
            <TableCell>{getServiceGroupName(service.serviceGroupId)}</TableCell>
            <TableCell>{formatNok(service.price)}</TableCell>
            <TableCell>{service.duration} min</TableCell>
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
              // custom renderer from Option A
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
