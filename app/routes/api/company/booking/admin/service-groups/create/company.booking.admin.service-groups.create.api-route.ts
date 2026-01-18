import { CompanyUserServiceGroupController } from '~/api/generated/booking';
import { redirectWithSuccess, redirectWithError } from '~/routes/company/_lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { Route } from './+types/company.booking.admin.service-groups.create.api-route';
import { withAuth } from '~/api/utils/with-auth';

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;

    await withAuth(request, async () => {
      return CompanyUserServiceGroupController.createServiceGroup({
        body: {
          name,
        },
      });
    });

    return redirectWithSuccess(
      request,
      ROUTES_MAP['company.booking.admin.service-groups'].href,
      'Tjenestegruppe opprettet',
    );
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return redirectWithError(
      request,
      ROUTES_MAP['company.booking.admin.service-groups'].href,
      error?.message || 'Kunne ikke opprette tjenestegruppe',
    );
  }
}
