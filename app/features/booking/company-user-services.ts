import { data, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import type { ServiceDto, ServiceGroupDto } from 'tmp/openapi/gen/booking';
import { createBookingClient, type ImageUpload } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';

export type BookingServicesLoaderData = {
  serviceGroups: ServiceGroupDto[];
  services: ServiceDto[];
};

const extractList = <T>(payload: unknown): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray((payload as any).content)) return (payload as any).content as T[];
  if (Array.isArray((payload as any).items)) return (payload as any).items as T[];
  return [];
};

const extractImagesFromFormData = (fd: FormData): ImageUpload[] => {
  const byIndex: Record<
    string,
    {
      fileName?: string;
      label?: string;
      contentType?: string;
      data?: string;
    }
  > = {};

  for (const [key, value] of fd.entries()) {
    const match = key.match(/^images\[(\d+)]\[(fileName|label|contentType|data)]$/);
    if (!match) continue;

    const index = match[1];
    const field = match[2] as 'fileName' | 'label' | 'contentType' | 'data';

    if (!byIndex[index]) byIndex[index] = {};

    byIndex[index][field] = String(value);
  }

  return Object.keys(byIndex)
    .sort((a, b) => Number(a) - Number(b))
    .map((index) => {
      const img = byIndex[index];
      return {
        fileName: img.fileName ?? 'image',
        label: img.label ?? '',
        contentType: img.contentType ?? 'application/octet-stream',
        data: img.data ?? '',
      } satisfies ImageUpload;
    })
    .filter((img) => img.data); // only keep images that actually have data
};

export async function getServicesLoader({ request }: LoaderFunctionArgs) {
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

export async function servicesActions({ request }: ActionFunctionArgs) {
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

      const images = extractImagesFromFormData(formData); // ImageUpload[]

      // Enforce the same rule as the UI: if an image is sent, it must have a label
      const invalid = images.filter((img) => !img.label || img.label.trim().length === 0);
      if (invalid.length > 0) {
        return data({ success: false, message: 'Alle nye bilder må ha både fil og label.' }, { status: 400 });
      }

      await bookingClient.ServiceControllerService.ServiceControllerService.createService({
        requestBody: {
          name,
          serviceGroupId,
          price,
          duration,
          images,
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

      const newImages = extractImagesFromFormData(formData);

      const deleteImageIds = formData
        .getAll('deleteImageIds')
        .map((v) => Number(v))
        .filter((v) => !Number.isNaN(v));

      await bookingClient.ServiceControllerService.ServiceControllerService.updateService({
        id,
        requestBody: {
          id,
          name,
          serviceGroupId,
          price,
          duration,
          newImages, // <-- goes straight into UpdateServiceDto.newImages
          deleteImageIds,
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
