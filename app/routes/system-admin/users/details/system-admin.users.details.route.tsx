import { data } from 'react-router';
import type { Route } from './+types/system-admin.users.details.route';
import { Base } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { Button, CompanyPageTemplate, FormField, Notice, Panel, Text } from '~/ui';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const userId = Number(formData.get('userId'));

  if (!Number.isFinite(userId) || userId <= 0) {
    const message = 'Ugyldig bruker-ID.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { userId: '' }, user: null }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    const response = await withAuth(request, async () => Base.getUser({ path: { userId } }));
    return data({ error: null, values: { userId: String(userId) }, user: response.data?.data ?? null });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente bruker.');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { userId: String(userId) }, user: null }, { status: status ?? 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function SystemAdminUsersDetailsPage({ actionData }: Route.ComponentProps) {
  const values = actionData?.values ?? { userId: '' };

  return (
    <CompanyPageTemplate
      title="Hent bruker"
      description="Hent brukerdetaljer via base-service/system-admin/users/{userId}."
      routeLinks={
        <a href={ROUTES_MAP['system-admin.users'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til brukere
        </a>
      }
    >
      {actionData?.error ? <Notice tone="emphasis" title="Kunne ikke hente bruker" message={actionData.error} /> : null}
      <form method="post" className="space-y-3 rounded-md border border-border bg-surface p-4">
        <FormField label="Bruker-ID" name="userId" defaultValue={values.userId} required type="number" />
        <div>
          <Button type="submit">Hent bruker</Button>
        </div>
      </form>

      {actionData?.user ? (
        <Panel title="Resultat" description="Autentisert brukerpayload fra backend.">
          <Text as="p" variant="body-sm">ID: {actionData.user.id}</Text>
          <Text as="p" variant="body-sm">E-post: {actionData.user.email ?? '—'}</Text>
          <Text as="p" variant="body-sm">Company ID: {actionData.user.companyId ?? '—'}</Text>
        </Panel>
      ) : null}
    </CompanyPageTemplate>
  );
}
