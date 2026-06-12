import { data, Link, redirect } from 'react-router';
import { Building2, FileText, Mail, MapPin } from 'lucide-react';
import type { BrregEnhetResponse } from '~/api/brreg/types';
import { AdminCompanyController, CompanyUserController, type AddressDto, type RecentContact, type RecentInvite } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import type { Route } from './+types/company.route';
import { Button, Card, CardContent, CardHead, CardGrid, CompanyEmptyState, CompanyPageTemplate, GridCol, KpiCard, Panel, Text } from '~/ui';

export type CompanyIndexLoaderResponse = {
  brregResponse?: BrregEnhetResponse;
};

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuthPayloadFromRequest(request);

  if (!auth || !auth.companyId) {
    return redirect(ROUTES_MAP['user.company-context'].href);
  }

  try {
    const companSummaryResponse = await withAuth(request, async () => CompanyUserController.getCompanySummary());
    const dashboardMetricsResponse = await withAuth(request, async () => AdminCompanyController.getDashboardMetrics()).catch(() => null);

    return data({
      companySummary: companSummaryResponse.data?.data,
      dashboardMetrics: dashboardMetricsResponse?.data?.data ?? null,
    });
  } catch (error) {
    const { status, message } = resolveErrorPayload(error, 'Kunne ikke hente selskapsinformasjon.');
    if (status === 401 || status === 403) {
      return redirectWithError(
        request,
        ROUTES_MAP['user.company-context'].href,
        'Du har ikke tilgang til valgt selskapskontekst. Velg selskap på nytt.',
      );
    }

    return redirectWithError(request, ROUTES_MAP['user.company-context'].href, message);
  }
}

export default function CompanyIndex({ loaderData }: Route.ComponentProps) {
  const { companySummary, dashboardMetrics } = loaderData;

  if (!companySummary) {
    return (
      <CompanyPageTemplate title="Selskap" description="Oversikt over grunnleggende selskapsinformasjon.">
        <CompanyEmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="Ingen firmainformasjon tilgjengelig"
          description="Vi fant ingen selskapsdata for den aktive konteksten."
        />
      </CompanyPageTemplate>
    );
  }

  const businessAddressLines = formatAddressLines(companySummary.businessAddress);
  const postalAddressLines = formatAddressLines(companySummary.postalAddress);
  const dashboardDate = formatDashboardDate(new Date());
  const addressCount = [companySummary.businessAddress, companySummary.postalAddress].filter(Boolean).length;
  const registeredFields = [
    companySummary.orgNumber,
    companySummary.name,
    companySummary.organizationType?.description,
    companySummary.businessAddress,
    companySummary.postalAddress,
  ].filter(Boolean).length;

  return (
    <CompanyPageTemplate
      title={`Velkommen tilbake, ${companySummary.name || 'selskapet'}`}
      description="Her er den aktive selskapskonteksten og de registrerte detaljene vi har tilgjengelig akkurat nå."
      eyebrow={dashboardDate}
      actions={
        <Button asChild variant="outline">
          <Link to={ROUTES_MAP['company.admin.settings'].href}>Selskapsinnstillinger</Link>
        </Button>
      }
      hero={
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Organisasjonsnummer"
            value={companySummary.orgNumber || '—'}
            tone="primary"
            icon={<Building2 className="h-5 w-5" />}
            compare="Primær selskaps-ID"
          />
          <KpiCard
            label="Organisasjonstype"
            value={companySummary.organizationType?.description || 'Ikke registrert'}
            tone="info"
            icon={<MapPin className="h-5 w-5" />}
            compare={companySummary.organizationType?.code ? `Kode ${companySummary.organizationType.code}` : 'Mangler kode'}
          />
          <KpiCard
            label="Adressekilder"
            value={addressCount}
            tone="success"
            icon={<Mail className="h-5 w-5" />}
            compare="Forretning og post"
          />
          <KpiCard
            label="Registrerte felt"
            value={registeredFields}
            tone="purple"
            icon={<FileText className="h-5 w-5" />}
            compare="Fra selskapsoppslaget"
          />
        </div>
      }
    >
      <CardGrid>
        <GridCol span={4}>
          <Card as="section" className="h-full">
            <CardHead eyebrow="Kontekst" heading="Selskapsprofil" />
            <CardContent className="space-y-3">
              <SummaryRow label="Navn" value={companySummary.name || 'Ikke registrert'} />
              <SummaryRow label="Org.nr" value={companySummary.orgNumber || 'Ikke registrert'} />
              <SummaryRow label="Type" value={companySummary.organizationType?.description || 'Ikke registrert'} />
              <SummaryRow label="Typekode" value={companySummary.organizationType?.code || 'Ikke registrert'} />
            </CardContent>
          </Card>
        </GridCol>

        <GridCol span={4}>
          <Panel title="Forretningsadresse" description="Registrert besøks- eller forretningsadresse for selskapet." tone="default" className="h-full">
            {businessAddressLines.length > 0 ? (
              <AddressBlock lines={businessAddressLines} />
            ) : (
              <Text as="p" variant="body-sm" className="text-text-secondary">
                Ingen forretningsadresse registrert.
              </Text>
            )}
          </Panel>
        </GridCol>

        <GridCol span={4}>
          <Panel title="Postadresse" description="Registrert postadresse for selskapet." tone="default" className="h-full">
            {postalAddressLines.length > 0 ? (
              <AddressBlock lines={postalAddressLines} />
            ) : (
              <Text as="p" variant="body-sm" className="text-text-secondary">
                Ingen postadresse registrert.
              </Text>
            )}
          </Panel>
        </GridCol>

        {dashboardMetrics ? (
          <>
            <GridCol span={6}>
              <Card as="section" className="h-full">
                <CardHead eyebrow="Kontakter" heading="Siste kontakter" />
                <CardContent className="space-y-2">
                  {dashboardMetrics.contacts.recentContacts.length > 0 ? (
                    dashboardMetrics.contacts.recentContacts.map((contact) => (
                      <RecentContactRow key={contact.contactId} contact={contact} />
                    ))
                  ) : (
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      Ingen nylig opprettede kontakter.
                    </Text>
                  )}
                </CardContent>
              </Card>
            </GridCol>

            <GridCol span={6}>
              <Card as="section" className="h-full">
                <CardHead eyebrow="Invitasjoner" heading="Siste invitasjoner" />
                <CardContent className="space-y-2">
                  {dashboardMetrics.invitations.recentInvites.length > 0 ? (
                    dashboardMetrics.invitations.recentInvites.map((invite) => (
                      <RecentInviteRow key={`${invite.email}-${invite.sentAt}`} invite={invite} />
                    ))
                  ) : (
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      Ingen nylig sendte invitasjoner.
                    </Text>
                  )}
                </CardContent>
              </Card>
            </GridCol>
          </>
        ) : null}
      </CardGrid>
    </CompanyPageTemplate>
  );
}

