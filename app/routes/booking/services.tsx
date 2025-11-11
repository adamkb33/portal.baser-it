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
import type { ServiceDto, ServiceGroupDto } from 'tmp/openapi/gen/booking';
import { createBookingClient } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/table/data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';

export type BookingServicesLoaderData = {
  serviceGroups: ServiceGroupDto[];
  services: ServiceDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) {
      return redirect('/');
    }
    const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const serviceGroupsResponse =
      await bookingClient.ServiceGroupControllerService.ServiceGroupControllerService.getServiceGroups();
    const bookingClient2 = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const servicesResponse = await bookingClient2.ServiceControllerService.ServiceControllerService.getServices();

    return data<BookingServicesLoaderData>({
      serviceGroups: serviceGroupsResponse.data,
      services: servicesResponse.data || [],
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
  const submit = useSubmit();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<FormData | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);

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

    submit(formData, { method: 'post' });
    toast.success('Tjenesten ble slettet');

    setIsDeleteDialogOpen(false);
    setDeletingServiceId(null);
  };

  const handleFieldChange = (name: keyof FormData, value: any) => {
    if (editingService) {
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

    submit(formData, { method: 'post' });

    setIsDialogOpen(false);
    setEditingService(null);

    toast.success(editingService.id ? 'Tjeneste oppdatert' : 'Tjeneste opprettet');
  };

  const getServiceGroupName = (serviceGroupId: number) => {
    return serviceGroups.find((sg) => sg.id === serviceGroupId)?.name || 'Ukjent';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-end items-center mb-6">
        <Button onClick={handleAdd}>Ny tjeneste</Button>
      </div>

      <DataTable<ServiceDto>
        data={services}
        getRowKey={(service) => service.id}
        columns={[
          {
            header: 'Navn',
            accessor: 'name',
            className: 'font-medium',
          },
          {
            header: 'Tjenestegruppe',
            accessor: (service) => getServiceGroupName(service.serviceGroupId),
          },
          {
            header: 'Pris',
            accessor: (service) => `${service.price} kr`,
          },
          {
            header: 'Varighet',
            accessor: (service) => `${service.duration} min`,
          },
        ]}
        actions={[
          {
            label: 'Rediger',
            onClick: (service) => handleEdit(service),
            variant: 'outline',
          },
          {
            label: 'Slett',
            onClick: (service) => handleDeleteClick(service.id),
            variant: 'destructive',
          },
        ]}
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
