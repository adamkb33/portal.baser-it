import { redirectWithError, redirectWithSuccess } from '~/routes/company/_lib/flash-message.server';
import type { Route } from './+types/company.admin.contacts.delete.api-route';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { UpdateContactDto } from '~/api/clients/types';
import { baseServiceApi } from '~/lib/utils';

export async function action({ request }: Route.ActionArgs) {
  try {
    const baseClient = await baseServiceApi(request);

    const formData = await request.formData();

    const id = Number(formData.get('id'));

    await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.deleteContact({
      id,
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.admin.contacts'].href, 'Kontakt slettet');
  } catch (error) {
    return redirectWithError(
      request,
      ROUTES_MAP['company.admin.contacts'].href,
      'Noe gikk galt ved sletting av kontakt',
    );
  }
}