function RecentContactRow({ contact }: { contact: RecentContact }) {
  const name = [contact.givenName, contact.familyName].filter(Boolean).join(' ') || `Kontakt #${contact.contactId}`;

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Text as="p" variant="label">
            {name}
          </Text>
          <Text as="p" variant="caption" className="text-text-secondary">
            {contact.hasEmail ? 'E-post' : 'Ingen e-post'} · {contact.hasMobile ? 'Mobil' : 'Ingen mobil'}
          </Text>
        </div>
        <Text as="p" variant="caption" className="shrink-0 text-right text-text-secondary">
          {formatDashboardDateTime(contact.createdAt)}
        </Text>
      </div>
    </div>
  );
}

function RecentInviteRow({ invite }: { invite: RecentInvite }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Text as="p" variant="label">
            {invite.email}
          </Text>
          <Text as="p" variant="caption" className="text-text-secondary">
            Sendt {formatDashboardDateTime(invite.sentAt)} · Utløper {formatDashboardDateTime(invite.expiresAt)}
          </Text>
        </div>
        <Text as="p" variant="caption" className="shrink-0 text-right text-text-secondary">
          {invite.used ? 'Brukt' : 'Venter'}
        </Text>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <Text as="p" variant="body-sm" className="text-text-secondary">
        {label}
      </Text>
      <Text as="p" variant="body-sm" className="text-right font-medium text-text-primary">
        {value}
      </Text>
    </div>
  );
}

function AddressBlock({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2 rounded-md border border-border bg-background p-4">
      {lines.map((line) => (
        <Text key={line} as="p" variant="body-sm">
          {line}
        </Text>
      ))}
    </div>
  );
}

function formatAddressLines(address?: AddressDto | null) {
  if (!address) return [];

  const lines = [...(address.addressLines ?? [])];
  if (address.postalCode && address.city) {
    lines.push(`${address.postalCode} ${address.city}`);
  }
  if (address.country) {
    lines.push(address.country);
  }

  return lines.filter(Boolean);
}

function formatDashboardDate(date: Date) {
  return new Intl.DateTimeFormat('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatDashboardDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ukjent dato';

  return new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}
