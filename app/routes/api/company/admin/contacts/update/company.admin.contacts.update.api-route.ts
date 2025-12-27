import { redirectWithError, redirectWithSuccess } from '~/routes/company/_lib/flash-message.server';
import type { Route } from './+types/company.admin.contacts.update.api-route';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { UpdateContactDto } from '~/api/clients/types';
import { baseServiceApi } from '~/lib/utils';

export async function action({ request }: Route.ActionArgs) {
  try {
    const baseClient = await baseServiceApi(request);

    const formData = await request.formData();

    const id = Number(formData.get('id'));
    const payload: UpdateContactDto = {
      givenName: String(formData.get('givenName') ?? ''),
      familyName: String(formData.get('familyName') ?? ''),
      email: formData.get('email') ? String(formData.get('email')) : undefined,
      mobileNumber: formData.get('mobileNumber') ? String(formData.get('mobileNumber')) : undefined,
    };

    await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.updateContact({
      id,
      requestBody: payload,
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.admin.contacts'].href, 'Kontakt oppdatert');
  } catch (error) {
    return redirectWithError(
      request,
      ROUTES_MAP['company.admin.contacts'].href,
      'Noe gikk galt ved oppdatering av kontakt',
    );
  }
}
