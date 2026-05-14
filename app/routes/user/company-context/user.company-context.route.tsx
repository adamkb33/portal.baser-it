import { data, Form, redirect, useNavigation } from 'react-router';
import { Building2, ChevronRight, MapPin } from 'lucide-react';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { AuthController, type CompanySummaryDto } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import type { Route } from './+types/user.company-context.route';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithError } from '~/lib/flash-message.server';
import { Grid, PageTemplate, Panel, SelectionCard, Text } from '~/ui';

export async function loader({ request }: Route.LoaderArgs) {
  return withAuth(request, async () => {
    try {
      const response = await AuthController.getCompanyContexts();

      return data({
        companyContexts: response.data?.data,
      });
    } catch (error: any) {
      console.error('[company-context] Loader error:', error);
      return data({ companyContexts: [] });
    }
  });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const companyId = formData.get('companyId');
  const orgNumber = formData.get('orgNumber');

  if (!orgNumber || !companyId) {
    return redirectWithError(request, ROUTES_MAP['user.company-context'].href, 'Ikke valgt');
  }

  return withAuth(request, async () => {
    try {
      const response = await AuthController.companySignIn({
        body: {
          companyId: parseInt(companyId.toString()),
        },
      });

      const payload = response.data?.data;

      if (!payload) {
        return redirectWithError(
          request,
          ROUTES_MAP['user.company-context'].href,
          'En feil har skjedd ved innlogging til selskap',
        );
      }

      const accessCookie = await accessTokenCookie.serialize(payload.accessToken, {
        expires: new Date(payload.accessTokenExpiresAt * 1000),
      });
      const refreshCookie = await refreshTokenCookie.serialize(payload.refreshToken, {
        expires: new Date(payload.refreshTokenExpiresAt * 1000),
      });

      return redirect('/', {
        headers: [
          ['Set-Cookie', accessCookie],
          ['Set-Cookie', refreshCookie],
        ],
      });
    } catch (error: any) {
      console.error('[company-context] Action error:', error);
      return redirectWithError(
        request,
        ROUTES_MAP['user.company-context'].href,
        error?.response?.data?.message || 'Noe gikk galt. Prøv igjen.',
      );
    }
  });
}

export default function CompanyContextPage({ loaderData }: Route.ComponentProps) {
  const companies = loaderData?.companyContexts || [];
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <PageTemplate
      title="Velg selskap"
      description="Logg inn i riktig selskapskontekst for å fortsette med administrasjon, booking eller timelister i samme felles sideoppsett som resten av produktet."
      label="Selskapskontekst"
      hero={
        <Panel title="Tilgjengelige selskaper" description="Alle selskaper du kan bytte inn i fra denne brukerkontoen.">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
            <Text as="p" variant="body-sm" className="text-text-secondary">
              Antall tilgjengelige kontekster
            </Text>
            <Text as="p" variant="heading-sm">
              {companies.length}
            </Text>
          </div>
        </Panel>
      }
    >
      {companies.length === 0 ? (
        <Panel title="Ingen selskaper funnet" description="Du har ikke tilgang til noen selskapskontekster enda.">
          <div className="rounded-md border border-border bg-background px-4 py-5 text-center">
            <Text as="p" variant="body-sm" className="text-text-secondary">
              Kontakt administrator hvis du forventer å se et selskap her.
            </Text>
          </div>
        </Panel>
      ) : (
        <Panel title="Velg kontekst" description="Hvert valg logger deg inn i valgt selskap og bruker samme tematiske sideuttrykk som company-flatene.">
          <Grid columns={3} gap="md">
            {companies.map((company) => (
              <Form key={company.id} method="post" className="h-full">
                <input type="hidden" name="companyId" value={company.id} />
                <input type="hidden" name="orgNumber" value={company.orgNumber} />
                <SelectionCard
                  type="submit"
                  className="h-full"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  title={company.name ?? 'Ukjent selskap'}
                  description={company.orgNumber ?? 'Mangler organisasjonsnummer'}
                  leading={
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-text-secondary">
                      <Building2 className="h-5 w-5" />
                    </div>
                  }
                  trailing={<ChevronRight className="mt-0.5 h-4 w-4 text-text-secondary" />}
                  meta={
                    company.postalAddress ? (
                      <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                        <Text as="p" variant="body-sm" className="text-text-secondary">
                          {formatAddress(company.postalAddress)}
                        </Text>
                      </div>
                    ) : (
                      <div className="rounded-md border border-border bg-surface px-3 py-2">
                        <Text as="p" variant="body-sm" className="text-text-secondary">
                          Ingen postadresse registrert
                        </Text>
                      </div>
                    )
                  }
                />
              </Form>
            ))}
          </Grid>
        </Panel>
      )}
    </PageTemplate>
  );
}

function formatAddress(address?: CompanySummaryDto['postalAddress']) {
  if (!address) return '';
  const parts = [...(address.addressLines || []), address.postalCode, address.city].filter(Boolean);
  return parts.join(', ');
}
