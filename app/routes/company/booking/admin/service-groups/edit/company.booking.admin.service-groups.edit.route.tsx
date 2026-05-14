import { data, redirect } from 'react-router';
import type { Route } from './+types/company.booking.admin.service-groups.edit.route';
import { CompanyUserServiceGroupController, type ServiceGroupDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithInfo, setFlashMessage } from '~/lib/flash-message.server';
import { ServiceGroupFormPage, type ServiceGroupFormValues } from '../_components/service-group-form-page';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));

  if (!Number.isFinite(id) || id <= 0) {
    return redirectWithInfo(
      request,
      ROUTES_MAP['company.booking.admin.service-groups'].href,
      'Velg en tjenestegruppe som skal redigeres.',
    );
  }

  try {
    const response = await withAuth(request, async () =>
      CompanyUserServiceGroupController.getServiceGroups({
        query: {
          page: 0,
          size: 1000,
        },
      }),
    );

    const serviceGroup = (response.data?.data?.content ?? []).find((item: ServiceGroupDto) => item.id === id) ?? null;

    if (!serviceGroup) {
      return redirectWithInfo(
        request,
        ROUTES_MAP['company.booking.admin.service-groups'].href,
        'Fant ikke tjenestegruppen du prøvde å redigere.',
      );
    }

    return data({
      values: {
        id: serviceGroup.id,
        name: serviceGroup.name,
      } satisfies ServiceGroupFormValues,
      error: null as string | null,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjenestegruppe');
    return data({
      values: {
        id,
        name: '',
      } satisfies ServiceGroupFormValues,
      error: message,
    });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const values: ServiceGroupFormValues = {
    id,
    name: String(formData.get('name') ?? '').trim(),
  };

  if (!Number.isFinite(id) || id <= 0 || !values.name) {
    const error = 'Navn er påkrevd.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    await withAuth(request, async () => {
      await CompanyUserServiceGroupController.updateServiceGroup({
        path: { id },
        body: {
          id,
          name: values.name,
        },
      });
    });

    return redirect(ROUTES_MAP['company.booking.admin.service-groups'].href);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke oppdatere tjenestegruppe');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyBookingAdminServiceGroupsEditPage({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <ServiceGroupFormPage
      mode="edit"
      values={actionData?.values ?? loaderData.values}
      actionData={actionData ?? (loaderData.error ? { error: loaderData.error, values: loaderData.values } : null)}
    />
  );
}
