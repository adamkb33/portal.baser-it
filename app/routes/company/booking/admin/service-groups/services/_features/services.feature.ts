import { type ActionFunctionArgs } from 'react-router';
import { ServiceController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { redirectWithSuccess, redirectWithError } from '~/routes/company/_lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';

export async function servicesActions({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  try {
    if (intent === 'create') {
      const name = formData.get('name') as string;
      const serviceGroupId = Number(formData.get('serviceGroupId'));
      const price = Number(formData.get('price'));
      const duration = Number(formData.get('duration'));

      const imageActions = extractImageActionsFromFormData(formData);

      await withAuth(request, async () => {
        await ServiceController.createService({
          body: {
            name,
            serviceGroupId,
            price,
            duration,
            imageActions,
          },
        });
      });

      return redirectWithSuccess(
        request,
        ROUTES_MAP['company.booking.admin.service-groups.services'].href,
        'Tjeneste opprettet',
      );
    }

    if (intent === 'update') {
      const id = Number(formData.get('id'));
      const name = formData.get('name') as string;
      const serviceGroupId = Number(formData.get('serviceGroupId'));
      const price = Number(formData.get('price'));
      const duration = Number(formData.get('duration'));

      const imageActions = extractImageActionsFromFormData(formData);

      await withAuth(request, async () => {
        await ServiceController.updateService({
          path: { id },
          body: {
            id,
            name,
            serviceGroupId,
            price,
            duration,
            imageActions,
          },
        });
      });

      return redirectWithSuccess(
        request,
        ROUTES_MAP['company.booking.admin.service-groups.services'].href,
        'Tjeneste oppdatert',
      );
    }

    if (intent === 'delete') {
      const id = Number(formData.get('id'));

      await withAuth(request, async () => {
        await ServiceController.deleteService({ path: { id } });
      });

      return redirectWithSuccess(
        request,
        ROUTES_MAP['company.booking.admin.service-groups.services'].href,
        'Tjeneste slettet',
      );
    }

    return redirectWithError(
      request,
      ROUTES_MAP['company.booking.admin.service-groups.services'].href,
      'Ugyldig handling',
    );
  } catch (error: any) {
    console.error('Service action error:', JSON.stringify(error, null, 2));

    return redirectWithError(
      request,
      ROUTES_MAP['company.booking.admin.service-groups.services'].href,
      error?.body?.message || error?.message || 'Kunne ikke utføre handling',
    );
  }
}

function extractImageActionsFromFormData(formData: FormData): any[] {
  const imageActions: any[] = [];

  const deleteImageIds = formData
    .getAll('deleteImageIds')
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v));

  deleteImageIds.forEach((imageId) => {
    imageActions.push({
      type: 'DELETE',
      imageId,
    });
  });

  let index = 0;
  while (formData.has(`images[${index}][fileName]`)) {
    const fileName = formData.get(`images[${index}][fileName]`) as string;
    const contentType = formData.get(`images[${index}][contentType]`) as string;
    const data = formData.get(`images[${index}][data]`) as string;
    const label = formData.get(`images[${index}][label]`) as string;

    if (fileName && contentType && data) {
      imageActions.push({
        type: 'UPLOAD',
        data: {
          fileName,
          contentType,
          data,
          label: label || undefined,
        },
      });
    }

    index++;
  }

  return imageActions;
}
