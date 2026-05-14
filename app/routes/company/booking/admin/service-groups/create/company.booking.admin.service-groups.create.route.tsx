import { data, redirect } from 'react-router';
import type { Route } from './+types/company.booking.admin.service-groups.create.route';
import { CompanyUserServiceGroupController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ServiceGroupFormPage, type ServiceGroupFormValues } from '../_components/service-group-form-page';

const emptyValues: ServiceGroupFormValues = { name: '' };

export async function loader() {
  return data({ values: emptyValues });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const values: ServiceGroupFormValues = {
    name: String(formData.get('name') ?? '').trim(),
  };

  if (!values.name) {
    const error = 'Navn er påkrevd.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    await withAuth(request, async () => {
      await CompanyUserServiceGroupController.createServiceGroup({
        body: {
          name: values.name,
        },
      });
    });

    return redirect(ROUTES_MAP['company.booking.admin.service-groups'].href);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke opprette tjenestegruppe');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyBookingAdminServiceGroupsCreatePage({ loaderData, actionData }: Route.ComponentProps) {
  return <ServiceGroupFormPage mode="create" values={loaderData.values} actionData={actionData} />;
}
