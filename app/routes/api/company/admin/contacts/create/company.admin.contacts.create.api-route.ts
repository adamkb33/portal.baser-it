import { redirectWithError, redirectWithSuccess } from '~/routes/company/_lib/flash-message.server';
import type { Route } from './+types/company.admin.contacts.create.api-route';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { CreateContactDto } from '~/api/clients/types';
import { baseServiceApi } from '~/lib/utils';

export async function action({ request }: Route.ActionArgs) {
  try {
    const baseClient = await baseServiceApi(request);

    const formData = await request.formData();

    const payload: CreateContactDto = {
      givenName: String(formData.get('givenName') ?? ''),
      familyName: String(formData.get('familyName') ?? ''),
      email: formData.get('email') ? String(formData.get('email')) : undefined,
      mobileNumber: formData.get('mobileNumber') ? String(formData.get('mobileNumber')) : undefined,
    };

    await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.createContact({
      requestBody: payload,
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.admin.contacts'].href, 'Kontakt opprettet');
  } catch (error) {
    return redirectWithError(
      request,
      ROUTES_MAP['company.admin.contacts'].href,
      'Noe gikk galt ved opprettelse av kontakt',
    );
  }
}
