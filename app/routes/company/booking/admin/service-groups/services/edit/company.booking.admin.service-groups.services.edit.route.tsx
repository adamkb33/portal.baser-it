import { data, redirect } from 'react-router';
import type { Route } from './+types/company.booking.admin.service-groups.services.edit.route';
import { CompanyUserServiceGroupController, ServiceController, type ServiceDto } from '~/api/generated/booking';
import type { Delete, Upload } from '~/api/generated/booking/types.gen';
import { withAuth } from '~/api/utils/with-auth';
import { redirectWithInfo, setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import { ServiceFormPage, type ServiceFormValues } from '../_components/service-form-page';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));

  if (!Number.isFinite(id) || id <= 0) {
    return redirectWithInfo(
      request,
      ROUTES_MAP['company.booking.admin.service-groups.services'].href,
      'Velg en tjeneste som skal redigeres.',
    );
  }

  try {
    const [serviceGroupsResponse, servicesResponse] = await withAuth(request, async () =>
      Promise.all([
        CompanyUserServiceGroupController.getServiceGroups({
          query: {
            page: 0,
            size: 1000,
          },
        }),
        ServiceController.getServices({
          query: {
            page: 0,
            size: 1000,
          },
        }),
      ]),
    );

    const serviceGroups = serviceGroupsResponse.data?.data?.content ?? [];
    const service = (servicesResponse.data?.data?.content ?? []).find((item: ServiceDto) => item.id === id) ?? null;

    if (!service) {
      return redirectWithInfo(
        request,
        ROUTES_MAP['company.booking.admin.service-groups.services'].href,
        'Fant ikke tjenesten du prøvde å redigere.',
      );
    }

    return data({
      serviceGroups: serviceGroups.map((serviceGroup) => ({ id: serviceGroup.id!, name: serviceGroup.name })),
      values: {
        id: service.id,
        name: service.name,
        serviceGroupId: service.serviceGroupId,
        price: service.price,
        duration: service.duration,
        images:
          service.images?.map((image) => ({
            id: image.id,
            file: null,
            label: image.label ?? '',
            previewUrl: image.url,
          })) ?? [],
      } satisfies ServiceFormValues,
      error: null as string | null,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjeneste');
    return data({
      serviceGroups: [],
      values: {
        id,
        name: '',
        serviceGroupId: 0,
        price: 0,
        duration: 30,
        images: [],
      } satisfies ServiceFormValues,
      error: message,
    });
  }
}

function extractImageActionsFromFormData(formData: FormData): Array<Delete | Upload> {
  const imageActions: Array<Delete | Upload> = [];
  const deleteImageIds = formData
    .getAll('deleteImageIds')
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  for (const imageId of deleteImageIds) {
    imageActions.push({
      type: 'Delete',
      imageId,
    });
  }

  let index = 0;
  while (formData.has(`images[${index}][fileName]`)) {
    const fileName = String(formData.get(`images[${index}][fileName]`) ?? '');
    const contentType = String(formData.get(`images[${index}][contentType]`) ?? '');
    const dataValue = String(formData.get(`images[${index}][data]`) ?? '');
    const label = String(formData.get(`images[${index}][label]`) ?? '');

    if (fileName && contentType && dataValue) {
      imageActions.push({
        type: 'Upload',
        data: {
          fileName,
          contentType,
          data: dataValue,
          label,
        },
      });
    }

    index += 1;
  }

  return imageActions;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const values = {
    id,
    name: String(formData.get('name') ?? '').trim(),
    serviceGroupId: Number(formData.get('serviceGroupId')),
    price: Number(formData.get('price')),
    duration: Number(formData.get('duration')),
  };

  if (
    !Number.isFinite(id) ||
    id <= 0 ||
    !values.name ||
    !Number.isFinite(values.serviceGroupId) ||
    !Number.isFinite(values.price) ||
    !Number.isFinite(values.duration)
  ) {
    const error = 'Fyll ut alle feltene før du lagrer.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    await withAuth(request, async () => {
      await ServiceController.updateService({
        path: { id },
        body: {
          ...values,
          imageActions: extractImageActionsFromFormData(formData),
        },
      });
    });

    return redirect(ROUTES_MAP['company.booking.admin.service-groups.services'].href);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke oppdatere tjeneste');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyBookingAdminServicesEditPage({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <ServiceFormPage
      mode="edit"
      values={loaderData.values}
      serviceGroups={loaderData.serviceGroups}
      actionData={actionData ?? (loaderData.error ? { error: loaderData.error } : null)}
    />
  );
}
