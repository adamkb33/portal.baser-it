import { data, Form } from 'react-router';
import { Building2, User } from 'lucide-react';
import type { Route } from './+types/company.admin.settings.route';
import { AdminCompanyController, CompanyUserController } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { redirectWithSuccess, setFlashMessage } from '~/lib/flash-message.server';
import { Button, CompanyMetricCard, CompanyPageTemplate, Input, Notice, Panel, Text } from '~/ui';

type SettingsActionValues = {
  displayName: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const [companySummaryResponse, selfResponse] = await withAuth(request, async () =>
      Promise.all([CompanyUserController.getCompanySummary(), CompanyUserController.getUser1()]),
    );

    return data({
      company: companySummaryResponse.data?.data ?? null,
      self: selfResponse.data?.data ?? null,
      error: null as string | null,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente innstillinger');
    return data({
      company: null,
      self: null,
      error: message,
    });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim();

  const values: SettingsActionValues = { displayName };

  if (intent !== 'update-company-name') {
    const error = 'Ugyldig handling.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  if (!displayName) {
    const error = 'Selskapsnavn kan ikke være tomt.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    await withAuth(request, async () =>
      AdminCompanyController.updateCompanyDisplayName({
        body: {
          displayName,
        },
      }),
    );

    return redirectWithSuccess(request, ROUTES_MAP['company.admin.settings'].href, 'Selskapsnavn oppdatert');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke oppdatere selskapsnavn');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanySettings({ loaderData, actionData }: Route.ComponentProps) {
  const company = loaderData.company;
  const self = loaderData.self;
  const currentDisplayName = actionData?.values?.displayName ?? company?.name ?? '';

  return (
    <CompanyPageTemplate
      title="Innstillinger"
      description="Administrer navn og nøkkelinformasjon for selskapet i samme kompakte mønster som resten av company-domenet."
      label="Selskapsadministrasjon"
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CompanyMetricCard
            label="Selskapsnavn"
            value={company?.name || 'Ikke satt'}
            icon={<Building2 className="h-5 w-5" />}
          />
          <CompanyMetricCard
            label="Organisasjonsnummer"
            value={company?.orgNumber || '—'}
            icon={<Building2 className="h-5 w-5" />}
          />
          <CompanyMetricCard
            label="Innlogget administrator"
            value={
              self ? [self.givenName, self.familyName].filter(Boolean).join(' ') || self.email : 'Ikke tilgjengelig'
            }
            icon={<User className="h-5 w-5" />}
          />
        </div>
      }
    >
      {loaderData.error ? (
        <Notice tone="emphasis" title="Kunne ikke laste innstillinger" message={loaderData.error} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Selskapsoversikt" description="Rask oversikt over de viktigste selskapsfeltene.">
            <div className="space-y-2 rounded-md border border-border bg-background p-4">
              <Text as="p" variant="body-sm">
                <span className="text-text-secondary">Selskapsnavn: </span>
                {company?.name || 'Ikke satt'}
              </Text>
              <Text as="p" variant="body-sm">
                <span className="text-text-secondary">Organisasjonsnummer: </span>
                {company?.orgNumber || '—'}
              </Text>
              <Text as="p" variant="body-sm">
                <span className="text-text-secondary">Brukernavn (admin): </span>
                {self ? [self.givenName, self.familyName].filter(Boolean).join(' ') || self.email : 'Ikke tilgjengelig'}
              </Text>
            </div>
          </Panel>

          <Panel title="Oppdater selskapsnavn" description="Endre visningsnavnet som brukes i selskapets grensesnitt.">
            <Form method="post" reloadDocument className="space-y-3">
              <input type="hidden" name="intent" value="update-company-name" />
              <div className="space-y-1.5">
                <label htmlFor="displayName" className="text-sm font-medium text-text-primary">
                  Selskapsnavn
                </label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={currentDisplayName}
                  placeholder="Skriv nytt selskapsnavn"
                />
              </div>
              <div className="flex items-center justify-end">
                <Button type="submit">Oppdater navn</Button>
              </div>
            </Form>
          </Panel>
        </div>
      )}
    </CompanyPageTemplate>
  );
}
