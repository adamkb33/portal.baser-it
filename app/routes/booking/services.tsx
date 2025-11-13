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
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';

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

      await bookingClient.ServiceControllerService.ServiceControllerService.createService({
        requestBody: {
          name,
          serviceGroupId,
          price,
          duration,
        },
      });
      return data({ success: true, message: 'Tjeneste opprettet' });
    }

    if (intent === 'update') {
      const id = Number(formData.get('id'));
      const name = formData.get('name') as string;
      const serviceGroupId = Number(formData.get('serviceGroupId'));
      const price = Number(formData.get('price'));
      const duration = Number(formData.get('duration'));

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

type FormData = {
  id?: number;
  name: string;
  serviceGroupId: number;
  price: number;
  duration: number;
};

export default function BookingServices() {
  const { serviceGroups, services } = useLoaderData<BookingServicesLoaderData>();
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<FormData | null>(null);
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
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingServiceId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingServiceId) return;

    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', String(deletingServiceId));

    fetcher.submit(formData, { method: 'post' });
  };

  const handleFieldChange = (name: keyof FormData, value: any) => {
    if (editingService) {
      if (name === 'serviceGroupId' || name === 'price' || name === 'duration') {
        setEditingService({ ...editingService, [name]: Number(value) });
        return;
      }

      setEditingService({ ...editingService, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const formData = new FormData();
    formData.append('intent', editingService.id ? 'update' : 'create');
    if (editingService.id) {
      formData.append('id', String(editingService.id));
    }
    formData.append('name', editingService.name);
    formData.append('serviceGroupId', String(editingService.serviceGroupId));
    formData.append('price', String(editingService.price));
    formData.append('duration', String(editingService.duration));

    fetcher.submit(formData, { method: 'post' });
  };

  const getServiceGroupName = (serviceGroupId: number) => {
    return groupNameById.get(serviceGroupId) || 'Ukjent';
  };

  const formatNok = (value?: number) => {
    const amount = Number(value ?? 0);
    return amount.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
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
        <FormDialog<FormData>
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
