import { data } from 'react-router';
import type { Route } from './+types/system-admin.companies.create.route';
import { Base } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { Button, CompanyPageTemplate, FormField, Notice, Panel, Text } from '~/ui';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const orgNumber = String(formData.get('orgNumber') ?? '').trim();

  if (!orgNumber) {
    const message = 'Organisasjonsnummer er påkrevd.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { orgNumber }, company: null }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    const response = await withAuth(request, async () => Base.createCompany({ body: { orgNumber } }));
    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Selskap opprettet.' });
    return data({ error: null, values: { orgNumber: '' }, company: response.data?.data ?? null }, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke opprette selskap.');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { orgNumber }, company: null }, { status: status ?? 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function SystemAdminCompaniesCreatePage({ actionData }: Route.ComponentProps) {
  const values = actionData?.values ?? { orgNumber: '' };

  return (
    <CompanyPageTemplate
      title="Opprett selskap"
      description="Opprett selskap via base-service/system-admin/companies."
      routeLinks={
        <a href={ROUTES_MAP['system-admin.companies'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til selskaper
        </a>
      }
    >
      {actionData?.error ? <Notice tone="emphasis" title="Kunne ikke opprette selskap" message={actionData.error} /> : null}
      <form method="post" className="space-y-3 rounded-md border border-border bg-surface p-4">
        <FormField label="Organisasjonsnummer" name="orgNumber" defaultValue={values.orgNumber} required />
        <div>
          <Button type="submit">Opprett selskap</Button>
        </div>
      </form>

      {actionData?.company ? (
        <Panel title="Opprettet selskap" description="Backend-respons etter opprettelse.">
          <Text as="p" variant="body-sm">ID: {actionData.company.id}</Text>
          <Text as="p" variant="body-sm">Org.nr: {actionData.company.orgNumber}</Text>
          <Text as="p" variant="body-sm">Navn: {actionData.company.name ?? '—'}</Text>
        </Panel>
      ) : null}
    </CompanyPageTemplate>
  );
}
