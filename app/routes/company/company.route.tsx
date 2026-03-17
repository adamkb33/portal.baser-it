import { data, redirect } from 'react-router';
import { Building2, Mail, MapPin } from 'lucide-react';
import type { BrregEnhetResponse } from '~/api/brreg/types';
import { CompanyUserController, type AddressDto } from '~/api/generated/base';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { Route } from './+types/company.route';
import { CompanyEmptyState, CompanyMetricCard, CompanyPageTemplate, Panel, Text } from '~/ui';

export type CompanyIndexLoaderResponse = {
  brregResponse?: BrregEnhetResponse;
};

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuthPayloadFromRequest(request);

  if (!auth || !auth.companyId) {
    return redirect(ROUTES_MAP['user.company-context'].href);
  }

  const companSummaryResponse = await CompanyUserController.getCompanySummary();

  return data({
    companySummary: companSummaryResponse.data?.data,
  });
}

export default function CompanyIndex({ loaderData }: Route.ComponentProps) {
  const { companySummary } = loaderData;

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

  return (
    <CompanyPageTemplate
      title={companySummary.name || 'Selskap'}
      description="Grunnleggende selskapsinformasjon presentert med samme kompakte sideoppsett som resten av company-domenet."
      label="Selskapsoversikt"
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CompanyMetricCard
            label="Organisasjonsnummer"
            value={companySummary.orgNumber || '—'}
            icon={<Building2 className="h-5 w-5" />}
          />
          <CompanyMetricCard
            label="Organisasjonstype"
            value={companySummary.organizationType?.description || 'Ikke registrert'}
            icon={<MapPin className="h-5 w-5" />}
          />
          <CompanyMetricCard
            label="Adressekilder"
            value={[companySummary.businessAddress, companySummary.postalAddress].filter(Boolean).length}
            icon={<Mail className="h-5 w-5" />}
            meta="Forretningsadresse og postadresse"
          />
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Forretningsadresse"
          description="Registrert besøks- eller forretningsadresse for selskapet."
          tone="default"
        >
          {businessAddressLines.length > 0 ? (
            <AddressBlock lines={businessAddressLines} />
          ) : (
            <Text as="p" variant="body-sm" className="text-text-secondary">
              Ingen forretningsadresse registrert.
            </Text>
          )}
        </Panel>

        <Panel
          title="Postadresse"
          description="Registrert postadresse for selskapet."
          tone="default"
        >
          {postalAddressLines.length > 0 ? (
            <AddressBlock lines={postalAddressLines} />
          ) : (
            <Text as="p" variant="body-sm" className="text-text-secondary">
              Ingen postadresse registrert.
            </Text>
          )}
        </Panel>
      </div>
    </CompanyPageTemplate>
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
